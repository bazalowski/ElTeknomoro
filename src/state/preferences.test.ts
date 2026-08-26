// Tests de las preferencias del jugador (H4 sub-paso 4c.2, D-4c23-p4).
// El almacenamiento se inyecta, así que se valida sin navegador — incluido el
// caso de un localStorage que lanza, que es real: los navegadores con cookies
// bloqueadas no devuelven null, revientan al acceder.

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  readPreferences,
  writePreferences,
  type PreferenceStorage,
} from './preferences';

function fakeStorage(initial: Record<string, string> = {}): PreferenceStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const KEY = 'teknomoro:preferences';

describe('preferences — lectura', () => {
  it('sin nada guardado devuelve los defaults', () => {
    expect(readPreferences(fakeStorage())).toEqual(DEFAULT_PREFERENCES);
  });

  it('sin almacenamiento disponible devuelve los defaults', () => {
    expect(readPreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it('lee lo que se escribió', () => {
    const st = fakeStorage();
    writePreferences(st, { textSize: 'l', confirmOnExit: false });
    expect(readPreferences(st)).toEqual({ textSize: 'l', confirmOnExit: false });
  });

  // Un localStorage manipulado a mano no debe poder dejar la UI en un estado
  // que la interfaz no sepa pintar.
  it('sanea valores desconocidos campo a campo', () => {
    const st = fakeStorage({ [KEY]: '{"textSize":"gigante","confirmOnExit":"si"}' });
    expect(readPreferences(st)).toEqual(DEFAULT_PREFERENCES);
  });

  it('conserva el campo válido aunque el otro esté corrupto', () => {
    const st = fakeStorage({ [KEY]: '{"textSize":"s","confirmOnExit":42}' });
    expect(readPreferences(st)).toEqual({ textSize: 's', confirmOnExit: true });
  });

  it('JSON roto cae a defaults sin lanzar', () => {
    const st = fakeStorage({ [KEY]: '{{{no soy json' });
    expect(readPreferences(st)).toEqual(DEFAULT_PREFERENCES);
  });

  it('un almacenamiento que lanza al leer cae a defaults sin lanzar', () => {
    const roto: PreferenceStorage = {
      getItem: () => {
        throw new Error('cookies bloqueadas');
      },
      setItem: () => {},
    };
    expect(readPreferences(roto)).toEqual(DEFAULT_PREFERENCES);
  });
});

describe('preferences — escritura', () => {
  it('sin almacenamiento no lanza', () => {
    expect(() => writePreferences(null, DEFAULT_PREFERENCES)).not.toThrow();
  });

  // Que no se pueda guardar una preferencia de comodidad nunca debe tumbar la
  // partida.
  it('un almacenamiento que lanza al escribir no propaga el fallo', () => {
    const roto: PreferenceStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('cuota llena');
      },
    };
    expect(() => writePreferences(roto, DEFAULT_PREFERENCES)).not.toThrow();
  });
});
