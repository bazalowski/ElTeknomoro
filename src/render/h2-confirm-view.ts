import type { H2StepCtx } from '../state/h2-flow';
import { CharacterAlreadyAliveError } from '../backend/characters';
import { showConfirmModal } from './confirm-modal';
import { ATTRIBUTE_IDS, computeDefense, computeMaxHp } from '../rules/character';
import type { AttributeBlock, AttributeId } from '../rules/character';
import { ARCHETYPES_BY_ID } from '../data/archetypes';
import { PORTRAITS_BY_ID } from '../data/portraits';
import { PERKS_BY_ID } from '../data/perks';
import { SKILLS_BY_ID } from '../data/skills';

const ATTR_LABELS: Readonly<Record<AttributeId, string>> = {
  fue: 'FUE',
  des: 'DES',
  con: 'CON',
  int: 'INT',
  vol: 'VOL',
};

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readAttributes(ctx: H2StepCtx): AttributeBlock {
  const draft = ctx.draft.attributes ?? {};
  const out: Record<AttributeId, number> = { fue: 1, des: 1, con: 1, int: 1, vol: 1 };
  for (const id of ATTRIBUTE_IDS) {
    const v = draft[id];
    if (typeof v === 'number') out[id] = v;
  }
  return out;
}

function archetypeName(ctx: H2StepCtx): string {
  const id = ctx.draft.archetype;
  if (!id) return 'Sin arquetipo';
  const arch = ARCHETYPES_BY_ID[id];
  return arch ? arch.name : 'Sin arquetipo';
}

function portraitData(ctx: H2StepCtx): { color: string; label: string } {
  const id = ctx.draft.portraitId;
  if (!id) return { color: 'var(--c-tinta-tierra-media)', label: '—' };
  const p = PORTRAITS_BY_ID[id];
  if (!p) return { color: 'var(--c-tinta-tierra-media)', label: '—' };
  return { color: p.placeholder_color, label: p.label };
}

function perkBlock(ctx: H2StepCtx): { name: string; description: string } | null {
  const id = ctx.draft.perks?.[0];
  if (!id) return null;
  const def = PERKS_BY_ID[id];
  return def ? { name: def.name, description: def.description } : null;
}

function trainedSkills(ctx: H2StepCtx): readonly { name: string; value: number }[] {
  const skills = ctx.draft.skills ?? {};
  const out: { name: string; value: number }[] = [];
  for (const [id, value] of Object.entries(skills)) {
    if (value <= 0) continue;
    const def = SKILLS_BY_ID[id];
    out.push({ name: def ? def.name : id, value });
  }
  out.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  return out;
}

