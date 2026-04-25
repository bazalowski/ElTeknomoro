import { describe, it, expect } from 'vitest';
import {
  ATTRIBUTE_IDS,
  CREATION_RULES,
  computeDefense,
  computeMaxHp,
  createCharacter,
  validateCreation,
  type AttributeBlock,
  type CreateCharacterInput,
} from './character';

// Plantilla válida mínima. Cada test la clona y muta el campo a probar.
function baseInput(overrides: Partial<CreateCharacterInput> = {}): CreateCharacterInput {
  return {
    id: 'char-001',
    name: 'Bazalo',
    portraitId: 'portrait-03',
    archetype: 'guerrero',
    attributes: { fue: 4, des: 3, con: 2, int: 2, vol: 1 }, // suma 12
    skills: { armas_cuerpo_a_cuerpo: 3, atletismo: 2 }, // suma 5
    perks: ['perk-golpe-firme'],
    location: { mapId: 'historia-01', x: 0, y: 0 },
    ...overrides,
  };
}

describe('computeDefense (biblia §4.4)', () => {
  it('aplica DEF = 2 + floor(DES/2) + armadura', () => {
    const attrs: AttributeBlock = { fue: 1, des: 5, con: 1, int: 1, vol: 1 };
    expect(computeDefense(attrs)).toBe(2 + 2 + 0); // 4
    expect(computeDefense(attrs, 3)).toBe(2 + 2 + 3); // 7
  });

  it('cubre la tabla de la biblia para DES 1..7', () => {
    const cases: Array<[number, number]> = [
      [1, 2],
      [2, 3],
      [3, 3],
      [4, 4],
      [5, 4],
      [6, 5],
      [7, 5],
    ];
    for (const [des, expected] of cases) {
      const attrs: AttributeBlock = { fue: 1, des, con: 1, int: 1, vol: 1 };
      expect(computeDefense(attrs)).toBe(expected);
    }
  });
});

describe('computeMaxHp', () => {
  it('aplica HP_max = 8 + 2·CON (provisional H1)', () => {
    const attrs = (con: number): AttributeBlock => ({ fue: 1, des: 1, con, int: 1, vol: 1 });
    expect(computeMaxHp(attrs(1))).toBe(10);
    expect(computeMaxHp(attrs(4))).toBe(16);
    expect(computeMaxHp(attrs(7))).toBe(22);
  });
});

describe('validateCreation', () => {
  it('acepta una plantilla válida sin errores', () => {
    expect(validateCreation(baseInput())).toEqual([]);
  });

  it('rechaza id o nombre vacíos', () => {
    const codesId = validateCreation(baseInput({ id: '   ' })).map((e) => e.code);
    const codesName = validateCreation(baseInput({ name: '' })).map((e) => e.code);
    expect(codesId).toContain('ID_EMPTY');
    expect(codesName).toContain('NAME_EMPTY');
  });

  it('rechaza atributo bajo el mínimo de creación', () => {
    const input = baseInput({ attributes: { fue: 0, des: 4, con: 4, int: 3, vol: 1 } });
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toContain('ATTRIBUTE_BELOW_MIN');
  });

  it('rechaza atributo sobre el máximo de creación', () => {
    // 5 + 3 + 2 + 1 + 1 = 12, suma OK pero FUE supera el techo de creación.
    const input = baseInput({ attributes: { fue: 5, des: 3, con: 2, int: 1, vol: 1 } });
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toContain('ATTRIBUTE_ABOVE_MAX_CREATION');
  });

  it('rechaza pool de atributos distinto a 12', () => {
    const input = baseInput({ attributes: { fue: 1, des: 1, con: 1, int: 1, vol: 1 } }); // suma 5
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toContain('ATTRIBUTE_POOL_MISMATCH');
  });

  it('rechaza atributo no entero', () => {
    const input = baseInput({ attributes: { fue: 3.5, des: 3, con: 2.5, int: 2, vol: 1 } });
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toContain('ATTRIBUTE_NOT_INTEGER');
  });

  it('rechaza atributo ausente', () => {
    // Casteo a través de Partial→AttributeBlock para forzar el caso de "falta clave".
    const incomplete = { fue: 4, des: 4, con: 2, int: 2 } as unknown as AttributeBlock;
    const input = baseInput({ attributes: incomplete });
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toContain('ATTRIBUTE_MISSING');
  });

  it('rechaza habilidad sobre el máximo de creación', () => {
    const input = baseInput({ skills: { sigilo: 4 } });
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toContain('SKILL_ABOVE_MAX_CREATION');
  });

  it('rechaza habilidad negativa', () => {
    const input = baseInput({ skills: { sigilo: -1 } });
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toContain('SKILL_NEGATIVE');
  });

  it('rechaza pool de habilidades > 10', () => {
    const input = baseInput({
      skills: { a: 3, b: 3, c: 3, d: 3 }, // 12, ninguna individual sobre techo
    });
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toContain('SKILL_POOL_OVERFLOW');
  });

  it('acepta pool de habilidades en el máximo exacto (10)', () => {
    const input = baseInput({ skills: { a: 3, b: 3, c: 3, d: 1 } });
    expect(validateCreation(input)).toEqual([]);
  });

  it('rechaza número de perks distinto a 1', () => {
    expect(validateCreation(baseInput({ perks: [] })).map((e) => e.code)).toContain(
      'PERKS_COUNT_MISMATCH',
    );
    expect(validateCreation(baseInput({ perks: ['a', 'b'] })).map((e) => e.code)).toContain(
      'PERKS_COUNT_MISMATCH',
    );
  });

  it('reporta múltiples errores acumulados', () => {
    const input = baseInput({
      name: '',
      attributes: { fue: 5, des: 3, con: 2, int: 1, vol: 1 }, // FUE > 4
      perks: [],
    });
    const codes = validateCreation(input).map((e) => e.code);
    expect(codes).toEqual(
      expect.arrayContaining(['NAME_EMPTY', 'ATTRIBUTE_ABOVE_MAX_CREATION', 'PERKS_COUNT_MISMATCH']),
    );
  });
});

