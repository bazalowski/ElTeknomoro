// Orquestador del fast travel y de las anclas (H4 sub-paso 4e, #103-#105).
//
// POR QUÉ ES UN MÓDULO APARTE Y NO MÉTODOS DE `world-flow`
// -----------------------------------------------------------------------------
// `world-flow` declara en su propia cabecera que NUNCA escribe el `Character`:
// su `persist` sólo sabe guardar `WorldState`, y por eso `camp()` acabó
// orquestado desde `main.ts`. Las tres operaciones de 4e mutan las dos cosas a
// la vez —plantar y recoger mueven un item, viajar gasta una ración— así que no
// caben ahí sin romper esa frontera.
//
// La alternativa era repartirlas por `main.ts` como se hizo con `camp()`. Con
// una operación era tolerable; con tres, cada una con su guarda y su rama de
// rechazo, `main.ts` se habría convertido en el sitio donde vive la mitad de
// 4e. Este módulo las agrupa y las deja testables sin navegador.
//
// QUÉ NO HACE. No decide reglas: todo lo que puede decir que no vive en
// `rules/fast-travel.ts`, que es SAGRADO y puro. Aquí sólo se compone el
// resultado y se manda a persistir por los dos canales que ya existen — el
// `replaceState` de `world-flow` para el mundo y `persistCharacter` para el PJ.

import type { Character } from '../rules/character';
import type { ItemId, Item } from '../rules/inventory';
import type { WorldState } from '../rules/world-state';
import { actionsRemaining } from '../rules/fatigue';
import type { WorldFlowHandle } from './world-flow';
import {
  canFastTravelTo,
  canPlaceAnchorAt,
  canRetrieveAnchorFrom,
  executeFastTravel,
  executePlaceAnchor,
  executeRetrieveAnchor,
  listAnchorDestinations,
  maxAnchors,
  anchorsPlaced,
  countAnchorItems,
  type AnchorDestination,
  type FastTravelCost,
  type FastTravelRefusal,
  type PlaceAnchorRefusal,
  type RetrieveAnchorRefusal,
} from '../rules/fast-travel';

// Resultado de cada operación, discriminado por `ok` para que la UI no pueda
// leer una razón de fallo en una operación que sí ocurrió. Mismo patrón que
// `TravelOutcome` en `world-flow`.
export type PlaceAnchorOutcome =
  | { ok: true; actionsLeft: number; anchorsLeft: number }
  | { ok: false; reason: PlaceAnchorRefusal };

export type RetrieveAnchorOutcome =
  | { ok: true; actionsLeft: number; anchorsLeft: number }
  | { ok: false; reason: RetrieveAnchorRefusal };

export type FastTravelOutcome =
  | { ok: true; cost: FastTravelCost; actionsLeft: number }
  | { ok: false; reason: FastTravelRefusal; cost: FastTravelCost };

// Lo que la UI necesita para pintar el estado de las anclas sin recalcularlo.
export interface AnchorStatus {
  placed: number;
  cap: number;
  inBackpack: number;
}

export interface TravelFlowHandle {
  placeAnchorHere(): PlaceAnchorOutcome;
  retrieveAnchorHere(): RetrieveAnchorOutcome;
  fastTravelTo(gridId: string): FastTravelOutcome;
  // Lista de destinos ya resuelta (#104, Q19b): nombre, región, distancia y
  // coste, con las filas no alcanzables marcadas y su razón.
  destinations(): readonly AnchorDestination[];
  anchorStatus(): AnchorStatus;
}

export interface TravelFlowDeps {
  worldFlow: WorldFlowHandle;
  // Accesor de lectura del PJ vivo, igual que en `world-flow`: es función y no
  // valor porque el PJ se remonta al acampar y al cerrar combate, y un snapshot
  // capturado aquí quedaría viejo.
  getCharacter: () => Character;
  // Escritura del PJ. La inyecta `main.ts`, que es quien sabe guardarlo — este
  // módulo no conoce ni slots ni Supabase.
  persistCharacter: (character: Character) => void;
  // Catálogo de items. `executeRetrieveAnchor` lo necesita para devolver el
  // ancla a la mochila y `rules/` no puede importar de `data/`.
  catalog: Readonly<Record<ItemId, Item>>;
}

export function createTravelFlow(deps: TravelFlowDeps): TravelFlowHandle {
  const { worldFlow, getCharacter, persistCharacter, catalog } = deps;

  // Las tres operaciones escriben mundo y PJ juntos. El orden importa poco
  // porque `replaceState` persiste fire-and-forget, pero se hace siempre igual:
  // primero el mundo, luego el PJ. Si la segunda escritura falla, el jugador ve
  // el viaje hecho y el coste sin cobrar — que es el fallo benigno de los dos.
  const commit = (next: { character: Character; worldState: WorldState }): void => {
    worldFlow.replaceState(next.worldState);
    persistCharacter(next.character);
  };

  return {
    placeAnchorHere: (): PlaceAnchorOutcome => {
      const state = worldFlow.getState();
      const character = getCharacter();
      const gridId = state.currentGridId;

      // Se pregunta en vez de dejar lanzar: quedarse sin anclas o sin jornada
      // es estado de juego normal, no un bug del orquestador. Misma línea que
      // `travelTo` en `world-flow`.
      const check = canPlaceAnchorAt(state, character, gridId);
      if (!check.ok) return { ok: false, reason: check.reason };

      const result = executePlaceAnchor(state, character, gridId);
      commit(result);
      return {
        ok: true,
        actionsLeft: actionsRemaining(result.worldState, result.character),
        anchorsLeft: countAnchorItems(result.character),
      };
    },

    retrieveAnchorHere: (): RetrieveAnchorOutcome => {
      const state = worldFlow.getState();
      const character = getCharacter();
      const gridId = state.currentGridId;

      const check = canRetrieveAnchorFrom(state, character, gridId);
      if (!check.ok) return { ok: false, reason: check.reason };

      const result = executeRetrieveAnchor(state, character, gridId, catalog);
      commit(result);
      return {
        ok: true,
        actionsLeft: actionsRemaining(result.worldState, result.character),
        anchorsLeft: countAnchorItems(result.character),
      };
    },

    fastTravelTo: (gridId: string): FastTravelOutcome => {
      const state = worldFlow.getState();
      const character = getCharacter();

      const check = canFastTravelTo(state, character, gridId);
      if (!check.ok) return { ok: false, reason: check.reason, cost: check.cost };

      const result = executeFastTravel(state, character, gridId);
      commit(result);
      return {
        ok: true,
        cost: result.cost,
        actionsLeft: actionsRemaining(result.worldState, result.character),
      };
    },

    destinations: (): readonly AnchorDestination[] =>
      listAnchorDestinations(worldFlow.getState(), getCharacter()),

    anchorStatus: (): AnchorStatus => {
      const character = getCharacter();
      return {
        placed: anchorsPlaced(worldFlow.getState()).length,
        cap: maxAnchors(character),
        inBackpack: countAnchorItems(character),
      };
    },
  };
}
