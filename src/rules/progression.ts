// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.2 (habilidades), §4.11 (progresión). H1.
//
// Implementa las decisiones #37-#40 (biblia v0.7):
//   #37 Curva de XP lineal: XP(n) = 100·n para subir de n-1 a n.
//   #38 Cadencia de puntos por nivel: +2 hab/nivel + 1 atr cada 5 + 1 perk
//       cada 5. Niveles redondos entregan los tres tipos juntos.
//   #39 Techo blando del uso: min(floor(level/2)+2, 7).
//   #40 Curva de uso: round(5·1.7^value) tiradas para subir 1 escalón.

import {
  CREATION_RULES,
  computeMaxHp,
  type AttributeId,
  type Character,
  type PendingPoints,
  type SkillEntry,
} from './character';

// -----------------------------------------------------------------------------
// Constantes y curvas (decisiones #37, #39, #40)
// -----------------------------------------------------------------------------

export const PROGRESSION_RULES = {
  levelMin: 1,
  levelMax: 50,
  // Decisión #38.
  skillPointsPerLevel: 2,
  attributePointsPerRitualLevel: 1,
  perksPerRitualLevel: 1,
  ritualLevelInterval: 5,
} as const;

// XP necesaria para subir de (level-1) a level. Decisión #37.
// xpForNext(2) = 200, xpForNext(50) = 5000.
export function xpForNext(level: number): number {
  if (!Number.isInteger(level) || level < 2 || level > PROGRESSION_RULES.levelMax) {
    throw new RangeError(
      `xpForNext: level debe ser entero en [2, ${PROGRESSION_RULES.levelMax}], recibido ${level}`,
    );
  }
  return 100 * level;
}

// XP acumulada total desde el nivel 1 para alcanzar `level`. Útil para
// validaciones y para la pantalla de progresión.
export function xpAccumulatedTo(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > PROGRESSION_RULES.levelMax) {
    throw new RangeError(
      `xpAccumulatedTo: level debe ser entero en [1, ${PROGRESSION_RULES.levelMax}], recibido ${level}`,
    );
  }
  let total = 0;
  for (let l = 2; l <= level; l++) total += xpForNext(l);
  return total;
}

// Techo blando del uso para una habilidad dada el nivel del personaje.
// Decisión #39: min(floor(level/2) + 2, 7).
// Nivel 1 → 2, nivel 5 → 4, nivel 10+ → 7.
export function softCapForLevel(level: number): number {
  return Math.min(Math.floor(level / 2) + 2, CREATION_RULES.attributeAbsoluteCap);
}

// Tiradas necesarias para subir la habilidad de `value` a `value + 1` por la
// vía del USO. Decisión #40: round(5 · 1.7^value).
// 0→1 = 5, 4→5 = 42, 6→7 = 121.
export function usageForNext(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`usageForNext: value debe ser entero ≥ 0, recibido ${value}`);
  }
  if (value >= CREATION_RULES.attributeAbsoluteCap) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.round(5 * Math.pow(1.7, value));
}

// Puntos que entrega pulsar "Subir nivel" para llegar a `level`. Decisión #38.
// Nivel 5, 10, 15, ... son rituales: entregan los tres tipos. El resto solo
// habilidades.
export function pointsForLevelUp(level: number): PendingPoints {
  if (!Number.isInteger(level) || level < 2 || level > PROGRESSION_RULES.levelMax) {
    throw new RangeError(
      `pointsForLevelUp: level debe ser entero en [2, ${PROGRESSION_RULES.levelMax}], recibido ${level}`,
    );
  }
  const isRitual = level % PROGRESSION_RULES.ritualLevelInterval === 0;
  return {
    skill: PROGRESSION_RULES.skillPointsPerLevel,
    attribute: isRitual ? PROGRESSION_RULES.attributePointsPerRitualLevel : 0,
    perk: isRitual ? PROGRESSION_RULES.perksPerRitualLevel : 0,
  };
}

// -----------------------------------------------------------------------------
// XP y subida de nivel
// -----------------------------------------------------------------------------

