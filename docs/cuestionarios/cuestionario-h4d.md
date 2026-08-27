# Cuestionario de Scope — Sub-paso 4d del Hito 4

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el sub-paso.
> **Actualizado el 26 de agosto de 2026:** añadido el **Bloque I** (3 preguntas) con la deuda documental del rango #48-#61 de §5, arrastrada desde el cierre del cuestionario de 4c.
> **Propósito:** cerrar las decisiones de UX/UI/cableado del sub-paso 4d (acciones por día + acampar + ración + UI de fatiga + muerte por fatiga) antes de disparar MODOPIPELINE. El scope macro de H4 ya está cerrado en biblia v0.22 (decisión #83 confirma "8/día + ración por acampar + penalización HP sin ración + muerte por fatiga"). Este cuestionario refina los detalles operativos.
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar. Si sub-pasos previos descubren algo que las invalide, la decisión se reabre.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22.** 8 acciones por día (#71). Acampar consume 1 ración (#71). Penalización HP sin ración (#71). Muerte por fatiga setea `last_damage_source='fatigue'` (#85). Calibración fina de los números diferida a H6 (#83). Estos no se discuten.
2. **No es un sistema económico completo.** Las raciones son consumibles que se obtienen vía POIs; el catálogo de items real entra en H6. En 4d se asume "el PJ tiene N raciones, las gasta al acampar".
3. **No diseña fast travel.** Eso es 4e.
4. **No diseña tirada de exploración.** Eso es 4f. En 4d cada movimiento entre grids consume 1 acción del día sin tirada.

**Convención de marcas:**
- **[★]** = bloqueante de decisión.
- **[REPO]** = ya existe respuesta parcial en biblia/scope. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Modelo de día y reset

1. [★] Un día tiene 8 acciones. ¿Qué cuenta como 1 acción exactamente?
   - (a) Mover al grid adyacente: 1 acción.
   - (b) Entrar a POI: 1 acción.
   - (c) Combatir en POI: ¿1 acción adicional al "entrar"? ¿O el combate es gratis dentro del POI?
   - (d) Craftear: ¿1 acción? (H7 lo cierra, ¿4d lo deja en placeholder?)
   - (e) Hablar con NPC: ¿1 acción? (H8 lo cierra)
   - (f) Acampar: 0 acciones (gratis pero consume 1 ración).
   - **Necesito que confirmes cuáles cuentan como 1 acción y cuáles son gratis.** Mi default propuesto: (a) sí, (b) sí, (c) gratis, (d) sí, (e) sí, (f) gratis.
- CORRECTO.

2. [★] ¿Las 8 acciones por día son **iguales para cualquier PJ**, o varían por arquetipo / atributo / perk?
   - (a) Fijas en 8.
   - (b) Variables: PJ con perk de "viajero" tiene 9, con CON alta tiene +1, etc.
   - (c) Fijas para H4, abierta a modulación en H8 cuando perks/atributos amplien efectos.
- c. EN H8 AMPLIAREMOS ESTE TIPO DE COSAS.

3. ¿Qué pasa cuando el PJ agota las 8 acciones del día?
   - (a) **Forzado a acampar inmediatamente** — el siguiente click cualquiera dispara el modal de acampar.
   - (b) **Bloqueado** — los botones de mover/entrar a POI quedan grises hasta que el PJ acampe explícitamente.
   - (c) **Permite acción extra con coste** — gastar 2 raciones para una acción extra, o aceptar daño de fatiga, etc.
- b. Te invita a descansar.

4. ¿El PJ puede acampar **antes** de agotar las 8 acciones (acampada voluntaria)?
   - (a) Sí, el botón "Acampar" siempre está accesible (mientras el PJ no esté en combate). Pierde acciones no usadas.
   - (b) Sí, pero solo en grids "seguros" (Asentamiento, grid Controlado, refugio).
   - (c) No, solo se acampa al agotar las 8.
- Puede acampar, pero termina "el dia" de juego. 

5. [REPO] §9.7 dice "Reset de las 8 acciones al despertar". ¿Confirmas que **acampar** es la única vía de reset, y que no hay reset por "tiempo real" (e.g. cierras navegador 8 horas y al volver se resetea solo)?
- NO existe el reset por tiempo real.

6. ¿Hay un **contador de día absoluto** (Día 1, Día 2, ..., Día N) que se persiste? ¿O solo tracking del día actual + acciones restantes?
- Existe el contador de dia absoluto. Para algunas misiones, encargos, o eventos, es necesario.

7. Si hay contador de día absoluto, ¿cuándo se incrementa exactamente? ¿Al acampar (despertar es un nuevo día) o al pasar medianoche conceptual? Asumo "al acampar". Confirma.
- Al acampar, digamos que terminan tus turnos de juego. Cuando te despiertas, es el siguiente dia. Cada turno de juego = un dia.

---

## Bloque B — Sistema de raciones

8. [★] ¿Cuántas raciones tiene el PJ al crear el personaje (inicio del run)?
   - (a) 0 (debe encontrar comida desde el primer día).
   - (b) 3-5 (margen para el primer combate Lobo + primeras exploraciones).
   - (c) 7-10 (semana de margen).
   - (d) Otra cantidad.
- b.

9. [★] ¿Qué pasa cuando el PJ va a acampar y NO tiene raciones?
   - (a) **Acampa con penalización**: pierde X HP del máximo (e.g. -5 HP) al despertar. El PJ todavía recupera las 8 acciones.
   - (b) **No puede acampar voluntariamente**: si no tiene raciones, las acciones no se resetean — debe seguir con 0 acciones hasta morir.
   - (c) **Acampa con penalización + posibilidad de evento**: tira tabla de "noche sin ración" (peligro real, sueño tranquilo, sueño con pesadillas que aplican status, etc).
- c. Penalizaciones. Se puntualizan en H8.

10. ¿La penalización de acampar sin ración es:
    - (a) **HP máximo reducido** (no solo HP actual): el PJ ve su barra reducirse.
    - (b) **HP actual reducido** (regeneras 0 al despertar y además pierdes HP).
    - (c) **Status aplicado**: sale "fatigado" / "hambriento" con efectos en combate hasta comer.
    - (d) Otra.
- Por ahora B. 

11. Si el PJ acampa **3 días seguidos sin ración**, ¿qué pasa?
    - (a) Acumula HP máx reducido cada vez (-5 → -10 → -15) hasta que `hp.max` llega a 0 → muerte por fatiga, `last_damage_source='fatigue'`.
    - (b) Cap fijo: penalización siempre -5 HP máx, pero no se acumula. En su lugar, al 3er día el PJ muere directamente.
    - (c) Otra escala.
- Por ahora a.

12. ¿Comer una ración **fuera de acampar** repone HP? ¿O las raciones son solo "moneda de acampar"?
    - (a) Comer ración fuera de acampar: repone X HP, NO resetea acciones.
    - (b) Comer ración fuera de acampar: NO repone HP, solo se "stockea" para acampar.
    - (c) Las raciones tienen doble uso: en combate restauran HP, en acampar resetean acciones.
- b. Las raciones son como las cintas de escribir para un Resident Evil. Una especie de "guardar progreso". En este caso, avanzarlo.

13. [REPO] §4.12 dice "20 slots de inventario, 5×4 grid". ¿Las raciones son **un solo slot stackable** (1 slot, 99 raciones) o **un slot por ración** (cada ración ocupa un slot)? El catálogo real entra en H6 — pero la asunción de stacking afecta UI de fatiga.
- Un solo slot stackable.

14. ¿Las raciones se **obtienen vía POIs en 4f** (recursos de la tabla d20) o **en 4d** ya hay forma de conseguirlas? Si 4d no genera raciones, el PJ inicial sobrevive con su stock + lo que aparezca en la tirada de 4f. ¿Esto es coherente para ti?
- Se obtienen de diferentes maneras, crafteo, en tiendas, en combates... Solo que no está escrito aun. Tenlo en cuenta.

15. ¿Existen **otros consumibles que actúen como ración** (carne curada, fruta del bosque, etc.)? ¿O hay un único `item: "racion"` genérico en 4d?
- UNico item crafteable de diferentes maneras.

---

## Bloque C — UI de fatiga y día

16. [★] ¿Cómo se visualiza el contador de acciones por día en la UI?
    - (a) **8 puntos / 8 íconos** en HUD (visualmente claro, ocupa espacio fijo).
    - (b) **Texto "X / 8"** en HUD.
    - (c) **Barra de progreso** que se vacía conforme gastas acciones.
    - (d) **Reloj circular** que avanza de 0:00 a 24:00 conforme gastas acciones.
    - (e) Otra.
- A. Mayor sensacion de videojuego y progresion si consigues subir los puntos. Tener esto en cuenta para el futuro.

17. ¿En qué pantallas se ve el contador de fatiga?
    - (a) Solo en vista de grid + vista de POI (cuando el PJ "actúa").
    - (b) Solo en vista regional (overview general).
    - (c) En las tres (regional + grid + POI), persistente.
    - (d) Solo en POI tipo Asentamiento (el "campamento" donde miras tus stats).
- Solo cuando el personaje actua, A.

18. ¿El contador de raciones también se ve en HUD persistente, o solo se ve al abrir inventario?
- SOlo al abrir el inventario y al montar el campamento. 

19. ¿Hay algún **indicador visual** cuando quedan pocas acciones (e.g. último cuarto del día)?
    - (a) Color del contador cambia (verde → amarillo → rojo).
    - (b) Sin color, solo número.
    - (c) Animación sutil cuando quedan ≤2 acciones.
- A.

20. ¿Hay algún indicador visual de "es de noche" / "se acerca la noche"? §4.10 dice día/noche presentes visualmente con efectos numéricos diferidos a v1.1. En 4d, ¿hay tinte de pantalla, posición del sol, otro? ¿O cero atmósfera de hora del día y solo el contador habla?
-   Tinte de pantalla y mensajes.

21. [REPO] DESIGN.md tiene paleta OKLCH cerrada (Bosque podrido + violeta arcano ≤5%). ¿La UI de fatiga usa colores específicos de esa paleta? ¿O esto se decide en MODOPIPELINE con impeccable?
- Vamos a seguir trabajando como antes. EL diseño se retocara en un futuro.

---

## Bloque D — Acto de acampar (UI y flujo)

22. [★] ¿Acampar es un **botón explícito** o un evento automático?
    - (a) Botón "Acampar" siempre visible cuando el PJ no está en combate.
    - (b) Botón solo aparece cuando quedan 0 acciones (acampar es la única acción siguiente).
    - (c) Acampar es automático al agotar acciones (modal forzado sin click).
- a.

23. ¿Acampar requiere que el PJ esté en algún tipo de grid/POI específico?
    - (a) En cualquier sitio (overworld libre, sin restricción).
    - (b) Solo en POIs (no en mover entre grids).
    - (c) Solo en POIs específicos: Asentamiento, refugio, grid Controlado.
    - (d) En cualquier sitio pero con eventos de "acampar al raso" (peligro mayor) vs "acampar en POI seguro".
- entre b.

24. ¿La UI de acampar es un **modal**? Asumo sí (ya que `[Continuar]` y `[Guardar y salir]` del menú de pausa también son modales). ¿Qué muestra?
    - (a) "Acampar gastará 1 ración. Recuperarás las 8 acciones del día. ¿Continuar?".
    - (b) Resumen del día anterior + estado del PJ + botón "Acampar".
    - (c) Animación corta (2-3 s) tipo "fundido a negro y vuelta" sin texto.
- entre b y c. El resumen resulta gratificante, tambien ver que recuperas todo. Y empiezas un nuevo dia tras una animacion.

25. ¿Hay confirmación si el PJ acampa **sin ración**? "No tienes raciones. Acampar te costará 5 HP máximos. ¿Continuar?".
- Si.

26. ¿Acampar en POI tipo Asentamiento es **diferente** que acampar en cualquier otro sitio?
    - (a) Sí, en Asentamiento es seguro (no hay tirada nocturna). En otros sitios puede haber emboscada.
    - (b) Sí, en Asentamiento se puede comprar ración antes (H8 cierra mercados, pero placeholder en 4d).
    - (c) No, idéntico en cualquier sitio en 4d. Diferencias se cierran cuando POIs tengan contenido en fase 2.
- A y B. Tambien en H8 se le añadira mejoras por dormir en asentamientos.

27. ¿Acampar en grid **Inexplorado** vs **Controlado** tiene mecánicas distintas?
    - (a) Sí, grid Controlado garantiza acampar seguro. Grid Inexplorado puede disparar evento (4f).
    - (b) Sí, en grid Inexplorado el coste de ración es +1 (más raciones por miedo).
    - (c) No en 4d. Diferencia se introduce con 4f.
- A. 

28. ¿La animación / transición de acampar tiene **alguna tirada visible**? (e.g. tira d20 para ver si acampar es tranquilo). Asumo NO en 4d (la tirada llega en 4f), pero confirma.
- Asumes bien.

---

## Bloque E — Vías de muerte por fatiga

29. [★] La muerte por fatiga setea `last_damage_source='fatigue'` (decisión #85). ¿En qué momento exacto ocurre?
    - (a) Al despertar de acampar sin ración con HP máx ya en 0.
    - (b) Al gastar la última acción del día con HP en cierto umbral crítico ("colapsas de cansancio").
    - (c) Una combinación: HP máx reducido por inanición + golpe de fatiga adicional.
-  A.

30. La muerte por fatiga, ¿muestra **el mismo epitafio** que muerte por combate, con texto distinto?
    - (a) Sí, mismo flow (sub-paso 3d.4 modal de epitafio), texto del epitafio cambia.
    - (b) Sí, mismo flow, texto fijo "Sucumbió a la fatiga del mundo" o similar.
    - (c) No, hay una pantalla distinta tipo "El PJ murió de hambre" más sobria.
- A.

31. ¿La muerte por fatiga es **"limpia"** (PJ desaparece, run termina, vuelve al menú principal con epitafio) o tiene **"agonía"** (HP baja gradualmente durante varios días, jugador puede intentar buscar comida)?
    - (a) Limpia: cuando se cumple la condición, fin del run.
    - (b) Agonía: 3-5 días de penalización acumulada antes de fin definitivo.
    - (c) Hibrida: 1-3 días de aviso visible ("Estás muriendo de hambre") + fin tras esos días.
- c.

32. ¿El PJ puede **perder HP normal** por fatiga (no solo HP máx)? Si pasa varios días sin ración, ¿el HP actual baja también, o solo el HP máx se reduce y eso causa muerte automática?
- A partir del 1 dia. un 10%

33. ¿Hay alguna forma de **revertir** la pérdida de HP máx tras inanición? ¿Comer 3 raciones seguidas restaura HP máx? ¿Esto es decisión de balance que se posterga, o entra en 4d?
-  Decision de balance postergada.

---

## Bloque F — Sub-paso 4d: integraciones

34. [★] ¿4d necesita **modificar el módulo SAGRADO** `src/rules/character.ts` para añadir `actions_remaining: number` y `current_day: number`? ¿O esto vive en `worldState` aparte, no en `Character`?
- 

35. ¿`src/rules/world.ts` (creado en 4a) o un nuevo `src/rules/fatigue.ts` SAGRADO maneja la fatiga? Modelo conceptual, no implementación.
-

36. ¿La función `consumeAction(character, actionType)` (firma puramente conceptual) vive en `rules/` o en `state/`?
-

37. ¿`acampar(character)` es una **función pura** que devuelve `Character` actualizado, o un orquestador que también escribe en backend?
-

38. ¿La penalización por acampar sin ración tiene **fórmula explícita** ya en 4d, o es número plano por ahora con TODO de calibración?
    - Default propuesto: `-5 HP máx por noche sin ración, sin cap, lleva a muerte cuando HP máx ≤ 0`. ¿Aceptas o quieres otro?
-

39. ¿Hay tests unitarios sobre `consumeAction`, `camp`, `applyFatiguePenalty`? Asumo sí, ¿estimación 15-25 tests adicionales como en 4a?
-

- Responde a todo como mas sentido tenga.
---

## Bloque G — Edge cases y deuda

40. ¿Qué pasa si el PJ está **en combate** cuando teóricamente debería acampar (porque agotó acciones antes de combatir)? Asumo combate prevalece y al cerrar combate se fuerza acampar. Confirma.
- Ok

41. ¿Qué pasa si el PJ entra a un POI **con 1 acción restante** y el POI dispara combate Lobo? ¿La acción se gasta antes del combate, después, o el combate es gratis?
- Entrar a un poi asume un gasto de accion, haces combate, despues estas a 0 acciones.

42. ¿Qué pasa si el PJ **muere por fatiga durante un combate** (HP máx ya en 0 cuando el combate aplica daño)? ¿Cuál es el `last_damage_source`?
- MUerte.

43. ¿Qué pasa si el PJ está **en mitad de un día** (5/8 acciones gastadas) y el navegador se cierra? Al recargar, ¿está donde estaba con 5/8 gastadas, o se "resetea" al inicio del día actual?
- Esta donde estaba.

44. ¿Qué pasa si el jugador **deja la pestaña abierta 3 horas sin tocar nada**? ¿El día avanza automáticamente?
    - Asumo NO (sin reloj real). Pero confirma.
- Ok

45. Si el jugador **cierra el navegador con 0 raciones y 0 acciones**, ¿al volver el PJ debe acampar inmediatamente (modal forzado)? ¿Pierde HP?
- Acampa inmediatamebte.

---

## Bloque H — Visión y deudas

46. ¿Hay algún tropo de "fatiga / hambre" en RPGs que quieras evitar específicamente?
    - Default a evitar: spreadsheet de hambre/sed/fatiga calculada al minuto (ya en §11 tropo "crafteo-spreadsheet" indirecto).
- fatiga en tiempo real, solo con acciones. La comida puede subir HP incluso mejorar atributos temporales, pero las acciones solo se modulan con las raciones.

47. ¿Tu intuición de "fatiga de jornada" viene de algún juego concreto (Stoneshard, Caves of Qud, Wildermyth, otro)?
- Puede que PZ, no he jugado a mucho rpg asi.

48. ¿Las 8 acciones se sienten "justas" para ti, o anticipas que serán pocas/muchas? Calibración fina diferida a H6 (#83), pero quiero saber tu intuición.
- Por ahora lo dejaremos asi. Realmente como te crees el PJ afectara bastante al numero de acciones.

49. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto?
-NO recuerdo.

50. ¿Algún caso borde de UX que te preocupe específicamente en 4d?
- Todos correctos.

---

## Bloque I — Deuda documental heredada: el hueco #48-#61 de §5

> **Añadido el 26 de agosto de 2026**, al cerrar el cuestionario de 4c. Bazalo pidió arrastrar aquí el hueco documental que v0.23 detectó y v0.24 no resolvió. **No es scope de 4d**: son dos preguntas de mantenimiento de la biblia que se responden aquí porque es el siguiente cuestionario abierto.

**Qué pasó.** La tabla de decisiones cerradas de §5 tiene 77 filas para 94 números. Al auditarlo en v0.23 se anotó como "las decisiones #48 a #61 nunca se volcaron a la tabla" y quedó pendiente decidir entre reconstruirlas o declarar el rango muerto.

**Qué he encontrado al ir a mirarlo de verdad (26/8/2026).** El hueco es más pequeño y más mecánico de lo que parecía. Se parte en dos mitades con respuestas distintas:

- **#48 y #49 no existen y nunca existieron.** Los bumps v0.10 y v0.11 dicen literal "Sin nuevas decisiones" en su entrada de §13. La numeración saltó de **#47** (v0.9, marco lore del mundo) a **#50** (v0.12, pantalla de habilidades). Son dos números quemados en un salto de numeración, no dos decisiones perdidas.
- **#50 a #61 existen con texto íntegro y fechado dentro de §13.** No hay nada que reconstruir de memoria: están redactadas en las entradas del historial de v0.12 a v0.19, y varias se citan por toda la biblia. Volcarlas a la tabla de §5 es copiar y pegar con su columna de versión, no un ejercicio de arqueología.

Inventario de lo que hay en §13, para que veas que está todo:

| # | Decisión | Cerrada en |
|---|---|---|
| 50 | Suma exacta al confirmar habilidades (`sum(skills) == 10` habilita Continuar). | v0.12 |
| 51 | Descripciones de habilidad fuera del flow de creación. | v0.12 |
| 52 | Política de extracción del stepper (se clona hasta el tercer consumidor). | v0.12 |
| 53 | Los 5 perks iniciales, todos disponibles en creación; el gateo por arquetipo es del árbol post-creación. | v0.13 |
| 54 | Excepción de Numbers-In-Mono para prosa inline (`DESIGN.md` §3). | v0.13 |
| 55 | Oro como recurso del personaje (`Character.gold`), no ítem. | v0.16 |
| 56 | Inventario y equipo separados en módulo sagrado. | v0.16 |
| 57 | Auto-equip de la Daga al crear personaje. | v0.16 |
| 58 | Loot vive en `data/`, no en módulo sagrado. | v0.16 |
| 59 | Stat-line del Lobo del Bosque validada (720.000 combates simulados). | v0.17 |
| 60 | `computeDefense` queda intocada (`2 + floor(DES/2)`). | v0.17 |
| 61 | Principio operativo macro: esqueleto > contenido > pulido. Fase 1 cierra en H5 (actualizado en v0.19). | v0.17 |

**Por qué importa arreglarlo y no dejarlo correr.** #61 es el principio operativo que gobierna el scope de todo el proyecto y se cita en #76, #79, #89 y #92. Que la decisión más citada de la biblia no tenga fila en la tabla de decisiones es exactamente la clase de hueco que hace que dentro de seis meses alguien —tú, yo, o quien recoja esto— la dé por no cerrada y la reabra sin saberlo.

---

51. [★] ¿Volcamos **#50-#61** a la tabla de §5, copiando el texto que ya existe en §13 y añadiendo su columna de versión?
    - (a) **Sí, las 12 filas.** La tabla de §5 pasa a ser la fuente única de decisiones cerradas y deja de tener agujeros. Coste: un bump de biblia sin código. *(Recomendación del director.)*
    - (b) Sí, pero sólo las que siguen vivas hoy (#53, #55-#61); las de detalle de UI del flow de creación (#50, #51, #52, #54) se quedan sólo en §13 porque su pantalla ya está cerrada.
    - (c) No. §13 es suficiente como archivo y la tabla de §5 se declara "decisiones de diseño macro", no exhaustiva.
- A.

52. [★] ¿Qué hacemos con **#48 y #49**, los dos números que nunca se asignaron?
    - (a) **Se declaran muertos** con una fila explícita en §5 que diga "números no asignados, salto de numeración entre v0.9 y v0.12". Nadie vuelve a preguntarse qué había ahí. *(Recomendación del director.)*
    - (b) Se reutilizan para las dos próximas decisiones que salgan, y la numeración se compacta.
    - (c) Se ignoran sin dejar rastro.
- A.

53. ¿Quieres que este volcado vaya en su **propio bump de biblia** (v0.25, sin código, antes de arrancar 4d) o **colgado del bump que cierre 4d**?
- Colgado del bump de cierre.

---

**Total: 53 preguntas.** 50 de scope de 4d (7 marcadas [★] como bloqueantes, 4 marcadas [REPO]) + 3 de deuda documental heredada en el Bloque I (2 marcadas [★]), añadidas el 26/8/2026 a petición de Bazalo al cerrar 4c.

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lee y identifica contradicciones internas + cruzadas con biblia y cuestionarios previos.
2. Sesión corta donde te paso solo las contradicciones.
3. MODOPIPELINE arranca para 4d: Prompt Master adapta brief, director valida, impeccable cierra.
4. Cierre del sub-paso: 1-2 commits con OK explícito uno a uno.

---

## Resolución del director (26 de agosto de 2026)

> Bazalo respondió las 53 preguntas y delegó explícitamente el arbitraje: *"Ejecuta cada fallo bajo tu visión más acertada del motor y del uso."* Lo que sigue es la resolución de las seis contradicciones detectadas, los tres menores, el Bloque F que quedó sin responder, y las dos preguntas de proceso. **Todo esto se vuelca a la biblia v0.27 como decisiones #98 a #101.** El cuestionario queda CERRADO.

### C1 — HP actual vs HP máximo: cobran las dos cosas

Q10 = b decía "HP actual"; Q11 = a, Q29 = a y §9.7 construyen la muerte sobre el **máximo**. Se resuelve sumándolos, no eligiendo:

- **`hp.max −5` acumulativo, sin cap.** Es lo que mata. Es lo que ya decía §9.7 ("degradación de HP máximo → muerte") y lo que pedía Q11a.
- **`hp.current −10%` del `hp.max` vigente**, redondeado hacia arriba, mínimo 1, aplicado al despertar. Es Q32, y es lo que se siente al día siguiente.
- **Clamp obligatorio** tras ambos: `hp.current = min(hp.current, hp.max)`. Sin él, un PJ con el máximo degradado arrastraría HP actual por encima de su techo.
- **Muerte cuando `hp.max ≤ 0`** al despertar → `last_damage_source = 'fatigue'` (#85, Q29a).

**Q31 = c queda satisfecha sin contador artificial.** `computeMaxHp = 8 + 2·CON` da 14-18 HP máx con CON 3-5, así que la inanición mata en **3-4 noches**. La "agonía" de Q31c no necesita mecánica propia: es la acumulación. Lo único que hay que construir es el aviso visible, que es UI.

**Acampar CON ración cura hasta el máximo vigente.** *(Corregido el 26/8/2026, al probar 4d.2.)* La resolución original dijo que no curaba, apoyándose en Q12b y en tu analogía de la cinta de Resident Evil. Era leer de más: **Q12b habla de comer una ración FUERA de acampar**, no de dormir alimentado, y el "recuperas todo" de Q24 incluía la vida además de los 8 puntos. Dormir con el estómago lleno repone; lo que no repone es masticar de pie a mitad de jornada. El techo es el `hp.max` vigente: la inanición previa no se revierte (Q33 sigue postergada).

### C2 — Acampar es SIEMPRE un click. No hay acampada automática en ningún caso

Q3b (bloqueo suave) y Q22a (botón explícito) son la regla. Q40 ("se fuerza acampar") y Q45 ("acampa inmediatamente") la rompían, y la rompían justo donde más caro sale: acampar sin ración cuesta HP máximo, y cobrarlo sin preguntar contradice de frente la confirmación que pide Q25.

- A 0 acciones, los verbos de mundo (viajar, entrar a POI) quedan **deshabilitados con copy explicativo**. Nunca un modal disparado solo.
- **Q40 corregida**: al cerrar un combate con 0 acciones se vuelve a la vista de POI con los verbos deshabilitados y `[Acampar]` disponible. No se fuerza nada.
- **Q45 corregida**: al recargar con 0 acciones y 0 raciones, el juego **abre el modal de acampar ya montado**, con la advertencia de Q25 visible y **sin confirmar**. El click sigue siendo del jugador.

### C3 — Se acampa en CUALQUIER SITIO (Q23 = a). La lectura "sólo en POIs" produce un softlock

Q23 llegó cortada ("entre b."). Se resuelve por el motor, no por preferencia: con #88 el viaje deja al PJ **en el grid**, no dentro de un POI, y entrar a un POI **cuesta 1 acción**. Un PJ que gasta su octava acción viajando quedaría con 0 acciones, fuera de POI, y sin la acción que necesita para entrar en uno. Si acampar exigiera POI, eso es un **softlock permanente con muerte garantizada** — alcanzable en la primera partida, sin aviso y sin salida.

`[Acampar]` está disponible en los tres niveles de zoom siempre que no haya combate ni modal abierto. El sabor de Q23d (acampar al raso vs. POI seguro) es la capa de evento, y esa es C4.

### C4 — La capa de evento nocturno tiene un único destino: 4f

Q9c la mandaba a H8, Q27a y Q26A a 4f, y Q28 confirma que en 4d no hay tirada visible. Se unifica en **4f**, porque es donde vive el d20 con bandas de §9.5 y montar un segundo motor de tirada para la noche sería duplicarlo.

En 4d queda **sólo la penalización plana de C1**. La distinción seguro/inseguro (Asentamiento vs. raso, Controlado vs. Inexplorado) se declara en datos y queda **inerte** hasta 4f.

### C5 — `racion` y los consumibles de curación son ítems distintos

Q12b y Q15 (ítem único, no cura) contra Q46 ("la comida puede subir HP e incluso mejorar atributos temporales"). No se contradicen si son dos cosas:

- **`racion`**: ítem único, stackable en **1 slot** (Q13), moneda de jornada. No cura.
- **Consumibles de curación y buff**: catálogo de H6, otra vía. `pocion_curacion_menor` ya es el primero.

### C6 — En muerte durante combate gana `'enemy'`, no `'fatigue'`. Rectifico mi propuesta anterior

En la sesión de contradicciones propuse que la inanición activa ganase el epitafio. Al mirar el motor la propuesta no se sostiene: #93 hace que **`combat.ts` escriba `'enemy'` al cerrar en derrota**, y para que ganase `'fatigue'` el motor de combate tendría que leer el estado de fatiga. `combat.ts` es SAGRADO e intocable por #75, y acoplarlo al sistema de jornada para decorar un epitafio es un precio absurdo.

**Regla: `last_damage_source` registra la causa próxima, no la contribuyente.** Si el Lobo te remata, te mató el Lobo; el hambre sólo lo hizo fácil. `'fatigue'` queda reservado a su caso exacto de Q29a: despertar con `hp.max ≤ 0`. `combat.ts` no se toca.

### Menores

**Q17 corregida — el contador vive en los tres niveles de zoom.** Q17a lo limitaba a grid + POI, pero **viajar entre grids se hace desde la vista regional**: se gastaría una acción exactamente cuando el contador no está en pantalla. Además §9.1 no tiene pantallas, tiene zoom continuo; aparecer y desaparecer es más trabajo que quedarse fijo. Los 8 puntos de Q16a son HUD persistente.

**Q18 se respeta, con el hueco tapado donde importa.** No se añade contador permanente de raciones al HUD. En su lugar, la información aparece donde se toma la decisión: el modal de acampar ya las muestra (Q24b), el copy del estado bloqueado a 0 acciones dice cuántas quedan, y **sólo con 0 raciones** aparece un aviso persistente. Sin esto, con C1 encima, el jugador decide a ciegas algo que cuesta HP máximo.

**Q42 completada** por C6. **Q49/Q50** sin hallazgos: nada que levantar.

### Bloque F — respondido por delegación

| # | Resolución | Razón |
|---|---|---|
| 34 | **No se toca ningún módulo SAGRADO.** `WorldState` ya trae `day` y `actionsSpent` desde 4b, con el comentario "los cablea 4d" (`world-state.ts:65-69`). | Cero migración de shape, cero parada de sagrados. El hueco se dejó preparado a propósito. |
| 35 | **`src/rules/fatigue.ts` nuevo, SAGRADO.** | `world.ts` es geometría. Meter la jornada ahí mezcla dos ejes que no comparten nada. |
| 36 | `consumeAction(worldState, actionType)` en `rules/fatigue.ts`, **pura**. La orquesta `state/world-flow.ts`. | Misma frontera que el resto del repo: `rules/` decide, `state/` escribe. |
| 37 | `camp()` **pura**, devuelve `{ character, worldState }` nuevos. El escritor a backend vive en `state/`. | Idéntico a #94: el estado del mundo cuelga del slot y lo persiste `state/`. |
| 38 | Número plano `−5` con `TODO` de calibración a H6, **pero parametrizado desde el día uno**. | Mismo patrón que #83 exige para `computeFastTravelCost`: hoy devuelve plano, mañana proporcional, sin reescribir. |
| 39 | Sí. **20-28 tests.** | Comparable a 4a. Cubre acumulación, clamp, muerte, y los tres edge cases de Q41/Q43/Q45. |

### Consecuencia declarada: 4d no tiene fuente de raciones

Q14 las manda a crafteo (H7), tiendas (H8) y loot (sin tabla escrita). Con Q8b (3-5 iniciales) y C1, un run de pruebas de 4d muere de hambre en **7-9 días como mucho**. Es aceptable para probar el sistema, pero **no es un bug** y queda escrito como tal. Destino: **4f**, banda 16-17 de la tabla d20 (§9.5, "recurso").

### Proceso

**El orden de #97 se mantiene: 4f.0 → 4f → 4d → 4e.** Cerrar el scope de 4d no lo adelanta; el argumento de #97 (escribir 14.400 entradas a ciegas es escribirlas mal) sigue intacto. Lo que cambia es que 4d llega con el scope firmado y sin deuda de decisión.

**Q53 — el volcado del Bloque I va en ESTE bump (v0.27), no en el cierre de 4d.** Bazalo respondió "colgado del bump de cierre", y con #97 el cierre de 4d queda a tres sub-pasos vista. El motivo de arreglar el hueco era precisamente que no siguiera colgando; es copiar y pegar y no bloquea nada. Q51 = a (las 12 filas) y Q52 = a (#48 y #49 declarados muertos) se ejecutan aquí.
