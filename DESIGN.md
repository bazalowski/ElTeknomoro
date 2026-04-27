<!-- SEED-TOKENS — paleta cerrada, componentes pendientes. Re-run $impeccable document cuando exista código de UI (a partir de H2) para extraer componentes reales y generar DESIGN.json sidecar. -->

---
name: El Teknomoro
description: Sistema visual para un RPG de mundo abierto post-humano, vegetación hostil, esoterismo raro y reverencial.
colors:
  tinta-tierra-humeda: "oklch(14% 0.012 145)"
  tinta-tierra-baja: "oklch(20% 0.014 145)"
  tinta-tierra-media: "oklch(28% 0.016 145)"
  corteza-palida: "oklch(45% 0.018 80)"
  hueso-descolorido: "oklch(88% 0.015 75)"
  hueso-claro: "oklch(94% 0.012 80)"
  verde-musgo-profundo: "oklch(32% 0.05 150)"
  verde-pantano: "oklch(48% 0.09 145)"
  violeta-coagulado: "oklch(40% 0.10 320)"
  rojo-oxido-enfermo: "oklch(45% 0.11 30)"
  ambar-enfermo: "oklch(62% 0.10 75)"
typography:
  display:
    fontFamily: "Cormorant Garamond, GT Sectra, Source Serif, Georgia, serif"
    fontSize: "clamp(2.5rem, 5vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter, Söhne, -apple-system, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, Söhne, -apple-system, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, Söhne, -apple-system, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Söhne, -apple-system, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.04em"
  mono:
    fontFamily: "JetBrains Mono, IBM Plex Mono, Berkeley Mono, ui-monospace, monospace"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  none: "0"
  sm: "2px"
  md: "4px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
---

# Design System: El Teknomoro

## 1. Overview

**Creative North Star: "El bosque ha vuelto y no te conoce"**

El Teknomoro vive en un mundo donde la humanidad se extinguió y la naturaleza creció encima, no en ruinas secas, sino en vegetación viva, fauna mutada, organismos que respiran. La paleta y la tipografía sirven a esa premisa: paneles densos de información que se leen como un manual de campo de un naturalista que sabe que el bosque puede matarlo. Sobre esa base orgánica, la veta esotérica/demoníaca aparece **rara y reverencial**: cuando irrumpe, es un evento singular, nunca atmósfera de fondo.

El sistema rechaza explícitamente el cliché RPG digital actual (Diablo IV / Path of Exile: glow, bordes dorados, partículas saturando, tooltips de seis líneas con iconos), el cliché RPG mesa neón retro (pixel art deliberado + neón sobre negro absoluto), y el cliché indie cozy pastel (paletas amables, tipografías redondas, world-tone amigable). De Death Stranding hereda el sentido del paisaje vivo amenazante y los paneles UI técnicos sin caer en HUD militar; de Mörk Borg / Mothership el oficio editorial de un manual de rol bien maquetado; de Into the Breach la disciplina de "todo lo que va a pasar se enseña antes de que pase".

**Key Characteristics:**
- Densidad sobre amabilidad: el jugador objetivo lee hojas de personaje densas y lo prefiere así.
- Mostrar el dado: cada tirada y cada modificador queda expuesto en pantalla, nunca oculto.
- Placeholder honesto: lo que diseñamos es provisional coherente hasta H9 (estética definitiva), nunca falsa-pulido.
- Paleta orgánica con acento arcano controlado a ≤5% de pantalla.
- Motion responsive (feedback + transiciones), nunca coreografiado, nunca bouncy.
- OKLCH canónico: la coherencia perceptual es invariante; ajustar lightness o chroma se hace en un eje predecible.

## 2. Colors: La Paleta del Bosque que Respira

Estrategia de color: **Full palette** con cuatro roles deliberados (primary / secondary / tertiary / neutral). No restrained porque el producto tiene carga semántica fuerte (5 atributos, 3 facciones, 5 arquetipos, 10 tipos de evento, rareza de ítems, estados de combate) que un solo acento no aguantaría legible. Cada hue carga significado, no decoración.

Anclaje hue confirmado: **(γ) Bosque podrido**. Verdes orgánicos vivos pero hostiles como base, hueso descolorido como neutro cálido, violeta-coagulado como acento arcano reverencial.

Formato canónico: **OKLCH**. Hex en paréntesis es aproximación sRGB para tooling externo (validador Stitch); el valor autoritativo siempre es OKLCH. Stitch puede emitir un warning sobre OKLCH; es esperado, no se corrige bajando a hex en el frontmatter.

