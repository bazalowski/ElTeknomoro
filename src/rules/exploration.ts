// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.15 entera. H1.
//
// Dos funciones públicas:
//   - rollExplorationTick: dado un mundo + personaje + disparador + tabla del
//     bioma, selecciona un evento (1d20 sobre rangos proporcionales a pesos
//     filtrados y modulados).
//   - resolveEvadeCheck: dada una entrada con evade_check, ejecuta la tirada
//     reactiva (1d20 fija o enfrentada, 20 crítico, 1 pifia donde aplica,
//     cascada en trampas).

import type { Rng } from './dice';
import { rollD20 } from './dice';
import type { Character } from './character';

// -----------------------------------------------------------------------------
// Tipos públicos
// -----------------------------------------------------------------------------

export type EventType =
  | 'combat'
  | 'npc'
  | 'discovery'
  | 'trap'
  | 'environmental'
  | 'poi'
  | 'narrative'
  | 'ambush'
  | 'shelter'
  | 'nothing';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

// "any" es comodín: la entrada acepta cualquier valor de esa variable.
export type WeatherTag = 'clear' | 'fog' | 'storm' | 'snow' | 'any';

export type BiomeId = string;

// Condiciones de elegibilidad de una entrada. Todas son AND. min_level y
// max_level son inclusivos. weather acepta 'any' como comodín explícito.
// time_of_day no tiene comodín: omite el campo si quieres aceptar todas las
// horas, o lista las cuatro.
export interface TableConditions {
  min_level?: number;
  max_level?: number;
  time_of_day?: readonly TimeOfDay[];
  weather?: readonly WeatherTag[];
  required_flags?: readonly string[];
  forbidden_flags?: readonly string[];
}

// Coste declarado por la evade_check.
export type EvadeCost =
  | { type: 'free' }
  | { type: 'action_point'; amount: number }
  | { type: 'consumable'; amount: number; item_id: string };

// Outcome de cada rama de la evade_check. La biblia §4.15.7 enumera los modos
// posibles; mantenemos el string libre para no inventar un enum cerrado antes
// de tiempo (lo consume combat.ts/UI según el caso).
export interface EvadeOutcome {
  outcome: string;
  bonus?: { type: string; value: number | string } | null;
  penalty?: { type: string; value: number | string } | null;
}

export interface EvadeCheck {
  skill: string;
  difficulty: number;
  opposed: boolean;
  // Solo se usa si opposed === true.
  opposed_stat?: string;
  cost: EvadeCost;
  on_success: EvadeOutcome;
  on_critical: EvadeOutcome;
  on_failure: EvadeOutcome;
  // null si el tipo no aplica pifia (todo lo que no sea combat/ambush/trap).
  on_fumble: EvadeOutcome | null;
  // true: se resuelve sin preguntar al jugador. false: ofrece botón [Intentar].
  auto: boolean;
  // Acumula en skills.{skill}.usage tras resolver. Decisión E4 de §4.15.6.
  trains_skill: boolean;
  // Cascada solo en Trampa (§4.15.7). Si la primaria falla, se ofrece esta.
  fallback_check: EvadeCheck | null;
}

// Modulaciones declarativas opcionales que una entrada puede aplicar a su
// propio peso. Cada modulador es un multiplicador (1.0 = sin cambio) que se
// activa solo si la condición se cumple en el worldState/character.
//
// La biblia §4.15.2 menciona las 7 variables como moduladoras de pesos pero no
// fija fórmula de modulación. Esta API permite declararlo por entrada sin
// inventar una curva global. Si una entrada no declara modificadores, su peso
// no cambia. Numéricamente las tablas viven en H4.
export interface WeightModifier {
  // Cualquiera de estos campos. Si está, debe matchear para aplicar el factor.
  if_time_of_day?: readonly TimeOfDay[];
  if_weather?: readonly WeatherTag[];
  if_min_reputation?: { faction_id: string; value: number };
  if_max_reputation?: { faction_id: string; value: number };
  if_min_luck?: number;
  if_max_luck?: number;
  // Multiplicador. 1 = sin cambio. 0 = apaga la entrada (forma idiomática de
  // decir "no aplica en estas condiciones"). Negativo se trata como 0 en
  // computeEffectiveWeight. >1 sube probabilidad relativa.
  factor: number;
}

