// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §9 (overworld) + decisiones #67 (180 grids, 5 regiones) y #68
// (720 POIs con 80 curados, 4 arquetipos). H4 sub-paso 4a.
//
// MODELO DE MUNDO V1
// ------------------
// El overworld es un único dataset estático: 5 regiones, 180 grids, 720 POIs.
// El mundo es FIJO entre runs (decisión #72): los ids y la topología no cambian
// nunca. Lo que cambia entre runs es estado de juego (niebla, control, memoria
// de progresión) y eso vive fuera de este módulo (state/ en H4 4d-4f).
//
// Tres niveles de zoom (vista regional → grid → POI) consumen los selectores
// de este módulo. Las posiciones cartesianas son enteras y disjuntas por
// región: el render las puede escalar/centrar como quiera. Layout completo
// documentado en src/data/world/grids.json (cabecera del generador).
//
// Distribución de grids por región (decisión #67):
//   centro 50, norte 35, sur 35, este 30, oeste 30   → 180
//
// Distribución de POIs (decisión #68):
//   720 totales = 4 por grid × 180 grids
//   80 con hasCuratedSlot=true (slot reservado para evento curado de fase 2)
//   por región: centro 22, norte 16, sur 16, este 13, oeste 13  → 80
//
// Repartidos uniformemente: para una región con N grids y K curados, los
// índices (0-based) que reciben curado son `floor(0.5 + i*N/K)` para
// i ∈ [0, K). Cada grid elegido pone hasCuratedSlot=true en su POI #1.
// Esto evita acumulación en los primeros grids de la región y es determinista.
//
// El grid de inicio (isStartingGrid=true) es `sur-001`: el Sur es el hub
// estructural (decisión 4a), donde aterriza el PJ recién creado.

import regionesData from '../data/world/regiones.json';
import gridsData from '../data/world/grids.json';
import poisData from '../data/world/pois.json';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

// Las 5 regiones del overworld. Orden alfabético en el tipo, semántica en JSON.
export const REGION_IDS = ['centro', 'este', 'norte', 'oeste', 'sur'] as const;
export type RegionId = (typeof REGION_IDS)[number];

// Función estructural de cada región. 'hub_estructural' = el Sur (decisión 4a):
// alberga el grid de inicio y el Hogar como POI. 'pendiente_fase_2' = los otros
// cuatro: contenido se redacta en fase 2 sin tocar este módulo.
export type RegionFunction = 'hub_estructural' | 'pendiente_fase_2';

export interface Region {
  id: RegionId;
  displayName: string;
  gridCount: number;
  // Color placeholder para vista regional. PROVISIONAL fase 1 — fase 2 los
  // redefine con la paleta lore.
  colorHex: string;
  function: RegionFunction;
}

// Estado inicial de un grid. La progresión ('explorado', 'controlado') vive
// en state/ y se calcula sobre snapshots; aquí sólo el valor de creación.
export type GridInitialState = 'inexplorado';

export interface Position2D {
  x: number;
  y: number;
}

export interface Grid {
  id: string;
  regionId: RegionId;
  // Coords cartesianas en la vista regional. Enteras, disjuntas por región.
  // Convención canvas (y crece hacia abajo). Layout fase 1 PROVISIONAL.
  position: Position2D;
  initialState: GridInitialState;
  // Exactamente 1 grid del dataset entero tiene true: `sur-001` (hub).
  isStartingGrid: boolean;
}

// Arquetipo del POI (decisión #68). En 4a todos arrancan como 'natural';
// los curados de fase 2 podrán reasignar el arquetipo. Los cuatro valores
// quedan declarados para que la unión exhaustiva esté lista para 4f.
export type POIArchetype = 'natural' | 'ruina' | 'asentamiento' | 'arcano';

export interface POI {
  id: string;
  gridId: string;
  archetype: POIArchetype;
  // Slot reservado para evento curado escrito a mano en fase 2. En el dataset
  // 4a, exactamente 80 POIs lo tienen a true (1 por grid de los grids
  // elegidos por la regla de reparto uniforme); 640 lo tienen a false.
  hasCuratedSlot: boolean;
  // Posición local dentro del grid (mini-grid 5×5). Convención fase 1.
  position: Position2D;
}

