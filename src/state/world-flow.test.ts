// Tests del orquestador world-flow (H4 sub-paso 4b). Persist fake: validan
// que cada mutación pasa por rules/world-state.ts y que la persistencia se
// dispara exactamente cuando debe (#90).

import { describe, it, expect, vi } from 'vitest';
import { createWorldFlow } from './world-flow';
import { createCharacter, type Character } from '../rules/character';
import { FATIGUE_RULES, actionsRemaining } from '../rules/fatigue';
import {
  createInitialWorldState,
  getGridState,
  getPOIState,
  deriveGridState,
} from '../rules/world-state';
import { WORLD_CIFRAS, getCardinalNeighbours, getPOIsByGrid } from '../rules/world';
import type { WorldState } from '../rules/world-state';

const vecinoDeInicio = (): string => getCardinalNeighbours(WORLD_CIFRAS.startingGridId)[0]!.id;

// PJ de fixture. Desde 4d.2 el flow necesita leerlo para resolver el techo de
// jornada; nunca lo escribe.
function pjDePrueba(): Character {
  return createCharacter({
    id: 'pj-flow',
    name: 'Probador',
    portraitId: 'retrato-01',
    archetype: null,
    attributes: { fue: 4, des: 3, con: 3, int: 1, vol: 1 },
    skills: {},
    perks: ['perk_pies_ligeros'],
    location: { mapId: WORLD_CIFRAS.startingGridId, x: 0, y: 0 },
  });
}

// Persist fake que registra cada snapshot que recibe.
function makePersistFake(): { persist: (s: WorldState) => Promise<void>; calls: WorldState[] } {
  const calls: WorldState[] = [];
  return {
    calls,
    persist: (s) => {
      calls.push(s);
      return Promise.resolve();
    },
  };
}

describe('world-flow — viaje', () => {
  it('viaje legal: mueve, marca explorado y persiste una vez', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const destino = vecinoDeInicio();

    const outcome = flow.travelTo(destino);

    expect(outcome).toMatchObject({ moved: true });
    expect(flow.getState().currentGridId).toBe(destino);
    expect(getGridState(flow.getState(), destino)).toBe('explorado');
    expect(fake.calls.length).toBe(1);
    expect(fake.calls[0]!.currentGridId).toBe(destino);
  });

  it('viaje ilegal: no mueve, no persiste, y la razón discrimina el caso', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });

    expect(flow.travelTo('no-existe')).toEqual({ moved: false, reason: 'unknown_grid' });
    expect(flow.travelTo(WORLD_CIFRAS.startingGridId)).toEqual({
      moved: false,
      reason: 'same_grid',
    });
    expect(flow.travelTo('norte-001')).toEqual({ moved: false, reason: 'not_adjacent' });
    expect(flow.getState().currentGridId).toBe(WORLD_CIFRAS.startingGridId);
    expect(fake.calls.length).toBe(0);
  });

  it('un fallo de red en persist no rompe el viaje (fire-and-forget)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const flow = createWorldFlow({
      getCharacter: () => pjDePrueba(),
      initialState: createInitialWorldState(),
      persist: () => Promise.reject(new Error('red caída')),
    });

    const outcome = flow.travelTo(vecinoDeInicio());

    expect(outcome).toMatchObject({ moved: true });
    expect(flow.getState().currentGridId).toBe(vecinoDeInicio());
    // Deja que la promesa rechazada se procese y se loguee.
    await Promise.resolve();
    await Promise.resolve();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('world-flow — cámara semántica (lookAt)', () => {
  it('mirar un grid lejano persiste la vista pero NO mueve al PJ (#88)', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });

    flow.lookAt({ kind: 'grid', gridId: 'norte-001' });

    expect(flow.getState().view).toEqual({ kind: 'grid', gridId: 'norte-001' });
    expect(flow.getState().currentGridId).toBe(WORLD_CIFRAS.startingGridId);
    expect(getGridState(flow.getState(), 'norte-001')).toBe('inexplorado');
    expect(fake.calls.length).toBe(1);
  });

  it('una vista inválida es no-op y no persiste', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });

    flow.lookAt({ kind: 'grid', gridId: 'grid-fantasma' });

    expect(flow.getState().view).toEqual({ kind: 'region' });
    expect(fake.calls.length).toBe(0);
  });

  it('la vista persistida sobrevive el round-trip: getState refleja lo mirado', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });

    flow.travelTo(vecinoDeInicio());
    flow.lookAt({ kind: 'grid', gridId: vecinoDeInicio() });

    const persisted = fake.calls[fake.calls.length - 1]!;
    expect(persisted.view).toEqual({ kind: 'grid', gridId: vecinoDeInicio() });
    expect(persisted.currentGridId).toBe(vecinoDeInicio());
  });
});

