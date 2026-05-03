// Módulo SAGRADO. Puro, determinista, sin RNG. Sin imports de Canvas, DOM,
// Supabase. Biblia §4.8 (combate) — H3 sub-paso 4c.
//
// IA táctica de los enemigos. Decide QUÉ acción va a tomar el enemigo en su
// turno actual a partir del estado del combate. NO ejecuta la acción: sólo
// declara la intención (`EnemyIntent`). La ejecución vive en
// `rules/combat.ts` (`applyEnemyTurn`), que lee el intent y lo resuelve con
// las primitivas existentes (`resolveAttack`, `applyStatus`).
//
// Esta separación tiene tres beneficios:
//   1. La UI (`render/combat-view.ts`) puede leer `enemy.intent` y mostrar al
//      jugador "el lobo va a atacarte por 3-5 daño" o "el lobo se prepara a
//      esquivar" ANTES de que el ataque se resuelva. Telegrafía la acción,
//      como en un buen RPG táctico.
//   2. El motor (#75 sagrado) NO se modifica: `resolveAttack`,
//      `computeHitThreshold`, `rollCombatPool` siguen intactos. La IA es una
//      capa de DECISIÓN previa al motor de RESOLUCIÓN.
//   3. La simulación masiva IA vs IA (Modo Privado) puede comparar perfiles
//      sin tener que ejecutar el combate completo: basta con observar qué
//      intents emite cada perfil ante estados sintéticos.
//
// CERRADO (decisiones de producto, briefing 4c con Bazalo):
//   - 4 perfiles: agresivo, evasor, cauteloso, toxico (E2).
//   - decideEnemyAction es DETERMINISTA: el mismo (enemy, character, profile)
//     produce el mismo intent. Sin RNG. Las dispersión vive en `resolveAttack`
//     (pool de dados) y en `flee` (tirada 50%), no aquí.
//   - El perfil `toxico` aplica `poisoned` como ACCIÓN SEPARADA (F1): gasta
//     el turno aplicando el status, NO ataca y aplica al mismo tiempo. El
//     sistema de "ataques con efectos secundarios" se difiere.
//   - Cada perfil decide a partir de DOS observables: HP propio (cauteloso)
//     y statuses del PJ/propio (evasor, toxico). Ningún perfil consulta HP
//     del PJ, posicionamiento (no existe en H3), o aliados (no hay IA grupal).

import type { Character } from './character';
import type { Enemy, EnemyState } from './combat';
import type { StatusKind } from './statuses';
import { hasStatus } from './statuses';

// -----------------------------------------------------------------------------
// Tipos públicos
// -----------------------------------------------------------------------------

// Catálogo cerrado de perfiles de IA (decisión E2). Cualquier nuevo perfil
// requiere ampliar este tipo + decidir su comportamiento + cubrir test.
export type AIProfile = 'agresivo' | 'evasor' | 'cauteloso' | 'toxico';

// Intent: la declaración de intención del enemigo para su próximo turno.
// Discriminated union por `kind`. La UI la lee y la pinta; el motor la
// ejecuta. NO contiene resultado (pool, dados, daño real): eso se calcula
// al EJECUTAR la acción (resolveAttack), no al decidirla.
//
// Para `attack`, el campo `estimated_damage_min/max` da las cotas TEÓRICAS
// del rango de daño:
//   min = weapon_damage + 0  (margen 0, hit por los pelos, sin crítico)
//   max = (weapon_damage + max_éxitos - threshold) * 2  (crítico máximo)
// La UI las usa para mostrar "3-5 daño". No son P(hit), no son media: son
// cotas. Si el ataque falla, el daño real es 0 (fuera del rango mostrado);
// la UI puede comunicarlo como "puede fallar".
export type EnemyIntent =
  | {
      kind: 'attack';
      target: 'character';
      estimated_damage_min: number;
      estimated_damage_max: number;
    }
  | {
      kind: 'apply_status_self';
      status: StatusKind;
    }
  | {
      kind: 'apply_status_target';
      status: StatusKind;
      target: 'character';
    };

// -----------------------------------------------------------------------------
// Constantes derivadas para la UI
// -----------------------------------------------------------------------------

// HP% threshold del perfil cauteloso. Por debajo de este ratio, defiende
// (apply_status_self dodging). Por encima, ataca. 50% es el cierre del
// briefing (tabla del prompt). Constante para que la UI/los tests puedan
// importarla y razonar sin redescubrir el número.
export const CAUTELOSO_HP_DEFEND_THRESHOLD = 0.5;

// -----------------------------------------------------------------------------
// Helpers internos
// -----------------------------------------------------------------------------

