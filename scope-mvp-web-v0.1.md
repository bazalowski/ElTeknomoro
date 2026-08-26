# El Teknomoro — Scope del MVP web

> Contrato de alcance. Qué entra en v1 del navegador, qué no entra, en qué orden se construye y qué lo bloquea.
> **Versión:** v0.9 · **Fecha:** 26 de agosto de 2026 (sincronización con biblia v0.25: §1.4 y §1.4b describían el mundo anterior a la decisión #67, cerrada tres meses antes)
> **Autor:** el-teknomoro-director
> **Destino:** referencia firme del equipo (Bazalo + dirección) durante toda la construcción del MVP. Si algo no está aquí, no se construye en v1.

---

## 0. Cómo se lee este documento

Tres secciones que importan:

- **§1 Dentro del MVP** — lo que se construye. Cerrado.
- **§2 Fuera del MVP** — lo que NO se construye. También cerrado: cada entrada aquí es un "no" explícito para cortar scope creep antes de que empiece.
- **§3 Orden de construcción** — hitos numerados. Un hito entregable por bloque. No se empieza un hito hasta que el anterior esté funcional.

Las secciones §4-§7 son apoyo: bloqueantes, estimación, riesgos, definición de "terminado".

**Regla sagrada del scope:** si surge una idea durante la construcción, va a "Fuera del MVP" o a una lista v1.1, nunca al hito en curso. Mover la meta mientras corres es la muerte de los proyectos personales.

---

## 1. Dentro del MVP (lo que v1 entrega)

### 1.1 Identidad y sesión
- Login con Supabase (email + contraseña).
- Menú principal: Nueva Partida · Cargar Partida · Opciones.
- Modo Privado oculto tras flag de dev + credenciales admin.
- 3 slots de partida por usuario, persistidos en Supabase.
- Guardado mixto (manual + autoguardado por eventos + heartbeat cada 5 turnos).
- Cache local en IndexedDB para sesión activa; Supabase autoritativo.

### 1.2 Onboarding
- Selección de modo: Historia (mapa fijo) o Libre (procedural por frase-semilla).
- Creación de personaje (ver 1.3).
- **Una** escena tutorial guiada de ~5 minutos que enseña los tres verbos base: moverse, combatir, craftear.
- Una decisión inmediata post-tutorial.
- Un primer combate forzado derivado de esa decisión.
- Apertura del mapa-mundi.

### 1.3 Creación de personaje
- Pantalla inicial "Empezar de cero" / "Empezar con preset".
- 5 arquetipos predefinidos (uno por atributo dominante).
- [x] 12 puntos de atributo, máximo 4 al crear, mínimo 1 por atributo. +/- con preview en tiempo real. (cerrada en H2.2, 2026-04-27)
- [x] 10 puntos de habilidad, máximo 3 al crear. Pantalla separada. (cerrada en H2.3, 2026-04-27, decisión #50: suma == 10 obligatoria)
- [x] Elección de 1 perk inicial. (cerrada en H2.4, 2026-04-27, decisiones #53/#54)
- [x] Set de 12 retratos fijos en grid. (cerrada en H2.1, 2026-04-27)
- [x] Inventario inicial fijo por arquetipo + botón "Sorpréndeme" con preview antes de confirmar. (cerrada en H2.5a, 2026-04-27, sub-pantalla 1 de 3 del paso 5/5)
- [x] Preview del personaje en una pantalla de combate antes de confirmar. (cerrada en H2.5b, 2026-04-27, sub-pantalla 2 de 3 del paso 5/5; mock estático sin lógica de combate, H3 lo cierra)
- [x] Botón Reset. Tras confirmar, personaje bloqueado. (cerrado en H2.5c, 2026-04-27, sub-pantalla 3 de 3 del paso 5/5; **Hito 2 completo**)

### 1.4 Mapa y exploración

> **Reescrita en v0.9.** Lo que había aquí (mapa-mundi con nodos, sub-mapas al entrar, niebla de guerra por casilla, viaje rápido híbrido, generación procedural del mapa) describía el modelo anterior a la decisión **#67**, que la biblia cerró en v0.20 y que #69, #70, #72, #81 y #88 desarrollaron después. El scope se quedó sin actualizar tres meses. Esta sección es ahora lo que dice biblia §9.

- **Overworld único con zoom semántico** (#67). No hay mapa-mundi separado de sub-mapas: tres niveles de cámara sobre el mismo dataset — vista regional (180 grids) → vista de grid (~4 POIs) → vista de POI (escena). El cambio entre niveles es continuo, nunca un router de pantallas (#83).
- **180 grids en 5 regiones**: Centro 50, Norte 35, Sur 35, Este 30, Oeste 30. Las **5 son jugables en v1** con curaduría densa equivalente (#81). El Sur es el hub estructural y contiene el grid de inicio (#82).
- **720 POIs** (~4 por grid) en 4 arquetipos: Natural, Ruina, Asentamiento, Arcano (#68). 80 llevan además hueco curado marcado en datos (#83).
- **Mundo fijo entre runs** (#72). No hay generación procedural del mapa: los 180 grids y los 720 POIs son los mismos partida tras partida, porque el lore embebido (§10) y la memoria de progresión (#65) sólo funcionan sobre un mundo estable. El modo Libre sigue existiendo pero modula contenido dentro del mundo fijo, no lo regenera.
- **Mapa visible desde el primer minuto, niebla a nivel de POI** (#69). No hay niebla de guerra por casilla: cada POI no visitado aparece como "???" hasta entrar. Los grids se leen como Inexplorado / Explorado / Controlado, estado **derivado** de los POIs y el ancla, no persistido aparte (#94).
- **Mirar no es viajar** (#88). Zoom, pan e inspección son cámara: gratis, ilimitados, sobre cualquier grid, sin mover al PJ. Viajar es acción de juego con botón explícito de confirmación y sólo a **vecinos cardinales**.
- **Fatiga de jornada** (#71): 8 acciones por día. Acampar consume una ración; sin ración, penalización de HP. Sustituye a los puntos de acción por casilla.
- **Fast travel sólo entre grids Controlados** (#70), vía anclas colocadas por el jugador, con coste en ración y acciones. Sustituye al viaje rápido híbrido por nodos.
- **El estado del mundo cuelga del slot, no del usuario** (#90), y se rebobina entero con la muerte del PJ (#94, C3b de #85).
- **El "home" es un POI tipo Asentamiento del Sur** (#85), no una pantalla aparte. El Menú principal es la pantalla de fuera de la run (#87, #95).
- HUD siempre visible con datos reales: HP, nombre, nivel. El contador de jornada aparece cuando #71 esté cableado (#91).
- Día/noche visualmente (efectos numéricos diferidos a v1.1, #42).

### 1.4b Tirada de exploración (sistema raíz — ver biblia §4.15)
- Tirada disparada por: pisar casilla, entrar a nodo, cruzar bioma, acampar, tramo de viaje rápido arriesgado.
- 7 variables de entrada: bioma, hora, clima, nivel, reputación, flags, suerte.
- 10 tipos de evento: combate, NPC, hallazgo, trampa, ambiental, POI descubierto, narrativo, emboscada, refugio, Nada.
- Dado de exploración: **1d20** con mapeo por rangos sobre pesos de tabla (decisión cerrada, independiente del dado de combate).
- **Una tabla d20 propia por POI: 20 eventos escritos a mano en cada uno de los 720** (#92, v0.24). Sustituye al modelo de "una tabla por bioma" que había aquí. Las bandas de §9.5 son la plantilla de escritura, idéntica en los 720. Resolución en cascada — entrada propia del POI → entrada del arquetipo para esa banda → entrada genérica — de modo que el motor es jugable con cero entradas escritas y gana profundidad POI a POI.
- Volumen declarado: **14.400 entradas**. Es el mayor entregable de contenido del proyecto y el cuello de botella de fase 2. Ninguna se genera con IA (#77).
- Las tablas por bioma siguen existiendo para el resto de disparadores de §4.15.1 (pisar casilla, cruzar frontera, acampar, tramo de viaje rápido).
- Tirada visible por completo (dado en log/HUD cada paso).
- Toda entrada de tabla declara `evade_check` reactivo (mitigar / evitar el evento).
- Trampas nunca matan: mínimo 1 HP garantizado.
- Presentación: modal a pantalla completa para eventos de peso, banner superior para eventos ligeros.
- Módulo `rules/exploration.ts` puro, determinista, consumiendo `rules/dice.ts`.
- Historial de últimas 100 tiradas en memoria de sesión (solo Modo Privado persiste).

### 1.5 Combate
- Por turnos puros, hasta 5 enemigos en pantalla.
- Iniciativa: estadística base + tirada.
- Timeline visible de los próximos 8 turnos.
- Acciones fijas: Atacar / Esquivar / Habilidad / Item / Huir (botón reservado, grisado hasta cierre de regla).
- Targeting mixto (clic + Tab).
- Log de combate en panel lateral desplegable.
- Log de la última tirada copiable como texto.
- Animación de dado + texto en log por cada tirada.
- Críticos diferenciados (color + sonido + shake).
- Iconos de estados sobre el sprite.
- ~~Terreno con tags por casilla~~ — **retirado en v0.9**: #75 cerró el combate como resolución abstracta **sin grid**, así que no hay casillas que etiquetar.
- Pausa del resto del mundo.
- Consulta de hoja de personaje sin salir del combate.
- **Motor de combate desacoplado del render** (requisito para 1.11).
- Pantalla de loot post-combate (modal bloqueante con "Dejar").

### 1.6 Inventario y equipo
- Cuadrícula fija 5×4 (20 slots).
- Equipo: cabeza, torso, manos, arma principal, arma secundaria, accesorio.
- Drag & drop.
- Tooltip con daño, durabilidad, peso, rareza.
- Comparativa al hover vs equipado.
- Rareza visual por color + prefijo.
- Durabilidad: al 0 queda inservible hasta reparar (el ítem no se destruye).
- Stacking según ítem.
- Catálogo de 50 items de MVP.

### 1.7 Crafteo
- Pantalla de crafteo accesible desde menú de personaje.
- Recetas conocidas visibles (descubiertas por combinación + aprendidas por libro).
- Combinación libre de materiales con descubrimiento automático de recetas válidas.
- Porcentajes success/critical/failure siempre visibles antes de craftear.
- Station: si la receta lo requiere, botón desactivado con tooltip.
- Craft x10 en batch con tiradas independientes.
- Encadenamiento de hasta 3 recetas en un clic (no cola temporal).
- Catálogo de 30-50 recetas de MVP.

### 1.8 Progresión
- Nivel máximo 50 (curva de XP provisional hasta cierre numérico).
- Subir nivel manual (botón), pausa el juego.
- Habilidades suben por uso (techo blando) y por XP (rompe techo).
- Re-spec con coste de recurso de juego.
- 15 logros en MVP.
- 3 facciones con reputación numérica bidireccional.
- Hoja de personaje ampliada en modo lectura.

### 1.9 NPCs y diálogos
- Lista de temas por NPC (hasta 6 visibles con scroll).
- UI modal en panel inferior, retrato + nombre.
- Tiradas sociales visibles antes de comprometerse.
- Comercio en pantalla dedicada accesible desde diálogo.
- Atacar a NPC no hostil con confirmación modal.
- Catálogo de 10 tipos de enemigos con variantes para combate.
- Set mínimo de NPCs no hostiles para el mapa de historia y para los nodos-ciudad procedurales.

### 1.10 Muerte y epitafio
- Permadeath con validación del servidor.
- Slot marcado como "muerto" tras la muerte, consultable como epitafio (stats, logros, causa, ubicación).
- Epitafio accesible desde Cargar Partida en solo lectura.

### 1.11 Modo Privado (dev-only)
- Flag de dev + login con credenciales admin.
- Banco ilimitado con etiquetas, favoritos, buscador, filtros, lista/grid.
- Banco como plantilla: clon al jugar, nunca mutación directa.
- Import/Export del Banco completo a `.tkm.json`.
- Publicación doble: botón "Publicar" + edición de `content-approved.json`.
- Campo de pruebas: spawn de enemigos, edición de HP/recursos en vivo, cola de tiradas forzadas `[6,1,4]`, materiales infinitos, editor de recetas por formulario.
- Simulación masiva IA vs IA: 1.000 combates sin UI en ≤5 segundos.
- Badge "Dev Mode" visible.

### 1.12 Presentación y accesibilidad
- 60 FPS objetivo en Canvas.
- Teclado + ratón.
- Texto redimensionable en 3 tamaños (S/M/L).
- Desktop only en v1 (Chromium + Firefox).
- Música + SFX mínimos (clicks, golpes, dado).
- Pantalla de carga visible al cargar partida o mundo.

---

## 2. Fuera del MVP (lo que v1 NO entrega)

Cada entrada aquí es un "no" firme para v1. Va a v1.1, v1.2 o se descarta según la tracción de v1.

- Soporte móvil / tablet.
- Soporte de mando.
- Modo daltónico.
- Slider continuo de tamaño de texto.
- Navegadores Safari / no-Chromium / no-Firefox.
- Party de varios personajes.
- Múltiples personajes por partida.
- Encuentros en tramos de viaje rápido **seguro** (solo el viaje arriesgado dispara tiradas).
- Minimapa (solo mapa principal).
- Efectos numéricos concretos de día/noche, clima y terreno (presentes visualmente, sin impacto mecánico en v1).
- Reparación de equipo (el equipo queda inservible al 0 de durabilidad, pero el sistema de repararlo es v1.1).
- Export CSV de simulación masiva.
- JSON raw editor en UI del Campo de pruebas.
- Replay visual de combate.
- Rankings globales / leaderboards.
- Branding visual definitivo y música original (placeholders válidos).
- Lore y narrativa extensa (mapa de historia mínimo viable, no épico).
- Monetización.
- Multijugador de cualquier tipo.
- Generación procedural avanzada (mazmorras procedurales, quests procedurales).
- Modo espectador.
- Más de 5 biomas.
- Más de 50 items.
- Más de 30-50 recetas.
- Más de 10 tipos de enemigos.
- Más de 3 facciones.
- Más de 15 logros.
- Sistema de mascotas, compañeros IA o invocaciones.
- Meteorología dinámica con impacto jugable (presente visualmente, no mecánicamente).
- Diálogos ramificados por árbol.
- Voice over.

Si durante la construcción de un hito aparece la tentación de meter algo de esta lista, la respuesta es **no** y se anota para v1.1.

---

## 3. Orden de construcción

Nueve hitos. Cada uno termina en un estado jugable concreto y testeable. No se arranca el hito N+1 hasta que el N pasa la validación de §7.

### Hito 0 — Fundaciones (sin juego visible todavía)  *(cerrado)*
- Repositorio inicializado con Vite + TypeScript + Canvas.
- Estructura de carpetas de §7 de la biblia (`rules/`, `render/`, `state/`, `backend/`, `dev/`, `data/`).
- Supabase conectado: schema inicial (users, save_slots, banks).
- Login funcional end-to-end.
- IndexedDB configurado para caché de sesión.
- Pipeline de build + deploy a Netlify/Vercel.
- Test runner (Vitest) con al menos un test del módulo de dados.
- **Entregable:** URL accesible con login que muestra "Hola {usuario}" tras autenticarse.

### Hito 1 — Motor de reglas núcleo  *(cerrado)*
- `rules/dice.ts` con los dos sistemas de dados (combate y exploración) como primitivas separadas.
- `rules/character.ts` con creación, validación, cálculo de stats derivados.
- `rules/progression.ts` con subida de habilidad por uso + por XP.
- `rules/exploration.ts` con dos funciones puras:
  - `rollExplorationTick(worldState, character, trigger) → ExplorationEvent`: evaluador de pesos con las 7 variables, filtrado por `conditions`.
  - `resolveEvadeCheck(event, character, dice) → EvadeResult`: aplica el `evade_check` de la entrada (fija/enfrentada, éxito/crítico/fracaso/pifia, coste, entrenamiento de habilidad, cascada si `fallback_check`).
- Tests unitarios para cada módulo:
  - `exploration.ts`: test de distribución estadística (1.000 tiradas de bioma conocido respetan pesos configurados).
  - `resolveEvadeCheck`: test por cada uno de los 10 tipos del catálogo §4.15.3, cubriendo rama éxito/crítico/fracaso/pifia donde aplique.
- Ningún render todavía.
- **Entregable:** suite de tests verde. Creación de personaje por consola con JSON de entrada/salida. Tirada de exploración dispara eventos resolubles sobre un `worldState` mock.

### Hito 2 — Creación de personaje en UI  *(cerrado, 27/4/2026)*
- Flujo "Empezar de cero" / "Empezar con preset".
- Las 5 pantallas de creación (retrato, atributos, habilidades, perk, inventario) con preview en tiempo real.
- Persistencia del personaje confirmado en Supabase.
- 5 arquetipos en `data/` con stat-lines provisionales.
- **Entregable:** crear personaje en navegador, guardarlo, cerrar pestaña, recargar, ver personaje guardado.

### Hito 3 — Combate vertical slice  *(cerrado, 1/5/2026)*
- `rules/combat.ts` completo: iniciativa, resolución de ataque, daño, estados, muerte.
- UI de combate: timeline, targeting, botones de acción, log lateral, animación de dado.
- **Un** enemigo tipo, **un** escenario de combate, **sin** mapa todavía.
- Loot post-combate.
- Permadeath funcionando: al morir, slot pasa a epitafio en Supabase.
- **Entregable:** combate jugable extremo a extremo. Personaje creado → combate → victoria o muerte.

### Hito 4 — Mapa y exploración  *(en curso)*

> **Reescrito en v0.9** contra el modelo real de biblia §9. Lo que había aquí describía `world-gen.ts`, niebla de guerra y viaje rápido por grafo de nodos, todo sustituido por las decisiones #67-#72 y #81-#96.

Se construye en sub-pasos. Los marcados **[x]** están cerrados y en `main`.

- [x] **4a** — Modelo de datos del mundo: `regiones.json` + `grids.json` + `pois.json` (180 grids, 720 POIs, 80 huecos curados). `rules/world.ts` SAGRADO con tipos, validación y selectores. Campo `last_damage_source` y flag `tutorial_lobo_completed`.
- [x] **4b.0** — Reparto determinista de los 4 arquetipos y variación de posiciones en el mini-grid 5×5 (#89). Columna `world_state jsonb` en `save_slots`: primera migración de schema desde H0 (#90).
- [x] **4b** — Vista regional + zoom continuo a vista de grid. Mirar separado de viajar (#88). Lectura visual cerrada en #91.
- [x] **4c.0** — Selectores de POI y derivación del estado del grid en `world-state.ts`. `last_damage_source='enemy'` sellado al cerrar por derrota. Reset del `world_state` al crear PJ sobre slot muerto.
- [x] **4c.1** — Vista de POI como tercer nivel de cámara + combate Lobo desde el POI (#93).
- [x] **4c.2** — Pausa global, opciones (3 tamaños de texto) e inventario placeholder (#94, #95).
- [x] **4c.3** — Home repartida en Menú principal y campamento del POI Hogar (#85, #87, #95). Salto del tutorial cableado (#96).
- [ ] **4c.4** — Selector de los 3 slots de §8.2 en el Menú principal, que cierra sus tres opciones de §8.1 (#95).
- [ ] **4d** — Fatiga de jornada (#71): 8 acciones por día, acampar, ración, penalización de HP, muerte por fatiga con `last_damage_source='fatigue'`.
- [ ] **4e** — Fast travel y anclas (#70). La condición de "Controlado" se cierra aquí.
- [ ] **4f** — Tirada de exploración cableada end-to-end: `rollExplorationTick` sustituye el botón "Combatir" del POI por la tirada d20 con bandas (#83, #92). Variables activas en runtime: bioma, nivel y suerte.

**Entregable:** jugar una partida corta extremo a extremo. Crear → explorar el overworld con tiradas visibles → evento → combate o evasión → morir → epitafio. **Cierre por muerte únicamente; la condición de victoria llega en H5.**

### Hito 5 — Modo Historia: quest principal, secundarias y eventos narrativos
- `rules/quest.ts` puro y determinista: tipos `Quest`, `QuestStep`, `QuestProgress`, primitivas para avance, completion y persistencia. Sin imports de UI/Supabase.
- **Quest principal del mapa de historia:** cadena de hitos narrativos sobre el mapa hardcodeado de H4, condición de cierre, disparo de `endRunWithVictory` (decisión #44).
- **Quests secundarias:** catálogo provisional (3-5 quests opcionales), recompensas, banderas de estado, sin árbol de dependencias en MVP.
- **Sistema de eventos narrativos:** enganche con eventos `narrativo` y `NPC` de la tirada de exploración (§4.15 biblia). Modal para eventos de peso, banner para ligeros. Decisiones de evento avanzan quests cuando corresponde.
- **Selector Historia/Libre activo en home** (biblia §4.6 paso 2). Modo Libre no instancia quest principal — sólo cierra por muerte.
- **Pantalla de victoria:** modal sobre home, hermano del modal de epitafio. Reutiliza formato de epitafio con `cause.kind = 'victory'`.
- **Estado de quest persistido en `Character.quest_progress`** vía `saveCharacterUpdate` en backend.
- **Entregable:** partida completable extremo a extremo en Historia. Crear → mapa → quest activa → cumplir hitos → victoria → epitafio de victoria → home con slot de solo-lectura.

### Hito 6 — Inventario, equipo y loot
- Sistema de inventario (5×4 slots) con drag & drop.
- Slots de equipo con tooltip comparativo.
- Durabilidad funcionando (ítem inservible al 0).
- Catálogo de 50 items en `data/items.json`.
- Tirar ítems al suelo con recogida posterior.
- **Entregable:** personaje combate → loot → equipar → mejor stats → combate con equipo mejor.

### Hito 7 — Crafteo
- `rules/crafting.ts` completo: combinación, descubrimiento, outputs ramificados, batch, station.
- UI de crafteo con porcentajes visibles y encadenamiento x3.
- Catálogo de 30-50 recetas en `data/recipes.json`.
- Libros de recetas como ítems que desbloquean entradas.
- **Entregable:** recoger materiales → craftear → craft falla → craft crítico → nueva receta descubierta.

### Hito 8 — Progresión, NPCs y facciones
- Subida de nivel manual con pantalla pausada.
- Re-spec con coste de recurso.
- 15 logros con triggers implementados.
- 3 facciones con reputación persistente.
- Sistema de diálogo: lista de temas, tiradas sociales visibles, comercio.
- Catálogo de 10 tipos de enemigos con variantes.
- NPCs mínimos en mapa de historia y en ciudades procedurales.
- **Entregable:** partida completa que toca todos los sistemas en 30-45 min.

### Hito 9 — Modo Privado
- Banco (CRUD + filtros + favoritos + import/export).
- Campo de pruebas (spawn, edición HP/recursos, cola de tiradas forzadas, editor de recetas por form).
- Simulación masiva IA vs IA ≤ 5 s / 1.000 combates.
- **Herramientas de tirada de exploración:**
  - Forzar próximo evento (`next_event = combate_lobos`).
  - Ver tabla activa en el tick actual con pesos resueltos.
  - Simular 1.000 tiradas en una zona y ver distribución de eventos.
  - Editor de tabla en vivo por formulario.
  - Log detallado por tirada: "tabla bosque, entrada X, peso Y, condición Z aplicada, resultado final".
- Publicación doble vía.
- Gateado por flag + credenciales admin.
- **Entregable:** Bazalo crea 3 ítems en el Banco, los prueba en Campo, publica uno, aparece en juego base. Edita una tabla de exploración, simula 1.000 tiradas, ajusta pesos, re-simula.

### Hito 10 — Onboarding, tutorial y pulido
- Escena tutorial guiada de ~5 min.
- Decisión inmediata + combate forzado post-tutorial.
- Música y SFX integrados.
- HUD, logros, badges, Dev Mode badge.
- 3 tamaños de texto.
- Pantalla de carga.
- Pase de bugs, sonido, feedback visual.
- **Entregable:** v1 pública, jugable por alguien que no sea Bazalo sin instrucciones externas.

---

## 4. Bloqueantes externos al scope

Estos no son "trabajo del MVP", son pre-requisitos. Sin cerrarlos, los hitos correspondientes no se empiezan.

| Bloqueante | Bloquea el Hito | Estado | Cómo se cierra |
|---|---|---|---|
| Dado de combate (pool vs único) | H1, H3 | **Cerrado (pool d6 4+, decisión #36)** | — |
| Dado de exploración | H1, H4 | **Cerrado (1d20, decisión #26)** | — |
| Fórmula de iniciativa | H3 | **Cerrado (DES + 1d20, decisión #41)** | Validado en `simulaciones/iniciativa-v0.1.md` |
| Threshold de impacto (DEF → éxitos) | H3 | **Cerrado (`ceil(DEF/3)`, decisión #46)** | Promovida desde simulación implícita del dado v0.2 |
| Curva de XP al nivel 50 | H8 | **Cerrada (lineal `100·n`, decisión #37)** | — |
| Definición de "Suerte" como variable de exploración | H1 | **Cerrado (atributo derivado, decisión #43)** | — |
| Diseño de la tirada reactiva por tipo de evento | H1, H4 | **Cerrado (v0.5 biblia §4.15.6–§4.15.9)** | — |
| Efectos numéricos de día/noche, clima y terreno | H4 | **Cerrado: diferido a v1.1 (decisión #42)** | — |
| Condición de fin de partida en modo Historia | H3 | **Cerrado (decisión #44, aclarada en v0.19)** | Quest principal del mapa de historia (se diseña en H5; ver decisión #62) |
| Contenido concreto del onboarding (decisión + combate forzado) | H10 | **Cerrado: estructura, decisión #45** | Texto y enemigo concreto pendientes de H10 (no son bloqueantes de código) |
| Stat-lines definitivas de los 5 arquetipos | H2 | Abierto | Se deriva del dado de combate; redacción concreta en H2 |
| Lista concreta de habilidades | H2 | Abierto | Se deriva del dado de combate; redacción concreta en H2 |
| Tablas de exploración iniciales (5 biomas) | H4 | Abierto | Se redacta en H4 con herramientas de H9 adelantadas si hace falta |

**Estado de bloqueantes a 26/4/2026:** **0 bloqueantes de diseño**. Lo que queda abierto (stat-lines, habilidades, tablas de bioma) es contenido, se redacta en su hito sin necesidad de sesión de diseño previa.

---

## 5. Estimación gruesa

**Sin compromiso.** Bazalo va lento y lento está bien. Esto es solo para que exista un orden de magnitud.

| Hito | Esfuerzo aproximado (sesiones de 4 h) |
|---|---|
| H0 — Fundaciones | 3-5 |
| H1 — Reglas núcleo (incluye `exploration.ts`) | 6-9 |
| H2 — Creación UI | 5-7 |
| H3 — Combate vertical slice | 8-12 |
| H4 — Mapa y exploración (incluye integración de tirada raíz, sin quest) | 12-16 |
| H5 — Modo Historia: quest principal + secundarias + eventos narrativos | 8-12 |
| H6 — Inventario | 5-7 |
| H7 — Crafteo | 5-7 |
| H8 — Progresión + NPCs + facciones | 10-15 |
| H9 — Modo Privado (incluye herramientas de tabla de exploración) | 8-12 |
| H10 — Pulido y onboarding | 8-12 |
| **Total** | **78-114 sesiones** |

A una sesión jugable por semana en los bloques buenos (realista para Bazalo con todos sus proyectos), son **17-26 meses de calendario**. Dos sesiones por semana en sprints buenos bajan a **9-13 meses**. Más rápido que eso sería inesperado.

---

## 6. Riesgos identificados y mitigación

**Riesgo 1 — El sistema de dados tarda en cerrar.** Es el nodo crítico: bloquea H1 y cascada el resto.
- *Mitigación:* H0 no depende del dado. Se arranca H0 en paralelo a la simulación.

**Riesgo 2 — Supabase coste/complejidad.**
- *Mitigación:* capa `backend/` aislada. Si hay que migrar, se cambia una carpeta.

**Riesgo 3 — Scope creep interno.** Bazalo se motiva y quiere meter features nuevas.
- *Mitigación:* este documento. Cualquier cosa que no esté en §1 va a lista v1.1 sin discusión.

**Riesgo 4 — Balance de combate insatisfactorio en H3.**
- *Mitigación:* H9 (Modo Privado) adelanta la herramienta de simulación masiva. Si H3 deja dudas, se puede acelerar H9 parcialmente para tener simulación antes.

**Riesgo 5 — Burnout por proyectos paralelos.**
- *Mitigación:* cuello de botella reconocido. No se fija deadline. Entre hitos, pausas largas están permitidas.

**Riesgo 6 — Migración a Godot en fase 2 más dolorosa de lo previsto.**
- *Mitigación:* `rules/` aislado desde H0, tests unitarios desde H1, determinismo como invariante. El port es mecánico, no arqueológico.

---

## 7. Definición de "terminado" por hito

Un hito está terminado si y solo si:

1. **Funciona en navegador limpio** (perfil privado, caché limpia).
2. **Tests unitarios verdes** para toda la lógica de `rules/` del hito.
3. **Bazalo juega el entregable del hito** al menos una vez extremo a extremo sin intervenir sobre el código.
4. **Los sistemas del hito están documentados** en `biblia-del-juego.md` si introducen reglas nuevas, o en `scope-mvp-web-v0.1.md` si ajustan scope.
5. **No bloquea** los hitos siguientes por deuda técnica silenciosa.

Si un hito no cumple los cinco puntos, no se declara terminado, no se pasa al siguiente, y el trabajo extra entra como hito N.1.

---

## 8. Decisiones diferidas al momento del hito

No todo se decide hoy. Estas quedan marcadas para decidirlas cuando llegue su hito, no antes:

- **Granularidad exacta de los puntos de acción por turno** en mapa (se decide al empezar H4, tras tener H3 jugable).
- **UI concreta del árbol de perks** (se decide al empezar H8).
- **Tono y estética visual definitiva** (se decide en H10, con placeholders hasta entonces).
- **Identidad narrativa del mapa de historia** (se decide al empezar H5; H4 trabaja con placeholders geográficos coherentes con biomas pero sin contenido de quest).
- **Contenido del catálogo de 50 items y 30-50 recetas** (se redacta en H6 y H7 respectivamente, no antes).

---

## 9. Qué hace Bazalo esta semana

Estado al cerrar v0.7 del scope (biblia v0.8, 26/4/2026):

- **H0:** **cerrado** y desplegado en Vercel.
- **H1:** **cerrado.** `rules/dice.ts`, `rules/character.ts`, `rules/exploration.ts`, `rules/progression.ts`.
- **Esqueleto del motor extendido:** **cerrado.** Los 10 módulos restantes de `rules/` (combat, inventory, crafting, world-gen, fast-travel, death, time, faction, dialog, achievements) tienen contratos definidos y la mecánica que la biblia cierra ya está implementada y testeada (168 tests verdes). Sólo se queda NOT_IMPLEMENTED `generateFreeWorld` (sesión H4 dedicada).
- **6 decisiones cerradas en una pasada:** #41 iniciativa (con simulación), #42 día/noche, #43 Suerte, #44 fin de partida, #45 onboarding, #46 threshold. **0 bloqueantes de diseño restantes.**

Orden de atención:

1. **Arrancar H2** (creación de personaje en UI). El motor núcleo está listo para que la UI lo consuma sin que aparezcan agujeros.
2. Antes de tocar UI, decidir contenido mínimo necesario para H2: nombres y stat-line por defecto de los 5 arquetipos (decisión menor, no de diseño), set de 12 retratos (placeholder), lista mínima de habilidades para que el reparto tenga sentido. Esto se redacta en H2 como parte del hito, no como bloqueante previo.
3. Tras H2, H3 (combate vertical slice) tiene todo el motor que necesita: combat.ts implementado, iniciativa cerrada, threshold cerrado, death con epitafio y victoria. Sólo añadir UI de combate.

---

## 10. Historial

**v0.1** — Primera versión. Producida tras test de funcionalidades (130 preguntas) + test de profundización (54 preguntas) + biblia v0.4. Define 9 hitos, inventario cerrado de MVP, lista explícita de no-MVP, bloqueantes externos y riesgos.

**v0.2** — Integración del sistema de tirada de exploración como raíz del juego (biblia §4.15). Cambios:

- Nueva sección §1.4b dentro del MVP: tirada de exploración.
- Viaje rápido reescrito a modelo híbrido (seguro/arriesgado, solo a nodos descubiertos).
- H1 amplía alcance con `rules/exploration.ts` y test de distribución estadística.
- H4 amplía alcance con integración del sistema, tablas de 5 biomas en `data/exploration/`, dado de exploración visible en HUD, viaje rápido con tramos arriesgados.
- H8 añade herramientas de tabla de exploración (forzar evento, ver tabla activa, simular 1.000 tiradas, editor en vivo, log detallado).
- §2 ajustada: "encuentros en viaje rápido" se matiza (solo arriesgado dispara, seguro no).
- §4 bloqueantes: dado de combate y dado de exploración separados como bloqueantes independientes. Añadidos: Suerte, tirada reactiva por tipo, tablas iniciales de 5 biomas.
- §5 estimación subida a 72-106 sesiones por la carga adicional de H1, H4 y H8.
- §9 reordenado: la semana ahora arranca por confirmar el 1d20 propuesto.

**v0.3** — Cierre del subsistema de tirada reactiva (biblia §4.15.6–§4.15.9) tras test `docs/archivo/tirada-reactiva-v0.1.md`. Cambios:

- Dado de exploración cerrado oficialmente como **1d20** (decisión cerrada #26 en biblia).
- Tirada reactiva cerrada para los 10 tipos del catálogo: marco común + tabla por tipo + formato `evade_check` ampliado.
- H1 amplía entregable con `resolveEvadeCheck` como función pura separada y test unitario por cada uno de los 10 tipos.
- §4 bloqueantes: eliminados "Dado de exploración" y "Diseño de tirada reactiva por tipo". Bloqueantes restantes = 8.
- §9 semana actualizada: solo queda el dado de combate como bloqueante numérico crítico antes de H1. H0 totalmente desbloqueado.

**v0.4** — H0 cerrado y desplegado (25/4/2026). Sin cambios de reglamento. Cambios al scope:

- §9 "Qué hace Bazalo esta semana": H0 marcado como cerrado. El orden de atención pierde el punto 1 (arrancar H0). Ahora la tarea prioritaria es cerrar el dado de combate.
- §4 bloqueantes sin cambios: el dado de combate y los de segundo orden siguen abiertos. El cierre de H0 no era un bloqueante, era un hito.

**v0.5** — Cierre del **dado de combate** (25/4/2026, biblia v0.6, decisión #36). Cambios:

- §4 bloqueantes: marcado **Cerrado** el dado de combate (pool d6 4+). La iniciativa queda explícitamente desbloqueada para H3. Stat-lines y habilidades quedan derivables.
- §9 reescrita: H1 está desbloqueado. La semana arranca por `rules/dice.ts` (añadir `rollCombatPool`) y baja por el resto de módulos del hito.
- Sin cambios en §1, §2, §3, §5, §6, §7, §8: el cierre del dado no altera el inventario del MVP, los hitos ni la estimación.

**v0.6** — Cierre del **subsistema de progresión** (25/4/2026, biblia v0.7, decisiones #37-#40). Cambios:

- §4 bloqueantes: marcada **Cerrada** la curva de XP al nivel 50 (lineal `100·n`).
- §9 reescrita: H1 al 75% en código (faltan solo `progression.ts`). La semana se centra en cerrar ese módulo con los números reales y dar H1 por entregable completo.
- Sin cambios en §1, §2, §3, §5, §6, §7, §8.

**v0.7** — Cierre del **esqueleto extendido del motor** y de los **5 bloqueantes de diseño restantes** (26/4/2026, biblia v0.8, decisiones #41-#46). Cambios:

- §4 bloqueantes: tabla actualizada — **0 bloqueantes de diseño abiertos**. Iniciativa (#41), Suerte (#43), efectos día/noche (#42), fin de partida (#44), onboarding estructural (#45) y threshold (#46) cerrados. Lo que queda abierto es contenido (stat-lines, habilidades, tablas de bioma) que se redacta en su hito.
- §9 reescrita: H1 cerrado, esqueleto extendido cerrado, 168 tests verdes. La semana arranca H2.
- Sin cambios en §1, §2, §3, §5, §6, §7, §8: el cierre del esqueleto no altera el inventario del MVP, los hitos ni la estimación. La forma del MVP era correcta; lo que se cerró es la cimentación.

Hito implícito de proceso: este es el primer ciclo en que el motor tiene contratos completos antes de que nada de UI exista. La fase de "ajustar mecánicas y añadir contenido" puede arrancar sin que reescribir contratos rompa código de UI.

**v0.8** — Cierre del **Hito 3** y **reordenamiento de hitos** (1/5/2026, biblia v0.19, decisión #62). Cambios al scope:

- §3 reescrita con **10 hitos** (antes 9). H4 deja de embeber la quest principal del modo Historia; queda como mapa + exploración con cierre por muerte. **H5 nuevo** centraliza modo Historia: quest principal, quests secundarias, sistema de eventos narrativos, pantalla de victoria y selector Historia/Libre. Los antiguos H5-H9 se renumeran a H6-H10.
- §4 bloqueantes: línea 324 actualizada — la quest principal del mapa de historia se diseña en **H5** (antes H4). Onboarding renumerado a H10. Curva de XP renumerada a H8. Tablas de bioma siguen en H4 con herramientas de H9 (antes H8) adelantables.
- §5 estimación: tabla con 11 filas (incluye H10). H4 bajado a 12-16 sesiones (antes 14-20) por liberar la carga de quest. H5 nuevo entra con 8-12 sesiones. Total **78-114** (antes 72-106). Calendario subido a 17-26 meses a una sesión/semana, 9-13 meses a dos.
- §6 mitigación de Riesgo 4: H8 antiguo → H9 (Modo Privado mantiene su rol).
- §8 decisiones diferidas: árbol de perks H7 → H8, estética H9 → H10, identidad narrativa del mapa H4 → H5, items H5 → H6, recetas H6 → H7.
- Sin cambios en §1 (qué hay dentro del MVP) ni §2 (qué queda fuera). El reordenamiento es de **orden de construcción**, no de inventario. El mismo juego se entrega en otro orden.

Razón del reordenamiento: H4 actual mezclaba dos sistemas grandes (mapa + quest principal) en un mismo hito, violando "un hito entregable por bloque" (§0). Separar permite que H4 cierre como demo jugable sin victoria (entregable real) y que H5 acumule todo lo narrativo (quest, eventos, modo Historia) en un sistema coherente. Ver biblia v0.19 decisiones #44 (aclarada), #61 (actualizada), #62 (nueva).

**v0.9** — **Sincronización con biblia v0.25** (26/8/2026), disparada al hacer inventario de cabos sueltos del proyecto entero tras cerrar 4c.3. Este documento llevaba desde el 1 de mayo sin tocarse mientras la biblia avanzaba de v0.19 a v0.25, y el desfase no era cosmético: **§1.4 seguía describiendo el mundo anterior a la decisión #67** (mapa-mundi con nodos, sub-mapas al entrar, niebla de guerra por casilla, viaje rápido híbrido, generación procedural del mapa), un modelo que la biblia sustituyó en v0.20 y que el código nunca implementó. El contrato de alcance contradecía a la biblia justo en la zona en construcción. Cambios:

- **§1.4 reescrita entera** contra biblia §9: overworld único con zoom semántico, 180 grids, 720 POIs, mundo fijo entre runs, niebla a nivel de POI, mirar ≠ viajar, fatiga de jornada, fast travel por anclas, estado del mundo por slot, home como POI.
- **§1.4b actualizada** con #92: la tabla d20 pasa de "una por bioma" a una propia por POI, 20 entradas escritas a mano en cada uno de los 720 (14.400 en total), con resolución en cascada. Las tablas por bioma sobreviven para los demás disparadores de §4.15.1.
- **§1.5**: retirada la línea "terreno con tags por casilla" — #75 cerró el combate como resolución abstracta sin grid.
- **§3 Hito 4 reescrito** con los sub-pasos reales (4a a 4f) y su estado. H0, H1, H2 y H3 marcados como cerrados con fecha.
- Sin cambios en §2 (fuera del MVP), §4-§8: el inventario del MVP no cambia. Lo que se corrige es una descripción que había dejado de ser cierta.

Lección de proceso, anotada a propósito: la biblia es documento vivo y el scope se trató como documento firmado, así que nadie lo releyó. A partir de aquí, **todo bump de biblia que toque §9 o §4.15 revisa §1.4 y §1.4b de este documento en el mismo movimiento**.
