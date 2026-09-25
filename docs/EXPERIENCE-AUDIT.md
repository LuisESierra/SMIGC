# Auditoría de la experiencia SMIGC

Original identificado: `D:\Projects\SMIGC`. Recreación: `D:\Projects\SMIGC-redesign`.

El original se inspeccionó como referencia de solo lectura, sin ejecutar su aplicación, instalar paquetes ni leer `.env`. No había carpeta de destino al comenzar. El inventario inicial está en `original-before.json`; se registró tamaño y fecha de modificación de todos los archivos y SHA-256 de código y recursos. `.env*`, dependencias, logs y metadatos Git solo se inventariaron por nombre/tamaño/fecha, sin leer su contenido. La comprobación final está en `original-verification.json`.

## Producto y recorrido recuperado

Experiencia colaborativa y gamificada del Museo Lilí, con cuatro personas que rescatan una historia de los pueblos amerindios. Tiene dos recorridos coordinados:

- Pantalla compartida: bienvenida → inducción → contextualización → QR/código de sala → video temático → presentación narrada de roles → equipo listo → juego y cronómetro → frase final → insignias → video final → tiempos y clasificación.
- Participantes: código de cuatro caracteres → registro y consentimiento → elección exclusiva del rol → instrucciones y animación → confirmación → espera → actividad individual con dependencias entre roles → resultado → valoración y comentario.

La nueva implementación sigue esos recorridos. La pantalla compartida crea una sala independiente, elige la temática y comienza los 10 minutos cuando los cuatro jugadores están listos. Las partidas simultáneas están separadas y sus códigos no se rotan durante una misión.

## Pantallas y rutas

Se conservan los nombres de las rutas HashRouter del original. Las pantallas de estado que estaban repetidas se implementan mediante componentes nuevos compartidos.

| Ruta | Experiencia reconstruida |
| --- | --- |
| `/` | Entrada con código, ayuda y acceso a pantalla del museo |
| `/registro` | Nueva ruta explícita para el formulario que originalmente era modal |
| `/introduccion` | Selección de Guía, Huaquero, Intérprete o Antropólogo; roles ocupados bloqueados |
| `/introduccion/:slug` | Descripción, animación original, narración y confirmación de rol |
| `/seleccionCargando` | Espera sincronizada de los cuatro participantes |
| `/museo` | Bienvenida, selección de una de cinco temáticas y creación de sala |
| `/induccion` | `induccion.mp4` original |
| `/animacionMuseo` | `Contextualizacin.mp4` original |
| `/qrMuseo` | QR real, código, enlace, contador de jugadores y dirección LAN editable; avance automático a la temática al registrarse el cuarto participante |
| `/tematicaMuseo` | Introducción temática; Cuencos1 o video recuperado de la temática seleccionada |
| `/rolesMuseo` | Cuatro roles y sus narraciones originales en secuencia |
| `/estadoMuseo` | Equipo, confirmaciones y control para iniciar la misión |
| `/revisarCelular` | Progreso común y orientación hacia las actividades de los dispositivos |
| `/juego/guia` | Mapa original, ubicación temporal, símbolo y botón de búsqueda |
| `/juego/huaquero` | Tablero de 20 símbolos y cámara opcional |
| `/juego/interprete` | Memoria de 16 cartas, cuatro pares válidos y pestaña Traductor |
| `/juego/antropologo` | Cuatro anagramas bloqueados hasta su traducción; respuestas validadas |
| `/fraseMuseo` | Cronómetro/progreso y frase final compartida; arrastre o selección por teclado/tacto |
| `/ganan`, `/pierden` | Resultado, puntos, tiempo, calificación 1–5 y comentario persistido |
| `/intentaloDenuevo` | Explicación y regreso a la frase, sin perder la sala |
| `/gananMuseo` | Insignias, resultado común y continuación al video/tiempos |
| `/tematicaMuseo2` | Video de cierre Cuencos2 o video recuperado de otra temática |
| `/museoTabla` | Nombres, roles y tiempos reales de los participantes |
| `/museoTablaMejorT` | Clasificación de partidas ganadas del servidor, sin datos de contacto |
| `/TestFinalizada` | Regreso al estado actual de la expedición |

Los componentes de prueba `PruebaPrueba`, `antrotest`, `huaquero2AntroTest` y `testTimeOut` no constituyen actividades adicionales en el recorrido principal. Las pantallas de envío, confirmación y error de registro se conservan como estados de los formularios.

## Roles y reglas

**Guía.** `src/Mapa/index.js` contiene cinco listas de cuatro ubicaciones, rotación de 30 segundos y lupa para avanzar. Se usa el mapa PNG original. La nueva lógica registra cada ubicación comunicada; el servidor mantiene el reloj. Las posiciones se adaptaron proporcionalmente al plano original para responder al tamaño de pantalla.

**Huaquero.** `src/Huaquero/index.js` es la actividad enrutada: 20 símbolos, cuatro válidos y transferencia al Intérprete. `src/JuegoHuaquero/index.js` es un prototipo de cámara, sin reconocimiento de imágenes. Se reconstruyeron ambos comportamientos: cámara real a petición del usuario y selección manual de símbolos. No se simula detección arqueológica ni realidad aumentada inexistente.

**Intérprete.** `src/Traductor/Minijuego.js`, `Board`, `MemoBlock`, `Traductor` y `Acumulador` implementan memoria, traducción y desbloqueo. Hay ocho símbolos duplicados (16 cartas), cuatro relevantes y cuatro distractores. Solo se traducen pares encontrados por el Huaquero. En la nueva versión el servidor guarda el mazo, oculta cartas no reveladas y bloquea dobles clics y pares no disponibles. El Traductor muestra los anagramas recuperados.