export interface TableEntry {
  id: string;
  biome: BiomeId;
  weight: number;
  conditions: TableConditions;
  type: EventType;
  payload: Readonly<Record<string, unknown>>;
  evade_check: EvadeCheck | null;
  weight_modifiers?: readonly WeightModifier[];
}

export interface BiomeTable {
  biome: BiomeId;
  entries: readonly TableEntry[];
}

// Estado del mundo que rodea al personaje en el momento de la tirada. Lo
// rellena state/world.ts (H4). En H1 lo usamos como contrato.
export interface WorldState {
  biome: BiomeId;
  time_of_day: TimeOfDay;
  weather: WeatherTag;
  // Reputación con cualquier facción que el mundo conozca.
  faction_reputation: Readonly<Record<string, number>>;
  // Banderas narrativas activas.
  flags: Readonly<Record<string, boolean>>;
  // Suerte agregada del personaje resuelta para este tick. Bloqueante: la
  // biblia §6 deja la definición de "Suerte" abierta. exploration.ts solo la
  // consume como número; la procedencia (atributo, oculto, consumible) la
  // resuelve quien construye el WorldState.
  luck: number;
}

export type Trigger =
  | 'step_tile'
  | 'enter_node'
  | 'cross_biome'
  | 'camp'
  | 'fast_travel_segment';

// Detalle de una tirada concreta (raíz o reactiva). Sirve para log y replay.
export interface RollDetail {
  // 1d20.
  die: number;
  // Total final tras sumar mods (en raíz no aplica; en reactiva = die + skill).
  total: number;
  // Crítico (die === 20).
  critical: boolean;
  // Pifia (die === 1).
  fumble: boolean;
}

// Pareja entrada + peso final tras filtrado y modulación. Útil para tests y
// para el Modo Privado de §4.14.
export interface WeightedEntry {
  entry: TableEntry;
  weight: number;
}

export interface ExplorationEvent {
  // null = "Nada" (la tabla del bioma no devolvió entradas elegibles, o la
  // entrada elegida es del tipo 'nothing'). El consumidor decide cómo pintar.
  entry: TableEntry | null;
  trigger: Trigger;
  // Tirada raíz que produjo el evento.
  root_roll: RollDetail;
  // Pesos efectivos en el momento de la elección. Para auditoría/log.
  weighted_entries: readonly WeightedEntry[];
}

export type EvadeOutcomeBranch = 'success' | 'critical' | 'failure' | 'fumble';

// Cómo se resolvió la dificultad de esta tirada. Útil para auditar tablas:
// - 'fixed': la entrada declara opposed=false, se usó check.difficulty.
// - 'opposed': opposed=true y opposed_stat resuelto a número en el payload.
// - 'opposed_fallback': opposed=true pero opposed_stat ausente, no nombrado o
//   no numérico. Cayó al fallback DIF=10. La simulación masiva de §4.14 debe
//   contar estos casos: si una tabla de producción los genera, hay bug de
//   datos (typo en opposed_stat, payload mal montado, etc.).
export interface OpposedResolution {
  mode: 'fixed' | 'opposed' | 'opposed_fallback';
  difficulty: number;
  // Solo presente en 'opposed': nombre del campo del payload que se leyó y
  // valor encontrado.
  stat_name?: string;
  stat_value?: number;
}

export interface EvadeResult {
  // El resultado decidido tras tirar. 'fumble' solo en eventos donde aplica.
  branch: EvadeOutcomeBranch;
  outcome: EvadeOutcome;
  roll: RollDetail;
  // Cómo se resolvió la dificultad. Auditable.
  opposed_resolved: OpposedResolution;
  // Coste efectivo aplicado (se replica para que el consumidor no lo recalcule).
  applied_cost: EvadeCost;
  // Si el evade primario falló y la entrada declara fallback_check (Trampa),
  // el resultado de la cascada se anida aquí.
  cascade: EvadeResult | null;
  // Skill que entrenó la tirada (decisión E4: gane o pierda). null si la
  // entrada declara trains_skill === false.
  trained_skill: string | null;
}

// -----------------------------------------------------------------------------
// Filtrado por condiciones
// -----------------------------------------------------------------------------

