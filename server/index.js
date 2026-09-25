import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoom, joinRoom, act, view, tick, authorize } from './game.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testMode = process.argv.includes('--test');
const dataDir = resolve(root, testMode ? 'data/tests' : 'data');
mkdirSync(dataDir, { recursive: true });
const db = resolve(dataDir, 'rooms.json');
const rooms = new Map(
  existsSync(db) ? JSON.parse(readFileSync(db, 'utf8')).map((r) => [r.code, r]) : [],
);
const save = () => {
  writeFileSync(db + '.tmp', JSON.stringify([...rooms.values()]));
  renameSync(db + '.tmp', db);
};
const app = express(),
  http = createServer(app),
  io = new Server(http, { maxHttpBufferSize: 10000 });
app.disable('x-powered-by');
// Private runtime data and audit files must not be served by Vite in development either.
app.use((req, res, next) => {
  if (/^\/(data|docs|tools|tests|\.cache)(\/|$)/i.test(req.path))
    return res.status(403).json({ error: 'Recurso privado.' });
  next();
});
app.use(express.json({ limit: '12kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store');
  next();
});
const limits = new Map();
app.use('/api', (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  let l = limits.get(key);
  if (!l || now - l.at > 60000) {
    l = { at: now, count: 0 };
    limits.set(key, l);
  }
  if (++l.count > 150)
    return res.status(429).json({ error: 'Demasiadas solicitudes. Espera un minuto.' });
  next();
});
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of limits) if (now - v.at > 60000) limits.delete(k);
}, 60000).unref();
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.post('/api/rooms', (req, res) => {
  let room;
  do {
    room = createRoom(req.body.story);
  } while (rooms.has(room.code));
  rooms.set(room.code, room);
  save();
  res.json({ code: room.code, token: room.hostToken, host: true });
});
app.get('/api/rooms/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room)
    return res
      .status(404)
      .json({ error: 'No encontramos esa sala. Revisa los cuatro caracteres.' });
  res.json({ code: room.code, story: room.story, phase: room.phase, count: room.players.length });
});
app.post('/api/rooms/:code/join', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'La sala no existe.' });
  try {
    const player = joinRoom(room, req.body);
    save();
    broadcast(room);
    res.json({ code: room.code, token: player.token, host: false });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get('/api/leaderboard', (req, res) =>
  res.json(
    [...rooms.values()]
      .filter((r) => r.phase === 'won')
      .sort((a, b) => a.endedAt - a.startedAt - (b.endedAt - b.startedAt))
      .slice(0, 20)
      .map((r) => ({
        code: r.code,
        story: r.story,
        seconds: Math.round((r.endedAt - r.startedAt) / 1000),
        score: r.score,
      })),
  ),
);
function broadcast(room) {
  for (const socket of io.sockets.sockets.values())
    if (socket.data.code === room.code) socket.emit('state', view(room, socket.data.token));
}
io.on('connection', (socket) => {
  socket.on('subscribe', ({ code, token } = {}, ack = () => {}) => {
    try {
      const room = rooms.get(code);
      if (!room) throw new Error('La sala ya no existe.');
      authorize(room, token);
      socket.data = { code, token, last: 0 };
      tick(room);
      ack({ ok: true });
      socket.emit('state', view(room, token));
    } catch (e) {
      ack({ error: e.message });
    }
  });
  socket.on('action', ({ type, payload } = {}, ack = () => {}) => {
    const room = rooms.get(socket.data.code);
    if (!room) return ack({ error: 'Conecta primero con tu sala.' });
    const now = Date.now();
    if (now - (socket.data.windowAt || 0) > 1000) {
      socket.data.windowAt = now;
      socket.data.count = 0;
    }
    if (++socket.data.count > 30)
      return ack({ error: 'Demasiadas acciones. Espera un instante antes de continuar.' });
    try {
      act(room, socket.data.token, type, payload);
      save();
      broadcast(room);
      ack({ ok: true });
    } catch (e) {
      save();
      broadcast(room);
      ack({ error: e.message });
    }
  });
});
setInterval(() => {
  let changed = false;
  for (const room of rooms.values()) {
    if (tick(room)) {
      broadcast(room);
      changed = true;
    }
  }
  if (changed) save();
}, 500).unref();
if (process.argv.includes('--production')) {
  app.use(express.static(resolve(root, 'dist')));
  app.get('/{*path}', (req, res) => res.sendFile(resolve(root, 'dist/index.html')));
} else {
  const { createServer: createVite } = await import('vite');
  const vite = await createVite({
    root,
    server: { middlewareMode: true, ...(testMode ? { ws: { port: 24679 } } : {}) },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT) || (testMode ? 4175 : 4173);
http.listen(port, '0.0.0.0', () =>
  console.log(`SMIGC: http://localhost:${port} · Datos: ${dataDir}`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    save();
    http.close();
    process.exit(0);
  });