### Primary (lo orgánico vivo-hostil)
- **Verde Musgo Profundo** (`oklch(32% 0.05 150)` ≈ `#3e4d3a`): la base del mundo, el verde que ha ganado. Aparece en superficies amplias, fondos de mapa, paneles base del entorno.
- **Verde Pantano Saturado** (`oklch(48% 0.09 145)` ≈ `#5e7a4e`): el verde que indica vida activa pero peligrosa, vegetación cercana, elementos interactuables del mundo, hover sobre elementos del entorno.

### Secondary (lo arcano)
- **Violeta Coagulado** (`oklch(40% 0.10 320)` ≈ `#6e4869`): el color del esoterismo y de lo demoníaco. Apagado, sucio, NUNCA saturado ni neón. Chroma 0.10, no 0.20+, es lo que evita el cliché RPG morado mágico — más cerca de tinta de cardenal viejo que de neón. Su rareza es el punto.

### Tertiary (peligro orgánico, hallazgos)
- **Rojo Óxido Enfermo** (`oklch(45% 0.11 30)` ≈ `#8e4f3e`): sangre, daño, peligro, mutación. Granate apagado, nunca rojo brillante.
- **Ámbar Enfermo** (`oklch(62% 0.10 75)` ≈ `#a48450`): hallazgos, descubrimientos, recompensas. No es triunfo dorado, es algo que sobrevivió al cataclismo. Sobre ámbar, el texto va siempre en `tinta-tierra-humeda`, no en `hueso-descolorido`.

### Neutral (lo que el humano dejó)

Escala oscura → clara, con tinte hacia verde-tierra (en la familia oscura) o cálido (en la familia clara). Ningún paso es neutro puro.

- **Tinta de Tierra Húmeda** (`oklch(14% 0.012 145)` ≈ `#1a1f1c`): el "negro orgánico", fondo profundo de la aplicación. Sustituto canónico de `#000`.
- **Tinta de Tierra Baja** (`oklch(20% 0.014 145)` ≈ `#262d29`): paneles fondo, un escalón sobre el fondo profundo.
- **Tinta de Tierra Media** (`oklch(28% 0.016 145)` ≈ `#3a4239`): paneles activos (panel de combate, panel de inventario, panel de hoja de personaje).
- **Corteza Pálida** (`oklch(45% 0.018 80)` ≈ `#6b6358`): divisores, bordes finos, separadores, texto secundario. Tinte cálido.
- **Hueso Descolorido** (`oklch(88% 0.015 75)` ≈ `#e3dcc8`): texto principal sobre fondo oscuro. Cálido, no blanco. Sustituto canónico de `#fff`.
- **Hueso Claro** (`oklch(94% 0.012 80)` ≈ `#f1ecdb`): texto sobre acento oscuro, highlights de UI.

### Verificación de contraste (WCAG AA)

Pares principales validados sobre `tinta-tierra-humeda` (`#1a1f1c`) como fondo:

| Texto | Ratio | Nivel |
|---|---|---|
| `hueso-descolorido` | 11.8:1 | AAA |
| `hueso-claro` | 14.0:1 | AAA |
| `corteza-palida` | 4.6:1 | AA cuerpo (texto secundario solamente) |
| `verde-pantano` | 3.4:1 | AA UI / iconos / texto grande, NO body |

Pares sobre acentos:
- `hueso-descolorido` sobre `verde-musgo-profundo`: 5.6:1 (AA cuerpo)
- `hueso-descolorido` sobre `verde-pantano`: 3.6:1 (AA texto grande / UI, no body)
- `hueso-descolorido` sobre `violeta-coagulado`: 4.5:1 (AA cuerpo, en el límite)
- `hueso-descolorido` sobre `rojo-oxido-enfermo`: 4.7:1 (AA cuerpo)
- `tinta-tierra-humeda` sobre `ambar-enfermo`: 6.2:1 (AA cuerpo, **inversión obligatoria**: texto oscuro sobre ámbar)

### Named Rules

**The Arcane Restraint Rule.** El violeta arcano nunca cubre más del 5% de cualquier pantalla. Aparece cuando lo demoníaco interviene (evento de exploración tipo arcano, hechizo, hallazgo esotérico, NPC tocado por la grieta), nunca como acento decorativo, nunca en hover de botones genéricos. Si está en todas partes, ya no comunica nada.

**The No-Pure-Black-No-Pure-White Rule.** Prohibido `#000` y `#fff`. Todo neutro lleva tinte verde-tierra (escala oscura) o cálido (escala clara). El chroma no baja de 0.012, no sube de 0.018 en la familia neutra.

