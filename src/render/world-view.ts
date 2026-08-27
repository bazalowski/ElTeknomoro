// Vista de mundo (H4 sub-paso 4b): vista regional de 180 grids + zoom
// continuo a vista de grid. Un ÚNICO SVG con camera transform (§9.1, #83):
// la vista de grid no es una pantalla aparte, es la misma superficie con la
// cámara cerca. Producida por MODOPIPELINE (brief validado en
// .claude/pipeline/h4-4b-prompt-impeccable.md).
//
// Separación sagrada de verbos (#88):
//   MIRAR  = cámara. Pan (drag), zoom (rueda), "Acercar" (zoom semántico a un
//            grid). Gratis, ilimitado, sobre cualquier grid. No mueve al PJ.
//   VIAJAR = acción de juego. Click selecciona, "Viajar aquí" confirma, y solo
//            hacia vecinos cardinales (canTravelTo vía world-flow).
// El pan/zoom manual NO se persiste; la vista semántica (regional/grid) sí,
// vía flow.lookAt (#90).
//
// Para probar manualmente: gana el combate del Lobo (pone
// tutorial_lobo_completed=true) y pulsa "Salir al mundo" en home.

import type { Character } from '../rules/character';
import { PORTRAITS_BY_ID } from '../data/portraits';
import {
  getAllGrids,
  getAllRegions,
  getGrid,
  getPOI,
  getPOIsByGrid,
  getHomePOI,
  areGridsAdjacent,
  WORLD_CIFRAS,
  type Grid,
  type POI,
  type POIArchetype,
} from '../rules/world';
import {
  deriveGridState,
  getGridPOIProgress,
  getPOIState,
  type GridState,
} from '../rules/world-state';
import type { WorldFlowHandle } from '../state/world-flow';
import {
  INITIAL_PAUSE_STATE,
  backToRoot,
  canOpenPause,
  cancelConfirm,
  closePause,
  escape as escapePause,
  isPauseOpen,
  openOptions,
  openPause,
  requestConfirm,
  setBusy,
  type PauseState,
} from '../state/pause';
import { browserStorage, readPreferences, writePreferences } from '../state/preferences';
import { applyTextSize, renderOptionsPanel } from './options-panel';
import { showConfirmModal } from './confirm-modal';
import { showCampModal } from './camp-modal';
import {
  FATIGUE_RULES,
  actionsRemaining,
  canPerform,
  countRations,
  maxActionsPerDay,
  nightsUntilStarvation,
} from '../rules/fatigue';

export interface WorldViewDeps {
  flow: WorldFlowHandle;
  character: Character;
  // Entrar al combate desde el POI abierto (4c.1). La vista ya ha hecho su
  // parte de la transición (acercamiento al frame) cuando esto se invoca;
  // main monta la pantalla de combate y, al cerrarla, remonta esta vista, que
  // se restaura sola desde la vista persistida (#90).
  onEnterCombat: (poiId: string) => void;
  // "Guardar y salir al menú" (4c.2). La vista ya ha esperado al flush del
  // world-flow cuando esto se invoca: main sólo tiene que desmontar.
  onExitToMenu: () => void;
  // "Reset run" (4c.2): borra el slot. Devuelve la promesa del borrado para
  // que el panel pueda fallar visible si la red falla.
  onResetRun: () => Promise<void>;
  // Acampar (4d.2). La vista NO acampa: recoge el click y delega. `camp()`
  // devuelve un Character nuevo y sólo main sabe persistirlo (C1 del brief de
  // 4d.2), así que main llama al motor y remonta esta vista con el PJ nuevo.
  onCamp: () => void;
  // Montar el modal de acampar ya abierto, sin confirmar (#99, caso c).
  // Es un flag EXPLÍCITO y no una inferencia del estado: `mountWorldView`
  // sirve tanto al arranque de sesión como al retorno de un combate, y #99
  // prohíbe abrir nada al volver de un combate. Sólo main sabe cuál es cuál.
  openCampOnMount?: boolean;
}

// -----------------------------------------------------------------------------
// Geometría. Unidades de mundo: 1 grid = CELL unidades. La cámara transforma
// unidades → píxeles con translate + scale sobre un solo <g>.
// -----------------------------------------------------------------------------

const CELL = 10;
const SUB = CELL / WORLD_CIFRAS.miniGridSize; // celda del mini-grid 5×5

interface Bounds {
  minX: number;
  minY: number;
  cols: number;
  rows: number;
}

function computeBounds(grids: readonly Grid[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const g of grids) {
    minX = Math.min(minX, g.position.x);
    minY = Math.min(minY, g.position.y);
    maxX = Math.max(maxX, g.position.x);
    maxY = Math.max(maxY, g.position.y);
  }
  return { minX, minY, cols: maxX - minX + 1, rows: maxY - minY + 1 };
}

// Etiquetas provisionales por arquetipo (D-4b-p3: los POIs aún no tienen
// nombre en datos; copy provisional honesto hasta que el contenido entre).
const ARCHETYPE_LABEL: Record<POIArchetype, string> = {
  natural: 'Paraje natural',
  ruina: 'Ruina',
  asentamiento: 'Asentamiento',
  arcano: 'Lugar arcano',
};

