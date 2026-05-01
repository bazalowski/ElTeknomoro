# Pipeline H3 sub-paso 3b — prompt validado para impeccable

**Estado**: PASO 1 (Prompt Master) y PASO 2 (Director El Teknomoro) del MODOPIPELINE completados.
**Resultado**: APTO CON CAMBIOS. Director endureció 4 inexactitudes técnicas y 1 ruptura de Color-Means-Something.
**Próximo paso**: PASO 3 — invocar la skill `impeccable` con el prompt validado de abajo.
**Fecha de validación**: 2026-04-29.

---

## Para arrancar el chat nuevo

1. Abre chat nuevo en este mismo proyecto (cwd: `/home/bazalowski/ElTeknomoro`).
2. Lee este archivo.
3. Invoca la skill `impeccable` (vía herramienta Skill) pasando el prompt del bloque "Prompt validado" que sigue, literal.
4. Espera entregable de impeccable.
5. Al recibirlo, valida en navegador (`npm run dev`), corre `npm test` y `npx tsc --noEmit`.
6. Si todo verde y la pantalla es jugable, commit + push del 3b. Recordatorio operativo: commit y push siguen requiriendo OK explícito por separado.

---

## Estado del repositorio al cerrar este pipeline en el chat actual

- Rama `main` al día con `origin/main` (último commit `edc45df` — orquestador 3a).
- Tests: 257/257 verde.
- TypeScript: limpio.
- Sub-pasos cerrados de PASO 3: 3a (orquestador `src/state/combat-flow.ts`).
- Sub-pasos pendientes del PASO 3: 3b (esta pantalla), 3c (modal de loot), 3d (pantalla de epitafio), 3e (cableado home-view).

---

## Decisiones que el chat nuevo debe respetar (no reabrir)

- **D1** — Acciones del PJ en H3: `attack` + `dodge` + `use_item`. `use_skill` y `flee` grisadas.
- **D2** — DOM puro + SVG/CSS para dado. Cero Canvas en H3.
- **D-3a-1** — Heal de poción +6 HP fijo (provisional H5).
- **D-3a-2** — Dodge: status 'dodging' magnitud +2 al threshold del siguiente atacante, duración 1 turno.
- **D-3a-3** — Statuses del PJ viven en el closure del orquestador, NO en `Character`. La vista los deriva del log.
- **D-3a-4** — Solo `pocion_curacion_menor` válida en `use_item` para H3; el orquestador lanza error con cualquier otro item_id.
- **#60** — DEF del PJ es 3 (build A), threshold del lobo contra el PJ es 1. No reabrir `computeDefense`.
- **#61** — Principio macro: esqueleto > contenido > pulido. Copy provisional honesto, sin narrativa final.

---

## Prompt validado (entrégaselo a `impeccable` literal)

