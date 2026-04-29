// PROVISIONAL FASE 1 (esqueleto jugable end-to-end > contenido > pulido):
// catálogo con UN único enemigo, el Lobo del Bosque, validado en
// simulaciones/lobo-v0.1.md (60.000 combates por iteración, 12 iteraciones).
// La fase 2 ampliará a los 10 tipos del scope §H7 cuando el esqueleto del
// loop de combate H3 esté cerrado end-to-end. Hasta entonces: stat-lines
// honestas con datos reales, sin narrativa final.
//
// Razón de existir hoy: el sub-paso H3.2d del Hito 3 cierra la entrada del
// primer enemigo del juego en `data/`. El motor `rules/combat.ts` ya consume
// `Enemy` y `EnemyState` desde el sub-paso 2a; aquí proporcionamos la
// instancia concreta a la que apunta el primer encuentro tutorial.
//
// Decisiones arquitectónicas tomadas en este sub-paso (D-2d-*):
//   - D-2d-1: `LootTable` y `LootDrop` viven AQUÍ como tipos locales del
//     archivo de datos, NO en `rules/inventory.ts`. Razón: el dominio del
//     loot es declarativo en fase 1; el motor sagrado no debe acoplarse a
//     una estructura cuya lógica de resolución (`resolveLootTable`) aún no
//     existe. Cuando el orquestador de combate H3 sub-paso 3 la consuma, si
//     la regla escala (modificadores por skill, drop bonus, etc.) se promueve
//     a `rules/loot.ts` propio. Hoy sería overengineering.
//   - D-2d-2: NO se extiende `Enemy` con `loot_table`. Razón: `combat.ts` es
//     módulo sagrado y resuelve ataque/turno; el loot se aplica al cierre
//     del combate, no durante. El paralelo `LOOT_TABLES_BY_ENEMY_ID` mantiene
//     la pureza del motor: `combat.ts` no necesita conocer loot para nada.
//   - D-2d-3: la lógica `resolveLootTable(rng, table)` se difiere al sub-paso
//     H3.2 siguiente, cuando el orquestador la consuma. Aquí sólo se
//     declaran TIPO y TABLA; la auditoría de tests valida estructura, no
//     la distribución estocástica.
//
// Reglas validadas por test (ver enemies.test.ts):
//   - Catálogo no vacío.
//   - Cada Enemy con stats coherentes (hp_max > 0, attack_pool >= 0,
//     weapon_damage >= 0, defense_threshold >= 1, initiative_base >= 0).
//   - Cada drop con `kind === 'item'` referencia un `item_id` que existe
//     en `ITEMS_BY_ID` (sin loot huérfano).
//   - quantity_min <= quantity_max y probability ∈ [0, 1].
//   - lobo_del_bosque existe con la stat-line exacta de la simulación.

import type { Enemy, EnemyId } from '../rules/combat';
import type { ItemId } from '../rules/inventory';
import { ITEMS_BY_ID } from './items';

// -----------------------------------------------------------------------------
// Tipos de loot (D-2d-1: viven aquí, no en rules/inventory.ts)
// -----------------------------------------------------------------------------

// Tipo de drop. Se discrimina por `kind`. Los `gold` no llevan `item_id`
// porque el oro no es un Item del catálogo: es una propiedad escalar del
// Character (recurso simple, sin slot, sin durabilidad). Esto evita inflar
// el catálogo con un Item especial "moneda".
export type LootDropKind = 'item' | 'gold';

export interface LootDrop {
  kind: LootDropKind;
  // Sólo cuando kind === 'item'. Para 'gold' se ignora (debe ser undefined
  // para que el lector no lo confunda).
  item_id?: ItemId;
  // Inclusivo. Si quantity_min === quantity_max → cantidad fija.
  quantity_min: number;
  // Inclusivo. quantity_max >= quantity_min siempre.
  quantity_max: number;
  // [0, 1]. 1 = drop garantizado. 0 nunca se declara (un drop con prob 0
  // es ruido en la tabla; mejor no escribirlo).
  probability: number;
}

export interface LootTable {
  // Cada drop se evalúa de forma independiente: lanzar N tiradas, una por
  // entrada, no "elegir una entrada de la tabla". Esto permite mezclar
  // garantizados (prob 1) con variables (prob < 1) sin regla extra.
  // La lógica concreta de resolución se difiere a sub-paso H3.2 siguiente
  // (D-2d-3). Aquí sólo declaramos contrato.
  drops: readonly LootDrop[];
}