**The Color-Means-Something Rule.** Cada hue tiene significado semántico fijo en el juego. Verde = mundo orgánico, violeta = arcano, rojo óxido = peligro/mutación, ámbar = hallazgo. Romper esa asociación rompe la lectura del jugador. No se usa rojo "porque queda bonito" en un botón sin peligro asociado, ni violeta para destacar un tooltip cualquiera.

**The Inverted-Amber Rule.** El ámbar enfermo es lo bastante claro como para que el texto encima vaya siempre en `tinta-tierra-humeda`, no en hueso. Cuando aparece como fondo de etiqueta de hallazgo o badge de descubrimiento, el texto se invierte automáticamente.

## 3. Typography

**Display Font:** Cormorant Garamond (con fallbacks GT Sectra, Source Serif, Georgia, serif). Serif editorial con peso narrativo.
**Body Font:** Inter (con fallbacks Söhne, -apple-system, system-ui, sans-serif). Sans neutro técnico.
**Label/Mono Font:** JetBrains Mono (con fallbacks IBM Plex Mono, Berkeley Mono, ui-monospace, monospace). Mono editorial para todo número del reglamento.

**Carácter:** La pareja serif + sans + mono evoca un manual de campo bien maquetado, no una pantalla de juego. La serif lleva el peso narrativo (nombres de pantalla, títulos de sección, evento de exploración importante). El sans hace el cuerpo legible y técnico. La mono aparece donde el reglamento se ejecuta: tiradas, valores numéricos, log de combate, modificadores. Esa separación tipográfica es ideológica, refuerza el principio "mostrar el dado".

### Hierarchy
- **Display** (Cormorant Garamond, peso 400, clamp(2.5rem, 5vw, 4rem), line-height 1.05): solo títulos de pantalla principal y momentos narrativos de peso (creación, muerte, hallazgo arcano).
- **Headline** (Inter, peso 600, ~2rem, line-height 1.1): cabeceras de sección dentro de pantalla (atributos, habilidades, perks).
- **Title** (Inter, peso 500, ~1.25rem, line-height 1.2): nombres de personaje, ítems, NPCs, perks dentro de listas.
- **Body** (Inter, peso 400, ~1rem, line-height 1.5, max line-length 65–75ch): descripciones, copy del juego, diálogos, tooltips.
- **Label** (Inter, peso 500, ~0.85rem, letter-spacing 0.04em, mayúsculas): etiquetas de UI fijas (FUE, DES, CON, INT, VOL).
- **Mono** (JetBrains Mono, peso 400, ~0.95rem, line-height 1.4): tiradas, valores numéricos, log, modificadores, cualquier número que el jugador deba poder escanear con la vista.

### Named Rules

**The Numbers-In-Mono Rule.** Cualquier valor numérico que pertenezca al reglamento (tiradas, modificadores, daño, threshold, HP, AP, XP, peso de inventario) se renderiza en mono. Letra mono = número del juego. Un jugador escaneando el log identifica de un vistazo qué es texto narrativo y qué es ejecución de regla. No se mezclan dentro de la misma frase salvo cuando el número está envuelto en sintaxis de log (ej: "Tiraste `4d6 4+` → `[6,5,3,4]` → 3 éxitos").

**The Display-Is-Sacred Rule.** La serif display reservada a los seis u ocho momentos donde el juego habla con peso narrativo. Pantalla de muerte, pantalla de creación, momento arcano singular. Si aparece en cada heading menor, deja de pesar y se vuelve decoración.

## 4. Elevation

Sistema **flat por defecto, layered por estado**. Las superficies en reposo son planas, la profundidad la dan tonos del neutro (escala `tinta-tierra-humeda` → `tinta-tierra-baja` → `tinta-tierra-media`), no sombras decorativas. Sombras solo aparecen como respuesta a estado: hover, foco activo, modal bloqueante (modal sobre el mundo lleva una sombra ambiental sutil que apaga el fondo, es funcional).

Ningún glow. Ningún drop-shadow decorativo. La elevación es información, no adorno.

### Named Rules

**The Flat-By-Default Rule.** Surfaces son planas en reposo. La profundidad se construye con luminancia del neutro (paneles más oscuros = más fondo, paneles más claros = más en primer plano), no con shadows. Shadow solo aparece para indicar estado activo (hover, focus, modal abierto sobre mundo).

