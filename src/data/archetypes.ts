// 5 arquetipos predefinidos del MVP, uno por atributo dominante. El jugador
// elige uno como punto de partida y puede ajustar todo (stat-line, habilidades,
// perk) dentro de las reglas de creación antes de confirmar.
//
// Reglas validadas por test (ver archetypes.test.ts):
//   - attributes: suma exactamente 12, cada uno ∈ [1, 4].
//   - starting_skills: suma ≤ 10, cada valor ∈ [0, 3], ids existen en SKILLS.
//   - starting_perk_id: existe en PERKS.
//
// El inventario inicial fijo por arquetipo (biblia §4.7) no se redacta aquí:
// depende del catálogo de items que se cierra en H5. Hasta entonces queda
// como array vacío y la pantalla "Inventario inicial" muestra placeholder.

import type { AttributeId, AttributeBlock } from '../rules/character';

export interface ArchetypeDefinition {
  id: string;
  name: string;
  dominant_attribute: AttributeId;
  pitch: string;
  attributes: AttributeBlock;
  starting_skills: Readonly<Record<string, number>>;
  starting_perk_id: string;
  starting_inventory_item_ids: readonly string[];
}

export const ARCHETYPES: readonly ArchetypeDefinition[] = [
  {
    id: 'arq_fue',
    name: 'Rompemuros',
    dominant_attribute: 'fue',
    pitch: 'Hacha al hombro, problemas resueltos a martillazos. Si algo no cae, golpea más fuerte.',
    attributes: { fue: 4, des: 2, con: 3, int: 1, vol: 2 },
    starting_skills: {
      armas_cuerpo: 3,
      atletismo: 3,
      aguante: 2,
      voluntad: 2,
    },
    starting_perk_id: 'perk_golpe_brutal',
    starting_inventory_item_ids: [],
  },
  {
    id: 'arq_des',
    name: 'Filo Veloz',
    dominant_attribute: 'des',
    pitch: 'Llegar antes, golpear primero, irse sin que nadie lo recuerde.',
    attributes: { fue: 2, des: 4, con: 2, int: 2, vol: 2 },
    starting_skills: {
      armas_distancia: 3,
      sigilo: 3,
      percepcion: 2,
      armas_cuerpo: 2,
    },
    starting_perk_id: 'perk_pies_ligeros',
    starting_inventory_item_ids: [],
  },
  {
    id: 'arq_con',
    name: 'Aguantapalos',
    dominant_attribute: 'con',
    pitch: 'El último en pie. Recibe golpes que tumbarían a cualquiera y sigue caminando.',
    attributes: { fue: 3, des: 2, con: 4, int: 1, vol: 2 },
    starting_skills: {
      aguante: 3,
      supervivencia: 3,
      armas_cuerpo: 2,
      atletismo: 2,
    },
    starting_perk_id: 'perk_piel_dura',
    starting_inventory_item_ids: [],
  },
  {
    id: 'arq_int',
    name: 'Lector de Runas',
    dominant_attribute: 'int',
    pitch: 'Lee lo que dejó el evento arcano. Sabe qué tocar, qué evitar, qué vender caro.',
    attributes: { fue: 1, des: 2, con: 2, int: 4, vol: 3 },
    starting_skills: {
      arcanismo: 3,
      percepcion: 3,
      voluntad: 2,
      persuasion: 2,
    },
    starting_perk_id: 'perk_ojo_clinico',
    starting_inventory_item_ids: [],
  },
  {
    id: 'arq_vol',
    name: 'Voz del Yermo',
    dominant_attribute: 'vol',
    pitch: 'Convence con palabras o con presencia. Donde otros se quiebran, mantiene el rumbo.',
    attributes: { fue: 2, des: 2, con: 2, int: 2, vol: 4 },
    starting_skills: {
      persuasion: 3,
      voluntad: 3,
      percepcion: 2,
      sigilo: 2,
    },
    starting_perk_id: 'perk_temple',
    starting_inventory_item_ids: [],
  },
] as const;

export const ARCHETYPES_BY_ID: Readonly<Record<string, ArchetypeDefinition>> =
  Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));
