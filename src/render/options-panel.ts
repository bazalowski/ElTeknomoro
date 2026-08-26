// Panel de opciones (sub-paso 4c.2). Módulo aparte porque tiene DOS puntos de
// montaje, no uno: el menú de pausa dentro de la run y el Menú principal
// (§8.1 fija tres opciones ahí: Nueva Partida, Cargar Partida y Opciones).
//
// Si el tamaño de texto viviese sólo dentro de la pausa, la promesa de PRODUCT
// (3 tamaños ofrecidos al jugador) sería alcanzable únicamente con un PJ vivo
// caminando por el mundo. Las preferencias viven en localStorage, así que el
// mismo panel funciona sin partida cargada y sin tocar `save_slots`.
//
// Aquí NO hay volumen, ni idioma, ni dificultad: el audio de #76 no existe
// todavía y un control que no hace nada es simulación de pulido, justo lo que
// PRODUCT §5 prohíbe.

import { TEXT_SIZES, type Preferences, type TextSize } from '../state/preferences';

const SIZE_LABEL: Record<TextSize, string> = {
  s: 'Pequeño',
  m: 'Normal',
  l: 'Grande',
};

// El tamaño se aplica sobre el font-size de la raíz: la interfaz está escrita
// en rem, así que escalar la raíz escala de verdad la tipografía, el espaciado
// y los controles. No es un atributo decorativo que sólo cambie un párrafo.
export function applyTextSize(size: TextSize): void {
  document.documentElement.dataset.textSize = size;
}

export interface OptionsPanelDeps {
  prefs: Preferences;
  onChange: (next: Preferences) => void;
  // Volver al panel anterior. En la pausa vuelve a la raíz del menú; en el
  // Menú principal vuelve a la pantalla. Siempre presente: un panel sin salida
  // es una trampa.
  onBack: () => void;
}

export function renderOptionsPanel(host: HTMLElement, deps: OptionsPanelDeps): void {
  const { prefs, onChange, onBack } = deps;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  host.innerHTML = `
    <div class="options-panel">
      <h2 class="options-panel__title">Opciones</h2>

      <fieldset class="options-panel__group">
        <legend class="options-panel__legend">Tamaño de texto</legend>
        <div class="options-panel__choices" role="radiogroup" aria-label="Tamaño de texto">
          ${TEXT_SIZES.map(
            (size) => `
            <button
              type="button"
              class="options-panel__choice"
              role="radio"
              aria-checked="${size === prefs.textSize}"
              data-size="${size}"
            >${SIZE_LABEL[size]}</button>
          `,
          ).join('')}
        </div>
      </fieldset>

      <fieldset class="options-panel__group">
        <legend class="options-panel__legend">Confirmaciones</legend>
        <label class="options-panel__check">
          <input type="checkbox" data-confirm-exit ${prefs.confirmOnExit ? 'checked' : ''} />
          <span>Preguntar antes de salir al menú</span>
        </label>
        <p class="options-panel__note">
          Borrar la partida pregunta siempre. Eso no se puede desactivar.
        </p>
      </fieldset>

      <fieldset class="options-panel__group">
        <legend class="options-panel__legend">Movimiento</legend>
        <p class="options-panel__note">
          ${
            reducedMotion
              ? 'Tu sistema pide movimiento reducido. El juego ya lo respeta: sin zoom animado ni transiciones largas.'
              : 'El juego respeta el ajuste de movimiento reducido de tu sistema. Ahora mismo está desactivado ahí.'
          }
        </p>
      </fieldset>

      <div class="options-panel__actions">
        <button type="button" class="options-panel__back" data-options-back>Volver</button>
      </div>
    </div>
  `;

  for (const btn of host.querySelectorAll<HTMLButtonElement>('[data-size]')) {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size as TextSize;
      if (size === prefs.textSize) return;
      applyTextSize(size);
      onChange({ ...prefs, textSize: size });
    });
  }

  host.querySelector<HTMLInputElement>('[data-confirm-exit]')?.addEventListener('change', (ev) => {
    onChange({ ...prefs, confirmOnExit: (ev.target as HTMLInputElement).checked });
  });

  host.querySelector<HTMLButtonElement>('[data-options-back]')?.addEventListener('click', onBack);
}
