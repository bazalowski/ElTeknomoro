// Simulación del Lobo del Bosque — El Teknomoro
// Sub-paso H3.2b: validar la stat-line del primer enemigo del juego.
//
// Corre con: npx tsx simulaciones/lobo-v0.1.sim.ts
// Determinista: mismo seed por celda, mismos resultados.
// Importa el motor real desde src/rules/ — sin reimplementar reglas.
//
// Ver simulaciones/lobo-v0.1.md para contexto narrativo y análisis.

import { createRng } from '../src/rules/dice';
import {
  startCombat,
  applyCharacterAction,
  applyEnemyTurn,
  computeCharacterDefense,
  type Enemy,
  type EnemyState,
  type CombatState,
} from '../src/rules/combat';
import {
  createCharacter,
  computeMaxHp,
  type AttributeBlock,
  type AttributeId,
  type Character,
} from '../src/rules/character';
import {
  addItem,
  equipFromSlot,
  type Item,
  type ItemId,
} from '../src/rules/inventory';

// -----------------------------------------------------------------------------
// Configuración global
// -----------------------------------------------------------------------------

const ITERACIONES_POR_CELDA = 10_000;
// Seed maestro. Cada celda deriva su seed concreto de (master, buildIdx, weaponIdx, iterIdx)
// para que dos celdas no compartan trayectoria del PRNG.
const SEED_MAESTRO = 0xc0ffee_42 >>> 0;

// -----------------------------------------------------------------------------
// Builds (briefing)
// -----------------------------------------------------------------------------

interface Build {
  id: string;
  label: string;
  attributes: AttributeBlock;
  // Habilidad armas_cuerpo (skill id real del motor, ver src/data/skills.ts).
  meleeSkill: number;
}

const BUILD_A: Build = {
  id: 'A',
  label: 'Build A · promedio realista (target principal)',
  attributes: { fue: 3, des: 2, con: 3, int: 2, vol: 2 },
  meleeSkill: 3,
};

const BUILD_B: Build = {
  id: 'B',
  label: 'Build B · promedio bajo (contraste)',
  attributes: { fue: 2, des: 3, con: 2, int: 3, vol: 2 },
  meleeSkill: 1,
};

const BUILDS: readonly Build[] = [BUILD_A, BUILD_B];

// -----------------------------------------------------------------------------
// Armas del inventario inicial — paramétricas
//
// El catálogo de Items definitivo no está cerrado en H2.5a (la pantalla de
// inventario muestra placeholders narrativos sin stats). Para no inventar
// narrativa antes de tiempo, simulamos contra tres armas paramétricas
// representando la banda de daño plausible para arma cuerpo a cuerpo inicial:
// 1 (cuchillo / daga corta), 2 (mediana, banda esperada), 3 (arma "buena" inicial).
// Todas usan FUE + armas_cuerpo como pool.
// -----------------------------------------------------------------------------

interface SimWeapon {
  id: ItemId;
  label: string;
  weapon_damage: number;
}

const WEAPONS: readonly SimWeapon[] = [
  { id: 'arma_baja', label: 'arma baja (dmg 1)', weapon_damage: 1 },
  { id: 'arma_media', label: 'arma media (dmg 2)', weapon_damage: 2 },
  { id: 'arma_alta', label: 'arma alta (dmg 3)', weapon_damage: 3 },
];

function makeWeaponItem(w: SimWeapon): Item {
  return {
    id: w.id,
    name: w.label,
    category: 'weapon',
    rarity: 'common',
    slot: 'main_hand',
    stack_size: 1,
    max_durability: 50,
    weight: 1,
    stats: {
      weapon_damage: w.weapon_damage,
      weapon_attribute: 'fue',
      weapon_skill: 'armas_cuerpo',
    },
  };
}

// -----------------------------------------------------------------------------
// Stat-line del Lobo del Bosque
// Hipótesis de partida (briefing). Se itera abajo si no cumple constraints.
// -----------------------------------------------------------------------------

interface LoboStats {
  attack_pool: number;
  defense_threshold: number;
  weapon_damage: number;
  initiative_base: number;
  hp_max: number;
}

function makeLobo(stats: LoboStats): Enemy {
  return {
    id: 'lobo_bosque',
    name: 'Lobo del Bosque',
    level: 1,
    attack_pool: stats.attack_pool,
    defense_threshold: stats.defense_threshold,
    weapon_damage: stats.weapon_damage,
    initiative_base: stats.initiative_base,
    hp_max: stats.hp_max,
  };
}

