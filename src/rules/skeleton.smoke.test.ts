// Smoke test del esqueleto completo de rules/.
// Objetivo: validar que el cableado de tipos y las funciones implementadas
// (no las NOT_IMPLEMENTED) ejecutan un ciclo básico end-to-end:
//
//   crear PJ → atacar enemigo → matar enemigo → recibir golpe mortal → epitafio
//
// Y de paso confirma que las APIs marcadas NOT_IMPLEMENTED lanzan, para que
// el contrato no se rompa silenciosamente cuando se implementen.

import { describe, expect, it } from 'vitest';

import { createRng } from './dice';
import {
  ATTRIBUTE_IDS,
  computeDefense,
  computeLuck,
  createCharacter,
  ONBOARDING_FLAGS,
  type AttributeBlock,
  type CreateCharacterInput,
} from './character';
import {
  applyCharacterAction,
  applyDamageToCharacter,
  applyDamageToEnemy,
  applyEnemyTurn,
  buildAttackInputFromCharacter,
  buildAttackInputFromEnemy,
  compareInitiative,
  computeHitThreshold,
  resolveAttack,
  rollInitiativeForCharacter,
  rollInitiativeForEnemy,
  startCombat,
  type Enemy,
  type EnemyState,
} from './combat';
import { deathByEnemy, endRunWithVictory, killCharacter, type Epitaph } from './death';
import {
  advanceClock,
  createClock,
  getTimeOfDay,
  TIME_RULES,
} from './time';
import {
  createWorldRng,
  generateFreeWorld,
  generateHistoryWorld,
  hashSeedPhrase,
  type NodeId,
  type WorldMap,
} from './world-gen';
import { isEdgeTraversable, planFastTravel, resolveTravel } from './fast-travel';
import {
  rollExplorationTick,
  type BiomeId,
  type BiomeTable,
  type WorldState,
} from './exploration';
import {
  adjustReputation,
  getReputation,
  getReputationTier,
} from './faction';
import {
  attemptSocialCheck,
  getAvailableTopics,
  previewSocialCheck,
  type Npc,
} from './dialog';
import {
  checkAchievements,
  grantAchievements,
  type Achievement,
} from './achievements';
import {
  attemptCraft,
  computeOutcomeProbabilities,
  findRecipeByResources,
  rollCraftCheck,
  type Recipe,
} from './crafting';
import {
  addItem,
  createEmptyInventory,
  decreaseEquipmentDurability,
  equipFromSlot,
  equippedWeapon,
  totalDefenseBonus,
  unequip,
  type Item,
} from './inventory';

// -----------------------------------------------------------------------------
// Helpers compartidos
// -----------------------------------------------------------------------------

function makeBalancedAttributes(): AttributeBlock {
  // 12 puntos repartidos: FUE 4, DES 2, CON 3, INT 2, VOL 1. Suma = 12.
  const block: Record<string, number> = { fue: 4, des: 2, con: 3, int: 2, vol: 1 };
  // Garantía de que el helper respeta el contrato del esquema.
  for (const id of ATTRIBUTE_IDS) {
    if (block[id] === undefined) throw new Error('Helper roto');
  }
  return block as AttributeBlock;
}

function makeTestCharacter() {
  const input: CreateCharacterInput = {
    id: 'pj-smoke',
    name: 'Smoke',
    portraitId: 'p01',
    archetype: null,
    attributes: makeBalancedAttributes(),
    skills: { armas_cuerpo_a_cuerpo: 3, atletismo: 2 },
    perks: ['perk-test'],
    location: { mapId: 'mapa-test', x: 5, y: 5 },
  };
  return createCharacter(input);
}

function makeWeakEnemy(): Enemy {
  return {
    id: 'lobo',
    name: 'Lobo',
    level: 1,
    attack_pool: 2,
    defense_threshold: 1,
    weapon_damage: 2,
    initiative_base: 1,
    hp_max: 3,
  };
}

function makeEnemyState(template: Enemy, instance_id = 'lobo#1'): EnemyState {
  return {
    enemy_id: template.id,
    instance_id,
    hp: template.hp_max,
    alive: true,
    statuses: [],
  };
}

// -----------------------------------------------------------------------------
// 1. Combate end-to-end (módulos implementados)
// -----------------------------------------------------------------------------

