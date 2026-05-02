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

import { createRng, type Rng } from './dice';
import {
  createCharacter,
  type Character,
  type CreateCharacterInput,
} from './character';
import {
  applyCharacterAction,
  applyEnemyTurn,
  defensiveThresholdBonus,
  type CombatState,
  type CombatantTurn,
  type Enemy,
  type EnemyId,
  type EnemyState,
} from './combat';
import {
  applyStatus,
  STATUS_DEFAULT_DURATION,
  STATUS_DEFAULT_MAGNITUDE,
  type StatusEffect,
} from './statuses';

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

// =============================================================================
// 4a.3 — dodge como acción de primera clase + modificador +1 al threshold
// =============================================================================
//
// Decisión cerrada (4a.3):
//   - dodge es acción de primera clase del motor (applyCharacterAction).
//   - Aplica `dodging` con remaining = STATUS_DEFAULT_DURATION.dodging + 1 = 2
//     (el +1 compensa el tickEnd del propio turno donde se aplica).
//   - Mientras `dodging` esté activo, el threshold del atacante sube +1 fijo.
//   - El bono lo aplica el motor en BOTH lados (PJ→enemigo y enemigo→PJ): una
//     sola fuente de verdad (defensiveThresholdBonus). Decisión #75 sagrada
//     intacta: ni rollCombatPool ni computeHitThreshold se modifican.
//
// Estrategia de RNG en estos tests: usamos un RNG controlado que devuelve
// siempre un número que produce caras 4 (éxito sin crítico). Construyendo el
// pool con N dados sabemos que habrá EXACTAMENTE N éxitos, sin sixes (sin
// crítico). Esto permite afirmar "con threshold N acierta, con threshold N+1
// falla" sin depender de seeds opacas.

// RNG controlado: cada llamada devuelve un valor fijo. floor(0.5*6)+1 = 4 →
// éxito (≥4) sin crítico (no es 6). El RNG es determinista y no consume
// semilla: cada test que lo use sabe exactamente cuántos éxitos saldrán.
function constantRng(value: number): Rng {
  return () => value;
}

// Atajo: RNG que produce siempre cara 4 (éxito, no crit).
const RNG_ALL_FOURS = (): Rng => constantRng(0.5);

// =============================================================================
// dodge — la acción aplica el status dodging y avanza turno
// =============================================================================

describe('applyCharacterAction — dodge aplica status `dodging` y avanza turno', () => {
  it('PJ ejecuta dodge: status dodging presente con magnitud y duración esperadas; turno avanza al enemigo', () => {
    const character = makeCharacter();
    const dummy = makeDummyEnemy({ attack_pool: 0 });
    const enemy = makeEnemyState(dummy, 'dummy#1', 50);
    const state = makeCombatState(
      character,
      [enemy],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );

    const after = applyCharacterAction(
      state,
      { kind: 'dodge' },
      templatesOf(dummy),
      RNG(),
    );

    expect(after.status).toBe('ongoing');
    // El turno avanzó al siguiente actor vivo.
    expect(after.current_turn_index).toBe(1);
    expect(after.turn_order[after.current_turn_index]!.actor).toBe('dummy#1');
    // El status `dodging` está activo. remaining = SEMANTIC_DURATION + 1 - 1
    // (porque el tickEnd del propio turno PJ ya lo decrementó). Lo que vemos
    // tras el turno PJ debe ser remaining = 1, NO 2.
    const dodging = after.character.statuses.find((s) => s.kind === 'dodging');
    expect(dodging).toBeDefined();
    expect(dodging!.remaining).toBe(STATUS_DEFAULT_DURATION.dodging); // 1 tras tickEnd
    expect(dodging!.magnitude).toBe(STATUS_DEFAULT_MAGNITUDE.dodging);
    // El enemigo no recibió daño: dodge no daña.
    expect(after.enemies[0]!.hp).toBe(50);
  });
});

// =============================================================================
// Modificador +1 al threshold cuando el defensor tiene `dodging`
// =============================================================================

