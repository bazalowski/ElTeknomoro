import { renderH2StartView } from '../render/h2-start-view';
import { renderH2PortraitView } from '../render/h2-portrait-view';
import { renderH2AttributesView } from '../render/h2-attributes-view';
import { renderH2SkillsView } from '../render/h2-skills-view';
import { renderH2PerkView } from '../render/h2-perk-view';
import { renderH2InventoryView } from '../render/h2-inventory-view';
import { renderH2PreviewView } from '../render/h2-preview-view';
import { renderH2ConfirmView } from '../render/h2-confirm-view';
import { showConfirmModal } from '../render/confirm-modal';
import { createCharacter } from '../rules/character';
import type { AttributeId } from '../rules/character';
import { saveCharacter } from '../backend/characters';
import { buildCreateInputFromDraft } from './h2-defaults';
import { PORTRAITS_BY_ID } from '../data/portraits';

export type H2Step =
  | 'start'
  | 'portrait'
  | 'attributes'
  | 'skills'
  | 'perk'
  | 'inventory'
  | 'preview'
  | 'confirm';

export interface CharacterDraft {
  mode: 'scratch' | 'preset' | null;
  name?: string;
  portraitId?: string;
  archetype?: string | null;
  attributes?: Partial<Record<AttributeId, number>>;
  skills?: Record<string, number>;
  perks?: string[];
}

export interface H2StepCtx {
  draft: Readonly<CharacterDraft>;
  goBack: () => void;
  goNext: () => void;
  reset: () => void;
  exit: () => void;
  confirmAndPersist: () => Promise<void>;
  setPortrait: (id: string) => void;
}

const ORDER: readonly H2Step[] = [
  'start',
  'portrait',
  'attributes',
  'skills',
  'perk',
  'inventory',
  'preview',
  'confirm',
];

export function startH2Flow(root: HTMLElement, onExit: () => void): void {
  const draft: CharacterDraft = { mode: null };
  let step: H2Step = 'start';
  let exited = false;

  const exitFlow = () => {
    if (exited) return;
    exited = true;
    window.removeEventListener('keydown', onEscape);
    onExit();
  };

  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !exited) {
      e.preventDefault();
      exitWithConfirm();
    }
  };

  const ctx: H2StepCtx = {
    get draft() {
      return draft;
    },
    goBack: () => {
      const idx = ORDER.indexOf(step);
      if (idx <= 0) return;
      const prev = ORDER[idx - 1];
      if (!prev) return;
      step = prev;
      mountStep();
    },
    goNext: () => {
      if (step === 'confirm') {
        console.warn('h2-flow: usar confirmAndPersist en step confirm');
        return;
      }
      const idx = ORDER.indexOf(step);
      const next = ORDER[idx + 1];
      if (!next) return;
      step = next;
      mountStep();
    },
    reset: () => {
      showConfirmModal(root, {
        title: 'Empezar de nuevo desde cero.',
        confirmLabel: 'Empezar de nuevo',
        cancelLabel: 'Cancelar',
        onConfirm: () => {
          for (const k of Object.keys(draft) as (keyof CharacterDraft)[]) {
            delete draft[k];
          }
          draft.mode = null;
          step = 'start';
          mountStep();
        },
      });
    },
    exit: () => exitWithConfirm(),
    confirmAndPersist: async () => {
      const input = buildCreateInputFromDraft(draft);
      const character = createCharacter(input);
      await saveCharacter(character);
      exitFlow();
    },
    setPortrait: (id: string) => {
      if (!(id in PORTRAITS_BY_ID)) {
        console.warn(`h2-flow: portraitId no válido: ${id}`);
        return;
      }
      draft.portraitId = id;
    },
  };

  const exitWithConfirm = () => {
    showConfirmModal(root, {
      title: 'Salir y descartar el personaje en construcción.',
      confirmLabel: 'Salir',
      cancelLabel: 'Cancelar',
      onConfirm: () => exitFlow(),
    });
  };

  const mountStep = () => {
    root.innerHTML = '';
    if (step === 'start') {
      renderH2StartView(root, (mode) => {
        draft.mode = mode;
        ctx.goNext();
      });
      return;
    }
    switch (step) {
      case 'portrait':
        renderH2PortraitView(root, ctx);
        return;
      case 'attributes':
        renderH2AttributesView(root, ctx);
        return;
      case 'skills':
        renderH2SkillsView(root, ctx);
        return;
      case 'perk':
        renderH2PerkView(root, ctx);
        return;
      case 'inventory':
        renderH2InventoryView(root, ctx);
        return;
      case 'preview':
        renderH2PreviewView(root, ctx);
        return;
      case 'confirm':
        renderH2ConfirmView(root, ctx);
        return;
    }
  };

  window.addEventListener('keydown', onEscape);
  mountStep();
}
