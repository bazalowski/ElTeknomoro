// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §7: dice.ts ofrece dos primitivas (rollCombatPool y rollD20) como
// sistemas independientes (decisión #20). Cada una resuelve un sistema raíz.

export type Rng = () => number;

// PRNG mulberry32. Determinista dado el mismo seed. Estado interno encapsulado
// tras la clausura — no se puede inspeccionar ni clonar. Usa createRng.
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dado de exploración. Decisión cerrada #26 biblia: 1d20, independiente del dado
// de combate. Devuelve 1..20 inclusive.
export function rollD20(rng: Rng): number {
  return Math.floor(rng() * 20) + 1;
}

// Resultado bruto de un pool de combate. Lo consume rules/combat.ts (próximo
// hito) para resolver impacto, crítico y daño contra una DEF concreta. Dejamos
// fuera la lógica de impacto/daño aquí: dice.ts solo tira y cuenta caras.
export interface CombatPoolResult {
  // Caras de cada dado en orden de tirada. Útil para log y replay.
  rolls: number[];
  // Cuántos dados sacaron 4, 5 o 6.
  successes: number;
  // Cuántos dados sacaron exactamente 6. ≥2 habilita crítico (decisión #36).
  sixes: number;
}

// Dado de combate. Decisión cerrada #36 biblia §4.3: pool de d6 con éxito 4+.
// N dados = ATR + HAB; cada 4-5-6 es éxito; cada 6 es además semilla de crítico.
//
// `pool` debe ser entero ≥ 0. pool = 0 devuelve un resultado vacío (válido):
// representa "no hay tirada" y deja a combat.ts decidir qué significa
// (típicamente fallo automático, pero esa regla no vive aquí).
export function rollCombatPool(rng: Rng, pool: number): CombatPoolResult {
  if (!Number.isInteger(pool) || pool < 0) {
    throw new RangeError(`rollCombatPool: pool debe ser entero ≥ 0, recibido ${pool}`);
  }
  const rolls: number[] = new Array(pool);
  let successes = 0;
  let sixes = 0;
  for (let i = 0; i < pool; i++) {
    const face = Math.floor(rng() * 6) + 1;
    rolls[i] = face;
    if (face >= 4) successes++;
    if (face === 6) sixes++;
  }
  return { rolls, successes, sixes };
}