// -----------------------------------------------------------------------------
// Cifras canónicas (biblia §9, decisiones #67-#68)
// -----------------------------------------------------------------------------
// Exportadas como constantes para que tests y selectores las consulten en vez
// de hardcodear números mágicos repartidos por el código.

export const WORLD_CIFRAS = {
  totalRegions: 5,
  totalGrids: 180,
  totalPOIs: 720,
  poisPerGrid: 4,
  totalCurated: 80,
  // Distribución de grids por región (decisión #67).
  gridsByRegion: {
    centro: 50,
    norte: 35,
    sur: 35,
    este: 30,
    oeste: 30,
  } as const satisfies Readonly<Record<RegionId, number>>,
  // Distribución de POIs curados por región (decisión #68 + 4a).
  curatedByRegion: {
    centro: 22,
    norte: 16,
    sur: 16,
    este: 13,
    oeste: 13,
  } as const satisfies Readonly<Record<RegionId, number>>,
  startingGridId: 'sur-001',
} as const;

// -----------------------------------------------------------------------------
// Validación de los JSON cargados
// -----------------------------------------------------------------------------
// Validador MANUAL (sin zod). Convención del repo: la validación se hace en
// punto de entrada y devuelve una lista de errores. Si los datos no pasan,
// el módulo lanza al cargar — preferimos fallar duro al iniciar la app que
// arrastrar inconsistencias por el motor.

export type WorldValidationCode =
  | 'REGION_COUNT_MISMATCH'
  | 'REGION_ID_INVALID'
  | 'REGION_DUPLICATE_ID'
  | 'REGION_GRID_COUNT_MISMATCH'
  | 'GRID_COUNT_MISMATCH'
  | 'GRID_ID_DUPLICATE'
  | 'GRID_REGION_INVALID'
  | 'GRID_PER_REGION_MISMATCH'
  | 'GRID_STARTING_COUNT_MISMATCH'
  | 'GRID_STARTING_NOT_IN_SUR'
  | 'POI_COUNT_MISMATCH'
  | 'POI_ID_DUPLICATE'
  | 'POI_GRID_INVALID'
  | 'POI_PER_GRID_MISMATCH'
  | 'POI_CURATED_COUNT_MISMATCH'
  | 'POI_CURATED_PER_REGION_MISMATCH';

export interface WorldValidationError {
  code: WorldValidationCode;
  message: string;
}

function isRegionId(s: string): s is RegionId {
  return (REGION_IDS as readonly string[]).includes(s);
}

