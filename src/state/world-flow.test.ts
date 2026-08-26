// Tests del orquestador world-flow (H4 sub-paso 4b). Persist fake: validan
// que cada mutación pasa por rules/world-state.ts y que la persistencia se
// dispara exactamente cuando debe (#90).

import { describe, it, expect, vi } from 'vitest';
import { createWorldFlow } from './world-flow';
import {
  createInitialWorldState,
  getGridState,
  getPOIState,
  deriveGridState,
} from '../rules/world-state';
import { WORLD_CIFRAS, getCardinalNeighbours, getPOIsByGrid } from '../rules/world';
import type { WorldState } from '../rules/world-state';

const vecinoDeInicio = (): string => getCardinalNeighbours(WORLD_CIFRAS.startingGridId)[0]!.id;

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
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
    const destino = vecinoDeInicio();

    const outcome = flow.travelTo(destino);

    expect(outcome).toEqual({ moved: true });
    expect(flow.getState().currentGridId).toBe(destino);
    expect(getGridState(flow.getState(), destino)).toBe('explorado');
    expect(fake.calls.length).toBe(1);
    expect(fake.calls[0]!.currentGridId).toBe(destino);
  });

  it('viaje ilegal: no mueve, no persiste, y la razón discrimina el caso', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });

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
      initialState: createInitialWorldState(),
      persist: () => Promise.reject(new Error('red caída')),
    });

    const outcome = flow.travelTo(vecinoDeInicio());

    expect(outcome).toEqual({ moved: true });
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
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });

    flow.lookAt({ kind: 'grid', gridId: 'norte-001' });

    expect(flow.getState().view).toEqual({ kind: 'grid', gridId: 'norte-001' });
    expect(flow.getState().currentGridId).toBe(WORLD_CIFRAS.startingGridId);
    expect(getGridState(flow.getState(), 'norte-001')).toBe('inexplorado');
    expect(fake.calls.length).toBe(1);
  });

  it('una vista inválida es no-op y no persiste', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });

    flow.lookAt({ kind: 'grid', gridId: 'grid-fantasma' });

    expect(flow.getState().view).toEqual({ kind: 'region' });
    expect(fake.calls.length).toBe(0);
  });

  it('la vista persistida sobrevive el round-trip: getState refleja lo mirado', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });

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
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
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
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
    const antes = flow.getState();

    expect(flow.enterPOI('no-existe')).toBe(false);

    expect(flow.getState()).toBe(antes);
    expect(fake.calls.length).toBe(0);
  });

  it('entrar al mismo POI dos veces no vuelve a persistir', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.enterPOI(poiId);
    flow.enterPOI(poiId);

    expect(fake.calls.length).toBe(1);
  });

  it('leavePOI devuelve la vista al grid que contiene el POI', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.enterPOI(poiId);
    flow.leavePOI();

    expect(flow.getState().view).toEqual({ kind: 'grid', gridId: WORLD_CIFRAS.startingGridId });
    expect(fake.calls.length).toBe(2);
  });

  it('salir no degrada el estado del POI: sigue revelado', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.enterPOI(poiId);
    flow.leavePOI();

    expect(getPOIState(flow.getState(), poiId)).toBe('revelado');
  });

  it('leavePOI fuera de un POI no hace nada', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });

    flow.leavePOI();

    expect(flow.getState().view).toEqual({ kind: 'region' });
    expect(fake.calls.length).toBe(0);
  });
});

describe('world-flow — completar POI', () => {
  it('completePOI marca completado y persiste', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.enterPOI(poiId);
    flow.completePOI(poiId);

    expect(getPOIState(flow.getState(), poiId)).toBe('completado');
    expect(fake.calls.length).toBe(2);
  });

  it('completar dos veces el mismo POI no vuelve a persistir', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
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
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
    const poiId = poiDeInicio();

    flow.completePOI(poiId);
    flow.leavePOI();
    flow.enterPOI(poiId);

    expect(getPOIState(flow.getState(), poiId)).toBe('completado');
  });

  it('revelar POIs sube el estado derivado del grid sin escribirlo', () => {
    const fake = makePersistFake();
    const flow = createWorldFlow({ initialState: createInitialWorldState(), persist: fake.persist });
    const vecino = vecinoDeInicio();
    const poiVecino = getPOIsByGrid(vecino)[0]!.id;

    expect(deriveGridState(flow.getState(), vecino)).toBe('inexplorado');

    flow.enterPOI(poiVecino);

    expect(deriveGridState(flow.getState(), vecino)).toBe('explorado');
    // Nadie ha escrito gridStates: el estado se deriva de los POIs (#94).
    expect(flow.getState().gridStates[vecino]).toBeUndefined();
  });
});