// =============================================================================
// Entrada y salida de POI (sub-paso 4c.1, #93/#94)
// =============================================================================

const poiDeInicio = (): string => getPOIsByGrid(WORLD_CIFRAS.startingGridId)[1]!.id;

describe('world-flow — entrar y salir de POI', () => {
  it('enterPOI revela y fija la vista en UNA sola persistencia', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();
    expect(getPOIState(flow.getState(), poiId)).toBeNull();

    expect(flow.enterPOI(poiId)).toBe(true);

    const s = flow.getState();
    expect(getPOIState(s, poiId)).toBe('revelado');
    expect(s.view).toEqual({ kind: 'poi', poiId });
    // La clave del contrato: entrar es UN write, no dos. Dos writes dejarían
    // una ventana persistida con el jugador dentro de un POI en niebla.
    expect(fake.calls.length).toBe(1);
    expect(getPOIState(fake.calls[0]!, poiId)).toBe('revelado');
    expect(fake.calls[0]!.view).toEqual({ kind: 'poi', poiId });
  });

  it('enterPOI sobre un POI inexistente no toca nada', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const antes = flow.getState();

    expect(flow.enterPOI('no-existe')).toBe(false);

    expect(flow.getState()).toBe(antes);
    expect(fake.calls.length).toBe(0);
  });

  it('entrar al mismo POI dos veces no vuelve a persistir', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.enterPOI(poiId);
    flow.enterPOI(poiId);

    expect(fake.calls.length).toBe(1);
  });

  it('leavePOI devuelve la vista al grid que contiene el POI', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.enterPOI(poiId);
    flow.leavePOI();

    expect(flow.getState().view).toEqual({ kind: 'grid', gridId: WORLD_CIFRAS.startingGridId });
    expect(fake.calls.length).toBe(2);
  });

  it('salir no degrada el estado del POI: sigue revelado', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.enterPOI(poiId);
    flow.leavePOI();

    expect(getPOIState(flow.getState(), poiId)).toBe('revelado');
  });

  it('leavePOI fuera de un POI no hace nada', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });

    flow.leavePOI();

    expect(flow.getState().view).toEqual({ kind: 'region' });
    expect(fake.calls.length).toBe(0);
  });
});

describe('world-flow — completar POI', () => {
  it('completePOI marca completado y persiste', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.enterPOI(poiId);
    flow.completePOI(poiId);

    expect(getPOIState(flow.getState(), poiId)).toBe('completado');
    expect(fake.calls.length).toBe(2);
  });

  it('completar dos veces el mismo POI no vuelve a persistir', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.completePOI(poiId);
    flow.completePOI(poiId);

    expect(fake.calls.length).toBe(1);
  });

  // #92/Q40b: farmear un POI está permitido. Volver a entrar en uno completado
  // no lo degrada a 'revelado', y por tanto tampoco deshace el progreso del
  // grid hacia 'controlado'.
  it('volver a entrar a un POI completado no lo degrada', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.completePOI(poiId);
    flow.leavePOI();
    flow.enterPOI(poiId);

    expect(getPOIState(flow.getState(), poiId)).toBe('completado');
  });

  it('revelar POIs sube el estado derivado del grid sin escribirlo', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    const vecino = vecinoDeInicio();
    const poiVecino = getPOIsByGrid(vecino)[0]!.id;

    expect(deriveGridState(flow.getState(), vecino)).toBe('inexplorado');

    flow.enterPOI(poiVecino);

    expect(deriveGridState(flow.getState(), vecino)).toBe('explorado');
    // Nadie ha escrito gridStates: el estado se deriva de los POIs (#94).
    expect(flow.getState().gridStates[vecino]).toBeUndefined();
  });
});

// =============================================================================
// flush (sub-paso 4c.2): el único punto que espera a la red
// =============================================================================

describe('world-flow — flush', () => {
  it('sin escrituras pendientes resuelve igualmente', async () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ getCharacter: () => pjDePrueba(), initialState: createInitialWorldState(), persist: fake.persist });
    await expect(flow.flush()).resolves.toBeUndefined();
  });

  // "Guardar y salir" desmonta la vista: si navegase sin esperar, la última
  // mutación se perdería y "cargar te devuelve donde estabas" fallaría de
  // forma intermitente.
  it('espera a la última escritura lanzada', async () => {
    let resolver: (() => void) | null = null;
    const orden: string[] = [];
    const flow = createWorldFlow({
      getCharacter: () => pjDePrueba(),
      initialState: createInitialWorldState(),
      persist: () =>
        new Promise<void>((res) => {
          resolver = () => {
            orden.push('escritura');
            res();
          };
        }),
    });

    flow.travelTo(vecinoDeInicio());
    const esperando = flow.flush().then(() => orden.push('flush'));

    expect(orden).toEqual([]);
    resolver!();
    await esperando;
    expect(orden).toEqual(['escritura', 'flush']);
  });

  it('propaga el fallo de la última escritura para que el caller no salga', async () => {
    const flow = createWorldFlow({
      getCharacter: () => pjDePrueba(),
      initialState: createInitialWorldState(),
      persist: () => Promise.reject(new Error('red caída')),
    });

    flow.travelTo(vecinoDeInicio());

    await expect(flow.flush()).rejects.toThrow('red caída');
  });
});

