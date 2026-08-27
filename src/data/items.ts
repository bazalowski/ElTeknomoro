// PROVISIONAL FASE 1 (esqueleto jugable end-to-end > contenido > pulido):
// catálogo con tres items mínimos viables. El catálogo completo (~50 items)
// se cierra en H5 cuando entren mercaderes, loot y crafteo de fin a fin.
//
//   1. Daga (sub-paso H3.2c): arma inicial equipada por defecto (D-equip-2c).
//   2. Diente de Lobo (sub-paso H3.2d): material de loot del lobo.
//   3. Poción de curación menor (sub-paso H3.2d): consumible de loot del lobo.
//
// Razón de existir hoy: el motor de combate (rules/combat.ts) consume
// `equippedWeapon(inventory, catalog)` y necesita un catálogo real al que
// apuntar; la pantalla H2.5a sigue mostrando placeholder narrativo, pero el
// Character persistido debe ser jugable de verdad desde el primer ladrillo.
// Las tablas de loot del primer enemigo (data/enemies.ts) referencian items
// reales (sin huérfanos) — los dos consumibles/materiales están aquí.
//
// Stat-line de la Daga validada en simulaciones/lobo-v0.1.md (build A):
// pool 6 (FUE 3 + armas_cuerpo 3) contra lobo, 33.4% victoria con weapon_damage 2.
// Ese era el "arma media" calibrada de la simulación; lo trasladamos tal cual.
//
// Reglas validadas por test (ver items.test.ts):
//   - Items con max_durability !== null tienen stack_size === 1 (regla del
//     módulo sagrado rules/inventory.ts: items únicos no apilables).
//   - Items con slot !== null tienen un EquipmentSlot válido del set fijo.
//   - STARTING_WEAPON_ID resuelve a un Item del catálogo.

import type {
  EquipmentSlot,
  Inventory,
  Item,
  ItemId,
  ItemStack,
  SlotArray,
} from '../rules/inventory';
import { INVENTORY_RULES } from '../rules/inventory';

// Slots de equipo válidos. Se replican aquí como const para que los tests
// puedan iterar sobre el set sin importar tipos. Mantener sincronizado con
// EquipmentSlot en rules/inventory.ts.
export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  'head',
  'torso',
  'hands',
  'main_hand',
  'off_hand',
  'accessory',
] as const;

// Id contractual del arma inicial. NO uses string literal "daga" en código que
// dependa de este item: importa STARTING_WEAPON_ID. Si en H5 se renombra o se
// sustituye por otra pieza inicial por arquetipo, sólo cambia este símbolo.
export const STARTING_WEAPON_ID: ItemId = 'daga';

// Ración inicial del PJ (#98, sub-paso 4d). Q8b respondió "3-5" y se toma el
// centro. Como `startingGold`, se declara aquí y no dentro de la función para
// que H6 pueda recalibrarlo sin leer el cuerpo.
export const STARTING_RATION_ID: ItemId = 'racion';
export const STARTING_RATIONS = 4;

// Anclas iniciales del PJ (#103, sub-paso 4e). Q13 manda las anclas a
// contenido y Q6 da el Hogar gratis sin consumir item, así que sin este stock
// el PJ nace con cero anclas y NUNCA llega a plantar la segunda: el cap por
// nivel, el bloqueo al alcanzarlo, el recoger-y-replantar y una lista de
// destinos con más de una entrada quedarían construidos y sin poder verse.
//
// PROVISIONAL FASE 1, misma deuda declarada que las raciones en #98: no hay
// forma de conseguir más (crafteo es H7, tiendas son H8, el loot no tiene
// tabla escrita). Destino: 4f, banda de recurso de §9.5. Calibración a H6.
//
// Dos y no más: con el ancla automática del Hogar dan tres puntos de viaje,
// que es lo justo para ejercitar el sistema sin regalarlo.
export const STARTING_ANCHOR_ID: ItemId = 'ancla';
export const STARTING_ANCHORS = 2;

