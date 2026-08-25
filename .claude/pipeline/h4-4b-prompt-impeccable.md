# Pipeline H4 sub-paso 4b — brief UI (PASO 1)

**Estado**: PASO 1 compilado (rol Prompt Master ejecutado por el orquestador de sesión — la skill `prompt-master` no está instalada en esta máquina; desviación avisada a Bazalo y aceptada al elegir carril A). OK de Bazalo al brief: 2026-05-06. PASO 2: **APTO CON CAMBIOS** (director, agentId aaccf319bbefc323b) — 2 ediciones aplicadas abajo (costura de coste en travelTo; retrato miniatura como marcador del PJ en vista de grid), D-4b-p1/p2/p3 aceptadas. Matiz del director: "Acercar" ejecuta inmediato, sin confirmación — la confirmación es exclusiva del viaje. Siguiente: PASO 3 (impeccable).
**Carril**: A (cadena completa) por orden de Bazalo, aunque las decisiones estén cerradas.
**Fecha**: 2026-05-06.
**Fuentes**: biblia v0.23 (#83, #85, #86, #87, #88, #89, #90, #91), DESIGN.md, PRODUCT.md, repo en `91aa020`.

## Micro-decisiones tomadas al compilar (para veredicto del director, no de impeccable)

- **D-4b-p1** — Gesto de "mirar de cerca" un grid: click selecciona (highlight + panel de info), y desde la selección un botón **"Acercar"** hace el zoom semántico a vista de grid. "Viajar aquí" es botón separado. Cubre Q18b + #88 sin inventar doble-click.
- **D-4b-p2** — Botón **"Hogar"** (volver a la pantalla home) visible solo cuando `currentGridId === 'sur-001'`. El home es un lugar (#85), no un menú global; en 4b esto lo respeta sin construir el campamento (4c).
- **D-4b-p3** — Los POIs no tienen campo `name` en datos. POI revelado muestra **etiqueta de arquetipo provisional** ("Paraje natural" / "Ruina" / "Asentamiento" / "Lugar arcano") + id en mono pequeño. El Hogar muestra "El Hogar". Copy provisional honesto (#61).

---

## Prompt validado (entrégaselo a `impeccable` literal tras el PASO 2)

```
Diseña e implementa la vista de mundo de El Teknomoro (sub-paso 4b del Hito 4): vista regional de 180 grids + zoom continuo a vista de grid con 4 POIs. Es la primera pantalla del overworld del juego. DOM + SVG, cero Canvas.

## Contexto (carry forward)
- Proyecto: El Teknomoro, RPG web con permadeath. PRODUCT.md y DESIGN.md son autoritativos. Register: product.
- Tokens DESIGN.md que aplican: neutros tinta-tierra (humeda 14%/baja 20%/media 28% OKLCH), corteza-palida para bordes/secundario, hueso-descolorido para texto, verde-musgo/verde-pantano solo con semántica "mundo orgánico", ámbar solo hallazgo, rojo-óxido solo peligro, violeta arcano ≤5% de pantalla y solo si lo arcano interviene.
- Reglas inviolables: Numbers-In-Mono (tabular, no en prosa inline), Color-Means-Something, Arcane-Restraint, Inverted-Amber, Display-Is-Sacred, Flat-By-Default, No-Glow, No-Pure-Black-No-Pure-White.
- Tipografía: Cormorant Garamond display / Inter cuerpo / JetBrains Mono números de reglamento.
- La cabecera de la vista dice "Terra" (nombre canónico del mundo). Puede ir en serif display a tamaño moderado — el primer vistazo al mundo es momento narrativo legítimo — pero sin competir con la pantalla de muerte. Tu criterio dentro de Display-Is-Sacred.
- Patrón de interacción heredado (H2/H3, no obligatorio): tres ejes ortogonales hover/focus/disabled, outline 2px hueso-descolorido para focus, confirmación modal sobria patrón §5.7.

## Estado de partida (todo en main, commit 91aa020, 475/475 tests verde)
- `src/rules/world.ts` (SAGRADO, no tocar): dataset validado al cargar. Selectores: getAllRegions() (5 regiones con id, displayName, colorHex), getAllGrids() (180, con position {x,y} global, x∈[-6,15], y∈[0,14], convención canvas y-abajo), getGridsByRegion, getGrid, getPOIsByGrid (4 por grid, con archetype y position local 0..4), getCardinalNeighbours, areGridsAdjacent, getStartingGrid ('sur-001'), getHomePOI ('sur-001-poi-1'), WORLD_CIFRAS (miniGridSize 5, playerCell {2,2}, homePOIId).
- Nombres canónicos de región (usar estos, no los cardinales): Cuenca Central, Estepas del Norte, Marismas del Sur, Bosques del Este, Costa del Oeste.
- colorHex por región en regiones.json (marrones/azules/verdes provisionales). Son DATO, no token: pinta los rellenos de grid con colorHex tal cual, marcado PROVISIONAL. No inventes paleta de regiones en CSS; el chrome de UI sí usa tokens DESIGN.
- `src/rules/world-state.ts` (SAGRADO, no tocar): WorldState puro { currentGridId, view, gridStates, poiStates, anchors, day, actionsSpent }. Funciones: createInitialWorldState, getGridState ('inexplorado'|'explorado'|'controlado'), getPOIState (null|'revelado'|'completado'), canTravelTo (solo vecinos cardinales), moveToGrid (mueve + marca explorado; no-op si ilegal), setView, hydrateWorldState.
- `src/backend/characters.ts`: loadWorldState() → WorldState hidratado; saveWorldState(ws) → persiste en save_slots.world_state (slot 0).
- `src/main.ts`: modos 'auth'|'home'|'h2-flow'|'combat'. home-view emite HomeIntent ('create-character'|'enter-wilds'|'create-new-after-death'); 'enter-wilds' arranca el combate Lobo vía startCombatRun. Character.tutorial_lobo_completed existe pero HOY NADIE LO ESCRIBE.

## Tarea
Crea la vista de mundo (regional + grid, zoom continuo) y cablea su entrada desde home. Al cerrar el sub-paso, un PJ con el Lobo superado pulsa "Salir al mundo", ve Terra, viaja a grids adyacentes, acerca la cámara a cualquier grid, ve sus POIs bajo niebla, y al recargar el navegador sigue donde estaba.

## Estructura interna requerida
1. **Orquestador `src/state/world-flow.ts`** (patrón combat-flow): factory que recibe { initialState: WorldState, persist: (ws: WorldState) => Promise<void> } y expone getState(), travelTo(gridId), lookAt(view), goHome-check. Toda mutación pasa por las funciones puras de rules/world-state.ts. Persiste fire-and-forget tras travelTo y tras cambio de vista (console.error si falla, sin bloquear UI). Testeable con persist fake. `travelTo(gridId)` es el único punto por el que pasa cualquier viaje; deja el hueco del coste §9.7 documentado en la firma (comentario + tipo de retorno que 4d pueda ampliar, o parámetro opcional de política con default gratis). Sin lógica de coste: solo la costura (#88).
2. **Vista `src/render/world-view.ts`**: función renderWorldView(root, deps) donde deps = { flow, character, onExitToHome }. Un solo SVG con los 180 grids (rect por grid, Q6a); la vista de grid es la MISMA superficie con camera transform (scale+translate CSS/SVG, Q30a), no una pantalla aparte. Estado interno de cámara: 'region' | grid enfocado.
3. **Vista regional**: rects con fill = colorHex de su región. Estados: inexplorado opacity 40%, explorado pleno, controlado borde marcado (estilo listo aunque hoy ningún grid lo tenga). Etiquetas leves con displayName por región (no cardinales). Marcador del PJ: círculo sólido con anillo, en su grid exacto. Sin borde de mundo: el fondo tinta-tierra es el "fuera". Sin contador de progreso.
4. **Cámara ≠ viaje (#88, crítico)**: pan con drag y zoom manual con rueda, gratis, sin límites de gameplay, sobre cualquier grid. Click en grid = SELECCIÓN (highlight + panel/tooltip), nunca movimiento. Desde la selección: botón "Acercar" (zoom semántico a vista de grid, siempre disponible) y botón "Viajar aquí" (solo si areGridsAdjacent con el grid del PJ; si no, ausente o disabled con motivo). Viajar llama flow.travelTo y NO cuesta nada todavía (4d cablea el coste).
5. **Tooltip/panel de selección graduado por estado (§9.9)**: inexplorado → región + "Inexplorado", nada más. Explorado → región + estado + "N/4 POIs revelados". Controlado → lo anterior + marca de ancla. JAMÁS conteo de POIs en un grid inexplorado.
6. **Vista de grid (zoom in)**: mini-grid 5×5; los 4 POIs en sus position del dataset; celda (2,2) reservada al PJ cuando está en ese grid (posición libre, no sobre un POI). El PJ en (2,2) se pinta con su retrato en miniatura (placeholder actual de portraits.ts: cuadrado de color + label), no con el círculo+anillo de la regional (#91/Q28). Icono SVG inline distinto por arquetipo (natural/ruina/asentamiento/arcano), trazo sobrio, sin emoji. Niebla por POI: no revelado → silueta atenuada + "???"; revelado → icono pleno + etiqueta provisional de arquetipo ("Paraje natural", "Ruina", "Asentamiento", "Lugar arcano") + id en mono pequeño; el Hogar → "El Hogar". Completado → indicador sutil (sin ámbar salvo que sea hallazgo real; no lo es). Click en POI: solo selección/tooltip — entrar al POI es 4c. Fondo del grid: tinte procedural derivado del colorHex de la región, sutil.
7. **Zoom continuo**: 200-300ms, ease-out, transform-only. Click en otro grid durante la animación: se cancela y arranca la nueva. prefers-reduced-motion → fade ≤100ms. Sin librería de animación.
8. **Volver**: desde vista de grid, botón/gesto para alejar a regional (mismo zoom inverso). Desde regional, botón "Hogar" visible SOLO si el PJ está en sur-001 → onExitToHome (la home sigue siendo pantalla aparte, #87). Botón "Salir" de sesión NO va aquí (vive en home).
9. **HUD mínimo**: chip fijo con nombre del PJ, HP actual/max en mono, nivel. Nada más: sin contador de acciones (4d), sin día, sin números falsos.
10. **Cableado en `src/main.ts` + `src/render/home-view.ts`**: (a) al cerrar combate con victory, poner character.tutorial_lobo_completed = true antes de persistir (2 líneas en el onEnd existente); (b) home con PJ vivo y tutorial_lobo_completed=true cambia el botón primario a "Salir al mundo" → nuevo HomeIntent 'exit-to-world' → modo 'world': loadWorldState() → world-flow → renderWorldView; (c) PJ vivo sin tutorial: botón sigue siendo "Entrar al yermo" → combate Lobo, como hoy (el salto con coste #86 entra en 4c); (d) transición home→mundo: fade 300ms.

## Constraints
- NO tocar src/rules/* ni supabase/*. Sí puedes tocar: main.ts, home-view.ts, style.css, y crear world-flow.ts + world-view.ts (+ tests).
- Zoom continuo, NO router de pantallas por nivel (#83: si propones "pantalla regional + pantalla de grid" separadas, es rechazo automático).
- TypeScript estricto. Sin emojis en código ni copy. Copy provisional honesto, sin narrativa final.
- SVG accesible: grids focusables con teclado (Tab/flechas es plus, no requisito), aria-label con región+estado, selección operable sin ratón al menos vía focus+Enter.
- Decoración de bioma: sutil y derivada SOLO de los cinco displayName (marisma, estepa, bosque, costa, cuenca). No inventes lore, no dibujes criaturas ni hitos concretos.
- Pan/zoom de cámara no persisten; la vista semántica (region/grid) sí, vía flow (el jugador reabre donde estaba, #90).
- 0 estados inválidos alcanzables: "Viajar aquí" jamás ejecutable hacia un grid no adyacente; canTravelTo es la única fuente de legalidad.

## Output format
- src/state/world-flow.ts + src/state/world-flow.test.ts (persist fake; cubre: travel legal/ilegal, persist llamado, vista persistida).
- src/render/world-view.ts con export renderWorldView(root: HTMLElement, deps: {...}): void. Firma exacta ajustada a lo que main.ts necesite.
- Bloque CSS nuevo en src/style.css con prefijo .world-view. No reescribir bloques existentes.
- Ediciones mínimas en main.ts y home-view.ts según punto 10.

## Done when
- npm test verde completo (475 actuales + los nuevos). npx tsc --noEmit limpio. (vite build lo verifica Bazalo: esta máquina tiene Node 18 y Vite 8 pide 20+.)
- Flujo manual: crear PJ → ganar al Lobo → home muestra "Salir al mundo" → Terra visible con 180 grids, 179 atenuados y sur-001 pleno → seleccionar vecino → "Viajar aquí" → el marcador se mueve y el grid se enciende → "Acercar" sobre un grid lejano funciona (mirar es gratis) pero no ofrece viaje → recargar navegador → misma posición y vista.
- Un grid inexplorado jamás enseña cuántos POIs esconde. La celda (2,2) jamás tiene POI encima.
- Sin glow, sin gradientes decorativos, sin Canvas, sin librería de animación, sin colores de región inventados en CSS.

## Out of scope (no ahora)
- Vista de POI, entrar a POIs, combate desde POI, saltar tutorial con coste (#86) → 4c.
- Campamento, pausa global, "Descansar", cambio de slot → 4c.
- Acciones por día, coste de viaje, acampar → 4d. Anclas y fast travel → 4e. Tirada de exploración → 4f.
- Arte final de biomas, fondos a mano, música/SFX.
```
