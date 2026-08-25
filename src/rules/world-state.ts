// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §9 + decisión #90 (el estado del mundo cuelga del slot, no del user).
// H4 sub-paso 4b.0.
//
// QUÉ ES ESTE MÓDULO
// ------------------
// `world.ts` es el mundo FIJO: 5 regiones, 180 grids, 720 POIs, iguales en
// todas las partidas (#72). Este módulo es lo que UNA run sabe de ese mundo:
// qué grids ha pisado, qué POIs ha revelado, dónde está el PJ y qué está
// mirando. Es el `world_state` que se persiste en `save_slots`.
//
// POR QUÉ CUELGA DEL SLOT Y NO DEL USUARIO (#90)
// El schema de H0 da 3 slots por usuario y un personaje por slot (#10). Si el
// estado del mundo colgase del `user_id`, el segundo PJ heredaría los grids
// explorados del primero — contra #44 (permadeath puro) y contra C3b de #85
// ("entre runs nada hereda"). Un slot es una run: ahí vive.
//
// CONVENCIÓN DE ESCASEZ
// `gridStates` y `poiStates` guardan SÓLO lo que se aparta del default. Un
// grid ausente es 'inexplorado'; un POI ausente está bajo niebla (§9.9). Al
// empezar, un save pesa cuatro campos y no 900 entradas.
//
// TODAS las funciones son puras: devuelven un WorldState nuevo, nunca mutan el
// que reciben. Mismo criterio que `rules/statuses.ts` y `rules/perks.ts`.

import { WORLD_CIFRAS, getGrid, getPOI, areGridsAdjacent } from './world';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

// Las tres capas de §9.6. 'inexplorado' es el default y no se persiste.
// 'controlado' lo abre 4e (anclas + fast travel).
export type GridState = 'inexplorado' | 'explorado' | 'controlado';

// Estado de un POI para la niebla de §9.9 y la lectura visual de #91.
// Ausente = no visitado, se pinta como "???".
export type POIState = 'revelado' | 'completado';

// Dónde está mirando el jugador. Los tres niveles de zoom de §9.1.
// 'poi' se declara aquí para que 4c no tenga que migrar el shape persistido;
// en 4b la UI sólo produce 'region' y 'grid'.
export type PlayerView =
  | { kind: 'region' }
  | { kind: 'grid'; gridId: string }
  | { kind: 'poi'; poiId: string };

export interface WorldState {
  // Versión del shape persistido. Si 4d/4e cambian la forma, `hydrateWorldState`
  // sabe desde dónde migra. Hoy sólo existe la 1.
  version: 1;
  // Grid donde está el PJ. Siempre uno concreto: no existe "en tránsito" (#90).
  currentGridId: string;
  // Vista actual, persistida para que reabrir el navegador devuelva al jugador
  // donde estaba (#90).
  view: PlayerView;
  // Sólo grids que se apartan del default 'inexplorado'.
  gridStates: Readonly<Record<string, GridState>>;
  // Sólo POIs que ya no están bajo niebla.
  poiStates: Readonly<Record<string, POIState>>;
  // Grids con ancla colocada por el jugador (§9.8). Los cablea 4e; aquí sólo
  // reservamos el campo para no volver a migrar el shape.
  anchors: readonly string[];
  // Fatiga de jornada (§9.7). Los cablea 4d; en 4b se persisten pero nadie los
  // decrementa todavía.
  day: number;
  actionsSpent: number;
}

// -----------------------------------------------------------------------------
// Creación
// -----------------------------------------------------------------------------

// Estado de una run recién empezada: el PJ en el grid de inicio, mirando el
// overworld, con su grid natal ya explorado (Q16a del cuestionario de 4b: sólo
// `sur-001` arranca a color pleno) y el Hogar revelado, porque el PJ vive ahí.
export function createInitialWorldState(): WorldState {
  return {
    version: 1,
    currentGridId: WORLD_CIFRAS.startingGridId,
    view: { kind: 'region' },
    gridStates: { [WORLD_CIFRAS.startingGridId]: 'explorado' },
    poiStates: { [WORLD_CIFRAS.homePOIId]: 'revelado' },
    anchors: [],
    day: 1,
    actionsSpent: 0,
  };
}

// -----------------------------------------------------------------------------
// Lecturas
// -----------------------------------------------------------------------------

export function getGridState(state: WorldState, gridId: string): GridState {
  return state.gridStates[gridId] ?? 'inexplorado';
}

// null = el POI sigue bajo niebla y se pinta "???" (§9.9).
export function getPOIState(state: WorldState, poiId: string): POIState | null {
  return state.poiStates[poiId] ?? null;
}

export function isGridExplored(state: WorldState, gridId: string): boolean {
  return getGridState(state, gridId) !== 'inexplorado';
}

export function hasAnchor(state: WorldState, gridId: string): boolean {
  return state.anchors.includes(gridId);
}

// Destinos legales desde donde está el PJ (#88): vecinos cardinales del grid
// actual. El fast travel de 4e añadirá su propia vía, no toca ésta.
export function canTravelTo(state: WorldState, gridId: string): boolean {
  if (!getGrid(gridId)) return false;
  return areGridsAdjacent(state.currentGridId, gridId);
}

