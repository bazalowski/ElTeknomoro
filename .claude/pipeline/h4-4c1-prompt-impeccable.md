# Pipeline H4 sub-paso 4c.1 — brief UI (PASO 1, carril B)

**Estado**: PASO 1 compilado por el orquestador citando decisiones cerradas (carril B: #93 y #94 fijan qué se pinta y cómo, así que el brief traduce decisión→UI en vez de inventar producto). Pendiente OK de Bazalo → PASO 2 (director) → PASO 3 (impeccable).
**Carril**: B (2 pasos: director → impeccable).
**Fecha**: 2026-08-26.
**Fuentes**: biblia v0.24 (#83, #85, #87, #89, #91, #92, #93, #94), DESIGN.md, PRODUCT.md, repo en `da986e6`.

## Partición del sub-paso 4c (decisión del director)

4c tal como lo define la biblia son cuatro cosas grandes. En un solo brief no cabe bajo el techo de 250 líneas del pipeline, y Q10 del cuestionario pedía explícitamente que la vista de POI cierre en commit propio. Se parte:

| Sub-paso | Contenido | Pipeline |
|---|---|---|
| **4c.0** | Motor: selectores de POI en `world-state.ts` (SAGRADO), `last_damage_source='enemy'` al cerrar derrota. | NO (director directo) |
| **4c.1** | **Este brief.** Vista de POI por zoom continuo + botones + combate Lobo desde POI. | SÍ |
| **4c.2** | Sistema de pausa global (#94). | SÍ |
| **4c.3** | Home reinterpretada como POI Asentamiento del Sur + campamento (#87). | SÍ |

## Micro-decisiones tomadas al compilar (para veredicto del director, no de impeccable)

- **D-4c1-p1** — La vista de POI **no es una tercera superficie**. Es el mismo SVG de `world-view.ts` con la cámara llevada al frame del POI, más un panel de escena en DOM anclado sobre él. Es la lectura literal de #83/#93 ("zoom continuo, no router"): si se crea `poi-view.ts` como pantalla independiente, es rechazo automático.
- **D-4c1-p2** — `[Inspeccionar]` marca `revelado` y muestra el texto de escena; `[Combatir]` marca `completado` sólo al **cerrar el combate con victoria**. Entrar a un POI y salir sin hacer nada deja `revelado`, no `completado`. Es lo que hace que la derivación de estado de grid de #94 signifique algo.
- **D-4c1-p3** — El texto de escena es **idéntico en los 720** ("Aún no has explorado este lugar en detalle."), sin distinguir curado de genérico en pantalla (#93 corrige Q3b). La cascada de #92 no se cablea aquí: es 4f.
- **D-4c1-p4** — El combate desde POI **no vuelve a montar la pantalla de combate existente en otro modo**: reutiliza `startCombatFlow` + `combat-view` tal cual, y al cerrar devuelve a la vista de POI (Q32a, Q35a). El modo `'combat'` de `main.ts` se conserva; lo que cambia es de dónde se entra y a dónde se vuelve.

---

## Prompt validado (entrégaselo a `impeccable` literal tras el PASO 2)

```
Diseña e implementa la vista de POI de El Teknomoro (sub-paso 4c.1 del Hito 4): tercer y último nivel de zoom del overworld, con entrada al combate. DOM + SVG, cero Canvas.

## Contexto (carry forward)
- Proyecto: El Teknomoro, RPG web con permadeath. PRODUCT.md y DESIGN.md son autoritativos. Register: product.
- Tokens DESIGN.md que aplican: neutros tinta-tierra (humeda 14% / baja 20% / media 28% OKLCH), corteza-palida para bordes y texto secundario, hueso-descolorido para texto, verde-musgo/verde-pantano sólo con semántica "mundo orgánico", ámbar sólo hallazgo real, rojo-óxido sólo peligro real, violeta arcano ≤5% de pantalla y sólo si lo arcano interviene.
- Reglas inviolables: Numbers-In-Mono (tabular, no en prosa inline), Color-Means-Something, Arcane-Restraint, Inverted-Amber, Display-Is-Sacred, Flat-By-Default, No-Glow, No-Pure-Black-No-Pure-White.
- Tipografía: Cormorant Garamond display / Inter cuerpo / JetBrains Mono números de reglamento.
- Tono del mundo (#47): post-humano, naturaleza vencedora, esoterismo raro y reverencial. No ruina seca: bosque hostil vivo.
- Patrón heredado de 4b (respétalo, es la misma superficie): tres ejes ortogonales hover/focus/disabled, outline 2px hueso-descolorido para focus, confirmación modal sobria patrón DESIGN §5.7.

## Estado de partida (main en da986e6, 481/481 tests verde, tsc y build limpios)
- `src/render/world-view.ts`: UN SOLO SVG con 180 grids. La vista de grid NO es otra pantalla: es camera transform (scale+translate) sobre esa superficie. Helpers internos ya existentes: moveCameraTo(target, animate), fitGrid(grid), fitRegional(), focusGrid(gridId, animate), unfocusGrid(animate), clase .world-view__camera--animating. Zoom 200-300ms, prefers-reduced-motion respetado, un click durante la animación la cancela y arranca la nueva (#91/Q33).
- Vista de grid ya pintada: mini-grid 5×5, 4 POIs en su position del dataset, PJ en celda (2,2) con retrato miniatura, iconos SVG por arquetipo, niebla por POI ("???" si no revelado). Click en POI hoy sólo selecciona.
- `src/state/world-flow.ts`: createWorldFlow({initialState, persist}) → { getState(), travelTo(gridId), lookAt(view) }. lookAt registra la vista semántica y persiste; PlayerView ya admite { kind: 'poi', poiId } desde 4b.0 — el shape persistido NO necesita migración.
- `src/rules/world.ts` (SAGRADO, no tocar): getPOI(id), getPOIsByGrid(gridId), getGrid(id), getHomePOI(), POI { id, gridId, archetype: 'natural'|'ruina'|'asentamiento'|'arcano', position, hasCuratedSlot }. Los POIs NO tienen campo `name`.
- `src/rules/world-state.ts` (SAGRADO, no tocar; ampliado en 4c.0): getPOIState(state,id) → null|'revelado'|'completado', revealPOI(state,id), completePOI(state,id), deriveGridState(state,gridId).
- `src/state/combat-flow.ts`: startCombatFlow({character, enemies, enemyTemplates, itemCatalog, rng, nowIso, onEnd}) → handle. onEnd recibe CombatResult { status: 'victory'|'defeat'|'fled', character, loot, epitaph? }.
- `src/render/combat-view.ts`: pantalla de combate completa y cerrada en H3. NO la rediseñes. NO la toques salvo que un cableado lo exija, y entonces mínimo.
- `src/main.ts`: modos 'auth'|'home'|'h2-flow'|'combat'|'world'. startCombatRun(root, character) monta el combate. El combate hoy se entra desde home ("Entrar al yermo") y vuelve a home.
- `src/data/enemies.ts`: un solo enemigo en catálogo, 'lobo_del_bosque'.

## Tarea
Añade el tercer nivel de zoom —la vista de POI— sobre la superficie de mundo existente, y cablea desde ella la entrada y el retorno del combate. Al cerrar el sub-paso, el jugador acerca la cámara a un grid, entra a un POI, lee su escena, elige Inspeccionar / Combatir / Salir, pelea contra el Lobo, y vuelve al POI con su estado persistido tras recargar el navegador.

## Estructura interna requerida
1. **Tercer nivel de cámara en `world-view.ts`** (NO un archivo de pantalla nuevo): helper fitPOI(poi) análogo a fitGrid, y focusPOI(poiId, animate) / unfocusPOI(animate). Entrar al POI = misma transición de 200-300ms que grid→regional, encadenada desde el frame del grid al frame del POI dentro del mini-grid 5×5. Salir = zoom inverso al grid contenedor. La cámara es una sola máquina de estados: 'region' | 'grid' | 'poi'.
2. **Panel de escena** anclado sobre la superficie con la cámara en el POI: es DOM, no SVG, y NO es un modal a pantalla completa que tape el mundo. El jugador debe seguir viendo el POI enfocado detrás/al lado — es lo que hace que el zoom signifique algo. Layout a tu criterio (panel lateral, banda inferior anclada, lo que la lectura pida), con una condición dura: el frame del POI enfocado nunca queda completamente oculto.
3. **Contenido del panel**: (a) título = id del POI en mono pequeño, provisional y de cara a dev; (b) label de arquetipo visible en claro ("Paraje natural" / "Ruina" / "Asentamiento" / "Lugar arcano"); (c) icono de arquetipo, el mismo de la vista de grid, a mayor tamaño; (d) texto de escena provisional, IDÉNTICO en los 720: "Aún no has explorado este lugar en detalle."; (e) fila de botones. Nada más. Sin HP de enemigo, sin recompensas anunciadas, sin contadores.
4. **Fondo de la escena**: tinte procedural derivado del colorHex de la región del grid + el arquetipo del POI. Sin assets, sin imágenes: sólo color, gradiente sobrio y a lo sumo textura generada por CSS. Los cuatro arquetipos deben distinguirse de un vistazo sin leer el label.
5. **Botones** (#93): `[Combatir]` `[Inspeccionar]` `[Salir]`. En POIs de arquetipo 'asentamiento', `[Combatir]` se sustituye por `[Hablar]` en estado disabled con motivo visible ("Disponible en H8") — los asentamientos no son hostiles. `[Salir]` es explícito y siempre está; Escape también sale (Q9 pedía botón explícito; el teclado es adicional, no sustituto).
6. **Semántica de los botones**: `[Inspeccionar]` marca el POI como revelado vía flow, sin combate, y el panel pasa a mostrar el texto de escena con el label ya visible. `[Combatir]` lanza el combate Lobo. `[Salir]` devuelve al grid con el zoom inverso. Entrar al POI ya marca revelado por sí solo (§9.9: la niebla cae al entrar).
7. **Cableado del combate**: al pulsar `[Combatir]`, transición de cámara del POI a "arena" (Q31c: un último zoom, no un corte seco) y monta la pantalla de combate existente. Al cerrar: victory → modal de loot existente → vuelta a la vista de POI con el POI marcado completado; fled → vuelta a la vista de POI sin loot y sin marcar completado; defeat → epitafio normal, flujo de muerte existente, sin tocarlo.
8. **Edge cases obligatorios** (#93): doble click en `[Combatir]` ignora el segundo, no encola ni relanza; un click durante cualquier animación de cámara la cancela y arranca la nueva, nunca se encola; recargar el navegador con la vista persistida en { kind:'poi' } devuelve al POI abierto SIN combate en curso (el combate no se serializa: es deuda declarada, no bug).
9. **Extensión del flow**: `world-flow.ts` gana enterPOI(poiId) y leavePOI(), que envuelven lookAt + revealPOI/completePOI y persisten. Ninguna mutación de estado ocurre en la vista: la vista llama al flow y repinta desde getState().
10. **Indicador de completado en la vista de grid**: un POI en estado 'completado' se distingue del meramente 'revelado' con una marca sutil (#91). Sin ámbar: completar un POI no es un hallazgo.

## Constraints
- NO tocar src/rules/* ni supabase/*. Sí puedes tocar: world-view.ts, world-flow.ts, main.ts, style.css, y crear tests. combat-view.ts sólo si el cableado lo exige, y mínimo.
- NO crear src/render/poi-view.ts ni ningún equivalente. Zoom continuo sobre la superficie existente (#83, #93). Proponer "pantalla de POI" separada es rechazo automático.
- NO modal a pantalla completa que tape el mundo entero. El cuestionario pedía modal (Q1a) y la decisión #93 lo revocó a favor del zoom: si tu lectura visual necesita ocultar el mundo, estás resolviendo el problema equivocado.
- El texto de escena es idéntico en los 720 POIs. NO distingas en pantalla curado de genérico: le dibujaría al jugador el mapa del contenido escrito a mano (#81).
- NO cablees la tirada d20 de exploración ni las tablas de 20 eventos de #92. Eso es 4f. Aquí `[Combatir]` dispara el Lobo directamente.
- NO construyas el campamento ni toques la home: es 4c.3. El POI del Hogar (sur-001-poi-1) en 4c.1 se comporta como cualquier POI de arquetipo asentamiento.
- NO construyas el menú de pausa: es 4c.2.
- TypeScript estricto. Sin emojis en código ni en copy. Copy provisional honesto, nunca narrativa final inventada.
- Accesibilidad: panel de escena con role y aria-label correctos, foco movido al panel al entrar al POI y devuelto al POI de origen al salir, botones operables por teclado, Escape sale. prefers-reduced-motion → transiciones ≤100ms en fade, sin zoom animado.
- 0 estados inválidos alcanzables: `[Combatir]` jamás disponible en asentamientos, jamás lanzable dos veces, jamás lanzable con el PJ muerto.

## Output format
- `src/render/world-view.ts` — modificado: tercer nivel de cámara + panel de escena.
- `src/state/world-flow.ts` — modificado: enterPOI(poiId), leavePOI().
- `src/main.ts` — modificado: retorno del combate a la vista de POI en vez de a home cuando el combate se entró desde un POI.
- `src/style.css` — modificado: bloque .world-view__poi-* .
- Tests: `src/state/world-flow.test.ts` ampliado (enterPOI/leavePOI, persistencia, idempotencia).

## Done when
- `npx vitest run` verde, incluidos los tests nuevos.
- `npx tsc --noEmit` limpio. `npx vite build` limpio.
- En pantalla: entrar a un grid → click en POI → entra con zoom continuo → panel de escena legible con los 4 arquetipos distinguibles sin leer el label → Combatir → combate Lobo → victoria → loot → de vuelta al POI, marcado completado → Salir → zoom inverso al grid, con el POI marcado.
- Recargar el navegador dentro de un POI devuelve al POI, sin combate en curso.
- Un asentamiento nunca ofrece Combatir.

## Out of scope
- Menú de pausa (4c.2). Campamento y home como POI (4c.3). Acciones por día (4d). Anclas y fast travel (4e). Tirada de exploración y tablas de 20 eventos (4f, #92). Contenido real de POIs (fase 2). Serialización del combate en curso (deuda declarada en #93).
```
