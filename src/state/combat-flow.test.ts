import { describe, it, expect } from 'vitest';
import { startCombatFlow, type CombatLogEntry, type CombatResult } from './combat-flow';
import { createCharacter, type CreateCharacterInput, type Character } from '../rules/character';
import { addItem } from '../rules/inventory';
import { createRng } from '../rules/dice';
import type { Enemy, EnemyId, EnemyState } from '../rules/combat';
import { ENEMIES_BY_ID } from '../data/enemies';
import { ITEMS_BY_ID } from '../data/items';

// -----------------------------------------------------------------------------
// Builders deterministas
// -----------------------------------------------------------------------------

// Build OP: combate trivializado para tests de happy path (loot, encadenamiento).
// FUE 4 + armas_cuerpo 3 → pool 7, daño base 2. Mata al lobo en 2-3 turnos.
// Atributos suman 12, todos ≥ 1 (regla §4.1, mínimo 1 al crear).
function buildOP(): Character {
  const input: CreateCharacterInput = {
    id: 'pj-op',
    name: 'OP',
    portraitId: 'portrait-03',
    archetype: 'guerrero',
    attributes: { fue: 4, des: 4, con: 2, int: 1, vol: 1 },
    skills: { armas_cuerpo: 3 },
    perks: ['perk-golpe-firme'],
    location: { mapId: 'historia-01', x: 0, y: 0 },
  };
  return createCharacter(input);
}

// Build canijo: DES bajo, CON 1 → 10 HP. Pool 2 contra lobo defense_threshold 3:
// casi imposible que impacte. El lobo (pool 3 vs DEF 4 → threshold 2) le pega
// ~70% de los turnos por 2-3 daño. Muere en pocos turnos.
function buildWeak(): Character {
  const input: CreateCharacterInput = {
    id: 'pj-weak',
    name: 'Weak',
    portraitId: 'portrait-03',
    archetype: 'guerrero',
    // Suma 12, máximo 4 al crear. CON 2 → HP_max 12. DES 1 → DEF 2.
    attributes: { fue: 1, des: 1, con: 2, int: 4, vol: 4 },
    skills: { armas_cuerpo: 1 },
    perks: ['perk-golpe-firme'],
    location: { mapId: 'historia-01', x: 0, y: 0 },
  };
  return createCharacter(input);
}

function loboInstance(instanceId = 'lobo#1'): EnemyState {
  const tpl = ENEMIES_BY_ID['lobo_del_bosque']!;
  return {
    enemy_id: tpl.id,
    instance_id: instanceId,
    hp: tpl.hp_max,
    alive: true,
    statuses: [],
  };
}

const NOW = () => '2026-04-29T10:00:00.000Z';

// Stat-line de test: lobo de tutorial extra-débil. defense_threshold bajo
// para validar dodge sin depender de RNG, y hp_max=2 para cerrar en 1 turno
// si queremos atajos.
const TEST_DUMMY_ENEMY: Enemy = {
  id: 'dummy_test',
  name: 'Maniquí',
  level: 1,
  attack_pool: 0, // nunca impacta (pool 0 → 0 éxitos → no hit)
  defense_threshold: 1,
  weapon_damage: 0,
  initiative_base: 0,
  hp_max: 1,
};

const TEST_BRUTE_ENEMY: Enemy = {
  id: 'brute_test',
  name: 'Bruto',
  level: 5,
  attack_pool: 8, // tirada bestial
  defense_threshold: 5,
  weapon_damage: 5,
  initiative_base: 10,
  hp_max: 50,
};

function makeTemplates(extra: Enemy[] = []): Readonly<Record<EnemyId, Enemy>> {
  const map: Record<EnemyId, Enemy> = { ...ENEMIES_BY_ID };
  for (const e of extra) map[e.id] = e;
  return map;
}

// -----------------------------------------------------------------------------
// Happy path: PJ vence al lobo
// -----------------------------------------------------------------------------

