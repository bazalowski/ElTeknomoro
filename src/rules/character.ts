// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.1, §4.2, §4.4, §4.7 y §7 (modelo de datos). H1.

import type { Inventory } from './inventory';
import { buildStartingInventory } from '../data/items';
import type { Epitaph } from './death';
import type { StatusEffect } from './statuses';
import { perkAttributeBonus, perkHpMaxBonus } from './perks';

// -----------------------------------------------------------------------------
// Constantes de creación (biblia §4.1, §4.2, §4.7)
// -----------------------------------------------------------------------------

export const ATTRIBUTE_IDS = ['fue', 'des', 'con', 'int', 'vol'] as const;
export type AttributeId = (typeof ATTRIBUTE_IDS)[number];

export const CREATION_RULES = {
  // Atributos: 12 puntos, mínimo 1, máximo 4 al crear, techo absoluto 7.
  attributePoolTotal: 12,
  attributeMinAtCreation: 1,
  attributeMaxAtCreation: 4,
  attributeAbsoluteCap: 7,
  // Habilidades: 10 puntos, máximo 3 al crear.
  skillPoolTotal: 10,
  skillMaxAtCreation: 3,
  // Perks: exactamente 1 al crear.
  perksAtCreation: 1,
  // Oro inicial al crear personaje. Sin economía aún (H2 cierra creación);
  // el valor se mantiene como propiedad explícita para que H5 (mercaderes) y
  // H4 (loot) lo puedan reescalar sin tocar createCharacter.
  startingGold: 0,
} as const;

// Flags narrativos reservados por el sistema. Decisión #45: el onboarding
// fija una de estas dos según la rama elegida en la decisión binaria. El
// resto del juego (eventos de exploración, NPCs, quests) puede leerlas como
// `character.flags[ONBOARDING_FLAGS.viajero_audaz]` para gatear contenido.
// Otras flags reservadas se documentan aquí cuando aparezcan.
export const ONBOARDING_FLAGS = {
  viajero_audaz: 'viajero_audaz',
  viajero_cauto: 'viajero_cauto',
} as const;

// -----------------------------------------------------------------------------
// Tipos del personaje autoritativo (biblia §7)
// -----------------------------------------------------------------------------

export type AttributeBlock = Readonly<Record<AttributeId, number>>;

export interface SkillEntry {
  // Nivel de la habilidad. Sube por XP (rompe techo blando) y por uso (hasta techo).
  value: number;
  // Progreso acumulado por uso desde el último escalón. Lo gestiona progression.ts.
  usage: number;
}

export type SkillBlock = Readonly<Record<string, SkillEntry>>;

export interface HpBlock {
  current: number;
  max: number;
}

export interface LocationBlock {
  mapId: string;
  x: number;
  y: number;
}

// Puntos sin gastar acumulados por subidas de nivel. Los rellena
// rules/progression.ts (decisión #38) y los consume el jugador desde la UI
// pulsando "+" sobre habilidades/atributos o eligiendo perks. Persistir
// estos campos garantiza que recargar la partida no pierde puntos.
export interface PendingPoints {
  skill: number;
  attribute: number;
  perk: number;
}

export interface Character {
  id: string;
  name: string;
  portraitId: string;
  archetype: string | null;
  attributes: AttributeBlock;
  skills: SkillBlock;
  perks: readonly string[];
  level: number;
  xp: number;
  // Oro disponible. Entero >= 0. Se manipula con addGold/spendGold (puros).
  gold: number;
  hp: HpBlock;
  inventory: Inventory;
  location: LocationBlock;
  faction_reputation: Readonly<Record<string, number>>;
  achievements: readonly string[];
  flags: Readonly<Record<string, unknown>>;
  alive: boolean;
  // El epitafio se rellena al morir (rules/death.ts en H3). Hasta entonces, null.
  epitaph: Epitaph | null;
  // Puntos sin gastar acumulados por subidas de nivel pulsadas pero no
  // asignadas a habilidad/atributo/perk concretos. En creación, todo a 0.
  pending: PendingPoints;
  // Estados activos (sangrado, veneno, aturdido, esquivando, etc.). Vacío al
  // crear el PJ. Se rellena durante el combate vía rules/statuses.ts y se
  // limpia al cerrar el combate (sub-paso 4a.4): los statuses no persisten
  // entre combates en H3. La fuente de verdad de los tipos vive en
  // rules/statuses.ts; aquí sólo se almacena el contenedor inmutable.
  statuses: readonly StatusEffect[];
}

