// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.3 (sistema de tiradas), §4.4 (defensa), §4.8 (combate). H3.
//
// Resuelve un ataque usando el pool de d6 cerrado en decisión #36:
//   N dados = ATR + HAB del atacante
//   éxitos 4-5-6, crítico si ≥2 seises
//   impacta si éxitos ≥ umbral_DEF
//   daño = arma_base + margen sobre umbral; crítico dobla daño final
//
// CERRADO:
//   - Dado de ataque: decisión #36 (pool d6 4+, ATR+HAB).
//   - Iniciativa: decisión #41. DES + 1d20 (PJ) | initiative_base + 1d20 (enemigo).
//     Desempate: mayor DES bruto, luego PJ sobre enemigo.
//     Validado en simulaciones/iniciativa-v0.1.md.
//   - Threshold de impacto: decisión #46. ceil(DEF/3). Validado vía
//     simulaciones/dado-combate-v0.2.md (cierre #36).
//   - Sin arma equipada → puños (FUE + 0, daño 1). Fallback explícito.

import type { Rng } from './dice';
import { rollCombatPool, rollD20, type CombatPoolResult } from './dice';
import type { AttributeId, Character } from './character';
import type { Item, ItemId } from './inventory';
import { equippedWeapon, totalDefenseBonus } from './inventory';
import { computeDefense } from './character';
// Sub-paso 4b: bonos de perks aplicados como CAPA EXTERNA (#75 sagrado).
// resolveAttack/rollCombatPool/computeHitThreshold no se modifican: los bonos
// se suman en el caller (buildAttackInputFromCharacter, computeCharacterDefense,
// rollInitiativeForCharacter, applyCharacterAction post-resolveAttack).
import {
  perkAttackPoolBonus,
  perkDamageBonus,
  perkDefBonus,
  perkInitiativeBonus,
} from './perks';
// Tipos canónicos de estados — la fuente de verdad vive en rules/statuses.ts.
// Se importan localmente para usarlos en la firma de EnemyState y se
// re-exportan más abajo para mantener los importadores actuales (combat-flow.ts).
import type { StatusBearer, StatusEffect } from './statuses';
import {
  applyStatus,
  hasStatus,
  STATUS_DEFAULT_DURATION,
  STATUS_DEFAULT_MAGNITUDE,
  tickStatusesAtTurnEnd,
  tickStatusesAtTurnStart,
} from './statuses';
// IA táctica (sub-paso 4c). Cada enemigo declara un perfil; el motor consulta
// `decideEnemyAction` al inicio del turno enemigo y ejecuta el intent.
import { decideEnemyAction, type AIProfile, type EnemyIntent } from './ai';

// -----------------------------------------------------------------------------
// Enemigos (biblia §4.8 + scope §1.5/§1.9)
// -----------------------------------------------------------------------------

export type EnemyId = string;

// Modelo mínimo de enemigo. El catálogo de 10 tipos es contenido (data/), no
// vive aquí. Aquí sólo el contrato que combat.ts consume.
export interface Enemy {
  id: EnemyId;
  name: string;
  level: number;
  // Stats agregados ya resueltos. El catálogo los declara directamente, no
  // pasamos por atributos para enemigos en MVP (se simplifica respecto al PJ).
  attack_pool: number;       // dados que tira al atacar
  defense_threshold: number; // éxitos que pide para ser impactado
  weapon_damage: number;     // daño base si impacta
  initiative_base: number;   // estadística pasiva, ver rollInitiative
  hp_max: number;
  // Perfil de IA (sub-paso 4c, decisión E2). Determina cómo decide el
  // enemigo qué acción tomar en cada turno: agresivo (siempre ataca),
  // evasor (alterna defender/atacar), cauteloso (defiende cuando lo
  // hieren), toxico (envenena al PJ una vez, luego ataca). El catálogo
  // (`data/enemies.ts`) lo declara obligatoriamente para cada Enemy. La
  // lógica de decisión vive en `rules/ai.ts`. Es propiedad del TIPO, no
  // de la instancia: dos lobos del mismo template comparten perfil.
  ai_profile: AIProfile;
}

// Estado in-flight de un enemigo dentro de un combate. La instancia del Enemy
// (plantilla) no se muta nunca; lo que cambia turno a turno vive aquí.
export interface EnemyState {
  enemy_id: EnemyId;
  // Identificador único dentro del combate (ej. "lobo#1", "lobo#2") para que
  // dos enemigos del mismo tipo se distingan en log y targeting.
  instance_id: string;
  hp: number;
  alive: boolean;
  statuses: readonly StatusEffect[];
  // Próxima acción que el enemigo va a tomar en su turno (sub-paso 4c).
  // Calculado al INICIO de cada turno enemigo por `decideEnemyAction` y
  // expuesto a la UI para que telegrafíe al jugador qué viene ("el lobo va
  // a atacarte por 3-5 daño"). NULL fuera del turno enemigo o cuando el
  // intent ya se ejecutó (motor lo limpia tras ejecutar). NULL al crear
  // el EnemyState; el motor lo rellena.
  intent: EnemyIntent | null;
}

