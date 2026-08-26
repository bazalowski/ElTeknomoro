// Única superficie que habla con la tabla `save_slots`.
// Biblia §7: "backend/ es el único lugar que habla con el servidor".
//
// SLOTS (§8.2, #10 — pase 4c.4.0)
// -----------------------------------------------------------------------------
// Hasta 4c.3 todas estas funciones tenían `slot_index: 0` escrito a mano: el
// juego se comportaba como si hubiera una sola partida. §8.2 da **3 slots por
// usuario** y #10 pone **un personaje por slot**, así que un slot es una run
// completa e independiente — su personaje, su mundo (#90) y su epitafio.
//
// Ahora el índice es un parámetro explícito y obligatorio. Sin default: un
// default silencioso a 0 es cómo se escriben los bugs en los que el jugador
// carga la partida A y guarda encima de la B.

import { supabase } from './supabase';
import type { Character } from '../rules/character';
import type { WorldState } from '../rules/world-state';
import { createInitialWorldState, hydrateWorldState } from '../rules/world-state';

// Cuántas partidas simultáneas puede tener un usuario (§8.2).
export const SLOT_COUNT = 3;

export type SlotIndex = 0 | 1 | 2;

export const SLOT_INDICES: readonly SlotIndex[] = [0, 1, 2];

export function isSlotIndex(n: number): n is SlotIndex {
  return n === 0 || n === 1 || n === 2;
}

export class CharacterAlreadyAliveError extends Error {
  constructor(message = 'Ya hay un personaje vivo en ese slot.') {
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

// Crea el PJ de un slot: primera partida (insert) o PJ nuevo sobre un slot
// muerto (update). En AMBOS caminos rebobina el `world_state` al inicial.
//
// POR QUÉ SE REBOBINA AQUÍ (#94, C3b de #85, #44)
// Un slot es una run. El PJ nuevo no hereda nada del anterior: ni grids
// pisados, ni POIs revelados, ni anclas, ni el día, ni la vista donde murió.
// Antes de 4c.0 esto costaba poco (se heredaban grids de 4b); en cuanto 4c.1
// persiste POIs y vista, sin este reset el PJ nuevo nacería literalmente
// dentro del POI donde cayó el anterior. Detectado por el director en el
// PASO 2 del pipeline de 4c.1.
export async function saveCharacter(character: Character, slotIndex: SlotIndex): Promise<void> {
  const userId = await getCurrentUserId();

  const existing = await supabase
    .from('save_slots')
    .select('id, alive')
    .eq('user_id', userId)
    .eq('slot_index', slotIndex)
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
    slot_index: slotIndex,
    character_data: character,
    alive: character.alive,
    epitaph: character.epitaph,
    // Primera run del slot: mundo en su estado inicial, explícito y no por
    // defecto de columna, para que el slot nazca completo.
    world_state: createInitialWorldState(),
  });
  if (error) throw error;
}

