// Tests de la fatiga de jornada (§9.7, decisiones #98, #99, #100). Sub-paso 4d.
//
// Lo que más se prueba aquí es la noche sin ración, porque es donde el
// cuestionario de 4d se contradecía y donde #98 tuvo que arbitrar: cobran las
// dos cosas —el máximo, que es lo que mata, y el actual, que es lo que se
// siente— con un clamp detrás que sin él dejaría HP actual por encima del techo.

import { describe, it, expect } from 'vitest';

import {
  FATIGUE_RULES,
  ACTION_COSTS,
  actionCost,
  actionsRemaining,
  maxActionsPerDay,
  canPerform,
  consumeAction,
  countRations,
  hasRation,
  camp,
  deathByFatigue,
  nightsUntilStarvation,
  type FatigueActionType,
} from './fatigue.ts';
import { createCharacter, type Character } from './character.ts';
import { createInitialWorldState, type WorldState } from './world-state.ts';
import { addItem, type Inventory } from './inventory.ts';
import { ITEMS_BY_ID, STARTING_RATIONS } from '../data/items.ts';

const AYER = '2026-08-26T00:00:00.000Z';

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

// Reparte los 12 puntos de creación con CON en el valor pedido, respetando
// mínimo 1 y máximo 4 por atributo (`CREATION_RULES`). El techo de 4 es lo que
// acota el HP máximo real de un PJ recién creado: `computeMaxHp = 8 + 2·CON`
// da entre 10 (CON 1) y 16 (CON 4), no los 18 que daría un CON 5 inalcanzable.
function pj(con = 3, over: Partial<Character> = {}): Character {
  const otros: Record<'fue' | 'des' | 'int' | 'vol', number> = { fue: 1, des: 1, int: 1, vol: 1 };
  let porRepartir = 12 - con - 4;
  for (const k of ['fue', 'des', 'int', 'vol'] as const) {
    const suma = Math.min(3, porRepartir);
    otros[k] += suma;
    porRepartir -= suma;
  }
  const base = createCharacter({
    id: 'pj-test',
    name: 'Probador',
    portraitId: 'retrato-01',
    archetype: null,
    attributes: { ...otros, con },
    skills: {},
    // Sin perk de HP: `perk_piel_dura` da +2 al máximo y falsearía la
    // aritmética de inanición que estos tests comprueban.
    perks: ['perk_pies_ligeros'],
    location: { mapId: 'sur-001', x: 0, y: 0 },
  });
  // Se le quitan las raciones que `createCharacter` reparte por #98: en estos
  // tests las provisiones son la variable bajo prueba, así que se ponen
  // explícitamente con `conRaciones` en cada caso que las necesite.
  return { ...sinRaciones(base), ...over };
}

// Vacía la mochila de raciones.
function sinRaciones(character: Character): Character {
  const slots = character.inventory.slots.map((s) =>
    s !== null && s.item_id === FATIGUE_RULES.rationItemId ? null : s,
  );
  return { ...character, inventory: { ...character.inventory, slots } };
}

function conRaciones(character: Character, cantidad: number): Character {
  if (cantidad === 0) return character;
  const inventory: Inventory = addItem(
    character.inventory,
    { item_id: FATIGUE_RULES.rationItemId, quantity: cantidad, durability: null },
    ITEMS_BY_ID,
  );
  return { ...character, inventory };
}

function conHp(character: Character, current: number, max: number): Character {
  return { ...character, hp: { current, max } };
}

const mundo = (over: Partial<WorldState> = {}): WorldState => ({ ...createInitialWorldState(), ...over });

// -----------------------------------------------------------------------------

