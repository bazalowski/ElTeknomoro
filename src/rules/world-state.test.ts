// Tests del módulo SAGRADO src/rules/world-state.ts (sub-paso 4b.0 H4).
// Validan: estado inicial, pureza de las transiciones, adyacencia cardinal
// como única vía de viaje (#88), monotonía de la niebla (§9.9) e hidratación
// defensiva desde persistencia (#90).

import { describe, it, expect } from 'vitest';
import {
  createInitialWorldState,
  getGridState,
  getPOIState,
  isGridExplored,
  hasAnchor,
  canTravelTo,
  setGridState,
  setPOIState,
  moveToGrid,
  setView,
  placeAnchor,
  removeAnchor,
  revealPOI,
  completePOI,
  getGridPOIProgress,
  deriveGridState,
  hydrateWorldState,
  type WorldState,
} from './world-state';
import {
  WORLD_CIFRAS,
  getCardinalNeighbours,
  areGridsAdjacent,
  getAllGrids,
  getPOIsByGrid,
} from './world';

const vecinoDeInicio = (): string => getCardinalNeighbours(WORLD_CIFRAS.startingGridId)[0]!.id;

// =============================================================================
// (a) Estado inicial
// =============================================================================
describe('world-state — estado inicial', () => {
  it('arranca en el grid de inicio, en vista regional, día 1', () => {
    const s = createInitialWorldState();
    expect(s.currentGridId).toBe(WORLD_CIFRAS.startingGridId);
    expect(s.view).toEqual({ kind: 'region' });
    expect(s.day).toBe(1);
    expect(s.actionsSpent).toBe(0);
    // El grid natal arranca con ancla (#103, Q6): es la única excepción a "no
    // hay anclas prediseñadas", y sin ella el PJ no tendría a dónde volver.
    expect(s.anchors).toEqual([WORLD_CIFRAS.startingGridId]);
  });

  it('sólo el grid natal arranca explorado (Q16a del cuestionario de 4b)', () => {
    const s = createInitialWorldState();
    expect(getGridState(s, WORLD_CIFRAS.startingGridId)).toBe('explorado');
    const otros = getAllGrids().filter((g) => g.id !== WORLD_CIFRAS.startingGridId);
    for (const g of otros) {
      expect(getGridState(s, g.id)).toBe('inexplorado');
    }
  });

  it('el Hogar arranca revelado y el resto de POIs bajo niebla (§9.9)', () => {
    const s = createInitialWorldState();
    expect(getPOIState(s, WORLD_CIFRAS.homePOIId)).toBe('revelado');
    expect(getPOIState(s, 'centro-001-poi-1')).toBeNull();
  });

  it('el estado inicial es escaso: no guarda 180 grids ni 720 POIs', () => {
    const s = createInitialWorldState();
    expect(Object.keys(s.gridStates).length).toBe(1);
    expect(Object.keys(s.poiStates).length).toBe(1);
  });
});

// =============================================================================
// (b) Pureza
// =============================================================================
describe('world-state — pureza de las transiciones', () => {
  it('ninguna transición muta el estado recibido', () => {
    const s = createInitialWorldState();
    const copia = JSON.parse(JSON.stringify(s)) as WorldState;
    setGridState(s, 'centro-001', 'explorado');
    setPOIState(s, 'centro-001-poi-1', 'revelado');
    moveToGrid(s, vecinoDeInicio());
    setView(s, { kind: 'grid', gridId: 'centro-001' });
    placeAnchor(s, 'centro-001');
    expect(s).toEqual(copia);
  });

  it('devuelve el MISMO objeto cuando la transición es un no-op', () => {
    const s = createInitialWorldState();
    // Bajar de rango no hace nada.
    expect(setGridState(s, WORLD_CIFRAS.startingGridId, 'explorado')).toBe(s);
    // Grid inexistente tampoco.
    expect(setPOIState(s, 'no-existe-poi', 'revelado')).toBe(s);
    expect(setView(s, { kind: 'grid', gridId: 'no-existe' })).toBe(s);
  });
});

