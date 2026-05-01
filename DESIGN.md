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
- Placeholder honesto: lo que diseñamos es provisional coherente hasta H10 (estética definitiva, renumerada en biblia v0.19; era H9), nunca falsa-pulido.
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

**The Numbers-In-Mono Rule.** Cualquier valor numérico que pertenezca al reglamento (tiradas, modificadores, daño, threshold, HP, AP, XP, peso de inventario) se renderiza en mono **cuando aparece en bloques tabulares, fichas de personaje o stat displays donde los números se alinean visualmente y la mono ayuda a comparar**. Letra mono = número del juego. Un jugador escaneando el log identifica de un vistazo qué es texto narrativo y qué es ejecución de regla. No se mezclan dentro de la misma frase salvo cuando el número está envuelto en sintaxis de log (ej: "Tiraste `4d6 4+` → `[6,5,3,4]` → 3 éxitos").

**Excepción inline (decisión #54, v0.13):** la regla NO aplica a prosa inline (descripciones de perk, tooltips narrativos, copy de UI con números embebidos en frase: "+1 éxito al primer ataque", "+2 a la iniciativa"). En prosa inline, los números van en sans pleno como el resto de la frase. Romper la línea base con mono dentro de una frase corta daña la lectura sin aportar comparación visual (no hay otro número adyacente con el que comparar). La distinción operativa: ¿el número se compara con otro adyacente (tabla, ficha, log)? mono. ¿El número está embebido en una frase narrativa? sans.

**The Display-Is-Sacred Rule.** La serif display reservada a los seis u ocho momentos donde el juego habla con peso narrativo. Pantalla de muerte, pantalla de creación, momento arcano singular. Si aparece en cada heading menor, deja de pesar y se vuelve decoración.

## 4. Elevation

Sistema **flat por defecto, layered por estado**. Las superficies en reposo son planas, la profundidad la dan tonos del neutro (escala `tinta-tierra-humeda` → `tinta-tierra-baja` → `tinta-tierra-media`), no sombras decorativas. Sombras solo aparecen como respuesta a estado: hover, foco activo, modal bloqueante (modal sobre el mundo lleva una sombra ambiental sutil que apaga el fondo, es funcional).

Ningún glow. Ningún drop-shadow decorativo. La elevación es información, no adorno.

### Named Rules

**The Flat-By-Default Rule.** Surfaces son planas en reposo. La profundidad se construye con luminancia del neutro (paneles más oscuros = más fondo, paneles más claros = más en primer plano), no con shadows. Shadow solo aparece para indicar estado activo (hover, focus, modal abierto sobre mundo).

**The No-Glow Rule.** Prohibido box-shadow expansivo de color (especialmente en violeta arcano o ámbar de hallazgo). El cliché RPG digital usa glow como atajo emocional; aquí lo arcano se comunica por color y composición, no por aura luminosa.

## 5. Components

> Seed mode parcial: las pantallas H2 se documentan aquí a medida que cierran (4/5 cerradas: retrato, atributos, habilidades, perk). El resto sigue siendo placeholder hasta su pasada de `$impeccable document` correspondiente.

Los componentes provisionales heredan las reglas anteriores: serif display reservada, mono para números, color-means-something, sin glow, flat-por-defecto, OKLCH como referencia.

### 5.1 Pantalla de retrato (H2, paso 1/7)

Primera pantalla cerrada del flow de creación. Marca cómo se ve una vista interna del flow H2: shell común reutilizado (`.h2-flow__exit`, `.h2-flow__heading`, `.h2-flow__nav`, `.h2-flow__nav-button`) + bloque propio `.h2-portrait` para el contenido específico.

**Archivos:** [`src/render/h2-portrait-view.ts`](src/render/h2-portrait-view.ts), bloque `h2-portrait` en [`src/style.css`](src/style.css).

**Shape:** contenedor full-bleed con grid de tres filas (`auto 1fr auto`) idéntico al patrón de `.h2-flow__step` y `.h2-start`. Cabecera arriba (heading sans + instrucción body), grid de 12 celdas en el medio, nav abajo (Atrás / Continuar / Reset). Botón Salir absoluto en esquina superior derecha.

**Grid responsive:** 3 columnas en móvil (`<560px`) → 4 columnas en tablet (`≥560px`) → 6 columnas en desktop (`≥960px`). Sin `auto-fit`: las matrices 4×3 y 6×2 son matemáticamente limpias para 12 ítems y evitan columnas huérfanas en anchos intermedios.

**Componente celda de retrato (`.h2-portrait__cell`).** Botón con `role="radio"` dentro de un `radiogroup`. Composición: swatch de color (placeholder HSL hasta H10, renumerado en biblia v0.19; era H9, expuesto como custom property `--portrait-color`) + label "01"…"12" debajo. Aspect ratio del swatch `1/1`. Borde del swatch en `tinta-tierra-humeda` (mismo color que el fondo de la app) para sangrar visualmente y aislar cada placeholder sin chrome de `corteza-palida`.

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
- Color-Means-Something: los swatches HSL son intencionalmente neutros respecto al sistema semántico del juego (placeholder honesto hasta H10, renumerado en biblia v0.19; era H9). No se mezclan con tokens semánticos (`verde-pantano`, `ambar-enfermo`, etc.).
- Motion: transiciones `150ms ease-out` sobre `background-color` y `box-shadow`. El `outline` no se anima (focus debe ser inmediato).

### 5.2 Pantalla de atributos (H2, paso 2/7)

Segunda pantalla cerrada del flow. Reutiliza el shell común y añade un componente nuevo (la fila de atributo) y un componente reutilizable potencialmente extensible al pool de habilidades (la banda de pool).

**Archivos:** [`src/render/h2-attributes-view.ts`](src/render/h2-attributes-view.ts), bloque `h2-attributes` en [`src/style.css`](src/style.css).

**Shape:** contenedor full-bleed con grid de cuatro filas (`auto auto 1fr auto`): cabecera (heading sans + instrucción body) → banda de pool → lista de 5 filas → nav. Botón Salir absoluto en esquina superior derecha.

**Componente fila de atributo (`.h2-attributes__row`).** Grid `5 columnas × 2 filas`: sigla `FUE` en (col 1, fila 1) como ancla visual fuerte, nombre largo `Fuerza` en (col 1-2, fila 2) subordinado en `corteza-palida`, control numérico (`−` valor `+`) ocupando las dos filas a la derecha como bloque compacto centrado verticalmente. Decisión: la sigla y el nombre quedan apilados sin necesitar wrapper en el HTML (los hijos del row son planos: label, name, dec, value, inc). En móvil estrecho (`<480px`) el nombre largo se oculta (`display: none`); la sigla ya es ancla suficiente y el nombre apretaría el control numérico.

**Componente banda de pool (`.h2-attributes__pool`).** Banda horizontal con `border-top` y `border-bottom` 1px en `corteza-palida`, label izquierda mayúsculas tracking 0.08em (regla "Label"), número derecha en mono `1.25rem` con `tabular-nums` (regla "Numbers-In-Mono"). Sin caja contenedora, sin caer en hero-metric (prohibido por DESIGN.md). El pool es un dato más, no espectáculo. Patrón candidato a reutilizarse en la pantalla de habilidades (paso 3/7) para el "10 puntos restantes".

**Botón paso (`.h2-attributes__step`).** Cuadrado 36px (≥32px hit area), símbolos `−` y `+` en mono 1.1rem para que el grosor case con el número entre ellos. Mismo lenguaje austero que las celdas de retrato.

Estados (cuatro, no tres como en retrato porque aquí hay `:disabled` real):
- **Reposo:** fondo `tinta-tierra-baja`, borde `corteza-palida`.
- **Hover:** sube un escalón de luminancia a `tinta-tierra-media` (mismo eje que `.h2-portrait__cell:hover`). Neutralizado en `:disabled`.
- **Focus (`:focus-visible`):** outline exterior `2px solid hueso-descolorido` con offset 2px. En `:disabled:focus-visible` el outline pasa a `corteza-palida` (más apagado, coherente con el resto de señales del disabled).
- **Disabled:** tres señales acumulativas: `opacity: 0.4`, `cursor: not-allowed`, fondo congelado en `tinta-tierra-baja` que NO sube en hover. Disabled = inerte, hover normal = vivo. Lectura inmediata.

**Tratamiento del valor inválido.** La UI bloquea el estado inválido por construcción: los `disabled` en `+` (cuando valor == 4 o pool == 0) y `−` (cuando valor == 1) impiden que la suma se desvíe del rango `[5, 12]`; `Continuar` deshabilitado impide salir con suma != 12. Decisión cerrada del director: el rojo óxido `--c-rojo-oxido-enfermo` NO aparece en esta pantalla. El pool se mantiene en `--c-hueso-claro` siempre, sin variante de error. Cuando el pool llega a 0, los `+` se deshabilitan (única señal funcional).

**Reglas aplicadas y desviaciones:**
- Display-Is-Sacred: la instrucción "Reparte 12 puntos…" va en body sans. Cormorant fuera del shell.
- Numbers-In-Mono: el valor 1-4 de cada atributo y el pool 0-7 van en mono con `tabular-nums` (1 y 4 ocupan lo mismo, alineación vertical limpia).
- Color-Means-Something: rojo óxido reservado a peligro/mutación, NO a error de UI dado que la UI evita el estado inválido por construcción.
- Arcane Restraint: cero violeta. La pantalla no es evento arcano.
- Densidad sobre amabilidad: 5 filas en pantalla a la vez sin scroll en desktop. Las filas son entradas de panel técnico (Mörk Borg / Mothership), no cards.
- Desviación de `.h2-portrait`: la fila NO recibe inset ring de selección. Aquí no hay selección persistente, hay valor numérico. El patrón de tres ejes (hover/focus) se aplica al control `+/−`, no a la fila contenedora.

**API en `H2StepCtx`.** `setAttribute(id: AttributeId, value: number): void` añadido al closure de `startH2Flow`. Valida entero + rango `[1, 4]` contra `CREATION_RULES` antes de mutar. Patrón hermano de `setPortrait`. La vista NO muta el draft directamente. La vista llama al setter por cada `+/−` y mantiene su propio `values: AttrValues` local para repintar los disabled y el pool sin reconsultar el draft.

### 5.3 Pantalla de habilidades (H2, paso 3/7)

Tercera pantalla cerrada del flow. Reutiliza el shell común y el patrón "banda de pool" + "botón paso" de H2.2 clonados (decisión #52: clonado en cada pantalla hasta tercer consumidor; entonces se extrae en commit aparte). Introduce un nuevo componente: el grupo por atributo.

**Archivos:** [`src/render/h2-skills-view.ts`](src/render/h2-skills-view.ts), bloque `h2-skills` en [`src/style.css`](src/style.css).

**Shape:** contenedor full-bleed con grid de cuatro filas (`auto auto 1fr auto`). Cabecera (heading sans + instrucción body) → banda de pool → grid de 5 grupos → nav. Botón Salir absoluto en esquina superior derecha.

**Componente grupo por atributo (`.h2-skills__group`).** Sección con cabecera horizontal (sigla + nombre del atributo, separador inferior fino `border-bottom: 1px solid corteza-palida`) seguida de la lista de las 2 habilidades de ese atributo. Las 5 secciones se distribuyen en grid de 2 columnas en desktop (matriz 2-2-1, el último grupo VOL queda solitario en la tercera fila sin estirarse — asimetría honesta de panel técnico, mejor que forzar simetría con un grupo placeholder vacío). Colapsa a 1 columna en `<720px`.

**Componente cabecera de grupo (`.h2-skills__group-header`).** Sigla mayúsculas tracking 0.1em color `hueso-descolorido` + nombre largo body sans color `corteza-palida` subordinado. Tracking más amplio que las filas (0.04em) para jerarquía clara. El `border-bottom` cierra la sección y la separa visualmente de las filas siguientes.

**Componente fila de habilidad (`.h2-skills__row`).** Flex horizontal `justify-content: space-between`. Nombre izquierda (body sans, `text-overflow: ellipsis` si aprieta), cluster `−valor+` derecha. **Sin `border` ni `background`** (desviación deliberada de `.h2-attributes__row`): las 10 filas con bg saturarían visualmente y romperían la jerarquía "grupo > fila". El grupo es el panel; las filas son sus entradas.

**Botón paso (`.h2-skills__step`).** Cuadrado **32px** (vs 36px en H2.2). Razón: 10 filas necesitan más densidad vertical que 5. Hit area sigue ≥32px (mínimo cómodo). Mismo lenguaje visual (símbolos `−` y `+` en mono, hover por luminancia, focus por outline, disabled triple).

**Banda de pool (`.h2-skills__pool`).** Clon literal del patrón de `.h2-attributes__pool`. Banda horizontal con `border-top` y `border-bottom`, label izquierda + número derecha en mono con `tabular-nums`. `max-width: 720px` (vs 480px en H2.2) para alinearse con el grid de grupos.

Estados del control `+/−` (cuatro, idénticos a `.h2-attributes__step`):
- **Reposo:** fondo `tinta-tierra-baja`, borde `corteza-palida`.
- **Hover:** sube a `tinta-tierra-media`. Neutralizado en `:disabled`.
- **Focus (`:focus-visible`):** outline `2px solid hueso-descolorido` con offset 2px. En `:disabled:focus-visible` el outline pasa a `corteza-palida`.
- **Disabled:** `opacity: 0.4`, `cursor: not-allowed`, fondo congelado. Tres señales acumulativas.

**Tratamiento del valor inválido y del pool a 0.** La UI bloquea el estado inválido por construcción: `−` deshabilitado en valor 0, `+` deshabilitado en valor 3 o pool == 0. `Continuar` deshabilitado hasta suma exactamente igual a 10 (decisión #50). Sin rojo óxido como señal de error (heredado de la decisión cerrada en H2.2). El pool siempre en `--c-hueso-claro`.

**Reglas aplicadas y desviaciones:**
- Display-Is-Sacred: heading "Habilidades" en sans. Instrucción body sans. Cabeceras de grupo en sans label. Cero Cormorant.
- Numbers-In-Mono: valor 0-3 de cada habilidad y pool 0-10 en mono con `tabular-nums`. Las siglas FUE/DES/CON/INT/VOL son Label en Inter mayúsculas. El nombre del atributo del grupo y el nombre de la habilidad son body sans.
- Color-Means-Something + Arcane-Restraint: sin rojo óxido (UI evita estado inválido), sin violeta (no es evento arcano).
- Densidad sobre amabilidad: 10 habilidades sin scroll en desktop. Las descripciones de habilidad existen en `src/data/skills.ts` pero NO se muestran (decisión #51, reservadas para hoja de personaje H4+).
- Desviación 1: fila sin `border` ni `background` (vs H2.2). El grupo es el contenedor visual.
- Desviación 2: botón paso 32px (vs 36px). Densidad vertical justificada.
- Desviación 3: pool max-width 720px (vs 480px). Alinea con grid de grupos.

**API en `H2StepCtx`.** `setSkill(id: string, value: number): void` añadido al closure de `startH2Flow`. Valida que `id` exista en `SKILLS_BY_ID` + entero + rango `[0, skillMaxAtCreation]` antes de mutar `draft.skills`. Patrón hermano de `setPortrait` y `setAttribute`.

**Decisiones cerradas en este cierre (numeradas para biblia v0.12):**
- #50: suma == 10 obligatoria al pulsar Continuar (no ≤ 10). Ritual cerrado de creación.
- #51: descripciones de habilidad NO se muestran en flow de creación; reservadas para hoja de personaje H4+.
- #52: stepper se clona en cada pantalla del flow hasta tercer consumidor; entonces se extrae a `.h2-stepper-*` en commit aparte que cubre las pantallas afectadas.

### 5.4 Pantalla de elección de perk (H2, paso 4/7)

Cuarta pantalla cerrada del flow. Reutiliza el shell común y el patrón de selección persistente con inset ring de `.h2-portrait`. Introduce un componente nuevo: la card-radio con cuerpo de texto (cabecera nombre + sigla, descripción inline).

**Archivos:** [`src/render/h2-perk-view.ts`](src/render/h2-perk-view.ts), bloque `h2-perk` en [`src/style.css`](src/style.css).

**Shape:** contenedor full-bleed con grid de tres filas (`auto 1fr auto`) idéntico al patrón de `.h2-portrait` y `.h2-flow__step`. Cabecera arriba, grid de 5 cards en el medio, nav abajo. Botón Salir absoluto.

**Grid responsive:** `repeat(auto-fit, minmax(220px, 1fr))` con `max-width: 960px`. Sin breakpoints fijos: `auto-fit` colapsa naturalmente a 1 col en móvil estrecho, 2 col en tablet, 3 col en desktop. Las 5 cards llenan 2 filas en desktop (3+2). Asimetría heredada del patrón 2-2-1 de H2.3. `grid-auto-rows: 1fr` iguala alturas para que descripciones de longitud variable (8 a 22 palabras) no rompan el grid.

**Componente card-radio (`.h2-perk__card`).** `<button>` con `role="radio"` dentro de un `radiogroup`. Reset de estilos nativos del botón (`font-family: inherit`, `color: inherit`, `text-align: left`, fondo y borde explícitos) para que se vea como panel técnico. Composición interna:
- **Cabecera (`.h2-perk__card-header`):** flex horizontal `justify-content: space-between`. Nombre del perk izquierda (peso 500, hueso-claro) + sigla del atributo asociado derecha (label mayúsculas tracking 0.08em color corteza-palida). Separador `border-bottom: 1px solid corteza-palida` con `padding-bottom: 8px` y `margin-bottom: 10px`. Establece la jerarquía interna de la card.
- **Cuerpo (`.h2-perk__card-description`):** descripción mecánica completa, Inter peso 400, ~0.9rem, color hueso-descolorido (NO subordinado a corteza-palida; la descripción ES la información clave de elección, no metadata), line-height 1.5.

Estados (cuatro, ortogonales, idéntico patrón `.h2-portrait__cell`):
- **Reposo:** fondo `tinta-tierra-baja`, borde `corteza-palida`.
- **Hover:** sube a `tinta-tierra-media`. Solo afordancia visual.
- **Focus (`:focus-visible`):** outline exterior `2px solid hueso-descolorido` con offset 2px.
- **Selected (`[aria-checked="true"]`):** fondo `tinta-tierra-media` + `box-shadow: inset 0 0 0 2px hueso-descolorido`. Inset ring persistente.
- **Selected + focus:** inset ring + outline exterior coexisten en ejes distintos. Lectura inmediata.

**Tratamiento de la sigla del atributo.** Solo texto color subordinado (`corteza-palida`), sin badge, sin borde, sin fondo. Es peana, no etiqueta competidora con el nombre. Si fuera badge competiría visualmente con el nombre del perk.

**Las descripciones se muestran inline** (decisión cerrada, opuesta a la #51 de habilidades). Razón: los nombres de perk no son autoexplicativos ("Temple", "Ojo Clínico"); el contenido mecánico ES la elección. En habilidades los nombres son terminología D&D/WoD universal y la pantalla es asignación, no elección informada.

**Disponibilidad de los 5 perks** (decisión #53): los 5 están todos disponibles en H2.4. El gateo por arquetipo aplica solo al árbol post-creación (H8 tras renumeración v0.19; era H7), no a la creación. En modo `preset` con `archetype` definido, el `starting_perk_id` del arquetipo aparece preseleccionado como sugerencia visible y ajustable; sin badge "Sugerido" porque el inset ring ya es señal suficiente. En modo `scratch` o sin archetype: sin preselección.

**Mono NO aparece en este bloque** (decisión #54): los números embebidos en las descripciones (`+1 éxito`, `+2 iniciativa`, `+2 HP máximo`) van en sans pleno como el resto de la frase. La regla "Numbers-In-Mono" aplica a bloques tabulares, no a prosa inline.

**Reglas aplicadas y desviaciones:**
- Display-Is-Sacred: heading "Perk inicial" en sans. Instrucción y descripciones en sans body. Cero Cormorant.
- Color-Means-Something + Arcane-Restraint: sin rojo óxido (no hay error posible), sin violeta (no es evento arcano).
- Selección con inset ring (clon literal de `.h2-portrait`).
- Desviación 1: sigla del atributo dentro de la cabecera de la card vs label "01"-"12" debajo del swatch (la card de perk es texto puro con jerarquía interna; el retrato es visual mudo).
- Desviación 2: cards de altura igualada con `grid-auto-rows: 1fr` vs `aspect-ratio: 1/1` cuadrado del retrato.
- Desviación 3: padding generoso vs padding mínimo del retrato (el cuerpo de descripción necesita respirar).

**API en `H2StepCtx`.** `setPerk(id: string): void` añadido al closure de `startH2Flow`. Valida que `id` exista en `PERKS_BY_ID` y **REEMPLAZA** `draft.perks = [id]` (no acumula). El reglamento exige `length === 1` al confirmar.

**Decisiones cerradas en este cierre (numeradas para biblia v0.13):**
- #53: en H2.4 los 5 perks iniciales están todos disponibles. El gateo por arquetipo del biblia §4.7 línea 253 aplica solo al árbol de progresión post-creación (H8 tras renumeración v0.19; era H7), no a la creación.
- #54: regla "Numbers-In-Mono" NO aplica a prosa inline (descripciones, tooltips, copy de UI con números embebidos en frase). Aplica solo a bloques tabulares, fichas y stat displays donde los números se alinean para comparar.

### 5.5 Pantalla de inventario inicial (H2, paso 5/7, sub 5a)

Quinta pantalla cerrada del flow, primera de las tres sub-pantallas en que se divide el "paso 5/5" del scope §1.3 (líneas 49-51). Pantalla **100% visual/anticipatoria**: lee `ctx.draft.archetype` y muestra el inventario placeholder correspondiente. No persiste nada en draft. Coherente con que el catálogo real de items se cierra en H6 (renumerado en biblia v0.19; era H5).

**Archivos:** [`src/render/h2-inventory-view.ts`](src/render/h2-inventory-view.ts), bloque `h2-inventory` en [`src/style.css`](src/style.css).

**Shape:** contenedor full-bleed con grid de tres filas (`auto 1fr auto`) idéntico al patrón de `.h2-perk` y `.h2-flow__step`. Cabecera arriba (heading sans + instrucción body) → panel del inventario en el medio → nav abajo. Botón Salir absoluto en esquina superior derecha.

**Componente panel (`.h2-inventory__panel`).** Contenedor del bloque de inventario, ancho de lectura controlado a `max-width: 720px`. **No es card; es panel técnico denso** (referencia Mörk Borg / Mothership). Sin borde exterior, sin fondo propio: la jerarquía la dan la banda informativa con bordes horizontales y los divisores finos entre ítems. Decisión deliberada: cards aquí saturarían la lectura del jugador y romperían la jerarquía "panel > banda > filas".

**Componente banda informativa (`.h2-inventory__band`).** Banda horizontal con `border-top` y `border-bottom` 1px en `corteza-palida`, label izquierda + acción derecha. Clon visual del patrón consolidado en `.h2-attributes__pool` y `.h2-skills__pool`. El label muestra `<Nombre del arquetipo> — 5 ítems base` cuando `draft.archetype` es válido y existe en `ARCHETYPES_BY_ID`, o `Inventario inicial básico — 5 ítems` en estado neutro. La banda completa va en JetBrains Mono con `tabular-nums` (Numbers-In-Mono Rule aplicable: el numeral "5 ítems" es dato comparable, junto con el nombre del arquetipo se lee como entrada de panel técnico, no como prosa).

**Componente botón "Sorpréndeme" (`.h2-inventory__surprise`).** Botón secundario sobrio dentro de la banda, alineado a la derecha. Más compacto que `.h2-flow__nav-button` porque es acción de panel, no de nav.

Estados (cuatro, ortogonales, mismo lenguaje del flow):
- **Reposo:** fondo `tinta-tierra-baja`, borde `corteza-palida`.
- **Hover:** sube a `tinta-tierra-media`. Mismo eje que el resto del flow.
- **Focus (`:focus-visible`):** outline exterior `2px solid hueso-descolorido` con offset 2px.
- **Pressed (`[aria-pressed="true"]`):** fondo `tinta-tierra-media` + `box-shadow: inset 0 0 0 1px hueso-descolorido`. Inset ring fino (no 2px como en `.h2-portrait[checked]` o `.h2-perk[checked]`: aquí el botón es de acción, no de selección persistente; el ring sutil basta para indicar "el aviso está visible"). Mismo lenguaje, intensidad menor.

**Componente aviso inline (`.h2-inventory__surprise-notice`).** `<p role="status" aria-live="polite">` con texto `"Generación de inventario aleatorio — disponible en H6."` (renumerado en biblia v0.19; antes "H5"). Aparece cuando se pulsa "Sorpréndeme", se oculta al pulsarlo de nuevo o tras un timeout de 5 s. Animación con `max-height` + `opacity` (no propiedades de layout puro), 200 ms ease-out. **Sin modal, sin glassmorphism, sin glow.** El aviso es prosa pura en sans pleno (decisión #54 aplicada: el "H6" embebido en frase narrativa no rompe a mono).

**Componente fila de ítem (`.h2-inventory__item`).** Grid `28px 1fr` con `align-items: baseline`, divisor inferior fino en `tinta-tierra-baja` (más sutil que `corteza-palida` que se reserva a separadores estructurales del flow). Última fila sin divisor. Los ítems **no son interactivos** en H2: son informativos. Por eso quedan fuera del orden de tabulación, sin trampa de foco. La interactividad real (drag & drop, equipar, comparar) entra en H6 (renumerado en biblia v0.19; era H5).

**Componente glifo (`.h2-inventory__item-glyph`).** Inicial del nombre del ítem en JetBrains Mono, ancla visual fija en columna izquierda. Cumple Numbers-In-Mono por estar en columna tabular alineada (no es prosa inline). Color `corteza-palida` para que el nombre sea el ancla principal y el glifo subordinado.

**Cuerpo de ítem.** Nombre en sans peso 500 sobre `hueso-claro` (ancla de la fila), descripción en sans peso 400 sobre `corteza-palida` con line-height 1.45 para legibilidad de frases cortas. Decisión #54: prosa inline en sans, los ítems llevan números narrativos ("tres jornadas", "1 perk") embebidos en frase, no tabulares.

**Inventario placeholder (5 ítems).** El catálogo real es H6 (renumerado en biblia v0.19; era H5); estos son tokens narrativos genéricos coherentes con el lore (post-humano, naturaleza vencedora, esoterismo demoníaco raro y reverencial). Lista actual: "Cuchillo de hoja recocida", "Odre de agua filtrada", "Hogaza dura y tiras de carne curada", "Capa de fibra trenzada", "Reliquia menor de un nombre olvidado". Tono lore-aware deliberado: nada de "cantimplora", "hatillo" o vocabulario de fantasía rural genérica. Los 5 arquetipos comparten la misma lista placeholder; la diferenciación real entra en H6 con el catálogo cerrado.

**Reglas aplicadas y desviaciones:**
- Display-Is-Sacred: heading "Inventario inicial" en sans. Instrucción body sans. Cero Cormorant.
- Numbers-In-Mono: banda informativa en mono (dato tabular: nombre arquetipo + "5 ítems base"); glifos de ítem en mono (columna tabular alineada). Descripciones de ítem en sans (decisión #54: prosa inline).
- Color-Means-Something + Arcane-Restraint: sin rojo óxido (no hay error posible), sin violeta (no es evento arcano), sin ámbar (no es hallazgo confirmado). Toda la pantalla en escala neutra orgánica.
- Flat-By-Default + No-Glow: cero `box-shadow` expansivo. La selección del botón "Sorpréndeme" usa `box-shadow inset` 1px (anillo fino, no aura).
- Densidad sobre amabilidad: 5 filas en pantalla a la vez sin scroll en desktop estándar (1280×800). Las filas son entradas de panel técnico, no cards.
- Desviación 1: panel sin chrome propio (vs. `.h2-perk__card[]` que sí tiene fondo y borde). Aquí la jerarquía visual la cargan la banda y los divisores; el panel es contenedor lógico, no visual.
- Desviación 2: ítems sin estados de selección/hover/focus. Son informativos en H2; ningún eje ortogonal aplicable.
- Desviación 3: la banda informativa va completa en mono (nombre del arquetipo + numeral). En H2.2 y H2.3 la banda separa label-en-sans + valor-en-mono. Razón: aquí el "label" es el propio nombre del arquetipo seguido del numeral; tratar el bloque como una entrada tabular única se lee mejor que partir en dos tipografías.

**API en `H2StepCtx`.** Ninguna nueva. La pantalla es read-only sobre `draft`. No añade setters, no añade tipos al `CharacterDraft`, no añade entradas al `ORDER` (las tres entradas `inventory`/`preview`/`confirm` ya estaban cableadas desde antes en `src/state/h2-flow.ts` líneas 18-26).

**Patrón canónico de nav inferior del flow H2 (decisión operativa del director, v0.14).** **Atrás + Continuar + Reset en TODAS las pantallas del flow.** El Reset es la salida de emergencia desde dentro del flow ("me he equivocado de arquetipo, empiezo de cero") y debe estar disponible en cualquier paso. H2.1 (retrato) lo tiene desde su cierre. H2.2/H2.3/H2.4 lo perdieron por contagio entre cierres y serán uniformadas en commit aparte tras cerrar las sub-pantallas 5b y 5c. H2.5a se hace bien desde el principio: incluye Reset.

### 5.6 Pantalla de preview del personaje (H2, paso 6/7, sub 5b)

Sexta pantalla cerrada del flow, segunda de las tres sub-pantallas del "paso 5/5" del scope §1.3. **Mock visual estático**: el motor de combate cierra en H3, en H2 la pantalla anticipa la estética sin lógica real. Es el último vistazo al personaje antes de confirmar.

**Archivos:** [`src/render/h2-preview-view.ts`](src/render/h2-preview-view.ts), bloque `h2-preview` en [`src/style.css`](src/style.css).

**Shape:** contenedor full-bleed con grid `auto auto auto auto` (`align-content: start`). Cabecera → arena de dos paneles → bloque de detalles → nav. Padding más comprimido que en hermanas (el contenido es denso). Botón Salir absoluto.

**Componente arena (`.h2-preview__arena`).** Grid `1fr auto 1fr` con un "vs" central. Es la única pantalla del flow con estructura simétrica explícita; refuerza la lectura "personaje vs mundo" que sostiene el juego. Colapsa a una sola columna en `<720px`.

**Componente panel jugador (`.h2-preview__side--player`).** Retrato (swatch HSL + label en mono, heredado de `.h2-portrait__cell-swatch`) → identidad (nombre del arquetipo + tag "Tú") → 4 stats derivados en grid horizontal (HP / DEF / INI / SUE). Los stats van separados por `border-top` 1px en `corteza-palida`, label en mayúsculas tracking 0.08em y valor grande en JetBrains Mono con `tabular-nums`. Cumple Numbers-In-Mono (bloque tabular).

**Componente panel enemigo placeholder (`.h2-preview__side--foe`).** Mismo shape pero con `border-style: dashed` y color subordinado en `corteza-palida`. Silueta `?` en Cormorant Garamond 2.5rem sobre fondo neutro. Copy "Lo que sea que aparezca" + nota inferior "El primer encuentro se decide en el mapa, no aquí." La asimetría visual (dashed vs solid, corteza vs hueso) comunica "esto es placeholder honesto, no diseño definitivo" (PRODUCT.md §Design Principles 5).

**Componente versus central (`.h2-preview__versus`).** "vs" en Cormorant Garamond 1.5rem, color `corteza-palida`. Microuso de la serif display dentro de "Display-Is-Sacred": el preview es momento narrativo (último vistazo antes de cruzar el umbral) y la serif puntúa el corte simbólico entre los dos paneles. Microuso, no expansivo.

**Componente bloque de detalles (`.h2-preview__details`).** Tres tarjetas en `repeat(auto-fit, minmax(240px, 1fr))`: Atributos (5 entradas tabulares densas, valor en mono), Habilidades entrenadas (lista densa, valor a la derecha en mono, divisores `dashed` para diferenciarlos del panel-borde y del divisor sólido de la banda informativa), Perk (nombre + descripción inline).

Estados: la pantalla es enteramente informativa. Sin estados de selección, sin hover, sin focus management. Los únicos elementos focuseables son los botones de nav (Atrás / Continuar / Reset / Salir). Los stats y la información del personaje quedan fuera del orden de tab (son contenido, no controles).

**Reglas aplicadas y desviaciones:**
- Display-Is-Sacred: Cormorant Garamond aparece en "vs" central y silueta `?` del enemigo. Microuso justificado por momento narrativo. Heading "Antes del primer paso" sigue en sans (Inter), porque el peso narrativo lo carga el componente arena, no el heading.
- Numbers-In-Mono: stats derivados (4 valores en grid del panel jugador), atributos brutos (5 valores en bloque de detalles), valores de habilidades entrenadas. Todo en mono con tabular-nums.
- Color-Means-Something + Arcane-Restraint: sin rojo (no hay daño todavía), sin violeta (no es arcano), sin ámbar (no es hallazgo). Toda la pantalla en escala neutra orgánica.
- Asimetría intencional: el panel enemigo dasheado contradice levemente "Flat-By-Default" (la línea sí transmite estado), pero el dasheado no es decoración — comunica "placeholder, no producción".
- Densidad sobre amabilidad: 4 stats + 5 atributos + lista de habilidades + perk caben sin scroll en desktop estándar gracias al grid auto-fit.

**Cálculo de stats derivados.** La pantalla consume `rules/character.ts` (módulo SAGRADO) como API:
- `computeMaxHp(attributes)` → HP máximo (`8 + 2·CON`).
- `computeDefense(attributes)` → DEF base (`2 + floor(DES/2)`, sin armadura porque el inventario equipado vive en H6 tras renumeración v0.19; era H5).
- Iniciativa: `attributes.des` bruto (la fórmula completa `DES + 1d20` vive en `combat.ts`, biblia §4.8 / decisión #41; en preview no hay tirada, mostramos solo el modificador base).
- Suerte: `floor((INT + VOL) / 2)` (decisión #43 sin la decay por nivel, porque el personaje aún no tiene `level` asignado; el nivel se inicializa al confirmar).

**API en `H2StepCtx`.** Ninguna nueva. Lectura pura de `ctx.draft`. No añade setters, no añade tipos al `CharacterDraft`. La pantalla es read-only.

### 5.7 Pantalla de sellado del personaje (H2, paso 7/7, sub 5c)

Séptima pantalla cerrada del flow, tercera y última de las sub-pantallas del "paso 5/5" del scope §1.3. **Cierra el Hito 2 entero.** Pantalla de momento narrativo de peso: el jugador firma con su personaje y arranca el yermo.

**Archivos:** [`src/render/h2-confirm-view.ts`](src/render/h2-confirm-view.ts), bloque `h2-confirm` en [`src/style.css`](src/style.css).

**Shape:** contenedor full-bleed con grid `auto auto auto auto` (`align-content: start`). Cabecera (heading serif + warning) → panel principal de resumen → mensaje de error (oculto si vacío) → nav. Botón Salir absoluto.

**Componente cabecera (`.h2-confirm__header`).** Heading en **Cormorant Garamond** (microuso de Display-Is-Sacred: la pantalla es uno de los seis u ocho momentos narrativos donde la serif gana peso) con texto `"Sellar al personaje"`. Bajo el heading, párrafo `corteza-palida` con la advertencia `"La muerte es permanente. Lo que confirmes aquí no se reescribe."`. Es la única pantalla del flow H2 con heading en serif (H2.5b usa Cormorant solo en "vs" y silueta `?`, no en heading).

**Componente panel principal (`.h2-confirm__panel`).** Contenedor único de borde sólido `corteza-palida` sobre fondo `tinta-tierra-baja`. Estructura interna en tres bloques verticales:

1. **Identidad (`.h2-confirm__identity`).** Retrato (swatch + label en mono) + nombre del personaje (peso 500, `hueso-claro`) + arquetipo (label mayúsculas tracking 0.06em, `corteza-palida`). Separador `border-bottom` 1px en `corteza-palida`. Es la "ficha" del personaje en horizontal.

2. **Stats derivados grandes (`.h2-confirm__derived`).** Grid de 4 celdas (HP / DEF / INI / SUE), valor en JetBrains Mono peso 500 a `clamp(1.5rem, 2.5vw, 1.85rem)` — más grandes que en H2.5b porque aquí son la información definitiva, no preview. Numbers-In-Mono con tabular-nums. `border-top` y `border-bottom` 1px en `corteza-palida` que enmarca el bloque como banda técnica.

3. **Tres columnas (`.h2-confirm__columns`).** Grid `repeat(auto-fit, minmax(220px, 1fr))`: Atributos (5 entradas tabulares, valor en mono), Habilidades entrenadas (lista densa con divisores `dashed` en `tinta-tierra-media`), Perk (nombre + descripción inline en sans, decisión #54). Cada columna lleva su mini-heading en label mayúsculas tracking 0.12em.

**Modal pre-persistencia.** Al pulsar "Sellar el personaje", la vista invoca `showConfirmModal` con título `"Lo que selles aquí no se reescribe. ¿Confirmas a este personaje para el yermo?"` y botones `"Sellar"` / `"Volver"`. Solo si el usuario confirma se llama a `ctx.confirmAndPersist()`. El modal sigue el patrón sobrio del flow (sin glow, sin glass, sin emoji): una frase, dos botones. Acción irreversible → confirmación obligatoria, según PRODUCT.md §Design Principles 3.

**Estados de persistencia.**
- **Reposo:** botón "Sellar el personaje" habilitado, mensaje de error vacío.
- **Loading:** todos los botones disabled, "Sellar el personaje" muestra `"Sellando…"`. Sin spinner; el cambio de label es señal suficiente y mantiene el lenguaje austero del flow.
- **Error:** mensaje en `rojo-oxido-enfermo` bajo el panel. Color justificado por Color-Means-Something (rojo = peligro/daño): "no se ha guardado tu personaje" es daño narrativo real. Dos textos según error: `CharacterAlreadyAliveError` → "Ya tienes un personaje vivo. Solo se permite uno a la vez." Genérico → "No se ha podido sellar al personaje. Inténtalo de nuevo."

**Reglas aplicadas y desviaciones:**
- Display-Is-Sacred: heading en Cormorant Garamond `clamp(2rem, 4vw, 2.75rem)`. Único heading del flow H2 en serif. La pantalla es el corte simbólico entre creación y permadeath; merece la jerarquía visual.
- Numbers-In-Mono: stats derivados grandes (4 celdas), atributos brutos (5 celdas), valores de habilidades. Todo en mono con tabular-nums.
- Color-Means-Something: rojo `rojo-oxido-enfermo` reservado al mensaje de error (peligro real: pérdida de personaje). Sin violeta, sin ámbar (no hay arcano ni hallazgo). Toda la pantalla en escala neutra orgánica + el rojo solo cuando aplica.
- Densidad sobre amabilidad: 4 stats + 5 atributos + lista de habilidades + perk + identidad caben en pantalla sin scroll en desktop estándar gracias al panel auto-organizado y al colapso `auto-fit`.
- Patrón canónico de nav: Atrás + "Sellar el personaje" (botón primario) + Reset. El primary lleva texto narrativo en lugar del genérico "Continuar"; es el único botón del flow que no dice "Continuar" porque el momento es definitivo.

**API en `H2StepCtx`.** Ninguna nueva. La pantalla consume:
- `ctx.draft` (lectura completa para resumen).
- `ctx.confirmAndPersist()` (ya existía: persiste en Supabase vía `backend/characters.ts` con `slot_index=0`).
- `ctx.exit()`, `ctx.goBack()`, `ctx.reset()`.

**Cierre del Hito 2.** Tras esta pantalla, las 7 vistas del flow H2 siguen patrón canónico unificado: shell `.h2-flow__step`, botón Salir top-right cableado localmente, nav Atrás + Continuar + Reset (excepto H2.5c donde "Continuar" es "Sellar el personaje"), tres ejes de estado, inset ring para selección, mono para datos tabulares, Inter para texto, Cormorant Garamond reservada a microusos narrativos. **0 estados inválidos posibles** desde la UI; los defaults defensivos de `h2-defaults.ts` se retiraron en este mismo cierre porque la UI ya garantiza el contrato del draft.

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
