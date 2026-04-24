# El Teknomoro — Biblia del juego

> Documento vivo. Consolida todo lo que sabemos (y lo que no sabemos) sobre el proyecto.
> **Versión:** v0.4 · **Fecha:** 24 de abril de 2026 · **Autor:** Bazalo con dirección de el-teknomoro-director

---

## Índice

1. Identidad del proyecto
2. Visión y scope
3. Estado actual y roadmap
4. Reglamento v0.4 (estado en revisión)
5. Decisiones cerradas
6. Preguntas abiertas (lo que hay que responder)
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

El Teknomoro es un RPG donde el jugador explora un mundo fracturado por un evento arcano, compone un personaje con atributos y habilidades, combate, craftea, se une a facciones y toma decisiones que modifican el mundo de manera persistente. Muere una vez, muere para siempre.

**Dos fases, no tres.** La fase de mesa (PDF jugable) que aparecía en versiones anteriores está fuera del proceso activo. El reglamento ya no se valida jugando en papel: se valida por **simulación numérica** (hoja de cálculo / Monte Carlo) antes de tocar código, y por **playtest del propio prototipo web** una vez haya módulos jugables.

La fase web existe porque es el camino más corto entre "tengo reglas simuladas" y "tengo jugadores externos probándolo". Un ejecutable de Godot requiere instalación; una URL con login no.

La fase motor existe como posibilidad, no como compromiso. Solo se activa si la fase web tiene demanda real.

---

## 3. Estado actual y roadmap

**Estado hoy (24 abril 2026):** diseño en revisión. Biblia en v0.4 tras dos pases de tests de diseño con Bazalo (130 preguntas de funcionalidad + 54 preguntas de profundización arquitectónica).

**Proceso de dirección activo** (detallado en `proceso-director.md`):

1. ✅ Diagnóstico del estado.
2. ✅ Test de funcionalidades del MVP (130 preguntas).
3. ✅ Test de profundización (54 preguntas).
4. ⏳ **Documento de Scope v0.1 del MVP web** ← siguiente entregable.
5. ⏳ Cierre de bloqueantes numéricos del reglamento por simulación (en paralelo).
6. ⏳ Arquitectura técnica detallada.
7. ⏳ Código.
8. ⏳ Playtest recurrente del prototipo.

**Cuello de botella real:** tiempo del autor. Bazalo trabaja turnos alternos y tiene otros proyectos (Furbito v2.0, YouTube, ventas en Vinted/Cardmarket). El Teknomoro vive en los bloques cognitivos libres. Estimar ritmo realista: una a dos sesiones de diseño al mes hasta que el reglamento numérico esté cerrado.

---

## 4. Reglamento v0.4 (estado en revisión)

### 4.1 Atributos

**Estado: abierto en números, cerrado en estructura.**

- **5 atributos:** Fuerza (FUE), Destreza (DES), Constitución (CON), Intelecto (INT), Voluntad (VOL).
- 12 puntos para repartir en creación (no 10 como proponía DeepSeek).
- Máximo 4 al crear, mínimo 1 obligatorio en cada uno.
- Techo absoluto en nivel máximo: 7.

La decisión de 12/4 sobre 10/3 responde a dar espacio de build real. Con 10/3 solo hay unas seis distribuciones viables; con 12/4 hay aproximadamente 20. En un RPG que presume de libertad, la variedad de arquetipos iniciales importa.

Los cinco atributos se confirman en esta versión porque son el eje vertebral de los cinco arquetipos predefinidos de creación (ver §4.7) y del sistema de defensa (ver §4.4).

### 4.2 Habilidades

**Estado: estructura propuesta, lista abierta.**

- 10 puntos para repartir en creación, máximo 3 al crear.
- Las habilidades suben por **dos vías que conviven**:
  - **Uso**: usar la habilidad acumula progreso hasta un techo blando.
  - **XP**: al subir de nivel, puntos para gastar rompen ese techo.

La convivencia uso + XP se cierra con este modelo: el uso premia la coherencia del jugador (haces lo que tu personaje hace), el XP premia la estrategia de build (decides dónde invertir). El uso llega hasta cierto techo, el XP rompe el techo. Esto evita el problema de Skyrim (farmear saltos) y el problema de Diablo (builds rígidos).

**Lista concreta de habilidades:** pendiente. Se aborda cuando los bloqueantes de dado y defensa estén cerrados.

### 4.3 Sistema de tiradas

**Estado: BLOQUEANTE. Pendiente de simulación.**

Pregunta fundamental sin responder: ¿dado pool (tiro N dados, cuento éxitos sobre un umbral) o dado único (tiro un d20/d100, sumo modificadores)?

