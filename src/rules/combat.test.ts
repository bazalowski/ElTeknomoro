// Tests del bucle de turnos del módulo SAGRADO `rules/combat.ts`. H3, sub-paso
// 4a.2 (integración del tick de statuses en applyCharacterAction y applyEnemyTurn).
//
// Estos tests construyen CombatState a mano para aislar el comportamiento del
// tick: bleeding al inicio, poisoned al final, stunned consume turno, y
// muerte por DoT cierra el combate sin procesar la acción / el ataque.
//
// Decisión #75 (motor intocable): no se modifica resolveAttack, rollCombatPool
// ni computeHitThreshold. El tick es ortogonal al pool d6.
//
// Simetría PJ ↔ enemigo: cada caso clave tiene su gemelo en el otro lado.

import { describe, expect, it } from 'vitest';

import { createRng } from './dice';
import {
  createCharacter,
  type Character,
  type CreateCharacterInput,
} from './character';
import {
  applyCharacterAction,
  applyEnemyTurn,
  type CombatState,
  type CombatantTurn,
  type Enemy,
  type EnemyId,
  type EnemyState,
} from './combat';
import { applyStatus, type StatusEffect } from './statuses';

// -----------------------------------------------------------------------------
// Factories
// -----------------------------------------------------------------------------

function makeCharacter(overrides: Partial<CreateCharacterInput> = {}): Character {
  const input: CreateCharacterInput = {
    id: 'pj-combat-test',
    name: 'Probador',
    portraitId: 'portrait-01',
    archetype: 'guerrero',
    attributes: { fue: 4, des: 3, con: 2, int: 2, vol: 1 },
    skills: { armas_cuerpo_a_cuerpo: 3 },
    perks: ['perk-test'],
    location: { mapId: 'test', x: 0, y: 0 },
    ...overrides,
  };
  return createCharacter(input);
}

// Enemigo "muñeco": no impacta nunca (pool 0), no aguanta nada cuando lo
// matamos por DoT (hp_max ajustable), defense_threshold trivial.
function makeDummyEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'dummy',
    name: 'Muñeco',
    level: 1,
    attack_pool: 0,
    defense_threshold: 1,
    weapon_damage: 0,
    initiative_base: 0,
    hp_max: 100,
    ...overrides,
  };
}

function makeEnemyState(
  template: Enemy,
  instance_id = 'dummy#1',
  hp = template.hp_max,
  statuses: readonly StatusEffect[] = [],
): EnemyState {
  return {
    enemy_id: template.id,
    instance_id,
    hp,
    alive: hp > 0,
    statuses,
  };
}

// Construye un CombatState de prueba con turn_order controlado por el caller.
// Usar esto evita que startCombat tire iniciativas y altere el orden esperado.
function makeCombatState(
  character: Character,
  enemies: readonly EnemyState[],
  turn_order: readonly CombatantTurn[],
  current_turn_index = 0,
): CombatState {
  return {
    character,
    enemies,
    turn_order,
    current_turn_index,
    status: 'ongoing',
  };
}

// Helper: aplica un StatusEffect al PJ devolviendo Character mutado.
function withStatus(character: Character, effect: StatusEffect): Character {
  return applyStatus(character, effect);
}

function withEnemyStatus(enemy: EnemyState, effect: StatusEffect): EnemyState {
  return applyStatus(enemy, effect);
}

const RNG = () => createRng(1);

// Templates / catálogos: el tests no necesita catálogo (puños), pero sí
// necesita el mapa de plantillas para que applyCharacterAction resuelva
// targetTemplate.
function templatesOf(...enemies: Enemy[]): Readonly<Record<EnemyId, Enemy>> {
  const map: Record<EnemyId, Enemy> = {};
  for (const e of enemies) map[e.id] = e;
  return map;
}

// =============================================================================
// PJ — bleeding mortal antes de actuar
// =============================================================================