const GRID_STATE_LABEL: Record<GridState, string> = {
  inexplorado: 'Inexplorado',
  explorado: 'Explorado',
  controlado: 'Controlado',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Iconos por arquetipo (#89): 4 símbolos SVG autorales, un solo grosor de
// trazo, sin emoji. Dibujados en viewBox 0..10.
const ICON_PATHS: Record<POIArchetype, string> = {
  natural: 'M5 9.2V5.4 M5 5.4C3 5.4 2.3 3.2 3.9 2 M5 5.4c2 0 2.7-2.2 1.1-3.4 M3.2 9.2h3.6',
  ruina: 'M3.1 9.2V4.6l1-1 M6.9 9.2V2.6L5.8 3.5 M2 9.2h6',
  asentamiento: 'M2.3 5.6 5 3l2.7 2.6 M3.2 5.6v3.6h3.6V5.6 M4.6 9.2V7.4h.8v1.8',
  arcano: 'M5 8.6a2.55 2.55 0 1 1 0-5.1 2.55 2.55 0 0 1 0 5.1Z M5 3.5V1.8',
};

// Tramas de escena por arquetipo (4c.1). Cuatro motivos dibujados, no cuatro
// ruidos decorativos: cada uno dice algo del sitio y se distingue de un
// vistazo sin leer el label. Se pintan sobre el color de la región, así que la
// escena sigue siendo "este sitio, en esta región" y no un fondo genérico.
//   natural      → brotes sueltos, ritmo irregular.
//   ruina        → hiladas rotas, horizontal interrumpida.
//   asentamiento → retícula construida, la única trama con orden.
//   arcano       → anillos concéntricos, centro único.
// Unidades de mundo (patternUnits userSpaceOnUse): la trama escala con la
// cámara, así que su densidad relativa al POI es constante a cualquier zoom.
const SCENE_PATTERNS: Record<POIArchetype, { tile: number; d: string }> = {
  natural: { tile: 0.5, d: 'M0.12 0.42V0.2 M0.12 0.29C0.04 0.29 0.04 0.17 0.12 0.17 M0.34 0.2v0.18' },
  ruina: { tile: 0.5, d: 'M0.02 0.16h0.18 M0.26 0.16h0.14 M0.02 0.34h0.1 M0.18 0.34h0.22' },
  asentamiento: { tile: 0.4, d: 'M0.1 0.1h0.2v0.2h-0.2Z' },
  arcano: { tile: 0.6, d: 'M0.3 0.09a0.21 0.21 0 1 1 0 0.42 0.21 0.21 0 0 1 0-0.42Z M0.3 0.21a0.09 0.09 0 1 1 0 0.18 0.09 0.09 0 0 1 0-0.18Z' },
};

// Texto de escena provisional. IDÉNTICO en los 720 (#93): distinguir en
// pantalla un POI curado de uno genérico le dibujaría al jugador el mapa del
// contenido escrito a mano, que es justo lo que #81 no quiere. La distinción
// existe en datos (`hasCuratedSlot`) y se lee con el flag de dev de #16.
const SCENE_TEXT = 'Aún no has explorado este lugar en detalle.';

// El Hogar es el ÚNICO POI con texto propio en 4c, y la excepción está acotada
// por #95: lo que #93 prohíbe es distinguir en pantalla lo curado de lo
// genérico, porque eso dibujaría el mapa del contenido escrito a mano (#81).
// El Hogar no revela nada de ese mapa — ya está identificado por nombre y por
// su juego de acciones —, así que la excepción es por función mecánica
// visible, no por curaduría. Ningún otro POI la recibe, y menos los 80
// `hasCuratedSlot`. PROVISIONAL como todo lo narrativo de H4 (#91).
const HOME_SCENE_TEXT =
  'Cuatro paredes que la maleza aún no ha reclamado. Aquí dejas lo que pesa y recuperas el aliento.';

// Una acción del panel de escena. La fila se construye desde una lista de
// éstos, no desde botones cableados a mano: 4f sustituye "Combatir" por la
// tirada de §9.5 y activa "Inspeccionar", y 4e añadirá la colocación de ancla
// sobre esta misma fila. Tres hoy, N mañana, sin reescribir el panel.
interface SceneAction {
  id: string;
  label: string;
  enabled: boolean;
  disabledReason?: string;
  primary?: boolean;
  danger?: boolean;
  onActivate?: () => void;
}

// -----------------------------------------------------------------------------
// Vista
// -----------------------------------------------------------------------------

type Selection =
  | { kind: 'none' }
  | { kind: 'grid'; gridId: string }
  | { kind: 'poi'; poiId: string };

export function renderWorldView(root: HTMLElement, deps: WorldViewDeps): void {
  const { flow, character, onEnterCombat, onExitToMenu, onResetRun, onCamp } = deps;
  const storage = browserStorage();
  let prefs = readPreferences(storage);
  applyTextSize(prefs.textSize);
  const grids = getAllGrids();
  const bounds = computeBounds(grids);
  const regions = getAllRegions();
  const regionById = new Map(regions.map((r) => [r.id, r]));

  const unitX = (gx: number): number => (gx - bounds.minX) * CELL;
  const unitY = (gy: number): number => (gy - bounds.minY) * CELL;

  root.innerHTML = `
    <div class="world-view" data-world-view>
      <header class="world-view__header">
        <div class="world-view__title-block">
          <h1 class="world-view__title">Terra</h1>
          <button type="button" class="world-view__back" data-wv-back hidden>&lsaquo; Mapa de Terra</button>
        </div>
        <div class="world-view__header-right">
          <button type="button" class="world-view__chip" data-wv-inventory>Inventario</button>
          <button type="button" class="world-view__chip" data-wv-pause>Pausa</button>
          <button type="button" class="world-view__chip" data-wv-camp>Acampar</button>
          <div class="world-view__hud" role="status" aria-label="Estado del personaje">
            <span class="world-view__hud-name">${escapeHtml(character.name)}</span>
            <span class="world-view__hud-sep" aria-hidden="true"></span>
            <span class="world-view__hud-stat">HP <span class="world-view__hud-num" data-wv-hp></span></span>
            <span class="world-view__hud-stat">Nv <span class="world-view__hud-num">${character.level}</span></span>
            <span class="world-view__hud-sep" aria-hidden="true"></span>
            <span class="world-view__hud-stat">Día <span class="world-view__hud-num" data-wv-day></span></span>
            <span class="world-view__jornada" data-wv-jornada role="img"></span>
          </div>
          <p class="world-view__hambre" data-wv-hambre role="status" hidden></p>
        </div>
      </header>
      <div class="world-view__viewport" data-wv-viewport>
        <section
          class="world-view__scene"
          data-wv-scene
          role="group"
          aria-label="Lugar"
          tabindex="-1"
          hidden
        ></section>
        <section
          class="world-view__system"
          data-wv-system
          role="dialog"
          aria-modal="false"
          aria-label="Menú de pausa"
          tabindex="-1"
          hidden
        ></section>
      </div>
      <aside class="world-view__panel" data-wv-panel aria-live="polite"></aside>
    </div>
  `;

  const viewport = root.querySelector<HTMLElement>('[data-wv-viewport]')!;
  const panel = root.querySelector<HTMLElement>('[data-wv-panel]')!;
  const scene = root.querySelector<HTMLElement>('[data-wv-scene]')!;
  const system = root.querySelector<HTMLElement>('[data-wv-system]')!;
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-wv-pause]')!;
  const inventoryBtn = root.querySelector<HTMLButtonElement>('[data-wv-inventory]')!;
  const backBtn = root.querySelector<HTMLButtonElement>('[data-wv-back]')!;
  const hpEl = root.querySelector<HTMLElement>('[data-wv-hp]')!;
  const dayEl = root.querySelector<HTMLElement>('[data-wv-day]')!;
  const jornadaEl = root.querySelector<HTMLElement>('[data-wv-jornada]')!;
  const hambreEl = root.querySelector<HTMLElement>('[data-wv-hambre]')!;
  const campBtn = root.querySelector<HTMLButtonElement>('[data-wv-camp]')!;
  // HP máximo leído del PJ persistido, no recalculado: createCharacter ya
  // aplicó los bonos de perk sobre hp.max. Recomputarlo aquí duplicaría la
  // regla en la vista y derivaría en cuanto cambie la fórmula.
  hpEl.textContent = `${character.hp.current}/${character.hp.max}`;

  // --- Fatiga de jornada (§9.7, decisiones #98/#99/#100) --------------------

  const TOTAL_ACCIONES = maxActionsPerDay(character);

  // Los 8 puntos de Q16a. Se construyen una vez y sólo cambian de clase: un
  // innerHTML por acción gastada tiraría el foco de quien navegue a teclado.
  const pips: HTMLElement[] = [];
  for (let i = 0; i < TOTAL_ACCIONES; i++) {
    const pip = document.createElement('span');
    pip.className = 'world-view__pip';
    pip.setAttribute('aria-hidden', 'true');
    jornadaEl.appendChild(pip);
    pips.push(pip);
  }

  // Banda de color por jornada restante (Q19a, C6 del brief). El ámbar cubre
  // 4-2 y no sólo el último cuarto: con una sola acción en ámbar el aviso es
  // un parpadeo, no un aviso. El 0 no tiene puntos que colorear, así que el
  // grupo entero cambia de lectura — si no, la señal desaparece justo en el
  // estado crítico.
  function bandaDeJornada(restantes: number): 'holgada' | 'aviso' | 'critica' | 'agotada' {
    if (restantes === 0) return 'agotada';
    if (restantes === 1) return 'critica';
    if (restantes <= 4) return 'aviso';
    return 'holgada';
  }

  function pintarFatiga(): void {
    const estado = flow.getState();
    const restantes = actionsRemaining(estado, character);
    const banda = bandaDeJornada(restantes);
    const raciones = countRations(character);

    dayEl.textContent = String(estado.day);

    for (let i = 0; i < pips.length; i++) {
      pips[i]!.classList.toggle('world-view__pip--gastado', i >= restantes);
    }
    jornadaEl.dataset['banda'] = banda;
    jornadaEl.setAttribute(
      'aria-label',
      `Jornada: ${restantes} de ${TOTAL_ACCIONES} acciones restantes`,
    );

    // Tinte de noche (Q20, acotado por C11): sólo la capa de mundo, nunca el
    // header ni los modales. Ocho pasos discretos, uno por acción gastada.
    viewport.dataset['jornada'] = String(estado.actionsSpent);

    // Aviso de hambre (C5, C7). Vive fuera del grupo de puntos: en una run de
    // 4d los dos se ponen en rojo a la vez, y juntos se leerían como una sola
    // señal. Informa, no instruye: en 4d no hay ninguna fuente de raciones,
    // así que sugerir "busca comida" sería mentir sobre lo que la build tiene.
    if (raciones === 0 && character.alive) {
      const noches = nightsUntilStarvation(character);
      hambreEl.hidden = false;
      hambreEl.textContent =
        noches <= 1
          ? 'Sin raciones. La próxima noche a la intemperie es la última.'
          : `Sin raciones. Aguantas ${noches} noches más.`;
    } else {
      hambreEl.hidden = true;
    }

    // #99: acampar SIEMPRE se puede, incluso a 0 acciones. Si no, el PJ que
    // gasta su octava acción viajando se queda encerrado sin salida.
    campBtn.disabled = !character.alive;
  }

  campBtn.addEventListener('click', () => abrirCampamento());

  pintarFatiga();

  // #99 caso (c): al ARRANCAR sesión con la jornada agotada y sin raciones, el
  // modal se monta ya abierto con la advertencia visible y sin confirmar. El
  // click sigue siendo del jugador y Cancelar devuelve a la vista bloqueada,
  // que conserva Pausa y salida al menú.
  //
  // El flag lo pone main y no se infiere del estado a propósito: `mountWorldView`
  // sirve también al retorno de un combate, y ahí #99 prohíbe abrir nada.
  if (deps.openCampOnMount === true && character.alive) {
    abrirCampamento();
  }

  function abrirCampamento(): void {
    if (!character.alive) return;
    const estado = flow.getState();
    // Todos los números salen del motor. Escribir un 5 a mano aquí dejaría el
    // copy mintiendo en cuanto H6 recalibre FATIGUE_RULES.
    const maxTrasPenalizacion = character.hp.max - FATIGUE_RULES.hpMaxPenaltyPerNight;
    showCampModal(root, {
      data: {
        day: estado.day,
        rations: countRations(character),
        hpCurrent: character.hp.current,
        hpMax: character.hp.max,
        actionsSpent: estado.actionsSpent,
        actionsTotal: TOTAL_ACCIONES,
        hpMaxPenalty: FATIGUE_RULES.hpMaxPenaltyPerNight,
        hpCurrentPenalty: Math.max(
          1,
          Math.ceil(Math.max(0, maxTrasPenalizacion) * FATIGUE_RULES.hpCurrentPenaltyRatio),
        ),
        nightsLeft: nightsUntilStarvation(character),
      },
      onConfirm: () => onCamp(),
    });
  }

  // --- SVG base -------------------------------------------------------------

  const svg = svgEl('svg', { class: 'world-view__svg', role: 'group' });
  svg.setAttribute('aria-label', 'Mapa de Terra');
  const defs = svgEl('defs');
  for (const [arch, d] of Object.entries(ICON_PATHS)) {
    const sym = svgEl('symbol', { id: `wv-icon-${arch}`, viewBox: '0 0 10 10' });
    sym.appendChild(svgEl('path', { d, class: 'world-view__icon-path' }));
    defs.appendChild(sym);
  }
  for (const [arch, { tile, d }] of Object.entries(SCENE_PATTERNS)) {
    const pat = svgEl('pattern', {
      id: `wv-scene-${arch}`,
      patternUnits: 'userSpaceOnUse',
      width: String(tile),
      height: String(tile),
    });
    pat.appendChild(svgEl('path', { d, class: 'world-view__scene-motif' }));
    defs.appendChild(pat);
  }
  svg.appendChild(defs);

  const camera = svgEl('g', { class: 'world-view__camera' });
  svg.appendChild(camera);
  viewport.appendChild(svg);

  // Capas dentro de la cámara: grids → etiquetas de región → detalle del grid
  // enfocado → marcador del PJ. El orden pinta el marcador siempre encima.
  const gridLayer = svgEl('g');
  const labelLayer = svgEl('g', { class: 'world-view__region-labels', 'aria-hidden': 'true' });
  const detailLayer = svgEl('g');
  const sceneLayer = svgEl('g', { 'aria-hidden': 'true' });
  const markerLayer = svgEl('g');
  camera.appendChild(gridLayer);
  camera.appendChild(labelLayer);
  camera.appendChild(detailLayer);
  camera.appendChild(sceneLayer);
  camera.appendChild(markerLayer);

  // --- Grids ----------------------------------------------------------------

  const cellByGridId = new Map<string, SVGRectElement>();

  for (const g of grids) {
    const region = regionById.get(g.regionId)!;
    const rect = svgEl('rect', {
      class: 'world-view__cell',
      x: String(unitX(g.position.x)),
      y: String(unitY(g.position.y)),
      width: String(CELL),
      height: String(CELL),
      fill: region.colorHex, // dato provisional de regiones.json, no token CSS
      tabindex: '0',
      role: 'button',
    });
    rect.dataset.gridId = g.id;
    cellByGridId.set(g.id, rect);
    gridLayer.appendChild(rect);
  }

  // Etiquetas geográficas leves: centroide de los grids de cada región.
  for (const region of regions) {
    const rg = grids.filter((g) => g.regionId === region.id);
    const cx = rg.reduce((a, g) => a + unitX(g.position.x), 0) / rg.length + CELL / 2;
    const cy = rg.reduce((a, g) => a + unitY(g.position.y), 0) / rg.length + CELL / 2;
    const label = svgEl('text', {
      class: 'world-view__region-label',
      x: String(cx),
      y: String(cy),
      'text-anchor': 'middle',
    });
    label.textContent = region.displayName;
    labelLayer.appendChild(label);
  }

  // Marcador del PJ en la regional: círculo sólido con anillo (#91).
  const marker = svgEl('g', { class: 'world-view__marker', 'aria-hidden': 'true' });
  // Radios sobre una celda de CELL=10. El anillo pasó de 2.6 a 1.5 y el punto
  // de 1.5 a 0.5: antes ocupaban el 52% y el 30% de la celda y el marcador
  // competía con el propio mapa en vez de anotarlo.
  marker.appendChild(svgEl('circle', { class: 'world-view__marker-ring', r: '1.5' }));
  marker.appendChild(svgEl('circle', { class: 'world-view__marker-dot', r: '0.5' }));
  markerLayer.appendChild(marker);

  // --- Estado de interacción ------------------------------------------------

  let selection: Selection = { kind: 'none' };
  // La cámara es una sola máquina de tres estados (§9.1): 'region' cuando
  // ninguno de los dos está fijado, 'grid' con focusedGridId, 'poi' con
  // focusedPOIId. focusedPOIId implica siempre focusedGridId: un POI se mira
  // desde dentro de su grid, nunca suelto.
  let focusedGridId: string | null = null;
  let focusedPOIId: string | null = null;
  let destroyed = false;
  // Guarda de un solo disparo para la entrada al combate: el segundo click en
  // "Combatir" no lanza un segundo combate (#93). No se limpia porque tras
  // entrar al combate la vista se desmonta entera.
  let combatLaunched = false;
  // Menú de sistema (#94, #95). El inventario es un panel hermano y no un
  // hijo de la pausa: se abre desde su propio botón, así que su apertura no
  // pasa por la máquina de la pausa.
  let pause: PauseState = INITIAL_PAUSE_STATE;
  let inventoryOpen = false;

  // Cualquier panel de sistema abierto congela la superficie igual que lo hace
  // un POI: el mundo se ve, no se toca (#94/Q25).
  const systemOpen = (): boolean => isPauseOpen(pause) || inventoryOpen;

  // Cámara manual: unidades → píxeles. k = px por unidad.
  const cam = { tx: 0, ty: 0, k: 1 };
  let fitK = 1;

  const worldW = bounds.cols * CELL;
  const worldH = bounds.rows * CELL;

  const applyCamera = (): void => {
    camera.style.transform = `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.k})`;
  };

  const setAnimating = (on: boolean): void => {
    camera.classList.toggle('world-view__camera--animating', on);
  };

  const fitRegional = (): { tx: number; ty: number; k: number } => {
    const vw = viewport.clientWidth || 1;
    const vh = viewport.clientHeight || 1;
    const k = Math.min(vw / worldW, vh / worldH) * 0.92;
    return { k, tx: (vw - worldW * k) / 2, ty: (vh - worldH * k) / 2 };
  };

  const fitGrid = (g: Grid): { tx: number; ty: number; k: number } => {
    const vw = viewport.clientWidth || 1;
    const vh = viewport.clientHeight || 1;
    const k = (Math.min(vw, vh) * 0.72) / CELL;
    const cx = unitX(g.position.x) + CELL / 2;
    const cy = unitY(g.position.y) + CELL / 2;
    return { k, tx: vw / 2 - cx * k, ty: vh / 2 - cy * k };
  };

  // Encuadre del POI (tercer nivel de zoom, 4c.1). Dos diferencias con
  // fitGrid, y las dos son la misma idea: el panel de escena ocupa la banda
  // derecha, así que el POI se centra en el espacio que QUEDA. Si lo
  // centrásemos en el viewport entero, el panel taparía justo lo que el
  // jugador acaba de pedir ver.
  const fitPOI = (poi: POI): { tx: number; ty: number; k: number } => {
    const g = getGrid(poi.gridId);
    if (!g) return fitRegional();
    const vw = viewport.clientWidth || 1;
    const vh = viewport.clientHeight || 1;
    // Ancho real del panel (0 mientras está oculto en el primer pintado).
    const panelW = scene.hidden ? Math.min(vw * 0.38, 440) : scene.offsetWidth;
    const stageW = Math.max(vw - panelW, vw * 0.3);
    // El POI ocupa su sub-celda; se encuadra con aire alrededor para que se
    // lea como un lugar y no como un icono pegado al borde.
    const frame = SUB * 2.6;
    const k = Math.min(stageW / frame, vh / frame);
    const cx = unitX(g.position.x) + (poi.position.x + 0.5) * SUB;
    const cy = unitY(g.position.y) + (poi.position.y + 0.5) * SUB;
    return { k, tx: stageW / 2 - cx * k, ty: vh / 2 - cy * k };
  };

  const moveCameraTo = (target: { tx: number; ty: number; k: number }, animate: boolean): void => {
    setAnimating(animate);
    cam.tx = target.tx;
    cam.ty = target.ty;
    cam.k = target.k;
    applyCamera();
  };

  // --- Detalle del grid enfocado (lazy, #89) --------------------------------
  // Solo el grid enfocado tiene su mini-grid montado: 720 iconos permanentes
  // serían peso muerto en la regional.

  const buildDetail = (g: Grid): void => {
    detailLayer.innerHTML = '';
    const ox = unitX(g.position.x);
    const oy = unitY(g.position.y);
    const state = flow.getState();

    const group = svgEl('g', { class: 'world-view__detail' });

    // Fondo del grid: tinte procedural derivado del color de la región (#89).
    group.appendChild(
      svgEl('rect', {
        class: 'world-view__detail-bg',
        x: String(ox),
        y: String(oy),
        width: String(CELL),
        height: String(CELL),
        fill: regionById.get(g.regionId)!.colorHex,
      }),
    );

    // Trama 5×5 leve.
    for (let i = 1; i < WORLD_CIFRAS.miniGridSize; i++) {
      group.appendChild(
        svgEl('line', {
          class: 'world-view__detail-line',
          x1: String(ox + i * SUB),
          y1: String(oy),
          x2: String(ox + i * SUB),
          y2: String(oy + CELL),
        }),
      );
      group.appendChild(
        svgEl('line', {
          class: 'world-view__detail-line',
          x1: String(ox),
          y1: String(oy + i * SUB),
          x2: String(ox + CELL),
          y2: String(oy + i * SUB),
        }),
      );
    }

    // ZONAS DE CLICK: el grid entero se reparte entre sus POIs.
    //
    // El icono de un POI mide 1,5×1,5 dentro de un grid de 10×10. Con 4 POIs
    // eso deja el 91% de la superficie muerta: el jugador tenía que apuntar a
    // un icono pequeño y todo lo demás no respondía. Aquí cada una de las 25
    // celdas del mini-grid se asigna al POI más cercano y recibe un rect
    // transparente con su `data-poi-id`, así que pinchar en cualquier parte
    // del grid selecciona el POI de esa zona.
    //
    // Se reparte por cercanía y no por cuadrantes fijos porque 4b.0 (#89) varió
    // las posiciones dentro del 5×5: un reparto hardcodeado se desalinearía en
    // cuanto un POI no esté donde el reparto supone.
    //
    // Van en su propia capa y ANTES que los POIs para que iconos y etiquetas se
    // pinten encima: si un rect de zona quedara sobre la etiqueta del POI
    // vecino, le robaría los clicks.
    const pois = getPOIsByGrid(g.id);
    if (pois.length > 0) {
      const zonas = svgEl('g', { class: 'world-view__poi-zones' });
      const jugadorAqui = state.currentGridId === g.id;

      for (let my = 0; my < WORLD_CIFRAS.miniGridSize; my++) {
        for (let mx = 0; mx < WORLD_CIFRAS.miniGridSize; mx++) {
          // La celda del PJ se queda fuera del reparto: ahí está su retrato, y
          // que pinchar en uno mismo seleccione un POI cualquiera es peor que
          // que no haga nada.
          if (jugadorAqui && mx === WORLD_CIFRAS.playerCell.x && my === WORLD_CIFRAS.playerCell.y) {
            continue;
          }

          let cercano = pois[0]!;
          let mejor = Infinity;
          for (const poi of pois) {
            const d = (poi.position.x - mx) ** 2 + (poi.position.y - my) ** 2;
            if (d < mejor) {
              mejor = d;
              cercano = poi;
            }
          }

          const zona = svgEl('rect', {
            class: 'world-view__poi-zone',
            x: String(ox + mx * SUB),
            y: String(oy + my * SUB),
            width: String(SUB),
            height: String(SUB),
          });
          zona.dataset.poiId = cercano.id;
          zonas.appendChild(zona);
        }
      }
      group.appendChild(zonas);
    }

    // POIs con niebla (§9.9).
    for (const poi of pois) {
      const px = ox + (poi.position.x + 0.5) * SUB;
      const py = oy + (poi.position.y + 0.5) * SUB;
      const poiState = getPOIState(state, poi.id);
      const revealed = poiState !== null;

      const pg = svgEl('g', {
        class: `world-view__poi${revealed ? '' : ' world-view__poi--fog'}`,
        tabindex: '0',
        role: 'button',
      });
      pg.dataset.poiId = poi.id;
      pg.setAttribute('aria-label', poiAriaLabel(poi, revealed));

      const iconSize = 1.5;
      pg.appendChild(
        svgEl('use', {
          href: `#wv-icon-${poi.archetype}`,
          x: String(px - iconSize / 2),
          y: String(py - iconSize / 2 - 0.15),
          width: String(iconSize),
          height: String(iconSize),
        }),
      );

      if (poiState === 'completado') {
        pg.appendChild(
          svgEl('circle', {
            class: 'world-view__poi-done',
            cx: String(px),
            cy: String(py - 0.15),
            r: '0.95',
          }),
        );
      }

      // La etiqueta se centra en el POI pero se mantiene dentro del grid: los
      // POIs de las columnas exteriores tienen nombres más anchos que su
      // media celda y se derramarían sobre el grid vecino.
      const captionX = Math.min(Math.max(px, ox + 1.3), ox + CELL - 1.3);
      const caption = svgEl('text', {
        class: revealed ? 'world-view__poi-name' : 'world-view__poi-fog-mark',
        x: String(captionX),
        y: String(py + 0.95),
        'text-anchor': 'middle',
      });
      caption.textContent = revealed ? poiDisplayName(poi) : '???';
      pg.appendChild(caption);

      group.appendChild(pg);
    }

    // Retrato del PJ en la celda central (2,2) cuando está en este grid
    // (#91/Q28: retrato en miniatura, no el círculo de la regional).
    if (state.currentGridId === g.id) {
      const portrait = PORTRAITS_BY_ID[character.portraitId];
      const c = WORLD_CIFRAS.playerCell;
      const cx = ox + (c.x + 0.5) * SUB;
      const cy = oy + (c.y + 0.5) * SUB;
      const size = 1.5;
      const pj = svgEl('g', { class: 'world-view__pj', 'aria-hidden': 'true' });
      pj.appendChild(
        svgEl('rect', {
          class: 'world-view__pj-swatch',
          x: String(cx - size / 2),
          y: String(cy - size / 2),
          width: String(size),
          height: String(size),
          fill: portrait?.placeholder_color ?? 'hsl(0, 0%, 50%)',
        }),
      );
      const lbl = svgEl('text', {
        class: 'world-view__pj-label',
        x: String(cx),
        y: String(cy + 0.28),
        'text-anchor': 'middle',
      });
      lbl.textContent = portrait?.label ?? '';
      pj.appendChild(lbl);
      group.appendChild(pj);
    }

    detailLayer.appendChild(group);
  };

  const poiDisplayName = (poi: POI): string =>
    poi.id === WORLD_CIFRAS.homePOIId ? 'El Hogar' : ARCHETYPE_LABEL[poi.archetype];

  const poiAriaLabel = (poi: POI, revealed: boolean): string =>
    revealed ? `${poiDisplayName(poi)}, ${poi.id}` : 'Lugar sin descubrir';

  // --- Escena del POI enfocado (tercer nivel, 4c.1) -------------------------
  // El POI no se dibuja en otra superficie: se dibuja MÁS GRANDE en la misma.
  // Esta capa añade sobre su sub-celda el suelo de la escena (color de región
  // + trama del arquetipo) y el icono a tamaño de lugar. Al salir se vacía.

  const buildScene = (poi: POI): void => {
    sceneLayer.innerHTML = '';
    const g = getGrid(poi.gridId);
    if (!g) return;

    const cx = unitX(g.position.x) + (poi.position.x + 0.5) * SUB;
    const cy = unitY(g.position.y) + (poi.position.y + 0.5) * SUB;
    const size = SUB * 1.8;

    const group = svgEl('g', { class: 'world-view__scene-frame' });
    group.dataset.archetype = poi.archetype;

    const box = {
      x: String(cx - size / 2),
      y: String(cy - size / 2),
      width: String(size),
      height: String(size),
    };
    // Suelo: el color de la región, para que la escena siga siendo "aquí".
    group.appendChild(
      svgEl('rect', { class: 'world-view__scene-floor', ...box, fill: regionById.get(g.regionId)!.colorHex }),
    );
    // Trama del arquetipo encima: es lo que distingue los cuatro sin leer.
    group.appendChild(
      svgEl('rect', { class: 'world-view__scene-weave', ...box, fill: `url(#wv-scene-${poi.archetype})` }),
    );
    group.appendChild(svgEl('rect', { class: 'world-view__scene-edge', ...box }));

    // Glifo dibujado, no `<use>`: el shadow tree de `<use>` no acepta que le
    // sobreescriban el stroke desde fuera, y aquí el trazo es más grueso y más
    // claro que en el icono del mini-grid.
    const iconSize = size * 0.34;
    const k = iconSize / 10;
    const glyph = svgEl('g', {
      class: 'world-view__scene-glyph',
      transform: `translate(${cx - iconSize / 2} ${cy - iconSize / 2}) scale(${k})`,
    });
    glyph.appendChild(svgEl('path', { d: ICON_PATHS[poi.archetype] }));
    group.appendChild(glyph);

    sceneLayer.appendChild(group);
  };

  // Acciones del POI abierto. `[Combatir]` es la única viva en 4c.1: la tirada
  // de §9.5 que la sustituye es 4f, y hasta entonces el placeholder cableado
  // es el Lobo (#83).
  const sceneActions = (poi: POI): SceneAction[] => {
    const actions: SceneAction[] = [];

    // El campamento (#87, repartido por #95). No es una pantalla aparte: es
    // este mismo panel con otras acciones dentro, porque el Hogar es un POI
    // del Sur como cualquier otro (#85). Ajustes y Cambiar de personaje NO
    // están aquí: son menú de sistema y viven en la pausa, que es global —
    // con #88 (viajar cuesta) atarlos a la casa dejaría al PJ lejos sin poder
    // tocarlos.
    // "Descansar" ya no está aquí (4d.2): acampar es global y vive en el
    // header, disponible en los tres niveles de zoom porque #99 permite
    // acampar en cualquier sitio. Dos entradas al mismo acto en la misma
    // pantalla es ruido, y el verbo del producto es "Acampar", no "Descansar".
    if (poi.id === getHomePOI().id) {
      actions.push({
        id: 'inventario',
        label: 'Inventario y equipo',
        enabled: true,
        primary: true,
        onActivate: () => openInventory(),
      });
      actions.push({ id: 'salir', label: 'Salir', enabled: true, onActivate: () => leavePOIView(true) });
      return actions;
    }

    if (poi.archetype === 'asentamiento') {
      // Los asentamientos no son hostiles: aquí no hay combate que ofrecer,
      // ni siquiera deshabilitado. Lo que habrá es gente.
      actions.push({
        id: 'hablar',
        label: 'Hablar',
        enabled: false,
        disabledReason: 'Disponible en H8',
      });
    } else {
      actions.push({
        id: 'combatir',
        label: 'Combatir',
        enabled: character.alive && !combatLaunched,
        danger: true,
        primary: true,
        onActivate: () => enterCombat(poi),
      });
    }

    actions.push({
      id: 'inspeccionar',
      label: 'Inspeccionar',
      enabled: false,
      // Entrar ya revela el lugar (§9.9): en 4c.1 este botón no tendría nada
      // que hacer. Se pinta apagado en vez de esconderse para que la fila del
      // POI no cambie de forma cuando 4f lo encienda.
      disabledReason: 'Disponible en 4f',
    });

    actions.push({
      id: 'salir',
      label: 'Salir',
      enabled: true,
      onActivate: () => leavePOIView(true),
    });

    return actions;
  };

  const paintScene = (): void => {
    if (focusedPOIId === null) {
      scene.hidden = true;
      scene.innerHTML = '';
      return;
    }
    const poi = getPOI(focusedPOIId);
    if (!poi) {
      scene.hidden = true;
      scene.innerHTML = '';
      return;
    }

    const poiState = getPOIState(flow.getState(), poi.id);
    const actions = sceneActions(poi);

    scene.hidden = false;
    scene.setAttribute('aria-label', poiDisplayName(poi));
    scene.innerHTML = `
      <div class="world-view__scene-head">
        <svg class="world-view__scene-icon" viewBox="0 0 10 10" aria-hidden="true">
          <path d="${ICON_PATHS[poi.archetype]}"></path>
        </svg>
        <div class="world-view__scene-names">
          <h2 class="world-view__scene-title">${escapeHtml(poiDisplayName(poi))}</h2>
          <p class="world-view__scene-id">${escapeHtml(poi.id)}</p>
        </div>
      </div>
      <p class="world-view__scene-state">${poiState === 'completado' ? 'Completado' : 'Revelado'}</p>
      <p class="world-view__scene-text">${escapeHtml(
        poi.id === getHomePOI().id ? HOME_SCENE_TEXT : SCENE_TEXT,
      )}</p>
      <div class="world-view__scene-actions">
        ${actions
          .map((a) => {
            const cls = [
              'world-view__scene-btn',
              a.primary ? 'world-view__scene-btn--primary' : '',
              a.danger ? 'world-view__scene-btn--danger' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return `
              <div class="world-view__scene-action">
                <button
                  type="button"
                  class="${cls}"
                  data-wv-action="${a.id}"
                  ${a.enabled ? '' : 'disabled'}
                >${escapeHtml(a.label)}</button>
                ${
                  a.enabled || a.disabledReason === undefined
                    ? ''
                    : `<span class="world-view__scene-reason">${escapeHtml(a.disabledReason)}</span>`
                }
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    for (const a of actions) {
      if (!a.enabled || !a.onActivate) continue;
      scene
        .querySelector<HTMLButtonElement>(`[data-wv-action="${a.id}"]`)
        ?.addEventListener('click', a.onActivate);
    }
  };

  // --- Pintado de estado ----------------------------------------------------

  const paintGridStates = (): void => {
    const state = flow.getState();
    for (const g of grids) {
      const rect = cellByGridId.get(g.id)!;
      // Derivado, no leído del persistido (#94): revelar POIs cambia cómo se
      // ve el grid sin que nadie escriba un estado calculado.
      const gs = deriveGridState(state, g.id);
      rect.dataset.state = gs;
      const region = regionById.get(g.regionId)!;
      rect.setAttribute(
        'aria-label',
        `${region.displayName}, ${g.id}, ${GRID_STATE_LABEL[gs].toLowerCase()}${
          state.currentGridId === g.id ? ', estás aquí' : ''
        }`,
      );
      rect.classList.toggle(
        'world-view__cell--selected',
        selection.kind === 'grid' && selection.gridId === g.id,
      );
    }
  };

  const paintMarker = (): void => {
    const g = getGrid(flow.getState().currentGridId)!;
    const cx = unitX(g.position.x) + CELL / 2;
    const cy = unitY(g.position.y) + CELL / 2;
    // style.transform (no el atributo SVG): es lo que CSS puede transicionar,
    // así el marcador se desliza al viajar en vez de teletransportarse.
    marker.style.transform = `translate(${cx}px, ${cy}px)`;
    // En vista de grid el PJ se pinta como retrato dentro del detalle; el
    // círculo regional se oculta para no duplicar presencia.
    marker.classList.toggle('world-view__marker--hidden', focusedGridId !== null);
  };

  const paintChrome = (): void => {
    backBtn.hidden = focusedGridId === null;
  };

  // --- Panel de selección (tooltip graduado §9.9) ---------------------------

  const paintPanel = (): void => {
    const state = flow.getState();

    if (selection.kind === 'poi') {
      const poi = getPOI(selection.poiId);
      if (!poi) {
        selection = { kind: 'none' };
      } else {
        const poiState = getPOIState(state, poi.id);
        const revealed = poiState !== null;
        // "Entrar" queda reservado a los POIs (#88): el grid se viaja, el POI
        // se entra. Se ofrece sobre cualquier POI del grid que estás mirando,
        // revelado o no — entrar es precisamente lo que lo revela (§9.9).
        const enterable = focusedGridId === poi.gridId;
        panel.innerHTML = `
          <p class="world-view__panel-title">${revealed ? escapeHtml(poiDisplayName(poi)) : '???'}</p>
          ${revealed ? `<p class="world-view__panel-id">${escapeHtml(poi.id)}</p>` : ''}
          <p class="world-view__panel-state">${
            poiState === 'completado'
              ? 'Completado'
              : poiState === 'revelado'
                ? 'Revelado'
                : 'Sin descubrir'
          }</p>
          <div class="world-view__panel-actions">
            ${
              enterable
                ? `<button type="button" class="world-view__panel-btn world-view__panel-btn--travel" data-wv-enter>Entrar</button>`
                : `<button type="button" class="world-view__panel-btn" disabled>Entrar</button>
                   <p class="world-view__panel-reason">Acércate al grid primero.</p>`
            }
          </div>
        `;
        panel
          .querySelector<HTMLButtonElement>('[data-wv-enter]')
          ?.addEventListener('click', () => focusPOI(poi.id, true));
        return;
      }
    }

    if (selection.kind === 'grid') {
      const g = getGrid(selection.gridId);
      if (!g) {
        selection = { kind: 'none' };
      } else {
        const region = regionById.get(g.regionId)!;
        const gs = deriveGridState(state, g.id);
        const isHere = state.currentGridId === g.id;
        const adjacent = areGridsAdjacent(state.currentGridId, g.id);

        let stateLine = `<p class="world-view__panel-state">${GRID_STATE_LABEL[gs]}</p>`;
        if (gs !== 'inexplorado') {
          const progress = getGridPOIProgress(state, g.id);
          stateLine = `
            <p class="world-view__panel-state">${GRID_STATE_LABEL[gs]}</p>
            <p class="world-view__panel-pois"><span class="world-view__panel-num">${progress.revealed}/${progress.total}</span> POIs revelados</p>
          `;
        }

        // Jornada agotada: el verbo se apaga y DICE por qué, con las raciones
        // que quedan dentro del copy (#99, Q3b + Q18). Nunca se abre un modal
        // solo: acampar sigue siendo un click del jugador en su botón.
        const hayJornada = canPerform(flow.getState(), character, 'travel');
        const raciones = countRations(character);
        const copySinJornada =
          raciones > 0
            ? `El día se acabó. Acampa para empezar el siguiente: te ${raciones === 1 ? 'queda 1 ración' : `quedan ${raciones} raciones`}.`
            : 'El día se acabó y no te quedan raciones. Acampar te costará vida.';

        const travelControl = isHere
          ? `<p class="world-view__panel-here">Estás aquí.</p>`
          : !adjacent
            ? `<button type="button" class="world-view__panel-btn" disabled title="Solo puedes viajar a grids colindantes.">Viajar aquí</button>
               <p class="world-view__panel-reason">Solo a grids colindantes.</p>`
            : hayJornada
              ? `<button type="button" class="world-view__panel-btn world-view__panel-btn--travel" data-wv-travel>Viajar aquí</button>`
              : `<button type="button" class="world-view__panel-btn" disabled>Viajar aquí</button>
                 <p class="world-view__panel-reason world-view__panel-reason--jornada">${escapeHtml(copySinJornada)}</p>`;

        // La cámara no se anuncia dos veces: si ya estás dentro de este grid,
        // el botón deja de ofrecer acercarse y ofrece salir.
        const zoomed = focusedGridId === g.id;
        panel.innerHTML = `
          <p class="world-view__panel-title">${escapeHtml(region.displayName)}</p>
          <p class="world-view__panel-id">${escapeHtml(g.id)}</p>
          ${stateLine}
          <div class="world-view__panel-actions">
            <button type="button" class="world-view__panel-btn" data-wv-zoom>${
              zoomed ? 'Alejar' : 'Acercar'
            }</button>
            ${travelControl}
          </div>
        `;

        panel.querySelector<HTMLButtonElement>('[data-wv-zoom]')?.addEventListener('click', () => {
          if (focusedGridId === g.id) unfocusGrid(true);
          else focusGrid(g.id, true);
        });
        panel.querySelector<HTMLButtonElement>('[data-wv-travel]')?.addEventListener('click', () => {
          const outcome = flow.travelTo(g.id);
          if (outcome.moved) {
            paintGridStates();
            paintMarker();
            paintChrome();
            pintarFatiga();
            paintPanel();
            if (focusedGridId !== null) buildDetail(getGrid(focusedGridId)!);
          } else if (outcome.reason === 'no_actions') {
            // El botón ya estaba apagado por `hayJornada`; llegar aquí sería
            // una carrera entre repintados. Se repinta y se deja constancia.
            pintarFatiga();
            paintPanel();
          }
        });
        return;
      }
    }

    panel.innerHTML = `<p class="world-view__panel-hint">Selecciona un grid del mapa.</p>`;
  };

  // --- Zoom semántico -------------------------------------------------------

  const focusGrid = (gridId: string, animate: boolean): void => {
    const g = getGrid(gridId);
    if (!g) return;
    focusedGridId = gridId;
    // Acercarse a un grid lo selecciona: el panel debe hablar del grid que
    // estás mirando, no quedarse en "selecciona un grid" con el grid delante.
    selection = { kind: 'grid', gridId };
    buildDetail(g);
    moveCameraTo(fitGrid(g), animate);
    paintGridStates();
    paintMarker();
    paintPanel();
    paintChrome();
    flow.lookAt({ kind: 'grid', gridId });
    svg.classList.add('world-view__svg--grid-focus');
  };

  const unfocusGrid = (animate: boolean): void => {
    // Salir del grid saliendo también del POI: sólo se desmonta la escena. La
    // vista persistida la fija el `lookAt` regional de abajo, no `leavePOI`,
    // que dejaría un write intermedio apuntando al grid que estamos dejando.
    teardownPOI();
    focusedGridId = null;
    detailLayer.innerHTML = '';
    moveCameraTo(fitRegional(), animate);
    paintMarker();
    paintPanel();
    paintChrome();
    flow.lookAt({ kind: 'region' });
    svg.classList.remove('world-view__svg--grid-focus');
  };

  // --- Tercer nivel: entrar al POI (4c.1) -----------------------------------

  const focusPOI = (poiId: string, animate: boolean): void => {
    const poi = getPOI(poiId);
    if (!poi) return;

    // Un POI se mira desde dentro de su grid. Si el jugador llega aquí desde
    // la regional (restauración de vista persistida), el grid se monta antes.
    if (focusedGridId !== poi.gridId) {
      const g = getGrid(poi.gridId);
      if (!g) return;
      focusedGridId = poi.gridId;
      svg.classList.add('world-view__svg--grid-focus');
    }

    // Entrar cuesta una acción (#100) y el flow puede rechazarlo si la jornada
    // se agotó. Ignorar ese `false` abriría la escena del POI mientras el
    // estado persistido dice que el PJ nunca entró: la vista mentiría y al
    // recargar aparecería en otro sitio.
    if (!flow.enterPOI(poiId)) {
      pintarFatiga();
      paintPanel();
      return;
    }

    focusedPOIId = poiId;
    selection = { kind: 'poi', poiId };
    pintarFatiga();

    buildScene(poi);
    // La superficie de debajo queda inerte mientras el POI está abierto: sin
    // hover, sin click, sin foco, sin pan ni zoom manual. Si no, existiría un
    // estado 'poi' con la cámara mirando otro sitio.
    svg.classList.add('world-view__svg--poi-focus');
    // El detalle del grid se repinta porque el POI acaba de dejar de estar
    // bajo niebla y su etiqueta cambia de "???" al nombre.
    buildDetail(getGrid(poi.gridId)!);
    moveCameraTo(fitPOI(poi), animate);
    paintGridStates();
    paintMarker();
    paintChrome();
    paintPanel();
    paintScene();
    scene.focus({ preventScroll: true });
  };

  // Desmonta la escena sin decidir a dónde va la cámara ni qué vista se
  // persiste: eso es del llamador. Idempotente.
  const teardownPOI = (): void => {
    if (focusedPOIId === null) return;
    focusedPOIId = null;
    sceneLayer.innerHTML = '';
    svg.classList.remove('world-view__svg--poi-focus');
    paintScene();
  };

  const leavePOIView = (animate: boolean): void => {
    const poiId = focusedPOIId;
    if (poiId === null) return;
    teardownPOI();
    flow.leavePOI();

    const g = focusedGridId !== null ? getGrid(focusedGridId) : null;
    if (g) {
      buildDetail(g);
      moveCameraTo(fitGrid(g), animate);
    }
    paintGridStates();
    paintMarker();
    paintChrome();
    paintPanel();
    // El foco vuelve al POI del que se salió, no al principio del documento.
    detailLayer
      .querySelector<SVGGElement>(`[data-poi-id="${CSS.escape(poiId)}"]`)
      ?.focus({ preventScroll: true });
  };

  // Salto al combate (#93, Q31c). La continuidad es zoom al frame + crossfade:
  // `startCombatRun` sustituye el contenido de root, así que montar la
  // pantalla de combate DENTRO de la superficie de mundo exigiría reescribir
  // una pantalla cerrada en H3. El acercamiento extra hace de puente.
  const enterCombat = (poi: POI): void => {
    if (combatLaunched) return;
    combatLaunched = true;
    paintScene(); // repinta el botón ya deshabilitado: el segundo click no existe

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const handOff = (): void => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      destroyed = true;
      onEnterCombat(poi.id);
    };

    if (reduced) {
      handOff();
      return;
    }

    const target = fitPOI(poi);
    moveCameraTo({ tx: target.tx, ty: target.ty, k: target.k * 1.35 }, true);
    root.querySelector<HTMLElement>('[data-world-view]')?.classList.add('world-view--leaving');
    window.setTimeout(handOff, 240);
  };

  // --- Menú de sistema: pausa e inventario (4c.2, #94/#95) ------------------
  // La pausa es el menú de SISTEMA (guardar, salir, opciones, borrar). Las
  // acciones del mundo (inventario real, descansar) son del campamento, que es
  // un lugar. Aquí sólo vive lo que no depende de dónde esté el PJ.

  const savePrefs = (next: typeof prefs): void => {
    prefs = next;
    writePreferences(storage, prefs);
    paintSystem();
  };

  // Abre el inventario desde fuera del chip de cabecera (el campamento lo
  // ofrece como acción del lugar). Un solo destino, dos puertas.
  const openInventory = (): void => {
    if (isPauseOpen(pause) || pause.busy || inventoryOpen) return;
    inventoryOpen = true;
    paintSystem();
  };

  const closeInventory = (): void => {
    if (!inventoryOpen) return;
    inventoryOpen = false;
    paintSystem();
    inventoryBtn.focus({ preventScroll: true });
  };

  // "Guardar y salir": ESPERA a que la escritura confirme antes de desmontar.
  // El resto del mundo persiste fire-and-forget a propósito, pero aquí la
  // vista se va: sin esperar, la última mutación se puede perder y "cargar te
  // devuelve donde estabas" fallaría de vez en cuando. Si falla, falla visible.
  const doExitToMenu = (): void => {
    pause = setBusy(pause, true);
    paintSystem();
    flow
      .flush()
      .then(() => {
        onExitToMenu();
      })
      .catch((err) => {
        console.error('world-view: el guardado final falló, no se sale:', err);
        pause = setBusy(pause, false);
        paintSystem();
        const el = system.querySelector<HTMLElement>('[data-wv-system-error]');
        if (el) el.textContent = 'No se ha podido guardar. No has salido de la partida.';
      });
  };

  const askExitToMenu = (): void => {
    if (!prefs.confirmOnExit) {
      doExitToMenu();
      return;
    }
    pause = requestConfirm(pause, 'exit-to-menu');
    paintSystem();
    showConfirmModal(root, {
      title: 'Vas a salir al menú. Tu progreso se guarda antes de cerrar.',
      confirmLabel: 'Guardar y salir',
      cancelLabel: 'Seguir jugando',
      checkbox: { label: 'No volver a preguntar', mode: 'opt-out' },
      onConfirm: (dontAskAgain) => {
        if (dontAskAgain) savePrefs({ ...prefs, confirmOnExit: false });
        pause = cancelConfirm(pause);
        doExitToMenu();
      },
      onCancel: () => {
        pause = cancelConfirm(pause);
        paintSystem();
      },
    });
  };

  // Borrar la partida es la acción más destructiva del juego (#44, #65) y la
  // única del menú sin deshacer. Doble confirmación literal de #94, resuelta
  // como dos actos deliberados en UNA ventana: la casilla habilita el botón.
  // Encadenar dos modales sería melodrama, que DESIGN prohíbe.
  const askResetRun = (): void => {
    pause = requestConfirm(pause, 'reset-run');
    paintSystem();
    showConfirmModal(root, {
      title: `Vas a borrar la partida de ${character.name}. El personaje, el mundo explorado y el progreso desaparecen, y no queda epitafio.`,
      confirmLabel: 'Borrar la partida',
      cancelLabel: 'Cancelar',
      checkbox: { label: 'Entiendo que se borra la partida', mode: 'gate' },
      danger: true,
      onConfirm: () => {
        pause = cancelConfirm(pause);
        pause = setBusy(pause, true);
        paintSystem();
        onResetRun().catch((err) => {
          console.error('world-view: el borrado del slot falló:', err);
          pause = setBusy(pause, false);
          paintSystem();
          const el = system.querySelector<HTMLElement>('[data-wv-system-error]');
          if (el) el.textContent = 'No se ha podido borrar la partida. Sigue ahí.';
        });
      },
      onCancel: () => {
        pause = cancelConfirm(pause);
        paintSystem();
      },
    });
  };

  const paintSystem = (): void => {
    pauseBtn.setAttribute('aria-expanded', String(isPauseOpen(pause)));
    inventoryBtn.setAttribute('aria-expanded', String(inventoryOpen));

    if (inventoryOpen) {
      system.hidden = false;
      system.setAttribute('aria-label', 'Inventario');
      // Placeholder honesto: ni mochila falsa ni rejilla de huecos vacíos.
      // El inventario real es H6 y fingirlo sería simulación de pulido.
      system.innerHTML = `
        <div class="world-view__system-inner">
          <h2 class="world-view__system-title">Inventario</h2>
          <p class="world-view__system-text">Disponible en H6.</p>
          <div class="world-view__system-actions">
            <button type="button" class="world-view__system-btn" data-wv-inv-close>Volver</button>
          </div>
        </div>
      `;
      system
        .querySelector<HTMLButtonElement>('[data-wv-inv-close]')
        ?.addEventListener('click', closeInventory);
      system.focus({ preventScroll: true });
      return;
    }

    if (pause.panel === 'options') {
      system.hidden = false;
      system.setAttribute('aria-label', 'Opciones');
      renderOptionsPanel(system, {
        prefs,
        onChange: savePrefs,
        onBack: () => {
          pause = backToRoot(pause);
          paintSystem();
        },
      });
      system.focus({ preventScroll: true });
      return;
    }

    if (pause.panel === 'root') {
      system.hidden = false;
      system.setAttribute('aria-label', 'Menú de pausa');
      const busy = pause.busy;
      system.innerHTML = `
        <div class="world-view__system-inner">
          <h2 class="world-view__system-title">Pausa</h2>
          <p class="world-view__system-text">La partida se guarda sola. Esto es sólo para dejarla.</p>
          <div class="world-view__system-actions">
            <button type="button" class="world-view__system-btn world-view__system-btn--primary" data-wv-continue ${busy ? 'disabled' : ''}>Continuar</button>
            <button type="button" class="world-view__system-btn" data-wv-exit ${busy ? 'disabled' : ''}>${busy ? 'Guardando…' : 'Guardar y salir al menú'}</button>
            <button type="button" class="world-view__system-btn" data-wv-options ${busy ? 'disabled' : ''}>Opciones</button>
            <button type="button" class="world-view__system-btn world-view__system-btn--danger" data-wv-reset ${busy ? 'disabled' : ''}>Borrar la partida</button>
          </div>
          <p class="world-view__system-error" data-wv-system-error role="alert"></p>
        </div>
      `;
      system.querySelector<HTMLButtonElement>('[data-wv-continue]')?.addEventListener('click', () => {
        pause = closePause(pause);
        paintSystem();
        pauseBtn.focus({ preventScroll: true });
      });
      system.querySelector<HTMLButtonElement>('[data-wv-exit]')?.addEventListener('click', askExitToMenu);
      system.querySelector<HTMLButtonElement>('[data-wv-options]')?.addEventListener('click', () => {
        pause = openOptions(pause);
        paintSystem();
      });
      system.querySelector<HTMLButtonElement>('[data-wv-reset]')?.addEventListener('click', askResetRun);
      if (!busy) system.focus({ preventScroll: true });
      return;
    }

    system.hidden = true;
    system.innerHTML = '';
  };

  pauseBtn.addEventListener('click', () => {
    if (!canOpenPause(pause)) return;
    pause = openPause(pause);
    closeInventory();
    paintSystem();
  });

  inventoryBtn.addEventListener('click', () => {
    if (isPauseOpen(pause) || pause.busy) return;
    inventoryOpen = !inventoryOpen;
    paintSystem();
  });

  // --- Interacción de cámara (mirar, #88) -----------------------------------

  let dragging = false;
  let dragMoved = false;
  let lastPointer = { x: 0, y: 0 };
  // Punto donde empezó el gesto. El umbral de arrastre se mide DESDE AQUÍ y no
  // desde el último punto procesado: un arrastre lento avanza 2-3 px por
  // evento y nunca superaría un umbral medido entre eventos consecutivos, así
  // que el mapa no se movería por ir despacio.
  let dragOrigin = { x: 0, y: 0 };
  let capturedPointerId: number | null = null;

  // NO se captura el puntero aquí. `setPointerCapture` reapunta también los
  // eventos de ratón de compatibilidad al elemento que captura, así que
  // capturar en cada pointerdown hacía que el `click` se disparase sobre el
  // viewport en vez de sobre la celda del SVG: el listener de selección, que
  // vive en el SVG (hijo), no llegaba a verlo nunca y las celdas no se podían
  // seleccionar con el botón izquierdo. La captura se pide sólo cuando el
  // arrastre empieza de verdad, que es cuando hace falta.
  viewport.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    if (focusedPOIId !== null || systemOpen()) return; // superficie inerte
    dragging = true;
    dragMoved = false;
    dragOrigin = { x: ev.clientX, y: ev.clientY };
    lastPointer = { x: ev.clientX, y: ev.clientY };
  });

  viewport.addEventListener('pointermove', (ev) => {
    if (!dragging) return;

    // Umbral medido desde el origen del gesto, no desde el evento anterior.
    if (!dragMoved) {
      if (Math.hypot(ev.clientX - dragOrigin.x, ev.clientY - dragOrigin.y) < 4) return;
      dragMoved = true;
      // Ahora sí: a partir de aquí es un arrastre y el puntero se captura para
      // que salirse del viewport no lo interrumpa.
      viewport.setPointerCapture(ev.pointerId);
      capturedPointerId = ev.pointerId;
    }

    setAnimating(false);
    cam.tx += ev.clientX - lastPointer.x;
    cam.ty += ev.clientY - lastPointer.y;
    lastPointer = { x: ev.clientX, y: ev.clientY };
    applyCamera();
  });

  viewport.addEventListener('pointerup', () => {
    dragging = false;
    if (capturedPointerId !== null) {
      viewport.releasePointerCapture(capturedPointerId);
      capturedPointerId = null;
    }
  });

  // Un gesto cancelado (el sistema se lleva el puntero) deja el estado limpio.
  // Sin esto, `dragging` se quedaría en true y el siguiente movimiento del
  // ratón, sin botón pulsado, arrastraría el mapa solo.
  viewport.addEventListener('pointercancel', () => {
    dragging = false;
    dragMoved = false;
    if (capturedPointerId !== null) {
      viewport.releasePointerCapture(capturedPointerId);
      capturedPointerId = null;
    }
  });

  viewport.addEventListener(
    'wheel',
    (ev) => {
      if (focusedPOIId !== null || systemOpen()) return; // sin zoom manual
      ev.preventDefault();
      setAnimating(false);
      const rect = viewport.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      const factor = Math.exp(-ev.deltaY * 0.0016);
      const nextK = Math.min(Math.max(cam.k * factor, fitK * 0.7), 60);
      // Zoom anclado al cursor: el punto del mundo bajo el ratón no se mueve.
      cam.tx = mx - ((mx - cam.tx) / cam.k) * nextK;
      cam.ty = my - ((my - cam.ty) / cam.k) * nextK;
      cam.k = nextK;
      applyCamera();
    },
    { passive: false },
  );

  // Seleccionar un POI. El foco salta a "Entrar", que es la única acción que
  // queda y vive al otro lado de la pantalla: con teclado sirve Enter directo,
  // y con ratón no estorba porque el panel acaba de aparecer por este gesto.
  function selectPOI(poiId: string): void {
    selection = { kind: 'poi', poiId };
    paintGridStates();
    paintPanel();
    panel.querySelector<HTMLButtonElement>('[data-wv-enter]')?.focus();
  }

  // Seleccionar una celda. Un click NO acerca: mirar de lejos es legítimo y
  // gratis (#88), y mover la cámara sola en cada click convierte una ojeada al
  // mapa en un viaje. Para acercarse está el doble click, más abajo.
  function selectCell(gridId: string): void {
    selection = { kind: 'grid', gridId };
    paintGridStates();
    paintPanel();
  }

  // Doble click = "hazlo ya", sobre el mismo sitio donde está el ojo.
  //
  // El click sencillo selecciona y no compromete nada. El doble click ejecuta
  // la acción evidente de lo que hay debajo: acercarse al grid, o entrar al
  // POI. Los dos botones del panel lateral ("Acercar" y "Entrar") siguen ahí y
  // siguen siendo el camino descubrible; esto es el atajo para quien ya sabe
  // lo que quiere, que es el caso de las mil visitas al Hogar.
  //
  // Entrar cuesta una acción de jornada (#100) y #88 prohíbe que un click del
  // mapa gaste recurso. Un doble click no es un click perdido: son dos
  // pulsaciones deliberadas sobre el mismo objetivo, con el panel ya delante
  // diciendo qué es y qué cuesta. Sigue siendo un acto explícito del jugador,
  // que es lo que #88 protege.
  svg.addEventListener('dblclick', (ev) => {
    if (dragMoved) return;
    if (focusedPOIId !== null || systemOpen()) return;
    const target = ev.target as Element;

    const poiGroup = target.closest<SVGGElement>('[data-poi-id]');
    if (poiGroup?.dataset.poiId) {
      ev.preventDefault();
      const poiId = poiGroup.dataset.poiId;
      const poi = getPOI(poiId);
      // Sin jornada no se entra. El panel ya lo explica, así que aquí basta
      // con no hacer nada en vez de abrir un modal que nadie pidió (#99).
      if (poi === null || !canPerform(flow.getState(), character, 'enter_poi')) return;
      focusPOI(poiId, true);
      return;
    }

    const cell = target.closest<SVGRectElement>('[data-grid-id]');
    if (cell?.dataset.gridId) {
      ev.preventDefault();
      const gridId = cell.dataset.gridId;
      if (focusedGridId === gridId) unfocusGrid(true);
      else focusGrid(gridId, true);
    }
  });

  // Click = selección y cámara, nunca gasto de recurso (#88). Delegado en el SVG.
  //
  // ACERCARSE ES PARTE DEL CLICK, NO UN PASO APARTE. #88 separó "mirar" de
  // "viajar" para que un click en el mapa no pueda mover al PJ ni gastar
  // jornada, y esa línea sigue intacta: entrar a un POI y viajar a un grid
  // siguen exigiendo su botón explícito porque los dos cuestan una acción
  // (#100). Lo que no tenía decisión detrás era obligar a un segundo click en
  // el panel lateral para una operación que la propia #88 declara "gratis e
  // ilimitada". Acercar no cuesta nada, así que no se confirma: entrar a un
  // POI pasa de cuatro clicks a tres, y el que se va es el único que cruzaba
  // la pantalla para no cobrar nada.
  svg.addEventListener('click', (ev) => {
    if (dragMoved) return; // el arrastre no selecciona
    if (focusedPOIId !== null || systemOpen()) return; // el mundo se ve, no se toca
    const target = ev.target as Element;
    const poiGroup = target.closest<SVGGElement>('[data-poi-id]');
    if (poiGroup?.dataset.poiId) {
      selectPOI(poiGroup.dataset.poiId);
      return;
    }
    const cell = target.closest<SVGRectElement>('[data-grid-id]');
    if (cell?.dataset.gridId) {
      selectCell(cell.dataset.gridId);
      return;
    }
    // Click en el vacío (el "fuera del mundo"): limpia la selección.
    if (selection.kind !== 'none') {
      selection = { kind: 'none' };
      paintGridStates();
      paintPanel();
    }
  });

  // Teclado: Enter/Espacio seleccionan el elemento con foco; Esc aleja o
  // limpia la selección.
  // Teclado: Enter y Espacio hacen exactamente lo mismo que el click. Estaban
  // duplicados con lógicas distintas y ya divergieron una vez; ahora los dos
  // caminos llaman al mismo sitio para que no vuelva a pasar.
  svg.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    if (focusedPOIId !== null || systemOpen()) return;
    const target = ev.target as Element;

    const poiGroup = target.closest<SVGGElement>('[data-poi-id]');
    if (poiGroup?.dataset.poiId) {
      ev.preventDefault();
      selectPOI(poiGroup.dataset.poiId);
      return;
    }

    const cell = target.closest<SVGRectElement>('[data-grid-id]');
    if (cell?.dataset.gridId) {
      ev.preventDefault();
      selectCell(cell.dataset.gridId);
    }
  });

  const onKeyDown = (ev: KeyboardEvent): void => {
    // Autolimpieza: si la vista fue desmontada por otra vía (logout, cambio
    // de sesión), el listener global se retira solo.
    if (!svg.isConnected) {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      return;
    }
    if (ev.key !== 'Escape') return;
    // Escape nunca ABRE la pausa (ese gesto es de la cámara). Con un panel de
    // sistema delante, lo cierra: el panel captura el input, así que la cámara
    // no está escuchando y no hay gesto robado. Un panel con foco atrapado y
    // sin salida por teclado es un fallo de accesibilidad.
    if (isPauseOpen(pause)) {
      const next = escapePause(pause);
      if (next !== pause) {
        pause = next;
        paintSystem();
      }
      return;
    }
    if (inventoryOpen) {
      closeInventory();
      return;
    }
    // Después, los niveles de cámara hacia fuera, uno por pulsación:
    // POI → grid → selección. Nunca salta dos.
    if (focusedPOIId !== null) {
      leavePOIView(true);
    } else if (focusedGridId !== null) {
      unfocusGrid(true);
    } else if (selection.kind !== 'none') {
      selection = { kind: 'none' };
      paintGridStates();
      paintPanel();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  backBtn.addEventListener('click', () => unfocusGrid(true));

  const onResize = (): void => {
    if (destroyed || !svg.isConnected) return;
    fitK = fitRegional().k;
    if (focusedPOIId !== null) {
      const poi = getPOI(focusedPOIId);
      if (poi) moveCameraTo(fitPOI(poi), false);
      return;
    }
    if (focusedGridId !== null) {
      const g = getGrid(focusedGridId);
      if (g) moveCameraTo(fitGrid(g), false);
    }
  };
  window.addEventListener('resize', onResize);

  // --- Montaje inicial ------------------------------------------------------
  // Restaura la vista persistida (#90): si el jugador cerró mirando un grid,
  // reabre mirando ese grid. Una vista 'poi' (reservada a 4c) cae a su grid
  // contenedor. Sin animación en el primer pintado.

  paintGridStates();
  paintMarker();
  paintChrome();
  paintPanel();
  paintSystem();
  fitK = fitRegional().k;

  const initialView = flow.getState().view;
  if (initialView.kind === 'grid') {
    focusGrid(initialView.gridId, false);
  } else if (initialView.kind === 'poi') {
    const poi = getPOI(initialView.poiId);
    // Reabrir dentro del POI donde se cerró (#90). Sin combate en curso: el
    // combate no se serializa (deuda declarada en #93), así que el jugador
    // vuelve al POI con sus botones, no a mitad de una pelea.
    if (poi) focusPOI(poi.id, false);
    else moveCameraTo(fitRegional(), false);
  } else {
    moveCameraTo(fitRegional(), false);
  }
}
