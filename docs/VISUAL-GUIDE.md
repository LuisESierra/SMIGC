# Referencia visual verificada

Fuente: [sitio oficial del Museo Lilí](https://museo.uao.edu.co/), inspeccionado antes de implementar. Se recuperaron HTML, CSS de Elementor, fuentes WOFF2, logotipos y fotografías. Se abrió también en Microsoft Edge y se capturó `museum-reference.png`. No se generaron imágenes que pretendan ser recursos oficiales.

## Colores

| Uso observado | Valor | Evidencia |
| --- | --- | --- |
| Acento visible, encabezado y enlaces | `#8A1428` | `post-752.css`, `post-1151.css` y captura |
| Variantes vinotinto | `#8F1B30`, `#79102D` | Estilos específicos de la página |
| Fondos crema | `#FBF5EC`, `#FAF5ED`, `#F8F4EB` | Estilos específicos de página y cabecera |
| Texto principal | `#282828` | Token global primary en `post-676.css` |
| Texto secundario | `#5F5F5F` | Token global text |
| Neutros | `#FFFFFF`, `#ECECEC` | Tokens globales |
| Coral de la configuración general | `#EF5B5C` | Token global accent, sustituido visualmente por vinotinto en muchos elementos |

Se adoptaron los colores que realmente aparecen en la página. El verde `#32634B` para éxitos es un color funcional propio de la recreación; no se afirma que forme parte de la identidad del museo. Las transparencias de bordes y capas fotográficas también son decisiones de la recreación.

## Tipografía y composición

Poppins para títulos y controles; Open Sans para lectura, según los tokens globales del sitio. Se descargaron las fuentes desde sus URLs verificadas y se sirven localmente; no hay llamadas a Google Fonts durante el juego. El sitio también carga DM Sans, pero no fue necesario incorporarla.

Composición inspirada en los espacios amplios, líneas divisorias, fondos crema/blanco, numeración de secciones y protagonismo de las piezas/fotografías. La jerarquía y los controles son nuevos y están orientados a jugar: código destacado, progreso, actividad del rol, tiempo y respuesta inmediata.

`public/assets/museum/exhibition.png` es la fotografía `Tras-las-huellas-02-882x1024.png` del sitio oficial. Se muestra con crédito visible. Los logotipos se descargaron sin redibujarlos. Las otras fotografías recuperadas (`collection.jpg`, `figure.jpg`) se preservan, aunque la portada usa la vitrina arqueológica por su relación con la misión. Los iconos de interfaz son Lucide; los signos de juego son los archivos originales de SMIGC.

## Trazabilidad

- `museum-home.html`: HTML recuperado.
- `post-676.css`, `post-752.css`, `post-1151.css`: estilos examinados.
- `museum-css-sources.json`: URL y archivo de cada CSS.
- `museum-assets.json`: URL exacta de cada recurso descargado.
- `museum-reference.png`: captura del sitio de referencia.
- `redesign-desktop.png`, `redesign-mobile.png`: capturas de la recreación.

Inicialmente los recursos CSS con parámetros de versión respondieron 403. Se recuperaron las mismas rutas sin parámetros, con cabeceras de navegador, y se verificaron en el navegador. No falta un recurso visual necesario para el rediseño construido.

Los recursos del museo siguen perteneciendo a sus titulares. Esta carpeta documenta su procedencia; la reconstrucción no implica una aprobación editorial o institucional del museo.

La cabecera identifica el producto como **Museo Interactivo Lilí**, nombre confirmado por el usuario. Se compone como marca tipográfica propia con Poppins y vinotinto, sustituyendo el logo institucional en ese enlace. Los recursos institucionales originales se conservan sin alterarlos. El enlace distingue la pantalla fija de la entrada de participantes.