describe('Modificador +1 al threshold cuando defensor tiene dodging', () => {
  it('PJ con dodging activo: ataque enemigo con N éxitos justos contra threshold base N falla con +1', () => {
    // Construcción manual del caso límite:
    //   - defender_threshold del PJ = 3 (base).
    //   - enemy.attack_pool = 3 dados, RNG=constantRng(0.5) → 3 éxitos exactos.
    //   - Sin dodging: 3 éxitos vs threshold 3 → margin 0 → HIT (margen 0).
    //   - Con dodging: 3 éxitos vs threshold 4 → margin -1 → MISS.
    //
    // Para forzar threshold base 3 del PJ, usamos un PJ con DES tal que
    // computeDefense devuelva 9: DES=14 → DEF = 2 + floor(14/2) + 0 = 9 →
    // threshold = ceil(9/3) = 3. Pero attributeAbsoluteCap=7. Truco: anulamos
    // el cap con un Character literal.
    //
    // Más limpio: construimos PJ con DES 4 (DEF=4, threshold=ceil(4/3)=2) y
    // un attack_pool de 2 → 2 éxitos vs threshold 2 (HIT margen 0); con
    // dodging threshold 3 → MISS (margen -1). Mismo razonamiento, números
    // dentro del cap legal.

    const baseChar = makeCharacter({
      attributes: { fue: 4, des: 4, con: 2, int: 1, vol: 1 }, // DEF = 2+2 = 4 → threshold 2
    });
    const enemy = makeDummyEnemy({
      attack_pool: 2, // 2 dados → 2 éxitos exactos con RNG_ALL_FOURS
      weapon_damage: 5,
      hp_max: 100,
    });
    const enemyState = makeEnemyState(enemy, 'dummy#1', 100);

    // Estado base: PJ sin dodging, turno del enemigo. El ataque enemigo debe
    // impactar (margen 0).
    const stateNoDodge = makeCombatState(
      baseChar,
      [enemyState],
      [{ actor: 'dummy#1', initiative: 10 }, { actor: 'character', initiative: 0 }],
      0,
    );
    const hpBefore = stateNoDodge.character.hp.current;
    const afterNoDodge = applyEnemyTurn(stateNoDodge, templatesOf(enemy), RNG_ALL_FOURS());
    // HIT con margen 0 → daño = weapon_damage + 0 = 5.
    expect(afterNoDodge.character.hp.current).toBe(hpBefore - 5);

    // Ahora con dodging activo: threshold sube a 3, los mismos 2 éxitos NO
    // alcanzan → margen -1 → MISS, daño 0.
    const charWithDodge = withStatus(baseChar, {
      kind: 'dodging',
      remaining: 5, // suficiente para que no expire en este test
      magnitude: STATUS_DEFAULT_MAGNITUDE.dodging,
    });
    const stateWithDodge = makeCombatState(
      charWithDodge,
      [enemyState],
      [{ actor: 'dummy#1', initiative: 10 }, { actor: 'character', initiative: 0 }],
      0,
    );
    const hpBeforeDodge = stateWithDodge.character.hp.current;
    const afterWithDodge = applyEnemyTurn(stateWithDodge, templatesOf(enemy), RNG_ALL_FOURS());
    expect(afterWithDodge.character.hp.current).toBe(hpBeforeDodge); // miss → 0 daño
  });

  it('control negativo: PJ sin dodging recibe el mismo ataque y SÍ acierta', () => {
    // Mismo escenario que arriba pero sin dodging. Asegura que el efecto
    // medido era atribuible al status, no a otra cosa.
    const character = makeCharacter({
      attributes: { fue: 4, des: 4, con: 2, int: 1, vol: 1 },
    });
    const enemy = makeDummyEnemy({
      attack_pool: 2,
      weapon_damage: 5,
      hp_max: 100,
    });
    const enemyState = makeEnemyState(enemy, 'dummy#1', 100);
    const state = makeCombatState(
      character,
      [enemyState],
      [{ actor: 'dummy#1', initiative: 10 }, { actor: 'character', initiative: 0 }],
      0,
    );
    const hpBefore = state.character.hp.current;

    const after = applyEnemyTurn(state, templatesOf(enemy), RNG_ALL_FOURS());

    // 2 éxitos vs threshold 2 → HIT margen 0 → daño 5.
    expect(after.character.hp.current).toBe(hpBefore - 5);
    expect(after.character.alive).toBe(true);
  });

  it('dodging dura exactamente 1 ataque enemigo: turno N+2 ya no aplica el bono', () => {
    // Secuencia completa:
    //   Turno N (PJ): dodge → status dodging con remaining 2 → tickEnd → 1.
    //   Turno N+1 (enemigo): ataque ve dodging (remaining 1) → +1 threshold.
    //     enemy.attack_pool=2, RNG=constantRng(0.5) → 2 éxitos vs threshold
    //     base 2 + 1 = 3 → MISS. Tras este turno enemigo, dodging del PJ
    //     SIGUE en remaining=1 (el tickEnd del enemigo NO toca al PJ).
    //   Turno N+2 (PJ): tickStart no afecta dodging. Si el PJ vuelve a
    //     atacar, tickEnd PJ decrementa remaining 1 → 0 → expira.
    //   Turno N+3 (enemigo): mismo ataque, ya SIN dodging → threshold base 2
    //     → 2 éxitos vs 2 → HIT (margen 0) → daño 5.

    const baseChar = makeCharacter({
      attributes: { fue: 4, des: 4, con: 2, int: 1, vol: 1 }, // threshold base 2
    });
    const enemy = makeDummyEnemy({
      attack_pool: 2,
      weapon_damage: 5,
      hp_max: 1000, // que no muera por nuestros ataques
    });
    const enemyState = makeEnemyState(enemy, 'dummy#1', 1000);

    // Turno N — PJ dodge.
    let state = makeCombatState(
      baseChar,
      [enemyState],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );
    state = applyCharacterAction(
      state,
      { kind: 'dodge' },
      templatesOf(enemy),
      RNG_ALL_FOURS(),
    );
    expect(state.current_turn_index).toBe(1); // turno del enemigo
    expect(state.character.statuses.find((s) => s.kind === 'dodging')?.remaining).toBe(1);

    // Turno N+1 — enemigo ataca: con dodging activo el threshold sube → MISS.
    const hpBeforeEnemy = state.character.hp.current;
    state = applyEnemyTurn(state, templatesOf(enemy), RNG_ALL_FOURS());
    expect(state.character.hp.current).toBe(hpBeforeEnemy); // miss
    expect(state.current_turn_index).toBe(0); // de vuelta al PJ
    // El dodging sigue presente: el tickEnd del enemigo NO lo decrementa.
    expect(state.character.statuses.find((s) => s.kind === 'dodging')?.remaining).toBe(1);

    // Turno N+2 — PJ ataca al enemigo. Tras este turno, su tickEnd decrementa
    // dodging 1 → 0 y expira.
    state = applyCharacterAction(
      state,
      { kind: 'attack', target_instance_id: 'dummy#1' },
      templatesOf(enemy),
      RNG_ALL_FOURS(),
    );
    expect(state.character.statuses.find((s) => s.kind === 'dodging')).toBeUndefined();

    // Turno N+3 — enemigo ataca de nuevo: ya NO hay dodging → HIT esperado.
    const hpBeforeSecondEnemy = state.character.hp.current;
    state = applyEnemyTurn(state, templatesOf(enemy), RNG_ALL_FOURS());
    expect(state.character.hp.current).toBe(hpBeforeSecondEnemy - 5); // hit margen 0 → daño 5
  });
});