// -----------------------------------------------------------------------------
// Stats derivados
// -----------------------------------------------------------------------------

// DEF = 2 + floor(DES/2) + armadura. Biblia §4.4.
// Aquí la armadura se pasa como argumento; el inventario equipado vivirá en H5.
export function computeDefense(attributes: AttributeBlock, armor = 0): number {
  return 2 + Math.floor(attributes.des / 2) + armor;
}

// HP máximo BASE. PROVISIONAL para H1: 8 + 2·CON. CON 1 → 10, CON 7 → 22.
// Encaja con los HP_obj del scope MVP (10/20/40 por perfil) y con la simulación
// del dado v0.2. Pendiente de cierre cuando se cierre la curva de XP (§6).
//
// Función pura sobre AttributeBlock, sin perks. La consume:
//   - computeMaxHp (la API canónica, que añade bonos de perks).
//   - h2-preview-view / h2-confirm-view: durante la creación, el draft no es
//     Character todavía, por eso necesitan la fórmula base. La vista de preview
//     no refleja el bono del perk seleccionado en H2.4 hoy; cuando 4b cierre y
//     el bono importe en preview, se reescribe esta llamada (deuda menor de UI).
export function computeBaseMaxHp(attributes: AttributeBlock): number {
  return 8 + 2 * attributes.con;
}

// HP máximo del Character. Sub-paso 4b: cambia firma de AttributeBlock a
// Character para que los bonos de perks (perk_piel_dura, perk_temple, etc.)
// se sumen aquí UNA SOLA VEZ y no proliferen sumas en cada caller.
//
// Decisión #75 sagrada: la fórmula base (computeBaseMaxHp) sigue intacta y
// pura. Los bonos son CAPA EXTERNA aplicada en el último mile. Si un perk
// sube CON via attribute_bonus, esa suma ya está en `character.attributes.con`
// (la aplica createCharacter antes de invocar computeMaxHp), así que la
// fórmula base ya refleja CON+bono. Los hp_max_bonus son aditivos a eso.
export function computeMaxHp(character: Character): number {
  return computeBaseMaxHp(character.attributes) + perkHpMaxBonus(character);
}

// Suerte derivada. Decisión #43:
//   luck = floor((INT + VOL) / 2) - floor(level / 10)
// INT/VOL como base: atributos "mentales", el sabio y voluntarioso lee mejor
// las situaciones. Decrece con nivel: el late-game depende menos del azar
// (sensación de maestría). Puede ser negativa con builds extremos a alto nivel.
//
// Lo consume rules/exploration.ts vía worldState.luck. Quien construye el
// WorldState (state/ en H4) llama esta función al inicializar el tick.
export function computeLuck(character: Character): number {
  const mental = Math.floor((character.attributes.int + character.attributes.vol) / 2);
  const decay = Math.floor(character.level / 10);
  return mental - decay;
}

// -----------------------------------------------------------------------------
// Validación y creación
// -----------------------------------------------------------------------------

export interface CreateCharacterInput {
  id: string;
  name: string;
  portraitId: string;
  archetype: string | null;
  attributes: AttributeBlock;
  // skills al crear: { skillId: puntos asignados }. Se convierte a SkillBlock.
  skills: Readonly<Record<string, number>>;
  perks: readonly string[];
  // Punto de partida en el mundo. Lo decide el flujo de onboarding (§4.6).
  location: LocationBlock;
}

export type CreationErrorCode =
  | 'NAME_EMPTY'
  | 'ID_EMPTY'
  | 'ATTRIBUTE_MISSING'
  | 'ATTRIBUTE_NOT_INTEGER'
  | 'ATTRIBUTE_BELOW_MIN'
  | 'ATTRIBUTE_ABOVE_MAX_CREATION'
  | 'ATTRIBUTE_POOL_MISMATCH'
  | 'SKILL_NOT_INTEGER'
  | 'SKILL_NEGATIVE'
  | 'SKILL_ABOVE_MAX_CREATION'
  | 'SKILL_POOL_OVERFLOW'
  | 'PERKS_COUNT_MISMATCH';

