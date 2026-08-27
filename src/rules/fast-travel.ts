// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Fast travel y anclas (biblia §9.8). Sub-paso 4e.
// Decisiones #70 (el marco), #83 (el coste), #103, #104, #105.
//
// POR QUÉ ESTE FICHERO SE REESCRIBIÓ ENTERO (#105)
// -----------------------------------------------------------------------------
// La versión anterior corría sobre `WorldMap`, `NodeId` y `WorldEdge` de
// `world-gen.ts` —un grafo procedural con aristas 'safe'/'risky'— y resolvía
// los tramos arriesgados con `rollExplorationTick`, la tirada por bioma de
// `exploration.ts`. Ninguna de las dos cosas existe ya en el modelo vigente:
// el mundo son 180 grids fijos en cuadrícula (#72) y las tablas de evento son
// por POI (#92, #102). El dataset de 4a no contiene un solo `WorldEdge`, así
// que no había pathfinding que conservar: no había grafo.
//
// Lo único que se hereda de aquel módulo es la IDEA de tramo arriesgado con
// tirada condensada (concepto #21). Está diferida a 4f/H5 por #104: en 4e el
// viaje es siempre seguro.
//
// QUÉ NO HACE ESTE MÓDULO. No persiste, no toca backend y no decide cuándo se
// llama. Todas las funciones son puras y devuelven estado nuevo; el orquestador
// vive en `state/travel-flow.ts`. Misma frontera que #94 puso para los POIs,
// #100 para la jornada y #58 para el loot.
//
// LAS DOS MITADES DEL SISTEMA. El ancla y el viaje son cosas distintas y aquí
// están separadas a propósito:
//
//   · El ANCLA es un permiso que el jugador PLANTA sobre un grid Controlado.
//     Cuesta un item y una acción. Se puede recoger y replantar.
//   · El VIAJE consume ración y jornada, y sólo va a grids con ancla.
//
// #103 sacó el ancla de la fórmula de Controlado justamente para que estas dos
// mitades no se definan la una a la otra. Ver el comentario largo de
// `deriveGridState` en `world-state.ts`.

import type { Character } from './character';
import type { WorldState } from './world-state';
import { hasAnchor, isGridControlled, placeAnchor, removeAnchor } from './world-state';
import { WORLD_CIFRAS, getGrid, getRegion } from './world';
import { canAfford, consumeActions, spendOneRation, countRations } from './fatigue';
import { addItem, removeFromSlot } from './inventory';
import type { Inventory, Item, ItemId } from './inventory';

// -----------------------------------------------------------------------------
// Cifras
// -----------------------------------------------------------------------------

// PROVISIONAL FASE 1 (#83, #104): la curva entra parametrizada desde el primer
// día, pero los números son de calibración diferida a H6. Se declaran aquí y no
// se esparcen por el módulo para que recalibrar sea tocar este bloque y nada
// más — mismo criterio que `FATIGUE_RULES`.
export const FAST_TRAVEL_RULES = {
  // Id contractual del ancla. NO uses el literal 'ancla' en código que dependa
  // del item: importa esto. El catálogo vive en `data/items.ts` y este módulo
  // es SAGRADO, así que no puede importarlo — sólo conoce el id.
  anchorItemId: 'ancla' as ItemId,

  // Coste por viaje (#104). `1 ración + (1 + ceil(d / 5))` acciones, con clamp.
  // #83 decía "plano hoy, proporcional mañana"; #104 lo matiza y entra
  // proporcional ya, porque el sistema estaba pensado para parametrizarse desde
  // la primera implementación y un plano habría que quitarlo después.
  rationsPerTrip: 1,
  baseActions: 1,
  gridsPerExtraAction: 5,
  minActions: 2,
  maxActions: 5,

  // Cap de anclas por nivel (#103): 3 al empezar, +1 cada 3 niveles, tope 6.
  // Ata donde importa —el arranque— y deja de atar en el nivel 10, sobre un
  // `levelMax` de 50. Un cap que sigue mordiendo a nivel 40 sería un impuesto,
  // no una decisión.
  baseAnchorCap: 3,
  levelsPerExtraAnchor: 3,
  maxAnchorCap: 6,
} as const;

