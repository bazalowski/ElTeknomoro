// Máquina del menú de pausa (sub-paso 4c.2, decisión #94/Q45).
//
// Sin DOM dentro. La vista pregunta "¿qué debo pintar?" y llama a las
// transiciones; toda la lógica de qué puede abrirse desde dónde vive aquí y se
// testea sin navegador.
//
// QUÉ ES Y QUÉ NO ES ESTE MENÚ (decisión #95)
// -----------------------------------------------------------------------------
// Es el menú de SISTEMA: guardar, salir, opciones, borrar la run. Global y no
// diegético. Lo que NO es: el campamento. Las acciones del mundo (inventario y
// equipo, descansar) viven en el POI Hogar, que es un lugar al que hay que ir.
// La separación es por naturaleza, no por sitio: con #88 (viajar cuesta y sólo
// a grids colindantes) meter Opciones en el campamento dejaría el tamaño de
// texto inalcanzable para un PJ lejos de casa.

// Qué panel está en pantalla. `null` = la pausa está cerrada y el jugador está
// jugando. El panel de opciones es hijo del de pausa: se vuelve a 'root', no se
// cierra la pausa entera.
export type PausePanel = 'root' | 'options';

// Acción destructiva esperando confirmación. Se modela como estado y no como
// un `let` suelto de la vista para que "hay una confirmación abierta" sea
// consultable: mientras la hay, el botón de pausa no responde (#85: accesible
// "mientras no haya modal abierto").
export type PendingConfirm = 'exit-to-menu' | 'reset-run';

export interface PauseState {
  panel: PausePanel | null;
  pending: PendingConfirm | null;
  // El "Guardar y salir" espera a que la escritura confirme antes de navegar
  // (world-flow persiste fire-and-forget y la última mutación se perdería).
  // Mientras espera, el panel se pinta ocupado y no admite otra acción.
  busy: boolean;
}

export const INITIAL_PAUSE_STATE: PauseState = { panel: null, pending: null, busy: false };

export function isPauseOpen(state: PauseState): boolean {
  return state.panel !== null;
}

// El botón de pausa sólo responde con el juego en marcha: ni con la pausa ya
// abierta, ni con una confirmación en pantalla, ni con un guardado en vuelo.
export function canOpenPause(state: PauseState): boolean {
  return state.panel === null && state.pending === null && !state.busy;
}

export function openPause(state: PauseState): PauseState {
  if (!canOpenPause(state)) return state;
  return { ...state, panel: 'root' };
}

// Cierra la pausa entera. No cierra nada si hay una confirmación abierta o un
// guardado en vuelo: el jugador tiene que resolver eso primero.
export function closePause(state: PauseState): PauseState {
  if (state.panel === null || state.pending !== null || state.busy) return state;
  return { ...state, panel: null };
}

export function openOptions(state: PauseState): PauseState {
  if (state.panel !== 'root') return state;
  return { ...state, panel: 'options' };
}

export function backToRoot(state: PauseState): PauseState {
  if (state.panel !== 'options') return state;
  return { ...state, panel: 'root' };
}

export function requestConfirm(state: PauseState, what: PendingConfirm): PauseState {
  if (state.panel !== 'root' || state.pending !== null || state.busy) return state;
  return { ...state, pending: what };
}

export function cancelConfirm(state: PauseState): PauseState {
  if (state.pending === null) return state;
  return { ...state, pending: null };
}

export function setBusy(state: PauseState, busy: boolean): PauseState {
  if (state.busy === busy) return state;
  return { ...state, busy, pending: busy ? null : state.pending };
}

// Escape: nunca ABRE la pausa (ese gesto es de la cámara, que sale un nivel
// por pulsación desde 4c.1). Con algo abierto, cierra lo más interno primero:
// confirmación → opciones → pausa. Devuelve el mismo estado si no había nada
// que cerrar, y entonces la vista deja que el gesto siga su camino a la
// cámara.
export function escape(state: PauseState): PauseState {
  if (state.busy) return state;
  if (state.pending !== null) return cancelConfirm(state);
  if (state.panel === 'options') return backToRoot(state);
  if (state.panel === 'root') return { ...state, panel: null };
  return state;
}
