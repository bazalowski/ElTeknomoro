// Única superficie que habla con la tabla `save_slots`.
// Biblia §7: "backend/ es el único lugar que habla con el servidor".

import { supabase } from './supabase';
import type { Character } from '../rules/character';
import type { WorldState } from '../rules/world-state';
import { createInitialWorldState, hydrateWorldState } from '../rules/world-state';

export class CharacterAlreadyAliveError extends Error {
  constructor(message = 'Ya hay un personaje vivo en el slot 0.') {
    super(message);
    this.name = 'CharacterAlreadyAliveError';
  }
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('No hay sesión activa.');
  return data.user.id;
}

// Crea el PJ del slot 0: primera partida (insert) o PJ nuevo sobre un slot
// muerto (update). En AMBOS caminos rebobina el `world_state` al inicial.
//
// POR QUÉ SE REBOBINA AQUÍ (#94, C3b de #85, #44)
// Un slot es una run. El PJ nuevo no hereda nada del anterior: ni grids
// pisados, ni POIs revelados, ni anclas, ni el día, ni la vista donde murió.
// Antes de 4c.0 esto costaba poco (se heredaban grids de 4b); en cuanto 4c.1
// persiste POIs y vista, sin este reset el PJ nuevo nacería literalmente
// dentro del POI donde cayó el anterior. Detectado por el director en el
// PASO 2 del pipeline de 4c.1.
export async function saveCharacter(character: Character): Promise<void> {
  const userId = await getCurrentUserId();

  const existing = await supabase
    .from('save_slots')
    .select('id, alive')
    .eq('user_id', userId)
    .eq('slot_index', 0)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data && existing.data.alive === true) {
    throw new CharacterAlreadyAliveError();
  }

  if (existing.data) {
    const { error } = await supabase
      .from('save_slots')
      .update({
        character_data: character,
        alive: character.alive,
        epitaph: character.epitaph,
        // Run nueva sobre slot muerto: el mundo se rebobina con el PJ.
        world_state: createInitialWorldState(),
      })
      .eq('id', existing.data.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('save_slots').insert({
    user_id: userId,
    slot_index: 0,
    character_data: character,
    alive: character.alive,
    epitaph: character.epitaph,
    // Primera run del slot: mundo en su estado inicial, explícito y no por
    // defecto de columna, para que el slot nazca completo.
    world_state: createInitialWorldState(),
  });
  if (error) throw error;
}

// Persiste cambios sobre un PJ que YA existe en el slot 0. A diferencia de
// `saveCharacter`, no aplica la guard `CharacterAlreadyAliveError`: este
// camino es el que usa el cierre de combate (3e.3) para guardar el PJ tras
// aplicar loot (vivo) o tras escribir el epitafio (muerto). Si el slot no
// existe lanza, porque actualizar sobre la nada sería un bug del caller
// (jamás se invoca antes de createCharacter + saveCharacter inicial).
export async function saveCharacterUpdate(character: Character): Promise<void> {
  const userId = await getCurrentUserId();

  const existing = await supabase
    .from('save_slots')
    .select('id')
    .eq('user_id', userId)
    .eq('slot_index', 0)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (!existing.data) {
    throw new Error('saveCharacterUpdate: no hay slot 0 que actualizar.');
  }

  const { error } = await supabase
    .from('save_slots')
    .update({
      character_data: character,
      alive: character.alive,
      epitaph: character.epitaph,
    })
    .eq('id', existing.data.id);
  if (error) throw error;
}

// Hidrata un Character cargado de Supabase con defaults para campos añadidos
// posteriormente al esquema. Esto evita romper saves antiguos cuando el motor
// añade un campo nuevo top-level entre versiones (sub-paso 4a H4 añadió
// `last_damage_source` y `tutorial_lobo_completed`). Es prototipo en
// desarrollo: aceptamos que los saves crezcan con valores por defecto.
//
// El cast intermedio a Record permite leer campos que no están en Character
// hoy sin recurrir a `any`. El resultado es un Character bien tipado.
function hydrateLoadedCharacter(raw: unknown): Character {
  const r = raw as Record<string, unknown>;
  return {
    ...(raw as Character),
    last_damage_source: (r.last_damage_source as Character['last_damage_source']) ?? null,
    tutorial_lobo_completed: (r.tutorial_lobo_completed as boolean | undefined) ?? false,
  };
}

// Devuelve el último PJ del slot 0 sea vivo o muerto. Lo usa home (3e.2) para
// pintar la lápida cuando el PJ ha caído (permadeath) sin perder la
// identidad: nombre, arquetipo, nivel y epitafio siguen accesibles hasta que
// el jugador pulse "Crear nuevo personaje" y el flow H2 sobrescriba el slot.
export async function loadLastCharacter(): Promise<Character | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('save_slots')
    .select('character_data')
    .eq('user_id', userId)
    .eq('slot_index', 0)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return hydrateLoadedCharacter(data.character_data);
}

// -----------------------------------------------------------------------------
// Estado del mundo (sub-paso 4b.0, decisión #90)
// -----------------------------------------------------------------------------
// El `world_state` cuelga del slot, no del usuario: dos PJ del mismo usuario en
// slots distintos no comparten grids explorados (#44 permadeath puro + C3b de
// #85). Por eso estas dos funciones filtran por `slot_index` igual que el
// resto del módulo, y no sólo por `user_id`.

// Carga el estado del mundo del slot 0. Devuelve el estado inicial si el slot
// no existe todavía o si la columna está a NULL (saves anteriores a 4b.0):
// `hydrateWorldState` degrada en vez de romper, mismo criterio que
// `hydrateLoadedCharacter`.
export async function loadWorldState(): Promise<WorldState> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('save_slots')
    .select('world_state')
    .eq('user_id', userId)
    .eq('slot_index', 0)
    .maybeSingle();

  if (error) throw error;
  if (!data) return createInitialWorldState();

  return hydrateWorldState(data.world_state);
}

// Persiste el estado del mundo sobre un slot que YA existe. Lanza si no lo
// hay: guardar mundo sin personaje sería un bug del caller (el slot lo crea
// siempre `saveCharacter` antes de que exista mundo que guardar).
export async function saveWorldState(worldState: WorldState): Promise<void> {
  const userId = await getCurrentUserId();

  const existing = await supabase
    .from('save_slots')
    .select('id')
    .eq('user_id', userId)
    .eq('slot_index', 0)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (!existing.data) {
    throw new Error('saveWorldState: no hay slot 0 que actualizar.');
  }

  const { error } = await supabase
    .from('save_slots')
    .update({ world_state: worldState })
    .eq('id', existing.data.id);
  if (error) throw error;
}
