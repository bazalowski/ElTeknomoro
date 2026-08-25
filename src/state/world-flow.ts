// Orquestador del overworld (H4 sub-paso 4b). Patrón combat-flow: la vista
// consume un handle, el handle delega toda mutación en las funciones puras de
// rules/world-state.ts (SAGRADO) y persiste fire-and-forget vía el callback
// `persist` que inyecta el caller (main.ts inyecta saveWorldState; los tests
// inyectan un fake).
//
// COSTURA DE COSTE DE VIAJE (#88, decisión del director en PASO 2 del pipeline)
// -----------------------------------------------------------------------------
// `travelTo` es el ÚNICO punto por el que pasa cualquier viaje del PJ. Hoy el
// viaje es gratis; 4d enchufa aquí la fatiga de jornada (§9.7: acciones/día,
// ración, penalización) SIN reescribir este módulo:
//   - `TravelOutcome` es ampliable: 4d añade campos (coste cobrado, acciones
//     restantes, bloqueo por día agotado) sin romper a los callers de 4b, que
//     sólo miran `moved`.
//   - La legalidad geométrica (adyacencia cardinal) seguirá viviendo en
//     rules/world-state.ts (`canTravelTo`); el coste será una capa previa aquí.
// Nada de lógica de coste en 4b: sólo esta costura documentada.

import type { PlayerView, WorldState } from '../rules/world-state';
import { canTravelTo, moveToGrid, setView } from '../rules/world-state';
import { getGrid } from '../rules/world';

// Resultado de un intento de viaje. Discriminado por `moved` para que la UI
// no pueda leer una razón de fallo en un viaje que sí ocurrió. 4d ampliará
// la rama `moved: true` con el coste cobrado (§9.7).
export type TravelOutcome =
  | { moved: true }
  | { moved: false; reason: 'unknown_grid' | 'same_grid' | 'not_adjacent' };

export interface WorldFlowHandle {
  getState(): WorldState;
  // Acción de juego (#88): mueve al PJ si el destino es legal y persiste.
  travelTo(gridId: string): TravelOutcome;
  // Cámara semántica (#88, #90): registra qué está mirando el jugador
  // (regional / grid / poi) y persiste. NO mueve al PJ, no cuesta nada.
  // El pan/zoom manual de la cámara NO pasa por aquí: es ruido de sesión.
  lookAt(view: PlayerView): void;
}

export interface WorldFlowDeps {
  initialState: WorldState;
  // Persistencia inyectada. Fire-and-forget: si la red falla se loguea y la
  // partida sigue; el autoguardado servidor-autoritativo (#10) reintentará
  // en la siguiente transición. H4 no tiene UI de error de red todavía.
  persist: (state: WorldState) => Promise<void>;
}

export function createWorldFlow(deps: WorldFlowDeps): WorldFlowHandle {
  let state = deps.initialState;

  const persistCurrent = (): void => {
    deps.persist(state).catch((err) => {
      console.error('world-flow: persist falló (la partida sigue en memoria):', err);
    });
  };

  return {
    getState: () => state,

    travelTo: (gridId: string): TravelOutcome => {
      if (getGrid(gridId) === null) return { moved: false, reason: 'unknown_grid' };
      if (gridId === state.currentGridId) return { moved: false, reason: 'same_grid' };
      if (!canTravelTo(state, gridId)) return { moved: false, reason: 'not_adjacent' };

      // Hueco del coste §9.7 (ver cabecera): 4d intercepta aquí, antes de
      // mover, y amplía TravelOutcome con lo cobrado.
      state = moveToGrid(state, gridId);
      persistCurrent();
      return { moved: true };
    },

    lookAt: (view: PlayerView): void => {
      const next = setView(state, view);
      // setView devuelve el MISMO objeto si la vista es inválida (grid/poi
      // inexistente). En ese caso no hay nada que persistir.
      if (next === state) return;
      state = next;
      persistCurrent();
    },
  };
}
