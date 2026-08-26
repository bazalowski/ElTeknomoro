# Cuestionario de Scope — Sub-paso 4c del Hito 4

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el sub-paso.
> **Propósito:** cerrar las decisiones de UX/UI/cableado del sub-paso 4c (vista de POI minimalista + entrada al combate vía POI + persistencia POIs revelados + sistema de pausa global + reinterpretación de home como POI Asentamiento del Sur) antes de disparar MODOPIPELINE. El scope macro de H4 ya está cerrado en biblia v0.22 (decisiones #81-#85); este cuestionario refina los detalles operativos del sub-paso.
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar. Si sub-pasos previos descubren algo que las invalide, la decisión se reabre.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22.** El sistema de pausa global está cerrado en #85 (botón siempre accesible mientras no haya modal abierto, con `[Continuar]` y `[Guardar y salir]`). La home como POI Asentamiento del Sur está cerrada en #85. El POI minimalista con escena (arquetipo + texto provisional + botón Combatir) está cerrado en B1.
2. **No es brief de implementación.** Sin clases TypeScript, nombres de funciones, ni patrones de render.
3. **No diseña la tirada de exploración.** Eso es 4f. En 4c el botón "Combatir" del POI dispara el combate Lobo (encuentro placeholder) directamente, sin tirada d20.
4. **No contenido de POIs curados.** Los 80 huecos curados son `hasCuratedSlot=true` con texto provisional ("POI sin contenido aún") en 4c. El contenido real es fase 2.

**Convención de marcas:**
- **[★]** = bloqueante de decisión. Sin esta respuesta, MODOPIPELINE no puede arrancar.
- **[REPO]** = ya existe respuesta parcial en biblia/scope/PRODUCT/DESIGN. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Forma de la vista de POI

1. [★] La vista de POI muestra una "escena minimalista" según B1. ¿Qué entendemos por minimalista?
   - (a) **Modal a pantalla completa** sobre la vista de grid, con cabecera (nombre del POI + arquetipo) + cuerpo (texto provisional) + footer con botones.
   - (b) **Pantalla aparte** (la vista de grid se sustituye, no se superpone). Para volver, botón "Salir del POI".
   - (c) **Zoom continuo** desde vista de grid: el POI clicado se escala hasta llenar la pantalla y los elementos del POI se renderizan dentro de su frame.
   - (d) Otra.
-  A

2. [★] ¿La vista de POI tiene **arte/imagen** o es texto puro en 4c?
   - (a) Imagen placeholder por arquetipo (4 imágenes: Natural / Ruina / Asentamiento / Arcano).
   - (b) Patrón visual generativo (textura procedural por arquetipo, sin asset).
   - (c) Solo color de fondo + tipografía + nombre + texto.
   - (d) Otra.
- A

3. [REPO] §10.4 dice que descripciones cortas de POI van en `src/data/exploration/poi-flavor.ts`. ¿En 4c los 720 POIs tienen ya texto provisional cargado, o todos comparten un placeholder único hasta fase 2?
   - (a) Cada POI tiene un texto procedural según arquetipo + ID (e.g. "Has llegado a sur-014-poi-2: un claro silencioso").
   - (b) Los 80 con `hasCuratedSlot=true` muestran "POI marcado como curado, contenido pendiente". Los 640 genéricos muestran "POI genérico, contenido pendiente".
   - (c) Todos los 720 muestran exactamente el mismo placeholder ("POI sin contenido").
- B.  El contenido será escrito en su totalidad cuando el juego sea jugable mecanicamente de principio a fin.

4. ¿La vista de POI tiene **título visible** distinto al texto del POI? Si el POI no se ha visitado, el título es "???" (decisión #69). Tras visita, ¿se muestra el ID (`sur-014-poi-2`), un nombre generado por arquetipo ("Bosque silencioso"), o nombre vacío hasta tener contenido real?
- Por ahora se muestra el ID.

5. ¿La vista de POI ya muestra en 4c el **arquetipo** del POI (Natural / Ruina / Asentamiento / Arcano) como label visible? ¿O eso se reserva para 4f cuando los arquetipos modulen la tabla d20?
- Reservamos

---

## Bloque B — Botones y acciones disponibles en el POI

6. [★] Según B1 de v0.22, el POI tiene "botón Combatir" como único botón provisional. En 4c, ¿qué botones aparecen exactamente?
   - (a) **Solo `[Combatir]`** (cierra cuando 4f abra el sistema real).
   - (b) `[Combatir]` + `[Salir]` (volver a vista de grid sin disparar evento).
   - (c) `[Combatir]` + `[Inspeccionar]` (Inspeccionar marca el POI como visitado pero no dispara evento; provisional para flow de "entrar y mirar sin pelear").
   - (d) Otra.
- Combatir, Inspeccionar, Salir. 

7. [★] El botón `[Combatir]` en cada POI dispara **siempre el combate Lobo** placeholder, o ¿hay variación?
   - (a) Siempre el combate Lobo (mismo enemigo, idéntico al tutorial). Es el placeholder cableado de v0.22.
   - (b) Depende del arquetipo (Natural → Lobo, Ruina → Lobo, Asentamiento → no permite combatir, Arcano → Lobo).
   - (c) Cada visita dispara un combate Lobo random con HP fluctuante.
- Digamos que cada POI tiene 20 variantes (720 x 20) que son las cosas que pueden pasar al visitarlos. Esto hay que escribirlo aun todo. Por ahora, B. pero no siempre luchas contra un lobo.

8. ¿Los POIs de arquetipo **Asentamiento** (incluyendo el POI del home en `sur-001`) tienen el botón `[Combatir]`? Asumo NO — los asentamientos son no hostiles. ¿Qué botón muestra en su lugar (`[Entrar al asentamiento]`, `[Hablar]`, `[Descansar]`)? **Esto se cruza con la reinterpretación de home.**
- Si, es buena idea.

9. ¿Hay **botón "Salir del POI"** explícito o el botón `[X]` / "Atrás" del navegador es la única vía? ¿La tecla Escape también vale?
- Boton explicito

10. [REPO] La memoria de `feedback_modopipeline_ui` exige Prompt Master → director → impeccable. ¿La vista de POI 4c es **una iteración entera de pipeline** (se cierra en commit propio), o se cablea junto con persistencia de POIs revelados como un solo bundle?
- Se cierra en commit propio

---

## Bloque C — Reinterpretación del home como POI Asentamiento

11. [★] Decisión #85 reinterpreta home como POI tipo Asentamiento dentro del grid `sur-001`. En 4c, ¿qué pasa con la home actual (la pantalla de 3 ramas: vacío / vivo / caído)?
   - (a) **Se elimina** como pantalla aparte. El POI Asentamiento del Sur sustituye toda la funcionalidad: lápida del PJ caído, retrato del PJ vivo, botones de acciones.
   - (b) **Se mantiene** como pantalla puente entre el menú principal y la vista regional. El POI Asentamiento es una vista adicional accesible desde dentro del overworld.
   - (c) **Se transforma**: la home actual se convierte en la vista del POI Asentamiento sin renombrar; visualmente se preserva pero conceptualmente es POI.
- C.

12. [★] Si la home se elimina como pantalla aparte (opción a o c), ¿qué pasa con el flow de menú principal → cargar partida → ?
   - (a) Cargar partida → vista regional con el PJ ubicado donde se guardó (puede ser dentro del POI Asentamiento si era ahí donde estaba al guardar).
   - (b) Cargar partida → siempre arranca en vista regional con el PJ resaltado en su grid (incluso si estaba dentro de un POI al guardar).
   - (c) Cargar partida → si el PJ estaba dentro del POI Asentamiento, abre directo ese POI; si estaba en overworld, abre vista regional.
- C.

13. ¿La **lápida del PJ caído** (sub-paso 3e.2) dónde vive en 4c?
   - (a) Dentro del POI Asentamiento del Sur del run anterior (visible al entrar a ese POI con un PJ nuevo).
   - (b) En el menú principal junto al slot del run anterior.
   - (c) Como fragmento de lore dentro del POI Asentamiento (sin más visibilidad).
   - (d) Se elimina la lápida (era parte del home pantalla aparte y ya no aplica).
- 

14. ¿Las acciones que hoy hace home (cuando el PJ está vivo: "Entrar al yermo" / botones futuros de inventario, descanso) se trasladan al POI Asentamiento como botones internos del POI, o se distribuyen?
- Se adaptan al POI Asentamiento.

15. ¿En el POI Asentamiento se accede al **inventario del PJ**? El sistema de inventario real entra en H6, pero ¿4c expone ya un botón placeholder "Inventario" en el POI Asentamiento que abrirá un modal vacío "Disponible en H6"?
- Si. Al inventario realmente se puede acceder en cualquier momento. En el asentamiento tienes herreros y comerciantes para mejorar y adquirir nuevos objetos.

16. [REPO] El POI Asentamiento de `sur-001` tiene `hasCuratedSlot: true`, ¿correcto? Si NO está marcado así en 4a, ¿hay que actualizarlo en 4c o es estructura intocable hasta fase 2?
- SI.

---

## Bloque D — Persistencia de POIs revelados

17. [★] Cuando el PJ visita un POI por primera vez, ¿qué pasa exactamente con su estado?
   - (a) Pasa de "???" a "nombre revelado" (que en 4c sigue siendo placeholder). Se guarda en `save_slots`.
   - (b) Pasa a un estado "visitado": revelado + flag de visita. Se guarda en `save_slots`.
   - (c) Solo se guarda al **completar** el POI (cerrar el combate, leer el evento, salir tras inspeccionar).
   - (d) Otra.
- c. 

18. ¿La persistencia de POIs visitados es **por slot de partida** (cada PJ tiene su propio set de POIs visitados, se reinicia con permadeath) o **por cuenta** (se acumula entre runs)? Decisión #65 dice "nombres de POIs visitados sobreviven entre runs". ¿Confirmas eso, y eso es lo que se cablea en 4c?
- Se reinicia con cada muerte.

19. ¿Cómo se persiste el set de POIs visitados (modelo conceptual)?
   - (a) Array de IDs en `save_slots.poi_visited` (por run).
   - (b) Array adicional en cuenta de usuario (tabla nueva `poi_seen_by_user`) para el "sobrevive entre runs".
   - (c) Hybrid: ambos, con sync al morir el PJ.
- A.

20. ¿El estado del **grid** (Inexplorado / Explorado / Controlado) cómo se calcula?
   - (a) **Inexplorado** = ningún POI del grid visitado. **Explorado** = al menos 1 POI visitado. **Controlado** = todos los POIs visitados + ancla colocada (4e).
   - (b) Cada uno depende del jugador colocando una ancla y/o un porcentaje de POIs vistos.
   - (c) Otra fórmula.
- a. Con porcentaje de complecion.

21. [REPO] §9.6 dice que **el estado del grid modula los pesos de la tabla d20**. ¿En 4c ya se persiste el estado del grid por separado, o se deriva en runtime de los POIs visitados (sin guardar el estado explícito)?
- Se deriva.

22. Cuando el PJ **muere**, ¿el set de POIs visitados se "rebobina" a vacío para el run siguiente, o sobrevive el "POIs nombrados" pero se reinicia "POIs completados"? ¿Cómo se distinguen los dos conceptos en datos?
- Se rebobina. Elije tu la manera mas intuitiva.

---

## Bloque E — Sistema de pausa global

23. [★] Decisión #85: botón "Pausa" siempre accesible mientras no haya modal abierto. ¿Dónde se renderiza este botón en 4c?
   - (a) Esquina superior derecha (HUD persistente).
   - (b) Esquina inferior izquierda.
   - (c) Solo accesible vía tecla Escape (sin botón visible).
   - (d) Tecla Escape + botón visible en esquina.
-  A. 

24. [★] El menú de pausa según #85 tiene `[Continuar]` y `[Guardar y salir al menú]`. ¿Algún otro botón en 4c?
   - (a) Solo esos dos.
   - (b) `[Continuar]` + `[Guardar y salir]` + `[Opciones]` (volumen, texto, etc).
   - (c) `[Continuar]` + `[Guardar y salir]` + `[Reset run]` (auto-suicidio para empezar nuevo PJ).
- B + C.

25. ¿El menú de pausa **bloquea el resto de la UI** (overlay con dimming) o coexiste con la vista actual visible?
- Coexiste con la vista actual.

26. ¿Hay confirmación al pulsar `[Guardar y salir al menú]`? "¿Seguro que quieres salir? Tu progreso se guarda automáticamente."
- Si, con un tick para eliminarla para siempre.

27. [REPO] §8.2 dice que el guardado actual es "mixto" (autoguardado + heartbeat + manual). El menú de pausa con `[Guardar y salir]` ¿es un guardado **manual extra** sobre los autoguardados, o solo un atajo a "guardar ahora y cerrar"?
- Guardado extra para cerrar una partida y continuarla.

28. ¿El menú de pausa está disponible **solo en overworld** (regional + grid + POI fuera de combate) o también dentro de combate? Asumo que combate ya pausa el resto del juego (§4.8) y por tanto el botón de pausa en combate sería redundante. ¿Confirmas?
- SI.

29. ¿El menú de pausa es accesible **también desde la home actual** (si home se mantiene como pantalla aparte) o solo desde la vista regional/grid/POI?
- No, solo es accesible una vez cargado el PJ.

30. ¿Tras `[Continuar]` el juego vuelve **al estado exacto** donde estaba (vista actual + animaciones suspendidas + POI abierto), o vuelve a un estado canónico (vista regional)?
- Al estado en el que estaba.

---

## Bloque F — Cableado del combate Lobo desde POI

31. [★] Cuando el PJ pulsa `[Combatir]` en un POI, ¿qué transición ocurre?
   - (a) Modal de combate Lobo (idéntico al tutorial actual) sobre la vista de POI.
   - (b) Sustitución de pantalla: vista de POI desaparece, pantalla de combate ocupa todo.
   - (c) Zoom continuo desde POI a "arena de combate".
- c.

32. Tras vencer el combate del POI, ¿qué pasa?
   - (a) Modal de loot (mismo que el tutorial) → vuelta a vista de POI.
   - (b) Modal de loot → vuelta a vista de grid (POI ya no es relevante, "se cerró").
   - (c) Modal de loot → POI marcado como "completado" → vuelta a vista de grid.
- a.

33. Si el PJ muere en el combate del POI, ¿se dispara el epitafio normal (con `last_damage_source='enemy'`)? ¿El campo `last_damage_source` se setea **automáticamente** desde el motor de combate al cerrar con `status='defeat'`, o el sistema de POI lo setea manualmente?
- La primera opcion.

34. [REPO] Anotado en proximasesion-prompt.md: "cuando 4c cablee combate vía POI, `last_damage_source='enemy'` (el motor de combate ya lo determina indirectamente — revisar si necesita setearse explícito al cerrar combate por derrota)". ¿La revisión técnica para esto entra dentro del scope de 4c o se reserva para sub-pasos posteriores?
-hazlo aqui.

35. Si el PJ huye del combate (`flee` exitoso), ¿qué pasa?
   - (a) Vuelve a vista de POI (puede reintentar `[Combatir]` o salir).
   - (b) Vuelve a vista de grid (el POI se cierra, pero sin loot).
   - (c) Vuelve a vista regional (escape "limpio" más drástico).
- a.

36. ¿Existe un caso donde el PJ entre a un POI de tipo Asentamiento y NO tenga el botón `[Combatir]`? ¿Qué hace el `[Combatir]` ausente — se sustituye por `[Hablar con NPC]` placeholder, o el botón simplemente no aparece y solo está `[Salir]`?
- Se sustituye.

---

## Bloque G — Edge cases y deuda técnica

37. ¿Qué pasa si el jugador intenta entrar a un POI mientras **otra animación está corriendo** (zoom de regional → grid en curso)? ¿Se bloquea el click, se encola, se ignora?
- Se encola

38. ¿Qué pasa si el jugador hace click rápido en `[Combatir]` dos veces seguidas? ¿El motor de combate inicia dos veces, hace nada, o ignora el segundo click?
- Ignora el segundo click

39. ¿Qué pasa si el jugador cierra el navegador en mitad de un combate iniciado desde POI? Al recargar:
   - (a) El combate se reanuda exactamente donde estaba (HP enemy, turn, etc.).
   - (b) El combate se reinicia desde cero.
   - (c) El PJ está en el POI sin combate iniciado (como si nunca hubiera pulsado `[Combatir]`).
- a. 

40. ¿Qué pasa si el PJ intenta entrar a un POI que **ya completó en este run** (e.g. Lobo derrotado)?
   - (a) El POI muestra "Completado" + botón `[Salir]`, sin combatir otra vez.
   - (b) El POI permite entrar y combatir otra vez (combates infinitos).
   - (c) El POI se hace inaccesible (gris en vista de grid).
- b. No se si tienes en cuenta que los POIs tienen 20 eventos diferentes marcados por el d20 antes justo de entrar. ES importante que se pueda farmear/repetir pois.

41. ¿En 4c se hace **algún tipo de tracking** de "POI completado" que sea distinto a "POI visitado"? Si sí, ¿cómo se persiste?
- Por ahora no. LO dejamos para cuando estructuremos los POIs

42. ¿Hay algún caso donde un POI deba "regenerarse" entre días (decisión #71: 8 acciones, acampar, regenerar mundo)? Asumo NO en 4c, pero si tienes intuición, dilo.
- Puede ser. Dejemos esta via abierta hasta la estructura de POIs

---

## Bloque H — Cambios al modelo de datos / SAGRADO

43. [★] ¿4c necesita extender algún campo SAGRADO de `Character` o `Enemy`? Posibles candidatos:
   - `Character.poi_visited: string[]` (POIs IDs).
   - `Character.poi_completed: string[]` (POIs completados).
   - `Character.current_poi_id: string | null` (POI actual si está dentro de uno).
   - Nada — todo va a save_slots como JSON suelto.
- Los POIs completados por ejemplo.

44. ¿4c necesita extender `src/rules/world.ts` (creado en 4a) con nuevos selectores? Posibles candidatos:
   - `getPOIByID(id)`.
   - `isPOICompleted(character, poiId)`.
   - `markPOIVisited(character, poiId)` (función pura que devuelve `Character` actualizado).
- Lo que veas mas optimo.

45. ¿La sección de pausa global se considera **módulo aparte** (`src/state/pause.ts` o similar) o se cablea en cada vista?
- Modulo aparte, lo que consideres mejor opcion

46. ¿Algún cambio que se te ocurra al modelo SAGRADO que conviene hacer ya en 4c para no romper nada en 4d-4f?
- 

---

## Bloque I — Visión y deudas

47. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto en este cuestionario y que afecte 4c?
- 

48. ¿Algún tropo de RPG sobre POIs que quieras evitar específicamente (e.g. "POI con cinco interacciones por defecto", "POI con botón inspect/interact/loot/talk/leave estilo Diablo")?
- Los POIs disparan un d20 con 20 eventos diferentes, todos escritos por mi. Creo que esto quedo claro en el pasado, pero si no tener en cuenta a partir de ahora.

49. ¿Tu intuición visual de la vista de POI viene de algún juego concreto (encuentros de Slay the Spire, eventos de FTL, eventos de Darkest Dungeon, etc.)?
- Seria muy FTL.

50. ¿Hay algún caso borde de UX que te preocupe específicamente en 4c?
- No estoy pensando en la UX por ahora.

---

**Total: 50 preguntas. 11 marcadas [★] como bloqueantes. 6 marcadas [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lo lee de una sentada e identifica contradicciones internas + cruzadas con 4b + biblia.
2. Sesión corta donde te paso solo las contradicciones.
3. MODOPIPELINE arranca para 4c: Prompt Master adapta brief, director valida, impeccable cierra.
4. Cierre del sub-paso: 1-2 commits con OK explícito uno a uno.