// -----------------------------------------------------------------------------
// Lecturas: anclas
// -----------------------------------------------------------------------------

// Cuántas anclas puede tener plantadas este PJ (#103, Q2b).
export function maxAnchors(character: Character): number {
  const extra = Math.floor(
    (character.level - 1) / FAST_TRAVEL_RULES.levelsPerExtraAnchor,
  );
  return Math.min(
    FAST_TRAVEL_RULES.maxAnchorCap,
    FAST_TRAVEL_RULES.baseAnchorCap + Math.max(0, extra),
  );
}

// ¿Es este el ancla del Hogar? El Hogar nace con ancla (#103, Q6) y es la ÚNICA
// excepción a "no hay anclas prediseñadas". No salió de un item del jugador, así
// que ni cuenta para el cap ni se puede recoger: permitir recogerla regalaría un
// item que nunca se pagó, y un jugador podría convertir el hub en un ancla más.
export function isHomeAnchor(gridId: string): boolean {
  return gridId === WORLD_CIFRAS.startingGridId;
}

// Anclas que el JUGADOR tiene plantadas, sin contar la del Hogar. Es la cuenta
// que se compara contra el cap.
export function anchorsPlaced(state: WorldState): readonly string[] {
  return state.anchors.filter((gridId) => !isHomeAnchor(gridId));
}

// Anclas sin plantar que lleva el PJ en la mochila. Se suman todos los slots en
// vez de asumir un único stack, por la misma razón que `countRations`: el
// inventario no garantiza consolidación y una cuenta que asume un stack se
// rompe en silencio el día que haya dos.
export function countAnchorItems(character: Character): number {
  let total = 0;
  for (const stack of character.inventory.slots) {
    if (stack !== null && stack.item_id === FAST_TRAVEL_RULES.anchorItemId) {
      total += stack.quantity;
    }
  }
  return total;
}

// -----------------------------------------------------------------------------
// Lecturas: distancia y coste
// -----------------------------------------------------------------------------

export interface FastTravelCost {
  rations: number;
  actions: number;
}

// Distancia entre dos grids en saltos cardinales (#104, Q26a: Manhattan).
//
// Manhattan y no euclídea porque #88 fija que se camina en cruz, sin diagonales:
// la distancia que cobra el viaje rápido debe ser la que costaría andando, o el
// fast travel dejaría de tener precio comparable con las piernas.
//
// Q26c pedía medirla por "rutas de caminos". Ese sistema no existe —4a es un
// cartesiano puro— y #104 lo sustituye por Manhattan dejando la firma intacta,
// para que el día que haya rutas se cambie el cuerpo y ni un caller se entere.
//
// Devuelve -1 si alguno de los dos grids no existe.
export function gridDistance(fromGridId: string, toGridId: string): number {
  const from = getGrid(fromGridId);
  const to = getGrid(toGridId);
  if (from === null || to === null) return -1;
  return (
    Math.abs(from.position.x - to.position.x) + Math.abs(from.position.y - to.position.y)
  );
}

// Coste del viaje según distancia (#83, #104).
//
// La firma es la que #83 exigía desde el principio —"un
// `computeFastTravelCost(distanceInGrids)` que hoy devuelve un valor plano y
// mañana devuelve uno proporcional, sin reescribir el sistema"— sólo que el
// cuerpo ya es el proporcional.
//
// El clamp no es decorativo. Sin mínimo, un salto corto costaría menos que
// caminarlo y el fast travel sería siempre la opción obvia; sin máximo, un viaje
// de esquina a esquina del mundo (Manhattan llega a ~35 sobre un bounding box de
// 22×15) costaría más que las 8 acciones del día y sería imposible de pagar.
export function computeFastTravelCost(distanceInGrids: number): FastTravelCost {
  const d = Math.max(0, distanceInGrids);
  const raw =
    FAST_TRAVEL_RULES.baseActions + Math.ceil(d / FAST_TRAVEL_RULES.gridsPerExtraAction);
  const actions = Math.min(
    FAST_TRAVEL_RULES.maxActions,
    Math.max(FAST_TRAVEL_RULES.minActions, raw),
  );
  return { rations: FAST_TRAVEL_RULES.rationsPerTrip, actions };
}

