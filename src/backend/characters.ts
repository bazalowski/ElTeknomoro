// Única superficie que habla con la tabla `save_slots`.
// Biblia §7: "backend/ es el único lugar que habla con el servidor".

import { supabase } from './supabase';
import type { Character } from '../rules/character';

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
  });
  if (error) throw error;
}

export async function loadAliveCharacter(): Promise<Character | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('save_slots')
    .select('character_data')
    .eq('user_id', userId)
    .eq('alive', true)
    .order('slot_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data.character_data as Character;
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

  return data.character_data as Character;
}
