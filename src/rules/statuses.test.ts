import { describe, it, expect } from 'vitest';
import {
  applyStatus,
  clearAllStatuses,
  hasStatus,
  STATUS_DEFAULT_DURATION,
  STATUS_DEFAULT_MAGNITUDE,
  tickStatusesAtTurnEnd,
  tickStatusesAtTurnStart,
  type StatusBearer,
  type StatusEffect,
} from './statuses';
import { createCharacter, type CreateCharacterInput } from './character';
import type { EnemyState } from './combat';

// -----------------------------------------------------------------------------
// Factories de portador
// -----------------------------------------------------------------------------

// PJ real construido con createCharacter. Garantiza que el contenedor
// `statuses` existe y arranca vacío. Cualquier override del input se aplica
// antes de createCharacter.
function makeCharacter(overrides: Partial<CreateCharacterInput> = {}) {
  return createCharacter({
    id: 'char-statuses-test',
    name: 'Portador',
    portraitId: 'portrait-01',
    archetype: 'guerrero',
    attributes: { fue: 4, des: 3, con: 2, int: 2, vol: 1 },
    skills: { armas_cuerpo_a_cuerpo: 3, atletismo: 2 },
    perks: ['perk-golpe-firme'],
    location: { mapId: 'historia-01', x: 0, y: 0 },
    ...overrides,
  });
}

// EnemyState mínimo. Replica la forma del modelo de combat.ts pero sin tocar
// las plantillas (no necesitamos initiative/attack para probar statuses).
function makeEnemyState(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    enemy_id: 'lobo',
    instance_id: 'lobo#1',
    hp: 10,
    alive: true,
    statuses: [],
    ...overrides,
  };
}

// Helper para construir StatusEffect concisos en los tests.
function effect(
  kind: StatusEffect['kind'],
  remaining = STATUS_DEFAULT_DURATION[kind],
  magnitude = STATUS_DEFAULT_MAGNITUDE[kind],
): StatusEffect {
  return { kind, remaining, magnitude };
}

// -----------------------------------------------------------------------------
// Contrato del Character
// -----------------------------------------------------------------------------

describe('Character.statuses (sub-paso 4a.1)', () => {
  it('createCharacter inicializa statuses como array vacío', () => {
    const pj = makeCharacter();
    expect(pj.statuses).toEqual([]);
    expect(Object.isFrozen(pj.statuses)).toBe(false); // readonly por tipo, no congelado.
  });
});

// -----------------------------------------------------------------------------
// applyStatus — reglas de stacking
// -----------------------------------------------------------------------------