// -----------------------------------------------------------------------------
// Plantar ancla
// -----------------------------------------------------------------------------

export type PlaceAnchorRefusal =
  | 'unknown_grid'
  | 'not_here'
  | 'not_controlled'
  | 'already_anchored'
  | 'cap_reached'
  | 'no_anchor_item'
  | 'no_actions';

export type AnchorCheck = { ok: true } | { ok: false; reason: PlaceAnchorRefusal };

// ¿Puede el PJ plantar un ancla en este grid?
//
// El orden de las guardas es el orden en que la UI quiere explicarlas: primero
// lo que es imposible por el mundo, después lo que falta en la mochila. Un
// jugador sin anclas sobre un grid sin Controlar debe leer "no lo has
// controlado", no "no llevas anclas": lo segundo le haría ir a buscar un item
// que no le habría servido.
//
// `not_here` existe porque plantar es un acto físico: se planta donde estás, no
// sobre el mapa a distancia. Es la misma línea que #88 traza entre mirar y
// actuar.
export function canPlaceAnchorAt(
  state: WorldState,
  character: Character,
  gridId: string,
): AnchorCheck {
  if (getGrid(gridId) === null) return { ok: false, reason: 'unknown_grid' };
  if (state.currentGridId !== gridId) return { ok: false, reason: 'not_here' };
  if (!isGridControlled(state, gridId)) return { ok: false, reason: 'not_controlled' };
  if (hasAnchor(state, gridId)) return { ok: false, reason: 'already_anchored' };
  if (anchorsPlaced(state).length >= maxAnchors(character)) {
    return { ok: false, reason: 'cap_reached' };
  }
  if (countAnchorItems(character) < 1) return { ok: false, reason: 'no_anchor_item' };
  if (!canAfford(state, character, 1)) return { ok: false, reason: 'no_actions' };
  return { ok: true };
}

export interface AnchorResult {
  character: Character;
  worldState: WorldState;
}

// Planta el ancla: consume el item, cobra la acción y escribe el ancla.
//
// Lanza si el sitio no era legal, por la misma razón que `consumeAction`: llegar
// aquí sin pasar por `canPlaceAnchorAt` es un bug del orquestador, no un estado
// de juego. La UI ya tenía la comprobación para no ofrecer el botón.
export function executePlaceAnchor(
  state: WorldState,
  character: Character,
  gridId: string,
): AnchorResult {
  const check = canPlaceAnchorAt(state, character, gridId);
  if (!check.ok) {
    throw new Error(
      `executePlaceAnchor: no se puede plantar en "${gridId}" (${check.reason}). ` +
        `Comprueba canPlaceAnchorAt antes de llamar.`,
    );
  }
  const inventory = takeOneAnchor(character.inventory);
  if (inventory === null) {
    // Inalcanzable: `canPlaceAnchorAt` ya contó el item. Se comprueba igualmente
    // para no devolver un ancla plantada sin haberla pagado si la guarda cambia.
    throw new Error('executePlaceAnchor: el PJ no lleva ningún ancla.');
  }
  return {
    character: { ...character, inventory },
    worldState: placeAnchor(consumeActions(state, character, 1, 'plantar ancla'), gridId),
  };
}

// -----------------------------------------------------------------------------
// Recoger ancla
// -----------------------------------------------------------------------------

export type RetrieveAnchorRefusal =
  | 'unknown_grid'
  | 'not_here'
  | 'no_anchor'
  | 'home_anchor'
  | 'no_actions';

export type RetrieveCheck = { ok: true } | { ok: false; reason: RetrieveAnchorRefusal };

// ¿Puede el PJ recoger el ancla de este grid? (#103, Q15a.)
//
// El ancla del Hogar no se recoge: no salió de un item del jugador, así que
// recogerla le daría uno gratis y dejaría el hub sin punto de retorno.
export function canRetrieveAnchorFrom(
  state: WorldState,
  character: Character,
  gridId: string,
): RetrieveCheck {
  if (getGrid(gridId) === null) return { ok: false, reason: 'unknown_grid' };
  if (state.currentGridId !== gridId) return { ok: false, reason: 'not_here' };
  if (isHomeAnchor(gridId)) return { ok: false, reason: 'home_anchor' };
  if (!hasAnchor(state, gridId)) return { ok: false, reason: 'no_anchor' };
  if (!canAfford(state, character, 1)) return { ok: false, reason: 'no_actions' };
  return { ok: true };
}

