// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.10 (viaje rápido híbrido). H4.
//
// Sólo hacia nodos descubiertos. Tramo seguro: sin tiradas, sólo coste de
// tiempo. Tramo arriesgado: tiradas condensadas con resumen al llegar.
//
// PROVISIONAL H4:
//   - Pathfinding (versión mínima: edges directos; multihop entra en H4).
//   - Cuántas tiradas condensadas tira un tramo arriesgado (placeholder).

import type { Rng } from './dice';
import type { Character } from './character';
import type { ExplorationEvent, WorldState } from './exploration';
import type { BiomeId } from './exploration';
import { rollExplorationTick } from './exploration';
import type { NodeId, WorldEdge, WorldMap } from './world-gen';

// -----------------------------------------------------------------------------
// Plan de viaje
// -----------------------------------------------------------------------------

export interface TravelLeg {
  from: NodeId;
  to: NodeId;
  kind: 'safe' | 'risky';
  biome: BiomeId;
  travel_ticks: number;
}

export interface TravelPlan {
  legs: readonly TravelLeg[];
  // Suma de ticks de todos los legs.
  total_ticks: number;
  // True si al menos un leg es 'risky'.
  has_risky: boolean;
}

// -----------------------------------------------------------------------------
// Resumen del viaje (biblia §4.10: "resumen al llegar")
// -----------------------------------------------------------------------------

export interface CondensedRollSummary {
  leg: TravelLeg;
  // Eventos disparados durante el tramo (uno por tirada condensada). Vacío
  // si el leg fue 'safe'.
  events: readonly ExplorationEvent[];
  // True si alguno de los eventos forzó parada (combate, evento narrativo).
  // En ese caso el viaje rápido se interrumpe en este leg y el resto del plan
  // queda pendiente. La UI muestra "Viaje interrumpido en {to}".
  interrupted: boolean;
}

export interface TravelResolution {
  plan: TravelPlan;
  summaries: readonly CondensedRollSummary[];
  // Nodo donde el personaje termina realmente. Si interrupted, el último
  // `to` del summary que interrumpió. Si no, el `to` del último leg.
  final_node: NodeId;
}

// -----------------------------------------------------------------------------
// Planificación
// -----------------------------------------------------------------------------

// Construye el plan desde `from` hasta `to`. Implementación inicial: BFS
// sobre el grafo. Devuelve el camino más corto en número de legs, no en ticks
// (la diferencia se verá si en H4 las aristas tienen costes muy desiguales,
// pero por ahora son ~30-60 ticks, similares).
//
// `discovered` es el set de NodeId que el personaje ha descubierto.
// Lanza si `to` no está descubierto (biblia: sólo a nodos descubiertos).
// Lanza si no existe camino entre `from` y `to`.
export function planFastTravel(
  world: WorldMap,
  from: NodeId,
  to: NodeId,
  discovered: ReadonlySet<NodeId>,
): TravelPlan {
  if (!discovered.has(to)) {
    throw new Error(`planFastTravel: nodo destino "${to}" no descubierto.`);
  }
  if (from === to) {
    return { legs: [], total_ticks: 0, has_risky: false };
  }

  // BFS con tracking de padre para reconstruir camino.
  const parent = new Map<NodeId, { node: NodeId; edge: WorldEdge }>();
  const visited = new Set<NodeId>([from]);
  const queue: NodeId[] = [from];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) break;
    const outgoing = world.edges.filter((e) => e.from === current);
    for (const edge of outgoing) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      parent.set(edge.to, { node: current, edge });
      queue.push(edge.to);
    }
  }

  if (!parent.has(to)) {
    throw new Error(`planFastTravel: no hay camino de "${from}" a "${to}".`);
  }

  // Reconstruir camino desde `to` hacia `from`.
  const reverseLegs: TravelLeg[] = [];
  let cursor: NodeId = to;
  while (cursor !== from) {
    const step = parent.get(cursor)!;
    reverseLegs.push({
      from: step.node,
      to: cursor,
      kind: step.edge.kind,
      biome: step.edge.biome,
      travel_ticks: step.edge.travel_ticks,
    });
    cursor = step.node;
  }
  const legs = reverseLegs.reverse();
  const total_ticks = legs.reduce((sum, l) => sum + l.travel_ticks, 0);
  const has_risky = legs.some((l) => l.kind === 'risky');
  return { legs, total_ticks, has_risky };
}

// -----------------------------------------------------------------------------
// Resolución
// -----------------------------------------------------------------------------

// Resuelve el plan de viaje. Para cada leg 'safe' devuelve summary vacío;
// para cada 'risky' tira N tiradas condensadas usando rollExplorationTick
// con la tabla del bioma del leg.
//
// `tableLookup` resuelve la tabla del bioma. Lo provee la capa de datos para
// no acoplar fast-travel.ts a JSON files.
//
// PROVISIONAL H4: número de tiradas condensadas por leg arriesgado = 1.
// Se ajustará cuando las tablas de bioma estén pobladas y el balance se vea
// en H4 jugable. Tipos de evento que interrumpen viaje: combat, ambush,
// narrative (eventos de "peso" según biblia §4.15.5).
const INTERRUPTING_TYPES: ReadonlySet<import('./exploration').EventType> = new Set([
  'combat',
  'ambush',
  'narrative',
]);
const ROLLS_PER_RISKY_LEG_PROVISIONAL = 1;

export function resolveTravel(
  plan: TravelPlan,
  character: Character,
  baseWorldState: WorldState,
  tableLookup: (biome: BiomeId) => import('./exploration').BiomeTable,
  rng: Rng,
): TravelResolution {
  const summaries: CondensedRollSummary[] = [];
  let final_node: NodeId = plan.legs.length > 0 ? plan.legs[0]!.from : '';

  for (const leg of plan.legs) {
    if (leg.kind === 'safe') {
      summaries.push({ leg, events: [], interrupted: false });
      final_node = leg.to;
      continue;
    }
    // risky: N tiradas con la tabla del bioma del leg, con un WorldState
    // ajustado al bioma. Si alguna devuelve evento de tipo interrupting,
    // marcamos interrupted y dejamos al PJ en el `to` del leg actual.
    const legWorldState: WorldState = { ...baseWorldState, biome: leg.biome };
    const table = tableLookup(leg.biome);
    const events: import('./exploration').ExplorationEvent[] = [];
    let legInterrupted = false;
    for (let i = 0; i < ROLLS_PER_RISKY_LEG_PROVISIONAL; i++) {
      const ev = rollExplorationTick(legWorldState, character, 'fast_travel_segment', table, rng);
      events.push(ev);
      if (ev.entry !== null && INTERRUPTING_TYPES.has(ev.entry.type)) {
        legInterrupted = true;
        break;
      }
    }
    summaries.push({ leg, events, interrupted: legInterrupted });
    final_node = leg.to;
    if (legInterrupted) break;
  }

  return { plan, summaries, final_node };
}

// Lectura idiomática: ¿este edge es transitable por viaje rápido para el PJ?
// En MVP basta con que el destino esté descubierto. La lectura por reputación
// de facción se añadirá en H4/H7 cuando el catálogo de facciones esté poblado.
export function isEdgeTraversable(
  edge: WorldEdge,
  _character: Character,
  discovered: ReadonlySet<NodeId>,
): boolean {
  return discovered.has(edge.to);
}