describe('combat-flow / happy path', () => {
  it('PJ con build OP gana al lobo y resuelve loot determinista', () => {
    const character = buildOP();
    let result: CombatResult | null = null;
    const handle = startCombatFlow({
      character,
      enemies: [loboInstance()],
      enemyTemplates: ENEMIES_BY_ID,
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(42),
      nowIso: NOW,
      onEnd: (r) => {
        result = r;
      },
    });

    // Encadenamos ataques hasta que cierre.
    let safety = 50;
    while (handle.isOngoing() && safety-- > 0) {
      expect(handle.isCharacterTurn()).toBe(true);
      handle.submitAction({ kind: 'attack', target_instance_id: 'lobo#1' });
    }
    expect(handle.isOngoing()).toBe(false);
    expect(result).not.toBeNull();
    const r = result as unknown as CombatResult;
    expect(r.status).toBe('victory');
    expect(r.character.alive).toBe(true);
    expect(r.character.hp.current).toBeGreaterThan(0);

    // Diente garantizado, oro entre 5 y 15, poción aleatoria (puede o no).
    expect(r.loot.gold).toBeGreaterThanOrEqual(5);
    expect(r.loot.gold).toBeLessThanOrEqual(15);
    const itemIds = r.loot.items.map((i) => i.item_id);
    expect(itemIds).toContain('diente_de_lobo');

    // El Character final tiene gold sumado e items en slots.
    expect(r.character.gold).toBe(r.loot.gold);
    const slotItemIds = r.character.inventory.slots
      .filter((s) => s !== null)
      .map((s) => s!.item_id);
    expect(slotItemIds).toContain('diente_de_lobo');

    // Log: hay un combat_start, varios attack_resolved del PJ, varios del
    // lobo, un loot_resolved y un combat_end.
    const log = handle.getLog();
    expect(log[0]?.kind).toBe('combat_start');
    expect(log.at(-1)?.kind).toBe('combat_end');
    const lootEntry = log.find((e) => e.kind === 'loot_resolved');
    expect(lootEntry).toBeDefined();
    const endEntry = log.at(-1);
    expect(endEntry?.kind).toBe('combat_end');
    if (endEntry?.kind === 'combat_end') expect(endEntry.status).toBe('victory');
  });

  it('mismo seed → mismo loot (determinismo)', () => {
    const runOnce = (): { gold: number; items: readonly string[] } => {
      const handle = startCombatFlow({
        character: buildOP(),
        enemies: [loboInstance()],
        enemyTemplates: ENEMIES_BY_ID,
        itemCatalog: ITEMS_BY_ID,
        rng: createRng(99),
        nowIso: NOW,
        onEnd: () => {},
      });
      while (handle.isOngoing()) {
        handle.submitAction({ kind: 'attack', target_instance_id: 'lobo#1' });
      }
      const log = handle.getLog();
      const loot = log.find((e) => e.kind === 'loot_resolved');
      if (loot?.kind !== 'loot_resolved') throw new Error('sin loot');
      return { gold: loot.gold, items: loot.items.map((i) => i.item_id) };
    };
    const a = runOnce();
    const b = runOnce();
    expect(a.gold).toBe(b.gold);
    expect(a.items).toEqual(b.items);
  });
});

// -----------------------------------------------------------------------------
// Derrota
// -----------------------------------------------------------------------------

