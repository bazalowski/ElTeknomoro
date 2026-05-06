# Cuestionario de Scope — Sub-paso 4f del Hito 4

> **Director:** el-teknomoro-director
> **Fecha de redacción:** 6 de mayo de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque al ejecutar el sub-paso.
> **Propósito:** cerrar las decisiones de UX/UI/cableado del sub-paso 4f (tirada de exploración con bandas + modal/banner de evento + 4 arquetipos POI + variables runtime: bioma + nivel + suerte) antes de disparar MODOPIPELINE. **Es el sub-paso más denso de H4 — es el latido del juego.** El scope macro de H4 ya está cerrado en biblia v0.22 (decisión #83 confirma "rollExplorationTick cableado al final del hito + variables runtime: bioma + nivel + suerte"). Este cuestionario refina los detalles operativos.
> **Aviso de revisabilidad:** las respuestas son válidas al momento de redactar.

---

## A. Qué NO debe ser este cuestionario

1. **No reabre decisiones cerradas en biblia v0.22 / §4.15 / §9.5-9.6.** Tabla d20 con bandas (decisión #68 + §9.5). 4 arquetipos POI (#68 + §9.4). Variables runtime: bioma + nivel + suerte (#83). Tres capas de modulación: bioma + estado del grid + memoria de progresión (§9.6). 10 tipos de evento (§4.15.3). Marco común de tirada reactiva (§4.15.6 + decisión #27). Estos no se discuten.
2. **No diseña tablas concretas para los 5 biomas.** Eso es contenido de fase 2 (biblia §6 línea 727). 4f cablea el sistema y entrega tablas placeholder con pesos por defecto.
3. **No es la escritura de los 80 POIs curados.** Esos son `hasCuratedSlot=true` con texto provisional desde 4a. El contenido real es fase 2.
4. **No diseña eventos narrativos / facciones.** Eso es H5+H8.

**Convención de marcas:**
- **[★]** = bloqueante de decisión.
- **[REPO]** = ya existe respuesta parcial en biblia/scope. Confirmar o matizar.
- Sin marca = respuesta de calibración.

---

## Bloque A — Disparadores de la tirada

1. [★] §4.15.1 lista 5 disparadores. ¿Cuáles se cablean en 4f?
   - **Pisar casilla nueva en sub-mapa** (movimiento entre grids).
   - **Entrar a nodo (POI) desde el mapa-mundi**.
   - **Cruzar frontera de bioma** dentro de un sub-mapa.
   - **Acampar / dormir** (cubierto por 4d, ¿también dispara tirada en 4f?).
   - **Tramo de viaje rápido arriesgado** (cubierto por 4e, ¿dispara tiradas condensadas en 4f?).
   - Mi propuesta: en 4f cableamos los disparadores 1, 2 y 5 (pisar grid, entrar POI, fast travel arriesgado). Acampar (4d) y cruzar bioma quedan placeholders en 4f y se calibran en H6.
   - ¿Coherente con tu cabeza?
-

2. [★] El tutorial Lobo (combate forzado, decisión #84) es **scriptado** según §4.15.1, NO pasa por la tirada. ¿Confirmas que el primer combate Lobo del run NO dispara `rollExplorationTick`?
-

3. ¿Cada movimiento entre grids dispara **una sola tirada** o puede haber tirada doble (al salir del grid actual + al entrar al nuevo)?
   - Default propuesto: una sola tirada al entrar al nuevo grid. Confirma.
-

4. ¿Entrar a un POI dispara tirada **adicional** a la del grid? Es decir, ¿el flujo es: muevo grid (tirada 1) → entro a POI (tirada 2)?
   - (a) Sí, dos tiradas independientes.
   - (b) No, solo la tirada de entrar al POI cuenta.
   - (c) La tirada del grid solo se aplica si NO entras a POI inmediatamente (e.g. si te quedas explorando el grid sin entrar).
-

5. [REPO] §9.5 dice que cada POI genérico "tira sobre la tabla activa al visitarlo". ¿La tabla d20 con bandas se aplica al **POI** (nivel POI) o al **grid** (al moverte entre grids)?
   - Mi lectura: la tabla d20 con bandas se aplica **dentro del POI**. La "tirada de exploración" §4.15.3 (10 tipos) se aplica **al moverte entre grids**. ¿Confirmas esta separación?
-

---

## Bloque B — Tabla d20 con bandas (POI genéricos)

6. [★] §9.5 cierra los pesos por defecto:
    - 1: Peligro real (5%).
    - 2-3: Combate menor (10%).
    - 4-12: Color del mundo (45%).
    - 13-15: Encuentro neutral (15%).
    - 16-17: Recurso (10%).
    - 18: Pista / rumor (5%).
    - 19: Oportunidad (5%).
    - 20: Legendario (5%).
    - ¿Estos pesos se respetan literal en 4f, o el director propone calibración antes de cablear?
-

7. ¿Cada POI tiene su **propia tabla d20** o todos los POIs comparten la misma tabla por arquetipo?
   - (a) Una tabla por arquetipo (4 tablas: Natural / Ruina / Asentamiento / Arcano).
   - (b) Una tabla por (arquetipo × bioma) — N×M tablas.
   - (c) Una tabla global con modulación por arquetipo.
   - (d) Una tabla por bioma (5 tablas) con modulación por arquetipo.
-

8. [★] Los 80 POIs `hasCuratedSlot=true`: ¿la tabla d20 NO se aplica a ellos (se dispara evento curado), o sí se aplica una vez consumido el evento curado?
   - (a) POIs curados ignoran la tabla d20: siempre disparan su evento curado (visita 1, 2, 3...).
   - (b) POIs curados disparan curado solo en visita 1; visitas 2+ caen en tabla d20.
   - (c) En 4f los POIs `hasCuratedSlot=true` muestran el placeholder "POI sin contenido" y NO disparan tabla d20.
-

9. ¿Las **bandas vacías** (4-12 = Color del mundo) son entradas concretas de la tabla d20?
   - Cada banda es una **entrada** de la tabla con su `weight`, `payload`, `evade_check` (§4.15.9).
   - O cada banda es una **categoría** que mapea a M entradas concretas (e.g. "Color del mundo" tiene 30 frases distintas, una se elige al random dentro).
-

10. ¿La banda **20 Legendario** (5%) tiene contenido en 4f? ¿O es placeholder hasta fase 2?
    - Mi propuesta: en 4f es placeholder ("Has encontrado algo legendario, pero el contenido aún no existe"). Confirma.
-

11. ¿Las bandas son **idénticas** para los 4 arquetipos, o cada arquetipo tiene su propia tabla con bandas distintas?
    - Default: las bandas son las mismas (1=peligro, 4-12=color, etc), pero el **contenido** de cada banda cambia por arquetipo.
-

---

## Bloque C — Variables activas en runtime: bioma + nivel + suerte

12. [★] Decisión #83 confirma "Variables activas en runtime durante H4 = bioma + nivel + suerte". ¿Cómo influye cada una en la tirada?
    - **Bioma**: filtra entradas por `conditions.biome` (no aplican entradas de otros biomas).
    - **Nivel del PJ**: filtra entradas por `conditions.min_level` / `max_level`.
    - **Suerte (`luck = floor((INT+VOL)/2) - floor(level/10)`)**: modifica pesos vía `weight_modifiers.if_min_luck` / `if_max_luck`.
    - ¿Coherente?
-

13. ¿La **suerte** mueve pesos en sentido literal o probabilístico?
    - (a) Literal: si entrada tiene `weight: 30` y `if_min_luck: 5`, con suerte ≥ 5 el peso pasa a 30+5 = 35. Si `if_max_luck: -5`, con suerte ≤ -5 el peso pasa a 30-5 = 25.
    - (b) Probabilístico: la suerte multiplica pesos de eventos positivos (legendario, oportunidad) y divide negativos (peligro, combate).
-

14. ¿Hay **cap superior e inferior** a la influencia de la suerte? Si `luck` es 10 y todos los pesos suben x2, ¿se aplica cap en 1.5x?
    - Default propuesto: sin cap, fórmula lineal. Confirma.
-

15. [REPO] §9.6 cierra **3 capas de modulación**: bioma + estado del grid + memoria de progresión.
    - Bioma: cubierto por #12.
    - Estado del grid (Inexplorado/Explorado/Controlado): ¿se cablea en 4f?
    - Memoria de progresión (eventos vistos pierden peso): ¿se cablea en 4f?
    - Mi propuesta: bioma + estado del grid en 4f. Memoria de progresión queda como placeholder (`weight_modifiers.if_seen_before` declarado pero ignorado en runtime).
-

16. ¿El **modo Libre** (decisión #13) modula tablas en 4f? §9.10 dice "modo Libre modula contenido dentro del mundo fijo (eventos, frecuencia)". En 4f:
    - (a) Sí, frase-semilla del modo Libre alimenta el PRNG y cambia outcomes específicos.
    - (b) No, modo Libre no afecta 4f (placeholder hasta H5/H6).
-

---

## Bloque D — Catálogo de eventos: 10 tipos (§4.15.3)

17. [★] §4.15.3 lista 10 tipos de evento. ¿Cuáles se cablean **funcionalmente** en 4f?
    - 1. **Combate** — sí, dispara motor de combate existente con enemigo de la entrada.
    - 2. **Encuentro NPC** — placeholder (modal con `[Hablar]` `[Ignorar]` `[Atacar]`, sin contenido real, sistema de NPCs es H8).
    - 3. **Hallazgo** — placeholder ("Has encontrado X" + add ítem genérico al inventario).
    - 4. **Trampa / hazard** — sí, daño al PJ (mín 1 HP, decisión #25). Setea `last_damage_source='trap'` (#85).
    - 5. **Evento ambiental** — placeholder (texto + status temporal sobre el PJ).
    - 6. **Estructura / POI descubierto** — actualiza visibilidad de POI vecino.
    - 7. **Evento narrativo** — placeholder ("Evento narrativo, contenido pendiente"; sistema de quest es H5).
    - 8. **Emboscada** — sí, similar a combate pero con desventaja inicial (cómo cablear "desventaja" en motor sagrado, ver pregunta 23).
    - 9. **Refugio / punto de descanso** — placeholder (modal "Descansas un rato, +5 HP", sin tabla rica).
    - 10. **Nada** — sí, sin modal, +1-2 HP, -1 durabilidad mínima.
    - ¿Coherente?
-

18. [★] El "Nada" (banda 4-12 / 45%) es **el evento dominante**. §4.15 lo describe como "color del mundo". ¿En 4f tiene **texto narrativo** o es silencio total?
    - (a) Silencio: sin modal, sin texto, solo +1-2 HP.
    - (b) Texto sutil: pequeño banner inferior con frase atmosférica ("La luz del sol filtra las hojas. Sigues caminando.").
    - (c) Texto + sonido ambiente.
-

19. Si "Nada" tiene texto, ¿cuántas frases distintas hay en pool en 4f? Mínimo 5-10 para que no se repita constantemente. ¿O lo dejamos en placeholder único hasta fase 2?
-

20. ¿La **Trampa** del tipo 4 cómo se cablea?
    - Tira d20 contra DIF (cabe en marco común reactivo §4.15.7).
    - Si éxito → no se activa.
    - Si fracaso → daño + cascada a tirada de Reflejos.
    - ¿Confirma esto, o el director simplifica en 4f?
-

21. ¿La **Emboscada** del tipo 8 cómo se cablea en motor de combate?
    - (a) Combate normal con flag `surprise: true` que da +1 turno al enemigo antes del PJ.
    - (b) Combate con `Character.statuses` con status `stunned` aplicado por 1 turno.
    - (c) Combate con `EnemyState.intent` ya pre-calculado y ejecutado antes del primer turno PJ.
-

22. ¿Las trampas / emboscadas que aparecen en 4f tienen **enemigos ya definidos** o se reusa el Lobo para todo?
    - Default propuesto: en 4f reutilizamos el Lobo del tutorial. El catálogo de 15 enemigos es H8.
-

---

## Bloque E — Marco común de tirada reactiva (`evade_check`)

23. [★] §4.15.6 cierra el marco común de tirada reactiva (10 puntos: momento, coste mixto, etc). ¿En 4f se cablea **todo el marco** o solo lo esencial?
    - Default propuesto: en 4f cableamos todo el marco (es el punto de identidad del juego, dijiste explícito en cuestionariovision Bloque 5). Confirma.
-

24. ¿El dado de la tirada reactiva es **1d20 compartido** con la tirada raíz (decisión #28), o ya migra al dado de combate?
    - Default propuesto: 1d20 compartido en 4f (decisión #28 lo cierra para H1; H1 ya cerró). En 4f mantenemos 1d20 hasta que algún sub-paso futuro decida migrar.
-

25. La animación del dado de tirada reactiva debe ser **distinta** a la del dado de combate (§4.15.6). ¿Cómo se distingue visualmente?
    - (a) Color (rojo combate vs azul exploración).
    - (b) Forma (d6 cubo combate vs d20 dodecaedro exploración).
    - (c) Tamaño / posición / sonido distinto.
    - (d) Decide MODOPIPELINE.
-

26. ¿La tirada reactiva muestra siempre **2 botones** `[Intentar evadir / mitigar]` y `[Afrontar]` según §4.15.6?
    - Confirma que NO hay caso donde se elimine alguno (e.g. NPC sin tirada → solo `[Afrontar]`).
-

27. ¿Si el PJ no tiene la habilidad requerida, el botón aparece **gris con tooltip** o se omite?
    - Default propuesto: gris con tooltip ("Percepción insuficiente"). §4.15.6 lo dice. Confirma.
-

28. ¿La tirada reactiva entrena habilidad **gane o pierda** (decisión #30)? ¿En 4f cableamos también `skills.{id}.usage` o eso es deuda para H8?
-

29. [REPO] §4.15.7 da una tabla de tiradas reactivas por tipo de evento (con DIF orientativas). ¿En 4f se respetan las DIF de §4.15.7 literal, o el director ajusta a la baja para playtest?
-

---

## Bloque F — Tablas placeholder y biomas

30. [★] ¿En 4f se entregan **tablas placeholder por bioma** o solo una tabla genérica para todo?
    - (a) Una tabla genérica única en 4f (sin distinción de bioma).
    - (b) 5 tablas placeholder mínimas (5 biomas × 10 entradas cada una = 50 entradas).
    - (c) 5 tablas placeholder ricas (5 biomas × 30+ entradas cada una).
-

31. [REPO] §4.10 lista los 5 biomas provisionales: llanura, bosque, desierto, glaciar, ruinas arcanas. ¿Estos son los biomas de 4f, o el cuestionario de lore los ha cambiado?
    - Cuestionariolore Bloque 4 menciona "biomas con dificultad" (commit reciente). ¿Esto cambia la lista de biomas o solo añade ejes ortogonales (dificultad)?
-

32. ¿Cada grid tiene **un bioma único** o puede tener mezcla?
    - Default propuesto: un bioma por grid (cabe en `Grid.biome` del modelo de 4a; pero 4a no metió ese campo).
    - ¿4f introduce el campo `biome` en cada grid del JSON, o el bioma se infiere por región/posición?
-

33. ¿Los 5 biomas se distribuyen entre las 5 regiones de forma fija (cada región tiene un bioma dominante)?
    - (a) Sí: Centro=ruinas, Norte=glaciar, Sur=bosque, Este=desierto, Oeste=llanura (provisional).
    - (b) No: cada grid puede tener cualquier bioma, mezcla dentro de regiones.
-

34. ¿Entre los 5 biomas, **bosque** es el dominante** (más grids) por la decisión de "naturaleza vencedora" (#47)? ¿Los otros 4 son minoritarios?
-

35. ¿En 4f hay **archivos JSON por bioma** ya creados con entradas placeholder, o solo un archivo `data/exploration/default.json`?
-

---

## Bloque G — Presentación de eventos (modal vs banner)

36. [★] §4.15.5 dice "Modal a pantalla completa para eventos de peso, banner para eventos ligeros". ¿Cuáles van a modal y cuáles a banner en 4f?
    - **Modal** (eventos de peso): combate, evento narrativo, descubrimiento de POI, emboscada.
    - **Banner** (eventos ligeros): hallazgo, NPC ambulante, refugio, trampa mitigada.
    - **Sin modal ni banner**: Nada (silencioso o con texto sutil según pregunta 18).
    - ¿Coherente?
-

37. ¿El banner aparece en **qué posición** y por **cuánto tiempo**?
    - (a) Banner superior, dura 3-5 segundos, click para cerrar antes.
    - (b) Banner inferior, dura hasta el siguiente evento.
    - (c) Banner lateral con cola (eventos se acumulan si vienen rápido).
-

38. ¿El modal de evento de peso **bloquea TODA la UI** (overlay con dimming) hasta que el jugador resuelve?
    - Asumo sí. Confirma.
-

39. ¿La tirada visible **siempre se muestra**, incluso en eventos de banner?
    - Default propuesto: sí (decisión #23: "tirada visible por completo"). Confirma.
-

40. ¿Cuando se dispara la tirada raíz (1d20), ¿se ve la animación del dado **antes** de mostrar el resultado, o el resultado se muestra ya con la animación rodando?
    - Default propuesto: animación de 1-2 segundos primero, luego resultado y modal/banner.
-

41. ¿Hay opción de **velocidad de animación** ajustable (skip animación para jugadores rápidos)?
    - Default propuesto: solo `prefers-reduced-motion` del usuario, sin opción granular en 4f.
-

42. ¿La animación de tirada se puede **cancelar / saltar** con click?
-

---

## Bloque H — Memoria de tiradas y log

43. [★] §4.15.8 dice "Historial de últimas 100 tiradas raíz **y reactivas** en memoria de sesión, purga al cerrar". ¿En 4f se cablea?
    - (a) Sí, log persistente en sesión (pierdes al cerrar navegador).
    - (b) Sí, log persistente en `save_slots` (sobrevive al cierre).
    - (c) No, log solo en Modo Privado (#35), no en runtime normal.
-

44. ¿El jugador puede **abrir el log** de tiradas durante el juego?
    - Asumo sí en Modo Privado. ¿En modo normal del jugador también?
-

45. ¿La "**última tirada copiable**" (§4.8 menciona el concepto en combate) se aplica también a la tirada de exploración en 4f?
-

46. ¿El log muestra **detalle de la tirada** (entrada de tabla, peso aplicado, modificadores) o solo el resultado final?
    - Default propuesto: detalle completo en Modo Privado (decisión #35), resultado simple en modo normal.
-

---

## Bloque I — Cableado del sistema y módulos

47. [★] §4.15.8 dice que `rules/exploration.ts` es el módulo SAGRADO con la API:
    - `rollExplorationTick(worldState, character, trigger) → ExplorationEvent`
    - `resolveEvadeCheck(event, character, dice) → EvadeResult`
    - ¿En 4f se **respeta esta API literal** o el director propone cambios?
    - El módulo `exploration.ts` ya existe en repo (heredado del esqueleto extendido). ¿Se reescribe o se extiende?
-

48. ¿Las **tablas placeholder por bioma** viven en `src/data/exploration/<bioma>.json` (estructura ya prevista en biblia §7) o director propone otra ubicación?
-

49. ¿El **flag `tutorial_lobo_completed`** (cableado en 4a) afecta a `rollExplorationTick`?
    - Si `false` (PJ no ha hecho tutorial), ¿la función NO se llama nunca (porque solo se entra al overworld tras tutorial)?
    - O ¿la función puede ser llamada y se comporta normal?
-

50. ¿`rollExplorationTick` consume el PRNG **determinista** del mismo `dice.ts`? §4.15.8 lo confirma. ¿En 4f se garantiza determinismo (same state → same outcome)?
-

51. [REPO] El repo tiene `src/rules/exploration.ts` y `src/rules/exploration.test.ts` (ya existentes). ¿4f los reescribe completamente, los extiende, o se construye un módulo paralelo?
-

52. ¿El **modo Privado** del Banco / Campo de pruebas (decisión #16, §4.14) tiene en 4f las herramientas de tirada de exploración (forzar próximo evento, ver tabla activa, etc.)?
    - Default propuesto: en 4f cableamos lo mínimo (próximo evento forzable). El resto es H9 (Modo Privado completo).
-

---

## Bloque J — Edge cases y deuda

53. ¿Qué pasa si el jugador hace **click rápido entre dos grids** mientras está rodando una tirada del primero? ¿Se cancela la tirada, se encola, se ignora?
-

54. ¿Qué pasa si el PJ está en **HP crítico (1 HP)** y la tirada da Combate? ¿Se permite, o el sistema "protege" al jugador con tirada negada?
    - Default propuesto: se permite (frustración productiva, decisión #75).
-

55. ¿Qué pasa si la **tabla activa está vacía** (todas las entradas filtradas por `conditions`)? ¿Se devuelve "Nada" por default, error, o tirada se anula?
-

56. ¿Qué pasa si **dos eventos simultáneos** podrían dispararse (e.g. cruzar bioma + entrar POI a la vez)?
    - Default propuesto: prioridad fija (entrar POI > cruzar bioma > pisar grid). Confirma.
-

57. ¿Qué pasa si el jugador **cierra el navegador** durante una tirada? El estado del PJ debe persistir antes de que el modal aparezca.
-

58. ¿Hay **casos donde la tirada se anula** (se "no tira") por estado del PJ (e.g. PJ con status `stunned` no puede explorar)? Asumo NO en 4f.
-

---

## Bloque K — Visión y deudas

59. ¿Hay algún tropo de "tabla aleatoria de eventos" en RPGs que quieras evitar específicamente?
    - Default a evitar: tabla repetitiva donde todos los eventos se sienten genéricos (síntoma del 45% color del mundo mal calibrado).
-

60. ¿Tu intuición de "tirada de exploración con bandas" viene de algún juego concreto (Caves of Qud, Slay the Spire en mapas, FTL, otro)? §9.5 menciona "color del mundo" como concepto raíz.
-

61. ¿Quieres que la tirada visible sea **reproducible** (e.g. el jugador puede compartir la "semilla del momento" para reproducir su tirada en otro PC)?
    - Asumo NO en 4f (es feature avanzada de Modo Privado). Confirma.
-

62. ¿Quieres que en 4f haya **algún feedback de aprendizaje** (e.g. "Has visto este tipo de evento 5 veces" → desbloqueas pista narrativa)?
    - Default a NO (memoria de progresión es §9.6 capa 3, queda como placeholder). Confirma.
-

63. ¿Hay alguna **decisión de producto pendiente** que el director pueda haber pasado por alto?
-

64. ¿Algún caso borde de UX que te preocupe específicamente en 4f? Es el sub-paso más complejo de H4; quiero saber dónde está tu intuición.
-

65. ¿La densidad objetivo "10-15 eventos por sesión de 30-45 min" (§4.15.5) se debe **respetar** en 4f, o eso es objetivo de calibración H6+?
-

---

**Total: 65 preguntas. 12 marcadas [★] como bloqueantes. 6 marcadas [REPO] como confirmación rápida.**

---

## Cómo lo procesamos juntos después

1. Cuando este cuestionario esté relleno, el director lee y identifica contradicciones internas + cruzadas con biblia §4.15 + §9 + cuestionarios previos.
2. Sesión corta donde te paso solo las contradicciones (este sub-paso es el más complejo, asumo más contradicciones).
3. MODOPIPELINE arranca para 4f: Prompt Master adapta brief, director valida, impeccable cierra.
4. Cierre del sub-paso: 1-2 commits con OK explícito uno a uno. **Es el cierre formal de H4.**