// Validador puro. Devuelve [] si todo cuadra. Lo usa el módulo al cargar y
// es invocable desde tests con datos sintéticos.
export function validateWorldData(
  regiones: readonly Region[],
  grids: readonly Grid[],
  pois: readonly POI[],
): WorldValidationError[] {
  const errors: WorldValidationError[] = [];

  // -- Regiones --
  if (regiones.length !== WORLD_CIFRAS.totalRegions) {
    errors.push({
      code: 'REGION_COUNT_MISMATCH',
      message: `Esperaba ${WORLD_CIFRAS.totalRegions} regiones, encontré ${regiones.length}.`,
    });
  }
  const regionIdsSeen = new Set<string>();
  for (const r of regiones) {
    if (!isRegionId(r.id)) {
      errors.push({
        code: 'REGION_ID_INVALID',
        message: `Región con id "${r.id}" no está en REGION_IDS.`,
      });
      continue;
    }
    if (regionIdsSeen.has(r.id)) {
      errors.push({
        code: 'REGION_DUPLICATE_ID',
        message: `Región con id "${r.id}" duplicada.`,
      });
    }
    regionIdsSeen.add(r.id);
    const expected = WORLD_CIFRAS.gridsByRegion[r.id];
    if (r.gridCount !== expected) {
      errors.push({
        code: 'REGION_GRID_COUNT_MISMATCH',
        message: `Región "${r.id}" declara gridCount=${r.gridCount}, esperado ${expected}.`,
      });
    }
  }

  // -- Grids --
  if (grids.length !== WORLD_CIFRAS.totalGrids) {
    errors.push({
      code: 'GRID_COUNT_MISMATCH',
      message: `Esperaba ${WORLD_CIFRAS.totalGrids} grids, encontré ${grids.length}.`,
    });
  }
  const gridIdsSeen = new Set<string>();
  const gridsPerRegion: Record<string, number> = {};
  let startingCount = 0;
  let startingGridFound: Grid | null = null;
  for (const g of grids) {
    if (gridIdsSeen.has(g.id)) {
      errors.push({
        code: 'GRID_ID_DUPLICATE',
        message: `Grid con id "${g.id}" duplicado.`,
      });
    }
    gridIdsSeen.add(g.id);
    if (!isRegionId(g.regionId)) {
      errors.push({
        code: 'GRID_REGION_INVALID',
        message: `Grid "${g.id}" referencia regionId "${g.regionId}" inválido.`,
      });
    }
    gridsPerRegion[g.regionId] = (gridsPerRegion[g.regionId] ?? 0) + 1;
    if (g.isStartingGrid) {
      startingCount++;
      startingGridFound = g;
    }
  }
  for (const rid of REGION_IDS) {
    const expected = WORLD_CIFRAS.gridsByRegion[rid];
    const actual = gridsPerRegion[rid] ?? 0;
    if (actual !== expected) {
      errors.push({
        code: 'GRID_PER_REGION_MISMATCH',
        message: `Región "${rid}" tiene ${actual} grids, esperado ${expected}.`,
      });
    }
  }
  if (startingCount !== 1) {
    errors.push({
      code: 'GRID_STARTING_COUNT_MISMATCH',
      message: `Esperaba 1 grid con isStartingGrid=true, encontré ${startingCount}.`,
    });
  }
  if (startingGridFound && startingGridFound.regionId !== 'sur') {
    errors.push({
      code: 'GRID_STARTING_NOT_IN_SUR',
      message: `Starting grid "${startingGridFound.id}" no está en el Sur (regionId="${startingGridFound.regionId}").`,
    });
  }

  // -- POIs --
  if (pois.length !== WORLD_CIFRAS.totalPOIs) {
    errors.push({
      code: 'POI_COUNT_MISMATCH',
      message: `Esperaba ${WORLD_CIFRAS.totalPOIs} POIs, encontré ${pois.length}.`,
    });
  }
  const poiIdsSeen = new Set<string>();
  const poisPerGrid: Record<string, number> = {};
  let curatedCount = 0;
  const curatedPerRegion: Record<string, number> = {};
  for (const p of pois) {
    if (poiIdsSeen.has(p.id)) {
      errors.push({
        code: 'POI_ID_DUPLICATE',
        message: `POI con id "${p.id}" duplicado.`,
      });
    }
    poiIdsSeen.add(p.id);
    if (!gridIdsSeen.has(p.gridId)) {
      errors.push({
        code: 'POI_GRID_INVALID',
        message: `POI "${p.id}" referencia gridId "${p.gridId}" inexistente.`,
      });
      continue;
    }
    poisPerGrid[p.gridId] = (poisPerGrid[p.gridId] ?? 0) + 1;
    if (p.hasCuratedSlot) {
      curatedCount++;
      // Determinamos la región del POI a través del grid.
      const grid = grids.find((g) => g.id === p.gridId);
      if (grid) {
        curatedPerRegion[grid.regionId] = (curatedPerRegion[grid.regionId] ?? 0) + 1;
      }
    }
  }
  for (const gid of gridIdsSeen) {
    const actual = poisPerGrid[gid] ?? 0;
    if (actual !== WORLD_CIFRAS.poisPerGrid) {
      errors.push({
        code: 'POI_PER_GRID_MISMATCH',
        message: `Grid "${gid}" tiene ${actual} POIs, esperado ${WORLD_CIFRAS.poisPerGrid}.`,
      });
    }
  }
  if (curatedCount !== WORLD_CIFRAS.totalCurated) {
    errors.push({
      code: 'POI_CURATED_COUNT_MISMATCH',
      message: `Esperaba ${WORLD_CIFRAS.totalCurated} POIs curados, encontré ${curatedCount}.`,
    });
  }
  for (const rid of REGION_IDS) {
    const expected = WORLD_CIFRAS.curatedByRegion[rid];
    const actual = curatedPerRegion[rid] ?? 0;
    if (actual !== expected) {
      errors.push({
        code: 'POI_CURATED_PER_REGION_MISMATCH',
        message: `Región "${rid}" tiene ${actual} POIs curados, esperado ${expected}.`,
      });
    }
  }

  return errors;
}

