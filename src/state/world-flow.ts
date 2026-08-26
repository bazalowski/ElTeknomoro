// Orquestador del overworld (H4 sub-paso 4b). Patrón combat-flow: la vista
// consume un handle, el handle delega toda mutación en las funciones puras de
// rules/world-state.ts (SAGRADO) y persiste fire-and-forget vía el callback
// `persist` que inyecta el caller (main.ts inyecta saveWorldState; los tests
// inyectan un fake).
//
// COSTE DE JORNADA (§9.7, cableado en el sub-paso 4d.2)
// -----------------------------------------------------------------------------
// Las costuras que 4b y 4c.1 dejaron abiertas ya están usadas. `travelTo` y
// `enterPOI` son los ÚNICOS puntos por los que el PJ se mueve o entra, así que
// aquí es donde se cobra la acción del día. Dos precisiones que costaron
// pensarse y que conviene no deshacer:
//
//   1. `enterPOI` cobra DESPUÉS de la guarda `alreadyHere`, no antes, aunque
//      el comentario original de la costura apuntase al punto de arriba.
//      Volver de un combate de POI remonta la vista y vuelve a llamar
//      `enterPOI` con el mismo POI: cobrar antes de la guarda haría que cada
//      combate costase una acción extra, contra Q41 de #100 ("entrar cobra,
//      el combate sale gratis").
//
//   2. Este módulo NO orquesta `camp()`. `camp()` devuelve un `Character`
//      nuevo y aquí no hay canal para persistirlo — `persist` sólo escribe
//      `WorldState`. Quien acampa es `main.ts`, que sí sabe guardar el PJ.
//      `getCharacter` es un accesor de LECTURA: se necesita porque
//      `canPerform` y `consumeAction` leen el techo de jornada del PJ (#100
//      lo abre a perks en H8), y este módulo nunca escribe el Character.

import type { Character } from '../rules/character';
import type { PlayerView, WorldState } from '../rules/world-state';
import { canPerform, consumeAction } from '../rules/fatigue';
import {
  canTravelTo,
  moveToGrid,
  setView,
  revealPOI,
  completePOI,
  getPOIState,
} from '../rules/world-state';
import { getGrid, getPOI } from '../rules/world';
import { actionsRemaining } from '../rules/fatigue';

// Resultado de un intento de viaje. Discriminado por `moved` para que la UI
// no pueda leer una razón de fallo en un viaje que sí ocurrió.
//
// 4d.2 amplió la rama `moved: true` con la jornada restante y añadió
// `no_actions` a las razones de fallo. Los callers de 4b sólo miran `moved`,
// así que la ampliación no rompió a nadie: era el punto de la costura.
export type TravelOutcome =
  | { moved: true; actionsLeft: number }
  | { moved: false; reason: 'unknown_grid' | 'same_grid' | 'not_adjacent' | 'no_actions' };

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
  // Sustituye el estado entero y lo persiste (sub-paso 4d.2).
  //
  // Existe por `camp()`, que es la única mutación del mundo que NO nace aquí:
  // el motor de fatiga devuelve `{ character, worldState }` juntos y quien lo
  // llama es `main`, porque es el único que sabe persistir el Character. El
  // WorldState resultante vuelve por esta puerta para que la jornada
  // reseteada y el día nuevo se guarden por el mismo canal que todo lo demás.
  //
  // No es un setter genérico: si aparece una segunda mutación que quiera
  // usarlo, casi seguro pertenece a este módulo como método propio.
  replaceState(next: WorldState): void;

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
  // Accesor de lectura del PJ vivo. `canPerform` y `consumeAction` necesitan
  // el Character para resolver el techo de jornada, que #100 abre a modulación
  // por perks en H8. Es una función y no un valor porque el PJ se remonta al
  // acampar y al cerrar combate: un snapshot capturado aquí quedaría viejo.
  // Este módulo NUNCA escribe el Character.
  getCharacter: () => Character;
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

      // Coste de jornada antes de mover (§9.7). Se comprueba en vez de dejar
      // lanzar a `consumeAction`: quedarse sin día es estado de juego normal,
      // no un bug del orquestador.
      const character = deps.getCharacter();
      if (!canPerform(state, character, 'travel')) {
        return { moved: false, reason: 'no_actions' };
      }

      state = moveToGrid(consumeAction(state, character, 'travel'), gridId);
      persistCurrent();
      return { moved: true, actionsLeft: actionsRemaining(state, character) };
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

      // El coste va AQUÍ, pasada la guarda (ver cabecera, punto 1): volver de
      // un combate reentra al mismo POI y no debe cobrar segunda vez.
      const character = deps.getCharacter();
      if (!canPerform(state, character, 'enter_poi')) return false;

      const cobrado = consumeAction(state, character, 'enter_poi');
      const next = setView(revealPOI(cobrado, poiId), { kind: 'poi', poiId });
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

    replaceState: (next: WorldState): void => {
      if (next === state) return;
      state = next;
      persistCurrent();
    },

    flush: (): Promise<void> => lastWrite,
  };
}
