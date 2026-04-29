// Orquestador del flow de combate H3. Vive en state/, no es módulo sagrado:
// envuelve `rules/combat.ts` (sagrado) y mantiene el estado vivo del combate
// turno a turno, encadena turnos enemigos automáticamente entre acciones del
// PJ, mantiene un log de eventos para que la vista lo renderice (con animación
// dado a dado o todo de golpe), y resuelve loot al cerrar el combate.
//
// Coherente con el patrón de `state/h2-flow.ts`: función con closure que
// devuelve un objeto-handle de métodos. La persistencia (saveCharacterUpdate)
// la dispara el caller en `onEnd`, igual que `confirmAndPersist` en H2; el
// orquestador queda puro respecto a Supabase.
//
// Decisiones internas (sub-paso 3a, cerradas en este archivo):
//   - D-3a-1: heal de poción de curación menor = +6 HP. Cabido en briefing.
//     Razón: HP_max típico de PJ (CON 2 → 22). 6 HP es ~27% del pool, suficiente
//     para revertir 2-3 turnos de daño de lobo (weapon_damage 2, margen ~1)
//     sin trivializar el combate. H5 reescribe esto cuando consumibles tengan
//     `consumable_effect` declarativo.
//   - D-3a-2: dodging magnitude = +2 al threshold del atacante, remaining = 1
//     turno. Razón: el lobo pide threshold 3 base (defense_threshold). Subirlo
//     a 5 con un pool de 3 dados baja la P(impacto) de ~50% a ~5%. Eso
//     convierte dodge en una opción de "gastar mi turno para casi seguro
//     no recibir daño" — equivalente a la "esquiva total" de Pathfinder
//     reaccionario, no a un bono pequeño. Si en mesa resulta dominante se
//     baja a +1; pero +2 es el punto de partida que tiene sentido jugar.
//   - D-3a-3: el orquestador NO llama a `applyCharacterAction` ni
//     `applyEnemyTurn` de combat.ts. Replica esa orquestación llamando a las
//     primitivas (resolveAttack, applyDamage*, buildAttackInput*) porque
//     necesita: (a) loguear cada tirada con sus dados crudos, (b) aplicar el
//     bono de dodging al threshold del atacante enemigo (combat.ts no lo
//     contempla en H3). El motor sagrado queda intacto; la "regla" del
//     dodging es un agregado de orquestación, no una regla nueva.
//   - D-3a-4: `consumeLogTail()` devuelve las entradas pendientes y avanza un
//     cursor. La vista anima paso a paso o las pinta de golpe; no necesita
//     conocer cuántas hay desde la última lectura. Alternativa de "pasar log
//     completo cada vez" descartada: la vista tendría que diff'ear, doble
//     trabajo.
//   - D-3a-5: `onEnd` se invoca con un `CombatResult` que incluye el Character
//     final (vivo o con epitafio escrito) y el resumen del loot. El caller
//     decide si hace `saveCharacterUpdate` o navega a una pantalla de muerte;
//     el orquestador no asume.
//   - D-3a-6: el resultado del `resolveLoot` se aplica al Character ANTES de
//     emitir `onEnd`. El Character que recibe el caller es el final, listo
//     para persistir tal cual. Si no cabe en inventario alguna pila, ese
//     drop se descarta silenciosamente en el log (entrada `loot_dropped` con
//     `lost: true`). H5 cerrará la regla de overflow.

import type { Character } from '../rules/character';
import type { Item, ItemId, ItemStack } from '../rules/inventory';
import type {
  AttackResult,
  CombatAction,
  CombatState,
  Enemy,
  EnemyId,
  EnemyState,
  StatusEffect,
} from '../rules/combat';
import type { Rng } from '../rules/dice';
import type { LootDrop, LootTable } from '../data/enemies';
import type { EndOfRunCause } from '../rules/death';

import {
  applyDamageToCharacter,
  applyDamageToEnemy,
  buildAttackInputFromCharacter,
  buildAttackInputFromEnemy,
  computeCharacterDefense,
  computeHitThreshold,
  resolveAttack,
  startCombat,
} from '../rules/combat';
import { addItem, removeFromSlot } from '../rules/inventory';
import { addGold } from '../rules/character';
import { deathByEnemy, killCharacter } from '../rules/death';
import { getLootTableForEnemy } from '../data/enemies';