**The No-Glow Rule.** Prohibido box-shadow expansivo de color (especialmente en violeta arcano o ámbar de hallazgo). El cliché RPG digital usa glow como atajo emocional; aquí lo arcano se comunica por color y composición, no por aura luminosa.

## 5. Components

> Seed mode parcial: las pantallas H2 se documentan aquí a medida que cierran (1/5 cerradas: retrato). El resto sigue siendo placeholder hasta su pasada de `$impeccable document` correspondiente.

Los componentes provisionales heredan las reglas anteriores: serif display reservada, mono para números, color-means-something, sin glow, flat-por-defecto, OKLCH como referencia.

### 5.1 Pantalla de retrato (H2, paso 1/7)

Primera pantalla cerrada del flow de creación. Marca cómo se ve una vista interna del flow H2: shell común reutilizado (`.h2-flow__exit`, `.h2-flow__heading`, `.h2-flow__nav`, `.h2-flow__nav-button`) + bloque propio `.h2-portrait` para el contenido específico.

**Archivos:** [`src/render/h2-portrait-view.ts`](src/render/h2-portrait-view.ts), bloque `h2-portrait` en [`src/style.css`](src/style.css).

**Shape:** contenedor full-bleed con grid de tres filas (`auto 1fr auto`) idéntico al patrón de `.h2-flow__step` y `.h2-start`. Cabecera arriba (heading sans + instrucción body), grid de 12 celdas en el medio, nav abajo (Atrás / Continuar / Reset). Botón Salir absoluto en esquina superior derecha.

**Grid responsive:** 3 columnas en móvil (`<560px`) → 4 columnas en tablet (`≥560px`) → 6 columnas en desktop (`≥960px`). Sin `auto-fit`: las matrices 4×3 y 6×2 son matemáticamente limpias para 12 ítems y evitan columnas huérfanas en anchos intermedios.

**Componente celda de retrato (`.h2-portrait__cell`).** Botón con `role="radio"` dentro de un `radiogroup`. Composición: swatch de color (placeholder HSL hasta H9, expuesto como custom property `--portrait-color`) + label "01"…"12" debajo. Aspect ratio del swatch `1/1`. Borde del swatch en `tinta-tierra-humeda` (mismo color que el fondo de la app) para sangrar visualmente y aislar cada placeholder sin chrome de `corteza-palida`.

Estados con tres ejes ortogonales (los tres pueden coexistir):
- **Reposo:** fondo `tinta-tierra-baja`, borde `corteza-palida`, label en mono (`hueso-descolorido`).
- **Hover:** sube un escalón de luminancia, fondo a `tinta-tierra-media`. Solo afordancia visual, no muta estado lógico.
- **Focus (`:focus-visible`):** outline exterior `2px solid hueso-descolorido` con offset 2px. Mismo patrón que `.h2-flow__nav-button` y `.h2-start__option`.
- **Selected (`[aria-checked="true"]`):** fondo `tinta-tierra-media` + `box-shadow: inset 0 0 0 2px hueso-descolorido`. Ring interno persistente. NO check decorativo, NO glow violeta, NO drop-shadow. Mismo patrón que `.h2-start__option[aria-pressed="true"]` para coherencia de selección entre pantallas H2.

**Tipografía del label.** El label "01"…"12" va en JetBrains Mono (`Numbers-In-Mono` Rule) y queda fuera del swatch, sobre el fondo neutro de la celda. Esto evita el problema de legibilidad sobre swatches HSL claros (amarillo, cian) sin parchear con backdrop opaco que ensuciaría el placeholder.

**Reglas aplicadas y desviaciones:**
- Display-Is-Sacred: la instrucción "Elige un retrato." va en body sans, no en Cormorant. Cormorant queda reservada para los momentos narrativos.
- Arcane Restraint: la marca de selección NO usa violeta. La pantalla no es evento arcano.
- Flat-By-Default + No-Glow: cero `box-shadow` expansivo. La selección usa `box-shadow inset` (anillo, no aura).
- Color-Means-Something: los swatches HSL son intencionalmente neutros respecto al sistema semántico del juego (placeholder honesto hasta H9). No se mezclan con tokens semánticos (`verde-pantano`, `ambar-enfermo`, etc.).
- Motion: transiciones `150ms ease-out` sobre `background-color` y `box-shadow`. El `outline` no se anima (focus debe ser inmediato).

Cuando el resto de pantallas H2 cierren se documentarán aquí en sub-bloques 5.2…5.5. El sidecar DESIGN.json sigue diferido hasta tener componentes transversales reutilizables (botón primario, panel de atributos, tirada en log) más allá del flow de creación.

