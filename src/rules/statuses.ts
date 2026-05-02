// Módulo SAGRADO. Puro, determinista. Sin imports de Canvas, DOM, Supabase.
// Biblia §4.8 (estados/iconos sobre sprite). H3 — sub-paso 4a.1.
//
// Contenedor + helpers para los estados (statuses) que afectan tanto al PJ
// como a los enemigos. Decisión #75 (motor de combate intocable) y simetría
// PJ ↔ enemigo aprobada por Bazalo: las funciones de tick aceptan cualquier
// portador estructural — un objeto con `statuses: readonly StatusEffect[]` y
// `hp: number | { current: number; max: number }`. No conocen ni Character ni
// EnemyState concretos; eso permite reutilizarlas en ambos lados sin bifurcar
// la regla.
//
// Reglas de stacking (cerradas en preguntas 1-5, sesión 4a):
//   - Cap 1 instancia por kind. Aplicar el mismo kind dos veces NO crea una
//     segunda entrada: refresca la duración al máximo de las dos y MANTIENE
//     la magnitud original (no suma).
//   - El tick descuenta `remaining` UNA VEZ por turno (al final). Los efectos
//     que disparan al inicio (bleeding) lo hacen antes de decrementar; los
//     que disparan al final (poisoned) lo hacen junto al decremento.
//   - Cuando `remaining` llega a 0, el efecto se filtra fuera del array.
//
// Reparto inicio/fin de turno (cerrado en pregunta 5, sesión 4a):
//   - bleeding → tick al INICIO del turno del portador. Daño físico que mana
//     antes de que el portador actúe.
//   - poisoned → tick al FINAL del turno del portador. Veneno metabolizándose
//     a lo largo del turno.
//   - dodging → no hace daño; expira al final como cualquier otro.
//   - stunned → no hace daño; bloquea acciones (consumido en 4a.3 por
//     applyCharacterAction/applyEnemyTurn). Si llega con `remaining=1` al inicio
//     del turno, el portador pierde ESE turno y el efecto se filtra al final.

// -----------------------------------------------------------------------------
// Tipos canónicos (fuente de verdad)
// -----------------------------------------------------------------------------

// Catálogo de estados conocidos. Ampliable cuando se cierren reglas para
// nuevos efectos (quemado, congelado, marcado, etc.).
export type StatusKind = 'bleeding' | 'poisoned' | 'stunned' | 'dodging';

export interface StatusEffect {
  kind: StatusKind;
  // Turnos que le quedan. Tras el tick se decrementa; al llegar a 0 se filtra.
  // Convención: aplicar `bleeding` con `remaining=3` significa "hace daño en
  // los próximos 3 turnos del portador" (3 ticks).
  remaining: number;
  // Magnitud (daño por turno para DoT, bono de DEF para dodging, etc.).
  magnitude: number;
}

// Duración inicial recomendada por kind. La usa applyStatus cuando refresca
// y como referencia para construir efectos en combat.ts. Si un efecto se
// aplica con duración custom (ej. perk que alarga sangrado), el llamador la
// pasa explícita en `effect.remaining` y applyStatus respeta el máximo.
export const STATUS_DEFAULT_DURATION: Readonly<Record<StatusKind, number>> = {
  bleeding: 3,
  poisoned: 3,
  stunned: 1,
  dodging: 1,
} as const;

// Magnitud por defecto. Útil para construir efectos sin repetir números.
// El llamador puede sobreescribir si la regla de la habilidad lo pide.
export const STATUS_DEFAULT_MAGNITUDE: Readonly<Record<StatusKind, number>> = {
  bleeding: 1, // 1 daño por tick — coherente con HP_obj 10/20/40.
  poisoned: 1,
  stunned: 0, // sin daño; bloquea acción.
  dodging: 2, // bono al threshold del defensor (consumido en 4a.3).
} as const;

// -----------------------------------------------------------------------------
// Portador genérico
// -----------------------------------------------------------------------------

// Cualquier objeto que tenga un array de statuses puede ser el target de
// applyStatus / hasStatus / tick*. Mantenerlo estructural permite que
// Character (con `hp: { current, max }`) y EnemyState (con `hp: number`)
// compartan helpers sin acoplarse.
//
// El tipo es genérico en T para que el retorno preserve el tipo concreto del
// portador (Character o EnemyState), no se degrade a StatusBearer.
export interface StatusBearer {
  readonly statuses: readonly StatusEffect[];
}