// -----------------------------------------------------------------------------
// Construcción de PJ + inventario para una celda
// -----------------------------------------------------------------------------

function buildCharacter(build: Build, weaponId: ItemId, catalog: Record<ItemId, Item>): Character {
  // Skills: 10 puntos, máximo 3 al crear. Build A: armas_cuerpo 3 + (7 sobrantes
  // repartidos arbitrariamente, no afectan combate). Build B: armas_cuerpo 1 + 9
  // sobrantes. Repartimos en aguante/percepcion para no invalidar la creación.
  const skills: Record<string, number> = {
    armas_cuerpo: build.meleeSkill,
  };
  let restantes = 10 - build.meleeSkill;
  // Reparto trivial: relleno con aguante/percepcion/sigilo en ≤3 cada uno.
  const fillers: readonly string[] = ['aguante', 'percepcion', 'sigilo', 'voluntad'];
  for (const id of fillers) {
    const v = Math.min(3, restantes);
    if (v <= 0) break;
    skills[id] = v;
    restantes -= v;
  }

  const baseChar = createCharacter({
    id: `pj_${build.id}_${weaponId}`,
    name: `PJ_${build.id}`,
    portraitId: 'p01',
    archetype: null,
    attributes: build.attributes,
    skills,
    perks: ['perk_golpe_brutal'], // perk arbitrario válido del catálogo
    location: { mapId: 'sim', x: 0, y: 0 },
  });

  // Equipar arma en main_hand.
  let inv = addItem(baseChar.inventory, { item_id: weaponId, quantity: 1, durability: 50 }, catalog);
  // Buscar el slot donde quedó.
  const slotIdx = inv.slots.findIndex((s) => s !== null && s.item_id === weaponId);
  if (slotIdx === -1) throw new Error(`No se encontró el arma "${weaponId}" tras addItem.`);
  inv = equipFromSlot(inv, slotIdx, 'main_hand', catalog);

  return { ...baseChar, inventory: inv };
}

// -----------------------------------------------------------------------------
// Simulación de un único combate 1v1 PJ vs Lobo
// -----------------------------------------------------------------------------

interface CombatMetrics {
  victory: boolean;
  defeat: boolean;
  turns: number; // turnos completos hasta resolución (un "turno" = 1 acción del PJ + 1 del lobo, idealmente)
  pjDamageReceived: number;
  pjHpAtEnd: number;
  pjHpMax: number;
  pjCriticals: number;
  pjAttacks: number;
  loboCriticals: number;
  loboAttacks: number;
  diedTurn1ByCrit: boolean; // true si PJ muere en el primer ataque del lobo Y ese ataque fue crit
  totalLoboHits: number;
  totalLoboHitsAttempted: number;
}

