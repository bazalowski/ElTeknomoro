// Modales del sub-paso 4e: la lista de destinos del viaje rápido y la
// propuesta de plantar ancla (#103, #104).
//
// Vive aparte de `world-view.ts` por la misma razón que `camp-modal.ts`: la
// vista de mundo ya son 1.700 líneas y estos dos son piezas con foco atrapado,
// Escape y ciclo de vida propio. El patrón —overlay, panel, trampa de foco,
// devolver el foco al cerrar— es deliberadamente el mismo que el de acampar:
// dos modales del mismo juego que se comportan distinto son dos modales que el
// jugador tiene que aprender por separado.
//
// NINGUNO DE LOS DOS DECIDE NADA. Las razones de rechazo llegan ya resueltas
// desde `rules/fast-travel.ts` vía `travel-flow`; aquí sólo se traducen a copy.
// Si esta capa tuviera que preguntar "¿puede viajar?" habría dos respuestas a
// la misma pregunta y acabarían separándose.

import type { AnchorDestination } from '../rules/fast-travel';
import type { FastTravelRefusal, PlaceAnchorRefusal } from '../rules/fast-travel';

let modalIdCounter = 0;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// -----------------------------------------------------------------------------
// Copy de los rechazos
// -----------------------------------------------------------------------------

// Q21 pedía "mezcla entre a y b": botón apagado (a) con copy que además dice
// cómo salir del atolladero (b). Un tooltip que sólo dice "no puedes" deja al
// jugador buscando qué hacer; por eso cada motivo trae su salida.
//
// `no_rations` no sugiere "busca comida": en H4 no hay ninguna fuente de
// raciones —crafteo es H7, tiendas H8, el loot no tiene tabla— y mandar a
// buscarlas sería mentir sobre lo que esta build contiene.
export function travelRefusalCopy(reason: FastTravelRefusal, actionsNeeded: number): string {
  switch (reason) {
    case 'same_grid':
      return 'Ya estás aquí.';
    case 'no_anchor':
      return 'No has plantado un ancla en este grid.';
    case 'inside_poi':
      return 'Sal del lugar donde estás antes de viajar.';
    case 'no_rations':
      return 'Te has quedado sin raciones y el viaje come una.';
    case 'no_actions':
      return `El día no da para tanto: el viaje pide ${actionsNeeded} ${
        actionsNeeded === 1 ? 'acción' : 'acciones'
      }. Acampa y sal mañana.`;
    case 'unknown_grid':
      return 'Ese destino ya no existe.';
  }
}

export function anchorRefusalCopy(reason: PlaceAnchorRefusal, cap: number): string {
  switch (reason) {
    case 'not_controlled':
      return 'Todavía no controlas este grid: visita sus cuatro lugares.';
    case 'already_anchored':
      return 'Ya hay un ancla plantada aquí.';
    case 'cap_reached':
      return `Llevas tus ${cap} anclas plantadas. Recoge una antes de plantar otra.`;
    case 'no_anchor_item':
      return 'No te queda ningún ancla en la mochila.';
    case 'no_actions':
      return 'El día se acabó. Acampa y plántala mañana.';
    case 'not_here':
      return 'Sólo puedes plantar un ancla donde estás.';
    case 'unknown_grid':
      return 'Ese grid ya no existe.';
  }
}

// -----------------------------------------------------------------------------
// Andamiaje común
// -----------------------------------------------------------------------------

interface Montado {
  overlay: HTMLElement;
  panel: HTMLElement;
  close: () => void;
}

// Overlay + trampa de foco + Escape. Idéntico a `camp-modal` a propósito.
function montar(host: HTMLElement, className: string, html: string, onEscape: () => void): Montado {
  const overlay = document.createElement('div');
  overlay.className = className;
  overlay.innerHTML = html;
  host.appendChild(overlay);

  const panel = overlay.querySelector<HTMLElement>(`.${className}__panel`)!;
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const close = (): void => {
    document.removeEventListener('keydown', onKeydown, true);
    overlay.remove();
    previouslyFocused?.focus?.();
  };

  function onKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      close();
      onEscape();
      return;
    }
    if (ev.key !== 'Tab') return;
    const focusables = panel.querySelectorAll<HTMLElement>('button:not([disabled])');
    if (focusables.length === 0) return;
    const primero = focusables[0]!;
    const ultimo = focusables[focusables.length - 1]!;
    if (ev.shiftKey && document.activeElement === primero) {
      ev.preventDefault();
      ultimo.focus();
    } else if (!ev.shiftKey && document.activeElement === ultimo) {
      ev.preventDefault();
      primero.focus();
    }
  }

  document.addEventListener('keydown', onKeydown, true);
  return { overlay, panel, close };
}

