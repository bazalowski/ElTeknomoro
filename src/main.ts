import { getSession, onSessionChange } from './backend/auth';
import { loadLastCharacter, saveCharacterUpdate, loadWorldState, saveWorldState } from './backend/characters';
import { renderLoginView } from './render/login-view';
import { renderHomeView } from './render/home-view';
import { renderCombatView } from './render/combat-view';
import { renderWorldView } from './render/world-view';
import { startH2Flow } from './state/h2-flow';
import { startCombatFlow } from './state/combat-flow';
import { createWorldFlow } from './state/world-flow';
import { createRng } from './rules/dice';
import { ENEMIES_BY_ID } from './data/enemies';
import { ITEMS_BY_ID } from './data/items';
import type { EnemyState } from './rules/combat';
import type { Character } from './rules/character';
import type { CombatResult } from './state/combat-flow';
import type { WorldFlowHandle } from './state/world-flow';
import type { Session } from '@supabase/supabase-js';
import './style.css';

const app = document.getElementById('app');
if (!app) throw new Error('No se encontró #app en el DOM.');

type Mode = 'auth' | 'home' | 'h2-flow' | 'combat' | 'world';

let mode: Mode = 'auth';
let currentSession: Session | null = null;

// Sesión de mundo viva mientras el jugador está en el overworld (4c.1). El
// combate lanzado desde un POI no descarta el world-flow: sale de la pantalla,
// pelea, y vuelve al MISMO flow con el PJ actualizado. Recargar el estado del
// mundo desde Supabase al volver sería una ida y vuelta innecesaria y una
// ventana en la que el POI recién completado aún no ha llegado al servidor.
let worldSession: { flow: WorldFlowHandle; character: Character } | null = null;

// De dónde vino el combate. Sólo el tutorial marca `tutorial_lobo_completed`
// (#86): quien se lo saltó pagando el coste mecánico no lo recupera gratis
// ganando el primer lobo de un POI.
type CombatOrigin = 'tutorial' | 'poi';

// Mapa enemy_id → nombre legible para que la combat-view pinte log y paneles
// sin depender del catálogo (la regla sagrada vive en data/enemies.ts; este
// derivado es vista).
const enemyNames: Record<string, string> = Object.fromEntries(
  Object.values(ENEMIES_BY_ID).map((e) => [e.id, e.name]),
);

function startCombatRun(
  root: HTMLElement,
  character: Character,
  origin: CombatOrigin,
  // Se invoca al cerrar la pantalla de combate. `result` es null cuando el
  // jugador usa la salida de emergencia sin guardar (D-3b-6 de combat-view).
  onClose: (result: CombatResult | null) => void,
): void {
  // H3 (esqueleto): un único encuentro tutorial — un Lobo del Bosque. La
  // selección de enemigos por zona/historia entra en hitos posteriores.
  const loboTpl = ENEMIES_BY_ID['lobo_del_bosque'];
  if (loboTpl === undefined) {
    throw new Error('main: ENEMIES_BY_ID no contiene lobo_del_bosque.');
  }
  const lobo: EnemyState = {
    enemy_id: 'lobo_del_bosque',
    instance_id: 'lobo_del_bosque#1',
    hp: loboTpl.hp_max,
    alive: true,
    statuses: [],
    // Sub-paso 4c: el motor calcula el intent al inicio del turno enemigo.
    // En arranque: null. La UI lo pinta cuando el motor lo asigna.
    intent: null,
  };

  const seed = Math.floor(Math.random() * 1_000_000);
  let viewHandle: { notifyResult: (r: CombatResult) => void } | null = null;
  let persisting = false;
  let lastResult: CombatResult | null = null;

  const handle = startCombatFlow({
    character,
    enemies: [lobo],
    enemyTemplates: ENEMIES_BY_ID,
    itemCatalog: ITEMS_BY_ID,
    rng: createRng(seed),
    nowIso: () => new Date().toISOString(),
    onEnd: (result) => {
      viewHandle?.notifyResult(result);
      // Decisión #84/#87 (4b) + #86: superar el combate del Lobo del
      // TUTORIAL completa el tutorial. La flag vive en el PJ y se persiste
      // con él; home la lee para cambiar "Entrar al yermo" por "Salir al
      // mundo". Desde 4c.1 hay una segunda vía de combate (los POIs) y ésa
      // NO marca la flag: saltarse el tutorial cuesta loot y XP (#86), y
      // recuperarlo peleando en un POI anularía el coste.
      const finalCharacter: Character =
        origin === 'tutorial' && result.status === 'victory'
          ? { ...result.character, tutorial_lobo_completed: true }
          : result.character;
      lastResult = { ...result, character: finalCharacter };
      // Persistencia post-combate: el PJ vivo con loot aplicado o el PJ
      // muerto con epitafio ya escrito. saveCharacterUpdate sobrescribe el
      // slot 0 sin la guard CharacterAlreadyAliveError. Si la red falla, lo
      // logueamos: H3 no tiene UI de error de red todavía (entra en hitos
      // posteriores cuando toque hardening de persistencia).
      persisting = true;
      saveCharacterUpdate(finalCharacter)
        .catch((err) => {
          console.error('main: saveCharacterUpdate falló al cerrar combate:', err);
        })
        .finally(() => {
          persisting = false;
        });
    },
  });

  root.innerHTML = '';
  viewHandle = renderCombatView(
    root,
    handle,
    () => {
      // Botón "Volver" del modal de loot/epitafio. Si la persistencia aún
      // está en vuelo, no bloqueamos: home reconsulta loadLastCharacter al
      // montar y pintará el estado real cuando llegue el commit. El usuario
      // no percibe la diferencia salvo en redes muy lentas.
      void persisting;
      onClose(lastResult);
    },
    {
      itemCatalog: ITEMS_BY_ID,
      enemyNames,
      onExit: () => {
        // Salir sin guardar: el PJ del slot queda igual que antes del
        // combate. Es la salida de emergencia documentada en D-3b-6 de
        // combat-view. `null` distingue "cerré sin resultado" de "gané".
        onClose(null);
      },
    },
  );
}