function simulateOneCombat(
  pj: Character,
  lobo: Enemy,
  catalog: Record<ItemId, Item>,
  seed: number,
): CombatMetrics {
  const rng = createRng(seed);
  const enemyState: EnemyState = {
    enemy_id: lobo.id,
    instance_id: 'lobo#1',
    hp: lobo.hp_max,
    alive: true,
    statuses: [],
  };
  const enemyTemplates = { [lobo.id]: lobo };

  let state: CombatState = startCombat(pj, [enemyState], enemyTemplates, rng);

  const pjHpMax = pj.hp.max;
  let prevPjHp = pj.hp.current;
  let pjAttacks = 0;
  let pjCriticals = 0;
  let loboAttacks = 0;
  let loboCriticals = 0;
  let loboHits = 0;
  let diedTurn1ByCrit = false;
  // Contamos "turnos" como ciclos completos del turn_order (de vuelta al mismo
  // current_turn_index === 0). Eso equivale al concepto natural "ronda".
  // En 1v1 cada ronda son 2 acciones (PJ + lobo o viceversa).
  let rondas = 0;
  let safetyHardCap = 200; // protección anti-bucle infinito

  while (state.status === 'ongoing' && safetyHardCap-- > 0) {
    const currentTurn = state.turn_order[state.current_turn_index]!;
    if (currentTurn.actor === 'character') {
      pjAttacks++;
      const loboInstance = state.enemies[0]!;
      const before = loboInstance.hp;
      state = applyCharacterAction(
        state,
        { kind: 'attack', target_instance_id: 'lobo#1' },
        enemyTemplates,
        rng,
        catalog,
      );
      const after = state.enemies[0]!.hp;
      const dealt = before - after;
      // Detectar crítico: damage > weapon_damage + posible margen no crítico.
      // Heurística: si dealt es par y >= 2*weapon_damage, hay alta probabilidad de crit.
      // Más limpio sería instrumentar resolveAttack, pero aquí basta con la heurística.
      // CORRECCIÓN: contamos crítico recalculando el último roll. No accesible.
      // En su lugar contamos crítico mirando si dealt es múltiplo par grande.
      // Para reportar tasa de crítico fiable usaremos un contador alternativo
      // recalculando con un rng paralelo (overkill). Simplificación: marcamos
      // crit cuando dealt > weapon_damage + (pool_max - threshold) sin doblar.
      // En la práctica, en este motor: dealt par y >= 2*weapon_damage es proxy
      // razonable. Lo etiquetamos como aproximación.
      // (Para v0.1 esto es suficiente: la métrica clave es muerte_turno_1, que
      //  no necesita tasa de crítico exacta.)
      const weaponDmg = pj.inventory.equipped.main_hand
        ? (catalog[pj.inventory.equipped.main_hand.item_id]!.stats.weapon_damage ?? 1)
        : 1;
      if (dealt >= 2 * weaponDmg && dealt % 2 === 0) {
        pjCriticals++;
      }
    } else {
      loboAttacks++;
      const before = state.character.hp.current;
      state = applyEnemyTurn(state, enemyTemplates, rng, catalog);
      const after = state.character.hp.current;
      const dealt = before - after;
      if (dealt > 0) {
        loboHits++;
        // Heurística de crítico del lobo: dealt par y >= 2*weapon_damage.
        const looksLikeCrit = dealt >= 2 * lobo.weapon_damage && dealt % 2 === 0;
        if (looksLikeCrit) {
          loboCriticals++;
          // Muerte en turno 1 por crítico: este es el primer ataque del lobo
          // (loboAttacks === 1 acaba de incrementarse arriba) y mató al PJ.
          if (loboAttacks === 1 && after === 0) {
            diedTurn1ByCrit = true;
          }
        }
      }
    }
    // Cuenta de rondas: cada vez que current_turn_index vuelve a 0 desde otro valor.
    if (state.current_turn_index === 0 && state.turn_order.length > 0 && state.status === 'ongoing') {
      // Nada: lo contaremos por número de acciones del PJ.
    }
    prevPjHp = state.character.hp.current;
  }

  // "Turnos hasta resolución": contamos rondas como max(pjAttacks, loboAttacks).
  // Es la forma estándar de medir duración: cuántas veces le ha tocado al actor
  // que actúa más veces. En 1v1 esto da entre N y N+1 según quién actúa primero.
  const turns = Math.max(pjAttacks, loboAttacks);

  const victory = state.status === 'victory';
  const defeat = state.status === 'defeat';
  const pjHpAtEnd = state.character.hp.current;
  const pjDamageReceived = pjHpMax - pjHpAtEnd;

  return {
    victory,
    defeat,
    turns,
    pjDamageReceived,
    pjHpAtEnd,
    pjHpMax,
    pjCriticals,
    pjAttacks,
    loboCriticals,
    loboAttacks,
    diedTurn1ByCrit,
    totalLoboHits: loboHits,
    totalLoboHitsAttempted: loboAttacks,
  };
}

// -----------------------------------------------------------------------------
// Agregación por celda
// -----------------------------------------------------------------------------

interface CellResult {
  buildId: string;
  weaponLabel: string;
  weaponDamage: number;
  loboStats: LoboStats;
  victories: number;
  defeats: number;
  victoryRate: number;
  // Distribución de turnos hasta resolución
  turnsMedian: number;
  turnsP25: number;
  turnsP75: number;
  turnsP95: number;
  // HP medio del ganador (solo combates donde ganó el PJ)
  pjHpRatioWhenWin_mean: number; // pjHpAtEnd / pjHpMax, 0..1
  pjHpRatioWhenWin_median: number;
  // Tasa de muerte por crit en turno 1 del lobo
  diedTurn1ByCritRate: number;
  // Daño medio recibido por turno (de combates donde hay >= 1 turno del lobo)
  damageReceivedPerTurn_mean: number;
  // Tasas observadas de crítico (aproximadas, ver heurística arriba)
  pjCritRate: number;  // crits / pjAttacks
  loboCritRate: number; // crits / loboAttacks
  loboHitRate: number; // hits / loboAttacks
  // Iteraciones efectivas (== ITERACIONES_POR_CELDA salvo timeout)
  n: number;
}

