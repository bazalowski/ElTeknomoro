// Tests del helper SAGRADO `rules/perks.ts`. Sub-paso 4b.
//
// Estos tests son de UNIDAD del helper: NO levantan combat ni createCharacter,
// se construyen Character literales con `perks: [...]` para aislar el helper.
// La integración con createCharacter y combat se prueba en sus propios suites.
//
// Aunque MVP H2 sólo permite 1 perk, el helper soporta N (cuando entren las
// subidas de nivel en H7). Probamos casos con 0, 1 y 2 perks por wrapper.

import { describe, it, expect } from 'vitest';

import type { Character } from './character';
import {
  perkAttackPoolBonus,
  perkAttributeBonus,
  perkDamageBonus,
  perkDefBonus,
  perkHpMaxBonus,
  perkInitiativeBonus,
  sumPerkBonuses,
} from './perks';

// Factory mínima: Character literal con sólo lo que el helper consulta.
// El helper sólo lee `character.perks: readonly string[]`, así que el resto
// son campos requeridos por el tipo pero irrelevantes a estos tests.
function makeChar(perks: readonly string[]): Character {
  return {
    id: 'test',
    name: 'Test',
    portraitId: 'p',
    archetype: null,
    attributes: { fue: 1, des: 1, con: 1, int: 1, vol: 1 },
    skills: {},
    perks,
    level: 1,
    xp: 0,
    gold: 0,
    hp: { current: 10, max: 10 },
    // Inventory mínimo: EquipmentMap es Partial<Record<...>> así que {} basta.
    inventory: { slots: [], equipped: {} },
    location: { mapId: 't', x: 0, y: 0 },
    faction_reputation: {},
    achievements: [],
    flags: {},
    alive: true,
    epitaph: null,
    pending: { skill: 0, attribute: 0, perk: 0 },
    statuses: [],
  };
}

// -----------------------------------------------------------------------------
// sumPerkBonuses (genérico)
// -----------------------------------------------------------------------------

describe('sumPerkBonuses — helper genérico', () => {
  it('devuelve 0 si el character no tiene perks', () => {
    expect(sumPerkBonuses(makeChar([]), 'damage_bonus')).toBe(0);
  });

  it('devuelve 0 si ningún perk del character matchea el kind', () => {
    // perk_pies_ligeros tiene kind=initiative_bonus, no damage_bonus
    expect(sumPerkBonuses(makeChar(['perk_pies_ligeros']), 'damage_bonus')).toBe(0);
  });

  it('ignora perks huérfanos (id no presente en PERKS_BY_ID) sin lanzar', () => {
    // Defensa: si la persistencia trae un id obsoleto, no rompe el motor.
    expect(sumPerkBonuses(makeChar(['perk_inexistente_xyz']), 'damage_bonus')).toBe(0);
  });

  it('suma valores cuando el filter selecciona un atributo concreto', () => {
    // perk_pulmon_de_ceniza tiene attribute_bonus para CON con value=1
    const total = sumPerkBonuses(
      makeChar(['perk_pulmon_de_ceniza']),
      'attribute_bonus',
      (e) => e.attribute === 'con',
    );
    expect(total).toBe(1);
  });

  it('descarta entradas que no pasan el filter', () => {
    // Mismo perk, pero el filter pide DES → 0
    const total = sumPerkBonuses(
      makeChar(['perk_pulmon_de_ceniza']),
      'attribute_bonus',
      (e) => e.attribute === 'des',
    );
    expect(total).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// Wrappers semánticos: 0, 1 y 2 perks
// -----------------------------------------------------------------------------

describe('perkDamageBonus', () => {
  it('0 sin perks', () => {
    expect(perkDamageBonus(makeChar([]))).toBe(0);
  });

  it('+1 con perk_filo_paciente', () => {
    expect(perkDamageBonus(makeChar(['perk_filo_paciente']))).toBe(1);
  });

  it('+2 con dos perks que dan damage_bonus (Filo Paciente + Ojo Clínico)', () => {
    // Soporte para H7: dos perks acumulan.
    expect(perkDamageBonus(makeChar(['perk_filo_paciente', 'perk_ojo_clinico']))).toBe(2);
  });
});

describe('perkDefBonus', () => {
  it('0 sin perks', () => {
    expect(perkDefBonus(makeChar([]))).toBe(0);
  });

  it('+1 con perk_callo_de_intemperie', () => {
    expect(perkDefBonus(makeChar(['perk_callo_de_intemperie']))).toBe(1);
  });
});

describe('perkHpMaxBonus', () => {
  it('0 sin perks', () => {
    expect(perkHpMaxBonus(makeChar([]))).toBe(0);
  });

  it('+2 con perk_piel_dura', () => {
    expect(perkHpMaxBonus(makeChar(['perk_piel_dura']))).toBe(2);
  });

  it('+2 con perk_temple (reescrito en 4b.6 a hp_max_bonus)', () => {
    expect(perkHpMaxBonus(makeChar(['perk_temple']))).toBe(2);
  });

  it('+4 con dos perks que dan hp_max_bonus (Piel Dura + Temple)', () => {
    expect(perkHpMaxBonus(makeChar(['perk_piel_dura', 'perk_temple']))).toBe(4);
  });
});

describe('perkAttackPoolBonus', () => {
  it('0 sin perks', () => {
    expect(perkAttackPoolBonus(makeChar([]))).toBe(0);
  });

  it('+1 con perk_golpe_brutal (degradado a +1 permanente en 4b.3)', () => {
    expect(perkAttackPoolBonus(makeChar(['perk_golpe_brutal']))).toBe(1);
  });
});

describe('perkInitiativeBonus', () => {
  it('0 sin perks', () => {
    expect(perkInitiativeBonus(makeChar([]))).toBe(0);
  });

  it('+2 con perk_pies_ligeros', () => {
    expect(perkInitiativeBonus(makeChar(['perk_pies_ligeros']))).toBe(2);
  });

  it('+2 con perk_sello_del_humo (mismo efecto numérico, perk distinto)', () => {
    expect(perkInitiativeBonus(makeChar(['perk_sello_del_humo']))).toBe(2);
  });

  it('+4 con dos perks de iniciativa (Pies Ligeros + Sello del Humo)', () => {
    expect(perkInitiativeBonus(makeChar(['perk_pies_ligeros', 'perk_sello_del_humo']))).toBe(4);
  });
});

describe('perkAttributeBonus', () => {
  it('0 sin perks', () => {
    expect(perkAttributeBonus(makeChar([]), 'con')).toBe(0);
  });

  it('+1 a CON con perk_pulmon_de_ceniza', () => {
    expect(perkAttributeBonus(makeChar(['perk_pulmon_de_ceniza']), 'con')).toBe(1);
  });

  it('+0 a DES con perk_pulmon_de_ceniza (atributo distinto)', () => {
    expect(perkAttributeBonus(makeChar(['perk_pulmon_de_ceniza']), 'des')).toBe(0);
  });
});
