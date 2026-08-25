// Tests del módulo SAGRADO src/rules/world.ts (sub-paso 4a H4).
// Validan: cifras canónicas (decisiones #67-#68), distribución por región,
// integridad referencial, selectores puros y el validador estructural.

import { describe, it, expect } from 'vitest';
import {
  REGION_IDS,
  WORLD_CIFRAS,
  validateWorldData,
  getRegion,
  getAllRegions,
  getGrid,
  getGridsByRegion,
  getAllGrids,
  getPOI,
  getPOIsByGrid,
  getAllPOIs,
  getCuratedSlots,
  getStartingGrid,
  getPOIsByArchetype,
  getHomePOI,
  POI_ARCHETYPES,
  type Region,
  type Grid,
  type POI,
  type RegionId,
} from './world';

// =============================================================================
// (a) JSON cargan sin errores
// =============================================================================
// Si el módulo se importa sin lanzar, los JSON se han parseado y han pasado
// la validación interna. Cualquier asserción posterior que use selectores ya
// implica que la carga fue verde.
describe('world.ts — carga del dataset estático', () => {
  it('importa los tres JSON sin lanzar (validación de carga verde)', () => {
    expect(getAllRegions().length).toBeGreaterThan(0);
    expect(getAllGrids().length).toBeGreaterThan(0);
    expect(getAllPOIs().length).toBeGreaterThan(0);
  });

  it('expone las cifras canónicas (decisiones #67-#68)', () => {
    expect(WORLD_CIFRAS.totalRegions).toBe(5);
    expect(WORLD_CIFRAS.totalGrids).toBe(180);
    expect(WORLD_CIFRAS.totalPOIs).toBe(720);
    expect(WORLD_CIFRAS.poisPerGrid).toBe(4);
    expect(WORLD_CIFRAS.totalCurated).toBe(80);
    expect(WORLD_CIFRAS.startingGridId).toBe('sur-001');
  });

  it('los 5 region ids son centro/este/norte/oeste/sur', () => {
    expect([...REGION_IDS].sort()).toEqual(['centro', 'este', 'norte', 'oeste', 'sur']);
  });
});

// =============================================================================
// (b) Conteos exactos: 5 / 180 / 720
// =============================================================================
describe('world.ts — conteos canónicos', () => {
  it('exactamente 5 regiones', () => {
    expect(getAllRegions().length).toBe(5);
  });

  it('exactamente 180 grids', () => {
    expect(getAllGrids().length).toBe(180);
  });

  it('exactamente 720 POIs', () => {
    expect(getAllPOIs().length).toBe(720);
  });
});

// =============================================================================
// (c) Distribución de grids por región: 50/35/35/30/30
// =============================================================================
describe('world.ts — distribución de grids por región', () => {
  it('cada región declara el gridCount esperado', () => {
    const expected: Record<RegionId, number> = {
      centro: 50, norte: 35, sur: 35, este: 30, oeste: 30,
    };
    for (const r of getAllRegions()) {
      expect(r.gridCount).toBe(expected[r.id]);
    }
  });

  it('grids reales por región coinciden con gridCount declarado', () => {
    for (const r of getAllRegions()) {
      const gridsR = getGridsByRegion(r.id);
      expect(gridsR.length).toBe(r.gridCount);
    }
  });

  it('la suma de grids por región es 180', () => {
    let sum = 0;
    for (const r of getAllRegions()) sum += r.gridCount;
    expect(sum).toBe(180);
  });
});

// =============================================================================
// (d) Cada grid tiene exactamente 4 POIs
// =============================================================================
describe('world.ts — POIs por grid', () => {
  it('cada uno de los 180 grids tiene exactamente 4 POIs', () => {
    for (const g of getAllGrids()) {
      const pois = getPOIsByGrid(g.id);
      expect(pois.length).toBe(4);
    }
  });

  it('todos los POIs referencian un grid existente', () => {
    const gridIds = new Set(getAllGrids().map((g) => g.id));
    for (const p of getAllPOIs()) {
      expect(gridIds.has(p.gridId)).toBe(true);
    }
  });

  it('todos los grids referencian una región existente', () => {
    const regionIds = new Set(getAllRegions().map((r) => r.id));
    for (const g of getAllGrids()) {
      expect(regionIds.has(g.regionId)).toBe(true);
    }
  });
});

