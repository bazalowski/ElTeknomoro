// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.10 (mapa y exploración) + §7 (rules/world-gen.ts). H4.
//
// Genera el mapa del mundo: grafo de nodos (mapa-mundi) + grid de cada nodo
// (sub-mapa). Modo Historia usa mapa hardcodeado; modo Libre genera procedural
// a partir del hash de la frase-semilla.
//
// PROVISIONAL H4:
//   - Algoritmo de generación procedural (sólo placeholder).
//   - Distribución de biomas, densidad de POIs, conectividad del grafo.

import type { Rng } from './dice';
import { createRng } from './dice';
import type { BiomeId } from './exploration';
import type { WorldClock } from './time';
import { createClock } from './time';

// -----------------------------------------------------------------------------
// Identificadores
// -----------------------------------------------------------------------------

export type NodeId = string;
export type MapId = string;

// -----------------------------------------------------------------------------
// Sub-mapa (grid de tiles dentro de un nodo, biblia §4.10)
// -----------------------------------------------------------------------------

export type TileKind =
  | 'walkable'
  | 'blocked'
  | 'water'
  | 'difficult'
  | 'door'
  | 'poi_marker';

export interface Tile {
  x: number;
  y: number;
  kind: TileKind;
  // Bioma efectivo de este tile (puede diferir del bioma del nodo en zonas
  // mixtas; biblia §4.15.1 incluye "cruzar frontera de bioma" como disparador).
  biome: BiomeId;
}

export interface SubMap {
  map_id: MapId;
  width: number;
  height: number;
  tiles: readonly Tile[];
  // Posición de entrada por defecto al entrar al nodo desde el mapa-mundi.
  entry_x: number;
  entry_y: number;
}

// -----------------------------------------------------------------------------
// Nodo del mapa-mundi (biblia §4.10)
// -----------------------------------------------------------------------------

export type NodeKind = 'city' | 'dungeon' | 'poi' | 'wilderness';

export interface WorldNode {
  id: NodeId;
  kind: NodeKind;
  // Bioma dominante del nodo. Filtra qué tabla de exploración aplica.
  biome: BiomeId;
  // Coordenadas en el mapa-mundi (no en el sub-mapa). Render y pathfinding.
  world_x: number;
  world_y: number;
  // Facción dominante en este nodo. Determina qué tramos del grafo cuentan
  // como 'safe' o 'risky' según reputación (fast-travel.ts).
  dominant_faction: string | null;
  // Sub-mapa del nodo. Generado lazy (puede ser null en mapa-mundi y rellenar
  // al entrar). En H4 los pre-generamos al crear el mundo para simplicidad.
  submap: SubMap | null;
}

// -----------------------------------------------------------------------------
// Aristas del grafo (biblia §4.10 viaje rápido híbrido)
// -----------------------------------------------------------------------------

// safe: entre nodos aliados o mismo bioma tranquilo. No dispara tiradas en
// viaje rápido. risky: zona salvaje/hostil. Dispara tiradas condensadas.
export type EdgeKind = 'safe' | 'risky';

export interface WorldEdge {
  from: NodeId;
  to: NodeId;
  kind: EdgeKind;
  // Bioma del tramo (para tiradas condensadas en viaje arriesgado).
  biome: BiomeId;
  // Coste en ticks de reloj (avanzaClock(travelTicks)).
  travel_ticks: number;
}

// -----------------------------------------------------------------------------
// Mundo completo
// -----------------------------------------------------------------------------

export type WorldMode = 'history' | 'free';

export interface WorldMap {
  // Identificador del mundo. Para 'history': "history_v1". Para 'free': hash
  // de la frase-semilla.
  id: string;
  mode: WorldMode;
  // Frase-semilla original (sólo en mode='free'). Útil para mostrar al jugador
  // y para regenerar el mundo si se borra y se vuelve a entrar con la misma.
  seed_phrase: string | null;
  seed_hash: number;
  nodes: readonly WorldNode[];
  edges: readonly WorldEdge[];
  // Reloj inicial del mundo.
  clock: WorldClock;
}

// -----------------------------------------------------------------------------
// Hash de frase-semilla (biblia §4.10 modo Libre)
// -----------------------------------------------------------------------------

