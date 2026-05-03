// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Sub-paso 4b: capa de aplicación de PerkEffect del catálogo (data/perks.ts).
//
// Cómo encaja en el motor:
//   - data/perks.ts declara el catálogo y el schema (discriminated union).
//   - rules/perks.ts (este archivo) traduce `character.perks: string[]` a
//     bonos numéricos vía wrappers semánticos.
//   - rules/character.ts y rules/combat.ts importan los wrappers y los suman
//     en el sitio adecuado (HP máx, DEF, pool, iniciativa, daño, atributos).
//
// Decisión #75 (motor intocable): los wrappers son CAPA EXTERNA. Las funciones
// puras del motor (rollCombatPool, computeHitThreshold, resolveAttack,
// computeDefense, computeMaxHp original) no se modifican: el caller suma el
// bono en el último mile, igual que se hace con el bono de dodging
// (defensiveThresholdBonus) o la armadura.
//
// Sin estado, sin RNG. Las funciones son `O(perks_count)` con perks_count = 1
// en MVP H2 pero el helper soporta N (H7 cuando se abran subidas de nivel).

import type { Character, AttributeId } from './character';
import type { PerkEffect, PerkEffectKind } from '../data/perks';
import { PERKS_BY_ID } from '../data/perks';

// -----------------------------------------------------------------------------
// Helper genérico
// -----------------------------------------------------------------------------

// Suma el `value` de todos los perks del `character` cuyo `effect.kind` coincida
// con `K` y, opcionalmente, pasen el predicado `filter(effect)`. Devuelve 0
// si no hay coincidencias o si el perk no existe en PERKS_BY_ID (defensa: si
// la persistencia trae un perk huérfano, no rompe el motor; lo ignora).
//
// Tipado: la función es genérica sobre `K extends PerkEffectKind`. El extract
// `Extract<PerkEffect, { kind: K }>` estrecha el tipo del effect al kind
// concreto, así el filter del caller recibe el tipo exacto sin casts
// (ej. `attribute_bonus` ya tiene `attribute` y `value` accesibles).
//
// El parámetro `filter` permite refinar selecciones (p.ej. `attribute_bonus`
// para un atributo concreto). Sin filter, suma TODOS los effects del kind.
export function sumPerkBonuses<K extends PerkEffectKind>(
  character: Character,
  kind: K,
  filter?: (effect: Extract<PerkEffect, { kind: K }>) => boolean,
): number {
  let total = 0;
  for (const perkId of character.perks) {
    const perk = PERKS_BY_ID[perkId];
    if (perk === undefined) continue; // perk huérfano: ignoramos sin lanzar
    if (perk.effect.kind !== kind) continue;
    // Narrowing manual: la guarda de arriba garantiza la pertenencia, pero TS
    // no propaga el estrechamiento al ramal `else` con kind genérico.
    const narrowed = perk.effect as Extract<PerkEffect, { kind: K }>;
    if (filter !== undefined && !filter(narrowed)) continue;
    // Todos los kinds del schema tienen `value: number`. Cast a la forma común
    // para acceder al sumando sin un switch exhaustivo (que sería ruido aquí).
    total += (narrowed as unknown as { value: number }).value;
  }
  return total;
}

// -----------------------------------------------------------------------------
// Wrappers semánticos (uno por punto de aplicación en el motor)
// -----------------------------------------------------------------------------

// Bono total al daño POST-IMPACTO. Se suma al `result.damage` tras
// resolveAttack si `result.hit`. NO entra al cómputo de margin ni al daño
// puro de resolveAttack (#75 sagrado).
export function perkDamageBonus(character: Character): number {
  return sumPerkBonuses(character, 'damage_bonus');
}

// Bono total a DEF. Se suma en `computeCharacterDefense` (rules/combat.ts) al
// resultado de `computeDefense(attributes, armor)`. computeDefense permanece
// puro y agnóstico de perks.
export function perkDefBonus(character: Character): number {
  return sumPerkBonuses(character, 'def_bonus');
}

// Bono total a HP máx. Se suma en `computeMaxHp(character)` al resultado de la
// fórmula base 8 + 2·CON. Independiente del bono de CON: si un perk sube CON
// (attribute_bonus) y otro sube HP máx (hp_max_bonus), ambos cuentan, y el
// orden lo asegura createCharacter (atributos primero, luego HP máx).
export function perkHpMaxBonus(character: Character): number {
  return sumPerkBonuses(character, 'hp_max_bonus');
}

// Bono total al pool de ataque del PJ. Se suma en `buildAttackInputFromCharacter`
// antes de devolver. Aplica a todo ataque, sin trigger.
export function perkAttackPoolBonus(character: Character): number {
  return sumPerkBonuses(character, 'attack_pool_bonus');
}

// Bono total a iniciativa. Se suma en `rollInitiativeForCharacter` al
// resultado de DES + 1d20.
export function perkInitiativeBonus(character: Character): number {
  return sumPerkBonuses(character, 'initiative_bonus');
}

// Bono total a un atributo concreto. Se aplica UNA VEZ en `createCharacter`
// (opción B 4b.4): suma al `attributes` final tras validar y antes de calcular
// HP máx. Cualquier cómputo derivado posterior (HP máx, DEF, luck, pool) lee
// el atributo ya bonificado sin saber del perk.
//
// Pasada la creación, NO se vuelve a llamar: el bono está incorporado a
// `character.attributes` para siempre. Si en H7 hay perks que suben atributos
// post-creación, la regla de aplicación será la misma (suma + persiste).
export function perkAttributeBonus(character: Character, attributeId: AttributeId): number {
  return sumPerkBonuses(
    character,
    'attribute_bonus',
    (effect) => effect.attribute === attributeId,
  );
}

// -----------------------------------------------------------------------------
// Deuda H7 documentada (no exportada, sólo recordatorio)
// -----------------------------------------------------------------------------
//
// `skill_pool_bonus` no tiene wrapper exportado. La razón: la creación de
// personaje (rules/character.ts validateCreation) usa CREATION_RULES.skillPoolTotal
// hardcodeado. Sumar el bono en validación obligaría a recibir el draft de
// perks en validateCreation, que hoy es agnóstico. Cuando entre el sistema
// de subida de habilidades por XP (H7), `skill_pool_bonus` se aplicará allí
// con su propio wrapper. Hasta entonces, los perks con `kind: 'skill_pool_bonus'`
// (Lectura de Huellas) son elegibles y persistidos, pero su efecto numérico
// es 0. La descripción del perk lo dice explícitamente al jugador.
