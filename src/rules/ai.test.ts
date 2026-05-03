// Tests deterministas de la IA táctica de enemigos. Sin RNG (la decisión es
// pura). Cada test fija un estado mínimo (enemy + template + character) y
// comprueba que el intent emitido respeta la regla del perfil.

import { describe, it, expect } from 'vitest';
import { decideEnemyAction, CAUTELOSO_HP_DEFEND_THRESHOLD, type AIProfile } from './ai';
import type { Enemy, EnemyState } from './combat';
import type { Character } from './character';
import type { StatusEffect } from './statuses';

// -----------------------------------------------------------------------------
// Builders
// -----------------------------------------------------------------------------

function buildTemplate(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'tpl_test',
    name: 'Test',
    level: 1,
    attack_pool: 3,
    defense_threshold: 3,
    weapon_damage: 2,
    initiative_base: 4,
    hp_max: 16,
    ai_profile: 'agresivo',
    ...overrides,
  };
}

function buildEnemyState(
  overrides: Partial<EnemyState> = {},
  templateHpMax = 16,
): EnemyState {
  return {
    enemy_id: 'tpl_test',
    instance_id: 'tpl_test#1',
    hp: templateHpMax,
    alive: true,
    statuses: [],
    intent: null,
    ...overrides,
  };
}

// Character mínimo: sólo importa `statuses` para los tests del perfil toxico;
// el resto de campos no se consultan en `decideEnemyAction`. Lo construimos
// vacío y casteamos: NO usamos createCharacter porque eso pondría perks/etc
// que no afectan a la decisión y haría los tests más lentos.
function buildCharacter(statuses: readonly StatusEffect[] = []): Character {
  return {
    id: 'pj-test',
    name: 'Test',
    portraitId: 'portrait-01',
    archetype: null,
    attributes: { fue: 1, des: 1, con: 1, int: 1, vol: 1 },
    skills: {},
    perks: [],
    level: 1,
    xp: 0,
    gold: 0,
    hp: { current: 10, max: 10 },
    inventory: { slots: [], equipped: {} },
    location: { mapId: 'historia-01', x: 0, y: 0 },
    faction_reputation: {},
    achievements: [],
    flags: {},
    alive: true,
    epitaph: null,
    pending: { attribute: 0, skill: 0, perk: 0 },
    statuses,
  } as unknown as Character;
}

const dodging: StatusEffect = { kind: 'dodging', remaining: 2, magnitude: 2 };
const poisoned: StatusEffect = { kind: 'poisoned', remaining: 3, magnitude: 1 };

// -----------------------------------------------------------------------------
// agresivo
// -----------------------------------------------------------------------------

describe('decideEnemyAction / agresivo', () => {
  it('siempre devuelve attack al PJ, sin importar HP propio', () => {
    const template = buildTemplate();
    const character = buildCharacter();
    const profile: AIProfile = 'agresivo';

    // HP llenos.
    let intent = decideEnemyAction(buildEnemyState(), template, character, profile);
    expect(intent.kind).toBe('attack');
    if (intent.kind === 'attack') expect(intent.target).toBe('character');

    // HP al 1 (casi muerto).
    intent = decideEnemyAction(
      buildEnemyState({ hp: 1 }),
      template,
      character,
      profile,
    );
    expect(intent.kind).toBe('attack');
  });

  it('attack incluye estimated_damage_min/max coherentes con el template', () => {
    const template = buildTemplate({ weapon_damage: 2, attack_pool: 3 });
    const intent = decideEnemyAction(
      buildEnemyState(),
      template,
      buildCharacter(),
      'agresivo',
    );
    if (intent.kind !== 'attack') throw new Error('intent debería ser attack');
    expect(intent.estimated_damage_min).toBe(2); // weapon_damage + margen 0
    // max = (weapon_damage + (attack_pool - 1)) * 2 = (2 + 2) * 2 = 8
    expect(intent.estimated_damage_max).toBe(8);
    expect(intent.estimated_damage_max).toBeGreaterThanOrEqual(intent.estimated_damage_min);
  });

  it('cota de daño máximo es coherente con attack_pool=0 (caso degenerado)', () => {
    const template = buildTemplate({ weapon_damage: 1, attack_pool: 0 });
    const intent = decideEnemyAction(
      buildEnemyState(),
      template,
      buildCharacter(),
      'agresivo',
    );
    if (intent.kind !== 'attack') throw new Error('intent debería ser attack');
    expect(intent.estimated_damage_min).toBe(1);
    expect(intent.estimated_damage_max).toBe(2); // (1 + 0) * 2
  });
});

// -----------------------------------------------------------------------------
// evasor
// -----------------------------------------------------------------------------

describe('decideEnemyAction / evasor', () => {
  const template = buildTemplate();
  const character = buildCharacter();

  it('sin dodging activo → apply_status_self dodging', () => {
    const intent = decideEnemyAction(
      buildEnemyState({ statuses: [] }),
      template,
      character,
      'evasor',
    );
    expect(intent.kind).toBe('apply_status_self');
    if (intent.kind === 'apply_status_self') expect(intent.status).toBe('dodging');
  });

  it('con dodging activo → attack', () => {
    const intent = decideEnemyAction(
      buildEnemyState({ statuses: [dodging] }),
      template,
      character,
      'evasor',
    );
    expect(intent.kind).toBe('attack');
  });

  it('NO consulta HP para decidir (alterna sólo por statuses)', () => {
    // HP al 1 pero sin dodging → sigue siendo apply_status_self.
    const intent = decideEnemyAction(
      buildEnemyState({ hp: 1, statuses: [] }),
      template,
      character,
      'evasor',
    );
    expect(intent.kind).toBe('apply_status_self');
  });
});

