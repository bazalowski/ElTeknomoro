import { describe, it, expect } from 'vitest';
import { createRng, rollD20, rollCombatPool } from './dice';

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

describe('rollCombatPool', () => {
  it('cada dado del pool cae en 1..6', () => {
    const rng = createRng(2024);
    for (let i = 0; i < 200; i++) {
      const result = rollCombatPool(rng, 5);
      expect(result.rolls).toHaveLength(5);
      for (const face of result.rolls) {
        expect(Number.isInteger(face)).toBe(true);
        expect(face).toBeGreaterThanOrEqual(1);
        expect(face).toBeLessThanOrEqual(6);
      }
    }
  });

  it('cuenta correctamente éxitos (4+) y seises sobre rolls', () => {
    const rng = createRng(777);
    for (let i = 0; i < 500; i++) {
      const pool = (i % 8) + 1;
      const result = rollCombatPool(rng, pool);
      const expectedSuccesses = result.rolls.filter((f) => f >= 4).length;
      const expectedSixes = result.rolls.filter((f) => f === 6).length;
      expect(result.successes).toBe(expectedSuccesses);
      expect(result.sixes).toBe(expectedSixes);
    }
  });

  it('es determinista con el mismo seed', () => {
    const rngA = createRng(0xc0ffee);
    const rngB = createRng(0xc0ffee);
    for (let i = 0; i < 100; i++) {
      const a = rollCombatPool(rngA, 7);
      const b = rollCombatPool(rngB, 7);
      expect(a).toEqual(b);
    }
  });

  it('respeta los pesos del d6: P(éxito 4+) ≈ 0.5 y P(6) ≈ 1/6 en muestra grande', () => {
    // Con 60.000 dados, σ del recuento de éxitos es √(60000·0.5·0.5) ≈ 122.
    // 5σ deja la P(falso negativo) en ~5.7e-7. Ratio en ±0.01 sobra holgadamente.
    const rng = createRng(31415);
    const N = 10_000;
    const POOL = 6;
    let totalSuccesses = 0;
    let totalSixes = 0;
    for (let i = 0; i < N; i++) {
      const r = rollCombatPool(rng, POOL);
      totalSuccesses += r.successes;
      totalSixes += r.sixes;
    }
    const successRatio = totalSuccesses / (N * POOL);
    const sixRatio = totalSixes / (N * POOL);
    expect(successRatio).toBeGreaterThan(0.49);
    expect(successRatio).toBeLessThan(0.51);
    expect(sixRatio).toBeGreaterThan(1 / 6 - 0.01);
    expect(sixRatio).toBeLessThan(1 / 6 + 0.01);
  });

  it('pool = 0 devuelve resultado vacío válido (sin tirar dados)', () => {
    const rng = createRng(1);
    const result = rollCombatPool(rng, 0);
    expect(result.rolls).toEqual([]);
    expect(result.successes).toBe(0);
    expect(result.sixes).toBe(0);
  });

  it('rechaza pool negativo o no entero', () => {
    const rng = createRng(1);
    expect(() => rollCombatPool(rng, -1)).toThrow(RangeError);
    expect(() => rollCombatPool(rng, 1.5)).toThrow(RangeError);
    expect(() => rollCombatPool(rng, NaN)).toThrow(RangeError);
  });
});
