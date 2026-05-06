# Cuestionario de Scope — Sub-paso 4e del Hito 4

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el sub-paso.
> **Propósito:** cerrar las decisiones de UX/UI/cableado del sub-paso 4e (fast travel + anclas + condición Controlado + UI de viaje rápido) antes de disparar MODOPIPELINE. El scope macro de H4 ya está cerrado en biblia v0.22 (decisión #83 confirma "1 ración + 2 acciones por viaje, plano por ahora, parametrizado por distancia desde la primera implementación"). Este cuestionario refina los detalles operativos.
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22.** Fast travel solo entre grids Controlados (#70). Anclas colocadas explícitamente por el jugador (#70). Coste 1 ración + 2 acciones por viaje, parametrizado por distancia, calibrado en H6 (#83). Estos no se discuten.
2. **No es un sistema económico completo.** Las raciones ya están en 4d. El catálogo de items real entra en H6.
3. **No diseña tablas de exploración.** Eso es 4f. El fast travel atravesando zona "salvaje" puede en el futuro disparar tiradas condensadas (§4.10 menciona el concepto), pero en 4e se asume "fast travel = teletransporte instantáneo entre anclas con coste".

**Convención de marcas:**
- **[★]** = bloqueante de decisión.
- **[REPO]** = ya existe respuesta parcial en biblia/scope. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Concepto de ancla

1. [★] Una ancla es:
   - (a) **Un objeto físico** que el jugador coloca en un grid Controlado (consume un item del inventario tipo `ancla`).
   - (b) **Una marca lógica** que se establece automáticamente al alcanzar estado Controlado (sin coste material adicional).
   - (c) **Un acto del jugador** que requiere una habilidad / acción específica ("Plantar ancla aquí" — gasta 1 acción del día + 1 item).
-

2. [★] ¿Cuántas anclas puede tener el PJ activas a la vez?
   - (a) Sin límite (cualquier grid Controlado tiene ancla).
   - (b) Cap por nivel del PJ (e.g. nivel 1: 3 anclas, nivel 5: 5, etc).
   - (c) Cap fijo (5 anclas máx en cualquier momento del run).
   - (d) 1 ancla por región (5 anclas máx, una por región).
-

3. ¿Las anclas se **acumulan** entre runs o se reinician con permadeath?
   - (a) Se reinician con permadeath (cada PJ pone sus anclas).
   - (b) Persisten entre runs (decisión #65 menciona "POIs visitados sobreviven entre runs"; ¿anclas también?).
-

4. ¿La ubicación de un ancla es:
    - (a) Un **grid completo** (el ancla cubre el grid entero, fast travel "al grid X").
    - (b) Un **POI específico** dentro del grid (fast travel "al POI Asentamiento del Sur").
    - (c) Una **posición libre** dentro del grid (el jugador elige dónde plantar el ancla).
-

5. ¿Hay diferencia entre "ancla del jugador" (puesta en este run) y "punto de viaje pre-establecido" (e.g. ciudades importantes)?
    - (a) No, todas las anclas son del jugador.
    - (b) Sí, hay anclas pre-establecidas en POIs Asentamiento (incluyendo el del Sur que es el home) que están siempre activas; las del jugador son extra.
-

6. [REPO] §9.7 dice que el home es POI Asentamiento del Sur. ¿El home tiene **ancla automática** desde el inicio del run, o el jugador debe Controlar el grid `sur-001` antes de poder fast-travel ahí?
    - Mi propuesta: ancla automática en el home (es el spawn point + hub). Confirma o ajusta.
-

---

## Bloque B — Condición de "Controlado" para un grid

7. [★] Un grid pasa a estado **Controlado** cuando:
    - (a) Todos sus 4 POIs han sido **visitados** (al menos una vez).
    - (b) Todos sus 4 POIs han sido **completados** (combate cerrado, evento resuelto).
    - (c) El jugador planta un **ancla** explícitamente (acto independiente del estado de los POIs).
    - (d) Una **combinación**: 50% de POIs visitados + ancla plantada.
-

8. ¿Hay grids que **nunca** pueden ser Controlados (e.g. el grid del POI Arcano final, donde está el evento Teknomoro)?
    - (a) No, cualquier grid puede ser Controlado.
    - (b) Sí, los grids con POI Arcano final están bloqueados como "Inestables" — fast travel imposible.
    - (c) Decidirá el contenido en fase 2.
-

9. [REPO] §9.6 dice que el estado del grid modula los pesos de la tabla d20 (4f). En 4e ya se persiste el estado del grid. ¿En 4e se introduce el estado **Controlado** ya, o solo se cablea como "puede ser Controlado pero no se calcula hasta 4f"?
-

10. ¿El estado **Controlado** afecta algo además de habilitar fast travel? (e.g. spawn de eventos cambia, recursos garantizados según §9.6).
    - Asumo: en 4e habilita solo fast travel; los efectos sobre tabla d20 entran en 4f. Confirma.
-

11. ¿El estado del grid puede **regresar** de Controlado a Explorado? (e.g. si el PJ no visita el grid en X días, los enemigos vuelven). Asumo NO en MVP. Confirma.
-

---

## Bloque C — UX de plantar ancla

12. [★] ¿Cómo planta el jugador un ancla?
    - (a) **Botón "Plantar ancla"** disponible en vista de grid cuando el grid cumple condición de Controlado.
    - (b) **Automático** al cumplir la condición (ningún click).
    - (c) **Modal de propuesta** al cumplir condición ("¡Has Controlado este grid! ¿Plantar ancla aquí?" → `[Sí]` / `[No]`).
-

13. Si plantar ancla **gasta un item** (ancla física, opción 1.a), ¿de dónde sale el item? ¿El PJ empieza con N anclas en inventario? ¿Las recibe vía POIs?
    - Asumo: empieza con 0, las consigue vía recompensas de POIs (40 POIs curados en regiones, 20 dan ancla como recompensa).
    - O: las anclas son recurso "abundante" como las raciones.
    - O: las anclas son **abstractas** (sin item físico, plantar ancla es solo un acto).
-

14. ¿Plantar ancla consume **acciones del día**?
    - Default propuesto: 0 acciones (es un acto que cierra el control del grid, no una acción de exploración). Si requiere ítem físico, entonces 1 acción para "instalar el ancla" parece justo.
-

15. ¿El jugador puede **mover/desinstalar** un ancla?
    - (a) Sí, puede recoger el ancla y plantarla en otro grid.
    - (b) No, una vez plantada queda fija.
    - (c) Sí pero costoso: requiere el item, gastar acción, y deja el grid vuelta a "Explorado".
-

16. Si el cap de anclas es 5 y el jugador ya tiene 5, al intentar plantar la 6ª:
    - (a) Modal de elección: "¿Cuál de las anclas existentes quieres mover aquí?".
    - (b) Bloqueado: "Has alcanzado el cap. Recoge un ancla antes de plantar otra".
    - (c) Sustitución automática del ancla más antigua.
-

---

## Bloque D — UX del fast travel

17. [★] ¿Desde dónde se inicia un fast travel?
    - (a) **Vista regional**: click en grid Controlado con ancla → modal "Viajar aquí".
    - (b) **Botón "Fast travel"** en HUD que abre lista de anclas disponibles → seleccionar destino.
    - (c) **Vista de POI Asentamiento**: el POI tipo Asentamiento tiene botón "Fast travel" que abre la lista de anclas.
    - (d) Combinación de (a) y (b).
-

18. ¿La vista regional **distingue visualmente** los grids con ancla (e.g. icono de ancla sobre el grid)?
    - Asumo sí. ¿Color del icono distinto al colorHex del grid? ¿Tamaño del icono?
-

19. ¿La lista de anclas (si existe) muestra:
    - (a) Solo el nombre / ID de la ancla.
    - (b) Nombre + región + distancia desde grid actual + coste.
    - (c) Nombre + screenshot pequeño del grid + descripción.
-

20. [★] El coste de fast travel: **1 ración + 2 acciones, plano** (decisión #83). ¿Cómo se muestra al jugador antes de confirmar?
    - (a) "Viajar costará: 1 ración, 2 acciones". Mostrado en modal con `[Confirmar]` / `[Cancelar]`.
    - (b) Coste implícito (se cobra al confirmar sin preview).
    - (c) Detalle desglosado: "1 ración (te quedan X) — 2 acciones (te quedan Y/8)".
-

21. ¿Qué pasa si el jugador intenta fast travel y **no tiene suficientes raciones / acciones**?
    - (a) Botón "Confirmar" deshabilitado con tooltip "Necesitas X ración Y acciones".
    - (b) Modal informativo "No tienes recursos suficientes" + sugerencia (consigue ración / acampa).
    - (c) Bloqueado sin explicación.
-

22. ¿Fast travel al **mismo grid donde está el PJ** está permitido? Asumo NO (botón gris en la propia ancla). Confirma.
-

23. ¿La animación / transición de fast travel es:
    - (a) Inmediata (cambio de grid sin animación).
    - (b) Fade corto (200-300 ms).
    - (c) Animación de "viaje" (mapa con línea de A → B + indicador del PJ moviéndose).
    - (d) Modal de "tirada condensada" (placeholder en 4e, real en 4f cuando el viaje arriesgado dispare tabla).
-

24. Tras fast travel, ¿el PJ aparece en el **POI tipo Asentamiento** del grid de destino, o en una posición neutral del grid?
-

---

## Bloque E — Costes y parametrización

25. [★] El coste actual es plano: 1 ración + 2 acciones por viaje. La fórmula real se calibra en H6, pero "parametrizada por distancia desde la primera implementación" (#83). En 4e:
    - (a) `computeFastTravelCost(distanceInGrids)` devuelve siempre `{ raciones: 1, acciones: 2 }` ignorando `distance`.
    - (b) `computeFastTravelCost(distanceInGrids)` ya considera distancia: `{ raciones: 1, acciones: 1 + ceil(distance / 5) }` o algo similar como propuesta.
    - (c) Decide el director.
-

26. ¿"Distancia" se mide en grids, en regiones, o en saltos cardinales?
    - (a) Saltos cardinales (Manhattan) entre grid origen y destino sobre el cartesiano del director (4a).
    - (b) Saltos en línea recta (Euclídea).
    - (c) Saltos por "rutas de caminos" (placeholder de futuro sistema de rutas).
-

27. ¿Hay un **coste mínimo** y un **coste máximo** para evitar valores absurdos?
    - Default propuesto: min 1 ración + 2 acciones, max 1 ración + 5 acciones. ¿Aceptas?
-

28. ¿El **modo Libre** (decisión #13) modifica el coste de fast travel? Asumo NO en 4e — el modo Libre solo modula contenido (tabla d20), no economía base.
-

29. ¿Algún perk / arquetipo / atributo modifica el coste de fast travel? (e.g. "Pies Ligeros" reduce 1 acción).
    - Asumo NO en 4e (calibración fina diferida a H6/H8). Confirma.
-

---

## Bloque F — Cableado del sistema

30. [★] ¿Dónde vive el sistema de fast travel en código?
    - (a) `src/rules/fast-travel.ts` SAGRADO (función pura `canFastTravelTo`, `computeFastTravelCost`, `executeFastTravel`).
    - (b) `src/state/travel.ts` (orquestador, lee/escribe `Character` y `worldState`).
    - (c) Ambos: módulo SAGRADO con lógica pura + orquestador en state.
-

31. [REPO] El repo ya tiene `src/rules/fast-travel.ts` (heredado del esqueleto extendido — biblia §3.2 línea 131). ¿4e **reescribe** este módulo o lo **extiende**?
    - El módulo actual probablemente cablea el modelo viejo (BFS + tirada condensada sobre nodos discretos). El nuevo modelo es overworld continuo.
-

32. ¿El estado **Controlado** del grid se persiste en `worldState` o se calcula en runtime al consultar?
    - (a) Persistido (rendimiento).
    - (b) Calculado (fuente única de verdad: el estado de POIs).
    - (c) Calculado al cargar partida + cacheado en `worldState`.
-

33. ¿La lista de anclas activas se persiste en `Character.anchors: string[]` (gridIds), en `worldState.anchors`, o en tabla aparte de Supabase?
-

34. ¿Hay tests unitarios sobre `canFastTravelTo`, `computeFastTravelCost`, `executeFastTravel`? Estimación 15-20 tests.
-

---

## Bloque G — Edge cases y deuda

35. ¿Qué pasa si el jugador hace fast travel **al grid donde tiene el ancla pero ahora ese grid ha perdido estado Controlado** (caso edge: opción 11.b si lo aceptas)?
    - Asumo: imposible si Controlado no regresa. Confirma o ajusta.
-

36. ¿Qué pasa si el jugador hace fast travel **mientras una animación de zoom está corriendo** (vista regional → grid)?
-

37. ¿Qué pasa si el jugador hace fast travel **con HP crítico** (e.g. 1 HP)? ¿El viaje es seguro o puede morir?
    - Asumo: viaje siempre seguro en 4e (no hay tabla de riesgo todavía). Tirada de viaje arriesgado entra cuando 4f cierre.
-

38. ¿Qué pasa si el jugador **agota acciones del día por fast travel** (gastó 2 acciones, le quedaban 2 → ahora 0)?
    - Asumo: misma lógica de 4d (forzado a acampar). Confirma.
-

39. ¿Fast travel **mientras se está dentro de un POI** está permitido o el PJ debe salir antes?
    - Default propuesto: solo desde vista regional o vista de grid. POI debe cerrarse antes.
-

40. ¿Qué pasa si el jugador inicia fast travel y **cierra navegador** durante la animación / modal?
    - Asumo: estado guardado, al recargar el PJ está en grid origen sin gastos cobrados.
-

---

## Bloque H — Visión y deudas

41. ¿Hay algún tropo de fast travel en RPGs que quieras evitar específicamente?
    - Default a evitar: "fast travel gratis a cualquier sitio descubierto" (Skyrim) — ya cerrado en #70 (solo Controlados).
-

42. ¿Tu intuición de "anclas + grids Controlados" viene de algún juego concreto (Caves of Qud, Pillars of Eternity, otro)?
-

43. ¿Quieres que el fast travel tenga algún **sabor narrativo** ya en 4e (e.g. texto cuando viajas: "Caminas durante días por senderos conocidos, llegas a Y") o eso es contenido de fase 2?
-

44. ¿El **POI Arcano** (uno de los 4 arquetipos) se considera viajable con fast travel cuando esté Controlado? ¿O hay POIs / grids que se reservan como "siempre arriesgados"?
-

45. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto?
-

46. ¿Algún caso borde de UX que te preocupe específicamente en 4e?
-

47. ¿Quieres que haya un **límite por día** (e.g. máximo 1 fast travel por día) para evitar que el sistema se abuse y el contador de acciones sea irrelevante?
-

48. ¿El sonido de fast travel (cuando entre audio en H10) tiene algún imaginario? (no decisión técnica, solo si tienes intuición).
-

49. ¿Quieres que el fast travel muestre el "**diario de viaje**" (resumen de los días que pasaron viajando) o eso es ruido?
-

50. ¿Algún sistema futuro (e.g. quests, eventos cíclicos en H5+) que pueda complicar fast travel y que quieras anticipar ya en 4e?
-

---

**Total: 50 preguntas. 6 marcadas [★] como bloqueantes. 3 marcadas [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lee y identifica contradicciones internas + cruzadas.
2. Sesión corta donde te paso solo las contradicciones.
3. MODOPIPELINE arranca para 4e: Prompt Master adapta brief, director valida, impeccable cierra.
4. Cierre del sub-paso: 1-2 commits con OK explícito uno a uno.