export function renderH2ConfirmView(root: HTMLElement, ctx: H2StepCtx): void {
  const attributes = readAttributes(ctx);
  const maxHp = computeMaxHp(attributes);
  const def = computeDefense(attributes);
  const initiative = attributes.des;
  const luck = Math.floor((attributes.int + attributes.vol) / 2);

  const archName = archetypeName(ctx);
  const portrait = portraitData(ctx);
  const perk = perkBlock(ctx);
  const skills = trainedSkills(ctx);
  const nameText = ctx.draft.name ?? '(sin nombre, autogenerado al sellar)';

  const attrsHtml = ATTRIBUTE_IDS.map((id) => `
    <div class="h2-confirm__attr">
      <span class="h2-confirm__attr-label">${ATTR_LABELS[id]}</span>
      <span class="h2-confirm__attr-value">${attributes[id]}</span>
    </div>
  `).join('');

  const skillsHtml = skills.length > 0
    ? `<ul class="h2-confirm__skills">
        ${skills.map((s) => `
          <li class="h2-confirm__skill">
            <span class="h2-confirm__skill-name">${escapeHtml(s.name)}</span>
            <span class="h2-confirm__skill-value">${s.value}</span>
          </li>
        `).join('')}
      </ul>`
    : `<p class="h2-confirm__empty">Sin habilidades entrenadas.</p>`;

  const perkHtml = perk
    ? `<div class="h2-confirm__perk">
        <span class="h2-confirm__perk-name">${escapeHtml(perk.name)}</span>
        <span class="h2-confirm__perk-description">${escapeHtml(perk.description)}</span>
      </div>`
    : `<p class="h2-confirm__empty">Sin perk inicial.</p>`;

  root.innerHTML = `
    <main class="view h2-confirm">
      <button type="button" class="h2-flow__exit" data-action="exit">Salir</button>

      <header class="h2-confirm__header">
        <h1 class="h2-confirm__heading">Sellar al personaje</h1>
        <p class="h2-confirm__warning">
          La muerte es permanente. Lo que confirmes aquí no se reescribe.
        </p>
      </header>

      <section class="h2-confirm__panel" aria-label="Resumen del personaje">
        <header class="h2-confirm__identity">
          <span class="h2-confirm__portrait" aria-hidden="true">
            <span class="h2-confirm__portrait-swatch" style="--portrait-color: ${portrait.color};"></span>
            <span class="h2-confirm__portrait-label">${portrait.label}</span>
          </span>
          <div class="h2-confirm__identity-text">
            <span class="h2-confirm__name">${escapeHtml(nameText)}</span>
            <span class="h2-confirm__archetype">${escapeHtml(archName)}</span>
          </div>
        </header>

        <dl class="h2-confirm__derived" aria-label="Estadísticas derivadas">
          <div class="h2-confirm__derived-stat">
            <dt>HP</dt>
            <dd>${maxHp}</dd>
          </div>
          <div class="h2-confirm__derived-stat">
            <dt>DEF</dt>
            <dd>${def}</dd>
          </div>
          <div class="h2-confirm__derived-stat">
            <dt>INI</dt>
            <dd>${initiative}</dd>
          </div>
          <div class="h2-confirm__derived-stat">
            <dt>SUE</dt>
            <dd>${luck}</dd>
          </div>
        </dl>

        <div class="h2-confirm__columns">
          <section class="h2-confirm__column">
            <h2 class="h2-confirm__column-heading">Atributos</h2>
            <div class="h2-confirm__attrs">${attrsHtml}</div>
          </section>

          <section class="h2-confirm__column">
            <h2 class="h2-confirm__column-heading">Habilidades</h2>
            ${skillsHtml}
          </section>

          <section class="h2-confirm__column">
            <h2 class="h2-confirm__column-heading">Perk inicial</h2>
            ${perkHtml}
          </section>
        </div>
      </section>

      <p class="h2-confirm__error" role="alert" aria-live="polite"></p>

      <nav class="h2-flow__nav" aria-label="Navegación del flujo">
        <button type="button" class="h2-flow__nav-button" data-action="back">Atrás</button>
        <button type="button" class="h2-flow__nav-button h2-flow__nav-button--primary" data-action="seal">Sellar el personaje</button>
        <button type="button" class="h2-flow__nav-button" data-action="reset">Reset</button>
      </nav>
    </main>
  `;

  const btnExit = root.querySelector<HTMLButtonElement>('[data-action="exit"]')!;
  const btnBack = root.querySelector<HTMLButtonElement>('[data-action="back"]')!;
  const btnSeal = root.querySelector<HTMLButtonElement>('[data-action="seal"]')!;
  const btnReset = root.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
  const errorEl = root.querySelector<HTMLParagraphElement>('.h2-confirm__error')!;

  const setLoading = (loading: boolean) => {
    btnSeal.disabled = loading;
    btnBack.disabled = loading;
    btnReset.disabled = loading;
    btnExit.disabled = loading;
    btnSeal.textContent = loading ? 'Sellando…' : 'Sellar el personaje';
    if (loading) errorEl.textContent = '';
  };

  const setError = (msg: string) => {
    errorEl.textContent = msg;
  };

  const persist = async () => {
    setLoading(true);
    try {
      await ctx.confirmAndPersist();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof CharacterAlreadyAliveError
          ? 'Ya tienes un personaje vivo. Solo se permite uno a la vez.'
          : 'No se ha podido sellar al personaje. Inténtalo de nuevo.',
      );
      setLoading(false);
    }
  };

  btnExit.addEventListener('click', () => ctx.exit());
  btnBack.addEventListener('click', () => ctx.goBack());
  btnReset.addEventListener('click', () => ctx.reset());
  btnSeal.addEventListener('click', () => {
    if (btnSeal.disabled) return;
    showConfirmModal(root, {
      title: 'Lo que selles aquí no se reescribe. ¿Confirmas a este personaje para el yermo?',
      confirmLabel: 'Sellar',
      cancelLabel: 'Volver',
      onConfirm: () => {
        void persist();
      },
    });
  });
}