// =============================================================================
// (e) Curados: 80 totales con distribución 22/16/16/13/13
// =============================================================================
describe('world.ts — POIs curados (hasCuratedSlot=true)', () => {
  it('exactamente 80 POIs con hasCuratedSlot=true', () => {
    const curados = getCuratedSlots();
    expect(curados.length).toBe(80);
  });

  it('distribución por región 22/16/16/13/13', () => {
    const expected: Record<RegionId, number> = {
      centro: 22, norte: 16, sur: 16, este: 13, oeste: 13,
    };
    const actual: Record<RegionId, number> = {
      centro: 0, norte: 0, sur: 0, este: 0, oeste: 0,
    };
    const gridById = new Map(getAllGrids().map((g) => [g.id, g] as const));
    for (const p of getCuratedSlots()) {
      const grid = gridById.get(p.gridId);
      expect(grid).toBeDefined();
      actual[grid!.regionId]++;
    }
    expect(actual).toEqual(expected);
  });

  it('los curados están repartidos uniformemente (no acumulados en pocos grids)', () => {
    // Cada grid puede tener 0 o 1 POI curado (el patrón pone el curado en el
    // POI #1 cuando el grid pertenece al subconjunto). Ningún grid concentra
    // más de 1 curado.
    const curadosPerGrid: Record<string, number> = {};
    for (const p of getCuratedSlots()) {
      curadosPerGrid[p.gridId] = (curadosPerGrid[p.gridId] ?? 0) + 1;
    }
    for (const count of Object.values(curadosPerGrid)) {
      expect(count).toBeLessThanOrEqual(1);
    }
    // 80 grids tienen 1 curado, los otros 100 tienen 0.
    const gridsConCurado = Object.keys(curadosPerGrid).length;
    expect(gridsConCurado).toBe(80);
  });
});

// =============================================================================
// (f) Starting grid: exactamente 1, en el Sur
// =============================================================================
describe('world.ts — starting grid', () => {
  it('exactamente 1 grid con isStartingGrid=true', () => {
    const starters = getAllGrids().filter((g) => g.isStartingGrid);
    expect(starters.length).toBe(1);
  });

  it('el starting grid está en la región sur', () => {
    const start = getStartingGrid();
    expect(start.regionId).toBe('sur');
  });

  it('getStartingGrid coincide con WORLD_CIFRAS.startingGridId', () => {
    expect(getStartingGrid().id).toBe(WORLD_CIFRAS.startingGridId);
  });

  it('el starting grid es sur-001 (primer grid del Sur, hub estructural)', () => {
    const start = getStartingGrid();
    expect(start.id).toBe('sur-001');
  });

  it('la región Sur tiene function="hub_estructural"', () => {
    const sur = getRegion('sur');
    expect(sur).not.toBeNull();
    expect(sur!.function).toBe('hub_estructural');
  });

  it('las otras 4 regiones tienen function="pendiente_fase_2"', () => {
    for (const rid of ['centro', 'norte', 'este', 'oeste'] as RegionId[]) {
      const r = getRegion(rid);
      expect(r).not.toBeNull();
      expect(r!.function).toBe('pendiente_fase_2');
    }
  });
});

