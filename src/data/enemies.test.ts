import { describe, it, expect } from 'vitest';
import {
  ENEMIES,
  ENEMIES_BY_ID,
  LOOT_TABLES_BY_ENEMY_ID,
  getLootTableForEnemy,
  type LootDrop,
} from './enemies';
import { ITEMS_BY_ID } from './items';

describe('catálogo de enemigos', () => {
  it('no está vacío (al menos el Lobo del Bosque)', () => {
    expect(ENEMIES.length).toBeGreaterThanOrEqual(1);
  });

  it('no tiene IDs duplicados', () => {
    const ids = ENEMIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ENEMIES_BY_ID indexa cada entrada por id', () => {
    for (const enemy of ENEMIES) {
      expect(ENEMIES_BY_ID[enemy.id]).toBe(enemy);
    }
  });

  it('cada enemy tiene id no vacío y name no vacío', () => {
    for (const enemy of ENEMIES) {
      expect(typeof enemy.id).toBe('string');
      expect(enemy.id.trim()).not.toBe('');
      expect(enemy.name.trim()).not.toBe('');
    }
  });

  it('cada enemy tiene stats coherentes (hp_max > 0, attack_pool ≥ 0, weapon_damage ≥ 0, defense_threshold ≥ 1, initiative_base ≥ 0, level ≥ 1)', () => {
    for (const enemy of ENEMIES) {
      expect(enemy.hp_max).toBeGreaterThan(0);
      expect(Number.isInteger(enemy.hp_max)).toBe(true);
      expect(enemy.attack_pool).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(enemy.attack_pool)).toBe(true);
      expect(enemy.weapon_damage).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(enemy.weapon_damage)).toBe(true);
      // defense_threshold ≥ 1: el motor `computeHitThreshold` garantiza
      // mínimo 1 para PJ, los enemigos del catálogo deben respetar la
      // misma cota inferior (un threshold 0 sería "siempre impacta", regla
      // que no existe en el sistema cerrado).
      expect(enemy.defense_threshold).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(enemy.defense_threshold)).toBe(true);
      expect(enemy.initiative_base).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(enemy.initiative_base)).toBe(true);
      expect(enemy.level).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(enemy.level)).toBe(true);
    }
  });
});

describe('Lobo del Bosque (sub-paso H3.2d)', () => {
  it('existe en el catálogo bajo el id contractual', () => {
    expect(ENEMIES_BY_ID['lobo_del_bosque']).toBeDefined();
  });

  it('tiene la stat-line exacta cerrada en simulaciones/lobo-v0.1.md (iteración 3c)', () => {
    const lobo = ENEMIES_BY_ID['lobo_del_bosque']!;
    expect(lobo.id).toBe('lobo_del_bosque');
    expect(lobo.name).toBe('Lobo del Bosque');
    expect(lobo.level).toBe(1);
    expect(lobo.attack_pool).toBe(3);
    expect(lobo.defense_threshold).toBe(3);
    expect(lobo.weapon_damage).toBe(2);
    expect(lobo.initiative_base).toBe(4);
    expect(lobo.hp_max).toBe(16);
  });
});

describe('tablas de loot', () => {
  function eachDrop(): { enemyId: string; drop: LootDrop }[] {
    const out: { enemyId: string; drop: LootDrop }[] = [];
    for (const [enemyId, table] of Object.entries(LOOT_TABLES_BY_ENEMY_ID)) {
      for (const drop of table.drops) {
        out.push({ enemyId, drop });
      }
    }
    return out;
  }

  it('cada tabla referencia un enemy del catálogo', () => {
    for (const enemyId of Object.keys(LOOT_TABLES_BY_ENEMY_ID)) {
      expect(ENEMIES_BY_ID[enemyId]).toBeDefined();
    }
  });

  it('cada drop kind="item" referencia un item_id que existe en ITEMS_BY_ID', () => {
    for (const { enemyId, drop } of eachDrop()) {
      if (drop.kind === 'item') {
        expect(drop.item_id).toBeDefined();
        expect(ITEMS_BY_ID[drop.item_id!]).toBeDefined();
        // Mensaje útil si falla: deja claro qué tabla está rota.
        if (ITEMS_BY_ID[drop.item_id!] === undefined) {
          throw new Error(`enemy "${enemyId}" referencia item huérfano "${drop.item_id}".`);
        }
      }
    }
  });

  it('cada drop kind="gold" no declara item_id', () => {
    for (const { drop } of eachDrop()) {
      if (drop.kind === 'gold') {
        expect(drop.item_id).toBeUndefined();
      }
    }
  });

  it('cada drop tiene quantity_min ≤ quantity_max y ambos enteros ≥ 1', () => {
    for (const { drop } of eachDrop()) {
      expect(Number.isInteger(drop.quantity_min)).toBe(true);
      expect(Number.isInteger(drop.quantity_max)).toBe(true);
      expect(drop.quantity_min).toBeGreaterThanOrEqual(1);
      expect(drop.quantity_max).toBeGreaterThanOrEqual(drop.quantity_min);
    }
  });

  it('cada drop tiene probability ∈ (0, 1] (drop con prob 0 sería ruido y no debe declararse)', () => {
    for (const { drop } of eachDrop()) {
      expect(drop.probability).toBeGreaterThan(0);
      expect(drop.probability).toBeLessThanOrEqual(1);
    }
  });

  it('getLootTableForEnemy devuelve la tabla cuando existe y null cuando no', () => {
    expect(getLootTableForEnemy('lobo_del_bosque')).not.toBeNull();
    expect(getLootTableForEnemy('inexistente_id')).toBeNull();
  });
});

describe('loot del Lobo del Bosque (D4 cerrada)', () => {
  it('tiene tabla declarada', () => {
    expect(LOOT_TABLES_BY_ENEMY_ID['lobo_del_bosque']).toBeDefined();
  });

  it('Diente de Lobo: 1 unidad, probabilidad 1.0', () => {
    const table = LOOT_TABLES_BY_ENEMY_ID['lobo_del_bosque']!;
    const diente = table.drops.find(
      (d) => d.kind === 'item' && d.item_id === 'diente_de_lobo',
    );
    expect(diente).toBeDefined();
    expect(diente!.quantity_min).toBe(1);
    expect(diente!.quantity_max).toBe(1);
    expect(diente!.probability).toBe(1.0);
  });

  it('Oro: rango 5-15 uniforme, probabilidad 1.0', () => {
    const table = LOOT_TABLES_BY_ENEMY_ID['lobo_del_bosque']!;
    const oro = table.drops.find((d) => d.kind === 'gold');
    expect(oro).toBeDefined();
    expect(oro!.quantity_min).toBe(5);
    expect(oro!.quantity_max).toBe(15);
    expect(oro!.probability).toBe(1.0);
  });

  it('Poción de curación menor: 1 unidad, probabilidad ≈ 0.5', () => {
    const table = LOOT_TABLES_BY_ENEMY_ID['lobo_del_bosque']!;
    const pocion = table.drops.find(
      (d) => d.kind === 'item' && d.item_id === 'pocion_curacion_menor',
    );
    expect(pocion).toBeDefined();
    expect(pocion!.quantity_min).toBe(1);
    expect(pocion!.quantity_max).toBe(1);
    expect(pocion!.probability).toBeCloseTo(0.5, 5);
  });
});