export function isEntryEligible(
  entry: TableEntry,
  character: Character,
  worldState: WorldState,
): boolean {
  if (entry.biome !== worldState.biome) return false;

  const c = entry.conditions;

  if (c.min_level !== undefined && character.level < c.min_level) return false;
  if (c.max_level !== undefined && character.level > c.max_level) return false;

  // time_of_day: si la lista existe y no está vacía, debe contener el valor
  // actual. No hay valor comodín ('any') en este enum: si quieres aceptar
  // todos, omites el campo o pasas la lista completa.
  if (
    c.time_of_day !== undefined &&
    c.time_of_day.length > 0 &&
    !c.time_of_day.includes(worldState.time_of_day)
  ) {
    return false;
  }

  // weather: 'any' actúa como comodín explícito (lo usan las tablas de §4.15.9).
  if (c.weather !== undefined && c.weather.length > 0) {
    if (!c.weather.includes('any') && !c.weather.includes(worldState.weather)) {
      return false;
    }
  }

  if (c.required_flags !== undefined) {
    for (const flag of c.required_flags) {
      if (!worldState.flags[flag]) return false;
    }
  }
  if (c.forbidden_flags !== undefined) {
    for (const flag of c.forbidden_flags) {
      if (worldState.flags[flag]) return false;
    }
  }

  return true;
}

export function filterEligibleEntries(
  table: BiomeTable,
  character: Character,
  worldState: WorldState,
): TableEntry[] {
  return table.entries.filter((e) => isEntryEligible(e, character, worldState));
}

// -----------------------------------------------------------------------------
// Modulación de pesos
// -----------------------------------------------------------------------------

function modifierApplies(
  mod: WeightModifier,
  worldState: WorldState,
): boolean {
  if (mod.if_time_of_day !== undefined && !mod.if_time_of_day.includes(worldState.time_of_day)) {
    return false;
  }
  if (mod.if_weather !== undefined) {
    if (!mod.if_weather.includes('any') && !mod.if_weather.includes(worldState.weather)) {
      return false;
    }
  }
  if (mod.if_min_reputation !== undefined) {
    const rep = worldState.faction_reputation[mod.if_min_reputation.faction_id] ?? 0;
    if (rep < mod.if_min_reputation.value) return false;
  }
  if (mod.if_max_reputation !== undefined) {
    const rep = worldState.faction_reputation[mod.if_max_reputation.faction_id] ?? 0;
    if (rep > mod.if_max_reputation.value) return false;
  }
  if (mod.if_min_luck !== undefined && worldState.luck < mod.if_min_luck) return false;
  if (mod.if_max_luck !== undefined && worldState.luck > mod.if_max_luck) return false;
  return true;
}

export function computeEffectiveWeight(
  entry: TableEntry,
  worldState: WorldState,
): number {
  let weight = entry.weight;
  if (entry.weight_modifiers === undefined) return weight;
  for (const mod of entry.weight_modifiers) {
    if (modifierApplies(mod, worldState)) {
      weight *= mod.factor;
    }
  }
  // Las tablas pueden, intencional o accidentalmente, dejar un peso negativo.
  // El selector trata negativos y ceros igual: no elegibles.
  return weight < 0 ? 0 : weight;
}

export function computeWeightedEntries(
  entries: readonly TableEntry[],
  worldState: WorldState,
): WeightedEntry[] {
  return entries.map((entry) => ({
    entry,
    weight: computeEffectiveWeight(entry, worldState),
  }));
}

// -----------------------------------------------------------------------------
// Selector por 1d20 sobre rangos proporcionales (§4.15.4)
// -----------------------------------------------------------------------------

// Mapea el d20 a una entrada según rangos proporcionales al peso efectivo.
// Devuelve null si no hay entradas con peso > 0.
//
// La biblia §4.15.4 dice "los pesos se normalizan a rangos sobre 20". Eso es
// equivalente a tirar el d20, multiplicar por la suma de pesos, dividir entre
// 20 y elegir la entrada cuyo rango acumulado contiene el resultado. Este
// método usa la posición del d20 directamente para mantener la traza visible.
//
// Exportado para que las herramientas dev de §4.14 (simular 1.000 tiradas,
// ver tabla activa con pesos resueltos) puedan auditarlo aislado.
export function selectByD20(
  weighted: readonly WeightedEntry[],
  die: number,
): TableEntry | null {
  if (!Number.isInteger(die) || die < 1 || die > 20) {
    throw new RangeError(`selectByD20: die debe ser entero en [1, 20], recibido ${die}`);
  }
  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  if (total <= 0) return null;
  // Posición dentro de [0, total) según el d20. die ∈ 1..20.
  // Usamos (die - 0.5)/20 para que cada cara mapee al centro de su rango y no
  // haya colisión en los extremos.
  const cursor = ((die - 0.5) / 20) * total;
  let acc = 0;
  for (const w of weighted) {
    if (w.weight <= 0) continue;
    acc += w.weight;
    if (cursor < acc) return w.entry;
  }
  // Por redondeo de coma flotante el cursor podría caer justo en el total.
  // Devolvemos la última entrada con peso > 0 como fallback determinista.
  for (let i = weighted.length - 1; i >= 0; i--) {
    const w = weighted[i];
    if (w !== undefined && w.weight > 0) return w.entry;
  }
  return null;
}

