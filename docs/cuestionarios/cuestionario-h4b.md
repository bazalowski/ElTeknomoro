# Cuestionario de Scope — Sub-paso 4b del Hito 4

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el sub-paso.
> **Propósito:** cerrar las decisiones de UX/UI/cableado del sub-paso 4b (vista regional + zoom continuo a vista de grid) antes de disparar MODOPIPELINE. El scope macro de H4 ya está cerrado en biblia v0.22 (decisiones #81-#85); este cuestionario refina los detalles operativos del sub-paso.
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar. Si sub-pasos previos (4a ya cerrado) o hitos posteriores descubren algo que las invalide, la decisión se reabre. No es contrato eterno: es contrato operativo.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22.** El zoom continuo (no modal) está cerrado en decisión #83. La distribución 50/35/35/30/30 está cerrada en #82. La home como POI Asentamiento del Sur está cerrada en #85. Si una pregunta apunta a una decisión ya cerrada, está mal redactada y se descarta.
2. **No es un brief de implementación.** Sin clases TypeScript, nombres de funciones, ni patrones de render. Eso lo deriva el director al ejecutar.
3. **No diseña 4c-4f.** Cada sub-paso tiene su cuestionario propio. Si una pregunta sobra aquí, márcala y se mueve.
4. **No mete preguntas trampa.** Cada pregunta abre trabajo concreto.
5. **No exige número exacto cuando un rango sirve.**

**Convención de marcas:**
- **[★]** = bloqueante de decisión. Sin esta respuesta, MODOPIPELINE no puede arrancar.
- **[REPO]** = ya existe respuesta parcial en biblia/scope/PRODUCT/DESIGN. Confirmar o matizar, no contestar en blanco.
- Sin marca = respuesta de calibración. Importante pero no bloquea.

---

## Bloque A — Punto de entrada y transición desde el estado actual

1. [★] Hoy el flow es: home → botón "Entrar al yermo" → combate Lobo → modal de loot/epitafio → home. Tras 4b, ¿cómo se llega a la vista regional la primera vez?
   - (a) Botón "Mapa" / "Mundo" en home (visible siempre, junto al actual "Entrar al yermo").
   - (b) Tras el combate Lobo (cuando `tutorial_lobo_completed=true`), el botón "Entrar al yermo" se sustituye por "Salir al mundo" → vista regional. La home sigue siendo pantalla aparte hasta que 4c reinterprete home como POI.
   - (c) Tras el combate Lobo, el botón abre directamente la vista regional sin volver a home (cambio inmediato de pantalla).
   - (d) Otra opción que tengas en la cabeza.
-

2. [★] ¿Existe atajo de debug para entrar a la vista regional sin pasar por crear PJ + tutorial Lobo, mientras 4b está en desarrollo? Si sí, ¿cómo se activa (URL `?debug=map`, atajo de teclado, panel oculto, otra)?
-

3. Si en una run el PJ ya superó el tutorial Lobo y el jugador vuelve a home, ¿la home muestra siempre los dos botones (`[Salir al mundo]` + algo más como `[Inventario]`/`[Descansar]`), o la home se simplifica a un botón único "Salir al mundo"?
-

4. [REPO] Decisión #84 dice que tras tutorial Lobo el botón "Explorar" desaparece y queda "Salir al mundo". ¿Confirmas que **la home sigue siendo pantalla aparte en 4b** (con su lápida si el PJ anterior cayó, su línea de estado, sus botones), y que la reinterpretación como POI Asentamiento del Sur es trabajo de 4c?
-

5. ¿La transición visual entre home y vista regional es **inmediata** (cambio de pantalla seca), **fade corto** (300-500 ms), o **animación de zoom** (cámara aleja desde el POI Asentamiento del Sur)? La animación cinematográfica está diferida a fase 3 según F3 de v0.22, pero algo tiene que haber para 4b.
-

---

## Bloque B — Vista regional: forma visual y datos pintados

6. [★] La vista regional pinta los 180 grids con coordenadas cartesianas que el director cerró en 4a (Norte arriba, Sur abajo, Centro medio, Este derecha, Oeste izquierda). ¿Cómo se renderiza el conjunto?
   - (a) **SVG** con `<rect>` por grid (escalable, fácil de testear, accesible).
   - (b) **Canvas 2D** (consistente con el `rules/dice.ts` que ya está, pero más opaco para tests visuales).
   - (c) **DOM puro con CSS Grid** (cada grid es un `<div>` posicionado).
   - (d) Decide el director en pipeline.
-

7. [★] Cada región tiene su `colorHex` provisional (puesto por el director en 4a). ¿Cómo se distinguen visualmente los grids dentro de una región?
   - (a) Todos los grids de la misma región pintados con el `colorHex` plano (5 manchas de color sólido).
   - (b) Variación leve de tono dentro de la región (gradiente o ruido sutil) para que cada grid se distinga del vecino.
   - (c) Color plano + borde visible entre grids.
   - (d) Otra.
-

8. ¿Las 5 regiones tienen **etiquetas geográficas** ("Centro", "Norte", "Sur", "Este", "Oeste") visibles sobre la vista regional, o las regiones se identifican solo por color sin texto?
-

9. ¿Hay **título de la vista regional** o cabecera ("Mundo", "Terra", o nada)? Si la palabra "Terra" del cuestionario de lore (Bloque 1 pregunta 8) ya está bendecida como nombre del mundo, ¿la usamos aquí?
-

10. [REPO] §9.9 dice "overworld + nombres de regiones visibles desde el primer minuto". ¿Confirmas que en 4b NO hay descubrimiento progresivo de regiones (todas visibles), y que la niebla opera solo a nivel POI individual?
-

11. ¿Hay **borde del mundo** visible (un marco o gradiente que indique "fuera del mundo")? ¿O el bounding box cartesiano de los 180 grids llena la pantalla y el "fuera" es simplemente el fondo de la página?
-

12. ¿Pintamos **algún elemento decorativo** ya en 4b (silueta de bosque sobre el Sur, ruinas sobre el Centro, hielo sobre el Norte) para dar lectura instintiva del bioma? ¿O 4b es 100% color plano y los biomas se pintarán cuando lore cierre?
-

---

## Bloque C — Posición del PJ, marcador y estado del grid

13. [★] ¿Hay un marcador del PJ en la vista regional? Si sí, ¿qué forma (punto, círculo, icono del retrato del PJ miniatura, otra)?
-

14. ¿El marcador del PJ se pinta en la **posición exacta del grid** donde está, o en el **centro de la región** que lo contiene?
-

15. [REPO] Los grids tienen estado `Inexplorado` / `Explorado` / `Controlado` (decisión #69 + biblia §9.6). ¿Cómo se distinguen visualmente en la vista regional?
   - (a) Inexplorado: tinte reducido (opacidad 40%). Explorado: color pleno. Controlado: borde marcado o icono de ancla.
   - (b) Inexplorado: oculto (color de fondo). Explorado: visible con color. Controlado: brillante o con halo.
   - (c) Solo se distingue Controlado vs el resto (los grids no controlados lucen iguales hasta tener anclas).
   - (d) Otra.
-

16. En 4b, ¿qué grids arrancan como Explorado (visibles a color pleno) por default?
   - (a) Solo `sur-001` (el grid de inicio del PJ, donde está el home).
   - (b) `sur-001` + sus vecinos cardinales (efecto "miras lo que tienes alrededor desde el home").
   - (c) Toda la región Sur (el PJ "conoce" su región natal).
   - (d) Todos los grids del overworld están Explorado en 4b porque la niebla real entra en otro sub-paso. Lo simplificamos.
-

17. ¿Hay algún indicador en la vista regional de **cuánto contenido queda por explorar** (e.g. "12/180 grids visitados", barrita de progreso)? ¿O eso rompe el tono "perderse en el mundo" (decisión #81) y se omite?
-

---

## Bloque D — Interacción con la vista regional

18. [★] Click sobre un grid en la vista regional: ¿qué pasa?
   - (a) **Zoom continuo a vista de grid** del clicado (la cámara hace zoom in animado).
   - (b) **Selección visual** del grid (highlight) + botón explícito "Entrar a este grid" para confirmar.
   - (c) Click directo sin selección intermedia, transición suave pero rápida (~400 ms).
   - (d) Otra.
-

19. ¿El jugador puede hacer **click en cualquier grid** o solo en grids adyacentes al actual? Si el movimiento entre grids consume acciones por día (#71), ¿la vista regional permite clicks libres de "viajar" o limita a los vecinos cardinales?
-

20. ¿Hay **hover sobre grid** que muestre tooltip con info? Si sí, qué info:
   - (a) Solo el ID del grid (`sur-014`).
   - (b) Región + estado del grid.
   - (c) Región + estado + número de POIs visibles vs ocultos.
   - (d) Hover desactivado en 4b (UX limpia, sin overlays).
-

21. ¿Hay **botón "volver" / "atrás"** desde la vista regional para ir al home? Si la home se reinterpreta como POI en 4c, ¿4b ya cablea "volver al home" como zoom in al POI Asentamiento de `sur-001`, o sigue siendo botón aparte?
-

22. ¿La vista regional tiene **scroll/pan** o cabe entera siempre en pantalla? Bounding box es 22×15 (cartesiano del director), parece manejable sin scroll. Pero si en mobile o pantalla pequeña algo no cuadra, ¿cómo se resuelve?
-

23. ¿Hay **zoom manual** del jugador (rueda del ratón / pellizco) sobre la vista regional, o el zoom es solo el zoom semántico (regional → grid)?
-

---

## Bloque E — Vista de grid: forma visual y POIs

24. [★] La vista de grid pinta los 4 POIs de un grid concreto con sus `position` (cartesiano local, decidido en 4a por director). ¿Cómo se renderiza?
   - (a) **Mini-grid 5×5** (o similar) con los 4 POIs como iconos en celdas concretas.
   - (b) **Mapa libre** dentro del grid: los POIs se posicionan con sus coords en un canvas/SVG sin grilla visible.
   - (c) **Lista vertical** de los 4 POIs con sus arquetipos y distancias visuales.
   - (d) Otra.
-

25. [★] ¿Cada POI tiene **icono distinto por arquetipo** (Natural / Ruina / Asentamiento / Arcano), o todos son el mismo punto neutro hasta cerrar lore?
   - En 4a el archetype es `'natural'` por defecto en todos. ¿En 4b mostramos iconos por arquetipo aunque sea provisional, o uniformidad hasta que el contenido entre?
-

26. [REPO] §9.9 dice que "cada POI no visitado aparece como ???". En 4b, ¿qué se ve en cada POI según su estado?
   - POI no visitado: silueta + "???" como nombre.
   - POI visitado pero no completado: silueta + nombre revelado, sin contenido.
   - POI completado: silueta + nombre + indicador visual (check, halo, otro).
-

27. ¿Hay **fondo del grid** (textura, color, patrón) que dé lectura visual del bioma del grid, o el grid es área transparente con los 4 POIs flotando?
-

28. ¿Se ve el **marcador del PJ dentro del grid** cuando estamos en vista de grid? Si sí, ¿el PJ está "sobre uno de los POIs" o "en una posición libre del grid" hasta que entre a un POI?
-

29. [REPO] §9.7 dice "8 acciones por día". En 4b NO se cablean acciones (eso es 4d). Pero en la vista de grid, ¿se ve **algún contador o HUD provisional** ya, o el HUD está completamente vacío en 4b?
-

---

## Bloque F — Zoom continuo: implementación visual y técnica

30. [★] §9.1 cierra "zoom continuo, NO modales". ¿Cómo se implementa el zoom continuo en 4b?
   - (a) **Camera transform animada** (CSS `transform: scale()` + translate) sobre un canvas/SVG único de los 180 grids; al "entrar" a un grid, la cámara hace zoom hasta que ese grid llena la pantalla y los 4 POIs aparecen.
   - (b) **Cross-fade entre dos vistas** (regional → grid). Técnicamente son vistas separadas pero la transición da sensación de zoom.
   - (c) **Una vista única reactiva** que cambia su nivel de detalle según un estado `zoomLevel` ("region" | "grid"). Los grids se renderizan con detalle distinto según el nivel.
   - (d) Decide el director en pipeline.
-

31. [★] La animación del zoom: ¿qué duración?
   - (a) Instantánea (sin animación, mejor performance).
   - (b) Corta (200-300 ms): apenas se nota pero suaviza la transición.
   - (c) Media (500-700 ms): el zoom "se siente" como gesto.
   - (d) Larga (1-2 s): cinematográfica.
-

32. ¿La animación de zoom respeta `prefers-reduced-motion` del usuario y se desactiva si el usuario lo pide?
-

33. ¿Qué pasa si el usuario hace click en otro grid mientras la animación de zoom anterior está corriendo? ¿Se cancela y empieza otra, se ignora hasta que termine, o se encola?
-

34. [REPO] El stack actual del repo es **vanilla TypeScript + CSS modules + sin framework de animación** (visto en módulos h2-*). ¿Confirmas que NO se mete una librería de animación (Framer Motion, GSAP) y se hace todo con CSS puro + JS controlador?
-

---

## Bloque G — Persistencia y estado de mundo en 4b

35. [★] En 4b se introduce el concepto "vista actual del jugador" (regional / grid X / POI Y). ¿Esto se persiste en Supabase o solo en memoria de sesión?
   - (a) Persistido en Supabase: el jugador cierra navegador, reabre, vuelve donde estaba.
   - (b) Solo en memoria: el jugador siempre arranca en vista regional al cargar partida.
   - (c) Solo el grid actual se persiste; al cargar arranca en vista regional con ese grid resaltado.
-

36. [REPO] Decisión #85 dice "Persistencia entre cierres = todo (PJ + estado del mundo)". ¿Esta decisión incluye la posición del PJ dentro del overworld (qué grid, qué POI si entró), o "estado del mundo" se refiere solo a grids visitados / anclas / día actual?
-

37. ¿Cómo se persiste "el PJ está en grid X"? Asumo extender `Character.location` (que hoy es `{mapId, x, y}` en biblia §7) o crear un campo nuevo. **No respondas la implementación**, responde el modelo conceptual: ¿el PJ está siempre en un grid concreto, o puede estar "en tránsito" entre grids?
-

38. ¿La lista de **grids visitados** (los que han pasado a Explorado) se persiste como array en `save_slots`, como tabla aparte en Supabase, o como flag en cada POI/grid del worldState? **Modelo conceptual, no implementación.**
-

---

## Bloque H — Cableado con tutorial Lobo y home

39. [★] Tras superar el combate Lobo, ¿qué pasa con la home actual (3 ramas: vacío / vivo / caído)?
   - (a) Se mantiene tal cual (home es pantalla aparte hasta 4c).
   - (b) La home se simplifica: el botón "Entrar al yermo" se renombra a "Salir al mundo" → vista regional.
   - (c) La home se sustituye por una pantalla nueva tipo "campamento" con varios botones (Inventario, Descansar, Salir al mundo).
-

40. ¿La home con `tutorial_lobo_completed=false` permite acceder a la vista regional? Es decir, ¿el jugador puede saltarse el tutorial Lobo intentando "Salir al mundo" antes? **Asumo NO** (tutorial obligatorio, decisión #84). Confirma o matiza.
-

41. Cuando el PJ muere en el overworld (cualquier vía: combate de POI, fatiga, trampa), ¿qué pasa con el flag `tutorial_lobo_completed`?
   - (a) Se reinicia (cada PJ nuevo hace su Lobo). Decisión #84 lo dice; confirmas.
   - (b) Persiste para esa cuenta de Supabase: el siguiente PJ del mismo usuario salta directo al mundo.
-

42. [REPO] El epitafio de la home (sub-paso 3e.2) lee `last_damage_source` desde 4a. En 4b, si el PJ muere por combate dentro del overworld (no aplica todavía porque 4c es quien cablea POI → combate), ¿se setea `last_damage_source='enemy'` o el motor de combate ya lo hace? **Pregunta para anotar como TODO en pipeline si es ambigua.**
-

---

## Bloque I — Punto de atención técnico y deudas

43. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto en este cuestionario y que afecte 4b?
-

44. ¿Algo que en H3 o H2 te quedó incómodo y quieres que 4b sea oportunidad de arreglar (mientras no se salga del scope)?
-

45. ¿Hay un caso borde de UX que te preocupe específicamente en 4b (e.g. "qué pasa si el jugador hace click rápido entre dos grids", "qué pasa si la pantalla es muy pequeña", "qué pasa si el JSON de grids tiene 179 en lugar de 180 por bug")?
-

46. ¿Algún tropo de juegos de overworld que quieras evitar específicamente en 4b? (Ya están los 7 tropos generales en §11; este pregunta por tropos de mapas.)
-

47. ¿Tu intuición visual de la vista regional viene de algún juego concreto (mapa de FTL, mapa de Slay the Spire, mapa de Darkest Dungeon, mapa de Pillars of Eternity, otro)? Si tienes referente, decirlo aquí ahorra horas de iteración en pipeline.
-

48. ¿Si una decisión que tomes en 4b fricciona con MODOPIPELINE (Prompt Master propone X, director rechaza por Y), prefieres que el director se vuelva a §9.1 / a este cuestionario, o que escale la decisión a ti?
-

49. [REPO] La memoria `feedback_director_vista_flow` dice "director debe levantar la cabeza al flow completo, no decidir por mayoría de archivos". ¿Hay algún flow de **navegación overworld → grid → POI** que ya tengas mentalizado y que quieras que el director respete a pesar de lo que digan archivos / convenciones existentes?
-

50. ¿Algún criterio de "esto está bien hecho" para 4b que el director pueda usar como check antes de proponer commit, más allá de "tsc limpio + tests verde + vite build"?
-

---

**Total: 50 preguntas. 14 marcadas [★] como bloqueantes. 8 marcadas [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lo lee de una sentada e identifica contradicciones internas + cruzadas con biblia + cuestionarios previos.
2. Sesión corta (15-30 min) donde el director te pasa solo las contradicciones encontradas.
3. Una vez todo coherente, MODOPIPELINE arranca: Prompt Master adapta el brief al sub-paso 4b, director valida coherencia con biblia y este cuestionario, impeccable cierra.
4. Cierre del sub-paso 4b: 1-2 commits con OK explícito uno a uno (push aparte, decisión de Bazalo).
