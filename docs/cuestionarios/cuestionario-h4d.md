# Cuestionario de Scope — Sub-paso 4d del Hito 4

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el sub-paso.
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
-

2. [★] ¿Las 8 acciones por día son **iguales para cualquier PJ**, o varían por arquetipo / atributo / perk?
   - (a) Fijas en 8.
   - (b) Variables: PJ con perk de "viajero" tiene 9, con CON alta tiene +1, etc.
   - (c) Fijas para H4, abierta a modulación en H8 cuando perks/atributos amplien efectos.
-

3. ¿Qué pasa cuando el PJ agota las 8 acciones del día?
   - (a) **Forzado a acampar inmediatamente** — el siguiente click cualquiera dispara el modal de acampar.
   - (b) **Bloqueado** — los botones de mover/entrar a POI quedan grises hasta que el PJ acampe explícitamente.
   - (c) **Permite acción extra con coste** — gastar 2 raciones para una acción extra, o aceptar daño de fatiga, etc.
-

4. ¿El PJ puede acampar **antes** de agotar las 8 acciones (acampada voluntaria)?
   - (a) Sí, el botón "Acampar" siempre está accesible (mientras el PJ no esté en combate). Pierde acciones no usadas.
   - (b) Sí, pero solo en grids "seguros" (Asentamiento, grid Controlado, refugio).
   - (c) No, solo se acampa al agotar las 8.
-

5. [REPO] §9.7 dice "Reset de las 8 acciones al despertar". ¿Confirmas que **acampar** es la única vía de reset, y que no hay reset por "tiempo real" (e.g. cierras navegador 8 horas y al volver se resetea solo)?
-

6. ¿Hay un **contador de día absoluto** (Día 1, Día 2, ..., Día N) que se persiste? ¿O solo tracking del día actual + acciones restantes?
-

7. Si hay contador de día absoluto, ¿cuándo se incrementa exactamente? ¿Al acampar (despertar es un nuevo día) o al pasar medianoche conceptual? Asumo "al acampar". Confirma.
-

---

## Bloque B — Sistema de raciones

8. [★] ¿Cuántas raciones tiene el PJ al crear el personaje (inicio del run)?
   - (a) 0 (debe encontrar comida desde el primer día).
   - (b) 3-5 (margen para el primer combate Lobo + primeras exploraciones).
   - (c) 7-10 (semana de margen).
   - (d) Otra cantidad.
-

9. [★] ¿Qué pasa cuando el PJ va a acampar y NO tiene raciones?
   - (a) **Acampa con penalización**: pierde X HP del máximo (e.g. -5 HP) al despertar. El PJ todavía recupera las 8 acciones.
   - (b) **No puede acampar voluntariamente**: si no tiene raciones, las acciones no se resetean — debe seguir con 0 acciones hasta morir.
   - (c) **Acampa con penalización + posibilidad de evento**: tira tabla de "noche sin ración" (peligro real, sueño tranquilo, sueño con pesadillas que aplican status, etc).
-

10. ¿La penalización de acampar sin ración es:
    - (a) **HP máximo reducido** (no solo HP actual): el PJ ve su barra reducirse.
    - (b) **HP actual reducido** (regeneras 0 al despertar y además pierdes HP).
    - (c) **Status aplicado**: sale "fatigado" / "hambriento" con efectos en combate hasta comer.
    - (d) Otra.
-

11. Si el PJ acampa **3 días seguidos sin ración**, ¿qué pasa?
    - (a) Acumula HP máx reducido cada vez (-5 → -10 → -15) hasta que `hp.max` llega a 0 → muerte por fatiga, `last_damage_source='fatigue'`.
    - (b) Cap fijo: penalización siempre -5 HP máx, pero no se acumula. En su lugar, al 3er día el PJ muere directamente.
    - (c) Otra escala.
-

12. ¿Comer una ración **fuera de acampar** repone HP? ¿O las raciones son solo "moneda de acampar"?
    - (a) Comer ración fuera de acampar: repone X HP, NO resetea acciones.
    - (b) Comer ración fuera de acampar: NO repone HP, solo se "stockea" para acampar.
    - (c) Las raciones tienen doble uso: en combate restauran HP, en acampar resetean acciones.
-

13. [REPO] §4.12 dice "20 slots de inventario, 5×4 grid". ¿Las raciones son **un solo slot stackable** (1 slot, 99 raciones) o **un slot por ración** (cada ración ocupa un slot)? El catálogo real entra en H6 — pero la asunción de stacking afecta UI de fatiga.
-

