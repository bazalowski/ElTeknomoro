# El Teknomoro — Test de funcionalidades del MVP web

> 130 preguntas para mapear el esqueleto jugable y las interfaces de la app web.
> **Versión:** v0.1 · **Fecha:** 24 de abril de 2026
> **Doble lente:** todo lo que respondas aquí debe poder portarse a (1) videojuego en Godot/Unity y (2) juego de mesa en PDF.
> Lore fuera del scope. Esto es pura mecánica, UX y arquitectura jugable.

---

## Cómo usar este test

Responde con frases cortas o números. Si no sabes, marca `[ABIERTO]` y pasa. Las preguntas con `[BLOQUEANTE]` deben cerrarse antes de tocar código. Las marcadas `[MESA]` también afectan al PDF; las marcadas `[MOTOR]` ya están pensando en el salto futuro.

---

## Bloque 1 — Pantalla de inicio y meta-juego (1-10)

1. Al abrir la web, ¿qué ves en los primeros tres segundos: logo + "Jugar" o entras directo a una partida en curso?
2. ¿Hay menú principal con "Nueva partida / Continuar / Banco de creación / Campo de pruebas / Opciones" o se simplifica más?
3. ¿Cuántos slots de partida guardada como mínimo? ¿1, 3, ilimitados?
4. ¿El guardado es manual, automático por turno, automático por evento, o mixto?
5. ¿Hay pantalla de carga visible o el mundo aparece instantáneo al cargar?
6. ¿Qué pasa si el usuario cierra la pestaña a media partida sin guardar?
7. ¿El "Banco de creación" y el "Campo de pruebas" son accesibles desde el menú principal o solo en modo desarrollo?
8. ¿Cómo distingues visualmente el modo "partida real" del modo "campo de pruebas"? (¿banner, color de UI, watermark?)
9. ¿Hay tutorial in-game o se asume que el jugador lee el PDF de reglas primero?
10. [BLOQUEANTE] ¿La gancha del primer minuto es una cinemática, una decisión inmediata, o un combate forzado?

---

## Bloque 2 — Creación de personaje (11-25)

11. [BLOQUEANTE] ¿La creación es libre (reparto puro de puntos) o guiada por arquetipos predefinidos?
12. ¿Hay nombre, retrato, género, o solo stats? ¿Qué es el mínimo viable?
13. Si hay retratos, ¿son seleccionables de un set fijo, generados procedurales, o subidos por el jugador?
14. ¿El reparto de los 12 puntos en atributos se hace con sliders, +/- buttons, o drag & drop?
15. ¿Se ve en tiempo real el impacto de cada punto (DEF resultante, HP, etc.) o solo al confirmar?
16. ¿Hay validación visual cuando el reparto es ilegal (mínimo 1, máximo 4)?
17. ¿El reparto de habilidades es separado del de atributos o en la misma pantalla?
18. ¿Hay "preview" del personaje en combate antes de confirmar?
19. ¿Se puede deshacer el reparto entero con un botón "reset"?
20. ¿Una vez confirmado el personaje, se puede editar o queda bloqueado?
21. ¿Hay rasgos/talentos/perks iniciales además de atributos y habilidades, o eso es para v2?
22. ¿El personaje arranca con inventario inicial fijo, aleatorio, o elegido por el jugador?
23. ¿Cuántos personajes puede tener un jugador en su "Banco de creación"?
24. [MESA] ¿La hoja de personaje del PDF tiene el mismo orden de campos que la pantalla web?
25. [MOTOR] ¿La estructura del personaje en JSON es la misma que se exportará a Godot, o hay que pensarla ya?

---

## Bloque 3 — Banco de creación (26-35)

26. ¿El Banco guarda solo personajes, o también enemigos, items, recetas custom?
27. ¿Se pueden importar/exportar personajes como JSON para compartir entre dispositivos?
28. ¿Los personajes del Banco son plantillas (se clonan al jugar) o instancias (se usan directos)?
29. ¿Hay etiquetas/categorías para organizar el Banco cuando crezca?
30. ¿Hay buscador y filtros (por atributo dominante, por habilidad, por nivel)?
31. ¿Se ven en lista, en grid de cartas, o en ambos modos?
32. ¿El Banco persiste en LocalStorage, IndexedDB, o exportable a archivo?
33. ¿Qué pasa si el usuario borra cookies/storage? ¿Hay backup posible?
34. ¿Se pueden marcar favoritos?
35. ¿Hay límite de slots o ilimitado?

---

## Bloque 4 — Campo de pruebas (36-45)

