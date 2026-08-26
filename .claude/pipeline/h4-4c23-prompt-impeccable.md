# Pipeline H4 sub-pasos 4c.2 + 4c.3 — brief UI (PASO 1, carril B)

**Estado**: PASO 1 compilado. **PASO 2: APTO CON CAMBIOS en los dos prompts** (director) — E1-E11 aplicadas; D-4c23-p1..p4 aceptadas, p1 con matización obligatoria en biblia (#95, firmada por Bazalo, `cf6002f`). **PASO 3: ejecutado** (impeccable, register product). Prompt A en `82bec5c`, prompt B en `c3b1a4a`. 534/534 tests, `tsc` y `vite build` limpios, detector sin hallazgos nuevos. **Verificación visual en la app: NO ejecutada** — no hay navegador headless en el entorno y la vista exige login de Supabase. Bazalo pidió arrancar los dos sub-pasos a la vez y revisarlos juntos; van en un solo pipeline porque tocan los mismos archivos y porque se solapan entre sí (ver D-4c23-p1).
**Carril**: B (2 pasos: director → impeccable).
**Fecha**: 2026-08-26.
**Fuentes**: biblia v0.25 (#10, #11, #85, #87, #90, #93, #94, #95, #96), DESIGN.md, PRODUCT.md, repo en `9d1ce5d`.

## Micro-decisiones tomadas al compilar (para veredicto del director)

- **D-4c23-p1 — Reparto entre pausa y campamento.** #87 dice "el campamento es la pantalla de pausa **dentro** de la run" y le asigna cinco acciones (inventario+equipo, descansar, ajustes, cambiar de personaje, salir al mundo). #85/#94 crean además un **menú de pausa global** con Continuar, Guardar y salir, Opciones y Reset run. Tal cual, "Ajustes"≡"Opciones" y "Cambiar de personaje"≡"Guardar y salir al menú": dos menús distintos con los mismos dos botones dentro, y uno de ellos accesible sólo si el PJ ha caminado hasta su casa. **Propuesta**: se separan por naturaleza, no por sitio. La **pausa** es el menú de SISTEMA (guardar, salir, opciones, reset): global, siempre a mano, no diegético. El **campamento** es un LUGAR con acciones del mundo (inventario y equipo, descansar, salir al mundo): diegético, sólo donde está el Hogar. Ajustes sale del campamento y vive sólo en la pausa. **Cambiar de personaje no cambia de puerta: se difiere.** #87 la define como el selector de los 3 slots de §8.2, y ese selector no existe: hoy el Menú principal llama a `loadLastCharacter()` y carga un slot implícito. Queda como deuda con destino nombrado: **sub-paso 4c.4**, firmado por Bazalo. **Cerrado en biblia como decisión #95** (matiza #87 en dos puntos literales y acota #93), junto con la retirada del botón "Hogar".
- **D-4c23-p2 — La home se parte en dos, no se transforma en una.** Q11 eligió "se transforma" (opción c) y #87 dice que el Menú principal es la pantalla de FUERA de la run. Las dos cosas conviven si se reparte por rama: las ramas **vacío** y **caído** de `home-view` son el Menú principal y se quedan donde están (ahí vive ya `save_slots.epitaph`, que es lo que #94/Q13 pide para la lápida). La rama **vivo** deja de ser una pantalla con "Salir al mundo" y pasa a ser **Cargar partida** → mundo restaurado en la vista persistida (#90, Q12c): si guardaste dentro del Hogar, apareces dentro del Hogar. El "sitio donde el PJ guarda inventario y descansa" (#85) es entonces el POI Hogar, no una pantalla aparte.
- **D-4c23-p3 — "Reset run" borra el slot, no mata al PJ.** #94 ya lo cierra así. Se implementa con la confirmación irreversible de DESIGN §5.7 y NO escribe epitafio: un suicidio administrativo en la galería de epitafios ensucia #11.
- **Prerrequisito del PASO 3: CUMPLIDO.** Decisión **#95** (reparto pausa/campamento, "Cambiar de personaje" diferido a 4c.4, botón "Hogar" retirado, excepción de texto del Hogar acotada) y **#96** (el salto del tutorial no cierra la puerta) escritas en biblia v0.25 con OK explícito de Bazalo, commit `cf6002f`.
- **Orden de ejecución: A primero, B después, sobre A ya mergeado.** Los dos editan `.world-view__header` y `main.ts`; en paralelo el conflicto de cabecera está garantizado. Además el `[Guardar y salir al menú]` de A necesita un Menú principal que sepa recibirlo, y la rama `alive` de B sólo tiene sentido con la pausa ya montada.
- **D-4c23-p4 — La preferencia de "no volver a mostrar" (Q26) vive en `localStorage`, no en Supabase.** Es una preferencia de comodidad de este navegador, no estado de partida: meterla en `save_slots` la ataría a la run y se borraría con la muerte del PJ, que es exactamente lo contrario de lo que pide un "para siempre".

---

## Prompt A — sub-paso 4c.2 (pausa global + inventario)

```
Añade el sistema de pausa global de El Teknomoro (sub-paso 4c.2 del Hito 4) sobre la vista de mundo existente. DOM, cero Canvas.

## Contexto (carry forward)
- Proyecto: El Teknomoro, RPG web con permadeath. PRODUCT.md y DESIGN.md autoritativos. Register: product.
- Tokens: neutros tinta-tierra (humeda 14% / baja 20% / media 28% OKLCH), corteza-palida bordes y texto secundario, hueso-descolorido texto, hueso-claro énfasis, verde-musgo/verde-pantano sólo semántica "mundo orgánico", ámbar sólo hallazgo real, rojo-óxido sólo peligro real, violeta arcano <=5% y sólo si lo arcano interviene.
- Reglas inviolables: Numbers-In-Mono, Color-Means-Something, Arcane-Restraint, Inverted-Amber, Display-Is-Sacred, Flat-By-Default, No-Glow, No-Pure-Black-No-Pure-White. Sin emojis. Sin em dashes en copy.
- Tipografía: Cormorant Garamond display (reservada a momentos narrativos contados) / Inter cuerpo / JetBrains Mono números de reglamento.
- Motion: ease-out exponencial, sin bounce, prefers-reduced-motion respetado.

## Estado de partida (main en 9d1ce5d, 508/508 tests verde)
- `src/render/world-view.ts`: vista de mundo con tres niveles de cámara (region / grid / poi). Cabecera `.world-view__header` con título "Terra", botón "Hogar" y HUD (nombre, HP, nivel) a la derecha. Panel de selección abajo-izquierda; panel de escena del POI a la derecha, que ya CAPTURA el input de la superficie cuando está abierto (patrón a replicar).
- `src/state/world-flow.ts`: `getState()`, `travelTo`, `lookAt`, `enterPOI`, `leavePOI`, `completePOI`. Cada mutación persiste sola (fire-and-forget) vía `saveWorldState`.
- `src/backend/characters.ts`: `saveWorldState(ws)`, `saveCharacterUpdate(character)`, `loadLastCharacter()`.
- `src/render/confirm-modal.ts`: `showConfirmModal` ya existe (patrón sobrio DESIGN §5.7, una frase, dos botones). Úsalo, no escribas otro modal.
- `src/main.ts`: modos 'auth' | 'home' | 'h2-flow' | 'combat' | 'world'. `worldSession` guarda { flow, character } mientras el jugador está en el mundo.

## Tarea
Un botón de pausa siempre visible en el mundo y un menú de sistema detrás de él, más un botón global de Inventario con placeholder. Al cerrar el sub-paso, el jugador puede pausar desde cualquier nivel de zoom, guardar y salir al menú principal, y volver exactamente a donde estaba.

## Estructura interna requerida
1. **Módulo propio `src/state/pause.ts`** (#94/Q45): la máquina de la pausa (abierta/cerrada, qué acción se está confirmando) vive aquí, no dispersa por la vista. Sin DOM dentro: expone estado y transiciones, testeable sin navegador.
2. **Botón de pausa en la esquina superior derecha** (#94/Q23a), dentro de `.world-view__header`, junto al HUD. Siempre accesible mientras no haya un modal abierto (#85). Tecla Escape NO lo abre: Escape ya sale de un nivel de cámara por pulsación en la vista de mundo y robarle ese gesto rompería lo cerrado en 4c.1. Con el panel **abierto**, Escape SÍ lo cierra: el panel captura el input de la superficie, así que la cámara no está escuchando y no hay gesto robado. Un panel con foco atrapado y sin salida por teclado es un fallo de accesibilidad, no una decisión de diseño. Regla: Escape nunca abre la pausa, siempre cierra el panel que tenga el foco.
3. **Panel de pausa**: mismo patrón que el panel de escena del POI — panel anclado, SIN dimming del mundo (#94/Q25: "el mundo se ve, no se toca"), que captura el input de la superficie mientras está abierto. No un modal a pantalla completa.
4. **Cuatro acciones** (#94): `[Continuar]` cierra y devuelve al estado exacto (#94/Q30: nivel de cámara, POI abierto, selección; no a un estado canónico). `[Guardar y salir al menú]` **espera a que la escritura termine** antes de desmontar la vista y volver al Menú principal. `world-flow.ts` persiste hoy fire-and-forget: si el botón navega sin esperar, la última mutación se puede perder y el "Cargar partida devuelve a la misma vista" de 4c.3 falla de forma intermitente. Expón un `flush()` o la promesa de la última escritura en `world-flow.ts`, aguárdala con el botón en estado de espera, y si rechaza falla **visible**, nunca en silencio: el jugador tiene que poder decidir no salir. `[Opciones]` abre un sub-panel con accesibilidad REAL: 3 tamaños de texto (S/M/L, compromiso de PRODUCT) y respeto explícito de prefers-reduced-motion. Sin volumen: el audio de #76 no existe todavía y un slider muerto es simulación de pulido. `[Reset run]` borra el slot con **doble confirmación** (#94 lo dice literal) y NO escribe epitafio.
5. **Confirmación desactivable** (#94/Q26): `[Guardar y salir]` confirma con una frase, y la confirmación lleva un check "No volver a preguntar". La preferencia se guarda en `localStorage` (ver D-4c23-p4), se lee al arrancar y, si está activa, el botón ejecuta directo. `[Reset run]` NO admite desactivar su confirmación y exige **dos actos deliberados, no uno** (#94: "doble confirmación"): un único modal sobrio de `showConfirmModal` cuyo botón destructivo arranca **deshabilitado** hasta marcar una casilla explícita ("Entiendo que se borra la partida"). NO encadenes dos modales: DESIGN exige "una frase, dos botones, nunca melodrama" y dos ventanas seguidas son melodrama. Borrar el slot es la acción más destructiva del juego (#44, #65).
6. **Botón global de Inventario** junto al de pausa (#94/Q15). Abre un panel placeholder honesto: "Disponible en H6". No dibujes una mochila falsa ni rejillas de huecos vacíos.
7. **Disponibilidad**: pausa e inventario existen SÓLO en el mundo, no en combate (#94/Q28: el combate ya pausa el juego por §4.8) ni en home (#94/Q29: sólo con PJ cargado).
8. **Opciones se extrae a módulo propio** (`src/render/options-panel.ts`) porque tiene dos puntos de montaje, no uno: el panel de pausa y el Menú principal. §8.1 fija tres opciones en el Menú principal (Nueva Partida, Cargar Partida y **Opciones**), y si el tamaño de texto S/M/L vive sólo dentro de la pausa, la promesa de PRODUCT queda alcanzable únicamente con un PJ vivo caminando por el mundo. La preferencia vive en `localStorage` (D-4c23-p4), así que el mismo panel funciona sin PJ cargado y sin tocar `save_slots`. El montaje en el Menú principal lo hace 4c.3; 4c.2 entrega el módulo listo para las dos puertas.

## Constraints
- NO tocar src/rules/* ni supabase/*. Sí: world-view.ts, main.ts, style.css, confirm-modal.ts si hace falta el check (mínimo), y crear pause.ts + tests.
- NO dimming del mundo, NO modal a pantalla completa para la pausa.
- NO robar Escape a la cámara.
- NO inventar opciones que no hagan nada (volumen, idioma, dificultad).
- TypeScript estricto. Sin emojis. Copy provisional honesto.
- Accesibilidad: foco atrapado en el panel de pausa mientras está abierto, devuelto al botón al cerrar; todo operable con teclado; el tamaño de texto S/M/L debe cambiar algo de verdad (variable CSS en :root), no ser un radio decorativo.

## Done when
- `npx vitest run` verde con los tests nuevos de pause.ts. `npx tsc --noEmit` y `npx vite build` limpios.
- Pausar dentro de un POI y pulsar Continuar devuelve al POI abierto, no a la regional.
- Guardar y salir aterriza en el Menú principal; volver a Cargar devuelve a la misma vista.
- Marcar "No volver a preguntar" y volver a pulsar Guardar y salir no muestra confirmación; Reset run la muestra siempre.
- Cambiar el tamaño de texto cambia visiblemente la interfaz.
- Escape con el panel de pausa abierto lo cierra y devuelve el foco al botón; Escape sin pausa abierta sigue subiendo un nivel de cámara.
- Reset run exige marcar la casilla antes de habilitar el botón destructivo, y no se puede desactivar esa confirmación.
- Guardar y salir con la red lenta no navega hasta que la escritura confirma, y un fallo de escritura se ve.

## Out of scope
Campamento del Hogar (4c.3, prompt B). Inventario real (H6). Acciones por día (4d). Anclas (4e). Tirada de exploración (4f).
```

---

## Prompt B — sub-paso 4c.3 (home como POI Asentamiento + campamento)

```
Reparte la home actual de El Teknomoro entre Menú principal y campamento diegético (sub-paso 4c.3 del Hito 4). DOM, cero Canvas.

## Contexto (carry forward)
Idéntico al prompt A: mismos tokens, mismas reglas inviolables, mismo register product, misma tipografía y motion.

## Estado de partida (además de lo del prompt A)
- `src/render/home-view.ts`: pantalla con tres ramas (`empty` / `alive` / `fallen`) y un botón primario. Emite `HomeIntent`: 'create-character' | 'enter-wilds' | 'exit-to-world' | 'create-new-after-death'. La rama `fallen` ya pinta la lápida del PJ caído (3e.2) leyendo `character.epitaph`.
- `src/rules/world.ts`: `getHomePOI()` devuelve el POI del Hogar (`sur-001-poi-1`, arquetipo asentamiento, en el grid de inicio `sur-001`).
- `src/render/world-view.ts`: el panel de escena del POI construye su fila de botones desde una lista de descriptores `{ id, label, enabled, disabledReason, primary, danger, onActivate }`. Los POIs de arquetipo asentamiento ofrecen hoy `[Hablar]` deshabilitado.

## Tarea
La home deja de ser el sitio donde estás y pasa a ser dos cosas distintas: el Menú principal (fuera de la run) y el POI Hogar (dentro del mundo). Al cerrar el sub-paso, cargar partida te devuelve al mundo donde lo dejaste, y el Hogar es un POI del Sur con las acciones del campamento dentro.

## Estructura interna requerida
1. **Menú principal = ramas `empty` y `fallen` de home-view**, sin cambios estructurales. La lápida se queda aquí (#94/Q13): ponerla dentro del POI Hogar la convertiría en herencia entre runs, contra #94 y C3b de #85. **Se añade además la entrada `[Opciones]`** al Menú principal, montando el `options-panel.ts` que entrega 4c.2: §8.1 fija tres opciones y hoy sólo habría dos, dejando el tamaño de texto de §8.5 inalcanzable sin PJ vivo.
2. **La rama `alive` cambia de sentido**: deja de ser "estás en casa, sal al yermo" y pasa a ser **Cargar partida**. Botón primario "Cargar partida" → mundo restaurado en la vista persistida (#90, Q12c). Con `tutorial_lobo_completed === false` la rama ofrece **dos vías reales, no una**, y aquí es donde #86 se cablea por fin (decisión #96). Hoy no existe: `home-view.ts` pinta un único botón y su propio comentario dice "el salto con coste (#86) entra en 4c". 4c.3 es el último sub-paso que reescribe esta rama; si no lo entrega, #86 se cae de H4 entero. Vía por defecto: `[Entrar al yermo]`, el combate del Lobo, sin cambios. Vía alternativa, secundaria y sin adorno: cargar partida y salir al mundo sin pelearlo. El copy **dice el coste** (se renuncia al loot y a la XP del lobo) porque #86 exige una elección mecánica informada, no un atajo mudo. **Saltarlo NO marca `tutorial_lobo_completed`** (#96, lectura firmada por Bazalo): la vía del Lobo sigue ofrecida mientras el PJ viva, así que un click accidental no cuesta la run entera.
3. **El POI Hogar recibe el campamento**: en `world-view.ts`, el POI cuyo id es `getHomePOI().id` sustituye `[Hablar]` por las acciones del campamento (#87), construidas con el MISMO sistema de descriptores, sin bifurcar el panel:
   - `[Inventario y equipo]` → el mismo placeholder "Disponible en H6" del botón global de 4c.2. Un solo destino, dos puertas.
   - `[Descansar]` → deshabilitado con motivo "Disponible en 4d": acampar es §9.7 y su mecánica es de 4d. En 4c.3 el botón existe y no hace nada, y lo dice.
   - `[Salir]` → salir del POI al grid, como cualquier otro POI.
   Ajustes y Cambiar de personaje NO van aquí: viven en la pausa de 4c.2 (ver D-4c23-p1).
4. **El Hogar se lee como sitio, no como POI genérico**: nombre "El Hogar" (ya lo devuelve `poiDisplayName`), y un texto de escena propio, distinto del placeholder idéntico de los otros 719. Es el único POI con texto propio en 4c, y la razón acota la excepción (#95): lo que #93 prohíbe es distinguir en pantalla lo **curado** de lo **genérico**, porque eso le dibujaría al jugador el mapa del contenido escrito a mano (#81). El Hogar no revela nada de ese mapa — ya está identificado por nombre y por su juego de acciones —, así que la excepción es por **función mecánica visible**, no por curaduría. **Ningún otro POI recibe texto propio en 4c, y en particular ninguno de los 80 `hasCuratedSlot`.** Una frase, tono #47, sin narrativa final inventada y marcada PROVISIONAL como todo lo narrativo de H4 (#91).
5. **Cableado en main.ts**: 'exit-to-world' pasa a ser 'load-game' o equivalente semántico. El botón "Hogar" de la cabecera de la vista de mundo (que hoy vuelve a la pantalla home cuando el PJ está en `sur-001`) se retira: la home ya no es una pantalla a la que volver, y "salir al menú" es ahora asunto de la pausa. Verifica que la lápida sigue apareciendo tras morir.

## Constraints
- NO tocar src/rules/* ni supabase/*. Sí: home-view.ts, world-view.ts, main.ts, style.css, tests.
- NO construyas un campamento como pantalla aparte: el campamento ES el panel de escena del POI Hogar, con otras acciones dentro. Si aparece un archivo `camp-view.ts`, es rechazo automático (#83, #85).
- NO dupliques el placeholder de inventario: el botón global de 4c.2 y el del campamento abren lo mismo.
- NO toques el flujo de muerte ni el epitafio.
- TypeScript estricto. Sin emojis. Copy provisional honesto.

## Done when
- `npx vitest run` verde. `npx tsc --noEmit` y `npx vite build` limpios.
- Con PJ vivo: Cargar partida devuelve exactamente a la vista guardada, incluido dentro de un POI.
- El POI Hogar ofrece Inventario y equipo, Descansar (apagado, con motivo) y Salir. Ningún otro asentamiento ofrece eso.
- Morir sigue llevando al epitafio y la lápida sigue en el Menú principal.
- No queda ninguna vía que lleve a la pantalla home estando vivo dentro de la run, salvo `[Guardar y salir al menú]` de la pausa, que sale de la run a propósito.
- El Menú principal ofrece las tres opciones de §8.1, con Opciones alcanzable sin PJ cargado y el tamaño de texto cambiando de verdad ahí también.
- Con el tutorial pendiente, la rama `alive` ofrece las dos vías de #86 y el copy dice qué se pierde al saltar.

## Out of scope
Inventario real (H6). Acampar de verdad (4d). Comerciantes y herreros del asentamiento (H6+). Selector de 3 slots (el schema de #10 los tiene, pero la UI de slots no entra en 4c).
```
