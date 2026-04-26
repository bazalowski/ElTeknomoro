# El Teknomoro — Guía de redacción de contenido

> **Para qué sirve este documento.** Cuando te sientes a redactar habilidades, perks, items, recetas, enemigos, NPCs, logros, retratos, facciones o tablas de exploración, abres este .md y sigues el patrón que toca. Cada sección te dice: dónde va el archivo, qué shape tiene cada entrada, qué campos son obligatorios y qué pegas concretas conviene evitar.
> **Director:** el-teknomoro-director
> **Versión:** v0.1 (26/4/2026 — generada al cierre del esqueleto extendido)
> **Autoridad:** los contratos los fijan los módulos de [src/rules/](src/rules/). Esta guía describe cómo alimentar esos contratos. Si chocan los dos, manda el código.

---

## 0. Reglas que valen para TODO el contenido

Antes de la primera entrada de cualquier catálogo:

1. **Idiomas.** El **id interno** es siempre `snake_case`, en castellano o inglés según ya esté el resto del catálogo (no mezcles). El **nombre visible** es lo que ve el jugador y va en castellano cuidado, en mayúsculas iniciales.
2. **Estabilidad de IDs.** Una vez un id se publica, **no se renombra**. Si hace falta cambiarlo, se crea uno nuevo y se borra el viejo en una sola tanda. Renombrar rompe partidas guardadas en Supabase.
3. **Determinismo.** No metas `Math.random()` en datos. Si un valor depende del azar, el sistema que lo consume tiene su propio `Rng` y resuelve en runtime.
4. **Nunca importes desde `src/data/` hacia `src/rules/`.** Las reglas no conocen el contenido. El contenido se inyecta en la capa que orquesta (state/H4 en adelante).
5. **Cap absoluto de atributos = 7, de habilidades = 7.** No diseñes contenido que asuma valores por encima.
6. **Provisional vs definitivo.** Si un campo está marcado como `PROVISIONAL Hx` en el módulo de reglas, el valor que pongas hoy puede cambiar al cerrar Hx. Etiqueta tu entrada con un comentario `// PROVISIONAL H5 — placeholder de daño` si depende.
7. **Tests.** Cualquier catálogo nuevo entra con un test mínimo en `src/data/<archivo>.test.ts`: que no tiene IDs duplicados, que cada entrada cumple su shape de TypeScript, y que las invariantes obvias se respetan (ej. arquetipo suma 12 puntos, peso > 0, etc.). El director añade el test si falta.
8. **Estilo de comentarios en datos.** Comentario por encima de la entrada que explica el **porqué de los números**, no el qué. "Más HP que un lobo porque es jefe de manada" sí. "HP del oso = 30" no.

---

## 1. Habilidades — `src/data/skills.ts`

### Para qué sirven
Las habilidades del personaje. Suben por uso (techo blando) y por XP (rompe techo, máx 7). Las consumen exploración (`evade_check`), combate (pool del arma), crafteo (`skill_check`) y diálogo (`social_check`).

### Shape
```ts
import type { AttributeId } from '../rules/character';

export interface SkillDefinition {
  id: string;              // snake_case. ej. 'sigilo'. Inmutable una vez publicado.
  name: string;            // Visible. ej. 'Sigilo'.
  attribute: AttributeId;  // FUE | DES | CON | INT | VOL. Suma a la tirada.
  description: string;     // 1-2 frases. Ve el jugador en tooltip.
}

export const SKILLS: readonly SkillDefinition[] = [...];
export const SKILLS_BY_ID: Readonly<Record<string, SkillDefinition>> = ...; // generado al cargar
```

### Campos
| Campo | Obligatorio | Notas |
|---|---|---|
| `id` | sí | snake_case. **Se referencia desde `data/perks.ts`, `data/recipes.ts`, `data/items.ts` (weapon_skill), tablas de exploración (evade_check.skill), diálogos (social_check.skill).** Si lo renombras, rompes todos esos catálogos. |
| `name` | sí | Castellano. Una sola palabra preferentemente. |
| `attribute` | sí | El atributo que se suma a la tirada cuando se usa la habilidad. |
| `description` | sí | Lo que el jugador lee. Sin tecnicismos del motor. |

### Pegas a evitar
- **No crear habilidades duplicadas.** Si dos verbos del juego encajan en la misma habilidad, plieguen los dos en una. Menos habilidades = builds más legibles.
- **No inventar habilidades sin verbo del juego.** Cada habilidad debe responder "¿qué hago en partida que la entrene?". Si no tiene tirada que la dispare, no existe.
- **No crear habilidades que dupliquen un atributo puro.** No tiene sentido "Fuerza Bruta" como habilidad si ya tienes FUE como atributo.