describe('applyCharacterAction — DoT mata al PJ antes de actuar', () => {
  it('PJ con bleeding fatal muere por DoT al inicio del turno; no se procesa la acción', () => {
    // PJ con HP exactamente 1 y bleeding mag 1 → muere por el tick start.
    const baseChar = makeCharacter();
    let character: Character = {
      ...baseChar,
      hp: { current: 1, max: baseChar.hp.max },
    };
    character = withStatus(character, { kind: 'bleeding', remaining: 3, magnitude: 1 });

    const dummy = makeDummyEnemy();
    const enemy = makeEnemyState(dummy, 'dummy#1', 50);
    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );

    const after = applyCharacterAction(
      state,
      { kind: 'attack', target_instance_id: 'dummy#1' },
      templatesOf(dummy),
      RNG(),
    );

    expect(after.status).toBe('defeat');
    expect(after.character.alive).toBe(false);
    expect(after.character.hp.current).toBe(0);
    // El enemigo NO recibió daño: la acción no se procesó.
    expect(after.enemies[0]!.hp).toBe(50);
    // El turno NO avanzó: el PJ sigue siendo el actor "actual" (irrelevante
    // tras defeat, pero importante como invariante: nada cambió tras la muerte).
    expect(after.current_turn_index).toBe(0);
  });

  it('ciclo bleeding 3 turnos: PJ con HP suficiente acumula exactamente 3 de daño total', () => {
    // HP_max suficiente para aguantar 3 ticks de 1: arrancamos con HP=10.
    // El bleeding entra con remaining=3 y magnitud=1. Tras 3 turnos completos
    // del PJ (tick start + acción + tick end), HP = 7 y el bleeding ha expirado.
    const baseChar = makeCharacter();
    let character: Character = {
      ...baseChar,
      hp: { current: 10, max: 10 },
    };
    character = withStatus(character, { kind: 'bleeding', remaining: 3, magnitude: 1 });

    const dummy = makeDummyEnemy({ hp_max: 1000 });
    const enemy = makeEnemyState(dummy, 'dummy#1', 1000);
    let state = makeCombatState(
      character,
      [enemy],
      // PJ va y vuelve sin que el dummy aporte (su initiative es la más baja
      // pero usamos current_turn_index=0 siempre; cuando avanza, el otro turno
      // sería el dummy, que no nos preocupa: lo simulamos volviendo a current=0).
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );

    for (let turn = 1; turn <= 3; turn++) {
      state = applyCharacterAction(
        state,
        { kind: 'attack', target_instance_id: 'dummy#1' },
        templatesOf(dummy),
        RNG(),
      );
      // Forzamos que el siguiente turno vuelva a ser del PJ (omitimos al dummy).
      state = { ...state, current_turn_index: 0 };
    }

    expect(state.status).toBe('ongoing');
    expect(state.character.alive).toBe(true);
    // 3 ticks de 1 = 3 daño total.
    expect(state.character.hp.current).toBe(7);
    // El bleeding ha expirado tras el tercer tick fin de turno.
    expect(state.character.statuses.find((s) => s.kind === 'bleeding')).toBeUndefined();
  });
});

// =============================================================================
// Enemigo — bleeding mortal al inicio de su turno
// =============================================================================

describe('applyEnemyTurn — DoT mata al enemigo antes de atacar', () => {
  it('enemigo con bleeding muere por DoT al inicio de su turno; no ataca; victoria si era el último', () => {
    const character = makeCharacter();
    const dummy = makeDummyEnemy({ attack_pool: 6, weapon_damage: 5 });
    // HP del enemigo = 1, bleeding mag 1 → muere al tick start de su turno.
    let enemy = makeEnemyState(dummy, 'dummy#1', 1);
    enemy = withEnemyStatus(enemy, { kind: 'bleeding', remaining: 3, magnitude: 1 });

    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'dummy#1', initiative: 10 }, { actor: 'character', initiative: 0 }],
      0,
    );

    const characterHpBefore = state.character.hp.current;

    const after = applyEnemyTurn(state, templatesOf(dummy), RNG());

    // Era el último enemigo vivo → victoria.
    expect(after.status).toBe('victory');
    expect(after.enemies[0]!.alive).toBe(false);
    expect(after.enemies[0]!.hp).toBe(0);
    // El PJ NO recibió daño: el enemigo no llegó a atacar.
    expect(after.character.hp.current).toBe(characterHpBefore);
  });
});

// =============================================================================
// PJ stunned — pierde el próximo turno
// =============================================================================

