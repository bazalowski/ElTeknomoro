# Cuestionario de Scope — Hito 5

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el hito.
> **Propósito:** cerrar el scope completo del Hito 5 (modo Historia + quest principal + quests secundarias + sistema de eventos narrativos + pantalla de victoria + selector Historia/Libre) antes de empezar a planificar sub-pasos. **H5 es el hito más crítico de la fase 1**: cierra "esqueleto > contenido > pulido" (decisión #61). Sin H5, el juego no es completable extremo a extremo.
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar. Si H4 descubre algo que las invalide, la decisión se reabre.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22.** Reordenamiento de hitos (#62: H5 separado para quest principal). Final Teknomoro alcanzable como condición de victoria (#44, #75). Selector Historia/Libre (decisión #13). Lore embebido (#73, sin códice modal). Estos no se discuten.
2. **No es brief de implementación.** Sin clases TypeScript, nombres de archivos, ni patrones de render.
3. **No reduce el cuestionario de lore al cuestionario de scope.** Si una pregunta toca contenido narrativo concreto que se redacta en `cuestionariolore.md`, márcala y se delega.
4. **No diseña catálogos** de items / enemigos / facciones — eso es H6 / H8.

**Convención de marcas:**
- **[★]** = bloqueante de decisión.
- **[REPO]** = ya existe respuesta parcial en biblia/scope/cuestionariolore. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Identidad de la quest principal (Teknomoro)

1. [★] Cuestionariolore B1 P7 cierra que Los Teknomoros son "un grupo reducido de personas... motor de la historia principal... templarios que recolectan TODO lo del mundo antiguo". ¿La quest principal del modo Historia es:
   - (a) **Encontrar a Los Teknomoros** (descubrir quiénes son, dónde viven, cómo entrar).
   - (b) **Ser uno de Los Teknomoros** (iniciación, prueba, aceptación).
   - (c) **Detener a Los Teknomoros** (descubrir que algo malo hacen, oposición).
   - (d) **Servir a Los Teknomoros** (recibir misiones de ellos como contratante).
   - (e) Una combinación de las anteriores en distintas fases del run.
-

2. [★] La quest principal tiene **principio + medio + fin** o es **emergente** (la condición de victoria se cumple cuando el PJ acumula X cosas)?
   - (a) Principio + medio + fin lineal: 5-7 hitos narrativos en orden.
   - (b) Principio + medio + fin con ramas: el jugador elige entre 2-3 rutas distintas para llegar al final.
   - (c) Emergente: cuando el PJ encuentra X pistas / visita Y POIs / mata Z enemigos legendarios, se desbloquea el final.
-

3. ¿Cuántos **hitos narrativos** tiene la quest principal en v1?
   - (a) 3-5 (corta, completable en 1-2 runs).
   - (b) 5-8 (media, completable en 2-4 runs).
   - (c) 8-12 (larga, completable en 4-6 runs).
-

4. ¿La quest principal **se sigue entre runs** o cada run reinicia desde cero?
   - Decisión #65: "permadeath puro, nada hereda entre runs". Cuestionariovision Bloque 2 P11: "todo el estado de la run se reinicia, mueren con el PJ los progresos en questlines".
   - Mi lectura: quest principal SE REINICIA cada run. El jugador la repite (aprende de cada muerte). Pero ¿confirma esto, o quieres permitir herencia parcial (e.g. flag "ya descubrí Los Teknomoros, no necesito buscarlos otra vez")?
-

5. ¿El final Teknomoro es **un único final** o hay múltiples (e.g. ser Teknomoro, ser enemigo de Teknomoros, descubrir que no existen, etc.)?
   - Default propuesto: 1 solo final canónico para v1 (mismo final con texto distinto según decisiones del PJ). Múltiples finales reservados a v1.1+.
-

6. La frase final del juego ("eres un Teknomoro" / "los Teknomoros mueren contigo" / "la verdad es X"), ¿está ya en tu cabeza, o la redactas en H10?
-

7. [REPO] Cuestionariolore B2 P14 dice "el evento ocurrió hace ~4000 años, no todos los personajes lo conocen". ¿La quest principal del PJ implica **descubrir el origen** del mundo (la Caída)?
   - (a) Sí, el PJ descubre la verdad jugando.
   - (b) No, la verdad ya se asume; la quest es sobre Los Teknomoros como organización presente.
   - (c) Mezcla: la quest es presente, pero los hitos atraviesan revelación del pasado.
-

---

## Bloque B — Hitos concretos de la quest principal

8. [★] La quest principal se construye sobre el **mapa hardcodeado** (5 regiones, 180 grids, 720 POIs) ya cerrado en H4. ¿Qué POIs son **clave** para la quest principal?
   - (a) Cada hito narrativo está en un POI curado específico (de los 80). El jugador debe visitar X POIs específicos en orden.
   - (b) Cada hito está en una región específica (no en POI individual): "ve al Norte" → cualquier POI del Norte avanza.
   - (c) Los hitos están encadenados a items / NPCs / eventos sin POI fijo.
-

9. ¿Hay **hitos en cada una de las 5 regiones** (la quest principal es paseo geográfico) o se concentra en algunas?
   - Decisión #82: Sur es Hub. Centro = no-hub. Norte/Este/Oeste = funciones por definir.
   - Mi propuesta: la quest principal arranca en Sur (home), pasa por Centro (clímax narrativo, ya que Centro tiene 50 grids), y los hitos finales están en Norte / Oeste / Este distribuidos.
-

10. ¿El primer hito narrativo se descubre **automáticamente** al cierre del tutorial Lobo, o el jugador debe encontrarlo explorando libremente?
    - (a) Auto: tras tutorial, el PJ ve "Tienes que encontrar X" como mensaje narrativo.
    - (b) Explorando: el jugador descubre el primer hito al visitar X POI por casualidad.
-

11. ¿Hay **diario de quest** visible al jugador? §10 dice "no hay códice modal en MVP" (#73). ¿El diario de quest cae bajo "códice prohibido" o es excepción?
    - Mi propuesta: NO hay diario consultable (coherente con #73). El último hito completado se muestra como banner sutil en HUD ("Quest activa: encuentra X").
-

12. ¿La quest principal tiene **hitos opcionales** o todos los hitos son obligatorios?
-

13. ¿La quest principal puede **fracasar** sin que el PJ muera? (e.g. matar a un NPC clave por error → no se puede completar). Asumo NO en MVP. Confirma.
-

---

## Bloque C — Quests secundarias

14. [★] §3 del scope cierra "3-5 quests secundarias en v1". ¿Cuántas quieres exactamente?
-

15. ¿Cómo se descubren las quests secundarias?
    - (a) Vía NPCs en POIs Asentamiento.
    - (b) Vía eventos `narrativo` de la tirada de exploración (4f).
    - (c) Vía pistas / rumores (banda 18 de la tabla d20, §9.5).
    - (d) Combinación.
-

16. ¿Las quests secundarias **dan recompensas mecánicas** (XP, items, perks) o solo lore?
    - Default propuesto: ambas. Una recompensa concreta + un átomo de lore (§10).
-

17. ¿Una quest secundaria puede **bloquear avance** de la quest principal? (e.g. NPC X necesita que termines su quest secundaria antes de hablarte sobre Los Teknomoros). Asumo NO en MVP. Confirma.
-

18. ¿Las quests secundarias se **persisten entre runs**? Decisión #65: NO. ¿Confirmas?
-

19. ¿Las quests secundarias tienen **árbol de dependencias** (una completa abre otra) o son piezas sueltas?
    - Default propuesto: piezas sueltas (más manejable). Árbol reservado a v1.1+.
-

20. ¿Las quests secundarias **caducan**? (e.g. tras X días, NPC ya no tiene la quest disponible). Asumo NO en MVP.
-

---

## Bloque D — Sistema de eventos narrativos

21. [★] Los **eventos narrativos** (tipo 7 de §4.15.3) son el motor de quest. En 4f quedan como placeholder; en H5 se cablean. ¿Cómo se diferencian de los **POIs curados**?
    - (a) Curado = evento fijo en POI específico. Narrativo = evento condicional disparado por flags / progreso.
    - (b) Son lo mismo: un evento narrativo y un evento curado son el mismo concepto bajo dos nombres.
    - (c) Curado = evento estático escrito a mano. Narrativo = evento sistémico generado por reglas.
-

22. ¿Los eventos narrativos son **escenas** (modal con texto + decisiones del jugador)?
    - Default propuesto: sí. Modal con título + descripción + 2-4 botones de decisión + outcome.
-

23. ¿Las decisiones del jugador en eventos narrativos **escriben flags en `Character.flags`**? Asumo sí.
    - Ejemplo: "Has matado al NPC X" → `flags.matar_npc_x = true`. Esto modula eventos futuros.
-

24. ¿Las decisiones tienen **chequeos sociales** (Persuasión, Intimidar)?
    - §4.13 cierra que sí (tiradas sociales visibles en diálogos). En H5 se cablean estas tiradas.
-

25. ¿Hay un **catálogo provisional** de eventos narrativos en H5 (e.g. 20-30 eventos cubriendo quest principal + secundarias + ambientales)?
-

26. ¿Los eventos narrativos pueden **tener consecuencias en cadena** (un outcome dispara otro evento N grids después)?
    - Default propuesto: sí, vía flags. Pero sin árbol formal en H5.
-

27. ¿Los eventos narrativos **caducan** o son re-disparables si el jugador vuelve al mismo POI?
    - Default propuesto: cada evento se dispara una sola vez por run. Re-visitar POI no re-dispara.
-

---

## Bloque E — Modo Historia vs Modo Libre

28. [★] En H5 se activa el **selector Historia/Libre** en home (biblia §4.6 paso 2). ¿Qué cambia en cada modo?
    - **Historia**: mapa fijo (mismo overworld) + quest principal activa + quests secundarias + final Teknomoro alcanzable.
    - **Libre**: mismo mapa fijo + sin quest principal + frase-semilla del jugador modula contenido (eventos, frecuencia tablas) + cierre solo por muerte.
    - ¿Coherente?
-

29. ¿En modo Libre se desbloquean **quests secundarias** o solo eventos del overworld?
    - Default propuesto: quests secundarias también disponibles en Libre (las quests secundarias son "del mundo", no de la quest principal).
-

30. ¿La frase-semilla del modo Libre modula **qué contenido específico**?
    - (a) Pesos de tablas d20 (más combate vs más color).
    - (b) Distribución espacial (qué POIs aparecen primero, qué orden de eventos).
    - (c) Spawn de items y enemigos.
    - (d) Todas las anteriores.
-

31. ¿El modo Libre tiene **logros propios** o comparte con Historia?
    - Default propuesto: comparten 15 logros (#3.1). Logros específicos de modo se reservan a v1.1+.
-

32. ¿El **lore embebido** (§10) se entrega en ambos modos por igual, o el modo Historia tiene más?
    - Default propuesto: ambos modos entregan TODO el lore (los 100 átomos seed son del mundo, no de la quest).
-

---

## Bloque F — Pantalla de victoria

33. [★] Decisión #44: pantalla de victoria reutiliza formato de epitafio con `cause.kind = 'victory'`. ¿Qué muestra exactamente?
    - (a) Título "Has cumplido tu destino" + texto de la quest principal completada + stats finales.
    - (b) Título "El Teknomoro" + epílogo narrativo + stats + epitafio del PJ con tono celebratorio.
    - (c) Fade a negro + frase final + créditos cortos.
-

34. ¿Tras la pantalla de victoria, ¿qué pasa con el slot del PJ?
    - (a) Marca "completado" + queda como epitafio celebratorio consultable.
    - (b) Liberado para crear PJ nuevo (la run termina).
    - (c) Modo "post-final" que permite seguir jugando con el mismo PJ (sandbox post-final reservado a v1.1+ — confirmaría que NO en H5).
-

35. ¿El final Teknomoro tiene **logro especial** desbloqueado?
-

36. ¿El final Teknomoro **modifica algo** en futuros runs (e.g. desbloquea modo Libre con sabor "post-final" o nada)?
    - Decisión #65: nada hereda entre runs. ¿Confirmas que el final Teknomoro NO desbloquea nada para futuros PJs?
-

37. ¿Hay diferencia entre el **modal de victoria** y el **modal de epitafio (muerte)**? Mismo formato pero distintos colores / textos / iconos.
-

---

## Bloque G — Cableado técnico

38. [★] §3 del scope cierra: `rules/quest.ts` SAGRADO con `Quest`, `QuestStep`, `QuestProgress`. ¿Confirmas este alcance, o ya tienes en cabeza otros nombres / abstracciones?
-

39. ¿La **persistencia de quest** vive en `Character.quest_progress` o en tabla aparte de Supabase?
    - Default propuesto: `Character.quest_progress` (parte del PJ, se borra con permadeath).
-

40. ¿`endRunWithVictory` (ya existente en `src/rules/death.ts` desde H1) es la función que cierra el run con victoria? ¿En H5 se cablea su caller (modo Historia detecta condición + llama)?
-

41. ¿Los **eventos narrativos** viven en JSON (`src/data/events/*.json`) o en TS (`src/data/events/*.ts`)?
    - Convención del repo: TS para todo el contenido, salvo `data/world/*.json` que abrió la convención JSON en 4a.
    - Mi recomendación: TS (events estructurados, queremos type-safety).
-

42. ¿Hay tests unitarios sobre `quest.ts` (avance de quest, completion, persistence)? Estimación 30-50 tests.
-

43. ¿`rules/dialog.ts` (ya existente, esqueleto extendido) se reescribe en H5 o solo se extiende?
-

---

## Bloque H — Producción y ritmo

44. [★] H5 es **el hito que cierra fase 1** (esqueleto > contenido > pulido, decisión #61). ¿Qué cantidad de contenido escrito es **necesaria** para v1?
    - (a) 3-5 hitos narrativos quest principal + 3-5 quests secundarias + 20-30 eventos narrativos (mínimo viable).
    - (b) 5-8 hitos + 5-8 secundarias + 50-80 eventos (medio).
    - (c) 8-12 hitos + 10+ secundarias + 100+ eventos (rico).
-

45. ¿La escritura de los textos **se incluye en H5** o se difiere a H6+ con placeholders?
    - Decisión #61: esqueleto en fase 1. Mi propuesta: H5 cierra el sistema con 5-10 eventos placeholder + 3 hitos quest principal. Contenido completo se escribe en H6-H8.
    - O: H5 cierra el sistema CON contenido mínimo viable para que el final Teknomoro sea alcanzable.
-

46. ¿Qué tiempo estimas dedicar a redactar contenido en H5?
    - Cuestionariolore B4 P28: ~50 horas en lotes para los 100 átomos seed. ¿Eso es para H5 + H8, o solo H8?
-

47. ¿Hay un **MVP del MVP** dentro de H5? ¿Cuál sería el "esqueleto del esqueleto"?
    - Mi propuesta: 3 hitos quest principal + final alcanzable + 1 quest secundaria + 5 eventos narrativos placeholder. Suficiente para "completable extremo a extremo".
-

48. ¿H5 se puede **dividir en sub-pasos** como H4? ¿Tiene sentido sub-paso 5a sistema, 5b quest principal, 5c quests secundarias, 5d eventos narrativos, 5e victoria?
-

---

## Bloque I — Visión y deudas

49. ¿Hay algún tropo de "modo Historia" que quieras evitar específicamente?
    - Default a evitar: rol pasillero ("ve aquí, mata X, vuelve"), QTE, escena interactiva sin agencia. Ya cerrados en §11.
-

50. ¿Tu intuición de "quest principal en RPG con permadeath" viene de algún juego concreto? (Caves of Qud, Cogmind, Stoneshard, otro).
-

51. ¿Quieres que el final Teknomoro sea **secreto** (el jugador no sabe qué busca al inicio) o **claro** (queda explícito desde el principio)?
-

52. ¿Hay decisiones del jugador que pueden **bloquear el final** (e.g. matar a Teknomoro 1 → no puedes ser Teknomoro)? ¿O todas las rutas convergen al final?
-

53. [REPO] Cuestionariolore B1 P10: "cada facción tiene su color, no buenos vs malos". ¿Las facciones (3 en MVP, identidad pendiente) tienen rol en quest principal o solo en quests secundarias?
-

54. ¿Quieres que la quest principal **toque combate** (debe vencer X enemigos) o sea más exploratorio (descubrir / hablar / decidir)?
-

55. ¿Algún caso borde de UX que te preocupe específicamente en H5?
-

56. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto?
-

57. ¿La quest principal tiene **voz narrativa** propia (cronista, NPC central, "tu PJ pensando") según las 4 voces de §10.3?
-

58. ¿Quieres anticipar algún **gancho** para v1.1+ en H5? (e.g. una pista en el final que abre el sandbox post-final).
-

59. ¿El final Teknomoro tiene **música** propia? (Audio v1 = silencio + SFX UI según #76; ¿hacemos excepción para el final?). Asumo NO en MVP.
-

60. ¿H5 cierra con **playtest externo**? Decisión #75 menciona la entrega a 5-10 amigos cuando llegue MVP. ¿H5 = momento del playtest, o esperamos a H8?
-

---

**Total: 60 preguntas. 9 marcadas [★] como bloqueantes. 2 marcadas [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lo lee de una sentada e identifica contradicciones internas + cruzadas con biblia + cuestionariolore + cuestionarios H4.
2. Sesión de 30-60 min donde te paso solo las contradicciones (H5 toca lore en profundidad, asumo más cruces con cuestionariolore).
3. El director redacta una entrada de biblia v0.X con las decisiones formales nuevas tras tus respuestas.
4. Tras OK del cierre, H5 se descompone en sub-pasos y arrancan MODOPIPELINEs uno a uno.