// =============================================================================
// (c) Viaje: adyacencia cardinal (decisión #88)
// =============================================================================
describe('world-state — viaje por adyacencia cardinal', () => {
  it('se puede viajar a un vecino cardinal', () => {
    const s = createInitialWorldState();
    const destino = vecinoDeInicio();
    expect(canTravelTo(s, destino)).toBe(true);
    const s2 = moveToGrid(s, destino);
    expect(s2.currentGridId).toBe(destino);
    expect(isGridExplored(s2, destino)).toBe(true);
  });

  it('NO se puede viajar a un grid lejano ni a uno inexistente', () => {
    const s = createInitialWorldState();
    const lejano = getAllGrids().find(
      (g) => g.regionId === 'norte' && !areGridsAdjacent(s.currentGridId, g.id),
    )!;
    expect(canTravelTo(s, lejano.id)).toBe(false);
    expect(moveToGrid(s, lejano.id)).toBe(s);
    expect(canTravelTo(s, 'no-existe')).toBe(false);
  });

  it('viajar al grid donde ya estás no es un movimiento', () => {
    const s = createInitialWorldState();
    expect(canTravelTo(s, s.currentGridId)).toBe(false);
  });

  it('mirar no es viajar: setView a un grid lejano no mueve al PJ (#88)', () => {
    const s = createInitialWorldState();
    const lejano = getAllGrids().find((g) => g.regionId === 'norte')!;
    const s2 = setView(s, { kind: 'grid', gridId: lejano.id });
    expect(s2.view).toEqual({ kind: 'grid', gridId: lejano.id });
    expect(s2.currentGridId).toBe(WORLD_CIFRAS.startingGridId);
    expect(isGridExplored(s2, lejano.id)).toBe(false);
  });

  it('el mundo entero es alcanzable a saltos cardinales desde el inicio', () => {
    // Si esto falla, hay grids inaccesibles y 4b pintaría mapa muerto.
    const vistos = new Set<string>([WORLD_CIFRAS.startingGridId]);
    const cola: string[] = [WORLD_CIFRAS.startingGridId];
    while (cola.length > 0) {
      const actual = cola.pop()!;
      for (const v of getCardinalNeighbours(actual)) {
        if (!vistos.has(v.id)) {
          vistos.add(v.id);
          cola.push(v.id);
        }
      }
    }
    expect(vistos.size).toBe(WORLD_CIFRAS.totalGrids);
  });
});

// =============================================================================
// (d) La niebla no se re-cierra (§9.9)
// =============================================================================
describe('world-state — monotonía de la niebla', () => {
  it('el estado del grid sube pero nunca baja', () => {
    let s = createInitialWorldState();
    s = setGridState(s, 'centro-001', 'explorado');
    expect(getGridState(s, 'centro-001')).toBe('explorado');
    s = setGridState(s, 'centro-001', 'controlado');
    expect(getGridState(s, 'centro-001')).toBe('controlado');
    s = setGridState(s, 'centro-001', 'explorado');
    expect(getGridState(s, 'centro-001')).toBe('controlado');
    s = setGridState(s, 'centro-001', 'inexplorado');
    expect(getGridState(s, 'centro-001')).toBe('controlado');
  });

  it('un POI completado no vuelve a estar sólo revelado', () => {
    let s = createInitialWorldState();
    s = setPOIState(s, 'centro-001-poi-1', 'revelado');
    expect(getPOIState(s, 'centro-001-poi-1')).toBe('revelado');
    s = setPOIState(s, 'centro-001-poi-1', 'completado');
    s = setPOIState(s, 'centro-001-poi-1', 'revelado');
    expect(getPOIState(s, 'centro-001-poi-1')).toBe('completado');
  });

  it('placeAnchor no duplica ni acepta grids inexistentes', () => {
    let s = createInitialWorldState();
    s = placeAnchor(s, 'centro-001');
    s = placeAnchor(s, 'centro-001');
    expect(s.anchors).toEqual([WORLD_CIFRAS.startingGridId, 'centro-001']);
    expect(hasAnchor(s, 'centro-001')).toBe(true);
    expect(placeAnchor(s, 'no-existe')).toBe(s);
  });
});

