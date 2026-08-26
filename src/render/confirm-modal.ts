export interface ConfirmModalOptions {
  title: string;
  confirmLabel: string;
  cancelLabel?: string;
  // Casilla opcional dentro del modal (sub-paso 4c.2). Dos modos, y la
  // diferencia importa:
  //   'gate'    → el botón de confirmar arranca DESHABILITADO hasta marcarla.
  //               Es la "doble confirmación" de #94 para borrar la partida:
  //               dos actos deliberados en una sola ventana. Encadenar dos
  //               modales sería melodrama, que DESIGN prohíbe.
  //   'opt-out' → informativa ("no volver a preguntar"). No bloquea nada; su
  //               valor llega en `onConfirm`.
  checkbox?: { label: string; mode: 'gate' | 'opt-out' };
  // Acción destructiva: tiñe el botón de confirmar con el rojo del sistema,
  // que significa peligro real (Color-Means-Something).
  danger?: boolean;
  onConfirm: (checkboxChecked: boolean) => void;
  onCancel?: () => void;
}

let modalIdCounter = 0;

export function showConfirmModal(
  host: HTMLElement,
  options: ConfirmModalOptions,
): void {
  if (host.querySelector('.confirm-modal') !== null) return;

  const cancelLabel = options.cancelLabel ?? 'Cancelar';
  const titleId = `confirm-modal-title-${++modalIdCounter}`;
  const previousFocus = document.activeElement as HTMLElement | null;

  const overlay = document.createElement('div');
  overlay.className = 'confirm-modal';
  overlay.innerHTML = `
    <div
      class="confirm-modal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${titleId}"
    >
      <p class="confirm-modal__title" id="${titleId}">${escapeHtml(options.title)}</p>
      ${
        options.checkbox === undefined
          ? ''
          : `<label class="confirm-modal__check">
               <input type="checkbox" data-action="check" />
               <span>${escapeHtml(options.checkbox.label)}</span>
             </label>`
      }
      <div class="confirm-modal__actions">
        <button type="button" class="confirm-modal__button" data-action="cancel">${escapeHtml(cancelLabel)}</button>
        <button
          type="button"
          class="confirm-modal__button confirm-modal__button--primary${options.danger === true ? ' confirm-modal__button--danger' : ''}"
          data-action="confirm"
          ${options.checkbox?.mode === 'gate' ? 'disabled' : ''}
        >${escapeHtml(options.confirmLabel)}</button>
      </div>
    </div>
  `;

  const panel = overlay.querySelector<HTMLElement>('.confirm-modal__panel')!;
  const cancelBtn = overlay.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
  const confirmBtn = overlay.querySelector<HTMLButtonElement>('[data-action="confirm"]')!;
  const checkEl = overlay.querySelector<HTMLInputElement>('[data-action="check"]');

  if (checkEl !== null && options.checkbox?.mode === 'gate') {
    checkEl.addEventListener('change', () => {
      confirmBtn.disabled = !checkEl.checked;
    });
  }

  let dismissed = false;

  const dismiss = (kind: 'confirm' | 'cancel') => {
    if (dismissed) return;
    dismissed = true;
    overlay.removeEventListener('keydown', onKeydown);
    overlay.remove();
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
    if (kind === 'confirm') {
      options.onConfirm(checkEl?.checked ?? false);
    } else {
      options.onCancel?.();
    }
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      dismiss('cancel');
      return;
    }
    if (e.key === 'Tab') {
      // La casilla entra en el ciclo de foco: si no, con 'gate' el teclado no
      // podría llegar nunca a habilitar el botón.
      const focusables: HTMLElement[] = checkEl === null
        ? [cancelBtn, confirmBtn]
        : [checkEl, cancelBtn, confirmBtn];
      const active = document.activeElement;
      const idx = focusables.findIndex((el) => el === active);
      if (e.shiftKey) {
        if (idx <= 0) {
          e.preventDefault();
          focusables[focusables.length - 1]!.focus();
        }
      } else {
        if (idx === focusables.length - 1) {
          e.preventDefault();
          focusables[0]!.focus();
        }
      }
    }
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss('cancel');
  });
  cancelBtn.addEventListener('click', () => dismiss('cancel'));
  confirmBtn.addEventListener('click', () => dismiss('confirm'));
  overlay.addEventListener('keydown', onKeydown);

  host.appendChild(overlay);
  panel.tabIndex = -1;
  // Con la casilla como puerta, el foco arranca en ella: es el primer acto
  // deliberado que el jugador tiene que hacer, y el botón está apagado.
  if (checkEl !== null && options.checkbox?.mode === 'gate') checkEl.focus();
  else confirmBtn.focus();
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
