// Simulación de curvas de progresión — El Teknomoro
// Corre con: node simulaciones/progresion.mjs
// Determinista (no usa RNG). Solo aritmética sobre las curvas candidatas.
// Ver simulaciones/progresion-v0.1.md para contexto y metodología.

const NIVEL_MAX = 50;

// -----------------------------------------------------------------------------
// CURVAS DE XP CANDIDATAS
// xpToReach(level) = XP acumulado total que el personaje necesita al pasar de
// nivel (level-1) → level. xpForNext(level) = XP del próximo escalón.
// -----------------------------------------------------------------------------

function curvaLineal(level) {
  // 100 · level. Nivel 1→2 cuesta 200, 49→50 cuesta 5000.
  return 100 * level;
}

function curvaCuadratica(level) {
  // 50 · level². Nivel 1→2 cuesta 200, 49→50 cuesta 125000.
  return 50 * level * level;
}

function curvaSuave(level) {
  // 100 · level^1.5. Compromiso entre lineal y cuadrática.
  return Math.round(100 * Math.pow(level, 1.5));
}

function curvaJrpg(level) {
  // Progresión clásica JRPG: rampa moderada que se acelera tarde.
  // Aprox FF1: 50 · level² + 100 · level.
  return 50 * level * level + 100 * level;
}

const CURVAS = [
  { nombre: 'Lineal (100·n)', fn: curvaLineal },
  { nombre: 'Suave (100·n^1.5)', fn: curvaSuave },
  { nombre: 'JRPG (50·n² + 100·n)', fn: curvaJrpg },
  { nombre: 'Cuadrática (50·n²)', fn: curvaCuadratica },
];

// XP que asumimos que rinde una sesión típica de 30-45 min según biblia §4.15.5
// (10-15 eventos de exploración; un combate medio da X xp; etc.). Provisional.
const XP_POR_SESION_BAJO = 250;
const XP_POR_SESION_ALTO = 500;

function sesionesParaNivel(curvaFn, level, xpPorSesion) {
  return curvaFn(level) / xpPorSesion;
}

function totalAcumulado(curvaFn, hastaLevel) {
  let total = 0;
  for (let l = 2; l <= hastaLevel; l++) total += curvaFn(l);
  return total;
}

// -----------------------------------------------------------------------------
// CURVAS DE USO CANDIDATAS (cuántas tiradas para subir 1 escalón de habilidad)
// usoParaSubir(value) = tiradas exitosas o no para pasar de habilidad value
// → value+1 por la vía del USO (no XP).
// -----------------------------------------------------------------------------

function usoLineal(value) {
  // 10 · (value + 1). Sub 0→1 = 10, sub 6→7 = 70.
  return 10 * (value + 1);
}

function usoCuadratico(value) {
  // 5 · (value + 1)². Sub 0→1 = 5, sub 6→7 = 245.
  return 5 * (value + 1) * (value + 1);
}

function usoExponencial(value) {
  // 5 · 1.7^value. Sub 0→1 = 5, sub 6→7 ≈ 120.
  return Math.round(5 * Math.pow(1.7, value));
}

const CURVAS_USO = [
  { nombre: 'Lineal (10·(v+1))', fn: usoLineal },
  { nombre: 'Exponencial (5·1.7^v)', fn: usoExponencial },
  { nombre: 'Cuadrática (5·(v+1)²)', fn: usoCuadratico },
];

// -----------------------------------------------------------------------------
// SALIDA
// -----------------------------------------------------------------------------

const fx = (x, n = 0) => x.toFixed(n).padStart(8);