```
Diseña e implementa la pantalla de combate H3 de El Teknomoro como vista única persistente DOM puro + SVG/CSS para animación de dado. Cero Canvas. Esta es la primera pantalla de combate del juego, sub-paso 3b del Hito 3, y es la superficie más densa hasta la fecha.

## Contexto (carry forward)
- Proyecto: El Teknomoro, RPG web con permadeath. PRODUCT.md y DESIGN.md son autoritativos.
- Register: product (no brand).
- Tokens cerrados en DESIGN.md: paleta OKLCH orgánica (verdes pantano/musgo, violeta coagulado raro ≤5%, ámbar enfermo de hallazgo, rojo óxido de peligro, neutros tinta-tierra). Tipografía Cormorant Garamond / Inter / JetBrains Mono.
- Reglas inviolables: Numbers-In-Mono, Color-Means-Something, Arcane-Restraint, Inverted-Amber, Display-Is-Sacred, Flat-By-Default, No-Glow.
- Patrón H2 disponible (no obligatorio aquí): tres ejes ortogonales hover/focus/disabled, inset ring para selección, outline 2px hueso-descolorido para focus, fondo tinta-tierra-baja → media en hover, botón Salir top-right con confirmación modal sobria (una frase, dos botones, sin glow, patrón §5.7).
- Combate NO es flow lineal. Es vista única que muta. Ruptura limpia con shell `.h2-flow__step` de H2.

## Estado de partida
- Orquestador `src/state/combat-flow.ts` cerrado y testeado (12 tests verde, 257/257 suite global).
- Contrato del handle:
  - `getState()` → CombatState con character + enemies (EnemyState[]) + turn_order + current_turn_index + status ('ongoing'|'victory'|'defeat'|'fled').
  - `getLog()` → CombatLogEntry[] completo.
  - `consumeLogTail()` → CombatLogEntry[] nuevos desde la última lectura, cursor incremental.
  - `submitAction(action)` → aplica acción del PJ y encadena turnos enemigos automáticamente hasta volver al turno del PJ o cerrar combate.
  - `isCharacterTurn()` → boolean.
  - `isOngoing()` → boolean.
- Acciones soportadas: `attack` (con target_instance_id), `dodge`, `use_item` (con slot_index, **sólo `pocion_curacion_menor` válido en H3 — el orquestador lanza error con cualquier otro item_id**). `use_skill` y `flee` lanzan error en H3 — la vista los muestra grisados, nunca los dispara.
- CombatLogEntry kinds (discriminated union de 9): combat_start, turn_start, attack_resolved, dodge_applied, item_used, status_expired, loot_resolved, loot_dropped, combat_end. Cada kind trae los datos necesarios para renderizar (rolls de d6, éxitos, threshold, daño, crítico, statuses, etc.).
- **Statuses del PJ NO viven en `CombatState.character` (D-3a-3 del orquestador).** La vista deriva los statuses activos del PJ leyendo el log: `dodge_applied` activa "Esquivando · N", `status_expired` con `actor === 'character'` lo retira. La vista mantiene su propio espejo local; no añade getter al handle.
- Datos cerrados: Lobo del Bosque (data/enemies.ts, threshold 1 contra el PJ por decisión #60, stat-line completa en simulaciones/lobo-v0.1.md), Daga inicial equipada main_hand (data/items.ts, FUE+0), Poción de curación menor (data/items.ts, +6 HP fijo en orquestador D-3a-1).
- La pantalla NO persiste. El orquestador llama `onEnd(result)` y el caller (main.ts) dispara `saveCharacter`. La vista solo consume estado.

## Tarea
Crea `src/render/combat-view.ts` y un bloque CSS dedicado en `src/style.css` que renderice toda la pantalla de combate consumiendo el handle del orquestador 3a. La pantalla debe ser jugable end-to-end en navegador al cerrar este sub-paso.

## Estructura interna requerida
1. **Panel PJ:** retrato/swatch (mismo lenguaje placeholder que H2.1, sin sprite real), nombre del personaje, HP actual / max en mono con tabular-nums, gold en mono, arma equipada (nombre + daño), lista de statuses activos derivados del log con turnos restantes (ej: "Esquivando · 1"). Los statuses se renderizan como chips en mono dentro del panel, **sin hue dedicado** (luminancia + label, mismo patrón austero que el resto del flow H2; NO usar verde-pantano como "vida activa", esa asociación rompe Color-Means-Something).
2. **Panel enemigo:** swatch placeholder (sin sprite, mismo lenguaje que portrait H2 pero coloreado con verde-pantano para reforzar "naturaleza vencedora", uso semántico válido: el enemigo ES mundo orgánico hostil), nombre del enemigo, HP actual / max en mono. Si hay varios enemigos (combate puede tener 1 o N), todos visibles en columna o grid.
3. **Timeline de turnos arriba:** los próximos 8 turnos como iconos horizontales (placeholder PJ vs swatch enemigo), con marca clara del turno actual. Densidad alta, panel técnico.
4. **Log lateral persistente** (no modal): texto + dados de cada tirada en mono. Cada CombatLogEntry se renderiza con su sintaxis específica, **leyendo los valores reales del entry, sin hardcodear ejemplos**:
   - `attack_resolved` (PJ): "Atacas a <enemy>. Pool <pool>d6 → [<rolls>] → <successes> éxitos vs umbral <threshold>. <Impacto|Fallo>. +<margin> margen. <damage> daño." Renderiza los rolls como mono con tabular-nums.
   - `attack_resolved` (enemigo) con `critical: true`: enmarcado en rojo-óxido-enfermo, con shake breve del panel afectado.
   - `dodge_applied`: "Te preparas para esquivar. +<magnitude> al umbral del próximo ataque enemigo durante <duration> turno."
   - `item_used` con poción: "Usas Poción de curación menor. +<heal_amount> HP. (HP: <prev>/<max> → <after>/<max>)."
   - `status_expired`: "Esquiva expirada." (entrada plana, sin animación).
   - `loot_resolved` y `loot_dropped`: **render plano como entrada de log, sin modal, sin UI especial.** El modal de loot real entra en 3c. En 3b basta con "Botín: <gold> oro, <items>." y "Drop perdido: <item> ×<qty> (inventario lleno)."
   - `combat_end`: "Has matado al <enemy>." o "Has caído ante <enemy>."
   - Botón discreto "Copiar última tirada" (cumple biblia §4.8 "Última tirada copiable"): copia al portapapeles el último `attack_resolved` formateado como texto plano.
5. **Botones de acción abajo:** Atacar / Esquivar / Item / Habilidad (grisado) / Huir (grisado). Tres ejes ortogonales (hover, focus, disabled). Atacar abre selección de target (clic directo sobre enemigo o Tab para ciclar). Item abre selección de **pociones disponibles** del `inventory.slots` filtrando por `item_id === 'pocion_curacion_menor'` (resto de items en inventario no se muestran como opción en H3).
6. **Animación de dado SVG/CSS:** al disparar un attack, render de N rectángulos d6 con caras finales animadas con shake breve (≤500ms, ease-out exponencial, sin bounce, sin elastic). Los del PJ siempre se animan paso a paso. Los del enemigo se animan también pero rápido (~250ms total, ease-out exponencial), con visual de "el lobo tira" en el panel del enemigo. Un solo registro de motion para toda la pantalla; nada coreografiado.
7. **Crítico diferenciado** por color rojo-óxido-enfermo + shake breve del panel afectado (sin glow, sin partículas, sin gradient overlay; respeta No-Glow Rule).
8. **Estado de fin de combate:** placeholder provisional. Mensaje sobrio centrado tipo "Has caído." o "El lobo está muerto." con botón provisional "Volver" que invoca `onEnd` callback. Loot real (3c) y epitafio real (3d) entran en sub-pasos siguientes; en 3b las entradas `loot_resolved`/`loot_dropped` aparecen sólo como líneas planas del log.
9. **Botón Salir top-right** con confirmación modal sobrio (patrón DESIGN §5.7: una frase, dos botones, sin glow, sin glassmorphism, sin emoji). Texto provisional "Salir del combate" — copy final lo cierra Bazalo después.

## Constraints
- DOM puro. NO Canvas.
- TypeScript estricto. Sin emojis en código ni en copy.
- NO tocar `src/rules/*`, `src/data/*`, `src/state/combat-flow.ts`, `src/backend/*`.
- NO escribir narrativa final. Copy provisional honesto (PRODUCT §Design Principles 5).
- Botones de acción se deshabilitan cuando `!isCharacterTurn()` o `!isOngoing()`. 0 estados inválidos posibles desde la UI.
- Cuando un enemigo muere, se desmarca como target válido (su panel queda en estado "muerto" visualmente atenuado, opacity reducida, sin chrome de error).
- Animación de dado respeta motion-friendly: ease-out exponencial, sin bounce, sin elastic. Si `prefers-reduced-motion` está activo, las animaciones se reducen a fade simple ≤100ms (aditivo, no requerido por scope pero alineado con espíritu PRODUCT §Accessibility).
- Heredar tokens DESIGN.md: HP, gold, daño, threshold, dados, modificadores SIEMPRE en JetBrains Mono con tabular-nums. Texto narrativo del log en Inter. Ningún momento Cormorant en esta pantalla (combate no es momento narrativo de peso; el momento de peso será el epitafio en 3d).
- Crítico usa rojo-óxido-enfermo (Color-Means-Something: rojo = peligro/daño). **Esquiva activa NO usa hue dedicado**; se comunica con chip de status en mono dentro del panel PJ (luminancia + label). Verde-pantano queda reservado al swatch del enemigo (mundo orgánico hostil).
- Sin violeta arcano (combate no es evento arcano). Sin ámbar (no hay hallazgo en 3b; el loot real con ámbar entra en 3c).
- **No hardcodear números de ejemplo (HP, pool, threshold, rolls).** Los ejemplos del prompt son ilustrativos; los valores reales salen del `CombatLogEntry` consumido. Decisión #60 fija threshold del lobo contra el PJ en 1; el pool del PJ con Daga ronda 2-3 para un personaje recién creado. Cualquier fixture o ejemplo en código debe leer del log real, no inventar.

## Output format
- Archivo `src/render/combat-view.ts` con función exportada `renderCombatView(root: HTMLElement, handle: CombatFlowHandle, onEnd: (result: CombatResult) => void): void`. La firma exacta se ajusta al contrato del orquestador 3a.
- Bloque CSS dedicado en `src/style.css` con prefijo `.combat-view`. No reescribir bloques existentes.
- Ningún cambio en `main.ts` ni en otros render — el cableado de entrada es sub-paso 3e.
- Para probar manualmente, añade comentario en cabecera de combat-view.ts con instrucciones cortas: "Para probar: en main.ts importa renderCombatView y arranca con un Character creado vía createCharacter + un EnemyState del lobo del catálogo." Ningún cableado real en main.ts.

## Done when
- `npm test` 257/257 verde (no se rompe nada).
- `npx tsc --noEmit` limpio.
- En `npm run dev`, si Bazalo cablea manualmente la vista a un personaje + lobo, el combate es jugable: ataca, ve dados animarse, ve HP bajar, ve turno enemigo, repite hasta cerrar. Botones se deshabilitan correctamente cuando no es turno del PJ.
- Crítico se distingue visualmente. Statuses activos del PJ derivados del log son visibles. Timeline refleja el orden real. Log copiable.
- Sin emojis. Sin glow. Sin gradientes. Sin Canvas. Sin verde-pantano para "esquiva". Sin números hardcodeados que contradigan decisión #60.

## Out of scope (no ahora)
- Modal de loot post-combate (sub-paso 3c).
- Pantalla de epitafio (sub-paso 3d).
- Cableado en home-view "Entrar al yermo" (sub-paso 3e).
- Sprites de enemigo, audio, partículas (fase 3 pulido).
- Persistencia (la dispara main.ts via onEnd).

Lee primero: `src/state/combat-flow.ts`, `src/state/combat-flow.test.ts`, `src/rules/combat.ts`, `src/data/enemies.ts`, `src/data/items.ts`, `simulaciones/lobo-v0.1.md` (para entender los números reales del primer combate), `DESIGN.md` §2-5, `PRODUCT.md`, `src/style.css` (bloque h2-* para entender el lenguaje), un par de archivos `src/render/h2-*.ts` para tono y patrón.

Solo construye lo pedido. No añadas features extras, abstracciones especulativas, ni modos alternativos. Placeholder honesto donde el sub-paso lo permita.
```

---

## Cambios que el director introdujo (resumen para futuros chats)

1. **Pool del PJ inflado**: el ejemplo "Pool 6d6" corregido a referencia genérica `<pool>d6`. El prompt original siembra una expectativa numérica falsa (PJ recién creado con Daga FUE+0 tira pool ≈ 2-3, no 6).
2. **Threshold contradiciendo decisión #60**: ejemplo "umbral 3" sustituido por `<threshold>` genérico. La decisión #60 fija threshold del lobo contra el PJ en 1.
3. **Statuses del PJ**: el prompt pedía mostrarlos pero asumía que vivían en `CombatState`. D-3a-3 dice que viven en el closure del orquestador. La vista los deriva del log (`dodge_applied` y `status_expired`).
4. **`use_item` endurecido**: el orquestador sólo acepta `pocion_curacion_menor` en H3. La vista filtra el inventario por ese id específicamente.
5. **Ruptura de Color-Means-Something**: "esquiva en verde-pantano" sustituido por chip de status en mono sin hue dedicado. Verde queda reservado al swatch del enemigo (mundo orgánico hostil).
6. **Salir top-right**: contrato del modal cerrado explícito (DESIGN §5.7: una frase, dos botones, sin glow).
7. **Animación enemigo**: unificada a ease-out ≤250ms (no opcional vs bloque directo).
8. **Reduced-motion**: marcado como aditivo no requerido por scope.
9. **Loot en 3b**: `loot_resolved`/`loot_dropped` aparecen sólo como líneas planas del log, sin modal. Modal real en 3c.

---

## Siguiente paso operativo (chat nuevo)

1. Lee este archivo.
2. Invoca `Skill` con `skill: "impeccable"` y el prompt validado de arriba.
3. Cuando impeccable termine, valida en navegador. Si Bazalo da OK, commit y push del 3b.
4. Después siguen 3c (modal loot), 3d (epitafio), 3e (cableado home), bump biblia v0.18, push final del Hito 3.