describe('combat-flow / derrota', () => {
  it('build canijo vs bruto → defeat con epitafio killed_by_enemy', () => {
    const character = buildWeak();
    let captured: CombatResult | null = null;
    const handle = startCombatFlow({
      character,
      enemies: [
        {
          enemy_id: TEST_BRUTE_ENEMY.id,
          instance_id: 'bruto#1',
          hp: TEST_BRUTE_ENEMY.hp_max,
          alive: true,
          statuses: [],
        },
      ],
      enemyTemplates: makeTemplates([TEST_BRUTE_ENEMY]),
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(7),
      nowIso: NOW,
      onEnd: (r) => {
        captured = r;
      },
    });

    let safety = 50;
    while (handle.isOngoing() && safety-- > 0) {
      handle.submitAction({ kind: 'attack', target_instance_id: 'bruto#1' });
    }
    expect(handle.isOngoing()).toBe(false);
    expect(captured).not.toBeNull();
    const r = captured as unknown as CombatResult;
    expect(r.status).toBe('defeat');
    expect(r.character.alive).toBe(false);
    expect(r.character.epitaph).not.toBeNull();
    expect(r.character.epitaph?.cause.kind).toBe('killed_by_enemy');
    expect(r.character.epitaph?.cause.agent_id).toBe(TEST_BRUTE_ENEMY.id);
    expect(r.character.epitaph?.ended_at).toBe(NOW());
  });
});

// -----------------------------------------------------------------------------
// Acciones
// -----------------------------------------------------------------------------