// Cota inferior del daño de un ataque que SÍ impacta: weapon_damage + margen 0.
// Hit por los pelos: éxitos == threshold → margin 0 → damage = weapon_damage.
function estimateDamageMin(template: Enemy): number {
  return template.weapon_damage;
}

// Cota superior teórica del daño de un ataque crítico:
//   max éxitos posibles = attack_pool (todos sacan ≥4)
//   margen máximo       = attack_pool - threshold
//   damage              = (weapon_damage + margen) * 2 si crítico
// El threshold del PJ se calcula con su DEF, pero al construir el intent NO
// queremos forzar al caller a pasar la DEF. Asumimos threshold mínimo (1)
// para devolver la cota MÁS GENEROSA: la UI muestra "hasta X daño", no "X
// daño exacto". Si el atacante tiene attack_pool 0 (caso degenerado), la
// cota colapsa a weapon_damage * 2.
//
// Esta cota es OPTIMISTA: el daño real casi nunca llega ahí. Es el rango
// "qué tan mal puede ir esto". La UI lo presenta como tal.
function estimateDamageMax(template: Enemy): number {
  const minThreshold = 1;
  const maxMargin = Math.max(0, template.attack_pool - minThreshold);
  return (template.weapon_damage + maxMargin) * 2;
}

// Construye el intent canónico de ATAQUE para un enemigo. Centralizado para
// que los 4 perfiles usen las mismas cotas de daño (no se duplica el cálculo).
function buildAttackIntent(template: Enemy): EnemyIntent {
  return {
    kind: 'attack',
    target: 'character',
    estimated_damage_min: estimateDamageMin(template),
    estimated_damage_max: estimateDamageMax(template),
  };
}

// -----------------------------------------------------------------------------
// Decisión de IA por perfil
// -----------------------------------------------------------------------------

// Función pura. Dado el estado actual del enemigo, el PJ y el perfil,
// devuelve el intent que el motor ejecutará. NO consume RNG: la dispersión
// del combate vive en la resolución de la acción (resolveAttack), no en la
// decisión.
//
// Reglas por perfil (briefing 4c):
//
//   agresivo  : siempre `attack`. Default para enemigos básicos (lobo).
//
//   evasor    : si NO tiene `dodging` activo → apply_status_self dodging.
//               Si lo tiene → attack. Alterna defensa/ofensiva.
//
//   cauteloso : si HP/HP_max > 50% → attack. Si ≤ 50% → apply_status_self
//               dodging. Defiende cuando lo hieren. NOTA: el ratio se calcula
//               con `template.hp_max` (no con un campo de EnemyState porque
//               EnemyState sólo guarda hp actual, no max). El template es la
//               fuente de verdad del HP máximo.
//
//   toxico    : si el PJ NO tiene `poisoned` activo → apply_status_target
//               poisoned al PJ. Si lo tiene → attack. Aplica veneno una vez,
//               luego ataca normalmente. Cumple F1 (acción separada).
//
// El `enemy` puede tener `intent: EnemyIntent | null` ya asignado de un
// turno anterior; este parámetro NO lo consulta (la IA decide siempre desde
// el estado actual del combate, no desde el intent previo).
export function decideEnemyAction(
  enemy: EnemyState,
  template: Enemy,
  character: Character,
  profile: AIProfile,
): EnemyIntent {
  // Validación defensiva: si por alguna razón llega un enemigo con HP <=0
  // o muerto, el motor NO debería estar pidiendo intent. Lanzamos para
  // que el bug salga arriba en lugar de propagar un intent absurdo.
  if (!enemy.alive || enemy.hp <= 0) {
    throw new Error(
      `decideEnemyAction: el enemigo "${enemy.instance_id}" no está vivo (alive=${enemy.alive}, hp=${enemy.hp}).`,
    );
  }

  switch (profile) {
    case 'agresivo':
      return buildAttackIntent(template);

    case 'evasor': {
      if (!hasStatus(enemy, 'dodging')) {
        return { kind: 'apply_status_self', status: 'dodging' };
      }
      return buildAttackIntent(template);
    }

    case 'cauteloso': {
      // Evita div por cero defensivamente: si template.hp_max es 0 (no
      // debería pasar — los catálogos validan hp_max>0), ataca por defecto.
      if (template.hp_max <= 0) return buildAttackIntent(template);
      const hpRatio = enemy.hp / template.hp_max;
      if (hpRatio > CAUTELOSO_HP_DEFEND_THRESHOLD) {
        return buildAttackIntent(template);
      }
      return { kind: 'apply_status_self', status: 'dodging' };
    }

    case 'toxico': {
      if (!hasStatus(character, 'poisoned')) {
        return {
          kind: 'apply_status_target',
          status: 'poisoned',
          target: 'character',
        };
      }
      return buildAttackIntent(template);
    }
  }
}
