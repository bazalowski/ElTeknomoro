// Construye un CreateCharacterInput a partir de un CharacterDraft completo.
//
// Tras el cierre de las 7 pantallas del flow H2 (v0.16, decisión operativa
// del director), todas las vistas garantizan por construcción que los
// campos críticos del draft están rellenos antes de permitir avanzar:
//   - portraitId: H2.1 deshabilita Continuar hasta elegir uno válido.
//   - attributes: H2.2 exige suma == 12 y rango [1, 4].
//   - skills: H2.3 exige suma == 10 y rango [0, 3] (decisión #50).
//   - perks: H2.4 deshabilita Continuar hasta elegir un perk válido (decisión #53).
//
// Por tanto, cuando esta función se llama desde renderH2ConfirmView →
// ctx.confirmAndPersist(), el draft ya pasó las 4 validaciones de UI.
// Aquí solo construimos el input y validamos dura: si algo falta,
// es un bug de orquestación y debe romper en runtime, no caer en defaults.

import type { CharacterDraft } from './h2-flow';
import type { CreateCharacterInput, AttributeId } from '../rules/character';
import { ATTRIBUTE_IDS } from '../rules/character';
import { ARCHETYPES } from '../data/archetypes';

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

  if (!draft.portraitId) {
    throw new Error(
      'h2-defaults: draft.portraitId vacío al sellar. La pantalla de retrato (H2.1) debería haberlo bloqueado.',
    );
  }
  const portraitId = draft.portraitId;

  const archetype =
    draft.archetype !== undefined
      ? draft.archetype
      : draft.mode === 'preset'
        ? defaultArchetypeForPreset()
        : null;

  if (!draft.attributes) {
    throw new Error(
      'h2-defaults: draft.attributes vacío al sellar. La pantalla de atributos (H2.2) debería haberlo bloqueado.',
    );
  }
  const attributes: Record<AttributeId, number> = { fue: 0, des: 0, con: 0, int: 0, vol: 0 };
  for (const attrId of ATTRIBUTE_IDS) {
    const v = draft.attributes[attrId];
    if (typeof v !== 'number') {
      throw new Error(
        `h2-defaults: atributo "${attrId}" sin valor al sellar. La pantalla de atributos (H2.2) debería haberlo bloqueado.`,
      );
    }
    attributes[attrId] = v;
  }
  const sum = ATTRIBUTE_IDS.reduce((acc, k) => acc + attributes[k], 0);
  if (sum !== 12) {
    throw new Error(
      `h2-defaults: suma de atributos == ${sum}, esperada 12. La pantalla de atributos (H2.2) debería haberlo bloqueado.`,
    );
  }

  if (!draft.skills) {
    throw new Error(
      'h2-defaults: draft.skills vacío al sellar. La pantalla de habilidades (H2.3) debería haberlo bloqueado.',
    );
  }
  const skills = draft.skills;

  if (!draft.perks || draft.perks.length !== 1) {
    throw new Error(
      `h2-defaults: draft.perks debe tener exactamente 1 entrada al sellar (recibido ${draft.perks?.length ?? 0}). La pantalla de perk (H2.4) debería haberlo bloqueado.`,
    );
  }
  const perks = draft.perks;

  const location = { mapId: 'inicio', x: 0, y: 0 }; // Placeholder hasta H4 (mapa).

  return { id, name, portraitId, archetype, attributes, skills, perks, location };
}
