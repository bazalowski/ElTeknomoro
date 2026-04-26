// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.12 (inventario y equipo). H5.
//
// API mínima viable: tipos de Item, Inventory, equipar/desequipar, durabilidad.
// El catálogo concreto de 50 ítems es contenido (data/items.json), no vive aquí.
//
// PROVISIONAL: muchos números base (peso, daño de armas) son placeholder hasta
// el cierre de H5. Etiquetados con "PROVISIONAL H5".

import type { AttributeId } from './character';

// -----------------------------------------------------------------------------
// Tipos de Item (biblia §4.12)
// -----------------------------------------------------------------------------

export type ItemId = string;

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Categorías que cubre el MVP. Más se añadirán con el catálogo de H5.
export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'consumable'
  | 'material'
  | 'recipe_book'
  | 'misc';

// Slots de equipo (biblia §4.12).
export type EquipmentSlot =
  | 'head'
  | 'torso'
  | 'hands'
  | 'main_hand'
  | 'off_hand'
  | 'accessory';

// Stats que un ítem puede aportar al equiparse. Se suman a los del personaje.
// PROVISIONAL H5: el set concreto se cerrará con el catálogo. Aquí lo dejamos
// abierto a atributo + DEF + daño de arma, que es lo que H3/H5 necesitan.
export interface ItemStats {
  // Bonificadores a atributos. Suben sobre el cap absoluto sólo si el ítem así
  // lo declara (regla por revisar en H5; ahora se respeta el cap).
  attribute_bonus?: Partial<Record<AttributeId, number>>;
  // DEF aditiva al equipar pieza de armadura.
  defense_bonus?: number;
  // Daño base del arma. Sólo armas (category === 'weapon').
  weapon_damage?: number;
  // Habilidad que el arma pide para sumarse al pool de combate (FUE+HAB para
  // cuerpo a cuerpo, DES+HAB para distancia, etc.). PROVISIONAL H3.
  weapon_skill?: string;
  // Atributo que el arma pide para el pool. Idem.
  weapon_attribute?: AttributeId;
}

export interface Item {
  id: ItemId;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  // Slot al que va; null si no es equipable.
  slot: EquipmentSlot | null;
  // Cuántas unidades caben en una pila. 1 = no apilable.
  stack_size: number;
  // Durabilidad máxima. null = no se desgasta (consumibles, materiales).
  max_durability: number | null;
  // Peso por unidad. PROVISIONAL H5: el sistema de carga aún no está cerrado.
  weight: number;
  stats: ItemStats;
}

// Una pila concreta dentro del inventario. quantity ≤ item.stack_size.
// durability sólo aplica si item.max_durability !== null. Una pila de un ítem
// con durabilidad tiene quantity = 1 obligatoriamente (el ítem es único).
export interface ItemStack {
  item_id: ItemId;
  quantity: number;
  durability: number | null;
}

// -----------------------------------------------------------------------------
// Inventario (biblia §4.12)
// -----------------------------------------------------------------------------

export const INVENTORY_RULES = {
  // 5×4 = 20 slots fijos en MVP (biblia §4.12).
  totalSlots: 20,
} as const;

// Slots ordenados por índice 0..19. null = slot vacío.
// Mantenemos array de longitud fija para que la UI mapee 1:1 a la cuadrícula.
export type SlotArray = readonly (ItemStack | null)[];

export type EquipmentMap = Readonly<Partial<Record<EquipmentSlot, ItemStack>>>;

export interface Inventory {
  slots: SlotArray;
  equipped: EquipmentMap;
}

export type InventoryErrorCode =
  | 'NO_FREE_SLOT'
  | 'STACK_OVERFLOW'
  | 'ITEM_NOT_FOUND'
  | 'SLOT_OUT_OF_RANGE'
  | 'NOT_EQUIPPABLE'
  | 'WRONG_SLOT'
  | 'SLOT_OCCUPIED'
  | 'NOT_EQUIPPED'
  | 'DURABILITY_NOT_APPLICABLE';

export interface InventoryError {
  code: InventoryErrorCode;
  message: string;
}

export class InventoryOpError extends Error {
  readonly code: InventoryErrorCode;
  constructor(code: InventoryErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.code = code;
  }
}

// -----------------------------------------------------------------------------
// Constructores
// -----------------------------------------------------------------------------

export function createEmptyInventory(): Inventory {
  return {
    slots: new Array(INVENTORY_RULES.totalSlots).fill(null),
    equipped: {},
  };
}

// -----------------------------------------------------------------------------
// Operaciones (todas devuelven nuevo Inventory; nunca mutan)
// -----------------------------------------------------------------------------

function lookupItem(
  catalog: Readonly<Record<ItemId, Item>>,
  itemId: ItemId,
): Item {
  const item = catalog[itemId];
  if (item === undefined) {
    throw new InventoryOpError('ITEM_NOT_FOUND', `Item "${itemId}" no está en el catálogo.`);
  }
  return item;
}

