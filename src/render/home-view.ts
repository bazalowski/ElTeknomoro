import type { Session } from '@supabase/supabase-js';
import { signOut } from '../backend/auth';

export function renderHomeView(
  root: HTMLElement,
  session: Session,
  onCreateCharacter?: () => void,
): void {
  const email = session.user.email ?? 'jugador';
  root.innerHTML = `
    <main class="view home-view">
      <h1>Hola, ${escapeHtml(email)}</h1>
      <p class="home-placeholder">El Teknomoro — H.0 fundaciones.</p>
      <button type="button" id="create-character-btn">Crear personaje</button>
      <button type="button" id="logout-btn">Salir</button>
    </main>
  `;

  const createBtn = root.querySelector<HTMLButtonElement>('#create-character-btn')!;
  createBtn.addEventListener('click', () => {
    onCreateCharacter?.();
  });

  const logoutBtn = root.querySelector<HTMLButtonElement>('#logout-btn')!;
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
