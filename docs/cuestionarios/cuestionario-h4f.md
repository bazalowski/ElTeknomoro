# Cuestionario de Scope — Sub-paso 4f del Hito 4

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 27 de agosto de 2026. **Reescritura completa** del cuestionario del 6 de mayo.
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el sub-paso.
> **Propósito:** cerrar las decisiones de UX/UI/cableado del sub-paso 4f —la tirada de exploración cableada en la vista de POI, el orquestador de efectos, y la sustitución de los botones provisionales de #93— antes de disparar MODOPIPELINE. **Es el sub-paso más denso de H4 y el que cierra el hito.**
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar.

---

## Por qué este cuestionario se reescribió entero

El anterior se redactó el **6 de mayo**, y desde entonces el modelo cambió dos veces por debajo:

- **#92** (v0.24) sustituyó las tablas por bioma por **una tabla de 20 entradas por POI**.
- **#102** (v0.28, sub-paso 4f.0) cerró el formato de entrada en §4.15.10 y lo cableó en el motor. **La cara del d20 ES el slot**: no hay pesos que normalizar ni entradas que compitan.

El cuestionario viejo preguntaba por pesos por defecto, tablas por bioma y combinatoria arquetipo × bioma: cuarenta y tres referencias a un modelo que ya no existe. Responderlo habría cerrado decisiones sobre un sistema muerto. Se conserva en el historial de git; esta versión lo sustituye.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre el modelo de #92 ni el formato de #102.** Una tabla de 20 slots por POI, la cara del d20 es el slot, cascada POI → arquetipo → genérica, bandas de §9.5 idénticas en los 720. Estos no se discuten.
2. **No es la escritura del contenido.** Las 14.400 entradas son trabajo tuyo, con el compilador que 4f.0 entregó. Aquí sólo se decide **cuánto contenido mínimo necesita 4f para ser jugable**.
3. **No diseña la quest principal ni eventos narrativos de facción.** Eso es H5.
4. **No calibra números finos.** La densidad de eventos, las DIF de §4.15.7 y el peso de combate se calibran en H6/H9.

**Convención de marcas:**
- **[★]** = bloqueante de decisión.
- **[REPO]** = ya existe respuesta parcial en biblia o código. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Qué sustituye a los botones provisionales