function withSlots(inventory: Inventory, slots: SlotArray): Inventory {
  return { ...inventory, slots };
}

function withEquipped(inventory: Inventory, equipped: EquipmentMap): Inventory {
  return { ...inventory, equipped };
}

// Añade una pila al inventario. Si el ítem es apilable y existe ya una pila
// con hueco, rellena ésa primero; si no, busca slot vacío. Si no cabe, lanza.
//
// `catalog` es el lookup de Item por id; lo provee la capa de datos (H5).
// La cantidad se reparte en varias pilas si supera stack_size de una sola.
export function addItem(
  inventory: Inventory,
  stack: ItemStack,
  catalog: Readonly<Record<ItemId, Item>>,
): Inventory {
  const item = lookupItem(catalog, stack.item_id);
  let remaining = stack.quantity;
  const slots = inventory.slots.slice();

  // Items con durabilidad: no apilables (cada instancia es única).
  // El llamador debe traer pilas de quantity 1 para estos.
  const isUnique = item.max_durability !== null;
  if (isUnique && stack.quantity !== 1) {
    throw new InventoryOpError(
      'STACK_OVERFLOW',
      `Item "${item.id}" con durabilidad debe llegar en pilas de 1 (recibido ${stack.quantity}).`,
    );
  }

  // Fase 1: rellenar pilas existentes del mismo item si es apilable.
  if (!isUnique && item.stack_size > 1) {
    for (let i = 0; i < slots.length && remaining > 0; i++) {
      const existing = slots[i];
      if (existing === null || existing === undefined) continue;
      if (existing.item_id !== item.id) continue;
      const free = item.stack_size - existing.quantity;
      if (free <= 0) continue;
      const moved = Math.min(free, remaining);
      slots[i] = { ...existing, quantity: existing.quantity + moved };
      remaining -= moved;
    }
  }

  // Fase 2: nuevos slots vacíos para el resto.
  while (remaining > 0) {
    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) {
      throw new InventoryOpError(
        'NO_FREE_SLOT',
        `No queda slot libre para "${item.id}" (${remaining} unidades sin colocar).`,
      );
    }
    const moved = Math.min(item.stack_size, remaining);
    // Respeta la durabilidad declarada por el llamador si la pasó; si no,
    // arranca en max_durability (item nuevo de fábrica).
    const dur = isUnique
      ? (stack.durability ?? item.max_durability)
      : null;
    slots[emptyIdx] = {
      item_id: item.id,
      quantity: moved,
      durability: dur,
    };
    remaining -= moved;
  }

  return withSlots(inventory, slots);
}

// Quita `quantity` unidades del slot indicado. Si la pila queda en 0, el slot
// pasa a null. Si quantity > pila, lanza.
export function removeFromSlot(
  inventory: Inventory,
  slotIndex: number,
  quantity: number,
): Inventory {
  if (slotIndex < 0 || slotIndex >= inventory.slots.length) {
    throw new InventoryOpError(
      'SLOT_OUT_OF_RANGE',
      `Slot ${slotIndex} fuera de rango [0, ${inventory.slots.length - 1}].`,
    );
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError(`removeFromSlot: quantity debe ser entero ≥ 1, recibido ${quantity}`);
  }
  const stack = inventory.slots[slotIndex];
  if (stack === null || stack === undefined) {
    throw new InventoryOpError('ITEM_NOT_FOUND', `Slot ${slotIndex} está vacío.`);
  }
  if (quantity > stack.quantity) {
    throw new InventoryOpError(
      'STACK_OVERFLOW',
      `Slot ${slotIndex} tiene ${stack.quantity}, se piden ${quantity}.`,
    );
  }
  const slots = inventory.slots.slice();
  const newQty = stack.quantity - quantity;
  slots[slotIndex] = newQty === 0 ? null : { ...stack, quantity: newQty };
  return withSlots(inventory, slots);
}

