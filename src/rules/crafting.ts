// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.5 (crafteo). H6.
//
// Recetas con outputs ramificados (success / critical / failure), descubrimiento
// por combinación, batch x10, encadenamiento x3 en un clic, station opcional.
//
// PROVISIONAL H6:
//   - Probabilidades por defecto si la receta no las declara.
//   - Resolución del check de habilidad: usa rollD20 contra difficulty fija.

import type { Rng } from './dice';
import { rollD20 } from './dice';
import type { Character } from './character';
import type { ItemId, ItemStack } from './inventory';

// -----------------------------------------------------------------------------
// Receta (biblia §4.5)
// -----------------------------------------------------------------------------

export type RecipeId = string;
export type StationId = string;

// Recursos requeridos: id de item → cantidad consumida.
export type RecipeResources = Readonly<Record<ItemId, number>>;

export interface RecipeSkillCheck {
  // Habilidad que se tira al craftear.
  skill: string;
  // DIF fija. Decisión H6: el check es 1d20 + skill.value vs difficulty.
  difficulty: number;
}

// Salida en éxito/crítico/fracaso. La biblia §4.5 deja explícito que el
// fracaso pierde fracción de recursos (resources_lost ∈ [0, 1]).
export interface RecipeOutcome {
  success: { item: ItemId; quantity: number };
  // Si la receta no declara crítico, se trata como success normal.
  critical: { item: ItemId; quantity: number } | null;
  // Si la receta no declara fracaso, no se pierde nada y no produce output.
  failure: { resources_lost: number; time_lost: number } | null;
}

export interface Recipe {
  id: RecipeId;
  resources: RecipeResources;
  skill_check: RecipeSkillCheck;
  // null = no requiere station. La UI la deshabilita si no estás en la correcta.
  station: StationId | null;
  // Mantenido para futuro motor; en web se ignora (biblia §4.5 "instantáneo").
  time_hours: number;
  outputs: RecipeOutcome;
}

// -----------------------------------------------------------------------------
// Intento de crafteo
// -----------------------------------------------------------------------------

export interface CraftAttempt {
  recipe_id: RecipeId;
  // Cuántas veces se ejecuta la receta en este clic. 1 normalmente, hasta 10
  // si el jugador pulsó "craft x10". Cada iteración tira independientemente.
  iterations: number;
  // ID de la station en la que está el jugador. null si no está en ninguna.
  current_station: StationId | null;
}

export type CraftBranch = 'success' | 'critical' | 'failure';

export interface CraftIterationResult {
  branch: CraftBranch;
  // Item producido en éxito/crítico (null en fracaso).
  produced: ItemStack | null;
  // Recursos consumidos en esta iteración. Map igual que recipe.resources;
  // en fracaso parcial se consume la fracción declarada en outputs.failure.
  resources_consumed: Readonly<Record<ItemId, number>>;
  // Tirada cruda para log y debug. d20 + skill_value.
  roll: { die: number; skill_value: number; total: number };
}

export interface CraftResult {
  recipe_id: RecipeId;
  iterations: readonly CraftIterationResult[];
}

export type CraftingErrorCode =
  | 'RECIPE_NOT_FOUND'
  | 'STATION_REQUIRED'
  | 'INSUFFICIENT_RESOURCES'
  | 'INVALID_ITERATIONS';

export class CraftingError extends Error {
  readonly code: CraftingErrorCode;
  constructor(code: CraftingErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.code = code;
  }
}

// -----------------------------------------------------------------------------
// Probabilidades
// -----------------------------------------------------------------------------

// Probabilidades resueltas para una receta dada el personaje. Las muestra la
// UI antes de craftear (biblia §4.5: "porcentajes visibles").
export interface CraftProbabilities {
  success: number;
  critical: number;
  failure: number;
}

// Calcula las probabilidades del próximo crafteo. Reflejan EXACTAMENTE la
// lógica de rollCraftCheck para que la UI muestre lo que va a pasar:
//   - critical: P(die === 20) = 1/20 = 5% (siempre, independiente de skill).
//   - success:  P(total ≥ difficulty AND die !== 20)
//   - failure:  P(total < difficulty AND die !== 20)
//
// Como total = die + skill_value y die ∈ [1,20], el cálculo es analítico:
// faces_needed = max(1, difficulty - skill_value). Si faces_needed ≤ 1 →
// success en 19/20 (todas menos crit). Si faces_needed > 20 → success en 0.
export function computeOutcomeProbabilities(
  recipe: Recipe,
  character: Character,
): CraftProbabilities {
  const skill = character.skills[recipe.skill_check.skill];
  const skillValue = skill === undefined ? 0 : skill.value;
  const minDieForSuccess = recipe.skill_check.difficulty - skillValue;

  // Critical = die === 20 SIEMPRE (independientemente de difficulty).
  const critical = 1 / 20;

  // Caras 1..19 que pasan el check (die ≥ minDieForSuccess).
  // Si minDieForSuccess ≤ 1 → caras 1..19 todas valen → 19 caras de éxito.
  // Si minDieForSuccess > 19 → 0 caras de éxito (sólo crítico).
  // Si minDieForSuccess ≤ 19 → 19 - minDieForSuccess + 1 = 20 - minDieForSuccess.
  let successFaces: number;
  if (minDieForSuccess <= 1) successFaces = 19;
  else if (minDieForSuccess > 19) successFaces = 0;
  else successFaces = 20 - minDieForSuccess;

  const success = successFaces / 20;
  const failure = 1 - success - critical;

  return { success, critical, failure };
}

