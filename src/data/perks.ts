// Catálogo de perks. En H2 sólo los 5 iniciales (uno por arquetipo dominante).
// El árbol completo (post-creación, +1 cada 5 niveles) se redacta en H7.
//
// PROVISIONAL H7: el motor de aplicación de PerkEffect aún no existe (lo
// construye H7 cuando entren las subidas de nivel manuales). En H2 los perks
// se eligen y se persisten en `character.perks`, pero su efecto mecánico no se
// dispara hasta H3 (combate) y H7 (todo lo demás). La descripción visible es
// el contrato con el jugador; el código que la haga real llega después.

import type { AttributeId } from '../rules/character';

export type PerkEffectKind =
  | 'attribute_bonus'
  | 'derived_stat_bonus'
  | 'combat_modifier'
  | 'exploration_modifier'
  | 'narrative';

export interface PerkEffect {
  kind: PerkEffectKind;
  payload: Readonly<Record<string, unknown>>;
}

export interface PerkDefinition {
  id: string;
  name: string;
  description: string;
  required_dominant_attribute: AttributeId | null;
  min_level: number;
  prerequisites: readonly string[];
  effects: readonly PerkEffect[];
}

export const PERKS: readonly PerkDefinition[] = [
  {
    id: 'perk_golpe_brutal',
    name: 'Golpe Brutal',
    description: 'Tu primer ataque del combate suma +1 éxito al pool antes de calcular impacto.',
    required_dominant_attribute: 'fue',
    min_level: 1,
    prerequisites: [],
    effects: [
      {
        kind: 'combat_modifier',
        payload: { trigger: 'first_attack_of_combat', bonus_successes: 1 },
      },
    ],
  },
  {
    id: 'perk_pies_ligeros',
    name: 'Pies Ligeros',
    description: '+2 a la iniciativa permanente.',
    required_dominant_attribute: 'des',
    min_level: 1,
    prerequisites: [],
    effects: [
      {
        kind: 'derived_stat_bonus',
        payload: { stat: 'initiative', value: 2 },
      },
    ],
  },
  {
    id: 'perk_piel_dura',
    name: 'Piel Dura',
    description: '+2 HP máximo adicionales (sobre la base 8 + 2·CON).',
    required_dominant_attribute: 'con',
    min_level: 1,
    prerequisites: [],
    effects: [
      {
        kind: 'derived_stat_bonus',
        payload: { stat: 'hp_max', value: 2 },
      },
    ],
  },
  {
    id: 'perk_ojo_clinico',
    name: 'Ojo Clínico',
    description: 'Identificas rareza y daño base de los items sin necesidad de tooltip especial.',
    required_dominant_attribute: 'int',
    min_level: 1,
    prerequisites: [],
    effects: [
      {
        kind: 'narrative',
        payload: { flag: 'perk_ojo_clinico_activo' },
      },
    ],
  },
  {
    id: 'perk_temple',
    name: 'Temple',
    description: 'Inmune al primer estado de miedo o pánico que recibas en cada partida.',
    required_dominant_attribute: 'vol',
    min_level: 1,
    prerequisites: [],
    effects: [
      {
        kind: 'narrative',
        payload: { flag: 'perk_temple_carga_disponible' },
      },
    ],
  },
] as const;

export const PERKS_BY_ID: Readonly<Record<string, PerkDefinition>> =
  Object.fromEntries(PERKS.map((p) => [p.id, p]));
