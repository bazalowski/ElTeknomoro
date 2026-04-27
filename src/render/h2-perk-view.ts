import type { H2StepCtx } from '../state/h2-flow';
import { PERKS, PERKS_BY_ID } from '../data/perks';
import { ARCHETYPES_BY_ID } from '../data/archetypes';
import type { AttributeId } from '../rules/character';

const ATTR_SIGLA: Readonly<Record<AttributeId, string>> = {
  fue: 'FUE',
  des: 'DES',
  con: 'CON',
  int: 'INT',
  vol: 'VOL',
};

function attrSiglaForPerk(perkId: string): string {
  const def = PERKS_BY_ID[perkId];
  if (!def) return '';
  const attr = def.required_dominant_attribute;
  if (!attr) return '';
  return ATTR_SIGLA[attr];
}

function suggestedPerkId(ctx: H2StepCtx): string | null {
  if (ctx.draft.mode !== 'preset') return null;
  const archetypeId = ctx.draft.archetype;
  if (!archetypeId) return null;
  const arch = ARCHETYPES_BY_ID[archetypeId];
  if (!arch) return null;
  return arch.starting_perk_id;
}

function readInitialSelected(ctx: H2StepCtx): string | null {
  const persisted = ctx.draft.perks?.[0];
  if (persisted && persisted in PERKS_BY_ID) return persisted;
  return suggestedPerkId(ctx);
}

export function renderH2PerkView(root: HTMLElement, ctx: H2StepCtx): void {
  const initialId = readInitialSelected(ctx);

  if (initialId) {
    ctx.setPerk(initialId);
  }

  const cardsHtml = PERKS.map((p) => {
    const isSelected = p.id === initialId;
    const sigla = attrSiglaForPerk(p.id);
    return `
      <button
        type="button"
        class="h2-perk__card"
        role="radio"
        aria-checked="${isSelected ? 'true' : 'false'}"
        aria-label="${p.name}"
        data-perk-id="${p.id}"
        tabindex="-1"
      >
        <header class="h2-perk__card-header">
          <span class="h2-perk__card-name">${p.name}</span>
          <span class="h2-perk__card-attr">${sigla}</span>
        </header>
        <p class="h2-perk__card-description">${p.description}</p>
      </button>
    `;
  }).join('');

  root.innerHTML = `
    <main class="view h2-perk">
      <button type="button" class="h2-flow__exit" data-action="exit">Salir</button>
      <header class="h2-perk__header">
        <h1 class="h2-flow__heading">Perk inicial</h1>
        <p class="h2-perk__instruction">Elige 1 perk.</p>
      </header>
      <div class="h2-perk__grid" role="radiogroup" aria-label="Perk inicial">
        ${cardsHtml}
      </div>
      <nav class="h2-flow__nav" aria-label="Navegación del flujo">
        <button type="button" class="h2-flow__nav-button" data-action="back">Atrás</button>
        <button type="button" class="h2-flow__nav-button h2-flow__nav-button--primary" data-action="next" ${initialId ? '' : 'disabled'}>Continuar</button>
      </nav>
    </main>
  `;

  const cards = Array.from(
    root.querySelectorAll<HTMLButtonElement>('.h2-perk__card'),
  );
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]')!;

  let selectedId: string | null = initialId;

  const focusIndexFor = (id: string | null): number => {
    if (!id) return 0;
    const idx = cards.findIndex((c) => c.dataset.perkId === id);
    return idx >= 0 ? idx : 0;
  };

  const setRovingTarget = (idx: number) => {
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card) continue;
      card.tabIndex = i === idx ? 0 : -1;
    }
  };

  const applySelection = (id: string) => {
    if (!(id in PERKS_BY_ID)) return;
    selectedId = id;
    for (const card of cards) {
      const isSel = card.dataset.perkId === id;
      card.setAttribute('aria-checked', isSel ? 'true' : 'false');
    }
    ctx.setPerk(id);
    nextBtn.disabled = false;
  };

  setRovingTarget(focusIndexFor(selectedId));

  for (const card of cards) {
    card.addEventListener('click', () => {
      const id = card.dataset.perkId;
      if (!id) return;
      applySelection(id);
      setRovingTarget(cards.indexOf(card));
      card.focus();
    });

    card.addEventListener('keydown', (e) => {
      const idx = cards.indexOf(card);
      if (idx < 0) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.dataset.perkId;
        if (!id) return;
        applySelection(id);
        return;
      }

      let nextIdx: number | null = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIdx = idx + 1 < cards.length ? idx + 1 : null;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIdx = idx - 1 >= 0 ? idx - 1 : null;
      }

      if (nextIdx === null) return;
      e.preventDefault();
      const target = cards[nextIdx];
      if (!target) return;
      setRovingTarget(nextIdx);
      target.focus();
    });
  }

  root.querySelector<HTMLButtonElement>('[data-action="exit"]')!
    .addEventListener('click', () => ctx.exit());
  root.querySelector<HTMLButtonElement>('[data-action="back"]')!
    .addEventListener('click', () => ctx.goBack());
  nextBtn.addEventListener('click', () => {
    if (nextBtn.disabled) return;
    ctx.goNext();
  });

  const focusIdx = focusIndexFor(selectedId);
  const target = cards[focusIdx];
  if (target) target.focus();
}