// Re-export de los tipos de IA para que los consumidores del motor (UI,
// orquestador) no dependan directamente de `rules/ai.ts`. Misma política que
// con StatusEffect/StatusKind: combat.ts es la fachada del motor.
export type { AIProfile, EnemyIntent } from './ai';

// -----------------------------------------------------------------------------
// Estados (biblia §4.8: iconos sobre sprite)
// -----------------------------------------------------------------------------
//
// Los tipos canónicos viven en rules/statuses.ts (sub-paso 4a.1). Aquí se
// re-exportan para mantener compatibilidad con los importadores actuales
// (combat-flow.ts, death.ts) sin duplicar la fuente de verdad. Cualquier
// helper de stacking/tick se importa desde rules/statuses.ts. La importación
// `import type { StatusEffect } from './statuses'` está arriba, junto al
// resto de imports, porque la usa la firma de EnemyState en este mismo archivo.
export type { StatusKind, StatusEffect } from './statuses';

// -----------------------------------------------------------------------------
// Modificadores externos al threshold (decisión 4a.3)
// -----------------------------------------------------------------------------
//
// El threshold base (computeHitThreshold = ceil(DEF/3), decisión #46) es
// SAGRADO: no se modifica. Los efectos que endurecen al defensor se aplican
// como una capa externa que SUMA al threshold final justo antes de pasar el
// AttackInput a resolveAttack. Esta separación es la única forma de tocar
// "qué tan difícil es impactar" sin romper #75 (motor intocable).
//
// dodging: +1 al threshold del defensor mientras el efecto esté activo.
//   - El bono es CONSTANTE (+1), no toma la magnitud del efecto. Razón:
//     simulamos que un dado de pool típico tiene P(éxito)=0.5; +1 al threshold
//     bajo un pool de 4-6 dados reduce P(impacto) en ~25-30%, suficiente para
//     que dodge sea una opción "gasto turno para reducir daño esperado", no
//     "casi inmunidad". El +2 que el orquestador usaba en H3 (D-3a-2) era
//     equivalente a esquiva total y se descarta al bajar al motor.
//   - El llamador suma este bono en el sitio donde construye el AttackInput
//     final (el último mile antes del dado). Eso garantiza que cualquier
//     modificador futuro (cobertura, ceguera) se apile en el mismo sitio.
const DODGING_THRESHOLD_BONUS = 1;

// Probabilidad de éxito de la acción `flee` (sub-paso 4c, decisión C1).
// 50% fijo. Si falla, el PJ pierde el turno y los enemigos atacan
// normalmente. Si éxito, el combate cierra con status='fled' (sin loot,
// sin epitafio — D1). Constante exportada para que el orquestador y los
// tests puedan referenciarla sin redescubrir el número, y para que un
// futuro perk del tipo "+10% flee" tenga un punto de extensión claro
// (capa externa, igual que con dodge: la base 0.5 no se modifica aquí).
export const FLEE_SUCCESS_PROBABILITY = 0.5;

// Devuelve el bono total al threshold por statuses defensivos del portador.
// Hoy solo dodging contribuye. Genérico para que un futuro `covered` o
// `blinded` se sume aquí sin tocar las llamadas. Acepta cualquier StatusBearer
// (Character o EnemyState): preserva la simetría PJ ↔ enemigo.
export function defensiveThresholdBonus(defender: StatusBearer): number {
  let bonus = 0;
  if (hasStatus(defender, 'dodging')) bonus += DODGING_THRESHOLD_BONUS;
  return bonus;
}

// -----------------------------------------------------------------------------
// Resolución de ataque (biblia §4.3, decisión #36)
// -----------------------------------------------------------------------------

// Mapea DEF a umbral de éxitos. Decisión #46:
//   threshold = ceil(DEF / 3)
// Esta es la fórmula que la simulación del dado v0.2 ya usaba implícitamente
// para validar el dado cerrado en decisión #36. Se promueve a decisión propia
// para que la fórmula sea explícita y no implícita en el script de simulación.
//
// Umbrales resultantes (validados en simulaciones/dado-combate-v0.2.md):
//   DEF  4 → threshold 2 (P(impacto) ≈ 50% con ATR+HAB ~3)
//   DEF  8 → threshold 3 (P(impacto) ≈ 91% con ATR+HAB ~7)
//   DEF 12 → threshold 4 (P(impacto) ≈ 74% con ATR+HAB ~9)
export function computeHitThreshold(defense: number): number {
  return Math.max(1, Math.ceil(defense / 3));
}