// -----------------------------------------------------------------------------
// Lista de destinos (#104, Q17d + Q19b + Q20a)
// -----------------------------------------------------------------------------

export interface TravelModalOptions {
  destinations: readonly AnchorDestination[];
  // Raciones que lleva el PJ. Se muestra junto al coste porque #104 exige que
  // el coste se vea ANTES de confirmar, y una ración sin saber cuántas quedan
  // no es información suficiente para decidir.
  rations: number;
  actionsLeft: number;
  onTravel: (gridId: string) => void;
  onCancel?: () => void;
}

export function showTravelModal(host: HTMLElement, options: TravelModalOptions): void {
  if (host.querySelector('.travel-modal') !== null) return;

  const id = ++modalIdCounter;
  const titleId = `travel-modal-title-${id}`;
  const { destinations, rations, actionsLeft } = options;

  // El Hogar primero y el resto por distancia. `listAnchorDestinations` ya
  // ordena por distancia; el Hogar se sube porque es el destino que más se usa
  // y buscarlo entre seis filas cada vez es fricción pura.
  const filas = [...destinations].sort((a, b) => Number(b.isHome) - Number(a.isHome));

  const cuerpo =
    filas.length === 0
      ? `<p class="travel-modal__empty">No has plantado ningún ancla todavía. Controla un grid y planta una para poder volver a él.</p>`
      : `<ul class="travel-modal__list">${filas.map(fila).join('')}</ul>`;

  const { panel, close } = montar(
    host,
    'travel-modal',
    `
    <div class="travel-modal__panel" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <p class="travel-modal__eyebrow">Viaje rápido</p>
      <h2 class="travel-modal__title" id="${titleId}">¿A dónde?</h2>
      <p class="travel-modal__ledger">
        Te ${rations === 1 ? 'queda' : 'quedan'} <span class="travel-modal__num">${rations}</span>
        ${rations === 1 ? 'ración' : 'raciones'} y
        <span class="travel-modal__num">${actionsLeft}</span>
        ${actionsLeft === 1 ? 'acción' : 'acciones'} de hoy.
      </p>
      ${cuerpo}
      <div class="travel-modal__actions">
        <button type="button" class="travel-modal__btn" data-travel-cancel>Cerrar</button>
      </div>
    </div>
  `,
    () => options.onCancel?.(),
  );

  panel.querySelector<HTMLButtonElement>('[data-travel-cancel]')!.addEventListener('click', () => {
    close();
    options.onCancel?.();
  });

  for (const btn of panel.querySelectorAll<HTMLButtonElement>('[data-travel-to]')) {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const gridId = btn.dataset['travelTo']!;
      close();
      options.onTravel(gridId);
    });
  }

  // El foco arranca en el primer destino alcanzable, no en Cerrar: quien abre
  // esta lista viene a viajar.
  const primero = panel.querySelector<HTMLButtonElement>('[data-travel-to]:not([disabled])');
  (primero ?? panel.querySelector<HTMLButtonElement>('[data-travel-cancel]')!).focus();
}

function fila(d: AnchorDestination): string {
  const coste = `${d.cost.rations} ración · ${d.cost.actions} ${
    d.cost.actions === 1 ? 'acción' : 'acciones'
  }`;
  const motivo = d.reachable ? '' : travelRefusalCopy(d.reason!, d.cost.actions);

  return `
    <li class="travel-modal__row${d.reachable ? '' : ' travel-modal__row--blocked'}">
      <button
        type="button"
        class="travel-modal__dest"
        data-travel-to="${escapeHtml(d.gridId)}"
        ${d.reachable ? '' : 'disabled'}
      >
        <span class="travel-modal__dest-main">
          <span class="travel-modal__dest-name">${escapeHtml(d.regionName)}${
            d.isHome ? ' <span class="travel-modal__tag">Hogar</span>' : ''
          }</span>
          <span class="travel-modal__dest-id">${escapeHtml(d.gridId)}</span>
        </span>
        <span class="travel-modal__dest-meta">
          <span class="travel-modal__dist"><span class="travel-modal__num">${d.distance}</span> grids</span>
          <span class="travel-modal__cost">${coste}</span>
        </span>
      </button>
      ${motivo === '' ? '' : `<p class="travel-modal__reason">${escapeHtml(motivo)}</p>`}
    </li>
  `;
}