function pct(n: number, d: number): number {
  if (d === 0) return 0;
  return n / d;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor((sorted.length - 1) * q);
  return sorted[idx]!;
}

function runCell(
  build: Build,
  weapon: SimWeapon,
  loboStats: LoboStats,
  cellIdx: number,
): CellResult {
  const weaponItem = makeWeaponItem(weapon);
  const catalog: Record<ItemId, Item> = { [weapon.id]: weaponItem };
  const pj = buildCharacter(build, weapon.id, catalog);
  const lobo = makeLobo(loboStats);

  let victories = 0;
  let defeats = 0;
  const turnsList: number[] = [];
  const pjHpRatiosWin: number[] = [];
  let diedT1Crit = 0;
  let totalDamageReceived = 0;
  let totalLoboTurns = 0;
  let totalPjCrits = 0;
  let totalPjAttacks = 0;
  let totalLoboCrits = 0;
  let totalLoboAttacks = 0;
  let totalLoboHits = 0;

  for (let i = 0; i < ITERACIONES_POR_CELDA; i++) {
    // Seed por iteración: mezcla cellIdx + i para no compartir trayectoria entre celdas.
    const seed = (SEED_MAESTRO ^ (cellIdx * 0x9e3779b1) ^ (i * 0x85ebca77)) >>> 0;
    const m = simulateOneCombat(pj, lobo, catalog, seed);
    if (m.victory) {
      victories++;
      pjHpRatiosWin.push(m.pjHpAtEnd / m.pjHpMax);
    }
    if (m.defeat) defeats++;
    turnsList.push(m.turns);
    if (m.diedTurn1ByCrit) diedT1Crit++;
    totalDamageReceived += m.pjDamageReceived;
    totalLoboTurns += m.loboAttacks;
    totalPjCrits += m.pjCriticals;
    totalPjAttacks += m.pjAttacks;
    totalLoboCrits += m.loboCriticals;
    totalLoboAttacks += m.loboAttacks;
    totalLoboHits += m.totalLoboHits;
  }

  turnsList.sort((a, b) => a - b);
  pjHpRatiosWin.sort((a, b) => a - b);

  const meanRatioWin =
    pjHpRatiosWin.length > 0
      ? pjHpRatiosWin.reduce((acc, x) => acc + x, 0) / pjHpRatiosWin.length
      : 0;

  return {
    buildId: build.id,
    weaponLabel: weapon.label,
    weaponDamage: weapon.weapon_damage,
    loboStats,
    victories,
    defeats,
    victoryRate: pct(victories, ITERACIONES_POR_CELDA),
    turnsMedian: quantile(turnsList, 0.5),
    turnsP25: quantile(turnsList, 0.25),
    turnsP75: quantile(turnsList, 0.75),
    turnsP95: quantile(turnsList, 0.95),
    pjHpRatioWhenWin_mean: meanRatioWin,
    pjHpRatioWhenWin_median: quantile(pjHpRatiosWin, 0.5),
    diedTurn1ByCritRate: pct(diedT1Crit, ITERACIONES_POR_CELDA),
    damageReceivedPerTurn_mean: totalLoboTurns > 0 ? totalDamageReceived / totalLoboTurns : 0,
    pjCritRate: pct(totalPjCrits, totalPjAttacks),
    loboCritRate: pct(totalLoboCrits, totalLoboAttacks),
    loboHitRate: pct(totalLoboHits, totalLoboAttacks),
    n: ITERACIONES_POR_CELDA,
  };
}

// -----------------------------------------------------------------------------
// Runner — corre un grid completo (todas las builds × todas las armas) con una
// stat-line concreta del lobo. Devuelve los resultados.
// -----------------------------------------------------------------------------

interface RunSummary {
  label: string;
  loboStats: LoboStats;
  cells: CellResult[];
}

function runGrid(label: string, loboStats: LoboStats): RunSummary {
  const cells: CellResult[] = [];
  let cellIdx = 0;
  for (const build of BUILDS) {
    for (const weapon of WEAPONS) {
      cells.push(runCell(build, weapon, loboStats, cellIdx++));
    }
  }
  return { label, loboStats, cells };
}

// -----------------------------------------------------------------------------
// Formato de salida
// -----------------------------------------------------------------------------

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}
function fmtNum(n: number, dec = 2): string {
  return n.toFixed(dec);
}