// =============================================================================
// Simetría: enemigo con dodging hace que el ataque del PJ tenga +1 threshold
// =============================================================================

describe('Simetría — enemigo con dodging eleva el threshold del ataque del PJ', () => {
  it('PJ ataca a enemigo con dodging: threshold +1 basta para fallar el ataque borderline', () => {
    // Construcción simétrica al caso PJ:
    //   - Enemigo con defense_threshold 2.
    //   - PJ con attacker_pool 2 (FUE 2 sin arma → puños = FUE+0). RNG fijo
    //     → 2 éxitos. Sin dodging del enemigo: HIT margen 0 → daño 1 (puños).
    //     Con dodging del enemigo: threshold 3, 2 éxitos → MISS.

    const character = makeCharacter({
      // Pool obligatorio = 12. FUE=2 fija el attacker_pool con puños; el resto
      // del presupuesto se reparte sin afectar al test (DES alto sube DEF del
      // PJ, pero aquí el PJ es atacante, no defensor).
      attributes: { fue: 2, des: 4, con: 4, int: 1, vol: 1 },
      // skills omitido → puños puros, attacker_pool = FUE = 2.
      skills: {},
    });
    const enemy = makeDummyEnemy({
      attack_pool: 0,
      defense_threshold: 2,
      weapon_damage: 0,
      hp_max: 50,
    });

    // Sin dodging del enemigo: HIT.
    const enemyNoDodge = makeEnemyState(enemy, 'dummy#1', 50);
    const stateNoDodge = makeCombatState(
      character,
      [enemyNoDodge],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );
    const afterNoDodge = applyCharacterAction(
      stateNoDodge,
      { kind: 'attack', target_instance_id: 'dummy#1' },
      templatesOf(enemy),
      RNG_ALL_FOURS(),
    );
    // HIT margen 0, weapon_damage puños = 1 → enemigo a 49.
    expect(afterNoDodge.enemies[0]!.hp).toBe(49);

    // Con dodging del enemigo: MISS.
    const enemyWithDodge = withEnemyStatus(makeEnemyState(enemy, 'dummy#1', 50), {
      kind: 'dodging',
      remaining: 5,
      magnitude: STATUS_DEFAULT_MAGNITUDE.dodging,
    });
    const stateWithDodge = makeCombatState(
      character,
      [enemyWithDodge],
      [{ actor: 'character', initiative: 10 }, { actor: 'dummy#1', initiative: 0 }],
      0,
    );
    const afterWithDodge = applyCharacterAction(
      stateWithDodge,
      { kind: 'attack', target_instance_id: 'dummy#1' },
      templatesOf(enemy),
      RNG_ALL_FOURS(),
    );
    expect(afterWithDodge.enemies[0]!.hp).toBe(50); // intacto: miss
  });
});