// Equipa el ítem del slot indicado. Si el slot de equipo ya tenía algo, lo
// devuelve al inventario (swap). Lanza si el ítem no es equipable o no encaja
// en el slot solicitado.
export function equipFromSlot(
  inventory: Inventory,
  slotIndex: number,
  targetSlot: EquipmentSlot,
  catalog: Readonly<Record<ItemId, Item>>,
): Inventory {
  if (slotIndex < 0 || slotIndex >= inventory.slots.length) {
    throw new InventoryOpError(
      'SLOT_OUT_OF_RANGE',
      `Slot ${slotIndex} fuera de rango.`,
    );
  }
  const stack = inventory.slots[slotIndex];
  if (stack === null || stack === undefined) {
    throw new InventoryOpError('ITEM_NOT_FOUND', `Slot ${slotIndex} está vacío.`);
  }
  const item = lookupItem(catalog, stack.item_id);
  if (item.slot === null) {
    throw new InventoryOpError(
      'NOT_EQUIPPABLE',
      `Item "${item.id}" no es equipable.`,
    );
  }
  if (item.slot !== targetSlot) {
    throw new InventoryOpError(
      'WRONG_SLOT',
      `Item "${item.id}" va en slot "${item.slot}", no "${targetSlot}".`,
    );
  }

  // Equipar: tomamos UNA unidad de la pila (los equipables van de 1 en 1).
  // Si la pila tiene más, queda el resto en el inventario.
  const slots = inventory.slots.slice();
  const equippedStack: ItemStack = {
    item_id: stack.item_id,
    quantity: 1,
    durability: stack.durability,
  };
  const remainingQty = stack.quantity - 1;
  slots[slotIndex] = remainingQty === 0 ? null : { ...stack, quantity: remainingQty };

  // Swap: si había algo equipado, vuelve al slot recién liberado.
  const previouslyEquipped = inventory.equipped[targetSlot];
  let invAfter = withSlots(inventory, slots);
  if (previouslyEquipped !== undefined) {
    if (slots[slotIndex] === null) {
      const slotsWithSwap = slots.slice();
      slotsWithSwap[slotIndex] = previouslyEquipped;
      invAfter = withSlots(invAfter, slotsWithSwap);
    } else {
      // Hueco original ocupado por el resto de la pila. Buscamos otro hueco.
      invAfter = addItem(invAfter, previouslyEquipped, catalog);
    }
  }

  const equipped: EquipmentMap = { ...invAfter.equipped, [targetSlot]: equippedStack };
  return withEquipped(invAfter, equipped);
}

// Desequipa la pieza del slot de equipo y la devuelve al inventario.
// Lanza NO_FREE_SLOT si no cabe.
export function unequip(
  inventory: Inventory,
  equipmentSlot: EquipmentSlot,
): Inventory {
  const equippedStack = inventory.equipped[equipmentSlot];
  if (equippedStack === undefined) {
    throw new InventoryOpError(
      'NOT_EQUIPPED',
      `No hay nada equipado en "${equipmentSlot}".`,
    );
  }
  const slots = inventory.slots.slice();
  const emptyIdx = slots.findIndex((s) => s === null);
  if (emptyIdx === -1) {
    throw new InventoryOpError(
      'NO_FREE_SLOT',
      `No hay slot libre para devolver el equipo de "${equipmentSlot}".`,
    );
  }
  slots[emptyIdx] = equippedStack;
  const equipped: EquipmentMap = { ...inventory.equipped };
  delete (equipped as Record<string, ItemStack>)[equipmentSlot];
  return { slots, equipped };
}

// Reduce la durabilidad de una pieza equipada en `delta`. Si llega a 0 queda
// inservible (durability === 0; biblia §4.12: el ítem no se destruye).
// Si el ítem no tiene durabilidad, lanza DURABILITY_NOT_APPLICABLE.
export function decreaseEquipmentDurability(
  inventory: Inventory,
  equipmentSlot: EquipmentSlot,
  delta: number,
): Inventory {
  if (!Number.isInteger(delta) || delta < 1) {
    throw new RangeError(`decreaseEquipmentDurability: delta debe ser entero ≥ 1, recibido ${delta}`);
  }
  const stack = inventory.equipped[equipmentSlot];
  if (stack === undefined) {
    throw new InventoryOpError(
      'NOT_EQUIPPED',
      `No hay nada equipado en "${equipmentSlot}".`,
    );
  }
  if (stack.durability === null) {
    throw new InventoryOpError(
      'DURABILITY_NOT_APPLICABLE',
      `El item de "${equipmentSlot}" no tiene durabilidad.`,
    );
  }
  const newDur = Math.max(0, stack.durability - delta);
  const equipped: EquipmentMap = {
    ...inventory.equipped,
    [equipmentSlot]: { ...stack, durability: newDur },
  };
  return withEquipped(inventory, equipped);
}

// Suma la DEF total que aporta el equipo equipado. Lo consume
// character.computeDefense en H5 cuando el cálculo deje de pasar `armor` por
// argumento y empiece a leerlo del Inventory real.
//
// Items con durabilidad 0 no aportan stats: están "inservibles" (biblia §4.12).
export function totalDefenseBonus(
  inventory: Inventory,
  catalog: Readonly<Record<ItemId, Item>>,
): number {
  let total = 0;
  for (const stack of Object.values(inventory.equipped)) {
    if (stack === undefined) continue;
    if (stack.durability === 0) continue;
    const item = lookupItem(catalog, stack.item_id);
    total += item.stats.defense_bonus ?? 0;
  }
  return total;
}

// Devuelve el arma equipada en main_hand (o null si no hay o si está inservible).
// combat.ts la usa para construir el pool del ataque.
export function equippedWeapon(
  inventory: Inventory,
  catalog: Readonly<Record<ItemId, Item>>,
): Item | null {
  const stack = inventory.equipped.main_hand;
  if (stack === undefined) return null;
  if (stack.durability === 0) return null;
  return lookupItem(catalog, stack.item_id);
}
