import type { H2StepCtx } from '../state/h2-flow';
import { ATTRIBUTE_IDS, CREATION_RULES } from '../rules/character';
import type { AttributeId } from '../rules/character';

const ATTR_NAMES: Readonly<Record<AttributeId, { sigla: string; nombre: string }>> = {
  fue: { sigla: 'FUE', nombre: 'Fuerza' },
  des: { sigla: 'DES', nombre: 'Destreza' },
  con: { sigla: 'CON', nombre: 'Constitución' },
  int: { sigla: 'INT', nombre: 'Intelecto' },
  vol: { sigla: 'VOL', nombre: 'Voluntad' },
};

const POOL_TOTAL = CREATION_RULES.attributePoolTotal;
const MIN = CREATION_RULES.attributeMinAtCreation;
const MAX = CREATION_RULES.attributeMaxAtCreation;

type AttrValues = Record<AttributeId, number>;

function readInitialValues(ctx: H2StepCtx): AttrValues {
  const draft = ctx.draft.attributes;
  const out: AttrValues = { fue: MIN, des: MIN, con: MIN, int: MIN, vol: MIN };
  if (!draft) return out;
  for (const id of ATTRIBUTE_IDS) {
    const v = draft[id];
    if (typeof v === 'number' && Number.isInteger(v) && v >= MIN && v <= MAX) {
      out[id] = v;
    }
  }
  return out;
}

function sumValues(values: AttrValues): number {
  return ATTRIBUTE_IDS.reduce((acc, id) => acc + values[id], 0);
}

export function renderH2AttributesView(root: HTMLElement, ctx: H2StepCtx): void {
  const values = readInitialValues(ctx);

  for (const id of ATTRIBUTE_IDS) {
    ctx.setAttribute(id, values[id]);
  }

  const rowsHtml = ATTRIBUTE_IDS.map((id) => {
    const { sigla, nombre } = ATTR_NAMES[id];
    return `
      <li class="h2-attributes__row" data-attr-id="${id}">
        <span class="h2-attributes__label">${sigla}</span>
        <span class="h2-attributes__name">${nombre}</span>
        <button type="button" class="h2-attributes__step" data-action="dec" data-attr-id="${id}" aria-label="Restar ${nombre}">−</button>
        <span class="h2-attributes__value" data-value-for="${id}">${values[id]}</span>
        <button type="button" class="h2-attributes__step" data-action="inc" data-attr-id="${id}" aria-label="Sumar ${nombre}">+</button>
      </li>
    `;
  }).join('');

  root.innerHTML = `
    <main class="view h2-attributes">
      <button type="button" class="h2-flow__exit" data-action="exit">Salir</button>
      <header class="h2-attributes__header">
        <h1 class="h2-flow__heading">Atributos</h1>
        <p class="h2-attributes__instruction">Reparte 12 puntos. Máximo 4 al crear, mínimo 1 en cada uno.</p>
      </header>
      <div class="h2-attributes__pool" aria-live="polite">
        <span class="h2-attributes__pool-label">Puntos restantes</span>
        <span class="h2-attributes__pool-value" data-pool-value>${POOL_TOTAL - sumValues(values)}</span>
      </div>
      <ul class="h2-attributes__list" role="list">
        ${rowsHtml}
      </ul>
      <nav class="h2-flow__nav" aria-label="Navegación del flujo">
        <button type="button" class="h2-flow__nav-button" data-action="back">Atrás</button>
        <button type="button" class="h2-flow__nav-button h2-flow__nav-button--primary" data-action="next" disabled>Continuar</button>
      </nav>
    </main>
  `;

  const poolEl = root.querySelector<HTMLElement>('[data-pool-value]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]')!;
  const decButtons = new Map<AttributeId, HTMLButtonElement>();
  const incButtons = new Map<AttributeId, HTMLButtonElement>();
  const valueEls = new Map<AttributeId, HTMLElement>();

  for (const id of ATTRIBUTE_IDS) {
    decButtons.set(
      id,
      root.querySelector<HTMLButtonElement>(`[data-action="dec"][data-attr-id="${id}"]`)!,
    );
    incButtons.set(
      id,
      root.querySelector<HTMLButtonElement>(`[data-action="inc"][data-attr-id="${id}"]`)!,
    );
    valueEls.set(
      id,
      root.querySelector<HTMLElement>(`[data-value-for="${id}"]`)!,
    );
  }

  const refresh = () => {
    const sum = sumValues(values);
    const remaining = POOL_TOTAL - sum;
    poolEl.textContent = String(remaining);
    for (const id of ATTRIBUTE_IDS) {
      const v = values[id];
      valueEls.get(id)!.textContent = String(v);
      decButtons.get(id)!.disabled = v <= MIN;
      incButtons.get(id)!.disabled = v >= MAX || remaining <= 0;
    }
    nextBtn.disabled = sum !== POOL_TOTAL;
  };

  const apply = (id: AttributeId, delta: 1 | -1) => {
    const current = values[id];
    const next = current + delta;
    if (next < MIN || next > MAX) return;
    if (delta === 1 && POOL_TOTAL - sumValues(values) <= 0) return;
    values[id] = next;
    ctx.setAttribute(id, next);
    refresh();
  };

  for (const id of ATTRIBUTE_IDS) {
    decButtons.get(id)!.addEventListener('click', () => apply(id, -1));
    incButtons.get(id)!.addEventListener('click', () => apply(id, 1));
  }

  root.querySelector<HTMLButtonElement>('[data-action="exit"]')!
    .addEventListener('click', () => ctx.exit());
  root.querySelector<HTMLButtonElement>('[data-action="back"]')!
    .addEventListener('click', () => ctx.goBack());
  nextBtn.addEventListener('click', () => {
    if (nextBtn.disabled) return;
    ctx.goNext();
  });

  refresh();

  for (const id of ATTRIBUTE_IDS) {
    const inc = incButtons.get(id)!;
    if (!inc.disabled) {
      inc.focus();
      return;
    }
  }
  for (const id of ATTRIBUTE_IDS) {
    const dec = decButtons.get(id)!;
    if (!dec.disabled) {
      dec.focus();
      return;
    }
  }
}