36. ¿El Campo de pruebas es una arena vacía donde invocas combates, o un sandbox con mundo navegable?
37. ¿Permite spawnear cualquier enemigo del catálogo con un click?
38. ¿Permite forzar tiradas concretas (modo "el próximo dado saca un 6")?
39. ¿Permite editar HP/recursos del personaje en tiempo real?
40. ¿Tiene consola de logs detallada de cada tirada para depurar balance?
41. ¿Permite ejecutar combates en modo automático (IA vs IA) para simular en masa?
42. ¿Cuántas iteraciones de combate puede simular sin congelar el navegador?
43. ¿Exporta los resultados de simulación como CSV para abrirlos en hoja de cálculo?
44. ¿Permite probar recetas de crafteo con materiales infinitos?
45. ¿El Campo está accesible siempre o solo activable con un flag de URL (`?debug=1`)?

---

## Bloque 5 — Mapa y exploración (46-60)

46. [BLOQUEANTE] ¿El mapa es por casillas (grid), por hexágonos, por nodos (point-and-click), o mundo libre 2D?
47. ¿La cámara es top-down fija, top-down con zoom, isométrica, o side-scroll?
48. ¿El movimiento es por turnos (gastas puntos de acción) o tiempo real?
49. ¿Hay niebla de guerra que se descubre al explorar?
50. ¿El mapa se genera procedural al inicio de partida o es fijo en el MVP?
51. Si es procedural, ¿qué controla la semilla? ¿Una frase del jugador, un timestamp, un código?
52. ¿Cuántos biomas distintos en el MVP? ¿2, 3, 5?
53. ¿Cómo se transita entre zonas: viaje rápido, marcha continua, encuentros aleatorios?
54. ¿Hay día/noche que afecte al juego o es decoración?
55. ¿Hay clima dinámico que afecte a tiradas?
56. ¿El jugador ve sus stats vitales (HP, recursos) sobre el mapa o solo en menú?
57. ¿Cómo se interactúa con un punto de interés: tap directo, menú contextual, proximidad automática?
58. ¿Hay minimapa o solo mapa principal?
59. [MESA] ¿El mapa de mesa es el mismo formato visual o uno propio del PDF?
60. [MOTOR] ¿La generación procedural se diseña ya pensando en 3D futuro o se asume reescritura?

---

## Bloque 6 — Combate (61-80)

61. [BLOQUEANTE] ¿El combate es por turnos puros, semi-tiempo-real con pausa, o tiempo real?
62. ¿Cuántos enemigos máximo en pantalla en un combate del MVP?
63. ¿La iniciativa se tira por personaje o se asigna por estadística?
64. ¿El jugador ve el orden de turno completo de antemano (timeline) o solo "ahora yo / ahora ellos"?
65. ¿Las acciones disponibles cada turno son botones fijos (Atacar/Esquivar/Habilidad/Item) o dinámicos según contexto?
66. ¿Hay sistema de targeting visual (resaltar enemigo objetivo) o se elige de menú?
67. ¿Cómo se muestran las tiradas: animación de dados rodando, número que aparece, texto en log?
68. ¿El log de combate es siempre visible, en panel lateral, o se abre con tab?
69. ¿Hay críticos visualmente diferenciados (color, sonido, shake)?
70. ¿Las heridas/estados (sangrado, veneno, aturdido) tienen iconos sobre el sprite?
71. ¿El jugador puede huir del combate? ¿Con qué coste?
72. ¿Qué pasa al morir: game over, respawn, partida cargada, perma-death?
73. ¿Hay XP por combate y se ve ganada en pantalla al terminar?
74. ¿Hay loot post-combate? ¿Pantalla dedicada o se añade silenciosamente al inventario?
75. ¿El combate pausa el resto del mundo o sigue corriendo?
76. ¿Se puede consultar la hoja de personaje sin salir del combate?
77. ¿Hay terreno con efectos (cobertura, altura, hazards) en el MVP o se posterga?
78. [MESA] ¿La resolución de un turno de combate en mesa coge el mismo tiempo que en web (objetivo: máximo 30s por turno)?
79. [MOTOR] ¿El motor de combate está suficientemente desacoplado del render para correr en cabeza sin pintar (modo simulación masiva)?
80. ¿Hay modo espectador / replay del último combate para depuración?

---

## Bloque 7 — Inventario y equipo (81-92)

81. ¿El inventario es por peso, por slots, por categorías, o ilimitado?
82. ¿Hay slots de equipo visibles (cabeza, torso, manos, arma) o solo "items equipados"?
83. ¿La UI de inventario es grid de cartas o lista con detalles?
84. ¿Se pueden apilar items idénticos (stack) y hasta cuánto?
85. ¿Hay drag & drop para equipar/desequipar o solo botones?
86. ¿Hay comparativa visual al hover ("este arma vs la equipada actual")?
87. ¿Se ven stats del item (daño, durabilidad, peso) en tooltip?
88. ¿Los items tienen durabilidad en el MVP o se posterga?
89. ¿Se pueden tirar items? ¿Reaparecen en el mundo o se borran?
90. ¿Hay rareza visual (color del borde, prefijo del nombre)?
91. ¿El inventario es por personaje o compartido si hubiera party (probablemente no en MVP)?
92. ¿Cuál es el límite duro de items distintos en el catálogo del MVP? ¿20, 50, 100?