// -----------------------------------------------------------------------------
// Ejecución
// -----------------------------------------------------------------------------

// Ejecuta el intento. Cada iteración tira independientemente y consume
// recursos. NO toca el inventario directamente: devuelve el resumen para que
// el llamador (state/) aplique a inventory con removeFromSlot/addItem.
//
// Validaciones:
//   - station: si la receta requiere station y current_station no coincide → STATION_REQUIRED.
//   - iterations: entero entre 1 y 10 (biblia §4.5: craft x10 máximo en batch).
//
// El consumo de recursos es por iteración: success/critical consume todo el
// resources declarado; failure consume `resources_lost * resources` (fracción
// de la receta). El inventario lo decrementa el llamador con removeFromSlot.
export function attemptCraft(
  attempt: CraftAttempt,
  recipe: Recipe,
  character: Character,
  rng: Rng,
): CraftResult {
  if (attempt.recipe_id !== recipe.id) {
    throw new CraftingError(
      'RECIPE_NOT_FOUND',
      `attempt.recipe_id "${attempt.recipe_id}" no coincide con recipe.id "${recipe.id}".`,
    );
  }
  if (!Number.isInteger(attempt.iterations) || attempt.iterations < 1 || attempt.iterations > 10) {
    throw new CraftingError(
      'INVALID_ITERATIONS',
      `iterations debe ser entero entre 1 y 10 (recibido ${attempt.iterations}).`,
    );
  }
  if (recipe.station !== null && attempt.current_station !== recipe.station) {
    throw new CraftingError(
      'STATION_REQUIRED',
      `Receta "${recipe.id}" requiere station "${recipe.station}" (actual: ${attempt.current_station ?? 'ninguna'}).`,
    );
  }

  const iterations: CraftIterationResult[] = [];
  for (let i = 0; i < attempt.iterations; i++) {
    const roll = rollCraftCheck(recipe, character, rng);
    let produced: ItemStack | null = null;
    let consumed: Record<ItemId, number> = { ...recipe.resources };

    if (roll.branch === 'success') {
      produced = {
        item_id: recipe.outputs.success.item,
        quantity: recipe.outputs.success.quantity,
        durability: null,
      };
    } else if (roll.branch === 'critical') {
      const critOut = recipe.outputs.critical ?? recipe.outputs.success;
      produced = {
        item_id: critOut.item,
        quantity: critOut.quantity,
        durability: null,
      };
    } else {
      // failure
      const fail = recipe.outputs.failure;
      if (fail !== null) {
        // Consumir fracción declarada. Math.ceil para no devolver fracciones
        // de items no apilables (si pierdes 0.5 de tela, pierdes 1 entera).
        consumed = {};
        for (const [id, qty] of Object.entries(recipe.resources)) {
          const lost = Math.ceil(qty * fail.resources_lost);
          if (lost > 0) consumed[id] = lost;
        }
      } else {
        // Sin failure declarada: no pierde recursos, no produce nada.
        consumed = {};
      }
    }

    iterations.push({
      branch: roll.branch,
      produced,
      resources_consumed: consumed,
      roll: { die: roll.die, skill_value: roll.skill_value, total: roll.total },
    });
  }

  return { recipe_id: recipe.id, iterations };
}

// Tirada interna del check. Aislada para tests y para Modo Privado.
// PROVISIONAL H6: 1d20 + skill_value vs difficulty.
//   crit si die === 20
//   success si total ≥ difficulty
//   failure en otro caso
export function rollCraftCheck(
  recipe: Recipe,
  character: Character,
  rng: Rng,
): { branch: CraftBranch; die: number; skill_value: number; total: number } {
  const die = rollD20(rng);
  const skill = character.skills[recipe.skill_check.skill];
  const skill_value = skill === undefined ? 0 : skill.value;
  const total = die + skill_value;
  let branch: CraftBranch;
  if (die === 20) branch = 'critical';
  else if (total >= recipe.skill_check.difficulty) branch = 'success';
  else branch = 'failure';
  return { branch, die, skill_value, total };
}

// -----------------------------------------------------------------------------
// Descubrimiento (biblia §4.5: combinar materiales descubre recetas)
// -----------------------------------------------------------------------------

// Busca una receta cuyo `resources` coincida exactamente con los materiales
// combinados (mismas claves, mismas cantidades). Devuelve el id de la receta
// o null si la combinación no corresponde a ninguna conocida.
//
// "Exactamente" significa: el set de keys de materials === el set de keys de
// recipe.resources, y para cada key materials[k] === recipe.resources[k].
// No hay match parcial: combinar 2 telas + 1 hierba no descubre la receta de
// 1 tela + 1 hierba (eso devolvería una receta sin consumir todo).
export function findRecipeByResources(
  materials: Readonly<Record<ItemId, number>>,
  catalog: Readonly<Record<RecipeId, Recipe>>,
): RecipeId | null {
  const matKeys = Object.keys(materials).filter((k) => materials[k]! > 0).sort();
  for (const recipe of Object.values(catalog)) {
    const recipeKeys = Object.keys(recipe.resources).sort();
    if (recipeKeys.length !== matKeys.length) continue;
    if (recipeKeys.some((k, i) => k !== matKeys[i])) continue;
    let match = true;
    for (const k of recipeKeys) {
      if (recipe.resources[k] !== materials[k]) {
        match = false;
        break;
      }
    }
    if (match) return recipe.id;
  }
  return null;
}