// -----------------------------------------------------------------------------
// cauteloso
// -----------------------------------------------------------------------------

describe('decideEnemyAction / cauteloso', () => {
  const template = buildTemplate({ hp_max: 16 });
  const character = buildCharacter();

  it('HP > 50% → attack', () => {
    // hp/hp_max = 9/16 = 0.5625 > 0.5
    const intent = decideEnemyAction(
      buildEnemyState({ hp: 9 }, 16),
      template,
      character,
      'cauteloso',
    );
    expect(intent.kind).toBe('attack');
  });

  it('HP exactamente 50% → defiende (la regla es HP > 50% para atacar)', () => {
    // 8/16 = 0.5 → no es > 0.5 → defiende
    const intent = decideEnemyAction(
      buildEnemyState({ hp: 8 }, 16),
      template,
      character,
      'cauteloso',
    );
    expect(intent.kind).toBe('apply_status_self');
    if (intent.kind === 'apply_status_self') expect(intent.status).toBe('dodging');
  });

  it('HP por debajo del 50% → apply_status_self dodging', () => {
    const intent = decideEnemyAction(
      buildEnemyState({ hp: 4 }, 16),
      template,
      character,
      'cauteloso',
    );
    expect(intent.kind).toBe('apply_status_self');
    if (intent.kind === 'apply_status_self') expect(intent.status).toBe('dodging');
  });

  it('CAUTELOSO_HP_DEFEND_THRESHOLD es 0.5 (constante exportada)', () => {
    // Ancla la decisión cerrada en el briefing. Si alguien la cambia, este
    // test cae y obliga a actualizar el briefing.
    expect(CAUTELOSO_HP_DEFEND_THRESHOLD).toBe(0.5);
  });
});

// -----------------------------------------------------------------------------
// toxico
// -----------------------------------------------------------------------------

describe('decideEnemyAction / toxico', () => {
  const template = buildTemplate();

  it('PJ sin poisoned → apply_status_target poisoned al PJ', () => {
    const character = buildCharacter([]);
    const intent = decideEnemyAction(
      buildEnemyState(),
      template,
      character,
      'toxico',
    );
    expect(intent.kind).toBe('apply_status_target');
    if (intent.kind === 'apply_status_target') {
      expect(intent.status).toBe('poisoned');
      expect(intent.target).toBe('character');
    }
  });

  it('PJ con poisoned activo → attack (no aplica status duplicado)', () => {
    const character = buildCharacter([poisoned]);
    const intent = decideEnemyAction(
      buildEnemyState(),
      template,
      character,
      'toxico',
    );
    expect(intent.kind).toBe('attack');
  });

  it('toxico NO aplica veneno a sí mismo: target es siempre character', () => {
    // Auditoría F1: la acción es separada y dirigida AL PJ, no al enemigo.
    // Si el día de mañana se añade un perfil "auto-buff con veneno" sería un
    // perfil distinto, no toxico.
    const character = buildCharacter([]);
    const intent = decideEnemyAction(
      buildEnemyState(),
      template,
      character,
      'toxico',
    );
    if (intent.kind !== 'apply_status_target') {
      throw new Error('intent debería ser apply_status_target');
    }
    expect(intent.target).toBe('character');
  });
});

// -----------------------------------------------------------------------------
// Defensa: enemigo muerto
// -----------------------------------------------------------------------------

describe('decideEnemyAction / validación defensiva', () => {
  it('lanza si el enemigo no está vivo', () => {
    expect(() =>
      decideEnemyAction(
        buildEnemyState({ alive: false, hp: 0 }),
        buildTemplate(),
        buildCharacter(),
        'agresivo',
      ),
    ).toThrow(/no está vivo/);
  });

  it('lanza si el enemigo tiene hp ≤ 0 aunque alive=true (estado inconsistente)', () => {
    expect(() =>
      decideEnemyAction(
        buildEnemyState({ alive: true, hp: 0 }),
        buildTemplate(),
        buildCharacter(),
        'agresivo',
      ),
    ).toThrow(/no está vivo/);
  });
});

// -----------------------------------------------------------------------------
// Determinismo
// -----------------------------------------------------------------------------

describe('decideEnemyAction / determinismo', () => {
  it('mismo (enemy, template, character, profile) → mismo intent', () => {
    const template = buildTemplate();
    const enemy = buildEnemyState();
    const character = buildCharacter();
    const a = decideEnemyAction(enemy, template, character, 'agresivo');
    const b = decideEnemyAction(enemy, template, character, 'agresivo');
    expect(a).toEqual(b);
  });

  it('los 4 perfiles emiten intents distinguibles ante un mismo estado base', () => {
    // Estado: enemigo a HP completo, PJ sin statuses. La decisión esperada por perfil:
    //   agresivo  → attack
    //   evasor    → apply_status_self (no tiene dodging)
    //   cauteloso → attack (HP completo > 50%)
    //   toxico    → apply_status_target (PJ sin poisoned)
    const template = buildTemplate();
    const enemy = buildEnemyState();
    const character = buildCharacter();
    expect(decideEnemyAction(enemy, template, character, 'agresivo').kind).toBe('attack');
    expect(decideEnemyAction(enemy, template, character, 'evasor').kind).toBe('apply_status_self');
    expect(decideEnemyAction(enemy, template, character, 'cauteloso').kind).toBe('attack');
    expect(decideEnemyAction(enemy, template, character, 'toxico').kind).toBe('apply_status_target');
  });
});
