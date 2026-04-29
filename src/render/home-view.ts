import type { Session } from '@supabase/supabase-js';
import { signOut } from '../backend/auth';
import { loadLastCharacter } from '../backend/characters';
import type { Character } from '../rules/character';

// Sub-paso 3e.3: home consulta el slot 0 al montar y rama el botón principal
// según el estado del PJ. El rediseño visual real (lápida con identidad y
// epitafio del PJ caído) entra en 3e.2 vía MODOPIPELINE; aquí solo cableado
// funcional para cerrar el end-to-end (crear → combatir → morir/vivir → home).
export type HomeIntent = 'create-character' | 'enter-wilds' | 'create-new-after-death';

export function renderHomeView(
  root: HTMLElement,
  session: Session,
  onIntent?: (intent: HomeIntent) => void,
): void {
  const email = session.user.email ?? 'jugador';

  root.innerHTML = `
    <main class="view home-view">
      <h1>Hola, ${escapeHtml(email)}</h1>
      <p class="home-placeholder">El Teknomoro — H.0 fundaciones.</p>
      <p class="home-status" data-home-status>Cargando personaje…</p>
      <button type="button" id="primary-action-btn" disabled>…</button>
      <button type="button" id="logout-btn">Salir</button>
    </main>
  `;

  const statusEl = root.querySelector<HTMLParagraphElement>('[data-home-status]')!;
  const primaryBtn = root.querySelector<HTMLButtonElement>('#primary-action-btn')!;
  const logoutBtn = root.querySelector<HTMLButtonElement>('#logout-btn')!;

  let intent: HomeIntent = 'create-character';

  const applyIntent = (character: Character | null): void => {
    if (character === null) {
      intent = 'create-character';
      statusEl.textContent = 'Sin personaje. Crea el primero.';
      primaryBtn.textContent = 'Crear personaje';
    } else if (character.alive) {
      intent = 'enter-wilds';
      const archetype = character.archetype ?? '—';
      statusEl.textContent = `${character.name} · ${archetype} · HP ${character.hp.current}/${character.hp.max}`;
      primaryBtn.textContent = 'Entrar al yermo';
    } else {
      intent = 'create-new-after-death';
      const archetype = character.archetype ?? '—';
      const epitaphLine = character.epitaph?.cause.description ?? 'Caído en el yermo.';
      statusEl.textContent = `${character.name} · ${archetype} · ${epitaphLine}`;
      primaryBtn.textContent = 'Crear nuevo personaje';
    }
    primaryBtn.disabled = false;
  };

  loadLastCharacter()
    .then((character) => applyIntent(character))
    .catch((err) => {
      console.error('home-view: loadLastCharacter falló:', err);
      statusEl.textContent = 'No se pudo cargar el slot. Continúa sin personaje.';
      applyIntent(null);
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

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