// Recoge el ancla: devuelve el item a la mochila, cobra la acción y borra el
// ancla del mundo. El estado del grid NO se toca — con #103 sigue Controlado
// sin ella, que es lo que Q11 pide.
//
// `catalog` se inyecta porque `addItem` necesita el `stack_size` del item y este
// módulo es SAGRADO: `rules/` no importa de `data/`. Mismo patrón que el
// `tableLookup` del módulo anterior y que el `catalog` de `equippedWeapon`.
export function executeRetrieveAnchor(
  state: WorldState,
  character: Character,
  gridId: string,
  catalog: Readonly<Record<ItemId, Item>>,
): AnchorResult {
  const check = canRetrieveAnchorFrom(state, character, gridId);
  if (!check.ok) {
    throw new Error(
      `executeRetrieveAnchor: no se puede recoger en "${gridId}" (${check.reason}). ` +
        `Comprueba canRetrieveAnchorFrom antes de llamar.`,
    );
  }
  const inventory = addItem(
    character.inventory,
    { item_id: FAST_TRAVEL_RULES.anchorItemId, quantity: 1, durability: null },
    catalog,
  );
  return {
    character: { ...character, inventory },
    worldState: removeAnchor(consumeActions(state, character, 1, 'recoger ancla'), gridId),
  };
}

// -----------------------------------------------------------------------------
// Viajar
// -----------------------------------------------------------------------------

export type FastTravelRefusal =
  | 'unknown_grid'
  | 'same_grid'
  | 'no_anchor'
  | 'inside_poi'
  | 'no_rations'
  | 'no_actions';

export type FastTravelCheck =
  | { ok: true; cost: FastTravelCost }
  | { ok: false; reason: FastTravelRefusal; cost: FastTravelCost };

// ¿Puede el PJ viajar a este grid? Devuelve el coste en las dos ramas: la UI lo
// necesita también cuando la respuesta es no, porque el copy de #104 dice qué
// falta ("necesitas 1 ración") y para eso hay que saber cuánto costaba.
//
// `inside_poi` sale de Q39: hay que salir del POI antes de viajar. Se lee del
// propio `view` persistido y no de un flag de UI, para que la regla valga igual
// si el viaje se dispara desde un atajo de teclado.
export function canFastTravelTo(
  state: WorldState,
  character: Character,
  gridId: string,
): FastTravelCheck {
  const cost = computeFastTravelCost(gridDistance(state.currentGridId, gridId));
  const refuse = (reason: FastTravelRefusal): FastTravelCheck => ({ ok: false, reason, cost });

  if (getGrid(gridId) === null) return refuse('unknown_grid');
  if (state.currentGridId === gridId) return refuse('same_grid');
  if (!hasAnchor(state, gridId)) return refuse('no_anchor');
  if (state.view.kind === 'poi') return refuse('inside_poi');
  if (countRations(character) < cost.rations) return refuse('no_rations');
  if (!canAfford(state, character, cost.actions)) return refuse('no_actions');
  return { ok: true, cost };
}

export interface FastTravelResult {
  character: Character;
  worldState: WorldState;
  cost: FastTravelCost;
}