// Arranca la vista de mundo (H4 4b): carga el estado persistido del slot,
// monta el orquestador world-flow y pinta la vista. Fade de 300ms en la
// entrada (decisión Q5 del cuestionario 4b, vía clase CSS).
function startWorldRun(root: HTMLElement, character: Character): void {
  loadWorldState()
    .then((worldState) => {
      const flow = createWorldFlow({ initialState: worldState, persist: saveWorldState });
      worldSession = { flow, character };
      mountWorldView(root, flow, character);
    })
    .catch((err) => {
      console.error('main: loadWorldState falló al salir al mundo:', err);
      mode = 'home';
      render();
    });
}

// Monta (o remonta) la vista de mundo sobre un flow que ya existe. Se llama al
// entrar desde home y al volver de un combate de POI: la vista se restaura
// sola desde la vista persistida del flow (#90), así que volver de un combate
// aterriza en el POI que lo lanzó sin que nadie se lo tenga que decir.
function mountWorldView(root: HTMLElement, flow: WorldFlowHandle, character: Character): void {
  mode = 'world';
  worldSession = { flow, character };
  root.innerHTML = '';
  renderWorldView(root, {
    flow,
    character,
    onExitToHome: () => {
      worldSession = null;
      mode = 'home';
      render();
    },
    onEnterCombat: (poiId) => startPOICombat(root, poiId),
  });
  root.querySelector<HTMLElement>('[data-world-view]')?.classList.add('world-view--enter');
}

// Combate lanzado desde un POI (4c.1, #93). Los tres cierres vuelven a sitios
// distintos y ninguno es la home:
//   victory → loot, POI marcado completado, de vuelta al POI (Q32a).
//   fled    → de vuelta al POI, sin loot y sin completar (Q35a, matiza #80).
//   defeat  → epitafio y home; la run se acabó, no hay POI al que volver.
function startPOICombat(root: HTMLElement, poiId: string): void {
  const session = worldSession;
  if (!session) {
    console.warn('main: combate de POI sin sesión de mundo viva; volviendo a home.');
    mode = 'home';
    render();
    return;
  }

  mode = 'combat';
  startCombatRun(root, session.character, 'poi', (result) => {
    if (result !== null && result.status === 'defeat') {
      worldSession = null;
      mode = 'home';
      render();
      return;
    }
    if (result !== null && result.status === 'victory') {
      session.flow.completePOI(poiId);
    }
    // `null` (salida sin guardar) conserva el PJ previo al combate: el slot no
    // se tocó, así que la vista tampoco debe pintar un PJ que no se guardó.
    mountWorldView(root, session.flow, result?.character ?? session.character);
  });
  // Otra mitad del crossfade de #93: la vista de mundo se fue en fade, la de
  // combate entra en fade. Sin esto el salto sería un corte seco justo donde
  // la decisión pide continuidad.
  root.firstElementChild?.classList.add('view-fade-in');
}

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
  if (mode === 'combat' || mode === 'world') {
    // Combate y mundo se montan vía startCombatRun/startWorldRun antes de
    // llegar aquí; este caso solo se daría si render() se vuelve a invocar
    // mientras estamos dentro (p. ej. session change). En esa ventana
    // mantenemos la pantalla intacta — no remontar es la decisión correcta.
    return;
  }
  mode = 'home';
  renderHomeView(app, currentSession, (intent) => {
    if (intent === 'create-character' || intent === 'create-new-after-death') {
      mode = 'h2-flow';
      render();
      return;
    }
    if (intent === 'enter-wilds' || intent === 'exit-to-world') {
      mode = intent === 'enter-wilds' ? 'combat' : 'world';
      // Recargamos el PJ vivo en el momento de entrar. home ya lo mostró,
      // pero el slot puede haber cambiado entre tabs; este load es la
      // fuente de verdad inmediata antes de combate o mundo.
      loadLastCharacter()
        .then((character) => {
          if (character === null || !character.alive) {
            console.warn(`main: ${intent} sin PJ vivo en slot; volviendo a home.`);
            mode = 'home';
            render();
            return;
          }
          if (intent === 'enter-wilds') {
            startCombatRun(app, character, 'tutorial', () => {
              mode = 'home';
              render();
            });
          } else {
            startWorldRun(app, character);
          }
        })
        .catch((err) => {
          console.error(`main: loadLastCharacter falló en ${intent}:`, err);
          mode = 'home';
          render();
        });
    }
  });
}

// Pintado inmediato antes de la primera respuesta del servidor. `getSession`
// tarda lo que tarde la red, y hasta ahora la app no pintaba NADA en esa
// ventana: el jugador veía la página en negro sin saber si estaba cargando o
// roto. Es el mismo síntoma que una app rota, así que se distingue.
app.innerHTML = `
  <main class="app-boot" role="status" aria-live="polite">
    <p class="app-boot__text">Cargando…</p>
  </main>
`;

getSession()
  .then((session) => {
    currentSession = session;
    render();
  })
  .catch((err) => {
    console.error('main: getSession falló al arrancar:', err);
    currentSession = null;
    // Sin sesión que restaurar se cae al login, que es la pantalla correcta
    // tanto si el usuario no había entrado como si el servidor no responde.
    render();
  });

onSessionChange((session) => {
  currentSession = session;
  if (!session && (mode === 'h2-flow' || mode === 'combat' || mode === 'world')) {
    mode = 'auth';
    worldSession = null;
  }
  render();
});
