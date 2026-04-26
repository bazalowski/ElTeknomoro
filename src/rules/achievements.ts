// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.11 (logros). H7.
//
// 15 logros en MVP con triggers implementados. Los logros son observadores:
// reciben eventos del juego y devuelven los logros que se desbloquean.
//
// PROVISIONAL H7:
//   - El catálogo concreto de los 15 logros es contenido (data/), no vive aquí.
//   - El conjunto exhaustivo de AchievementTrigger crece con los hitos.

import type { Character } from './character';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export type AchievementId = string;

// Eventos que pueden disparar logros. Cada hito añade los suyos:
//   H3 (combate): first_combat_won, killed_enemy_x, perfect_combat (sin perder HP)
//   H4 (mapa): biome_visited, node_discovered, distance_traveled_x
//   H5 (inventario): item_equipped_rare, durability_zero
//   H6 (crafteo): first_craft, recipe_discovered, critical_craft
//   H7 (progresión): level_reached_x, reputation_tier_x
//   Permadeath: first_death (paradójico pero útil para onboarding)
export type AchievementTriggerKind =
  | 'combat_won'
  | 'enemy_killed'
  | 'biome_visited'
  | 'node_discovered'
  | 'craft_completed'
  | 'recipe_discovered'
  | 'level_reached'
  | 'death';

export interface AchievementTrigger {
  kind: AchievementTriggerKind;
  // Payload específico del kind. Lo lee el predicate del logro concreto.
  // Mantenemos unknown para no acoplar achievements.ts a las shapes de cada
  // hito; las definiciones de logro hacen el cast con runtime check.
  payload: Readonly<Record<string, unknown>>;
}

export interface Achievement {
  id: AchievementId;
  // Texto del logro. La capa de presentación lo localiza.
  title: string;
  description: string;
  // Función pura que decide si este trigger desbloquea este logro para este
  // personaje. Si el logro ya está en character.achievements, no se reevalúa
  // (lo filtra checkAchievements).
  predicate: (character: Character, trigger: AchievementTrigger) => boolean;
}

// -----------------------------------------------------------------------------
// Resolución
// -----------------------------------------------------------------------------

// Evalúa todos los logros del catálogo contra el trigger y devuelve los que
// se desbloquean. NO muta al personaje: el llamador aplica con grantAchievement.
//
// Filtra los que el personaje ya tiene desbloqueados.
export function checkAchievements(
  character: Character,
  trigger: AchievementTrigger,
  catalog: readonly Achievement[],
): AchievementId[] {
  const owned = new Set(character.achievements);
  const unlocked: AchievementId[] = [];
  for (const achievement of catalog) {
    if (owned.has(achievement.id)) continue;
    if (achievement.predicate(character, trigger)) {
      unlocked.push(achievement.id);
    }
  }
  return unlocked;
}

// Aplica una lista de logros nuevos al personaje. Idempotente: si ya tenía
// alguno, lo ignora.
export function grantAchievements(
  character: Character,
  ids: readonly AchievementId[],
): Character {
  const owned = new Set(character.achievements);
  const newly = ids.filter((id) => !owned.has(id));
  if (newly.length === 0) return character;
  return {
    ...character,
    achievements: [...character.achievements, ...newly],
  };
}