describe('smoke: ciclo de combate básico', () => {
  it('PJ ataca a enemigo, le baja HP y lo mata', () => {
    const rng = createRng(0xdead_beef);
    const character = makeTestCharacter();
    const enemyTemplate = makeWeakEnemy();
    let enemyState = makeEnemyState(enemyTemplate);

    // PJ ataca: pool desde character (FUE=4 con arma provisional puños).
    // Defensa del enemigo viene de su threshold ya resuelto.
    const characterDefense = computeDefense(character.attributes);
    expect(characterDefense).toBe(2 + Math.floor(2 / 2));

    const attackInput = buildAttackInputFromCharacter(
      character,
      enemyTemplate.defense_threshold + 2,
    );
    expect(attackInput.attacker_pool).toBe(4);

    // Bucle hasta matar (cota dura para no infinitizar si el RNG hace estragos).
    let safety = 50;
    while (enemyState.alive && safety-- > 0) {
      const result = resolveAttack(rng, attackInput);
      if (result.hit) enemyState = applyDamageToEnemy(enemyState, result.damage);
    }
    expect(enemyState.alive).toBe(false);
    expect(enemyState.hp).toBe(0);
  });

  it('Enemigo golpea al PJ y el PJ acaba muerto con epitafio', () => {
    const rng = createRng(0xbeef_face);
    let character = makeTestCharacter();
    const enemyTemplate = makeWeakEnemy();

    const characterDefense = computeDefense(character.attributes);
    const attackInput = buildAttackInputFromEnemy(enemyTemplate, characterDefense);

    let safety = 200;
    while (character.alive && safety-- > 0) {
      const result = resolveAttack(rng, attackInput);
      if (result.hit) character = applyDamageToCharacter(character, result.damage);
    }
    expect(character.alive).toBe(false);
    expect(character.hp.current).toBe(0);

    // Epitafio: muerte por enemigo concreto, escrito desde death.ts.
    const cause = deathByEnemy(enemyTemplate.id, enemyTemplate.name);
    const dead = killCharacter(character, cause, '2026-04-26T13:00:00Z');
    expect(dead.alive).toBe(false);
    expect(dead.epitaph).not.toBeNull();
    const epitaph = dead.epitaph as Epitaph;
    expect(epitaph.cause.kind).toBe('killed_by_enemy');
    expect(epitaph.cause.agent_id).toBe('lobo');
    expect(epitaph.ended_at_map_id).toBe('mapa-test');
    expect(epitaph.ended_at_x).toBe(5);
    expect(epitaph.ended_at_y).toBe(5);
  });

  it('killCharacter rechaza personajes vivos', () => {
    const character = makeTestCharacter();
    expect(() =>
      killCharacter(character, deathByEnemy('x', 'X'), '2026-04-26T00:00:00Z'),
    ).toThrow(/sigue vivo/);
  });

  it('Iniciativa del PJ y del enemigo se calculan en rangos coherentes', () => {
    const rng = createRng(7);
    const character = makeTestCharacter();
    const enemy = makeWeakEnemy();
    const pjInit = rollInitiativeForCharacter(character, rng);
    const enInit = rollInitiativeForEnemy(enemy, rng);
    // PJ: DES (2) + d20 ∈ [3, 22]. Enemy: base (1) + d20 ∈ [2, 21]. Comprobamos rango.
    expect(pjInit).toBeGreaterThanOrEqual(3);
    expect(pjInit).toBeLessThanOrEqual(22);
    expect(enInit).toBeGreaterThanOrEqual(2);
    expect(enInit).toBeLessThanOrEqual(21);
  });
});

// -----------------------------------------------------------------------------
// Decisión #46 — threshold de impacto = ceil(DEF/3)
// -----------------------------------------------------------------------------

describe('decisión #46: computeHitThreshold = ceil(DEF/3)', () => {
  it('reproduce los thresholds que validaron el dado de combate (v0.2)', () => {
    // Validados en simulaciones/dado-combate-v0.2.md.
    expect(computeHitThreshold(4)).toBe(2);
    expect(computeHitThreshold(8)).toBe(3);
    expect(computeHitThreshold(12)).toBe(4);
  });

  it('garantiza threshold mínimo 1 (DEF 0-3 nunca dan 0 éxitos requeridos)', () => {
    expect(computeHitThreshold(0)).toBe(1);
    expect(computeHitThreshold(1)).toBe(1);
    expect(computeHitThreshold(3)).toBe(1);
  });
});

// -----------------------------------------------------------------------------
// Decisión #41 — desempate de iniciativa
// -----------------------------------------------------------------------------