export interface AttackInput {
  // Dados que tira el atacante. Para PJ: ATR + HAB del arma. Para enemigo:
  // enemy.attack_pool. combat.ts no decide eso: el llamador construye el pool.
  attacker_pool: number;
  // Umbral derivado de la DEF del defensor.
  defender_threshold: number;
  // Daño base del arma del atacante.
  weapon_damage: number;
}

export interface AttackResult {
  pool_result: CombatPoolResult;
  hit: boolean;
  critical: boolean;
  // Margen = éxitos - umbral. ≥0 si impacta.
  margin: number;
  // Daño final aplicado. 0 si no impacta.
  damage: number;
}

// Resolución pura del ataque. No conoce de Character ni Enemy: trabaja con el
// pool ya construido. Eso permite simular masivamente en el Modo Privado.
export function resolveAttack(
  rng: Rng,
  input: AttackInput,
): AttackResult {
  const pool_result = rollCombatPool(rng, input.attacker_pool);
  const margin = pool_result.successes - input.defender_threshold;
  const hit = margin >= 0;
  const critical = hit && pool_result.sixes >= 2;
  let damage = 0;
  if (hit) {
    damage = input.weapon_damage + margin;
    if (critical) damage *= 2;
  }
  return { pool_result, hit, critical, margin, damage };
}

// -----------------------------------------------------------------------------
// Construcción del pool desde un Character
// -----------------------------------------------------------------------------

// Construye el AttackInput leyendo del arma equipada en main_hand. Si no hay
// arma (puños), usa el fallback documentado: FUE + 0 hab, daño 1.
//
// `catalog` es el lookup de Item por id. El llamador (state/) lo provee. Si
// no se pasa, asume puños (útil para tests rápidos).
export function buildAttackInputFromCharacter(
  character: Character,
  defender_defense: number,
  catalog: Readonly<Record<ItemId, Item>> = {},
): AttackInput {
  let attacker_pool: number;
  let weapon_damage: number;

  const weapon = Object.keys(catalog).length > 0 ? equippedWeapon(character.inventory, catalog) : null;
  if (weapon !== null && weapon.stats.weapon_damage !== undefined) {
    const attr: AttributeId = weapon.stats.weapon_attribute ?? 'fue';
    const skillId = weapon.stats.weapon_skill;
    const skillValue = skillId ? (character.skills[skillId]?.value ?? 0) : 0;
    attacker_pool = character.attributes[attr] + skillValue;
    weapon_damage = weapon.stats.weapon_damage;
  } else {
    // Puños — fallback explícito.
    attacker_pool = character.attributes.fue;
    weapon_damage = 1;
  }

  // Sub-paso 4b: bono permanente al pool de perks como perk_golpe_brutal
  // (degradado en 4b.3 a +1 dado, sin trigger). Capa externa al motor: el
  // pool se construye aquí, en el último mile antes de pasar al AttackInput.
  attacker_pool += perkAttackPoolBonus(character);

  return {
    attacker_pool,
    defender_threshold: computeHitThreshold(defender_defense),
    weapon_damage,
  };
}

// DEF efectiva del personaje considerando armadura equipada. Es el contraparte
// del threshold para enemigos: el enemy.attack_pool tira contra ceil(DEF/3).
//
// Sub-paso 4b: suma `perkDefBonus(character)` como capa externa. computeDefense
// (rules/character.ts) sigue siendo función pura sobre AttributeBlock + armor:
// no se entera de los perks. La suma vive aquí, en la API de combate, igual que
// la suma de armadura.
export function computeCharacterDefense(
  character: Character,
  catalog: Readonly<Record<ItemId, Item>> = {},
): number {
  const armor = Object.keys(catalog).length > 0 ? totalDefenseBonus(character.inventory, catalog) : 0;
  return computeDefense(character.attributes, armor) + perkDefBonus(character);
}

export function buildAttackInputFromEnemy(
  enemy: Enemy,
  defender_defense: number,
): AttackInput {
  return {
    attacker_pool: enemy.attack_pool,
    defender_threshold: computeHitThreshold(defender_defense),
    weapon_damage: enemy.weapon_damage,
  };
}

// -----------------------------------------------------------------------------
// Aplicación de daño
// -----------------------------------------------------------------------------

// Devuelve nuevo Character con HP reducido. Si llega a 0, alive = false; el
// epitafio lo escribe rules/death.ts con la causa concreta. Acotado a [0, max].
export function applyDamageToCharacter(character: Character, damage: number): Character {
  if (!Number.isFinite(damage) || damage < 0) {
    throw new RangeError(`applyDamageToCharacter: damage debe ser ≥ 0 finito, recibido ${damage}`);
  }
  const newCurrent = Math.max(0, character.hp.current - damage);
  return {
    ...character,
    hp: { ...character.hp, current: newCurrent },
    alive: newCurrent > 0,
  };
}

