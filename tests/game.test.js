import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, joinRoom, act, tick, view } from '../server/game.js';
import { roles, stories } from '../shared/content.js';
const start = 1000000;
function team(story = 1) {
  const room = createRoom(story, start);
  const players = roles.map((role, i) => {
    const p = joinRoom(room, {
      name: 'Viajero ' + ['Uno', 'Dos', 'Tres', 'Cuatro'][i],
      email: `persona${i}@ejemplo.edu.co`,
      identification: String(1000 + i),
      type: 'Visitante',
      consent: true,
    });
    act(room, p.token, 'role', { role: role.id }, start);
    act(room, p.token, 'ready', {}, start);
    return p;
  });
  return { room, players };
}
function launch(story) {
  const data = team(story);
  act(data.room, data.room.hostToken, 'start', {}, start);
  return data;
}
test('registration accepts accented names and academic email; rejects invalid data and fifth user', () => {
  const r = createRoom();
  assert.throws(
    () =>
      joinRoom(r, {
        name: 'Ángela',
        identification: '123',
        email: 'bad',
        type: 'Visitante',
        consent: true,
      }),
    /correo/,
  );
  const p = joinRoom(r, {
    name: 'Ángela Muñoz',
    identification: '123',
    email: 'a@uao.edu.co',
    type: 'Estudiante',
    consent: true,
  });
  assert.equal(p.name, 'Ángela Muñoz');
  const { room } = team();
  assert.throws(() => joinRoom(room, {}), /cuatro/);
});
test('roles are exclusive and the game cannot start before all four are ready', () => {
  const { room, players } = team();
  assert.throws(() => act(room, players[1].token, 'role', { role: 'guia' }, start), /elegir/);
  players[0].ready = false;
  assert.throws(() => act(room, room.hostToken, 'start', {}, start), /listos/);
  assert.throws(() => act(room, players[0].token, 'start', {}, start), /museo/);
});
test('state never exposes credentials, documents, email or hidden memory symbols', () => {
  const { room, players } = launch();
  const data = view(room, players[2].token, start);
  assert.equal(data.deck.length, 16);
  assert.ok(data.deck.every((c) => c.symbol === null));
  assert.ok(!JSON.stringify(data).includes(players[0].token));
  assert.ok(!JSON.stringify(data).includes(players[0].email));
  assert.equal(data.players[0].identification, undefined);
  assert.throws(() => view(room, 'invalid'), /sesión/);
});
test('role boundaries, locked anagrams and premature final phrase are enforced on server', () => {
  const { room, players } = launch();
  assert.throws(() => act(room, players[0].token, 'find', { symbol: 1 }, start), /otro rol/);
  assert.throws(
    () => act(room, players[3].token, 'solve', { index: 0, answer: 'rituales' }, start),
    /primero/,
  );
  assert.throws(
    () => act(room, room.hostToken, 'phrase', { words: stories[0].words }, start),
    /disponible/,
  );
});
test('memory ignores double taps and cannot translate symbols not yet found', () => {
  const { room, players } = launch();
  const pair = room.deck.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0);
  act(room, players[2].token, 'flip', { index: pair[0] }, start);
  act(room, players[2].token, 'flip', { index: pair[0] }, start);
  assert.equal(room.flipped.length, 1);
  act(room, players[2].token, 'flip', { index: pair[1] }, start);
  assert.equal(room.translated.length, 0);
  assert.equal(room.hideAt, start + 1200);
  tick(room, start + 1200);
  assert.deepEqual(room.flipped, []);
});
test('timer rotates clues, expires authoritatively, and remains expired after serialization', () => {
  const { room, players } = launch();
  tick(room, start + 31000);
  assert.equal(room.clue, 1);
  tick(room, start + 600000);
  assert.equal(room.phase, 'lost');
  assert.throws(
    () => act(room, players[1].token, 'find', { symbol: 1 }, start + 600001),
    /terminó/,
  );
  const restored = JSON.parse(JSON.stringify(room));
  tick(restored, start + 700000);
  assert.equal(restored.endedAt, start + 600000);
});
for (const story of stories)
  test(`complete cooperative journey: ${story.name}, wrong phrase, win, feedback and recovery`, () => {
    const { room, players } = launch(story.id);
    let now = start + 1000;
    for (let i = 0; i < 4; i++) {
      act(room, players[0].token, 'guide', {}, now++);
      act(room, players[1].token, 'find', { symbol: story.symbols[i] }, now++);
      const pair = room.deck.map((v, j) => (v === story.symbols[i] ? j : -1)).filter((j) => j >= 0);
      for (const index of pair) act(room, players[2].token, 'flip', { index }, now++);
      act(
        room,
        players[3].token,
        'solve',
        { index: i, answer: ' ' + story.answers[i].toUpperCase() + ' ' },
        now++,
      );
    }
    assert.equal(room.phase, 'phrase');
    assert.ok(room.players.every((p) => p.finishedAt));
    assert.throws(
      () => act(room, players[0].token, 'placeWord', { word: story.words[0], index: 0 }, now++),
      /disponible/,
    );
    act(room, room.hostToken, 'placeWord', { word: story.words[0], index: 0 }, now++);
    assert.equal(
      view(JSON.parse(JSON.stringify(room)), players[3].token, now).phrase[0],
      story.words[0],
    );
    act(room, players[3].token, 'placeWord', { word: story.words[0], index: 1 }, now++);
    assert.equal(room.phrase[0], null);
    act(room, room.hostToken, 'resetPhrase', {}, now++);
    assert.deepEqual(room.phrase, [null, null, null, null]);
    assert.throws(
      () => act(room, room.hostToken, 'phrase', { words: [...story.words].reverse() }, now++),
      /incorrecta/,
    );
    assert.equal(room.phase, 'phrase');
    act(room, room.hostToken, 'phrase', { words: story.words }, now++);
    assert.equal(room.phase, 'won');
    const score = room.score;
    assert.throws(
      () => act(room, players[1].token, 'find', { symbol: story.symbols[0] }, now++),
      /disponible/,
    );
    assert.equal(room.score, score);
    act(room, players[0].token, 'feedback', { rating: 5, comment: 'Aprendimos juntos' }, now++);
    const restored = JSON.parse(JSON.stringify(room));
    assert.equal(view(restored, players[0].token, now).me.feedback.rating, 5);
    assert.ok(restored.score > 0);
  });