// =============================================================================
// (g) Selectores: éxito, fallo y bordes
// =============================================================================
describe('world.ts — selectores', () => {
  it('getRegion("sur") devuelve la región sur', () => {
    const r = getRegion('sur');
    expect(r).not.toBeNull();
    expect(r!.id).toBe('sur');
    expect(r!.gridCount).toBe(35);
  });

  it('getRegion con id inválido devuelve null', () => {
    expect(getRegion('regiox')).toBeNull();
    expect(getRegion('')).toBeNull();
  });

  it('getGrid devuelve el grid correcto y null para inválidos', () => {
    const g = getGrid('sur-001');
    expect(g).not.toBeNull();
    expect(g!.regionId).toBe('sur');
    expect(g!.isStartingGrid).toBe(true);
    expect(getGrid('zzzz-999')).toBeNull();
    expect(getGrid('')).toBeNull();
  });

  it('getGridsByRegion devuelve [] para región inexistente', () => {
    expect(getGridsByRegion('regiox')).toEqual([]);
  });

  it('getGridsByRegion("centro") devuelve 50 grids con regionId=centro', () => {
    const gridsC = getGridsByRegion('centro');
    expect(gridsC.length).toBe(50);
    for (const g of gridsC) {
      expect(g.regionId).toBe('centro');
    }
  });

  it('getPOI devuelve el POI correcto y null para inválidos', () => {
    const p = getPOI('sur-001-poi-1');
    expect(p).not.toBeNull();
    expect(p!.gridId).toBe('sur-001');
    expect(getPOI('inexistente')).toBeNull();
    expect(getPOI('')).toBeNull();
  });

  it('getPOIsByGrid devuelve [] para grid inexistente', () => {
    expect(getPOIsByGrid('zzzz-999')).toEqual([]);
  });

  it('getPOIsByGrid("sur-001") devuelve 4 POIs ordenados por id', () => {
    const pois = getPOIsByGrid('sur-001');
    expect(pois.length).toBe(4);
    const ids = pois.map((p) => p.id);
    expect(ids).toEqual([
      'sur-001-poi-1', 'sur-001-poi-2', 'sur-001-poi-3', 'sur-001-poi-4',
    ]);
  });

  it('getAllRegions / getAllGrids / getAllPOIs son deterministas (mismo orden en lecturas sucesivas)', () => {
    const r1 = getAllRegions().map((r) => r.id);
    const r2 = getAllRegions().map((r) => r.id);
    expect(r1).toEqual(r2);
    const g1 = getAllGrids().map((g) => g.id);
    const g2 = getAllGrids().map((g) => g.id);
    expect(g1).toEqual(g2);
    const p1 = getAllPOIs().map((p) => p.id);
    const p2 = getAllPOIs().map((p) => p.id);
    expect(p1).toEqual(p2);
  });
});

// =============================================================================
// Integridad de ids: forma "regionId-NNN" / "gridId-poi-N"
// =============================================================================
describe('world.ts — convenciones de id', () => {
  it('todos los grid ids siguen el patrón "<region>-<NNN>" (3 dígitos)', () => {
    const re = /^(centro|norte|sur|este|oeste)-\d{3}$/;
    for (const g of getAllGrids()) {
      expect(g.id).toMatch(re);
    }
  });

  it('todos los POI ids siguen el patrón "<gridId>-poi-<1..4>"', () => {
    const re = /^(centro|norte|sur|este|oeste)-\d{3}-poi-[1-4]$/;
    for (const p of getAllPOIs()) {
      expect(p.id).toMatch(re);
    }
  });

  it('cada POI id empieza con su gridId', () => {
    for (const p of getAllPOIs()) {
      expect(p.id.startsWith(p.gridId + '-poi-')).toBe(true);
    }
  });
});