### Cuándo crear una habilidad nueva (post-MVP)
Cuando un sistema nuevo (ej. magia divina, nadar, montar) necesita una tirada propia que ninguna existente cubre. Hasta entonces, prefiere reusar.

---

## 2. Arquetipos — `src/data/archetypes.ts`

### Para qué sirven
Presets de creación de personaje. El jugador elige uno y empieza con stat-line + habilidades + perk + inventario sugeridos. Puede modificarlos después dentro de las reglas de creación.

### Shape
```ts
import type { AttributeBlock } from '../rules/character';

export interface ArchetypeDefinition {
  id: string;                              // ej. 'arq_fue'.
  name: string;                            // Visible. ej. 'Bárbaro del Yermo'.
  dominant_attribute: AttributeId;         // FUE | DES | CON | INT | VOL.
  pitch: string;                           // Una frase para el jugador.
  attributes: AttributeBlock;              // Suma 12, ningún campo > 4 ni < 1.
  starting_skills: Readonly<Record<string, number>>; // {skillId: puntos}, suma ≤ 10, ningún valor > 3.
  starting_perk_id: string;                // Perk inicial sugerido (uno de data/perks.ts).
  starting_inventory_item_ids: readonly string[]; // ids de items.ts. Vacío hasta H5.
}

export const ARCHETYPES: readonly ArchetypeDefinition[] = [...];
```

### Campos
| Campo | Obligatorio | Notas |
|---|---|---|
| `id` | sí | Convención: `arq_<atributo_dominante_corto>`. |
| `dominant_attribute` | sí | Se usa para filtrar perks del árbol más adelante (biblia §4.7). |
| `attributes` | sí | **Validado por test:** suma = 12, cada uno ∈ [1, 4]. |
| `starting_skills` | sí | **Validado por test:** suma ≤ 10, cada valor ∈ [0, 3]. Las ids deben existir en `SKILLS_BY_ID`. |
| `starting_perk_id` | sí | Debe existir en `PERKS_BY_ID`. |
| `starting_inventory_item_ids` | hasta H5 | Vacío en H2; en H5 lista de ids del catálogo. |

### Pegas a evitar
- **No diseñar arquetipos "do-it-all".** Cada uno debe brillar en 1-2 atributos y suspender claramente en 1-2. Si todos los stat-lines tienen 3-3-3-2-1 con ligeras variaciones, no hay decisión real.
- **No referenciar habilidades que no estén en `SKILLS`.** El test lo cazaría, pero ahorra el rebote.
- **5 arquetipos exactos para MVP.** Uno por atributo dominante. No 4, no 6.

---

## 3. Perks — `src/data/perks.ts`

### Para qué sirven
Talentos que el jugador desbloquea. 1 al crear, +1 cada 5 niveles (biblia §4.11). El árbol completo es post-MVP; en MVP solo necesitamos:
- 5 perks iniciales (uno por arquetipo dominante) para la pantalla de creación.
- Más perks "de árbol" se redactan en H7.

### Shape
```ts
import type { AttributeId } from '../rules/character';

export type PerkEffectKind =
  | 'attribute_bonus'      // +N a un atributo concreto
  | 'derived_stat_bonus'   // +N a HP, DEF, iniciativa, etc.
  | 'combat_modifier'      // bonificadores condicionados a combate
  | 'exploration_modifier' // bonificadores a tirada raíz o reactiva
  | 'narrative';           // efectos puramente de gating (flag, contenido)

export interface PerkEffect {
  kind: PerkEffectKind;
  // Payload abierto por kind. La capa que consume el perk lo interpreta.
  payload: Readonly<Record<string, unknown>>;
}

export interface PerkDefinition {
  id: string;                           // ej. 'perk_golpe_brutal'.
  name: string;                         // Visible.
  description: string;                  // Visible. Frase corta y clara.
  // Atributo dominante requerido (null = disponible para todos).
  required_dominant_attribute: AttributeId | null;
  // Nivel mínimo del personaje para elegirlo. Iniciales = 1.
  min_level: number;
  // Otros perks que deben tenerse antes (árbol). Vacío para iniciales.
  prerequisites: readonly string[];
  effects: readonly PerkEffect[];
}
```