// -----------------------------------------------------------------------------
// Propuesta de plantar ancla (#103, Q12c)
// -----------------------------------------------------------------------------

export interface AnchorPromptOptions {
  regionName: string;
  gridId: string;
  // Anclas que quedarán en la mochila DESPUÉS de plantar ésta. Es el número
  // que decide, no el que hay: plantar la última es distinto de plantar una de
  // cinco, y el jugador debe verlo antes de decir que sí.
  anchorsLeftAfter: number;
  placed: number;
  cap: number;
  onConfirm: () => void;
  onDecline?: () => void;
}

// Se dispara SÓLO en la transición a Controlado, nunca en un repintado. Q12c
// pide la propuesta y no el automatismo: plantar consume un item y una acción,
// y gastar recursos del jugador sin preguntarle es lo que #99 prohibió para
// acampar por el mismo motivo.
export function showAnchorPrompt(host: HTMLElement, options: AnchorPromptOptions): void {
  if (host.querySelector('.anchor-prompt') !== null) return;

  const id = ++modalIdCounter;
  const titleId = `anchor-prompt-title-${id}`;
  const { regionName, gridId, anchorsLeftAfter, placed, cap } = options;

  const ultima =
    anchorsLeftAfter === 0
      ? '<p class="anchor-prompt__warn">Es la última que llevas.</p>'
      : '';

  const { panel, close } = montar(
    host,
    'anchor-prompt',
    `
    <div class="anchor-prompt__panel" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <p class="anchor-prompt__eyebrow">${escapeHtml(regionName)} · ${escapeHtml(gridId)}</p>
      <h2 class="anchor-prompt__title" id="${titleId}">Controlas este grid</h2>
      <p class="anchor-prompt__body">
        Has visitado sus cuatro lugares. Puedes plantar un ancla aquí y volver
        desde cualquier parte de Terra por el precio de una ración.
      </p>
      <dl class="anchor-prompt__summary">
        <div class="anchor-prompt__row">
          <dt>Cuesta</dt>
          <dd>1 ancla · <span class="anchor-prompt__num">1</span> acción</dd>
        </div>
        <div class="anchor-prompt__row">
          <dt>Anclas plantadas</dt>
          <dd><span class="anchor-prompt__num">${placed}</span>/<span class="anchor-prompt__num">${cap}</span></dd>
        </div>
        <div class="anchor-prompt__row">
          <dt>Te quedarían</dt>
          <dd><span class="anchor-prompt__num">${anchorsLeftAfter}</span> en la mochila</dd>
        </div>
      </dl>
      ${ultima}
      <div class="anchor-prompt__actions">
        <button type="button" class="anchor-prompt__btn" data-anchor-no>Ahora no</button>
        <button type="button" class="anchor-prompt__btn anchor-prompt__btn--confirm" data-anchor-yes>Plantar ancla</button>
      </div>
    </div>
  `,
    () => options.onDecline?.(),
  );

  panel.querySelector<HTMLButtonElement>('[data-anchor-no]')!.addEventListener('click', () => {
    close();
    options.onDecline?.();
  });
  panel.querySelector<HTMLButtonElement>('[data-anchor-yes]')!.addEventListener('click', () => {
    close();
    options.onConfirm();
  });

  // "Ahora no" recibe el foco cuando es la última ancla: gastar la única que
  // queda no debe salir de pulsar Enter por inercia.
  const inicial = anchorsLeftAfter === 0 ? '[data-anchor-no]' : '[data-anchor-yes]';
  panel.querySelector<HTMLButtonElement>(inicial)!.focus();
}