// =============================================================================
// (i) Pase de datos 4b.0 — arquetipos por región (decisión #89)
// =============================================================================
describe('world.ts — arquetipos de POI (4b.0)', () => {
  it('los 4 arquetipos declarados son natural/ruina/asentamiento/arcano', () => {
    expect([...POI_ARCHETYPES].sort()).toEqual(['arcano', 'asentamiento', 'natural', 'ruina']);
  });

  it('todo POI tiene un arquetipo del catálogo', () => {
    for (const p of getAllPOIs()) {
      expect(POI_ARCHETYPES).toContain(p.archetype);
    }
  });

  it('cada región cumple exactamente su cuota de arquetipos', () => {
    for (const rid of REGION_IDS) {
      const gridIds = new Set(getGridsByRegion(rid).map((g) => g.id));
      const pois = getAllPOIs().filter((p) => gridIds.has(p.gridId));
      for (const arch of POI_ARCHETYPES) {
        const actual = pois.filter((p) => p.archetype === arch).length;
        expect(actual).toBe(WORLD_CIFRAS.archetypesByRegion[rid][arch]);
      }
    }
  });

  it('las cuotas por región suman los POIs de esa región y 720 en total', () => {
    let total = 0;
    for (const rid of REGION_IDS) {
      const cuota = WORLD_CIFRAS.archetypesByRegion[rid];
      const suma = POI_ARCHETYPES.reduce((acc, a) => acc + cuota[a], 0);
      expect(suma).toBe(WORLD_CIFRAS.gridsByRegion[rid] * WORLD_CIFRAS.poisPerGrid);
      total += suma;
    }
    expect(total).toBe(WORLD_CIFRAS.totalPOIs);
  });

  it('el Sur es la región con más asentamientos, en absoluto y en densidad (#82)', () => {
    const densidad = (rid: RegionId): number =>
      WORLD_CIFRAS.archetypesByRegion[rid].asentamiento /
      (WORLD_CIFRAS.gridsByRegion[rid] * WORLD_CIFRAS.poisPerGrid);
    for (const rid of REGION_IDS) {
      if (rid === 'sur') continue;
      expect(WORLD_CIFRAS.archetypesByRegion.sur.asentamiento).toBeGreaterThan(
        WORLD_CIFRAS.archetypesByRegion[rid].asentamiento,
      );
      expect(densidad('sur')).toBeGreaterThan(densidad(rid));
    }
  });

  it('arcano es raro en todo el overworld: menos del 3% de los POIs (#47)', () => {
    const arcanos = getPOIsByArchetype('arcano').length;
    expect(arcanos / WORLD_CIFRAS.totalPOIs).toBeLessThan(0.03);
    expect(arcanos).toBeGreaterThan(0);
  });

  it('ningún grid tiene sus 4 POIs del mismo arquetipo', () => {
    for (const g of getAllGrids()) {
      const arqs = new Set(getPOIsByGrid(g.id).map((p) => p.archetype));
      expect(arqs.size).toBeGreaterThan(1);
    }
  });

  it('getPOIsByArchetype particiona el dataset completo', () => {
    const suma = POI_ARCHETYPES.reduce((acc, a) => acc + getPOIsByArchetype(a).length, 0);
    expect(suma).toBe(WORLD_CIFRAS.totalPOIs);
  });
});

// =============================================================================
// (j) Pase de datos 4b.0 — el Hogar (decisión #85)
// =============================================================================
describe('world.ts — el Hogar', () => {
  it('getHomePOI devuelve un POI Asentamiento en el grid de inicio', () => {
    const home = getHomePOI();
    expect(home.id).toBe(WORLD_CIFRAS.homePOIId);
    expect(home.archetype).toBe('asentamiento');
    expect(home.gridId).toBe(WORLD_CIFRAS.startingGridId);
  });

  it('el Hogar lleva slot curado: fase 2 escribe ahí el contenido del hub', () => {
    expect(getHomePOI().hasCuratedSlot).toBe(true);
  });
});