14. ¿Las raciones se **obtienen vía POIs en 4f** (recursos de la tabla d20) o **en 4d** ya hay forma de conseguirlas? Si 4d no genera raciones, el PJ inicial sobrevive con su stock + lo que aparezca en la tirada de 4f. ¿Esto es coherente para ti?
-

15. ¿Existen **otros consumibles que actúen como ración** (carne curada, fruta del bosque, etc.)? ¿O hay un único `item: "racion"` genérico en 4d?
-

---

## Bloque C — UI de fatiga y día

16. [★] ¿Cómo se visualiza el contador de acciones por día en la UI?
    - (a) **8 puntos / 8 íconos** en HUD (visualmente claro, ocupa espacio fijo).
    - (b) **Texto "X / 8"** en HUD.
    - (c) **Barra de progreso** que se vacía conforme gastas acciones.
    - (d) **Reloj circular** que avanza de 0:00 a 24:00 conforme gastas acciones.
    - (e) Otra.
-

17. ¿En qué pantallas se ve el contador de fatiga?
    - (a) Solo en vista de grid + vista de POI (cuando el PJ "actúa").
    - (b) Solo en vista regional (overview general).
    - (c) En las tres (regional + grid + POI), persistente.
    - (d) Solo en POI tipo Asentamiento (el "campamento" donde miras tus stats).
-

18. ¿El contador de raciones también se ve en HUD persistente, o solo se ve al abrir inventario?
-

19. ¿Hay algún **indicador visual** cuando quedan pocas acciones (e.g. último cuarto del día)?
    - (a) Color del contador cambia (verde → amarillo → rojo).
    - (b) Sin color, solo número.
    - (c) Animación sutil cuando quedan ≤2 acciones.
-

20. ¿Hay algún indicador visual de "es de noche" / "se acerca la noche"? §4.10 dice día/noche presentes visualmente con efectos numéricos diferidos a v1.1. En 4d, ¿hay tinte de pantalla, posición del sol, otro? ¿O cero atmósfera de hora del día y solo el contador habla?
-

21. [REPO] DESIGN.md tiene paleta OKLCH cerrada (Bosque podrido + violeta arcano ≤5%). ¿La UI de fatiga usa colores específicos de esa paleta? ¿O esto se decide en MODOPIPELINE con impeccable?
-

---

## Bloque D — Acto de acampar (UI y flujo)

22. [★] ¿Acampar es un **botón explícito** o un evento automático?
    - (a) Botón "Acampar" siempre visible cuando el PJ no está en combate.
    - (b) Botón solo aparece cuando quedan 0 acciones (acampar es la única acción siguiente).
    - (c) Acampar es automático al agotar acciones (modal forzado sin click).
-

23. ¿Acampar requiere que el PJ esté en algún tipo de grid/POI específico?
    - (a) En cualquier sitio (overworld libre, sin restricción).
    - (b) Solo en POIs (no en mover entre grids).
    - (c) Solo en POIs específicos: Asentamiento, refugio, grid Controlado.
    - (d) En cualquier sitio pero con eventos de "acampar al raso" (peligro mayor) vs "acampar en POI seguro".
-

24. ¿La UI de acampar es un **modal**? Asumo sí (ya que `[Continuar]` y `[Guardar y salir]` del menú de pausa también son modales). ¿Qué muestra?
    - (a) "Acampar gastará 1 ración. Recuperarás las 8 acciones del día. ¿Continuar?".
    - (b) Resumen del día anterior + estado del PJ + botón "Acampar".
    - (c) Animación corta (2-3 s) tipo "fundido a negro y vuelta" sin texto.
-

25. ¿Hay confirmación si el PJ acampa **sin ración**? "No tienes raciones. Acampar te costará 5 HP máximos. ¿Continuar?".
-

26. ¿Acampar en POI tipo Asentamiento es **diferente** que acampar en cualquier otro sitio?
    - (a) Sí, en Asentamiento es seguro (no hay tirada nocturna). En otros sitios puede haber emboscada.
    - (b) Sí, en Asentamiento se puede comprar ración antes (H8 cierra mercados, pero placeholder en 4d).
    - (c) No, idéntico en cualquier sitio en 4d. Diferencias se cierran cuando POIs tengan contenido en fase 2.
-

27. ¿Acampar en grid **Inexplorado** vs **Controlado** tiene mecánicas distintas?
    - (a) Sí, grid Controlado garantiza acampar seguro. Grid Inexplorado puede disparar evento (4f).
    - (b) Sí, en grid Inexplorado el coste de ración es +1 (más raciones por miedo).
    - (c) No en 4d. Diferencia se introduce con 4f.
