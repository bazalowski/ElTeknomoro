// Tests del orquestador world-flow (H4 sub-paso 4b). Persist fake: validan
// que cada mutación pasa por rules/world-state.ts y que la persistencia se
// dispara exactamente cuando debe (#90).

import { describe, it, expect, vi } from 'vitest';
import { createWorldFlow } from './world-flow';
import { createInitialWorldState, getGridState } from '../rules/world-state';
import { WORLD_CIFRAS, getCardinalNeighbours } from '../rules/world';
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