// -----------------------------------------------------------------------------
// Carga del dataset estático
// -----------------------------------------------------------------------------
// Los JSON se importan estáticamente (resolveJsonModule). Aquí los castamos
// a los tipos del módulo y validamos. Si la validación falla, lanzamos al
// cargar — preferimos romper la app al inicio que tener un mundo corrupto.

const REGIONS: readonly Region[] = regionesData as readonly Region[];
const GRIDS: readonly Grid[] = gridsData as readonly Grid[];
const POIS: readonly POI[] = poisData as readonly POI[];

const _validationErrors = validateWorldData(REGIONS, GRIDS, POIS);
if (_validationErrors.length > 0) {
  const summary = _validationErrors.map((e) => `[${e.code}] ${e.message}`).join(' · ');
  throw new Error(`world.ts: dataset inválido en carga. ${summary}`);
}

// -----------------------------------------------------------------------------
// Selectores puros
// -----------------------------------------------------------------------------
// Sin RNG, sin side effects, sin caches mutables. Todos devuelven referencias
// al dataset interno (que es Readonly): el caller no debe mutar lo devuelto.

// Devuelve la región o null si no existe. Acepta string para no obligar al
// caller a estrechar el tipo antes (los call sites de UI suelen tener strings
// arbitrarios desde URLs / persistencia).
export function getRegion(id: string): Region | null {
  return REGIONS.find((r) => r.id === id) ?? null;
}

// Lista todas las regiones en orden de declaración del JSON. Útil para
// vistas regionales que iteran de izquierda a derecha o por displayName.
export function getAllRegions(): readonly Region[] {
  return REGIONS;
}

// Grids de una región concreta. Devuelve [] si la región no existe (no lanza:
// la UI puede pintar "vacío" sin manejar excepciones). Orden estable: el del
// JSON, que coincide con el orden de creación (centro-001..centro-050, etc.).
export function getGridsByRegion(regionId: string): readonly Grid[] {
  return GRIDS.filter((g) => g.regionId === regionId);
}

// Grid concreto por id. null si no existe.
export function getGrid(id: string): Grid | null {
  return GRIDS.find((g) => g.id === id) ?? null;
}

// Lista de TODOS los grids del overworld. Para iteración global (debug,
// minimaps, validación cruzada). Caller no muta.
export function getAllGrids(): readonly Grid[] {
  return GRIDS;
}

// POIs de un grid concreto. [] si el grid no existe (consistente con
// getGridsByRegion). Devuelve siempre exactamente 4 si el grid existe (el
// validador lo garantiza al cargar).
export function getPOIsByGrid(gridId: string): readonly POI[] {
  return POIS.filter((p) => p.gridId === gridId);
}

// POI concreto por id. null si no existe.
export function getPOI(id: string): POI | null {
  return POIS.find((p) => p.id === id) ?? null;
}

// Lista de TODOS los POIs. Igual que getAllGrids, para iteración global.
export function getAllPOIs(): readonly POI[] {
  return POIS;
}

// Devuelve los 80 POIs con hasCuratedSlot=true. Lo consumirá fase 2 (mapa
// lore-curado → POI) y los tests que validan distribución.
export function getCuratedSlots(): readonly POI[] {
  return POIS.filter((p) => p.hasCuratedSlot);
}

// Grid de inicio. Lanza si no se encuentra (el validador garantiza que existe
// y es único, así que esta excepción es estrictamente "imposible" en runtime;
// la dejamos para que el tipo sea Grid y no Grid | null en el camino feliz).
export function getStartingGrid(): Grid {
  const g = GRIDS.find((x) => x.isStartingGrid);
  if (!g) {
    throw new Error('getStartingGrid: no hay starting grid (validador roto).');
  }
  return g;
}
