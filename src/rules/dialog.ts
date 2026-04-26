// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.13 (diálogos y NPCs). H7.
//
// Lista de temas (estilo Morrowind), no árboles ramificados. Hasta 6 temas
// visibles con scroll. Tiradas sociales visibles antes de comprometerse.
// Comercio en pantalla dedicada accesible desde diálogo.

import type { Rng } from './dice';
import { rollD20 } from './dice';
import type { Character } from './character';
import type { FactionId, ReputationTier } from './faction';
import { getReputation, getReputationTier } from './faction';

// -----------------------------------------------------------------------------
// NPC
// -----------------------------------------------------------------------------

export type NpcId = string;
export type TopicId = string;

export interface Npc {
  id: NpcId;
  name: string;
  portrait_id: string;
  faction_id: FactionId | null;
  // Tema disponibles en bruto. Se filtran por elegibilidad antes de mostrar.
  topics: readonly DialogTopic[];
  // Si es comerciante, lista de items que vende (catálogo de inventory).
  // null = no comercia.
  shop_inventory_id: string | null;
}

export interface DialogTopic {
  id: TopicId;
  // Texto que el jugador ve en el menú (modal panel inferior).
  label: string;
  // Texto de la respuesta del NPC al elegir el tema. Si hay social_check, este
  // es el texto base; on_success/on_failure pueden sobrescribir.
  response: string;
  // Condiciones para que el tema aparezca. Todas AND.
  conditions: TopicConditions;
  // Si el tema requiere tirada social (Persuasión, Intimidar, etc.).
  social_check: SocialCheck | null;
}

export interface TopicConditions {
  required_flags?: readonly string[];
  forbidden_flags?: readonly string[];
  min_reputation?: { faction_id: FactionId; value: number };
  // Tier mínimo con la facción del NPC (uso común: "los honored ven más temas").
  min_tier_with_npc?: ReputationTier;
}

// -----------------------------------------------------------------------------
// Tirada social (biblia §4.13: visible antes de comprometerse)
// -----------------------------------------------------------------------------

export interface SocialCheck {
  skill: string;
  difficulty: number;
  // Texto si éxito; sustituye a topic.response si está presente.
  on_success_response: string | null;
  on_failure_response: string | null;
  // Efectos secundarios. La consecuencia narrativa concreta vive en el llamador.
  on_success_flags?: readonly string[];
  on_failure_flags?: readonly string[];
  on_success_reputation?: readonly { faction_id: FactionId; delta: number }[];
  on_failure_reputation?: readonly { faction_id: FactionId; delta: number }[];
}

export interface SocialCheckPreview {
  skill: string;
  skill_value: number;
  difficulty: number;
  // Probabilidad estimada de éxito mostrada al jugador. PROVISIONAL H7:
  // 1d20 + skill_value ≥ difficulty → P = max(0, min(1, (21 + skill_value - difficulty) / 20))
  estimated_success: number;
}

export type SocialBranch = 'success' | 'failure';

export interface SocialCheckResult {
  branch: SocialBranch;
  roll: { die: number; skill_value: number; total: number };
  applied_response: string;
}

// -----------------------------------------------------------------------------
// Lecturas
// -----------------------------------------------------------------------------

// Filtra topics elegibles por las conditions del personaje.
export function getAvailableTopics(npc: Npc, character: Character): DialogTopic[] {
  return npc.topics.filter((topic) => isTopicEligible(topic, npc, character));
}

export function isTopicEligible(topic: DialogTopic, npc: Npc, character: Character): boolean {
  const c = topic.conditions;
  if (c.required_flags) {
    for (const f of c.required_flags) {
      if (!character.flags[f]) return false;
    }
  }
  if (c.forbidden_flags) {
    for (const f of c.forbidden_flags) {
      if (character.flags[f]) return false;
    }
  }
  if (c.min_reputation) {
    const rep = getReputation(character, c.min_reputation.faction_id);
    if (rep < c.min_reputation.value) return false;
  }
  if (c.min_tier_with_npc && npc.faction_id !== null) {
    const rep = getReputation(character, npc.faction_id);
    const tier = getReputationTier(rep);
    if (!tierAtLeast(tier, c.min_tier_with_npc)) return false;
  }
  return true;
}

const TIER_ORDER: readonly ReputationTier[] = [
  'hated',
  'unfriendly',
  'neutral',
  'friendly',
  'honored',
];

function tierAtLeast(actual: ReputationTier, min: ReputationTier): boolean {
  return TIER_ORDER.indexOf(actual) >= TIER_ORDER.indexOf(min);
}

// -----------------------------------------------------------------------------
// Tirada social
// -----------------------------------------------------------------------------

export function previewSocialCheck(check: SocialCheck, character: Character): SocialCheckPreview {
  const skill = character.skills[check.skill];
  const skill_value = skill === undefined ? 0 : skill.value;
  // PROVISIONAL H7: P(éxito) ≈ caras de d20 que cumplen die + skill_value ≥ difficulty.
  const minDie = check.difficulty - skill_value;
  let success_faces = 0;
  if (minDie <= 1) success_faces = 20;
  else if (minDie > 20) success_faces = 0;
  else success_faces = 21 - minDie;
  const estimated_success = success_faces / 20;
  return {
    skill: check.skill,
    skill_value,
    difficulty: check.difficulty,
    estimated_success,
  };
}

export function attemptSocialCheck(
  topic: DialogTopic,
  character: Character,
  rng: Rng,
): SocialCheckResult {
  if (topic.social_check === null) {
    throw new Error(`attemptSocialCheck: el tema "${topic.id}" no declara social_check.`);
  }
  const check = topic.social_check;
  const skill = character.skills[check.skill];
  const skill_value = skill === undefined ? 0 : skill.value;
  const die = rollD20(rng);
  const total = die + skill_value;
  const success = total >= check.difficulty;
  const branch: SocialBranch = success ? 'success' : 'failure';
  const applied_response = success
    ? (check.on_success_response ?? topic.response)
    : (check.on_failure_response ?? topic.response);
  return {
    branch,
    roll: { die, skill_value, total },
    applied_response,
  };
}
