// Tests del fast travel y las anclas (§9.8, decisiones #103, #104, #105).
// Sub-paso 4e.
//
// Lo que más se prueba aquí es lo que el cuestionario de 4e tenía contradicho y
// #103 tuvo que arbitrar: que el ancla y el estado Controlado NO se definen el
// uno al otro, que recoger un ancla no degrada el grid, y que la del Hogar es
// una excepción y no un ancla más.

import { describe, it, expect } from 'vitest';

import {
  FAST_TRAVEL_RULES,
  maxAnchors,
  anchorsPlaced,
  isHomeAnchor,
  countAnchorItems,
  gridDistance,
  computeFastTravelCost,
  canPlaceAnchorAt,
  executePlaceAnchor,
  canRetrieveAnchorFrom,
  executeRetrieveAnchor,
  canFastTravelTo,
  executeFastTravel,
  listAnchorDestinations,
} from './fast-travel.ts';
import { createCharacter, type Character } from './character.ts';
import {
  createInitialWorldState,
  deriveGridState,
  hasAnchor,
  placeAnchor,
  revealPOI,
  type WorldState,
} from './world-state.ts';
import { WORLD_CIFRAS, getGrid, getPOIsByGrid, getAllGrids } from './world.ts';
import { addItem } from './inventory.ts';
import { ITEMS_BY_ID, STARTING_ANCHOR_ID, STARTING_RATION_ID } from '../data/items.ts';

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

const HOGAR = WORLD_CIFRAS.startingGridId;

function pj(over: Partial<Character> = {}): Character {
  const base = createCharacter({
    id: 'pj-test',
    name: 'Probador',
    portraitId: 'retrato-01',
    archetype: null,
    attributes: { fue: 3, des: 3, int: 2, vol: 2, con: 2 },
    skills: {},
    perks: ['perk_pies_ligeros'],
    location: { mapId: HOGAR, x: 0, y: 0 },
  });
  return { ...base, ...over };
}

// Vacía la mochila del item pedido, para que cada test declare lo que lleva.
function sin(character: Character, itemId: string): Character {
  const slots = character.inventory.slots.map((s) =>
    s !== null && s.item_id === itemId ? null : s,
  );
  return { ...character, inventory: { ...character.inventory, slots } };
}

function con(character: Character, itemId: string, cantidad: number): Character {
  if (cantidad === 0) return character;
  return {
    ...character,
    inventory: addItem(
      character.inventory,
      { item_id: itemId, quantity: cantidad, durability: null },
      ITEMS_BY_ID,
    ),
  };
}

const mundo = (over: Partial<WorldState> = {}): WorldState => ({
  ...createInitialWorldState(),
  ...over,
});

// Deja un grid Controlado revelando sus 4 POIs (#103, Q7a).
function controlado(state: WorldState, gridId: string): WorldState {
  let s = state;
  for (const poi of getPOIsByGrid(gridId)) s = revealPOI(s, poi.id);
  return s;
}

// Un grid cualquiera que no sea el Hogar, para plantar encima.
const OTRO = getAllGrids().find((g) => g.id !== HOGAR)!.id;

// Pone al PJ en `gridId` con ese grid ya Controlado y mirando el grid.
function enGridControlado(gridId: string, over: Partial<WorldState> = {}): WorldState {
  return controlado(
    mundo({ currentGridId: gridId, view: { kind: 'grid', gridId }, ...over }),
    gridId,
  );
}

// -----------------------------------------------------------------------------
// Cap de anclas (#103, Q2b)
// -----------------------------------------------------------------------------

