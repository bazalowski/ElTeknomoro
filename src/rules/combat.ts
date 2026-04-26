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
}

// -----------------------------------------------------------------------------
// Estados (biblia §4.8: iconos sobre sprite)
// -----------------------------------------------------------------------------

// PROVISIONAL H3: catálogo mínimo. Cada estado se modelará en su hito propio
// (sangrado/veneno como DoT en H3, aturdido como skip-turn en H3, etc.).
export type StatusKind = 'bleeding' | 'poisoned' | 'stunned' | 'dodging';

export interface StatusEffect {
  kind: StatusKind;
  // Turnos que le quedan. 0 = se evapora al final del turno actual.
  remaining: number;
  // Magnitud (daño por turno para DoT, bono de DEF para dodging, etc.).
  magnitude: number;
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

  return {
    attacker_pool,
    defender_threshold: computeHitThreshold(defender_defense),
    weapon_damage,
  };
}

// DEF efectiva del personaje considerando armadura equipada. Es el contraparte
// del threshold para enemigos: el enemy.attack_pool tira contra ceil(DEF/3).
export function computeCharacterDefense(
  character: Character,
  catalog: Readonly<Record<ItemId, Item>> = {},
): number {
  const armor = Object.keys(catalog).length > 0 ? totalDefenseBonus(character.inventory, catalog) : 0;
  return computeDefense(character.attributes, armor);
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

// PJ: iniciativa = DES + 1d20.
export function rollInitiativeForCharacter(character: Character, rng: Rng): number {
  return character.attributes.des + rollD20(rng);
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
  return {
    character,
    enemies,
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

  if (action.kind !== 'attack') {
    throw new Error(`applyCharacterAction: acción "${action.kind}" no implementada en H3.`);
  }

  const target = findEnemyByInstance(state.enemies, action.target_instance_id);
  const targetTemplate = enemyTemplates[target.state.enemy_id];
  if (targetTemplate === undefined) {
    throw new Error(`Template "${target.state.enemy_id}" no encontrado.`);
  }
  if (!target.state.alive) {
    throw new Error(`applyCharacterAction: el enemigo "${action.target_instance_id}" ya está muerto.`);
  }

  // Defensa del enemigo: derivada de defense_threshold ya resuelto en plantilla.
  // El umbral lo recalcula computeHitThreshold a partir de una "DEF efectiva"
  // proxy = defense_threshold * 3 para que la fórmula sea coherente.
  // Más limpio: pasar threshold directo. resolveAttack ya recibe threshold.
  const attackInput: AttackInput = {
    attacker_pool: buildAttackInputFromCharacter(state.character, 0, catalog).attacker_pool,
    defender_threshold: targetTemplate.defense_threshold,
    weapon_damage: buildAttackInputFromCharacter(state.character, 0, catalog).weapon_damage,
  };
  const result = resolveAttack(rng, attackInput);
  const newEnemyState = applyDamageToEnemy(target.state, result.damage);
  const newEnemies = state.enemies.slice();
  newEnemies[target.index] = newEnemyState;

  const advanced = checkVictoryOrAdvance({ ...state, enemies: newEnemies });
  return advanced;
}

// Resuelve el turno del enemigo cuyo turno está en current_turn_index.
// IA básica de H3: ataca al PJ siempre. La IA táctica (target preference,
// huida, uso de habilidad) entra en H7.
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

  const characterDef = computeCharacterDefense(state.character, catalog);
  const attackInput = buildAttackInputFromEnemy(template, characterDef);
  const result = resolveAttack(rng, attackInput);
  const newCharacter = applyDamageToCharacter(state.character, result.damage);

  return checkVictoryOrAdvance({ ...state, character: newCharacter });
}