-

28. ¿La animación / transición de acampar tiene **alguna tirada visible**? (e.g. tira d20 para ver si acampar es tranquilo). Asumo NO en 4d (la tirada llega en 4f), pero confirma.
-

---

## Bloque E — Vías de muerte por fatiga

29. [★] La muerte por fatiga setea `last_damage_source='fatigue'` (decisión #85). ¿En qué momento exacto ocurre?
    - (a) Al despertar de acampar sin ración con HP máx ya en 0.
    - (b) Al gastar la última acción del día con HP en cierto umbral crítico ("colapsas de cansancio").
    - (c) Una combinación: HP máx reducido por inanición + golpe de fatiga adicional.
-

30. La muerte por fatiga, ¿muestra **el mismo epitafio** que muerte por combate, con texto distinto?
    - (a) Sí, mismo flow (sub-paso 3d.4 modal de epitafio), texto del epitafio cambia.
    - (b) Sí, mismo flow, texto fijo "Sucumbió a la fatiga del mundo" o similar.
    - (c) No, hay una pantalla distinta tipo "El PJ murió de hambre" más sobria.
-

31. ¿La muerte por fatiga es **"limpia"** (PJ desaparece, run termina, vuelve al menú principal con epitafio) o tiene **"agonía"** (HP baja gradualmente durante varios días, jugador puede intentar buscar comida)?
    - (a) Limpia: cuando se cumple la condición, fin del run.
    - (b) Agonía: 3-5 días de penalización acumulada antes de fin definitivo.
    - (c) Hibrida: 1-2 días de aviso visible ("Estás muriendo de hambre") + fin tras esos días.
-

32. ¿El PJ puede **perder HP normal** por fatiga (no solo HP máx)? Si pasa varios días sin ración, ¿el HP actual baja también, o solo el HP máx se reduce y eso causa muerte automática?
-

33. ¿Hay alguna forma de **revertir** la pérdida de HP máx tras inanición? ¿Comer 3 raciones seguidas restaura HP máx? ¿Esto es decisión de balance que se posterga, o entra en 4d?
-

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

---

## Bloque G — Edge cases y deuda

40. ¿Qué pasa si el PJ está **en combate** cuando teóricamente debería acampar (porque agotó acciones antes de combatir)? Asumo combate prevalece y al cerrar combate se fuerza acampar. Confirma.
-

41. ¿Qué pasa si el PJ entra a un POI **con 1 acción restante** y el POI dispara combate Lobo? ¿La acción se gasta antes del combate, después, o el combate es gratis?
-

42. ¿Qué pasa si el PJ **muere por fatiga durante un combate** (HP máx ya en 0 cuando el combate aplica daño)? ¿Cuál es el `last_damage_source`?
-

43. ¿Qué pasa si el PJ está **en mitad de un día** (5/8 acciones gastadas) y el navegador se cierra? Al recargar, ¿está donde estaba con 5/8 gastadas, o se "resetea" al inicio del día actual?
-

44. ¿Qué pasa si el jugador **deja la pestaña abierta 3 horas sin tocar nada**? ¿El día avanza automáticamente?
    - Asumo NO (sin reloj real). Pero confirma.
-

45. Si el jugador **cierra el navegador con 0 raciones y 0 acciones**, ¿al volver el PJ debe acampar inmediatamente (modal forzado)? ¿Pierde HP?
-

---

## Bloque H — Visión y deudas

46. ¿Hay algún tropo de "fatiga / hambre" en RPGs que quieras evitar específicamente?
    - Default a evitar: spreadsheet de hambre/sed/fatiga calculada al minuto (ya en §11 tropo "crafteo-spreadsheet" indirecto).
-

47. ¿Tu intuición de "fatiga de jornada" viene de algún juego concreto (Stoneshard, Caves of Qud, Wildermyth, otro)?
-

48. ¿Las 8 acciones se sienten "justas" para ti, o anticipas que serán pocas/muchas? Calibración fina diferida a H6 (#83), pero quiero saber tu intuición.
-

49. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto?
-

50. ¿Algún caso borde de UX que te preocupe específicamente en 4d?
-

---

**Total: 50 preguntas. 7 marcadas [★] como bloqueantes. 4 marcadas [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lee y identifica contradicciones internas + cruzadas con biblia y cuestionarios previos.
2. Sesión corta donde te paso solo las contradicciones.
3. MODOPIPELINE arranca para 4d: Prompt Master adapta brief, director valida, impeccable cierra.
4. Cierre del sub-paso: 1-2 commits con OK explícito uno a uno.
