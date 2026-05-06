# Cuestionario de Scope — Hito 7

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el hito.
> **Propósito:** cerrar el scope completo del Hito 7 (crafteo: combinación, descubrimiento, outputs ramificados, batch, station, libros de recetas) antes de empezar a planificar sub-pasos.
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar. Si H6 descubre algo que las invalide, la decisión se reabre.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22.** Formato de receta con outputs ramificados (decisión #7, §4.5). Tiempo instantáneo en UX (§4.5). Cola de hasta 3 recetas en clic (§4.5). Descubrimiento por combinación (§4.5). Porcentajes visibles antes de craftear (§4.5). Stations con tooltip explicativo (§4.5). Batch x10 con tiradas independientes (§4.5). Crafteo es ritual menor, no minijuego central (§11 tropo "crafteo-spreadsheet"). Estos no se discuten.
2. **No es brief de implementación.** Sin clases TypeScript ni patrones de render.
3. **No diseña items concretos.** Eso está en H6 (catálogo de 20 items). H7 diseña recetas que **conectan** items existentes.
4. **No diseña stations físicas.** Las stations son lógicas (yunque, mesa de alquimia, fogón), pero no son items físicos en H7.

**Convención de marcas:**
- **[★]** = bloqueante de decisión.
- **[REPO]** = ya existe respuesta parcial en biblia/scope/cuestionariolore. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Catálogo de recetas

1. [★] §3.1 cierra "8 recetas" en v1 (no 30-50 como dice §3 del scope antiguo). ¿Cuál es la cantidad correcta?
   - Mi lectura: §3.1 "8 recetas" es el inventario binario v1 (decisión #61). El "30-50 recetas" del scope §3 era el plan original pre-#61.
   - **¿Confirmas que H7 entrega 8 recetas, no 50?** Si quieres más, justifica.
-

2. ¿Qué **tipos de recetas** quieres en las 8?
   - Curativas: venda, antídoto.
   - Consumibles: ración mejorada, pócima.
   - Armas: arma básica craftée.
   - Armadura: armadura básica craftée.
   - Item de salvación: receta cara que produce el item de salvación de muerte.
   - Munición / utility: cuchillo arrojadizo, kit de reparación, otro.
   - **¿Distribución propuesta para las 8?**
-

3. [★] El **item de salvación** (decisión #65, evita una muerte) ¿se obtiene SOLO por crafteo, también por loot, también por compra en NPCs?
   - Default propuesto: solo por crafteo (recurso raro + receta legendaria). Esto da peso al sistema H7.
-

4. ¿Las 8 recetas se **descubren todas por combinación** o algunas vienen pre-cargadas en libros (§4.5: "Los libros de recetas pre-cargan recetas sin necesidad de combinar")?
   - (a) Todas pre-cargadas (PJ empieza con 8 recetas en su libro).
   - (b) 3-4 pre-cargadas (las básicas), 4-5 a descubrir.
   - (c) 0 pre-cargadas, todas a descubrir (más exigente).
-

5. ¿El **descubrimiento por combinación** funciona con cualquier combinación de inputs o solo con inputs específicos?
   - Default propuesto: cualquier combinación. Si los recursos existen y la receta existe en catálogo, sale el output. Si no, "esta combinación no produce nada" (sin penalización).
-

6. ¿Los inputs / outputs de las 8 recetas usan **ítems del catálogo H6 exclusivamente**, o H7 introduce nuevos items que no existen en H6?
   - Default propuesto: solo del H6. Sin items nuevos. Confirma.
-

---

## Bloque B — Stations y restricciones

7. [★] §4.5: "Si una receta requiere station y no estás en la correcta, el botón se desactiva con tooltip". ¿Qué stations existen en MVP?
   - Default propuesto: 3 stations.
     - **Yunque** (armas y armaduras).
     - **Mesa de alquimia** (curativas y pociones).
     - **Fogón** (raciones mejoradas).
   - Sin station = recetas básicas (vendas, kits simples).
   - **¿Coherente, o ajustas?**
-

8. ¿Cómo se accede a las stations?
   - (a) Solo en POIs Asentamiento (cualquier asentamiento tiene las 3 stations).
   - (b) Stations distribuidas: algunos asentamientos tienen una, no todas.
   - (c) Stations craftéables (PJ hace su yunque y lo deposita en grid Controlado).
   - (d) Hibrida: stations en POIs Asentamiento por default, jugador puede craftear otras.
-

9. ¿Hay stations **portables** (e.g. "fogón portátil" como item)?
   - Default propuesto: NO en MVP. Reservado a v1.1+.
-

10. [REPO] ¿El POI Asentamiento del Sur (home, decisión #85) tiene **las 3 stations** desde el inicio o solo algunas?
    - Default propuesto: las 3 stations. El home es hub funcional.
-

---

## Bloque C — UI de crafteo

11. [★] La pantalla / modal de crafteo: ¿cómo se accede?
    - (a) Botón "Craftear" en POI Asentamiento (siempre disponible, abre modal).
    - (b) Botón en HUD persistente (accesible desde cualquier sitio si hay station cerca).
    - (c) Pestaña dentro del inventario.
    - (d) Botón en la station específica (yunque, mesa, fogón) cuando entras al POI.
-

12. ¿La UI de crafteo muestra:
    - (a) Lista de recetas conocidas (libro) + slot de combinación libre.
    - (b) Solo lista de recetas (no combinación libre, evita prueba-error).
    - (c) Solo combinación libre (no lista de recetas conocidas, descubrimiento puro).
-

13. ¿Las **probabilidades visibles** (success/critical/failure) se muestran:
    - (a) En la lista de recetas (porcentajes junto al nombre).
    - (b) Solo al seleccionar una receta para craftear (popup con porcentajes).
    - (c) Tras tirar (mostrando outcome real).
-

14. ¿La **cola de hasta 3 recetas** (§4.5) cómo se visualiza?
    - (a) 3 slots de "próxima receta" visibles en la UI, jugador encadena.
    - (b) Botón "Encadenar +1" al craftear.
    - (c) Inputs ya gastados se "reservan" automáticamente para la siguiente.
-

15. ¿El **batch x10** (§4.5) cómo se interactúa?
    - (a) Botón "Craftear x10" junto al "Craftear x1".
    - (b) Slider de cantidad (1-10).
    - (c) Repetir el x1 automáticamente.
-

16. ¿La UI de crafteo es **modal** o pantalla aparte?
    - Default propuesto: modal grande (similar a inventario).
-

17. ¿Hay **animación** al craftear (e.g. items giran, fade, etc.)?
    - Default propuesto: animación corta (200-500 ms) sin sonido (audio v1 = silencio + SFX UI #76).
-

18. ¿Hay **vista previa** del item de output (dibujo / sprite / icono) antes de craftear?
-

---

## Bloque D — Probabilidades y outcomes

19. [★] El formato de receta (§4.5) tiene `outputs.success`, `outputs.critical`, `outputs.failure`. ¿Cuáles son las **probabilidades por defecto**?
    - Default propuesto:
      - Success: 70%.
      - Critical: 10%.
      - Failure: 20%.
    - ¿Aceptas, o ajustas?
-

20. ¿Las probabilidades dependen de la **habilidad del PJ** (skill check)? §4.5 lo confirma. ¿Qué habilidad cada receta?
    - Curativas: Primeros Auxilios.
    - Armas / Armaduras: ¿Forja? ¿Artesanía?
    - Pociones: Alquimia? Botánica?
    - Raciones: Cocinar? Supervivencia?
    - **¿Tienes nombres de habilidades cerrados, o están abiertos hasta H8 (donde el catálogo de habilidades cierra)?**
-

21. ¿La **dificultad** de la receta cómo se calcula?
    - (a) Fija por receta (`difficulty: 1` para vendas, `difficulty: 4` para items legendarios).
    - (b) Variable según calidad deseada (puedes elegir "intentar critical" con dificultad alta).
-

22. ¿El **fracaso** consume todos los recursos o solo parte? §4.5: `failure.resources_lost: 0.5` (50%). ¿Mantienes 50% por defecto, o varía por receta?
-

23. ¿El **crítico** produce SIEMPRE un item mejor (e.g. `venda_esteril` en lugar de `venda`)? ¿O en algunas recetas el crítico solo da +cantidad?
-

24. ¿Hay **modificadores** a las probabilidades por:
    - Perks del PJ (perk "Mano experta" → +5% success).
    - Items equipados (mortero da +5% en alquimia).
    - Ubicación (station mejorada da +5%).
    - Estado del PJ (HP bajo → -5%).
    - **¿Cuáles cableamos en H7?**
-

---

## Bloque E — Libros de recetas

25. [★] §4.5: "Los libros de recetas pre-cargan recetas". ¿Cómo funcionan los libros?
    - (a) Items que el PJ encuentra (loot de POIs / quests). Al usarlos, las recetas pasan al "libro" del PJ.
    - (b) NPCs venden libros en Asentamientos.
    - (c) Recompensa de quests narrativas.
    - (d) Combinación.
-

26. ¿Hay un **libro maestro** que contiene todas las recetas, o múltiples libros temáticos (libro de alquimia, libro de forja, etc.)?
    - Default propuesto: múltiples libros (mejor lore + mejor distribución de drops).
-

27. ¿Las recetas **una vez aprendidas se persisten entre runs**? Decisión #65: "recetas conocidas sobreviven entre runs". ¿Confirmas?
-

28. ¿El PJ nuevo arranca con **algunas recetas conocidas** del meta-progresión, o el meta solo da hitos roguelike (clases, zonas, items de partida)?
-

29. ¿Hay **recetas secretas** (no aparecen en libros, solo se descubren por combinación)?
    - Default propuesto: 1-2 recetas secretas en MVP (legendaria + item de salvación).
-

---

## Bloque F — Combinación libre vs lista de recetas

30. [★] Si el jugador combina items que NO corresponden a una receta:
    - (a) "Esta combinación no produce nada". Recursos NO se gastan.
    - (b) "Esta combinación no produce nada". Recursos SE gastan (penalización por experimentar).
    - (c) "Esta combinación produce un fragmento útil" (siempre da algo).
-

31. ¿La **combinación libre** está siempre disponible o requiere una habilidad / station específica?
    - Default propuesto: siempre disponible (es el descubrimiento), sin restricción de station para "intentar combinar".
-

32. ¿Qué pasa si el jugador combina items que **producen una receta YA conocida**?
    - (a) Se craftéa normalmente. La receta queda registrada (re-confirmación, nada más).
    - (b) Mensaje "Ya conoces esta receta" + craftéo procede.
-

---

## Bloque G — Cableado técnico

33. [★] `src/rules/crafting.ts` (ya existente del esqueleto extendido). ¿Se reescribe o se extiende en H7?
    - Mi lectura: el módulo existe pero con tipos provisionales / vacío. H7 lo solidifica.
-

34. ¿Las recetas viven en `src/data/recipes.ts` (TS) o `src/data/recipes.json` (JSON)?
    - Convención del repo: TS por default. Mi recomendación: TS.
-

35. ¿Hay tests unitarios sobre crafteo? Estimación 25-40.
-

36. ¿`craftItem` (firma puramente conceptual) es **función pura** que devuelve `{newCharacter, output, log}` o orquestador que también escribe a backend?
-

---

## Bloque H — Edge cases y deuda

37. ¿Qué pasa si el inventario está **lleno** y el jugador craftéa un item nuevo?
    - (a) Modal forzado a soltar items.
    - (b) Item se queda en suelo de la casilla.
    - (c) Crafteo bloqueado con warning.
-

38. ¿Qué pasa si el jugador **cancela el crafteo** (modal abierto, recursos seleccionados, no confirmado)?
    - Asumo: recursos vuelven al inventario sin cambio.
-

39. ¿Qué pasa si el jugador craftéa **mientras está en combate**?
    - Default propuesto: imposible. Crafteo solo fuera de combate.
-

40. ¿El jugador puede craftear **mientras viaja por fast travel**? Asumo NO (fast travel es transición, no permite acciones intermedias).
-

41. ¿Si el jugador combina recursos para una receta que requiere station X y NO está en X, qué pasa?
    - Default: botón "Craftear" desactivado con tooltip "Requiere yunque". Confirma.
-

---

## Bloque I — Visión y deudas

42. ¿Hay algún tropo de crafteo que quieras evitar específicamente?
    - Default a evitar: "spreadsheet de recetas" (#11 ya cierra). Confirma.
-

43. ¿Tu intuición de "8 recetas + crafteo ritual menor" viene de algún juego concreto?
-

44. ¿H7 se puede dividir en sub-pasos? Propuesta:
    - 7a: catálogo de 8 recetas + tipos.
    - 7b: módulo `rules/crafting.ts` (combinación, outcomes, dificultad).
    - 7c: UI de crafteo (modal, lista, batch).
    - 7d: stations + libros + descubrimiento.
    - 7e: persistencia entre runs (recetas conocidas).
-

45. ¿Quieres anticipar gancho para H8 (NPCs vendiendo libros) en H7?
-

46. ¿Algún caso borde de UX que te preocupe específicamente en H7?
-

47. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto?
-

48. ¿Las recetas tienen **lore** (átomos de lore vinculados a la receta como descubrimiento)? §10 dice descripciones de items van junto al item. ¿Las recetas tienen su propia descripción narrativa?
-

49. ¿Quieres que el **fracaso** del crafteo tenga texto narrativo (e.g. "El metal se rompe en tus manos") o solo mensaje funcional?
-

50. ¿El crafteo en MVP es para **entretener** (ritual menor con peso emocional) o para **eficiencia** (recurso para sobrevivir)? §11 dice "ritual menor". Confirma.
-

---

**Total: 50 preguntas. 6 marcadas [★] como bloqueantes. 1 marcada [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lee y identifica contradicciones.
2. Sesión corta donde te paso solo las contradicciones.
3. El director redacta entrada de biblia v0.X con decisiones formales nuevas.
4. H7 se descompone en sub-pasos y arrancan MODOPIPELINEs uno a uno.
