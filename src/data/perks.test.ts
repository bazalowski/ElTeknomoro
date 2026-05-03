import { describe, it, expect } from 'vitest';
import { PERKS, PERKS_BY_ID, type PerkEffect } from './perks';
import { ATTRIBUTE_IDS } from '../rules/character';

describe('catálogo de perks', () => {
  it('no tiene IDs duplicados', () => {
    const ids = PERKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('PERKS_BY_ID indexa cada entrada por id', () => {
    for (const p of PERKS) {
      expect(PERKS_BY_ID[p.id]).toBe(p);
    }
  });

  it('los 5 perks iniciales obligatorios (uno por atributo dominante) están presentes', () => {
    // Sub-paso 4b: ahora hay 10 perks en total. Los 5 originales (uno por
    // atributo dominante) siguen siendo elegibles al crear; los 5 nuevos
    // amplían el menú sin abrir nuevos atributos.
    const initials = PERKS.filter((p) => p.min_level === 1 && p.prerequisites.length === 0);
    const dominants = new Set(
      initials
        .map((p) => p.required_dominant_attribute)
        .filter((a): a is (typeof ATTRIBUTE_IDS)[number] => a !== null),
    );
    for (const a of ATTRIBUTE_IDS) {
      expect(dominants.has(a)).toBe(true);
    }
  });

  it('todo perk declara EXACTAMENTE un effect (singular, schema 4b)', () => {
    // Sub-paso 4b: schema reformado a `effect: PerkEffect` singular
    // (discriminated union). Antes había `effects: readonly PerkEffect[]`.
    for (const p of PERKS) {
      expect(p.effect).toBeDefined();
      expect(typeof p.effect.kind).toBe('string');
    }
  });

  it('el kind de cada effect es uno de los 7 válidos del schema', () => {
    const validKinds: ReadonlySet<PerkEffect['kind']> = new Set([
      'attribute_bonus',
      'hp_max_bonus',
      'def_bonus',
      'attack_pool_bonus',
      'initiative_bonus',
      'damage_bonus',
      'skill_pool_bonus',
    ]);
    for (const p of PERKS) {
      expect(validKinds.has(p.effect.kind)).toBe(true);
    }
  });

  it('los prerequisites referencian perks que existen', () => {
    for (const p of PERKS) {
      for (const prereq of p.prerequisites) {
        expect(PERKS_BY_ID[prereq]).toBeDefined();
      }
    }
  });
});

// -----------------------------------------------------------------------------
// 4b: contratos de los 5 perks nuevos
// -----------------------------------------------------------------------------

describe('Perks nuevos (sub-paso 4b.7)', () => {
  it('perk_filo_paciente: damage_bonus +1, dominante FUE', () => {
    const p = PERKS_BY_ID['perk_filo_paciente'];
    expect(p).toBeDefined();
    expect(p!.required_dominant_attribute).toBe('fue');
    expect(p!.effect).toEqual({ kind: 'damage_bonus', value: 1 });
  });

  it('perk_callo_de_intemperie: def_bonus +1, dominante CON', () => {
    const p = PERKS_BY_ID['perk_callo_de_intemperie'];
    expect(p).toBeDefined();
    expect(p!.required_dominant_attribute).toBe('con');
    expect(p!.effect).toEqual({ kind: 'def_bonus', value: 1 });
  });

  it('perk_pulmon_de_ceniza: attribute_bonus CON +1, dominante CON (opción B aprobada)', () => {
    const p = PERKS_BY_ID['perk_pulmon_de_ceniza'];
    expect(p).toBeDefined();
    expect(p!.required_dominant_attribute).toBe('con');
    expect(p!.effect).toEqual({ kind: 'attribute_bonus', attribute: 'con', value: 1 });
  });

  it('perk_lectura_de_huellas: skill_pool_bonus +2, dominante INT (deuda H7)', () => {
    const p = PERKS_BY_ID['perk_lectura_de_huellas'];
    expect(p).toBeDefined();
    expect(p!.required_dominant_attribute).toBe('int');
    expect(p!.effect).toEqual({ kind: 'skill_pool_bonus', value: 2 });
    // La descripción menciona explícitamente la deuda H7 al jugador.
    expect(p!.description.toLowerCase()).toContain('h7');
  });

  it('perk_sello_del_humo: initiative_bonus +2, dominante VOL (único arcano)', () => {
    const p = PERKS_BY_ID['perk_sello_del_humo'];
    expect(p).toBeDefined();
    expect(p!.required_dominant_attribute).toBe('vol');
    expect(p!.effect).toEqual({ kind: 'initiative_bonus', value: 2 });
  });
});

// -----------------------------------------------------------------------------
// 4b: contratos recableados de los 5 obligatorios
// -----------------------------------------------------------------------------

describe('Perks obligatorios recableados (sub-paso 4b.3 y 4b.6)', () => {
  it('perk_golpe_brutal: attack_pool_bonus +1 (degradado, sin trigger)', () => {
    const p = PERKS_BY_ID['perk_golpe_brutal'];
    expect(p!.effect).toEqual({ kind: 'attack_pool_bonus', value: 1 });
  });

  it('perk_pies_ligeros: initiative_bonus +2', () => {
    const p = PERKS_BY_ID['perk_pies_ligeros'];
    expect(p!.effect).toEqual({ kind: 'initiative_bonus', value: 2 });
  });

  it('perk_piel_dura: hp_max_bonus +2', () => {
    const p = PERKS_BY_ID['perk_piel_dura'];
    expect(p!.effect).toEqual({ kind: 'hp_max_bonus', value: 2 });
  });

  it('perk_ojo_clinico: damage_bonus +1 (reescrito de flag narrativo)', () => {
    const p = PERKS_BY_ID['perk_ojo_clinico'];
    expect(p!.effect).toEqual({ kind: 'damage_bonus', value: 1 });
  });

  it('perk_temple: hp_max_bonus +2 (reescrito de inmunidad a miedo)', () => {
    const p = PERKS_BY_ID['perk_temple'];
    expect(p!.effect).toEqual({ kind: 'hp_max_bonus', value: 2 });
  });
});