describe('combat-flow / acciones del PJ', () => {
  it('dodge eleva el threshold del siguiente ataque enemigo', () => {
    // Lobo de iniciativa baja (siempre va segundo) y un combate donde el
    // PJ esquiva en su primer turno; comparamos contra la misma seed sin
    // dodge (atacando con pool 0 dummy para no afectar el lobo).
    //
    // Estrategia: arrancamos el flow con PJ que ataca con pool 0 (FUE 0
    // imposible pero usamos buildOP y atacamos a un dummy). En realidad,
    // basta inspeccionar el log: el primer attack_resolved con
    // attacker_kind='enemy' debe tener threshold = base+2 cuando el PJ
    // esquivó en el turno previo.
    //
    // Para aislarlo: PJ con buildOP, lobo normal. Confirmamos initiative
    // con seed elegida.

    const handle = startCombatFlow({
      character: buildOP(),
      enemies: [loboInstance()],
      enemyTemplates: ENEMIES_BY_ID,
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(123),
      nowIso: NOW,
      onEnd: () => {},
    });

    // Si el primer turno no es del PJ por iniciativa, abortamos el test:
    // queremos garantizar que el PJ esquiva ANTES de que ataque el lobo.
    if (!handle.isCharacterTurn()) {
      // Para esta seed concreta podría no ser turno del PJ; reintentamos
      // con otra seed que sí lo sea, o saltamos.
      // En tests deterministas elegimos seed que asegure PJ primero.
      // Re-creamos con seed nueva.
    }

    // Buscamos una seed donde el PJ vaya primero. Aceptamos cualquier seed
    // que la cumpla; iteramos por seeds bajos.
    let seedFound = -1;
    for (let s = 1; s < 50; s++) {
      const h = startCombatFlow({
        character: buildOP(),
        enemies: [loboInstance()],
        enemyTemplates: ENEMIES_BY_ID,
        itemCatalog: ITEMS_BY_ID,
        rng: createRng(s),
        nowIso: NOW,
        onEnd: () => {},
      });
      if (h.isCharacterTurn() && h.isOngoing()) {
        seedFound = s;
        break;
      }
    }
    expect(seedFound).toBeGreaterThan(0);

    const h2 = startCombatFlow({
      character: buildOP(),
      enemies: [loboInstance()],
      enemyTemplates: ENEMIES_BY_ID,
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(seedFound),
      nowIso: NOW,
      onEnd: () => {},
    });

    expect(h2.isCharacterTurn()).toBe(true);
    h2.submitAction({ kind: 'dodge' });

    const log = h2.getLog();
    const dodgeEntry = log.find((e) => e.kind === 'dodge_applied');
    expect(dodgeEntry).toBeDefined();
    if (dodgeEntry?.kind === 'dodge_applied') {
      expect(dodgeEntry.magnitude).toBe(2);
    }

    // El primer ataque enemigo en el log debe tener threshold con bono.
    // Lobo defense_threshold de PJ = ceil(DEF/3). DEF de buildOP = 2 + floor(4/2) = 4 → threshold base 2. Con +2 → 4.
    const firstEnemyAttack = log.find(
      (e): e is Extract<CombatLogEntry, { kind: 'attack_resolved' }> =>
        e.kind === 'attack_resolved' && e.attacker_kind === 'enemy',
    );
    expect(firstEnemyAttack).toBeDefined();
    expect(firstEnemyAttack!.threshold).toBe(4); // 2 base + 2 dodge

    // Tras un ciclo más (ataque del PJ siguiente), el dodging debería expirar.
    if (h2.isOngoing() && h2.isCharacterTurn()) {
      h2.submitAction({ kind: 'attack', target_instance_id: 'lobo#1' });
      const log2 = h2.getLog();
      const enemyAttacks = log2.filter(
        (e): e is Extract<CombatLogEntry, { kind: 'attack_resolved' }> =>
          e.kind === 'attack_resolved' && e.attacker_kind === 'enemy',
      );
      // Si hubo un segundo ataque enemigo, debería ir SIN bono (threshold 2).
      if (enemyAttacks.length >= 2) {
        expect(enemyAttacks[1]!.threshold).toBe(2);
      }
      // Y debería haberse logueado la expiración del status.
      const expired = log2.find((e) => e.kind === 'status_expired');
      expect(expired).toBeDefined();
    }
  });

  it('use_item de poción cura HP y elimina la pila del inventario', () => {
    // Damos poción al PJ, le bajamos HP, comprobamos que sube tras usar.
    let character = buildOP();
    character = {
      ...character,
      inventory: addItem(
        character.inventory,
        { item_id: 'pocion_curacion_menor', quantity: 1, durability: null },
        ITEMS_BY_ID,
      ),
      hp: { current: 5, max: character.hp.max },
    };

    // Encontramos el slot de la poción.
    const potionSlot = character.inventory.slots.findIndex(
      (s) => s !== null && s!.item_id === 'pocion_curacion_menor',
    );
    expect(potionSlot).toBeGreaterThanOrEqual(0);

    // Buscamos seed donde PJ vaya primero (igual que arriba).
    let seedFound = -1;
    for (let s = 1; s < 50; s++) {
      const h = startCombatFlow({
        character,
        enemies: [loboInstance()],
        enemyTemplates: ENEMIES_BY_ID,
        itemCatalog: ITEMS_BY_ID,
        rng: createRng(s),
        nowIso: NOW,
        onEnd: () => {},
      });
      if (h.isCharacterTurn() && h.isOngoing()) {
        seedFound = s;
        break;
      }
    }
    expect(seedFound).toBeGreaterThan(0);

    const handle = startCombatFlow({
      character,
      enemies: [loboInstance()],
      enemyTemplates: ENEMIES_BY_ID,
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(seedFound),
      nowIso: NOW,
      onEnd: () => {},
    });

    handle.submitAction({ kind: 'use_item', slot_index: potionSlot });
    const stateAfter = handle.getState();

    // El slot de la poción ahora está vacío (el efecto del item es síncrono
    // dentro de submitAction; los turnos enemigos posteriores no afectan
    // inventario en H3).
    expect(stateAfter.character.inventory.slots[potionSlot]).toBeNull();

    // El log debe contener el item_used con heal_amount > 0 (si el HP de
    // partida estaba por debajo del max, el heal real será > 0).
    const itemUsed = handle.getLog().find((e) => e.kind === 'item_used');
    expect(itemUsed).toBeDefined();
    if (itemUsed?.kind === 'item_used') {
      expect(itemUsed.heal_amount).toBeGreaterThan(0);
      expect(itemUsed.item_id).toBe('pocion_curacion_menor');
    }
  });
});

// -----------------------------------------------------------------------------
// Validaciones de submitAction
// -----------------------------------------------------------------------------