// -----------------------------------------------------------------------------
// Constantes de orquestación (D-3a-1, D-3a-2)
// -----------------------------------------------------------------------------

const HEAL_AMOUNT_MINOR_POTION = 6;
const DODGE_THRESHOLD_BONUS = 2;
const DODGE_DURATION_TURNS = 1;
const HEAL_POTION_ITEM_ID: ItemId = 'pocion_curacion_menor';

// -----------------------------------------------------------------------------
// Tipos de log (discriminated union)
// -----------------------------------------------------------------------------

// Cada entrada del log es un evento atómico. La vista los consume en orden y
// decide si los anima uno a uno (combate animado) o los aplica todos de golpe
// (modo "skip" o pintado inicial). Los enums del kind no se reutilizan; cada
// kind es un evento distinto del flow.
export type CombatLogEntry =
  | {
      kind: 'combat_start';
      character_name: string;
      enemy_summaries: readonly { instance_id: string; name: string; hp_max: number }[];
      turn_order: readonly { actor: string; initiative: number }[];
    }
  | {
      kind: 'turn_start';
      actor: string; // 'character' | instance_id
      actor_kind: 'character' | 'enemy';
    }
  | {
      kind: 'attack_resolved';
      attacker: string; // 'character' | instance_id
      attacker_kind: 'character' | 'enemy';
      target: string; // 'character' | instance_id
      target_kind: 'character' | 'enemy';
      pool: number;
      threshold: number;
      rolls: readonly number[];
      successes: number;
      sixes: number;
      hit: boolean;
      critical: boolean;
      margin: number;
      damage: number;
      target_hp_after: number;
      target_alive_after: boolean;
    }
  | {
      kind: 'dodge_applied';
      magnitude: number;
      duration: number;
    }
  | {
      kind: 'item_used';
      item_id: ItemId;
      slot_index: number;
      heal_amount: number;
      character_hp_after: number;
    }
  | {
      kind: 'status_expired';
      actor: string;
      status_kind: StatusEffect['kind'];
    }
  | {
      kind: 'loot_resolved';
      gold: number;
      items: readonly { item_id: ItemId; quantity: number }[];
    }
  | {
      kind: 'loot_dropped';
      item_id: ItemId;
      quantity: number;
      reason: 'inventory_full';
    }
  | {
      kind: 'combat_end';
      status: 'victory' | 'defeat';
    };

// -----------------------------------------------------------------------------
// Resultado del combate
// -----------------------------------------------------------------------------

export interface CombatLootSummary {
  gold: number;
  items: readonly { item_id: ItemId; quantity: number }[];
  // Drops que cayeron pero no entraron en inventario (slots llenos). H5 cerrará
  // la regla de overflow; aquí queda registrado para la vista.
  dropped: readonly { item_id: ItemId; quantity: number }[];
}

export interface CombatResult {
  status: 'victory' | 'defeat';
  // Character final, ya con loot aplicado (si victoria) o con epitafio escrito
  // (si derrota). El caller lo persiste tal cual.
  character: Character;
  // Loot resuelto. En derrota viene { gold: 0, items: [], dropped: [] }.
  loot: CombatLootSummary;
}

// -----------------------------------------------------------------------------
// Argumentos y handle del flow
// -----------------------------------------------------------------------------

export interface CombatFlowOptions {
  character: Character;
  // Plantillas de enemigos a las que apuntan los EnemyState. El orquestador
  // las consume para resolver iniciativa, threshold, daño base y nombre.
  enemies: readonly EnemyState[];
  enemyTemplates: Readonly<Record<EnemyId, Enemy>>;
  // Catálogo de items. El orquestador lo usa para construir attackInput,
  // resolver loot y aplicar consumibles.
  itemCatalog: Readonly<Record<ItemId, Item>>;
  rng: Rng;
  // ISO 8601 al cerrar el combate (epitafio). El caller lo provee para
  // mantener determinismo en tests (no se usa Date.now() aquí dentro).
  nowIso: () => string;
  onEnd: (result: CombatResult) => void;
  // Notificación de cada entrada empujada al log. Opcional: la vista puede
  // preferir tirar de `consumeLogTail()` en su rAF en lugar de suscribirse.
  onLogEntry?: (entry: CombatLogEntry) => void;
}

