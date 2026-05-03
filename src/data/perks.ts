// Catálogo de perks. En H2 se elige 1 perk al crear (uno por arquetipo
// dominante: 5 obligatorios). En H3+ los perks YA tienen efecto mecánico:
// el motor de combate (rules/combat.ts) y la creación (rules/character.ts)
// consultan `effect` vía `rules/perks.ts` (helper SAGRADO). Los perks que
// dependen de subsistemas no cerrados (skill pool, narrativa) declaran su
// `effect` para fijar el contrato, pero su aplicación queda marcada como
// deuda técnica explícita en el helper hasta que entre el subsistema.
//
// El árbol completo (post-creación, +1 cada 5 niveles) se redacta en H7.
// Sub-paso 4b: schema reformado a `effect` singular (discriminated union).
// Sub-paso 4c: enemigos podrán llevar perks (perfiles enemigos diferidos).

import type { AttributeId } from '../rules/character';

// -----------------------------------------------------------------------------
// PerkEffect — discriminated union
// -----------------------------------------------------------------------------
//
// Un perk = exactamente UN efecto mecánico. La unión discriminada permite
// que el helper (rules/perks.ts) consulte el campo concreto sin payloads
// opacos. Cada `kind` documenta dónde se aplica el bono dentro del motor.
//
// Decisión 4b: se prefiere `effect: PerkEffect` singular sobre el array
// `effects[]` porque (a) el catálogo H7 cuenta perks compuestos como múltiples
// nodos del árbol, no como un solo perk con N efectos; (b) la búsqueda con
// `kind` discriminado es trivial y O(1) por perk; (c) el caller siempre
// pregunta por un kind concreto, nunca itera N efectos por perk.
export type PerkEffect =
  // Suma directa al atributo indicado en CREACIÓN (createCharacter aplica
  // una vez sobre el `attributes` final tras validar el pool de 12). El bono
  // se persiste y queda incorporado al `attributes` del Character; cualquier
  // cómputo derivado (HP máx, DEF, luck, pool de combate) lo refleja sin
  // saber del perk. Decisión 4b.4 opción B.
  | { kind: 'attribute_bonus'; attribute: AttributeId; value: number }
  // Suma a HP máx en el cómputo de `computeMaxHp(character)`. Independiente
  // del bono de CON: si el perk sube CON via `attribute_bonus` y otro perk
  // (futuro) sube HP máx, ambos cuentan.
  | { kind: 'hp_max_bonus'; value: number }
  // Suma a DEF en `computeCharacterDefense`. Capa externa al `computeDefense`
  // puro (que sigue siendo función pura sin perks). Equivale a "armadura
  // intrínseca" del PJ por temperamento o adaptación.
  | { kind: 'def_bonus'; value: number }
  // Suma N dados al pool de ataque del PJ. Aplica permanentemente a TODO
  // ataque (no por turno, no por trigger). Brutal antes era trigger; tras
  // 4b.3 se degrada a +1 permanente. La razón es que no hay subsistema de
  // "primer ataque del combate" sin pintar timing en el motor.
  | { kind: 'attack_pool_bonus'; value: number }
  // Suma N puntos a la iniciativa del PJ tras la tirada (DES + d20 + bono).
  | { kind: 'initiative_bonus'; value: number }
  // Suma N de daño AL impacto del PJ (post-resolveAttack, sólo si hit). NO
  // entra dentro de `resolveAttack` (#75 sagrado): se decora desde el caller
  // (applyCharacterAction). Esto preserva la regla pura intacta.
  | { kind: 'damage_bonus'; value: number }
  // Suma N puntos al pool inicial de habilidades (10 por defecto, biblia
  // §4.2). DEUDA H7: el helper ya lo soporta, pero la creación todavía no
  // consulta este efecto porque la UI de habilidades (H2.3) trabaja contra
  // CREATION_RULES.skillPoolTotal hardcodeado. Se cierra cuando entre el
  // sistema de subida de habilidades por XP (rules/progression.ts H7).
  | { kind: 'skill_pool_bonus'; value: number };

export type PerkEffectKind = PerkEffect['kind'];

export interface PerkDefinition {
  id: string;
  name: string;
  description: string;
  required_dominant_attribute: AttributeId | null;
  min_level: number;
  prerequisites: readonly string[];
  effect: PerkEffect;
}