// =============================================================================
// (e) Hidratación defensiva desde persistencia (decisión #90)
// =============================================================================
describe('world-state — hydrateWorldState', () => {
  it('null (save anterior a 4b.0) cae al estado inicial', () => {
    expect(hydrateWorldState(null)).toEqual(createInitialWorldState());
    expect(hydrateWorldState(undefined)).toEqual(createInitialWorldState());
    expect(hydrateWorldState('basura')).toEqual(createInitialWorldState());
  });

  it('un round-trip por JSON devuelve el mismo estado', () => {
    let s = createInitialWorldState();
    s = moveToGrid(s, vecinoDeInicio());
    s = setPOIState(s, 'centro-001-poi-1', 'completado');
    s = placeAnchor(s, 'centro-001');
    s = setView(s, { kind: 'grid', gridId: 'centro-001' });
    expect(hydrateWorldState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('descarta ids que ya no existen en el dataset sin romper', () => {
    const s = hydrateWorldState({
      version: 1,
      currentGridId: 'grid-fantasma',
      view: { kind: 'grid', gridId: 'grid-fantasma' },
      gridStates: { 'centro-001': 'explorado', 'grid-fantasma': 'controlado' },
      poiStates: { 'centro-001-poi-1': 'revelado', 'poi-fantasma': 'completado' },
      anchors: ['centro-001', 'grid-fantasma'],
      day: 4,
      actionsSpent: 3,
    });
    expect(s.currentGridId).toBe(WORLD_CIFRAS.startingGridId);
    expect(s.view).toEqual({ kind: 'region' });
    expect(Object.keys(s.gridStates).sort()).toEqual(['centro-001', WORLD_CIFRAS.startingGridId]);
    expect(Object.keys(s.poiStates)).toEqual(['centro-001-poi-1']);
    expect(s.anchors).toEqual(['centro-001', WORLD_CIFRAS.startingGridId]);
    expect(s.day).toBe(4);
    expect(s.actionsSpent).toBe(3);
  });

  it('descarta valores basura de estado y de contadores', () => {
    const s = hydrateWorldState({
      gridStates: { 'centro-001': 'quemado' },
      poiStates: { 'centro-001-poi-1': 42 },
      anchors: 'no-es-array',
      day: -3,
      actionsSpent: 'muchas',
    });
    expect(s.gridStates['centro-001']).toBeUndefined();
    expect(s.poiStates['centro-001-poi-1']).toBeUndefined();
    // Las anclas basura se descartan, pero la del Hogar se repone siempre.
    expect(s.anchors).toEqual([WORLD_CIFRAS.startingGridId]);
    expect(s.day).toBe(1);
    expect(s.actionsSpent).toBe(0);
  });

  it('el grid donde está el PJ siempre queda explorado tras hidratar', () => {
    const s = hydrateWorldState({ currentGridId: 'centro-001', gridStates: {} });
    expect(getGridState(s, 'centro-001')).toBe('explorado');
  });
});

// =============================================================================
// (g) POIs y derivación del estado del grid (sub-paso 4c.0, #94)
// =============================================================================
describe('world-state — revealPOI / completePOI', () => {
  it('revealPOI saca al POI de la niebla', () => {
    const s = revealPOI(createInitialWorldState(), 'centro-001-poi-1');
    expect(getPOIState(s, 'centro-001-poi-1')).toBe('revelado');
  });

  it('completePOI marca completado desde niebla o desde revelado', () => {
    const desdeNiebla = completePOI(createInitialWorldState(), 'centro-001-poi-1');
    expect(getPOIState(desdeNiebla, 'centro-001-poi-1')).toBe('completado');

    let s = revealPOI(createInitialWorldState(), 'centro-001-poi-2');
    s = completePOI(s, 'centro-001-poi-2');
    expect(getPOIState(s, 'centro-001-poi-2')).toBe('completado');
  });

  it('revealPOI no degrada un POI ya completado', () => {
    let s = completePOI(createInitialWorldState(), 'centro-001-poi-1');
    s = revealPOI(s, 'centro-001-poi-1');
    expect(getPOIState(s, 'centro-001-poi-1')).toBe('completado');
  });

  it('son puras: no mutan el estado recibido', () => {
    const s = createInitialWorldState();
    revealPOI(s, 'centro-001-poi-1');
    completePOI(s, 'centro-001-poi-2');
    expect(getPOIState(s, 'centro-001-poi-1')).toBeNull();
    expect(getPOIState(s, 'centro-001-poi-2')).toBeNull();
  });

  it('ignoran ids de POI que no existen', () => {
    const s = createInitialWorldState();
    expect(revealPOI(s, 'no-existe')).toBe(s);
    expect(completePOI(s, 'no-existe')).toBe(s);
  });
});

describe('world-state — getGridPOIProgress', () => {
  it('cuenta revelados y completados sobre el total del grid', () => {
    const total = getPOIsByGrid('centro-001').length;
    let s = createInitialWorldState();
    expect(getGridPOIProgress(s, 'centro-001')).toEqual({ total, revealed: 0, completed: 0 });

    s = revealPOI(s, 'centro-001-poi-1');
    s = completePOI(s, 'centro-001-poi-2');
    expect(getGridPOIProgress(s, 'centro-001')).toEqual({ total, revealed: 2, completed: 1 });
  });

  it('un POI completado cuenta también como revelado', () => {
    const s = completePOI(createInitialWorldState(), 'centro-001-poi-1');
    const p = getGridPOIProgress(s, 'centro-001');
    expect(p.revealed).toBe(1);
    expect(p.completed).toBe(1);
  });
});

describe('world-state — deriveGridState (#94)', () => {
  it('un grid sin POIs revelados y no pisado es inexplorado', () => {
    const s = createInitialWorldState();
    expect(deriveGridState(s, 'centro-001')).toBe('inexplorado');
  });

  it('un POI revelado basta para que el grid sea explorado', () => {
    const s = revealPOI(createInitialWorldState(), 'centro-001-poi-1');
    expect(deriveGridState(s, 'centro-001')).toBe('explorado');
  });

  it('pisar el grid también lo hace explorado, sin entrar a ningún POI', () => {
    const destino = vecinoDeInicio();
    const s = moveToGrid(createInitialWorldState(), destino);
    expect(getGridPOIProgress(s, destino).revealed).toBe(0);
    expect(deriveGridState(s, destino)).toBe('explorado');
  });

  it('el grid pisado sigue explorado después de irse de él', () => {
    const destino = vecinoDeInicio();
    let s = moveToGrid(createInitialWorldState(), destino);
    s = moveToGrid(s, WORLD_CIFRAS.startingGridId);
    expect(s.currentGridId).toBe(WORLD_CIFRAS.startingGridId);
    expect(deriveGridState(s, destino)).toBe('explorado');
  });

  // LA FÓRMULA CAMBIÓ EN 4e (#103, #105). Hasta aquí Controlado pedía
  // `completados al 100% + ancla`, y los tres tests de abajo afirmaban esa
  // versión. Las dos mitades cayeron: el ancla creaba una circularidad (se
  // planta SOBRE un grid Controlado) y `completado` es deuda de 4f, así que
  // ningún grid podía llegar a Controlado todavía.
  it('100% de POIs revelados es controlado, sin ancla ninguna', () => {
    let s = createInitialWorldState();
    for (const poi of getPOIsByGrid('centro-001')) s = revealPOI(s, poi.id);
    expect(hasAnchor(s, 'centro-001')).toBe(false);
    expect(deriveGridState(s, 'centro-001')).toBe('controlado');
  });

  it('visitar no es completar: revelar basta, completar no hace falta', () => {
    let s = createInitialWorldState();
    for (const poi of getPOIsByGrid('centro-001')) s = revealPOI(s, poi.id);
    const soloRevelados = deriveGridState(s, 'centro-001');
    for (const poi of getPOIsByGrid('centro-001')) s = completePOI(s, poi.id);
    expect(deriveGridState(s, 'centro-001')).toBe(soloRevelados);
  });

  it('sin el 100% revelado NO es controlado, aunque tenga ancla', () => {
    let s = createInitialWorldState();
    s = revealPOI(s, 'centro-001-poi-1');
    s = placeAnchor(s, 'centro-001');
    expect(deriveGridState(s, 'centro-001')).toBe('explorado');
  });

  it('recoger el ancla NO devuelve el grid a explorado (Q11)', () => {
    let s = createInitialWorldState();
    for (const poi of getPOIsByGrid('centro-001')) s = revealPOI(s, poi.id);
    s = placeAnchor(s, 'centro-001');
    s = removeAnchor(s, 'centro-001');
    expect(hasAnchor(s, 'centro-001')).toBe(false);
    expect(deriveGridState(s, 'centro-001')).toBe('controlado');
  });

  it('un grid inexistente es inexplorado, no revienta', () => {
    expect(deriveGridState(createInitialWorldState(), 'no-existe')).toBe('inexplorado');
  });

  it('el grid de inicio arranca explorado (su POI Hogar viene revelado)', () => {
    const s = createInitialWorldState();
    expect(deriveGridState(s, WORLD_CIFRAS.startingGridId)).toBe('explorado');
  });
});