// =============================================================================
// (k) Pase de datos 4b.0 — posiciones en el mini-grid 5×5 (decisiones #89, #91)
// =============================================================================
describe('world.ts — posiciones de POI en el mini-grid', () => {
  it('toda posición cae dentro de 0..4 y es entera', () => {
    const max = WORLD_CIFRAS.miniGridSize - 1;
    for (const p of getAllPOIs()) {
      expect(Number.isInteger(p.position.x)).toBe(true);
      expect(Number.isInteger(p.position.y)).toBe(true);
      expect(p.position.x).toBeGreaterThanOrEqual(0);
      expect(p.position.x).toBeLessThanOrEqual(max);
      expect(p.position.y).toBeGreaterThanOrEqual(0);
      expect(p.position.y).toBeLessThanOrEqual(max);
    }
  });

  it('ningún POI ocupa la celda central reservada al PJ (#91)', () => {
    for (const p of getAllPOIs()) {
      expect(p.position).not.toEqual(WORLD_CIFRAS.playerCell);
    }
  });

  it('los 4 POIs de un grid ocupan 4 celdas distintas', () => {
    for (const g of getAllGrids()) {
      const celdas = new Set(getPOIsByGrid(g.id).map((p) => `${p.position.x},${p.position.y}`));
      expect(celdas.size).toBe(WORLD_CIFRAS.poisPerGrid);
    }
  });

  it('cada POI se queda en el cuadrante que le toca por índice', () => {
    // poi-1 arriba-izquierda, poi-2 arriba-derecha, poi-3 abajo-izquierda,
    // poi-4 abajo-derecha. El jitter sólo mueve 1 celda dentro del cuadrante.
    const base: Record<string, { x: number; y: number }> = {
      '1': { x: 0, y: 0 },
      '2': { x: 3, y: 0 },
      '3': { x: 0, y: 3 },
      '4': { x: 3, y: 3 },
    };
    for (const p of getAllPOIs()) {
      const k = p.id.slice(p.id.lastIndexOf('-') + 1);
      const b = base[k]!;
      expect(p.position.x - b.x).toBeGreaterThanOrEqual(0);
      expect(p.position.x - b.x).toBeLessThanOrEqual(1);
      expect(p.position.y - b.y).toBeGreaterThanOrEqual(0);
      expect(p.position.y - b.y).toBeLessThanOrEqual(1);
    }
  });

  it('los 180 grids ya NO comparten un único layout (el problema que abrió 4b.0)', () => {
    const layouts = new Set<string>();
    for (const g of getAllGrids()) {
      const firma = getPOIsByGrid(g.id)
        .map((p) => `${p.position.x},${p.position.y}`)
        .sort()
        .join('|');
      layouts.add(firma);
    }
    // 4a entregaba 1 layout para los 180 grids. Tras 4b.0 son 125.
    expect(layouts.size).toBe(125);
  });
});