// -----------------------------------------------------------------------------
// Coste de jornada (sub-paso 4d.2, §9.7, decisiones #98/#99/#100)
// -----------------------------------------------------------------------------

describe('world-flow — coste de jornada', () => {
  const flowDePrueba = (estado = createInitialWorldState()) =>
    createWorldFlow({
      getCharacter: () => pjDePrueba(),
      initialState: estado,
      persist: () => Promise.resolve(),
    });

  it('viajar cuesta una acción del día', () => {
    const flow = flowDePrueba();
    const antes = actionsRemaining(flow.getState(), pjDePrueba());

    flow.travelTo(vecinoDeInicio());

    expect(actionsRemaining(flow.getState(), pjDePrueba())).toBe(antes - 1);
  });

  it('el viaje devuelve la jornada restante en el outcome', () => {
    const flow = flowDePrueba();
    const outcome = flow.travelTo(vecinoDeInicio());
    expect(outcome).toEqual({ moved: true, actionsLeft: FATIGUE_RULES.actionsPerDay - 1 });
  });

  it('un viaje ilegal no cobra nada', () => {
    const flow = flowDePrueba();
    flow.travelTo('no-existe');
    flow.travelTo(WORLD_CIFRAS.startingGridId);
    expect(flow.getState().actionsSpent).toBe(0);
  });

  it('sin jornada el viaje se rechaza con `no_actions` y no mueve', () => {
    const flow = flowDePrueba({
      ...createInitialWorldState(),
      actionsSpent: FATIGUE_RULES.actionsPerDay,
    });
    const origen = flow.getState().currentGridId;

    expect(flow.travelTo(vecinoDeInicio())).toEqual({ moved: false, reason: 'no_actions' });
    expect(flow.getState().currentGridId).toBe(origen);
  });

  it('entrar a un POI cuesta una acción', () => {
    const flow = flowDePrueba();
    const poi = getPOIsByGrid(WORLD_CIFRAS.startingGridId)[0]!;

    flow.enterPOI(poi.id);

    expect(flow.getState().actionsSpent).toBe(1);
  });

  // C2 del brief: volver de un combate remonta la vista y reentra al mismo
  // POI. Cobrar antes de la guarda `alreadyHere` haría que cada combate
  // costase una acción extra, contra Q41 de #100 ("el combate sale gratis").
  it('reentrar al mismo POI NO vuelve a cobrar', () => {
    const flow = flowDePrueba();
    const poi = getPOIsByGrid(WORLD_CIFRAS.startingGridId)[0]!;

    flow.enterPOI(poi.id);
    flow.enterPOI(poi.id);
    flow.enterPOI(poi.id);

    expect(flow.getState().actionsSpent).toBe(1);
  });

  it('salir y volver a entrar al mismo POI sí cobra otra vez', () => {
    const flow = flowDePrueba();
    const poi = getPOIsByGrid(WORLD_CIFRAS.startingGridId)[0]!;

    flow.enterPOI(poi.id);
    flow.leavePOI();
    flow.enterPOI(poi.id);

    expect(flow.getState().actionsSpent).toBe(2);
  });

  it('sin jornada no se puede entrar a un POI', () => {
    const flow = flowDePrueba({
      ...createInitialWorldState(),
      actionsSpent: FATIGUE_RULES.actionsPerDay,
    });
    const poi = getPOIsByGrid(WORLD_CIFRAS.startingGridId)[0]!;

    expect(flow.enterPOI(poi.id)).toBe(false);
    expect(flow.getState().view.kind).not.toBe('poi');
  });

  it('mirar (lookAt) sigue siendo gratis: es cámara, no acción (#88)', () => {
    const flow = flowDePrueba();
    flow.lookAt({ kind: 'grid', gridId: vecinoDeInicio() });
    flow.lookAt({ kind: 'region' });
    expect(flow.getState().actionsSpent).toBe(0);
  });

  it('replaceState sustituye el estado entero y persiste', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({
      getCharacter: () => pjDePrueba(),
      initialState: createInitialWorldState(),
      persist: fake.persist,
    });

    // Lo que devuelve `camp()`: jornada a cero y día siguiente.
    flow.replaceState({ ...flow.getState(), day: 2, actionsSpent: 0 });

    expect(flow.getState().day).toBe(2);
    expect(fake.calls).toHaveLength(1);
  });
});