Hoy la vista de POI tiene tres botones cableados a mano (#93): `[Combatir]`, `[Inspeccionar]` (inerte) y `[Salir]`; en POIs de arquetipo asentamiento, `[Combatir]` se sustituye por `[Hablar]` placeholder. `[Combatir]` lanza el Lobo, único enemigo del catálogo.

1. [★] Al entrar a un POI, ¿la tirada se dispara **sola** o hay un verbo que la lanza?
   - (a) **Automática al entrar**: entrar es tirar. El POI se abre ya con el resultado en pantalla.
   - (b) **Un botón `[Explorar]`**: entrar te deja en la escena y la tirada es un acto aparte.
   - (c) Automática la primera vez; botón para volver a tirar en visitas siguientes.
-

2. [★] Si la tirada es automática al entrar (1a), **entrar ya cuesta 1 acción** (#100). ¿Volver a entrar al mismo POI para volver a tirar cuesta otra acción?
   - Asumo que sí: es lo que hace que el farmeo tenga precio, y §9.5 ya dice que la depleción es "el techo natural del farmeo". Confirma.
-

3. ¿Qué pasa con `[Inspeccionar]`? #93 lo dejó inerte y el comentario del código dice que 4f "lo activa".
   - (a) Desaparece: la tirada lo absorbe.
   - (b) Se convierte en la acción de volver a tirar.
   - (c) Se convierte en otra cosa (dime cuál).
-

4. [REPO] `[Salir]` se queda tal cual, ¿no? Cerrar el POI es cámara, no acción de juego, y no cuesta jornada.
-

5. [★] **El POI de arquetipo asentamiento.** Deuda #95: un asentamiento no puede alcanzar `completado`, así que su grid no derivaba a Controlado. Con #103 eso ya no bloquea nada —Controlado se mide en POIs **visitados**— pero el asentamiento sigue sin tener qué hacer dentro.
   - (a) El asentamiento **también tira** en la tabla d20 como los demás. `[Hablar]` desaparece hasta H8.
   - (b) El asentamiento **no tira**: es un lugar seguro con servicios, y sus 20 slots quedan sin usar hasta H8.
   - (c) Tira, pero su tabla de arquetipo está sesgada a encuentros neutrales y recursos.
-

6. ¿El POI Hogar (`sur-001`, el campamento de #95) tira?
   - Asumo que **no**: es tu casa, y #95 le dio acciones propias de campamento. Confirma.
-

---

## Bloque B — La tirada y su visibilidad

7. [REPO] §4.15.5 dice que la visibilidad de la tirada es **completa**, y lo llama "un punto de identidad del juego: presumimos reglas de rol, enseñamos los dados". #75 lo repite. ¿Se mantiene en 4f?
-

8. [★] ¿Cómo se enseña el d20?
   - (a) **Animación de dado rodando** antes de revelar la entrada, con el número final grande.
   - (b) **Número directo** con la banda nombrada ("14 — Encuentro neutral"), sin animación.
   - (c) Animación corta (200-400 ms) y luego el texto, en el mismo panel.
-

9. ¿Se muestra **la banda** además del número? Es decir, ¿el jugador aprende que 4-12 es "color del mundo"?
   - (a) Sí, con nombre: enseña el sistema y hace legible la suerte.
   - (b) Sólo el número: la banda es andamiaje de autor, no información de jugador.
   - (c) El número siempre; la banda sólo con el flag de dev de #16.
-

10. ¿Se muestra de qué escalón de la cascada salió la entrada (`source`: propia / arquetipo / genérica)?
    - Asumo que **sólo con el flag de dev**: enseñárselo al jugador le dibuja el mapa del contenido escrito a mano, que es justo lo que #81 y #93 protegen. Confirma.
-

11. ¿Hay **log de tiradas** persistente en la sesión (una lista de qué salió en cada POI), o cada tirada vive y muere en su modal?
-

---

## Bloque C — Presentación: modal contra banner

§4.15.5 reparte: **modal a pantalla completa** para eventos de peso (combate, narrativo, POI descubierto, emboscada) y **banner superior con acciones** para los ligeros (hallazgo, NPC ambulante, refugio, trampa mitigada).

12. [★] Ese reparto se escribió antes de que existiera el zoom continuo de §9.1, que #83 blindó contra los routers modales. ¿Se mantiene el modal a pantalla completa, o el evento se pinta **dentro de la escena del POI** que 4c ya construyó?
    - (a) Modal a pantalla completa, como dice §4.15.5.
    - (b) **Dentro de la escena del POI**: el evento sustituye el texto placeholder de #93 y los botones salen debajo. Sin capa nueva.
    - (c) Mixto: dentro de la escena para los ligeros, modal sólo para combate.
-

13. Con la banda "color del mundo" al **45%**, casi la mitad de las tiradas son texto ambiental sin decisión. ¿Esas merecen algún tratamiento distinto para que no se sientan como un muro de "no pasa nada"?
    - Mi lectura: es literalmente "Nada con sustancia" y su valor está en el texto, no en la mecánica. Pero cuarenta y cinco de cada cien interacciones con un botón `[Cerrar]` es un riesgo de ritmo real. Dime si lo ves.
-

14. ¿El resultado de la tirada **se queda en pantalla** al cerrar (el POI recuerda lo último que salió) o la escena vuelve a su estado neutro?
-

15. ¿Hay diferencia visual entre el **1** (peligro real), el **20** (legendario) y el resto? §4.15.6 pide color-coding para las reactivas; ¿la raíz también?
-

---

## Bloque D — El orquestador de efectos

`PoiMechanic` declara nueve efectos: `enemy`, `item`, `damage`, `heal`, `gold`, `xp`, `status`, `reveal_poi`, `flag`. El motor los expone y **no los aplica nadie** — es deuda declarada con destino 4f.

16. [★] ¿Los nueve se cablean en 4f, o hay un subconjunto?
    - Mi propuesta: **siete sí** (`enemy`, `item`, `damage`, `heal`, `gold`, `xp`, `status`), porque los siete tienen motor detrás desde H3. **`reveal_poi` y `flag` quedan fuera**: `reveal_poi` revela un POI de otro grid y eso toca la niebla de §9.9 de una forma que nadie ha decidido; `flag` no tiene consumidor hasta H5/H8. Confirma o ajusta.
-

17. [★] ¿Dónde vive el orquestador?
    - (a) `src/state/exploration-flow.ts` nuevo, hermano de `travel-flow` y `world-flow`.
    - (b) Métodos nuevos en `world-flow`.
    - (c) Decide el director.
-

18. `enemy` lanza combate. Hoy el catálogo tiene **un solo enemigo** (el Lobo). ¿4f entrega más enemigos o el Lobo cubre todas las entradas de combate hasta H8?
    - Asumo que el Lobo cubre, y queda declarado como deuda: 15 enemigos son el elemento 4 del inventario de v1 y su hito es H8. Confirma.
-

19. `damage` con el PJ a poco HP: §4.15.3 dice que la trampa **nunca mata directamente** (deja mínimo 1 HP). ¿Eso vale para todo `damage` de exploración, o sólo para el tipo `trap`?
    - Asumo que **para todo `damage` de exploración**: morir leyendo un texto ambiental sin haber podido decidir nada es la peor muerte posible en un juego con permadeath (#65). Lo que mata es el combate, la fatiga (#98) y las decisiones. Confirma.
-

20. `item` cuando la mochila está llena (20 slots, `INVENTORY_RULES`). ¿Qué pasa?
    - (a) Modal de "no te cabe", el item se pierde.
    - (b) Modal de descarte: elige qué tiras.
    - (c) El item se queda en el POI y se puede volver a por él.
-

21. [REPO] Deuda de #98: el PJ nace con 4 raciones y **no hay forma de conseguir más**; el destino escrito es "4f, banda 16-17 de §9.5". ¿4f garantiza que las genéricas de la banda de recurso incluyan raciones?
    - Asumo que sí, y que es un requisito de cierre y no un deseo: sin eso, cualquier run larga sigue muriendo de hambre. Confirma.
-

22. `xp` de exploración: ¿la tirada da XP por sí sola, o sólo por combate?
    - Asumo que las entradas pueden darla cuando lo declaren, pero que la mayoría no lo hace. Confirma.
-

---

## Bloque E — Tirada reactiva

§4.15.6 cierra el marco: toda entrada declara `evade_check`, el modal muestra `[Intentar evadir]` y `[Afrontar]`, la tirada entrena la habilidad ganes o pierdas. `resolveEvadeCheck` ya existe en el motor. `PoiEvadeOverride` permite a cada entrada declarar la suya, y `null` significa "usa el default de §4.15.7 para este tipo".

23. [★] ¿La tirada reactiva entra en 4f o se difiere?
    - (a) **Entra entera**: sin ella el jugador mira el evento sin poder hacer nada, y §4.15.6 la llama "agencia del jugador".
    - (b) **Se difiere a H5/H6**: 4f cablea la raíz y los efectos, y la reactiva llega cuando las habilidades tengan más recorrido.
    - (c) Entra sólo para los tipos donde más pesa (combate, trampa, emboscada) y el resto afronta directo.
-

24. Si entra: los defaults de §4.15.7 por tipo de evento **no existen en código todavía**. ¿Se escriben en `data/` como tabla, o se hardcodean en el motor?
-

25. §4.15.6 dice que sin la habilidad requerida el botón sale **desactivado con tooltip**, sin tirar con penalizador fantasma. Un PJ recién creado tiene pocas habilidades. ¿Cuántas de las tiradas reactivas le van a salir apagadas en la primera hora, y eso te parece bien?
-

26. ¿La tirada reactiva se enseña con la misma animación que la raíz, o con una distinta? §4.15.6 pide "animación propia distinta a la del combate".
-

---

## Bloque F — Memoria de depleción y estado persistido

§9.5 cierra: "una entrada ya vista pierde peso de reaparición en esa run. Un POI visitado repetidamente se agota y empieza a repetirse — ése es el techo natural del farmeo". Hoy `WorldState` guarda `poiStates` con dos valores (`revelado` / `completado`) y **nada más**: no hay dónde anotar qué slots se han visto.

27. [★] ¿Cómo se implementa la depleción?
    - (a) **Set de slots vistos por POI** persistido en `world_state`. Al tirar, un slot ya visto se re-tira una vez (o se desplaza al siguiente sin ver).
    - (b) **Contador de visitas por POI**: a partir de N visitas el POI deja de dar resultados nuevos.
    - (c) Nada en 4f: la depleción se difiere y el farmeo queda abierto hasta H6.
-

28. Si es (a): con 720 POIs × hasta 20 slots, el `world_state` puede engordar. ¿Preocupa?
    - Mi lectura: no, si se aplica la misma convención de escasez que ya usa `world-state.ts` —guardar sólo lo que se aparta del default—, porque un run realista toca decenas de POIs, no setecientos. Confirma.
-

29. [★] **¿Qué hace que un POI esté `completado`?** Es la pregunta que 4c dejó abierta y #103 dejó de necesitar, pero que sigue sin respuesta.
    - (a) Agotar sus 20 slots.
    - (b) Consumir su entrada curada, si la tiene.
    - (c) La primera tirada resuelta, sea cual sea.
    - (d) `completado` se retira: con Controlado midiéndose en visitados (#103), el segundo estado ya no lo usa nadie.
-

30. La entrada curada de los 80 POIs con `hasCuratedSlot`: `shouldUseCuratedEntry(table, alreadyConsumed)` pide un `alreadyConsumed` que hoy no vive en ningún sitio. ¿Dónde se persiste?
    - Asumo `world_state`, junto a los slots vistos, porque se rebobina con la muerte igual que todo lo demás (#94). Confirma.
-

31. [REPO] La entrada curada **puentea el d20** y no sustituye a los 20 slots: el POI lleva las dos cosas. ¿La curada se dispara en la **primera visita** antes de cualquier tirada?
-

---

## Bloque G — La contradicción de §9.6

**Esto es lo más importante del cuestionario.** §9.6 dice que el estado del grid modula **los pesos** de la tabla: "Controlado (fast travel disponible, recursos garantizados, tablas con menor varianza)". §4.15.2 y §4.15.6 hablan también de modular pesos por hora, clima, suerte y consumibles.

**Pero en el modelo de #102 no hay pesos.** La cara del d20 es el slot. No hay nada que modular.

32. [★] ¿Cómo se resuelve? Cuatro salidas, y ninguna es obviamente la buena:
    - (a) **La modulación se retira.** §9.6 se reescribe: el estado del grid habilita cosas (fast travel) pero no toca la tabla. El d20 es plano y limpio, y la varianza es la misma en todas partes.
    - (b) **Modulación por re-tirada**: en un grid Controlado se tiran dos d20 y se toma el mejor (o el más "seguro"). Es ventaja/desventaja de d20, no pesos.
    - (c) **Modulación por desplazamiento**: el estado del grid suma o resta un modificador al d20 antes de resolver el slot, con clamp a [1, 20].
    - (d) **Modulación por tabla alternativa**: un grid Controlado usa la tabla del POI y uno Inexplorado usa una variante hostil. Duplica el contenido a escribir.
-

33. Si eliges (b) o (c), eso hace que **el reparto de bandas de §9.5 deje de ser el reparto real**. El 45% de "color del mundo" se convierte en otra cosa según dónde estés. ¿Lo aceptas?
-

34. La **suerte** (#43) es una de las tres variables que #83 declara activas en runtime, junto a bioma y nivel. Con el d20 plano, ¿dónde entra?
    - Asumo que por la misma vía que elijas en la 32, y que si es (a) la suerte deja de tener efecto sobre la exploración y pasa a ser sólo de combate y loot. Confirma, porque eso vacía media decisión #43.
-

35. El **bioma** es la otra. Con tablas por POI ya no hay tabla por bioma. ¿El bioma sigue significando algo mecánicamente, o queda como sabor del texto?
-

---

## Bloque H — Los otros disparadores y el código muerto

§4.15.1 lista cinco disparadores. §4.15.8 dice que "entrar a POI" usa tabla por POI y **el resto usa tabla por bioma**.

36. [★] ¿4f cablea sólo "entrar a POI", o también pisar casilla nueva, cruzar frontera de bioma, acampar y tramo de viaje rápido?
    - Mi propuesta: **sólo entrar a POI**. Los otros cuatro necesitarían tablas por bioma que no existen, que nadie ha escrito y que #92 dejó fuera del modelo. Cablearlos sería reabrir el sistema que #102 cerró. Confirma o ajusta.
-

37. Si es así, §4.15.8 miente en su segunda mitad y hay que reescribirla. ¿De acuerdo?
-

38. [★] **`rollExplorationTick` y todo el aparato de `BiomeTable` no tienen ni un consumidor de producción.** Sólo sus propios tests. Es exactamente la situación en la que estaba `fast-travel.ts` antes de 4e, y #105 lo resolvió reescribiéndolo entero.
    - (a) **Se retiran** de `exploration.ts` con sus tests, como se hizo con el fast travel viejo.
    - (b) **Se quedan** por si los otros disparadores vuelven en H5.
    - (c) Se marcan como muertos con un comentario y se retiran cuando H5 confirme que no vuelven.
-

39. Misma pregunta para `world-gen.ts`, que 4e dejó intacto por no estar en scope: genera un grafo procedural que el mundo fijo de #72 jubiló. ¿Se retira en 4f o sigue esperando?
-

---

## Bloque I — Contenido mínimo para que 4f sea jugable

Estado real hoy: **0 de 20 slots genéricos escritos, 0 entradas de arquetipo, 2 tablas de POI** (el piloto de 4f.0). `resolvePoiEntry` devuelve `null` para casi todo.

40. [★] 4f no puede cerrarse sin contenido: sin las genéricas, entrar a un POI enseña una pantalla vacía. ¿Cuál es el mínimo?
    - (a) **Las 20 genéricas, una por slot.** Cubre los 720 POIs de golpe y nunca hay hueco. Es lo mínimo que hace el sistema jugable.
    - (b) Las 20 genéricas **× N variantes** (el motor ya soporta varias por slot para que no se repita la misma línea tres veces seguidas). Dime N.
    - (c) Las 20 genéricas + las 4 tablas de arquetipo completas (80 entradas más).
-

41. ¿Las escribes tú antes de que yo codee 4f, en paralelo, o codeo yo contra las genéricas de relleno y tú las sustituyes después?
    - Aquí no hay respuesta técnica correcta: es tu tiempo. Pero cambia el orden de trabajo, así que lo pregunto.
-

42. [REPO] Deuda del lore v2, C1: los nombres de las cinco regiones del dataset **contradicen las respuestas del lore v1 en tres de cinco**, y eso bloquea escribir nombres y descripciones de POI. ¿Bloquea también las genéricas?
    - Mi lectura: **no**. Una entrada genérica de banda es ambiental y no nombra sitios; se puede escribir con el lore abierto. Las curadas de los 80 sí esperan. Confirma.
-

---

## Bloque J — Cableado

43. [★] ¿Qué módulos SAGRADOS toca 4f?
    - Mi previsión: `rules/exploration.ts` (retirada del modelo viejo, defaults de §4.15.7 si la reactiva entra), `rules/world-state.ts` (memoria de depleción y curada consumida), y `data/exploration/` (el contenido compilado). ¿Ves alguno más?
-

44. ¿La memoria de depleción va en `WorldState` con `version: 1` o exige bump de versión del shape persistido?
    - Es un campo nuevo en un jsonb; `hydrateWorldState` degrada sin romper. Asumo que **no hace falta bump**. Confirma.
-

45. Tests: estimo **30-40 unitarios** entre la cascada con depleción, el orquestador de efectos, los clamps de `damage`, y la mochila llena. ¿Te parece la banda correcta?
-

46. ¿Simulación antes de codear? §12.3 la exige para números de balanceo. Aquí el número gordo es el reparto de bandas de §9.5, que ya está cerrado y no se toca. Pero **la 32 sí es balance**: si eliges (b) o (c), el reparto real deja de ser el escrito.
    - Mi propuesta: si eliges (a), no hace falta simular. Si eliges (b) o (c), **sí**, y la simulación va antes del código.
-

---

## Bloque K — Edge cases, visión y deudas

47. ¿Qué pasa si el jugador entra a un POI con la jornada agotada? Hoy `enterPOI` devuelve `false` y no se abre nada (corregido en v0.31).
-

48. ¿Qué pasa si sale un `enemy` y el PJ está a 1 HP? ¿Se avisa antes de entrar al combate, o el combate arranca y allá él?
-

49. ¿Qué pasa si cierra el navegador con un evento abierto sin resolver? El combate en curso no se serializa (deuda de #93). ¿El evento sí?
    - Asumo que no, y que al recargar el POI está sin tirada abierta — coherente con #93. Confirma.
-

50. Con 4f cerrado, **H4 cierra y el prototipo entra en playtest** (paso 8 del roadmap de §3.2). ¿Hay algo que quieras dentro de H4 antes de darlo por cerrado y que no esté en ningún sub-paso?
-

51. ¿Algún caso borde de UX que te preocupe específicamente en 4f?
-

52. ¿Alguna decisión de producto pendiente que el director pueda haber pasado por alto?
-

---

**Total: 52 preguntas. 13 marcadas [★] como bloqueantes. 5 marcadas [REPO] como confirmación rápida.**

**La pregunta 32 es la que más pesa.** §9.6 promete una modulación que el modelo de #102 no puede dar, y eso lleva escrito en la biblia desde v0.24 sin que nadie lo mirara de frente. Las otras doce bloqueantes son de scope; ésa es de sistema.

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lee y identifica contradicciones internas + cruzadas.
2. Sesión corta donde te paso sólo las contradicciones.
3. MODOPIPELINE arranca para 4f: con el scope firmado, carril B — el brief se compila citando las decisiones y el director valida la traducción decisión→UI.
4. Cierre del sub-paso: commits con OK explícito uno a uno.
