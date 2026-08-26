import type { Session } from '@supabase/supabase-js';
import { signOut } from '../backend/auth';
import { loadLastCharacter } from '../backend/characters';
import type { Character } from '../rules/character';
import { browserStorage, readPreferences, writePreferences } from '../state/preferences';
import { renderOptionsPanel } from './options-panel';

export type HomeIntent =
  | 'create-character'
  // El combate del Lobo del onboarding (#84). Con el tutorial pendiente es la
  // vía por defecto, no la única (#96).
  | 'enter-wilds'
  // Entrar al mundo restaurando la vista persistida (#90). Cubre las dos
  // puertas: cargar una partida ya empezada y saltarse el tutorial asumiendo
  // su coste (#96).
  | 'load-game'
  | 'create-new-after-death';

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

      <nav class="home-screen__nav" data-home-nav>
        <button
          type="button"
          class="home-screen__primary"
          id="primary-action-btn"
          disabled
        >…</button>
        <button type="button" class="home-screen__secondary" data-home-secondary hidden></button>
        <p class="home-screen__cost" data-home-cost hidden></p>
        <button type="button" class="home-screen__tertiary" data-home-options>Opciones</button>
      </nav>
    </main>
  `;

  const bodyEl = root.querySelector<HTMLElement>('[data-home-body]')!;
  const screenEl = root.querySelector<HTMLElement>('[data-home-screen]')!;
  const primaryBtn = root.querySelector<HTMLButtonElement>('#primary-action-btn')!;
  const logoutBtn = root.querySelector<HTMLButtonElement>('#logout-btn')!;
  const navEl = root.querySelector<HTMLElement>('[data-home-nav]')!;
  const secondaryBtn = root.querySelector<HTMLButtonElement>('[data-home-secondary]')!;
  const costEl = root.querySelector<HTMLElement>('[data-home-cost]')!;
  const optionsBtn = root.querySelector<HTMLButtonElement>('[data-home-options]')!;

  const storage = browserStorage();
  let prefs = readPreferences(storage);

  let intent: HomeIntent = 'create-character';
  let lastBranch: HomeBranch = { kind: 'loading' };

  const applyBranch = (branch: HomeBranch): void => {
    lastBranch = branch;
    // Toda rama arranca sin la vía secundaria: sólo la enciende el PJ vivo con
    // el tutorial pendiente.
    secondaryBtn.hidden = true;
    costEl.hidden = true;
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
      // La rama de PJ vivo dejó de ser "estás en casa, sal al yermo": la casa
      // es ahora un POI del Sur (#85, #95) y esta pantalla es el Menú
      // principal, que es de FUERA de la run (#87). Cargar devuelve a la
      // vista persistida, sea la regional o el interior de un POI (#90).
      const tutorialDone = branch.character.tutorial_lobo_completed;
      screenEl.dataset.branch = 'alive';
      bodyEl.innerHTML = renderAlive(branch.character);

      if (tutorialDone) {
        intent = 'load-game';
        primaryBtn.textContent = 'Cargar partida';
        primaryBtn.disabled = false;
        return;
      }

      // #96: con el tutorial pendiente hay DOS vías reales, no una. La del
      // Lobo es la de por defecto; saltarla es una elección mecánica que
      // cuesta loot y XP, así que el copy dice el precio en vez de esconderlo
      // tras un botón mudo. Saltarla no marca la flag: se puede volver.
      intent = 'enter-wilds';
      primaryBtn.textContent = 'Entrar al yermo';
      primaryBtn.disabled = false;
      secondaryBtn.textContent = 'Salir al mundo sin pelear';
      secondaryBtn.hidden = false;
      costEl.textContent =
        'Te ahorras el primer combate, pero pierdes su botín y su experiencia. Podrás volver a por el lobo mientras sigas vivo.';
      costEl.hidden = false;
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

  // La vía de salto de #96 va SIEMPRE al mundo, sea cual sea el intent
  // primario: es la otra puerta de la misma rama.
  secondaryBtn.addEventListener('click', () => {
    onIntent?.('load-game');
  });

  // §8.1 fija tres opciones en el Menú principal, y Opciones es la tercera.
  // Sin esto el tamaño de texto de §8.5 sólo sería alcanzable con un PJ vivo
  // caminando por el mundo, que es donde vive el otro punto de montaje.
  optionsBtn.addEventListener('click', () => {
    navEl.hidden = true;
    screenEl.dataset.branch = 'options';
    renderOptionsPanel(bodyEl, {
      prefs,
      onChange: (next) => {
        prefs = next;
        writePreferences(storage, prefs);
      },
      onBack: () => {
        navEl.hidden = false;
        applyBranch(lastBranch);
        optionsBtn.focus();
      },
    });
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
