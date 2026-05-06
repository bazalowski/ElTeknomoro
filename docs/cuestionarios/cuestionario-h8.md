# Cuestionario de Scope — Hito 8

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el hito.
> **Propósito:** cerrar el scope completo del Hito 8 (subida de nivel manual + re-spec + 15 logros + 3 facciones con reputación + sistema de diálogo + 10 enemigos con variantes + NPCs en mapa de historia y ciudades + meta-progresión entre runs) antes de empezar a planificar sub-pasos. **H8 es el hito más amplio del MVP en términos de sistemas tocados.**
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar. Si H4-H7 descubren algo que las invalide, la decisión se reabre.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22.** Nivel máximo 50 (decisión #15). Subir nivel manual con pantalla pausada (#15). Curva XP lineal `100·n` (#37). Cadencia de puntos: +2 hab cada nivel + 1 atr cada 5 niveles + 1 perk cada 5 niveles (#38). Niveles redondos como rituales (#38). 15 logros (§3 scope). 3 facciones (§4.11). Diálogos como lista de temas estilo Morrowind (§4.13). Tiradas sociales visibles (§4.13). Estos no se discuten.
2. **No es brief de implementación.**
3. **No diseña quest principal / secundarias.** Eso es H5. Pero H8 cablea NPCs y facciones que H5 referencia.
4. **No diseña items / crafteo.** Eso es H6/H7. Pero H8 introduce **NPCs vendedores** que tocan items y libros de recetas.

**Convención de marcas:**
- **[★]** = bloqueante de decisión.
- **[REPO]** = ya existe respuesta parcial en biblia/scope/cuestionariolore. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Subida de nivel y UI

1. [★] §4.11: "Subir nivel no es automático: el jugador pulsa 'Subir nivel' cuando alcanza el umbral. Pausa el juego". ¿Cómo se cablea en H8?
   - (a) Botón "Subir nivel" aparece en HUD cuando hay XP suficiente.
   - (b) Modal forzado al alcanzar el umbral (no ignorable).
   - (c) Notificación que el jugador puede ignorar hasta querer subir.
-

2. [★] La pantalla de subida de nivel: ¿qué incluye?
   - (a) Título "Nivel N" + paquete de puntos a repartir + UI de reparto (similar a H2 atributos/habilidades) + botón "Confirmar".
   - (b) Animación dramática + ritual visual + reparto.
   - (c) Solo el reparto, sin ceremonia.
-

3. ¿Los **niveles redondos (5, 10, 15...)** tienen UI distinta a niveles intermedios?
   - Decisión #38: niveles redondos son rituales (entregan los 3 tipos juntos). UI ¿especial?
-

4. ¿La UI permite **diferir el reparto de puntos** (e.g. acumular puntos para gastarlos más tarde)?
   - (a) Sí, el jugador puede acumular puntos sin gastar (decisión táctica).
   - (b) No, debe repartir todo en el momento de subir nivel.
-

5. ¿La UI muestra **stats derivados actualizados** mientras el jugador reparte (preview en tiempo real, similar a H2.2)?
-

---

## Bloque B — Re-spec

6. [★] §4.11 menciona re-spec disponible con coste de recurso. ¿Cómo funciona en H8?
   - (a) NPC específico ofrece re-spec por X oro / item raro.
   - (b) Recurso especial ("piedra de transformación") consumible.
   - (c) Mecanismo en POI Asentamiento (cualquiera ofrece re-spec con coste).
   - (d) Decisión narrativa (e.g. completar quest específica).
-

7. ¿El re-spec **re-distribuye TODO** o solo una parte?
   - (a) Todo: atributos + habilidades + perks de nivel.
   - (b) Solo habilidades + perks (atributos quedan).
   - (c) Solo perks.
-

8. ¿Hay **límite de re-spec por run** (e.g. máximo 3 re-specs antes de morir)?
    - Default propuesto: 1 re-spec por run para mantener decisiones con peso. Confirma.
-

9. ¿El re-spec **mantiene el nivel actual** o el PJ vuelve a nivel base?
    - Asumo: mismo nivel, solo se redistribuyen los puntos. Confirma.
-

---

## Bloque C — Logros (15 en MVP)

10. [★] ¿Qué tipos de logros incluyes en los 15?
    - Logros de hitos: primer combate ganado, primera muerte evitada con item, primer POI Controlado, primer fast travel.
    - Logros de exploración: visitar todas las regiones, visitar X grids, completar Y POIs.
    - Logros de combate: matar X enemigos, conseguir Y críticos, etc.
    - Logros narrativos: completar la quest principal, descubrir Los Teknomoros, completar las quests secundarias.
    - Logros de meta: jugar X horas, morir X veces, etc.
    - **¿Distribución propuesta para los 15?**
-

11. ¿Los logros se persisten **entre runs** (decisión #65: stats globales sobreviven). ¿Confirmas que logros viven en stats globales del usuario?
-

12. ¿Hay logros que **desbloquean** algo (hitos roguelike, decisión #66)?
    - (a) Sí, ciertos logros dan +1 hito roguelike (clase, zona, item de partida).
    - (b) No, logros son cosméticos/narrativos. Hitos roguelike son sistema aparte.
-

13. ¿La UI de logros es **lista** (consultable desde menú) o **notificación al desbloquear**?
    - Default propuesto: ambos. Notificación toast + lista en menú principal.
-

14. ¿Hay **logros secretos** (no se revelan en lista hasta desbloquearlos)?
    - Default propuesto: 2-3 secretos en MVP. Confirma.
-

15. [REPO] §10 lore embebido sin códice modal. ¿La lista de logros cae bajo "códice prohibido"? Asumo NO (logros son metadata, no lore). Confirma.
-

---

## Bloque D — Facciones (3 en MVP)

16. [★] Cuestionariolore B1 P10: "cada facción tiene su color, no buenos vs malos". ¿Las 3 facciones de MVP están **decididas** en cuestionariolore o se cierran en H8?
    - Mi lectura: cuestionariolore se completa primero. Si para cuando ejecutemos H8 las facciones están en cuestionariolore, las usamos. Si no, H8 cierra como bloqueante.
-

17. ¿Cómo se gana / pierde **reputación** con una facción?
    - (a) Decisiones en eventos narrativos (matar a un NPC de facción A → -reputación A, +reputación B).
    - (b) Quests secundarias (completar quest pro-A → +reputación A).
    - (c) Acciones del mundo (saquear POI Asentamiento de facción C → -reputación C).
    - (d) Combinación.
-

18. ¿La reputación es **escala numérica** (-100 a +100) o **estados discretos** (enemigo, neutral, aliado)?
    - Default propuesto: numérica (-100/+100) con thresholds para estados (≤-50: enemigo, -50/+50: neutral, ≥+50: aliado).
-

19. ¿La reputación afecta:
    - (a) Hostilidad de NPCs de la facción (atacar al PJ a la vista).
    - (b) Precios en mercados (descuento aliado, surcharge enemigo).
    - (c) Acceso a quests / áreas (algunas facciones bloquean POIs).
    - (d) Final de quest principal (alianza con facción modula final).
    - **¿Cuáles cableamos en H8?**
-

20. ¿Las **3 facciones** tienen **conflictos directos** entre sí (alianza con A → automáticamente reduce B)?
    - Default propuesto: sí. Reputación es zero-sum entre facciones. Confirma.
-

21. ¿Hay **facción neutral** (NPCs sin filiación)?
    - Default propuesto: sí. La mayoría de NPCs son neutrales. Confirma.
-

22. ¿Las facciones tienen **lore embebido** (átomos de lore vinculados a sus NPCs / sitios)?
-

---

## Bloque E — NPCs (sistema de diálogo)

23. [★] §4.13: "Lista de temas estilo Morrowind. Hasta 6 temas visibles con scroll". ¿Cómo se cablean los NPCs en H8?
    - (a) Cada NPC tiene **lista fija de temas** (e.g. "Saludo", "Comercio", "Quest", "Lore local").
    - (b) Lista de temas es **dinámica según contexto** (flags del PJ, día actual, etc).
    - (c) Combinación: temas fijos + temas dinámicos.
-

24. ¿Cuántos **NPCs únicos** tiene MVP?
    - Default propuesto: 10-15 NPCs nombrados (los del POI Asentamiento del Sur, los de Asentamientos curados, los NPCs de quest principal).
    - Cuestionariovision Bloque 9 P60: "10 enemigos con variantes" (NO 15). ¿NPCs igual a 10-15 únicos?
-

25. ¿Hay **NPCs genéricos** (no nombrados, aparecen como "Cazador", "Mercader", etc.)?
    - Default propuesto: sí, en POIs de tipo Asentamiento. Confirma.
-

26. ¿La UI de diálogo es **modal panel inferior** (§4.13). ¿Mantenido en H8?
-

27. [REPO] §4.13: "Atacar a NPC no hostil siempre disponible con confirmación. Consecuencias narrativas pendientes". ¿En H8 las consecuencias se cablean?
    - (a) Sí, atacar a NPC pacífico cambia reputación de su facción.
    - (b) Sí, además de reputación, dispara evento narrativo (otros NPCs comentan).
    - (c) No en H8, queda como deuda para v1.1+.
-

28. ¿Hay **diálogo en combate** (NPC habla en mid-combate)?
    - Default propuesto: NO en MVP. Reservado a v1.1+.
-

29. ¿Cada NPC tiene **retrato visible**?
    - Default propuesto: sí. Reusa el set de 12 retratos de creación de PJ + algunos extras para NPCs únicos.
-

---

## Bloque F — Catálogo de enemigos (10 con variantes)

30. [★] §3.1 cierra "15 enemigos" como inventario binario v1. Scope §3 H8 dice "10 tipos de enemigos con variantes". ¿Cuál es la cantidad correcta?
    - Mi lectura: 15 enemigos totales (= 10 tipos × ~1.5 variantes promedio). O 10 enemigos × 2-3 variantes.
    - **¿Confirma o ajusta?**
-

31. ¿Qué **tipos de enemigos** quieres cubrir?
    - Lobo (ya existe, tutorial).
    - Otros animales mutados (oso mutado, jabalí, ave gigante).
    - Humanos hostiles (bandido, cazador, fanático).
    - Criaturas arcanas / demoníacas (1-2 ejemplares raros).
    - Constructos (autómatas residuales del mundo antiguo).
    - **¿Distribución propuesta?**
-

32. ¿Cada enemigo tiene **stat-line propio** (HP, ATR, HAB, perks, IA profile)?
    - Default propuesto: sí. Cada tipo tiene su stat-line + 1-2 variantes (Lobo joven, Lobo viejo).
-

33. ¿Los enemigos del catálogo H8 cubren **todas las bandas de la tabla d20** (decisión #68)?
    - Banda 1 "peligro real" → enemigos legendarios (1-2).
    - Banda 2-3 "combate menor" → enemigos comunes (4-6).
    - Banda 8 "emboscada" → enemigos sigilosos (1-2).
    - Banda 20 "legendario" → enemigos únicos / nominales (1-2).
-

34. ¿Hay **boss / enemigo final del Teknomoro**?
    - Default propuesto: 1 boss para el final de la quest principal (H5 lo cierra; H8 cablea su stat-line).
-

35. ¿Los enemigos tienen **loot** (tabla por enemigo)?
    - §4.8 cierra que sí (loot post-combate). H6 inicia con tabla del Lobo placeholder; H8 expande tabla por cada enemigo.
-

---

## Bloque G — Meta-progresión entre runs (#66 hitos roguelike)

36. [★] Decisión #66: "v1 desbloquea progresivamente entre runs: clases / arquetipos seleccionables al crear PJ, zonas iniciales (puntos de salida), items de partida". ¿Cómo se cablea en H8?
    - (a) Sistema de logros desbloquea hitos roguelike (logro X → +1 clase disponible).
    - (b) Sistema independiente: el PJ acumula puntos al morir y los gasta en hitos.
    - (c) Eventos del meta-mundo (quests principales completadas → desbloqueo).
-

37. ¿Cuántos **hitos roguelike** tiene v1 (cantidad concreta)?
    - Decisión #66: "cantidad por categoría se calibra cuando v1 esté esqueletado". H8 es el sub-paso donde cierra.
    - Default propuesto:
      - Clases: PJ arranca con 1 clase, máx 5 (los 5 arquetipos de §4.7).
      - Zonas: PJ arranca con 1 zona (Sur, decisión #82), máx 5 (las 5 regiones).
      - Items de partida: 0 al inicio, máx 3-5 items pre-establecidos.
    - **¿Coherente?**
-

38. ¿Cómo se **gana** un hito roguelike?
    - (a) Logro específico (matar boss legendario → +1 clase).
    - (b) Acumulación de stats (jugar X horas → +1 zona).
    - (c) Cierre de quest secundaria.
-

39. ¿La UI de meta-progresión cómo se muestra?
    - (a) Pantalla aparte en menú principal ("Progreso roguelike: Clases 2/5, Zonas 1/5, Items 0/3").
    - (b) Notificación al desbloquear + lista en pantalla de creación de PJ.
    - (c) Mezcla.
-

40. ¿Los hitos roguelike se persisten **por usuario** (cuenta Supabase) o **por slot**?
    - Default propuesto: por usuario (cuenta entera). Confirma.
-

---

## Bloque H — Comercio y economía

41. [★] §4.13: "Comercio: pantalla dedicada, se accede desde opción de diálogo". ¿En H8 se cablea?
    - (a) Sí, NPCs comerciantes tienen pantalla de comercio (compra / venta).
    - (b) Sí, pero limitado (solo recursos básicos en MVP).
    - (c) Reservado a v1.1+.
-

42. ¿Cuál es la **moneda** del juego? §3 scope no lo dice. Cuestionariolore no lo cierra.
    - Default propuesto: oro genérico (sin sistema multi-moneda). Confirma.
-

43. ¿Cuántos **NPCs comerciantes** hay en MVP?
    - Default propuesto: 3-5 (uno por POI Asentamiento curado).
-

44. ¿La economía está **balanceada** entre el oro que el PJ obtiene (combates + quests + venta) vs lo que necesita gastar (re-spec + libros + crafteo + stations)?
    - Calibración fina diferida a calibración H8 (similar a H6 con números de fatiga).
-

---

## Bloque I — Cableado técnico

45. [★] ¿Qué módulos SAGRADOS toca H8?
    - `rules/progression.ts` (ya existente).
    - `rules/dialog.ts` (ya existente, esqueleto extendido).
    - `rules/faction.ts` (ya existente).
    - `rules/achievements.ts` (ya existente).
    - **Nuevos**: `rules/npcs.ts`? `rules/meta-progression.ts`?
-

46. ¿`src/data/enemies.ts` (ya existente) se expande con los 10-15 enemigos? ¿Hay `src/data/npcs.ts` nuevo?
-

47. ¿La meta-progresión se persiste en **tabla nueva de Supabase** (`user_meta_progression`) o en `auth.users` con metadata?
-

48. ¿Hay tests unitarios sobre H8? Estimación 60-100 (es el hito más amplio).
-

---

## Bloque J — Visión y deudas

49. ¿Hay algún tropo de "RPG con facciones" que quieras evitar?
    - Default a evitar: facciones polarizadas buenos vs malos (cuestionariolore B1 P10 cierra que NO).
-

50. ¿Tu intuición de meta-progresión viene de algún juego concreto? (Slay the Spire, Hades, otros).
-

51. ¿H8 se puede dividir en sub-pasos? Propuesta:
    - 8a: subida de nivel (UI + cableado).
    - 8b: re-spec.
    - 8c: 15 logros + UI.
    - 8d: 3 facciones + reputación.
    - 8e: sistema de diálogo + NPCs.
    - 8f: 10-15 enemigos del catálogo.
    - 8g: comercio.
    - 8h: meta-progresión (hitos roguelike).
-

52. ¿Algún caso borde de UX que te preocupe específicamente en H8?
-

53. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto?
-

54. ¿Quieres que H8 **cierre el contenido completo** (todos los textos de NPCs y eventos escritos) o solo el sistema con placeholders?
    - Decisión #61: contenido escrito en fase 2 (H6-H8).
-

55. ¿La escritura del contenido de NPCs cuántas horas estimas?
    - Cuestionariolore B4 P28: ~50h totales para 100 átomos seed. ¿Esos 50h cubren H5+H6+H7+H8 o solo lore-puro?
-

56. ¿Quieres anticipar gancho para **v1.1+** en H8 (e.g. romances reservados, sandbox post-final hooks)?
-

57. ¿El **re-spec** tiene **coste narrativo** (el PJ "olvida" parte de su vida pasada) o solo mecánico?
-

58. ¿Quieres que algún **NPC** tenga voz especial / lore profundo que el jugador descubra solo si invierte tiempo?
-

59. ¿Hay límite de **NPCs simultáneos en pantalla** en POI Asentamiento (e.g. 3 NPCs visibles en home)?
-

60. ¿H8 cierra con **playtest externo** (5-10 amigos) o se reserva para H10?
    - Cuestionariovision Bloque 9 P62 dice "5-10 amigos" + GitHub Pages para v1.
-

61. ¿La curva de XP (decisión #37) se **calibra** en H8 contra contenido real, o solo se cablea con números actuales?
-

62. ¿La cadencia de puntos (decisión #38) se **calibra** en H8 (e.g. nivel 5 ritual con 3 atributos en lugar de 1)?
-

63. ¿Algún tropo de logros / achievements de RPG que quieras evitar?
-

64. ¿Quieres "logros invisibles" que solo se revelan al desbloquear (más sorpresa)?
-

65. ¿La meta-progresión es **opcional para completar el juego** (jugador puede ignorarla y aún ganar) o **necesaria** (algunos hitos requieren clases desbloqueadas)?
-

66. ¿Hay algún caso edge que H4 / H5 / H6 / H7 abrieron y H8 cierra (e.g. "el catálogo de items dependía de las facciones")?
-

67. ¿Quieres que **NPCs comenten muerte del PJ anterior** (lápida) cuando un PJ nuevo entre al home?
-

68. ¿La **música** en H8 (donde el contenido pesa) tiene excepción al "silencio v1" (#76)?
    - Default propuesto: NO. v1 = silencio. Confirma.
-

69. ¿H8 entra dentro de "fase 2: contenido" según decisión #61, o solo el contenido de H6-H7?
    - Mi lectura: H8 también es fase 2 (contenido masivo).
-

70. ¿La estimación total de H8 en sesiones es **realista** con tu cabeza? Scope dice "8-12 sesiones para H8" (es lo más grande). ¿Coincide con tu intuición?
-

---

**Total: 70 preguntas. 9 marcadas [★] como bloqueantes. 2 marcadas [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lo lee y identifica contradicciones (H8 toca casi todo, asumo más cruces que cualquier otro).
2. Sesión de 30-60 min donde te paso solo las contradicciones.
3. El director redacta entrada de biblia v0.X con decisiones formales nuevas.
4. H8 se descompone en 6-8 sub-pasos y arrancan MODOPIPELINEs uno a uno (probablemente el hito más largo del MVP en cantidad de iteraciones).
