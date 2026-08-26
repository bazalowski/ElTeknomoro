// Menú principal (§8.1): el selector de las tres partidas del usuario.
//
// Hasta 4c.3 esta pantalla gestionaba UNA partida implícita. §8.2 da 3 slots
// por usuario y #10 pone un personaje por slot, así que cada slot es una run
// completa e independiente: su personaje, su mundo (#90) y su epitafio.
//
// TRES PARTIDAS PARALELAS NO DILUYEN LA PERMADEATH (D-4c4-p1)
// -----------------------------------------------------------------------------
// Lo que diluiría la muerte no es el paralelismo, es la copia. Tres runs no se
// ayudan entre sí — nada hereda de un slot a otro (C3b de #85) y #65 enumera
// de forma cerrada qué sobrevive entre runs — y morir en el slot 1 sigue
// costando el 100% de lo construido ahí. El ataque real sería duplicar un slot
// antes de una pelea peligrosa y quedarse con el que sobreviva: por eso no hay
// ni habrá acción de copiar, duplicar, exportar o mover un slot.
//
// LOS TRES ESTADOS NO SON EL MISMO COMPONENTE TRES VECES
// Un slot vacío casi no dice nada, uno vivo es una ficha densa, y uno caído es
// una lápida. Son tres contenidos distintos con tres pesos distintos, no tres
// tarjetas iguales (DESIGN prohíbe la rejilla de cards clonadas). En el caído,
// "Nueva partida" existe pero no domina: un botón de reutilizar encima de una
// lápida convierte al PJ muerto en un hueco libre.

import type { Session } from '@supabase/supabase-js';
import { signOut } from '../backend/auth';
import { loadSlots, type SlotIndex, type SlotSummary } from '../backend/characters';
import type { Character } from '../rules/character';
import { browserStorage, readPreferences, writePreferences } from '../state/preferences';
import { renderOptionsPanel } from './options-panel';
import { showConfirmModal } from './confirm-modal';

export type HomeIntent =
  | 'create-character'
  // El combate del Lobo del onboarding (#84). Con el tutorial pendiente es la
  // vía por defecto, no la única (#96).
  | 'enter-wilds'
  // Entrar al mundo restaurando la vista persistida (#90). Cubre las dos
  // puertas: cargar una partida ya empezada y saltarse el tutorial asumiendo
  // su coste (#96).
  | 'load-game';

export interface HomeViewOptions {
  // Mensaje a mostrar al montar. Lo usa main.ts cuando una partida cambió por
  // debajo (otra pestaña, otro dispositivo): §8.2 promete los slots desde
  // cualquier sitio, así que esa carrera es visible y no se resuelve con un
  // rebote mudo al menú.
  notice?: string;
}

