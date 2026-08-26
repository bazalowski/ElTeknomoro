// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.9 (muerte y permadeath) + decisión #44 (condición de victoria). H3.
//
// El slot no se borra: queda marcado con un EpitaphLike consultable que captura
// los datos finales del personaje + causa + ubicación. La "causa" puede ser
// muerte (todas las variantes) o victoria (decisión #44: la pantalla post-victoria
// reutiliza el formato de epitafio).
//
// PROVISIONAL H3: el set de DeathCauseKind crecerá con el catálogo de eventos
// (trampa, hambre, etc.). Aquí entran los que H3-H4 producen.

import type { Character } from './character';

// -----------------------------------------------------------------------------
// Causa de fin de partida (muerte o victoria)
// -----------------------------------------------------------------------------

export type DeathCauseKind =
  | 'killed_by_enemy'
  | 'killed_by_trap'
  | 'killed_by_environment'
  | 'killed_by_status'
  // Inanición (#98, sub-paso 4d). El helper vive en `rules/fatigue.ts`, no
  // aquí, porque la causa la construye quien conoce la regla de la jornada.
  | 'killed_by_fatigue'
  | 'unknown';

// Decisión #44: la pantalla de victoria reutiliza el formato de epitafio,
// distinguida por kind: 'victory'. La quest principal del modo Historia se
// diseña en H4 y dispara esta causa.
export type EndOfRunCauseKind = DeathCauseKind | 'victory';

export interface EndOfRunCause {
  kind: EndOfRunCauseKind;
  // Identificador del agente o quest. Para 'killed_by_enemy' es enemy_id; para
  // 'killed_by_trap' es el id de la entrada de exploración; para
  // 'killed_by_status' es el StatusKind; para 'victory' es el quest_id.
  agent_id: string | null;
  // Texto humano para el epitafio/victoria. La capa de presentación lo localiza.
  description: string;
}

// Alias retro: DeathCause sigue exportado como sinónimo de EndOfRunCause para
// que el código existente (combat.ts, smoke tests) no se rompa. Los nuevos
// callers deben usar EndOfRunCause directamente.
export type DeathCause = EndOfRunCause;

// -----------------------------------------------------------------------------
// Epitafio (biblia §4.9)
// -----------------------------------------------------------------------------

export interface Epitaph {
  // Snapshot del personaje en el momento de cerrar la partida. Se persiste tal cual.
  final_character: Character;
  cause: EndOfRunCause;
  // ISO 8601. Lo provee el llamador (state/) para mantener determinismo en
  // tests (no usamos Date.now() aquí dentro).
  ended_at: string;
  // Coordenadas del mundo donde terminó la partida. Lo copiamos de
  // character.location explícitamente para que el epitafio sea autocontenido.
  ended_at_map_id: string;
  ended_at_x: number;
  ended_at_y: number;
}

// -----------------------------------------------------------------------------
// Operación de muerte
// -----------------------------------------------------------------------------

// Marca al personaje como muerto y rellena su epitafio. El llamador debe haber
// confirmado ya que character.hp.current === 0 (lo hace combat.ts al aplicar
// el último daño). Si se llama con un personaje vivo, lanza: la muerte siempre
// pasa por aplicar daño primero.
export function killCharacter(
  character: Character,
  cause: EndOfRunCause,
  ended_at_iso: string,
): Character {
  if (character.alive && character.hp.current > 0) {
    throw new Error(
      `killCharacter: el personaje "${character.id}" sigue vivo (hp=${character.hp.current}). ` +
        `Aplica daño antes de matarlo.`,
    );
  }
  return {
    ...character,
    alive: false,
    epitaph: buildEpitaph(character, cause, ended_at_iso),
  };
}

// Cierra la partida con victoria. Decisión #44: misma estructura de epitafio,
// el personaje queda en estado "no alive" (la partida ha terminado), pero el
// kind de la causa es 'victory'. El slot pasa a solo lectura igual que con
// muerte. El PJ NO necesita estar a 0 HP para victoria — al revés, conservar
// HP final es información útil del epitafio.
export function endRunWithVictory(
  character: Character,
  questId: string | null,
  description: string,
  ended_at_iso: string,
): Character {
  const cause: EndOfRunCause = {
    kind: 'victory',
    agent_id: questId,
    description,
  };
  return {
    ...character,
    alive: false,
    epitaph: buildEpitaph(character, cause, ended_at_iso),
  };
}

function buildEpitaph(
  character: Character,
  cause: EndOfRunCause,
  ended_at_iso: string,
): Epitaph {
  return {
    final_character: { ...character, epitaph: null },
    cause,
    ended_at: ended_at_iso,
    ended_at_map_id: character.location.mapId,
    ended_at_x: character.location.x,
    ended_at_y: character.location.y,
  };
}

// Helpers para construir causas comunes desde combat.ts y exploration.ts.
export function deathByEnemy(enemyId: string, enemyName: string): EndOfRunCause {
  return {
    kind: 'killed_by_enemy',
    agent_id: enemyId,
    description: `Caído ante ${enemyName}.`,
  };
}

export function deathByTrap(entryId: string): EndOfRunCause {
  return {
    kind: 'killed_by_trap',
    agent_id: entryId,
    description: 'Una trampa puso fin al viaje.',
  };
}

export function deathByStatus(kind: string): EndOfRunCause {
  return {
    kind: 'killed_by_status',
    agent_id: kind,
    description: `Consumido por ${kind}.`,
  };
}