// -----------------------------------------------------------------------------
// Catálogo H2 (5 obligatorios) + H3 (5 nuevos, sub-paso 4b.7)
// -----------------------------------------------------------------------------
//
// Los 5 obligatorios cubren los 5 atributos dominantes (uno por atributo). Los
// 5 nuevos amplían el catálogo de elección sin abrir nuevos atributos. Los 10
// son `min_level: 1` y sin prerequisites: cualquiera elegible al crear.
export const PERKS: readonly PerkDefinition[] = [
  // ---- Los 5 obligatorios (recableados en 4b) ----
  {
    id: 'perk_golpe_brutal',
    name: 'Golpe Brutal',
    // Antes (H2): "primer ataque del combate +1 éxito al pool". Trigger
    // requería timing del primer ataque. Sub-paso 4b.3: degradado a +1 dado
    // al pool permanente. Pierde el "primer", se asume.
    description: '+1 dado al pool de ataque permanente. Tu hostilidad se nota antes incluso de moverte.',
    required_dominant_attribute: 'fue',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'attack_pool_bonus', value: 1 },
  },
  {
    id: 'perk_pies_ligeros',
    name: 'Pies Ligeros',
    description: '+2 a la iniciativa permanente.',
    required_dominant_attribute: 'des',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'initiative_bonus', value: 2 },
  },
  {
    id: 'perk_piel_dura',
    name: 'Piel Dura',
    description: '+2 HP máximo adicionales (sobre la base 8 + 2·CON).',
    required_dominant_attribute: 'con',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'hp_max_bonus', value: 2 },
  },
  {
    id: 'perk_ojo_clinico',
    name: 'Ojo Clínico',
    // Reescrito en 4b.6: pasa de flag narrativo opaco a +1 daño post-impacto.
    // El "ojo clínico" del observador identifica el punto frágil; mecánicamente
    // es un sumando externo al daño tras confirmar hit (no toca resolveAttack).
    description: 'Identificas la grieta antes del golpe. +1 al daño cada vez que impactas.',
    required_dominant_attribute: 'int',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'damage_bonus', value: 1 },
  },
  {
    id: 'perk_temple',
    name: 'Temple',
    // Reescrito en 4b.6: pasa de flag narrativo "inmune al primer miedo" a
    // +2 HP máx. El catálogo de statuses no se abre en 4b (decisión cerrada);
    // hasta que exista `feared` no podemos honrar la inmunidad. +2 HP máx es
    // el equivalente numérico provisional honesto del "aguante mental".
    description: '+2 HP máximo. La voluntad endurece la carne tanto como cualquier músculo.',
    required_dominant_attribute: 'vol',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'hp_max_bonus', value: 2 },
  },
  // ---- Los 5 nuevos (sub-paso 4b.7) ----
  {
    id: 'perk_filo_paciente',
    name: 'Filo Paciente',
    description: '+1 al daño de cada impacto. El golpe llega cuando debe llegar.',
    required_dominant_attribute: 'fue',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'damage_bonus', value: 1 },
  },
  {
    id: 'perk_callo_de_intemperie',
    name: 'Callo de Intemperie',
    // +1 DEF capa externa. La piel curtida del que ha pasado demasiados
    // inviernos a la intemperie absorbe lo que la armadura no llega a parar.
    description: '+1 a la defensa permanente. Pasaste demasiados inviernos a la intemperie.',
    required_dominant_attribute: 'con',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'def_bonus', value: 1 },
  },
  {
    id: 'perk_pulmon_de_ceniza',
    name: 'Pulmón de Ceniza',
    // +1 CON al crear (opción B aprobada). Suma directa al `attributes` final
    // antes de calcular HP máx, así que la HP máx ya refleja CON+1. El bono
    // se incorpora al Character y persiste.
    description: '+1 a CON al crear el personaje. Respiraste lo que mata a otros y aún sigues aquí.',
    required_dominant_attribute: 'con',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'attribute_bonus', attribute: 'con', value: 1 },
  },
  {
    id: 'perk_lectura_de_huellas',
    name: 'Lectura de Huellas',
    // DEUDA H7: el helper soporta este kind, pero la creación de personaje
    // no consulta `skill_pool_bonus` aún. La UI de habilidades (H2.3) usa
    // CREATION_RULES.skillPoolTotal hardcodeado. Cuando entre el sistema
    // de subida de habilidades por XP (H7), `skill_pool_bonus` se aplicará
    // tanto al pool inicial como a las subidas. Hasta entonces este perk
    // es elegible (queda en `character.perks`) pero su efecto numérico es
    // 0 hasta que H7 lo cablee. La descripción es el contrato con el jugador.
    description: '+2 puntos al pool de habilidades inicial. (Activo desde H7).',
    required_dominant_attribute: 'int',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'skill_pool_bonus', value: 2 },
  },
  {
    id: 'perk_sello_del_humo',
    name: 'Sello del Humo',
    // Único perk con sabor "arcano" en el catálogo H2/H3. Numéricamente igual
    // a Pies Ligeros (+2 iniciativa); narrativamente reverencial al esoterismo
    // raro del lore (decisión #47). Sin abrir subsistema mágico.
    description: '+2 a la iniciativa permanente. Algo en ti se mueve antes que el aire.',
    required_dominant_attribute: 'vol',
    min_level: 1,
    prerequisites: [],
    effect: { kind: 'initiative_bonus', value: 2 },
  },
] as const;

export const PERKS_BY_ID: Readonly<Record<string, PerkDefinition>> =
  Object.fromEntries(PERKS.map((p) => [p.id, p]));