**Antropólogo.** `src/Bloqueo/index.js` contiene anagramas, respuestas y bloqueos. La nueva lógica exige la traducción previa, normaliza mayúsculas/espacios y registra cada palabra correcta una sola vez.

**Final.** `src/FraseMuseo/index.js` contiene las cinco frases y cuatro palabras por historia. La frase se desbloquea al completar los cuatro roles. La pantalla común y el Antropólogo comparten los espacios colocados; se guardan incluso tras recargar. Se puede arrastrar o seleccionar palabra/espacio. Una respuesta incorrecta permite corregir sin reiniciar la partida. El reloj de 10 minutos es común, no se reinicia al cambiar de ruta ni recargar.

## Contenido recuperado y correcciones

| Tema | Letras recuperadas | Respuestas |
| --- | --- | --- |
| Cuencos | tuariles, tear, alfarosre, potiem | rituales, arte, alfareros, tiempo |
| Alcarrazas | turascul, masfor, blospue, gadole | culturas, formas, pueblos, legado |
| Volantes | braso, loshi, toriahis, tefuen | obras, hilos, historia, fuente |
| Urnas | tuariles, naur, incianfa, zacru | rituales, urna, infancia, cruza |
| Silbatos | dosniso, zaspie, toriahis, batosil | sonidos, piezas, historia, silbato |

Las frases completas están en `shared/content.js`, transcritas de `FraseMuseo` con ajustes mínimos de puntuación. Se mantiene «historias» en las frases de Volantes/Silbatos y «historia» como respuesta al anagrama de siete letras. Se corrigió la respuesta circular `braso → braso` a `braso → obras`, deducible de la frase original. La imagen `incianfan.png` existe pero tiene una letra sobrante en el nombre; el anagrama jugable recuperado usa `incianfa`.

El enrutador original fijaba todas las actividades a historia 1, pero los componentes contenían las cinco temáticas. Se habilitó la selección de esas cinco historias. Se conservaron los grupos de símbolos del minijuego para temas 1–4; el tema 5 no tenía mazo implementado y se completó usando los símbolos originales 17–20. No se introdujeron nuevos signos oficiales.

Otras correcciones funcionales: importaciones a carpetas inexistentes; `axios` y `bcrypt` usados sin declarar correctamente; recorrido del Antropólogo a `/juego/` inexistente; marcas de finalización incompletas; rotación global destructiva de la sala cada 30 minutos; clasificación con valores ficticios; valoraciones que no se guardaban; validación que rechazaba tildes y correos académicos válidos. Se reconstruyeron con código nuevo.

La puntuación original no establecía una regla consistente. La nueva regla, propia de esta implementación, otorga 25 por ubicación, 50 por hallazgo, 75 por traducción, 100 por anagrama y 200 más segundos restantes por la frase. Penaliza 5 por símbolo incorrecto, 2 por par no válido y 10 por frase incorrecta, sin bajar de cero. Los mejores tiempos se ordenan por duración. Esto no se presenta como una regla oficial del museo.

## Recursos y dependencias externas

- Se copiaron 207 imágenes, audios, videos y fotogramas desde `src`, unos 161,6 MB, manteniendo sus rutas relativas en `public/assets/original`. `asset-inventory.json` documenta cada archivo. No se copiaron ZIP, `.env`, logs, paquetes ni compilaciones.
- Se usan el mapa, los 20 signos, ilustraciones de roles, animaciones de instrucciones, tutorial, narraciones, sonidos de acierto/error y videos de inducción/contexto/temáticas. Los fotogramas decorativos alternativos y demás recursos quedan preservados para revisión.
- El original depende de un Express/Mongoose con `DATABASE_URI`, endpoints `/users` y `/roomCode` en Railway y un dominio Vercel para el QR. No se contactaron esos endpoints, no se migraron usuarios y no se leyeron credenciales.
- Dependencias originales: React 18/CRA, React Router 6, Express, Mongoose/MongoDB, CryptoJS, QR, react-dnd, react-modal, react-slick, use-sound, estrellas, Three/AR/XR, cron, nodemailer y utilidades. Varias eran prototipos o estaban sin uso efectivo.
- La recreación usa React, Vite, Express, Socket.IO, QRCode e iconos Lucide; pruebas Node y Playwright. `package-lock.json` fija las versiones instaladas y todas las dependencias son independientes.

## Límites concretos

No se recuperó ningún modelo de reconocimiento, marcador AR, mapa de asociación física de esculturas a signos ni servicio de visión. Para añadir reconocimiento real se necesitan fotografías de referencia de cada pieza, correspondencia pieza/símbolo/ubicación y el enfoque de detección autorizado. Pueden entregarse como archivos dentro de `SMIGC-redesign/references`; no hace falta compartir secretos. Mientras tanto toda la actividad prevista del tablero y cámara puede completarse.

No se encontraron subtítulos/transcripciones sincronizadas de los videos o audios. Se mantienen controles nativos y texto de instrucciones. Para una adaptación audiovisual completa se requieren archivos `.vtt` o transcripciones revisadas del museo.

Para usar datos históricos se necesita una exportación anonimizada con esquema o una base separada autorizada. La nueva experiencia funciona sin ello; nunca debe apuntarse a producción por defecto ni copiarse el `.env` original.