export function addXp(character: Character, delta: number): Character {
  if (!Number.isFinite(delta) || delta < 0) {
    throw new RangeError(`addXp: delta debe ser ≥ 0 finito, recibido ${delta}`);
  }
  if (delta === 0) return character;
  return { ...character, xp: character.xp + delta };
}

// Cuántas veces el jugador puede pulsar "Subir nivel" ahora mismo. Acumula
// niveles si el delta de XP fue grande (matar un jefe puede dar para 2-3).
export function pendingLevelUps(character: Character): number {
  if (character.level >= PROGRESSION_RULES.levelMax) return 0;
  let level = character.level;
  let xpRemaining = character.xp;
  let count = 0;
  while (level < PROGRESSION_RULES.levelMax) {
    const cost = xpForNext(level + 1);
    if (xpRemaining < cost) break;
    xpRemaining -= cost;
    level++;
    count++;
  }
  return count;
}

// Aplica UNA subida de nivel: descuenta XP, sube level, recalcula HP máximo
// (sube proporcionalmente al cambio de CON; en H1 CON no cambia con nivel,
// pero la fórmula vive aquí por si lo hace en el futuro), y suma puntos
// pendientes según la cadencia. La UI debe llamar esta función una vez por
// click, mostrando el ritual de subida (biblia §4.11).
export function levelUp(character: Character): Character {
  if (character.level >= PROGRESSION_RULES.levelMax) {
    throw new Error(`levelUp: el personaje ya está en el nivel máximo (${PROGRESSION_RULES.levelMax}).`);
  }
  const nextLevel = character.level + 1;
  const cost = xpForNext(nextLevel);
  if (character.xp < cost) {
    throw new Error(
      `levelUp: XP insuficiente para subir a nivel ${nextLevel} (necesita ${cost}, tiene ${character.xp}).`,
    );
  }
  const gained = pointsForLevelUp(nextLevel);
  // levelUp NO recalcula HP: en H1 maxHp solo depende de CON y CON no cambia
  // por subir nivel. Si la UI gasta luego un punto en CON, spendAttributePoint
  // se encarga de recalcular maxHp y subir current proporcionalmente.
  return {
    ...character,
    level: nextLevel,
    xp: character.xp - cost,
    pending: {
      skill: character.pending.skill + gained.skill,
      attribute: character.pending.attribute + gained.attribute,
      perk: character.pending.perk + gained.perk,
    },
  };
}

// -----------------------------------------------------------------------------
// Gasto de puntos pendientes
// -----------------------------------------------------------------------------

// Sube un atributo gastando puntos pendientes. El XP rompe el techo blando
// pero NO el cap absoluto (=7). Devuelve nuevo Character con pending.attribute
// reducido y maxHp recalculado si subió CON.
export function spendAttributePoint(
  character: Character,
  attrId: AttributeId,
  amount = 1,
): Character {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new RangeError(`spendAttributePoint: amount debe ser entero ≥ 1, recibido ${amount}`);
  }
  if (character.pending.attribute < amount) {
    throw new Error(
      `spendAttributePoint: pending.attribute insuficiente (tiene ${character.pending.attribute}, pide ${amount}).`,
    );
  }
  const current = character.attributes[attrId];
  const next = current + amount;
  if (next > CREATION_RULES.attributeAbsoluteCap) {
    throw new Error(
      `spendAttributePoint: ${attrId} llegaría a ${next}, supera el cap absoluto ${CREATION_RULES.attributeAbsoluteCap}.`,
    );
  }
  const newAttributes = { ...character.attributes, [attrId]: next };
  const newMaxHp = computeMaxHp(newAttributes);
  // CON sube → maxHp sube → el current sube proporcional para no penalizar.
  const hpDelta = newMaxHp - character.hp.max;
  const newCurrentHp = Math.min(newMaxHp, character.hp.current + Math.max(0, hpDelta));
  return {
    ...character,
    attributes: newAttributes,
    hp: { current: newCurrentHp, max: newMaxHp },
    pending: { ...character.pending, attribute: character.pending.attribute - amount },
  };
}

