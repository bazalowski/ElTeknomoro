import { describe, it, expect } from 'vitest';
import { SKILLS, SKILLS_BY_ID } from './skills';
import { ATTRIBUTE_IDS } from '../rules/character';

describe('catálogo de habilidades', () => {
  it('no tiene IDs duplicados', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tiene exactamente 10 habilidades (MVP)', () => {
    expect(SKILLS.length).toBe(10);
  });

  it('SKILLS_BY_ID indexa cada entrada por id', () => {
    for (const s of SKILLS) {
      expect(SKILLS_BY_ID[s.id]).toBe(s);
    }
  });

  it('toda habilidad declara un atributo válido', () => {
    for (const s of SKILLS) {
      expect(ATTRIBUTE_IDS).toContain(s.attribute);
    }
  });

  it('tiene al menos una habilidad por cada uno de los 5 atributos', () => {
    const cover = new Set(SKILLS.map((s) => s.attribute));
    for (const a of ATTRIBUTE_IDS) {
      expect(cover.has(a)).toBe(true);
    }
  });

  it('cubre las habilidades obligatorias por biblia §4.15.6', () => {
    const required = ['sigilo', 'percepcion', 'supervivencia', 'persuasion'];
    for (const id of required) {
      expect(SKILLS_BY_ID[id]).toBeDefined();
    }
  });
});
