// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Fatiga de jornada (biblia §9.7). Sub-paso 4d, decisiones #71, #98, #99, #100.
//
// POR QUÉ ESTE MÓDULO EXISTE Y NO VIVE EN `world.ts`. `world.ts` es geometría:
// dónde están los grids, qué POIs tiene cada uno, quién es vecino de quién. La
// jornada es un recurso que se gasta. Son dos ejes que no comparten nada, y
// #100 los separa a propósito.
//
// QUÉ NO HACE ESTE MÓDULO. No persiste, no escribe en backend y no decide
// cuándo se llama. Todas las funciones son puras y devuelven estado nuevo; el
// orquestador vive en `state/world-flow.ts`, misma frontera que #94 puso para
// los POIs y #58 para el loot.
//
// EL DÍA NO AVANZA SOLO. No hay reloj de pared: dejar la pestaña abierta tres
// horas no gasta nada y no resetea nada (#100, Q5 y Q44 del cuestionario de
// 4d). El único reset es acampar.

import type { Character } from './character';
import type { WorldState } from './world-state';
import { killCharacter, type EndOfRunCause } from './death';
import { removeFromSlot, type Inventory } from './inventory';

// -----------------------------------------------------------------------------
// Cifras
// -----------------------------------------------------------------------------

// PROVISIONAL FASE 1 (#83, #98): números planos con calibración diferida a H6.
// Se declaran aquí y no se esparcen por el módulo para que recalibrar sea
// tocar este bloque y nada más.
export const FATIGUE_RULES = {
  // 8 acciones por día (#71). Fijas en H4; #100 las abre a modulación por
  // perks y atributos en H8, y por eso `maxActionsPerDay` es función y no un
  // número suelto en los callers.
  actionsPerDay: 8,

  // Coste de la noche sin ración (#98). El máximo es lo que mata; el actual es
  // lo que se siente al día siguiente.
  hpMaxPenaltyPerNight: 5,
  hpCurrentPenaltyRatio: 0.1,

  // Cuántas raciones lleva el PJ al crearse NO vive aquí: es `STARTING_RATIONS`
  // en `data/items.ts`, junto al resto del inventario inicial. Duplicar el
  // número en dos módulos es la forma clásica de que se separen al recalibrar.
  rationItemId: 'racion',
} as const;

// Verbos de juego que pueden gastar jornada. El enum es cerrado a propósito:
// si mañana aparece un verbo nuevo, el compilador obliga a decidir su coste en
// vez de dejarlo colar como gratis por omisión.
export type FatigueActionType =
  | 'travel'      // mover al grid adyacente
  | 'enter_poi'   // entrar a un POI
  | 'craft'       // craftear (H7)
  | 'talk'        // hablar con un NPC (H8)
  | 'fight'       // combatir
  | 'camp';       // acampar

// Coste confirmado en #100 (Q1 del cuestionario de 4d). Combatir es gratis: la
// acción se cobró al entrar al POI, y cobrarla dos veces haría que un POI con
// combate costase el doble que uno sin él por el mero hecho de tener contenido.
export const ACTION_COSTS: Readonly<Record<FatigueActionType, number>> = {
  travel: 1,
  enter_poi: 1,
  craft: 1,
  talk: 1,
  fight: 0,
  camp: 0,
};

// -----------------------------------------------------------------------------
// Lecturas
// -----------------------------------------------------------------------------

// Techo de acciones del día para este PJ. Hoy devuelve la constante para todos
// (#100: fijas en H4). La firma acepta el Character desde ya para que H8 pueda
// modularla por perks sin cambiar ni un caller.
export function maxActionsPerDay(_character: Character): number {
  return FATIGUE_RULES.actionsPerDay;
}

export function actionsRemaining(worldState: WorldState, character: Character): number {
  return Math.max(0, maxActionsPerDay(character) - worldState.actionsSpent);
}

export function actionCost(action: FatigueActionType): number {
  return ACTION_COSTS[action];
}

// ¿Alcanza la jornada para este verbo? Los verbos gratis siempre pueden.
//
// Esto es lo que apaga los botones de la UI (#99): a 0 acciones los verbos de
// mundo quedan deshabilitados con copy explicativo, pero NUNCA se dispara un
// modal solo. Acampar es siempre un click del jugador.
export function canPerform(
  worldState: WorldState,
  character: Character,
  action: FatigueActionType,
): boolean {
  const cost = actionCost(action);
  if (cost === 0) return true;
  return actionsRemaining(worldState, character) >= cost;
}

// Cuenta las raciones repartidas por la mochila. La ración es stackable en un
// solo slot (#98, Q13), pero contamos sumando todos los slots igualmente: el
// inventario no garantiza consolidación y una cuenta que asume un único stack
// se rompe en silencio el día que haya dos.
export function countRations(character: Character): number {
  let total = 0;
  for (const stack of character.inventory.slots) {
    if (stack !== null && stack.item_id === FATIGUE_RULES.rationItemId) {
      total += stack.quantity;
    }
  }
  return total;
}

export function hasRation(character: Character): boolean {
  return countRations(character) > 0;
}

// -----------------------------------------------------------------------------
// Gasto de acciones
// -----------------------------------------------------------------------------

