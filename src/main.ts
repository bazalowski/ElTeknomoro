import { getSession, onSessionChange } from './backend/auth';
import { renderLoginView } from './render/login-view';
import { renderHomeView } from './render/home-view';
import { startH2Flow } from './state/h2-flow';
import type { Session } from '@supabase/supabase-js';
import './style.css';

const app = document.getElementById('app');
if (!app) throw new Error('No se encontró #app en el DOM.');

type Mode = 'auth' | 'home' | 'h2-flow';

let mode: Mode = 'auth';
let currentSession: Session | null = null;

function render(): void {
  if (!app) return;
  if (!currentSession) {
    mode = 'auth';
    renderLoginView(app);
    return;
  }
  if (mode === 'h2-flow') {
    app.innerHTML = '';
    startH2Flow(app, () => {
      mode = 'home';
      render();
    });
    return;
  }
  mode = 'home';
  renderHomeView(app, currentSession, () => {
    mode = 'h2-flow';
    render();
  });
}

getSession()
  .then((session) => {
    currentSession = session;
    render();
  })
  .catch((err) => {
    console.error(err);
    currentSession = null;
    render();
  });

onSessionChange((session) => {
  currentSession = session;
  if (!session && mode === 'h2-flow') {
    mode = 'auth';
  }
  render();
});
