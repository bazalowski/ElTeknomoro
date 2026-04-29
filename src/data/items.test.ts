import { describe, it, expect } from 'vitest';
import {
  EQUIPMENT_SLOTS,
  ITEMS,
  ITEMS_BY_ID,
  STARTING_WEAPON_ID,
  buildStartingInventory,
} from './items';
import { SKILLS_BY_ID } from './skills';
import { INVENTORY_RULES } from '../rules/inventory';

describe('catálogo de items', () => {
  it('no está vacío (al menos la Daga inicial)', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(1);
  });

  it('tiene exactamente 3 items en fase 1 (Daga + Diente de Lobo + Poción)', () => {
    // PROVISIONAL FASE 1. Cuando se añadan más items en H5 este número crece;
    // mientras tanto, blindamos contra adiciones accidentales no documentadas.
    expect(ITEMS.length).toBe(3);
  });

  it('cada item tiene id no vacío', () => {
    for (const item of ITEMS) {
      expect(typeof item.id).toBe('string');
      expect(item.id.trim()).not.toBe('');
    }
  });

  it('no tiene IDs duplicados', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ITEMS_BY_ID indexa cada entrada por id', () => {
    for (const item of ITEMS) {
      expect(ITEMS_BY_ID[item.id]).toBe(item);
    }
  });

  it('cada item tiene stack_size entero ≥ 1', () => {
    for (const item of ITEMS) {
      expect(Number.isInteger(item.stack_size)).toBe(true);
      expect(item.stack_size).toBeGreaterThanOrEqual(1);
    }
  });

  it('items con max_durability !== null tienen stack_size === 1 (regla rules/inventory.ts)', () => {
    for (const item of ITEMS) {
      if (item.max_durability !== null) {
        expect(item.stack_size).toBe(1);
      }
    }
  });

  it('items con slot !== null tienen un EquipmentSlot válido', () => {
    for (const item of ITEMS) {
      if (item.slot !== null) {
        expect(EQUIPMENT_SLOTS).toContain(item.slot);
      }
    }
  });

  it('cada arma (category === "weapon") declara weapon_attribute y weapon_skill resolvibles', () => {
    for (const item of ITEMS) {
      if (item.category !== 'weapon') continue;
      expect(item.stats.weapon_damage).toBeGreaterThan(0);
      expect(item.stats.weapon_attribute).toBeDefined();
      const skillId = item.stats.weapon_skill;
      expect(skillId).toBeDefined();
      expect(SKILLS_BY_ID[skillId!]).toBeDefined();
    }
  });
});

describe('Daga inicial (sub-paso H3.2c)', () => {
  it('existe en el catálogo bajo el id contractual', () => {
    const daga = ITEMS_BY_ID[STARTING_WEAPON_ID];
    expect(daga).toBeDefined();
  });

  it('tiene la stat-line validada en simulaciones/lobo-v0.1.md (build A)', () => {
    const daga = ITEMS_BY_ID[STARTING_WEAPON_ID]!;
    expect(daga.category).toBe('weapon');
    expect(daga.rarity).toBe('common');
    expect(daga.slot).toBe('main_hand');
    expect(daga.stack_size).toBe(1);
    expect(daga.max_durability).toBe(30);
    expect(daga.stats.weapon_damage).toBe(2);
    expect(daga.stats.weapon_attribute).toBe('fue');
    expect(daga.stats.weapon_skill).toBe('armas_cuerpo');
  });

  it('STARTING_WEAPON_ID resuelve a un Item del catálogo', () => {
    expect(ITEMS_BY_ID[STARTING_WEAPON_ID]).toBeDefined();
  });
});

describe('Diente de Lobo (sub-paso H3.2d)', () => {
  it('existe en el catálogo', () => {
    expect(ITEMS_BY_ID['diente_de_lobo']).toBeDefined();
  });

  it('tiene las specs declaradas (material, no equipable, apilable, sin durabilidad)', () => {
    const diente = ITEMS_BY_ID['diente_de_lobo']!;
    expect(diente.category).toBe('material');
    expect(diente.rarity).toBe('common');
    expect(diente.slot).toBeNull();
    expect(diente.stack_size).toBe(10);
    expect(diente.max_durability).toBeNull();
    expect(diente.stats).toEqual({});
  });
});

describe('Poción de curación menor (sub-paso H3.2d)', () => {
  it('existe en el catálogo', () => {
    expect(ITEMS_BY_ID['pocion_curacion_menor']).toBeDefined();
  });

  it('tiene las specs declaradas (consumible, no equipable, apilable hasta 5, sin durabilidad)', () => {
    const pocion = ITEMS_BY_ID['pocion_curacion_menor']!;
    expect(pocion.category).toBe('consumable');
    expect(pocion.rarity).toBe('common');
    expect(pocion.slot).toBeNull();
    expect(pocion.stack_size).toBe(5);
    expect(pocion.max_durability).toBeNull();
    // El efecto de curación NO vive en stats (D-2d-4): se cablará en el
    // orquestador de combate. Aquí sólo verificamos que stats está vacío.
    expect(pocion.stats).toEqual({});
  });
});

describe('buildStartingInventory', () => {
  it('devuelve un Inventory con la Daga equipada en main_hand', () => {
    const inv = buildStartingInventory();
    const equipped = inv.equipped.main_hand;
    expect(equipped).toBeDefined();
    expect(equipped!.item_id).toBe(STARTING_WEAPON_ID);
    expect(equipped!.quantity).toBe(1);
    expect(equipped!.durability).toBe(ITEMS_BY_ID[STARTING_WEAPON_ID]!.max_durability);
  });

  it('devuelve slots de la longitud declarada en INVENTORY_RULES, todos vacíos', () => {
    const inv = buildStartingInventory();
    expect(inv.slots).toHaveLength(INVENTORY_RULES.totalSlots);
    expect(inv.slots.every((s) => s === null)).toBe(true);
  });

  it('no equipa nada en otros slots distintos de main_hand', () => {
    const inv = buildStartingInventory();
    const equippedKeys = Object.keys(inv.equipped);
    expect(equippedKeys).toEqual(['main_hand']);
  });

  it('cada llamada devuelve un Inventory independiente (no comparte referencias mutables)', () => {
    const a = buildStartingInventory();
    const b = buildStartingInventory();
    expect(a).not.toBe(b);
    expect(a.slots).not.toBe(b.slots);
    expect(a.equipped).not.toBe(b.equipped);
  });
});