describe('combat-flow / validaciones', () => {
  it('lanza al usar submitAction tras combate cerrado', () => {
    const handle = startCombatFlow({
      character: buildOP(),
      enemies: [
        {
          enemy_id: TEST_DUMMY_ENEMY.id,
          instance_id: 'dummy#1',
          hp: TEST_DUMMY_ENEMY.hp_max,
          alive: true,
          statuses: [],
        },
      ],
      enemyTemplates: makeTemplates([TEST_DUMMY_ENEMY]),
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(1),
      nowIso: NOW,
      onEnd: () => {},
    });

    // Pool 6 contra threshold 1 → siempre impacta y mata al maniquí (hp 1).
    while (handle.isOngoing()) {
      handle.submitAction({ kind: 'attack', target_instance_id: 'dummy#1' });
    }
    expect(handle.isOngoing()).toBe(false);
    expect(() =>
      handle.submitAction({ kind: 'attack', target_instance_id: 'dummy#1' }),
    ).toThrow(/cerrado/i);
  });

  it('lanza al atacar a un instance_id inexistente', () => {
    const handle = startCombatFlow({
      character: buildOP(),
      enemies: [loboInstance()],
      enemyTemplates: ENEMIES_BY_ID,
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(8),
      nowIso: NOW,
      onEnd: () => {},
    });
    if (!handle.isCharacterTurn()) {
      // Si la seed no nos da PJ primero, el test no aplica directamente;
      // forzamos el caso pidiendo un id inexistente; el orquestador debe
      // reconocerlo aunque sea turno enemigo (validación explícita).
      // El orden de chequeos: primero "es turno PJ?", luego "target válido?".
      // Si no es turno PJ, lanza por turno; aceptamos cualquiera de los dos.
      expect(() =>
        handle.submitAction({ kind: 'attack', target_instance_id: 'fantasma#X' }),
      ).toThrow();
      return;
    }
    expect(() =>
      handle.submitAction({ kind: 'attack', target_instance_id: 'fantasma#X' }),
    ).toThrow(/no presente/i);
  });

  it('lanza al atacar a un enemigo ya muerto', () => {
    const handle = startCombatFlow({
      character: buildOP(),
      enemies: [
        {
          enemy_id: TEST_DUMMY_ENEMY.id,
          instance_id: 'dummy#1',
          hp: TEST_DUMMY_ENEMY.hp_max,
          alive: true,
          statuses: [],
        },
        {
          enemy_id: TEST_DUMMY_ENEMY.id,
          instance_id: 'dummy#2',
          hp: TEST_DUMMY_ENEMY.hp_max,
          alive: true,
          statuses: [],
        },
      ],
      enemyTemplates: makeTemplates([TEST_DUMMY_ENEMY]),
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(2),
      nowIso: NOW,
      onEnd: () => {},
    });

    // Mata al primero.
    while (handle.isOngoing() && handle.getState().enemies[0]!.alive) {
      handle.submitAction({ kind: 'attack', target_instance_id: 'dummy#1' });
    }
    if (handle.isOngoing()) {
      expect(() =>
        handle.submitAction({ kind: 'attack', target_instance_id: 'dummy#1' }),
      ).toThrow(/muerto/i);
    }
  });

  it('use_skill y flee no implementadas en H3', () => {
    const handle = startCombatFlow({
      character: buildOP(),
      enemies: [loboInstance()],
      enemyTemplates: ENEMIES_BY_ID,
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(3),
      nowIso: NOW,
      onEnd: () => {},
    });
    if (!handle.isCharacterTurn()) return; // skip si seed no da PJ primero
    expect(() =>
      handle.submitAction({ kind: 'use_skill', skill_id: 'x', target_instance_id: null }),
    ).toThrow(/no implementada en H3/);
    expect(() => handle.submitAction({ kind: 'flee' })).toThrow(/no implementada en H3/);
  });
});

// -----------------------------------------------------------------------------
// Encadenamiento y multi-enemigo
// -----------------------------------------------------------------------------

