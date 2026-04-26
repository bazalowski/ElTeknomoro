// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.11 (facciones). H7.
//
// 3 facciones en MVP con reputación numérica bidireccional. Las decisiones del
// jugador suben o bajan reputación; los tramos del grafo (fast-travel) cambian
// de seguro a arriesgado según la reputación con la facción dominante.
//
// PROVISIONAL H7:
//   - Rangos de tier (hated/neutral/honored). Números placeholder.
//   - Catálogo concreto de las 3 facciones del MVP es contenido (data/).

import type { Character } from './character';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export type FactionId = string;

export interface Faction {
  id: FactionId;
  name: string;
  // Reputación inicial al empezar partida nueva.
  starting_reputation: number;
}

// PROVISIONAL H7: 5 tiers con cortes en -50/-10/+10/+50. Se ajusta en H7.
export type ReputationTier = 'hated' | 'unfriendly' | 'neutral' | 'friendly' | 'honored';

export const REPUTATION_TIER_THRESHOLDS = {
  hated: -50,
  unfriendly: -10,
  neutral: 10,
  friendly: 50,
} as const;

export interface ReputationDelta {
  faction_id: FactionId;
  delta: number;
  // Texto para log narrativo. La capa de presentación lo localiza.
  reason: string;
}

// -----------------------------------------------------------------------------
// Lecturas
// -----------------------------------------------------------------------------

export function getReputation(character: Character, faction_id: FactionId): number {
  return character.faction_reputation[faction_id] ?? 0;
}

export function getReputationTier(reputation: number): ReputationTier {
  if (reputation < REPUTATION_TIER_THRESHOLDS.hated) return 'hated';
  if (reputation < REPUTATION_TIER_THRESHOLDS.unfriendly) return 'unfriendly';
  if (reputation < REPUTATION_TIER_THRESHOLDS.neutral) return 'neutral';
  if (reputation < REPUTATION_TIER_THRESHOLDS.friendly) return 'friendly';
  return 'honored';
}

// -----------------------------------------------------------------------------
// Aplicación
// -----------------------------------------------------------------------------

// Aplica un delta de reputación. Devuelve nuevo Character. La razón se pierde
// aquí: el caller debe loguear en su propio sistema de eventos.
export function adjustReputation(character: Character, delta: ReputationDelta): Character {
  const current = getReputation(character, delta.faction_id);
  return {
    ...character,
    faction_reputation: {
      ...character.faction_reputation,
      [delta.faction_id]: current + delta.delta,
    },
  };
}

// Aplica varios deltas en orden. Útil para eventos que tocan varias facciones
// (matar a un emisario hostil sube una facción y baja otra, etc.).
export function adjustReputations(
  character: Character,
  deltas: readonly ReputationDelta[],
): Character {
  return deltas.reduce((c, d) => adjustReputation(c, d), character);
}