export const ITEMS: readonly Item[] = [
  {
    id: 'daga',
    name: 'Daga',
    category: 'weapon',
    rarity: 'common',
    slot: 'main_hand',
    // Items con durabilidad son únicos (regla rules/inventory.ts línea 175-181):
    // cada instancia debe llegar al inventario en pilas de quantity 1.
    stack_size: 1,
    // Durabilidad inicial 30. Justificación: un combate tutorial dura 5-7
    // turnos, y death.ts no aplica desgaste por turno todavía (lo hará H5
    // cuando se cierre la curva de durabilidad). Con 30 puntos hay margen
    // sobrado para sobrevivir varias partidas iniciales sin que el arma
    // entre en estado inservible (durability === 0). Provisional H5.
    max_durability: 30,
    // Peso 1. PROVISIONAL H5: el sistema de carga aún no está cerrado.
    weight: 1,
    stats: {
      weapon_damage: 2,
      weapon_attribute: 'fue',
      // Habilidad que el arma pide para sumarse al pool de combate.
      // 'armas_cuerpo' está definida en data/skills.ts (atributo FUE).
      weapon_skill: 'armas_cuerpo',
    },
  },
  // PROVISIONAL FASE 1: futuro material de craft H6. En fase actual sólo
  // existe como trofeo de loot del Lobo del Bosque (data/enemies.ts). No
  // aporta stats, no se equipa, no se consume. Apilable hasta 10 por slot
  // para que tras varios combates no sature el inventario.
  {
    id: 'diente_de_lobo',
    name: 'Diente de Lobo',
    category: 'material',
    rarity: 'common',
    slot: null,
    stack_size: 10,
    max_durability: null,
    weight: 0.1,
    stats: {},
  },
  // PROVISIONAL FASE 1. Efecto al consumir (heal +N HP) se cabla cuando el
  // orquestador de combate H3 implemente use_item: la lógica vivirá en
  // state/ con un map hardcoded `{ pocion_curacion_menor: { kind: 'heal',
  // amount: N } }` hasta que H5 cierre el sistema de consumibles formal.
  // No extendemos `ItemStats` con `consumable_effect` aún (D-2d-4): la
  // declaración del item es suficiente; el efecto es responsabilidad del
  // orquestador. Apilable hasta 5 (curaciones son recurso escaso).
  {
    id: 'pocion_curacion_menor',
    name: 'Poción de curación menor',
    category: 'consumable',
    rarity: 'common',
    slot: null,
    stack_size: 5,
    max_durability: null,
    weight: 0.2,
    stats: {},
  },
  // Ración (#98, sub-paso 4d). Es moneda de jornada, no comida curativa: se
  // gasta al acampar para resetear las 8 acciones y NO repone HP. La analogía
  // del autor es la cinta de escribir de Resident Evil — no te cura, te deja
  // seguir. La comida que sí cura y buffea es catálogo de H6 y es otro item.
  //
  // `stack_size: 99` cumple el "un solo slot stackable" de Q13: las raciones no
  // deben competir por espacio de mochila con el loot, porque entonces la
  // decisión de acampar se convertiría en gestión de inventario y no en gestión
  // de jornada. Calibración a H6 como el resto de números de fase 1.
  {
    id: 'racion',
    name: 'Ración',
    category: 'consumable',
    rarity: 'common',
    slot: null,
    stack_size: 99,
    max_durability: null,
    weight: 0.3,
    stats: {},
  },
  // Ancla de viaje (#103, sub-paso 4e). Es `misc` y no `consumable` porque no
  // se consume al usarse: se planta en un grid Controlado y se puede recoger
  // para replantarla en otro (Q15a). Sale del inventario mientras está
  // plantada y vuelve al recogerla.
  //
  // `stack_size: 6` coincide con el tope del cap por nivel de #103: más de
  // seis anclas en la mochila no puede tenerlas nadie, y un stack mayor
  // mentiría sobre el techo del sistema. Pesa: plantarlas lejos de casa es
  // una decisión, no un trámite.
  {
    id: 'ancla',
    name: 'Ancla de viaje',
    category: 'misc',
    rarity: 'uncommon',
    slot: null,
    stack_size: 6,
    max_durability: null,
    weight: 1.5,
    stats: {},
  },
] as const;

