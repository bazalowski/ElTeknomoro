// Simulación del dado de combate — El Teknomoro
// Corre con: node simulaciones/dado-combate.mjs
// Determinista: mismo seed, mismos resultados.
// Ver simulaciones/dado-combate-v0.1.md para contexto y metodología.

const SEED = 0xcafebabe;
const ITERACIONES = 10_000;

// -----------------------------------------------------------------------------
// PRNG — mismo mulberry32 que rules/dice.ts
// -----------------------------------------------------------------------------
function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roll = (rng, caras) => Math.floor(rng() * caras) + 1;

// -----------------------------------------------------------------------------
// Candidatos
// Cada candidato devuelve {impacta, daño, critico, pifia} por ataque.
// -----------------------------------------------------------------------------

// A — Pool d6 4+
// N dados = ATR + HAB. Cada 4+ es éxito. 6 es éxito "explosivo" para crítico.
// Impacta si exitos >= DEF/3 (escalado para hacer comparables los DEF).
// Daño = arma_base + (exitos_sobre_umbral).
function candidatoA_pool(rng, atr, hab, def, daño_base_arma) {
  const n = atr + hab;
  let exitos = 0;
  let seises = 0;
  for (let i = 0; i < n; i++) {
    const d = roll(rng, 6);
    if (d >= 4) exitos++;
    if (d === 6) seises++;
  }
  const umbral = Math.ceil(def / 3);
  const impacta = exitos >= umbral;
  const critico = impacta && seises >= 2;
  const pifia = exitos === 0;
  let dañoFinal = 0;
  if (impacta) {
    const margen = exitos - umbral;
    dañoFinal = daño_base_arma + margen;
    if (critico) dañoFinal *= 2;
  }
  return { impacta, daño: dañoFinal, critico, pifia };
}

// B — 1d20 + mods contra DEF
// Impacta si 1d20 + ATR + HAB >= DEF. Nat20 crítico. Nat1 pifia.
// Daño = arma_base + ATR + floor(margen/3). Crítico dobla.
function candidatoB_d20(rng, atr, hab, def, daño_base_arma) {
  const d = roll(rng, 20);
  const total = d + atr + hab;
  const critico = d === 20;
  const pifia = d === 1;
  const impacta = !pifia && (critico || total >= def);
  let dañoFinal = 0;
  if (impacta) {
    const margen = Math.max(0, total - def);
    dañoFinal = daño_base_arma + atr + Math.floor(margen / 3);
    if (critico) dañoFinal *= 2;
  }
  return { impacta, daño: dañoFinal, critico, pifia };
}

// C — 2d10 + mods contra DEF (campana, mismo cálculo que B)
function candidatoC_2d10(rng, atr, hab, def, daño_base_arma) {
  const d1 = roll(rng, 10);
  const d2 = roll(rng, 10);
  const suma = d1 + d2;
  const total = suma + atr + hab;
  const critico = suma === 20;
  const pifia = suma === 2;
  const impacta = !pifia && (critico || total >= def);
  let dañoFinal = 0;
  if (impacta) {
    const margen = Math.max(0, total - def);
    dañoFinal = daño_base_arma + atr + Math.floor(margen / 3);
    if (critico) dañoFinal *= 2;
  }
  return { impacta, daño: dañoFinal, critico, pifia };
}

// -----------------------------------------------------------------------------
// Perfiles de encuentro
// -----------------------------------------------------------------------------
const PERFILES = [
  { nombre: 'Novato vs novato', atr: 2, hab: 1, def: 4, hp_obj: 10, arma: 2 },
  { nombre: 'Experto vs novato', atr: 5, hab: 8, def: 4, hp_obj: 10, arma: 3 },
  { nombre: 'Medio 1v1', atr: 4, hab: 5, def: 8, hp_obj: 20, arma: 3 },
  { nombre: 'Jefe vs mid', atr: 4, hab: 5, def: 12, hp_obj: 40, arma: 3 },
];

const CANDIDATOS = [
  { nombre: 'A · pool d6 4+', fn: candidatoA_pool },
  { nombre: 'B · 1d20+mods', fn: candidatoB_d20 },
  { nombre: 'C · 2d10+mods', fn: candidatoC_2d10 },
];

