import { describe, it, expect } from 'vitest';
import { createRng, rollD20 } from './dice';

describe('createRng', () => {
  it('es determinista con el mismo seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produce secuencias distintas para seeds distintos', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });
});

describe('rollD20', () => {
  it('devuelve siempre entre 1 y 20 inclusive', () => {
    const rng = createRng(12345);
    for (let i = 0; i < 1000; i++) {
      const roll = rollD20(rng);
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(20);
      expect(Number.isInteger(roll)).toBe(true);
    }
  });

  it('cubre las 20 caras en una muestra grande', () => {
    const rng = createRng(98765);
    const seen = new Set<number>();
    for (let i = 0; i < 10000; i++) {
      seen.add(rollD20(rng));
    }
    expect(seen.size).toBe(20);
  });
});
