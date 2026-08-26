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

export interface WorldViewDeps {
  flow: WorldFlowHandle;
  character: Character;
  // Volver a la pantalla home (solo ofrecido cuando el PJ está en el grid del
  // Hogar; el home es un lugar, no un menú global — decisión D-4b-p2).
  onExitToHome: () => void;
  // Entrar al combate desde el POI abierto (4c.1). La vista ya ha hecho su
  // parte de la transición (acercamiento al frame) cuando esto se invoca;
  // main monta la pantalla de combate y, al cerrarla, remonta esta vista, que
  // se restaura sola desde la vista persistida (#90).
  onEnterCombat: (poiId: string) => void;
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
  const { flow, character, onExitToHome, onEnterCombat } = deps;
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
          <button type="button" class="world-view__home" data-wv-home hidden>Hogar</button>
          <div class="world-view__hud" role="status" aria-label="Estado del personaje">
            <span class="world-view__hud-name">${escapeHtml(character.name)}</span>
            <span class="world-view__hud-sep" aria-hidden="true"></span>
            <span class="world-view__hud-stat">HP <span class="world-view__hud-num" data-wv-hp></span></span>
            <span class="world-view__hud-stat">Nv <span class="world-view__hud-num">${character.level}</span></span>
          </div>
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
      </div>
      <aside class="world-view__panel" data-wv-panel aria-live="polite"></aside>
    </div>
  `;

  const viewport = root.querySelector<HTMLElement>('[data-wv-viewport]')!;
  const panel = root.querySelector<HTMLElement>('[data-wv-panel]')!;
  const scene = root.querySelector<HTMLElement>('[data-wv-scene]')!;
  const backBtn = root.querySelector<HTMLButtonElement>('[data-wv-back]')!;
  const homeBtn = root.querySelector<HTMLButtonElement>('[data-wv-home]')!;
  const hpEl = root.querySelector<HTMLElement>('[data-wv-hp]')!;
  // HP máximo leído del PJ persistido, no recalculado: createCharacter ya
  // aplicó los bonos de perk sobre hp.max. Recomputarlo aquí duplicaría la
  // regla en la vista y derivaría en cuanto cambie la fórmula.
  hpEl.textContent = `${character.hp.current}/${character.hp.max}`;

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
  marker.appendChild(svgEl('circle', { class: 'world-view__marker-ring', r: '2.6' }));
  marker.appendChild(svgEl('circle', { class: 'world-view__marker-dot', r: '1.5' }));
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

    // POIs con niebla (§9.9).
    for (const poi of getPOIsByGrid(g.id)) {
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
      <p class="world-view__scene-text">${escapeHtml(SCENE_TEXT)}</p>
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
    homeBtn.hidden = flow.getState().currentGridId !== WORLD_CIFRAS.startingGridId;
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

        const travelControl = isHere
          ? `<p class="world-view__panel-here">Estás aquí.</p>`
          : adjacent
            ? `<button type="button" class="world-view__panel-btn world-view__panel-btn--travel" data-wv-travel>Viajar aquí</button>`
            : `<button type="button" class="world-view__panel-btn" disabled title="Solo puedes viajar a grids colindantes.">Viajar aquí</button>
               <p class="world-view__panel-reason">Solo a grids colindantes.</p>`;

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
            paintPanel();
            if (focusedGridId !== null) buildDetail(getGrid(focusedGridId)!);
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

    focusedPOIId = poiId;
    selection = { kind: 'poi', poiId };
    // Una sola escritura de estado y un solo persist: revela + fija la vista.
    flow.enterPOI(poiId);

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

  // --- Interacción de cámara (mirar, #88) -----------------------------------

  let dragging = false;
  let dragMoved = false;
  let lastPointer = { x: 0, y: 0 };

  viewport.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    if (focusedPOIId !== null) return; // superficie inerte con el POI abierto
    dragging = true;
    dragMoved = false;
    lastPointer = { x: ev.clientX, y: ev.clientY };
    viewport.setPointerCapture(ev.pointerId);
  });

  viewport.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - lastPointer.x;
    const dy = ev.clientY - lastPointer.y;
    if (!dragMoved && Math.hypot(ev.clientX - lastPointer.x, ev.clientY - lastPointer.y) < 4) {
      return;
    }
    dragMoved = true;
    setAnimating(false);
    cam.tx += dx;
    cam.ty += dy;
    lastPointer = { x: ev.clientX, y: ev.clientY };
    applyCamera();
  });

  viewport.addEventListener('pointerup', (ev) => {
    dragging = false;
    viewport.releasePointerCapture(ev.pointerId);
  });

  viewport.addEventListener(
    'wheel',
    (ev) => {
      if (focusedPOIId !== null) return; // sin zoom manual dentro del POI
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

  // Click = selección, nunca movimiento (#88). Delegado en el SVG.
  svg.addEventListener('click', (ev) => {
    if (dragMoved) return; // el arrastre no selecciona
    if (focusedPOIId !== null) return; // el mundo se ve, no se toca
    const target = ev.target as Element;
    const poiGroup = target.closest<SVGGElement>('[data-poi-id]');
    if (poiGroup?.dataset.poiId) {
      selection = { kind: 'poi', poiId: poiGroup.dataset.poiId };
      paintGridStates();
      paintPanel();
      return;
    }
    const cell = target.closest<SVGRectElement>('[data-grid-id]');
    if (cell?.dataset.gridId) {
      selection = { kind: 'grid', gridId: cell.dataset.gridId };
      paintGridStates();
      paintPanel();
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
  svg.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    if (focusedPOIId !== null) return;
    const target = ev.target as Element;
    const poiGroup = target.closest<SVGGElement>('[data-poi-id]');
    if (poiGroup?.dataset.poiId) {
      ev.preventDefault();
      selection = { kind: 'poi', poiId: poiGroup.dataset.poiId };
      paintGridStates();
      paintPanel();
      return;
    }
    const cell = target.closest<SVGRectElement>('[data-grid-id]');
    if (cell?.dataset.gridId) {
      ev.preventDefault();
      selection = { kind: 'grid', gridId: cell.dataset.gridId };
      paintGridStates();
      paintPanel();
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
    // Escape recorre los niveles de cámara hacia fuera, uno por pulsación:
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
  homeBtn.addEventListener('click', () => {
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
    destroyed = true;
    onExitToHome();
  });

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