describe('coste de acciones (#100, Q1)', () => {
  it('mover, entrar a POI, craftear y hablar cuestan 1', () => {
    for (const a of ['travel', 'enter_poi', 'craft', 'talk'] as FatigueActionType[]) {
      expect(actionCost(a)).toBe(1);
    }
  });

  it('combatir y acampar son gratis', () => {
    expect(actionCost('fight')).toBe(0);
    expect(actionCost('camp')).toBe(0);
  });

  it('el combate es gratis porque la acción se cobró al entrar al POI (Q41)', () => {
    // Entrar con 1 acción restante y pelear deja al PJ a 0, no en negativo.
    let w = mundo({ actionsSpent: 7 });
    const c = pj();
    w = consumeAction(w, c, 'enter_poi');
    expect(actionsRemaining(w, c)).toBe(0);
    w = consumeAction(w, c, 'fight');
    expect(actionsRemaining(w, c)).toBe(0);
  });

  it('el catálogo de costes cubre todos los verbos del enum', () => {
    const verbos: FatigueActionType[] = ['travel', 'enter_poi', 'craft', 'talk', 'fight', 'camp'];
    for (const v of verbos) expect(ACTION_COSTS[v]).toBeTypeOf('number');
    expect(Object.keys(ACTION_COSTS)).toHaveLength(verbos.length);
  });
});

describe('jornada de 8 acciones (#71, #100 Q2c)', () => {
  it('un día arranca con 8 acciones', () => {
    expect(actionsRemaining(mundo(), pj())).toBe(8);
  });

  it('son 8 para cualquier PJ en H4, sin modular por atributos', () => {
    // El pool de creación son 12 puntos, así que CON 1 y CON 5 son los extremos
    // razonables de un PJ real. Ninguno mueve la jornada en H4.
    expect(maxActionsPerDay(pj(1))).toBe(8);
    expect(maxActionsPerDay(pj(4))).toBe(8);
    expect(maxActionsPerDay(pj(1))).toBe(maxActionsPerDay(pj(4)));
  });

  it('cada acción de coste 1 descuenta una', () => {
    let w = mundo();
    const c = pj();
    for (let i = 1; i <= 8; i++) {
      w = consumeAction(w, c, 'travel');
      expect(actionsRemaining(w, c)).toBe(8 - i);
    }
  });

  it('`actionsRemaining` nunca baja de 0 aunque el estado venga sucio', () => {
    expect(actionsRemaining(mundo({ actionsSpent: 99 }), pj())).toBe(0);
  });
});

describe('canPerform — es lo que apaga los botones, no lo que fuerza modales (#99)', () => {
  it('a 0 acciones los verbos de mundo dejan de poder', () => {
    const w = mundo({ actionsSpent: 8 });
    const c = pj();
    expect(canPerform(w, c, 'travel')).toBe(false);
    expect(canPerform(w, c, 'enter_poi')).toBe(false);
  });

  it('acampar SIEMPRE puede, incluso a 0 acciones: si no, el PJ queda encerrado', () => {
    expect(canPerform(mundo({ actionsSpent: 8 }), pj(), 'camp')).toBe(true);
  });

  it('combatir puede a 0 acciones, para no bloquear un combate ya empezado (Q40)', () => {
    expect(canPerform(mundo({ actionsSpent: 8 }), pj(), 'fight')).toBe(true);
  });

  it('con 1 acción restante todavía puede un verbo de coste 1', () => {
    expect(canPerform(mundo({ actionsSpent: 7 }), pj(), 'travel')).toBe(true);
  });
});

describe('consumeAction — el orquestador debe preguntar antes', () => {
  it('lanza si no queda jornada, en vez de dejar el contador en negativo', () => {
    expect(() => consumeAction(mundo({ actionsSpent: 8 }), pj(), 'travel')).toThrow(/no quedan acciones/);
  });

  it('el error dice cuánto se había gastado, para que el bug sea localizable', () => {
    expect(() => consumeAction(mundo({ actionsSpent: 8 }), pj(), 'travel')).toThrow(/gastadas 8 de 8/);
  });

  it('es puro: no muta el WorldState que recibe', () => {
    const w = mundo();
    const despues = consumeAction(w, pj(), 'travel');
    expect(w.actionsSpent).toBe(0);
    expect(despues.actionsSpent).toBe(1);
  });

  it('un verbo gratis devuelve el mismo estado sin tocarlo', () => {
    const w = mundo({ actionsSpent: 3 });
    expect(consumeAction(w, pj(), 'fight')).toBe(w);
  });
});

