// Tests del modelo de tabla d20 por POI (#92, cableado en 4f.0 por #97).
//
// Lo que se prueba aquí es la mitad del sistema que NO existía antes: la cara
// del d20 es el slot, y la cascada de §9.5 decide qué texto lo llena. El otro
// medio sistema —la tabla por bioma con pesos— sigue probado en
// `exploration.test.ts` y no se ha tocado.

import { describe, it, expect } from 'vitest';

import {
  resolvePoiEntry,
  rollPoiEntry,
  shouldUseCuratedEntry,
  type PoiTable,
  type PoiEntry,
  type ExplorationFallbacks,
} from './exploration.ts';
import type { Rng } from './dice.ts';

// -----------------------------------------------------------------------------
// Constructores de fixture
// -----------------------------------------------------------------------------

function entrada(slot: number, text: string): PoiEntry {
  return { slot, type: 'environmental', text, mechanic: null, evade: null };
}

function tabla(over: Partial<PoiTable> = {}): PoiTable {
  return {
    poiId: 'sur-001-poi-1',
    archetype: 'natural',
    curated: false,
    name: null,
    description: null,
    curatedEntry: null,
    slots: {},
    ...over,
  };
}

const SIN_FALLBACKS: ExplorationFallbacks = { archetypes: {}, generic: {} };

// Rng determinista: devuelve los valores en orden y repite el último.
function rngDe(...valores: number[]): Rng {
  let i = 0;
  return () => valores[Math.min(i++, valores.length - 1)] ?? 0;
}

// -----------------------------------------------------------------------------

describe('resolvePoiEntry — la cara del d20 es el slot', () => {
  it('un 7 resuelve el slot 7, no una entrada elegida por peso', () => {
    const t = tabla({ slots: { '7': entrada(7, 'La del siete.'), '8': entrada(8, 'La del ocho.') } });
    const r = resolvePoiEntry(t, SIN_FALLBACKS, 7);
    expect(r!.entry.text).toBe('La del siete.');
    expect(r!.entry.slot).toBe(7);
  });

  it('cada cara del d20 mapea a su slot, las veinte', () => {
    const slots: Record<string, PoiEntry> = {};
    for (let s = 1; s <= 20; s++) slots[String(s)] = entrada(s, `slot-${s}`);
    const t = tabla({ slots });
    for (let die = 1; die <= 20; die++) {
      expect(resolvePoiEntry(t, SIN_FALLBACKS, die)!.entry.text).toBe(`slot-${die}`);
    }
  });

  it('rechaza una cara fuera de [1, 20]', () => {
    const t = tabla();
    expect(() => resolvePoiEntry(t, SIN_FALLBACKS, 0)).toThrow(RangeError);
    expect(() => resolvePoiEntry(t, SIN_FALLBACKS, 21)).toThrow(RangeError);
    expect(() => resolvePoiEntry(t, SIN_FALLBACKS, 3.5)).toThrow(RangeError);
  });
});

describe('resolvePoiEntry — cascada de §9.5', () => {
  const fallbacks: ExplorationFallbacks = {
    archetypes: {
      natural: { '4': entrada(4, 'Genérica de natural.') },
      ruina: { '4': entrada(4, 'Genérica de ruina.') },
    },
    generic: { '4': [entrada(4, 'La más neutra del juego.')] },
  };

  it('la entrada propia del POI gana a todo', () => {
    const t = tabla({ slots: { '4': entrada(4, 'La propia.') } });
    const r = resolvePoiEntry(t, fallbacks, 4);
    expect(r!.entry.text).toBe('La propia.');
    expect(r!.source).toBe('poi');
  });

  it('sin entrada propia cae a la tabla de su arquetipo', () => {
    const r = resolvePoiEntry(tabla({ archetype: 'ruina' }), fallbacks, 4);
    expect(r!.entry.text).toBe('Genérica de ruina.');
    expect(r!.source).toBe('archetype');
  });

  it('el arquetipo del POI decide de qué tabla cuelga', () => {
    expect(resolvePoiEntry(tabla({ archetype: 'natural' }), fallbacks, 4)!.entry.text)
      .toBe('Genérica de natural.');
  });

  it('sin propia ni arquetipo cae a la genérica de la banda', () => {
    const r = resolvePoiEntry(tabla({ archetype: 'arcano' }), fallbacks, 4);
    expect(r!.entry.text).toBe('La más neutra del juego.');
    expect(r!.source).toBe('generic');
  });

  it('devuelve null sólo si los tres escalones están vacíos', () => {
    expect(resolvePoiEntry(tabla(), SIN_FALLBACKS, 4)).toBeNull();
  });

  it('un POI en blanco es jugable de punta a punta si hay genéricas', () => {
    const generic: Record<string, PoiEntry[]> = {};
    for (let s = 1; s <= 20; s++) generic[String(s)] = [entrada(s, `neutra-${s}`)];
    const t = tabla();
    for (let die = 1; die <= 20; die++) {
      expect(resolvePoiEntry(t, { archetypes: {}, generic }, die)).not.toBeNull();
    }
  });

  it('la cascada es por slot, no por POI: un hueco cae aunque haya vecinos escritos', () => {
    const t = tabla({ slots: { '4': entrada(4, 'Propia.') } });
    expect(resolvePoiEntry(t, fallbacks, 4)!.source).toBe('poi');
    // El 5 no está escrito ni tiene fallback: cae en hueco aunque el 4 sí esté.
    expect(resolvePoiEntry(t, fallbacks, 5)).toBeNull();
  });
});