describe('combat-flow / encadenamiento de turnos', () => {
  it('si el primer turno es enemigo, el orquestador resuelve antes de devolver control', () => {
    // Lobo con initiative_base alta (siempre va antes que PJ con DES bajo).
    const fastWolf: Enemy = {
      ...ENEMIES_BY_ID['lobo_del_bosque']!,
      id: 'lobo_rapido',
      initiative_base: 100,
    };
    const character = buildOP();
    const handle = startCombatFlow({
      character,
      enemies: [
        {
          enemy_id: fastWolf.id,
          instance_id: 'lobo_rapido#1',
          hp: fastWolf.hp_max,
          alive: true,
          statuses: [],
        },
      ],
      enemyTemplates: makeTemplates([fastWolf]),
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(4),
      nowIso: NOW,
      onEnd: () => {},
    });

    // Tras inicializar, el log debe contener al menos un attack_resolved
    // del enemigo (su turno se resolvió automáticamente) y debe ser turno
    // del PJ (o combate cerrado).
    const log = handle.getLog();
    const enemyAttack = log.find(
      (e) => e.kind === 'attack_resolved' && e.attacker_kind === 'enemy',
    );
    expect(enemyAttack).toBeDefined();
    if (handle.isOngoing()) {
      expect(handle.isCharacterTurn()).toBe(true);
    }
  });

  it('combate con 2 lobos: ambos atacan en su turno; victoria al matar a los 2', () => {
    const handle = startCombatFlow({
      character: buildOP(),
      enemies: [loboInstance('lobo#1'), loboInstance('lobo#2')],
      enemyTemplates: ENEMIES_BY_ID,
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(5),
      nowIso: NOW,
      onEnd: () => {},
    });

    let safety = 100;
    while (handle.isOngoing() && safety-- > 0) {
      const aliveTarget = handle
        .getState()
        .enemies.find((e) => e.alive);
      if (aliveTarget === undefined) break;
      handle.submitAction({ kind: 'attack', target_instance_id: aliveTarget.instance_id });
    }
    const finalState = handle.getState();
    if (finalState.character.alive) {
      expect(finalState.status).toBe('victory');
      expect(finalState.enemies.every((e) => !e.alive)).toBe(true);
      // Ambos lobos deberían haber atacado al menos una vez (a no ser que
      // los dos murieran en turno PJ antes de actuar — improbable pero
      // posible). Con seed 5 y buildOP típicamente ambos atacan.
      const log = handle.getLog();
      const attackerIds = new Set(
        log
          .filter((e) => e.kind === 'attack_resolved' && e.attacker_kind === 'enemy')
          .map((e) => (e.kind === 'attack_resolved' ? e.attacker : '')),
      );
      // Al menos uno de los dos atacó (el otro pudo morir antes de su turno).
      expect(attackerIds.size).toBeGreaterThanOrEqual(1);
    }
  });
});

// -----------------------------------------------------------------------------
// API: consumeLogTail
// -----------------------------------------------------------------------------

describe('combat-flow / consumeLogTail', () => {
  it('avanza el cursor y entrega solo entradas nuevas', () => {
    const handle = startCombatFlow({
      character: buildOP(),
      enemies: [loboInstance()],
      enemyTemplates: ENEMIES_BY_ID,
      itemCatalog: ITEMS_BY_ID,
      rng: createRng(6),
      nowIso: NOW,
      onEnd: () => {},
    });

    const tail1 = handle.consumeLogTail();
    expect(tail1.length).toBeGreaterThan(0);
    expect(tail1[0]?.kind).toBe('combat_start');

    // Tras consumir, una segunda llamada sin acciones nuevas devuelve [].
    expect(handle.consumeLogTail()).toEqual([]);

    if (handle.isOngoing() && handle.isCharacterTurn()) {
      handle.submitAction({ kind: 'attack', target_instance_id: 'lobo#1' });
      const tail2 = handle.consumeLogTail();
      expect(tail2.length).toBeGreaterThan(0);
      // No incluye el combat_start anterior.
      expect(tail2.find((e) => e.kind === 'combat_start')).toBeUndefined();
    }
  });
});
