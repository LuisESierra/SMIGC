import { test, expect } from '@playwright/test';
const roles = [
  ['guia', 'Guía'],
  ['huaquero', 'Huaquero'],
  ['interprete', 'Intérprete'],
  ['antropologo', 'Antropólogo'],
];
test('desktop and mobile entry, help, validation and layout', async ({ page, browser }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /El pasado tiene/ })).toBeVisible();
  await page.screenshot({ path: 'docs/redesign-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Cómo jugar' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Código de la sala').fill('0000');
  await page.getByRole('button', { name: 'Unirme a la experiencia' }).click();
  await expect(page.getByRole('alert')).toContainText('No encontramos');
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto('/');
  await expect(mobile.getByRole('button', { name: 'Unirme a la experiencia' })).toBeVisible();
  expect(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await mobile.screenshot({ path: 'docs/redesign-mobile.png', fullPage: true });
  await mobile.close();
  expect(errors).toEqual([]);
});
test('host and four independent browsers complete the original cooperative flow', async ({
  browser,
}) => {
  const errors = [];
  const host = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  host.on('pageerror', (e) => errors.push(e.message));
  await host.goto('/#/museo');
  await host.locator('.brand').click();
  await expect(host).toHaveURL(/#\/museo$/);
  await host.getByRole('button', { name: 'Crear sala y comenzar' }).click();
  await expect(host.getByRole('heading', { name: 'Inducción', exact: true })).toBeVisible();
  await host.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(host.getByRole('heading', { name: 'Un viaje a nuestras memorias' })).toBeVisible();
  await host.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(host.locator('.room-code-display')).toBeVisible();
  await expect(host.getByRole('link', { name: 'Presentar la historia' })).toHaveCount(0);
  const code = await host.locator('.room-code-display').innerText();
  await host.reload();
  await expect(host.locator('.room-code-display')).toHaveText(code);
  await host.locator('.brand').click();
  await expect(host).toHaveURL(/#\/museo$/);
  await expect(host.getByRole('link', { name: `Retomar sala ${code}` })).toBeVisible();
  await host.goto('/#/qrMuseo');
  await expect(host.locator('.room-code-display')).toHaveText(code);
  const players = [];
  for (let i = 0; i < 4; i++) {
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('/');
    await p.getByLabel('Código de la sala').fill(code);
    await p.getByRole('button', { name: 'Unirme a la experiencia' }).click();
    await p
      .getByLabel('Nombre completo')
      .fill(['Ángela Muñoz', 'Carlos Ruiz', 'María Pérez', 'José Díaz'][i]);
    await p.getByLabel('D.I. o código estudiantil').fill(String(9010 + i));
    await p.getByLabel('Correo electrónico').fill(`viajero${i}@ejemplo.edu.co`);
    await p.getByLabel('Visitante', { exact: true }).check();
    await p.getByRole('checkbox').check();
    await p.getByRole('button', { name: 'Escoger mi rol' }).click();
    if (i < 3) {
      await expect(host.getByText(`${i + 1} de 4 participantes conectados`)).toBeVisible();
      await expect(host).toHaveURL(/#\/qrMuseo$/);
    } else {
      // Advance on the fourth registration, before that participant chooses a role or is ready.
      await expect(host).toHaveURL(/#\/tematicaMuseo$/);
      await expect(
        host.getByRole('heading', { name: 'Cuencos rituales', exact: true }),
      ).toBeVisible();
    }
    await p.getByRole('button', { name: 'Elegir ' + roles[i][1], exact: true }).click();
    await p.getByRole('button', { name: 'Estoy listo' }).click();
    await expect(p.getByText('Esperando al museo', { exact: true })).toBeVisible();
    if (i === 0) {
      await p.locator('.brand').click();
      await expect(p).toHaveURL(/#\/$/);
      await p.getByRole('link', { name: `Retomar mi sala ${code}` }).click();
      await expect(p.getByText('Esperando al museo', { exact: true })).toBeVisible();
    }
    players.push(p);
  }
  await expect(host).toHaveURL(/#\/tematicaMuseo$/);
  await host.getByRole('button', { name: 'Continuar', exact: true }).click();
  await host.getByRole('link', { name: 'Ver el equipo' }).click();
  await expect(host.getByRole('button', { name: 'Iniciar misión' })).toBeEnabled();
  await host.getByRole('button', { name: 'Iniciar misión' }).click();
  const [guide, hunter, interpreter, anthropologist] = players;
  await expect(guide.getByRole('heading', { name: 'Explora el mapa' })).toBeVisible();
  await guide.screenshot({ path: 'docs/game-guide-mobile.png', fullPage: true });
  for (let i = 0; i < 4; i++) {
    await guide.getByRole('button', { name: 'Buscar otro símbolo' }).click();
    await guide.waitForTimeout(150);
  }
  await hunter.getByRole('button', { name: 'Símbolo 9', exact: true }).click();
  await expect(hunter.getByRole('alert')).toContainText('no corresponde');
  for (let n = 1; n <= 4; n++) {
    await hunter.getByRole('button', { name: `Símbolo ${n}`, exact: true }).click();
    await hunter.waitForTimeout(150);
  }
  await expect(
    interpreter.getByRole('heading', { name: 'La memoria de los símbolos' }),
  ).toBeVisible();
  const seen = {};
  // Read the shuffled board through visible flips, as a player would. No server or database access.
  for (let i = 0; i < 16; i += 2) {
    for (const index of [i, i + 1]) {
      await interpreter.locator(`[data-card="${index}"]`).click();
      await interpreter.waitForTimeout(180);
      const alt = await interpreter.locator(`[data-card="${index}"] img`).getAttribute('alt');
      const symbol = Number(alt.match(/\d+/)[0]);
      (seen[symbol] ??= []).push(index);
    }
    await interpreter.waitForTimeout(1250);
  }
  for (let symbol = 1; symbol <= 4; symbol++) {
    for (const index of seen[symbol]) {
      const card = interpreter.locator(`[data-card="${index}"]`);
      if (await card.isEnabled()) {
        await card.click();
        await interpreter.waitForTimeout(170);
      }
    }
  }
  await interpreter.getByRole('button', { name: /Traductor/ }).click();
  await expect(interpreter.getByText('tuariles', { exact: true })).toBeVisible();
  await interpreter.screenshot({ path: 'docs/game-translator-mobile.png', fullPage: true });
  const answers = ['rituales', 'arte', 'alfareros', 'tiempo'];
  for (let i = 0; i < 4; i++) {
    const form = anthropologist.locator('.anagram-card').nth(i);
    await form.getByRole('textbox').fill(answers[i]);
    await form.getByRole('button', { name: 'Comprobar', exact: true }).click();
    await anthropologist.waitForTimeout(160);
  }
  await expect(host.getByRole('heading', { name: 'Completa la frase.' })).toBeVisible();
  await host.reload();
  await expect(host.getByRole('heading', { name: 'Completa la frase.' })).toBeVisible();
  await host.screenshot({ path: 'docs/game-final-phrase.png', fullPage: true });
  for (let i = 0; i < 4; i++) {
    await host.getByRole('button', { name: answers[i], exact: true }).click();
    await host.getByRole('button', { name: `Espacio ${i + 1}`, exact: true }).click();
    await expect(
      anthropologist.getByRole('button', { name: `Espacio ${i + 1}: ${answers[i]}`, exact: true }),
    ).toBeVisible();
    if (i === 0) {
      await host.reload();
      await expect(
        host.getByRole('button', { name: 'Espacio 1: rituales', exact: true }),
      ).toBeVisible();
    }
  }
  await host.getByRole('button', { name: 'Comprobar la historia' }).click();
  await expect(host.getByRole('heading', { name: '¡La memoria sigue viva!' })).toBeVisible();
  await expect(guide.getByRole('heading', { name: '¡La memoria sigue viva!' })).toBeVisible();
  await guide.getByRole('button', { name: '5 estrellas', exact: true }).click();
  await guide.getByLabel('Deja un comentario').fill('Una historia recuperada en equipo.');
  await guide.getByRole('button', { name: 'Enviar valoración' }).click();
  await expect(
    guide.getByRole('heading', { name: 'Gracias por compartir tu experiencia.' }),
  ).toBeVisible();
  await host.getByRole('link', { name: 'Tiempo del recorrido', exact: true }).click();
  await expect(host.locator('tbody tr')).toHaveCount(4);
  await host.getByRole('link', { name: 'Ver mejores tiempos' }).click();
  await expect(host.getByRole('cell', { name: code, exact: true })).toBeVisible();
  for (const p of players) {
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await p.close();
  }
  await host.close();
  expect(errors).toEqual([]);
});

test('original media loads and runtime data is private', async ({ page, request }) => {
  expect((await request.get('/data/rooms.json')).status()).toBe(403);
  expect((await request.get('/docs/original-before.json')).status()).toBe(403);
  await page.goto('/');
  const media = [
    'induccion/resources/induccion.mp4',
    'AnimacionMuseo/resources/Contextualizacin.mp4',
    'TematicaMuseo/resources/Cuencos1.mp4',
    'TematicaMuseo2/resources/Cuencos2.mp4',
    ...['Cuencos', 'Alcarrazas', 'Volantes', 'Urnas', 'Silbatos'].map(
      (n) => `FraseMuseo/videosSemanas/${n}_1.mp4`,
    ),
    ...['Guia', 'Huaquero', 'Interprete', 'Antro'].map(
      (n) => `RolesMuseo/resources/Narracion${n}.mp3`,
    ),
    'Bloqueo/audio/sonidoCorrecto.mp3',
    'Bloqueo/audio/sonidoIncorrecto.mp3',
  ];
  for (const path of media) {
    const duration = await page.evaluate(
      (path) =>
        new Promise((resolve, reject) => {
          const media = document.createElement(path.endsWith('.mp4') ? 'video' : 'audio');
          const timer = setTimeout(() => reject(new Error('Timeout: ' + path)), 10000);
          media.preload = 'metadata';
          media.onloadedmetadata = () => {
            clearTimeout(timer);
            resolve(media.duration);
            media.removeAttribute('src');
            media.load();
          };
          media.onerror = () => {
            clearTimeout(timer);
            reject(new Error('Media inválido: ' + path));
          };
          media.src = '/assets/original/' + path;
        }),
      path,
    );
    expect(duration).toBeGreaterThan(0);
  }
});