// -----------------------------------------------------------------------------
// rollExplorationTick — orquestador raíz
// -----------------------------------------------------------------------------

export function rollExplorationTick(
  worldState: WorldState,
  character: Character,
  trigger: Trigger,
  table: BiomeTable,
  rng: Rng,
): ExplorationEvent {
  if (table.biome !== worldState.biome) {
    throw new Error(
      `rollExplorationTick: bioma de la tabla (${table.biome}) no coincide con worldState.biome (${worldState.biome}).`,
    );
  }
  const eligible = filterEligibleEntries(table, character, worldState);
  const weighted = computeWeightedEntries(eligible, worldState);
  const die = rollD20(rng);
  const root_roll: RollDetail = {
    die,
    total: die,
    critical: die === 20,
    fumble: die === 1,
  };
  const entry = selectByD20(weighted, die);
  return { entry, trigger, root_roll, weighted_entries: weighted };
}

// -----------------------------------------------------------------------------
// resolveEvadeCheck — tirada reactiva
// -----------------------------------------------------------------------------

// Tipos en los que aplica pifia mecánica. §4.15.6: combate, emboscada, trampa.
const TYPES_WITH_FUMBLE: ReadonlySet<EventType> = new Set(['combat', 'ambush', 'trap']);

// Resuelve la dificultad efectiva de una evade_check y reporta cómo lo hizo.
// Biblia §4.15.6: "vs stat del evento" para enfrentadas; el payload de la
// entrada declara qué stat representa al rival. En H1 no hay enemigos reales
// (combat.ts/H3 los proveerá); el payload es la fuente.
//
// Si opposed=true pero opposed_stat no resuelve (ausente, mal nombrado, no
// numérico), caemos a DIF=10 deliberadamente neutro y MARCAMOS el resultado
// como 'opposed_fallback' para que las herramientas dev de §4.14 detecten
// tablas mal escritas.
const OPPOSED_FALLBACK_DIFFICULTY = 10;

function resolveOpposedDifficulty(
  check: EvadeCheck,
  payload: Readonly<Record<string, unknown>>,
): OpposedResolution {
  if (!check.opposed) {
    return { mode: 'fixed', difficulty: check.difficulty };
  }
  const statName = check.opposed_stat;
  if (statName === undefined) {
    return { mode: 'opposed_fallback', difficulty: OPPOSED_FALLBACK_DIFFICULTY };
  }
  const raw = payload[statName];
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { mode: 'opposed', difficulty: raw, stat_name: statName, stat_value: raw };
  }
  return { mode: 'opposed_fallback', difficulty: OPPOSED_FALLBACK_DIFFICULTY, stat_name: statName };
}

function getSkillValue(character: Character, skillId: string): number {
  const entry = character.skills[skillId];
  return entry === undefined ? 0 : entry.value;
}

// Bloque interno que resuelve UN evade_check (sin cascada). La cascada se
// orquesta en resolveEvadeCheck principal.
function resolveSingleEvade(
  type: EventType,
  payload: Readonly<Record<string, unknown>>,
  check: EvadeCheck,
  character: Character,
  rng: Rng,
): { result: EvadeResult; failed: boolean } {
  const die = rollD20(rng);
  const skillValue = getSkillValue(character, check.skill);
  const total = die + skillValue;
  const critical = die === 20;
  const fumbleApplies = TYPES_WITH_FUMBLE.has(type);
  const fumble = fumbleApplies && die === 1;

  const opposed_resolved = resolveOpposedDifficulty(check, payload);

  let branch: EvadeOutcomeBranch;
  let outcome: EvadeOutcome;
  if (critical) {
    branch = 'critical';
    outcome = check.on_critical;
  } else if (fumble && check.on_fumble !== null) {
    branch = 'fumble';
    outcome = check.on_fumble;
  } else if (total >= opposed_resolved.difficulty) {
    branch = 'success';
    outcome = check.on_success;
  } else {
    branch = 'failure';
    outcome = check.on_failure;
  }

  const failed = branch === 'failure' || branch === 'fumble';

  const result: EvadeResult = {
    branch,
    outcome,
    roll: { die, total, critical, fumble },
    opposed_resolved,
    applied_cost: check.cost,
    cascade: null,
    trained_skill: check.trains_skill ? check.skill : null,
  };
  return { result, failed };
}

