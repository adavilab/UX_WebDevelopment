# StudyFlow Web

Maquetación e interacción del panel web de StudyFlow (app de estudio con técnica Pomodoro) a partir de los mockups de Figma, hecha con **HTML5 semántico + CSS3 + jQuery**, sin frameworks ni backend. Todo el sitio es estático: se abre con doble clic en `index.html`, sin servidor ni build.

## Pantallas incluidas (9)

| Archivo | Pantalla |
|---|---|
| `index.html` | Login |
| `registro.html` | Registro ("Crear cuenta") |
| `calendario.html` | Calendario (vistas Semana y Mes en una sola página) |
| `materias.html` | Materias (panel principal) |
| `crear-materia.html` | Crear materia |
| `perfil.html` | Perfil |
| `nueva-entrega.html` | Nueva entrega (también edita: `?id=N`) |
| `detalle-actividad.html` | Detalle de actividad (`?id=N`) con Editar / Eliminar |
| `sugerencias.html` | Sugerencias de horario (aceptar / rechazar / regenerar) |

## Flujo de navegación

Login ⇄ Registro → Calendario ⇄ Materias ⇄ Perfil (por la barra lateral). Materias → Crear materia → Materias. "Cerrar sesión" (pie de la barra lateral o Perfil) → Login. Los botones de envío (Login, Registro, Guardar materia, Cerrar sesión) simulan un breve estado de carga (~700 ms) antes de navegar.

## Acceso a Figma

> Actualización: el archivo ya es accesible desde el MCP de Figma. Las pantallas 05 (Nueva entrega), 06 (Detalle de actividad) y 09 (Sugerencias de horario) se implementaron a partir de sus frames (capturas en `referencia/10` a `12`). El texto de abajo describe el estado inicial del proyecto.

El fileKey del archivo (`M2tvMobk0Ox1lSHtI5MqG6`) no fue accesible con la cuenta conectada al MCP de Figma en este entorno ("no tienes acceso de edición al archivo"), por lo que **no se pudieron leer medidas exactas, variables ni exportar los íconos originales**. Todo el sitio se construyó a partir de:

1. Las 9 capturas de referencia entregadas (guardadas en `referencia/`).
2. La descripción textual detallada de cada pantalla (colores, medidas aproximadas, textos, estados).

Si se comparte el archivo con la cuenta conectada al MCP, se puede refinar el detalle (espaciados exactos, radios, variables de color) volviendo a ejecutar `get_metadata` / `get_design_context` / `get_variable_defs` sobre los frames.

## Sustituciones y decisiones documentadas

- **Íconos**: no se pudieron descargar los SVG originales de Figma. Se usaron íconos propios estilo *outline* (inspirados en Feather/Lucide), en línea (`<svg>` inline) para poder colorearlos con `currentColor` según el estado (normal/hover/activo). Están dibujados a mano dentro del HTML de cada pantalla, en la misma posición y tamaño relativo que en las capturas.
- **Colores y medidas**: tomados de la sección de tokens estimados (variables en `:root` de `css/style.css`), verificados visualmente contra las capturas de `referencia/` con capturas de Chrome headless a 1440px de ancho. No hay valores exactos de Figma (paddings, radios) que confirmar; se aproximaron por inspección visual.
- **Tipografía**: Inter (Google Fonts, pesos 400/500/600/700), como indica el prompt.
- **Verificación visual**: el entorno de trabajo no tenía Playwright/Chromium instalado (a pesar de que el enunciado lo daba por hecho), así que la comparación pixel a pixel automatizada no fue posible. Se usó **Google Chrome en modo headless** (`--headless=new --screenshot`) para renderizar cada pantalla a 1440px de ancho y compararla visualmente contra su captura de referencia; se ajustaron tamaños de fuente, espaciados y proporciones hasta que la composición coincidiera. La vista "Mes" del calendario también se verificó así, alternando temporalmente las clases de visibilidad.
- **Inconsistencias del mockup respetadas tal cual** (no corregidas):
  - El usuario/avatar y el título tienen posiciones ligeramente distintas entre la vista Semana y la vista Mes del calendario (en Mes se ven más abajo en el frame original); no se unificó el layout entre ambas.
  - El orden de las pestañas "Semana | Mes" cambia según cuál esté activa ya no se replica: las pestañas Semana (izquierda) y Mes (derecha) conservan su posición al cambiar de vista.
  - En la vista Semana, el evento "Cálculo Diferencial" (2 horas de alto) se dibuja como un solo bloque `position: absolute` de doble altura sobre la cuadrícula; en el mockup original ese bloque tiene una ligera transparencia que deja ver la línea divisoria de la hora 09:00 cruzando el texto. Aquí el bloque es opaco, así que esa línea no se ve a través del evento (diferencia menor, cosmética).
- **"Sugerencias"** no tiene pantalla propia en los mockups entregados: el ítem del menú queda como enlace a `#`, tal como indica el prompt.
- **Responsivo**: se añadieron *media queries* para que el diseño no se rompa en anchos intermedios/móviles (barra lateral pasa a apilarse arriba, tarjetas de resumen y de entregas se apilan a una columna, la cuadrícula de colores reduce columnas). El objetivo principal sigue siendo la fidelidad al ancho de escritorio.

## Estructura del proyecto

```
studyflow-web/
├── index.html
├── registro.html
├── calendario.html
├── materias.html
├── crear-materia.html
├── perfil.html
├── css/style.css
├── js/menu.js
├── images/            (vacía: los íconos se dibujaron inline como SVG en el HTML)
├── referencia/         (capturas de los mockups, no forman parte del sitio)
└── README.md
```

## Metodología aplicada

- **HTML**: estructura `#wrapper > #header/#contenidos/#footer` del laboratorio, con comentarios `<!-- INICIO x --> / <!-- FIN x -->`, semántica (`header`, `nav`, `main`, `section`, `article`, `footer`, `form`, `label for`), un solo `h1` por página.
- **CSS**: un único `css/style.css` organizado en bloques comentados (genéricos → diagramación → un bloque por componente/pantalla), con variables en `:root`, Flexbox/Grid para la disposición, pseudoclases (`:hover`, `:focus`, `:nth-child`) y pseudoelementos donde corresponde, y transiciones CSS para todas las animaciones.
- **jQuery** (`js/menu.js`): todo dentro de `$(document).ready(function ($) {...})`, siguiendo el orden del curso — 1) variables de control, 2) funciones con parámetro `event`, 3) triggers `.on(...)` al final. Las animaciones viven en CSS; jQuery solo agrega/quita/alterna clases y actualiza contenido (`addClass`, `removeClass`, `toggleClass`, `text`, `prop`).

## Interacciones implementadas

- **Login / Registro**: validación in-line (correo, campos vacíos, contraseñas coincidentes, checkbox de términos) y navegación simulada a Calendario.
- **Calendario**: pestañas Semana/Mes con `toggleClass`/`addClass`/`removeClass` y reordenamiento de pestañas según la vista activa.
- **Materias**: "Recargar" actualiza la hora de "Última revisión" (simulado); los círculos de check de "Próximas Entregas" alternan estado completada/pendiente.
- **Crear materia**: selección de color identificador (radio + resaltado de tarjeta), chips de días de clase semanal (`toggleClass`), validación de campos obligatorios al enviar, navegación simulada de vuelta a Materias.
- **Perfil**: "Conectar/Desconectar Calendario" alternan el indicador de sincronización mediante una variable booleana de estado.
- **Cerrar sesión**: disponible en el pie de la barra lateral (Materias, Crear materia) y en Perfil; siempre vuelve a Login.
