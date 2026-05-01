import type { H2StepCtx } from '../state/h2-flow';
import { ARCHETYPES_BY_ID } from '../data/archetypes';

interface PlaceholderItem {
  readonly glyph: string;
  readonly name: string;
  readonly description: string;
}

const PLACEHOLDER_ITEMS: readonly PlaceholderItem[] = [
  {
    glyph: 'C',
    name: 'Cuchillo de hoja recocida',
    description: 'Herramienta básica de viaje. La hoja ha visto fuego más de una vez.',
  },
  {
    glyph: 'O',
    name: 'Odre de agua filtrada',
    description: 'Tratada con musgo de raíz. Sabe a tierra, pero no mata.',
  },
  {
    glyph: 'H',
    name: 'Hogaza dura y tiras de carne curada',
    description: 'Sustento parco para tres jornadas si se mide.',
  },
  {
    glyph: 'C',
    name: 'Capa de fibra trenzada',
    description: 'Abriga, repele la humedad, no se pudre.',
  },
  {
    glyph: 'R',
    name: 'Reliquia menor de un nombre olvidado',
    description: 'Talismán heredado. Función desconocida, conservada con respeto.',
  },
];

const ITEM_COUNT_LABEL = '5 ítems base';
const NEUTRAL_BAND_LABEL = 'Inventario inicial básico — 5 ítems';
const SURPRISE_DEFERRED_NOTICE =
  'Generación de inventario aleatorio — disponible en H6.';
const SURPRISE_NOTICE_TIMEOUT_MS = 5000;

function bandLabelFor(ctx: H2StepCtx): string {
  const id = ctx.draft.archetype;
  if (!id) return NEUTRAL_BAND_LABEL;
  const arch = ARCHETYPES_BY_ID[id];
  if (!arch) return NEUTRAL_BAND_LABEL;
  return `${arch.name} — ${ITEM_COUNT_LABEL}`;
}

export function renderH2InventoryView(root: HTMLElement, ctx: H2StepCtx): void {
  const bandLabel = bandLabelFor(ctx);

  const itemsHtml = PLACEHOLDER_ITEMS.map(
    (item) => `
      <li class="h2-inventory__item">
        <span class="h2-inventory__item-glyph" aria-hidden="true">${item.glyph}</span>
        <div class="h2-inventory__item-body">
          <span class="h2-inventory__item-name">${item.name}</span>
          <span class="h2-inventory__item-description">${item.description}</span>
        </div>
      </li>
    `,
  ).join('');

  root.innerHTML = `
    <main class="view h2-inventory">
      <button type="button" class="h2-flow__exit" data-action="exit">Salir</button>
      <header class="h2-inventory__header">
        <h1 class="h2-flow__heading">Inventario inicial</h1>
        <p class="h2-inventory__instruction">
          Lo que cargas al salir. El catálogo definitivo se cierra más adelante; esta lista es la base por arquetipo.
        </p>
      </header>
      <section class="h2-inventory__panel" aria-labelledby="h2-inventory-band">
        <div class="h2-inventory__band">
          <span class="h2-inventory__band-label" id="h2-inventory-band">${bandLabel}</span>
          <button
            type="button"
            class="h2-inventory__surprise"
            data-action="surprise"
            aria-pressed="false"
            aria-describedby="h2-inventory-surprise-notice"
          >Sorpréndeme</button>
        </div>
        <p
          class="h2-inventory__surprise-notice"
          id="h2-inventory-surprise-notice"
          role="status"
          aria-live="polite"
          data-visible="false"
        >${SURPRISE_DEFERRED_NOTICE}</p>
        <ul class="h2-inventory__list">
          ${itemsHtml}
        </ul>
      </section>
      <nav class="h2-flow__nav" aria-label="Navegación del flujo">
        <button type="button" class="h2-flow__nav-button" data-action="back">Atrás</button>
        <button type="button" class="h2-flow__nav-button h2-flow__nav-button--primary" data-action="next">Continuar</button>
        <button type="button" class="h2-flow__nav-button" data-action="reset">Reset</button>
      </nav>
    </main>
  `;

  const surpriseBtn = root.querySelector<HTMLButtonElement>(
    '[data-action="surprise"]',
  )!;
  const surpriseNotice = root.querySelector<HTMLParagraphElement>(
    '.h2-inventory__surprise-notice',
  )!;

  let timeoutId: number | null = null;

  const hideNotice = () => {
    surpriseBtn.setAttribute('aria-pressed', 'false');
    surpriseNotice.dataset.visible = 'false';
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const showNotice = () => {
    surpriseBtn.setAttribute('aria-pressed', 'true');
    surpriseNotice.dataset.visible = 'true';
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(hideNotice, SURPRISE_NOTICE_TIMEOUT_MS);
  };

  surpriseBtn.addEventListener('click', () => {
    if (surpriseBtn.getAttribute('aria-pressed') === 'true') {
      hideNotice();
      return;
    }
    showNotice();
  });

  root
    .querySelector<HTMLButtonElement>('[data-action="exit"]')!
    .addEventListener('click', () => ctx.exit());
  root
    .querySelector<HTMLButtonElement>('[data-action="back"]')!
    .addEventListener('click', () => ctx.goBack());
  root
    .querySelector<HTMLButtonElement>('[data-action="next"]')!
    .addEventListener('click', () => ctx.goNext());
  root
    .querySelector<HTMLButtonElement>('[data-action="reset"]')!
    .addEventListener('click', () => ctx.reset());
}