export function applyDamageToEnemy(state: EnemyState, damage: number): EnemyState {
  if (!Number.isFinite(damage) || damage < 0) {
    throw new RangeError(`applyDamageToEnemy: damage debe ser ≥ 0 finito, recibido ${damage}`);
  }
  const newHp = Math.max(0, state.hp - damage);
  return { ...state, hp: newHp, alive: newHp > 0 };
}

// -----------------------------------------------------------------------------
// Iniciativa (decisión #41 — simulaciones/iniciativa-v0.1.md)
// -----------------------------------------------------------------------------

// PJ: iniciativa = DES + 1d20 (+ bonos de perks como perk_pies_ligeros y
// perk_sello_del_humo, sub-paso 4b). Capa externa: la fórmula DES+d20 sigue
// pura. El bono se suma al final, antes de devolver, igual que armadura
// suma a DEF tras computeDefense.
export function rollInitiativeForCharacter(character: Character, rng: Rng): number {
  return character.attributes.des + rollD20(rng) + perkInitiativeBonus(character);
}

// Enemigo: iniciativa = initiative_base + 1d20.
export function rollInitiativeForEnemy(enemy: Enemy, rng: Rng): number {
  return enemy.initiative_base + rollD20(rng);
}

// Desempate de iniciativas. Decisión #41:
//   1. Mayor DES bruto gana.
//   2. Si persiste (mismo DES), PJ antes que enemigo.
// Devuelve negativo si A va antes, positivo si B va antes, 0 nunca (todo
// empate se resuelve por la regla 2). En MVP hay un solo PJ, así que nunca
// hay PJ vs PJ; el contrato lo deja preparado.
export interface InitiativeContestant {
  is_character: boolean;
  // DES del PJ, o initiative_base del enemigo (proxy para desempate).
  des_or_base: number;
  rolled_initiative: number;
}

export function compareInitiative(
  a: InitiativeContestant,
  b: InitiativeContestant,
): number {
  if (a.rolled_initiative !== b.rolled_initiative) {
    return b.rolled_initiative - a.rolled_initiative;
  }
  if (a.des_or_base !== b.des_or_base) {
    return b.des_or_base - a.des_or_base;
  }
  if (a.is_character && !b.is_character) return -1;
  if (!a.is_character && b.is_character) return 1;
  return 0;
}

// -----------------------------------------------------------------------------
// Estado de combate (esqueleto)
// -----------------------------------------------------------------------------

export interface CombatantTurn {
  // 'character' o instance_id de un EnemyState.
  actor: 'character' | string;
  initiative: number;
}

export interface CombatState {
  character: Character;
  enemies: readonly EnemyState[];
  // Cola de turnos ordenada por initiative descendente.
  turn_order: readonly CombatantTurn[];
  // Índice del turno actual dentro de turn_order.
  current_turn_index: number;
  // Logro de finalización: 'ongoing', 'victory' (todos enemigos muertos),
  // 'defeat' (PJ muerto), 'fled' (huida exitosa, regla diferida).
  status: 'ongoing' | 'victory' | 'defeat' | 'fled';
}

export type CombatAction =
  | { kind: 'attack'; target_instance_id: string }
  | { kind: 'dodge' }
  | { kind: 'use_item'; slot_index: number }
  | { kind: 'use_skill'; skill_id: string; target_instance_id: string | null }
  | { kind: 'flee' };

// Inicia el combate: tira iniciativas, construye turn_order ordenado, pone
// el índice en 0. Si hay empates, los resuelve con compareInitiative.
export function startCombat(
  character: Character,
  enemies: readonly EnemyState[],
  enemyTemplates: Readonly<Record<EnemyId, Enemy>>,
  rng: Rng,
): CombatState {
  const pjRolled = rollInitiativeForCharacter(character, rng);
  const pjContestant: InitiativeContestant = {
    is_character: true,
    des_or_base: character.attributes.des,
    rolled_initiative: pjRolled,
  };
  const order: { actor: 'character' | string; initiative: number; contestant: InitiativeContestant }[] = [
    { actor: 'character', initiative: pjRolled, contestant: pjContestant },
  ];
  for (const enemy of enemies) {
    const tpl = enemyTemplates[enemy.enemy_id];
    if (tpl === undefined) {
      throw new Error(`startCombat: enemy template "${enemy.enemy_id}" no encontrado.`);
    }
    const rolled = rollInitiativeForEnemy(tpl, rng);
    order.push({
      actor: enemy.instance_id,
      initiative: rolled,
      contestant: {
        is_character: false,
        des_or_base: tpl.initiative_base,
        rolled_initiative: rolled,
      },
    });
  }
  order.sort((a, b) => compareInitiative(a.contestant, b.contestant));

  // Sub-paso 4c: pre-calcular el intent inicial de cada enemigo vivo. La
  // UI necesita un intent visible desde el arranque del combate (telegrafía
  // "el lobo va a atacarte por X daño" antes de cualquier acción). El
  // intent es DETERMINISTA y no consume RNG: pasarlo aquí no rompe el
  // determinismo de las iniciativas. Se vuelve a recalcular al inicio de
  // cada turno enemigo en applyEnemyTurn por si el estado cambió.
  const enemiesWithIntent = enemies.map((enemy) => {
    if (!enemy.alive) return enemy;
    const tpl = enemyTemplates[enemy.enemy_id]!;
    const intent = decideEnemyAction(enemy, tpl, character, tpl.ai_profile);
    return { ...enemy, intent };
  });

  return {
    character,
    enemies: enemiesWithIntent,
    turn_order: order.map(({ actor, initiative }) => ({ actor, initiative })),
    current_turn_index: 0,
    status: 'ongoing',
  };
}

