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
  | 'travel'        // mover al grid adyacente
  | 'enter_poi'     // entrar a un POI
  | 'place_anchor'  // plantar o recoger un ancla (#103)
  | 'craft'         // craftear (H7)
  | 'talk'          // hablar con un NPC (H8)
  | 'fight'         // combatir
  | 'camp';         // acampar

// El fast travel NO está en este enum a propósito. Su coste es variable —
// entre 2 y 5 acciones según distancia (#104)— y `ACTION_COSTS` es un record
// de coste FIJO por verbo. Meterlo aquí obligaría a mentir con un número y
// cobrarlo por otra vía. Para eso está `consumeActions`, más abajo.

// Coste confirmado en #100 (Q1 del cuestionario de 4d). Combatir es gratis: la
// acción se cobró al entrar al POI, y cobrarla dos veces haría que un POI con
// combate costase el doble que uno sin él por el mero hecho de tener contenido.
export const ACTION_COSTS: Readonly<Record<FatigueActionType, number>> = {
  travel: 1,
  enter_poi: 1,
  // Plantar cuesta 1 acción (#103, la rama del default de Q14 que aplica
  // cuando el ancla es un item físico). Recoger cuesta lo mismo: si recoger
  // fuese gratis, mover un ancla costaría lo mismo que plantarla y el cap por
  // nivel dejaría de significar nada — bastaría con ir arrastrando la misma.
  place_anchor: 1,
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
  return consumeActions(worldState, character, cost, action);
}

// ¿Alcanza la jornada para gastar `n` acciones de golpe? La usa el fast
// travel, cuyo coste sale de `computeFastTravelCost` y no de un verbo fijo.
export function canAfford(
  worldState: WorldState,
  character: Character,
  n: number,
): boolean {
  if (n <= 0) return true;
  return actionsRemaining(worldState, character) >= n;
}

// Gasta `n` acciones de una sola escritura (#104, sub-paso 4e).
//
// Existe porque el fast travel cuesta entre 2 y 5 acciones según distancia y
// `ACTION_COSTS` sólo sabe de costes fijos. La alternativa era llamar a
// `consumeAction('travel')` entre dos y cinco veces seguidas: funcionaría, y
// dejaría un viaje convertido en cinco transiciones de estado que cualquier
// log, undo o test de regresión leería como cinco viajes distintos.
//
// `label` es sólo para el mensaje de error. Lanza por la misma razón que
// `consumeAction`: llegar sin jornada es un bug del orquestador.
export function consumeActions(
  worldState: WorldState,
  character: Character,
  n: number,
  label = 'acción',
): WorldState {
  if (n <= 0) return worldState;
  if (!canAfford(worldState, character, n)) {
    throw new Error(
      `consumeActions: no quedan acciones suficientes para "${label}" ` +
        `(pedidas ${n}, gastadas ${worldState.actionsSpent} de ${maxActionsPerDay(character)}). ` +
        `Comprueba canAfford antes de llamar.`,
    );
  }
  return { ...worldState, actionsSpent: worldState.actionsSpent + n };
}

// -----------------------------------------------------------------------------
// Acampar
// -----------------------------------------------------------------------------

export interface CampResult {
  character: Character;
  worldState: WorldState;
  // false = se acampó a pelo y se pagó la penalización de #98.
  usedRation: boolean;
  // HP recuperado al dormir comiendo. 0 si se acampó sin ración.
  hpRestored: number;
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
//
// Exportada desde 4e: `rules/fast-travel.ts` también cobra una ración por
// viaje (#104), y reimplementar ahí la búsqueda del slot es la forma clásica
// de que las dos copias se separen el día que la ración cambie de forma.
export function spendOneRation(inventory: Inventory): Inventory | null {
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
// CON RACIÓN: gasta una, resetea las 8 acciones, incrementa el día y **cura
// hasta el máximo vigente** (#98, matizada el 26/8/2026 al probar 4d.2).
//
// La versión anterior no curaba, apoyándose en Q12b. Era una lectura de más:
// Q12b dice que comer una ración **fuera** de acampar no repone HP, no que
// dormir alimentado tampoco lo haga, y Q24 pedía literalmente "ver que
// recuperas todo" en el resumen del día. Dormir con el estómago lleno repone;
// lo que no repone es masticar de pie a mitad de jornada.
//
// El techo es `hp.max` VIGENTE: si la inanición ya lo degradó, comer devuelve
// al nuevo máximo, no al original. Revertir la pérdida de máximo sigue siendo
// balance postergado (#98, Q33).
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
    const restaurado = Math.max(0, character.hp.max - character.hp.current);
    return {
      character: {
        ...character,
        inventory: inventarioSinRacion,
        hp: { current: character.hp.max, max: character.hp.max },
      },
      worldState: despierto,
      usedRation: true,
      hpRestored: restaurado,
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
      hpRestored: 0,
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
    hpRestored: 0,
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