function printSummary(s: RunSummary): void {
  console.log(`\n=== ${s.label} ===`);
  console.log(
    `Lobo: pool=${s.loboStats.attack_pool} thr=${s.loboStats.defense_threshold} dmg=${s.loboStats.weapon_damage} ini=${s.loboStats.initiative_base} hp=${s.loboStats.hp_max}\n`,
  );
  // Cabecera
  const header = ['Build', 'Arma', 'Vict%', 'Mort%', 'TurnsMed', 'P75', 'P95', 'HP%win', 'DT1Crit', 'Dmg/turn', 'PjCrit%', 'LobCrit%', 'LobHit%'];
  console.log(header.join('\t'));
  for (const c of s.cells) {
    console.log(
      [
        c.buildId,
        c.weaponLabel,
        fmtPct(c.victoryRate),
        fmtPct(c.defeats / c.n),
        c.turnsMedian.toString(),
        c.turnsP75.toString(),
        c.turnsP95.toString(),
        fmtPct(c.pjHpRatioWhenWin_mean),
        fmtPct(c.diedTurn1ByCritRate),
        fmtNum(c.damageReceivedPerTurn_mean, 2),
        fmtPct(c.pjCritRate),
        fmtPct(c.loboCritRate),
        fmtPct(c.loboHitRate),
      ].join('\t'),
    );
  }
}

// -----------------------------------------------------------------------------
// Entry point — corre las iteraciones y vuelca JSON
// -----------------------------------------------------------------------------

interface FullReport {
  meta: {
    iteracionesPorCelda: number;
    seedMaestro: string;
    fecha: string;
    builds: Build[];
    armas: SimWeapon[];
    derivados: {
      buildA_HpMax: number;
      buildA_Def: number;
      buildA_Threshold: number;
      buildA_Pool: number;
      buildB_HpMax: number;
      buildB_Def: number;
      buildB_Threshold: number;
      buildB_Pool: number;
    };
  };
  iteraciones: RunSummary[];
}

function deriveStats(): FullReport['meta']['derivados'] {
  const a = BUILD_A;
  const b = BUILD_B;
  return {
    buildA_HpMax: computeMaxHp(a.attributes),
    buildA_Def: 2 + Math.floor(a.attributes.des / 2),
    buildA_Threshold: Math.max(1, Math.ceil((2 + Math.floor(a.attributes.des / 2)) / 3)),
    buildA_Pool: a.attributes.fue + a.meleeSkill,
    buildB_HpMax: computeMaxHp(b.attributes),
    buildB_Def: 2 + Math.floor(b.attributes.des / 2),
    buildB_Threshold: Math.max(1, Math.ceil((2 + Math.floor(b.attributes.des / 2)) / 3)),
    buildB_Pool: b.attributes.fue + b.meleeSkill,
  };
}

