import type { H2StepCtx } from '../state/h2-flow';
import { ATTRIBUTE_IDS, CREATION_RULES } from '../rules/character';
import type { AttributeId } from '../rules/character';
import { SKILLS, SKILLS_BY_ID } from '../data/skills';

const ATTR_NAMES: Readonly<Record<AttributeId, { sigla: string; nombre: string }>> = {
  fue: { sigla: 'FUE', nombre: 'Fuerza' },
  des: { sigla: 'DES', nombre: 'Destreza' },
  con: { sigla: 'CON', nombre: 'Constitución' },
  int: { sigla: 'INT', nombre: 'Intelecto' },
  vol: { sigla: 'VOL', nombre: 'Voluntad' },
};

const POOL_TOTAL = CREATION_RULES.skillPoolTotal;
const MIN = 0;
const MAX = CREATION_RULES.skillMaxAtCreation;

type SkillValues = Record<string, number>;

function readInitialValues(ctx: H2StepCtx): SkillValues {
  const draft = ctx.draft.skills;
  const out: SkillValues = {};
  for (const s of SKILLS) {
    out[s.id] = MIN;
  }
  if (!draft) return out;
  for (const s of SKILLS) {
    const v = draft[s.id];
    if (typeof v === 'number' && Number.isInteger(v) && v >= MIN && v <= MAX) {
      out[s.id] = v;
    }
  }
  return out;
}

function sumValues(values: SkillValues): number {
  return SKILLS.reduce((acc, s) => acc + (values[s.id] ?? 0), 0);
}

export function renderH2SkillsView(root: HTMLElement, ctx: H2StepCtx): void {
  const values = readInitialValues(ctx);

  for (const s of SKILLS) {
    ctx.setSkill(s.id, values[s.id] ?? 0);
  }

  const groupsHtml = ATTRIBUTE_IDS.map((attrId) => {
    const { sigla, nombre } = ATTR_NAMES[attrId];
    const skillsOfAttr = SKILLS.filter((s) => s.attribute === attrId);
    const rowsHtml = skillsOfAttr
      .map((s) => `
        <li class="h2-skills__row" data-skill-id="${s.id}">
          <span class="h2-skills__name">${s.name}</span>
          <button type="button" class="h2-skills__step" data-action="dec" data-skill-id="${s.id}" aria-label="Restar ${s.name}">−</button>
          <span class="h2-skills__value" data-value-for="${s.id}">${values[s.id] ?? 0}</span>
          <button type="button" class="h2-skills__step" data-action="inc" data-skill-id="${s.id}" aria-label="Sumar ${s.name}">+</button>
        </li>
      `)
      .join('');
    return `
      <section class="h2-skills__group" data-attr-id="${attrId}">
        <header class="h2-skills__group-header">
          <span class="h2-skills__group-sigla">${sigla}</span>
          <span class="h2-skills__group-name">${nombre}</span>
        </header>
        <ul class="h2-skills__list" role="list">${rowsHtml}</ul>
      </section>
    `;
  }).join('');

  root.innerHTML = `
    <main class="view h2-skills">
      <button type="button" class="h2-flow__exit" data-action="exit">Salir</button>
      <header class="h2-skills__header">
        <h1 class="h2-flow__heading">Habilidades</h1>
        <p class="h2-skills__instruction">Reparte 10 puntos. Máximo 3 en cada habilidad.</p>
      </header>
      <div class="h2-skills__pool" aria-live="polite">
        <span class="h2-skills__pool-label">Puntos restantes</span>
        <span class="h2-skills__pool-value" data-pool-value>${POOL_TOTAL - sumValues(values)}</span>
      </div>
      <div class="h2-skills__groups">
        ${groupsHtml}
      </div>
      <nav class="h2-flow__nav" aria-label="Navegación del flujo">
        <button type="button" class="h2-flow__nav-button" data-action="back">Atrás</button>
        <button type="button" class="h2-flow__nav-button h2-flow__nav-button--primary" data-action="next" disabled>Continuar</button>
      </nav>
    </main>
  `;

  const poolEl = root.querySelector<HTMLElement>('[data-pool-value]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-action="next"]')!;
  const decButtons = new Map<string, HTMLButtonElement>();
  const incButtons = new Map<string, HTMLButtonElement>();
  const valueEls = new Map<string, HTMLElement>();

  for (const s of SKILLS) {
    decButtons.set(
      s.id,
      root.querySelector<HTMLButtonElement>(`[data-action="dec"][data-skill-id="${s.id}"]`)!,
    );
    incButtons.set(
      s.id,
      root.querySelector<HTMLButtonElement>(`[data-action="inc"][data-skill-id="${s.id}"]`)!,
    );
    valueEls.set(
      s.id,
      root.querySelector<HTMLElement>(`[data-value-for="${s.id}"]`)!,
    );
  }

  const refresh = () => {
    const sum = sumValues(values);
    const remaining = POOL_TOTAL - sum;
    poolEl.textContent = String(remaining);
    for (const s of SKILLS) {
      const v = values[s.id] ?? 0;
      valueEls.get(s.id)!.textContent = String(v);
      decButtons.get(s.id)!.disabled = v <= MIN;
      incButtons.get(s.id)!.disabled = v >= MAX || remaining <= 0;
    }
    nextBtn.disabled = sum !== POOL_TOTAL;
  };

  const apply = (skillId: string, delta: 1 | -1) => {
    if (!(skillId in SKILLS_BY_ID)) return;
    const current = values[skillId] ?? 0;
    const next = current + delta;
    if (next < MIN || next > MAX) return;
    if (delta === 1 && POOL_TOTAL - sumValues(values) <= 0) return;
    values[skillId] = next;
    ctx.setSkill(skillId, next);
    refresh();
  };

  for (const s of SKILLS) {
    decButtons.get(s.id)!.addEventListener('click', () => apply(s.id, -1));
    incButtons.get(s.id)!.addEventListener('click', () => apply(s.id, 1));
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

  for (const s of SKILLS) {
    const inc = incButtons.get(s.id)!;
    if (!inc.disabled) {
      inc.focus();
      return;
    }
  }
  for (const s of SKILLS) {
    const dec = decButtons.get(s.id)!;
    if (!dec.disabled) {
      dec.focus();
      return;
    }
  }
}