describe('raciones (#98)', () => {
  it('`createCharacter` reparte las provisiones iniciales de #98 (Q8b)', () => {
    // Este test mira el PJ tal cual sale de creación, sin pasar por el fixture
    // que se las quita. Sin provisiones el PJ moriría de hambre antes de
    // encontrar la primera ración, porque en 4d no hay forma de conseguir más.
    const recienCreado = createCharacter({
      id: 'pj-nuevo', name: 'Nuevo', portraitId: 'retrato-01', archetype: null,
      attributes: { fue: 3, des: 3, con: 3, int: 2, vol: 1 },
      skills: {}, perks: ['perk_pies_ligeros'],
      location: { mapId: 'sur-001', x: 0, y: 0 },
    });
    expect(countRations(recienCreado)).toBe(STARTING_RATIONS);
    expect(hasRation(recienCreado)).toBe(true);
  });

  it('el fixture arranca sin raciones, para que cada test las declare', () => {
    expect(countRations(pj())).toBe(0);
    expect(hasRation(pj())).toBe(false);
  });

  it('cuenta las raciones de la mochila', () => {
    expect(countRations(conRaciones(pj(), 4))).toBe(4);
    expect(hasRation(conRaciones(pj(), 1))).toBe(true);
  });

  it('la ración existe en el catálogo y es apilable', () => {
    const racion = ITEMS_BY_ID[FATIGUE_RULES.rationItemId];
    expect(racion).toBeDefined();
    expect(racion!.stack_size).toBeGreaterThan(1);
  });
});

describe('acampar con ración', () => {
  it('gasta exactamente una', () => {
    const r = camp(conRaciones(pj(), 3), mundo(), AYER);
    expect(r.usedRation).toBe(true);
    expect(countRations(r.character)).toBe(2);
  });

  it('resetea las 8 acciones', () => {
    const r = camp(conRaciones(pj(), 1), mundo({ actionsSpent: 8 }), AYER);
    expect(r.worldState.actionsSpent).toBe(0);
    expect(actionsRemaining(r.worldState, r.character)).toBe(8);
  });

  it('incrementa el día al despertar (#100, Q7)', () => {
    const r = camp(conRaciones(pj(), 1), mundo({ day: 5 }), AYER);
    expect(r.worldState.day).toBe(6);
  });

  it('cura hasta el máximo vigente (#98, matizada el 26/8/2026)', () => {
    const herido = conHp(conRaciones(pj(), 1), 3, 14);
    const r = camp(herido, mundo(), AYER);
    expect(r.character.hp).toEqual({ current: 14, max: 14 });
    expect(r.hpRestored).toBe(11);
    expect(r.hpMaxLost).toBe(0);
    expect(r.hpCurrentLost).toBe(0);
  });

  it('a tope de vida no recupera nada y no lo anuncia', () => {
    const r = camp(conHp(conRaciones(pj(), 1), 14, 14), mundo(), AYER);
    expect(r.hpRestored).toBe(0);
    expect(r.character.hp.current).toBe(14);
  });

  it('cura al máximo VIGENTE, no al original: la inanición previa no se revierte', () => {
    // Q33 dejó postergado revertir la pérdida de máximo. Comer devuelve al
    // techo que quedó, no al que había antes de pasar hambre.
    const primeraNoche = camp(conHp(pj(), 14, 14), mundo(), AYER);
    expect(primeraNoche.character.hp.max).toBe(9);

    const conComida = camp(conRaciones(primeraNoche.character, 1), primeraNoche.worldState, AYER);
    expect(conComida.character.hp).toEqual({ current: 9, max: 9 });
  });

  it('acampar antes de agotar el día pierde las acciones no usadas (Q4)', () => {
    const r = camp(conRaciones(pj(), 1), mundo({ actionsSpent: 3 }), AYER);
    expect(r.worldState.actionsSpent).toBe(0);
    expect(r.worldState.day).toBe(2);
  });

  it('no marca `last_damage_source`: dormir comiendo no es daño', () => {
    expect(camp(conRaciones(pj(), 1), mundo(), AYER).character.last_damage_source).toBeNull();
  });
});

