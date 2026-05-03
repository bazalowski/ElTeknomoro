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
//   - D-4a-2-1 (sub-paso 4a.2): los statuses del PJ migran del buffer paralelo
//     `characterStatuses` (que sólo vivía en la closure) al campo canónico
//     `state.character.statuses`, ahora que existe (sub-paso 4a.1). Una sola
//     fuente de verdad. El epitafio captura el final_character con los statuses
//     activos, lo cual es info útil para la pantalla de muerte.
//   - D-4a-2-2 (sub-paso 4a.2): el log gana un kind `status_damage` para que
//     la vista anime "el PJ pierde 1 HP por sangrado" / "el lobo pierde 1 HP
//     por veneno". No es una nueva razón de muerte (el combat_end sigue siendo
//     victory/defeat); es información de turno necesaria para la animación.
//   - D-4a-2-3 (sub-paso 4a.2): el orquestador integra el ciclo de tick de
//     statuses (bleeding al inicio, poisoned al final, decremento al final,
//     stunned consume turno) en cada turno (PJ y enemigo). Reutiliza los
//     helpers de rules/statuses.ts; combat.ts también los integra para que
//     applyCharacterAction/applyEnemyTurn (consumidos por skeleton.smoke.test)
//     mantengan el mismo contrato.
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
  EnemyIntent,
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
  defensiveThresholdBonus,
  FLEE_SUCCESS_PROBABILITY,
  resolveAttack,
  startCombat,
} from '../rules/combat';
import { decideEnemyAction } from '../rules/ai';
import {
  applyStatus,
  clearAllStatuses,
  hasStatus,
  STATUS_DEFAULT_DURATION,
  STATUS_DEFAULT_MAGNITUDE,
  tickStatusesAtTurnEnd,
  tickStatusesAtTurnStart,
  type StatusKind,
} from '../rules/statuses';
import { addItem, removeFromSlot } from '../rules/inventory';
import { addGold } from '../rules/character';
import { deathByEnemy, killCharacter } from '../rules/death';
import { getLootTableForEnemy } from '../data/enemies';

// -----------------------------------------------------------------------------
// Constantes de orquestación (D-3a-1)
// -----------------------------------------------------------------------------

const HEAL_AMOUNT_MINOR_POTION = 6;
const HEAL_POTION_ITEM_ID: ItemId = 'pocion_curacion_menor';