// Gasta el coste del verbo y devuelve el WorldState nuevo. Lanza si no
// alcanza: llegar aquí sin jornada es un bug del orquestador, no un estado de
// juego — la UI ya tenía `canPerform` para no ofrecer el botón.
export function consumeAction(
  worldState: WorldState,
  character: Character,
  action: FatigueActionType,
): WorldState {
  const cost = actionCost(action);
  if (cost === 0) return worldState;
  if (!canPerform(worldState, character, action)) {
    throw new Error(
      `consumeAction: no quedan acciones para "${action}" ` +
        `(gastadas ${worldState.actionsSpent} de ${maxActionsPerDay(character)}). ` +
        `Comprueba canPerform antes de llamar.`,
    );
  }
  return { ...worldState, actionsSpent: worldState.actionsSpent + cost };
}

// -----------------------------------------------------------------------------
// Acampar
// -----------------------------------------------------------------------------

export interface CampResult {
  character: Character;
  worldState: WorldState;
  // false = se acampó a pelo y se pagó la penalización de #98.
  usedRation: boolean;
  hpMaxLost: number;
  hpCurrentLost: number;
  // true = el PJ no despertó. `character.alive` es false y lleva epitafio.
  died: boolean;
}

// Causa de fin de run por inanición. `last_damage_source='fatigue'` (#85) se
// reserva EXACTAMENTE para esto: despertar con el máximo agotado. Un PJ
// famélico que cae en combate sale con 'enemy', porque #98 fijó que el campo
// registra la causa próxima y no la contribuyente.
export function deathByFatigue(): EndOfRunCause {
  return {
    kind: 'killed_by_fatigue',
    agent_id: null,
    description: 'El hambre pudo con el viaje.',
  };
}

// Quita una ración de la mochila. Devuelve el inventario nuevo, o null si no
// había ninguna.
function spendOneRation(inventory: Inventory): Inventory | null {
  for (let i = 0; i < inventory.slots.length; i++) {
    const stack = inventory.slots[i];
    if (stack !== null && stack !== undefined && stack.item_id === FATIGUE_RULES.rationItemId) {
      return removeFromSlot(inventory, i, 1);
    }
  }
  return null;
}

// Acampar: cierra el día y abre el siguiente.
//
// CON RACIÓN: gasta una, resetea las 8 acciones, incrementa el día. **No cura**
// (#98). La analogía es del propio autor y cierra el asunto sola: una cinta de
// escribir de Resident Evil tampoco te cura, sólo te deja seguir. El HP se
// recupera con consumibles, no durmiendo.
//
// SIN RACIÓN: acampa igual —el jugador no se queda encerrado a 0 acciones—
// pero paga. El orden importa y está fijado en #98: primero cae el máximo,
// luego el 10% se calcula sobre el máximo YA reducido, y al final se clampa.
// Sin el clamp, un PJ degradado arrastraría HP actual por encima de su techo.
//
// `ended_at_iso` sólo se consume si el PJ muere; se pide siempre para no tener
// dos firmas. Lo provee `state/` para que este módulo no llame a Date.now() y
// los tests sigan siendo deterministas, igual que hace `death.ts`.
export function camp(
  character: Character,
  worldState: WorldState,
  ended_at_iso: string,
): CampResult {
  const inventarioSinRacion = spendOneRation(character.inventory);
  const usedRation = inventarioSinRacion !== null;

  const despierto: WorldState = {
    ...worldState,
    actionsSpent: 0,
    day: worldState.day + 1,
  };

  if (usedRation) {
    return {
      character: { ...character, inventory: inventarioSinRacion },
      worldState: despierto,
      usedRation: true,
      hpMaxLost: 0,
      hpCurrentLost: 0,
      died: false,
    };
  }

  // Noche a pelo. El máximo baja siempre, sin cap y acumulando noche a noche.
  const nuevoMax = character.hp.max - FATIGUE_RULES.hpMaxPenaltyPerNight;

  if (nuevoMax <= 0) {
    // El máximo se agotó: no despierta. Se pone el actual a 0 porque
    // `killCharacter` exige un PJ ya sin HP — la muerte pasa por aplicar el
    // daño primero, nunca por marcar la bandera a mano.
    const agotado: Character = {
      ...character,
      hp: { current: 0, max: 0 },
      last_damage_source: 'fatigue',
    };
    return {
      character: killCharacter(agotado, deathByFatigue(), ended_at_iso),
      worldState: despierto,
      usedRation: false,
      hpMaxLost: character.hp.max,
      hpCurrentLost: character.hp.current,
      died: true,
    };
  }

  // Sobrevive la noche. El 10% se calcula sobre el máximo ya reducido y se
  // redondea hacia arriba con mínimo 1: una noche sin comer nunca sale gratis
  // por redondeo, ni siquiera con el máximo muy bajo.
  const golpe = Math.max(1, Math.ceil(nuevoMax * FATIGUE_RULES.hpCurrentPenaltyRatio));
  const nuevoActual = Math.max(0, Math.min(character.hp.current - golpe, nuevoMax));

  return {
    character: {
      ...character,
      hp: { current: nuevoActual, max: nuevoMax },
      last_damage_source: 'fatigue',
    },
    worldState: despierto,
    usedRation: false,
    hpMaxLost: FATIGUE_RULES.hpMaxPenaltyPerNight,
    hpCurrentLost: character.hp.current - nuevoActual,
    died: false,
  };
}

// ¿Cuántas noches a pelo aguanta este PJ antes de no despertar? Lo consume la
// UI para el aviso de agonía de Q31c: la "agonía" no es una mecánica aparte,
// es esta cuenta hecha visible (#98).
export function nightsUntilStarvation(character: Character): number {
  if (character.hp.max <= 0) return 0;
  return Math.ceil(character.hp.max / FATIGUE_RULES.hpMaxPenaltyPerNight);
}