describe('acampar sin ración — el arbitraje de #98', () => {
  it('acampa igual: el PJ nunca queda encerrado a 0 acciones', () => {
    const r = camp(conHp(pj(), 14, 14), mundo({ actionsSpent: 8 }), AYER);
    expect(r.usedRation).toBe(false);
    expect(r.worldState.actionsSpent).toBe(0);
    expect(r.died).toBe(false);
  });

  it('el máximo baja 5, que es lo que mata', () => {
    const r = camp(conHp(pj(), 14, 14), mundo(), AYER);
    expect(r.character.hp.max).toBe(9);
    expect(r.hpMaxLost).toBe(5);
  });

  it('el actual baja el 10% del máximo YA reducido, redondeando hacia arriba', () => {
    // max 14 → 9. 10% de 9 = 0.9 → ceil = 1.
    const r = camp(conHp(pj(), 14, 14), mundo(), AYER);
    expect(r.character.hp.current).toBe(9);
    expect(r.hpCurrentLost).toBe(5);
  });

  it('el golpe al actual nunca es 0 por redondeo', () => {
    // max 6 → 1. 10% de 1 = 0.1 → ceil = 1, no 0.
    const r = camp(conHp(pj(), 1, 6), mundo(), AYER);
    expect(r.character.hp.max).toBe(1);
    expect(r.character.hp.current).toBe(0);
  });

  it('clampa el actual al máximo nuevo: sin eso quedaría por encima del techo', () => {
    // A tope de vida, el máximo cae a 9 y el actual no puede seguir en 14.
    const r = camp(conHp(pj(), 14, 14), mundo(), AYER);
    expect(r.character.hp.current).toBeLessThanOrEqual(r.character.hp.max);
  });

  it('el actual no baja de 0', () => {
    const r = camp(conHp(pj(), 1, 20), mundo(), AYER);
    expect(r.character.hp.current).toBe(0);
    expect(r.character.hp.max).toBe(15);
    expect(r.died).toBe(false);
  });

  it('marca `last_damage_source` a fatigue aunque sobreviva', () => {
    expect(camp(conHp(pj(), 14, 14), mundo(), AYER).character.last_damage_source).toBe('fatigue');
  });

  it('el día avanza igual: pasar hambre no congela el calendario', () => {
    expect(camp(conHp(pj(), 14, 14), mundo({ day: 3 }), AYER).worldState.day).toBe(4);
  });
});