// Sube una habilidad gastando puntos pendientes. Por ser vía XP, rompe el
// techo blando hasta el cap absoluto (=7). Si la habilidad no existía en
// skills, se crea con value = amount y usage = 0.
export function spendSkillPoint(
  character: Character,
  skillId: string,
  amount = 1,
): Character {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new RangeError(`spendSkillPoint: amount debe ser entero ≥ 1, recibido ${amount}`);
  }
  if (character.pending.skill < amount) {
    throw new Error(
      `spendSkillPoint: pending.skill insuficiente (tiene ${character.pending.skill}, pide ${amount}).`,
    );
  }
  const current = character.skills[skillId];
  const currentValue = current === undefined ? 0 : current.value;
  const currentUsage = current === undefined ? 0 : current.usage;
  const next = currentValue + amount;
  if (next > CREATION_RULES.attributeAbsoluteCap) {
    throw new Error(
      `spendSkillPoint: ${skillId} llegaría a ${next}, supera el cap absoluto ${CREATION_RULES.attributeAbsoluteCap}.`,
    );
  }
  const newSkill: SkillEntry = { value: next, usage: currentUsage };
  return {
    ...character,
    skills: { ...character.skills, [skillId]: newSkill },
    pending: { ...character.pending, skill: character.pending.skill - amount },
  };
}

// Añade un perk a la lista, gastando 1 punto de perk pendiente.
// El catálogo concreto de perks no vive aquí (es contenido, no regla);
// validar que perkId existe es responsabilidad de la UI / data layer.
export function spendPerk(character: Character, perkId: string): Character {
  if (character.pending.perk < 1) {
    throw new Error(`spendPerk: pending.perk insuficiente (tiene ${character.pending.perk}, pide 1).`);
  }
  if (character.perks.includes(perkId)) {
    throw new Error(`spendPerk: el personaje ya tiene el perk "${perkId}".`);
  }
  return {
    ...character,
    perks: [...character.perks, perkId],
    pending: { ...character.pending, perk: character.pending.perk - 1 },
  };
}

// -----------------------------------------------------------------------------
// Subida por uso (vía no-XP)
// -----------------------------------------------------------------------------

// Suma `delta` (>= 1) a skills.{skillId}.usage. Si el acumulado alcanza
// usageForNext(value), value sube en 1 y usage queda con el sobrante.
// Respeta el techo blando (decisión #39): si la habilidad ya está en el
// techo, el usage se acumula igual pero no sube de escalón hasta que el
// techo lo permita (con un nuevo nivel). Esto evita perder el progreso de
// uso cuando subes nivel justo después.
//
// Si la habilidad no existía, se crea con value = 0 y usage = 0 antes de
// aplicar el delta. Decisión E4 (§4.15.6): toda tirada reactiva entrena
// la skill, gane o pierda — exploration.ts ya marca trained_skill,
// progression.ts es quien aplica.
export function addSkillUsage(
  character: Character,
  skillId: string,
  delta = 1,
): Character {
  if (!Number.isInteger(delta) || delta < 1) {
    throw new RangeError(`addSkillUsage: delta debe ser entero ≥ 1, recibido ${delta}`);
  }
  const existing = character.skills[skillId];
  let value = existing === undefined ? 0 : existing.value;
  let usage = (existing === undefined ? 0 : existing.usage) + delta;
  const cap = softCapForLevel(character.level);

  // Bucle: el delta podría ser grande (Modo Privado puede inyectar 100 usos).
  // Subimos escalones mientras haya usage suficiente Y el techo blando lo
  // permita.
  while (value < cap) {
    const required = usageForNext(value);
    if (usage < required) break;
    usage -= required;
    value++;
  }

  // Si llegamos al techo (blando o absoluto) y aún hay usage de sobra, el
  // sobrante se PIERDE: no tendría sentido acumular hacia un escalón que la
  // vía de uso no puede dar. Política explícita para evitar farmear "stock"
  // de usage esperando subir nivel. Si en H7 lo cuestionamos, se cambia.
  if (value >= cap) usage = 0;

  return {
    ...character,
    skills: { ...character.skills, [skillId]: { value, usage } },
  };
}