function findEnemyByInstance(
  enemies: readonly EnemyState[],
  instance_id: string,
): { state: EnemyState; index: number } {
  const index = enemies.findIndex((e) => e.instance_id === instance_id);
  if (index === -1) {
    throw new Error(`Enemy instance "${instance_id}" no presente en el combate.`);
  }
  return { state: enemies[index]!, index };
}

function checkVictoryOrAdvance(state: CombatState): CombatState {
  if (!state.character.alive) return { ...state, status: 'defeat' };
  const allDead = state.enemies.every((e) => !e.alive);
  if (allDead) return { ...state, status: 'victory' };

  // Avanza al siguiente actor vivo del turn_order.
  let next = (state.current_turn_index + 1) % state.turn_order.length;
  // Cota dura por seguridad: si todos los del turn_order están muertos pero
  // checkVictoryOrAdvance no lo detectó, abortamos en lugar de bucle infinito.
  for (let safety = 0; safety < state.turn_order.length; safety++) {
    const turn = state.turn_order[next]!;
    if (turn.actor === 'character') {
      if (state.character.alive) return { ...state, current_turn_index: next };
    } else {
      const enemy = state.enemies.find((e) => e.instance_id === turn.actor);
      if (enemy !== undefined && enemy.alive) {
        return { ...state, current_turn_index: next };
      }
    }
    next = (next + 1) % state.turn_order.length;
  }
  // No quedan actores vivos: combate cerrado.
  return state.character.alive
    ? { ...state, status: 'victory' }
    : { ...state, status: 'defeat' };
}

