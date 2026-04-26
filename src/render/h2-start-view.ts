type StartMode = 'scratch' | 'preset';

export function renderH2StartView(
  root: HTMLElement,
  onContinue?: (mode: StartMode) => void,
): void {
  root.innerHTML = `
    <main class="view h2-start" data-selected="">
      <header class="h2-start__header">
        <h1 class="h2-start__title">Antes de habitar un cuerpo.</h1>
        <p class="h2-start__subtitle">Empieza desde el vacío o desde uno de los moldes.</p>
      </header>

      <div class="h2-start__options" role="group" aria-label="Modo de creación">
        <button
          type="button"
          class="h2-start__option h2-start__option--scratch"
          data-mode="scratch"
          aria-pressed="false"
        >
          <span class="h2-start__option-heading">Empezar de cero</span>
          <span class="h2-start__option-body">Sin herencia, sin forma. Asignas cada punto a mano.</span>
        </button>

        <button
          type="button"
          class="h2-start__option h2-start__option--preset"
          data-mode="preset"
          aria-pressed="false"
          aria-describedby="h2-start-preset-hint"
        >
          <span class="h2-start__option-mark" aria-hidden="true"></span>
          <span class="h2-start__option-heading">Empezar con preset</span>
          <span class="h2-start__option-body">Parte de un molde ya encarnado. Puedes ajustarlo después.</span>
          <span class="h2-start__option-hint" id="h2-start-preset-hint">Cinco moldes. Puedes ajustar los puntos.</span>
        </button>
      </div>

      <footer class="h2-start__action">
        <button type="button" class="h2-start__continue" disabled>Continuar</button>
        <span class="h2-start__enter-hint" aria-hidden="true">Enter</span>
      </footer>
    </main>
  `;

  const view = root.querySelector<HTMLElement>('.h2-start')!;
  const options = Array.from(
    root.querySelectorAll<HTMLButtonElement>('.h2-start__option'),
  );
  const continueBtn = root.querySelector<HTMLButtonElement>('.h2-start__continue')!;

  let selected: StartMode | null = null;

  const applySelection = (mode: StartMode) => {
    if (selected === mode) return;
    selected = mode;
    view.dataset.selected = mode;
    for (const opt of options) {
      const optMode = opt.dataset.mode as StartMode;
      opt.setAttribute('aria-pressed', optMode === mode ? 'true' : 'false');
    }
    continueBtn.disabled = false;
  };

  const confirm = () => {
    if (selected === null) return;
    if (onContinue) {
      onContinue(selected);
    } else {
      console.log('h2-start: continuar con', selected);
    }
  };

  for (const opt of options) {
    const mode = opt.dataset.mode as StartMode;

    opt.addEventListener('click', () => {
      applySelection(mode);
    });

    opt.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const idx = options.indexOf(opt);
        const nextIdx =
          e.key === 'ArrowRight'
            ? (idx + 1) % options.length
            : (idx - 1 + options.length) % options.length;
        const next = options[nextIdx];
        if (!next) return;
        next.focus();
        applySelection(next.dataset.mode as StartMode);
      } else if (e.key === ' ') {
        e.preventDefault();
        applySelection(mode);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!continueBtn.disabled) confirm();
      }
    });
  }

  continueBtn.addEventListener('click', () => {
    confirm();
  });

  view.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !continueBtn.disabled && e.target === continueBtn) {
      e.preventDefault();
      confirm();
    }
  });
}
