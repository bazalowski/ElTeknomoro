import { describe, it, expect } from 'vitest';
import { ARCHETYPES, ARCHETYPES_BY_ID } from './archetypes';
import { SKILLS_BY_ID } from './skills';
import { PERKS_BY_ID } from './perks';
import {
  ATTRIBUTE_IDS,
  CREATION_RULES,
  validateCreation,
  type CreateCharacterInput,
} from '../rules/character';

describe('catálogo de arquetipos', () => {
  it('tiene exactamente 5 arquetipos (uno por atributo dominante, scope §1.3)', () => {
    expect(ARCHETYPES.length).toBe(5);
    const dominants = new Set(ARCHETYPES.map((a) => a.dominant_attribute));
    expect(dominants.size).toBe(5);
    for (const a of ATTRIBUTE_IDS) {
      expect(dominants.has(a)).toBe(true);
    }
  });

  it('no tiene IDs duplicados', () => {
    const ids = ARCHETYPES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ARCHETYPES_BY_ID indexa cada entrada por id', () => {
    for (const a of ARCHETYPES) {
      expect(ARCHETYPES_BY_ID[a.id]).toBe(a);
    }
  });

  it('cada stat-line suma 12 y respeta [1, 4]', () => {
    for (const a of ARCHETYPES) {
      let sum = 0;
      for (const id of ATTRIBUTE_IDS) {
        const v = a.attributes[id];
        expect(v).toBeGreaterThanOrEqual(CREATION_RULES.attributeMinAtCreation);
        expect(v).toBeLessThanOrEqual(CREATION_RULES.attributeMaxAtCreation);
        sum += v;
      }
      expect(sum).toBe(CREATION_RULES.attributePoolTotal);
    }
  });

  it('el atributo dominante coincide con el más alto del stat-line', () => {
    for (const a of ARCHETYPES) {
      const max = Math.max(...ATTRIBUTE_IDS.map((id) => a.attributes[id]));
      expect(a.attributes[a.dominant_attribute]).toBe(max);
    }
  });

  it('cada starting_skills suma ≤ 10, valores ∈ [0, 3], ids existen', () => {
    for (const a of ARCHETYPES) {
      let sum = 0;
      for (const [skillId, value] of Object.entries(a.starting_skills)) {
        expect(SKILLS_BY_ID[skillId]).toBeDefined();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(CREATION_RULES.skillMaxAtCreation);
        sum += value;
      }
      expect(sum).toBeLessThanOrEqual(CREATION_RULES.skillPoolTotal);
    }
  });

  it('cada starting_perk_id existe en el catálogo de perks', () => {
    for (const a of ARCHETYPES) {
      expect(PERKS_BY_ID[a.starting_perk_id]).toBeDefined();
    }
  });

  it('el preset de cada arquetipo pasa validateCreation sin errores', () => {
    for (const a of ARCHETYPES) {
      const input: CreateCharacterInput = {
        id: `test-${a.id}`,
        name: 'Test',
        portraitId: 'portrait_01',
        archetype: a.id,
        attributes: a.attributes,
        skills: a.starting_skills,
        perks: [a.starting_perk_id],
        location: { mapId: 'historia-01', x: 0, y: 0 },
      };
      const errors = validateCreation(input);
      expect(errors).toEqual([]);
    }
  });
});
