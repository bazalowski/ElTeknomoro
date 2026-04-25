import { describe, it, expect } from 'vitest';
import { createCharacter, type Character } from './character';
import {
  PROGRESSION_RULES,
  addSkillUsage,
  addXp,
  levelUp,
  pendingLevelUps,
  pointsForLevelUp,
  softCapForLevel,
  spendAttributePoint,
  spendPerk,
  spendSkillPoint,
  usageForNext,
  xpAccumulatedTo,
  xpForNext,
} from './progression';

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

function baseCharacter(): Character {
  return createCharacter({
    id: 'c-1',
    name: 'Tester',
    portraitId: 'p-01',
    archetype: null,
    attributes: { fue: 3, des: 3, con: 2, int: 2, vol: 2 }, // suma 12
    skills: { sigilo: 2, percepcion: 1 },
    perks: ['perk-inicial'],
    location: { mapId: 'm', x: 0, y: 0 },
  });
}

// -----------------------------------------------------------------------------
// Curvas y constantes (decisiones #37, #39, #40, #38)
// -----------------------------------------------------------------------------

describe('xpForNext (decisión #37)', () => {
  it('lineal: 100·n para subir de n-1 a n', () => {
    expect(xpForNext(2)).toBe(200);
    expect(xpForNext(10)).toBe(1000);
    expect(xpForNext(50)).toBe(5000);
  });

  it('rechaza levels fuera de [2, 50]', () => {
    expect(() => xpForNext(1)).toThrow(RangeError);
    expect(() => xpForNext(51)).toThrow(RangeError);
    expect(() => xpForNext(2.5)).toThrow(RangeError);
  });
});

describe('xpAccumulatedTo', () => {
  it('total al nivel 50 = 127.400 XP (suma 100·(2..50))', () => {
    // Suma de 100·n para n=2..50 = 100·(50·51/2 - 1) = 100·1274 = 127.400.
    expect(xpAccumulatedTo(50)).toBe(127_400);
  });

  it('total al nivel 1 = 0 (sin escalones por encima)', () => {
    expect(xpAccumulatedTo(1)).toBe(0);
  });

  it('rechaza levels fuera de [1, 50]', () => {
    expect(() => xpAccumulatedTo(0)).toThrow(RangeError);
    expect(() => xpAccumulatedTo(51)).toThrow(RangeError);
  });
});

describe('softCapForLevel (decisión #39)', () => {
  it('aplica min(floor(level/2)+2, 7)', () => {
    const cases: Array<[number, number]> = [
      [1, 2],
      [2, 3],
      [4, 4],
      [5, 4],
      [6, 5],
      [9, 6],
      [10, 7],
      [25, 7],
      [50, 7],
    ];
    for (const [lvl, expected] of cases) {
      expect(softCapForLevel(lvl)).toBe(expected);
    }
  });
});

describe('usageForNext (decisión #40)', () => {
  it('aplica round(5·1.7^value)', () => {
    expect(usageForNext(0)).toBe(5);
    expect(usageForNext(1)).toBe(9); // round(5·1.7) = round(8.5) = 9
    expect(usageForNext(2)).toBe(14);
    expect(usageForNext(3)).toBe(25);
    expect(usageForNext(4)).toBe(42);
    expect(usageForNext(5)).toBe(71);
    expect(usageForNext(6)).toBe(121);
  });

  it('en el cap absoluto devuelve Infinity (ya no se puede subir)', () => {
    expect(usageForNext(7)).toBe(Number.POSITIVE_INFINITY);
  });

  it('rechaza value negativo o no entero', () => {
    expect(() => usageForNext(-1)).toThrow(RangeError);
    expect(() => usageForNext(2.5)).toThrow(RangeError);
  });
});

