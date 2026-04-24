import type { Session } from '@supabase/supabase-js';
import { signOut } from '../backend/auth';

export function renderHomeView(root: HTMLElement, session: Session): void {
  const email = session.user.email ?? 'jugador';
  root.innerHTML = `
    <main class="view home-view">
      <h1>Hola, ${escapeHtml(email)}</h1>
      <p class="home-placeholder">El Teknomoro — H.0 fundaciones.</p>
      <button type="button" id="logout-btn">Salir</button>
    </main>
  `;

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
