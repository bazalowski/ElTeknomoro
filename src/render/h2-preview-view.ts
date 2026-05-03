import type { H2StepCtx } from '../state/h2-flow';
// Sub-paso 4b: la vista preview trabaja con un draft (no Character) y usa la
// fórmula base sin perks (computeBaseMaxHp). El bono real de los perks
// (perk_piel_dura, perk_temple, perk_pulmon_de_ceniza) se aplica al crear el
// Character en createCharacter; el preview NO lo refleja todavía. Deuda menor
// de UI: cuando el preview deba mostrar el HP máx final con bonos, se cambia
// la llamada a computeMaxHp(stubCharacter) o se construye el Character aquí.
import { ATTRIBUTE_IDS, computeBaseMaxHp, computeDefense } from '../rules/character';
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

const ATTR_NAMES: Readonly<Record<AttributeId, string>> = {
  fue: 'Fuerza',
  des: 'Destreza',
  con: 'Constitución',
  int: 'Inteligencia',
  vol: 'Voluntad',
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

function archetypeName(ctx: H2StepCtx): string | null {
  const id = ctx.draft.archetype;
  if (!id) return null;
  const arch = ARCHETYPES_BY_ID[id];
  return arch ? arch.name : null;
}

function portraitColor(ctx: H2StepCtx): string {
  const id = ctx.draft.portraitId;
  if (!id) return 'var(--c-tinta-tierra-media)';
  const p = PORTRAITS_BY_ID[id];
  return p ? p.placeholder_color : 'var(--c-tinta-tierra-media)';
}

function portraitLabel(ctx: H2StepCtx): string {
  const id = ctx.draft.portraitId;
  if (!id) return '—';
  const p = PORTRAITS_BY_ID[id];
  return p ? p.label : '—';
}

function perkBlock(ctx: H2StepCtx): { name: string; description: string } | null {
  const id = ctx.draft.perks?.[0];
  if (!id) return null;
  const def = PERKS_BY_ID[id];
  if (!def) return null;
  return { name: def.name, description: def.description };
}

function trainedSkills(ctx: H2StepCtx): readonly { id: string; name: string; value: number }[] {
  const skills = ctx.draft.skills ?? {};
  const out: { id: string; name: string; value: number }[] = [];
  for (const [id, value] of Object.entries(skills)) {
    if (value <= 0) continue;
    const def = SKILLS_BY_ID[id];
    out.push({ id, name: def ? def.name : id, value });
  }
  out.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  return out;
}

export function renderH2PreviewView(root: HTMLElement, ctx: H2StepCtx): void {
  const attributes = readAttributes(ctx);
  const maxHp = computeBaseMaxHp(attributes);
  const def = computeDefense(attributes);
  const initiative = attributes.des;
  const luck = Math.floor((attributes.int + attributes.vol) / 2);

  const archName = archetypeName(ctx);
  const archLine = archName ?? 'Sin arquetipo';

  const perk = perkBlock(ctx);
  const skills = trainedSkills(ctx);

  const attrCellsHtml = ATTRIBUTE_IDS.map((id) => `
    <div class="h2-preview__attr">
      <span class="h2-preview__attr-label">${ATTR_LABELS[id]}</span>
      <span class="h2-preview__attr-value">${attributes[id]}</span>
      <span class="h2-preview__attr-name">${ATTR_NAMES[id]}</span>
    </div>
  `).join('');

  const skillsHtml = skills.length > 0
    ? `<ul class="h2-preview__skills">
        ${skills.map((s) => `
          <li class="h2-preview__skill">
            <span class="h2-preview__skill-name">${escapeHtml(s.name)}</span>
            <span class="h2-preview__skill-value">${s.value}</span>
          </li>
        `).join('')}
      </ul>`
    : `<p class="h2-preview__skills-empty">Sin habilidades entrenadas.</p>`;

  const perkHtml = perk
    ? `<div class="h2-preview__perk">
        <span class="h2-preview__perk-name">${escapeHtml(perk.name)}</span>
        <span class="h2-preview__perk-description">${escapeHtml(perk.description)}</span>
      </div>`
    : `<p class="h2-preview__perk-empty">Sin perk inicial.</p>`;

  root.innerHTML = `
    <main class="view h2-preview">
      <button type="button" class="h2-flow__exit" data-action="exit">Salir</button>
      <header class="h2-preview__header">
        <h1 class="h2-flow__heading">Antes del primer paso</h1>
        <p class="h2-preview__instruction">
          Así llegas al yermo. El combate real esperará al otro lado del mapa.
        </p>
      </header>

      <section class="h2-preview__arena" aria-label="Vista previa de combate">
        <article class="h2-preview__side h2-preview__side--player" aria-label="Tu personaje">
          <div class="h2-preview__portrait">
            <span class="h2-preview__portrait-swatch" style="--portrait-color: ${portraitColor(ctx)};" aria-hidden="true"></span>
            <span class="h2-preview__portrait-label" aria-hidden="true">${portraitLabel(ctx)}</span>
          </div>
          <div class="h2-preview__identity">
            <span class="h2-preview__identity-archetype">${escapeHtml(archLine)}</span>
            <span class="h2-preview__identity-tag">Tú</span>
          </div>
          <dl class="h2-preview__stats" aria-label="Estadísticas derivadas">
            <div class="h2-preview__stat">
              <dt>HP</dt>
              <dd>${maxHp}</dd>
            </div>
            <div class="h2-preview__stat">
              <dt>DEF</dt>
              <dd>${def}</dd>
            </div>
            <div class="h2-preview__stat">
              <dt>INI</dt>
              <dd>${initiative}</dd>
            </div>
            <div class="h2-preview__stat">
              <dt>SUE</dt>
              <dd>${luck}</dd>
            </div>
          </dl>
        </article>

        <div class="h2-preview__versus" aria-hidden="true">
          <span>vs</span>
        </div>

        <article class="h2-preview__side h2-preview__side--foe" aria-label="Lo que sea que aparezca">
          <div class="h2-preview__foe-silhouette" aria-hidden="true">?</div>
          <div class="h2-preview__identity">
            <span class="h2-preview__identity-archetype">Lo que sea que aparezca</span>
            <span class="h2-preview__identity-tag">Yermo</span>
          </div>
          <p class="h2-preview__foe-note">El primer encuentro se decide en el mapa, no aquí.</p>
        </article>
      </section>

      <section class="h2-preview__details" aria-label="Detalle del personaje">
        <div class="h2-preview__details-block">
          <h2 class="h2-preview__details-heading">Atributos</h2>
          <div class="h2-preview__attrs">${attrCellsHtml}</div>
        </div>
        <div class="h2-preview__details-block">
          <h2 class="h2-preview__details-heading">Habilidades</h2>
          ${skillsHtml}
        </div>
        <div class="h2-preview__details-block">
          <h2 class="h2-preview__details-heading">Perk</h2>
          ${perkHtml}
        </div>
      </section>

      <nav class="h2-flow__nav" aria-label="Navegación del flujo">
        <button type="button" class="h2-flow__nav-button" data-action="back">Atrás</button>
        <button type="button" class="h2-flow__nav-button h2-flow__nav-button--primary" data-action="next">Continuar</button>
        <button type="button" class="h2-flow__nav-button" data-action="reset">Reset</button>
      </nav>
    </main>
  `;

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