// =============================================================================
// defensiveThresholdBonus — helper público auditable
// =============================================================================

describe('defensiveThresholdBonus — capa externa pura', () => {
  it('devuelve 0 sin dodging', () => {
    const c = makeCharacter();
    expect(defensiveThresholdBonus(c)).toBe(0);
  });

  it('devuelve +1 con dodging activo (independiente de la magnitude del effect)', () => {
    const c1 = withStatus(makeCharacter(), {
      kind: 'dodging',
      remaining: 1,
      magnitude: 0,
    });
    expect(defensiveThresholdBonus(c1)).toBe(1);

    // Aunque el effect llegue con magnitude alta (ej. legacy del orquestador),
    // el bono real es +1 fijo. La magnitude del effect no se lee.
    const c2 = withStatus(makeCharacter(), {
      kind: 'dodging',
      remaining: 1,
      magnitude: 99,
    });
    expect(defensiveThresholdBonus(c2)).toBe(1);
  });

  it('aplica simétricamente a EnemyState', () => {
    const enemy = makeEnemyState(makeDummyEnemy(), 'dummy#1', 10);
    expect(defensiveThresholdBonus(enemy)).toBe(0);
    const enemyDodging = withEnemyStatus(enemy, {
      kind: 'dodging',
      remaining: 1,
      magnitude: STATUS_DEFAULT_MAGNITUDE.dodging,
    });
    expect(defensiveThresholdBonus(enemyDodging)).toBe(1);
  });
});
