import { describe, it, expect } from 'vitest';
import { PORTRAITS, PORTRAITS_BY_ID } from './portraits';

describe('catálogo de retratos', () => {
  it('tiene exactamente 12 retratos (scope §1.3)', () => {
    expect(PORTRAITS.length).toBe(12);
  });

  it('no tiene IDs duplicados', () => {
    const ids = PORTRAITS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('PORTRAITS_BY_ID indexa cada entrada por id', () => {
    for (const p of PORTRAITS) {
      expect(PORTRAITS_BY_ID[p.id]).toBe(p);
    }
  });

  it('los IDs siguen el patrón portrait_NN', () => {
    for (const p of PORTRAITS) {
      expect(p.id).toMatch(/^portrait_\d{2}$/);
    }
  });

  it('cada retrato declara color placeholder o asset_path (no ambos vacíos)', () => {
    for (const p of PORTRAITS) {
      const hasColor = p.placeholder_color.trim().length > 0;
      const hasAsset = p.asset_path.trim().length > 0;
      expect(hasColor || hasAsset).toBe(true);
    }
  });

  it('los placeholder_color son hsl válidos', () => {
    for (const p of PORTRAITS) {
      if (p.placeholder_color.length === 0) continue;
      expect(p.placeholder_color).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
    }
  });
});
