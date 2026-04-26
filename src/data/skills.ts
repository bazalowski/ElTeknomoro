// Catálogo de habilidades del MVP. Inmutable post-publicación: cambiar IDs aquí
// rompe partidas guardadas (los `skills` del Character usan estas claves).
//
// 10 habilidades, dos por atributo. Cubren los verbos que la biblia §4.15.6
// nombra como obligatorios (Sigilo, Percepción, Supervivencia, Persuasión) más
// los necesarios para que cada arquetipo tenga ≥2 vías de progresión naturales.
//
// Esquiva NO es habilidad: queda absorbida por DES (atributo) y por la acción
// "Esquivar" del combate (biblia §4.8). Instinto NO es habilidad: lo cubre el
// derivado Suerte (decisión #43, computeLuck en character.ts).

import type { AttributeId } from '../rules/character';

export interface SkillDefinition {
  id: string;
  name: string;
  attribute: AttributeId;
  description: string;
}

export const SKILLS: readonly SkillDefinition[] = [
  // FUE
  {
    id: 'armas_cuerpo',
    name: 'Armas de cuerpo',
    attribute: 'fue',
    description: 'Manejo de espadas, mazas, hachas y cualquier arma de cuerpo a cuerpo.',
  },
  {
    id: 'atletismo',
    name: 'Atletismo',
    attribute: 'fue',
    description: 'Saltar, escalar, romper puertas, cargar peso y mover obstáculos.',
  },
  // DES
  {
    id: 'armas_distancia',
    name: 'Armas a distancia',
    attribute: 'des',
    description: 'Arcos, ballestas y cualquier arma que se dispare desde lejos.',
  },
  {
    id: 'sigilo',
    name: 'Sigilo',
    attribute: 'des',
    description: 'Moverte sin ser detectado. Se tira para evitar emboscadas y colarte ante centinelas.',
  },
  // CON
  {
    id: 'aguante',
    name: 'Aguante',
    attribute: 'con',
    description: 'Resistir veneno, frío extremo, fatiga, sangrado y desgaste prolongado.',
  },
  {
    id: 'supervivencia',
    name: 'Supervivencia',
    attribute: 'con',
    description: 'Acampar, montar refugio, conseguir comida y agua, rastrear criaturas.',
  },
  // INT
  {
    id: 'arcanismo',
    name: 'Arcanismo',
    attribute: 'int',
    description: 'Leer runas, identificar objetos mágicos y manejar lo que el evento arcano dejó atrás.',
  },
  {
    id: 'percepcion',
    name: 'Percepción',
    attribute: 'int',
    description: 'Detectar trampas, NPCs ocultos, pistas en el terreno y detalles que otros pasan por alto.',
  },
  // VOL
  {
    id: 'persuasion',
    name: 'Persuasión',
    attribute: 'vol',
    description: 'Convencer, intimidar, regatear y conducir conversaciones a tu favor.',
  },
  {
    id: 'voluntad',
    name: 'Voluntad',
    attribute: 'vol',
    description: 'Resistir miedo, dominación mental, ilusiones y locura.',
  },
] as const;

export const SKILLS_BY_ID: Readonly<Record<string, SkillDefinition>> =
  Object.fromEntries(SKILLS.map((s) => [s.id, s]));
