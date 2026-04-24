import { getSession, onSessionChange } from './backend/auth';
import { renderLoginView } from './render/login-view';
import { renderHomeView } from './render/home-view';
import type { Session } from '@supabase/supabase-js';
import './style.css';

const app = document.getElementById('app');
if (!app) throw new Error('No se encontró #app en el DOM.');

function render(session: Session | null): void {
  if (!app) return;
  if (session) renderHomeView(app, session);
  else renderLoginView(app);
}

getSession()
  .then(render)
  .catch((err) => {
    console.error(err);
    render(null);
  });

onSessionChange(render);