describe('applyStatus — stacking (cap 1 por kind, refresca duración, no suma magnitud)', () => {
  it('aplica un status nuevo cuando el portador no lo tenía', () => {
    const pj = makeCharacter();
    const next = applyStatus(pj, effect('bleeding', 3, 1));
    expect(next.statuses).toHaveLength(1);
    expect(next.statuses[0]).toEqual({ kind: 'bleeding', remaining: 3, magnitude: 1 });
    // Inmutabilidad: el original no se toca.
    expect(pj.statuses).toEqual([]);
  });

  it('aplicar bleeding tres veces → 1 instancia, duración refrescada al máximo', () => {
    let pj = makeCharacter();
    pj = applyStatus(pj, effect('bleeding', 3, 1));
    pj = applyStatus(pj, effect('bleeding', 2, 1)); // duración menor → no refresca a la baja
    pj = applyStatus(pj, effect('bleeding', 5, 1)); // duración mayor → refresca a 5
    expect(pj.statuses).toHaveLength(1);
    expect(pj.statuses[0]).toMatchObject({ kind: 'bleeding', remaining: 5 });
  });

  it('refresh NUNCA baja la duración existente', () => {
    let pj = makeCharacter();
    pj = applyStatus(pj, effect('poisoned', 4, 1));
    pj = applyStatus(pj, effect('poisoned', 1, 1)); // intento de bajar
    expect(pj.statuses[0]?.remaining).toBe(4);
  });

  it('refresh NO suma magnitud — mantiene la original', () => {
    let pj = makeCharacter();
    pj = applyStatus(pj, effect('bleeding', 3, 1));
    pj = applyStatus(pj, effect('bleeding', 3, 5)); // intento de bumpear magnitud
    expect(pj.statuses[0]?.magnitude).toBe(1);
  });

  it('kinds distintos coexisten — bleeding + poisoned no colisionan', () => {
    let pj = makeCharacter();
    pj = applyStatus(pj, effect('bleeding', 3, 1));
    pj = applyStatus(pj, effect('poisoned', 3, 1));
    expect(pj.statuses).toHaveLength(2);
    expect(hasStatus(pj, 'bleeding')).toBe(true);
    expect(hasStatus(pj, 'poisoned')).toBe(true);
  });

  it('rechaza remaining ≤ 0 con RangeError', () => {
    const pj = makeCharacter();
    expect(() => applyStatus(pj, { kind: 'bleeding', remaining: 0, magnitude: 1 })).toThrow(
      RangeError,
    );
    expect(() => applyStatus(pj, { kind: 'bleeding', remaining: -1, magnitude: 1 })).toThrow(
      RangeError,
    );
  });

  it('rechaza magnitude negativa o no finita con RangeError', () => {
    const pj = makeCharacter();
    expect(() => applyStatus(pj, { kind: 'bleeding', remaining: 3, magnitude: -1 })).toThrow(
      RangeError,
    );
    expect(() =>
      applyStatus(pj, { kind: 'bleeding', remaining: 3, magnitude: Number.NaN }),
    ).toThrow(RangeError);
  });
});

// -----------------------------------------------------------------------------
// tickStatusesAtTurnStart — bleeding
// -----------------------------------------------------------------------------