export const ITEMS_BY_ID: Readonly<Record<ItemId, Item>> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
);

// Construye el Inventory con el que arranca todo Character recién creado.
// Vive aquí (data/) y no en rules/character.ts para no acoplar el módulo
// sagrado de reglas al detalle del catálogo: si en H5 cambian las piezas
// iniciales, sólo se toca este archivo.
//
// Decisión D-equip-2c: la Daga va directa a equipped.main_hand, NO a la
// mochila. La pantalla H2.5a sigue mostrando placeholder narrativo; el draft
// persistido es funcional aunque la UI no lo refleje aún.
export function buildStartingInventory(): Inventory {
  const startingItem = ITEMS_BY_ID[STARTING_WEAPON_ID];
  if (startingItem === undefined) {
    throw new Error(
      `data/items: STARTING_WEAPON_ID "${STARTING_WEAPON_ID}" no resuelve a ningún Item del catálogo.`,
    );
  }
  if (startingItem.slot !== 'main_hand') {
    throw new Error(
      `data/items: el arma inicial "${startingItem.id}" debería ir en main_hand, no en "${startingItem.slot}".`,
    );
  }

  const startingStack: ItemStack = {
    item_id: startingItem.id,
    quantity: 1,
    durability: startingItem.max_durability,
  };

  // Raciones iniciales (#98, Q8b: "3-5"; se toma el centro de la banda). Van a
  // la mochila, no equipadas: la ración no es equipo, es moneda de jornada que
  // `rules/fatigue.ts` gasta al acampar. En un solo stack porque #98 cierra
  // "un solo slot stackable" — si compitieran por mochila con el loot, acampar
  // se convertiría en gestión de inventario en vez de gestión de jornada.
  //
  // PROVISIONAL FASE 1. En 4d no existe forma de conseguir más (crafteo es H7,
  // tiendas son H8, el loot no tiene tabla escrita), así que este stock es todo
  // lo que hay: un run de 4d muere de hambre en unos pocos días. Es esperado y
  // está declarado como deuda con destino 4f, banda 16-17 de §9.5.
  const rationItem = ITEMS_BY_ID[STARTING_RATION_ID];
  if (rationItem === undefined) {
    throw new Error(
      `data/items: STARTING_RATION_ID "${STARTING_RATION_ID}" no resuelve a ningún Item del catálogo.`,
    );
  }
  if (STARTING_RATIONS > rationItem.stack_size) {
    throw new Error(
      `data/items: ${STARTING_RATIONS} raciones iniciales no caben en un stack de ${rationItem.stack_size}.`,
    );
  }

  // Anclas iniciales (#103, Q13). Mismo patrón que las raciones: un stack en
  // la mochila, declarado arriba para que H6 recalibre sin leer el cuerpo.
  const anchorItem = ITEMS_BY_ID[STARTING_ANCHOR_ID];
  if (anchorItem === undefined) {
    throw new Error(
      `data/items: STARTING_ANCHOR_ID "${STARTING_ANCHOR_ID}" no resuelve a ningún Item del catálogo.`,
    );
  }
  if (STARTING_ANCHORS > anchorItem.stack_size) {
    throw new Error(
      `data/items: ${STARTING_ANCHORS} anclas iniciales no caben en un stack de ${anchorItem.stack_size}.`,
    );
  }

  const slots: (ItemStack | null)[] = new Array(INVENTORY_RULES.totalSlots).fill(null);
  slots[0] = { item_id: rationItem.id, quantity: STARTING_RATIONS, durability: null };
  slots[1] = { item_id: anchorItem.id, quantity: STARTING_ANCHORS, durability: null };

  return {
    slots: slots as SlotArray,
    equipped: { main_hand: startingStack },
  };
}