export function resolveEvadeCheck(
  type: EventType,
  payload: Readonly<Record<string, unknown>>,
  check: EvadeCheck,
  character: Character,
  rng: Rng,
): EvadeResult {
  const primary = resolveSingleEvade(type, payload, check, character, rng);
  if (!primary.failed || check.fallback_check === null) return primary.result;

  const cascade = resolveSingleEvade(type, payload, check.fallback_check, character, rng);
  return { ...primary.result, cascade: cascade.result };
}


// =============================================================================
// Modelo de tabla d20 por POI (#92, cableado en el sub-paso 4f.0 por #97)
// =============================================================================
//
// POR QUÉ HAY DOS MODELOS EN ESTE ARCHIVO. Todo lo de arriba —`BiomeTable`,
// `computeEffectiveWeight`, `selectByD20`, `rollExplorationTick`— implementa el
// modelo de v0.20: una tabla por bioma cuyas entradas compiten por peso, que el
// d20 normaliza a rangos. La decisión #92 cambió el modelo a **20 slots
// numerados por POI**, y en ese modelo **la cara del d20 ES el slot**: sale un
// 7, se resuelve el slot 07. No hay pesos que normalizar y el balance no lo
// garantizan los pesos sino el reparto de bandas de §9.5, idéntico en los 720.
//
// Los dos modelos conviven en lugar de sustituirse (decisión de 4f.0, lectura 1
// de las tres que se pusieron sobre la mesa): el camino de bioma está validado
// y con tests verdes, y borrarlo para reescribirlo no compra nada hoy. Lo que
// NO se hace es usar los dos en el mismo sitio — la exploración de POI va por
// aquí, y `rollExplorationTick` queda para quien lo necesite.
//
// Los datos los produce `scripts/compile-contenido.mjs` desde `contenido/`, y
// el autor nunca escribe este shape a mano.

// Efecto declarativo de una entrada. Es la salida de la gramática de una línea
// que el autor escribe como `mecanica: oro 12 + estado poisoned`. El motor no
// los aplica: los declara. Quien los ejecuta es el orquestador de `state/`,
// igual que el loot de #58 no vive en el módulo sagrado de combate.
export type PoiMechanic =
  | { kind: 'enemy'; id: string; count: number }
  | { kind: 'item'; id: string; count: number }
  | { kind: 'damage'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'gold'; amount: number }
  | { kind: 'xp'; amount: number }
  | { kind: 'status'; id: string }
  | { kind: 'reveal_poi'; id: string }
  | { kind: 'flag'; id: string };

// Override de la tirada reactiva de una entrada concreta. `null` en la entrada
// significa "usa el default de §4.15.7 para este tipo": #24 obliga a que toda
// entrada declare tirada, y escribir 14.400 a mano es imposible.
export type PoiEvadeOverride =
  | { none: true }
  | { skill: string; difficulty: number; opposed: false; auto: boolean }
  | { skill: string; opposed: true; opposed_stat: string; auto: boolean };

export interface PoiEntry {
  slot: number;
  type: EventType;
  text: string;
  mechanic: readonly PoiMechanic[] | null;
  evade: PoiEvadeOverride | null;
}

// Evento fijo de los 80 POIs con `hasCuratedSlot` (§9.3). Puentea el d20; no
// sustituye a los 20 slots, el POI lleva las dos cosas.
export interface PoiCuratedEntry {
  title: string | null;
  text: string;
  mechanic: readonly PoiMechanic[] | null;
  // true: se dispara la primera visita y después el POI resuelve por d20.
  exhaustible: boolean;
}

export type PoiArchetype = 'natural' | 'ruina' | 'asentamiento' | 'arcano';

