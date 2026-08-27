// Tests del orquestador travel-flow (H4 sub-paso 4e, #103-#105).
//
// Lo que se valida aquí NO son las reglas —eso vive en `rules/fast-travel.test`—
// sino la costura: que cada operación escriba por los DOS canales (mundo y PJ),
// que un rechazo no escriba por ninguno, y que el PJ que se persiste sea el que
// salió de la regla y no el que entró.

import { describe, it, expect } from 'vitest';
import { createWorldFlow } from './world-flow';
import { createTravelFlow, type TravelFlowHandle } from './travel-flow';
import { createCharacter, type Character } from '../rules/character';
import {
  createInitialWorldState,
  hasAnchor,
  placeAnchor,
  revealPOI,
  type WorldState,
} from '../rules/world-state';
import { WORLD_CIFRAS, getAllGrids, getPOIsByGrid } from '../rules/world';
import { countAnchorItems } from '../rules/fast-travel';
import { ITEMS_BY_ID } from '../data/items';

const HOGAR = WORLD_CIFRAS.startingGridId;
const OTRO = getAllGrids().find((g) => g.id !== HOGAR)!.id;

function pjDePrueba(): Character {
  return createCharacter({
    id: 'pj-travel',
    name: 'Probador',
    portraitId: 'retrato-01',
    archetype: null,
    attributes: { fue: 4, des: 3, con: 3, int: 1, vol: 1 },
    skills: {},
    perks: ['perk_pies_ligeros'],
    location: { mapId: HOGAR, x: 0, y: 0 },
  });
}

function controlado(state: WorldState, gridId: string): WorldState {
  let s = state;
  for (const poi of getPOIsByGrid(gridId)) s = revealPOI(s, poi.id);
  return s;
}

interface Banco {
  flow: TravelFlowHandle;
  world: () => WorldState;
  character: () => Character;
  writes: WorldState[];
  charWrites: Character[];
}

// Monta el par world-flow + travel-flow con los dos canales de persistencia
// falseados, para poder contar escrituras.
function banco(initialState: WorldState = createInitialWorldState()): Banco {
  const writes: WorldState[] = [];
  const charWrites: Character[] = [];
  // El PJ vivo se mantiene aquí: `persistCharacter` lo sustituye, igual que
  // hace `main.ts` al remontar la vista tras acampar.
  let character = pjDePrueba();

  const worldFlow = createWorldFlow({
    initialState,
    getCharacter: () => character,
    persist: (s) => {
      writes.push(s);
      return Promise.resolve();
    },
  });

  const flow = createTravelFlow({
    worldFlow,
    getCharacter: () => character,
    persistCharacter: (c) => {
      charWrites.push(c);
      character = c;
    },
    catalog: ITEMS_BY_ID,
  });

  return { flow, world: () => worldFlow.getState(), character: () => character, writes, charWrites };
}

// -----------------------------------------------------------------------------

describe('travel-flow — plantar ancla', () => {
  it('planta, cobra la acción y escribe por los dos canales', () => {
    const b = banco(controlado(
      { ...createInitialWorldState(), currentGridId: OTRO, view: { kind: 'grid', gridId: OTRO } },
      OTRO,
    ));
    const llevaba = countAnchorItems(b.character());

    const outcome = b.flow.placeAnchorHere();

    expect(outcome).toMatchObject({ ok: true, actionsLeft: 7 });
    expect(hasAnchor(b.world(), OTRO)).toBe(true);
    expect(b.writes).toHaveLength(1);
    expect(b.charWrites).toHaveLength(1);
    expect(countAnchorItems(b.charWrites[0]!)).toBe(llevaba - 1);
  });

  it('un rechazo no escribe por ninguno de los dos canales', () => {
    // Grid sin Controlar: el PJ está en el Hogar, cuyo único POI revelado es
    // el Hogar mismo (1 de 4).
    const b = banco();

    const outcome = b.flow.placeAnchorHere();

    expect(outcome).toEqual({ ok: false, reason: 'not_controlled' });
    expect(b.writes).toHaveLength(0);
    expect(b.charWrites).toHaveLength(0);
  });

  it('el PJ persistido es el que salió de la regla, no el que entró', () => {
    const b = banco(controlado(
      { ...createInitialWorldState(), currentGridId: OTRO, view: { kind: 'grid', gridId: OTRO } },
      OTRO,
    ));
    const antes = b.character();

    b.flow.placeAnchorHere();

    expect(b.character()).not.toBe(antes);
    expect(countAnchorItems(b.character())).toBe(countAnchorItems(antes) - 1);
  });
});