describe('la agonía es acumulación, no un contador aparte (#98 sobre Q31c)', () => {
  it('un PJ de CON 3 (14 HP máx) muere a la tercera noche sin comer', () => {
    let c = conHp(pj(), 14, 14);
    let w = mundo();
    const maximos: number[] = [];

    for (let noche = 1; noche <= 3; noche++) {
      const r = camp(c, w, AYER);
      c = r.character;
      w = r.worldState;
      maximos.push(c.hp.max);
      if (r.died) {
        expect(noche).toBe(3);
        break;
      }
    }
    expect(maximos).toEqual([9, 4, 0]);
    expect(c.alive).toBe(false);
  });

  it('un PJ de CON 4 (16 HP máx, el techo de creación) aguanta una noche más', () => {
    let c = conHp(pj(4), 16, 16);
    let w = mundo();
    let noches = 0;
    for (let i = 0; i < 10; i++) {
      const r = camp(c, w, AYER);
      c = r.character; w = r.worldState; noches++;
      if (r.died) break;
    }
    expect(noches).toBe(4);
  });

  it('`nightsUntilStarvation` es esa misma cuenta, para que la UI la enseñe', () => {
    // El rango real de un PJ recién creado: CON 1 → 10 HP, CON 4 → 16 HP.
    expect(nightsUntilStarvation(conHp(pj(), 10, 10))).toBe(2);
    expect(nightsUntilStarvation(conHp(pj(), 14, 14))).toBe(3);
    expect(nightsUntilStarvation(conHp(pj(), 16, 16))).toBe(4);
    expect(nightsUntilStarvation(conHp(pj(), 5, 5))).toBe(1);
  });

  it('comer una noche detiene la acumulación pero no la revierte', () => {
    // #98 y Q33: revertir la pérdida de máximo es balance postergado.
    const tras = camp(conHp(pj(), 14, 14), mundo(), AYER);
    const conComida = camp(conRaciones(tras.character, 1), tras.worldState, AYER);
    expect(conComida.character.hp.max).toBe(9);
    expect(conComida.hpMaxLost).toBe(0);
    // Y el actual sí vuelve a tope: comer cura, lo que no revierte es el techo.
    expect(conComida.character.hp.current).toBe(9);
  });
});

describe('muerte por fatiga (#98, #85)', () => {
  const moribundo = () => conHp(pj(), 4, 4);

  it('muere cuando el máximo llega a 0 al despertar', () => {
    const r = camp(moribundo(), mundo(), AYER);
    expect(r.died).toBe(true);
    expect(r.character.alive).toBe(false);
  });

  it('setea `last_damage_source` a fatigue', () => {
    expect(camp(moribundo(), mundo(), AYER).character.last_damage_source).toBe('fatigue');
  });

  it('rellena epitafio con la causa de inanición', () => {
    const r = camp(moribundo(), mundo(), AYER);
    expect(r.character.epitaph).not.toBeNull();
    expect(r.character.epitaph!.cause.kind).toBe('killed_by_fatigue');
    expect(r.character.epitaph!.ended_at).toBe(AYER);
  });

  it('deja el HP a 0/0, sin negativos que ensucien la barra', () => {
    const r = camp(moribundo(), mundo(), AYER);
    expect(r.character.hp).toEqual({ current: 0, max: 0 });
  });

  it('un máximo que caería por debajo de 0 también mata, sin pasar por negativo', () => {
    const r = camp(conHp(pj(), 2, 2), mundo(), AYER);
    expect(r.died).toBe(true);
    expect(r.character.hp.max).toBe(0);
  });

  it('la causa es reutilizable y no lleva agente: no hay a quién culpar', () => {
    const causa = deathByFatigue();
    expect(causa.kind).toBe('killed_by_fatigue');
    expect(causa.agent_id).toBeNull();
  });

  it('con ración a 4 HP máx NO muere: la ración es la que salva', () => {
    const r = camp(conRaciones(moribundo(), 1), mundo(), AYER);
    expect(r.died).toBe(false);
    expect(r.character.alive).toBe(true);
    expect(r.character.hp.max).toBe(4);
  });
});

describe('pureza', () => {
  it('camp no muta el personaje que recibe', () => {
    const c = conHp(conRaciones(pj(), 2), 14, 14);
    const antes = JSON.stringify(c);
    camp(c, mundo(), AYER);
    expect(JSON.stringify(c)).toBe(antes);
  });

  it('camp no muta el WorldState que recibe', () => {
    const w = mundo({ day: 2, actionsSpent: 5 });
    camp(conRaciones(pj(), 1), w, AYER);
    expect(w).toEqual({ ...createInitialWorldState(), day: 2, actionsSpent: 5 });
  });

  it('dos llamadas con la misma entrada dan el mismo resultado', () => {
    const c = conHp(pj(), 14, 14);
    const w = mundo();
    expect(camp(c, w, AYER).character.hp).toEqual(camp(c, w, AYER).character.hp);
  });
});