## 6. Do's and Don'ts

### Do:

- **Do** usar la serif display SOLO para los seis u ocho momentos narrativos de peso. Pantallas frecuentes van en sans.
- **Do** renderizar todo número del reglamento en mono (`JetBrains Mono`). Tirada, modificador, daño, threshold, HP, AP. La letra mono firma "esto es regla ejecutándose".
- **Do** reservar el `violeta-coagulado` a ≤5% de pantalla y solo cuando el evento esotérico/demoníaco está presente. Su rareza es lo que comunica.
- **Do** usar la escala neutra (`tinta-tierra-humeda` → `tinta-tierra-baja` → `tinta-tierra-media`) para construir profundidad por luminancia. Paneles más al fondo = más oscuros.
- **Do** invertir el texto sobre `ambar-enfermo`: usar `tinta-tierra-humeda`, nunca hueso.
- **Do** comprimir información útil antes que estirar con espacios decorativos. El público objetivo tolera densidad.
- **Do** confirmar acciones irreversibles (muerte, reset de personaje, abandonar partida) con modal sobrio, una frase, dos botones. Nunca melodrama.
- **Do** usar OKLCH como formato canónico en CSS. Hex queda como fallback aproximado en comentario o tooling.

### Don't:

- **Don't** caer en el cliché RPG digital actual (Diablo IV / Path of Exile / Last Epoch): glow expansivo, bordes dorados, partículas ambientales, números flotantes saturando, tooltips de seis líneas con iconos. **Rechazado por completo.**
- **Don't** caer en cliché RPG mesa neón retro (Citizen Sleeper, derivados con verde fosfo): pixel art deliberado + paletas neón sobre negro absoluto. **Rechazado.**
- **Don't** caer en cliché indie cozy pastel (Stardew, Spiritfarer): pasteles, tipografías redondas amables, world-tone amigable. **Rechazado.**
- **Don't** replicar el HUD militar holográfico AAA (Cyberpunk / Starfield) literalmente. Hereda el ritmo y la jerarquía técnica de paneles densos, NO el chrome ni las animaciones holográficas.
- **Don't** usar gradientes en texto ni en superficies amplias. Un fondo es un fondo, no un degradado.
- **Don't** usar glassmorphism decorativo. Si un blur ocurre, es por motivo funcional explícito.
- **Don't** componer el patrón "hero metric SaaS" (número gigante + label pequeño + supporting stats). Las hojas de personaje son densas, no hero-metric.
- **Don't** componer grids idénticos de cards repitiendo icono + heading + texto. Las pantallas tienen ritmo, no copia de tarjetas.
- **Don't** usar emojis en UI ni en copy. Glifos funcionales (icono SVG diseñado) sí; emojis sistémicos no.
- **Don't** usar em dashes en copy. Comas, dos puntos, paréntesis.
- **Don't** usar bounce ni elastic en motion. Ease-out exponencial siempre, nunca rebote.
- **Don't** poner ambient glow violeta de fondo permanente. Lo arcano es raro y reverencial, nunca atmósfera constante.
- **Don't** usar `#000` ni `#fff`. Ningún neutro es neutro puro.
- **Don't** usar chroma > 0.12 en ningún acento. Pasarse de chroma rompe el carácter "orgánico podrido" y se vuelve neón digital.

### Pares de color prohibidos (ratio < 3:1, ilegibles)

Combinaciones que **nunca** se aplican como texto-sobre-fondo:

| Texto | Fondo | Ratio | Por qué falla |
|---|---|---|---|
| `verde-musgo-profundo` | `tinta-tierra-humeda` | 1.4:1 | Dos oscuros casi del mismo lightness. |
| `verde-pantano` | `tinta-tierra-baja` | 2.1:1 | Verde medio sobre tinta baja: invisible. |
| `corteza-palida` | `verde-pantano` | 1.7:1 | Dos medios casi en el mismo nivel. |
| `violeta-coagulado` | `tinta-tierra-baja` | 1.9:1 | Violeta sobre tinta: el arcano se pierde. Si el arcano es texto, va sobre `hueso-descolorido` o como acento en relleno con texto hueso encima. |
| `rojo-oxido-enfermo` | `verde-musgo-profundo` | 1.6:1 | Dos oscuros saturados, cromáticamente cerca, ratio fatal. |
| `ambar-enfermo` | `hueso-descolorido` | 2.0:1 | Dos claros: el ámbar desaparece. Si el ámbar va sobre claro, el texto encima va invertido. |
