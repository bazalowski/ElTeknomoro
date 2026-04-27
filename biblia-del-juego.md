# El Teknomoro — Biblia del juego

> Documento vivo. Consolida todo lo que sabemos (y lo que no sabemos) sobre el proyecto.
> **Versión:** v0.9 · **Fecha:** 26 de abril de 2026 · **Autor:** Bazalo con dirección de el-teknomoro-director

---

## Índice

1. Identidad del proyecto
2. Visión y scope
3. Estado actual y roadmap
4. Reglamento (núcleo numérico cerrado)
5. Decisiones cerradas (46)
6. Preguntas abiertas (0 bloqueantes)
7. Arquitectura técnica planeada
8. Flujos y pantallas del MVP
9. Historial de versiones

---

## 1. Identidad del proyecto

**Nombre:** El Teknomoro.

**Nombre anterior:** Mundos Fracturados (placeholder de trabajo, deprecado).

**Género:** RPG de mundo abierto con componente procedural. Un personaje por partida. Permadeath.

**Plataformas objetivo, en orden:**
1. Web app en navegador (vanilla TypeScript + Canvas, backend Supabase).
2. Motor de videojuegos (Godot 4 preferido, Unity alternativa).

**Autor:** Bazalo (@bazalowski).

**Tipo de proyecto:** personal, no comercial inicialmente. Puede comercializarse si la fase 1 genera tracción.

---

## 2. Visión y scope

El Teknomoro es un RPG donde el jugador explora un mundo **post-humano** — la humanidad se extinguió y la naturaleza creció encima, hostil y mutada — compone un personaje con atributos y habilidades, combate, craftea, se une a facciones y toma decisiones que modifican el mundo de manera persistente. Sobre la base biológica corre una veta esotérica/demoníaca **rara y reverencial**: cuando aparece, es evento singular, no atmósfera. Muere una vez, muere para siempre.

El marco lore queda fijado en decisión #47 (§5). Cualquier contenido, paleta, copy o iconografía deriva de ahí.

**Dos fases, no tres.** La fase de mesa (PDF jugable) que aparecía en versiones anteriores está fuera del proceso activo. El reglamento ya no se valida jugando en papel: se valida por **simulación numérica** (hoja de cálculo / Monte Carlo) antes de tocar código, y por **playtest del propio prototipo web** una vez haya módulos jugables.

La fase web existe porque es el camino más corto entre "tengo reglas simuladas" y "tengo jugadores externos probándolo". Un ejecutable de Godot requiere instalación; una URL con login no.

La fase motor existe como posibilidad, no como compromiso. Solo se activa si la fase web tiene demanda real.

---

## 3. Estado actual y roadmap

