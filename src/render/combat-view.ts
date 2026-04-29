// Pantalla de combate H3 (sub-paso 3b). Vista única persistente DOM puro +
// SVG/CSS para animación de dado. Cero Canvas. Consume el handle del
// orquestador `state/combat-flow.ts` (sub-paso 3a) y se monta sobre un root.
//
// Para probar: en main.ts importa renderCombatView y arranca con un Character
// creado vía createCharacter + un EnemyState del lobo del catálogo. El
// cableado real (entrada desde home-view "Entrar al yermo") es sub-paso 3e.
//
// Decisiones internas (sub-paso 3b, cerradas en este archivo):
//   - D-3b-1: los statuses del PJ NO viven en CombatState.character (D-3a-3
//     del orquestador). La vista los deriva del log: dodge_applied activa
//     "Esquivando · N", status_expired con actor='character' lo retira. La
//     vista mantiene un espejo local; no añade getter al handle.
//   - D-3b-2: tras cada submitAction se consume tail del log y se anima
//     entrada por entrada en una mini-cola (solo dados). El log lateral pinta
//     todas las entradas de golpe; la animación SVG es lo que se difiere.
//   - D-3b-3: budget de animación 500ms top: ~60ms por dado del PJ con
//     ease-out exponencial, ~250ms total para enemigo. prefers-reduced-motion
//     reduce a fade <=100ms (regla CSS, sin lógica especial JS).
//   - D-3b-4: Item filtra inventory.slots por item_id === 'pocion_curacion_menor'
//     únicamente (D-3a-4: el orquestador lanza con cualquier otro item_id en H3).
//   - D-3b-5: cuando el combate cierra, se muestra una capa final con copy
//     sobrio (victoria/derrota) y botón "Volver" que invoca onEnd con el
//     CombatResult capturado. Loot real (3c) y epitafio real (3d) entran en
//     sub-pasos siguientes; aquí loot_resolved/loot_dropped son sólo líneas
//     planas del log.
//   - D-3b-6: Salir top-right confirma con showConfirmModal. Patrón DESIGN
//     §5.7: una frase, dos botones, sin glow. Si el usuario confirma, llama
//     a onEnd con un resultado provisional 'fled' simulado (status mapeado
//     a 'defeat' porque CombatResult no contempla 'fled' aún — H7). Por
//     simplicidad y para no inventar un kind nuevo, en H3 'Salir' equivale
//     a abandonar la sesión: NO llama onEnd; sólo llama a un callback opcional
//     `onExit` que el caller (3e) pasará. Si no se pasa, el botón Salir
//     queda deshabilitado para evitar estados inválidos.

import type { CombatFlowHandle, CombatLogEntry, CombatResult } from '../state/combat-flow';
import type { CombatState } from '../rules/combat';
import type { Character } from '../rules/character';
import type { Item, ItemId, ItemStack } from '../rules/inventory';
import { showConfirmModal } from './confirm-modal';

const HEAL_POTION_ITEM_ID: ItemId = 'pocion_curacion_menor';
const TIMELINE_LOOKAHEAD = 8;
const PJ_DICE_STAGGER_MS = 60;
const PJ_DICE_TOTAL_BUDGET_MS = 480;
const ENEMY_DICE_TOTAL_MS = 250;

export interface RenderCombatOptions {
  // Catálogo de items necesario para resolver el nombre del arma equipada y
  // el nombre legible de las pociones. El orquestador ya consume su propio
  // catalog; la vista lo recibe en paralelo para no atravesar el handle.
  itemCatalog: Readonly<Record<ItemId, Item>>;
  // Mapa enemy_id → nombre legible. La vista lo necesita para el log y los
  // paneles. El orquestador no expone enemyTemplates; se lo damos aquí.
  enemyNames: Readonly<Record<string, string>>;
  // Botón Salir: callback opcional. Si no se pasa, el botón Salir queda
  // deshabilitado (sin estado inválido visible). La home-view (3e) lo
  // cableará a "abandonar combate sin guardar".
  onExit?: () => void;
}

// Handle de la vista. El caller (3e) lo usa para inyectar el `CombatResult`
// que el orquestador emite a su propio `onEnd` interno. La vista lo guarda
// y lo entrega al `onEnd` de su firma cuando el usuario pulsa "Volver" en
// el overlay final (D-3b-5). Patrón hermano del `setFinalResult` que cualquier
// vista de cierre necesitaría: el orquestador es la fuente de verdad del
// CombatResult (incluye loot resuelto), la vista lo retransmite a la
// navegación cuando el jugador confirma.
export interface CombatViewHandle {
  notifyResult(result: CombatResult): void;
}

