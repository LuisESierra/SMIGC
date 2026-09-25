# Museo Interactivo Lilí · SMIGC

Recreación nueva e independiente de la experiencia colaborativa de SMIGC. Conserva cuatro participantes, sala compartida, roles, mapa, búsqueda de símbolos, memoria, traducciones, anagramas, frase final, videos, resultados y valoración. Interfaz inspirada en el sitio oficial del Museo Lilí, con colores y recursos verificados.

## Ejecutar

Requiere Node.js 22.12+ o 24 (verificado con 24.21.0). Las dependencias ya están instaladas en esta carpeta.

```powershell
cd D:\Projects\SMIGC-redesign
npm run dev
```

Abre **http://localhost:4173**. Un solo proceso sirve interfaz, API y conexión en tiempo real. No se necesita MongoDB, `.env`, una cuenta externa ni secretos.

Para instalar desde otra copia: `npm ci`. La caché de npm se configura dentro del proyecto mediante `.npmrc`.

Repositorio: https://github.com/LuisESierra/SMIGC

```powershell
git clone https://github.com/LuisESierra/SMIGC.git
cd SMIGC
npm ci
npm run dev
```

Ejecuta el clonado desde una carpeta que no contenga el proyecto original. Los datos de salas, dependencias, compilaciones, configuración local del editor y el inventario privado del original están excluidos del repositorio. `verify:original` requiere el inventario local de la sesión de reconstrucción; no está disponible en un clon nuevo.

Para producción local:

```powershell
npm run build
npm start
```

Detén primero el servidor de desarrollo para liberar el puerto. Otro puerto: `$env:PORT=4174; npm start`.

## Jugar con cuatro personas

1. En la pantalla compartida abre **Pantalla del museo** (`/#/museo`), selecciona una historia y crea una sala.
2. Reproduce la inducción y contextualización; **Continuar** permite avanzar manualmente. Aparecen QR, enlace y código de cuatro caracteres.
3. Cada participante entra desde su propio navegador/dispositivo. En un mismo equipo, usa cuatro pestañas independientes, sin duplicar una pestaña ya registrada. Cada pestaña conserva su propia sesión.
4. Ingresa el código, completa el registro, selecciona un rol libre, revisa su misión y pulsa **Estoy listo**.
5. Cuando se registra el cuarto participante, la pantalla del museo avanza automáticamente del QR a la temática. Presenta la historia y los roles. En **Ver el equipo**, inicia cuando los cuatro estén listos.
6. El Guía comunica ubicaciones y avanza con la lupa; el Huaquero selecciona los cuatro signos correctos; el Intérprete encuentra sus pares; el Antropólogo resuelve las palabras desbloqueadas.
7. Al completar todos los roles, ordenen la frase final desde la pantalla del museo o el dispositivo del Antropólogo. La colocación se comparte en tiempo real y admite arrastre, teclado o toques.
8. Consulten insignias, videos de cierre, tiempos reales y mejores partidas. Cada participante puede enviar su valoración.

Hay **10 minutos** desde el inicio de la misión y pistas del mapa de **30 segundos**. Recargar o perder conexión no reinicia el reloj. Los datos se recuperan al reconectar con la misma sesión. Para volver a jugar se crea una sala nueva.

El nombre del producto en la cabecera es **Museo Interactivo Lilí**. Al pulsarlo, la pantalla fija vuelve a su inicio (`/#/museo`) y los participantes vuelven a su entrada (`/#/`). La navegación conserva la sesión y permite retomar la sala.

## Conectar celulares

El servidor escucha en `0.0.0.0:4173`. Conecta el ordenador y los celulares a la misma red. Consulta la IPv4 del ordenador con `ipconfig` y abre, por ejemplo, `http://192.168.1.20:4173` desde los móviles. En la pantalla QR, **Conectar otros dispositivos** permite introducir esa dirección para generar un enlace correcto. `localhost` en un celular apunta al propio celular.

Si el firewall de Windows bloquea conexiones, autoriza Node en la red privada desde la configuración local de Windows. No se modificó el firewall automáticamente. La cámara requiere `localhost` o HTTPS y permiso del navegador: en móviles con HTTP de red local el tablero sigue funcionando, pero para usar cámara se necesita servir la aplicación mediante HTTPS. La cámara no reconoce esculturas automáticamente; el original tampoco incluía ese detector.

## Estructura

- `src/`: nueva interfaz React y estilos responsivos.
- `shared/content.js`: roles, cinco historias, anagramas y frases recuperadas.
- `server/game.js`: reglas, validaciones, transiciones y vistas por jugador.
- `server/index.js`: Express, Socket.IO y persistencia.
- `public/assets/original/`: 207 medios copiados del SMIGC de referencia.
- `public/assets/museum/`: recursos oficiales descargados y fuentes locales.
- `data/rooms.json`: salas, registros y valoraciones de esta instalación; se crea al usar el servidor.
- `tests/`: reglas y recorrido real de cinco navegadores.
- `docs/`: inventarios, fuentes visuales, capturas y verificaciones.

Los datos locales incluyen información personal introducida en el registro. `data/` está excluido de Git y no es una carpeta pública. No compartas ese archivo ni los tokens de sesión. La clasificación pública solo expone código de sala, temática, tiempo y puntos. Esta versión está preparada para una instalación local con un proceso; una publicación institucional requiere decidir alojamiento, HTTPS y administración del almacenamiento y acceso.

## Comprobaciones

```powershell
npm test
npm run test:e2e
npm run build
npm run verify:original
```

Las pruebas de navegador usan Microsoft Edge instalado y un servidor separado en el puerto 4175, con datos ficticios guardados en `data/tests/`. No llenan la clasificación normal. Para ejecutarlas con Chromium en otro sistema, cambia `channel: 'msedge'` en `playwright.config.js` y configura el navegador local. `node tools/check-accessibility.mjs` comprueba accesibilidad automatizada de la portada de escritorio/móvil; no sustituye una auditoría manual completa.

## Documentación y límites

- [Auditoría funcional, rutas y correcciones](docs/EXPERIENCE-AUDIT.md).
- [Guía visual y procedencia de recursos](docs/VISUAL-GUIDE.md).
- [Comprobación del original](docs/original-verification.json).
- [Resultados del navegador](docs/browser-results.json).
- [Resumen de verificaciones y límites de las pruebas](docs/VERIFICATION.md).

No se accedió a MongoDB ni a usuarios históricos, no se copió `.env`, no se utilizó la API Railway anterior y no se reutilizó su `node_modules`. Para recuperar datos históricos, proporciona una exportación anonimizada en esta carpeta o configura localmente una base separada mediante una integración futura; no pegues credenciales en el chat.

Para añadir reconocimiento real de piezas hacen falta imágenes/marcadores y su correspondencia con símbolos. Para subtitular todos los videos hacen falta transcripciones o `.vtt` revisados. Ambas limitaciones y los archivos necesarios se detallan en la auditoría. La experiencia completa del tablero funciona sin esos recursos adicionales.