export interface CreationError {
  code: CreationErrorCode;
  message: string;
}

export function validateCreation(input: CreateCharacterInput): CreationError[] {
  const errors: CreationError[] = [];

  if (input.id.trim() === '') {
    errors.push({ code: 'ID_EMPTY', message: 'El id del personaje no puede estar vacío.' });
  }
  if (input.name.trim() === '') {
    errors.push({ code: 'NAME_EMPTY', message: 'El nombre del personaje no puede estar vacío.' });
  }

  // Atributos
  let attrSum = 0;
  for (const id of ATTRIBUTE_IDS) {
    const value = input.attributes[id];
    if (value === undefined) {
      errors.push({ code: 'ATTRIBUTE_MISSING', message: `Falta el atributo "${id}".` });
      continue;
    }
    if (!Number.isInteger(value)) {
      errors.push({
        code: 'ATTRIBUTE_NOT_INTEGER',
        message: `El atributo "${id}" debe ser entero (recibido ${value}).`,
      });
      continue;
    }
    if (value < CREATION_RULES.attributeMinAtCreation) {
      errors.push({
        code: 'ATTRIBUTE_BELOW_MIN',
        message: `El atributo "${id}" debe ser ≥ ${CREATION_RULES.attributeMinAtCreation} (recibido ${value}).`,
      });
    }
    if (value > CREATION_RULES.attributeMaxAtCreation) {
      errors.push({
        code: 'ATTRIBUTE_ABOVE_MAX_CREATION',
        message: `El atributo "${id}" no puede superar ${CREATION_RULES.attributeMaxAtCreation} al crear (recibido ${value}).`,
      });
    }
    attrSum += value;
  }
  if (attrSum !== CREATION_RULES.attributePoolTotal) {
    errors.push({
      code: 'ATTRIBUTE_POOL_MISMATCH',
      message: `La suma de atributos debe ser exactamente ${CREATION_RULES.attributePoolTotal} (recibido ${attrSum}).`,
    });
  }

  // Habilidades
  let skillSum = 0;
  for (const [skillId, value] of Object.entries(input.skills)) {
    if (!Number.isInteger(value)) {
      errors.push({
        code: 'SKILL_NOT_INTEGER',
        message: `La habilidad "${skillId}" debe ser entera (recibido ${value}).`,
      });
      continue;
    }
    if (value < 0) {
      errors.push({
        code: 'SKILL_NEGATIVE',
        message: `La habilidad "${skillId}" no puede ser negativa (recibido ${value}).`,
      });
      continue;
    }
    if (value > CREATION_RULES.skillMaxAtCreation) {
      errors.push({
        code: 'SKILL_ABOVE_MAX_CREATION',
        message: `La habilidad "${skillId}" no puede superar ${CREATION_RULES.skillMaxAtCreation} al crear (recibido ${value}).`,
      });
    }
    skillSum += value;
  }
  if (skillSum > CREATION_RULES.skillPoolTotal) {
    errors.push({
      code: 'SKILL_POOL_OVERFLOW',
      message: `La suma de habilidades supera ${CREATION_RULES.skillPoolTotal} puntos (recibido ${skillSum}).`,
    });
  }

  // Perks
  if (input.perks.length !== CREATION_RULES.perksAtCreation) {
    errors.push({
      code: 'PERKS_COUNT_MISMATCH',
      message: `Debe elegirse exactamente ${CREATION_RULES.perksAtCreation} perk al crear (recibido ${input.perks.length}).`,
    });
  }

  return errors;
}

