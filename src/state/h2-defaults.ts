// Construye un CreateCharacterInput a partir de un CharacterDraft parcial,
// rellenando con DEFAULTS VÁLIDOS los campos que las pantallas reales todavía
// no rellenan. Los defaults pasan validateCreation: 12 puntos atributo, 10
// skill, 1 perk, name no vacío.

import type { CharacterDraft } from './h2-flow';
import type { CreateCharacterInput, AttributeId } from '../rules/character';
import { ATTRIBUTE_IDS } from '../rules/character';
import { SKILLS } from '../data/skills';
import { PERKS } from '../data/perks';
import { ARCHETYPES } from '../data/archetypes';

const DEFAULT_ATTRIBUTES: Record<AttributeId, number> = {
  fue: 3,
  des: 3,
  con: 2,
  int: 2,
  vol: 2,
};

// 4 primeros IDs de SKILLS con valores 3,3,2,2 (suma 10, ninguna >3).
function defaultSkills(): Record<string, number> {
  const ids = SKILLS.slice(0, 4).map((s) => s.id);
  const values = [3, 3, 2, 2];
  const out: Record<string, number> = {};
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const v = values[i];
    if (id === undefined || v === undefined) continue;
    out[id] = v;
  }
  return out;
}

function defaultPerk(): string {
  const first = PERKS[0];
  if (!first) throw new Error('PERKS está vacío.');
  return first.id;
}

function defaultArchetypeForPreset(): string {
  const first = ARCHETYPES[0];
  if (!first) throw new Error('ARCHETYPES está vacío.');
  return first.id;
}

export function buildCreateInputFromDraft(
  draft: CharacterDraft,
): CreateCharacterInput {
  const id = crypto.randomUUID();
  const shortId = id.slice(0, 8);
  const name = draft.name ?? `Personaje ${shortId}`;
  const portraitId = draft.portraitId ?? 'placeholder';

  const archetype =
    draft.archetype !== undefined
      ? draft.archetype
      : draft.mode === 'preset'
        ? defaultArchetypeForPreset()
        : null;

  const attributes: Record<AttributeId, number> = { ...DEFAULT_ATTRIBUTES };
  if (draft.attributes) {
    for (const attrId of ATTRIBUTE_IDS) {
      const v = draft.attributes[attrId];
      if (typeof v === 'number') attributes[attrId] = v;
    }
  }
  const sum = ATTRIBUTE_IDS.reduce((acc, k) => acc + attributes[k], 0);
  if (sum !== 12) {
    throw new Error(
      'Los atributos no suman 12; pendiente de cerrar en la pantalla de atributos.',
    );
  }

  const skills = draft.skills ?? defaultSkills();
  const perks = draft.perks ?? [defaultPerk()];
  const location = { mapId: 'inicio', x: 0, y: 0 }; // Placeholder hasta H4 (mapa).

  return { id, name, portraitId, archetype, attributes, skills, perks, location };
}
