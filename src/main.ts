import { getSession, onSessionChange } from './backend/auth';
import { renderLoginView } from './render/login-view';
import { renderHomeView } from './render/home-view';
import { startH2Flow } from './state/h2-flow';
import type { Session } from '@supabase/supabase-js';
import './style.css';

// DEBUG H3.3b: cableado temporal de la vista de combate. Se activa con
// `?combat=1` en la URL y bypassa auth/home/h2-flow para mostrar un combate
// de prueba (PJ build A + lobo del bosque). Se elimina al cerrar 3e cuando
// el botón "Entrar al yermo" del home cablee combate real con persistencia.
import { renderCombatView } from './render/combat-view';
import { startCombatFlow } from './state/combat-flow';
import { createCharacter } from './rules/character';
import { createRng } from './rules/dice';
import { ENEMIES_BY_ID } from './data/enemies';
import { ITEMS_BY_ID } from './data/items';
import type { EnemyState } from './rules/combat';

const app = document.getElementById('app');
if (!app) throw new Error('No se encontró #app en el DOM.');

function tryDebugCombat(root: HTMLElement): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('combat') !== '1') return false;

  const character = createCharacter({
    id: 'pj-debug',
    name: 'Debug',
    portraitId: 'portrait-03',
    archetype: 'guerrero',
    attributes: { fue: 4, des: 4, con: 2, int: 1, vol: 1 },
    skills: { armas_cuerpo: 3 },
    perks: ['perk-golpe-firme'],
    location: { mapId: 'historia-01', x: 0, y: 0 },
  });

  const lobo: EnemyState = {
    enemy_id: 'lobo_del_bosque',
    instance_id: 'lobo#1',
    hp: ENEMIES_BY_ID['lobo_del_bosque']!.hp_max,
    alive: true,
    statuses: [],
  };

  const seed = Math.floor(Math.random() * 1_000_000);
  let viewHandle: { notifyResult: (r: import('./state/combat-flow').CombatResult) => void } | null = null;

  const handle = startCombatFlow({
    character,
    enemies: [lobo],
    enemyTemplates: ENEMIES_BY_ID,
    itemCatalog: ITEMS_BY_ID,
    rng: createRng(seed),
    nowIso: () => new Date().toISOString(),
    onEnd: (result) => {
      viewHandle?.notifyResult(result);
    },
  });

  root.innerHTML = '';
  viewHandle = renderCombatView(
    root,
    handle,
    (result) => {
      console.info('[DEBUG combat] resultado final:', result);
      // Recargamos sin el query param para volver al flow normal.
      window.location.search = '';
    },
    {
      itemCatalog: ITEMS_BY_ID,
      enemyNames: { lobo_del_bosque: 'Lobo del Bosque' },
      onExit: () => {
        window.location.search = '';
      },
    },
  );

  return true;
}

if (tryDebugCombat(app)) {
  // Combate de debug montado; saltamos el flow normal de auth/home/h2-flow.
} else {

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

} // fin del else de tryDebugCombat