// Construye un Character autoritativo a partir de un input ya validado.
// Lanza si el input no pasa validateCreation: la UI debe filtrar antes.
export function createCharacter(input: CreateCharacterInput): Character {
  const errors = validateCreation(input);
  if (errors.length > 0) {
    const summary = errors.map((e) => `[${e.code}] ${e.message}`).join(' · ');
    throw new Error(`createCharacter: input inválido. ${summary}`);
  }

  const skills: Record<string, SkillEntry> = {};
  for (const [skillId, value] of Object.entries(input.skills)) {
    skills[skillId] = { value, usage: 0 };
  }

  // Sub-paso 4b.4 opción B: aplicar `attribute_bonus` de los perks al
  // `attributes` final ANTES de calcular HP máx. Construimos un Character
  // temporal mínimo (sólo con los campos que perkAttributeBonus consulta:
  // .perks) para reusar el wrapper. Si el perk sube CON, el HP máx ya lo
  // refleja porque la fórmula base 8+2·CON se evalúa sobre el atributo
  // bonificado. El bono se incorpora a `character.attributes` para siempre:
  // cualquier cómputo posterior (DEF, luck, pool de ataque) lee el atributo
  // ya bonificado sin saber del perk.
  const baseAttributes: AttributeBlock = { ...input.attributes };
  // Character "temporal" sólo para que perkAttributeBonus lea .perks. El
  // resto de campos no se consultan y se rellenan con stubs irrelevantes.
  const stubForBonus = { perks: input.perks } as unknown as Character;
  const bonusedAttributes: AttributeBlock = {
    fue: baseAttributes.fue + perkAttributeBonus(stubForBonus, 'fue'),
    des: baseAttributes.des + perkAttributeBonus(stubForBonus, 'des'),
    con: baseAttributes.con + perkAttributeBonus(stubForBonus, 'con'),
    int: baseAttributes.int + perkAttributeBonus(stubForBonus, 'int'),
    vol: baseAttributes.vol + perkAttributeBonus(stubForBonus, 'vol'),
  };

  // Para HP máx necesitamos un Character que ya tenga los `attributes`
  // bonificados Y los perks (porque perkHpMaxBonus también lee perks).
  // Construimos otro stub mínimo. La única razón por la que HP máx no se
  // hace al final es que el campo `hp` necesita el resultado para crearse.
  const characterForHp = { attributes: bonusedAttributes, perks: input.perks } as unknown as Character;
  const maxHp = computeMaxHp(characterForHp);

  return {
    id: input.id,
    name: input.name,
    portraitId: input.portraitId,
    archetype: input.archetype,
    attributes: bonusedAttributes,
    skills,
    perks: [...input.perks],
    level: 1,
    xp: 0,
    gold: CREATION_RULES.startingGold,
    hp: { current: maxHp, max: maxHp },
    // Decisión D-2b-1 / D-equip-2c: el Character recién creado arranca con la
    // Daga inicial equipada en main_hand. La pantalla H2.5a muestra placeholder
    // narrativo, pero el Character persistido es jugable (combat.ts consume
    // equippedWeapon). El detalle del catálogo vive en data/items.ts para no
    // acoplar este módulo al contenido.
    inventory: buildStartingInventory(),
    location: { ...input.location },
    faction_reputation: {},
    achievements: [],
    flags: {},
    alive: true,
    epitaph: null,
    pending: { skill: 0, attribute: 0, perk: 0 },
    statuses: [],
  };
}

// -----------------------------------------------------------------------------
// Oro (recurso del personaje, biblia §4.7)
// -----------------------------------------------------------------------------

// Suma `amount` al oro del personaje. Puro: devuelve un nuevo Character.
// `amount = 0` es no-op válido (devuelve un Character con el mismo gold).
// Lanza RangeError si `amount` no es entero o es negativo.
export function addGold(character: Character, amount: number): Character {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`addGold: amount debe ser entero (recibido ${amount}).`);
  }
  if (amount < 0) {
    throw new RangeError(`addGold: amount no puede ser negativo (recibido ${amount}).`);
  }
  return { ...character, gold: character.gold + amount };
}

// Resta `amount` al oro del personaje. Puro: devuelve un nuevo Character.
// `amount = 0` es no-op válido. Lanza RangeError si `amount` no es entero,
// es negativo, o supera el saldo actual (no se permite gold negativo).
export function spendGold(character: Character, amount: number): Character {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`spendGold: amount debe ser entero (recibido ${amount}).`);
  }
  if (amount < 0) {
    throw new RangeError(`spendGold: amount no puede ser negativo (recibido ${amount}).`);
  }
  if (amount > character.gold) {
    throw new RangeError(
      `spendGold: saldo insuficiente (gold=${character.gold}, amount=${amount}).`,
    );
  }
  return { ...character, gold: character.gold - amount };
}