describe('tickStatusesAtTurnStart — bleeding al inicio del turno', () => {
  it('sin bleeding → daño 0 y bearer intacto', () => {
    const pj = applyStatus(makeCharacter(), effect('poisoned', 3, 1));
    const result = tickStatusesAtTurnStart(pj);
    expect(result.damage).toBe(0);
    expect(result.bearer).toBe(pj); // misma referencia: no muta cuando no hay nada que hacer.
  });

  it('con bleeding magnitud 1 → 1 daño, sin tocar duración', () => {
    const pj = applyStatus(makeCharacter(), effect('bleeding', 3, 1));
    const result = tickStatusesAtTurnStart(pj);
    expect(result.damage).toBe(1);
    expect(result.bearer.statuses[0]).toEqual({ kind: 'bleeding', remaining: 3, magnitude: 1 });
  });

  it('con bleeding magnitud 2 → 2 daño', () => {
    const pj = applyStatus(makeCharacter(), { kind: 'bleeding', remaining: 3, magnitude: 2 });
    expect(tickStatusesAtTurnStart(pj).damage).toBe(2);
  });

  it('NO aplica daño de poisoned al inicio (poisoned dispara al final)', () => {
    const pj = applyStatus(makeCharacter(), effect('poisoned', 3, 7));
    expect(tickStatusesAtTurnStart(pj).damage).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// tickStatusesAtTurnEnd — poisoned, decremento, expiración
// -----------------------------------------------------------------------------

describe('tickStatusesAtTurnEnd — poisoned + decremento + filtrado', () => {
  it('sin statuses → daño 0 y statuses vacíos', () => {
    const pj = makeCharacter();
    const result = tickStatusesAtTurnEnd(pj);
    expect(result.damage).toBe(0);
    expect(result.bearer.statuses).toEqual([]);
  });

  it('poisoned magnitud 1, remaining 3 → 1 daño y remaining baja a 2', () => {
    const pj = applyStatus(makeCharacter(), effect('poisoned', 3, 1));
    const result = tickStatusesAtTurnEnd(pj);
    expect(result.damage).toBe(1);
    expect(result.bearer.statuses).toHaveLength(1);
    expect(result.bearer.statuses[0]).toMatchObject({ kind: 'poisoned', remaining: 2 });
  });

  it('bleeding también decrementa al final (un único punto de decremento)', () => {
    const pj = applyStatus(makeCharacter(), effect('bleeding', 3, 1));
    const result = tickStatusesAtTurnEnd(pj);
    expect(result.damage).toBe(0); // bleeding no dispara al final
    expect(result.bearer.statuses[0]?.remaining).toBe(2);
  });

  it('expira (filtra) cuando remaining baja a 0', () => {
    const pj = applyStatus(makeCharacter(), effect('bleeding', 1, 1));
    const result = tickStatusesAtTurnEnd(pj);
    expect(result.bearer.statuses).toEqual([]);
  });

  it('múltiples kinds expiran independientemente', () => {
    let pj = makeCharacter();
    pj = applyStatus(pj, effect('bleeding', 1, 1));
    pj = applyStatus(pj, effect('poisoned', 3, 1));
    const result = tickStatusesAtTurnEnd(pj);
    expect(result.damage).toBe(1); // poisoned hace 1
    expect(result.bearer.statuses).toHaveLength(1);
    expect(result.bearer.statuses[0]?.kind).toBe('poisoned');
    expect(result.bearer.statuses[0]?.remaining).toBe(2);
  });
});

// -----------------------------------------------------------------------------
// Ciclo completo bleeding: 3 ticks de daño, expira en el 4º tick
// -----------------------------------------------------------------------------

describe('Ciclo completo bleeding (3 turnos de daño, expira en el 4º)', () => {
  it('aplica 3 de daño acumulado y desaparece al cuarto turno', () => {
    let pj = applyStatus(makeCharacter(), effect('bleeding', 3, 1));
    let totalDamage = 0;

    // Turno 1
    let start = tickStatusesAtTurnStart(pj);
    totalDamage += start.damage;
    let end = tickStatusesAtTurnEnd(start.bearer);
    pj = end.bearer;
    expect(start.damage).toBe(1);
    expect(pj.statuses[0]?.remaining).toBe(2);

    // Turno 2
    start = tickStatusesAtTurnStart(pj);
    totalDamage += start.damage;
    end = tickStatusesAtTurnEnd(start.bearer);
    pj = end.bearer;
    expect(start.damage).toBe(1);
    expect(pj.statuses[0]?.remaining).toBe(1);

    // Turno 3
    start = tickStatusesAtTurnStart(pj);
    totalDamage += start.damage;
    end = tickStatusesAtTurnEnd(start.bearer);
    pj = end.bearer;
    expect(start.damage).toBe(1);
    expect(pj.statuses).toEqual([]); // expiró

    // Turno 4 — ya no hay bleeding
    start = tickStatusesAtTurnStart(pj);
    totalDamage += start.damage;
    expect(start.damage).toBe(0);

    expect(totalDamage).toBe(3);
  });
});

// -----------------------------------------------------------------------------
// dodging y stunned — se aplican y se filtran al expirar
// -----------------------------------------------------------------------------

describe('dodging y stunned — aplicación y expiración (sin daño)', () => {
  it('dodging se aplica con duración 1 y desaparece al primer tick fin de turno', () => {
    const pj = applyStatus(makeCharacter(), effect('dodging', 1, 2));
    expect(hasStatus(pj, 'dodging')).toBe(true);
    const result = tickStatusesAtTurnEnd(pj);
    expect(result.damage).toBe(0);
    expect(result.bearer.statuses).toEqual([]);
  });

  it('stunned con remaining 1 desaparece tras un tick fin de turno', () => {
    const pj = applyStatus(makeCharacter(), effect('stunned', 1, 0));
    expect(hasStatus(pj, 'stunned')).toBe(true);
    const result = tickStatusesAtTurnEnd(pj);
    expect(result.damage).toBe(0);
    expect(result.bearer.statuses).toEqual([]);
  });

  it('stunned con remaining 2 sobrevive al primer tick (4a.3 lo consume para skip)', () => {
    const pj = applyStatus(makeCharacter(), effect('stunned', 2, 0));
    const result = tickStatusesAtTurnEnd(pj);
    expect(result.bearer.statuses).toHaveLength(1);
    expect(result.bearer.statuses[0]?.remaining).toBe(1);
  });
});

// -----------------------------------------------------------------------------
// hasStatus
// -----------------------------------------------------------------------------

describe('hasStatus', () => {
  it('false sobre portador limpio', () => {
    expect(hasStatus(makeCharacter(), 'bleeding')).toBe(false);
  });

  it('true tras aplicar el kind correspondiente', () => {
    const pj = applyStatus(makeCharacter(), effect('poisoned'));
    expect(hasStatus(pj, 'poisoned')).toBe(true);
    expect(hasStatus(pj, 'bleeding')).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// clearAllStatuses
// -----------------------------------------------------------------------------

describe('clearAllStatuses (cierre de combate, 4a.4)', () => {
  it('limpia todos los statuses dejando array vacío', () => {
    let pj = applyStatus(makeCharacter(), effect('bleeding'));
    pj = applyStatus(pj, effect('poisoned'));
    const cleared = clearAllStatuses(pj);
    expect(cleared.statuses).toEqual([]);
  });

  it('no-op si ya estaba vacío (devuelve la misma referencia)', () => {
    const pj = makeCharacter();
    expect(clearAllStatuses(pj)).toBe(pj);
  });
});

// -----------------------------------------------------------------------------
// Simetría PJ ↔ Enemigo (decisión #75 aprobada en sesión 4a)
// -----------------------------------------------------------------------------
//
// El mismo helper debe comportarse idéntico sobre Character y EnemyState.
// Si el comportamiento difiere, statuses.ts no es genuinamente simétrico y
// hay que repensar la firma. Estos tests son la regla de oro.

describe('Simetría: bleeding aplicado y tickeado de forma idéntica sobre PJ y EnemyState', () => {
  const cases: Array<{ label: string; make: () => StatusBearer }> = [
    { label: 'Character', make: () => makeCharacter() },
    { label: 'EnemyState', make: () => makeEnemyState() },
  ];

  for (const { label, make } of cases) {
    describe(label, () => {
      it('aplica bleeding y devuelve 1 instancia con duración 3', () => {
        const target = applyStatus(make(), effect('bleeding', 3, 1));
        expect(target.statuses).toHaveLength(1);
        expect(target.statuses[0]).toEqual({ kind: 'bleeding', remaining: 3, magnitude: 1 });
      });

      it('refresca duración al máximo y no suma magnitud', () => {
        let target = applyStatus(make(), effect('bleeding', 3, 1));
        target = applyStatus(target, effect('bleeding', 5, 7));
        expect(target.statuses[0]).toMatchObject({ remaining: 5, magnitude: 1 });
      });

      it('tick start devuelve 1 daño con bleeding magnitud 1', () => {
        const target = applyStatus(make(), effect('bleeding', 3, 1));
        expect(tickStatusesAtTurnStart(target).damage).toBe(1);
      });

      it('tick end decrementa remaining y filtra al expirar', () => {
        const target = applyStatus(make(), effect('bleeding', 1, 1));
        const result = tickStatusesAtTurnEnd(target);
        expect(result.bearer.statuses).toEqual([]);
      });

      it('poisoned dispara al final, no al inicio', () => {
        const target = applyStatus(make(), effect('poisoned', 3, 2));
        expect(tickStatusesAtTurnStart(target).damage).toBe(0);
        expect(tickStatusesAtTurnEnd(target).damage).toBe(2);
      });

      it('clearAllStatuses limpia el portador', () => {
        let target = applyStatus(make(), effect('bleeding'));
        target = applyStatus(target, effect('poisoned'));
        expect(clearAllStatuses(target).statuses).toEqual([]);
      });
    });
  }
});