// Hash determinista de string a uint32. La frase del jugador se hashea y el
// resultado alimenta el PRNG del mundo y la sucesión de tiradas.
//
// Usamos FNV-1a (32 bits): rápido, determinista, sin dependencias. No es
// criptográfico — no hace falta. Decisión idiomática para H4.
export function hashSeedPhrase(phrase: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < phrase.length; i++) {
    hash ^= phrase.charCodeAt(i);
    // Multiplica por el primo FNV (16777619) en uint32.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

// -----------------------------------------------------------------------------
// Generación
// -----------------------------------------------------------------------------

// Genera el mapa hardcodeado del modo Historia. Versión mínima del scope §3 H4:
// 1 ciudad + 2 mazmorras + zona exterior, conectados.
//
// Esquema:
//   ciudad_capital ←(safe llanura)→ exterior_llano ←(risky bosque)→ mazmorra_bosque
//                                              ↓ (risky ruinas)
//                                        mazmorra_ruinas
//
// Cada nodo tiene sub-mapa stub (3x3 walkable, entry en centro). El sub-mapa
// real se desarrolla en H4 cuando el render esté listo. La estructura del
// grafo y los biomas son lo que el código necesita ahora para validar
// fast-travel y exploración.
export function generateHistoryWorld(): WorldMap {
  const stubSubmap = (mapId: MapId, biome: BiomeId): SubMap => {
    const tiles: Tile[] = [];
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        tiles.push({ x, y, kind: 'walkable', biome });
      }
    }
    return { map_id: mapId, width: 3, height: 3, tiles, entry_x: 1, entry_y: 1 };
  };

  const nodes: WorldNode[] = [
    {
      id: 'ciudad_capital', kind: 'city', biome: 'llanura',
      world_x: 0, world_y: 0, dominant_faction: 'reino',
      submap: stubSubmap('submap_ciudad', 'llanura'),
    },
    {
      id: 'exterior_llano', kind: 'wilderness', biome: 'llanura',
      world_x: 1, world_y: 0, dominant_faction: null,
      submap: stubSubmap('submap_llano', 'llanura'),
    },
    {
      id: 'mazmorra_bosque', kind: 'dungeon', biome: 'bosque',
      world_x: 2, world_y: 0, dominant_faction: null,
      submap: stubSubmap('submap_bosque', 'bosque'),
    },
    {
      id: 'mazmorra_ruinas', kind: 'dungeon', biome: 'ruinas_arcanas',
      world_x: 1, world_y: 1, dominant_faction: null,
      submap: stubSubmap('submap_ruinas', 'ruinas_arcanas'),
    },
  ];

  // Aristas bidireccionales (creamos pares from↔to).
  const edgePairs: { a: NodeId; b: NodeId; kind: EdgeKind; biome: BiomeId; ticks: number }[] = [
    { a: 'ciudad_capital', b: 'exterior_llano', kind: 'safe', biome: 'llanura', ticks: 30 },
    { a: 'exterior_llano', b: 'mazmorra_bosque', kind: 'risky', biome: 'bosque', ticks: 60 },
    { a: 'exterior_llano', b: 'mazmorra_ruinas', kind: 'risky', biome: 'ruinas_arcanas', ticks: 60 },
  ];
  const edges: WorldEdge[] = [];
  for (const p of edgePairs) {
    edges.push({ from: p.a, to: p.b, kind: p.kind, biome: p.biome, travel_ticks: p.ticks });
    edges.push({ from: p.b, to: p.a, kind: p.kind, biome: p.biome, travel_ticks: p.ticks });
  }

  return {
    id: 'history_v1',
    mode: 'history',
    seed_phrase: null,
    seed_hash: hashSeedPhrase('history_v1'),
    nodes,
    edges,
    clock: createInitialClock(),
  };
}

// Genera el mundo procedural del modo Libre. La misma frase produce siempre
// el mismo mundo (determinismo de §7 biblia: rules/ aislado y determinista).
//
// Pendiente para H4 dedicado: la generación procedural real (algoritmo de
// distribución de biomas, conectividad, balanceo de POIs) requiere su propia
// sesión de diseño. Aquí dejamos NOT_IMPLEMENTED a propósito.
export function generateFreeWorld(_seed_phrase: string): WorldMap {
  throw new Error('NOT_IMPLEMENTED: generateFreeWorld — H4 (sesión de diseño dedicada)');
}

// API uniforme. La UI llama a este con `mode` + `seed_phrase` (vacía en
// 'history') y obtiene el WorldMap listo.
export function generateWorld(mode: WorldMode, seed_phrase: string): WorldMap {
  if (mode === 'history') return generateHistoryWorld();
  if (mode === 'free') return generateFreeWorld(seed_phrase);
  throw new Error(`generateWorld: modo desconocido "${mode}"`);
}

// PRNG del mundo derivado del hash de la semilla. Útil para tests:
// crea el mismo mundo con la misma RNG.
export function createWorldRng(world: WorldMap): Rng {
  return createRng(world.seed_hash);
}

// Reloj inicial fresco (biblia §4.10: día/noche presente; sin estado previo).
// Aislado para que generateHistoryWorld y generateFreeWorld coincidan.
export function createInitialClock(): WorldClock {
  return createClock('clear');
}

// -----------------------------------------------------------------------------
// Lecturas del grafo
// -----------------------------------------------------------------------------

export function findNode(world: WorldMap, node_id: NodeId): WorldNode | null {
  return world.nodes.find((n) => n.id === node_id) ?? null;
}

export function edgesFrom(world: WorldMap, node_id: NodeId): WorldEdge[] {
  return world.edges.filter((e) => e.from === node_id);
}