// Aplica una acción del PJ y devuelve el nuevo CombatState. Si tras la acción
// todos los enemigos están muertos → status=victory. Si no, avanza turno al
// siguiente actor vivo.
//
// Integración del tick de statuses (sub-paso 4a.2, simétrica con applyEnemyTurn):
//   1. tickStatusesAtTurnStart sobre el PJ → daño de bleeding. Si muere → defeat.
//   2. Si tiene `stunned` activo, consume el turno: tickStatusesAtTurnEnd sobre el
//      PJ (decrementa stunned y resto), avanza turno. NO se procesa la acción.
//   3. Procesa la acción solicitada (attack, etc.).
//   4. tickStatusesAtTurnEnd sobre el PJ → daño de poisoned + decremento. Si muere → defeat.
//   5. checkVictoryOrAdvance avanza al siguiente actor vivo.
//
// Acciones implementadas en H3: 'attack'. El resto (dodge, use_item, use_skill,
// flee) se implementan según se cierren reglas. dodge sería sólo aplicar un
// status; use_item necesita inventory; use_skill necesita catálogo de habilidades;
// flee es regla diferida.
export function applyCharacterAction(
  state: CombatState,
  action: CombatAction,
  enemyTemplates: Readonly<Record<EnemyId, Enemy>>,
  rng: Rng,
  catalog: Readonly<Record<ItemId, Item>> = {},
): CombatState {
  if (state.status !== 'ongoing') {
    throw new Error(`applyCharacterAction: combate ya cerrado (status=${state.status}).`);
  }
  const currentTurn = state.turn_order[state.current_turn_index];
  if (currentTurn === undefined || currentTurn.actor !== 'character') {
    throw new Error(`applyCharacterAction: no es el turno del PJ.`);
  }

  // (1) Tick de inicio: bleeding sobre el PJ antes de actuar.
  const startTick = tickStatusesAtTurnStart(state.character);
  let character = startTick.bearer;
  if (startTick.damage > 0) {
    character = applyDamageToCharacter(character, startTick.damage);
  }
  if (!character.alive) {
    // Murió por DoT antes de actuar. NO se procesa la acción ni se avanza
    // turno. El epitafio lo escribe el caller (combat-flow / tests).
    return { ...state, character, status: 'defeat' };
  }

  // (2) ¿Stunned? Pierde el turno: tick de fin (que también decrementa stunned)
  // y avanza. NO procesa la acción solicitada.
  if (hasStatus(character, 'stunned')) {
    const endTick = tickStatusesAtTurnEnd(character);
    let stunnedChar = endTick.bearer;
    if (endTick.damage > 0) {
      stunnedChar = applyDamageToCharacter(stunnedChar, endTick.damage);
    }
    if (!stunnedChar.alive) {
      return { ...state, character: stunnedChar, status: 'defeat' };
    }
    return checkVictoryOrAdvance({ ...state, character: stunnedChar });
  }

  // Validamos las acciones NO implementadas ANTES de procesarlas. attack y
  // dodge son acciones de primera clase del motor en 4a.3. flee entra en 4c
  // como acción de primera clase con tirada 50% (decisión C1, briefing 4c).
  // use_item necesita inventory y use_skill necesita catálogo de habilidades:
  // siguen lanzando hasta que se cierren sus reglas en hitos posteriores.
  if (action.kind === 'use_item' || action.kind === 'use_skill') {
    throw new Error(`applyCharacterAction: acción "${action.kind}" no implementada en H3.`);
  }

  // (3a) Rama flee (sub-paso 4c, decisión C1):
  //   - Tirada con la misma rng inyectada (no Math.random).
  //   - Si rng() < FLEE_SUCCESS_PROBABILITY → éxito: cierra combate con
  //     status 'fled'. NO se aplica tick start/end (el PJ huye, no se queda
  //     a sangrar). NO se procesa loot (D1 cerrada en briefing).
  //   - Si fallo → consume el turno: NO daño, NO ataque, NO tick end. El
  //     orquestador avanza al siguiente actor (enemigos atacarán normalmente).
  //
  // Auditoría timing del tick: en éxito SE OMITE tick end intencionadamente
  // — la regla narrativa es "huyes inmediatamente, sin esperar a que la
  // sangre fluya un turno más". En fallo TAMPOCO se aplica tick end: el PJ
  // intentó algo, fracasó, y el turno termina sin más. La asimetría con
  // attack/dodge (que SÍ aplican tick end) es deliberada: flee es una
  // tirada-acción binaria, no una acción que requiera procesamiento extra
  // del estado del PJ.
  if (action.kind === 'flee') {
    const success = rng() < FLEE_SUCCESS_PROBABILITY;
    if (success) {
      // Éxito: cierra combate. character ya tiene el tick start aplicado
      // (bleeding consumido). El estado final es {...state, character, status:'fled'}.
      return { ...state, character, status: 'fled' };
    }
    // Fallo: consume turno. character ya tiene el tick start aplicado.
    // checkVictoryOrAdvance avanzará al siguiente actor vivo (que en H3
    // típicamente es el enemigo).
    return checkVictoryOrAdvance({ ...state, character });
  }

  // (3) Procesa la acción según el kind. Cada rama prepara las mutaciones
  // de enemies (si toca) y deja `character` en el estado pre-tickEnd. El tick
  // de fin de turno se hace UNA sola vez al final, fuera del switch, para
  // garantizar que dodging recién aplicado se decremente exactamente una vez.
  let nextEnemies: readonly EnemyState[] = state.enemies;

  if (action.kind === 'attack') {
    const target = findEnemyByInstance(state.enemies, action.target_instance_id);
    const targetTemplate = enemyTemplates[target.state.enemy_id];
    if (targetTemplate === undefined) {
      throw new Error(`Template "${target.state.enemy_id}" no encontrado.`);
    }
    if (!target.state.alive) {
      throw new Error(`applyCharacterAction: el enemigo "${action.target_instance_id}" ya está muerto.`);
    }

    const baseInput = buildAttackInputFromCharacter(character, 0, catalog);
    // Modificador externo: +1 si el defensor (enemigo) tiene dodging.
    // Simetría PJ ↔ enemigo: aunque la IA de H3 no aplica dodging a sí misma,
    // el motor lo soporta para que IA vs IA del Modo Privado funcione sin
    // bifurcar la regla.
    const defenderBonus = defensiveThresholdBonus(target.state);
    const attackInput: AttackInput = {
      attacker_pool: baseInput.attacker_pool,
      defender_threshold: targetTemplate.defense_threshold + defenderBonus,
      weapon_damage: baseInput.weapon_damage,
    };
    const result = resolveAttack(rng, attackInput);
    // Sub-paso 4b: bono de daño post-impacto (perk_filo_paciente,
    // perk_ojo_clinico). Se suma SÓLO si hit, ANTES de aplicar el daño al
    // enemigo. resolveAttack y AttackResult NO se modifican (#75 sagrado): la
    // decoración vive en el caller, igual que defensiveThresholdBonus se aplica
    // antes de construir attackInput. El daño base por defecto es 0 si no hit.
    const finalDamage = result.hit ? result.damage + perkDamageBonus(character) : result.damage;
    const newEnemyState = applyDamageToEnemy(target.state, finalDamage);
    const arr = state.enemies.slice();
    arr[target.index] = newEnemyState;
    nextEnemies = arr;
  } else {
    // action.kind === 'dodge'.
    //
    // Aplica el status `dodging` al PJ. NO daña, NO consume objetivo, sólo
    // posiciona el buff y deja que el flujo normal cierre el turno (tickEnd
    // + checkVictoryOrAdvance).
    //
    // Auditoría timing dodging (decisión 4a.3, confirmada por director):
    //   Turno PJ N (dodge): tickEnd decrementa remaining 2 → 1. Sigue activo.
    //   Turno enemigo N+1: tickStart enemigo NO toca al PJ. Ataque enemigo ve
    //     `dodging` activo en state.character.statuses → +1 threshold (vía
    //     defensiveThresholdBonus). tickEnd enemigo NO toca al PJ.
    //   Turno PJ N+2: tickStart PJ NO altera dodging. tickEnd PJ decrementa
    //     remaining 1 → 0 → expira. Cobertura exacta: el ATAQUE enemigo
    //     siguiente, ni más ni menos.
    // Por eso remaining = STATUS_DEFAULT_DURATION.dodging (=1) + 1 = 2:
    // el "+1" compensa el tickEnd del propio turno donde se aplica.
    //
    // STATUS_DEFAULT_DURATION.dodging es la duración SEMÁNTICA (1 ataque
    // cubierto), no el remaining real. El motor traduce semántica → remaining
    // sumando 1.
    const dodgeEffect: StatusEffect = {
      kind: 'dodging',
      remaining: STATUS_DEFAULT_DURATION.dodging + 1,
      magnitude: STATUS_DEFAULT_MAGNITUDE.dodging,
    };
    character = applyStatus(character, dodgeEffect);
  }

  // (4) Tick de fin: poisoned + decremento sobre el PJ. UNA sola vez, común
  // a todas las acciones.
  const endTick = tickStatusesAtTurnEnd(character);
  character = endTick.bearer;
  if (endTick.damage > 0) {
    character = applyDamageToCharacter(character, endTick.damage);
  }
  if (!character.alive) {
    return { ...state, character, enemies: nextEnemies, status: 'defeat' };
  }

  return checkVictoryOrAdvance({ ...state, character, enemies: nextEnemies });
}

