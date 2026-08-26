# Cuestionario de Visión — El Teknomoro

> **Director:** el-teknomoro-director
> **Fecha:** 1 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque.
> **Propósito:** fijar la visión 100% objetiva del proyecto tras el pivote conceptual (RPG de exploración por turnos, lore como contenido, meta-progresión ligera). Junto con `cuestionariolore.md`, es la base para rediseñar biblia, scope y skills custom.

---

## A. Qué NO debe ser este cuestionario

1. **No es un brainstorm de lore.** Para eso ya está `cuestionariolore.md`. Si una pregunta se contesta con "depende de la facción X", no va aquí.
2. **No es un cuestionario de implementación.** Sin clases TypeScript, carpetas ni patrones. Eso lo deriva el director después.
3. **No es un cuestionario de gustos personales.** "¿Te gusta Dark Souls?" no entra. "¿Qué experiencia concreta quieres replicar y por qué?" sí.
4. **No es para enseñarte a diseñar juegos.** Si una pregunta no se entiende, se reformula en sesión.
5. **No repite decisiones cerradas** (stack, fases, nombre, aislamiento de reglas).
6. **No mete preguntas trampa de validación emocional.** Cada pregunta abre trabajo.
7. **No exige número exacto cuando un rango sirve.** "20-40 minutos por run" es respuesta válida.
8. **No te pide diseñar v1.1.** Existe el bloque, pero corto: una línea por entrada.

Si una pregunta te parece duplicada, márcala y se fusiona. Si te bloquea más de 5 minutos, sáltala y vuelve al final: probablemente es la pregunta importante y necesita conversación, no respuesta escrita.

**Convención de marcas:**
- **[★]** = bloqueante de decisión. Sin esta respuesta, no se puede empezar la nueva fase.
- **[REPO]** = ya existe respuesta parcial en el repo (PRODUCT.md, biblia, scope, decisiones cerradas). Confirmar o matizar, no contestar en blanco.
- Sin marca = respuesta de calibración. Importante pero no bloquea.

---

## Bloque 1 — Forma del juego y contrato con el jugador

1. [★] En una sola frase, ¿qué hace el jugador en El Teknomoro durante una sesión típica? (Verbo principal, no género).

- Explora un mapa, combate, colecciona objetos y visita asentamientos mientras persigue la leyenda del Teknomoro.

2. [★] ¿Qué se lleva el jugador de una sesión de 30-45 minutos: una historia cerrada, un fragmento de mundo descubierto, progreso medible, o las tres cosas en distinta proporción?

- Las dos del final: fragmento de mundo descubierto + progreso medible. La historia cerrada no es lo que se lleva el jugador en una sesión de 30-45 min; eso lo construye a lo largo de la run.

3. [REPO] ¿El jugador objetivo es alguien que ya juega rol de mesa, alguien que viene de roguelikes, alguien que viene de RPGs clásicos, o un mix? Ordénalos por prioridad.

