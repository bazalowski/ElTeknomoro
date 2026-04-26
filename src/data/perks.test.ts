import { describe, it, expect } from 'vitest';
import { PERKS, PERKS_BY_ID } from './perks';
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

  it('los 5 perks iniciales (uno por atributo dominante) están presentes', () => {
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

  it('todo perk declara al menos un efecto', () => {
    for (const p of PERKS) {
      expect(p.effects.length).toBeGreaterThan(0);
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
