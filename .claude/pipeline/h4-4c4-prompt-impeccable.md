# Pipeline H4 sub-paso 4c.4 — brief UI (PASO 1, carril B)

**Estado**: PASO 1 compilado. **PASO 2: APTO CON CAMBIOS** (director) — 7 ediciones aplicadas, D-4c4-p1..p4 aceptadas. Endurecimientos del pase 4c.4.0 aplicados antes del PASO 3. Deuda documental derivada: decisión **#97** (matización de §8.2 + acotamiento de la "galería de epitafios" de #94), que no bloquea. **PASO 3: ejecutado** (impeccable, register product). 534/534 tests, `tsc` y `vite build` limpios, detector sin hallazgos nuevos. Verificación visual pendiente de Bazalo.
**Carril**: B (2 pasos: director → impeccable).
**Fecha**: 2026-08-26.
**Fuentes**: biblia v0.25 (#10, #11, #44, #65, #87, #94, #95, #96), §8.1, §8.2, DESIGN.md, PRODUCT.md, repo en `a10acf6` (el pase 4c.4.0 ya está en `main`).
**Cierra**: 4c. Es el último sub-paso, y la deuda que #95 difirió al sacar "Cambiar de personaje" del campamento.

## Micro-decisiones tomadas al compilar (para veredicto del director)

- **D-4c4-p1 — Tres PJ vivos a la vez son legales.** #10 cierra "un personaje por slot de partida" y §8.2 da 3 slots por usuario; la guarda `CharacterAlreadyAliveError` de `saveCharacter` ya es **por slot**, no por usuario. Así que tres runs paralelas son el diseño, no un efecto colateral: el jugador puede tener un PJ vivo en cada slot. Nada se comparte entre ellos — el `world_state` cuelga del slot (#90) y entre runs no hereda nada (C3b de #85).
- **D-4c4-p2 — El slot activo es estado de sesión, no de partida.** No se persiste "qué slot estaba jugando" en ningún sitio: se elige en el Menú principal cada vez que entras. Persistirlo en `localStorage` sería adivinar por el jugador cuál de sus tres partidas quiere seguir, y el coste de equivocarse (entrar a la run que no era) es peor que el de un click.
- **D-4c4-p3 — La lápida se lee slot a slot, no en una galería.** #11 pide epitafio consultable y #94/Q13 lo puso en el Menú principal. Con tres slots, cada uno enseña el suyo en su propia tarjeta. No se construye una galería histórica de todos los PJ caídos: el slot guarda **un** epitafio, el del último PJ que cayó ahí, y crear uno nuevo encima lo sustituye. Razón, no inercia: #65 enumera de forma cerrada qué sobrevive entre runs y el historial de epitafios no está en la lista, así que acumularlos sería herencia entre runs, contra C3b de #85. §4.9 ("el slot no se borra") pide que la muerte no evapore al PJ, no que el slot quede inutilizable para siempre. La "galería de epitafios" que #94 nombra de pasada es una referencia suelta sin decisión detrás; si algún día existe, es meta-progresión de H8.
- **D-4c4-p4 — Backend en pase previo (4c.4.0), sin pipeline.** Las seis funciones de `backend/characters.ts` tienen `slot_index: 0` escrito a mano. Parametrizarlas es trabajo de backend, que por contrato del pipeline va por director directo. Se entrega antes del prompt para que impeccable reciba una API que ya sabe de slots.

---

## Prompt (entrégaselo a `impeccable` literal tras el PASO 2)

```
Convierte el Menú principal de El Teknomoro en un selector de tres partidas (sub-paso 4c.4 del Hito 4). DOM, cero Canvas. Cierra el Hito 4 sub-paso 4c.

## Contexto (carry forward)
- Proyecto: El Teknomoro, RPG web con permadeath. PRODUCT.md y DESIGN.md autoritativos. Register: product.
- Tokens: neutros tinta-tierra (humeda 14% / baja 20% / media 28% OKLCH), corteza-palida bordes y texto secundario, hueso-descolorido texto, hueso-claro énfasis, verde-musgo/verde-pantano sólo semántica "mundo orgánico", ámbar sólo hallazgo real, rojo-óxido sólo peligro real, violeta arcano <=5% y sólo si lo arcano interviene.
- Reglas inviolables: Numbers-In-Mono, Color-Means-Something, Arcane-Restraint, Inverted-Amber, Display-Is-Sacred, Flat-By-Default, No-Glow, No-Pure-Black-No-Pure-White. Sin emojis. Sin em dashes en copy.
- Tipografía: Cormorant Garamond display (momentos narrativos contados) / Inter cuerpo / JetBrains Mono números de reglamento.
- Tono (#47): post-humano, naturaleza vencedora, esoterismo raro y reverencial.
- PRODUCT §4: densidad sobre amabilidad. El público objetivo prefiere una ficha densa y legible a una "amigable" con aire decorativo.

## Estado de partida (main en a10acf6, 534/534 tests verde, tsc y build limpios)
- `src/render/home-view.ts` es hoy el Menú principal de UN slot implícito. Tres ramas (`empty` / `alive` / `fallen`), un botón primario, una vía secundaria para saltarse el tutorial (#96) y una entrada de Opciones que monta `options-panel.ts`. La rama `fallen` ya pinta la lápida leyendo `character.epitaph`.
- `src/backend/characters.ts` (pase 4c.4.0, YA entregado): todas las funciones aceptan `slotIndex`. Hay además `loadSlots()` que devuelve el resumen de los tres de una sola consulta.
- `src/render/options-panel.ts`: panel de opciones con dos puntos de montaje. No lo rediseñes.
- `src/main.ts`: modos 'auth' | 'home' | 'h2-flow' | 'combat' | 'world'. Sabe qué slot está activo y lo pasa a cada llamada de backend.
- `src/render/confirm-modal.ts`: `showConfirmModal` con casilla opcional en modo 'gate' (bloquea el botón destructivo hasta marcarla) y `danger`. Úsalo, no escribas otro modal.

## Tarea
El Menú principal pasa de gestionar una partida a gestionar tres. Al cerrar el sub-paso, el jugador ve sus tres slots de un vistazo, entra a cualquiera de ellos, y el Menú principal ofrece por fin las tres opciones que §8.1 exige.

## Estructura interna requerida
1. **Tres slots visibles a la vez**, no un selector desplegable ni un carrusel. El jugador tiene que poder comparar sus tres partidas de un vistazo: es la pantalla donde decide a cuál vuelve. Cada slot es una unidad de lectura con su propio estado y su propia acción.
2. **Tres estados por slot, con contenido distinto en cada uno**:
   - **Vacío**: invitación a crear. Acción: Nueva partida.
   - **Vivo**: nombre, arquetipo, nivel y HP en mono tabular. Acción primaria: Cargar partida. Si el PJ no ha hecho el tutorial (`tutorial_lobo_completed === false`), este slot conserva las DOS vías de #96 con su copy de coste, exactamente como funcionan hoy: no las pierdas al repartir por slots.
   - **Caído**: la lápida. Nombre, arquetipo, nivel, causa y fecha, con el peso visual que ya tiene hoy — es el momento narrativo de la pantalla y #11 lo hace consultable a propósito. El contenido del slot **es** el epitafio: "Nueva partida" existe en la tarjeta pero **no es su acción visualmente primaria**. Un botón de reutilizar dominando una lápida convierte al PJ caído en un hueco libre, y es exactamente así como se diluye la gravedad de la muerte (PRODUCT §3, #11), no por tener tres slots.
3. **Crear encima de un caído es irreversible y se confirma** con `showConfirmModal` en modo 'gate': el epitafio de ese slot desaparece para siempre. PRODUCT §3 exige confirmar lo irreversible; #11 hace del epitafio algo que el jugador ha ganado, así que borrarlo sin avisar es tirarle memoria a la basura. Crear en un slot vacío NO se confirma: no hay nada que perder.
4. **La jerarquía no es uniforme.** Tres tarjetas idénticas repitiendo el mismo patrón es exactamente lo que DESIGN prohíbe. Un slot vivo pesa más que uno vacío, y un caído se lee distinto de los dos: son tres contenidos distintos, no tres instancias del mismo componente.
5. **Opciones** sigue siendo la tercera entrada del Menú principal (§8.1), fuera de los slots: es global, no de una partida. Las otras dos de §8.1 ("Nueva Partida" y "Cargar Partida") se satisfacen **como acción de cada slot**, NO como un par de botones globales encima de la rejilla: con tres partidas, "Cargar" sin decir cuál no significa nada. Esta pantalla es además la "pantalla de Cargar Partida" desde la que §4.9 da acceso al epitafio.
6. **Los mensajes heredados hablan de un solo PJ y ahora mienten.** `h2-confirm-view.ts` responde hoy al `CharacterAlreadyAliveError` con "Ya tienes un personaje vivo. Solo se permite uno a la vez."; con tres slots legales eso es falso y pasa a hablar del slot concreto. Ese error puede llegar al FINAL de la creación (otra pestaña ocupó el slot mientras el jugador creaba su PJ): tiene que ser recuperable y explicar qué pasó, no un callejón sin salida sobre cinco minutos de trabajo. Y cargar un slot cuyo PJ murió en otra pestaña no puede rebotar al menú en silencio como hace hoy `main.ts`: §8.2 promete los slots desde cualquier dispositivo, así que esta carrera es visible. El menú se repinta con el estado real y lo dice.
7. **Sin numeración decorativa.** Si un slot vacío no dice nada más que "vacío", no necesita el rótulo "Slot 2" encima; el jugador identifica sus partidas por el personaje que hay dentro, no por el índice. Usa el índice sólo donde desambigüe de verdad (dos slots vacíos, aria-labels).

## Constraints
- NO tocar src/rules/* ni supabase/*. Sí: home-view.ts, main.ts, h2-confirm-view.ts (sólo el copy del error), style.css, tests. De world-view.ts sólo se toca la cadena de confirmación de "Reset run", que con tres slots debe nombrar qué partida se está borrando.
- NO construyas una galería de todos los PJ caídos: cada slot guarda un epitafio, el del último que cayó ahí (D-4c4-p3).
- NO persistas qué slot se jugó por última vez (D-4c4-p2): se elige cada vez.
- NO añadas ninguna acción que copie, duplique, exporte o mueva un slot. Tres partidas paralelas son legales (§8.2, #10); tres checkpoints del mismo PJ no lo son. El backend no ofrece camino para clonar un slot y la UI no lo inventa.
- NO pierdas las dos vías del tutorial de #96 al repartir la rama viva entre tres slots.
- NO rediseñes options-panel.ts ni la lápida: la lápida ya está cerrada en 3e.2 y sólo cambia de contenedor.
- TypeScript estricto. Sin emojis. Copy provisional honesto.
- Accesibilidad: cada slot es una región con aria-label que dice de quién es la partida y en qué estado está; todo navegable con teclado; la carga de los tres slots tiene su estado de espera y su estado de error, no una pantalla en blanco.

## Done when
- `npx vitest run` verde. `npx tsc --noEmit` y `npx vite build` limpios.
- Los tres slots se leen de un vistazo, con tres estados distintos y jerarquía distinta.
- Cargar un slot vivo entra a ESA partida, con su mundo y su vista persistida; el otro slot vivo sigue intacto.
- Crear sobre un caído pide confirmación con casilla; crear sobre un vacío no.
- Morir en un slot deja ese slot en caído y no toca los otros dos.
- El Menú principal ofrece las tres opciones de §8.1.
- El copy de `CharacterAlreadyAliveError` nombra el slot, no "un personaje a la vez", y el error es recuperable al final de la creación.
- Cargar un slot que cambió en otra pestaña repinta el menú con un mensaje visible, no rebota en silencio.
- La confirmación de "Reset run" dice qué partida borra.

## Out of scope
Inventario real (H6). Acampar (4d). Anclas (4e). Tirada de exploración (4f). Meta-progresión entre runs (H8): los tres slots son independientes y nada cruza de uno a otro. Dos líneas de §8.2 quedan fuera y no son deuda de esta pantalla, porque las dos viven DENTRO de la run: el "guardado manual disponible desde menú" (hoy lo cubre `[Guardar y salir al menú]` de la pausa, 4c.2) y la "confirmación del navegador al cerrar pestaña" (nunca implementada, y muerta desde #90). Se resuelven como matización de §8.2 en biblia, no como código de 4c.4.
```