describe('pointsForLevelUp (decisión #38)', () => {
  it('niveles intermedios solo entregan 2 habilidades', () => {
    expect(pointsForLevelUp(2)).toEqual({ skill: 2, attribute: 0, perk: 0 });
    expect(pointsForLevelUp(7)).toEqual({ skill: 2, attribute: 0, perk: 0 });
    expect(pointsForLevelUp(11)).toEqual({ skill: 2, attribute: 0, perk: 0 });
  });

  it('niveles redondos (5, 10, 15…) entregan los tres tipos', () => {
    for (const lvl of [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]) {
      expect(pointsForLevelUp(lvl)).toEqual({ skill: 2, attribute: 1, perk: 1 });
    }
  });

  it('rechaza levels fuera de [2, 50]', () => {
    expect(() => pointsForLevelUp(1)).toThrow(RangeError);
    expect(() => pointsForLevelUp(51)).toThrow(RangeError);
  });
});

describe('PROGRESSION_RULES (sanity)', () => {
  it('expone los números cerrados de biblia §4.11 / §5', () => {
    expect(PROGRESSION_RULES.levelMax).toBe(50);
    expect(PROGRESSION_RULES.skillPointsPerLevel).toBe(2);
    expect(PROGRESSION_RULES.attributePointsPerRitualLevel).toBe(1);
    expect(PROGRESSION_RULES.perksPerRitualLevel).toBe(1);
    expect(PROGRESSION_RULES.ritualLevelInterval).toBe(5);
  });
});

// -----------------------------------------------------------------------------
// addXp / pendingLevelUps / levelUp
// -----------------------------------------------------------------------------

describe('addXp', () => {
  it('suma XP y devuelve nuevo personaje (no muta)', () => {
    const c = baseCharacter();
    const c2 = addXp(c, 150);
    expect(c.xp).toBe(0);
    expect(c2.xp).toBe(150);
    expect(c2).not.toBe(c);
  });

  it('delta = 0 devuelve el mismo personaje sin cambios', () => {
    const c = baseCharacter();
    const c2 = addXp(c, 0);
    expect(c2.xp).toBe(0);
  });

  it('rechaza delta negativo o no finito', () => {
    expect(() => addXp(baseCharacter(), -1)).toThrow(RangeError);
    expect(() => addXp(baseCharacter(), NaN)).toThrow(RangeError);
    expect(() => addXp(baseCharacter(), Infinity)).toThrow(RangeError);
  });
});

describe('pendingLevelUps', () => {
  it('0 si no hay XP suficiente', () => {
    const c = addXp(baseCharacter(), 199); // necesita 200 para subir a 2
    expect(pendingLevelUps(c)).toBe(0);
  });

  it('1 con XP justa para un escalón', () => {
    const c = addXp(baseCharacter(), 200);
    expect(pendingLevelUps(c)).toBe(1);
  });

  it('acumula varios escalones si la XP da', () => {
    // Para subir a 2,3,4 hace falta 200+300+400 = 900.
    const c = addXp(baseCharacter(), 900);
    expect(pendingLevelUps(c)).toBe(3);
  });

  it('respeta el cap de nivel 50', () => {
    // Personaje en nivel 50 con XP gigante → 0 escalones disponibles.
    const c50 = { ...baseCharacter(), level: PROGRESSION_RULES.levelMax, xp: 1_000_000 } as Character;
    expect(pendingLevelUps(c50)).toBe(0);
  });
});