describe('applyCharacterAction — stunned consume el turno del PJ', () => {
  it('PJ con stunned (remaining=1) pierde EXACTAMENTE su próximo turno', () => {
    const character = withStatus(
      makeCharacter(),
      { kind: 'stunned', remaining: 1, magnitude: 0 },
    );

    const dummy = makeDummyEnemy({ hp_max: 50 });
    const enemy = makeEnemyState(dummy, 'dummy#1', 50);
    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );

    const after = applyCharacterAction(
      state,
      { kind: 'attack', target_instance_id: 'dummy#1' },
      templatesOf(dummy),
      RNG(),
    );

    // El combate sigue abierto.
    expect(after.status).toBe('ongoing');
    // El enemigo NO recibió daño: el PJ no llegó a atacar.
    expect(after.enemies[0]!.hp).toBe(50);
    // El turno avanzó al siguiente actor (el dummy).
    expect(after.current_turn_index).toBe(1);
    expect(after.turn_order[after.current_turn_index]!.actor).toBe('dummy#1');
    // El stunned ha desaparecido tras el tick end.
    expect(after.character.statuses.find((s) => s.kind === 'stunned')).toBeUndefined();
  });
});

// =============================================================================
// Enemigo stunned — no ataca al PJ
// =============================================================================

describe('applyEnemyTurn — stunned consume el turno del enemigo', () => {
  it('enemigo con stunned no ataca al PJ y avanza turno', () => {
    const character = makeCharacter();
    const characterHpBefore = character.hp.current;

    const dummy = makeDummyEnemy({ attack_pool: 6, weapon_damage: 5 });
    let enemy = makeEnemyState(dummy, 'dummy#1', 50);
    enemy = withEnemyStatus(enemy, { kind: 'stunned', remaining: 1, magnitude: 0 });

    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'dummy#1', initiative: 10 }, { actor: 'character', initiative: 0 }],
      0,
    );

    const after = applyEnemyTurn(state, templatesOf(dummy), RNG());

    expect(after.status).toBe('ongoing');
    // El PJ NO recibió daño.
    expect(after.character.hp.current).toBe(characterHpBefore);
    // El enemigo sigue vivo (stunned no daña) y su HP intacto.
    expect(after.enemies[0]!.alive).toBe(true);
    expect(after.enemies[0]!.hp).toBe(50);
    // El stunned ha desaparecido.
    expect(after.enemies[0]!.statuses.find((s) => s.kind === 'stunned')).toBeUndefined();
    // El turno avanzó al PJ.
    expect(after.current_turn_index).toBe(1);
    expect(after.turn_order[after.current_turn_index]!.actor).toBe('character');
  });
});

// =============================================================================
// Poisoned — tickea al final del turno (no al inicio)
// =============================================================================

describe('Poisoned tickea al FINAL del turno (no al inicio)', () => {
  it('PJ con HP=1 y poisoned (mag 1, remaining 1) muere al FINAL del turno (tras actuar), no al inicio', () => {
    // El PJ debe poder actuar antes de morir por veneno: el daño llega al cerrar
    // su turno. Esto es la diferencia clave entre bleeding y poisoned.
    const baseChar = makeCharacter();
    let character: Character = {
      ...baseChar,
      hp: { current: 1, max: baseChar.hp.max },
    };
    character = withStatus(character, { kind: 'poisoned', remaining: 1, magnitude: 1 });

    const dummy = makeDummyEnemy({ hp_max: 50 });
    const enemy = makeEnemyState(dummy, 'dummy#1', 50);
    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );

    const after = applyCharacterAction(
      state,
      { kind: 'attack', target_instance_id: 'dummy#1' },
      templatesOf(dummy),
      RNG(),
    );

    // El PJ muere por DoT al final → defeat.
    expect(after.status).toBe('defeat');
    expect(after.character.alive).toBe(false);
    expect(after.character.hp.current).toBe(0);
    // PERO el ataque del PJ SÍ se procesó antes de morir: el enemigo recibió
    // daño. Es la prueba clave de "tras actuar" vs "antes de actuar".
    expect(after.enemies[0]!.hp).toBeLessThan(50);
  });
});

// =============================================================================
// Bleeding y poisoned coexisten en el mismo combatiente
// =============================================================================

