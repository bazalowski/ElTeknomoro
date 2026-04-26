// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.10 (día/noche y clima dinámico). H4.
//
// Modelo del reloj interno del mundo. Avanza por ticks discretos. Cada tick
// puede venir de un movimiento, un combate cerrado, una acción de descanso.
//
// PROVISIONAL H4:
//   - Duración del día y de cada franja horaria.
//   - Modelo de clima (transiciones, persistencia).
// La biblia §2 fuera-de-MVP marca "efectos numéricos de día/noche, clima y
// terreno" como diferidos. Aquí sólo el modelo de avance, sin impacto mecánico.

import type { TimeOfDay, WeatherTag } from './exploration';

// -----------------------------------------------------------------------------
// Constantes (PROVISIONAL H4)
// -----------------------------------------------------------------------------

export const TIME_RULES = {
  // PROVISIONAL H4 — un día = 240 ticks. 60 por franja horaria.
  ticksPerDay: 240,
  ticksPerSlot: 60,
} as const;

// Orden cíclico de las franjas. Coincide con el enum de exploration.ts.
export const TIME_OF_DAY_ORDER: readonly TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'] as const;

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export interface WorldClock {
  // Días completos transcurridos desde el inicio de la partida.
  day: number;
  // Tick dentro del día actual: 0..ticksPerDay-1.
  tick_in_day: number;
  // Clima actual. Lo gestiona el sistema de clima (no implementado en H4).
  weather: WeatherTag;
}

// -----------------------------------------------------------------------------
// Lecturas
// -----------------------------------------------------------------------------

export function getTimeOfDay(clock: WorldClock): TimeOfDay {
  const slot = Math.floor(clock.tick_in_day / TIME_RULES.ticksPerSlot);
  // Saneamiento defensivo: si tick_in_day se sale, módulo lo trae.
  const safe = ((slot % TIME_OF_DAY_ORDER.length) + TIME_OF_DAY_ORDER.length) % TIME_OF_DAY_ORDER.length;
  // safe ∈ [0, length); el index existe.
  return TIME_OF_DAY_ORDER[safe] as TimeOfDay;
}

// -----------------------------------------------------------------------------
// Avance del reloj
// -----------------------------------------------------------------------------

export function createClock(weather: WeatherTag = 'clear'): WorldClock {
  return { day: 0, tick_in_day: 0, weather };
}

export function advanceClock(clock: WorldClock, ticks: number): WorldClock {
  if (!Number.isInteger(ticks) || ticks < 0) {
    throw new RangeError(`advanceClock: ticks debe ser entero ≥ 0, recibido ${ticks}`);
  }
  if (ticks === 0) return clock;
  const total = clock.tick_in_day + ticks;
  const days_added = Math.floor(total / TIME_RULES.ticksPerDay);
  const tick_in_day = total % TIME_RULES.ticksPerDay;
  return { ...clock, day: clock.day + days_added, tick_in_day };
}

// Cambia el clima (manual; el sistema dinámico de clima vive fuera de MVP).
export function setWeather(clock: WorldClock, weather: WeatherTag): WorldClock {
  return { ...clock, weather };
}