// Resuelve el turno del enemigo cuyo turno está en current_turn_index.
//
// IA táctica (sub-paso 4c): la decisión QUÉ hace el enemigo vive en
// `rules/ai.ts` (`decideEnemyAction`). Aquí EJECUTAMOS el intent:
//   - 'attack'              → ataca al PJ con resolveAttack.
//   - 'apply_status_self'   → aplica el status al propio enemigo, NO ataca.
//   - 'apply_status_target' → aplica el status al PJ, NO ataca.
//
// El intent se calcula al inicio del turno (justo después del tick start),
// porque el tick puede matar al enemigo por DoT antes de que decida nada.
// Tras ejecutarlo se LIMPIA (intent=null) para no confundir a la UI: el
// próximo turno enemigo recalculará uno nuevo.
//
// Integración del tick de statuses (sub-paso 4a.2):
//   1. tickStatusesAtTurnStart sobre el enemigo → daño de bleeding. Si
//      muere → checkVictoryOrAdvance.
//   2. Si tiene `stunned`, consume el turno: tickStatusesAtTurnEnd, avanza.
//   3. Calcular intent vía decideEnemyAction(...) y asignarlo al enemy.
//   4. Ejecutar el intent (attack | apply_status_self | apply_status_target).
//   5. tickStatusesAtTurnEnd sobre el enemigo → poisoned + decremento.
//   6. Limpiar intent (null) y checkVictoryOrAdvance.
export function applyEnemyTurn(
  state: CombatState,
  enemyTemplates: Readonly<Record<EnemyId, Enemy>>,
  rng: Rng,
  catalog: Readonly<Record<ItemId, Item>> = {},
): CombatState {
  if (state.status !== 'ongoing') {
    throw new Error(`applyEnemyTurn: combate ya cerrado (status=${state.status}).`);
  }
  const currentTurn = state.turn_order[state.current_turn_index];
  if (currentTurn === undefined || currentTurn.actor === 'character') {
    throw new Error(`applyEnemyTurn: no es turno de un enemigo (actor=${currentTurn?.actor}).`);
  }

  const found = findEnemyByInstance(state.enemies, currentTurn.actor);
  if (!found.state.alive) {
    // Enemigo muerto al llegar su turno: avanzamos sin hacer nada.
    return checkVictoryOrAdvance(state);
  }
  const template = enemyTemplates[found.state.enemy_id];
  if (template === undefined) {
    throw new Error(`Template "${found.state.enemy_id}" no encontrado.`);
  }

  // Helper local para reescribir un EnemyState concreto en la lista de
  // enemigos preservando el resto. Evita repetir el slice/index.
  const replaceEnemy = (enemies: readonly EnemyState[], next: EnemyState): readonly EnemyState[] => {
    const arr = enemies.slice();
    const idx = arr.findIndex((e) => e.instance_id === next.instance_id);
    if (idx === -1) return arr;
    arr[idx] = next;
    return arr;
  };

  // (1) Tick de inicio: bleeding sobre el enemigo antes de actuar.
  const startTick = tickStatusesAtTurnStart(found.state);
  let enemyState = startTick.bearer;
  if (startTick.damage > 0) {
    enemyState = applyDamageToEnemy(enemyState, startTick.damage);
  }
  if (!enemyState.alive) {
    // Muerto por DoT: NO actúa. Avanza turno y comprueba victoria.
    return checkVictoryOrAdvance({ ...state, enemies: replaceEnemy(state.enemies, enemyState) });
  }

  // (2) ¿Stunned? Pierde el turno: tick fin de turno y avanza sin actuar.
  if (hasStatus(enemyState, 'stunned')) {
    const endTick = tickStatusesAtTurnEnd(enemyState);
    let stunnedEnemy = endTick.bearer;
    if (endTick.damage > 0) {
      stunnedEnemy = applyDamageToEnemy(stunnedEnemy, endTick.damage);
    }
    // Limpiamos el intent: el enemigo no actúa este turno, así que el
    // intent que tuviera asignado ya no aplica. Un turno futuro lo recalcula.
    return checkVictoryOrAdvance({
      ...state,
      enemies: replaceEnemy(state.enemies, { ...stunnedEnemy, intent: null }),
    });
  }

  // (3) Calcular intent vía la IA. DETERMINISTA, no consume RNG.
  const intent = decideEnemyAction(enemyState, template, state.character, template.ai_profile);
  enemyState = { ...enemyState, intent };

  // (4) Ejecutar el intent.
  let nextCharacter = state.character;

  if (intent.kind === 'attack') {
    const characterDef = computeCharacterDefense(state.character, catalog);
    const baseEnemyInput = buildAttackInputFromEnemy(template, characterDef);
    // Modificador externo: +1 si el defensor (PJ) tiene dodging. Mismo
    // helper que la rama PJ→enemigo: una sola fuente de verdad para el bono.
    const characterBonus = defensiveThresholdBonus(state.character);
    const attackInput: AttackInput = {
      attacker_pool: baseEnemyInput.attacker_pool,
      defender_threshold: baseEnemyInput.defender_threshold + characterBonus,
      weapon_damage: baseEnemyInput.weapon_damage,
    };
    const result = resolveAttack(rng, attackInput);
    nextCharacter = applyDamageToCharacter(state.character, result.damage);
  } else if (intent.kind === 'apply_status_self') {
    // Aplicar status al propio enemigo. Magnitud y duración cogidas del
    // catálogo de defaults: misma fuente de verdad que dodge del PJ
    // (4a.3). El "+1" sobre la duración compensa el tickEnd del propio
    // turno donde se aplica.
    const effect: StatusEffect = {
      kind: intent.status,
      remaining: STATUS_DEFAULT_DURATION[intent.status] + 1,
      magnitude: STATUS_DEFAULT_MAGNITUDE[intent.status],
    };
    enemyState = applyStatus(enemyState, effect);
  } else {
    // intent.kind === 'apply_status_target'. Aplica status al PJ. NO ataca.
    // Mismas magnitudes/duraciones por defecto que apply_status_self.
    // Auditoría: F1 explícita — el perfil toxico aplica `poisoned` como
    // ACCIÓN SEPARADA. NO hay daño este turno.
    const effect: StatusEffect = {
      kind: intent.status,
      remaining: STATUS_DEFAULT_DURATION[intent.status] + 1,
      magnitude: STATUS_DEFAULT_MAGNITUDE[intent.status],
    };
    nextCharacter = applyStatus(state.character, effect);
  }

  // (5) Tick de fin: poisoned + decremento sobre el enemigo.
  const endTick = tickStatusesAtTurnEnd(enemyState);
  enemyState = endTick.bearer;
  if (endTick.damage > 0) {
    enemyState = applyDamageToEnemy(enemyState, endTick.damage);
  }

  // (6) Limpiar intent (ya ejecutado). El próximo turno del mismo enemigo
  // recalculará uno nuevo en el paso (3) anterior.
  enemyState = { ...enemyState, intent: null };

  // El PJ puede haber muerto por el ataque del enemigo (no por DoT). Eso lo
  // detecta checkVictoryOrAdvance vía character.alive=false → status='defeat'.
  return checkVictoryOrAdvance({
    ...state,
    character: nextCharacter,
    enemies: replaceEnemy(state.enemies, enemyState),
  });
}