describe('decisión #41: compareInitiative resuelve empates', () => {
  it('mayor tirada de iniciativa va antes', () => {
    const a = { is_character: true, des_or_base: 4, rolled_initiative: 18 };
    const b = { is_character: false, des_or_base: 4, rolled_initiative: 12 };
    expect(compareInitiative(a, b)).toBeLessThan(0);
    expect(compareInitiative(b, a)).toBeGreaterThan(0);
  });

  it('a igualdad de tirada, mayor DES gana', () => {
    const a = { is_character: true, des_or_base: 5, rolled_initiative: 15 };
    const b = { is_character: false, des_or_base: 3, rolled_initiative: 15 };
    expect(compareInitiative(a, b)).toBeLessThan(0);
  });

  it('a igualdad de tirada y DES, PJ va antes que enemigo', () => {
    const a = { is_character: true, des_or_base: 4, rolled_initiative: 15 };
    const b = { is_character: false, des_or_base: 4, rolled_initiative: 15 };
    expect(compareInitiative(a, b)).toBeLessThan(0);
    expect(compareInitiative(b, a)).toBeGreaterThan(0);
  });

  it('dos contestants idénticos devuelve 0', () => {
    const a = { is_character: true, des_or_base: 4, rolled_initiative: 15 };
    const b = { is_character: true, des_or_base: 4, rolled_initiative: 15 };
    expect(compareInitiative(a, b)).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// Decisión #43 — Suerte derivada
// -----------------------------------------------------------------------------

describe('decisión #43: computeLuck', () => {
  it('promedio de INT y VOL menos floor(level/10)', () => {
    const c = makeTestCharacter();
    // INT 2, VOL 1 → mental = floor(3/2) = 1. Level 1 → decay = 0. luck = 1.
    expect(computeLuck(c)).toBe(1);
  });

  it('decae con el nivel a partir de 10', () => {
    const c1 = { ...makeTestCharacter(), level: 9 };
    const c2 = { ...makeTestCharacter(), level: 10 };
    const c3 = { ...makeTestCharacter(), level: 20 };
    expect(computeLuck(c1)).toBe(1); // mental 1, decay 0
    expect(computeLuck(c2)).toBe(0); // mental 1, decay 1
    expect(computeLuck(c3)).toBe(-1); // mental 1, decay 2
  });

  it('puede ser negativa con builds extremos a alto nivel', () => {
    // Build extremo: INT 1, VOL 1 (mental 1), nivel 30 → decay 3 → luck = -2.
    const c = createCharacter({
      id: 'bruto', name: 'Bruto', portraitId: 'p', archetype: null,
      attributes: { fue: 4, des: 4, con: 2, int: 1, vol: 1 },
      skills: {}, perks: ['p1'],
      location: { mapId: 'm', x: 0, y: 0 },
    });
    const high = { ...c, level: 30 };
    expect(computeLuck(high)).toBe(-2);
  });
});

// -----------------------------------------------------------------------------
// Decisión #44 — Condición de victoria
// -----------------------------------------------------------------------------

describe('decisión #44: endRunWithVictory', () => {
  it('cierra la partida con epitafio kind=victory conservando HP final', () => {
    const c = makeTestCharacter();
    const won = endRunWithVictory(c, 'quest-final', '¡Victoria!', '2026-04-26T00:00:00Z');
    expect(won.alive).toBe(false);
    expect(won.epitaph).not.toBeNull();
    expect(won.epitaph!.cause.kind).toBe('victory');
    expect(won.epitaph!.cause.agent_id).toBe('quest-final');
    // Conserva HP, no obliga a 0 (al revés que killCharacter).
    expect(won.epitaph!.final_character.hp.current).toBe(c.hp.current);
  });
});

// -----------------------------------------------------------------------------
// Decisión #45 — Flags de onboarding reservadas
// -----------------------------------------------------------------------------

describe('decisión #45: ONBOARDING_FLAGS', () => {
  it('expone los dos flags de la decisión binaria', () => {
    expect(ONBOARDING_FLAGS.viajero_audaz).toBe('viajero_audaz');
    expect(ONBOARDING_FLAGS.viajero_cauto).toBe('viajero_cauto');
  });
});

// -----------------------------------------------------------------------------
// 2. Reloj y tiempo
// -----------------------------------------------------------------------------

describe('smoke: reloj del mundo', () => {
  it('avanza día completo y vuelve a dawn', () => {
    let clock = createClock('clear');
    expect(getTimeOfDay(clock)).toBe('dawn');
    clock = advanceClock(clock, TIME_RULES.ticksPerSlot);
    expect(getTimeOfDay(clock)).toBe('day');
    clock = advanceClock(clock, TIME_RULES.ticksPerSlot);
    expect(getTimeOfDay(clock)).toBe('dusk');
    clock = advanceClock(clock, TIME_RULES.ticksPerSlot);
    expect(getTimeOfDay(clock)).toBe('night');
    clock = advanceClock(clock, TIME_RULES.ticksPerSlot);
    expect(getTimeOfDay(clock)).toBe('dawn');
    expect(clock.day).toBe(1);
    expect(clock.tick_in_day).toBe(0);
  });

  it('rechaza ticks negativos', () => {
    expect(() => advanceClock(createClock(), -1)).toThrow(/ticks debe ser entero/);
  });
});

// -----------------------------------------------------------------------------
// 3. Hash de semilla y RNG del mundo
// -----------------------------------------------------------------------------

describe('smoke: semilla del mundo', () => {
  it('mismo phrase produce mismo hash', () => {
    expect(hashSeedPhrase('una tormenta sobre el glaciar')).toBe(
      hashSeedPhrase('una tormenta sobre el glaciar'),
    );
  });

  it('phrases distintos producen hashes distintos', () => {
    const a = hashSeedPhrase('una tormenta sobre el glaciar');
    const b = hashSeedPhrase('una tormenta sobre el desierto');
    expect(a).not.toBe(b);
  });

  it('createWorldRng es determinista para un mundo dado', () => {
    const fakeWorld: WorldMap = {
      id: 'fake',
      mode: 'free',
      seed_phrase: 'test',
      seed_hash: hashSeedPhrase('test'),
      nodes: [],
      edges: [],
      clock: createClock(),
    };
    const r1 = createWorldRng(fakeWorld);
    const r2 = createWorldRng(fakeWorld);
    expect(r1()).toBe(r2());
    expect(r1()).toBe(r2());
  });
});

// -----------------------------------------------------------------------------
// 4. Tirada de exploración con tabla mínima
// -----------------------------------------------------------------------------

describe('smoke: tirada de exploración con tabla mínima', () => {
  it('tira y devuelve un evento con auditoría completa', () => {
    const rng = createRng(42);
    const character = makeTestCharacter();
    const worldState: WorldState = {
      biome: 'bosque',
      time_of_day: 'day',
      weather: 'clear',
      faction_reputation: {},
      flags: {},
      luck: 0,
    };
    const table: BiomeTable = {
      biome: 'bosque',
      entries: [
        {
          id: 'nada-bosque',
          biome: 'bosque',
          weight: 70,
          conditions: {},
          type: 'nothing',
          payload: {},
          evade_check: null,
        },
        {
          id: 'lobos',
          biome: 'bosque',
          weight: 30,
          conditions: {},
          type: 'combat',
          payload: { enemy_group: 'lobos_3' },
          evade_check: null,
        },
      ],
    };
    const event = rollExplorationTick(worldState, character, 'step_tile', table, rng);
    expect(event.entry).not.toBeNull();
    expect(['nothing', 'combat']).toContain(event.entry!.type);
    expect(event.weighted_entries).toHaveLength(2);
    expect(event.root_roll.die).toBeGreaterThanOrEqual(1);
    expect(event.root_roll.die).toBeLessThanOrEqual(20);
  });
});

// -----------------------------------------------------------------------------
// 5. Reputación de facciones
// -----------------------------------------------------------------------------

describe('smoke: facciones', () => {
  it('subir reputación cambia el tier', () => {
    let character = makeTestCharacter();
    expect(getReputationTier(getReputation(character, 'gremio'))).toBe('neutral');
    character = adjustReputation(character, {
      faction_id: 'gremio',
      delta: 60,
      reason: 'Misión cumplida',
    });
    expect(getReputation(character, 'gremio')).toBe(60);
    expect(getReputationTier(60)).toBe('honored');
  });
});

// -----------------------------------------------------------------------------
// 6. Diálogos: filtrado de topics y tirada social
// -----------------------------------------------------------------------------

describe('smoke: diálogos', () => {
  const npc: Npc = {
    id: 'mercader',
    name: 'Mercader',
    portrait_id: 'm01',
    faction_id: 'gremio',
    shop_inventory_id: null,
    topics: [
      {
        id: 'saludo',
        label: 'Saludar',
        response: 'Hola viajero.',
        conditions: {},
        social_check: null,
      },
      {
        id: 'rebajar-precio',
        label: 'Pedir descuento',
        response: 'Mis precios son justos.',
        conditions: {},
        social_check: {
          skill: 'persuasion',
          difficulty: 12,
          on_success_response: 'Está bien, 10% menos.',
          on_failure_response: 'Ni hablar.',
        },
      },
    ],
  };

  it('lista topics elegibles', () => {
    const character = makeTestCharacter();
    const topics = getAvailableTopics(npc, character);
    expect(topics.map((t) => t.id)).toEqual(['saludo', 'rebajar-precio']);
  });

  it('preview de social check estima probabilidad sin tirar', () => {
    const character = makeTestCharacter();
    const topic = npc.topics[1]!;
    const preview = previewSocialCheck(topic.social_check!, character);
    // Sin habilidad persuasion: skill_value = 0, dif 12. P = (21+0-12)/20 = 0.45.
    expect(preview.skill_value).toBe(0);
    expect(preview.estimated_success).toBeCloseTo(0.45, 5);
  });

  it('tirada social devuelve respuesta apropiada', () => {
    const rng = createRng(123);
    const character = makeTestCharacter();
    const topic = npc.topics[1]!;
    const result = attemptSocialCheck(topic, character, rng);
    expect(['success', 'failure']).toContain(result.branch);
    expect([
      'Está bien, 10% menos.',
      'Ni hablar.',
    ]).toContain(result.applied_response);
  });
});

// -----------------------------------------------------------------------------
// 7. Logros (observador)
// -----------------------------------------------------------------------------

describe('smoke: logros', () => {
  const catalog: Achievement[] = [
    {
      id: 'first-blood',
      title: 'Primera sangre',
      description: 'Mata a tu primer enemigo.',
      predicate: (_c, t) => t.kind === 'enemy_killed',
    },
    {
      id: 'level-2',
      title: 'Aprendiz',
      description: 'Alcanza el nivel 2.',
      predicate: (_c, t) =>
        t.kind === 'level_reached' && (t.payload['level'] as number) >= 2,
    },
  ];

  it('detecta logros desbloqueables y los aplica idempotentemente', () => {
    let character = makeTestCharacter();
    const newly = checkAchievements(character, {
      kind: 'enemy_killed',
      payload: { enemy_id: 'lobo' },
    }, catalog);
    expect(newly).toEqual(['first-blood']);

    character = grantAchievements(character, newly);
    expect(character.achievements).toEqual(['first-blood']);

    // Re-evaluar el mismo trigger no duplica el logro.
    const again = checkAchievements(character, {
      kind: 'enemy_killed',
      payload: { enemy_id: 'lobo' },
    }, catalog);
    expect(again).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// 8. Crafteo: tirada del check (parte implementada)
// -----------------------------------------------------------------------------

describe('smoke: crafteo (sólo rollCraftCheck implementado)', () => {
  const recipe: Recipe = {
    id: 'venda_simple',
    resources: { tela: 1, hierba: 1 },
    skill_check: { skill: 'primeros_auxilios', difficulty: 10 },
    station: null,
    time_hours: 0,
    outputs: {
      success: { item: 'venda', quantity: 2 },
      critical: { item: 'venda_esteril', quantity: 2 },
      failure: { resources_lost: 0.5, time_lost: 0 },
    },
  };

  it('rollCraftCheck devuelve rama coherente con la tirada', () => {
    const rng = createRng(5);
    const character = makeTestCharacter();
    const result = rollCraftCheck(recipe, character, rng);
    expect(result.die).toBeGreaterThanOrEqual(1);
    expect(result.die).toBeLessThanOrEqual(20);
    expect(result.total).toBe(result.die + result.skill_value);
    if (result.die === 20) expect(result.branch).toBe('critical');
    else if (result.total >= 10) expect(result.branch).toBe('success');
    else expect(result.branch).toBe('failure');
  });
});

// -----------------------------------------------------------------------------
// 9. Inventario implementado (Ronda 3)
// -----------------------------------------------------------------------------

describe('smoke: inventario operativo', () => {
  const tela: Item = {
    id: 'tela', name: 'Tela', category: 'material', rarity: 'common',
    slot: null, stack_size: 10, max_durability: null, weight: 0.1, stats: {},
  };
  const espada: Item = {
    id: 'espada_basica', name: 'Espada básica', category: 'weapon', rarity: 'common',
    slot: 'main_hand', stack_size: 1, max_durability: 50, weight: 2,
    stats: { weapon_damage: 3, weapon_attribute: 'fue', weapon_skill: 'armas_cuerpo_a_cuerpo' },
  };
  const cota: Item = {
    id: 'cota', name: 'Cota de malla', category: 'armor', rarity: 'common',
    slot: 'torso', stack_size: 1, max_durability: 100, weight: 5,
    stats: { defense_bonus: 3 },
  };
  const catalog = { tela, espada_basica: espada, cota };

  it('createEmptyInventory tiene 20 slots null y equipped vacío', () => {
    const inv = createEmptyInventory();
    expect(inv.slots).toHaveLength(20);
    expect(inv.slots.every((s) => s === null)).toBe(true);
    expect(inv.equipped).toEqual({});
  });

  it('addItem apila apilables y crea pila nueva si overflow', () => {
    let inv = createEmptyInventory();
    inv = addItem(inv, { item_id: 'tela', quantity: 7, durability: null }, catalog);
    inv = addItem(inv, { item_id: 'tela', quantity: 5, durability: null }, catalog);
    // 12 unidades de tela con stack_size 10 → 1 pila de 10 + 1 pila de 2.
    const pilas = inv.slots.filter((s) => s !== null);
    expect(pilas).toHaveLength(2);
    expect(pilas.map((s) => s!.quantity).sort((a, b) => a - b)).toEqual([2, 10]);
  });

  it('addItem rechaza pilas >1 de items con durabilidad', () => {
    expect(() =>
      addItem(createEmptyInventory(), { item_id: 'espada_basica', quantity: 2, durability: 50 }, catalog),
    ).toThrow(/STACK_OVERFLOW/);
  });

  it('equipFromSlot mueve a equipped y libera slot', () => {
    let inv = createEmptyInventory();
    inv = addItem(inv, { item_id: 'espada_basica', quantity: 1, durability: 50 }, catalog);
    const slotIdx = inv.slots.findIndex((s) => s !== null);
    inv = equipFromSlot(inv, slotIdx, 'main_hand', catalog);
    expect(inv.equipped.main_hand?.item_id).toBe('espada_basica');
    expect(inv.slots[slotIdx]).toBeNull();
  });

  it('equipFromSlot hace swap correcto cuando ya hay arma equipada', () => {
    let inv = createEmptyInventory();
    inv = addItem(inv, { item_id: 'espada_basica', quantity: 1, durability: 50 }, catalog);
    inv = equipFromSlot(inv, inv.slots.findIndex((s) => s !== null), 'main_hand', catalog);
    inv = addItem(inv, { item_id: 'espada_basica', quantity: 1, durability: 30 }, catalog);
    inv = equipFromSlot(inv, inv.slots.findIndex((s) => s !== null), 'main_hand', catalog);
    expect(inv.equipped.main_hand?.durability).toBe(30);
    // La espada con durabilidad 50 debe haber vuelto al inventario.
    const swapped = inv.slots.find((s) => s !== null && s.durability === 50);
    expect(swapped).toBeDefined();
  });

  it('decreaseEquipmentDurability llega a 0 sin destruir', () => {
    let inv = createEmptyInventory();
    inv = addItem(inv, { item_id: 'espada_basica', quantity: 1, durability: 5 }, catalog);
    inv = equipFromSlot(inv, inv.slots.findIndex((s) => s !== null), 'main_hand', catalog);
    inv = decreaseEquipmentDurability(inv, 'main_hand', 100);
    expect(inv.equipped.main_hand?.durability).toBe(0);
    // La espada SIGUE equipada, no se destruye (biblia §4.12).
    expect(inv.equipped.main_hand).toBeDefined();
  });

  it('totalDefenseBonus suma armadura, ignora items con dur=0', () => {
    let inv = createEmptyInventory();
    inv = addItem(inv, { item_id: 'cota', quantity: 1, durability: 100 }, catalog);
    inv = equipFromSlot(inv, inv.slots.findIndex((s) => s !== null), 'torso', catalog);
    expect(totalDefenseBonus(inv, catalog)).toBe(3);
    inv = decreaseEquipmentDurability(inv, 'torso', 100);
    expect(totalDefenseBonus(inv, catalog)).toBe(0);
  });

  it('equippedWeapon devuelve null si no hay arma o si está inservible', () => {
    let inv = createEmptyInventory();
    expect(equippedWeapon(inv, catalog)).toBeNull();
    inv = addItem(inv, { item_id: 'espada_basica', quantity: 1, durability: 1 }, catalog);
    inv = equipFromSlot(inv, inv.slots.findIndex((s) => s !== null), 'main_hand', catalog);
    expect(equippedWeapon(inv, catalog)?.id).toBe('espada_basica');
    inv = decreaseEquipmentDurability(inv, 'main_hand', 100);
    expect(equippedWeapon(inv, catalog)).toBeNull();
  });

  it('unequip devuelve al inventario, lanza si no hay hueco', () => {
    let inv = createEmptyInventory();
    inv = addItem(inv, { item_id: 'espada_basica', quantity: 1, durability: 50 }, catalog);
    inv = equipFromSlot(inv, inv.slots.findIndex((s) => s !== null), 'main_hand', catalog);
    inv = unequip(inv, 'main_hand');
    expect(inv.equipped.main_hand).toBeUndefined();
    expect(inv.slots.find((s) => s !== null && s.item_id === 'espada_basica')).toBeDefined();
  });
});

// -----------------------------------------------------------------------------
// 10. Combate operativo (Ronda 3)
// -----------------------------------------------------------------------------

describe('smoke: combate por turnos completo', () => {
  it('startCombat ordena turnos por iniciativa, applyCharacterAction y applyEnemyTurn corren hasta victoria', () => {
    const rng = createRng(0xcafe);
    const character = makeTestCharacter();
    const enemy = makeWeakEnemy();
    const enemyState = makeEnemyState(enemy, 'lobo#1');
    const templates = { lobo: enemy };

    let state = startCombat(character, [enemyState], templates, rng);
    expect(state.status).toBe('ongoing');
    expect(state.turn_order).toHaveLength(2);
    // Iniciativas ordenadas descendentes.
    expect(state.turn_order[0]!.initiative).toBeGreaterThanOrEqual(state.turn_order[1]!.initiative);

    let safety = 50;
    while (state.status === 'ongoing' && safety-- > 0) {
      const turn = state.turn_order[state.current_turn_index]!;
      if (turn.actor === 'character') {
        // Buscar primer enemigo vivo para targeting.
        const target = state.enemies.find((e) => e.alive);
        if (target === undefined) break;
        state = applyCharacterAction(
          state,
          { kind: 'attack', target_instance_id: target.instance_id },
          templates,
          rng,
        );
      } else {
        state = applyEnemyTurn(state, templates, rng);
      }
    }
    expect(['victory', 'defeat']).toContain(state.status);
  });

  it('applyCharacterAction rechaza acción no implementada', () => {
    const rng = createRng(1);
    const character = makeTestCharacter();
    const enemy = makeWeakEnemy();
    const state = startCombat(character, [makeEnemyState(enemy)], { lobo: enemy }, rng);
    expect(() =>
      applyCharacterAction(state, { kind: 'flee' }, { lobo: enemy }, rng),
    ).toThrow(/no implementada/);
  });

  it('combate con arma equipada usa el daño del arma, no puños', () => {
    const espada: Item = {
      id: 'espada', name: 'Espada', category: 'weapon', rarity: 'common',
      slot: 'main_hand', stack_size: 1, max_durability: 50, weight: 2,
      stats: { weapon_damage: 5, weapon_attribute: 'fue', weapon_skill: 'armas_cuerpo_a_cuerpo' },
    };
    const catalog = { espada };
    let character = makeTestCharacter();
    character = {
      ...character,
      inventory: addItem(
        character.inventory,
        { item_id: 'espada', quantity: 1, durability: 50 },
        catalog,
      ),
    };
    const slotIdx = character.inventory.slots.findIndex((s) => s !== null);
    character = {
      ...character,
      inventory: equipFromSlot(character.inventory, slotIdx, 'main_hand', catalog),
    };

    // PJ tiene FUE 4 + skill armas_cuerpo_a_cuerpo 3 → pool 7. Daño base 5.
    const input = buildAttackInputFromCharacter(character, 4, catalog);
    expect(input.attacker_pool).toBe(7);
    expect(input.weapon_damage).toBe(5);
  });
});

// -----------------------------------------------------------------------------
// 11. Crafteo operativo (Ronda 3)
// -----------------------------------------------------------------------------

describe('smoke: crafteo operativo', () => {
  const recipe: Recipe = {
    id: 'venda_simple',
    resources: { tela: 1, hierba: 1 },
    skill_check: { skill: 'primeros_auxilios', difficulty: 12 },
    station: null,
    time_hours: 0,
    outputs: {
      success: { item: 'venda', quantity: 2 },
      critical: { item: 'venda_esteril', quantity: 2 },
      failure: { resources_lost: 0.5, time_lost: 0 },
    },
  };

  it('computeOutcomeProbabilities suma 1 y refleja el d20', () => {
    const c = makeTestCharacter();
    const probs = computeOutcomeProbabilities(recipe, c);
    expect(probs.success + probs.critical + probs.failure).toBeCloseTo(1, 5);
    expect(probs.critical).toBeCloseTo(0.05, 5);
    // Sin habilidad: difficulty 12, minDie 12 → success caras 12..19 = 8 / 20 = 0.40.
    expect(probs.success).toBeCloseTo(0.40, 5);
  });

  it('attemptCraft produce iteraciones consistentes con la rama', () => {
    const c = makeTestCharacter();
    const result = attemptCraft(
      { recipe_id: 'venda_simple', iterations: 5, current_station: null },
      recipe,
      c,
      createRng(11),
    );
    expect(result.iterations).toHaveLength(5);
    for (const it of result.iterations) {
      if (it.branch === 'success') expect(it.produced?.item_id).toBe('venda');
      if (it.branch === 'critical') expect(it.produced?.item_id).toBe('venda_esteril');
      if (it.branch === 'failure') expect(it.produced).toBeNull();
    }
  });

  it('attemptCraft rechaza station incorrecta', () => {
    const stationRecipe: Recipe = { ...recipe, station: 'forge' };
    expect(() =>
      attemptCraft(
        { recipe_id: 'venda_simple', iterations: 1, current_station: null },
        stationRecipe,
        makeTestCharacter(),
        createRng(1),
      ),
    ).toThrow(/STATION_REQUIRED/);
  });

  it('attemptCraft rechaza iterations fuera de [1, 10]', () => {
    expect(() =>
      attemptCraft(
        { recipe_id: 'venda_simple', iterations: 11, current_station: null },
        recipe,
        makeTestCharacter(),
        createRng(1),
      ),
    ).toThrow(/INVALID_ITERATIONS/);
  });

  it('findRecipeByResources matchea exactamente o devuelve null', () => {
    const catalog = { venda_simple: recipe };
    expect(findRecipeByResources({ tela: 1, hierba: 1 }, catalog)).toBe('venda_simple');
    // Cantidad incorrecta:
    expect(findRecipeByResources({ tela: 2, hierba: 1 }, catalog)).toBeNull();
    // Falta un material:
    expect(findRecipeByResources({ tela: 1 }, catalog)).toBeNull();
    // Material extra:
    expect(findRecipeByResources({ tela: 1, hierba: 1, otro: 1 }, catalog)).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// 12. World-gen + fast-travel operativos (Ronda 3)
// -----------------------------------------------------------------------------

describe('smoke: world-gen historia + fast-travel', () => {
  it('generateHistoryWorld devuelve grafo coherente', () => {
    const world = generateHistoryWorld();
    expect(world.mode).toBe('history');
    expect(world.id).toBe('history_v1');
    expect(world.nodes.length).toBeGreaterThanOrEqual(4);
    // Aristas bidireccionales: cada par produce 2 edges.
    expect(world.edges.length).toBeGreaterThanOrEqual(6);
    // Capital es ciudad y tiene facción dominante.
    const capital = world.nodes.find((n) => n.id === 'ciudad_capital');
    expect(capital?.kind).toBe('city');
    expect(capital?.dominant_faction).toBe('reino');
  });

  it('generateFreeWorld sigue NOT_IMPLEMENTED (sesión de diseño dedicada)', () => {
    expect(() => generateFreeWorld('test')).toThrow(/NOT_IMPLEMENTED/);
  });

  it('planFastTravel construye camino BFS hasta nodo descubierto', () => {
    const world = generateHistoryWorld();
    const discovered = new Set<NodeId>(['ciudad_capital', 'exterior_llano', 'mazmorra_bosque']);
    const plan = planFastTravel(world, 'ciudad_capital', 'mazmorra_bosque', discovered);
    expect(plan.legs).toHaveLength(2);
    expect(plan.legs[0]!.to).toBe('exterior_llano');
    expect(plan.legs[1]!.to).toBe('mazmorra_bosque');
    expect(plan.has_risky).toBe(true);
    expect(plan.total_ticks).toBeGreaterThan(0);
  });

  it('planFastTravel rechaza destino no descubierto', () => {
    const world = generateHistoryWorld();
    const discovered = new Set<NodeId>(['ciudad_capital']);
    expect(() =>
      planFastTravel(world, 'ciudad_capital', 'mazmorra_bosque', discovered),
    ).toThrow(/no descubierto/);
  });

  it('isEdgeTraversable refleja descubrimiento', () => {
    const world = generateHistoryWorld();
    const edge = world.edges[0]!;
    const character = makeTestCharacter();
    expect(isEdgeTraversable(edge, character, new Set())).toBe(false);
    expect(isEdgeTraversable(edge, character, new Set([edge.to]))).toBe(true);
  });

  it('resolveTravel con leg arriesgado dispara tirada con la tabla del bioma', () => {
    const world = generateHistoryWorld();
    const discovered = new Set<NodeId>(['ciudad_capital', 'exterior_llano', 'mazmorra_bosque']);
    const plan = planFastTravel(world, 'ciudad_capital', 'mazmorra_bosque', discovered);

    const tablaBosque: BiomeTable = {
      biome: 'bosque',
      entries: [
        { id: 'nada', biome: 'bosque', weight: 100, conditions: {}, type: 'nothing', payload: {}, evade_check: null },
      ],
    };
    const tablaLlanura: BiomeTable = {
      biome: 'llanura',
      entries: [
        { id: 'nada', biome: 'llanura', weight: 100, conditions: {}, type: 'nothing', payload: {}, evade_check: null },
      ],
    };
    const tableLookup = (biome: BiomeId): BiomeTable => {
      if (biome === 'bosque') return tablaBosque;
      if (biome === 'llanura') return tablaLlanura;
      throw new Error(`Sin tabla para ${biome}`);
    };

    const baseWorldState: WorldState = {
      biome: 'llanura', time_of_day: 'day', weather: 'clear',
      faction_reputation: {}, flags: {}, luck: 0,
    };
    const resolution = resolveTravel(plan, makeTestCharacter(), baseWorldState, tableLookup, createRng(7));
    // Llegamos al destino porque la tabla sólo tiene 'nothing' (no interrumpe).
    expect(resolution.final_node).toBe('mazmorra_bosque');
    expect(resolution.summaries).toHaveLength(2);
    // Leg seguro: sin events. Leg arriesgado: 1 event (provisional).
    expect(resolution.summaries[0]!.events).toHaveLength(0);
    expect(resolution.summaries[1]!.events).toHaveLength(1);
  });
});
