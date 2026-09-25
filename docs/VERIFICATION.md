# Verificación de entrega

Fecha de la sesión: 24 de septiembre de 2026.

| Comprobación | Resultado |
| --- | --- |
| `npm test` | 11 pruebas aprobadas: registro, roles exclusivos, autorización, privacidad de vistas, memoria, temporizador y recorrido completo para cada una de las cinco historias |
| `npm run test:e2e` | 3 pruebas aprobadas en Microsoft Edge |
| Partida completa | Pantalla compartida + cuatro contextos independientes de navegador; registro, selección de roles, espera, inicio, guía, hallazgos, pares, traducciones, anagramas, frase, resultado, valoración y clasificación |
| Recuperación y sincronización | Recarga de pantalla conserva la sala y palabras colocadas; frase colocada en museo aparece en el dispositivo del Antropólogo |
| Medios originales | Metadatos y duración válidos de los 9 videos, 4 narraciones y 2 sonidos de acierto/error utilizados |
| Responsive | Portada a 390 px y escritorio; sin desbordamiento horizontal en las vistas finales de los cuatro participantes |
| Accesibilidad automatizada | Axe WCAG 2 A/AA y 2.1 AA: cero infracciones detectadas en la portada a 1440 y 390 px; no es una certificación de todas las pantallas o medios |
| `npm run build` | Aprobado; bundle de aplicación de unos 382 kB, 121 kB gzip |
| Producción local | `npm start`, página y `/api/health` responden 200 en el puerto 4173 |
| Datos privados | `/data/rooms.json` y documentos de auditoría no son servidos por HTTP; prueba de denegación 403 |
| Clasificación inicial | Vacía; las partidas de prueba se guardan separadas en `data/tests/` y las de la primera ronda quedaron archivadas en `data/initial-test-history.json` |
| Dependencias | Instalación independiente, auditoría de npm con cero vulnerabilidades reportadas al instalar |
| Proyecto original | 50.540 archivos inventariados; `changed: []`; no se leyeron contenidos de `.env` |

La compilación emite avisos no bloqueantes de las dependencias React Router/Lucide por directivas `use client` en una aplicación cliente Vite. No se detectaron excepciones JavaScript en el recorrido automatizado.

Evidencias: `browser-results.json`, `accessibility.json`, `original-before.json`, `original-verification.json`, `redesign-desktop.png`, `redesign-mobile.png`, `game-guide-mobile.png`, `game-translator-mobile.png` y `game-final-phrase.png`.

La prueba con cuatro sesiones usa navegadores en este ordenador, no cuatro teléfonos físicos. No se probó reconocimiento de esculturas porque no existe tal detector en el original, ni integración con la base de producción. La cámara necesita hardware, permisos y contexto HTTPS/localhost; los recursos audiovisuales carecen de subtítulos originales recuperables. Consulta `EXPERIENCE-AUDIT.md` para los archivos necesarios si se desean esas ampliaciones.