### Campos
| Campo | Obligatorio | Notas |
|---|---|---|
| `id` | sí | Prefijo `perk_`. |
| `description` | sí | Lo que ve el jugador. Si el efecto mecánico es discreto ("+2 HP"), inclúyelo en la descripción. |
| `required_dominant_attribute` | sí | `null` para perks neutros. Para iniciales del MVP, llena al atributo dominante del arquetipo. |
| `prerequisites` | sí | Array (puede ir vacío). |
| `effects` | sí | Lista. Un perk puede tener 1+ efectos (ej. "Atletismo entrenado": +1 atletismo, +1 a saltar). |

### Cómo se aplica un PerkEffect
Cada `kind` lo interpreta un módulo distinto:
- `attribute_bonus` → se aplica al construir `attributes` derivados (al equipar/desequipar perks; el motor de aplicación vive en H7).
- `combat_modifier` → lo lee `combat.ts` al construir `AttackInput`.
- `exploration_modifier` → lo lee `exploration.ts` al modular pesos o al ajustar la tirada reactiva.
- `narrative` → setea flags en `character.flags` o gatea contenido vía conditions.

**Si inventas un kind nuevo, hay que tocar código.** Por defecto, reusa.

### Pegas a evitar
- **No declarar perks con efectos sin documentar.** Si la `description` dice "Mejora tu suerte" y el efecto es `+1 a la tirada de exploración cuando es de noche en bosque", el jugador no lo entiende. Sé explícito.
- **No saltarse el cap absoluto.** Un perk que da +3 FUE en un personaje con FUE 6 tiene que respetar el cap 7. Lo controla quien aplica el efecto, no el dato — pero **no diseñes perks que se vuelven bug si suben dos veces**.

---

## 4. Items — `src/data/items.ts`

### Para qué sirven
Catálogo de 50 items en MVP (biblia §4.12, scope §1.6). Cubren armas, armaduras, consumibles, materiales, libros de receta, misceláneos.

### Shape
Definida en [src/rules/inventory.ts](src/rules/inventory.ts) como `Item`. Resumen:
```ts
{
  id: string;                                  // 'arma_espada_corta'
  name: string;                                // 'Espada corta'
  category: 'weapon'|'armor'|'consumable'|'material'|'recipe_book'|'misc';
  rarity: 'common'|'uncommon'|'rare'|'epic'|'legendary';
  slot: EquipmentSlot | null;                  // null si no es equipable
  stack_size: number;                          // 1 si no apilable
  max_durability: number | null;               // null si no se desgasta
  weight: number;
  stats: ItemStats;                            // bonos / daño base / weapon_skill / weapon_attribute
}
```

### Reglas duras (cazadas por test)
- **Items con `max_durability !== null` → `stack_size === 1` obligatorio.** Si añades durabilidad, deja stack 1.
- **Items con `category === 'weapon'` → `stats.weapon_damage`, `stats.weapon_skill`, `stats.weapon_attribute` deben estar.** Sin esos tres, el motor de combate no puede construir el pool.
- **Items con `slot !== null` → categoría `weapon` o `armor`.** Un consumible no se equipa.
- **Items con `category === 'armor'` → `stats.defense_bonus` debe estar (incluso si es 0 deliberadamente).**
- **`weight ≥ 0` siempre.** Items "ingrávidos" usan 0, no negativo.
- **`stack_size ≥ 1`.**

### Convenciones de nombrado de id
| Categoría | Prefijo |
|---|---|
| weapon | `arma_` |
| armor | `arm_` |
| consumable | `con_` |
| material | `mat_` |
| recipe_book | `lib_` |
| misc | `mis_` |

Ejemplos: `arma_espada_corta`, `arm_torso_cota_malla`, `con_pocion_curacion_menor`, `mat_hierro_bruto`, `lib_recetas_basicas`, `mis_llave_oxidada`.

### Decisiones provisionales (atención al cerrar H5)
- El sistema de carga (peso → penalizadores) no está cerrado. Pesa los items con sentido relativo (un yelmo pesa más que una flecha) sin perseguir un número exacto.
- Los bonificadores de atributo (`attribute_bonus`) sí respetan el cap absoluto en runtime, pero por ahora **no se ha decidido si los items legendarios podrán superarlo**. Diseña como si no.

### Pegas a evitar
- **No crear 5 espadas idénticas con +1/+2/+3 de daño.** Aburrido. Cada item de rareza superior debe ofrecer un *gancho mecánico* (no solo número), aunque sea pequeño (vampírica, +crítico, ignora 1 punto de DEF).
- **No saturar de consumibles redundantes.** Pociones de curación pequeña/media/grande sí. Cinco hierbas que curan 1 HP cada una no.

---

## 5. Recetas — `src/data/recipes.ts`

### Para qué sirven
30-50 recetas de crafteo. La UI muestra `success/critical/failure` como porcentajes antes de craftear. La cadena de hasta 3 recetas en un clic se compone en runtime; aquí sólo declaras cada receta.

### Shape
Definida en [src/rules/crafting.ts](src/rules/crafting.ts) como `Recipe`.
```ts
{
  id: string;                              // 'rec_pocion_curacion_menor'
  resources: { [itemId]: number };         // input: ids de items.ts -> cantidad
  skill_check: { skill: string; difficulty: number };
  station: string | null;                  // 'forja' | 'alquimia' | null
  time_hours: number;                      // se ignora en MVP (instantáneo). Pon 0.
  outputs: {
    success: { item: string; quantity: number };
    critical: { item: string; quantity: number } | null;
    failure: { resources_lost: number; time_lost: number } | null;
  };
}
```

### Reglas duras
- **Todas las `resources` deben referenciar items que existen en `items.ts`.**
- **`outputs.success.item` debe existir en `items.ts`.**
- **`skill_check.skill` debe existir en `skills.ts`.**
- **`station` puede ser cualquier string id**; el catálogo de stations es contenido aparte (en H6 lo cierras).
- **`failure.resources_lost ∈ [0, 1]`** — fracción de recursos consumidos. 0 = se devuelven todos, 1 = se pierden todos.

### Convenciones
| Caso | Convención |
|---|---|
| ID | `rec_<output_short>` (ej. `rec_pocion_curacion_menor`). |
| Crítico | Si la receta no premia el crítico con algo distintivo, déjalo en `null`. No metas crítico = success x2 por defecto si no aporta. |
| Failure | Para recetas con ingredientes baratos, `resources_lost = 0.5` está bien. Para recetas legendarias, `resources_lost = 0` o `0.25` (no castigues al jugador por intentar). |
| Difficulty | Si el jugador puede llegar con la habilidad en 3-4 al MVP medio, ajusta `difficulty` para que el éxito esté en torno al 70-80%. Recetas raras pueden quedar en 50-60%. |

### Pegas a evitar
- **No crear recetas circulares** (A → B y B → A) sin una pérdida real entremedias. El jugador puede grindear al infinito.
- **No subestimar el coste real.** Si una receta consume 5 hierros y produce 1 espada, asegúrate de que el flujo de hierros del juego permita esa economía. Si no, frustración.
- **Libros de receta:** crea el ítem `lib_recetas_x` en items.ts y, en runtime, su uso desbloquea las recetas que correspondan. La asociación libro→recetas se redacta como tabla aparte (`data/recipe-books.ts`) cuando llegues a H6.

---

## 6. Enemigos — `src/data/enemies.ts`

### Para qué sirven
Catálogo de 10 tipos en MVP, con variantes (biblia §4.13). Los consume `combat.ts` directamente.

### Shape
Definida en [src/rules/combat.ts](src/rules/combat.ts) como `Enemy`.
```ts
{
  id: string;                  // 'enm_lobo_yermo'
  name: string;                // 'Lobo del yermo'
  level: number;
  attack_pool: number;         // dados que tira al atacar
  defense_threshold: number;   // éxitos que pide para ser impactado
  weapon_damage: number;       // daño base si impacta
  initiative_base: number;     // se suma a 1d20 para iniciativa
  hp_max: number;
}
```

**Diferencia clave con el PJ:** los enemigos NO tienen atributos ni habilidades. Sus stats están agregados directamente. Esto simplifica balance y simulación masiva (Modo Privado).

### Tabla de referencia (orientativa)
Para que tengas un anclaje sin tener que adivinar, calibra a esta escala mental:

| Nivel | hp_max | attack_pool | defense_threshold | weapon_damage | initiative_base |
|---|---|---|---|---|---|
| 1 (rata, novato) | 6-10 | 2-3 | 1-2 | 1-2 | 0-2 |
| 3 (lobo, bandido) | 14-22 | 4-5 | 2-3 | 2-4 | 2-4 |
| 5 (oso, sicario) | 28-40 | 6-7 | 3-4 | 4-6 | 3-5 |
| 8 (jefe menor) | 50-70 | 7-8 | 4-5 | 6-9 | 4-6 |
| 10+ (jefe mayor) | 80-150 | 8-10 | 5-6 | 8-12 | 5-7 |

Los números se validan en simulación masiva (Modo Privado, H8). Hasta entonces, esta tabla es la referencia.

### Variantes
Para crear "Lobo gris" y "Lobo alfa":
- Dos entradas distintas en el catálogo (ids `enm_lobo_gris`, `enm_lobo_alfa`).
- El nombre y los stats varían; el "tipo conceptual" se gestiona en runtime (ej. tabla de loot común).
- **No abuses de variantes triviales.** Si la única diferencia es +5 HP, plantéate si vale la pena.

### Convenciones
| Caso | Convención |
|---|---|
| ID | `enm_<nombre_corto>` (ej. `enm_lobo_alfa`). |
| `name` | Castellano, mayúscula inicial sólo en la primera palabra. |
| Variantes con suffix de tier | `_alfa`, `_jefe`, `_elite`, `_corrupto`. |

### Pegas a evitar
- **No mezclar atributos de PJ con enemigos.** Se simplificaron deliberadamente. Si un enemigo necesita "stat de DEX", traduce a `defense_threshold` o `initiative_base` y ya.
- **No olvidar `initiative_base = 0` para criaturas lentas.** El sistema lo soporta y crea contraste interesante.

---

## 7. NPCs — `src/data/npcs.ts`

### Para qué sirven
NPCs no hostiles para mapa de historia y nodos-ciudad procedurales. Cada uno tiene lista de temas (estilo Morrowind, no árboles).

### Shape
Definida en [src/rules/dialog.ts](src/rules/dialog.ts) como `Npc`.
```ts
{
  id: string;                       // 'npc_herrero_aldea_norte'
  name: string;                     // 'Berto el herrero'
  portrait_id: string;              // id de portraits.ts
  faction_id: string | null;        // id de facción si pertenece
  topics: DialogTopic[];            // hasta 6 visibles con scroll
  shop_inventory_id: string | null; // id en data/shops.ts si comercia, null si no
}
```

### Topics
Cada tema:
```ts
{
  id: string;                       // 'top_rumores_yermo'
  label: string;                    // 'Rumores del yermo' (visible en menú)
  response: string;                 // texto base del NPC
  conditions: TopicConditions;      // gating por flags/reputación/tier
  social_check: SocialCheck | null; // si requiere tirada (Persuasión/Intimidar)
}
```

### Reglas
- **`portrait_id` debe existir en `portraits.ts`.**
- **`faction_id`, si no es null, debe existir en `factions.ts`.**
- **Un NPC con `shop_inventory_id` puede no tener temas (NPC puramente comercial), pero tener un topic "Comercio" que abra la tienda es buena UX.**
- **Si un topic tiene `social_check`, asegúrate de declarar `on_success_response` y `on_failure_response`.** Si los dejas null, el motor cae al `topic.response` base — útil cuando la consecuencia es solo la flag, no el texto.

### Pegas a evitar
- **No usar más de 6 topics por NPC.** El scroll existe pero la UI los pinta como lista plana — más de 6 satura.
- **No hardcodear nombres de NPCs en flags.** Las flags son globales (`completo_quest_herrero`, no `berto_dijo_si`). Si renombras al NPC, las flags se quedan.

---

## 8. Facciones — `src/data/factions.ts`

### Para qué sirven
3 facciones en MVP con reputación numérica (biblia §4.11). Cambian comportamiento de NPCs, gating de topics, peligro de tramos de viaje rápido.

### Shape
```ts
{
  id: string;                  // 'fac_libres_del_norte'
  name: string;                // 'Libres del Norte'
  starting_reputation: number; // típicamente 0
}
```

### Tiers (FIJOS, no se redactan por facción)
Definidos en [src/rules/faction.ts](src/rules/faction.ts):
- `hated`: < -50
- `unfriendly`: -50 a -10
- `neutral`: -10 a 10
- `friendly`: 10 a 50
- `honored`: > 50

No los toques desde data. Si una facción "siempre arranca friendly", pon `starting_reputation: 30`.

### Pegas a evitar
- **3 facciones, no 4.** El scope lo cierra. Ideas para v1.1.
- **No facciones espejadas.** "Buenos vs Malos" es plano. Mejor tres ejes en tensión: una conservadora, una progresista, una pragmática (por ejemplo). Que apoyar a una mueva la otra naturalmente.

---

## 9. Logros — `src/data/achievements.ts`

### Para qué sirven
15 logros en MVP. Cada uno tiene un `predicate` que recibe el personaje + un trigger y devuelve true si se desbloquea.

### Shape
Definida en [src/rules/achievements.ts](src/rules/achievements.ts):
```ts
{
  id: string;                       // 'log_primer_combate'
  title: string;                    // 'Primera sangre'
  description: string;              // visible
  predicate: (character, trigger) => boolean;
}
```

### Triggers disponibles (cierran cada hito)
- `combat_won` (H3)
- `enemy_killed` (H3)
- `biome_visited` (H4)
- `node_discovered` (H4)
- `craft_completed` (H6)
- `recipe_discovered` (H6)
- `level_reached` (H7)
- `death` (H10 / siempre)

Si tu logro necesita un trigger nuevo, **toca código** (extender `AchievementTriggerKind`). No metas predicates que asumen un kind inexistente.

### Patrón de redacción
```ts
{
  id: 'log_primera_receta_descubierta',
  title: 'Mano de alquimista',
  description: 'Descubre tu primera receta combinando materiales.',
  predicate: (_character, trigger) =>
    trigger.kind === 'recipe_discovered',
}
```

### Pegas a evitar
- **No hagas logros que requieran consultar histórico.** El predicate solo ve el `Character` actual y el `trigger`. Si necesitas "muere 3 veces", o lo cuentas en `character.flags.death_count` o no se puede.
- **15 exactos en MVP.** Si tienes 20 buenos, descarta los 5 peores.

---

## 10. Retratos — `src/data/portraits.ts`

### Para qué sirven
12 retratos fijos en grid (scope §1.3). El jugador elige uno al crear personaje. NPCs también referencian.

### Shape
```ts
export interface PortraitDefinition {
  id: string;       // 'portrait_01' ... 'portrait_12' al inicio
  name: string;     // visible (puede coincidir con id en H2)
  asset_path: string; // ruta al asset; en H2, color hex placeholder
}
```

### Convenciones
- **IDs neutros (`portrait_01`...`portrait_12`).** Sin sesgo de género/edad/etnia (decisión scope).
- **12 exactos.** Ni 10 ni 16.
- **Estilo visual uniforme.** Si en H9 son ilustraciones, todas lo son. Si son píxel art, todas. No mezcles.

### Pegas a evitar
- **No usar nombres de NPCs como id de retrato.** Un retrato es un asset, no una identidad. Si "Berto el herrero" usa `portrait_07`, mañana otro NPC también puede usarlo.

---

## 11. Tablas de exploración — `src/data/exploration/<bioma>.ts`

### Para qué sirven
Una tabla por bioma. Cada entrada describe un evento posible y, si aplica, su tirada reactiva. Se redactan en H4 (5 biomas: llanura, bosque, desierto, glaciar, ruinas arcanas).

### Shape
Definida en [src/rules/exploration.ts](src/rules/exploration.ts) como `BiomeTable` con `TableEntry[]`. Es **el catálogo más rico del juego** y merece sección propia.

### Cada entrada (`TableEntry`)
```ts
{
  id: string;                              // 'expl_bosque_lobos_solitarios'
  biome: 'bosque',                         // debe coincidir con el archivo
  weight: number,                          // peso base (sugerencia: 1-100, ratio interno relativo)
  conditions: TableConditions,             // filtra elegibilidad
  type: EventType,                         // 'combat'|'npc'|'discovery'|'trap'|'environmental'|'poi'|'narrative'|'ambush'|'shelter'|'nothing'
  payload: { ... },                        // datos específicos del evento (enemy_id si type=combat, etc.)
  evade_check: EvadeCheck | null,          // tirada reactiva de mitigación
  weight_modifiers?: WeightModifier[],     // moduladores opcionales del peso por contexto
}
```

### Conditions disponibles
- `min_level` / `max_level` (inclusive)
- `time_of_day` (lista de `'dawn'|'day'|'dusk'|'night'`; omite para aceptar todas)
- `weather` (lista; usa `'any'` como comodín explícito)
- `required_flags` / `forbidden_flags`

### Modificadores de peso (`WeightModifier`)
Cada modulador es un multiplicador condicionado. Si NO se cumple su condición, no se aplica. Si se cumple, se multiplica al peso base.
- `if_time_of_day`, `if_weather`
- `if_min_reputation` / `if_max_reputation` con facción
- `if_min_luck` / `if_max_luck`
- `factor` (1 = sin cambio, 0 = apaga, >1 sube, <1 baja)

### evade_check (tirada reactiva, biblia §4.15.6-§4.15.9)
```ts
{
  skill: 'sigilo',                  // habilidad que se tira
  difficulty: 12,                    // DIF si opposed=false
  opposed: false,                    // true: usa stat del payload
  opposed_stat: 'rival_perception',  // sólo si opposed=true; nombre de campo en payload
  cost: { type: 'free' | 'action_point' | 'consumable', ... },
  on_success: { outcome: 'avoid_combat', ... },
  on_critical: { outcome: 'flee_with_loot', ... },
  on_failure: { outcome: 'engage_combat', ... },
  on_fumble: null,                   // null si type no es combat/ambush/trap
  auto: false,                       // true: se resuelve sin botón
  trains_skill: true,                // suma usage gane o pierda (decisión E4)
  fallback_check: null,              // sólo en trampas: encadenar segundo check
}
```

### Reglas duras
- **`biome` del entry debe coincidir con el del archivo.** Si rompes esto, `rollExplorationTick` lanza.
- **`weight ≥ 0`.** Negativos se tratan como 0 al calcular pesos efectivos.
- **`opposed=true` exige `opposed_stat` declarado**, y ese stat debe existir como número en `payload`. Si no resuelve, cae a DIF=10 y el resultado se marca como `'opposed_fallback'` (sirve para detectar bugs en el Modo Privado).
- **`on_fumble` solo en `type` `combat`, `ambush`, `trap`.** En el resto, déjalo `null` o el motor lo ignora.
- **`fallback_check` solo en `type === 'trap'`** (cascada §4.15.7).
- **Trampas no matan.** Si la entrada es `type === 'trap'` y la consecuencia es daño, asegura que el motor garantiza mínimo 1 HP — pero no metas en el payload "damage: 999".
- **Si una habilidad no existe en el personaje, se trata como nivel 0** (no falla, simplemente no suma a la tirada).

### Convenciones
| Caso | Convención |
|---|---|
| ID | `expl_<bioma>_<descripcion_corta>` |
| Pesos relativos | Para legibilidad: piensa pesos como porcentajes aproximados sobre el total del bioma. Una "Nada" con peso 30 es deliberada. |
| Eventos `type: 'nothing'` | Sí, redáctalos. Sirven para hacer respiraderos en biomas tranquilos. |

### Pegas a evitar
- **No diseñar tablas en las que ningún evento es elegible** en condiciones comunes (suma de pesos efectivos = 0). El motor devuelve `entry: null` y la UI muestra "Nada", lo que está bien — pero si pasa el 90% del tiempo es bug de tabla.
- **No olvidar que el dado es 1d20.** Tablas con 50 entradas equiprobables funcionan estadísticamente, pero la traza pierde legibilidad. Mejor 8-15 entradas con pesos diferenciados.
- **No duplicar entradas para "subir probabilidad".** Sube el `weight`, no metas dos entradas iguales.
- **No referenciar `enemy_id` que no exista** en `enemies.ts`. El test debería cazarlo, pero ahorra el rebote.

### Mínimo viable por bioma para H4
Como referencia, una tabla decente tiene:
- 1-2 entradas `nothing` (respirar).
- 2-3 entradas `combat` con enemigos del nivel del bioma.
- 1-2 entradas `discovery` (loot suelto, herbales).
- 1 entrada `trap` (con `fallback_check`).
- 1 entrada `npc` (encuentro).
- 1 entrada `shelter` (acampar).
- 1-2 entradas `narrative` o `environmental` (ambiente).
- 1 entrada `ambush` opcional (tensión).

Total: 10-12 entradas por bioma × 5 biomas = 50-60 entradas para MVP. Trabajo serio pero acotado.

---

## 12. Stations de crafteo — `src/data/stations.ts`

### Para qué sirven
Lugares donde se craftean recetas que requieren station (forja, alquimia, etc.). Las recetas referencian station por id; este catálogo documenta qué stations existen y dónde se encuentran.

### Shape
```ts
export interface StationDefinition {
  id: string;                  // 'forja'
  name: string;                // 'Forja de herrero'
  description: string;
}
```

Las **ubicaciones** de cada station (en qué nodos del mapa están) se redactan junto al mapa en H4, no aquí.

---

## 13. Plantilla de archivo de catálogo

Cuando arranques un catálogo nuevo, parte de esta plantilla. Sustituye `Skill` por la entidad que toque.

```ts
// src/data/skills.ts
// Catálogo del MVP. Inmutable post-publicación: cambiar IDs aquí rompe partidas guardadas.

