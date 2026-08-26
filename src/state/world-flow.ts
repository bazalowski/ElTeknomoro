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
//
// COSTURA DE COSTE DE ENTRADA A POI (§9.7, sub-paso 4c.1)
// -----------------------------------------------------------------------------
// `enterPOI` es al POI lo que `travelTo` es al grid: el único punto por el que
// se entra. §9.7 cuenta "entrar a POI" como una de las 8 acciones del día, así
// que 4d intercepta aquí igual que en `travelTo`. Hoy entrar es gratis.

import type { PlayerView, WorldState } from '../rules/world-state';
import {
  canTravelTo,
  moveToGrid,
  setView,
  revealPOI,
  completePOI,
  getPOIState,
} from '../rules/world-state';
import { getGrid, getPOI } from '../rules/world';

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
  // Entrar a un POI (#94): revela + fija la vista en UNA sola escritura de
  // estado y UN solo persist. La niebla de §9.9 cae por entrar, no por pulsar
  // nada dentro. Devuelve false si el POI no existe.
  enterPOI(poiId: string): boolean;
  // Salir del POI al grid que lo contiene. No degrada el estado del POI.
  leavePOI(): void;
  // Cerrar el evento del POI (#94). En 4c.1 lo llama el cierre del combate con
  // victoria. NO cierra el POI: se puede volver siempre (#92), sólo pinta el
  // indicador de #91.
  completePOI(poiId: string): void;
  // Espera a que la última escritura pendiente confirme (sub-paso 4c.2).
  //
  // El resto del módulo persiste fire-and-forget a propósito: nadie debe
  // esperar a la red para seguir jugando. Pero "Guardar y salir al menú"
  // desmonta la vista, y navegar sin esperar puede perder la última mutación
  // — con lo que "cargar te devuelve donde estabas" fallaría de forma
  // intermitente, que es el peor tipo de fallo para depurar. Este es el único
  // punto que aguarda, y rechaza si la escritura falló para que el jugador
  // pueda decidir no salir.
  flush(): Promise<void>;
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

  // Última escritura lanzada. `flush` se engancha a ésta en vez de disparar
  // una nueva: si no hay nada pendiente, resuelve al instante.
  let lastWrite: Promise<void> = Promise.resolve();

  const persistCurrent = (): void => {
    const write = deps.persist(state);
    lastWrite = write;
    write.catch((err) => {
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

    enterPOI: (poiId: string): boolean => {
      const poi = getPOI(poiId);
      if (poi === null) return false;

      // Hueco del coste §9.7 (ver cabecera): 4d intercepta aquí, antes de
      // revelar, y decide si entrar consume acción del día.
      //
      // Las dos mutaciones se componen sobre el MISMO estado y se persisten
      // una sola vez. Encadenar `lookAt` + un `reveal` aparte serían dos
      // writes por cada entrada a POI y una ventana en la que el estado
      // persistido dice "estoy en un POI que sigue bajo niebla".
      // Reentrada al mismo POI: nada que escribir. `setView` construye un
      // objeto nuevo aunque la vista sea idéntica, así que sin esta guarda un
      // repintado o un remontaje de la vista (volver de un combate) generaría
      // un write redundante por cada vuelta.
      const alreadyHere =
        state.view.kind === 'poi' && state.view.poiId === poiId && getPOIState(state, poiId) !== null;
      if (alreadyHere) return true;

      const next = setView(revealPOI(state, poiId), { kind: 'poi', poiId });
      if (next === state) return true;
      state = next;
      persistCurrent();
      return true;
    },

    leavePOI: (): void => {
      if (state.view.kind !== 'poi') return;
      const poi = getPOI(state.view.poiId);
      const next = setView(
        state,
        poi === null ? { kind: 'region' } : { kind: 'grid', gridId: poi.gridId },
      );
      if (next === state) return;
      state = next;
      persistCurrent();
    },

    completePOI: (poiId: string): void => {
      const next = completePOI(state, poiId);
      if (next === state) return;
      state = next;
      persistCurrent();
    },

    flush: (): Promise<void> => lastWrite,
  };
}