// -----------------------------------------------------------------------------
// Catálogo de enemigos
// -----------------------------------------------------------------------------

// Stat-line del Lobo del Bosque cerrada en simulaciones/lobo-v0.1.md
// iteración 3c (Build A · arma_media: 33.4% victoria, target 25-40%;
// HP%win 31.5%, target 30-60%; 5 turnos mediana, target 4-7;
// 0% muertes turno 1 por crítico).
//
// id `lobo_del_bosque` (snake_case lower, convención del repo). El .md de
// simulación usaba `lobo_bosque` como placeholder; la decisión final del
// briefing es `lobo_del_bosque` y prevalece.
export const ENEMIES: readonly Enemy[] = [
  {
    id: 'lobo_del_bosque',
    name: 'Lobo del Bosque',
    level: 1,
    attack_pool: 3,
    defense_threshold: 3,
    weapon_damage: 2,
    initiative_base: 4,
    hp_max: 16,
  },
] as const;

export const ENEMIES_BY_ID: Readonly<Record<EnemyId, Enemy>> = Object.fromEntries(
  ENEMIES.map((e) => [e.id, e]),
);

// -----------------------------------------------------------------------------
// Tablas de loot (D-2d-2: estructura paralela, no propiedad de Enemy)
// -----------------------------------------------------------------------------

// Loot del lobo (decisión D4 cerrada con Bazalo, mixto):
//   - Diente de Lobo: 1 unidad SIEMPRE (probability 1.0).
//   - Oro: 5-15 monedas SIEMPRE (rango uniforme, probability 1.0).
//   - Poción de curación menor: 1 unidad al ~50% (probability 0.5).
//
// Las cantidades de oro son provisionales H6 (economía no cerrada). El
// Diente y la Poción referencian items reales del catálogo (validado por test).
const LOOT_LOBO_DEL_BOSQUE: LootTable = {
  drops: [
    {
      kind: 'item',
      item_id: 'diente_de_lobo',
      quantity_min: 1,
      quantity_max: 1,
      probability: 1.0,
    },
    {
      kind: 'gold',
      quantity_min: 5,
      quantity_max: 15,
      probability: 1.0,
    },
    {
      kind: 'item',
      item_id: 'pocion_curacion_menor',
      quantity_min: 1,
      quantity_max: 1,
      probability: 0.5,
    },
  ],
};

// Map paralelo a ENEMIES_BY_ID. Un enemigo sin entrada aquí NO tiene loot
// (combate sin recompensa material; útil para combates narrativos futuros).
// El orquestador del sub-paso siguiente leerá esto con `LOOT_TABLES_BY_ENEMY_ID[enemy_id] ?? null`.
export const LOOT_TABLES_BY_ENEMY_ID: Readonly<Record<EnemyId, LootTable>> = {
  lobo_del_bosque: LOOT_LOBO_DEL_BOSQUE,
} as const;

// Helper de lectura. Mantiene a los consumidores fuera de la indirección
// del Record. Devuelve null si no hay tabla (no lanza: la ausencia de loot
// es un caso válido del dominio, no un error).
export function getLootTableForEnemy(enemyId: EnemyId): LootTable | null {
  return LOOT_TABLES_BY_ENEMY_ID[enemyId] ?? null;
}

// -----------------------------------------------------------------------------
// Auto-validación de integridad referencial (defensiva, defensa en profundidad)
// -----------------------------------------------------------------------------

// Validamos al cargar el módulo que cada drop con kind 'item' referencia un
// item del catálogo. Si alguien añade una tabla con un id huérfano, el
// proceso peta en import time, no en runtime de combate. El test de
// enemies.test.ts cubre lo mismo, pero la doble red asegura que un build
// roto no llegue a producción.
for (const [enemyId, table] of Object.entries(LOOT_TABLES_BY_ENEMY_ID)) {
  for (const drop of table.drops) {
    if (drop.kind === 'item') {
      if (drop.item_id === undefined) {
        throw new Error(
          `data/enemies: drop con kind='item' sin item_id (enemy "${enemyId}").`,
        );
      }
      if (ITEMS_BY_ID[drop.item_id] === undefined) {
        throw new Error(
          `data/enemies: drop "${drop.item_id}" del enemigo "${enemyId}" no existe en ITEMS_BY_ID.`,
        );
      }
    }
  }
}