// Ejecuta el viaje: cobra ración y jornada, y deja al PJ en el grid destino.
//
// EL COBRO Y EL MOVIMIENTO SON UNA SOLA TRANSACCIÓN. Todo sale de aquí en un
// único par `{ character, worldState }`, y el orquestador lo persiste de una vez.
// Es lo que hace que Q40 (cerrar el navegador a mitad del modal) se resuelva
// solo: mientras el jugador mira el modal no se ha escrito nada, así que
// recargar lo devuelve al grid origen con la despensa intacta. No hay estado
// intermedio de "viajando" que pueda quedarse a medias — igual que #90 dice que
// el PJ nunca está "en tránsito".
//
// El PJ aterriza en una posición neutral del grid (#104, Q24 corregida): el
// destino es el GRID, no un POI suyo. Llegar al POI Asentamiento era imposible
// en 106 de los 180 grids, que no tienen ninguno. La vista se fija en el grid y
// la niebla de los POIs no se toca: viajar no revela nada.
export function executeFastTravel(
  state: WorldState,
  character: Character,
  gridId: string,
): FastTravelResult {
  const check = canFastTravelTo(state, character, gridId);
  if (!check.ok) {
    throw new Error(
      `executeFastTravel: no se puede viajar a "${gridId}" (${check.reason}). ` +
        `Comprueba canFastTravelTo antes de llamar.`,
    );
  }

  const inventory = spendRations(character.inventory, check.cost.rations);
  if (inventory === null) {
    throw new Error('executeFastTravel: el PJ no lleva raciones suficientes.');
  }

  const cobrado = consumeActions(state, character, check.cost.actions, 'viaje rápido');

  return {
    character: { ...character, inventory },
    worldState: {
      ...cobrado,
      currentGridId: gridId,
      view: { kind: 'grid', gridId },
    },
    cost: check.cost,
  };
}

// -----------------------------------------------------------------------------
// Lista de destinos (#104, Q19b)
// -----------------------------------------------------------------------------

export interface AnchorDestination {
  gridId: string;
  regionId: string;
  // Nombre canónico de la región (4a). El grid en sí no tiene displayName en el
  // dataset —sólo id— así que la lista se apoya en la región, igual que #93 dejó
  // el título del POI en su id. Provisional de cara a dev hasta fase 2.
  regionName: string;
  distance: number;
  cost: FastTravelCost;
  isHome: boolean;
  // Resultado de `canFastTravelTo`, ya resuelto: la UI pinta la fila
  // deshabilitada y el copy sale de `reason` sin volver a preguntar.
  reachable: boolean;
  reason: FastTravelRefusal | null;
}

// Todos los destinos con ancla, ordenados por distancia. El grid donde está el
// PJ entra en la lista como no alcanzable (`same_grid`) en vez de omitirse:
// esconderlo haría que el jugador buscase un ancla que sabe que plantó. Q22
// pedía exactamente eso — "botón gris en la propia ancla".
export function listAnchorDestinations(
  state: WorldState,
  character: Character,
): readonly AnchorDestination[] {
  const destinos: AnchorDestination[] = [];
  for (const gridId of state.anchors) {
    const grid = getGrid(gridId);
    if (grid === null) continue;
    const check = canFastTravelTo(state, character, gridId);
    destinos.push({
      gridId,
      regionId: grid.regionId,
      regionName: getRegion(grid.regionId)?.displayName ?? grid.regionId,
      distance: gridDistance(state.currentGridId, gridId),
      cost: check.cost,
      isHome: isHomeAnchor(gridId),
      reachable: check.ok,
      reason: check.ok ? null : check.reason,
    });
  }
  return destinos.sort((a, b) => a.distance - b.distance || a.gridId.localeCompare(b.gridId));
}

// -----------------------------------------------------------------------------
// Helpers de inventario
// -----------------------------------------------------------------------------

// Quita un ancla de la mochila. null si no había ninguna. Gemelo de
// `spendOneRation` en `fatigue.ts`, y por el mismo motivo: la búsqueda del slot
// vive en un solo sitio.
function takeOneAnchor(inventory: Inventory): Inventory | null {
  for (let i = 0; i < inventory.slots.length; i++) {
    const stack = inventory.slots[i];
    if (stack !== null && stack !== undefined && stack.item_id === FAST_TRAVEL_RULES.anchorItemId) {
      return removeFromSlot(inventory, i, 1);
    }
  }
  return null;
}

// Gasta N raciones reutilizando el gasto de una del motor de fatiga. N es 1 hoy
// (#104), pero el bucle está escrito porque `rationsPerTrip` es un parámetro de
// calibración de H6 y el día que valga 2 esto no debe reescribirse.
function spendRations(inventory: Inventory, n: number): Inventory | null {
  let actual = inventory;
  for (let i = 0; i < n; i++) {
    const siguiente = spendOneRation(actual);
    if (siguiente === null) return null;
    actual = siguiente;
  }
  return actual;
}
