export interface ConfirmModalOptions {
  title: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
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
      <div class="confirm-modal__actions">
        <button type="button" class="confirm-modal__button" data-action="cancel">${escapeHtml(cancelLabel)}</button>
        <button type="button" class="confirm-modal__button confirm-modal__button--primary" data-action="confirm">${escapeHtml(options.confirmLabel)}</button>
      </div>
    </div>
  `;

  const panel = overlay.querySelector<HTMLElement>('.confirm-modal__panel')!;
  const cancelBtn = overlay.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
  const confirmBtn = overlay.querySelector<HTMLButtonElement>('[data-action="confirm"]')!;

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
      options.onConfirm();
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
      const focusables = [cancelBtn, confirmBtn];
      const active = document.activeElement;
      const idx = focusables.findIndex((el) => el === active);
      if (e.shiftKey) {
        if (idx <= 0) {
          e.preventDefault();
          confirmBtn.focus();
        }
      } else {
        if (idx === focusables.length - 1) {
          e.preventDefault();
          cancelBtn.focus();
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
  confirmBtn.focus();
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