export function renderHomeView(
  root: HTMLElement,
  session: Session,
  onIntent?: (intent: HomeIntent, slot: SlotIndex) => void,
  options: HomeViewOptions = {},
): void {
  const email = session.user.email ?? 'jugador';

  root.innerHTML = `
    <main class="home-screen" data-home-screen>
      <header class="home-screen__header">
        <p class="home-screen__caller">${escapeHtml(email)}</p>
        <button type="button" class="home-screen__exit" id="logout-btn">Salir</button>
      </header>

      <section class="home-screen__body" data-home-body aria-live="polite">
        <p class="home-screen__loading">Cargando partidas…</p>
      </section>

      <nav class="home-screen__nav" data-home-nav>
        <button type="button" class="home-screen__tertiary" data-home-options>Opciones</button>
      </nav>
    </main>
  `;

  const bodyEl = root.querySelector<HTMLElement>('[data-home-body]')!;
  const screenEl = root.querySelector<HTMLElement>('[data-home-screen]')!;
  const navEl = root.querySelector<HTMLElement>('[data-home-nav]')!;
  const optionsBtn = root.querySelector<HTMLButtonElement>('[data-home-options]')!;
  const logoutBtn = root.querySelector<HTMLButtonElement>('#logout-btn')!;

  const storage = browserStorage();
  let prefs = readPreferences(storage);
  let slots: SlotSummary[] | null = null;

  const paintSlots = (): void => {
    if (slots === null) return;
    screenEl.dataset.branch = 'slots';
    bodyEl.dataset.slots = '';
    bodyEl.innerHTML = `
      ${
        options.notice === undefined
          ? ''
          : `<p class="home-screen__notice" role="status">${escapeHtml(options.notice)}</p>`
      }
      <ul class="home-slots">
        ${slots.map((slot) => `<li class="home-slots__item">${renderSlot(slot)}</li>`).join('')}
      </ul>
    `;

    for (const btn of bodyEl.querySelectorAll<HTMLButtonElement>('[data-slot-action]')) {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.slot) as SlotIndex;
        const action = btn.dataset.slotAction;
        const slot = slots?.find((s) => s.index === index);
        if (!slot) return;

        if (action === 'load') {
          onIntent?.('load-game', index);
          return;
        }
        if (action === 'tutorial') {
          onIntent?.('enter-wilds', index);
          return;
        }
        if (action !== 'create') return;

        // Crear sobre un slot vacío no destruye nada. Crear sobre un caído
        // borra su epitafio para siempre, y el epitafio es algo que el jugador
        // se ha ganado (#11): PRODUCT §3 exige confirmar lo irreversible, y la
        // casilla obliga a leerlo antes de poder pulsar.
        if (slot.state !== 'caido') {
          onIntent?.('create-character', index);
          return;
        }
        const name = slot.character?.name ?? 'ese personaje';
        showConfirmModal(root, {
          title: `Crear aquí borra el epitafio de ${name}. No queda copia en ninguna parte.`,
          confirmLabel: 'Crear personaje nuevo',
          cancelLabel: 'Dejarlo descansar',
          checkbox: { label: 'Entiendo que el epitafio se pierde', mode: 'gate' },
          danger: true,
          onConfirm: () => onIntent?.('create-character', index),
        });
      });
    }
  };

  const paintError = (): void => {
    screenEl.dataset.branch = 'error';
    bodyEl.innerHTML = `
      <p class="home-screen__error">No se han podido cargar tus partidas. Recarga la página para volver a intentarlo.</p>
    `;
  };

  loadSlots()
    .then((loaded) => {
      slots = loaded;
      paintSlots();
    })
    .catch((err) => {
      console.error('home-view: loadSlots falló:', err);
      paintError();
    });

  // §8.1 fija tres opciones en el Menú principal. Nueva Partida y Cargar
  // Partida son acción de cada slot — con tres partidas, "Cargar" sin decir
  // cuál no significa nada —, y Opciones es la única global.
  optionsBtn.addEventListener('click', () => {
    navEl.hidden = true;
    screenEl.dataset.branch = 'options';
    delete bodyEl.dataset.slots;
    renderOptionsPanel(bodyEl, {
      prefs,
      onChange: (next) => {
        prefs = next;
        writePreferences(storage, prefs);
      },
      onBack: () => {
        navEl.hidden = false;
        paintSlots();
        optionsBtn.focus();
      },
    });
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

// -----------------------------------------------------------------------------
// Los tres estados de un slot
// -----------------------------------------------------------------------------

function renderSlot(slot: SlotSummary): string {
  if (slot.state === 'vivo' && slot.character) return renderAlive(slot.index, slot.character);
  if (slot.state === 'caido' && slot.character) return renderFallen(slot.index, slot.character);
  return renderEmpty(slot.index);
}

// Un hueco no necesita ficha. Dice lo que es, ofrece la única acción posible y
// se calla: el índice sólo aparece en el aria-label, porque el jugador
// identifica sus partidas por quién vive dentro, no por un número.
function renderEmpty(index: SlotIndex): string {
  return `
    <section class="home-slot home-slot--empty" aria-label="Partida ${index + 1}, vacía">
      <p class="home-slot__vacant">Sin partida</p>
      <button type="button" class="home-slot__action" data-slot="${index}" data-slot-action="create">
        Nueva partida
      </button>
    </section>
  `;
}

function renderAlive(index: SlotIndex, character: Character): string {
  const archetype = character.archetype ?? 'sin oficio';
  // #96: el PJ que aún no ha peleado el Lobo conserva sus dos vías, y el copy
  // dice el precio de saltárselo en vez de esconderlo tras un botón mudo.
  const tutorialPending = !character.tutorial_lobo_completed;

  return `
    <section
      class="home-slot home-slot--alive"
      aria-label="Partida ${index + 1}, ${escapeHtml(character.name)}, nivel ${character.level}"
    >
      <div class="home-slot__identity">
        <h2 class="home-slot__name">${escapeHtml(character.name)}</h2>
        <p class="home-slot__archetype">${escapeHtml(archetype)}</p>
      </div>

      <dl class="home-slot__stats">
        <div class="home-slot__stat">
          <dt>Nivel</dt>
          <dd class="home-slot__num">${character.level}</dd>
        </div>
        <div class="home-slot__stat">
          <dt>Vida</dt>
          <dd class="home-slot__num">${character.hp.current}/${character.hp.max}</dd>
        </div>
      </dl>

      <div class="home-slot__actions">
        ${
          tutorialPending
            ? `<button type="button" class="home-slot__action home-slot__action--primary" data-slot="${index}" data-slot-action="tutorial">Entrar al yermo</button>
               <button type="button" class="home-slot__action home-slot__action--quiet" data-slot="${index}" data-slot-action="load">Salir al mundo sin pelear</button>
               <p class="home-slot__cost">Te ahorras el primer combate, pero pierdes su botín y su experiencia. Podrás volver a por el lobo mientras sigas vivo.</p>`
            : `<button type="button" class="home-slot__action home-slot__action--primary" data-slot="${index}" data-slot-action="load">Cargar partida</button>`
        }
      </div>
    </section>
  `;
}

// La lápida (3e.2). El contenido del slot ES el epitafio: "empezar de nuevo"
// existe, pero apagado y al margen. Un botón de reutilizar dominando una
// lápida convierte al PJ caído en un hueco libre, y por ahí es por donde se
// diluye de verdad la gravedad de la muerte (PRODUCT §3, #11).
function renderFallen(index: SlotIndex, character: Character): string {
  const archetype = character.archetype ?? 'sin oficio';
  const epitaphLine = character.epitaph?.cause.description ?? 'Caído en el yermo.';
  const endedAtIso = character.epitaph?.ended_at ?? null;
  const endedAtHuman = endedAtIso ? formatEndedAt(endedAtIso) : null;

  return `
    <section
      class="home-slot home-slot--fallen"
      aria-label="Partida ${index + 1}, ${escapeHtml(character.name)}, caído"
    >
      <article class="home-fallen" aria-label="Personaje caído">
        <h2 class="home-fallen__name">${escapeHtml(character.name)}</h2>

        <p class="home-fallen__line home-fallen__line--archetype">
          ${escapeHtml(archetype)}, nivel <span class="home-fallen__num">${character.level}</span>
        </p>

        <p class="home-fallen__epitaph">${escapeHtml(epitaphLine)}</p>

        ${
          endedAtHuman
            ? `<p class="home-fallen__date"><time datetime="${escapeHtml(endedAtIso ?? '')}">${escapeHtml(endedAtHuman)}</time></p>`
            : ''
        }
      </article>

      <button type="button" class="home-slot__action home-slot__action--quiet" data-slot="${index}" data-slot-action="create">
        Empezar de nuevo aquí
      </button>
    </section>
  `;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatEndedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateFormatter.format(d).replace(/\.$/, '');
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