// Resultado del tick: el portador con statuses actualizados y el daño que el
// llamador debe aplicar al HP del portador. El daño se devuelve aparte —
// no se aplica aquí — porque la fórmula de aplicar daño sobre Character
// (hp.current) y sobre EnemyState (hp) es distinta y vive en combat.ts.
// Mantener statuses.ts agnóstico al modelo de HP es la única forma de que
// PJ y enemigo compartan el tick sin bifurcar.
export interface TickResult<T extends StatusBearer> {
  bearer: T;
  damage: number;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// Cap 1 instancia por kind. Si ya existe un efecto con el mismo kind:
//   - duración → max(actual, nueva).
//   - magnitud → SE MANTIENE la actual (no suma, no se sobrescribe).
// Si no existe, se añade tal cual.
//
// Devuelve un nuevo bearer con `statuses` reescrito; nunca muta el original.
export function applyStatus<T extends StatusBearer>(target: T, effect: StatusEffect): T {
  if (!Number.isInteger(effect.remaining) || effect.remaining <= 0) {
    throw new RangeError(
      `applyStatus: remaining debe ser entero >0 (recibido ${effect.remaining}).`,
    );
  }
  if (!Number.isFinite(effect.magnitude) || effect.magnitude < 0) {
    throw new RangeError(
      `applyStatus: magnitude debe ser ≥0 finito (recibido ${effect.magnitude}).`,
    );
  }

  const existingIndex = target.statuses.findIndex((s) => s.kind === effect.kind);
  if (existingIndex === -1) {
    return { ...target, statuses: [...target.statuses, { ...effect }] };
  }

  const existing = target.statuses[existingIndex]!;
  const refreshed: StatusEffect = {
    kind: existing.kind,
    remaining: Math.max(existing.remaining, effect.remaining),
    magnitude: existing.magnitude, // no suma, no sobrescribe.
  };
  const newStatuses = target.statuses.slice();
  newStatuses[existingIndex] = refreshed;
  return { ...target, statuses: newStatuses };
}

// Tick al INICIO del turno del portador.
//   - Aplica `bleeding`: suma `magnitude` al daño devuelto.
//   - NO decrementa remaining (el decremento es responsabilidad del tick fin
//     de turno; mantener un único punto de decremento evita doble descuento
//     cuando un mismo efecto dispara inicio y fin).
//
// Devuelve { bearer, damage }. El llamador aplica el daño al HP con la
// función adecuada (applyDamageToCharacter / applyDamageToEnemy).
export function tickStatusesAtTurnStart<T extends StatusBearer>(target: T): TickResult<T> {
  let damage = 0;
  for (const status of target.statuses) {
    if (status.kind === 'bleeding') {
      damage += status.magnitude;
    }
  }
  // No mutamos statuses en el tick de inicio: sólo medimos daño.
  return { bearer: target, damage };
}

// Tick al FINAL del turno del portador.
//   - Aplica `poisoned`: suma `magnitude` al daño devuelto.
//   - Decrementa `remaining` de TODOS los efectos en una unidad.
//   - Filtra los que llegan a 0.
//
// El decremento es uniforme: bleeding también pierde 1 aquí, aunque su daño
// se haya cobrado al inicio. Eso garantiza que `remaining=N` siempre signifique
// "N turnos de presencia", independientemente de cuándo dispara cada efecto.
export function tickStatusesAtTurnEnd<T extends StatusBearer>(target: T): TickResult<T> {
  let damage = 0;
  const next: StatusEffect[] = [];
  for (const status of target.statuses) {
    if (status.kind === 'poisoned') {
      damage += status.magnitude;
    }
    const newRemaining = status.remaining - 1;
    if (newRemaining > 0) {
      next.push({ ...status, remaining: newRemaining });
    }
  }
  return { bearer: { ...target, statuses: next }, damage };
}

// Devuelve true si el portador tiene un efecto activo del kind dado.
export function hasStatus(target: StatusBearer, kind: StatusKind): boolean {
  return target.statuses.some((s) => s.kind === kind);
}

// Limpia todos los statuses del portador. Lo consume el cierre de combate
// (4a.4) cuando se vuelve al overworld: los statuses no persisten entre
// combates en H3. Pure: devuelve nuevo bearer.
export function clearAllStatuses<T extends StatusBearer>(target: T): T {
  if (target.statuses.length === 0) return target;
  return { ...target, statuses: [] };
}
