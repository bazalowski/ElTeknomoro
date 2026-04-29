// Catálogo de items. PROVISIONAL H3: contiene UN único item, la Daga inicial,
// que el flujo H2.5a entrega como arma equipada por defecto a todo personaje
// recién creado (decisión D-2b-1 / D-equip-2c). El catálogo completo (~50
// items) se cierra en H5 cuando entren mercaderes, loot y crafteo de fin a fin.
//
// Razón de existir hoy: el motor de combate (rules/combat.ts) consume
// `equippedWeapon(inventory, catalog)` y necesita un catálogo real al que
// apuntar; la pantalla H2.5a sigue mostrando placeholder narrativo, pero el
// Character persistido debe ser jugable de verdad desde el primer ladrillo.
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

  const slots: SlotArray = new Array(INVENTORY_RULES.totalSlots).fill(null);

  return {
    slots,
    equipped: { main_hand: startingStack },
  };
}
