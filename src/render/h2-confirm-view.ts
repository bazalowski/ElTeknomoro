import type { H2StepCtx } from '../state/h2-flow';
import { CharacterAlreadyAliveError } from '../backend/characters';

const ATTR_LABELS: readonly { id: 'fue' | 'des' | 'con' | 'int' | 'vol'; label: string }[] = [
  { id: 'fue', label: 'FUE' },
  { id: 'des', label: 'DES' },
  { id: 'con', label: 'CON' },
  { id: 'int', label: 'INT' },
  { id: 'vol', label: 'VOL' },
];

export function renderH2ConfirmView(root: HTMLElement, ctx: H2StepCtx): void {
  const draft = ctx.draft;

  const modeText =
    draft.mode === 'scratch'
      ? 'Desde cero'
      : draft.mode === 'preset'
        ? 'Con preset'
        : '(sin elegir)';

  const archetypeText = draft.archetype ?? '(según el modo)';
  const nameText = draft.name ?? '(autogenerado al confirmar)';
  const perkText = draft.perks?.[0] ?? '(por defecto)';

  const attributesMarkup = ATTR_LABELS.map(({ id, label }) => {
    const v = draft.attributes?.[id];
    const valueText = typeof v === 'number' ? String(v) : '—';
    return `
      <div class="h2-confirm__attr">
        <span class="h2-confirm__attr-label">${label}</span>
        <span class="h2-confirm__attr-value">${valueText}</span>
      </div>
    `;
  }).join('');

  let skillsMarkup: string;
  if (draft.skills && Object.keys(draft.skills).length > 0) {
    const items = Object.entries(draft.skills)
      .map(
        ([id, value]) =>
          `<li class="h2-confirm__skill"><span class="h2-confirm__skill-name">${escapeHtml(id)}</span><span class="h2-confirm__skill-value">${value}</span></li>`,
      )
      .join('');
    skillsMarkup = `<ul class="h2-confirm__skills">${items}</ul>`;
  } else {
    skillsMarkup = '<span>(con valores por defecto)</span>';
  }

  root.innerHTML = `
    <main class="view h2-flow__step">
      <button type="button" class="h2-flow__exit" data-action="exit">Salir</button>
      <h1 class="h2-flow__heading">Confirmar personaje</h1>
      <dl class="h2-confirm__summary">
        <dt>Nombre</dt>
        <dd>${escapeHtml(nameText)}</dd>
        <dt>Modo</dt>
        <dd>${escapeHtml(modeText)}</dd>
        <dt>Arquetipo</dt>
        <dd>${escapeHtml(archetypeText)}</dd>
        <dt>Atributos</dt>
        <dd><div class="h2-confirm__attributes">${attributesMarkup}</div></dd>
        <dt>Habilidades</dt>
        <dd>${skillsMarkup}</dd>
        <dt>Perk inicial</dt>
        <dd>${escapeHtml(perkText)}</dd>
      </dl>
      <p class="h2-confirm__error" role="alert" aria-live="polite"></p>
      <nav class="h2-flow__nav" aria-label="Navegación del flujo">
        <button type="button" class="h2-flow__nav-button" data-action="back">Atrás</button>
        <button type="button" class="h2-flow__nav-button h2-flow__nav-button--primary" data-action="confirm">Confirmar</button>
        <button type="button" class="h2-flow__nav-button" data-action="reset">Reset</button>
      </nav>
    </main>
  `;

  const btnExit = root.querySelector<HTMLButtonElement>('[data-action="exit"]')!;
  const btnBack = root.querySelector<HTMLButtonElement>('[data-action="back"]')!;
  const btnConfirm = root.querySelector<HTMLButtonElement>('[data-action="confirm"]')!;
  const btnReset = root.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
  const errorEl = root.querySelector<HTMLParagraphElement>('.h2-confirm__error')!;

  const setLoading = (loading: boolean) => {
    btnConfirm.disabled = loading;
    btnBack.disabled = loading;
    btnReset.disabled = loading;
    btnExit.disabled = loading;
    btnConfirm.textContent = loading ? 'Persistiendo...' : 'Confirmar';
    if (loading) errorEl.textContent = '';
  };

  const setError = (msg: string) => {
    errorEl.textContent = msg;
  };

  btnExit.addEventListener('click', () => ctx.exit());
  btnBack.addEventListener('click', () => ctx.goBack());
  btnReset.addEventListener('click', () => ctx.reset());
  btnConfirm.addEventListener('click', async () => {
    setLoading(true);
    try {
      await ctx.confirmAndPersist();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof CharacterAlreadyAliveError
          ? 'Ya tienes un personaje vivo. Solo se permite uno a la vez en este momento.'
          : 'No se ha podido guardar el personaje. Inténtalo de nuevo.',
      );
      setLoading(false);
    }
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