import type { AttributeId } from '../rules/character';

export interface SkillDefinition {
  id: string;
  name: string;
  attribute: AttributeId;
  description: string;
}

export const SKILLS: readonly SkillDefinition[] = [
  {
    id: 'sigilo',
    name: 'Sigilo',
    attribute: 'des',
    description: 'Moverte sin ser detectado. Se tira para evitar emboscadas y colarte por delante de centinelas.',
  },
  // ...
] as const;

// Lookup por id. Lo construye el módulo al cargar; no se redacta a mano.
export const SKILLS_BY_ID: Readonly<Record<string, SkillDefinition>> =
  Object.fromEntries(SKILLS.map((s) => [s.id, s]));
```

Y un test mínimo en `src/data/skills.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SKILLS, SKILLS_BY_ID } from './skills';

describe('catálogo de habilidades', () => {
  it('no tiene IDs duplicados', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('SKILLS_BY_ID indexa cada entrada', () => {
    for (const s of SKILLS) {
      expect(SKILLS_BY_ID[s.id]).toBe(s);
    }
  });

  it('toda habilidad declara un atributo válido', () => {
    const valid = ['fue', 'des', 'con', 'int', 'vol'];
    for (const s of SKILLS) {
      expect(valid).toContain(s.attribute);
    }
  });
});
```

---

## 14. Flujo cuando añades una entrada nueva

1. **Lee la sección de este documento** para la entidad que vas a tocar.
2. **Mira la última entrada del catálogo** para coger tono y formato.
3. **Inventa el id** siguiendo la convención de prefijos.
4. **Redacta los campos.** Si dudas en un número, mira la tabla de referencia o usa el patrón "como otra entrada similar".
5. **Lanza los tests:** `npm test`. Si falla por shape, lo arreglas. Si falla por invariante (suma > 12, etc.), revisa el contenido.
6. **Si has cruzado catálogos** (un perk que cita una habilidad, un enemy que va a una tabla de exploración), comprueba que ambos lados están alineados.
7. **Commit con mensaje descriptivo** (tu regla: pides OK explícito por commit).

---

## 15. Cuándo NO redactar contenido

Hay momentos en los que el dato puede esperar:

- **Si el módulo de reglas que lo consume todavía marca `PROVISIONAL Hx`,** redactar contenido fino antes es trabajo perdido. Redacta lo mínimo para validar el flujo y déjalo crecer cuando el módulo cierre.
- **Si dudas entre 5 opciones de diseño,** redacta una de prueba, juégala, y entonces cierra el resto.
- **Si una decisión de scope no está cerrada** (ej. "¿qué hace exactamente la habilidad Voluntad ante un control mental?"), no la redactes adivinando: marca el hueco con `// TODO: cerrar antes de H7` y sigue.

---

## 16. Archivos planeados (referencia)

A medida que vayas redactando, estos archivos van apareciendo:

| Archivo | Hito en que se cierra | Estado |
|---|---|---|
| `src/data/skills.ts` | H2 | por crear |
| `src/data/archetypes.ts` | H2 | por crear |
| `src/data/perks.ts` | H2 (5 iniciales) + H7 (árbol) | por crear |
| `src/data/portraits.ts` | H2 (placeholders) + H9 (definitivos) | por crear |
| `src/data/items.ts` | H5 (50 items) | por crear |
| `src/data/recipes.ts` | H6 (30-50 recetas) | por crear |
| `src/data/recipe-books.ts` | H6 | por crear |
| `src/data/stations.ts` | H6 | por crear |
| `src/data/enemies.ts` | H7 (10 tipos + variantes) | por crear |
| `src/data/npcs.ts` | H7 + ampliación en H4 (mapa de historia) | por crear |
| `src/data/factions.ts` | H7 (3 facciones) | por crear |
| `src/data/achievements.ts` | H7 (15 logros) | por crear |
| `src/data/exploration/llanura.ts` | H4 | por crear |
| `src/data/exploration/bosque.ts` | H4 | por crear |
| `src/data/exploration/desierto.ts` | H4 | por crear |
| `src/data/exploration/glaciar.ts` | H4 | por crear |
| `src/data/exploration/ruinas_arcanas.ts` | H4 | por crear |

---

## 17. Si te bloqueas

- **Duda sobre un número:** abre el módulo de reglas que lo consume. Probablemente esté el rango razonable comentado o un `PROVISIONAL Hx` que te dice si te puedes mover libremente.
- **Duda sobre si dos entidades chocan:** lanza los tests. Si pasan, no chocan.
- **Duda sobre alcance:** vuelve a [scope-mvp-web-v0.1.md](scope-mvp-web-v0.1.md) §1 y §2. Si no está en §1, no lo redactes para MVP.
- **Duda de diseño profundo:** abre conversación nueva con el director y pásale el fragmento concreto.

Esta guía no cubre todos los matices: cubre los que ya conocemos. Cuando aparezca un caso nuevo, se añade aquí y se arregla.
