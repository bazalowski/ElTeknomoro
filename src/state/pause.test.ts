// Tests de la máquina del menú de pausa (H4 sub-paso 4c.2, #94/Q45).
// Sin DOM: el módulo es estado puro, así que el contrato se valida entero
// aquí y la vista sólo tiene que pintarlo.

import { describe, it, expect } from 'vitest';
import {
  INITIAL_PAUSE_STATE,
  backToRoot,
  canOpenPause,
  cancelConfirm,
  closePause,
  escape,
  isPauseOpen,
  openOptions,
  openPause,
  requestConfirm,
  setBusy,
} from './pause';

describe('pause — apertura y cierre', () => {
  it('arranca cerrada', () => {
    expect(isPauseOpen(INITIAL_PAUSE_STATE)).toBe(false);
    expect(canOpenPause(INITIAL_PAUSE_STATE)).toBe(true);
  });

  it('abrir lleva a la raíz del menú', () => {
    const s = openPause(INITIAL_PAUSE_STATE);
    expect(s.panel).toBe('root');
    expect(isPauseOpen(s)).toBe(true);
  });

  it('abrir dos veces no cambia nada', () => {
    const s = openPause(INITIAL_PAUSE_STATE);
    expect(openPause(s)).toBe(s);
  });

  it('cerrar devuelve al juego', () => {
    const s = closePause(openPause(INITIAL_PAUSE_STATE));
    expect(s.panel).toBeNull();
  });
});

describe('pause — sub-panel de opciones', () => {
  it('opciones es hijo de la raíz, y volver no cierra la pausa', () => {
    let s = openOptions(openPause(INITIAL_PAUSE_STATE));
    expect(s.panel).toBe('options');
    s = backToRoot(s);
    expect(s.panel).toBe('root');
    expect(isPauseOpen(s)).toBe(true);
  });

  it('no se abren opciones sin pausa abierta', () => {
    expect(openOptions(INITIAL_PAUSE_STATE)).toBe(INITIAL_PAUSE_STATE);
  });
});

describe('pause — confirmaciones y ocupado', () => {
  // #85: el botón de pausa está accesible "mientras no haya modal abierto".
  it('con una confirmación abierta, la pausa no se puede cerrar ni reabrir', () => {
    const s = requestConfirm(openPause(INITIAL_PAUSE_STATE), 'reset-run');
    expect(s.pending).toBe('reset-run');
    expect(closePause(s)).toBe(s);
    expect(canOpenPause(s)).toBe(false);
  });

  it('cancelar la confirmación devuelve el menú a su estado normal', () => {
    let s = requestConfirm(openPause(INITIAL_PAUSE_STATE), 'exit-to-menu');
    s = cancelConfirm(s);
    expect(s.pending).toBeNull();
    expect(s.panel).toBe('root');
  });

  it('no se pide una segunda confirmación encima de otra', () => {
    const s = requestConfirm(openPause(INITIAL_PAUSE_STATE), 'exit-to-menu');
    expect(requestConfirm(s, 'reset-run')).toBe(s);
  });

  // El guardado final espera a la red: mientras espera, el panel no admite
  // otra acción ni se puede cerrar por debajo.
  it('ocupado bloquea cierre, confirmaciones y reapertura', () => {
    const s = setBusy(openPause(INITIAL_PAUSE_STATE), true);
    expect(s.busy).toBe(true);
    expect(closePause(s)).toBe(s);
    expect(requestConfirm(s, 'reset-run')).toBe(s);
    expect(canOpenPause(s)).toBe(false);
  });

  it('ponerse ocupado descarta una confirmación pendiente', () => {
    const s = setBusy(requestConfirm(openPause(INITIAL_PAUSE_STATE), 'exit-to-menu'), true);
    expect(s.pending).toBeNull();
  });
});

describe('pause — Escape cierra de dentro hacia fuera', () => {
  it('cierra primero la confirmación, luego opciones, luego la pausa', () => {
    let s = requestConfirm(openPause(INITIAL_PAUSE_STATE), 'reset-run');
    s = escape(s);
    expect(s.pending).toBeNull();
    expect(s.panel).toBe('root');

    s = escape(openOptions(s));
    expect(s.panel).toBe('root');

    s = escape(s);
    expect(s.panel).toBeNull();
  });

  // Con la pausa cerrada, Escape no es de la pausa: es de la cámara, que sale
  // un nivel de zoom por pulsación desde 4c.1. Devolver el mismo objeto es la
  // señal de "no era mío" que usa la vista para dejar pasar el gesto.
  it('sin nada abierto devuelve el mismo estado, para que la cámara lo reciba', () => {
    expect(escape(INITIAL_PAUSE_STATE)).toBe(INITIAL_PAUSE_STATE);
  });

  it('ocupado ignora Escape: no se sale de un guardado a medias', () => {
    const s = setBusy(openPause(INITIAL_PAUSE_STATE), true);
    expect(escape(s)).toBe(s);
  });
});