describe('resolvePoiEntry — variantes genéricas', () => {
  const tres: ExplorationFallbacks = {
    archetypes: {},
    generic: { '4': [entrada(4, 'una'), entrada(4, 'dos'), entrada(4, 'tres')] },
  };

  it('sin rng elige la primera, de forma determinista', () => {
    expect(resolvePoiEntry(tabla(), tres, 4)!.entry.text).toBe('una');
    expect(resolvePoiEntry(tabla(), tres, 4)!.entry.text).toBe('una');
  });

  it('con rng reparte entre las variantes', () => {
    expect(resolvePoiEntry(tabla(), tres, 4, rngDe(0))!.entry.text).toBe('una');
    expect(resolvePoiEntry(tabla(), tres, 4, rngDe(0.5))!.entry.text).toBe('dos');
    expect(resolvePoiEntry(tabla(), tres, 4, rngDe(0.99))!.entry.text).toBe('tres');
  });

  it('un rng que devuelve 1 no se sale del array', () => {
    expect(resolvePoiEntry(tabla(), tres, 4, rngDe(1))!.entry.text).toBe('tres');
  });

  it('con una sola variante no consume rng', () => {
    let llamadas = 0;
    const rng: Rng = () => { llamadas++; return 0.5; };
    const una: ExplorationFallbacks = { archetypes: {}, generic: { '4': [entrada(4, 'sola')] } };
    expect(resolvePoiEntry(tabla(), una, 4, rng)!.entry.text).toBe('sola');
    expect(llamadas).toBe(0);
  });

  it('los dos primeros escalones no consumen rng', () => {
    let llamadas = 0;
    const rng: Rng = () => { llamadas++; return 0.5; };
    const t = tabla({ slots: { '4': entrada(4, 'propia') } });
    resolvePoiEntry(t, tres, 4, rng);
    expect(llamadas).toBe(0);
  });
});

describe('rollPoiEntry', () => {
  it('expone la tirada y el slot, que en este modelo son el mismo número', () => {
    const slots: Record<string, PoiEntry> = {};
    for (let s = 1; s <= 20; s++) slots[String(s)] = entrada(s, `slot-${s}`);
    // rollD20 sobre un rng que devuelve 0.5 cae en el 11.
    const r = rollPoiEntry(tabla({ slots }), SIN_FALLBACKS, rngDe(0.5));
    expect(r.roll.die).toBe(r.slot);
    expect(r.resolved!.entry.slot).toBe(r.slot);
  });

  it('marca crítico en el 20 y pifia en el 1', () => {
    const critico = rollPoiEntry(tabla(), SIN_FALLBACKS, rngDe(0.999));
    expect(critico.roll.die).toBe(20);
    expect(critico.roll.critical).toBe(true);
    expect(critico.roll.fumble).toBe(false);

    const pifia = rollPoiEntry(tabla(), SIN_FALLBACKS, rngDe(0));
    expect(pifia.roll.die).toBe(1);
    expect(pifia.roll.fumble).toBe(true);
    expect(pifia.roll.critical).toBe(false);
  });

  it('devuelve resolved null en un hueco sin romper la tirada', () => {
    const r = rollPoiEntry(tabla(), SIN_FALLBACKS, rngDe(0.5));
    expect(r.roll.die).toBeGreaterThanOrEqual(1);
    expect(r.resolved).toBeNull();
  });
});

describe('shouldUseCuratedEntry — §9.3', () => {
  const conCurado = (exhaustible: boolean): PoiTable =>
    tabla({ curated: true, curatedEntry: { title: null, text: 'x', mechanic: null, exhaustible } });

  it('un POI sin curado nunca lo usa', () => {
    expect(shouldUseCuratedEntry(tabla(), false)).toBe(false);
  });

  it('el curado agotable se dispara la primera visita y no la segunda', () => {
    expect(shouldUseCuratedEntry(conCurado(true), false)).toBe(true);
    expect(shouldUseCuratedEntry(conCurado(true), true)).toBe(false);
  });

  it('el curado no agotable se dispara siempre', () => {
    expect(shouldUseCuratedEntry(conCurado(false), false)).toBe(true);
    expect(shouldUseCuratedEntry(conCurado(false), true)).toBe(true);
  });

  it('`curated: true` sin entrada escrita todavía no dispara nada', () => {
    expect(shouldUseCuratedEntry(tabla({ curated: true }), false)).toBe(false);
  });
});
