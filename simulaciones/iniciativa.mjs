// Simulación de la fórmula de iniciativa propuesta para decisión #41.
//
// Propuesta:
//   PJ:       initiative = DES + éxitos(1 + floor(DES/2) dados d6 a 4+)
//   Enemigo:  initiative = initiative_base + éxitos(2 dados d6 a 4+)
//
// Preguntas que la simulación debe responder:
//   1. ¿Qué rango produce cada nivel de DES? Mediana, mínimo, máximo, desviación.
//   2. ¿Con qué frecuencia un PJ ágil (DES alto) va antes que uno lento (DES bajo)?
//   3. ¿Con qué frecuencia un PJ va antes que un enemigo "estándar"
//      (initiative_base = nivel del enemigo)?
//   4. ¿Hay empates excesivos que requieran regla de desempate?
//
// Tirada: 100.000 muestras por configuración.

const SAMPLES = 100_000;

function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollPoolSuccesses(dice) {
  let s = 0;
  for (let i = 0; i < dice; i++) {
    if (rollD6() >= 4) s++;
  }
  return s;
}

function pjPool(des) {
  return des + 3;
}

function pjInitiative(des) {
  return rollPoolSuccesses(pjPool(des));
}

function enemyInitiative(base) {
  return rollPoolSuccesses(base + 2);
}

function summarize(samples) {
  samples.sort((a, b) => a - b);
  const min = samples[0];
  const max = samples[samples.length - 1];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const median = samples[Math.floor(samples.length / 2)];
  const variance = samples.reduce((acc, x) => acc + (x - mean) ** 2, 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  // Distribución por valor para detectar moda.
  const histogram = new Map();
  for (const v of samples) histogram.set(v, (histogram.get(v) ?? 0) + 1);
  const sortedFreq = [...histogram.entries()].sort((a, b) => b[1] - a[1]);
  return { min, max, mean, median, stdDev, top3: sortedFreq.slice(0, 3) };
}

console.log('========================================');
console.log('Q1 — Rango de iniciativa por nivel de DES (PJ)');
console.log('========================================');
console.log('DES | pool | min | máx | media | mediana | σ   | top valores (valor:%)');
console.log('----+------+-----+-----+-------+---------+-----+----------------------');

for (let des = 1; des <= 7; des++) {
  const samples = [];
  for (let i = 0; i < SAMPLES; i++) samples.push(pjInitiative(des));
  const s = summarize(samples);
  const top = s.top3
    .map(([v, n]) => `${v}:${((n / SAMPLES) * 100).toFixed(0)}%`)
    .join(' ');
  console.log(
    ` ${des}  |  ${pjPool(des)}   |  ${String(s.min).padStart(2)} |  ${String(s.max).padStart(2)} |  ${s.mean.toFixed(2)} |   ${String(s.median).padStart(2)}    | ${s.stdDev.toFixed(2)} | ${top}`,
  );
}

console.log('\n========================================');
console.log('Q2 — P(PJ_des_alto va antes que PJ_des_bajo)');
console.log('========================================');
console.log('     | DES2 | DES3 | DES4 | DES5 | DES6 | DES7');
console.log('-----+------+------+------+------+------+------');

for (let alto = 2; alto <= 7; alto++) {
  const row = [`DES${alto}`];
  for (let bajo = 2; bajo <= 7; bajo++) {
    if (bajo >= alto) {
      row.push('  -- ');
      continue;
    }
    let altoPrimero = 0;
    let empate = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const a = pjInitiative(alto);
      const b = pjInitiative(bajo);
      if (a > b) altoPrimero++;
      else if (a === b) empate++;
    }
    const pct = ((altoPrimero / SAMPLES) * 100).toFixed(0);
    const pctEmpate = ((empate / SAMPLES) * 100).toFixed(0);
    row.push(`${pct}%(${pctEmpate})`);
  }
  console.log(row.join(' | '));
}
console.log('\n(formato: P(alto va antes)% (P(empate)%))');

console.log('\n========================================');
console.log('Q3 — P(PJ va antes que enemigo "estándar")');
console.log('========================================');
console.log('Enemigo estándar = initiative_base = 1 (lobo) | 3 (medio) | 5 (jefe)');
console.log('     | enemy_base=1 | enemy_base=3 | enemy_base=5');
console.log('-----+--------------+--------------+-------------');

for (let des = 1; des <= 7; des++) {
  const row = [`DES${des}`];
  for (const base of [1, 3, 5]) {
    let pjPrimero = 0;
    let empate = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const pj = pjInitiative(des);
      const en = enemyInitiative(base);
      if (pj > en) pjPrimero++;
      else if (pj === en) empate++;
    }
    const pct = ((pjPrimero / SAMPLES) * 100).toFixed(0);
    const pctEmpate = ((empate / SAMPLES) * 100).toFixed(0);
    row.push(`   ${pct}% (${pctEmpate})  `);
  }
  console.log(row.join(' | '));
}

console.log('\n========================================');
console.log('Q4 — Empates entre dos PJ con MISMO DES');
console.log('========================================');
console.log('DES | P(empate)');
console.log('----+----------');
for (let des = 1; des <= 7; des++) {
  let empate = 0;
  for (let i = 0; i < SAMPLES; i++) {
    if (pjInitiative(des) === pjInitiative(des)) empate++;
  }
  console.log(` ${des}  |   ${((empate / SAMPLES) * 100).toFixed(1)}%`);
}