describe('createCharacter', () => {
  it('construye un Character autoritativo con HP lleno y derivados correctos', () => {
    const input = baseInput();
    const c = createCharacter(input);

    expect(c.id).toBe('char-001');
    expect(c.name).toBe('Bazalo');
    expect(c.level).toBe(1);
    expect(c.xp).toBe(0);
    expect(c.alive).toBe(true);
    expect(c.epitaph).toBeNull();
    expect(c.archetype).toBe('guerrero');

    // HP lleno = computeMaxHp(attrs)
    expect(c.hp.max).toBe(computeMaxHp(input.attributes));
    expect(c.hp.current).toBe(c.hp.max);

    // Skills se serializan a { value, usage: 0 }
    expect(c.skills.armas_cuerpo_a_cuerpo).toEqual({ value: 3, usage: 0 });
    expect(c.skills.atletismo).toEqual({ value: 2, usage: 0 });

    // Perks, location, inventory se reflejan
    expect(c.perks).toEqual(['perk-golpe-firme']);
    expect(c.location).toEqual({ mapId: 'historia-01', x: 0, y: 0 });
    expect(c.inventory.slots).toEqual([]);
    expect(c.inventory.equipped).toEqual({});

    // Inicialización limpia
    expect(c.faction_reputation).toEqual({});
    expect(c.achievements).toEqual([]);
    expect(c.flags).toEqual({});
  });

  it('lanza si el input no es válido', () => {
    expect(() => createCharacter(baseInput({ name: '' }))).toThrow(/NAME_EMPTY/);
  });

  it('clona attributes y location (no comparte referencias con el input)', () => {
    const input = baseInput();
    const c = createCharacter(input);
    expect(c.attributes).not.toBe(input.attributes);
    expect(c.location).not.toBe(input.location);
  });
});

describe('CREATION_RULES y ATTRIBUTE_IDS (sanity)', () => {
  it('expone las cifras cerradas de biblia §4.1 / §4.2 / §4.7', () => {
    expect(CREATION_RULES.attributePoolTotal).toBe(12);
    expect(CREATION_RULES.attributeMinAtCreation).toBe(1);
    expect(CREATION_RULES.attributeMaxAtCreation).toBe(4);
    expect(CREATION_RULES.attributeAbsoluteCap).toBe(7);
    expect(CREATION_RULES.skillPoolTotal).toBe(10);
    expect(CREATION_RULES.skillMaxAtCreation).toBe(3);
    expect(CREATION_RULES.perksAtCreation).toBe(1);
  });

  it('los 5 atributos son fue, des, con, int, vol y nada más', () => {
    expect([...ATTRIBUTE_IDS].sort()).toEqual(['con', 'des', 'fue', 'int', 'vol']);
  });
});