Hasta que esa pregunta se responda, todos los números de balance son provisionales. Recomendación de dirección: **pool de d6 con umbral de éxito en 4+**. Razones:

- Más dados = más sensación de progresión palpable (pasar de 3 a 4 dados se siente).
- d6 es el dado más accesible mentalmente.
- Umbral 4+ da 50% base por dado, fácil de intuir.

Esta recomendación NO está cerrada. Se cierra solo con simulación numérica documentada.

### 4.4 Defensa

**Estado: propuesta de dirección, pendiente de validar con simulación.**

Fórmula recomendada: `DEF = 2 + floor(DES/2) + armadura`.

| DES | Bono pasivo | DEF sin armadura | DEF con armadura pesada (+3) |
|-----|-------------|------------------|------------------------------|
| 1-2 | +0 | 2 | 5 |
| 3-4 | +1 | 3 | 6 |
| 5-6 | +2 | 4 | 7 |
| 7   | +3 | 5 | 8 |

Acción de Esquivar: bono fijo de +2 durante un turno, no suma de DES entera.

Racional: la defensa pasiva debe escalar con DES (si no, los builds ágiles pierden identidad), pero acotada para no volver imposible golpear a high-DES. Esquivar se mantiene como decisión táctica con coste de acción.

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

**Estado: estructura cerrada, onboarding concreto pendiente de guion.**

La semilla del mundo sigue siendo la base: una frase que tiñe la partida procedural y genera el `seed` del PRNG. Ejemplo: *"una tormenta mágica ha despertado algo bajo el glaciar"*.

En web, el onboarding queda así:

1. **Login** (Supabase).
2. **Selección de modo:** Historia (mapa fijo) o Libre (procedural con frase-semilla).
3. **Creación de personaje** (ver §4.7).
4. **Tutorial guiado de ~5 min** (escena, no tooltips sueltos).
5. **Decisión inmediata** del personaje ya creado.
6. **Primer combate forzado** derivado de esa decisión.
7. **Mapa abierto.**

El tutorial es **escena guiada**, no tooltips contextuales ni "aprender jugando". Decisión cerrada.

### 4.7 Creación de personaje

**Estado: flujo cerrado, arquetipos provisionales.**

- **Flujo mixto:** pantalla inicial "Empezar de cero" / "Empezar con preset". Ambas opciones desde el primer momento.
- **Arquetipos predefinidos:** 5, uno por atributo dominante (FUE, DES, CON, INT, VOL). Nombres y contenido concreto pendientes.
- **Perks iniciales:** el jugador elige **1 perk al crear**. Los perks del árbol se desbloquean según el arquetipo elegido (o según atributo dominante si empezó libre).
- **Retratos:** set fijo de 12 retratos, sin categorizar por género/edad/etnia, estilo visual uniforme. El jugador los ojea en grid.
- **Reparto de atributos:** botones +/- con preview en tiempo real de los stats derivados (HP, DEF, iniciativa). Validación visual cuando el reparto es ilegal. Botón "Reset" disponible.
- **Reparto de habilidades:** pantalla separada, mismo patrón +/- con preview.
- **Preview del personaje en combate** antes de confirmar.
- **Inventario inicial:** fijo por arquetipo, con botón "Sorpréndeme" que genera un inventario aleatorio dentro de un pool razonable, con lista visible antes de confirmar.
- **Una vez confirmado, el personaje queda bloqueado** (no editable). Permadeath significa que la decisión pesa.

**Un personaje por slot de partida. Sin party.** El inventario es individual por personaje.

### 4.8 Combate

**Estado: UX cerrada, matemáticas abiertas.**

- **Por turnos puros.** Hasta 5 enemigos en pantalla en MVP.
- **Iniciativa:** estadística base + tirada (fórmula exacta pendiente del sistema de dados).
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

### 4.9 Muerte y permadeath

**Estado: cerrado.**

- Morir es definitivo.
- El slot de partida **no se borra**: queda marcado como "muerto", consultable como epitafio (stats finales, logros conseguidos, causa de muerte, ubicación).
- Al epitafio se accede desde la pantalla de Cargar Partida, en estado de solo lectura.

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

**Estado: estructura cerrada, curva abierta.**