describe('travel-flow — recoger ancla', () => {
  const conAnclaPlantada = (): Banco =>
    banco(
      placeAnchor(
        controlado(
          { ...createInitialWorldState(), currentGridId: OTRO, view: { kind: 'grid', gridId: OTRO } },
          OTRO,
        ),
        OTRO,
      ),
    );

  it('devuelve el ancla a la mochila y la borra del mundo', () => {
    const b = conAnclaPlantada();
    const llevaba = countAnchorItems(b.character());

    const outcome = b.flow.retrieveAnchorHere();

    expect(outcome).toMatchObject({ ok: true, anchorsLeft: llevaba + 1 });
    expect(hasAnchor(b.world(), OTRO)).toBe(false);
    expect(b.writes).toHaveLength(1);
    expect(b.charWrites).toHaveLength(1);
  });

  it('la del Hogar se rechaza sin escribir nada', () => {
    const b = banco({ ...createInitialWorldState(), view: { kind: 'grid', gridId: HOGAR } });

    expect(b.flow.retrieveAnchorHere()).toEqual({ ok: false, reason: 'home_anchor' });
    expect(b.writes).toHaveLength(0);
    expect(b.charWrites).toHaveLength(0);
  });
});

describe('travel-flow — viajar', () => {
  const conDestino = (over: Partial<WorldState> = {}): Banco =>
    banco(
      placeAnchor(
        { ...createInitialWorldState(), view: { kind: 'grid', gridId: HOGAR }, ...over },
        OTRO,
      ),
    );

  it('mueve al PJ, cobra el coste y escribe por los dos canales', () => {
    const b = conDestino();

    const outcome = b.flow.fastTravelTo(OTRO);

    expect(outcome.ok).toBe(true);
    expect(b.world().currentGridId).toBe(OTRO);
    expect(b.writes).toHaveLength(1);
    expect(b.charWrites).toHaveLength(1);
  });

  it('el coste cobrado es el que anuncia el outcome', () => {
    const b = conDestino();

    const outcome = b.flow.fastTravelTo(OTRO);

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(b.world().actionsSpent).toBe(outcome.cost.actions);
    expect(outcome.actionsLeft).toBe(8 - outcome.cost.actions);
  });

  it('un destino sin ancla se rechaza y devuelve el coste igualmente, para el copy', () => {
    const b = banco({ ...createInitialWorldState(), view: { kind: 'grid', gridId: HOGAR } });

    const outcome = b.flow.fastTravelTo(OTRO);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('no_anchor');
    expect(outcome.cost.rations).toBe(1);
    expect(b.writes).toHaveLength(0);
    expect(b.charWrites).toHaveLength(0);
  });

  it('desde dentro de un POI se rechaza (Q39)', () => {
    const b = conDestino({ view: { kind: 'poi', poiId: WORLD_CIFRAS.homePOIId } });

    const outcome = b.flow.fastTravelTo(OTRO);

    expect(outcome.ok === false && outcome.reason).toBe('inside_poi');
    expect(b.writes).toHaveLength(0);
  });
});

describe('travel-flow — lecturas para la UI', () => {
  it('anchorStatus cruza plantadas, cap y mochila', () => {
    const b = banco();

    expect(b.flow.anchorStatus()).toEqual({
      placed: 0,
      cap: 3,
      inBackpack: countAnchorItems(b.character()),
    });
  });

  it('anchorStatus refleja el plantado inmediatamente después de plantar', () => {
    const b = banco(controlado(
      { ...createInitialWorldState(), currentGridId: OTRO, view: { kind: 'grid', gridId: OTRO } },
      OTRO,
    ));
    const antes = b.flow.anchorStatus();

    b.flow.placeAnchorHere();

    expect(b.flow.anchorStatus().placed).toBe(antes.placed + 1);
    expect(b.flow.anchorStatus().inBackpack).toBe(antes.inBackpack - 1);
  });

  it('destinations devuelve el Hogar en una partida recién empezada', () => {
    const destinos = banco().flow.destinations();
    expect(destinos).toHaveLength(1);
    expect(destinos[0]!.gridId).toBe(HOGAR);
    expect(destinos[0]!.isHome).toBe(true);
  });
});