// Persiste cambios sobre un PJ que YA existe en el slot dado. A diferencia de
// `saveCharacter`, no aplica la guard `CharacterAlreadyAliveError`: este
// camino es el que usa el cierre de combate (3e.3) para guardar el PJ tras
// aplicar loot (vivo) o tras escribir el epitafio (muerto). Si el slot no
// existe lanza, porque actualizar sobre la nada sería un bug del caller
// (jamás se invoca antes de createCharacter + saveCharacter inicial).
export async function saveCharacterUpdate(character: Character, slotIndex: SlotIndex): Promise<void> {
  const userId = await getCurrentUserId();

  const existing = await supabase
    .from('save_slots')
    .select('id')
    .eq('user_id', userId)
    .eq('slot_index', slotIndex)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (!existing.data) {
    throw new Error(`saveCharacterUpdate: no hay slot ${slotIndex} que actualizar.`);
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
// Resumen de un slot para el selector del Menú principal (§8.1, #95).
// `character` es null sólo cuando el slot está vacío; en 'caido' viene el PJ
// con su epitafio, que es lo que pinta la lápida (#11).
export interface SlotSummary {
  index: SlotIndex;
  state: 'vacio' | 'vivo' | 'caido';
  character: Character | null;
}

// Los tres slots de una sola consulta. El selector necesita pintarlos juntos,
// y tres round-trips para tres filas de la misma tabla serían tres ventanas
// distintas de latencia en la misma pantalla: el jugador vería sus partidas
// apareciendo de una en una.
//
// Un slot ausente en la respuesta es un slot vacío: la fila se crea al guardar
// el primer personaje, no antes.
export async function loadSlots(): Promise<SlotSummary[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('save_slots')
    .select('slot_index, alive, character_data')
    .eq('user_id', userId);

  if (error) throw error;

  const byIndex = new Map<number, { alive: boolean; character_data: unknown }>();
  for (const row of data ?? []) {
    byIndex.set(row.slot_index as number, {
      alive: row.alive as boolean,
      character_data: row.character_data,
    });
  }

  return SLOT_INDICES.map((index) => {
    const row = byIndex.get(index);
    if (row === undefined || row.character_data === null) {
      return { index, state: 'vacio' as const, character: null };
    }
    // `state` se deriva de la COLUMNA `alive`, no del JSON, aunque hoy se
    // escriban juntas. Es la misma fuente que consulta la guard de
    // `saveCharacter`, así que lo que el menú pinta es exactamente lo que el
    // camino de escritura va a permitir. Derivarlo del JSON abriría la clase
    // de fallo "el menú dice caído y guardar lanza CharacterAlreadyAliveError".
    // El `character_data` se conserva para pintar: nivel, HP y la lápida.
    return {
      index,
      state: row.alive ? ('vivo' as const) : ('caido' as const),
      character: hydrateLoadedCharacter(row.character_data),
    };
  });
}

export async function loadCharacter(slotIndex: SlotIndex): Promise<Character | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('save_slots')
    .select('character_data')
    .eq('user_id', userId)
    .eq('slot_index', slotIndex)
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

// Carga el estado del mundo del slot dado. Devuelve el estado inicial si el slot
// no existe todavía o si la columna está a NULL (saves anteriores a 4b.0):
// `hydrateWorldState` degrada en vez de romper, mismo criterio que
// `hydrateLoadedCharacter`.
export async function loadWorldState(slotIndex: SlotIndex): Promise<WorldState> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('save_slots')
    .select('world_state')
    .eq('user_id', userId)
    .eq('slot_index', slotIndex)
    .maybeSingle();

  if (error) throw error;
  if (!data) return createInitialWorldState();

  return hydrateWorldState(data.world_state);
}

// Borra un slot por completo (sub-paso 4c.2, "Reset run" de #94).
//
// NO escribe epitafio a propósito. La galería de epitafios de #11 es memoria de
// las muertes del jugador; un borrado administrativo no es una muerte y
// ensuciarla con lápidas de partidas abandonadas devalúa las de verdad. El
// slot desaparece y el Menú principal vuelve a su rama vacía.
//
// Borrar la fila (y no vaciarla campo a campo) es lo que garantiza que no
// sobreviva nada: `character_data`, `epitaph` y `world_state` se van juntos.
export async function deleteSlot(slotIndex: SlotIndex): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('save_slots')
    .delete()
    .eq('user_id', userId)
    .eq('slot_index', slotIndex);
  if (error) throw error;
}

// Persiste el estado del mundo sobre un slot que YA existe. Lanza si no lo
// hay: guardar mundo sin personaje sería un bug del caller (el slot lo crea
// siempre `saveCharacter` antes de que exista mundo que guardar).
export async function saveWorldState(worldState: WorldState, slotIndex: SlotIndex): Promise<void> {
  const userId = await getCurrentUserId();

  const existing = await supabase
    .from('save_slots')
    .select('id')
    .eq('user_id', userId)
    .eq('slot_index', slotIndex)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (!existing.data) {
    throw new Error(`saveWorldState: no hay slot ${slotIndex} que actualizar.`);
  }

  const { error } = await supabase
    .from('save_slots')
    .update({ world_state: worldState })
    .eq('id', existing.data.id);
  if (error) throw error;
}