// API expuesta a la vista. Inmutable desde fuera: la vista no puede mutar
// state ni log directamente.
export interface CombatFlowHandle {
  // Snapshot del estado del combate. NO se muta; cada llamada devuelve la
  // referencia actual. Tras `combat_end` el status pasa a 'victory'|'defeat'.
  getState(): Readonly<CombatState>;
  // Log completo desde el inicio. La vista típicamente usa
  // `consumeLogTail()`; este getter es para snapshots de debug o re-render
  // tras montaje (volver a una pantalla con combate ya en curso).
  getLog(): readonly CombatLogEntry[];
  // Devuelve las entradas nuevas desde la última llamada y avanza el cursor.
  // Pensado para que la vista tras cada `submitAction` pinte/anime sólo lo
  // recién ocurrido. Si la vista no llama nunca, el cursor no avanza.
  consumeLogTail(): readonly CombatLogEntry[];
  // Aplica una acción del PJ y resuelve automáticamente todos los turnos
  // enemigos hasta volver al turno del PJ o cerrar el combate. Devuelve el
  // tail de log generado por esta llamada (atajo para no llamar a
  // consumeLogTail después). Lanza si combate ya cerrado o si la acción es
  // inválida.
  submitAction(action: CombatAction): readonly CombatLogEntry[];
  // ¿Es turno del PJ? Útil para que la vista deshabilite/habilite el panel
  // de acciones. False también tras combat_end.
  isCharacterTurn(): boolean;
  // Conveniencia: ¿el combate sigue abierto?
  isOngoing(): boolean;
}

// -----------------------------------------------------------------------------
// Implementación
// -----------------------------------------------------------------------------