// =============================================================================
// Validador puro (validateWorldData) con datos sintéticos
// =============================================================================
// El validador es exportado: lo testeamos directamente con datos que rompen
// invariantes. Cubre los códigos de error que el módulo ya valida en carga.
describe('validateWorldData', () => {
  // Helper para construir regiones sintéticas. Para grids y POIs se prefiere
  // partir del dataset real y mutar (más realista que reconstruirlo a mano).
  function mkRegion(over: Partial<Region> = {}): Region {
    return {
      id: 'centro',
      displayName: 'X',
      gridCount: 50,
      colorHex: '#000000',
      function: 'pendiente_fase_2',
      ...over,
    };
  }

  it('detecta REGION_COUNT_MISMATCH si faltan regiones', () => {
    const errs = validateWorldData([mkRegion()], [], []);
    const codes = errs.map((e) => e.code);
    expect(codes).toContain('REGION_COUNT_MISMATCH');
  });

  it('detecta GRID_COUNT_MISMATCH si la lista de grids no es 180', () => {
    const regs: Region[] = [
      mkRegion({ id: 'centro', gridCount: 50 }),
      mkRegion({ id: 'norte', gridCount: 35 }),
      mkRegion({ id: 'sur', gridCount: 35, function: 'hub_estructural' }),
      mkRegion({ id: 'este', gridCount: 30 }),
      mkRegion({ id: 'oeste', gridCount: 30 }),
    ];
    const errs = validateWorldData(regs, [], []);
    const codes = errs.map((e) => e.code);
    expect(codes).toContain('GRID_COUNT_MISMATCH');
  });

  it('detecta GRID_STARTING_NOT_IN_SUR si el starting grid está en otra región', () => {
    // Construye el dataset real desde los selectores y pivota un grid: ponemos
    // isStartingGrid=true en un grid de Centro y false en sur-001.
    const regsReal = [...getAllRegions()];
    const gridsReal: Grid[] = getAllGrids().map((g) => {
      if (g.id === 'sur-001') return { ...g, isStartingGrid: false };
      if (g.id === 'centro-001') return { ...g, isStartingGrid: true };
      return g;
    });
    const poisReal = [...getAllPOIs()];
    const errs = validateWorldData(regsReal, gridsReal, poisReal);
    const codes = errs.map((e) => e.code);
    expect(codes).toContain('GRID_STARTING_NOT_IN_SUR');
  });

  it('detecta GRID_STARTING_COUNT_MISMATCH si hay 0 o 2 starting grids', () => {
    const regsReal = [...getAllRegions()];
    const gridsZero: Grid[] = getAllGrids().map((g) =>
      g.isStartingGrid ? { ...g, isStartingGrid: false } : g,
    );
    const errsZero = validateWorldData(regsReal, gridsZero, [...getAllPOIs()]);
    expect(errsZero.map((e) => e.code)).toContain('GRID_STARTING_COUNT_MISMATCH');

    const gridsTwo: Grid[] = getAllGrids().map((g) =>
      g.id === 'centro-001' ? { ...g, isStartingGrid: true } : g,
    );
    const errsTwo = validateWorldData(regsReal, gridsTwo, [...getAllPOIs()]);
    expect(errsTwo.map((e) => e.code)).toContain('GRID_STARTING_COUNT_MISMATCH');
  });

  it('detecta POI_CURATED_COUNT_MISMATCH si los curados no suman 80', () => {
    const regsReal = [...getAllRegions()];
    const gridsReal = [...getAllGrids()];
    // Quita el curado al primer POI que lo lleva → 79.
    const poisMod: POI[] = getAllPOIs().map((p, _idx) => p);
    const firstCuratedIdx = poisMod.findIndex((p) => p.hasCuratedSlot);
    poisMod[firstCuratedIdx] = { ...poisMod[firstCuratedIdx]!, hasCuratedSlot: false };
    const errs = validateWorldData(regsReal, gridsReal, poisMod);
    const codes = errs.map((e) => e.code);
    expect(codes).toContain('POI_CURATED_COUNT_MISMATCH');
  });

  it('detecta POI_PER_GRID_MISMATCH si un grid tiene !=4 POIs', () => {
    const regsReal = [...getAllRegions()];
    const gridsReal = [...getAllGrids()];
    // Elimina el primer POI del primer grid → ese grid queda con 3.
    const poisMod = getAllPOIs().filter((p) => p.id !== getAllPOIs()[0]!.id);
    const errs = validateWorldData(regsReal, gridsReal, poisMod);
    const codes = errs.map((e) => e.code);
    expect(codes).toContain('POI_COUNT_MISMATCH');
    expect(codes).toContain('POI_PER_GRID_MISMATCH');
  });

  it('detecta REGION_DUPLICATE_ID y GRID_ID_DUPLICATE', () => {
    const regs: Region[] = [
      mkRegion({ id: 'centro', gridCount: 50 }),
      mkRegion({ id: 'centro', gridCount: 35 }), // duplicado
      mkRegion({ id: 'sur', gridCount: 35, function: 'hub_estructural' }),
      mkRegion({ id: 'este', gridCount: 30 }),
      mkRegion({ id: 'oeste', gridCount: 30 }),
    ];
    const errs = validateWorldData(regs, [], []);
    expect(errs.map((e) => e.code)).toContain('REGION_DUPLICATE_ID');

    // Grid duplicado: usamos el dataset real y duplicamos el primer grid.
    const gridsDup: Grid[] = [...getAllGrids(), { ...getAllGrids()[0]! }];
    const errs2 = validateWorldData([...getAllRegions()], gridsDup, [...getAllPOIs()]);
    expect(errs2.map((e) => e.code)).toContain('GRID_ID_DUPLICATE');
  });

  // -- Códigos añadidos en 4b.0 --

  it('detecta POI_ARCHETYPE_INVALID con un arquetipo fuera del catálogo', () => {
    const poisMod: POI[] = [...getAllPOIs()];
    poisMod[0] = { ...poisMod[0]!, archetype: 'pantano' as POI['archetype'] };
    const errs = validateWorldData(getAllRegions(), getAllGrids(), poisMod);
    expect(errs.map((e) => e.code)).toContain('POI_ARCHETYPE_INVALID');
  });

  it('detecta POI_ARCHETYPE_PER_REGION_MISMATCH si se altera una cuota', () => {
    // Convierte un 'natural' del Centro en 'ruina': rompe dos cuotas a la vez.
    const poisMod: POI[] = [...getAllPOIs()];
    const idx = poisMod.findIndex((p) => p.gridId.startsWith('centro') && p.archetype === 'natural');
    poisMod[idx] = { ...poisMod[idx]!, archetype: 'ruina' };
    const errs = validateWorldData(getAllRegions(), getAllGrids(), poisMod);
    expect(errs.map((e) => e.code)).toContain('POI_ARCHETYPE_PER_REGION_MISMATCH');
  });

  it('detecta POI_POSITION_OUT_OF_BOUNDS fuera del mini-grid', () => {
    const poisMod: POI[] = [...getAllPOIs()];
    poisMod[0] = { ...poisMod[0]!, position: { x: 7, y: 0 } };
    const errs = validateWorldData(getAllRegions(), getAllGrids(), poisMod);
    expect(errs.map((e) => e.code)).toContain('POI_POSITION_OUT_OF_BOUNDS');
  });

  it('detecta POI_POSITION_ON_PLAYER_CELL en la celda central', () => {
    const poisMod: POI[] = [...getAllPOIs()];
    poisMod[0] = { ...poisMod[0]!, position: { ...WORLD_CIFRAS.playerCell } };
    const errs = validateWorldData(getAllRegions(), getAllGrids(), poisMod);
    expect(errs.map((e) => e.code)).toContain('POI_POSITION_ON_PLAYER_CELL');
  });

  it('detecta POI_POSITION_DUPLICATE_IN_GRID si dos POIs comparten celda', () => {
    const poisMod: POI[] = [...getAllPOIs()];
    // Los POIs 1 y 2 del primer grid van a la misma celda.
    poisMod[1] = { ...poisMod[1]!, position: { ...poisMod[0]!.position } };
    const errs = validateWorldData(getAllRegions(), getAllGrids(), poisMod);
    expect(errs.map((e) => e.code)).toContain('POI_POSITION_DUPLICATE_IN_GRID');
  });

  it('detecta HOME_POI_NOT_ASENTAMIENTO si el Hogar cambia de arquetipo', () => {
    const poisMod: POI[] = getAllPOIs().map((p) =>
      p.id === WORLD_CIFRAS.homePOIId ? { ...p, archetype: 'ruina' as const } : p,
    );
    const errs = validateWorldData(getAllRegions(), getAllGrids(), poisMod);
    expect(errs.map((e) => e.code)).toContain('HOME_POI_NOT_ASENTAMIENTO');
  });

  it('detecta HOME_POI_MISSING si el Hogar no está en el dataset', () => {
    const poisMod = getAllPOIs().filter((p) => p.id !== WORLD_CIFRAS.homePOIId);
    const errs = validateWorldData(getAllRegions(), getAllGrids(), poisMod);
    expect(errs.map((e) => e.code)).toContain('HOME_POI_MISSING');
  });

  it('dataset real (importado) pasa el validador sin errores', () => {
    const errs = validateWorldData(getAllRegions(), getAllGrids(), getAllPOIs());
    expect(errs).toEqual([]);
  });
});