**Estado hoy (26 abril 2026):** biblia en v0.8. **H0 y H1 cerrados, esqueleto extendido completo.** Todos los módulos de `rules/` (combat, inventory, crafting, world-gen, fast-travel, death, time, faction, dialog, achievements) tienen sus contratos públicos definidos y la mecánica que la biblia ya cierra está implementada y testeada (168 tests verdes). Los 5 bloqueantes de diseño que restaban están cerrados (decisiones #41-#45 más #46 emergente).

**Proceso de dirección** (detallado en `proceso-director.md`):

1. ✅ Diagnóstico del estado.
2. ✅ Test de funcionalidades del MVP (130 preguntas).
3. ✅ Test de profundización (54 preguntas).
4. ✅ Scope v0.1 del MVP web (`scope-mvp-web-v0.1.md`).
5. ✅ Cierre de bloqueantes numéricos del reglamento por simulación:
   - ✅ Dado de exploración (1d20, decisión #26).
   - ✅ Tirada reactiva (marco común + 10 tipos, decisiones #27-#35).
   - ✅ Dado de combate (pool d6 4+, decisión #36, simulado en `simulaciones/dado-combate-v0.2.md`).
   - ✅ Subsistema de progresión (decisiones #37-#40, simulado en `simulaciones/progresion-v0.1.md`).
6. ✅ Arquitectura técnica (§7).
7. 🔄 Código.
   - ✅ H0: scaffold + login Supabase + Vercel.
   - ✅ H1: `rules/dice.ts` + `rules/character.ts` + `rules/exploration.ts` + `rules/progression.ts`.
   - ✅ Esqueleto extendido: `inventory.ts`, `combat.ts` (resolución + iniciativa + bucle de turnos), `crafting.ts`, `world-gen.ts` (Modo Historia mínimo), `fast-travel.ts` (BFS + tirada condensada), `death.ts` (con victoria), `time.ts`, `faction.ts`, `dialog.ts`, `achievements.ts`. 168 tests verdes.
   - ⏳ H2: creación de personaje en UI.
8. ⏳ Playtest del prototipo (entrega cuando H3 cierre el primer combate jugable).

**Bloqueantes de diseño:** **0 restantes.** Las provisionales del código son de contenido (puños = 1 daño, día = 240 ticks) y se cerrarán en su hito sin requerir sesión de diseño.

**Cuello de botella real:** tiempo del autor. Bazalo trabaja turnos alternos y tiene otros proyectos (Furbito v2.0, YouTube, ventas en Vinted/Cardmarket). El Teknomoro vive en los bloques cognitivos libres. Las simulaciones del 25/4 (dado de combate + progresión) demuestran que en sesiones intensas el ritmo es alto; en otras semanas no se toca el repositorio. No hay deadline.

---

## 4. Reglamento v0.9 (núcleo numérico cerrado)

### 4.1 Atributos

**Estado: abierto en números, cerrado en estructura.**

- **5 atributos:** Fuerza (FUE), Destreza (DES), Constitución (CON), Intelecto (INT), Voluntad (VOL).
- 12 puntos para repartir en creación (no 10 como proponía DeepSeek).
- Máximo 4 al crear, mínimo 1 obligatorio en cada uno.
- Techo absoluto en nivel máximo: 7.

La decisión de 12/4 sobre 10/3 responde a dar espacio de build real. Con 10/3 solo hay unas seis distribuciones viables; con 12/4 hay aproximadamente 20. En un RPG que presume de libertad, la variedad de arquetipos iniciales importa.

Los cinco atributos se confirman en esta versión porque son el eje vertebral de los cinco arquetipos predefinidos de creación (ver §4.7) y del sistema de defensa (ver §4.4).

### 4.2 Habilidades

**Estado: estructura y números cerrados (decisiones #9, #39, #40). Lista concreta de habilidades abierta.**

- 10 puntos para repartir en creación, máximo 3 al crear (decisión #9).
- Techo absoluto = 7 (igual que atributos, §4.1).
- Las habilidades suben por **dos vías que conviven**:
  - **Uso**: usar la habilidad acumula progreso en `skills.{id}.usage`. Al alcanzar el umbral de uso para el escalón actual, `value` sube en 1 y `usage` se resetea a 0. La vía del uso solo puede subir hasta el **techo blando**.
  - **XP**: al subir de nivel se reciben puntos de habilidad (§4.11). Cada punto sube `value` en 1 directamente, sin tocar `usage`. Esta vía **rompe el techo blando** y solo se detiene en el techo absoluto = 7.

**Techo blando del uso (decisión #39):**

```
techo_blando(level) = min(floor(level / 2) + 2, 7)
```

Tabla de techos por nivel:

| Nivel | Techo blando | Comentario |
|---|---|---|
| 1 | 2 | Coherente con el máximo de creación (3): habilidades de creación ya rozan el techo desde el día 1. |
| 5 | 4 | A nivel 5, el uso lleva habilidades hasta 4. |
| 10+ | 7 | A partir de nivel 10, el techo blando llega al absoluto: el uso por sí solo puede llevar cualquier habilidad hasta 7. |

Diseño detrás del techo: en niveles bajos, el uso premia el rol coherente sin permitir maximizar; el XP de los primeros niveles compra los escalones que el uso aún no permite. En niveles altos, ambas vías convergen y la elección "dónde gastar XP" se vuelve "qué priorizar" en lugar de "qué desbloquear".

**Curva de uso (decisión #40):**

```
tiradas_para_subir(value) = round(5 · 1.7^value)
```

Tiradas que `usage` debe acumular para que `value` pase de v a v+1:

| Sube de | Tiradas | Acumulado |
|---|---|---|
| 0 → 1 | 5 | 5 |
| 1 → 2 | 9 | 14 |
| 2 → 3 | 14 | 28 |
| 3 → 4 | 25 | 53 |
| 4 → 5 | 42 | 95 |
| 5 → 6 | 71 | 166 |
| 6 → 7 | 121 | 287 |

Cada tirada reactiva (decisión #30) suma 1 a `usage` ganes o pierdas. La curva exponencial garantiza que habilidades nuevas suben rápido (premia probar verbos) y habilidades dominantes se vuelven caras (empuja a diversificar el build).

**Lista concreta de habilidades:** pendiente. Se redacta cuando el catálogo de enemigos y la lista de perks entren en scope (H7 según `scope-mvp-web-v0.1.md` §3).

### 4.3 Sistema de tiradas

**Estado: cerrado en v0.6 tras simulación (decisión #36).**

El dado de **combate** es **pool de d6 con umbral de éxito en 4+**. Resolución:

1. El atacante tira `N` dados d6, donde `N = ATR + HAB`.
2. Cada dado que saca **4, 5 o 6** cuenta como **1 éxito**.
3. Cada **6** habilita además crítico: si en la tirada hay **2 o más seises**, el ataque que impacta es crítico.
4. El ataque impacta si `éxitos ≥ umbral_DEF` (umbral derivado de la DEF del objetivo, ver §4.4).
5. El daño es función del arma base + el margen de éxitos sobre el umbral. El crítico dobla el daño final.

Razones del cierre (validadas en `simulaciones/dado-combate-v0.2.md`):

- **Sensación de progresión palpable**: subir 1 punto en niveles bajos da +18.9% de probabilidad de impactar (criterio de §4.3 cumplido sin asteriscos).
- **Crítico jugable sin reglas extra**: 7-66% de crítico según el build, los seises emergen del propio dado.
- **Ritmo cuadra con MVP**: 3 turnos contra enemigo medio, 8 turnos contra jefe. Encaja con el objetivo del scope (§7).
- **d6 es el dado más accesible mentalmente** y "cuenta los 4+" es regla unitaria.

Limitaciones conocidas, asumidas:

- En niveles altos el experto satura P(impactar) cerca del 100%. El crecimiento se canaliza vía daño y críticos, no consistencia. Si en H3-H7 esto se siente plano, se introducirá una mecánica de techo (DEF crece más rápido o defensa con dados); no se decide ahora.
- Render de pools grandes (hasta 17 dados con builds extremos) es problema de UX, se resuelve en H3 con animación agregada.

El dado de **exploración** sigue siendo **1d20** (decisión #26, §4.15.4), independiente y separado del de combate por arquitectura (decisión #20).

**Umbral de éxitos para impactar (decisión #46):** `threshold = ceil(DEF / 3)`. Promovido a decisión propia desde la simulación implícita del dado v0.2: era la fórmula que validó P(impacto) en cada perfil. Resultados:

- DEF 4 → threshold 2 (P(impacto) ≈ 50% con ATR+HAB ~3)
- DEF 8 → threshold 3 (P(impacto) ≈ 91% con ATR+HAB ~7)
- DEF 12 → threshold 4 (P(impacto) ≈ 74% con ATR+HAB ~9)

### 4.4 Defensa

**Estado: cerrada para v1.**

Fórmula: `DEF = 2 + floor(DES/2) + armadura`.

| DES | Bono pasivo | DEF sin armadura | DEF con armadura pesada (+3) |
|-----|-------------|------------------|------------------------------|
| 1-2 | +0 | 2 | 5 |
| 3-4 | +1 | 3 | 6 |
| 5-6 | +2 | 4 | 7 |
| 7   | +3 | 5 | 8 |

Acción de Esquivar: bono fijo de +2 durante un turno, no suma de DES entera.

Racional: la defensa pasiva debe escalar con DES (si no, los builds ágiles pierden identidad), pero acotada para no volver imposible golpear a high-DES. Esquivar se mantiene como decisión táctica con coste de acción.

El threshold de impacto que la consume está en §4.3 (decisión #46): `ceil(DEF/3)`.

### 4.5 Crafteo

**Estado: formato cerrado, catálogo abierto.**

Formato de receta definitivo:

```json
{
  "id": "venda_simple",
  "resources": { "tela": 1, "hierba_curativa": 1 },
  "skill_check": { "skill": "primeros_auxilios", "difficulty": 1 },
  "station": null,
  "time_hours": 0,
  "outputs": {
    "success": { "item": "venda", "quantity": 2 },
    "critical": { "item": "venda_esteril", "quantity": 2 },
    "failure": { "resources_lost": 0.5, "time_lost": 0 }
  }
}
```

Reglas del sistema de crafteo:

- **Tiempo:** instantáneo en la UX (barra de microsegundos). `time_hours` se mantiene en el JSON para el futuro motor; en web se ignora.
- **Cola:** el jugador puede encadenar hasta **3 recetas en un clic**. No hay cola temporal real.
- **Descubrimiento:** si el jugador combina materiales que corresponden a una receta existente, **el ítem sale y la receta queda registrada automáticamente en su libro**. Los libros de recetas pre-cargan recetas sin necesidad de combinar.
- **Porcentajes visibles:** las probabilidades de success/critical/failure se muestran siempre antes de craftear.
- **Station:** si una receta requiere `station` y no estás en la correcta, el botón se desactiva con tooltip explicativo.
- **Batch:** craft x10 disponible, cada iteración tira sus probabilidades de forma independiente.

### 4.6 Turno cero de sesión

**Estado: estructura cerrada (decisión #45). Texto y enemigo concretos pendientes de H9.**

La semilla del mundo sigue siendo la base: una frase que tiñe la partida procedural y genera el `seed` del PRNG. Ejemplo: *"una tormenta mágica ha despertado algo bajo el glaciar"*.

En web, el onboarding queda así:

1. **Login** (Supabase).
2. **Selección de modo:** Historia (mapa fijo) o Libre (procedural con frase-semilla).
3. **Creación de personaje** (ver §4.7).
4. **Tutorial guiado de ~5 min** (escena, no tooltips sueltos).
5. **Decisión inmediata** del personaje ya creado: dos opciones presentadas en pantalla, mecánicamente equivalentes pero narrativamente opuestas. Resultado: una bandera en `character.flags`. Las dos banderas reservadas son `viajero_audaz` y `viajero_cauto` (constante `ONBOARDING_FLAGS` en `rules/character.ts`).
6. **Primer combate forzado** contra un enemigo tier "lobo" (1 enemigo, attack_pool 2, threshold 1, daño 2, hp 3). Imposible huir, imposible evitar. Si el PJ muere aquí, va al epitafio normal sin red de seguridad: el jugador aprende que se muere de verdad desde el segundo 1.
7. **Mapa abierto** en el nodo correspondiente a la rama elegida en (5).

El tutorial es **escena guiada**, no tooltips contextuales ni "aprender jugando". Decisión cerrada.

Texto exacto de la decisión binaria, enemigo concreto del primer combate y nodo destino de cada rama: se redactan en H9 con el mapa de historia ya construido.

### 4.7 Creación de personaje

**Estado: flujo cerrado, arquetipos provisionales.**

- **Flujo mixto:** pantalla inicial "Empezar de cero" / "Empezar con preset". Ambas opciones desde el primer momento.
- **Arquetipos predefinidos:** 5, uno por atributo dominante (FUE, DES, CON, INT, VOL). Nombres y contenido concreto pendientes.
- **Perks iniciales:** el jugador elige **1 perk al crear**, libremente entre los 5 perks iniciales del catálogo (decisión #53, v0.13). El gateo por arquetipo dominante aplica **solo al árbol de progresión post-creación (H7)**, no a la elección de creación. En modo `preset` con arquetipo definido, el `starting_perk_id` del arquetipo aparece preseleccionado como sugerencia ajustable.
- **Retratos:** set fijo de 12 retratos, sin categorizar por género/edad/etnia, estilo visual uniforme. El jugador los ojea en grid.
- **Reparto de atributos:** botones +/- con preview en tiempo real de los stats derivados (HP, DEF, iniciativa). Validación visual cuando el reparto es ilegal. Botón "Reset" disponible.
- **Reparto de habilidades:** pantalla separada, mismo patrón +/- con preview.
- **Preview del personaje en combate** antes de confirmar.
- **Inventario inicial:** fijo por arquetipo, con botón "Sorpréndeme" que genera un inventario aleatorio dentro de un pool razonable, con lista visible antes de confirmar.
- **Una vez confirmado, el personaje queda bloqueado** (no editable). Permadeath significa que la decisión pesa.

**Un personaje por slot de partida. Sin party.** El inventario es individual por personaje.

### 4.8 Combate

**Estado: UX cerrada, matemáticas cerradas (decisiones #36 dado, #41 iniciativa, #46 threshold).**

- **Por turnos puros.** Hasta 5 enemigos en pantalla en MVP.
- **Iniciativa (decisión #41):** `DES + 1d20` para PJ, `initiative_base + 1d20` para enemigo. Validado en `simulaciones/iniciativa-v0.1.md` tras descartar tres iteraciones de pool d6 (empates excesivos). El d20 se reutiliza como primitiva ordenadora; no viola la decisión #20 (que separa los dados de **resolución**, no los **ordenadores**). Desempate: mayor DES bruto, luego PJ sobre enemigo.
- **Timeline visible:** los próximos 8 turnos como iconos horizontales arriba.
- **Targeting mixto:** clic directo sobre enemigo, o Tab para ciclar con teclado.
- **Acciones fijas:** Atacar / Esquivar / Habilidad / Item / Huir (reservado, grisado hasta que la regla cierre).
- **Log de combate:** panel lateral desplegable. Texto + animación de dado en cada tirada.
- **Última tirada copiable** como texto plano para depuración.
- **Críticos diferenciados** por color, sonido y shake.
- **Estados con iconos** sobre el sprite (sangrado, veneno, aturdido, etc.).
- **Loot post-combate:** modal bloqueante con botón "Dejar" para salir sin coger nada.
- **Hoja de personaje consultable** sin salir del combate.
- **Terreno con efectos** (cobertura, altura, hazards) — tags por casilla, efectos concretos pendientes del sistema.
- **Motor de combate desacoplado del render.** Corre en modo "cabeza" para simulaciones masivas en el Campo de pruebas (ver §4.12).
- **Pausa del mundo:** el combate pausa el resto del juego.

### 4.9 Muerte y permadeath (y victoria)

**Estado: cerrado, ampliado con condición de victoria (decisión #44).**

- Morir es definitivo.
- El slot de partida **no se borra**: queda marcado, consultable como epitafio (stats finales, logros conseguidos, causa, ubicación).
- Al epitafio se accede desde la pantalla de Cargar Partida, en estado de solo lectura.
- **Condición de fin de partida (decisión #44):** muerte (cualquier causa) **o** completar la quest principal del mapa de historia (modo Historia). Modo Libre no tiene condición de victoria; sólo muerte. La pantalla de victoria reutiliza el formato del epitafio con `cause.kind = 'victory'`. La quest principal del modo Historia se diseña en H4 con el mapa.
- Internamente, el tipo de causa se llama `EndOfRunCause` (engloba muerte y victoria). `DeathCause` queda como alias retro.

### 4.10 Mapa y exploración

**Estado: estructura cerrada, contenido abierto.**

- **Modelo:** mapa-mundi con nodos (ciudades, mazmorras, puntos de interés). Cada nodo al entrar abre un sub-mapa en grid. El mapa-mundi en sí es también navegable por grid entre nodos.
- **Cámara:** top-down 2D con tiles cuadrados. La isométrica queda descartada para MVP (duplicaba coste de assets sin aportar).
- **Modos de partida:**
  - **Historia:** mapa fijo, narrativa guiada.
  - **Libre:** procedural a partir de frase-semilla escrita por el jugador (la frase se hashea y alimenta el PRNG tanto para generación de mapa como para la sucesión de tiradas de exploración).
- **Biomas provisionales en MVP:** llanura, bosque, desierto, glaciar, ruinas arcanas. Se redefinen cuando lore entre en scope.
- **Niebla de guerra** que se descubre explorando.
- **Movimiento por turnos** en sub-mapa, con tiradas de exploración por cada casilla pisada (ver §4.15).
- **Viaje rápido híbrido:**
  - **Solo hacia nodos descubiertos.** Nunca se puede viajar rápido a una zona que el jugador no ha pisado antes. Es el único límite duro.
  - **Viaje seguro:** entre ciudades aliadas o puntos de mismo bioma tranquilo. Sin tiradas de exploración. Solo coste de tiempo.
  - **Viaje arriesgado:** cualquier tramo que atraviese zona salvaje, territorio hostil o bioma peligroso. Dispara **tiradas condensadas** (ver §4.15): el jugador ve un resumen del viaje con los eventos que surgieron y sus resultados.
  - La distinción seguro/arriesgado la determina el grafo de nodos y la reputación con la facción dominante del tramo, no el jugador.
- **Día/noche y clima dinámico:** presentes visualmente, con efectos numéricos sobre tiradas por determinar (depende de cerrar el sistema de dados y el de exploración).
- **Interacción con POI:** tap directo.
- **Sin minimapa** — solo mapa principal.

### 4.11 Progresión

**Estado: estructura y números cerrados (decisiones #15, #37, #38). Catálogo de logros y de facciones abierto.**

- **Nivel máximo 50** (decisión #15).
- **Subir de nivel no es automático:** el jugador pulsa "Subir nivel" cuando alcanza el umbral. Pausa el juego.
- **Curva de XP (decisión #37):** lineal `XP(n) = 100·n` para pasar de nivel n-1 a n. El XP necesario crece de forma constante (200 para subir a 2, 5.000 para subir de 49 a 50). Total acumulado al 50: 127.400 XP.

**Cadencia de puntos al subir nivel (decisión #38):**

Cada vez que el jugador pulsa "Subir nivel" recibe un paquete según la regla:

| Tipo | Cadencia |
|---|---|
| Habilidades | **+2 puntos cada nivel** |
| Atributos | **+1 punto cada 5 niveles** |
| Perks | **+1 perk cada 5 niveles** |

Los niveles redondos (5, 10, 15, 20, 25, 30, 35, 40, 45, 50) son **rituales**: entregan los tres tipos a la vez. Los niveles intermedios solo entregan habilidades. El diseño busca reforzar el momento del nivel redondo como evento, no diluirlo.

Totales en una partida completa (49 escalones, nivel 1 → 50):

- 98 puntos de habilidad (= ~14 habilidades hasta el cap absoluto, o muchas más si se reparte).
- 10 puntos de atributo (= subes 2 atributos del 1 al 6, o 1 al cap 7 y otro un par de puntos).
- 10 perks adicionales (más el de creación = 11 perks por personaje).

Cada punto de atributo o habilidad gastado por XP sube `value` directamente y rompe el techo blando del uso (§4.2).

- **Logros:** 15 en MVP, cubriendo hitos clave (primer combate ganado, primer craft, primera muerte evitada, etc.). Catálogo concreto pendiente.
- **Facciones:** 3 en MVP con reputación numérica. Las decisiones del jugador mueven reputación en ambas direcciones. Identidad concreta pendiente.
- **Re-spec:** disponible, cuesta recurso de juego (no gratis, no ilimitado). Coste concreto pendiente.
- **Hoja de personaje:** misma pantalla que creación, pero en modo read-only con secciones ampliadas (logros, facciones, biografía generada).

### 4.12 Inventario y equipo

- **Slots fijos** en MVP: cuadrícula 5×4 (20 slots). Crecimiento con atributos se pospone.
- **Slots de equipo:** cabeza, torso, manos, arma principal, arma secundaria, accesorio.
- **Drag & drop** para equipar/desequipar.
- **Comparativa al hover:** "este arma vs la equipada actual" con diff de stats.
- **Tooltip con daño, durabilidad, peso, rareza.**
- **Rareza visual:** color de borde + prefijo de nombre.
- **Durabilidad:** al llegar a 0 el ítem queda inservible hasta reparar (no se destruye).
- **Stacking:** según ítem (no global).
- **Tirar items:** se puede, se almacenan en el suelo de la casilla.
- **Catálogo MVP:** 50 items en v1, arquitectura preparada para 255.

### 4.13 Diálogos y NPCs

- **Lista de temas** (estilo Morrowind), no árboles ramificados ni lineales. Hasta 6 temas visibles con scroll.
- **UI:** modal panel inferior (no pantalla completa).
- **Retrato + nombre** del NPC.
- **Tiradas sociales visibles** en las opciones (Persuasión, Intimidar): el jugador ve el check antes de comprometerse.
- **Comercio:** pantalla dedicada, se accede desde opción de diálogo.
- **Atacar a NPC no hostil:** botón siempre disponible con confirmación ("¿atacar a este NPC pacífico?"). Consecuencias narrativas pendientes.

### 4.14 Banco de creación y Campo de pruebas (modo Privado)

**El Banco y el Campo son una misma cosa bajo el modo Privado.** Solo accesible con flag de dev + login de credenciales de administrador. No aparece en el menú del build de producción.

- **UI:** menú único "Privado" con pestañas [Creación | Juego de pruebas].
- **Banco ilimitado.** Guarda personajes, enemigos, items, recetas custom. Etiquetas, favoritos, buscador, filtros, lista y grid.
- **Publicación al juego base:** doble vía. Botón "Publicar" en cada ítem del Banco **y** archivo `content-approved.json` editable a mano. La doble vía permite cambios rápidos desde UI y control fino desde texto.
- **Plantilla, no instancia.** Los personajes del Banco son inmutables; al jugarlos se clonan y la partida trabaja con el clon.
- **Export/Import:** botón "Exportar todo" que descarga un `.tkm.json` con el Banco completo. Import equivalente. Sustituye al LocalStorage como backup.
- **Campo de pruebas:**
  - Spawn de cualquier enemigo del catálogo.
  - Edición de HP/recursos en tiempo real.
  - **Cola de resultados forzados:** el admin escribe `[6, 1, 4]` y las próximas 3 tiradas salen en ese orden. Mejor que seed fija para reproducir bugs concretos.
  - **Simulación masiva IA vs IA:** 1.000 combates sin UI en ~5 segundos. Export CSV queda fuera de MVP.
  - **Log detallado de tirada** copiable.
  - **Crafteo con materiales infinitos** para probar recetas.
  - **Editor de recetas por formulario** (campos, dropdowns). JSON raw se edita fuera de la UI.
  - **Herramientas de tirada de exploración** (ver §4.15): forzar próximo evento, ver tabla activa, simular 1.000 tiradas con distribución, editar tabla en vivo por formulario, log detallado por tirada.

### 4.15 Tirada de exploración (sistema raíz)

**Estado: estructura cerrada, números abiertos.** Es el latido del mundo: qué pasa cuando el jugador se mueve. Raíz del juego al mismo nivel que el combate.

**Intención de diseño (brújula de balance):**

> *"Libertad, pero la libertad no te da paz. Te da cautela y opción a preparar tu siguiente movimiento."*
>
> — Bazalo, 24 abril 2026

Esta frase gobierna todos los pesos por defecto de las tablas. "Nada" domina en biomas seguros para que la libertad sea real; la amenaza está siempre latente para que la cautela tenga sentido; la mecánica de preparación (acampar, Sigilo, ítems) es el oro del sistema.

#### 4.15.1 Disparadores

Se dispara una tirada de exploración cuando:

1. **El personaje pisa una casilla** nueva en un sub-mapa (mover con puntos de acción).
2. **El personaje entra a un nodo** (ciudad, mazmorra, POI) desde el mapa-mundi.
3. **El personaje cruza una frontera de bioma** dentro de un sub-mapa.
4. **El personaje acampa / duerme.**
5. **Tramo de viaje rápido arriesgado** (ver §4.10): dispara **tiradas condensadas**, una por tramo del grafo atravesado, resumidas al llegar.

Viaje rápido seguro **no** dispara tiradas. El tutorial y el combate forzado del onboarding son **scriptados**, no pasan por este sistema.

#### 4.15.2 Variables de entrada

Las siete variables que modulan la tirada en v1:

- **Bioma** (bosque, desierto, glaciar, llanura, ruinas arcanas).
- **Hora del día** (amanecer, día, atardecer, noche).
- **Clima** (despejado, niebla, tormenta, etc.).
- **Nivel del personaje** (filtra entradas `min_level`/`max_level`).
- **Reputación** con la facción que domina la zona.
- **Flags narrativos** (`required_flags` / `forbidden_flags` en cada entrada).
- **Suerte** del personaje. Decisión #43: **atributo derivado**, no atributo separado ni consumible. Fórmula: `luck = floor((INT + VOL) / 2) - floor(level / 10)`. INT/VOL como base porque son los atributos "mentales" (un PJ sabio y voluntarioso lee mejor las situaciones). Decrece con nivel: el late-game depende menos del azar (sensación de maestría). Puede ser negativa con builds extremos a alto nivel. Modifica pesos de eventos positivos/negativos vía `weight_modifiers.if_min_luck` / `if_max_luck` (§4.15.9).

Aviso de dirección: siete variables activas es más de lo prudente. El balance de esta tabla **no es viable a mano**. El Campo de pruebas (§4.14) con simulación masiva y editor en vivo se vuelve herramienta obligatoria desde el día uno, no opcional.

#### 4.15.3 Catálogo de tipos de evento

Diez tipos en v1:

1. **Combate** — 1 a 5 enemigos según bioma/nivel.
2. **Encuentro NPC** — amigable, neutral, comerciante ambulante.
3. **Hallazgo** — recurso, item, pista, libro de receta.
4. **Trampa / hazard** — daño sin combate. **Nunca mata directamente** (deja mínimo 1 HP).
5. **Evento ambiental** — tormenta, derrumbe, aurora, aparición arcana.
6. **Estructura / POI descubierto** — añade nodo al mapa.
7. **Evento narrativo** — escena breve ligada a lore o quest de facción.
8. **Emboscada** — variante de combate con desventaja inicial.
9. **Refugio / punto de descanso** — oportunidad de recuperar HP con coste de tiempo.
10. **Nada** — casilla tranquila. Avanza el reloj interno, recupera 1-2 HP fuera de combate, consume una unidad mínima de durabilidad en el equipo de viaje.

El peso relativo de "Nada" es alto en biomas seguros y baja en biomas hostiles.

#### 4.15.4 Sistema de dados

Decisión cerrada: **1d20 como dado de exploración**, independiente del dado de combate. No comparte motor con `rules/combat.ts`.

El resultado del 1d20 se mapea contra la tabla de bioma activa: los pesos de cada entrada se normalizan a rangos sobre 20 (más las modulaciones de las 7 variables de §4.15.2). En la práctica, una tabla de bioma con pesos `[30, 20, 10, 40]` se convierte en rangos proporcionales sobre el d20 tras aplicar modificadores.

Consecuencia arquitectónica: habrá dos sistemas de tirada cerrados por separado. El módulo `rules/dice.ts` ofrece ambos como primitivas (`rollCombat()` y `rollD20()`), y cada subsistema (`combat.ts`, `exploration.ts`) usa el que le corresponde.

#### 4.15.5 Frecuencia, ritmo y presentación

- **Densidad objetivo:** 10-15 eventos por sesión de 30-45 min.
- **Peso de combate en la tabla:** 20-45% de los eventos resueltos serán de tipo combate en una sesión tipo.
- **Visibilidad de la tirada:** **completa.** Cada paso muestra el dado tirándose en log y/o HUD, incluso si el resultado es "Nada". Este es un punto de identidad del juego: presumimos reglas de rol, enseñamos los dados.
- **Presentación del evento:**
  - **Modal a pantalla completa** para eventos de peso (combate, evento narrativo, descubrimiento de POI, emboscada).
  - **Banner superior con acciones** para eventos más ligeros (hallazgo, NPC ambulante, refugio, trampa mitigada).

#### 4.15.6 Agencia del jugador

Antes del tick:

- **Habilidad de Sigilo / Percepción** consumible: gasto activo que reduce probabilidad de eventos hostiles en el próximo N de casillas.
- **Consumibles:** amuletos, hechizos, brújulas de fortuna modifican la tabla del próximo tick.
- **Acampar / descansar:** refresca recursos y permite afrontar la siguiente zona con modificadores favorables.

Durante el tick: **toda entrada de la tabla declara una tirada reactiva `evade_check`** que permite al jugador mitigar o evitar el evento. Marco común cerrado (v0.5):

- **Momento:** se ejecuta entre el revelado del evento (tirada raíz 1d20) y su consumación. El modal del evento muestra siempre al menos dos botones: `[Intentar evadir / mitigar]` y `[Afrontar]`.
- **Coste:** gratis si usa habilidad pasiva (Percepción, Instinto, Supervivencia); 1 punto de acción del turno si usa activa (Sigilo, Esquiva, Persuasión); consumible si usa ítem. Los tres conviven según lo declare cada entrada.
- **Tipo de tirada:** mixta. Fija contra dificultad para eventos ambientales/pasivos; **enfrentada** contra stat del evento para enemigos conscientes (emboscada, combate).
- **Dado:** **1d20 compartido con la tirada raíz de exploración** durante H1 como decisión provisional pragmática. Se migrará al dado de combate cuando ese sistema cierre, sin tocar `exploration.ts` (la abstracción vive en `rules/dice.ts`).
- **Fracaso crítico (pifia):** aplica solo en combate, emboscada y trampa. En el resto, fracasar = el evento sucede tal cual.
- **Éxito crítico:** aplica a todos los tipos con tirada. Recompensa de gama alta del sistema.
- **Sin habilidad requerida:** si el personaje no tiene la habilidad, el botón "Intentar" aparece desactivado con tooltip ("Percepción insuficiente"). No se tira con penalizador fantasma.
- **Afrontar siempre disponible:** renunciar a la tirada y aceptar el evento tal cual es agencia del jugador, botón presente en todo modal.
- **Entrena habilidad:** toda tirada reactiva acumula en `skills.{skillId}.usage`, ganes o pierdas. El techo blando de §4.2 evita farmeo.
- **Presentación:** dado visible rodando (animación propia distinta a la del combate), número comparado con DIF en overlay, texto del resultado, color-coding (verde éxito / dorado crítico / amarillo justo / rojo fracaso / morado pifia).

#### 4.15.7 Tabla de tiradas reactivas por tipo de evento

Catálogo cerrado v0.5. Las DIF son orientativas y se ajustarán con simulación en H8.

| Tipo | Habilidad | DIF | Coste | Éxito | Crítico | Fracaso | Pifia | Modo |
|---|---|---|---|---|---|---|---|---|
| **Combate** | Sigilo vs Percepción enemiga | según enemigo | 1 PA | Evitas el combate | Evitas + 1 turno gratis si reatacas luego | Combate normal | — (no aplica) | Ofrecida si Sigilo ≥ 1 |
| **Encuentro NPC** | — | — | — | — | — | — | — | Modal con `[Hablar]` `[Ignorar]` `[Atacar]`, sin tirada |
| **Hallazgo** | Percepción vs DIF fija | 1-3 | gratis | Ves el hallazgo | Hallazgo mejorado | "Sientes algo cerca": opción de buscar con coste | — | Automática (sin confirmación) |
| **Trampa** | Percepción reactiva | 2-4 | gratis | Detectas, no se activa, puedes desarmar | Extraes recurso de la trampa | Se activa, daño fuerte, mínimo 1 HP | Trampa + estado adverso (sangrado, etc.) | Automática → si falla, **segunda tirada activa Reflejos/DES** con coste 1 PA |
| **Evento ambiental** | Supervivencia o Voluntad (según evento) | 2-4 | gratis o 1 consumible | Mitigas efectos negativos | Aprovechas el evento (escondite, etc.) | Sufres efectos completos | — | Ofrecida en el modal |
| **POI descubierto** | Percepción pasiva | 1-4 | gratis | POI visible en el mapa | POI + pista en diario | POI queda oculto, redescubrible con mejor Percepción | — | Automática (no hay evitar) |
| **Evento narrativo** | — | — | — | — | — | — | — | Tiradas viven dentro del guion, no a nivel global |
| **Emboscada** | Percepción reactiva (no Sigilo: aquí eres el cazado) | 3-4 | gratis | Combate sin desventaja inicial | Combate con **ventaja** (primer turno + iniciativa) | Combate con desventaja (enemigo primero, estado "sorprendido") | Combate con desventaja doble (turnos perdidos o "aturdido") | Automática |
| **Refugio** | Supervivencia pasiva | 1-3 | gratis | HP según tabla | HP extra + refresca 1 consumible de habilidad | Refugio comprometido → puede encadenar evento ambiental o emboscada | — | Automática al elegir "Descansar". No evita, modula calidad |
| **Nada** | — | — | — | — | — | — | — | Sin modal, sin tirada reactiva. Avanza reloj, +1-2 HP, −1 durabilidad mínima |

Casos especiales notables:

- **Trampa** es el único tipo con **tirada en cascada**: Percepción pasiva primero; si falla, se ofrece Reflejos activa para esquivar en el último momento con coste de PA.
- **Refugio** es el único tipo donde la tirada reactiva **modula calidad** en vez de evitar.
- **Encuentro NPC** y **Evento narrativo** no tienen tirada global. El primero usa botones de modal; el segundo usa tiradas internas al guion.
- **Hallazgo** y **POI descubierto** resuelven la tirada **antes** de mostrar el modal. El jugador ve el resultado, no la tirada.

#### 4.15.8 Arquitectura

Nuevo módulo `rules/exploration.ts`, hermano de `rules/combat.ts` y `rules/crafting.ts`. Puro y determinista dada la misma semilla + estado del mundo.

- **Una tabla por bioma**, no combinatoria plena. Las demás variables (hora, clima, nivel, reputación, flags, suerte) modulan los pesos dentro de la tabla del bioma, no cambian de tabla.
- **Historial de tiradas:** últimas 100 tiradas raíz **y reactivas** en memoria de sesión, purga al cerrar. En Modo Privado se persiste completo para auditoría.
- API pura expuesta:
  - `rollExplorationTick(worldState, character, trigger) → ExplorationEvent`
  - `resolveEvadeCheck(event, character, dice) → EvadeResult`
- Ambas funciones consumen `rules/dice.ts`. Deterministas dado el mismo estado del PRNG.

#### 4.15.9 Formato de entrada de tabla

```json
{
  "id": "encuentro_lobos_bosque",
  "biome": "bosque",
  "weight": 30,
  "conditions": {
    "min_level": 1,
    "max_level": 10,
    "time_of_day": ["day", "night"],
    "weather": ["any"],
    "required_flags": [],
    "forbidden_flags": ["pacto_lobos"]
  },
  "type": "combat",
  "payload": {
    "enemy_group": "lobos_3",
    "ambush_chance": 0.2
  },
  "evade_check": {
    "skill": "sigilo",
    "difficulty": 3,
    "opposed": true,
    "opposed_stat": "perception",
    "cost": { "type": "action_point", "amount": 1 },
    "on_success": { "outcome": "skip_event", "bonus": null },
    "on_critical": { "outcome": "skip_event", "bonus": { "type": "initiative", "value": 2 } },
    "on_failure": { "outcome": "resolve_as_normal", "penalty": null },
    "on_fumble": { "outcome": "resolve_as_normal", "penalty": { "type": "status", "value": "stunned" } },
    "auto": false,
    "trains_skill": true,
    "fallback_check": null
  }
}
```

Campos de `evade_check`:

- `opposed` / `opposed_stat`: si `true`, tirada enfrentada contra `opposed_stat` del payload en vez de `difficulty` fija.
- `cost`: `{ "type": "free" | "action_point" | "consumable", "amount": N, "item_id"?: "string" }`.
- `on_success` / `on_critical` / `on_failure` / `on_fumble`: define el efecto. `on_fumble` puede ser `null` si el tipo no aplica pifia.
- `auto`: `true` resuelve sin preguntar (R3 Hallazgo, R6 POI, R8 Emboscada, R9 Refugio). `false` ofrece botón `[Intentar]`.
- `trains_skill`: `true` en todos por defecto (decisión E4). Se declara por si alguna entrada futura lo excluye.
- `fallback_check`: otra `evade_check` encadenada si la primaria falla. Solo se usa en trampas (R4). `null` en el resto.

`weight` = probabilidad relativa dentro de la tabla del bioma. `conditions` filtra elegibilidad. `payload` es específico del `type`.

---

## 5. Decisiones cerradas

Estas no se reabren sin motivo fuerte. Si Bazalo las cuestiona, la dirección le pide razón. Si la razón convence, se reabren — pero el default es que están firmes.

| # | Decisión | Cerrada en |
|---|----------|-----------|
| 1 | Fases: navegador → motor. Mesa fuera del proceso activo. | v0.4 |
| 2 | Stack de navegador: vanilla TypeScript + Canvas. | v0.2 |
| 3 | Backend: Supabase (login + persistencia). | v0.4 |
| 4 | Arquitectura: módulo `rules.ts` aislado del render. | v0.2 |
| 5 | Motor futuro preferido: Godot 4 sobre Unity. | v0.2 |
| 6 | Nombre del proyecto: El Teknomoro. | v0.3 |
| 7 | Formato de receta de crafteo con outputs ramificados. | v0.3 |
| 8 | 5 atributos (FUE/DES/CON/INT/VOL), 12/4 en creación, techo 7. | v0.4 |
| 9 | Habilidades suben por uso con techo blando + XP rompe techo. | v0.4 |
| 10 | Un personaje por slot de partida. Sin party. | v0.4 |
| 11 | Permadeath con epitafio consultable. | v0.4 |
| 12 | Mapa-mundi con nodos, sub-mapas en grid, top-down 2D. | v0.4 |
| 13 | Historia + Libre (procedural por frase-semilla) como modos de partida. | v0.4 |
| 14 | Tutorial guiado de ~5 min (no tooltips, no "aprender jugando"). | v0.4 |
| 15 | Nivel máximo 50. Subir requiere pulsar botón (estilo Diablo). | v0.4 |
| 16 | Modo Privado bajo flag de dev + credenciales. No en build de producción. | v0.4 |
| 17 | Banco = plantilla, partida = clon del Banco. | v0.4 |
| 18 | No hay código hasta cerrar bloqueantes numéricos por simulación. | v0.4 |
| 19 | Tirada de exploración es sistema raíz al mismo nivel que combate. | v0.5 |
| 20 | Dado de exploración separado del dado de combate. | v0.5 |
| 21 | Viaje rápido híbrido: solo a nodos descubiertos, con tramo seguro o arriesgado. | v0.5 |
| 22 | Brújula de exploración: "libertad → cautela y preparación". | v0.5 |
| 23 | Tirada de exploración visible por completo (dado en log/HUD cada paso). | v0.5 |
| 24 | Toda entrada de tabla de exploración debe declarar `evade_check` reactivo. | v0.5 |
| 25 | Trampas nunca matan directamente (mínimo 1 HP garantizado). | v0.5 |
| 26 | Dado de exploración: **1d20** con mapeo por rangos sobre pesos de tabla. | v0.5 |
| 27 | Marco común de tirada reactiva: momento, coste mixto, enfrentada/fija, afrontar siempre disponible, éxito crítico en todos, pifia solo en combate/emboscada/trampa. | v0.5 |
| 28 | Tirada reactiva reutiliza 1d20 de exploración durante H1; migra al dado de combate cuando cierre sin tocar `exploration.ts`. | v0.5 |
| 29 | Sin habilidad requerida → botón desactivado con tooltip, no se tira con penalizador. | v0.5 |
| 30 | Tiradas reactivas entrenan habilidad ganes o pierdas (techo blando de §4.2 evita abuso). | v0.5 |
| 31 | Cascada de tiradas solo en Trampa (Percepción pasiva → Reflejos activa). | v0.5 |
| 32 | Encuentro NPC y Evento narrativo no tienen tirada reactiva global. | v0.5 |
| 33 | Hallazgo y POI resuelven tirada antes del modal; jugador ve resultado, no tirada. | v0.5 |
| 34 | Refugio: la tirada reactiva modula calidad, no evita. | v0.5 |
| 35 | Historial persiste tiradas raíz **y** reactivas juntas en Modo Privado. | v0.5 |
| 36 | Dado de combate: **pool de d6 con éxito 4+**. N dados = ATR + HAB. Crítico si ≥2 seises. Daño = arma + margen sobre umbral; crítico dobla. | v0.6 |
| 37 | Curva de XP: **lineal `XP(n) = 100·n`** para pasar de nivel n-1 a n. Total al 50: 127.400 XP. | v0.7 |
| 38 | Cadencia de puntos por nivel: **+2 habilidades cada nivel + 1 atributo cada 5 niveles + 1 perk cada 5 niveles**. Niveles redondos (5, 10, …) son rituales y entregan los tres tipos juntos. | v0.7 |
| 39 | Techo blando del uso: una habilidad sube por uso hasta `min(floor(level/2) + 2, 7)`. A partir de ahí solo XP. UI muestra el techo activo. | v0.7 |
| 40 | Curva de uso: tiradas necesarias para subir la habilidad de v a v+1 = `round(5 · 1.7^v)`. 0→1 = 5, 4→5 = 42, 6→7 = 121. | v0.7 |
| 41 | Iniciativa de combate: `DES + 1d20` (PJ) y `initiative_base + 1d20` (enemigo). Desempate: mayor DES bruto, luego PJ sobre enemigo. Validado en `simulaciones/iniciativa-v0.1.md` tras descartar 3 iteraciones de pool d6. El d20 se reutiliza como primitiva ordenadora; no viola decisión #20. | v0.8 |
| 42 | Día/noche, clima y terreno modulan elegibilidad y pesos de tablas de exploración (vías ya cerradas en §4.15.2 y §4.15.6). **No tienen impacto numérico directo** sobre tiradas de combate, exploración o crafteo en v1. Diferido a v1.1. | v0.8 |
| 43 | Suerte como atributo derivado: `luck = floor((INT + VOL) / 2) - floor(level / 10)`. Calculada al construir cada `WorldState`. No es ítem ni consumible en v1. | v0.8 |
| 44 | Condición de fin de partida: muerte (cualquier causa) o quest principal del mapa de historia (Modo Historia). Modo Libre solo cierra por muerte. La pantalla de victoria reutiliza el formato de epitafio con `cause.kind = 'victory'`. La quest principal se diseña en H4 con el contenido del mapa. | v0.8 |
| 45 | Onboarding: tras tutorial, decisión binaria que escribe bandera narrativa (`viajero_audaz` o `viajero_cauto`), combate forzado contra enemigo tier "lobo" sin posibilidad de huir ni evitar, apertura del mapa-mundi en el nodo de la rama elegida. Texto y enemigo concretos en H9. Morir en el combate forzado activa epitafio normal sin red de seguridad. | v0.8 |
| 46 | Umbral de éxitos para impactar: `threshold = ceil(DEF / 3)`. Promovida a decisión propia desde la simulación implícita del dado v0.2 (era la fórmula que validó P(impacto) en cada perfil). DEF 4 → 2, DEF 8 → 3, DEF 12 → 4. | v0.8 |
| 47 | **Marco lore del mundo:** post-humano, naturaleza vencedora, mutaciones orgánicas, esoterismo/demoníaco **raro y reverencial**. La humanidad se extinguió y la vegetación creció encima — no es ruina seca, es bosque hostil vivo. La grieta arcana aparece como evento singular, nunca como atmósfera de fondo permanente. De este marco derivan paleta, copy, iconografía y contenido. Sustituye cualquier lectura previa tipo "tierra desértica fracturada" o "manuscrito viejo seco". El sistema visual concreto vive en `DESIGN.md` y la marca/anti-references en `PRODUCT.md`. | v0.9 |

---

## 6. Preguntas abiertas

### Bloqueantes

**Ninguno.** Los 5 que la v0.7 listaba como bloqueantes están cerrados en v0.8 (decisiones #41-#45). El #46 surgió como subproducto: la fórmula `ceil(DEF/3)` ya estaba implícita en la simulación del dado v0.2 y se promovió a decisión propia para que el código no la asuma sin trazabilidad.

Las dos provisionales que sobreviven (en código, etiquetadas) están vinculadas a contenido que se construye en su hito, no a decisiones de diseño:

- Daño base por arma sin arma equipada (puños = 1): se cierra al poblar el catálogo de armas en H5.
- Duración del día (240 ticks): se cierra en H4 cuando se ajuste el ritmo de exploración con tablas reales.

Ninguna bloquea código que no le toque.

### Importantes (v0.8 puede vivir sin ellas, pero no mucho más)

10. Lista concreta de habilidades.
11. Los 5 arquetipos: nombres, stat-line por defecto, inventario inicial, árbol de perks derivado.
12. Catálogo inicial de 50 items de MVP.
13. Catálogo inicial de recetas (objetivo: 30-50 para el MVP).
14. Catálogo inicial de enemigos (objetivo: 10 tipos con variantes).
15. Biomas definitivos y reglas de generación procedural por bioma.
16. Las 3 facciones del MVP: identidad, conflictos, reputación inicial.
17. Las 15 entradas del catálogo de logros.
18. **Tablas de exploración iniciales para los 5 biomas provisionales** (JSON en `data/exploration/*.json`).

### Diferibles (no bloquean nada a corto plazo)

19. Sistema de reparación de equipo dañado (economía asociada).
20. Coste concreto del re-spec.
21. Branding visual, UI final, música.
22. Monetización en fase 2 (si llega).
23. Soporte móvil (se evalúa cuando v1 esté funcional en desktop).
24. Soporte de mando.

---

## 7. Arquitectura técnica planeada

**NOTA: esto se concreta en detalle en el Documento de Scope (pendiente, Paso 4 del proceso). Lo de aquí es la estructura gruesa.**

### Stack

- **Frontend:** Vanilla TypeScript, sin framework. Canvas 2D para render. Vite como bundler.
- **Backend:** Supabase. Provee autenticación, base de datos (partidas, Banco privado, logros) y almacenamiento.
- **Persistencia local:** no se usa LocalStorage como fuente autoritativa. El servidor es autoritativo. Se puede cachear en memoria/IndexedDB para rendimiento, pero la partida vive en Supabase.
- **Despliegue:** Netlify o Vercel (decisión diferida).

**Cambio crítico respecto a v0.3:** el MVP ya no es cliente-only. La decisión de exigir login implica backend desde el día uno. Esto se asume y se diseña en consecuencia.

### Estructura de proyecto propuesta

```
el-teknomoro/
├── src/
│   ├── rules/           # SAGRADO. Lógica pura. Sin imports de Canvas/DOM/Supabase.
│   │   ├── character.ts
│   │   ├── combat.ts
│   │   ├── crafting.ts
│   │   ├── dice.ts          # Dos sistemas como primitivas: combate y exploración.
│   │   ├── exploration.ts   # Tirada raíz. Consume dice.ts. Puro y determinista.
│   │   ├── progression.ts
│   │   └── world-gen.ts
│   ├── render/          # Todo lo visual. Consume rules/, nunca al revés.
│   │   ├── canvas.ts
│   │   ├── ui.ts
│   │   └── map-view.ts
│   ├── state/           # Estado de sesión, sync con backend.
│   │   ├── session.ts
│   │   └── save.ts
│   ├── backend/         # Cliente Supabase. Único lugar que habla con el servidor.
│   │   ├── auth.ts
│   │   └── persistence.ts
│   ├── dev/             # Modo Privado. Se compila solo con flag de dev.
│   │   ├── bank.ts
│   │   └── sandbox.ts
│   ├── data/            # JSONs de contenido: recetas, enemigos, items, biomas, exploración.
│   │   ├── recipes.json
│   │   ├── enemies.json
│   │   ├── items.json
│   │   └── exploration/ # Una tabla JSON por bioma.
│   │       ├── bosque.json
│   │       ├── desierto.json
│   │       ├── glaciar.json
│   │       ├── llanura.json
│   │       └── ruinas_arcanas.json
│   └── main.ts
├── public/
└── index.html
```

### Modelo de datos autoritativo del personaje

```json
{
  "id": "uuid",
  "name": "string",
  "portraitId": "string",
  "archetype": "string|null",
  "attributes": { "fue": 0, "des": 0, "con": 0, "int": 0, "vol": 0 },
  "skills": { "skillId": { "value": 0, "usage": 0 } },
  "perks": ["perkId"],
  "level": 1,
  "xp": 0,
  "hp": { "current": 0, "max": 0 },
  "inventory": { "slots": [], "equipped": {} },
  "location": { "mapId": "string", "x": 0, "y": 0 },
  "faction_reputation": { "factionId": 0 },
  "achievements": ["achievementId"],
  "flags": {},
  "alive": true,
  "epitaph": null
}
```

`skills.usage` contabiliza la subida-por-uso; `skills.value` es el valor efectivo. La fórmula que liga uso → techo → XP se cierra cuando se cierre el bloqueante de dado.

### Por qué `rules/` aislado

La razón no es purismo académico. Es migración.

Cuando llegue la fase motor, el 70% del trabajo será portar `rules/` a GDScript (Godot) o C# (Unity). Todo lo demás (render, UI, persistencia) se reescribe igualmente, porque las APIs son diferentes. Si las reglas están mezcladas con el render, hay que desenredarlas antes de portar — y ese desenredo es donde mueren los proyectos.

Con `rules/` aislado y determinista, portar es un proceso mecánico, no arqueológico. El mismo principio aplica al modo Privado: la simulación masiva IA vs IA solo es viable si `rules/` corre sin render.

### Fricciones web identificadas para la fase motor

El motor futuro debería resolver estas cuatro fricciones del navegador desde el principio:

1. **Input lag** de Canvas vs input nativo.
2. **Carga inicial de bundle.** Godot carga on-demand; la web obliga a pensar en splitting.
3. **Ausencia de threading real.** Web Workers es el mejor paliativo disponible.
4. **Persistencia.** Incluso con Supabase, la latencia de red y los modos offline condicionan UX.

---

## 8. Flujos y pantallas del MVP

### 8.1 Menú principal

Tres opciones fijas: **Nueva Partida · Cargar Partida · Opciones**.

El modo **Privado** aparece solo con flag de dev activo y tras login con credenciales admin. No aparece en build de producción.

### 8.2 Guardado

- **3 slots de partida por usuario.** Persistencia en Supabase, accesibles desde cualquier dispositivo con el mismo login.
- **Guardado mixto:**
  - **Autoguardado** al cambiar de zona de mapa, al terminar combate, al subir de nivel.
  - **Heartbeat** cada 5 turnos en silencio como red de seguridad.
  - **Guardado manual** disponible desde menú.
- Cerrar pestaña: confirmación del navegador. Si se acepta, el jugador vuelve al último save al reabrir.

### 8.3 Onboarding (ver §4.6)

Login → Modo (Historia/Libre) → Creación → Tutorial guiado → Decisión inmediata → Combate forzado → Mapa abierto.

### 8.4 Pantalla de juego

- **Mapa principal** ocupa el grueso.
- **HUD siempre visible:** HP, recursos, mini-stats vitales sobre el mapa.
- **Panel lateral** desplegable: log, chat de NPCs cercanos, notificaciones.
- **Dev Mode badge** visible cuando el flag está activo.

### 8.5 Accesibilidad y presentación

- **60 FPS objetivo** en Canvas.
- **Teclado + ratón.** Sin soporte mando en MVP.
- **Texto redimensionable:** 3 tamaños (S/M/L).
- **Solo desktop** en v1. Tablet y móvil cuando v1 esté funcional.
- **Navegadores soportados:** Chromium y Firefox.
- **Música:** sí. SFX: clicks de UI y golpes como mínimo.
- **Sin modo daltónico** en MVP.

---

## 9. Historial de versiones

**v0.1** — Brief inicial de Bazalo. No conservado en este documento.

**v0.2** — Propuesta de DeepSeek. 12/4 en atributos, DEF = 10 + DES (incorrecto), crafteo con JSON simple, tres fases de producto. Problemas: balance no simulado, DEF imposible, crafteo subespecificado, faltaba loop de sesión.

**v0.3** — Depuración de dirección (abril 2026). Nombre oficial, DEF corregida, crafteo extendido con outputs ramificados, turno cero con vínculo cruzado, regla "no hay código hasta dos partidas de mesa". Tres fases (mesa → navegador → motor).

**v0.4** — Rediseño de dirección tras dos tests completos (funcionalidades MVP + profundización). Cambios estructurales:

- **Fase de mesa eliminada del proceso activo.** Dos fases: navegador → motor. Validación del reglamento vía simulación numérica y playtest del prototipo, no papel.
- **Backend Supabase** incorporado como decisión cerrada. Login obligatorio. Persistencia servidor-autoritativa. LocalStorage ya no es la fuente de verdad.
- **5 atributos cerrados** (FUE/DES/CON/INT/VOL).
- **Habilidades uso + XP** como modelo unificado (uso con techo blando, XP rompe techo).
- **Personaje único por partida** confirmado, sin party.
- **Permadeath con epitafio consultable** (el slot no se borra).
- **Modelo de mapa cerrado:** mapa-mundi con nodos + sub-mapas en grid, top-down 2D.
- **Modos Historia y Libre** convivientes, Libre usa frase-semilla del jugador.
- **Tutorial guiado** de ~5 min como decisión cerrada (no tooltips, no aprender jugando).
- **Modo Privado** bajo flag + credenciales, Banco y Campo unificados.
- **Banco como plantilla**, partida como clon.
- **Doble vía de publicación de contenido:** UI + `content-approved.json`.
- **Arquitectura técnica actualizada:** carpetas `backend/` y `dev/` añadidas. Modelo de datos autoritativo del personaje ampliado.
- Trasvase de decisiones UX del test de 130 y del test de profundización a reglamento cerrado (combate, inventario, diálogos, presentación).
- **Nueva sección §8** con flujos y pantallas del MVP.
- Bloqueantes reducidos de 5 a 6, pero ahora son todos numéricos (todos los de diseño cualitativo están cerrados).

**v0.5** — Introducción del sistema de **tirada de exploración** como raíz del juego (§4.15) y cierre del subsistema de **tirada reactiva de mitigación**, tras dos tests dedicados respondidos por Bazalo (`tirada-exploracion-v0.1.md` y `tirada-reactiva-v0.1.md`). Cambios:

- Nueva §4.15 "Tirada de exploración" con 9 subsecciones: brújula, disparadores, variables, catálogo de eventos, dado (1d20), ritmo, marco común de tirada reactiva, tabla de tiradas reactivas por tipo, arquitectura, formato de `evade_check` ampliado.
- Intención de diseño citada textualmente ("libertad, pero la libertad no te da paz; te da cautela y opción a preparar tu siguiente movimiento") como brújula de balance.
- §4.10 reescrita: viaje rápido híbrido (solo nodos descubiertos, tramo seguro o arriesgado con tiradas condensadas).
- §4.14 (Modo Privado) ampliada con herramientas para tabla de exploración.
- Decisiones cerradas 19-35 añadidas. Dado de exploración 1d20 cerrado. Marco de tirada reactiva cerrado (momento, coste mixto, afrontar, crítico/pifia, sin habilidad, entrenamiento, cascada). 10 tipos de evento con tirada reactiva tabulada.
- Bloqueantes reducidos de 9 a 7: cerrados el dado de exploración y la tirada reactiva. Quedan 7 bloqueantes (todos dependen del dado de combate o de diseño narrativo).
- Arquitectura §7 añade `rules/exploration.ts` y `data/exploration/*.json`. API pura: `rollExplorationTick()` + `resolveEvadeCheck()`.

**v0.5.1** — Hito de construcción, no de reglamento. **H.0 "Fundaciones" cerrado** el 25/4/2026. Entregable en producción:

- Repositorio Vite + TypeScript vanilla inicializado con la estructura de §7 (`rules/`, `render/`, `state/`, `backend/`, `dev/`, `data/exploration/`).
- `rules/dice.ts` con PRNG determinista (mulberry32) + `rollD20()`. `rollCombat()` queda deliberadamente fuera hasta cerrar el bloqueante del dado de combate (§6).
- Schema Supabase aplicado en producción: `public.save_slots` y `public.banks`, ambas con RLS por dueño y FK a `auth.users` con `on delete cascade`. No existe `public.users`: se referencia `auth.users` directamente.
- Login/signup/logout funcional end-to-end con persistencia de sesión.
- Vitest con 4 tests verdes del módulo de dados.
- Desplegado en Vercel con deploy automático por push a `main`.

Sin cambios al reglamento. Los bloqueantes de §6 siguen abiertos tal cual estaban en v0.5.

**v0.6** — Cierre del **dado de combate** (25/4/2026) tras dos rondas de simulación documentadas en `simulaciones/dado-combate-v0.1.md` (común a los tres candidatos) y `simulaciones/dado-combate-v0.2.md` (recalibración por candidato para evitar saturación de B/C). Cambios:

- §4.3 reescrito: el sistema de tiradas de combate queda cerrado como **pool de d6 con éxito 4+**, N dados = ATR + HAB, crítico con ≥2 seises, daño = arma + margen, crítico dobla.
- Decisión #36 añadida en §5.
- §6 bloqueantes: cerrado el dado de combate. Quedan 6 bloqueantes (todos dependen del ritmo de H3 o de diseño narrativo). La iniciativa y la curva de XP ya no son bloqueantes "matemáticos puros": son ajustes de parámetro sobre el dado cerrado.
- Sin cambios en exploración (sigue 1d20, decisión #26) ni en arquitectura.

**v0.7** — Cierre del **subsistema de progresión** (25/4/2026) tras sesión de diseño documentada en `simulaciones/progresion-v0.1.md`. Cambios:

- §4.2 reescrita con números cerrados: techo blando del uso `min(floor(level/2)+2, 7)` (decisión #39) y curva de uso `round(5·1.7^value)` (decisión #40).
- §4.11 reescrita: curva de XP lineal `100·n` (decisión #37) y cadencia de puntos (+2 hab/nivel + 1 atr/5 niveles + 1 perk/5 niveles, decisión #38). Niveles redondos como rituales que entregan los tres tipos.
- Decisiones #37-#40 añadidas en §5.
- §6 bloqueantes: cerrada la curva de XP. Quedan 5 bloqueantes (iniciativa, efectos ambientales, Suerte, condición de victoria, onboarding narrativo).
- Sin cambios en exploración, combate ni arquitectura.

**v0.8** — Cierre de los **5 bloqueantes restantes** del §6 (26/4/2026) más una decisión emergente. Cambios:

- **Decisión #41 — Iniciativa:** `DES + 1d20` (PJ) y `initiative_base + 1d20` (enemigo). Validada en `simulaciones/iniciativa-v0.1.md` tras descartar tres iteraciones de pool d6 por empates excesivos (24-50%). El d20 reutilizado como primitiva ordenadora; no viola decisión #20 que separa los dados de **resolución** de combate vs exploración. Desempate: mayor DES bruto, luego PJ sobre enemigo.
- **Decisión #42 — Día/noche, clima, terreno:** sin impacto numérico directo en v1. Modulan elegibilidad y pesos de tablas de exploración (vías ya cerradas en §4.15.2 y §4.15.6). Diferido a v1.1.
- **Decisión #43 — Suerte:** atributo derivado `floor((INT+VOL)/2) - floor(level/10)`. INT/VOL como base por ser atributos "mentales"; decrece con nivel para que el late-game dependa menos del azar.
- **Decisión #44 — Fin de partida:** muerte o quest principal del mapa de historia. Modo Libre solo cierra por muerte. Pantalla de victoria reutiliza formato del epitafio. Internamente `EndOfRunCause` engloba muerte y victoria; `DeathCause` queda como alias retro.
- **Decisión #45 — Onboarding:** estructura cerrada (decisión binaria con bandera narrativa + combate forzado tier "lobo" sin red de seguridad + apertura de mapa). Texto y enemigo concretos en H9. Flags `viajero_audaz` / `viajero_cauto` reservadas.
- **Decisión #46 — Threshold de impacto:** `ceil(DEF/3)`. Promovida a decisión propia desde la simulación implícita del dado v0.2 para que la fórmula sea explícita y no implícita en el script.
- §6 bloqueantes: **0 restantes**. Las provisionales que sobreviven en código (daño puños, duración del día) están vinculadas a contenido de hito, no a diseño abierto.
- §4.3, §4.4, §4.6, §4.8, §4.9, §4.15.2 reescritas con las decisiones cerradas.

Esta versión es la primera en la que **todo el reglamento numérico que el código necesita está cerrado**. Lo que queda abierto es contenido (catálogos, lista de habilidades, arquetipos) y decisiones que pertenecen a su hito (UI de perks, branding, etc.).

**v0.9** — Cierre del **marco lore del mundo** y del **sistema visual provisional** (26/4/2026), antes de arrancar la primera UI de H2. Cambios:

- **Decisión #47 — Marco lore del mundo:** post-humano, naturaleza vencedora con mutaciones orgánicas, esoterismo demoníaco raro y reverencial. La humanidad se extinguió y la vegetación creció encima — bosque vivo hostil, no ruina seca. La grieta arcana es evento singular, no atmósfera de fondo. Sustituye cualquier lectura previa.
- §2 reescrita: lore explicitado en la sección de visión, ya no se lee como "mundo fracturado por un evento arcano" genérico.
- Sistema visual provisional documentado en `PRODUCT.md` (register=product, marca, anti-references, principios) y `DESIGN.md` (paleta OKLCH cerrada — Bosque podrido + violeta arcano reverencial ≤5%, tipografía Cormorant Garamond + Inter + JetBrains Mono, escala de spacing/rounded, contrastes WCAG AA, pares prohibidos). Ambos archivos son derivados de la decisión #47, no decisiones independientes.
- Pipeline obligatorio para crear o modificar UI: Prompt Master → el-teknomoro-director → impeccable. Documentado en `proceso-director.md` v0.3 y enforcado por la skill `.claude/skills/modopipeline/SKILL.md`.
- Sin cambios en §4 reglamento. Sin cambios en §6 bloqueantes (siguen 0 abiertos). Sin cambios en §7 arquitectura ni §8 flujos.

**v0.10** — Cierre de la **primera pantalla del MVP en navegador** (27/4/2026): pantalla de selección de retrato (H2, paso 1/7 del flow de creación de personaje, scope §1.3 línea 48). Sin nuevas decisiones de reglamento. Cambios:

- §8: ninguna alteración del flujo. La pantalla materializa una pieza ya descrita (12 retratos fijos en grid).
- `DESIGN.md` §5 sale parcialmente del seed mode: nuevo sub-bloque §5.1 "Pantalla de retrato (H2, paso 1/7)" con shape, grid responsive, componente celda con cuatro estados (reposo / hover / focus / selected) y reglas aplicadas.
- `scope-mvp-web-v0.1.md` §1.3 línea 48 marcada como cerrada con checkbox `[x]` y fecha. Primer cierre del Hito 2; faltan 4 pantallas (atributos, habilidades, perk, inventario+preview+confirm).
- Patrón de selección establecido para el resto del flow H2: `box-shadow: inset 0 0 0 2px hueso-descolorido`, mismo principio que `.h2-start__option[aria-pressed="true"]`. Las próximas pantallas heredan este vocabulario salvo justificación.
- `setPortrait(id)` añadido a `H2StepCtx` como primer setter del flow (la vista no muta el draft directamente). Patrón replicable para `setAttributes`, `setSkills`, `setPerk`.
- Sin cambios en §4, §6, §7.

**v0.11** — Cierre de la **segunda pantalla del MVP en navegador** (27/4/2026): pantalla de asignación de atributos (H2, paso 2/7 del flow de creación, scope §1.3 línea 45). Sin nuevas decisiones de reglamento. Cambios:

- §8: ninguna alteración del flujo. La pantalla materializa el contrato cerrado en biblia §4.2 (12 puntos, mín 1, máx 4 al crear).
- `DESIGN.md` §5.2 añadido: "Pantalla de atributos (H2, paso 2/7)" con shape, componentes (fila de atributo, banda de pool, botón paso) y cuatro estados explícitos del control (incluye `:disabled` real, novedad respecto a `.h2-portrait`).
- `scope-mvp-web-v0.1.md` §1.3 línea 45 marcada como cerrada con checkbox `[x]` y fecha. 2/5 pantallas H2 cerradas; faltan 3 (habilidades, perk, inventario+preview+confirm).
- `setAttribute(id, value)` añadido a `H2StepCtx` como segundo setter del flow. Valida entero + rango `[1, 4]` contra `CREATION_RULES.attributeMinAtCreation` y `attributeMaxAtCreation` antes de mutar `draft.attributes`. Patrón hermano de `setPortrait` (no muta el draft sin validar).
- Decisión del director (CSS pass): el rojo óxido `--c-rojo-oxido-enfermo` NO aparece en esta pantalla. La UI bloquea el estado inválido por construcción (`disabled` en `+/−` impide suma fuera de `[5, 12]`; `Continuar` disabled impide salir con suma != 12). El pool se mantiene en `--c-hueso-claro` siempre.
- Patrón "banda de pool" (`.h2-attributes__pool`) reutilizable para la pantalla de habilidades (paso 3/7) que tiene el mismo problema de "10 puntos restantes".
- Sin cambios en §4, §6, §7.

**v0.12** — Cierre de la **tercera pantalla del MVP en navegador** (27/4/2026): pantalla de asignación de habilidades (H2, paso 3/7 del flow de creación, scope §1.3 línea 46). Tres decisiones cerradas. Sin nuevas decisiones de reglamento. Cambios:

- §8: ninguna alteración del flujo. La pantalla materializa el contrato cerrado en biblia §4.2 (10 puntos, mín 0, máx 3 al crear).
- `DESIGN.md` §5.3 añadido: pantalla de habilidades con shape, componentes (grupo por atributo, cabecera de grupo, fila sin chrome, botón paso 32px, banda de pool 720px), cuatro estados del control y tres desviaciones documentadas respecto a `.h2-attributes`.
- `scope-mvp-web-v0.1.md` §1.3 línea 46 marcada como cerrada con checkbox `[x]` y fecha. 3/5 pantallas H2 cerradas; faltan 2 (perk, inventario+preview+confirm).
- `setSkill(id, value)` añadido a `H2StepCtx` como tercer setter del flow. Valida que `id` exista en `SKILLS_BY_ID` + entero + rango `[0, skillMaxAtCreation]` antes de mutar `draft.skills`. Patrón hermano de `setPortrait` y `setAttribute`.

**Decisiones cerradas (nuevas):**

- **#50 — Suma exacta al confirmar habilidades.** El botón Continuar de la pantalla de habilidades se habilita SOLO cuando `sum(skills) == 10`. La validación `validateCreation` (módulo SAGRADO) sigue permitiendo `sum ≤ 10` (no se relaja el reglamento), pero la UI exige distribución completa porque el flow de creación es ritual cerrado: dejar puntos colgando rompe el tono "una vida, un personaje" (PRODUCT.md). Razón: el verbo "repartir" de biblia §4.2 línea 102 implica distribución completa.

- **#51 — Descripciones de habilidad fuera del flow de creación.** Cada habilidad tiene `description` en `src/data/skills.ts`, pero la pantalla de creación de habilidades NO las muestra (ni inline, ni tooltip, ni popover). Razón: las 10 habilidades tienen nombres autoexplicativos para el rolero veterano (Atletismo, Sigilo, Persuasión, Voluntad). Mostrar descripciones aquí mata la densidad y rompe la regla "10 habilidades sin scroll en desktop". Las descripciones se mostrarán en una hipotética pantalla de hoja de personaje en H4+, donde el jugador necesita recordar qué cubre exactamente cada habilidad al tirar.

- **#52 — Política de extracción del stepper.** El componente "stepper" (banda de pool + botón paso + fila con stepper) se clona en cada pantalla del flow de creación hasta el tercer consumidor. Entonces se extrae a clases compartidas `.h2-stepper-*` en commit aparte que cubre todas las pantallas afectadas. Razón: regla "tres similares es mejor que abstracción prematura". H2.2 y H2.3 son los dos primeros consumidores; si H2.4 (perks) o H2.5 (inventario) usan stepper, se ejecuta la extracción. Si no, se queda clonado.

- Sin cambios en §4, §6, §7.

**v0.13** — Cierre de la **cuarta pantalla del MVP en navegador** (27/4/2026): pantalla de elección de perk inicial (H2, paso 4/7 del flow de creación, scope §1.3 línea 47). Dos decisiones nuevas. Sin cambios de reglamento. Cambios:

- §8: ninguna alteración del flujo. La pantalla materializa el contrato cerrado en biblia §4.7 (1 perk al crear, elegido entre 5 iniciales).
- §4.7 línea 253: la frase "Los perks del árbol se desbloquean según el arquetipo elegido" queda **explícitamente acotada al árbol post-creación (H7)**. En la creación de personaje (H2.4) los 5 perks iniciales están todos disponibles para elegir, sin gateo. Aclaración formalizada como decisión #53.
- §3 (Tipografía) regla "Numbers-In-Mono" matizada en `DESIGN.md` con **excepción inline**: la regla aplica a bloques tabulares y fichas, NO a prosa inline. Formalizado como decisión #54.
- `DESIGN.md` §5.4 añadido: pantalla de perk con shape, componente card-radio con cabecera de nombre+sigla y cuerpo de descripción, cuatro estados ortogonales y tres desviaciones documentadas respecto a `.h2-portrait`.
- `scope-mvp-web-v0.1.md` §1.3 línea 47 marcada como cerrada con checkbox `[x]` y fecha. **4/5 pantallas H2 cerradas; falta solo la 5/5 (inventario+preview+confirm).**
- `setPerk(id)` añadido a `H2StepCtx` como cuarto setter del flow. Valida que `id` exista en `PERKS_BY_ID` y **REEMPLAZA** `draft.perks = [id]` (no acumula). El reglamento exige `length === 1` al confirmar.
- Stepper queda en 2 consumidores tras H2.4 (decisión #52 inalterada). H2.5 dirá si se ejecuta la extracción a `.h2-stepper-*` o se queda clonado.

**Decisiones cerradas (nuevas):**

- **#53 — Disponibilidad de perks en creación.** En la pantalla H2.4 (paso 4/7 del flow de creación), los 5 perks iniciales están **todos disponibles** para elegir. El gateo por arquetipo dominante mencionado en biblia §4.7 línea 253 ("Los perks del árbol se desbloquean según el arquetipo elegido") aplica **solo al árbol de progresión post-creación (H7)**, no a la creación de personaje. Si el jugador entra en modo `preset` con un arquetipo definido, el `starting_perk_id` del arquetipo aparece preseleccionado como sugerencia (inset ring visible), pero ajustable: el jugador puede cambiar a cualquiera de los otros 4. Razón: el modo `scratch` no pasa por arquetipo y se quedaría sin perks si gateamos; biblia §4.7 línea 253 dice que el jugador puede ajustar todo dentro de las reglas. Acción: documentar la aclaración en biblia §4.7 línea 253 (línea editada en este mismo bump).

- **#54 — Excepción de Numbers-In-Mono para prosa inline.** La regla "Numbers-In-Mono" (DESIGN.md §3) aplica a **bloques tabulares, fichas de personaje y stat displays** donde los números se alinean visualmente y el mono ayuda a comparar. **No aplica a prosa inline** (descripciones de perk/habilidad/ítem, tooltips narrativos, copy de UI con números embebidos en frase: "+1 éxito al primer ataque", "+2 a la iniciativa permanente"). En prosa inline, los números van en sans pleno como el resto de la frase. Razón: romper la línea base con mono dentro de una frase corta daña la lectura sin aportar comparación visual; no hay otro número adyacente con el que comparar. La distinción operativa: ¿el número se compara con otro adyacente (tabla, ficha, log)? mono. ¿El número está embebido en una frase narrativa? sans. Acción: matización aplicada en `DESIGN.md` §3 (regla actualizada en este mismo bump).

**v0.14** — Cierre de la **quinta pantalla del MVP en navegador** (27/4/2026): pantalla de inventario inicial (H2, paso 5/7 del flow de creación, primera de las tres sub-pantallas en que se divide el "paso 5/5" del scope §1.3 — sub 5a). Sin nuevas decisiones de reglamento ni de diseño numérico. Sin cambios de §4, §6, §7. Cambios:

- §8: ninguna alteración del flujo. La pantalla materializa el contrato cerrado en biblia §4.7 línea 258 (inventario inicial fijo por arquetipo, botón "Sorpréndeme", lista visible antes de confirmar) en formato anticipatorio coherente con que el catálogo de items real cierra en H5.
- `DESIGN.md` §5.5 añadido: pantalla de inventario con shape, panel técnico denso, banda informativa (clon visual del patrón `.h2-attributes__pool`), lista sin cards con divisores finos, botón "Sorpréndeme" como toggle con aviso inline y timeout suave. Decisión #54 aplicada (descripciones de ítem en sans pleno).
- `scope-mvp-web-v0.1.md` §1.3 línea 49 marcada como cerrada con checkbox `[x]` y fecha. **5/7 pantallas H2 cerradas; faltan 2 (preview, confirm) para terminar las 3 sub-pantallas del paso 5/5.**
- Confirmación arquitectónica del director: el "paso 5/5" del scope §1.3 (líneas 49-51) se ejecuta como **3 sub-pantallas distintas** (5a inventario, 5b preview, 5c confirm), no como un único bloque. Las tres entradas ya estaban separadas en `src/state/h2-flow.ts` líneas 18-26 desde antes; este cierre confirma que se mantienen como pantallas independientes con un MODOPIPELINE por cada una.
- Pantalla 100% read-only sobre el draft: lee `ctx.draft.archetype` y muestra el inventario placeholder correspondiente (5 ítems narrativos genéricos con tono lore-aware: "Cuchillo de hoja recocida", "Odre de agua filtrada", "Hogaza dura y tiras de carne curada", "Capa de fibra trenzada", "Reliquia menor de un nombre olvidado"). Si `archetype` es null/undefined o no se encuentra en `ARCHETYPES_BY_ID`, banda neutra "Inventario inicial básico — 5 ítems". No añade setters al `H2StepCtx`. No persiste nada en draft. Esto es coherente con que el catálogo real es H5.
- "Sorpréndeme" en H2 muestra aviso inline "Generación de inventario aleatorio — disponible en H5." (toggle con `aria-pressed` + timeout 5 s). Sin modal, sin lógica de generación real. La lógica completa entra en H5.
- Stepper queda en 2 consumidores tras H2.5a (decisión #52 inalterada): la pantalla NO usa stepper. El plazo se mantiene abierto hasta el cierre de la sub-pantalla 5/5 (H2.5c confirm) por si emerge un tercer consumidor.

**Decisión operativa del director (sin numeración formal de reglamento):**

- Patrón canónico de **nav inferior del flow H2 = Atrás + Continuar + Reset en TODAS las pantallas**. El Reset es la salida de emergencia desde dentro del flow ("me he equivocado de arquetipo, empiezo de cero") y debe estar disponible en cualquier paso. La pantalla de retrato (H2.1) lo tiene correctamente desde su cierre; las 3 pantallas centrales (atributos, habilidades, perk) lo perdieron por contagio entre cierres. H2.5a se hace bien desde el principio: incluye Reset. Acción: tras cerrar las sub-pantallas 5b y 5c, abrir commit aparte que añade Reset a `h2-attributes-view.ts`, `h2-skills-view.ts` y `h2-perk-view.ts` para uniformar el flow. Deuda formalizada en `h2-dudas-contenido.md` §"Deuda técnica conocida".

**v0.15** — Cierre de la **sexta pantalla del MVP en navegador** (27/4/2026): pantalla de preview del personaje (H2, paso 6/7 del flow de creación, segunda de las tres sub-pantallas del "paso 5/5" del scope §1.3 — sub 5b). Sin nuevas decisiones de reglamento ni de diseño numérico. Sin cambios de §4, §6, §7. Cambios:

- §8: ninguna alteración del flujo. La pantalla materializa el contrato de biblia §4.7 línea 257 ("preview del personaje en combate antes de confirmar") como **mock visual estático**, sin lógica de combate. El motor de combate (H3) cierra después; en H2 esta pantalla es anticipatoria.
- `DESIGN.md` §5.6 añadido: pantalla de preview con shape (arena de dos paneles enfrentados con "vs" central), panel jugador (retrato + identidad + 4 stats derivados en grid), panel enemigo placeholder (silueta `?` en serif sobre fondo dasheado, copy "Lo que sea que aparezca"), bloque de detalles inferior con atributos / habilidades entrenadas / perk.
- `scope-mvp-web-v0.1.md` §1.3 línea 50 marcada como cerrada con checkbox `[x]` y fecha. **6/7 pantallas H2 cerradas; falta solo 1 (confirm) para terminar las 3 sub-pantallas del paso 5/5.**
- Pantalla **read-only sobre draft** + cálculo de stats derivados desde `rules/character.ts` (módulo SAGRADO consumido como API: `computeMaxHp`, `computeDefense`). Iniciativa base = `DES` bruto (el +1d20 vive en `combat.ts`, biblia §4.8); Suerte = `floor((INT+VOL)/2)` (decisión #43 sin la decay por nivel, porque el personaje aún no tiene `level`). No añade setters al `H2StepCtx`. No persiste nada.
- Único uso de la serif Cormorant Garamond en el flow H2 hasta ahora: el "vs" central y la silueta `?` del enemigo. Decisión deliberada del director: la regla "Display-Is-Sacred" reserva la serif a momentos narrativos de peso; el preview es exactamente eso (último vistazo al personaje antes de cruzar el umbral). Microuso, no expansivo.
- Asimetría visual deliberada: el panel enemigo va con `border-style: dashed` y color subordinado para comunicar "esto es placeholder honesto, no diseño definitivo" (PRODUCT.md §Design Principles 5).
- Stepper queda en 2 consumidores tras H2.5b (decisión #52 inalterada): la pantalla NO usa stepper. La extracción se decidirá tras H2.5c (confirm).