function tablaCurvaXp() {
  console.log(`\n=== CURVAS DE XP — sesiones para llegar a cada nivel ===`);
  console.log(`Asumiendo ${XP_POR_SESION_BAJO}-${XP_POR_SESION_ALTO} XP por sesión de 30-45 min.\n`);

  for (const curva of CURVAS) {
    console.log(`── ${curva.nombre} ──`);
    console.log('Nivel | XP escalón | XP acum  | Sesiones (250 xp/s) | Sesiones (500 xp/s)');
    console.log('------|------------|----------|---------------------|--------------------');
    for (const lvl of [2, 5, 10, 20, 30, 40, 50]) {
      const xpEscalon = curva.fn(lvl);
      const xpAcum = totalAcumulado(curva.fn, lvl);
      const sBajo = xpAcum / XP_POR_SESION_BAJO;
      const sAlto = xpAcum / XP_POR_SESION_ALTO;
      console.log(
        ` ${String(lvl).padStart(3)}  |${fx(xpEscalon)}    |${fx(xpAcum)}  |${fx(sBajo, 1).padStart(20)} |${fx(sAlto, 1).padStart(19)}`,
      );
    }
    console.log('');
  }
}

function tablaCurvaUso() {
  console.log(`\n=== CURVAS DE USO — tiradas para subir un escalón de habilidad ===`);
  console.log(`Cuántas tiradas (de cualquier tipo: éxito, fallo, crítico, pifia) acumular`);
  console.log(`en skills.{id}.usage para que value pase a value+1 por la vía de USO.\n`);

  for (const curva of CURVAS_USO) {
    console.log(`── ${curva.nombre} ──`);
    console.log('Sube de | Tiradas | Acumulado | Comentario');
    console.log('--------|---------|-----------|----------------------------------');
    let acum = 0;
    for (let v = 0; v <= 6; v++) {
      const tiradas = curva.fn(v);
      acum += tiradas;
      let comentario = '';
      if (v === 2) comentario = '← techo blando candidato A (sigue subiendo solo por XP)';
      if (v === 4) comentario = '← techo blando candidato B';
      console.log(
        `  ${v}→${v + 1}  |${fx(tiradas).padStart(8)} |${fx(acum).padStart(10)} | ${comentario}`,
      );
    }
    console.log('');
  }
}

function tablaCadenciaPuntos() {
  console.log(`\n=== CADENCIA DE PUNTOS POR NIVEL — lo que recibe el jugador al subir ===`);
  console.log(`Comparativa de tres modelos sobre los 49 niveles de progresión (1 → 50).\n`);

  const modelos = [
    {
      nombre: 'A · Solo habilidades',
      atrPorNivel: 0,
      habPorNivel: 2,
      perkCadaXNiveles: 5,
    },
    {
      nombre: 'B · Mixto bajo',
      atrPorNivel: 0.2, // 1 cada 5 niveles
      habPorNivel: 2,
      perkCadaXNiveles: 5,
    },
    {
      nombre: 'C · Mixto alto',
      atrPorNivel: 1,
      habPorNivel: 2,
      perkCadaXNiveles: 3,
    },
  ];

  console.log('Modelo                 | Atr total | Hab total | Perks total | ATR medio (con 12 base)');
  console.log('-----------------------|-----------|-----------|-------------|------------------------');
  for (const m of modelos) {
    const niveles = NIVEL_MAX - 1; // 49 escalones
    const atrTotal = m.atrPorNivel * niveles;
    const habTotal = m.habPorNivel * niveles;
    const perksTotal = Math.floor(niveles / m.perkCadaXNiveles);
    // 12 puntos base / 5 atributos = 2.4 medio. + atrTotal repartido entre 5.
    const atrMedio = 2.4 + atrTotal / 5;
    console.log(
      `${m.nombre.padEnd(22)} |${fx(atrTotal, 1).padStart(10)} |${fx(habTotal).padStart(10)} |${fx(perksTotal).padStart(12)} |${fx(atrMedio, 1).padStart(15)}    (techo absoluto 7)`,
    );
  }
  console.log('');
  console.log('Recordatorio biblia: techo absoluto de atributo = 7. Si ATR medio supera ~5,');
  console.log('los builds tienden a uniformizarse (todo al máximo). Si <3, no hay sensación');
  console.log('de poder. Sweet spot: medio terminado entre 3.5 y 5 con dispersión por build.');
}

tablaCurvaXp();
tablaCurvaUso();
tablaCadenciaPuntos();
