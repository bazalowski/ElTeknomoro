import type { Session } from '@supabase/supabase-js';
import { signOut } from '../backend/auth';
import { loadLastCharacter } from '../backend/characters';
import type { Character } from '../rules/character';

export type HomeIntent = 'create-character' | 'enter-wilds' | 'create-new-after-death';

type HomeBranch =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'alive'; character: Character }
  | { kind: 'fallen'; character: Character }
  | { kind: 'error' };

export function renderHomeView(
  root: HTMLElement,
  session: Session,
  onIntent?: (intent: HomeIntent) => void,
): void {
  const email = session.user.email ?? 'jugador';

  root.innerHTML = `
    <main class="home-screen" data-home-screen>
      <header class="home-screen__header">
        <p class="home-screen__caller">${escapeHtml(email)}</p>
        <button type="button" class="home-screen__exit" id="logout-btn">Salir</button>
      </header>

      <section class="home-screen__body" data-home-body aria-live="polite">
        <p class="home-screen__loading">Cargando personaje…</p>
      </section>

      <nav class="home-screen__nav">
        <button
          type="button"
          class="home-screen__primary"
          id="primary-action-btn"
          disabled
        >…</button>
      </nav>
    </main>
  `;

  const bodyEl = root.querySelector<HTMLElement>('[data-home-body]')!;
  const screenEl = root.querySelector<HTMLElement>('[data-home-screen]')!;
  const primaryBtn = root.querySelector<HTMLButtonElement>('#primary-action-btn')!;
  const logoutBtn = root.querySelector<HTMLButtonElement>('#logout-btn')!;

  let intent: HomeIntent = 'create-character';

  const applyBranch = (branch: HomeBranch): void => {
    if (branch.kind === 'loading') {
      screenEl.dataset.branch = 'loading';
      bodyEl.innerHTML = `<p class="home-screen__loading">Cargando personaje…</p>`;
      primaryBtn.disabled = true;
      primaryBtn.textContent = '…';
      return;
    }

    if (branch.kind === 'empty') {
      intent = 'create-character';
      screenEl.dataset.branch = 'empty';
      bodyEl.innerHTML = renderEmpty();
      primaryBtn.textContent = 'Crear personaje';
      primaryBtn.disabled = false;
      return;
    }

    if (branch.kind === 'alive') {
      intent = 'enter-wilds';
      screenEl.dataset.branch = 'alive';
      bodyEl.innerHTML = renderAlive(branch.character);
      primaryBtn.textContent = 'Entrar al yermo';
      primaryBtn.disabled = false;
      return;
    }

    if (branch.kind === 'fallen') {
      intent = 'create-new-after-death';
      screenEl.dataset.branch = 'fallen';
      bodyEl.innerHTML = renderFallen(branch.character);
      primaryBtn.textContent = 'Crear nuevo personaje';
      primaryBtn.disabled = false;
      return;
    }

    intent = 'create-character';
    screenEl.dataset.branch = 'error';
    bodyEl.innerHTML = `
      <p class="home-screen__error">No se pudo cargar el slot. Continúa sin personaje.</p>
    `;
    primaryBtn.textContent = 'Crear personaje';
    primaryBtn.disabled = false;
  };

  applyBranch({ kind: 'loading' });

  loadLastCharacter()
    .then((character) => {
      if (character === null) {
        applyBranch({ kind: 'empty' });
      } else if (character.alive) {
        applyBranch({ kind: 'alive', character });
      } else {
        applyBranch({ kind: 'fallen', character });
      }
    })
    .catch((err) => {
      console.error('home-view: loadLastCharacter falló:', err);
      applyBranch({ kind: 'error' });
    });

  primaryBtn.addEventListener('click', () => {
    if (primaryBtn.disabled) return;
    onIntent?.(intent);
  });

  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    try {
      await signOut();
    } catch {
      logoutBtn.disabled = false;
    }
  });
}

// -----------------------------------------------------------------------------
// Branch renderers
// -----------------------------------------------------------------------------

function renderEmpty(): string {
  return `
    <div class="home-empty">
      <h1 class="home-empty__heading">Antes del yermo</h1>
      <p class="home-empty__lede">
        El mundo ya está aquí. Falta quien lo cruce.
      </p>
    </div>
  `;
}

function renderAlive(character: Character): string {
  const archetype = character.archetype ?? 'sin oficio';
  return `
    <div class="home-alive">
      <h1 class="home-alive__heading">${escapeHtml(character.name)}</h1>
      <p class="home-alive__archetype">${escapeHtml(archetype)}</p>

      <dl class="home-alive__stats">
        <div class="home-alive__stat">
          <dt>Nivel</dt>
          <dd>${character.level}</dd>
        </div>
        <div class="home-alive__stat">
          <dt>Vida</dt>
          <dd>
            <span class="home-alive__hp-current">${character.hp.current}</span>
            <span class="home-alive__hp-sep">/</span>
            <span class="home-alive__hp-max">${character.hp.max}</span>
          </dd>
        </div>
      </dl>

      <p class="home-alive__call">El yermo aguarda.</p>
    </div>
  `;
}

function renderFallen(character: Character): string {
  const archetype = character.archetype ?? 'sin oficio';
  const epitaphLine = character.epitaph?.cause.description ?? 'Caído en el yermo.';
  const endedAtIso = character.epitaph?.ended_at ?? null;
  const endedAtHuman = endedAtIso ? formatEndedAt(endedAtIso) : null;

  return `
    <article class="home-fallen" aria-label="Personaje caído">
      <p class="home-fallen__kicker">aquí cayó</p>

      <h1 class="home-fallen__name">${escapeHtml(character.name)}</h1>

      <p class="home-fallen__line home-fallen__line--archetype">
        ${escapeHtml(archetype)}, nivel <span class="home-fallen__num">${character.level}</span>
      </p>

      <p class="home-fallen__epitaph">${escapeHtml(epitaphLine)}</p>

      ${
        endedAtHuman
          ? `<p class="home-fallen__date"><time datetime="${escapeHtml(endedAtIso ?? '')}">${escapeHtml(endedAtHuman)}</time></p>`
          : ''
      }
    </article>
  `;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatEndedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateFormatter.format(d).replace(/\.$/, '');
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