interface PjStatus {
  kind: string;
  remaining: number;
  magnitude: number;
}

// Espejo local de los statuses del PJ. La vista lo construye leyendo el log
// y se reactualiza tras cada consumeLogTail. Cuando aparece dodge_applied,
// se añade un status 'dodging' con remaining = duration. Cuando aparece
// status_expired con actor='character' del mismo kind, se retira.
function rebuildPjStatusesFromLog(log: readonly CombatLogEntry[]): PjStatus[] {
  const out: PjStatus[] = [];
  for (const entry of log) {
    if (entry.kind === 'dodge_applied') {
      out.push({ kind: 'dodging', remaining: entry.duration, magnitude: entry.magnitude });
    } else if (entry.kind === 'status_expired' && entry.actor === 'character') {
      const idx = out.findIndex((s) => s.kind === entry.status_kind);
      if (idx >= 0) out.splice(idx, 1);
    }
  }
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Nombre legible del actor para el log. 'character' → 'Tú'; instance_id →
// nombre del enemigo del catálogo, con fallback al instance_id si no se
// encuentra (defensivo).
function actorLabel(
  actor: string,
  state: CombatState,
  enemyNames: Readonly<Record<string, string>>,
): string {
  if (actor === 'character') return state.character.name;
  const inst = state.enemies.find((e) => e.instance_id === actor);
  if (inst === undefined) return actor;
  return enemyNames[inst.enemy_id] ?? inst.enemy_id;
}

function statusLabel(kind: string): string {
  if (kind === 'dodging') return 'Esquivando';
  if (kind === 'bleeding') return 'Sangrando';
  if (kind === 'poisoned') return 'Envenenado';
  if (kind === 'stunned') return 'Aturdido';
  return kind;
}

// -----------------------------------------------------------------------------
// Render principal
// -----------------------------------------------------------------------------

export function renderCombatView(
  root: HTMLElement,
  handle: CombatFlowHandle,
  onEnd: (result: CombatResult) => void,
  options: RenderCombatOptions,
): CombatViewHandle {
  // Capturamos el resultado final emitido por el orquestador. La vista lo
  // mostrará en pantalla de cierre (D-3b-5) y lo entregará al pulsar "Volver".
  // El handle ya invocó onEnd internamente al cerrar; aquí lo recapturamos
  // mediante un wrapper sobre handle.getState() y getLog() — el orquestador
  // ya emite el resultado al callback que recibió en startCombatFlow, no a
  // este `onEnd`. Por contrato del prompt, esta vista llama al `onEnd` que
  // le pasa el caller cuando el usuario pulsa "Volver" tras el cierre.
  let finalResult: CombatResult | null = null;

  // ---------------------------------------------------------------------------
  // Estado local (espejo del log, indices en cola, refs)
  // ---------------------------------------------------------------------------

  let pjStatuses: PjStatus[] = rebuildPjStatusesFromLog(handle.getLog());
  let pendingTargetSelection = false;
  let pendingItemSelection = false;
  let lastAttackResolvedForCopy: Extract<CombatLogEntry, { kind: 'attack_resolved' }> | null = null;
  let actionsLocked = false;

  // ---------------------------------------------------------------------------
  // HTML inicial
  // ---------------------------------------------------------------------------

  const exitDisabledAttr = options.onExit === undefined ? ' disabled' : '';

  root.innerHTML = `
    <main class="view combat-view" data-combat-status="${escapeHtml(handle.getState().status)}">
      <button type="button" class="h2-flow__exit combat-view__exit" data-action="exit"${exitDisabledAttr}>Salir</button>

      <header class="combat-view__timeline" aria-label="Cola de turnos">
        <span class="combat-view__timeline-label">Turnos</span>
        <ol class="combat-view__timeline-list" data-combat-timeline></ol>
      </header>

      <section class="combat-view__pj" data-combat-pj aria-label="Tu personaje">
        <!-- pintado por renderPj() -->
      </section>

      <section class="combat-view__foes" data-combat-foes aria-label="Enemigos">
        <!-- pintado por renderFoes() -->
      </section>

      <section class="combat-view__log-wrap" aria-label="Log de combate">
        <header class="combat-view__log-head">
          <span class="combat-view__log-head-label">Log</span>
          <button type="button" class="combat-view__log-copy" data-action="copy-last" disabled>
            Copiar última tirada
          </button>
        </header>
        <ol class="combat-view__log" data-combat-log></ol>
      </section>

      <footer class="combat-view__actions" aria-label="Acciones">
        <button type="button" class="combat-view__action" data-action="attack">Atacar</button>
        <button type="button" class="combat-view__action" data-action="dodge">Esquivar</button>
        <button type="button" class="combat-view__action" data-action="item">Item</button>
        <button type="button" class="combat-view__action" data-action="skill" disabled aria-disabled="true">Habilidad</button>
        <button type="button" class="combat-view__action" data-action="flee" disabled aria-disabled="true">Huir</button>
      </footer>

      <div class="combat-view__overlay" data-combat-overlay hidden>
        <!-- pintado por renderOverlay cuando el combate cierra o cuando hay
             selección de target/item activa -->
      </div>
    </main>
  `;

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  const root$ = root.querySelector<HTMLElement>('.combat-view')!;
  const exitBtn = root.querySelector<HTMLButtonElement>('[data-action="exit"]')!;
  const timelineEl = root.querySelector<HTMLOListElement>('[data-combat-timeline]')!;
  const pjEl = root.querySelector<HTMLElement>('[data-combat-pj]')!;
  const foesEl = root.querySelector<HTMLElement>('[data-combat-foes]')!;
  const logEl = root.querySelector<HTMLOListElement>('[data-combat-log]')!;
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-action="copy-last"]')!;
  const overlayEl = root.querySelector<HTMLElement>('[data-combat-overlay]')!;
  const actionAttack = root.querySelector<HTMLButtonElement>('[data-action="attack"]')!;
  const actionDodge = root.querySelector<HTMLButtonElement>('[data-action="dodge"]')!;
  const actionItem = root.querySelector<HTMLButtonElement>('[data-action="item"]')!;

  // ---------------------------------------------------------------------------
  // Helpers de render
  // ---------------------------------------------------------------------------

  const renderPj = (state: CombatState): void => {
    const ch: Character = state.character;
    const equippedStack = ch.inventory.equipped.main_hand;
    const weapon: Item | null = equippedStack !== undefined
      ? options.itemCatalog[equippedStack.item_id] ?? null
      : null;
    const weaponName = weapon !== null ? weapon.name : 'Sin arma (puños)';
    const weaponDamage = weapon?.stats.weapon_damage ?? 1;

    const statusesHtml = pjStatuses.length === 0
      ? `<li class="combat-view__status combat-view__status--empty">—</li>`
      : pjStatuses.map((s) => `
        <li class="combat-view__status">
          <span class="combat-view__status-label">${escapeHtml(statusLabel(s.kind))}</span>
          <span class="combat-view__status-value">${s.remaining}</span>
        </li>
      `).join('');

    pjEl.innerHTML = `
      <header class="combat-view__pj-head">
        <span class="combat-view__pj-portrait" aria-hidden="true"></span>
        <div class="combat-view__pj-id">
          <span class="combat-view__pj-name">${escapeHtml(ch.name)}</span>
          <span class="combat-view__pj-tag">Tú</span>
        </div>
      </header>

      <dl class="combat-view__pj-stats">
        <div class="combat-view__pj-stat">
          <dt>HP</dt>
          <dd><span data-pj-hp-cur>${ch.hp.current}</span><span class="combat-view__pj-stat-sep">/</span><span>${ch.hp.max}</span></dd>
        </div>
        <div class="combat-view__pj-stat">
          <dt>Oro</dt>
          <dd>${ch.gold}</dd>
        </div>
      </dl>

      <div class="combat-view__pj-weapon">
        <span class="combat-view__pj-weapon-label">Arma</span>
        <span class="combat-view__pj-weapon-name">${escapeHtml(weaponName)}</span>
        <span class="combat-view__pj-weapon-dmg">dmg ${weaponDamage}</span>
      </div>

      <div class="combat-view__pj-statuses">
        <span class="combat-view__pj-statuses-label">Estados</span>
        <ul class="combat-view__statuses">${statusesHtml}</ul>
      </div>
    `;
  };

  const renderFoes = (state: CombatState): void => {
    const html = state.enemies.map((e) => {
      const name = options.enemyNames[e.enemy_id] ?? e.enemy_id;
      // hp_max puede leerse del catálogo de enemigos via enemyNames, pero el
      // contrato del orquestador no nos da hp_max actual; lo derivamos del
      // primer log combat_start que sí lo trae. Aquí lo persistimos en data-attr
      // del propio nodo durante init.
      const isAlive = e.alive;
      const isCurrentTarget = state.turn_order[state.current_turn_index]?.actor === e.instance_id;
      return `
        <article
          class="combat-view__foe${isAlive ? '' : ' combat-view__foe--dead'}${isCurrentTarget ? ' combat-view__foe--turn' : ''}"
          data-foe-instance="${escapeHtml(e.instance_id)}"
        >
          <span class="combat-view__foe-portrait" aria-hidden="true"></span>
          <div class="combat-view__foe-body">
            <header class="combat-view__foe-head">
              <span class="combat-view__foe-name">${escapeHtml(name)}</span>
              <span class="combat-view__foe-id">${escapeHtml(e.instance_id)}</span>
            </header>
            <div class="combat-view__foe-hp">
              <span class="combat-view__foe-hp-label">HP</span>
              <span class="combat-view__foe-hp-cur" data-foe-hp-cur>${e.hp}</span>
              <span class="combat-view__foe-hp-sep">/</span>
              <span class="combat-view__foe-hp-max" data-foe-hp-max>${getEnemyHpMax(e.instance_id)}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
    foesEl.innerHTML = html;
  };

  // hp_max de los enemigos viene del primer combat_start del log. Lo
  // cacheamos al arrancar y lo consultamos al renderizar.
  const enemyHpMaxCache = new Map<string, number>();
  const cacheEnemyHpMax = (): void => {
    const log = handle.getLog();
    for (const entry of log) {
      if (entry.kind !== 'combat_start') continue;
      for (const summary of entry.enemy_summaries) {
        enemyHpMaxCache.set(summary.instance_id, summary.hp_max);
      }
      return;
    }
  };
  function getEnemyHpMax(instanceId: string): number {
    return enemyHpMaxCache.get(instanceId) ?? 0;
  }

  const renderTimeline = (state: CombatState): void => {
    if (state.turn_order.length === 0) {
      timelineEl.innerHTML = '';
      return;
    }
    const slots: { actor: string; isCurrent: boolean }[] = [];
    let idx = state.current_turn_index;
    for (let i = 0; i < TIMELINE_LOOKAHEAD; i++) {
      const turn = state.turn_order[idx]!;
      slots.push({ actor: turn.actor, isCurrent: i === 0 });
      idx = (idx + 1) % state.turn_order.length;
    }
    timelineEl.innerHTML = slots.map((s) => {
      const isPj = s.actor === 'character';
      const cls = `combat-view__timeline-slot${isPj ? ' combat-view__timeline-slot--pj' : ' combat-view__timeline-slot--foe'}${s.isCurrent ? ' combat-view__timeline-slot--current' : ''}`;
      const sigil = isPj ? 'Tú' : (s.actor.split('#')[0] ?? '?').slice(0, 3).toUpperCase();
      return `<li class="${cls}" aria-label="${escapeHtml(s.actor)}">${escapeHtml(sigil)}</li>`;
    }).join('');
  };

  const renderActions = (): void => {
    const ongoing = handle.isOngoing();
    const isPjTurn = handle.isCharacterTurn();
    const enabled = ongoing && isPjTurn && !actionsLocked && !pendingTargetSelection && !pendingItemSelection;
    actionAttack.disabled = !enabled || handle.getState().enemies.every((e) => !e.alive);
    actionDodge.disabled = !enabled;
    // El botón Item se habilita sólo si hay al menos una poción de curación
    // menor en algún slot del inventario.
    const hasPotion = handle.getState().character.inventory.slots.some(
      (s) => s !== null && s !== undefined && s.item_id === HEAL_POTION_ITEM_ID,
    );
    actionItem.disabled = !enabled || !hasPotion;
    // Skill y Flee siguen disabled siempre en H3.
    root$.dataset.combatStatus = handle.getState().status;
  };

  const renderCopyButton = (): void => {
    copyBtn.disabled = lastAttackResolvedForCopy === null;
  };

  // ---------------------------------------------------------------------------
  // Render del log: una entrada cada vez. Idempotente respecto al log: se
  // pinta sólo lo que aún no está pintado (cursor local de longitud).
  // ---------------------------------------------------------------------------

  let logRenderedCount = 0;
  const appendLogEntries = (entries: readonly CombatLogEntry[]): void => {
    const state = handle.getState();
    for (const entry of entries) {
      const node = document.createElement('li');
      node.className = `combat-view__log-entry combat-view__log-entry--${entry.kind}`;
      node.innerHTML = formatLogEntry(entry, state, options.enemyNames);
      if (entry.kind === 'attack_resolved' && entry.critical) {
        node.classList.add('combat-view__log-entry--critical');
      }
      if (entry.kind === 'attack_resolved' && entry.attacker_kind === 'enemy' && entry.critical) {
        // Shake del panel del PJ (afectado).
        pjEl.classList.remove('combat-view__shake');
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        void pjEl.offsetWidth;
        pjEl.classList.add('combat-view__shake');
      }
      logEl.appendChild(node);
      if (entry.kind === 'attack_resolved') {
        lastAttackResolvedForCopy = entry;
      }
      if (entry.kind === 'dodge_applied') {
        // Refresca espejo local antes de repintar.
        pjStatuses = rebuildPjStatusesFromLog(handle.getLog());
      }
      if (entry.kind === 'status_expired' && entry.actor === 'character') {
        pjStatuses = rebuildPjStatusesFromLog(handle.getLog());
      }
      if (entry.kind === 'combat_end') {
        // El orquestador ya invocó su `onEnd` con el CombatResult al cerrar
        // (D-3a-5). Aquí no lo tenemos accesible salvo capturándolo en el
        // wrapper de inicialización (más abajo). Lo pintamos en overlay.
        showFinalOverlay(entry.status);
      }
    }
    logRenderedCount += entries.length;
    // Auto-scroll al final.
    logEl.scrollTop = logEl.scrollHeight;
  };

  // ---------------------------------------------------------------------------
  // Animación de dado (SVG) — se inserta como nodo previo a la entrada
  // attack_resolved en el log. Para el PJ stagger paso a paso; para el
  // enemigo todos a la vez con duración corta.
  // ---------------------------------------------------------------------------

  const animateDice = async (entry: Extract<CombatLogEntry, { kind: 'attack_resolved' }>): Promise<void> => {
    if (entry.rolls.length === 0) return;
    const isPj = entry.attacker_kind === 'character';
    const wrapper = document.createElement('li');
    wrapper.className = `combat-view__log-entry combat-view__log-entry--dice ${isPj ? 'combat-view__log-entry--dice-pj' : 'combat-view__log-entry--dice-foe'}`;
    wrapper.innerHTML = `
      <div class="combat-view__dice-row" aria-hidden="true">
        ${entry.rolls.map((r, i) => `
          <span class="combat-view__die${r >= 4 ? ' combat-view__die--success' : ''}${r === 6 ? ' combat-view__die--six' : ''}" data-die-index="${i}">
            <svg viewBox="0 0 24 24" width="22" height="22" focusable="false" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.25"/>
              <text x="12" y="16" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-size="11" fill="currentColor">${r}</text>
            </svg>
          </span>
        `).join('')}
      </div>
    `;
    logEl.appendChild(wrapper);
    logEl.scrollTop = logEl.scrollHeight;

    const dice = Array.from(wrapper.querySelectorAll<HTMLElement>('.combat-view__die'));
    if (isPj) {
      const stagger = Math.min(PJ_DICE_STAGGER_MS, Math.floor(PJ_DICE_TOTAL_BUDGET_MS / Math.max(1, dice.length)));
      for (let i = 0; i < dice.length; i++) {
        dice[i]!.classList.add('combat-view__die--enter');
        await sleep(stagger);
      }
    } else {
      // Enemigo: todos a la vez, fade-in rápido.
      for (const d of dice) d.classList.add('combat-view__die--enter');
      await sleep(ENEMY_DICE_TOTAL_MS);
    }
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

  // ---------------------------------------------------------------------------
  // Procesamiento del tail: anima dados de los attack_resolved y vuelca el
  // resto al log. Mantiene actionsLocked durante la cola.
  // ---------------------------------------------------------------------------

  const processTail = async (tail: readonly CombatLogEntry[]): Promise<void> => {
    if (tail.length === 0) return;
    actionsLocked = true;
    renderActions();
    try {
      for (const entry of tail) {
        if (entry.kind === 'attack_resolved') {
          await animateDice(entry);
        }
        appendLogEntries([entry]);
        // Refresca paneles tras cada entrada para que HP, statuses y
        // timeline reflejen el estado del orquestador en cada paso.
        renderPj(handle.getState());
        renderFoes(handle.getState());
        renderTimeline(handle.getState());
        renderCopyButton();
      }
    } finally {
      actionsLocked = false;
      renderActions();
    }
  };

  // ---------------------------------------------------------------------------
  // Selección de target (overlay de Atacar) y selección de item.
  // ---------------------------------------------------------------------------

  const showTargetSelection = (): void => {
    pendingTargetSelection = true;
    renderActions();
    const state = handle.getState();
    const targets = state.enemies.filter((e) => e.alive);
    overlayEl.hidden = false;
    overlayEl.innerHTML = `
      <div class="combat-view__overlay-panel" role="dialog" aria-modal="false" aria-label="Selecciona objetivo">
        <p class="combat-view__overlay-title">Selecciona objetivo</p>
        <ul class="combat-view__target-list">
          ${targets.map((t, i) => {
            const name = options.enemyNames[t.enemy_id] ?? t.enemy_id;
            return `
              <li>
                <button type="button" class="combat-view__target" data-target-instance="${escapeHtml(t.instance_id)}" data-target-index="${i}">
                  <span class="combat-view__target-name">${escapeHtml(name)}</span>
                  <span class="combat-view__target-id">${escapeHtml(t.instance_id)}</span>
                  <span class="combat-view__target-hp">HP <span>${t.hp}</span> / <span>${getEnemyHpMax(t.instance_id)}</span></span>
                </button>
              </li>
            `;
          }).join('')}
        </ul>
        <div class="combat-view__overlay-actions">
          <button type="button" class="combat-view__overlay-cancel" data-action="cancel-target">Cancelar</button>
        </div>
      </div>
    `;
    const buttons = Array.from(overlayEl.querySelectorAll<HTMLButtonElement>('[data-target-instance]'));
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.targetInstance!;
        closeOverlay();
        pendingTargetSelection = false;
        void submitAction({ kind: 'attack', target_instance_id: id });
      });
    });
    overlayEl.querySelector<HTMLButtonElement>('[data-action="cancel-target"]')!
      .addEventListener('click', () => {
        closeOverlay();
        pendingTargetSelection = false;
        renderActions();
      });
    if (buttons.length > 0) buttons[0]!.focus();
  };

  const showItemSelection = (): void => {
    pendingItemSelection = true;
    renderActions();
    const slots = handle.getState().character.inventory.slots;
    type SlotEntry = { slot_index: number; stack: ItemStack };
    const potions: SlotEntry[] = [];
    slots.forEach((s, idx) => {
      if (s !== null && s !== undefined && s.item_id === HEAL_POTION_ITEM_ID) {
        potions.push({ slot_index: idx, stack: s });
      }
    });
    const itemDef = options.itemCatalog[HEAL_POTION_ITEM_ID];
    const itemName = itemDef?.name ?? 'Poción de curación menor';
    overlayEl.hidden = false;
    overlayEl.innerHTML = `
      <div class="combat-view__overlay-panel" role="dialog" aria-modal="false" aria-label="Selecciona item">
        <p class="combat-view__overlay-title">Selecciona item</p>
        <ul class="combat-view__target-list">
          ${potions.map((p) => `
            <li>
              <button type="button" class="combat-view__target" data-slot-index="${p.slot_index}">
                <span class="combat-view__target-name">${escapeHtml(itemName)}</span>
                <span class="combat-view__target-id">slot ${p.slot_index}</span>
                <span class="combat-view__target-hp">x<span>${p.stack.quantity}</span></span>
              </button>
            </li>
          `).join('')}
        </ul>
        <div class="combat-view__overlay-actions">
          <button type="button" class="combat-view__overlay-cancel" data-action="cancel-item">Cancelar</button>
        </div>
      </div>
    `;
    const buttons = Array.from(overlayEl.querySelectorAll<HTMLButtonElement>('[data-slot-index]'));
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.slotIndex);
        closeOverlay();
        pendingItemSelection = false;
        void submitAction({ kind: 'use_item', slot_index: idx });
      });
    });
    overlayEl.querySelector<HTMLButtonElement>('[data-action="cancel-item"]')!
      .addEventListener('click', () => {
        closeOverlay();
        pendingItemSelection = false;
        renderActions();
      });
    if (buttons.length > 0) buttons[0]!.focus();
  };

  const showFinalOverlay = (status: 'victory' | 'defeat'): void => {
    const isWin = status === 'victory';
    overlayEl.hidden = false;
    // Copy provisional honesto. PRODUCT §Design Principles 5: placeholder, no
    // narrativa final. El epitafio real (3d) vendrá luego.
    const title = isWin ? 'Has matado al enemigo.' : 'Has caído.';
    overlayEl.innerHTML = `
      <div class="combat-view__overlay-panel combat-view__overlay-panel--final" role="dialog" aria-modal="false" aria-label="Resultado del combate">
        <p class="combat-view__overlay-title combat-view__overlay-title--final">${escapeHtml(title)}</p>
        <div class="combat-view__overlay-actions">
          <button type="button" class="combat-view__overlay-back" data-action="back-final">Volver</button>
        </div>
      </div>
    `;
    const backBtn = overlayEl.querySelector<HTMLButtonElement>('[data-action="back-final"]')!;
    backBtn.addEventListener('click', () => {
      // Si no hay finalResult capturado (pre-init bug), construimos uno mínimo
      // a partir del state final. La firma exige `CombatResult` no-null.
      const fallback: CombatResult = {
        status: handle.getState().status === 'victory' ? 'victory' : 'defeat',
        character: handle.getState().character,
        loot: { gold: 0, items: [], dropped: [] },
      };
      onEnd(finalResult ?? fallback);
    });
    backBtn.focus();
  };

  const closeOverlay = (): void => {
    overlayEl.hidden = true;
    overlayEl.innerHTML = '';
  };

  // ---------------------------------------------------------------------------
  // submitAction: envuelve handle.submitAction y procesa el tail
  // ---------------------------------------------------------------------------

  const submitAction = async (action: Parameters<CombatFlowHandle['submitAction']>[0]): Promise<void> => {
    if (actionsLocked) return;
    if (!handle.isOngoing() || !handle.isCharacterTurn()) return;
    actionsLocked = true;
    renderActions();
    let tail: readonly CombatLogEntry[] = [];
    try {
      tail = handle.submitAction(action);
    } catch (err) {
      console.error('combat-view: submitAction lanzó:', err);
      actionsLocked = false;
      renderActions();
      return;
    }
    // logCursor del handle ya se ha movido; nuestro logRenderedCount se
    // sincroniza con processTail.
    await processTail(tail);
  };

  // ---------------------------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------------------------

  actionAttack.addEventListener('click', () => {
    if (actionAttack.disabled) return;
    const alive = handle.getState().enemies.filter((e) => e.alive);
    if (alive.length === 0) return;
    if (alive.length === 1) {
      void submitAction({ kind: 'attack', target_instance_id: alive[0]!.instance_id });
      return;
    }
    showTargetSelection();
  });

  actionDodge.addEventListener('click', () => {
    if (actionDodge.disabled) return;
    void submitAction({ kind: 'dodge' });
  });

  actionItem.addEventListener('click', () => {
    if (actionItem.disabled) return;
    showItemSelection();
  });

  copyBtn.addEventListener('click', () => {
    if (lastAttackResolvedForCopy === null) return;
    const text = formatAttackForClipboard(lastAttackResolvedForCopy, handle.getState(), options.enemyNames);
    if (navigator.clipboard !== undefined && typeof navigator.clipboard.writeText === 'function') {
      void navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  });

  exitBtn.addEventListener('click', () => {
    if (exitBtn.disabled || options.onExit === undefined) return;
    showConfirmModal(root, {
      title: 'Salir del combate sin guardar.',
      confirmLabel: 'Salir',
      cancelLabel: 'Volver',
      onConfirm: () => {
        options.onExit?.();
      },
    });
  });

  // Atajo Tab para ciclar enemigo durante target selection lo gestiona el
  // navegador con tabindex natural; no añadimos handler propio para evitar
  // estados inválidos.

  // ---------------------------------------------------------------------------
  // Bootstrap: pintar estado inicial y volcar log inicial
  // ---------------------------------------------------------------------------

  cacheEnemyHpMax();
  renderPj(handle.getState());
  renderFoes(handle.getState());
  renderTimeline(handle.getState());

  // El orquestador ya pudo haber emitido entradas iniciales (combat_start +
  // turnos enemigos previos al PJ). Las consumimos y procesamos sin animar
  // dados de turnos pasados (los animamos igual que los nuevos: la cola es
  // unificada — esto da una intro animada que recapitula el arranque).
  const initialTail = handle.consumeLogTail();
  void processTail(initialTail).then(() => {
    renderActions();
  });

  // Si el combate ya cerró antes de montar la vista (caso patológico: el
  // orquestador resolvió y emitió combat_end durante el bootstrap), el
  // overlay final ya se mostró desde appendLogEntries.

  return {
    notifyResult: (result: CombatResult) => {
      finalResult = result;
    },
  };
}

// -----------------------------------------------------------------------------
// Formateo de log
// -----------------------------------------------------------------------------

function formatLogEntry(
  entry: CombatLogEntry,
  state: CombatState,
  enemyNames: Readonly<Record<string, string>>,
): string {
  switch (entry.kind) {
    case 'combat_start': {
      const enemyList = entry.enemy_summaries
        .map((s) => `${escapeHtml(enemyNames[stripInstanceId(s.instance_id)] ?? s.name)}`)
        .join(', ');
      return `<span class="combat-view__log-prefix">Combate inicia.</span> Enemigos: ${enemyList}.`;
    }
    case 'turn_start': {
      const name = entry.actor_kind === 'character'
        ? state.character.name
        : actorLabel(entry.actor, state, enemyNames);
      return `<span class="combat-view__log-prefix">Turno —</span> ${escapeHtml(name)}.`;
    }
    case 'attack_resolved': {
      const attackerName = entry.attacker_kind === 'character'
        ? 'Atacas'
        : `${escapeHtml(actorLabel(entry.attacker, state, enemyNames))} ataca`;
      const targetName = entry.target_kind === 'character'
        ? 'a ti'
        : `a ${escapeHtml(actorLabel(entry.target, state, enemyNames))}`;
      const verdict = entry.hit
        ? (entry.critical ? 'Crítico' : 'Impacto')
        : 'Fallo';
      const rollsHtml = entry.rolls.map((r) => {
        const success = r >= 4 ? ' combat-view__roll--success' : '';
        const six = r === 6 ? ' combat-view__roll--six' : '';
        return `<span class="combat-view__roll${success}${six}">${r}</span>`;
      }).join('<span class="combat-view__roll-sep">,</span>');
      const marginPart = entry.hit ? ` <span class="combat-view__num">+${entry.margin}</span> margen.` : '';
      const damagePart = entry.hit ? ` <span class="combat-view__num">${entry.damage}</span> daño.` : '';
      return `
        ${attackerName} ${targetName}.
        Pool <span class="combat-view__num">${entry.pool}</span>d6
        → <span class="combat-view__rolls">[${rollsHtml}]</span>
        → <span class="combat-view__num">${entry.successes}</span> éxitos
        vs umbral <span class="combat-view__num">${entry.threshold}</span>.
        <span class="combat-view__verdict combat-view__verdict--${entry.hit ? 'hit' : 'miss'}${entry.critical ? ' combat-view__verdict--crit' : ''}">${verdict}.</span>${marginPart}${damagePart}
      `;
    }
    case 'dodge_applied':
      return `Te preparas para esquivar. <span class="combat-view__num">+${entry.magnitude}</span> al umbral del próximo ataque enemigo durante <span class="combat-view__num">${entry.duration}</span> turno.`;
    case 'item_used': {
      const itemName = entry.item_id === 'pocion_curacion_menor' ? 'Poción de curación menor' : entry.item_id;
      const max = state.character.hp.max;
      const after = entry.character_hp_after;
      const prev = after - entry.heal_amount;
      return `Usas ${escapeHtml(itemName)}. <span class="combat-view__num">+${entry.heal_amount}</span> HP. (HP: <span class="combat-view__num">${prev}</span>/<span class="combat-view__num">${max}</span> → <span class="combat-view__num">${after}</span>/<span class="combat-view__num">${max}</span>).`;
    }
    case 'status_expired':
      if (entry.status_kind === 'dodging') return 'Esquiva expirada.';
      return `Estado expirado: ${escapeHtml(statusLabel(entry.status_kind))}.`;
    case 'loot_resolved': {
      if (entry.gold === 0 && entry.items.length === 0) return 'Botín: nada.';
      const itemsTxt = entry.items.length === 0
        ? ''
        : ', ' + entry.items.map((i) => `${escapeHtml(i.item_id)} ×${i.quantity}`).join(', ');
      return `Botín: <span class="combat-view__num">${entry.gold}</span> oro${itemsTxt}.`;
    }
    case 'loot_dropped':
      return `Drop perdido: ${escapeHtml(entry.item_id)} ×<span class="combat-view__num">${entry.quantity}</span> (inventario lleno).`;
    case 'combat_end':
      return entry.status === 'victory' ? 'Combate cerrado. Victoria.' : 'Combate cerrado. Derrota.';
  }
}

function stripInstanceId(instanceId: string): string {
  // 'lobo_del_bosque#1' → 'lobo_del_bosque'. Defensivo: si no hay '#', devuelve el original.
  const i = instanceId.indexOf('#');
  return i === -1 ? instanceId : instanceId.slice(0, i);
}

function formatAttackForClipboard(
  entry: Extract<CombatLogEntry, { kind: 'attack_resolved' }>,
  state: CombatState,
  enemyNames: Readonly<Record<string, string>>,
): string {
  const attacker = entry.attacker_kind === 'character'
    ? state.character.name
    : actorLabel(entry.attacker, state, enemyNames);
  const target = entry.target_kind === 'character'
    ? state.character.name
    : actorLabel(entry.target, state, enemyNames);
  const verdict = entry.hit
    ? (entry.critical ? 'Crítico' : 'Impacto')
    : 'Fallo';
  const tail = entry.hit ? ` ${verdict}. +${entry.margin} margen. ${entry.damage} daño.` : ` ${verdict}.`;
  return `${attacker} ataca a ${target}. Pool ${entry.pool}d6 → [${entry.rolls.join(', ')}] → ${entry.successes} éxitos vs umbral ${entry.threshold}.${tail}`;
}

function fallbackCopy(text: string): void {
  // Fallback ultra-básico: textarea oculto, select, execCommand. Sin librería.
  // PRODUCT §Accessibility no exige clipboard offline; este fallback existe
  // por defensa contra navegadores con permisos restringidos.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    // Silencioso: el usuario verá que el botón se pulsó pero el clipboard
    // no se rellenó. No es regresión de scope.
  }
  document.body.removeChild(ta);
}