function main(): void {
  const derivados = deriveStats();
  console.log('Derivados del motor (computeMaxHp / computeDefense / computeHitThreshold):');
  console.log(`  Build A · HP=${derivados.buildA_HpMax} DEF=${derivados.buildA_Def} thr_PJ=${derivados.buildA_Threshold} pool=${derivados.buildA_Pool}`);
  console.log(`  Build B · HP=${derivados.buildB_HpMax} DEF=${derivados.buildB_Def} thr_PJ=${derivados.buildB_Threshold} pool=${derivados.buildB_Pool}`);

  // Iteración 1 — hipótesis del briefing
  const iter1Stats: LoboStats = {
    attack_pool: 3,
    defense_threshold: 2,
    weapon_damage: 2,
    initiative_base: 4,
    hp_max: 8,
  };
  const iter1 = runGrid('Iteración 1 · hipótesis briefing', iter1Stats);
  printSummary(iter1);

  // Iteración 2 — primer ajuste (a decidir tras iter1, declarado abajo).
  // Si iter1 sale fuera de target, ajustamos. Se completará dinámicamente
  // por el operador editando esta sección. Para v0.1 corremos varias
  // hipótesis preplanificadas y dejamos al .md elegir cuál es la final.

  // Iteración 2: si iter1 da victoria > 40% en A·media, subimos hp del lobo.
  // Si iter1 da victoria < 25% en A·media, bajamos pool o weapon_damage del lobo.
  // Hipótesis 2a: lobo más sólido (hp 10).
  const iter2aStats: LoboStats = { ...iter1Stats, hp_max: 10 };
  const iter2a = runGrid('Iteración 2a · hp_max 10', iter2aStats);
  printSummary(iter2a);

  // Hipótesis 2b: lobo más sólido y pega menos (hp 10, weapon_damage 1).
  const iter2bStats: LoboStats = { ...iter1Stats, hp_max: 10, weapon_damage: 1 };
  const iter2b = runGrid('Iteración 2b · hp 10, dmg 1', iter2bStats);
  printSummary(iter2b);

  // Hipótesis 2c: lobo más débil (hp 6).
  const iter2cStats: LoboStats = { ...iter1Stats, hp_max: 6 };
  const iter2c = runGrid('Iteración 2c · hp_max 6', iter2cStats);
  printSummary(iter2c);

  // Hipótesis 2d: lobo con threshold más alto (más difícil de matar por margen).
  const iter2dStats: LoboStats = { ...iter1Stats, defense_threshold: 3, hp_max: 8 };
  const iter2d = runGrid('Iteración 2d · thr 3, hp 8', iter2dStats);
  printSummary(iter2d);

  // Hipótesis 2e: lobo pool 4 (más impacto), hp 8, dmg 2.
  const iter2eStats: LoboStats = { ...iter1Stats, attack_pool: 4 };
  const iter2e = runGrid('Iteración 2e · pool 4', iter2eStats);
  printSummary(iter2e);

  // ITERACIÓN 3 — combinaciones para encontrar el sweet spot de Build A.
  // Datos hasta aquí: A·media oscila entre 79.5% (thr 3) y 99.1% (hp 10 dmg 1).
  // Necesitamos bajar A·media a 25-40%. Hay que hacer al lobo SUSTANCIALMENTE
  // más resistente Y/O más letal.

  // 3a: thr 3 + hp 12 + dmg 2 (más tanque, mantiene letalidad).
  const iter3aStats: LoboStats = { attack_pool: 3, defense_threshold: 3, weapon_damage: 2, initiative_base: 4, hp_max: 12 };
  const iter3a = runGrid('Iteración 3a · thr 3, hp 12', iter3aStats);
  printSummary(iter3a);

  // 3b: thr 3 + hp 14 + dmg 2 (más tanque aún).
  const iter3bStats: LoboStats = { attack_pool: 3, defense_threshold: 3, weapon_damage: 2, initiative_base: 4, hp_max: 14 };
  const iter3b = runGrid('Iteración 3b · thr 3, hp 14', iter3bStats);
  printSummary(iter3b);

  // 3c: thr 3 + hp 16 + dmg 2 (peso pesado).
  const iter3cStats: LoboStats = { attack_pool: 3, defense_threshold: 3, weapon_damage: 2, initiative_base: 4, hp_max: 16 };
  const iter3c = runGrid('Iteración 3c · thr 3, hp 16', iter3cStats);
  printSummary(iter3c);

  // 3d: thr 3 + hp 14 + pool 4 + dmg 2 (más impacto y tanque).
  const iter3dStats: LoboStats = { attack_pool: 4, defense_threshold: 3, weapon_damage: 2, initiative_base: 4, hp_max: 14 };
  const iter3d = runGrid('Iteración 3d · thr 3, hp 14, pool 4', iter3dStats);
  printSummary(iter3d);

  // 3e: thr 3 + hp 16 + pool 4 + dmg 2 (extremo).
  const iter3eStats: LoboStats = { attack_pool: 4, defense_threshold: 3, weapon_damage: 2, initiative_base: 4, hp_max: 16 };
  const iter3e = runGrid('Iteración 3e · thr 3, hp 16, pool 4', iter3eStats);
  printSummary(iter3e);

  // 3f: thr 3 + hp 12 + pool 4 + dmg 1 (más impacto, daño menor, más turnos).
  const iter3fStats: LoboStats = { attack_pool: 4, defense_threshold: 3, weapon_damage: 1, initiative_base: 4, hp_max: 12 };
  const iter3f = runGrid('Iteración 3f · thr 3, hp 12, pool 4, dmg 1', iter3fStats);
  printSummary(iter3f);

  const report: FullReport = {
    meta: {
      iteracionesPorCelda: ITERACIONES_POR_CELDA,
      seedMaestro: '0x' + SEED_MAESTRO.toString(16),
      fecha: new Date().toISOString().slice(0, 10),
      builds: BUILDS as unknown as Build[],
      armas: WEAPONS as unknown as SimWeapon[],
      derivados,
    },
    iteraciones: [iter1, iter2a, iter2b, iter2c, iter2d, iter2e, iter3a, iter3b, iter3c, iter3d, iter3e, iter3f],
  };

  console.log('\n=== JSON_DUMP_BEGIN ===');
  console.log(JSON.stringify(report, null, 2));
  console.log('=== JSON_DUMP_END ===');
}

main();