---

## Bloque 8 — Crafteo (93-103)

93. ¿La pantalla de crafteo es lista de recetas conocidas, o tienes que probar combinaciones?
94. ¿Las recetas se desbloquean leyendo libros, encontrándolas, o están todas desde el inicio en el MVP?
95. ¿Cómo se muestra el resultado ramificado (success/critical/failure) antes de craftear: porcentajes visibles o sorpresa?
96. ¿El crafteo gasta tiempo de juego (pasan horas) o es instantáneo?
97. ¿Hay barra de progreso visual mientras craftea o aparece resultado directo?
98. Si requiere `station`, ¿el botón de craftear se desactiva con tooltip "necesitas: fragua" o se permite intentar?
99. ¿Se puede craftear en lote (x10) o uno a uno?
100. ¿Hay cola de crafteo o solo una receta a la vez?
101. ¿El catálogo inicial de 30-50 recetas se carga de un único `recipes.json` o segmentado?
102. ¿Hay editor visual de recetas en el Campo de pruebas o solo se editan en JSON a mano?
103. [MESA] ¿La carta de receta del PDF tiene el mismo formato JSON o uno simplificado para humanos?

---

## Bloque 9 — Habilidades y progresión (104-113)

104. [BLOQUEANTE] ¿Las habilidades suben por uso (las usas, suben) o por XP repartido manualmente al subir nivel?
105. ¿Hay árbol de habilidades visual o lista plana?
106. ¿Subir de nivel es automático al alcanzar XP o requiere pulsar "subir nivel" (estilo Diablo)?
107. ¿La pantalla de subida de nivel pausa el juego o se hace en menú aparte?
108. ¿Cuántos niveles máximos en el MVP? ¿5, 10, 20?
109. ¿Hay re-spec (resetear habilidades) o las decisiones son permanentes?
110. ¿Se ve la curva de XP completa al jugador o solo "te falta X para subir"?
111. ¿Hay logros/medallas en el MVP o se posterga?
112. ¿Hay sistema de reputación con facciones en el MVP o se difiere?
113. ¿La hoja de personaje en juego es la misma pantalla que en creación, o una versión read-only ampliada?

---

## Bloque 10 — Diálogos e interacción NPC (114-120)

114. ¿Hay NPCs con diálogo en el MVP o solo enemigos?
115. Si hay diálogos, ¿son árboles de opciones, lista de temas (estilo Morrowind), o lineales?
116. ¿La pantalla de diálogo es modal pantalla completa, panel inferior, o burbuja sobre el NPC?
117. ¿Hay tiradas de habilidad social (Persuasión/Intimidar) visibles en las opciones de diálogo?
118. ¿Los NPCs tienen retrato o solo nombre?
119. ¿Hay sistema de comercio en el MVP? ¿Pantalla dedicada o integrada en diálogo?
120. ¿Se puede atacar a NPCs no hostiles? ¿Consecuencias?

---

## Bloque 11 — Sonido, accesibilidad, performance (121-130)

121. ¿Hay música en el MVP o silencio total para iterar más rápido?
122. ¿Hay efectos de sonido mínimos (click UI, golpe, dado)?
123. ¿Es jugable solo con teclado, solo con ratón, o ambos?
124. ¿Hay soporte de mando en el MVP o solo en fase motor?
125. ¿La UI escala bien en pantallas pequeñas (tablet horizontal mínimo) o es solo desktop?
126. ¿Hay modo daltónico o paleta alternativa en opciones?
127. ¿Hay textos redimensionables o tamaño fijo?
128. ¿Cuál es el FPS objetivo del MVP en Canvas? ¿30, 60?
129. ¿Cuál es el navegador mínimo soportado? ¿Solo Chromium, también Firefox/Safari?
130. [MOTOR] ¿Qué fricciones de la web ya identificas que el motor futuro debería resolver desde el principio? (carga, performance, input lag, etc.)

---

## Notas de cierre

- Las preguntas marcadas [BLOQUEANTE] dependen de decisiones del reglamento (especialmente bloque 1 de la biblia: dado, atributos, loop). No las contestes aquí en el vacío.
- Las marcadas [MESA] son recordatorios de que cada decisión de UX web tiene un eco en el PDF. Si divergen, divergen consciente.
- Las marcadas [MOTOR] son la red de seguridad para que en fase 3 el port no sea arqueología.
- Cuando hayas pasado por las 130, vuelves con el conteo: cuántas cerradas, cuántas abiertas, cuántas bloqueantes pendientes. Eso es el v0.1 del documento de scope del MVP.
