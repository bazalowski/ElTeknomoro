// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §7: dice.ts ofrece dos primitivas (rollCombat y rollD20) como sistemas
// independientes. rollCombat sigue bloqueado hasta cerrar el dado de combate.

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