// Dodge: la duración SEMÁNTICA y el bono al threshold viven ya en el motor
// (rules/combat.ts y rules/statuses.ts) tras 4a.3. El orquestador conserva
// estas constantes derivadas SOLO para que la entrada `dodge_applied` del log
// (consumida por la vista) reporte un par (magnitude, duration) coherente con
// lo que el motor escribe. NO se usan para calcular el bono real al threshold:
// para eso el orquestador llama a `defensiveThresholdBonus(defender)` del motor.
const DODGE_LOG_DURATION = STATUS_DEFAULT_DURATION.dodging;
const DODGE_LOG_MAGNITUDE = STATUS_DEFAULT_MAGNITUDE.dodging;

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
      actor: string; // 'character' | instance_id
      actor_kind: 'character' | 'enemy';
      status_kind: StatusEffect['kind'];
    }
  | {
      kind: 'status_damage';
      actor: string; // 'character' | instance_id
      actor_kind: 'character' | 'enemy';
      status_kind: StatusEffect['kind']; // 'bleeding' | 'poisoned'
      damage: number;
      target_hp_after: number;
      target_alive_after: boolean;
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
      // Sub-paso 4c: declaración de intención del enemigo. Emitido al INICIO
      // de cada turno enemigo, ANTES de ejecutar la acción. La UI lo lee
      // para telegrafiar al jugador "el lobo va a atacarte por 3-5 daño" o
      // "el lobo se prepara a esquivar". El intent ya vive en
      // EnemyState.intent (motor); este log es la versión consumible para
      // animación + log textual.
      kind: 'enemy_intent';
      actor: string;       // instance_id
      intent: EnemyIntent; // copia inmutable del intent decidido
    }
  | {
      // Sub-paso 4c: resultado de la acción `flee` del PJ (decisión C1).
      // El motor ya devuelve status='fled' o continúa el combate; este log
      // permite a la UI mostrar la tirada concreta (éxito/fallo) y, en
      // fallo, prefigurar que los enemigos atacarán a continuación.
      kind: 'flee_attempted';
      success: boolean;
    }
  | {
      kind: 'combat_end';
      // Sub-paso 4c: añadido 'fled' (decisión D1). El cierre por huida no
      // tiene loot ni epitafio: el PJ vuelve a home con HP actuales y
      // statuses limpios. La UI distingue las tres ramas para presentar
      // overlays distintos.
      status: 'victory' | 'defeat' | 'fled';
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
  // Sub-paso 4c: añadido 'fled' (decisión D1). El PJ huyó con éxito; vuelve
  // a home vivo con HP actuales y statuses limpios. Sin loot, sin epitafio.
  status: 'victory' | 'defeat' | 'fled';
  // Character final:
  //   - victoria → con loot aplicado (gold, items en slots).
  //   - derrota  → con epitafio escrito.
  //   - fled     → vivo con HP actuales y statuses limpios (sin marca).
  // El caller lo persiste tal cual.
  character: Character;
  // Loot resuelto. En derrota y en fled viene { gold: 0, items: [], dropped: [] }.
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

  // El bono al threshold del atacante por dodging del defensor ya no se
  // calcula aquí. Lo expone el motor vía `defensiveThresholdBonus(defender)`
  // (rules/combat.ts), que suma +1 fijo si el defensor tiene `dodging`. Una
  // sola fuente de verdad PJ ↔ enemigo. El llamador (resolveEnemyAttack y, si
  // alguna vez se añade IA con dodge, también resolveCharacterAttack) usa el
  // helper directamente.

  // Compara `before` y `after` de statuses para emitir entradas
  // `status_expired` por cada kind que desapareció. La regla de identidad es
  // por kind (cap 1 por kind, 4a.1).
  const logExpirations = (
    before: readonly StatusEffect[],
    after: readonly StatusEffect[],
    actor: string,
    actor_kind: 'character' | 'enemy',
  ): void => {
    for (const prev of before) {
      const stillThere = after.some((s) => s.kind === prev.kind);
      if (!stillThere) {
        pushLog({ kind: 'status_expired', actor, actor_kind, status_kind: prev.kind });
      }
    }
  };

  // Devuelve el StatusKind dañino que disparó al inicio del turno (bleeding).
  // Usado para etiquetar el `status_damage` del tick de inicio. En H3 sólo
  // bleeding tickea al inicio, así que devolvemos 'bleeding' si está presente.
  const startTickKind = (statuses: readonly StatusEffect[]): StatusKind | null => {
    return statuses.some((s) => s.kind === 'bleeding') ? 'bleeding' : null;
  };

  // Misma función para el tick de fin (poisoned).
  const endTickKind = (statuses: readonly StatusEffect[]): StatusKind | null => {
    return statuses.some((s) => s.kind === 'poisoned') ? 'poisoned' : null;
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
    // Bono de dodging del enemigo defensor (simetría 4a.3): hoy ningún
    // enemigo lo aplica, pero el motor está preparado.
    const baseInput = buildAttackInputFromCharacter(state.character, 0, itemCatalog);
    const enemyDodgeBonus = defensiveThresholdBonus(target);
    const finalThreshold = targetTemplate.defense_threshold + enemyDodgeBonus;
    const result: AttackResult = resolveAttack(rng, {
      attacker_pool: baseInput.attacker_pool,
      defender_threshold: finalThreshold,
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
      threshold: finalThreshold,
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
    // Tras 4a.3, dodge es acción de primera clase del motor (rules/combat.ts):
    // applyCharacterAction({ kind: 'dodge' }) aplica el status `dodging` al PJ
    // con remaining = STATUS_DEFAULT_DURATION + 1 y magnitud por defecto. El
    // orquestador NO lo invoca directamente porque mantiene su propio loop
    // de tick para emitir entradas de log paso a paso (`status_damage`,
    // `status_expired`); en su lugar replica la mutación con los MISMOS
    // parámetros que el motor. Una sola fuente de verdad para los números:
    // STATUS_DEFAULT_DURATION.dodging y STATUS_DEFAULT_MAGNITUDE.dodging.
    //
    // El "+1" sobre la duración semántica compensa el tickEnd del propio
    // turno donde se aplica (auditoría en rules/combat.ts § applyCharacterAction
    // rama dodge). Cobertura efectiva: el siguiente ataque enemigo, ni más ni menos.
    const dodgeEffect: StatusEffect = {
      kind: 'dodging',
      remaining: STATUS_DEFAULT_DURATION.dodging + 1,
      magnitude: STATUS_DEFAULT_MAGNITUDE.dodging,
    };
    const newCharacter = applyStatus(state.character, dodgeEffect);
    state = { ...state, character: newCharacter };

    pushLog({
      kind: 'dodge_applied',
      magnitude: DODGE_LOG_MAGNITUDE,
      duration: DODGE_LOG_DURATION,
    });
  };

  // Sub-paso 4c (decisión C1): tirada de huida con la MISMA rng inyectada
  // (no Math.random). Probabilidad fija FLEE_SUCCESS_PROBABILITY (50%, en
  // rules/combat.ts). Si éxito → cierra combate marcando state.status='fled'.
  // Si fallo → no muta state (el caller llama a advanceTurn). Loguea
  // siempre el resultado para que la UI sepa qué pasó.
  //
  // Mantengo simetría con el motor (rules/combat.ts rama flee de
  // applyCharacterAction): mismo umbral, misma constante. Una sola fuente
  // de verdad para el número.
  const resolveCharacterFlee = (): boolean => {
    const success = rng() < FLEE_SUCCESS_PROBABILITY;
    pushLog({ kind: 'flee_attempted', success });
    if (success) {
      // Cierre por huida. character ya tiene tick start aplicado por el
      // caller (submitAction); statuses se limpian en finalizeIfClosed.
      state = { ...state, status: 'fled' };
    }
    return success;
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
    // Aplicamos el bono de threshold por dodging del PJ. Tras 4a.3 el bono
    // (+1 fijo) vive en el motor: defensiveThresholdBonus(defender). El
    // orquestador SOLO consulta. Garantiza simetría con applyEnemyTurn del
    // motor: ambos lados aplican el mismo modificador.
    const dodgeBonus = defensiveThresholdBonus(state.character);
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
  // Helpers de tick por turno (sub-paso 4a.2)
  // -------------------------------------------------------------------------

  // Helper: reescribe un EnemyState en la lista preservando referencias del
  // resto. Devuelve nuevo array (puro).
  const replaceEnemyInState = (next: EnemyState): readonly EnemyState[] => {
    return state.enemies.map((e) => (e.instance_id === next.instance_id ? next : e));
  };

  // Tick de inicio de turno sobre el PJ. Aplica daño de bleeding, loguea
  // `status_damage` si toca y actualiza state.character. Devuelve true si el
  // PJ sigue vivo, false si murió por DoT.
  const tickStartOnCharacter = (): boolean => {
    const before = state.character.statuses;
    const tick = tickStatusesAtTurnStart(state.character);
    if (tick.damage <= 0) return state.character.alive;
    const damagedKind = startTickKind(before);
    const newCharacter = applyDamageToCharacter(tick.bearer, tick.damage);
    state = { ...state, character: newCharacter };
    pushLog({
      kind: 'status_damage',
      actor: 'character',
      actor_kind: 'character',
      status_kind: damagedKind ?? 'bleeding',
      damage: tick.damage,
      target_hp_after: newCharacter.hp.current,
      target_alive_after: newCharacter.alive,
    });
    return newCharacter.alive;
  };

  // Tick de fin de turno sobre el PJ. Aplica daño de poisoned, decrementa
  // todos los statuses, loguea `status_damage` y `status_expired`. Devuelve
  // true si el PJ sigue vivo.
  const tickEndOnCharacter = (): boolean => {
    const before = state.character.statuses;
    const damagedKind = endTickKind(before);
    const tick = tickStatusesAtTurnEnd(state.character);
    let newCharacter = tick.bearer;
    if (tick.damage > 0) {
      newCharacter = applyDamageToCharacter(newCharacter, tick.damage);
    }
    state = { ...state, character: newCharacter };
    if (tick.damage > 0) {
      pushLog({
        kind: 'status_damage',
        actor: 'character',
        actor_kind: 'character',
        status_kind: damagedKind ?? 'poisoned',
        damage: tick.damage,
        target_hp_after: newCharacter.hp.current,
        target_alive_after: newCharacter.alive,
      });
    }
    logExpirations(before, newCharacter.statuses, 'character', 'character');
    return newCharacter.alive;
  };

  // Tick de inicio de turno sobre un enemigo. Devuelve { alive, enemyAfter }.
  const tickStartOnEnemy = (enemy: EnemyState): { alive: boolean; enemyAfter: EnemyState } => {
    const before = enemy.statuses;
    const tick = tickStatusesAtTurnStart(enemy);
    if (tick.damage <= 0) return { alive: enemy.alive, enemyAfter: enemy };
    const damagedKind = startTickKind(before);
    const enemyAfter = applyDamageToEnemy(tick.bearer, tick.damage);
    state = { ...state, enemies: replaceEnemyInState(enemyAfter) };
    pushLog({
      kind: 'status_damage',
      actor: enemy.instance_id,
      actor_kind: 'enemy',
      status_kind: damagedKind ?? 'bleeding',
      damage: tick.damage,
      target_hp_after: enemyAfter.hp,
      target_alive_after: enemyAfter.alive,
    });
    return { alive: enemyAfter.alive, enemyAfter };
  };

  // Tick de fin de turno sobre un enemigo. Devuelve { alive, enemyAfter }.
  const tickEndOnEnemy = (enemy: EnemyState): { alive: boolean; enemyAfter: EnemyState } => {
    const before = enemy.statuses;
    const damagedKind = endTickKind(before);
    const tick = tickStatusesAtTurnEnd(enemy);
    let enemyAfter = tick.bearer;
    if (tick.damage > 0) {
      enemyAfter = applyDamageToEnemy(enemyAfter, tick.damage);
    }
    state = { ...state, enemies: replaceEnemyInState(enemyAfter) };
    if (tick.damage > 0) {
      pushLog({
        kind: 'status_damage',
        actor: enemy.instance_id,
        actor_kind: 'enemy',
        status_kind: damagedKind ?? 'poisoned',
        damage: tick.damage,
        target_hp_after: enemyAfter.hp,
        target_alive_after: enemyAfter.alive,
      });
    }
    logExpirations(before, enemyAfter.statuses, enemy.instance_id, 'enemy');
    return { alive: enemyAfter.alive, enemyAfter };
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
      // Sub-paso 4c: limpieza de statuses al cierre. Cubre la deuda de 4a.4
      // (los statuses no persisten entre combates en H3) para CUALQUIER vía
      // de cierre: victoria, derrota, huida. Antes solo se cubría parcialmente
      // y dependía del caller (main.ts/saveCharacterUpdate). Ahora la
      // garantía vive aquí, una sola fuente de verdad.
      const cleanCharacter = clearAllStatuses(charWithLoot);
      pushLog({ kind: 'combat_end', status: 'victory' });
      result = { status: 'victory', character: cleanCharacter, loot };
    } else if (state.status === 'fled') {
      // Sub-paso 4c (decisión D1): huida exitosa. PJ vuelve a home vivo
      // con HP actuales y statuses limpios. Sin loot, sin epitafio, sin
      // marca narrativa. El caller (main.ts) persiste con saveCharacterUpdate
      // tal cual; la home reflejará el HP actual.
      const cleanCharacter = clearAllStatuses(state.character);
      pushLog({ kind: 'combat_end', status: 'fled' });
      result = {
        status: 'fled',
        character: cleanCharacter,
        loot: { gold: 0, items: [], dropped: [] },
      };
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
      // Limpiar statuses ANTES de escribir el epitafio: el PJ caído no
      // necesita arrastrar veneno/sangrado en el cadáver. La identidad
      // narrativa queda en el epitafio.
      const cleanCharacter = clearAllStatuses(state.character);
      const finalChar = killCharacter(cleanCharacter, cause, nowIso());
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
  // Loop principal: avanzar hasta turno del PJ o cierre
  // -------------------------------------------------------------------------
  //
  // Nota 4a.2: el buffer paralelo `characterStatuses` se eliminó. Los
  // statuses del PJ viven ahora en state.character.statuses (campo añadido
  // en sub-paso 4a.1). Una sola fuente de verdad.

  // Resuelve un turno enemigo completo (tick start + decisión IA + ejecución
  // del intent + tick end + advance). Devuelve sin más si el combate ya
  // cerró o si no hay enemigo vivo en ese slot (skip silencioso). Loguea
  // turn_start sólo si el enemigo de ese slot está vivo al ENTRAR.
  //
  // Sub-paso 4c: el bloque "(3) Ataca al PJ" se reemplaza por:
  //   (3a) Calcular intent vía decideEnemyAction.
  //   (3b) Emitir log enemy_intent (la UI lo telegrafía).
  //   (3c) Ejecutar el intent: attack | apply_status_self | apply_status_target.
  // Tras ejecutar, se LIMPIA el intent del EnemyState (intent: null).
  const runEnemyTurn = (instanceId: string): void => {
    const enemy = findEnemyState(instanceId);
    if (!enemy.alive) {
      // Slot muerto al llegar su turno: no hay tick (no actúa), no hay log.
      // El advanceTurn del caller pasa al siguiente.
      return;
    }
    const template = enemyTemplates[enemy.enemy_id];
    if (template === undefined) {
      throw new Error(`combat-flow: template "${enemy.enemy_id}" no encontrado.`);
    }
    pushLog({ kind: 'turn_start', actor: instanceId, actor_kind: 'enemy' });

    // (1) Tick start (bleeding). Si muere por DoT, advance y fin.
    const start = tickStartOnEnemy(enemy);
    if (!start.alive) {
      state = advanceTurn(state);
      return;
    }
    let liveEnemy = start.enemyAfter;

    // (2) ¿Stunned? Pierde el turno: tick end + advance, sin actuar.
    if (hasStatus(liveEnemy, 'stunned')) {
      tickEndOnEnemy(liveEnemy);
      state = advanceTurn(state);
      return;
    }

    // (3a) Calcular intent vía la IA. Pure, no consume RNG. La decisión
    // depende del estado actual: HP del enemigo, statuses propios y del PJ.
    const intent = decideEnemyAction(liveEnemy, template, state.character, template.ai_profile);
    // Asignar el intent al EnemyState VIVO. La UI lo lee de state.enemies,
    // no del log: el log es para historial textual.
    liveEnemy = { ...liveEnemy, intent };
    state = { ...state, enemies: replaceEnemyInState(liveEnemy) };

    // (3b) Emitir log enemy_intent. Copia inmutable del intent.
    pushLog({ kind: 'enemy_intent', actor: instanceId, intent });

    // (3c) Ejecutar el intent.
    if (intent.kind === 'attack') {
      resolveEnemyAttack(instanceId);
      // El PJ puede haber muerto. resolveEnemyAttack ya actualizó state.
      if (!state.character.alive) {
        state = advanceTurn(state);
        return;
      }
    } else if (intent.kind === 'apply_status_self') {
      // Aplicar status al propio enemigo. Magnitud y duración del catálogo
      // de defaults: misma fuente de verdad que dodge del PJ. El "+1" sobre
      // la duración compensa el tickEnd del propio turno.
      const effect: StatusEffect = {
        kind: intent.status,
        remaining: STATUS_DEFAULT_DURATION[intent.status] + 1,
        magnitude: STATUS_DEFAULT_MAGNITUDE[intent.status],
      };
      const enemyAfter = applyStatus(liveEnemy, effect);
      liveEnemy = enemyAfter;
      state = { ...state, enemies: replaceEnemyInState(enemyAfter) };
    } else {
      // intent.kind === 'apply_status_target'. Aplica status al PJ. NO ataca.
      // F1 explícita: el perfil toxico aplica `poisoned` como acción
      // separada (gasta el turno aplicando el status, NO ataca y aplica al
      // mismo tiempo).
      const effect: StatusEffect = {
        kind: intent.status,
        remaining: STATUS_DEFAULT_DURATION[intent.status] + 1,
        magnitude: STATUS_DEFAULT_MAGNITUDE[intent.status],
      };
      const newCharacter = applyStatus(state.character, effect);
      state = { ...state, character: newCharacter };
    }

    // (4) Tick end (poisoned + decremento). Releemos la referencia viva del
    // enemigo por si fue mutado durante (3c); si murió por DoT al final, sólo
    // afecta a su propio slot.
    const liveEnemyAfterAction = state.enemies.find((e) => e.instance_id === instanceId);
    if (liveEnemyAfterAction !== undefined && liveEnemyAfterAction.alive) {
      tickEndOnEnemy(liveEnemyAfterAction);
    }

    // (5) Limpiar intent ejecutado. El próximo turno enemigo recalculará uno.
    const finalEnemy = state.enemies.find((e) => e.instance_id === instanceId);
    if (finalEnemy !== undefined) {
      state = {
        ...state,
        enemies: replaceEnemyInState({ ...finalEnemy, intent: null }),
      };
    }

    state = advanceTurn(state);
  };

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
      runEnemyTurn(turn.actor);
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

      // (1) Tick start del PJ (bleeding). Si muere por DoT, no procesa la
      // acción, advance + cierre.
      const aliveAfterStart = tickStartOnCharacter();
      if (!aliveAfterStart) {
        state = advanceTurn(state);
        finalizeIfClosed();
        return log.slice(tailStart);
      }

      // (2) ¿Stunned? Pierde el turno. Tick end (decrementa stunned) + advance.
      // La acción NO se procesa pero NO se considera un error (el caller no
      // sabe necesariamente que el PJ está aturdido — la vista podría haber
      // pintado el panel de acciones igual).
      if (hasStatus(state.character, 'stunned')) {
        const aliveAfterEnd = tickEndOnCharacter();
        if (!aliveAfterEnd) {
          state = advanceTurn(state);
          finalizeIfClosed();
          return log.slice(tailStart);
        }
        state = advanceTurn(state);
        if (!finalizeIfClosed()) {
          runUntilCharacterTurnOrEnd();
          finalizeIfClosed();
        }
        return log.slice(tailStart);
      }

      // (3) Procesa la acción.
      //
      // Sub-paso 4c: rama `flee`. C1 cerrada — tirada 50% con la rng
      // inyectada. Si éxito, state.status='fled' y el cierre ocurre en
      // finalizeIfClosed más abajo. Si fallo, NO se aplica tick end y NO
      // se procesa daño: el turno se consume y se avanza al enemigo.
      // Auditoría: la asimetría del tick end (no se aplica en flee) es
      // intencional y simétrica con la rama flee de rules/combat.ts.
      if (action.kind === 'flee') {
        const success = resolveCharacterFlee();
        if (success) {
          // state.status ya es 'fled'. finalizeIfClosed lo procesa.
          finalizeIfClosed();
          return log.slice(tailStart);
        }
        // Fallo: consume turno sin tick end. Avanza al enemigo.
        state = advanceTurn(state);
        if (!finalizeIfClosed()) {
          runUntilCharacterTurnOrEnd();
          finalizeIfClosed();
        }
        return log.slice(tailStart);
      }

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
          throw new Error(
            `combat-flow: acción "${action.kind}" no implementada en H3.`,
          );
      }

      // (4) Tick end del PJ (poisoned + decremento). Si muere → cierre.
      const aliveAfterEnd = tickEndOnCharacter();
      if (!aliveAfterEnd) {
        state = advanceTurn(state);
        finalizeIfClosed();
        return log.slice(tailStart);
      }

      // (5) Avanzar turno y encadenar enemigos.
      state = advanceTurn(state);
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