- **Nivel máximo 50.**
- **Subir de nivel no es automático:** el jugador pulsa "Subir nivel" cuando quiere (estilo Diablo). Pausa el juego.
- **Curva de XP:** pendiente del sistema de dados y del ritmo de combate esperado. Para wireframe se reserva espacio tipo "XP: 1.234 / 9.999".
- **Logros:** 15 en MVP, cubriendo hitos clave (primer combate ganado, primer craft, primera muerte evitada, etc.).
- **Facciones:** 3 en MVP con reputación numérica. Las decisiones del jugador mueven reputación en ambas direcciones.
- **Re-spec:** disponible, cuesta recurso de juego (no gratis, no ilimitado).
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
- **Suerte** del personaje (atributo derivado u oculto, pendiente de concreción; modifica pesos de eventos positivos/negativos).

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

Decisión cerrada: **dado propio de exploración, independiente del dado de combate.** No comparte motor con `rules/combat.ts`. El formato concreto (d100 con tabla, pool d6, otro) queda como **bloqueante numérico propio** (ver §6, bloqueante 2bis).

Consecuencia arquitectónica: habrá dos sistemas de tirada cerrados por separado. El módulo `rules/dice.ts` ofrece ambos como primitivas, y cada subsistema (`combat.ts`, `exploration.ts`) usa el que le corresponde.

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

Durante el tick:

- **Todo evento tiene una tirada reactiva de mitigar o evitar.** Combate → tirada de Sigilo para evitar enfrentamiento. Trampa → tirada de Percepción reactiva para esquivarla. NPC hostil → opción de diálogo previa antes del combate. Emboscada → tirada de Percepción para quitar la desventaja inicial.
- Cada entrada de la tabla declara su `evade_check` (ver §4.15.8).

Hay que diseñar una tirada reactiva para cada tipo de evento del catálogo §4.15.3. Esto no es opcional, es parte del contrato del sistema.

#### 4.15.7 Arquitectura

Nuevo módulo `rules/exploration.ts`, hermano de `rules/combat.ts` y `rules/crafting.ts`. Puro y determinista dada la misma semilla + estado del mundo.

- **Una tabla por bioma**, no combinatoria plena. Las demás variables (hora, clima, nivel, reputación, flags, suerte) modulan los pesos dentro de la tabla del bioma, no cambian de tabla.
- **Historial de tiradas:** últimas 100 tiradas en memoria de sesión, purga al cerrar. En Modo Privado se persiste para auditoría; en modo normal se descarta.
- El módulo consume `rules/dice.ts` y expone una API pura: `rollExplorationTick(worldState, character, trigger) → ExplorationEvent`.

#### 4.15.8 Formato de entrada de tabla

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
    "ambush_chance": 0.2,
    "evade_check": { "skill": "sigilo", "difficulty": 2 }
  }
}
```

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

---

## 6. Preguntas abiertas

### Bloqueantes (hay que responderlas antes de v0.5)

1. **¿Pool de dados o dado único?** Determina todas las matemáticas del sistema. Se cierra con simulación.
2. **Fórmula de iniciativa** (depende de 1).
3. **Curva de XP para llegar a nivel 50** (depende de 1 y del ritmo esperado de combate).
4. **Efectos numéricos de día/noche, clima y terreno** (depende de 1).
5. **Qué cuenta como "partida terminada"** en modo Historia (condición de victoria/cierre narrativo).
6. **Contenido exacto de la decisión inmediata + primer combate forzado** del onboarding.

### Importantes (v0.6 puede vivir sin ellas, pero no mucho más)

7. Lista concreta de habilidades.
8. Los 5 arquetipos: nombres, stat-line por defecto, inventario inicial, árbol de perks derivado.
9. Catálogo inicial de 50 items de MVP.
10. Catálogo inicial de recetas (objetivo: 30-50 para el MVP).
11. Catálogo inicial de enemigos (objetivo: 10 tipos con variantes).
12. Biomas definitivos y reglas de generación procedural por bioma.
13. Las 3 facciones del MVP: identidad, conflictos, reputación inicial.
14. Las 15 entradas del catálogo de logros.

### Diferibles (no bloquean nada a corto plazo)

15. Sistema de reparación de equipo dañado (economía asociada).
16. Coste concreto del re-spec.
17. Branding visual, UI final, música.
18. Monetización en fase 2 (si llega).
19. Soporte móvil (se evalúa cuando v1 esté funcional en desktop).
20. Soporte de mando.

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
│   │   ├── dice.ts
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
│   ├── data/            # JSONs de contenido: recetas, enemigos, items, biomas.
│   │   ├── recipes.json
│   │   ├── enemies.json
│   │   └── items.json
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

**v0.5** — Pendiente. Se produce cuando se cierren los bloqueantes numéricos del §6 por simulación. Debe fijar sistema de dados, iniciativa, curva de XP, efectos ambientales y contenido del onboarding inicial.