// -----------------------------------------------------------------------------
// Simulación
// -----------------------------------------------------------------------------
function medir(candidato, perfil, rng) {
  let impactos = 0;
  let criticos = 0;
  let pifias = 0;
  let sumDaño = 0;
  let sumDaño2 = 0;

  for (let i = 0; i < ITERACIONES; i++) {
    const r = candidato.fn(rng, perfil.atr, perfil.hab, perfil.def, perfil.arma);
    if (r.impacta) impactos++;
    if (r.critico) criticos++;
    if (r.pifia) pifias++;
    sumDaño += r.daño;
    sumDaño2 += r.daño * r.daño;
  }

  const pImpactar = impactos / ITERACIONES;
  const pCritico = criticos / ITERACIONES;
  const pPifia = pifias / ITERACIONES;
  const dañoMedio = sumDaño / ITERACIONES;
  const dañoVar = sumDaño2 / ITERACIONES - dañoMedio * dañoMedio;
  const dañoStd = Math.sqrt(Math.max(0, dañoVar));
  const cv = dañoMedio > 0 ? dañoStd / dañoMedio : 0;
  const turnosKO = dañoMedio > 0 ? perfil.hp_obj / dañoMedio : Infinity;

  return { pImpactar, pCritico, pPifia, dañoMedio, dañoStd, cv, turnosKO };
}

// Sensibilidad a +1 de atributo
function sensibilidad(candidato, perfil, rng) {
  const base = medir(candidato, perfil, rng);
  const bump = medir(
    candidato,
    { ...perfil, atr: perfil.atr + 1 },
    rng,
  );
  return {
    deltaPImpacto: bump.pImpactar - base.pImpactar,
    deltaDaño: bump.dañoMedio - base.dañoMedio,
  };
}

// -----------------------------------------------------------------------------
// Salida
// -----------------------------------------------------------------------------
const pct = (x) => (x * 100).toFixed(1).padStart(5) + '%';
const fx = (x, n = 2) => x.toFixed(n).padStart(6);

console.log(`\n=== SIMULACIÓN DADO DE COMBATE · ${ITERACIONES.toLocaleString()} iteraciones · seed ${SEED} ===\n`);

for (const cand of CANDIDATOS) {
  console.log(`── ${cand.nombre} ──`);
  console.log('Perfil              | P(imp) | P(crit)| P(pif) | DañoMed |  σ  |  CV  | KO turnos | Δ+1atr impacto | Δ+1atr daño');
  console.log('--------------------|--------|--------|--------|---------|------|------|-----------|----------------|------------');
  for (const perfil of PERFILES) {
    const rng = createRng(SEED);
    const m = medir(cand, perfil, rng);
    const rngSens = createRng(SEED);
    const s = sensibilidad(cand, perfil, rngSens);
    console.log(
      `${perfil.nombre.padEnd(20)}|${pct(m.pImpactar)} |${pct(m.pCritico)} |${pct(m.pPifia)} | ${fx(m.dañoMedio)}  |${fx(m.dañoStd, 2)}|${fx(m.cv, 2)}|${fx(m.turnosKO, 2)}    |${pct(s.deltaPImpacto).padStart(14)}  |${fx(s.deltaDaño, 2).padStart(10)}`,
    );
  }
  console.log('');
}

console.log('--- Guía de lectura ---');
console.log('P(imp):    probabilidad de impactar.');
console.log('P(crit):   probabilidad de crítico.');
console.log('P(pif):    probabilidad de pifia (solo B/C).');
console.log('DañoMed:   daño medio por ataque (incluye fallos como 0).');
console.log('σ:         desviación típica del daño por ataque.');
console.log('CV:        σ/μ. <0.3 predecible · 0.3-0.6 equilibrado · >0.6 caótico.');
console.log('KO turnos: turnos esperados para eliminar al objetivo (HP_obj / DañoMed).');
console.log('Δ+1atr:    cuánto cambia la métrica al subir 1 al atributo principal.');
console.log('');
