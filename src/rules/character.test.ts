import { describe, it, expect } from 'vitest';
import {
  ATTRIBUTE_IDS,
  CREATION_RULES,
  addGold,
  computeBaseMaxHp,
  computeDefense,
  createCharacter,
  spendGold,
  validateCreation,
  type AttributeBlock,
  type CreateCharacterInput,
} from './character';
import { applyDamageToCharacter, buildAttackInputFromCharacter } from './combat';
import { deathByEnemy, killCharacter } from './death';
import { equippedWeapon } from './inventory';
import {
  ITEMS_BY_ID,
  STARTING_WEAPON_ID,
  STARTING_RATION_ID,
  STARTING_RATIONS,
  STARTING_ANCHOR_ID,
  STARTING_ANCHORS,
} from '../data/items';

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

describe('computeBaseMaxHp (fórmula pura sin perks)', () => {
  it('aplica HP_max = 8 + 2·CON (provisional H1)', () => {
    const attrs = (con: number): AttributeBlock => ({ fue: 1, des: 1, con, int: 1, vol: 1 });
    // Sub-paso 4b: la firma de la API cambió a `computeMaxHp(character)` para
    // sumar bonos de perks; la fórmula base se exporta como `computeBaseMaxHp`
    // y la usan las vistas de preview/confirm que aún no tienen Character.
    expect(computeBaseMaxHp(attrs(1))).toBe(10);
    expect(computeBaseMaxHp(attrs(4))).toBe(16);
    expect(computeBaseMaxHp(attrs(7))).toBe(22);
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

    // HP lleno = fórmula base (input usa `perk-golpe-firme`, perk huérfano
    // que no está en PERKS_BY_ID y no aporta bonos). 4b: la API canónica es
    // computeMaxHp(character); la fórmula pura es computeBaseMaxHp(attrs).
    expect(c.hp.max).toBe(computeBaseMaxHp(input.attributes));
    expect(c.hp.current).toBe(c.hp.max);

    // Skills se serializan a { value, usage: 0 }
    expect(c.skills.armas_cuerpo_a_cuerpo).toEqual({ value: 3, usage: 0 });
    expect(c.skills.atletismo).toEqual({ value: 2, usage: 0 });

    // Perks, location, inventory se reflejan
    expect(c.perks).toEqual(['perk-golpe-firme']);
    expect(c.location).toEqual({ mapId: 'historia-01', x: 0, y: 0 });
    // Cuadrícula 5×4 = 20 slots fijos. Decisión D-2b-1 / D-equip-2c: el
    // Character recién creado arranca con la Daga ya equipada en main_hand,
    // NO en mochila. La pantalla H2.5a muestra placeholder narrativo, pero el
    // Character persistido es jugable.
    //
    // Desde el sub-paso 4d la mochila ya no arranca vacía: #98 le da al PJ sus
    // provisiones iniciales, sin las cuales moriría de hambre antes de
    // encontrar la primera ración (en 4d no hay forma de conseguir más).
    expect(c.inventory.slots).toHaveLength(20);
    expect(c.inventory.slots.filter((s) => s !== null)).toEqual([
      { item_id: STARTING_RATION_ID, quantity: STARTING_RATIONS, durability: null },
      { item_id: STARTING_ANCHOR_ID, quantity: STARTING_ANCHORS, durability: null },
    ]);
    expect(c.inventory.equipped.main_hand?.item_id).toBe(STARTING_WEAPON_ID);

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

  // Decisión D-2b-1 / D-equip-2c: el Character recién creado arranca con la
  // Daga equipada. Los siguientes tests blindan ese contrato.
  it('arranca con la Daga equipada en main_hand y NO en la mochila', () => {
    const c = createCharacter(baseInput());
    const equipped = c.inventory.equipped.main_hand;
    expect(equipped).toBeDefined();
    expect(equipped!.item_id).toBe(STARTING_WEAPON_ID);
    expect(equipped!.quantity).toBe(1);
    expect(equipped!.durability).toBe(ITEMS_BY_ID[STARTING_WEAPON_ID]!.max_durability);

    // 20 slots y la Daga en ninguno: va al equipo, no a la mochila. Lo único
    // que la mochila lleva de salida son las raciones de #98 (sub-paso 4d).
    expect(c.inventory.slots).toHaveLength(20);
    expect(c.inventory.slots.some((s) => s?.item_id === STARTING_WEAPON_ID)).toBe(false);
  });

  it('equippedWeapon resuelve al item Daga del catálogo', () => {
    const c = createCharacter(baseInput());
    const weapon = equippedWeapon(c.inventory, ITEMS_BY_ID);
    expect(weapon).not.toBeNull();
    expect(weapon!.id).toBe(STARTING_WEAPON_ID);
    expect(weapon!.stats.weapon_damage).toBe(2);
    expect(weapon!.stats.weapon_attribute).toBe('fue');
    expect(weapon!.stats.weapon_skill).toBe('armas_cuerpo');
  });

  it('buildAttackInputFromCharacter usa la Daga: pool = FUE + armas_cuerpo, daño = 2 (build A simulación lobo)', () => {
    // Build A de simulaciones/lobo-v0.1.md: FUE 3, armas_cuerpo 3 → pool 6.
    const input = baseInput({
      attributes: { fue: 3, des: 3, con: 3, int: 2, vol: 1 },
      skills: { armas_cuerpo: 3 },
    });
    const c = createCharacter(input);
    // Defensa arbitraria; sólo nos interesa el pool y el daño aquí.
    const attackInput = buildAttackInputFromCharacter(c, 4, ITEMS_BY_ID);
    expect(attackInput.attacker_pool).toBe(6);
    expect(attackInput.weapon_damage).toBe(2);
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

describe('gold (recurso del personaje)', () => {
  it('createCharacter inicializa gold a CREATION_RULES.startingGold (= 0)', () => {
    const c = createCharacter(baseInput());
    expect(CREATION_RULES.startingGold).toBe(0);
    expect(c.gold).toBe(CREATION_RULES.startingGold);
  });

  it('addGold suma y devuelve nuevo Character (no muta el original)', () => {
    const c = createCharacter(baseInput());
    const c2 = addGold(c, 25);
    expect(c2).not.toBe(c);
    expect(c2.gold).toBe(25);
    expect(c.gold).toBe(0); // original intacto
  });

  it('addGold con amount = 0 es no-op válido', () => {
    const c = createCharacter(baseInput());
    const c2 = addGold(c, 0);
    expect(c2.gold).toBe(c.gold);
  });

  it('addGold con amount negativo lanza RangeError', () => {
    const c = createCharacter(baseInput());
    expect(() => addGold(c, -1)).toThrow(RangeError);
  });

  it('addGold con amount no entero lanza RangeError', () => {
    const c = createCharacter(baseInput());
    expect(() => addGold(c, 1.5)).toThrow(RangeError);
    expect(() => addGold(c, Number.NaN)).toThrow(RangeError);
  });

  it('spendGold resta correctamente', () => {
    const c = addGold(createCharacter(baseInput()), 50);
    const c2 = spendGold(c, 20);
    expect(c2.gold).toBe(30);
    expect(c.gold).toBe(50); // original intacto
  });

  it('spendGold con amount = 0 es no-op válido', () => {
    const c = addGold(createCharacter(baseInput()), 10);
    const c2 = spendGold(c, 0);
    expect(c2.gold).toBe(10);
  });

  it('spendGold con saldo insuficiente lanza RangeError', () => {
    const c = addGold(createCharacter(baseInput()), 5);
    expect(() => spendGold(c, 6)).toThrow(RangeError);
  });

  it('spendGold con saldo exacto deja gold = 0', () => {
    const c = addGold(createCharacter(baseInput()), 17);
    const c2 = spendGold(c, 17);
    expect(c2.gold).toBe(0);
  });

  it('spendGold con amount negativo o no entero lanza RangeError', () => {
    const c = addGold(createCharacter(baseInput()), 100);
    expect(() => spendGold(c, -1)).toThrow(RangeError);
    expect(() => spendGold(c, 2.5)).toThrow(RangeError);
    expect(() => spendGold(c, Number.NaN)).toThrow(RangeError);
  });

  it('gold persiste tras crear, sumar, restar (cadena)', () => {
    let c = createCharacter(baseInput());
    expect(c.gold).toBe(0);
    c = addGold(c, 100);
    expect(c.gold).toBe(100);
    c = spendGold(c, 30);
    expect(c.gold).toBe(70);
    c = addGold(c, 5);
    expect(c.gold).toBe(75);
    c = spendGold(c, 75);
    expect(c.gold).toBe(0);
  });

  it('el epitafio incluye el oro final', () => {
    let c = addGold(createCharacter(baseInput()), 50);
    // Aplicamos daño hasta dejar HP a 0 (sin matar todavía: applyDamageToCharacter
    // baja HP, killCharacter rellena el epitafio).
    c = applyDamageToCharacter(c, c.hp.max);
    expect(c.hp.current).toBe(0);
    const dead = killCharacter(c, deathByEnemy('lobo-01', 'Lobo hambriento'), '2026-04-29T12:00:00Z');
    expect(dead.epitaph).not.toBeNull();
    expect(dead.epitaph!.final_character.gold).toBe(50);
  });
});

// =============================================================================
// Sub-paso 4b — perks aplicados en createCharacter
// =============================================================================
//
// Tres ejes que la creación debe respetar:
//   1. perk_temple / perk_piel_dura: hp_max_bonus +2 → HP máx aumenta en +2.
//   2. perk_pulmon_de_ceniza: attribute_bonus CON +1 (opción B) →
//      character.attributes.con sube en 1, y la fórmula HP máx ya lo refleja
//      (8 + 2·CON con CON+1 = +2 HP máx). Total: HP máx = base con CON ya
//      bonificado, sin doble suma.
//   3. perk huérfano (id no existe en PERKS_BY_ID): ignorado, motor no rompe.

describe('createCharacter — perks con efecto al crear (sub-paso 4b)', () => {
  it('perk_temple: HP máx = base + 2 (hp_max_bonus)', () => {
    // Base con CON=2: 8 + 2·2 = 12. Con perk_temple: 12 + 2 = 14.
    const c = createCharacter(baseInput({ perks: ['perk_temple'] }));
    expect(c.hp.max).toBe(14);
    expect(c.hp.current).toBe(14);
    // CON intacto (no es attribute_bonus).
    expect(c.attributes.con).toBe(2);
  });

  it('perk_piel_dura: HP máx = base + 2 (hp_max_bonus)', () => {
    const c = createCharacter(baseInput({ perks: ['perk_piel_dura'] }));
    expect(c.hp.max).toBe(14);
  });

  it('perk_pulmon_de_ceniza (opción B): CON +1 directo en attributes; HP máx refleja CON bonificado', () => {
    // Base CON=2, perk sube a 3. HP máx = 8 + 2·3 = 14 (NO 12+2=14 por
    // hp_max_bonus; aquí no hay hp_max_bonus, sólo attribute_bonus).
    const c = createCharacter(baseInput({ perks: ['perk_pulmon_de_ceniza'] }));
    expect(c.attributes.con).toBe(3); // 2 base + 1 perk
    expect(c.hp.max).toBe(14);        // 8 + 2·3
    // Otros atributos intactos.
    expect(c.attributes.fue).toBe(4);
    expect(c.attributes.des).toBe(3);
    expect(c.attributes.int).toBe(2);
    expect(c.attributes.vol).toBe(1);
  });

  it('perk huérfano (id inexistente) no rompe createCharacter, no aplica bono', () => {
    // El validador acepta el id como string; el helper de perks ignora ids
    // huérfanos. La creación queda jugable sin sumar nada.
    const c = createCharacter(baseInput({ perks: ['perk_inexistente_xyz'] }));
    expect(c.attributes.con).toBe(2);     // sin bono
    expect(c.hp.max).toBe(computeBaseMaxHp(c.attributes)); // 12
  });
});

// =============================================================================
// Sub-paso 4a H4 — campos nuevos top-level: last_damage_source y tutorial_lobo_completed
// =============================================================================
//
// Ambos son top-level no opcionales con default:
//   - last_damage_source: null (lo escribirán los hooks de daño en H3/H4)
//   - tutorial_lobo_completed: false (lo escribirá el cierre del combate
//     tutorial del lobo en el Hogar, sub-paso 4b cuando entre la UI)
//
// La justificación de "no opcional con default" vs "opcional con ?": evitar
// checks `?.` en cada call site que mire estos campos. Los call sites de UI
// y narrativización pueden leer character.tutorial_lobo_completed sin
// defensas y siempre obtienen un boolean.

describe('createCharacter — campos nuevos sub-paso 4a H4', () => {
  it('inicializa last_damage_source a null', () => {
    const c = createCharacter(baseInput());
    expect(c.last_damage_source).toBeNull();
  });

  it('inicializa tutorial_lobo_completed a false', () => {
    const c = createCharacter(baseInput());
    expect(c.tutorial_lobo_completed).toBe(false);
  });

  it('los nuevos campos están presentes (no son undefined) tras crear PJ', () => {
    const c = createCharacter(baseInput());
    expect('last_damage_source' in c).toBe(true);
    expect('tutorial_lobo_completed' in c).toBe(true);
  });
});