describe('cap de anclas por nivel (#103, Q2b)', () => {
  it('arranca en 3 al nivel 1', () => {
    expect(maxAnchors(pj({ level: 1 }))).toBe(3);
  });

  it('sube 1 cada 3 niveles', () => {
    expect(maxAnchors(pj({ level: 3 }))).toBe(3);
    expect(maxAnchors(pj({ level: 4 }))).toBe(4);
    expect(maxAnchors(pj({ level: 7 }))).toBe(5);
    expect(maxAnchors(pj({ level: 10 }))).toBe(6);
  });

  it('topa en 6 y no sigue subiendo el resto de la curva', () => {
    for (const level of [10, 20, 35, 50]) {
      expect(maxAnchors(pj({ level }))).toBe(FAST_TRAVEL_RULES.maxAnchorCap);
    }
  });

  it('el ancla del Hogar no cuenta para el cap: no salió de un item', () => {
    const s = mundo();
    expect(hasAnchor(s, HOGAR)).toBe(true);
    expect(anchorsPlaced(s)).toEqual([]);
    expect(isHomeAnchor(HOGAR)).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Distancia y coste (#104, Q25b, Q26a, Q27)
// -----------------------------------------------------------------------------

describe('distancia en Manhattan (#104, Q26a)', () => {
  it('es la suma de las dos diferencias, no la línea recta', () => {
    const a = getAllGrids().find((g) => g.position.x === 0 && g.position.y === 5)!;
    const b = getAllGrids().find((g) => g.position.x === 3 && g.position.y === 9);
    if (b === undefined) return; // el dataset no tiene ese hueco: nada que probar
    expect(gridDistance(a.id, b.id)).toBe(3 + 4);
  });

  it('es simétrica y vale 0 contra uno mismo', () => {
    expect(gridDistance(HOGAR, OTRO)).toBe(gridDistance(OTRO, HOGAR));
    expect(gridDistance(HOGAR, HOGAR)).toBe(0);
  });

  it('devuelve -1 si alguno de los grids no existe, en vez de reventar', () => {
    expect(gridDistance(HOGAR, 'no-existe')).toBe(-1);
    expect(gridDistance('no-existe', HOGAR)).toBe(-1);
  });
});

describe('coste por distancia (#83 matizada por #104)', () => {
  it('siempre cuesta 1 ración, sea cual sea la distancia', () => {
    for (const d of [0, 1, 7, 30]) {
      expect(computeFastTravelCost(d).rations).toBe(FAST_TRAVEL_RULES.rationsPerTrip);
    }
  });

  it('sigue la curva 1 + ceil(d / 5)', () => {
    expect(computeFastTravelCost(6).actions).toBe(3);
    expect(computeFastTravelCost(10).actions).toBe(3);
    expect(computeFastTravelCost(11).actions).toBe(4);
  });

  it('nunca baja del mínimo: un salto corto no sale más barato que caminarlo', () => {
    for (const d of [0, 1, 3, 5]) {
      expect(computeFastTravelCost(d).actions).toBe(FAST_TRAVEL_RULES.minActions);
    }
  });

  it('nunca pasa del máximo: un viaje de esquina a esquina sigue siendo pagable', () => {
    for (const d of [16, 21, 35, 999]) {
      expect(computeFastTravelCost(d).actions).toBe(FAST_TRAVEL_RULES.maxActions);
    }
  });

  it('el techo cabe dentro de la jornada de 8 acciones', () => {
    expect(FAST_TRAVEL_RULES.maxActions).toBeLessThan(8);
  });

  it('una distancia negativa (grid inexistente) no produce coste negativo', () => {
    expect(computeFastTravelCost(-1).actions).toBe(FAST_TRAVEL_RULES.minActions);
  });
});

// -----------------------------------------------------------------------------
// Plantar (#103, Q12c, Q14, Q16b)
// -----------------------------------------------------------------------------

describe('plantar ancla (#103)', () => {
  it('se puede plantar en el grid donde estás si está Controlado y llevas ancla', () => {
    expect(canPlaceAnchorAt(enGridControlado(OTRO), pj(), OTRO)).toEqual({ ok: true });
  });

  it('no se planta a distancia: plantar es un acto físico, no un click en el mapa', () => {
    const s = controlado(mundo(), OTRO);
    expect(canPlaceAnchorAt(s, pj(), OTRO)).toEqual({ ok: false, reason: 'not_here' });
  });

  it('no se planta en un grid sin Controlar', () => {
    const s = mundo({ currentGridId: OTRO, view: { kind: 'grid', gridId: OTRO } });
    expect(canPlaceAnchorAt(s, pj(), OTRO)).toEqual({ ok: false, reason: 'not_controlled' });
  });

  it('no se planta dos veces en el mismo grid', () => {
    const s = placeAnchor(enGridControlado(OTRO), OTRO);
    expect(canPlaceAnchorAt(s, pj(), OTRO)).toEqual({ ok: false, reason: 'already_anchored' });
  });

  it('sin ancla en la mochila, el motivo es la mochila y no el grid', () => {
    const desnudo = sin(pj(), STARTING_ANCHOR_ID);
    expect(canPlaceAnchorAt(enGridControlado(OTRO), desnudo, OTRO)).toEqual({
      ok: false,
      reason: 'no_anchor_item',
    });
  });

  it('el grid manda sobre la mochila en el orden de las excusas', () => {
    // Un PJ sin anclas sobre un grid sin Controlar debe leer "no lo has
    // controlado": mandarle a buscar un item que no le habría servido es peor
    // que no decirle nada.
    const s = mundo({ currentGridId: OTRO, view: { kind: 'grid', gridId: OTRO } });
    expect(canPlaceAnchorAt(s, sin(pj(), STARTING_ANCHOR_ID), OTRO)).toEqual({
      ok: false,
      reason: 'not_controlled',
    });
  });

  it('bloquea al llegar al cap, sin sustituir la más antigua (Q16b)', () => {
    const nivel1 = pj({ level: 1 });
    let s = enGridControlado(OTRO);
    // Tres anclas ya plantadas en grids cualesquiera que no sean el Hogar.
    const otros = getAllGrids().filter((g) => g.id !== HOGAR && g.id !== OTRO).slice(0, 3);
    for (const g of otros) s = placeAnchor(s, g.id);
    expect(anchorsPlaced(s)).toHaveLength(maxAnchors(nivel1));
    expect(canPlaceAnchorAt(s, con(nivel1, STARTING_ANCHOR_ID, 5), OTRO)).toEqual({
      ok: false,
      reason: 'cap_reached',
    });
  });

  it('sin jornada no se planta', () => {
    const s = enGridControlado(OTRO, { actionsSpent: 8 });
    expect(canPlaceAnchorAt(s, pj(), OTRO)).toEqual({ ok: false, reason: 'no_actions' });
  });

  it('plantar cuesta 1 acción y consume un ancla de la mochila (Q14)', () => {
    const antes = pj();
    const llevaba = countAnchorItems(antes);
    const r = executePlaceAnchor(enGridControlado(OTRO), antes, OTRO);
    expect(r.worldState.actionsSpent).toBe(1);
    expect(countAnchorItems(r.character)).toBe(llevaba - 1);
    expect(hasAnchor(r.worldState, OTRO)).toBe(true);
  });

  it('es puro: no muta lo que recibe', () => {
    const s = enGridControlado(OTRO);
    const c = pj();
    executePlaceAnchor(s, c, OTRO);
    expect(s.anchors).not.toContain(OTRO);
    expect(s.actionsSpent).toBe(0);
    expect(countAnchorItems(c)).toBeGreaterThan(0);
  });

  it('lanza si se llama sin haber preguntado antes', () => {
    const s = mundo({ currentGridId: OTRO });
    expect(() => executePlaceAnchor(s, pj(), OTRO)).toThrow(/canPlaceAnchorAt/);
  });
});

// -----------------------------------------------------------------------------
// Recoger (#103, Q15a) — y la regresión de Q11
// -----------------------------------------------------------------------------

describe('recoger ancla (#103, Q15a)', () => {
  it('devuelve el ancla a la mochila y cuesta 1 acción', () => {
    const s = placeAnchor(enGridControlado(OTRO), OTRO);
    const antes = sin(pj(), STARTING_ANCHOR_ID);
    const r = executeRetrieveAnchor(s, antes, OTRO, ITEMS_BY_ID);
    expect(countAnchorItems(r.character)).toBe(1);
    expect(r.worldState.actionsSpent).toBe(1);
    expect(hasAnchor(r.worldState, OTRO)).toBe(false);
  });

  it('RECOGER NO DEGRADA EL GRID (Q11): sigue Controlado sin ancla', () => {
    // Ésta es la regresión que #103 existe para evitar. Con la fórmula vieja
    // —Controlado exigía ancla— recoger habría devuelto el grid a Explorado.
    const s = placeAnchor(enGridControlado(OTRO), OTRO);
    const r = executeRetrieveAnchor(s, pj(), OTRO, ITEMS_BY_ID);
    expect(deriveGridState(r.worldState, OTRO)).toBe('controlado');
  });

  it('el ancla del Hogar no se recoge: no se pagó, no se cobra', () => {
    const s = mundo({ view: { kind: 'grid', gridId: HOGAR } });
    expect(canRetrieveAnchorFrom(s, pj(), HOGAR)).toEqual({ ok: false, reason: 'home_anchor' });
  });

  it('no se recoge donde no hay ancla', () => {
    const s = enGridControlado(OTRO);
    expect(canRetrieveAnchorFrom(s, pj(), OTRO)).toEqual({ ok: false, reason: 'no_anchor' });
  });

  it('no se recoge a distancia', () => {
    const s = placeAnchor(controlado(mundo(), OTRO), OTRO);
    expect(canRetrieveAnchorFrom(s, pj(), OTRO)).toEqual({ ok: false, reason: 'not_here' });
  });

  it('recoger y replantar deja el cap donde estaba', () => {
    let s = placeAnchor(enGridControlado(OTRO), OTRO);
    const c = pj();
    expect(anchorsPlaced(s)).toHaveLength(1);
    const recogido = executeRetrieveAnchor(s, c, OTRO, ITEMS_BY_ID);
    expect(anchorsPlaced(recogido.worldState)).toHaveLength(0);
    s = executePlaceAnchor(recogido.worldState, recogido.character, OTRO).worldState;
    expect(anchorsPlaced(s)).toHaveLength(1);
  });
});

// -----------------------------------------------------------------------------
// Viajar (#104)
// -----------------------------------------------------------------------------

describe('viajar (#104)', () => {
  const conAncla = (): WorldState =>
    placeAnchor(mundo({ view: { kind: 'grid', gridId: HOGAR } }), OTRO);

  it('se viaja a un grid con ancla', () => {
    const check = canFastTravelTo(conAncla(), pj(), OTRO);
    expect(check.ok).toBe(true);
  });

  it('no se viaja a un grid sin ancla', () => {
    const s = mundo({ view: { kind: 'grid', gridId: HOGAR } });
    const check = canFastTravelTo(s, pj(), OTRO);
    expect(check.ok).toBe(false);
    expect(check.ok === false && check.reason).toBe('no_anchor');
  });

  it('no se viaja al grid donde ya estás, pero la fila existe (Q22)', () => {
    const check = canFastTravelTo(conAncla(), pj(), HOGAR);
    expect(check.ok === false && check.reason).toBe('same_grid');
  });

  it('no se viaja desde dentro de un POI (Q39)', () => {
    const dentro = placeAnchor(
      mundo({ view: { kind: 'poi', poiId: WORLD_CIFRAS.homePOIId } }),
      OTRO,
    );
    const check = canFastTravelTo(dentro, pj(), OTRO);
    expect(check.ok === false && check.reason).toBe('inside_poi');
  });

  it('sin raciones no se viaja, y el coste viaja en la respuesta para el copy', () => {
    const check = canFastTravelTo(conAncla(), sin(pj(), STARTING_RATION_ID), OTRO);
    expect(check.ok === false && check.reason).toBe('no_rations');
    expect(check.cost.rations).toBe(1);
    expect(check.cost.actions).toBeGreaterThanOrEqual(2);
  });

  it('sin jornada suficiente no se viaja', () => {
    const s = { ...conAncla(), actionsSpent: 7 };
    const check = canFastTravelTo(s, pj(), OTRO);
    expect(check.ok === false && check.reason).toBe('no_actions');
  });

  it('el viaje cobra ración y jornada y deja al PJ en el destino', () => {
    const s = conAncla();
    const c = pj();
    const r = executeFastTravel(s, c, OTRO);
    expect(r.worldState.currentGridId).toBe(OTRO);
    expect(r.worldState.actionsSpent).toBe(r.cost.actions);
    expect(countRaciones(r.character)).toBe(countRaciones(c) - r.cost.rations);
  });

  it('el PJ aterriza en el grid, no dentro de un POI (Q24 corregida)', () => {
    const r = executeFastTravel(conAncla(), pj(), OTRO);
    expect(r.worldState.view).toEqual({ kind: 'grid', gridId: OTRO });
  });

  it('viajar no revela ningún POI del destino: no se explora por llegar', () => {
    const r = executeFastTravel(conAncla(), pj(), OTRO);
    for (const poi of getPOIsByGrid(OTRO)) {
      expect(r.worldState.poiStates[poi.id]).toBeUndefined();
    }
  });

  it('es puro: mientras el jugador mira el modal no se ha escrito nada (Q40)', () => {
    const s = conAncla();
    const c = pj();
    executeFastTravel(s, c, OTRO);
    expect(s.currentGridId).toBe(HOGAR);
    expect(s.actionsSpent).toBe(0);
    expect(countRaciones(c)).toBeGreaterThan(0);
  });

  it('agotar la jornada viajando deja el contador a 0, no en negativo (Q38)', () => {
    const barato = getAllGrids()
      .filter((g) => g.id !== HOGAR)
      .sort((a, b) => gridDistance(HOGAR, a.id) - gridDistance(HOGAR, b.id))[0]!;
    const s = placeAnchor(
      mundo({ view: { kind: 'grid', gridId: HOGAR }, actionsSpent: 6 }),
      barato.id,
    );
    const r = executeFastTravel(s, pj(), barato.id);
    expect(r.worldState.actionsSpent).toBe(8);
  });

  it('lanza si se llama sin haber preguntado antes', () => {
    const s = mundo({ view: { kind: 'grid', gridId: HOGAR } });
    expect(() => executeFastTravel(s, pj(), OTRO)).toThrow(/canFastTravelTo/);
  });
});

// -----------------------------------------------------------------------------
// Lista de destinos (#104, Q19b)
// -----------------------------------------------------------------------------

describe('lista de destinos (#104, Q19b)', () => {
  it('trae nombre de región, distancia y coste de cada ancla', () => {
    const s = placeAnchor(mundo({ view: { kind: 'grid', gridId: HOGAR } }), OTRO);
    const lista = listAnchorDestinations(s, pj());
    const destino = lista.find((d) => d.gridId === OTRO)!;
    expect(destino.regionName.length).toBeGreaterThan(0);
    expect(destino.regionId).toBe(getGrid(OTRO)!.regionId);
    expect(destino.distance).toBe(gridDistance(HOGAR, OTRO));
    expect(destino.cost.actions).toBeGreaterThanOrEqual(2);
  });

  it('el grid actual aparece marcado como no alcanzable, no escondido (Q22)', () => {
    const lista = listAnchorDestinations(mundo({ view: { kind: 'grid', gridId: HOGAR } }), pj());
    const aqui = lista.find((d) => d.gridId === HOGAR)!;
    expect(aqui).toBeDefined();
    expect(aqui.reachable).toBe(false);
    expect(aqui.reason).toBe('same_grid');
    expect(aqui.isHome).toBe(true);
  });

  it('viene ordenada por distancia', () => {
    let s = mundo({ view: { kind: 'grid', gridId: HOGAR } });
    for (const g of getAllGrids().filter((g) => g.id !== HOGAR).slice(0, 4)) {
      s = placeAnchor(s, g.id);
    }
    const distancias = listAnchorDestinations(s, pj()).map((d) => d.distance);
    expect([...distancias].sort((a, b) => a - b)).toEqual(distancias);
  });

  it('una partida recién empezada ya tiene el Hogar en la lista (Q6)', () => {
    expect(listAnchorDestinations(mundo(), pj())).toHaveLength(1);
  });
});

function countRaciones(character: Character): number {
  let total = 0;
  for (const s of character.inventory.slots) {
    if (s !== null && s.item_id === STARTING_RATION_ID) total += s.quantity;
  }
  return total;
}
