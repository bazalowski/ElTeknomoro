// Modal de acampar (sub-paso 4d.2, decisiones #98 y #99).
//
// POR QUÉ NO ES `confirm-modal.ts`. Aquel modal tiene un `title` de una línea
// y nada más: no admite cuerpo. Éste tiene que enseñar el día que se cierra,
// el estado del PJ, las raciones y, cuando no las hay, las dos mitades del
// coste de #98. Se comparte la anatomía (overlay que captura el input, foco
// atrapado, Escape cancela) pero no el contenido.
//
// LO QUE ESTE MÓDULO NO HACE. No acampa. Recoge la decisión y la devuelve por
// `onConfirm`; quien llama a `camp()` y persiste es `main.ts` (C1 del brief).
// Tampoco calcula nada del reglamento: todos los números entran ya resueltos
// desde el motor. Si aquí se escribiera un "5" a mano, recalibrar
// `FATIGUE_RULES` en H6 dejaría el copy mintiendo.

export interface CampModalData {
  // Día que se cierra. El siguiente es este +1.
  day: number;
  rations: number;
  hpCurrent: number;
  hpMax: number;
  actionsSpent: number;
  actionsTotal: number;
  // Las dos mitades del coste de #98, ya resueltas por el motor.
  hpMaxPenalty: number;
  hpCurrentPenalty: number;
  // Noches a pelo que aguanta antes de no despertar (`nightsUntilStarvation`).
  // 1 o menos = esta noche es la última: acampar sin ración mata.
  nightsLeft: number;
}

export interface CampModalOptions {
  data: CampModalData;
  onConfirm: () => void;
  onCancel?: () => void;
}

let campModalIdCounter = 0;

export function showCampModal(host: HTMLElement, options: CampModalOptions): void {
  if (host.querySelector('.camp-modal') !== null) return;

  const { data } = options;
  const sinRaciones = data.rations === 0;
  // Con una noche o menos de margen, acampar a pelo no es caro: es terminal.
  // #65 hace que perder el PJ sea perder la run entera, así que la puerta es
  // la misma doble confirmación que #94 exige para borrar la partida.
  const letal = sinRaciones && data.nightsLeft <= 1;

  const id = ++campModalIdCounter;
  const titleId = `camp-modal-title-${id}`;
  const descId = `camp-modal-desc-${id}`;
  const gateId = `camp-modal-gate-${id}`;

  const overlay = document.createElement('div');
  overlay.className = 'camp-modal';
  overlay.dataset['campModal'] = '';

  const tono = letal ? 'camp-modal__panel--letal' : sinRaciones ? 'camp-modal__panel--aviso' : '';

  overlay.innerHTML = `
    <div
      class="camp-modal__panel ${tono}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${titleId}"
      aria-describedby="${descId}"
    >
      <p class="camp-modal__eyebrow">Día <span class="camp-modal__num">${data.day}</span></p>
      <h2 class="camp-modal__title" id="${titleId}">${letal ? 'No vas a despertar' : 'Acampar'}</h2>

      <dl class="camp-modal__summary">
        <div class="camp-modal__row">
          <dt>Jornada gastada</dt>
          <dd class="camp-modal__num">${data.actionsSpent}/${data.actionsTotal}</dd>
        </div>
        <div class="camp-modal__row">
          <dt>Vida</dt>
          <dd class="camp-modal__num">${data.hpCurrent}/${data.hpMax}</dd>
        </div>
        <div class="camp-modal__row${sinRaciones ? ' camp-modal__row--alerta' : ''}">
          <dt>Raciones</dt>
          <dd class="camp-modal__num">${data.rations}</dd>
        </div>
      </dl>

      <p class="camp-modal__body" id="${descId}">${cuerpo(data, sinRaciones, letal)}</p>

      ${
        letal
          ? `<label class="camp-modal__gate" for="${gateId}">
               <input type="checkbox" id="${gateId}" data-camp-gate />
               <span>Lo entiendo: esta noche termina la partida.</span>
             </label>`
          : ''
      }

      <div class="camp-modal__actions">
        <button type="button" class="camp-modal__btn" data-camp-cancel>Cancelar</button>
        <button
          type="button"
          class="camp-modal__btn camp-modal__btn--confirm${sinRaciones ? ' camp-modal__btn--danger' : ''}"
          data-camp-confirm
          ${letal ? 'disabled' : ''}
        >${letal ? 'Dormir de todas formas' : sinRaciones ? 'Acampar sin comer' : 'Acampar'}</button>
      </div>
    </div>
  `;

  host.appendChild(overlay);

  const panel = overlay.querySelector<HTMLElement>('.camp-modal__panel')!;
  const confirmBtn = overlay.querySelector<HTMLButtonElement>('[data-camp-confirm]')!;
  const cancelBtn = overlay.querySelector<HTMLButtonElement>('[data-camp-cancel]')!;
  const gate = overlay.querySelector<HTMLInputElement>('[data-camp-gate]');

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
      options.onCancel?.();
      return;
    }
    if (ev.key !== 'Tab') return;
    // Foco atrapado: el modal bloquea el mundo, así que tabular no puede
    // salirse a los botones de detrás.
    const focusables = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    );
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

  gate?.addEventListener('change', () => {
    confirmBtn.disabled = !gate.checked;
  });

  cancelBtn.addEventListener('click', () => {
    close();
    options.onCancel?.();
  });

  confirmBtn.addEventListener('click', () => {
    if (confirmBtn.disabled) return;
    close();
    options.onConfirm();
  });

  // El foco arranca en Cancelar cuando la acción es peligrosa: el destructivo
  // no se pulsa por inercia con Enter.
  (sinRaciones ? cancelBtn : confirmBtn).focus();
}

// Copy. Prosa inline: los números van en sans como el resto de la frase
// (excepción #54 de Numbers-In-Mono). Los de la tabla de arriba sí van en mono
// porque ahí se comparan entre ellos.
function cuerpo(data: CampModalData, sinRaciones: boolean, letal: boolean): string {
  if (letal) {
    return (
      'No te queda comida y tu cuerpo no aguanta otra noche en ayunas. ' +
      'Si duermes así, no habrá día siguiente: la partida termina aquí y este personaje no vuelve.'
    );
  }
  if (sinRaciones) {
    const noches = data.nightsLeft;
    const aviso =
      noches <= 2
        ? ` Al ritmo del hambre, te ${noches === 2 ? 'quedan dos noches' : 'queda una noche'} antes de no despertar.`
        : ` Al ritmo del hambre, te quedan ${noches} noches antes de no despertar.`;
    return (
      `Dormir con el estómago vacío te cuesta ${data.hpMaxPenalty} de vida máxima, ` +
      `que no se recupera, y ${data.hpCurrentPenalty} de la que te queda.` +
      aviso
    );
  }
  const heridas = data.hpMax - data.hpCurrent;
  const cura =
    heridas > 0
      ? ` Comer y dormir del tirón te devuelve los ${heridas} de vida que traías de menos.`
      : '';
  return (
    `Gastas una ración y duermes. Recuperas la jornada completa y amanece el día ${data.day + 1}.` +
    cura
  );
}