describe('Bleeding y poisoned coexisten correctamente en el mismo combatiente', () => {
  it('un PJ con bleeding y poisoned recibe ambos daños en el mismo turno (start + end)', () => {
    const baseChar = makeCharacter();
    let character: Character = {
      ...baseChar,
      hp: { current: 10, max: 10 },
    };
    character = withStatus(character, { kind: 'bleeding', remaining: 3, magnitude: 2 });
    character = withStatus(character, { kind: 'poisoned', remaining: 3, magnitude: 1 });

    const dummy = makeDummyEnemy({ hp_max: 1000 });
    const enemy = makeEnemyState(dummy, 'dummy#1', 1000);
    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );

    const after = applyCharacterAction(
      state,
      { kind: 'attack', target_instance_id: 'dummy#1' },
      templatesOf(dummy),
      RNG(),
    );

    // En un turno PJ: tick start (bleeding mag 2 → -2) + acción + tick end
    // (poisoned mag 1 → -1). HP = 10 - 2 - 1 = 7.
    expect(after.status).toBe('ongoing');
    expect(after.character.alive).toBe(true);
    expect(after.character.hp.current).toBe(7);
    // Ambos statuses siguen presentes (decremento uniforme: remaining 3 → 2).
    const bleeding = after.character.statuses.find((s) => s.kind === 'bleeding');
    const poisoned = after.character.statuses.find((s) => s.kind === 'poisoned');
    expect(bleeding).toBeDefined();
    expect(poisoned).toBeDefined();
    expect(bleeding!.remaining).toBe(2);
    expect(poisoned!.remaining).toBe(2);
  });

  it('un enemigo con bleeding y poisoned recibe ambos daños en el mismo turno (simetría)', () => {
    const character = makeCharacter();
    const dummy = makeDummyEnemy({ attack_pool: 0, weapon_damage: 0, hp_max: 10 });
    let enemy = makeEnemyState(dummy, 'dummy#1', 10);
    enemy = withEnemyStatus(enemy, { kind: 'bleeding', remaining: 3, magnitude: 2 });
    enemy = withEnemyStatus(enemy, { kind: 'poisoned', remaining: 3, magnitude: 1 });

    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'dummy#1', initiative: 10 }, { actor: 'character', initiative: 0 }],
      0,
    );

    const after = applyEnemyTurn(state, templatesOf(dummy), RNG());

    expect(after.status).toBe('ongoing');
    const enemyAfter = after.enemies[0]!;
    expect(enemyAfter.alive).toBe(true);
    // tick start -2, ataque (no daña al PJ), tick end -1. HP = 10 - 3 = 7.
    expect(enemyAfter.hp).toBe(7);
    expect(enemyAfter.statuses.find((s) => s.kind === 'bleeding')!.remaining).toBe(2);
    expect(enemyAfter.statuses.find((s) => s.kind === 'poisoned')!.remaining).toBe(2);
  });
});

// =============================================================================
// Caso compuesto: bleeding mata al PJ en el último tick antes de actuar
// =============================================================================

describe('Caso compuesto: bleeding mata al PJ en su último tick (antes de actuar)', () => {
  it('PJ con HP=1 y bleeding remaining=2 → muere al inicio del PRIMER turno; no avanza el bleed', () => {
    // Caso límite: el bleeding podría haber sobrevivido (remaining=2), pero el
    // PJ muere al primer tick start. Verifica que la regla "muere antes de
    // actuar" prima sobre cualquier procesamiento posterior.
    const baseChar = makeCharacter();
    let character: Character = {
      ...baseChar,
      hp: { current: 1, max: baseChar.hp.max },
    };
    character = withStatus(character, { kind: 'bleeding', remaining: 2, magnitude: 1 });

    const dummy = makeDummyEnemy({ hp_max: 50 });
    const enemy = makeEnemyState(dummy, 'dummy#1', 50);
    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );

    const after = applyCharacterAction(
      state,
      { kind: 'attack', target_instance_id: 'dummy#1' },
      templatesOf(dummy),
      RNG(),
    );

    expect(after.status).toBe('defeat');
    expect(after.character.alive).toBe(false);
    // El bleeding NO se decrementa porque el tick end no se ejecuta tras la
    // muerte por tick start. Es la regla "muere antes de actuar": NO hay
    // procesamiento posterior.
    expect(after.character.statuses.find((s) => s.kind === 'bleeding')!.remaining).toBe(2);
    // El enemigo intacto.
    expect(after.enemies[0]!.hp).toBe(50);
  });
});