export interface PoiTable {
  poiId: string;
  archetype: PoiArchetype;
  curated: boolean;
  name: string | null;
  description: string | null;
  curatedEntry: PoiCuratedEntry | null;
  // Disperso a propósito: sólo los slots escritos. Un hueco no es un error,
  // es lo que la cascada rellena.
  slots: Readonly<Record<string, PoiEntry>>;
}

export interface ExplorationFallbacks {
  // Segundo escalón: una tabla por arquetipo, indexada por slot.
  archetypes: Readonly<Record<string, Readonly<Record<string, PoiEntry>>>>;
  // Tercer escalón: N variantes por slot, para que quien juegue sin contenido
  // escrito no lea tres veces la misma línea seguida.
  generic: Readonly<Record<string, readonly PoiEntry[]>>;
}

// De qué escalón de la cascada salió la entrada. La UI no lo necesita, pero el
// Campo de pruebas de §4.14 sí: "¿este texto es del POI o es genérico?" es la
// pregunta que se hace un autor mirando su propio contenido.
export type PoiEntrySource = 'poi' | 'archetype' | 'generic';

export interface ResolvedPoiEntry {
  entry: PoiEntry;
  source: PoiEntrySource;
}

// -----------------------------------------------------------------------------
// Cascada de resolución (§9.5)
// -----------------------------------------------------------------------------

// Entrada propia del POI → entrada del arquetipo para ese slot → variante
// genérica de la banda. Devuelve null sólo si los tres escalones están vacíos,
// que es un hueco de datos y no un estado de juego: con las genéricas escritas
// nunca puede pasar, y por eso son las primeras que conviene rellenar.
//
// `rng` sólo se consume si la resolución llega al tercer escalón Y hay más de
// una variante. Mantenerlo opcional deja la función determinista para los dos
// primeros escalones, que es como la van a llamar los tests y las herramientas.
export function resolvePoiEntry(
  table: PoiTable,
  fallbacks: ExplorationFallbacks,
  die: number,
  rng?: Rng,
): ResolvedPoiEntry | null {
  if (!Number.isInteger(die) || die < 1 || die > 20) {
    throw new RangeError(`resolvePoiEntry: die debe ser entero en [1, 20], recibido ${die}`);
  }
  const clave = String(die);

  const propia = table.slots[clave];
  if (propia !== undefined) return { entry: propia, source: 'poi' };

  const porArquetipo = fallbacks.archetypes[table.archetype]?.[clave];
  if (porArquetipo !== undefined) return { entry: porArquetipo, source: 'archetype' };

  const variantes = fallbacks.generic[clave] ?? [];
  if (variantes.length === 0) return null;
  if (variantes.length === 1) return { entry: variantes[0]!, source: 'generic' };

  // Con varias variantes se elige una. Sin rng, la primera: determinista y
  // suficiente para tests y para el compilador de contenido.
  const indice = rng === undefined ? 0 : Math.min(variantes.length - 1, Math.floor(rng() * variantes.length));
  return { entry: variantes[indice]!, source: 'generic' };
}

// -----------------------------------------------------------------------------
// Tirada de POI
// -----------------------------------------------------------------------------

export interface PoiRoll {
  // La cara del d20 y el slot resuelto son el mismo número en este modelo. Se
  // exponen los dos porque la UI enseña la tirada (#75: la tirada es visible) y
  // el motor razona en slots.
  roll: RollDetail;
  slot: number;
  resolved: ResolvedPoiEntry | null;
}

// Tira el d20 y resuelve el slot por la cascada. Es el equivalente de
// `rollExplorationTick` para el modelo de #92.
export function rollPoiEntry(
  table: PoiTable,
  fallbacks: ExplorationFallbacks,
  rng: Rng,
): PoiRoll {
  const die = rollD20(rng);
  return {
    roll: { die, total: die, critical: die === 20, fumble: die === 1 },
    slot: die,
    resolved: resolvePoiEntry(table, fallbacks, die, rng),
  };
}

// Predicado puro: ¿esta visita debe abrir el evento curado en lugar de tirar?
// El estado de "ya consumido" vive en `world_state` (#94), no aquí — este
// módulo no persiste nada.
export function shouldUseCuratedEntry(table: PoiTable, alreadyConsumed: boolean): boolean {
  if (table.curatedEntry === null) return false;
  return table.curatedEntry.exhaustible ? !alreadyConsumed : true;
}