// -----------------------------------------------------------------------------
// Transiciones (puras: devuelven estado nuevo)
// -----------------------------------------------------------------------------

// Sube el estado de un grid. Nunca lo baja: 'controlado' no vuelve a
// 'explorado' por volver a pisarlo, y 'explorado' no vuelve a 'inexplorado'.
// La niebla de §9.9 no se re-cierra.
export function setGridState(state: WorldState, gridId: string, next: GridState): WorldState {
  const rank: Record<GridState, number> = { inexplorado: 0, explorado: 1, controlado: 2 };
  const current = getGridState(state, gridId);
  if (rank[next] <= rank[current]) return state;
  return { ...state, gridStates: { ...state.gridStates, [gridId]: next } };
}

// Revela un POI (primera visita, §9.9) o lo marca completado. Igual que los
// grids: sólo avanza, nunca retrocede.
export function setPOIState(state: WorldState, poiId: string, next: POIState): WorldState {
  if (!getPOI(poiId)) return state;
  const current = getPOIState(state, poiId);
  if (current === 'completado') return state;
  if (current === next) return state;
  return { ...state, poiStates: { ...state.poiStates, [poiId]: next } };
}

// Mueve al PJ a un grid adyacente y lo marca explorado. Devuelve el mismo
// estado si el destino no es legal: el caller decide si eso es un no-op de UI
// o un error. No cobra acciones de jornada — eso lo enchufa 4d (§9.7).
export function moveToGrid(state: WorldState, gridId: string): WorldState {
  if (!canTravelTo(state, gridId)) return state;
  const moved: WorldState = { ...state, currentGridId: gridId };
  return setGridState(moved, gridId, 'explorado');
}

// Cambia la vista. Es cámara, no acción de juego (#88): no cuesta nada y no
// mueve al PJ. Ignora vistas que apunten a un grid o POI inexistente.
export function setView(state: WorldState, view: PlayerView): WorldState {
  if (view.kind === 'grid' && !getGrid(view.gridId)) return state;
  if (view.kind === 'poi' && !getPOI(view.poiId)) return state;
  return { ...state, view };
}

export function placeAnchor(state: WorldState, gridId: string): WorldState {
  if (!getGrid(gridId) || state.anchors.includes(gridId)) return state;
  return { ...state, anchors: [...state.anchors, gridId] };
}

// -----------------------------------------------------------------------------
// Hidratación desde persistencia
// -----------------------------------------------------------------------------

// Lo que vuelve de Supabase es `jsonb`: puede ser null (save anterior a 4b.0),
// puede venir de una versión previa del shape, o puede estar corrupto. Esta
// función siempre devuelve un WorldState usable, cayendo al inicial si no hay
// nada aprovechable. Mismo criterio que `hydrateLoadedCharacter` en
// backend/characters.ts: en prototipo preferimos degradar a romper.
//
// Si el grid o la vista persistidos ya no existen en el dataset (fase 2 podría
// renombrar ids), se cae al grid de inicio y a la vista regional en vez de
// dejar al PJ en un limbo.
export function hydrateWorldState(raw: unknown): WorldState {
  if (raw === null || typeof raw !== 'object') return createInitialWorldState();
  const r = raw as Record<string, unknown>;
  const base = createInitialWorldState();

  const currentGridId =
    typeof r.currentGridId === 'string' && getGrid(r.currentGridId)
      ? r.currentGridId
      : base.currentGridId;

  const view = hydrateView(r.view);

  const gridStates: Record<string, GridState> = {};
  if (r.gridStates !== null && typeof r.gridStates === 'object') {
    for (const [k, v] of Object.entries(r.gridStates as Record<string, unknown>)) {
      if (!getGrid(k)) continue;
      if (v === 'explorado' || v === 'controlado') gridStates[k] = v;
    }
  }
  // El grid donde está el PJ está explorado por definición.
  gridStates[currentGridId] ??= 'explorado';

  const poiStates: Record<string, POIState> = {};
  if (r.poiStates !== null && typeof r.poiStates === 'object') {
    for (const [k, v] of Object.entries(r.poiStates as Record<string, unknown>)) {
      if (!getPOI(k)) continue;
      if (v === 'revelado' || v === 'completado') poiStates[k] = v;
    }
  }

  const anchors = Array.isArray(r.anchors)
    ? r.anchors.filter((a): a is string => typeof a === 'string' && getGrid(a) !== null)
    : [];

  return {
    version: 1,
    currentGridId,
    view,
    gridStates,
    poiStates,
    anchors,
    day: typeof r.day === 'number' && r.day >= 1 ? Math.floor(r.day) : base.day,
    actionsSpent:
      typeof r.actionsSpent === 'number' && r.actionsSpent >= 0 ? Math.floor(r.actionsSpent) : 0,
  };
}

function hydrateView(raw: unknown): PlayerView {
  if (raw === null || typeof raw !== 'object') return { kind: 'region' };
  const v = raw as Record<string, unknown>;
  if (v.kind === 'grid' && typeof v.gridId === 'string' && getGrid(v.gridId)) {
    return { kind: 'grid', gridId: v.gridId };
  }
  if (v.kind === 'poi' && typeof v.poiId === 'string' && getPOI(v.poiId)) {
    return { kind: 'poi', poiId: v.poiId };
  }
  return { kind: 'region' };
}