- Mix, en este orden:
  1. Jugador de RPG clásicos (Fallout 1 y 2, Baldur's Gate).
  2. Jugador de RTS.
  3. Jugador de rol de mesa que prefiere el videojuego al manual.

4. ¿Qué emoción dominante quieres que el jugador sienta al cerrar el navegador después de jugar? (Una palabra: curiosidad, satisfacción, intriga, melancolía, dominio, otra).

- Tres emociones, en este orden: satisfacción, intriga, preocupación. La pregunta pedía una palabra; mantengo las tres porque cada una cubre un eje distinto: satisfacción por lo logrado, intriga por lo no descubierto, preocupación por lo que viene.

5. [★] ¿El juego se "termina" alguna vez? ¿Hay un final de campaña, o es jugar-hasta-cansarse estilo Qud?

- Mix. Hay un objetivo final que cierra la campaña 1 (planteo: juego base + 2 expansiones). Pero la partida puede continuar una vez terminada esa condición de victoria.

6. ¿Hay narrativa principal con principio/medio/fin, o el mundo es el contenido y la narrativa emerge?

- Mezcla, con peso claro en lo emergente. La narrativa principal es el contexto que enmarca la campaña; todo lo demás se aprende del contenido y de la narrativa emergente del mundo.

7. [★] Si un jugador externo abre el navegador y juega 10 minutos, ¿qué cosa concreta tiene que haber experimentado para que diga "esto es un juego, no un prototipo"?

- Para que un externo diga "esto es un juego, no un prototipo" tras 10 minutos, tiene que haber experimentado:
  - Interfaz pulida en cada pantalla que ha tocado (sin debug visible, sin assets placeholder).
  - Contenido denso (al menos un POI curado con texto propio + un combate resuelto + un átomo de lore leído).
  - Mecánicas claras: ha entendido qué hace el d20, qué es un status y qué es un perk sin que se lo expliquen.
  - Usabilidad: no se ha quedado atascado en cómo seguir.

  Criterio binario: si al cerrar el navegador puede contarme en una frase qué hizo y por qué, es juego. Si dice "no sé qué pasó", es prototipo.

8. ¿El jugador toma decisiones que cambian el estado del mundo de forma persistente, o el mundo es estable y el jugador solo lo recorre?

- Mezcla dentro de la run, reset al morir. Durante una run los grids progresan de Inexplorado → Explorado → Controlado por acción del jugador (Bloque 3, pregunta 18), y los cambios narrativos los decide cada átomo de POI curado al escribirlo (no se sistematiza). Al morir el PJ, todo el estado del mundo se reinicia: solo se conservan los nombres de los POIs ya despejados y el lore desbloqueado en el meta. Cualquier questline a medias se repite desde cero con el siguiente PJ.

---

## Bloque 2 — Run y meta-run

9. [★] Duración objetivo de una run desde "PJ nuevo" hasta "PJ muerto o run completada": rango en horas o sesiones.

- Sin límite ni mínimo. Las que el jugador quiera echar. La duración la decide su muerte, su decisión de cerrar la campaña tras alcanzar el final del Teknomoro, o su aburrimiento.

10. [★] ¿Qué persiste entre runs? Lista corta: lore descubierto, mapa revelado, ítems, recetas, conocimiento meta, estadísticas globales. Marca cuáles sí, cuáles no.

- Persiste entre runs:
  - Lore descubierto.
  - Mapa revelado.
  - Recetas.
  - Conocimiento del meta.
  - Estadísticas globales.

11. [★] ¿Qué muere irreversiblemente con el PJ? Inventario, nivel, vínculos con NPCs, progreso de quest, todo.

- Todo el estado de la run se reinicia. Mueren con el PJ:
  - Inventario (equipo e ítems).
  - Nivel del jugador.
  - Progreso en las questlines (hay que repetirlas desde cero con el siguiente PJ).
  - Cantidad de oro.
  - Vínculos con NPCs activos en esa run.
  - Estado de los grids (vuelven a Inexplorado salvo por los nombres de POIs ya despejados).

  Lo único que persiste al meta es el lore descubierto, los nombres de POIs despejados, las recetas, el conocimiento meta y las stats globales (Bloque 2 pregunta 10).

12. ¿Hay "hitos roguelike" tipo desbloqueos permanentes (clases nuevas, zonas iniciales distintas, items de partida) por logros entre runs? Si sí, ¿cuántos hitos tiene v1?

- Sí, entran en v1. Hitos roguelike con desbloqueos permanentes (clases nuevas, zonas iniciales distintas, ítems de partida) por logros entre runs. La cantidad y el momento exacto de creación los decide el director cuando v1 esté esqueletado y se vea qué hitos tienen sentido sin desequilibrar la curva. Se añaden como octavo elemento al criterio v1 del Bloque 9 pregunta 60.

13. ¿El jugador empieza cada run en el mismo sitio o el punto de partida varía?

- Hay diferentes puntos de salida. No empiezas siempre en el mismo grid.

14. ¿La muerte es definitiva (permadeath puro) o hay segundas oportunidades en run (revivir, refugio, etc.)?

- La muerte es definitiva (permadeath). Excepción: ítems específicos permiten esquivar una muerte concreta. Sin segundas oportunidades por defecto.

15. ¿Cuántas runs completas esperas que juegue alguien antes de "terminar" el v1 sin sentir que ha visto todo?

- Entre 10 y 20 runs completas antes de que el jugador sienta que ha visto todo lo que v1 ofrece.

---

## Bloque 3 — Mapa y estructura del mundo

16. [★] ¿Cuántas zonas/regiones distintas tiene el mundo de v1? Rango.

- 5 regiones: Centro, Norte, Sur, Este, Oeste. 180 grids totales repartidos 50/35/35/30/30 (Centro denso como hub, periferias ralas y peligrosas). El grid es subdivisión del mismo overworld, no pantalla aparte.

17. ¿El mapa es generado proceduralmente, fijo y diseñado a mano, o híbrido (estructura fija, contenido aleatorio)?

- Híbrido. 80 POIs curados a mano con evento fijo de quest/lore (disparan automático al descubrir, una vez por savegame). 640 POIs genéricos resueltos por tirada d20 sobre tabla por arquetipo. Se valora la opción de "Creador de Campañas aleatorias" para v2 o v3 (tener en cuenta en arquitectura desde el principio).

18. [★] ¿Cómo se descubre el mapa: niebla de guerra clásica, revelación por POIs, mapa visible desde el inicio, otra?

- Mapa de regiones visible desde el inicio con sus 180 grids dibujados. Niebla de guerra a nivel de POI: dentro de cada grid los POIs aparecen como ??? hasta visitarse. Al pisar un POI se resuelve (curado dispara evento fijo, genérico tira d20). Una vez visitado, el nombre del POI queda almacenado. El grid pasa de Inexplorado a Explorado a Controlado según progreso.

19. ¿Hay fast travel? Si sí, ¿desde el inicio o se desbloquea?

- Desbloqueable, solo entre grids Controlados, vía anclas que se establecen al limpiar el grid. Consume recursos (raciones / días de jornada — coste exacto por determinar). Desde inicio rompería la economía de raciones y la fatiga de jornada.

20. Densidad de POIs por zona: ¿pocos y densos (5-10), medios (15-25), muchos y dispersos (40+)?

- 3-5 POIs por grid, ~720 totales. 4 arquetipos: Natural, Ruina, Asentamiento, Arcano. Curados distribuidos: ~30 nodos en Centro (ciudades, santuarios), ~25 en corredores narrativos (rutas que conectan regiones), ~25 anclas remotas en periferia. POIs genéricos resuelven por tabla d20 con bandas (1 peligro real, 2-3 combate menor, 4-12 color del mundo, 13-15 encuentro neutral, 16-17 recurso, 18 pista/rumor, 19 oportunidad, 20 legendario). Tres capas de modulación: bioma + estado de grid + memoria de progresión.

21. [★] ¿El movimiento entre zonas es por casillas/turnos, por tiles continuos, por nodos de viaje (estilo FTL), por mapa overworld?

- Overworld continuo con zoom semántico. Un solo mapa para todo el mundo, sin pantallas de transición entre regiones ni dos niveles de mapa. El grid es región del mismo mapa. Entrar a un POI sí abre pantalla de contenido (combate, lore, evento).

22. ¿Hay ciclos día/noche o estaciones que afecten la jugabilidad? Si sí, ¿cuánto?

- Sí. Fatiga de jornada como reloj mecánico (entra en MVP): 8 tiradas/acciones por día. Al agotar la jornada, acampada obligatoria que consume una ración y recupera fatiga. Sin ración: penalizador a tiradas y eventualmente daño. Estaciones modulan la tabla d20 desde la tercera capa de modulación (memoria de progresión), no son cosméticas.

23. ¿El mundo cambia entre runs (semilla nueva) o es el mismo mundo siempre?

- Mundo fijo. Las 5 regiones, los 180 grids y los 80 curados están anclados siempre en el mismo sitio. Lo que cambia entre runs es el estado: grids vuelven a Inexplorado, POIs genéricos re-tiran su d20, curados disparan otra vez al descubrirlos. La geografía no se baraja. Opción de mundo aleatorio se contempla para v2/v3, no para v1.

---

## Bloque 4 — Átomo de lore

24. [★] ¿Cómo se sirve un fragmento de lore al jugador en partida? (Texto plano leído, diálogo de NPC, objeto inspeccionable, evento, las tres).

- Embebido en flujo. Texto del POI al descubrirlo, frase atmosférica del 45% color del mundo, diálogo de NPC, descripción de item o cicatriz. Sin pop-up de códice en MVP. El lore se lee mientras se juega, no en una pantalla aparte. Códice consultable se valora para v1.5+.

25. [★] Schema mínimo de un átomo de lore: ¿qué campos tiene siempre? (id, título, cuerpo, asociado a entidad X, condición de descubrimiento, ¿algo más?).

- Obligatorios: `id`, `body`, `length` (short/medium/long), `voice` (cronista/npc/objeto/ambiente). Opcionales: `boundTo` (poi/item/enemy/npc/event), `unlockCondition`, `tags`, `relatedAtoms`. Largos y medios en `src/data/lore/` agrupados por tema (caida.ts, teknomoros.ts, naturaleza.ts, demoniaco.ts). Cortos junto al sistema que los consume (`src/data/exploration/poi-flavor.ts`). Items/enemies/perks mantienen su descripción in-line, no se duplica.

26. Longitud típica de un átomo: ¿50 palabras, 150, 500? Rango.

- Tres tallas. Cortos <50 palabras (color del mundo, atmósfera, pista). Medios 50-150 (POI curado, item raro, evento memorable). Largos >150 (POI legendario, NPC central, hito de la Caída). El grueso son cortos.

27. ¿Un átomo se descubre una vez y queda en el "códice", o reaparece según contexto?

- Una vez. No reaparece. Si quiero refrescar al jugador, lo hago con un átomo nuevo que lo cite o lo contradiga. El códice consultable lo dejo para v1.5+; en MVP el jugador lo vive y se acuerda o no.

28. [★] ¿Cuántos átomos de lore necesita v1 para no sentirse vacío? Rango realista que tú estés dispuesto a escribir.

- v1 defendible: ~100 átomos seed (20 largos + 30 medios + 50 cortos). Ampliable a ~345 (15 largos + 80 medios + 250 cortos) en 3 meses si me siento. Nunca menos de 100 o se nota vacío. Estimación honesta de escritura: ~50 horas reales repartidas en bloques de 1-2 h dos veces por semana durante 3 meses.

29. ¿Los átomos están escritos a mano por ti, generados, o mixtos (estructura generada, prosa tuya)?

- Escritos a mano por mí. Los pools cortos (color del mundo, atmósfera de banda) los escribo en lotes de 30 frases por sesión — semi-procedural en producción pero a mano en origen. Sin generación automática. Solo necesitaria los esquemas.

30. ¿Hay relaciones entre átomos (este átomo desbloquea otro, este contradice otro)? ¿O son piezas sueltas?

- Piezas sueltas con tags. Sin grafos de desbloqueo (deuda de escritura). Sí marco contradicciones explícitas entre 5-10 pares (verdad oficial vs vieja, conecta con Bloque 17 del lore) — el sistema puede señalarlas discretamente cuando el jugador descubre la segunda versión. Resto, sueltas.

31. [REPO] ¿El lore tiene voz narrativa única (un narrador, un cronista) o cada átomo tiene la voz de su fuente? El lore del mundo ya tiene tono establecido en memoria; confirma si se traduce 1:1 al átomo.

- Voz por fuente: cronista, NPC, objeto, ambiente. Cuatro registros diferenciados con párrafo-muestra de cada uno fijado en memoria de proyecto antes de empezar a escribir átomos en serio (tarea de 30 min). Default cronista cuando no hay fuente clara.

---

## Bloque 5 — Combate y muerte

32. [★] ¿Qué porcentaje del tiempo de juego es combate? Rango: <10%, 10-30%, 30-50%, >50%.

- 10-30%. El paseo manda, el mundo es el 45% del tiempo, el combate es el pico de tensión, no el cuerpo del juego. Encuentros menores resolutivos rápidos (1-3 turnos), curados más largos. Si el jugador pasa más de un tercio peleando, algo está mal calibrado en la densidad de POIs.

33. [REPO] ¿El combate sigue el motor d20 ya construido, lo simplifica, o lo sustituye? El módulo `rules.ts` ya existe.

- Sigue el motor d20 tal cual. `src/rules/combat.ts` es sagrado, ya está validado con 60.000 combates contra el lobo. No se simplifica ni se reemplaza. Se profundiza por encima con Statuses (PASO 4a), Perks (4b) e IA con perfiles y condiciones de victoria por escena (4c). El núcleo no se toca.

34. [★] ¿El combate es resolutivo (ganas o pierdes en una pantalla) o procesual (varios turnos tácticos en grid)?

- Resolutivo abstracto, sin grid. La profundidad viene por turnos: statuses que duran, perks que disparan condiciones, IA que telegrafía intents. Referente BG1 encuentro menor + Darkest Dungeon en feel táctico (no en filas). Nada de pathfinding, LoS ni cobertura XCOM.

35. ¿La muerte ocurre por combate, por hambre/recurso, por decisiones narrativas, por todas?

- Las tres. Combate como vía principal. Hambre/recurso vía fatiga de jornada (Bloque 3, sin ración → daño acumulado → muerte). Decisiones narrativas en eventos puntuales de POIs curados o legendarios. Permadeath en todos los casos, items de salvación permitidos.

36. ¿El jugador puede evitar el combate por completo en una run? ¿O hay encuentros forzados?

- El combate menor es evitable: `flee` se implementa ya (hoy lanza Error, es deuda). Huida con tirada o coste (durabilidad, oro, condición). Encuentros curados y legendarios son forzados, son parte del lore y del ritmo. Una run pacifista pura no debería ser viable; una run de evasión máxima sí.

37. ¿Qué se siente al morir: frustración productiva (entiendo el error), aleatoriedad cruel (mala suerte), inevitabilidad (el mundo es duro)?

- Frustración productiva. El jugador tiene que entender qué falló: status no cubierto, perk mal elegido, intent del enemigo leído tarde. Combate transparente con log claro e intents visibles tipo Slay the Spire. Si muere y no sabe por qué, he fallado yo, no él. Aleatoriedad cruel está prohibida.

38. ¿Hay dificultad ajustable, o el juego tiene una sola curva?

- Curva única en v1. Soy uno solo, no puedo balancear N niveles a la vez. El motor ya simula 60.000 combates por enemigo, esa es mi herramienta de calibrado. Dificultad ajustable se mete en v1.1+ como Ascensiones tipo Slay the Spire, cuando el juego tenga identidad cerrada y un modo "honesto" que sirva de baseline.

---

## Bloque 6 — Producción y ritmo

39. [★] Horas reales por semana que vas a dedicar a El Teknomoro durante los próximos 3 meses. Rango honesto.
-

40. [★] De esas horas, ¿qué porcentaje quieres dedicar a: diseño/escritura, código directo contigo, código vía Claude, pruebas/jugar, otros?
-

41. ¿Qué tareas haces tú siempre y no delegas a Claude?
-

42. ¿Qué tareas delegas a Claude por defecto y solo revisas el resultado?
-

43. [★] ¿Hay fechas externas (release, demo, evento) que condicionen el calendario? Si no, ¿cuándo te dirías a ti mismo "esto va lento"?
-

44. ¿Trabajas mejor en sprints temáticos (semana entera de combate, semana entera de mapa) o en frente abierto (un poco de todo cada día)?
-

45. ¿Cuándo es tu momento de máxima energía creativa para escribir lore? ¿Y para revisar código?
-

46. ¿Qué señal te dice que estás procrastinando con tooling en vez de avanzando contenido?
-

---

## Bloque 7 — Herramientas y stack

47. [REPO] Stack navegador (TS + Canvas vanilla, sin frameworks) y aislamiento de `rules.ts`: confirmas que se mantienen tras el pivote.
-

48. [★] ¿Qué partes del código actual se reutilizan tal cual, qué se reescribe, qué se tira?
-

49. ¿Necesitas alguna herramienta nueva (editor de mapas, editor de átomos de lore, generador de stats) o tiras con texto plano + scripts?
-

50. [★] Skills custom de `.claude/`: ¿cuáles mantienes (modopipeline, prompt-master, impeccable, director, simulaciones d20), cuáles retiras, cuáles necesitas crear?
-

51. ¿Quieres que el flujo de trabajo de lore tenga su propio pipeline (estilo modopipeline pero para escribir átomos)?
-

52. ¿Repositorio único o separas backend/contenido/herramientas?
-

---

## Bloque 8 — Patrones de trabajo Bazalo ↔ Claude

53. [★] Cuando arrancas una sesión de trabajo, ¿qué quieres que Claude haga primero por defecto? (Leer biblia, leer scope, preguntar objetivo de la sesión, abrir tareas pendientes).

- Lee la biblia (`references/biblia-del-juego.md`) y la lista de hitos cerrados antes de abrir la boca. Cero preguntas hasta tener el contexto cargado. Excepción: si la sesión arranca con MODOPIPELINE explícito (UI), ese flujo gatea y manda. Preguntar "¿qué hacemos hoy?" a pelo está prohibido — si no hay tarea clara, propone tú la siguiente basándote en hitos.

54. [★] ¿En qué tipo de decisión Claude debe parar y preguntarte siempre, y en cuál debe ejecutar sin preguntar? (Esto refina la regla de "iniciativa ejecutiva" que ya tienes en memoria).

- Ejecuta sin preguntar: sub-pasos internos de un hito ya acordado, refactors que respeten módulos sagrados (`src/rules/`, `src/data/`), elecciones de arquitectura interna (nombres, estructura de archivos, helpers).
- Para y pregunta: decisiones de producto (qué feature entra/sale, qué número va al motor), cualquier cosa que toque sagrados, cierre de sub-paso (recapitula y espera OK), commits y pushes (uno a uno, OK explícito por cada acción).

55. ¿Quieres que Claude proponga simulaciones por defecto cuando toques números, o solo cuando se las pidas?

- Sí, por defecto. Cualquier cambio que toque números de balanceo (daño, dados, umbrales, XP, economía) dispara propuesta de simulación con la skill d20 antes de codificar. No espera a que yo la pida. Excepción: ajustes de UI o constantes cosméticas.

56. ¿El director sigue siendo necesario como capa, o quieres un único agente sin "personalidades"?

- Se mantiene. El director ha demostrado palanca real cuando hay que levantar la cabeza al flow completo y no decidir por mayoría de archivos. Quitarlo es perder el contrapeso. Personalidad única sin capas convierte a Claude en yes-man.

57. [REPO] MODOPIPELINE para UI ya está. ¿Algún flujo equivalente para combate, lore o mapa? Define cuáles.

- Sí, pero un solo flujo: **MODOPIPELINE-CONTENIDO** para combate, lore y mapa. Tres pipelines distintos sería burocracia. Estructura: Prompt Master adapta el brief al dominio (mecánica / texto / topología), director valida coherencia con biblia, impeccable cierra. UI sigue con su MODOPIPELINE actual aparte porque tiene fase visual propia. Crear el modopipeline-contenido cuando entre el primer hito de contenido, no antes.

58. ¿Cómo quieres que Claude te entregue el trabajo: commits propuestos, parches en chat, archivos escritos directos, mezcla?

- Por defecto: archivos directos al repo + commits propuestos con OK explícito por cada uno (push aparte, otro OK). Parches en chat solo para fragmentos de discusión o cuando los pido. Nunca volcar bloques largos en chat si pueden ir a archivo. Regla: si va al juego, va a archivo; si es para decidir algo, va a chat.

59. ¿Quieres una "sesión de cierre" al final de cada día con resumen y siguientes pasos, o eso es ruido?

- Útil, no ruido — pero corto. Tres líneas máximo: qué se cerró hoy, qué quedó a medias, cuál es el siguiente paso al abrir mañana. Sin recapitulaciones largas ni resumen narrativo. Si el día no tuvo cambios sustanciales, se omite.

---

## Bloque 9 — Alcance del v1 y release

60. [★] Lista los 5-7 elementos sin los cuales no llamarías "v1" a esto. (Sé brutal: no más de 7).

- v1 son 7 cosas, todas con criterio binario:
  1. Motor d20 con statuses (≥6 cableados) + perks (5 iniciales aplicando efecto real) + IA (3 perfiles tácticos) en combate.
  2. 3 regiones jugables (de las 5 totales) con biomas distintos, transiciones y fatiga de jornada activa.
  3. 40 POIs curados con evento fijo + tabla d20 con 4 arquetipos (Natural/Ruina/Asentamiento/Arcano, 20 entradas cada uno).
  4. 15 enemigos únicos con perks asignados (ninguno con `perks: []`).
  5. 20 items + 8 recetas básicas, todas usables en combate o exploración.
  6. Persistencia entre runs: lore desbloqueado, mapa visitado, recetas aprendidas, stats globales.
  7. Onboarding con bandera narrativa (`viajero_audaz`/`viajero_cauto`, decisión #45) + final del Teknomoro alcanzable (condición de victoria de la campaña 1).
  8. Hitos roguelike con desbloqueos permanentes (clases nuevas, zonas iniciales distintas, ítems de partida) entre runs. Cantidad concreta la decide el director cuando v1 esté esqueletado.

  Si falta uno, no es v1.

61. [★] Lista 3 cosas que te pica meter en v1 pero que sabes que tienen que esperar a v1.1.

- Tres cosas duras que dejo para v1.1:
  1. Las 2 regiones periféricas (de 5 totales). En v1 quedan visibles pero bloqueadas con muro narrativo.
  2. Música compuesta. v1 va con SFX UI mínimos CC0 y silencio.
  3. Sandbox post-final con eventos endgame y NG+. En v1 el post-final existe pero es "el mundo sigue ahí, vuelve si quieres".

  Duele, pero si las meto v1 no sale en 4-5 meses.

62. ¿v1 se publica en algún sitio (itch.io, GitHub Pages, dominio propio) o es solo para enseñar a amigos?

- GitHub Pages. Gratis, control total, deploy desde el repo. Ahora mismo busco que 5-10 amigos lo prueben sin fricción, no tráfico. itch.io espera a v1.1 cuando haya feedback y quiera visibilidad. Dominio propio queda v1.2 si hace falta.

63. ¿Hay tutorial dentro del juego o el aprendizaje es por exploración?

- Aprendizaje por exploración. Sigue válido el onboarding con lobo + bandera narrativa (`viajero_audaz`/`viajero_cauto`) ya decidido en biblia (decisión #45). No habrá tutorial modal ni tooltips. Los 3 primeros POIs enseñan jugándose: los textos del evento explican implícitamente cada acción.

64. ¿v1 tiene sonido/música o es silencioso?

- Silencio en música v1. Solo SFX UI mínimos (click, hit, level up) con CC0 de freesound. Ambient procedural no compensa (40h de trabajo para algo mediocre). Música compuesta queda v1.2. El silencio con SFX limpios se lee como minimalismo deliberado, no como incompleto.

65. ¿Cuál es la condición concreta que dirá "v1 está listo para que un externo lo abra"? Una frase.

- "Un jugador externo puede empezar una run, alcanzar el final del Teknomoro o morir permadeath, en las 3 regiones jugables, sin bug que bloquee progreso ni flujo, entendiendo cada acción sin preguntarme."

---

## Bloque 10 — Líneas rojas y futuras

66. [★] ¿Qué cosa NO harás nunca en este juego, aunque la tentación venga? (Multijugador, microtransacciones, IA generativa en runtime, lo que sea).

- Nunca, aunque la tentación venga:
  - Microtransacciones.
  - IA generativa en runtime dentro del juego.

67. ¿Qué tropos del género evitas activamente?

- **El erial marrón Mad Max.** Post-humano no significa desierto seco con motos. La naturaleza ha vencido: hay verde, agua, hongos, bosques que comen carreteras.
- **El códice modal del Witcher/Dragon Age.** Pausar para leer un muro de texto rompe el paseo. El lore se cuenta con la cámara y los objetos, no con un menú de enciclopedia.
- **El crafteo-spreadsheet tipo Stoneshard/Project Zomboid.** Inventario tetris, hambre/sed/fatiga simuladas al minuto, recetas de 14 pasos. No.
- **La granjita acogedora Stardew/cozy-game.** Aquí no se viene a regar tomates. Hay tensión ambiental constante, no horror, pero tampoco confort burgués.
- **El combate cinemático en tiempo real con esquivas y parries.** Resolutivo y abstracto, como mesa. Quien quiera Dark Souls que juegue Dark Souls.
- **El elegido profetizado y el mal absoluto.** El Teknomoro es un mundo después del hombre, no una space opera moral. Lo demoníaco existe, pero raro y reverencial, no un BBEG con cuernos esperando en el acto 3.
- **El hub social tipo Baldur's Gate con romances y companions parlanchines.** El paseo es del jugador, no de un coro de NPCs comentando cada piedra.

68. ¿Qué reservas para v1.1+? Una línea por elemento, máximo 5 elementos.

- Reservado para v1.1+:
  - Mapa completo (las 5 regiones desbloqueadas, no solo 3).
  - Editor del juego.
  - Exportación a motor externo (instalador independiente del navegador).
  - Multijugador (a confirmar, no decidido).
  - 2 mapas completos como expansiones, con contenido propio.

69. ¿Qué cosa, si alguien te la pidiera, te haría decir "ese no es mi juego, juega a otro"?

- Combate en tiempo real. Si alguien pide eso, no es mi juego, que juegue a otro.

70. Si dentro de un año el juego ha funcionado, ¿qué quieres que diga la gente sobre él en una frase?

- "Un juego para descubrir el lore de un mundo. Mecánicas accesibles pero con profundidad competitiva. Desarrollo premium."


---

**Total: 70 preguntas. 22 marcadas [★] como bloqueantes. 6 marcadas [REPO] como confirmación rápida.**

---

## C. Cómo lo procesamos juntos después

Cuando tengas este cuestionario y `cuestionariolore.md` rellenos:

1. **Lectura del director bloque por bloque, una sentada.** No responde aún. Solo identifica contradicciones internas y contradicciones cruzadas con el lore.
2. **Una sesión de 30-45 min** donde te paso solo las contradicciones encontradas y las cerramos. Nada más en esa sesión.
3. **El director redacta borrador de nueva biblia v0.20** con las decisiones derivadas de tus respuestas, marcando claramente qué es decisión tuya literal y qué es deducción suya.
4. **Tú revisas la biblia en una pasada**, marcas lo que no te suena, y eso vuelve a sesión corta.
5. **Una vez biblia fija**, deriva el nuevo scope (qué se conserva del código, qué se tira, qué se hace nuevo) y la lista de skills custom a mantener/crear/retirar.
6. **Antes de tocar una línea de código**, te enseña: biblia v0.20 + scope + lista de skills. Si das OK a los tres, empezamos a ejecutar bajo el nuevo régimen.

Tiempo total de proceso desde "cuestionarios rellenos" hasta "primera línea de código nueva": entre 3 y 5 días si vas en serio. Si tarda más de 7 días estamos procrastinando.
