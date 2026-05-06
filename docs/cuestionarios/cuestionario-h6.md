# Cuestionario de Scope — Hito 6

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el hito.
> **Propósito:** cerrar el scope completo del Hito 6 (inventario + equipo + loot + durabilidad + catálogo de 50 items + calibración fina de fatiga/raciones/fast-travel) antes de empezar a planificar sub-pasos.
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar. Si H4 / H5 descubren algo que las invalide, la decisión se reabre.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22.** Inventario 5×4 = 20 slots (#4.12). Slots de equipo: cabeza, torso, manos, arma principal, arma secundaria, accesorio (#4.12). Drag & drop, comparativa al hover, durabilidad funcional al 0, color de borde para rareza, stacking según ítem, tirar items al suelo. Catálogo de 50 items (§3 scope) — cantidad cerrada, contenido abierto. Estos no se discuten.
2. **No es brief de implementación.** Sin clases TypeScript ni patrones de render.
3. **No diseña recetas de crafteo.** Eso es H7. Pero los items de H6 son **inputs/outputs** del crafteo de H7 — necesitamos coherencia.
4. **No diseña catálogo de enemigos.** Eso es H8. Pero el **loot post-combate** (§4.8) necesita tabla de loot por enemigo — ¿la cableamos en H6 con datos placeholder o en H8?

**Convención de marcas:**
- **[★]** = bloqueante de decisión.
- **[REPO]** = ya existe respuesta parcial en biblia/scope/cuestionariolore. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Catálogo de items

1. [★] §3.1 cierra "20 items" en v1 (no 50 como dice §3 del scope antiguo). ¿Cuál es la cantidad correcta?
   - Mi lectura: §3.1 "20 items + 8 recetas" es el inventario binario v1 (decisión #61: esqueleto > contenido). El "50 items" del scope §3 era el plan original pre-#61.
   - **¿Confirmas que H6 entrega 20 items, no 50?** Si quieres más, justifica.
-

2. ¿Qué **categorías** de items existen?
   - **Armas** (mano principal y secundaria).
   - **Armadura** (cabeza, torso, manos).
   - **Accesorios** (anillos, amuletos).
   - **Consumibles** (raciones, pociones, vendas).
   - **Recursos** (materiales de crafteo: madera, cuero, hierba).
   - **Quest items** (objetos especiales para quest principal/secundarias, sin uso directo).
   - **Otros**: ¿algo más?
-

3. [★] Distribución propuesta de 20 items en v1:
   - 5 armas (1 por arquetipo de PJ + 1 común).
   - 5 armaduras (set básico).
   - 2 accesorios.
   - 4 consumibles (ración, venda, antídoto, item de salvación de muerte).
   - 4 recursos (madera, cuero, hierba, mineral).
   - **¿Coherente, o ajustas?**
-

4. ¿El **item de salvación** (decisión #65, "consumible raro que evita una muerte") cuántas veces puede aparecer en una run?
   - (a) 0-1 veces (raro).
   - (b) 1-3 veces (manejable).
   - (c) Sin límite (depende de loot/crafting).
-

5. ¿Cómo se obtienen los **20 items**?
   - (a) Loot de POIs (tabla d20 banda 16-17 "Recurso").
   - (b) Loot post-combate (cada enemigo tiene su tabla).
   - (c) Crafteo (H7 cierra recetas).
   - (d) Compra a NPCs en Asentamientos (H8 cierra mercados).
   - (e) Eventos narrativos (recompensas de quests).
   - **¿Distribución propuesta?**
-

6. [REPO] §10.4 dice que "descripciones cortas de items van junto al sistema que los consume" (`src/data/items.ts`). ¿En H6 cada item tiene descripción narrativa (átomo de lore corto) o solo nombre + stats?
   - Default propuesto: cada item con descripción 1-2 frases (átomo corto). Se cuentan dentro de los 50 átomos cortos del catálogo lore (#74).
-

---

## Bloque B — Slots de equipo y stats derivados

7. [★] Los 6 slots de equipo (cabeza, torso, manos, arma principal, arma secundaria, accesorio): ¿cada uno tiene **bonificadores diferenciados**?
   - Cabeza: +DEF, +percepción.
   - Torso: +DEF, +HP máx.
   - Manos: +DEF, +1 dado al pool de ataque cuerpo a cuerpo.
   - Arma principal: pool de ataque + daño base.
   - Arma secundaria: ¿qué ofrece? ¿Doble arma con ataque off-hand, escudo con +DEF, ítem de utilidad?
   - Accesorio: bonus de atributo / status / efecto especial.
   - **¿Coherente, o ajustas?**
-

8. ¿El **arma secundaria** se equipa siempre o es opcional?
   - (a) Siempre (PJ siempre tiene 2 armas activas, una principal y una off-hand).
   - (b) Opcional (puede llevar 1 sola arma sin penalización).
   - (c) Excluyente con escudo (escudo en lugar de off-hand).
-

9. ¿Hay **set bonuses** (e.g. "armadura completa de cuero da +1 DEF extra")?
   - Default propuesto: NO en MVP. Reservado a v1.1+. Confirma.
-

10. ¿La **comparativa al hover** (§4.12) muestra qué exactamente?
    - (a) Diff de stats (HP, DEF, daño) entre item nuevo y equipado actual.
    - (b) Stats del item nuevo + stats del equipado lado a lado.
    - (c) Stats del item con highlight rojo/verde según mejor/peor.
-

11. ¿La **rareza** se traduce en stats objetivos o solo en color visual?
    - (a) Color visual: común gris, raro azul, épico violeta. Los stats están en el item, no en la rareza.
    - (b) Mecánica: items raros tienen +X% bonus aplicado sobre stats base.
    - (c) Mezcla: rareza = banding visual + minor variation en stats.
-

12. ¿Cuántos **niveles de rareza** existen en MVP?
    - Default propuesto: 3 (común, raro, legendario). Si más, reserva v1.1+.
-

---

## Bloque C — Durabilidad

13. [★] §4.12: "Al llegar a 0 el ítem queda inservible hasta reparar (no se destruye)". ¿En H6 hay sistema de reparación cableado?
   - (a) Sí, reparación en POI Asentamiento con coste (oro / recursos).
   - (b) Sí, auto-reparación al acampar (consumiendo recursos).
   - (c) No, reparación reservada a H7 (crafteo) o H8 (NPCs).
-

14. ¿Cómo se **degrada** durabilidad?
   - (a) Por uso (cada ataque del arma -1 durabilidad, cada hit recibido en armadura -1).
   - (b) Por evento (banda 16-17 de tabla d20 dice "+1 durabilidad" o "-1 durabilidad").
   - (c) Por tiempo (cada día -1 durabilidad en todo equipo).
   - (d) Combinación.
-

15. ¿Las **raciones tienen durabilidad** (caducan)?
   - Default propuesto: NO (consumibles no caducan en MVP). Confirma.
-

16. ¿Hay **threshold de eficiencia** (e.g. arma con 50% durabilidad da -1 daño, no se rompe pero pierde efecto)?
   - Default propuesto: solo binario en MVP (funciona o no funciona). Threshold reservado a v1.1+.
-

17. ¿La durabilidad de items **se persiste** entre cierres de partida? Asumo sí (parte de Character.equipment). Confirma.
-

---

## Bloque D — UI de inventario

18. [★] El inventario 5×4 (20 slots) cubre **el catálogo de 20 items** justo (un slot por item). ¿Eso es intencional o coincidencia?
   - (a) Intencional: el slot count cabe el catálogo, jugador puede tener todo en cualquier momento.
   - (b) Coincidencia: el inventario se llenará con stacks (varias raciones en un slot, varios materiales) y los 20 items totales pueden no caber juntos.
-

19. ¿El **stacking** se aplica a qué items?
    - (a) Solo recursos y consumibles (ración stackable, hierba stackable; armas y armaduras 1 por slot).
    - (b) Solo recursos (raciones individuales también).
    - (c) Todos los items stackable según su tipo (armas únicas no stackable, recursos sí).
-

20. ¿Cuál es el **cap por stack** (e.g. máximo 99 raciones en un slot)?
    - Default propuesto: 99 para todos los stackables. Confirma.
-

21. ¿La UI de inventario es **modal** o **panel lateral**?
    - (a) Modal a pantalla completa (similar al loot post-combate).
    - (b) Panel lateral desplegable.
    - (c) Pantalla aparte con botón en HUD para abrirla.
-

22. ¿El inventario muestra el **peso total** (sistema de carga)? §4.12 menciona "peso" en tooltip. ¿Hay sistema de carga máxima en MVP?
    - Default propuesto: NO en MVP (los 20 slots son la única limitación). Peso reservado a v1.1+.
-

23. ¿Hay **filtros** para el inventario (mostrar solo armas, solo consumibles)?
    - Default propuesto: NO en MVP (20 items son pocos). Reservado a v1.1+.
-

24. ¿El inventario muestra una **barra de oro** persistente?
    - Decisión H3 menciona oro. ¿Lo confirmamos como recurso en H6?
-

25. ¿Hay **inventario del PJ vs inventario del personaje muerto**?
    - Decisión #75: permadeath puro. PJ muerto pierde todo. ¿La lápida del PJ caído (sub-paso 3e.2) muestra el inventario que tenía al morir, o solo el epitafio narrativo?
-

---

## Bloque E — Loot post-combate

26. [★] §4.8: "Loot post-combate: modal bloqueante con botón 'Dejar' para salir sin coger nada". ¿En H6 cómo se cablea este modal?
   - (a) Igual al actual del Lobo (sub-paso 3c) pero con items reales del catálogo H6.
   - (b) Reescritura: loot ahora muestra rareza, stats comparativos, y opción de "comparar con equipado" antes de coger.
   - (c) Modal con dragn'drop al inventario.
-

27. ¿Qué pasa si el PJ vence un combate y el inventario está **lleno**?
   - (a) Items se quedan en suelo de la casilla, recogibles posteriormente.
   - (b) Modal forzado a soltar items del inventario antes de cerrar.
   - (c) Items se pierden (warning visible).
-

28. ¿Cada **enemigo del catálogo (H8)** tiene su **tabla de loot**? Asumo sí. ¿En H6 se cablea solo el lobo con tabla placeholder, y H8 expande?
-

29. ¿El **loot de POIs** (tabla d20 banda 16-17 "Recurso") se cablea en H6 o ya quedó en H4?
   - Mi lectura: H4 cableó "Recurso" como banda placeholder. H6 lo cableA con items reales del catálogo.
-

30. ¿El loot tiene **algún factor de suerte** (suerte derivada de INT+VOL, decisión #43)?
   - (a) Sí, suerte modula calidad del loot (mejor rareza con suerte alta).
   - (b) Sí, suerte modula cantidad (más items con suerte alta).
   - (c) No en MVP. Suerte solo modula tabla d20 (decisión #83).
-

---

## Bloque F — Items y combate

31. ¿En combate el PJ puede **usar items del inventario**? §4.8 lista "Item" como acción posible.
   - Sí, gasta el turno + consume el item. Confirma.
-

32. ¿Qué tipos de items son **usables en combate**?
    - (a) Solo consumibles (raciones, pociones, vendas).
    - (b) Consumibles + item de salvación.
    - (c) Cualquiera incluso recursos (con efecto narrativo).
-

33. ¿Hay **límite de items por combate** (e.g. máximo 1 consumible por turno)? Asumo sí, gastas el turno completo en usar item. Confirma.
-

34. ¿La **acción "Item"** abre un modal con todos los items o un menú rápido con consumibles equipados (como hotbar)?
    - Default propuesto: modal simple con items consumibles (incluyendo selectivos). Hotbar reservado a v1.1+.
-

---

## Bloque G — Calibración fina de H4 (acciones / raciones / fast travel)

35. [★] Decisión #83: "Calibración fina de los tres sistemas (acciones, ración, coste de viaje) diferida a H6". ¿En H6 se calibran los **números reales** de:
   - Acciones por día (8 → ¿confirmado o ajustado?).
   - Coste de ración por acampar (1 → ¿confirmado o ajustado?).
   - Penalización HP sin ración (default H4: -5 HP máx → ¿confirmado o ajustado?).
   - Coste de fast travel (1 ración + 2 acciones plano → fórmula proporcional a distancia).
   - **¿Quieres los valores definitivos ya en este cuestionario, o se cierran al ejecutar H6 con simulación?**
-

36. ¿La **calibración** se hace por simulación (Monte Carlo en `simulaciones/`) o por playtest?
   - Default propuesto: simulación primero (1k runs sintéticos), playtest después.
-

37. ¿Hay **evento de fatiga** que se dispara con frecuencia (días sin ración) y aplica status / quita HP máx? §4.15.3 banda "Evento ambiental" puede albergarlo.
-

---

## Bloque H — Cableado técnico

38. [★] ¿`rules/inventory.ts` (ya existente) se reescribe o se extiende?
   - Mi lectura: el módulo existe del esqueleto extendido pero seguramente con tipos provisionales. H6 lo solidifica.
-

39. ¿`Character.inventory` actualmente es `{slots: [], equipped: {}}` (§7 biblia). ¿Se mantiene o se reformula?
-

40. ¿Hay **migración** de saves antiguos al cambiar el modelo de inventario? Decisión #85 dice "todo persiste entre cierres". Si cambiamos el shape de `Character.inventory`, ¿hay defaults seguros como hicimos con `last_damage_source`?
-

41. ¿`src/data/items.ts` (ya existente del esqueleto extendido) tiene 0, X o 20 items hoy? ¿Cuántos hay que añadir/cambiar?
-

42. ¿Hay tests unitarios sobre inventario? Estimación 30-50.
-

---

## Bloque I — Visión y deudas

43. ¿Hay algún tropo de "inventario tetris" / "spreadsheet de inventory management" que quieras evitar?
    - Default a evitar: §11 ya cierra "crafteo-spreadsheet"; aplicaría también a inventario. Confirma.
-

44. ¿Tu intuición de "20 items + 6 slots de equipo" viene de algún juego concreto? (Diablo lite, Stoneshard, otro).
-

45. ¿H6 se puede dividir en sub-pasos? Propuesta:
    - 6a: catálogo de 20 items + tipos + stats.
    - 6b: UI de inventario + drag&drop.
    - 6c: equipo + comparativa al hover + durabilidad.
    - 6d: loot post-combate con items reales.
    - 6e: items en combate (acción "Item").
    - 6f: calibración fina H4 (números acciones/raciones/fast-travel).
    - **¿Coherente?**
-

46. ¿Quieres anticipar gancho para H7 (crafteo) en H6? E.g. cada item tiene `crafted_from: [recursos]` declarado pero ignorado en H6.
-

47. ¿Algún caso borde de UX que te preocupe específicamente en H6?
-

48. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto?
-

49. ¿Quieres que items tengan **lore** (átomos de lore vinculados, voz `objeto`) ya en H6, o se difiere a H8 con la escritura masiva?
-

50. ¿El inventario tiene **animación** al abrir / cerrar / equipar? Audio v1 = silencio + SFX UI CC0 (#76). ¿Animación visual sutil sí (sin sonido)?
-

---

**Total: 50 preguntas. 6 marcadas [★] como bloqueantes. 2 marcadas [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lo lee y identifica contradicciones.
2. Sesión corta donde te paso solo las contradicciones.
3. El director redacta entrada de biblia v0.X con decisiones formales nuevas.
4. H6 se descompone en sub-pasos y arrancan MODOPIPELINEs uno a uno.
