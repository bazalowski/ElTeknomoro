// Preferencias del jugador que NO son estado de partida (sub-paso 4c.2).
//
// POR QUÉ NO VIVEN EN `save_slots` (decisión D-4c23-p4 del pipeline)
// -----------------------------------------------------------------------------
// El estado del mundo cuelga del slot y se rebobina con la muerte del PJ (#94).
// Estas dos preferencias son de comodidad del navegador, no de la run: atarlas
// al slot haría que un "no volver a preguntar" durase hasta que te matara un
// lobo, que es exactamente lo contrario de lo que el jugador pidió. Viven en
// `localStorage`, sobreviven a la muerte del PJ y no cruzan dispositivos —
// aceptable para lo que son.
//
// El almacenamiento se inyecta para poder testear sin navegador y para que un
// `localStorage` bloqueado (modo privado, cookies desactivadas) degrade a
// "preferencias por defecto" en vez de romper la partida.

// Los 3 tamaños de texto que PRODUCT compromete (§8.5: S/M/L, sin slider
// continuo en v1).
export const TEXT_SIZES = ['s', 'm', 'l'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export interface Preferences {
  textSize: TextSize;
  // Q26: la confirmación de "Guardar y salir" se puede desactivar para
  // siempre. La de "Reset run" NO — es irreversible y PRODUCT §3 exige
  // confirmar lo irreversible siempre, así que no tiene entrada aquí.
  confirmOnExit: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  textSize: 'm',
  confirmOnExit: true,
};

// Subconjunto de la API de Storage que realmente usamos. Tipar sólo esto
// permite pasar un fake de dos métodos en los tests.
export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'teknomoro:preferences';

function isTextSize(v: unknown): v is TextSize {
  return typeof v === 'string' && (TEXT_SIZES as readonly string[]).includes(v);
}

// Lee y sanea. Cualquier cosa que no reconozcamos cae al default: un
// localStorage manipulado a mano no debe poder dejar la UI en un estado que
// la interfaz no sepa pintar.
export function readPreferences(storage: PreferenceStorage | null): Preferences {
  if (storage === null) return { ...DEFAULT_PREFERENCES };
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
  if (raw === null) return { ...DEFAULT_PREFERENCES };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return { ...DEFAULT_PREFERENCES };
    const p = parsed as Record<string, unknown>;
    return {
      textSize: isTextSize(p.textSize) ? p.textSize : DEFAULT_PREFERENCES.textSize,
      confirmOnExit:
        typeof p.confirmOnExit === 'boolean' ? p.confirmOnExit : DEFAULT_PREFERENCES.confirmOnExit,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

// Escribe sin propagar fallos: que no se pueda guardar una preferencia de
// comodidad nunca debe tumbar la partida.
export function writePreferences(storage: PreferenceStorage | null, prefs: Preferences): void {
  if (storage === null) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('preferences: no se pudo guardar (la partida sigue):', err);
  }
}

// `localStorage` lanza en algunos navegadores con cookies bloqueadas — no
// devuelve null, lanza al ACCEDER. De ahí el try alrededor del propio acceso.
export function browserStorage(): PreferenceStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