export function startCombatFlow(opts: CombatFlowOptions): CombatFlowHandle {
  const {
    enemyTemplates,
    itemCatalog,
    rng,
    nowIso,
    onEnd,
    onLogEntry,
  } = opts;

  // Estado mutable de la closure. Lo recreamos como nuevo objeto en cada
  // mutación para mantener inmutabilidad hacia fuera (getState devuelve la
  // referencia "viva" del último snapshot).
  let state: CombatState = startCombat(
    opts.character,
    opts.enemies,
    enemyTemplates,
    rng,
  );

  const log: CombatLogEntry[] = [];
  let logCursor = 0;
  let ended = false;
  // Lock para impedir reentradas (la vista no debería disparar acciones
  // mientras una está en curso, pero defensa en profundidad).
  let inFlight = false;

  const pushLog = (entry: CombatLogEntry): void => {
    log.push(entry);
    if (onLogEntry !== undefined) onLogEntry(entry);
  };

  // -------------------------------------------------------------------------
  // Helpers internos
  // -------------------------------------------------------------------------

  const findEnemyState = (instanceId: string): EnemyState => {
    const found = state.enemies.find((e) => e.instance_id === instanceId);
    if (found === undefined) {
      throw new Error(`combat-flow: enemigo "${instanceId}" no presente.`);
    }
    return found;
  };

  // Suma del bono al threshold del atacante por status 'dodging' del defensor.
  // En H3 sólo el PJ puede tener dodging, pero la lógica es genérica.
  const dodgingBonusAgainst = (defenderStatuses: readonly StatusEffect[]): number => {
    let bonus = 0;
    for (const s of defenderStatuses) {
      if (s.kind === 'dodging' && s.remaining > 0) bonus += s.magnitude;
    }
    return bonus;
  };

  // Decrementa los `remaining` de los statuses del PJ tras su propio turno
  // (modelo: el dodging dura 1 turno, se evapora al final del turno del PJ
  // siguiente — es decir, cubre exactamente al primer ataque enemigo que
  // venga después). Aquí decrementamos al pasar al siguiente actor; los que
  // queden en 0 se purgan en el momento de leerlos.
  const tickCharacterStatuses = (statuses: readonly StatusEffect[]): readonly StatusEffect[] => {
    const next: StatusEffect[] = [];
    for (const s of statuses) {
      const remaining = s.remaining - 1;
      if (remaining > 0) {
        next.push({ ...s, remaining });
      } else {
        pushLog({ kind: 'status_expired', actor: 'character', status_kind: s.kind });
      }
    }
    return next;
  };

  // Avanza al siguiente actor vivo del turn_order. Réplica funcional del
  // `checkVictoryOrAdvance` interno de combat.ts (no exportado): aquí vive
  // como orquestación de turnos, no como regla. Detecta cierre del combate.
  const advanceTurn = (s: CombatState): CombatState => {
    if (!s.character.alive) return { ...s, status: 'defeat' };
    const allDead = s.enemies.every((e) => !e.alive);
    if (allDead) return { ...s, status: 'victory' };

    let next = (s.current_turn_index + 1) % s.turn_order.length;
    for (let safety = 0; safety < s.turn_order.length; safety++) {
      const turn = s.turn_order[next]!;
      if (turn.actor === 'character') {
        if (s.character.alive) return { ...s, current_turn_index: next };
      } else {
        const enemy = s.enemies.find((e) => e.instance_id === turn.actor);
        if (enemy !== undefined && enemy.alive) {
          return { ...s, current_turn_index: next };
        }
      }
      next = (next + 1) % s.turn_order.length;
    }
    return s.character.alive
      ? { ...s, status: 'victory' }
      : { ...s, status: 'defeat' };
  };

  // -------------------------------------------------------------------------
  // Resolución de turnos
  // -------------------------------------------------------------------------

  const resolveCharacterAttack = (targetInstanceId: string): void => {
    const target = findEnemyState(targetInstanceId);
    if (!target.alive) {
      throw new Error(
        `combat-flow: el enemigo "${targetInstanceId}" ya está muerto.`,
      );
    }
    const targetTemplate = enemyTemplates[target.enemy_id];
    if (targetTemplate === undefined) {
      throw new Error(
        `combat-flow: template "${target.enemy_id}" no encontrado.`,
      );
    }

    // attackInput del PJ. buildAttackInputFromCharacter recalcula el
    // threshold a partir de una DEF dummy=0 (que no usamos aquí); lo
    // sobrescribimos por el defense_threshold declarado del enemigo.
    const baseInput = buildAttackInputFromCharacter(state.character, 0, itemCatalog);
    const result: AttackResult = resolveAttack(rng, {
      attacker_pool: baseInput.attacker_pool,
      defender_threshold: targetTemplate.defense_threshold,
      weapon_damage: baseInput.weapon_damage,
    });

    const newEnemyState = applyDamageToEnemy(target, result.damage);
    const newEnemies = state.enemies.map((e) =>
      e.instance_id === target.instance_id ? newEnemyState : e,
    );

    pushLog({
      kind: 'attack_resolved',
      attacker: 'character',
      attacker_kind: 'character',
      target: target.instance_id,
      target_kind: 'enemy',
      pool: baseInput.attacker_pool,
      threshold: targetTemplate.defense_threshold,
      rolls: result.pool_result.rolls,
      successes: result.pool_result.successes,
      sixes: result.pool_result.sixes,
      hit: result.hit,
      critical: result.critical,
      margin: result.margin,
      damage: result.damage,
      target_hp_after: newEnemyState.hp,
      target_alive_after: newEnemyState.alive,
    });

    state = { ...state, enemies: newEnemies };
  };

  const resolveCharacterDodge = (): void => {
    const newStatus: StatusEffect = {
      kind: 'dodging',
      // remaining=DODGE_DURATION_TURNS+1 porque tickCharacterStatuses se
      // ejecuta al cerrar el turno del PJ; queremos que sobreviva exactamente
      // al primer ataque enemigo posterior. Tras el tick quedará en
      // DODGE_DURATION_TURNS y se aplicará; tras los enemigos, en su próximo
      // turno del PJ, se purgará.
      remaining: DODGE_DURATION_TURNS + 1,
      magnitude: DODGE_THRESHOLD_BONUS,
    };
    const newCharacter: Character = {
      ...state.character,
    };
    // El status del PJ NO vive en Character (no hay campo aún en H3); vive en
    // el orquestador como un buffer paralelo asociado a 'character'. Lo
    // modelamos en una propiedad lateral del closure.
    characterStatuses = [...characterStatuses, newStatus];

    pushLog({
      kind: 'dodge_applied',
      magnitude: DODGE_THRESHOLD_BONUS,
      duration: DODGE_DURATION_TURNS,
    });
    // No alteramos `state.character` (lo dejamos para no contaminar el
    // Character autoritativo con campos no presentes en el tipo).
    void newCharacter;
  };

  const resolveCharacterUseItem = (slotIndex: number): void => {
    const slots = state.character.inventory.slots;
    if (slotIndex < 0 || slotIndex >= slots.length) {
      throw new Error(`combat-flow: slot ${slotIndex} fuera de rango.`);
    }
    const stack = slots[slotIndex];
    if (stack === null || stack === undefined) {
      throw new Error(`combat-flow: slot ${slotIndex} vacío.`);
    }
    if (stack.item_id !== HEAL_POTION_ITEM_ID) {
      throw new Error(
        `combat-flow: slot ${slotIndex} contiene "${stack.item_id}", sólo se puede usar "${HEAL_POTION_ITEM_ID}" en H3.`,
      );
    }

    const newInventory = removeFromSlot(state.character.inventory, slotIndex, 1);
    const healed = Math.min(
      state.character.hp.max,
      state.character.hp.current + HEAL_AMOUNT_MINOR_POTION,
    );
    const realHeal = healed - state.character.hp.current;
    const newCharacter: Character = {
      ...state.character,
      inventory: newInventory,
      hp: { ...state.character.hp, current: healed },
    };

    pushLog({
      kind: 'item_used',
      item_id: HEAL_POTION_ITEM_ID,
      slot_index: slotIndex,
      heal_amount: realHeal,
      character_hp_after: healed,
    });

    state = { ...state, character: newCharacter };
  };

  const resolveEnemyAttack = (instanceId: string): void => {
    const enemy = findEnemyState(instanceId);
    if (!enemy.alive) return; // ya muerto al llegar su turno: skip silencioso
    const template = enemyTemplates[enemy.enemy_id];
    if (template === undefined) {
      throw new Error(`combat-flow: template "${enemy.enemy_id}" no encontrado.`);
    }

    const characterDef = computeCharacterDefense(state.character, itemCatalog);
    const baseInput = buildAttackInputFromEnemy(template, characterDef);
    // Aplicamos el bono de threshold por dodging del PJ (D-3a-3).
    const dodgeBonus = dodgingBonusAgainst(characterStatuses);
    const finalThreshold = baseInput.defender_threshold + dodgeBonus;
    const result: AttackResult = resolveAttack(rng, {
      attacker_pool: baseInput.attacker_pool,
      defender_threshold: finalThreshold,
      weapon_damage: baseInput.weapon_damage,
    });

    const newCharacter = applyDamageToCharacter(state.character, result.damage);

    pushLog({
      kind: 'attack_resolved',
      attacker: enemy.instance_id,
      attacker_kind: 'enemy',
      target: 'character',
      target_kind: 'character',
      pool: baseInput.attacker_pool,
      threshold: finalThreshold,
      rolls: result.pool_result.rolls,
      successes: result.pool_result.successes,
      sixes: result.pool_result.sixes,
      hit: result.hit,
      critical: result.critical,
      margin: result.margin,
      damage: result.damage,
      target_hp_after: newCharacter.hp.current,
      target_alive_after: newCharacter.alive,
    });

    state = { ...state, character: newCharacter };
  };

  // -------------------------------------------------------------------------
  // Resolución de loot al cierre
  // -------------------------------------------------------------------------

  const resolveLoot = (): { character: Character; loot: CombatLootSummary } => {
    let character = state.character;
    let goldEarned = 0;
    const itemsKept: { item_id: ItemId; quantity: number }[] = [];
    const itemsDropped: { item_id: ItemId; quantity: number }[] = [];

    // Una tabla por enemigo derrotado. Tabla ausente => sin recompensa
    // (combate narrativo).
    const tables: LootTable[] = [];
    for (const e of state.enemies) {
      if (!e.alive) {
        const t = getLootTableForEnemy(e.enemy_id);
        if (t !== null) tables.push(t);
      }
    }

    // Cada drop se evalúa de forma independiente (D-2d-1 en data/enemies.ts).
    for (const table of tables) {
      for (const drop of table.drops) {
        if (!rollDropProbability(rng, drop)) continue;
        const qty = rollDropQuantity(rng, drop);
        if (qty <= 0) continue;
        if (drop.kind === 'gold') {
          character = addGold(character, qty);
          goldEarned += qty;
        } else {
          if (drop.item_id === undefined) continue;
          const stack: ItemStack = {
            item_id: drop.item_id,
            quantity: qty,
            // Items con durabilidad llegan con stack_size=1 ya validado en
            // data/items.ts; addItem valida la regla de unicidad y lanza si
            // se intenta meter una pila >1 de un item con durabilidad.
            durability:
              itemCatalog[drop.item_id]?.max_durability ?? null,
          };
          try {
            character = {
              ...character,
              inventory: addItem(character.inventory, stack, itemCatalog),
            };
            itemsKept.push({ item_id: drop.item_id, quantity: qty });
          } catch {
            // Inventario lleno: drop perdido. Lo registramos en log para que
            // la vista lo muestre en la pantalla de victoria.
            itemsDropped.push({ item_id: drop.item_id, quantity: qty });
            pushLog({
              kind: 'loot_dropped',
              item_id: drop.item_id,
              quantity: qty,
              reason: 'inventory_full',
            });
          }
        }
      }
    }

    pushLog({
      kind: 'loot_resolved',
      gold: goldEarned,
      items: itemsKept,
    });

    return {
      character,
      loot: { gold: goldEarned, items: itemsKept, dropped: itemsDropped },
    };
  };

  // -------------------------------------------------------------------------
  // Cierre del combate
  // -------------------------------------------------------------------------

  const finalizeIfClosed = (): boolean => {
    if (state.status === 'ongoing') return false;
    if (ended) return true;
    ended = true;

    let result: CombatResult;
    if (state.status === 'victory') {
      const { character: charWithLoot, loot } = resolveLoot();
      pushLog({ kind: 'combat_end', status: 'victory' });
      result = { status: 'victory', character: charWithLoot, loot };
    } else {
      // Derrota. Se asume que character.hp.current === 0 ya (applyDamage*
      // lo bajó). El epitafio se escribe con el causante: el último enemigo
      // que atacó. Para simplicidad y determinismo, usamos el primero vivo
      // del turn_order al cierre — pero como aquí state.character ya está
      // muerto, todos los enemigos vivos podrían ser causa. Tomamos el que
      // disparó la última entrada `attack_resolved` con damage > 0.
      const causeAgent = lastEnemyAttackerIdFromLog() ?? state.enemies[0]?.enemy_id ?? 'unknown';
      const causeTpl = enemyTemplates[causeAgent];
      const cause: EndOfRunCause = causeTpl !== undefined
        ? deathByEnemy(causeTpl.id, causeTpl.name)
        : { kind: 'killed_by_enemy', agent_id: causeAgent, description: `Caído ante ${causeAgent}.` };
      const finalChar = killCharacter(state.character, cause, nowIso());
      pushLog({ kind: 'combat_end', status: 'defeat' });
      result = {
        status: 'defeat',
        character: finalChar,
        loot: { gold: 0, items: [], dropped: [] },
      };
    }
    onEnd(result);
    return true;
  };

  // Recorre el log al revés para encontrar el enemy_id del último ataque
  // enemigo registrado. Usado para escribir el epitafio con la causa real.
  const lastEnemyAttackerIdFromLog = (): EnemyId | null => {
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i]!;
      if (e.kind === 'attack_resolved' && e.attacker_kind === 'enemy') {
        // attacker es instance_id. Resolvemos a enemy_id vía state.
        const inst = state.enemies.find((s) => s.instance_id === e.attacker);
        if (inst !== undefined) return inst.enemy_id;
      }
    }
    return null;
  };

  // -------------------------------------------------------------------------
  // Statuses del PJ (D-3a-3): viven en el orquestador, no en Character
  // -------------------------------------------------------------------------

  let characterStatuses: readonly StatusEffect[] = [];

  // -------------------------------------------------------------------------
  // Loop principal: avanzar hasta turno del PJ o cierre
  // -------------------------------------------------------------------------

  // Tras una acción del PJ, el orquestador avanza turnos enemigos hasta volver
  // al PJ o cerrar el combate. NO bloquea: cada turno enemigo empuja sus
  // entradas al log y la vista los anima al final.
  const runUntilCharacterTurnOrEnd = (): void => {
    // Cota dura de seguridad: el turn_order no debería tener más de N
    // entidades, así que un combate de N=10 nunca encadena más de N actores
    // sin volver al PJ. Si se supera, hay bug.
    const MAX_ITERS = state.turn_order.length * 4 + 16;
    let iters = 0;
    while (state.status === 'ongoing') {
      const turn = state.turn_order[state.current_turn_index]!;
      if (turn.actor === 'character') return;
      pushLog({ kind: 'turn_start', actor: turn.actor, actor_kind: 'enemy' });
      resolveEnemyAttack(turn.actor);
      state = advanceTurn(state);
      iters++;
      if (iters > MAX_ITERS) {
        throw new Error('combat-flow: bucle de turnos enemigos excedido (bug).');
      }
    }
  };

  // -------------------------------------------------------------------------
  // submitAction
  // -------------------------------------------------------------------------

  const submitAction = (action: CombatAction): readonly CombatLogEntry[] => {
    if (ended || state.status !== 'ongoing') {
      throw new Error('combat-flow: combate ya cerrado, no se aceptan acciones.');
    }
    if (inFlight) {
      throw new Error('combat-flow: acción reentrante; espera a que termine la anterior.');
    }
    const turn = state.turn_order[state.current_turn_index]!;
    if (turn.actor !== 'character') {
      throw new Error('combat-flow: no es el turno del PJ.');
    }
    inFlight = true;
    const tailStart = log.length;

    try {
      pushLog({ kind: 'turn_start', actor: 'character', actor_kind: 'character' });

      switch (action.kind) {
        case 'attack':
          resolveCharacterAttack(action.target_instance_id);
          break;
        case 'dodge':
          resolveCharacterDodge();
          break;
        case 'use_item':
          resolveCharacterUseItem(action.slot_index);
          break;
        case 'use_skill':
        case 'flee':
          throw new Error(
            `combat-flow: acción "${action.kind}" no implementada en H3.`,
          );
      }

      // Tras la acción: avanzar turno y encadenar enemigos.
      state = advanceTurn(state);
      // Tick de statuses al cerrar el turno del PJ (decrementa dodging;
      // el bono se aplicará al primer ataque enemigo siguiente y luego
      // expirará en el próximo turno del PJ).
      characterStatuses = tickCharacterStatuses(characterStatuses);

      if (!finalizeIfClosed()) {
        runUntilCharacterTurnOrEnd();
        finalizeIfClosed();
      }
    } finally {
      inFlight = false;
    }

    return log.slice(tailStart);
  };

  // -------------------------------------------------------------------------
  // Inicialización: emitir combat_start + arrancar enemigos pre-PJ si toca
  // -------------------------------------------------------------------------

  pushLog({
    kind: 'combat_start',
    character_name: state.character.name,
    enemy_summaries: state.enemies.map((e) => ({
      instance_id: e.instance_id,
      name: enemyTemplates[e.enemy_id]?.name ?? e.enemy_id,
      hp_max: e.hp,
    })),
    turn_order: state.turn_order.map((t) => ({
      actor: t.actor,
      initiative: t.initiative,
    })),
  });

  // Si el primer turno NO es del PJ, resolvemos los turnos enemigos
  // automáticamente hasta que toque al PJ o cierre el combate.
  runUntilCharacterTurnOrEnd();
  finalizeIfClosed();

  // -------------------------------------------------------------------------
  // Handle expuesto
  // -------------------------------------------------------------------------

  return {
    getState: () => state,
    getLog: () => log,
    consumeLogTail: () => {
      const tail = log.slice(logCursor);
      logCursor = log.length;
      return tail;
    },
    submitAction,
    isCharacterTurn: () => {
      if (state.status !== 'ongoing') return false;
      const turn = state.turn_order[state.current_turn_index];
      return turn !== undefined && turn.actor === 'character';
    },
    isOngoing: () => state.status === 'ongoing',
  };
}

// -----------------------------------------------------------------------------
// Resolución estocástica de drops (interna)
// -----------------------------------------------------------------------------

// `probability ∈ [0, 1]`. probability=1 => siempre. probability=0 nunca se
// declara, pero por defensa se trata correctamente (devuelve false sin tirar).
function rollDropProbability(rng: Rng, drop: LootDrop): boolean {
  if (drop.probability >= 1) return true;
  if (drop.probability <= 0) return false;
  return rng() < drop.probability;
}

// Cantidad uniforme entera en [min, max] inclusivo. Si min===max devuelve min
// sin consumir RNG (mantener determinismo barato y predecible).
function rollDropQuantity(rng: Rng, drop: LootDrop): number {
  if (drop.quantity_min === drop.quantity_max) return drop.quantity_min;
  const span = drop.quantity_max - drop.quantity_min + 1;
  return drop.quantity_min + Math.floor(rng() * span);
}

// Re-export para tests que quieran inspeccionar el threshold computado por
// combat.ts a partir de DEF (auditoría cruzada).
export { computeHitThreshold };
