import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { roles, storyFor } from '../shared/content.js';
export const normalize = (value) =>
  String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const fail = (message) => {
  throw new Error(message);
};
export function createRoom(story = 1, now = Date.now()) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join('');
  const s = storyFor(story);
  const deck = [...s.symbols, ...s.distractors, ...s.symbols, ...s.distractors];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return {
    code,
    hostToken: randomBytes(32).toString('hex'),
    story: s.id,
    createdAt: now,
    phase: 'lobby',
    players: [],
    startedAt: null,
    endedAt: null,
    clue: 0,
    clueAt: now,
    guided: [],
    found: [],
    translated: [],
    solved: [],
    deck,
    flipped: [],
    hideAt: null,
    attempts: 0,
    score: 0,
    phrase: [null, null, null, null],
  };
}
export function tick(room, now = Date.now()) {
  let changed = false;
  if (room.hideAt && now >= room.hideAt) {
    room.flipped = [];
    room.hideAt = null;
    changed = true;
  }
  if (['playing', 'phrase'].includes(room.phase) && now >= room.startedAt + 600000) {
    room.phase = 'lost';
    room.endedAt = room.startedAt + 600000;
    changed = true;
  }
  if (room.phase === 'playing' && now >= room.clueAt + 30000) {
    const steps = Math.floor((now - room.clueAt) / 30000);
    room.clue = (room.clue + steps) % 4;
    room.clueAt += steps * 30000;
    changed = true;
  }
  return changed;
}
export function joinRoom(room, data) {
  if (room.phase !== 'lobby') fail('La experiencia ya comenzó. Pide al museo una nueva sala.');
  if (room.players.length >= 4) fail('Esta sala ya tiene cuatro participantes.');
  const name = String(data.name ?? '').trim(),
    email = String(data.email ?? '').trim(),
    identification = String(data.identification ?? '').trim();
  if (name.length < 2 || name.length > 70 || !/^[\p{L}\p{M} '\-]+$/u.test(name))
    fail('Escribe tu nombre, sin números.');
  if (!/^\d{3,20}$/.test(identification))
    fail('El documento o código debe tener de 3 a 20 dígitos.');
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail('Escribe un correo válido.');
  if (!['Estudiante', 'Visitante'].includes(data.type) || data.consent !== true)
    fail('Selecciona tu tipo de visitante y acepta el tratamiento de datos.');
  if (room.players.some((p) => p.identification === identification))
    fail('Este documento ya está registrado en la sala. Vuelve a la pestaña donde ingresaste.');
  const player = {
    id: randomUUID(),
    token: randomBytes(32).toString('hex'),
    name,
    email,
    identification,
    type: data.type,
    consentAt: Date.now(),
    role: null,
    ready: false,
    finishedAt: null,
    feedback: null,
  };
  room.players.push(player);
  return player;
}
export function authorize(room, token) {
  if (token === room.hostToken) return { host: true };
  const player = room.players.find((p) => p.token === token);
  if (!player) fail('La sesión no es válida. Vuelve a ingresar a la sala.');
  return player;
}
function completed(room, now) {
  for (const [role, done] of [
    ['guia', room.guided.length === 4],
    ['huaquero', room.found.length === 4],
    ['interprete', room.translated.length === 4],
    ['antropologo', room.solved.length === 4],
  ]) {
    const p = room.players.find((p) => p.role === role);
    if (p && done && !p.finishedAt) p.finishedAt = now;
  }
  if (room.players.length === 4 && room.players.every((p) => p.finishedAt)) room.phase = 'phrase';
}
export function act(room, token, type, payload = {}, now = Date.now()) {
  tick(room, now);
  const actor = authorize(room, token),
    s = storyFor(room.story);
  const requireRole = (role) => {
    if (actor.role !== role) fail('Esta actividad corresponde a otro rol.');
  };
  if (type === 'role') {
    if (room.phase !== 'lobby' || actor.host) fail('No puedes cambiar el rol ahora.');
    if (!roles.some((r) => r.id === payload.role)) fail('Rol no válido.');
    if (room.players.some((p) => p.id !== actor.id && p.role === payload.role))
      fail('Alguien acaba de elegir este rol. Escoge otro.');
    actor.role = payload.role;
    actor.ready = false;
    return;
  }
  if (type === 'ready') {
    if (room.phase !== 'lobby' || !actor.role) fail('Primero elige tu rol.');
    actor.ready = true;
    return;
  }
  if (type === 'start') {
    if (!actor.host) fail('La pantalla del museo inicia la partida.');
    if (
      room.phase !== 'lobby' ||
      room.players.length !== 4 ||
      !room.players.every((p) => p.role && p.ready)
    )
      fail('Esperen a que los cuatro participantes estén listos.');
    room.phase = 'playing';
    room.startedAt = now;
    room.clueAt = now;
    return;
  }
  if (type === 'feedback') {
    if (actor.host || !['won', 'lost'].includes(room.phase))
      fail('La valoración se habilita al terminar.');
    if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5)
      fail('Elige una calificación de 1 a 5.');
    actor.feedback = {
      rating: payload.rating,
      comment: String(payload.comment ?? '').slice(0, 1500),
      at: now,
    };
    return;
  }
  if (type === 'placeWord' || type === 'resetPhrase') {
    if (room.phase !== 'phrase' || (!actor.host && actor.role !== 'antropologo'))
      fail('La frase final todavía no está disponible para ti.');
    if (type === 'resetPhrase') {
      room.phrase = [null, null, null, null];
      return;
    }
    const { index, word } = payload;
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > 3 ||
      (word !== null && !s.words.includes(word))
    )
      fail('Selecciona una palabra de la historia y un espacio válido.');
    room.phrase = room.phrase.map((value, i) =>
      i === index ? word : value === word ? null : value,
    );
    return;
  }
  if (type === 'phrase') {
    if (room.phase !== 'phrase' || (!actor.host && actor.role !== 'antropologo'))
      fail('La frase final todavía no está disponible para ti.');
    if (!Array.isArray(payload.words) || payload.words.length !== 4)
      fail('Completa los cuatro espacios.');
    room.attempts++;
    if (!payload.words.every((w, i) => normalize(w) === s.words[i])) {
      room.score = Math.max(0, room.score - 10);
      fail('La frase es incorrecta, inténtalo nuevamente.');
    }
    room.phrase = payload.words;
    room.phase = 'won';
    room.endedAt = now;
    room.score += 200 + Math.floor((600000 - (now - room.startedAt)) / 1000);
    return;
  }
  if (room.phase !== 'playing')
    fail(
      room.phase === 'lost'
        ? 'El tiempo se terminó.'
        : 'Esta actividad no está disponible en este momento.',
    );
  if (type === 'guide') {
    requireRole('guia');
    if (!room.guided.includes(room.clue)) {
      room.guided.push(room.clue);
      room.score += 25;
    }
    room.clue = (room.clue + 1) % 4;
    room.clueAt = now;
  } else if (type === 'find') {
    requireRole('huaquero');
    const id = Number(payload.symbol);
    if (!s.symbols.includes(id)) {
      room.score = Math.max(0, room.score - 5);
      fail('Ese símbolo no corresponde a esta historia. Consulta al Guía.');
    }
    if (!room.found.includes(id)) {
      room.found.push(id);
      room.score += 50;
    }
  } else if (type === 'flip') {
    requireRole('interprete');
    const index = payload.index;
    if (!Number.isInteger(index) || index < 0 || index >= room.deck.length)
      fail('Carta no válida.');
    if (room.hideAt || room.flipped.includes(index) || room.translated.includes(room.deck[index]))
      return;
    room.flipped.push(index);
    if (room.flipped.length === 2) {
      const [a, b] = room.flipped.map((i) => room.deck[i]);
      if (a === b && room.found.includes(a)) {
        room.translated.push(a);
        room.flipped = [];
        room.score += 75;
      } else {
        room.hideAt = now + 1200;
        room.score = Math.max(0, room.score - 2);
      }
    }
  } else if (type === 'solve') {
    requireRole('antropologo');
    const index = payload.index;
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > 3 ||
      !room.translated.includes(s.symbols[index])
    )
      fail('El Intérprete debe revelar primero este anagrama.');
    if (normalize(payload.answer) !== s.answers[index])
      fail('La palabra aún no es correcta. Reordena las letras del anagrama.');
    if (!room.solved.includes(index)) {
      room.solved.push(index);
      room.score += 100;
    }
  } else fail('Acción desconocida.');
  completed(room, now);
}
export function view(room, token, now = Date.now()) {
  const actor = authorize(room, token),
    s = storyFor(room.story);
  return {
    code: room.code,
    story: room.story,
    phase: room.phase,
    startedAt: room.startedAt,
    endedAt: room.endedAt,
    serverNow: now,
    clue: room.clue,
    clueAt: room.clueAt,
    guided: room.guided,
    found: room.found,
    translated: room.translated,
    solved: room.solved,
    score: room.score,
    attempts: room.attempts,
    phrase: room.phrase,
    me: actor.host
      ? { host: true }
      : { id: actor.id, role: actor.role, ready: actor.ready, feedback: actor.feedback },
    players: room.players.map(({ id, name, role, ready, finishedAt }) => ({
      id,
      name,
      role,
      ready,
      finishedAt,
    })),
    deck:
      actor.role === 'interprete'
        ? room.deck.map((symbol, i) => ({
            index: i,
            symbol: room.flipped.includes(i) || room.translated.includes(symbol) ? symbol : null,
            matched: room.translated.includes(symbol),
          }))
        : [],
    anagrams: s.anagrams.map((word, i) => (room.translated.includes(s.symbols[i]) ? word : null)),
    words: room.phase === 'phrase' || room.phase === 'won' ? s.words : [],
  };
}