describe('levelUp', () => {
  it('descuenta XP, sube level y entrega los puntos del nivel intermedio', () => {
    const c = addXp(baseCharacter(), 200);
    const c2 = levelUp(c);
    expect(c2.level).toBe(2);
    expect(c2.xp).toBe(0);
    expect(c2.pending).toEqual({ skill: 2, attribute: 0, perk: 0 });
  });

  it('en nivel ritual entrega los tres tipos', () => {
    // Llevamos a nivel 4 con XP justa, luego 1 más (necesita 500) → nivel 5.
    let c = baseCharacter();
    // De 1 a 5: necesita 200+300+400+500 = 1400.
    c = addXp(c, 1400);
    for (let i = 0; i < 4; i++) c = levelUp(c);
    expect(c.level).toBe(5);
    // Pending acumulado: niveles 2,3,4 → +6 hab. Nivel 5 ritual → +2 hab + 1 atr + 1 perk.
    expect(c.pending).toEqual({ skill: 8, attribute: 1, perk: 1 });
  });

  it('lanza si XP insuficiente', () => {
    const c = baseCharacter();
    expect(() => levelUp(c)).toThrow(/XP insuficiente/);
  });

  it('lanza si ya está en el nivel máximo', () => {
    const c50 = { ...baseCharacter(), level: PROGRESSION_RULES.levelMax, xp: 1_000_000 } as Character;
    expect(() => levelUp(c50)).toThrow(/nivel máximo/);
  });

  it('XP excedente queda disponible para futuros level-ups', () => {
    // Damos XP para subir a 2 (200) + sobrante 50.
    const c = addXp(baseCharacter(), 250);
    const c2 = levelUp(c);
    expect(c2.xp).toBe(50);
    expect(pendingLevelUps(c2)).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// Gasto de puntos pendientes
// -----------------------------------------------------------------------------

describe('spendAttributePoint', () => {
  function withPendingAttr(amount = 1): Character {
    const c = baseCharacter();
    return { ...c, pending: { ...c.pending, attribute: amount } };
  }

  it('sube el atributo y descuenta el pendiente', () => {
    const c = withPendingAttr(1);
    const c2 = spendAttributePoint(c, 'fue');
    expect(c2.attributes.fue).toBe(4);
    expect(c2.pending.attribute).toBe(0);
  });

  it('CON sube → maxHp y current se recalculan', () => {
    const c = withPendingAttr(1);
    const oldMax = c.hp.max;
    const c2 = spendAttributePoint(c, 'con');
    expect(c2.hp.max).toBe(oldMax + 2); // computeMaxHp = 8 + 2·CON
    // current debería subir proporcionalmente al delta de max.
    expect(c2.hp.current).toBe(c.hp.current + 2);
  });

  it('respeta el cap absoluto = 7', () => {
    const c = baseCharacter();
    const cAt7 = { ...c, attributes: { ...c.attributes, fue: 7 }, pending: { ...c.pending, attribute: 1 } };
    expect(() => spendAttributePoint(cAt7, 'fue')).toThrow(/cap absoluto/);
  });

  it('lanza si pending insuficiente', () => {
    expect(() => spendAttributePoint(baseCharacter(), 'fue')).toThrow(/pending\.attribute insuficiente/);
  });

  it('rechaza amount no entero o < 1', () => {
    const c = withPendingAttr(2);
    expect(() => spendAttributePoint(c, 'fue', 0)).toThrow(RangeError);
    expect(() => spendAttributePoint(c, 'fue', 1.5)).toThrow(RangeError);
  });
});

describe('spendSkillPoint', () => {
  function withPendingSkill(amount = 1): Character {
    const c = baseCharacter();
    return { ...c, pending: { ...c.pending, skill: amount } };
  }

  it('sube una habilidad existente y mantiene su usage', () => {
    const c = withPendingSkill(1);
    // sigilo arranca en value 2, usage 0.
    const c2 = spendSkillPoint(c, 'sigilo');
    expect(c2.skills.sigilo).toEqual({ value: 3, usage: 0 });
    expect(c2.pending.skill).toBe(0);
  });

  it('crea una habilidad nueva si no existía', () => {
    const c = withPendingSkill(1);
    const c2 = spendSkillPoint(c, 'arcana');
    expect(c2.skills.arcana).toEqual({ value: 1, usage: 0 });
  });

  it('rompe el techo blando hasta el cap absoluto', () => {
    // Personaje nivel 1 → techo blando 2. spendSkillPoint sube por XP, debe ignorarlo.
    const c = withPendingSkill(3);
    let c2 = spendSkillPoint(c, 'sigilo'); // 2→3
    c2 = spendSkillPoint(c2, 'sigilo'); // 3→4
    c2 = spendSkillPoint(c2, 'sigilo'); // 4→5
    expect(c2.skills.sigilo!.value).toBe(5);
  });

  it('respeta el cap absoluto = 7', () => {
    const c = withPendingSkill(1);
    const c7 = { ...c, skills: { ...c.skills, sigilo: { value: 7, usage: 0 } } };
    expect(() => spendSkillPoint(c7, 'sigilo')).toThrow(/cap absoluto/);
  });

  it('lanza si pending insuficiente', () => {
    expect(() => spendSkillPoint(baseCharacter(), 'sigilo')).toThrow(/pending\.skill insuficiente/);
  });
});

describe('spendPerk', () => {
  function withPendingPerk(amount = 1): Character {
    const c = baseCharacter();
    return { ...c, pending: { ...c.pending, perk: amount } };
  }

  it('añade el perk y descuenta el pendiente', () => {
    const c = withPendingPerk(1);
    const c2 = spendPerk(c, 'perk-nuevo');
    expect(c2.perks).toEqual(['perk-inicial', 'perk-nuevo']);
    expect(c2.pending.perk).toBe(0);
  });

  it('lanza si el personaje ya tiene ese perk', () => {
    const c = withPendingPerk(1);
    expect(() => spendPerk(c, 'perk-inicial')).toThrow(/ya tiene/);
  });

  it('lanza si pending insuficiente', () => {
    expect(() => spendPerk(baseCharacter(), 'x')).toThrow(/pending\.perk insuficiente/);
  });
});

// -----------------------------------------------------------------------------
// Subida por uso (decisión #40 + techo blando #39)
// -----------------------------------------------------------------------------

describe('addSkillUsage', () => {
  it('acumula usage y sube de escalón al alcanzar el umbral', () => {
    // sigilo arranca value=2. usageForNext(2) = 14.
    // Nivel 1 → techo blando 2. ESTÁ EN EL TECHO: la subida no debería ocurrir.
    // Probamos con habilidad nueva por debajo del techo: value=0 → puede subir a 1, 2.
    let c = baseCharacter();
    c = addSkillUsage(c, 'arcana', 5); // 0→1, sobra 0
    expect(c.skills.arcana).toEqual({ value: 1, usage: 0 });
    c = addSkillUsage(c, 'arcana', 9); // 1→2, sobra 0
    expect(c.skills.arcana).toEqual({ value: 2, usage: 0 });
  });

  it('respeta el techo blando: si la skill está al techo, no sube y descarta sobrante', () => {
    // Nivel 1 → techo 2. sigilo ya está en value=2. addSkillUsage no debería subirlo.
    const c = baseCharacter();
    const c2 = addSkillUsage(c, 'sigilo', 100);
    expect(c2.skills.sigilo).toEqual({ value: 2, usage: 0 }); // sobrante descartado
  });

  it('crea habilidad nueva si no existía y aplica delta', () => {
    const c = baseCharacter();
    const c2 = addSkillUsage(c, 'arcana', 3);
    expect(c2.skills.arcana).toEqual({ value: 0, usage: 3 });
  });

  it('subidas en cascada con delta grande', () => {
    // Habilidad nueva, delta enorme. Nivel 1 → techo 2.
    // 0→1 cuesta 5, 1→2 cuesta 9. Total 14. Más allá de 14, sobrante se pierde.
    const c = baseCharacter();
    const c2 = addSkillUsage(c, 'arcana', 100);
    expect(c2.skills.arcana).toEqual({ value: 2, usage: 0 });
  });

  it('a nivel alto el techo permite subir más escalones por uso', () => {
    // Personaje a nivel 10 → techo blando 7 (cap absoluto). Habilidad nueva, delta grande.
    const c = { ...baseCharacter(), level: 10 } as Character;
    const c2 = addSkillUsage(c, 'arcana', 287); // total acumulado a 7 según biblia
    expect(c2.skills.arcana?.value).toBe(7);
    expect(c2.skills.arcana?.usage).toBe(0);
  });

  it('residuo de usage se conserva entre subidas parciales', () => {
    // 0→1 cuesta 5. delta=12 → sube a 1 con 7 sobrantes. 1→2 cuesta 9, no llega.
    const c = baseCharacter();
    const c2 = addSkillUsage(c, 'arcana', 12);
    expect(c2.skills.arcana).toEqual({ value: 1, usage: 7 });
  });

  it('rechaza delta no entero o < 1', () => {
    expect(() => addSkillUsage(baseCharacter(), 'sigilo', 0)).toThrow(RangeError);
    expect(() => addSkillUsage(baseCharacter(), 'sigilo', 1.5)).toThrow(RangeError);
  });
});
