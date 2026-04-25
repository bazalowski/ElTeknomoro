import { describe, it, expect } from 'vitest';
import { createRng, type Rng } from './dice';
import { createCharacter, type Character } from './character';
import {
  computeEffectiveWeight,
  computeWeightedEntries,
  filterEligibleEntries,
  isEntryEligible,
  resolveEvadeCheck,
  rollExplorationTick,
  selectByD20,
  type BiomeTable,
  type EvadeCheck,
  type TableEntry,
  type WeightedEntry,
  type WorldState,
} from './exploration';

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

function baseCharacter(overrides: Partial<Parameters<typeof createCharacter>[0]> = {}): Character {
  return createCharacter({
    id: 'test-char',
    name: 'Tester',
    portraitId: 'p-01',
    archetype: null,
    attributes: { fue: 3, des: 3, con: 3, int: 2, vol: 1 },
    skills: { sigilo: 2, percepcion: 2, supervivencia: 1 },
    perks: ['perk-test'],
    location: { mapId: 'm', x: 0, y: 0 },
    ...overrides,
  });
}

function baseWorld(overrides: Partial<WorldState> = {}): WorldState {
  return {
    biome: 'bosque',
    time_of_day: 'day',
    weather: 'clear',
    faction_reputation: {},
    flags: {},
    luck: 0,
    ...overrides,
  };
}

function baseEvade(overrides: Partial<EvadeCheck> = {}): EvadeCheck {
  return {
    skill: 'sigilo',
    difficulty: 10,
    opposed: false,
    cost: { type: 'free' },
    on_success: { outcome: 'skip_event' },
    on_critical: { outcome: 'skip_event_bonus' },
    on_failure: { outcome: 'resolve_normal' },
    on_fumble: null,
    auto: false,
    trains_skill: true,
    fallback_check: null,
    ...overrides,
  };
}

function entry(overrides: Partial<TableEntry> = {}): TableEntry {
  return {
    id: 'e-default',
    biome: 'bosque',
    weight: 10,
    conditions: {},
    type: 'nothing',
    payload: {},
    evade_check: null,
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// isEntryEligible / filterEligibleEntries
// -----------------------------------------------------------------------------

describe('isEntryEligible', () => {
  it('rechaza si el bioma no coincide', () => {
    const e = entry({ biome: 'desierto' });
    expect(isEntryEligible(e, baseCharacter(), baseWorld())).toBe(false);
  });

  it('aplica min_level y max_level inclusive', () => {
    const e = entry({ conditions: { min_level: 2, max_level: 4 } });
    const ws = baseWorld();
    expect(isEntryEligible(e, baseCharacter(), ws)).toBe(false); // level 1
    // Forzamos level 2 mutando el slot autoritativo (en runtime real lo hace progression.ts).
    const c2 = { ...baseCharacter(), level: 2 } as Character;
    const c4 = { ...baseCharacter(), level: 4 } as Character;
    const c5 = { ...baseCharacter(), level: 5 } as Character;
    expect(isEntryEligible(e, c2, ws)).toBe(true);
    expect(isEntryEligible(e, c4, ws)).toBe(true);
    expect(isEntryEligible(e, c5, ws)).toBe(false);
  });

  it('time_of_day filtra si la lista existe y no incluye el valor actual', () => {
    const e = entry({ conditions: { time_of_day: ['night'] } });
    expect(isEntryEligible(e, baseCharacter(), baseWorld({ time_of_day: 'day' }))).toBe(false);
    expect(isEntryEligible(e, baseCharacter(), baseWorld({ time_of_day: 'night' }))).toBe(true);
  });

  it('time_of_day acepta todas las horas si el campo se omite', () => {
    const e = entry({ conditions: {} });
    for (const t of ['dawn', 'day', 'dusk', 'night'] as const) {
      expect(isEntryEligible(e, baseCharacter(), baseWorld({ time_of_day: t }))).toBe(true);
    }
  });

  it('weather con "any" actúa como comodín', () => {
    const e = entry({ conditions: { weather: ['any'] } });
    for (const w of ['clear', 'fog', 'storm', 'snow'] as const) {
      expect(isEntryEligible(e, baseCharacter(), baseWorld({ weather: w }))).toBe(true);
    }
  });

  it('weather sin "any" filtra estrictamente', () => {
    const e = entry({ conditions: { weather: ['fog', 'storm'] } });
    expect(isEntryEligible(e, baseCharacter(), baseWorld({ weather: 'clear' }))).toBe(false);
    expect(isEntryEligible(e, baseCharacter(), baseWorld({ weather: 'fog' }))).toBe(true);
  });

  it('required_flags: todas deben estar activas', () => {
    const e = entry({ conditions: { required_flags: ['quest_a', 'quest_b'] } });
    expect(isEntryEligible(e, baseCharacter(), baseWorld({ flags: { quest_a: true } }))).toBe(false);
    expect(
      isEntryEligible(
        e,
        baseCharacter(),
        baseWorld({ flags: { quest_a: true, quest_b: true } }),
      ),
    ).toBe(true);
  });

  it('forbidden_flags: ninguna debe estar activa', () => {
    const e = entry({ conditions: { forbidden_flags: ['pacto_lobos'] } });
    expect(
      isEntryEligible(e, baseCharacter(), baseWorld({ flags: { pacto_lobos: true } })),
    ).toBe(false);
    expect(isEntryEligible(e, baseCharacter(), baseWorld({ flags: {} }))).toBe(true);
  });
});

describe('filterEligibleEntries', () => {
  it('devuelve solo las entradas elegibles del bioma', () => {
    const table: BiomeTable = {
      biome: 'bosque',
      entries: [
        entry({ id: 'a', biome: 'bosque' }),
        entry({ id: 'b', biome: 'desierto' }),
        entry({ id: 'c', biome: 'bosque', conditions: { min_level: 5 } }),
      ],
    };
    const result = filterEligibleEntries(table, baseCharacter(), baseWorld()).map((e) => e.id);
    expect(result).toEqual(['a']);
  });
});

// -----------------------------------------------------------------------------
// computeEffectiveWeight / computeWeightedEntries
// -----------------------------------------------------------------------------

describe('computeEffectiveWeight', () => {
  it('sin modificadores devuelve el peso base', () => {
    const e = entry({ weight: 25 });
    expect(computeEffectiveWeight(e, baseWorld())).toBe(25);
  });

  it('aplica multiplicadores acumulativos cuando las condiciones pasan', () => {
    const e = entry({
      weight: 10,
      weight_modifiers: [
        { if_time_of_day: ['night'], factor: 2 },
        { if_weather: ['storm'], factor: 1.5 },
      ],
    });
    const ws = baseWorld({ time_of_day: 'night', weather: 'storm' });
    expect(computeEffectiveWeight(e, ws)).toBe(10 * 2 * 1.5);
  });

  it('ignora modificadores cuya condición no se cumple', () => {
    const e = entry({
      weight: 10,
      weight_modifiers: [{ if_time_of_day: ['night'], factor: 5 }],
    });
    expect(computeEffectiveWeight(e, baseWorld({ time_of_day: 'day' }))).toBe(10);
  });

  it('respeta if_min_reputation / if_max_reputation', () => {
    const e = entry({
      weight: 10,
      weight_modifiers: [{ if_min_reputation: { faction_id: 'gremio', value: 5 }, factor: 0.5 }],
    });
    expect(computeEffectiveWeight(e, baseWorld({ faction_reputation: { gremio: 3 } }))).toBe(10);
    expect(computeEffectiveWeight(e, baseWorld({ faction_reputation: { gremio: 5 } }))).toBe(5);
  });

  it('respeta if_min_luck / if_max_luck', () => {
    const e = entry({
      weight: 10,
      weight_modifiers: [{ if_min_luck: 3, factor: 2 }],
    });
    expect(computeEffectiveWeight(e, baseWorld({ luck: 2 }))).toBe(10);
    expect(computeEffectiveWeight(e, baseWorld({ luck: 3 }))).toBe(20);
  });

  it('clamp a 0 si el peso resultante es negativo', () => {
    const e = entry({
      weight: 10,
      weight_modifiers: [{ if_time_of_day: ['day'], factor: -1 }],
    });
    expect(computeEffectiveWeight(e, baseWorld())).toBe(0);
  });
});

describe('computeWeightedEntries', () => {
  it('mapea cada entrada a su peso efectivo', () => {
    const entries = [entry({ id: 'a', weight: 5 }), entry({ id: 'b', weight: 15 })];
    const result = computeWeightedEntries(entries, baseWorld());
    expect(result).toEqual([
      { entry: entries[0], weight: 5 },
      { entry: entries[1], weight: 15 },
    ]);
  });
});

// -----------------------------------------------------------------------------
// selectByD20
// -----------------------------------------------------------------------------

describe('selectByD20', () => {
  it('devuelve null si no hay peso > 0', () => {
    expect(selectByD20([], 10)).toBeNull();
    expect(selectByD20([{ entry: entry(), weight: 0 }], 10)).toBeNull();
  });

  it('rechaza die fuera de [1, 20] o no entero', () => {
    const w: WeightedEntry[] = [{ entry: entry(), weight: 10 }];
    expect(() => selectByD20(w, 0)).toThrow(RangeError);
    expect(() => selectByD20(w, 21)).toThrow(RangeError);
    expect(() => selectByD20(w, 10.5)).toThrow(RangeError);
    expect(() => selectByD20(w, NaN)).toThrow(RangeError);
  });

  it('elige siempre la única entrada con peso > 0', () => {
    const e = entry();
    const weighted: WeightedEntry[] = [
      { entry: entry({ id: 'cero' }), weight: 0 },
      { entry: e, weight: 10 },
    ];
    for (let die = 1; die <= 20; die++) {
      expect(selectByD20(weighted, die)).toBe(e);
    }
  });

  it('respeta los rangos proporcionales: 1d20 sobre [10, 30] reparte 5/15', () => {
    // total = 40. cursor = (die - 0.5)/20 * 40 = (die - 0.5) * 2.
    // entry A (peso 10) cubre cursor < 10 → die ≤ 5 (1..5). entry B el resto (6..20).
    const a = entry({ id: 'a' });
    const b = entry({ id: 'b' });
    const weighted: WeightedEntry[] = [
      { entry: a, weight: 10 },
      { entry: b, weight: 30 },
    ];
    const counts = { a: 0, b: 0 };
    for (let die = 1; die <= 20; die++) {
      const result = selectByD20(weighted, die);
      if (result === a) counts.a++;
      else if (result === b) counts.b++;
    }
    expect(counts.a).toBe(5);
    expect(counts.b).toBe(15);
  });
});

// -----------------------------------------------------------------------------
// rollExplorationTick
// -----------------------------------------------------------------------------

describe('rollExplorationTick', () => {
  it('lanza si la tabla del bioma no coincide con el worldState', () => {
    const table: BiomeTable = { biome: 'desierto', entries: [] };
    expect(() =>
      rollExplorationTick(baseWorld(), baseCharacter(), 'step_tile', table, createRng(1)),
    ).toThrow(/bioma/);
  });

  it('devuelve entry=null cuando ninguna entrada es elegible', () => {
    const table: BiomeTable = {
      biome: 'bosque',
      entries: [entry({ conditions: { min_level: 99 } })],
    };
    const result = rollExplorationTick(baseWorld(), baseCharacter(), 'step_tile', table, createRng(1));
    expect(result.entry).toBeNull();
    expect(result.weighted_entries).toHaveLength(0);
  });

  it('marca crítico/pifia en root_roll cuando el d20 sale 20 o 1', () => {
    // Forzamos d20 fijo con un rng controlado.
    const rngOne: Rng = () => 0; // Math.floor(0*20)+1 = 1
    const rngTwenty: Rng = () => 0.999999; // Math.floor(0.999999*20)+1 = 20
    const table: BiomeTable = { biome: 'bosque', entries: [entry({ weight: 10 })] };
    const r1 = rollExplorationTick(baseWorld(), baseCharacter(), 'step_tile', table, rngOne);
    const r20 = rollExplorationTick(baseWorld(), baseCharacter(), 'step_tile', table, rngTwenty);
    expect(r1.root_roll).toMatchObject({ die: 1, fumble: true, critical: false });
    expect(r20.root_roll).toMatchObject({ die: 20, fumble: false, critical: true });
  });

  it('respeta la distribución de pesos en muestra grande (test estadístico)', () => {
    // Tabla con tres entradas en proporción 1:3:6 → esperamos ~10/30/60%.
    const a = entry({ id: 'a', weight: 10 });
    const b = entry({ id: 'b', weight: 30 });
    const c = entry({ id: 'c', weight: 60 });
    const table: BiomeTable = { biome: 'bosque', entries: [a, b, c] };

    const N = 10_000;
    const rng = createRng(0xbadc0de);
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < N; i++) {
      const ev = rollExplorationTick(baseWorld(), baseCharacter(), 'step_tile', table, rng);
      if (ev.entry !== null) counts[ev.entry.id] = (counts[ev.entry.id] ?? 0) + 1;
    }
    // Tolerancia: 1.5 puntos porcentuales. Con 10k muestras y p=0.1/0.3/0.6,
    // σ máxima ≈ √(10000·0.6·0.4) ≈ 49 → 0.49pp. 1.5pp deja >3σ de margen.
    const ratioA = counts.a! / N;
    const ratioB = counts.b! / N;
    const ratioC = counts.c! / N;
    expect(ratioA).toBeGreaterThan(0.085);
    expect(ratioA).toBeLessThan(0.115);
    expect(ratioB).toBeGreaterThan(0.285);
    expect(ratioB).toBeLessThan(0.315);
    expect(ratioC).toBeGreaterThan(0.585);
    expect(ratioC).toBeLessThan(0.615);
  });

  it('es determinista con el mismo seed', () => {
    const table: BiomeTable = {
      biome: 'bosque',
      entries: [entry({ id: 'a', weight: 10 }), entry({ id: 'b', weight: 30 })],
    };
    const seed = 42;
    const rngA = createRng(seed);
    const rngB = createRng(seed);
    for (let i = 0; i < 50; i++) {
      const a = rollExplorationTick(baseWorld(), baseCharacter(), 'step_tile', table, rngA);
      const b = rollExplorationTick(baseWorld(), baseCharacter(), 'step_tile', table, rngB);
      expect(a.entry?.id).toBe(b.entry?.id);
      expect(a.root_roll).toEqual(b.root_roll);
    }
  });
});

// -----------------------------------------------------------------------------
// resolveEvadeCheck
// -----------------------------------------------------------------------------

// Helper: rng que devuelve una secuencia fija de caras del d20 en orden.
function rngWithDie(...faces: number[]): Rng {
  let i = 0;
  return () => {
    const face = faces[i++ % faces.length];
    if (face === undefined) throw new Error('rngWithDie agotado');
    // Math.floor(rng() * 20) + 1 = face → rng = (face - 1) / 20 + epsilon
    return (face - 1) / 20 + 0.001;
  };
}

describe('resolveEvadeCheck', () => {
  it('rama success: total ≥ difficulty', () => {
    // sigilo=2, die=10 → total=12 ≥ 10
    const result = resolveEvadeCheck('combat', {}, baseEvade(), baseCharacter(), rngWithDie(10));
    expect(result.branch).toBe('success');
    expect(result.outcome.outcome).toBe('skip_event');
  });

  it('rama failure: total < difficulty', () => {
    // sigilo=2, die=5 → total=7 < 10
    const result = resolveEvadeCheck('combat', {}, baseEvade(), baseCharacter(), rngWithDie(5));
    expect(result.branch).toBe('failure');
    expect(result.outcome.outcome).toBe('resolve_normal');
  });

  it('rama critical: die === 20 (siempre, aunque no necesite)', () => {
    const result = resolveEvadeCheck('combat', {}, baseEvade(), baseCharacter(), rngWithDie(20));
    expect(result.branch).toBe('critical');
    expect(result.outcome.outcome).toBe('skip_event_bonus');
  });

  it('rama fumble: die === 1 en tipo con pifia y on_fumble declarado', () => {
    const check = baseEvade({ on_fumble: { outcome: 'stunned_combat' } });
    const result = resolveEvadeCheck('combat', {}, check, baseCharacter(), rngWithDie(1));
    expect(result.branch).toBe('fumble');
    expect(result.outcome.outcome).toBe('stunned_combat');
  });

  it('die===1 en tipo SIN pifia mecánica cae a failure (Hallazgo, POI, etc.)', () => {
    const check = baseEvade({ on_fumble: { outcome: 'no-aplica' } });
    const result = resolveEvadeCheck('discovery', {}, check, baseCharacter(), rngWithDie(1));
    expect(result.branch).toBe('failure');
  });

  it('die===1 con on_fumble=null cae a failure incluso en tipo con pifia', () => {
    // Algunos eventos podrían declarar on_fumble null aunque el tipo lo permita.
    const check = baseEvade({ on_fumble: null });
    const result = resolveEvadeCheck('combat', {}, check, baseCharacter(), rngWithDie(1));
    expect(result.branch).toBe('failure');
  });

  it('opposed=true: lee la dificultad del payload via opposed_stat', () => {
    // Enemigo con percepción 18 → muy difícil esquivar.
    const check = baseEvade({ opposed: true, opposed_stat: 'enemy_perception', difficulty: 0 });
    // sigilo=2, die=10 → total=12 < 18
    const result = resolveEvadeCheck(
      'combat',
      { enemy_perception: 18 },
      check,
      baseCharacter(),
      rngWithDie(10),
    );
    expect(result.branch).toBe('failure');
    expect(result.opposed_resolved).toEqual({
      mode: 'opposed',
      difficulty: 18,
      stat_name: 'enemy_perception',
      stat_value: 18,
    });
  });

  it('opposed_resolved.mode = "fixed" cuando opposed=false', () => {
    const result = resolveEvadeCheck(
      'combat',
      {},
      baseEvade({ opposed: false, difficulty: 12 }),
      baseCharacter(),
      rngWithDie(10),
    );
    expect(result.opposed_resolved).toEqual({ mode: 'fixed', difficulty: 12 });
  });

  it('opposed_resolved.mode = "opposed_fallback" si opposed_stat ausente', () => {
    // opposed=true sin declarar opposed_stat → fallback DIF=10.
    const check = baseEvade({ opposed: true, difficulty: 0 });
    delete (check as { opposed_stat?: string }).opposed_stat;
    const result = resolveEvadeCheck('combat', {}, check, baseCharacter(), rngWithDie(10));
    expect(result.opposed_resolved.mode).toBe('opposed_fallback');
    expect(result.opposed_resolved.difficulty).toBe(10);
    expect(result.opposed_resolved.stat_name).toBeUndefined();
    // sigilo=2, die=10 → total=12 ≥ 10 → success contra el fallback.
    expect(result.branch).toBe('success');
  });

  it('opposed_resolved.mode = "opposed_fallback" si payload no tiene el stat o no es número', () => {
    const check = baseEvade({ opposed: true, opposed_stat: 'no_existe', difficulty: 0 });
    const r1 = resolveEvadeCheck('combat', {}, check, baseCharacter(), rngWithDie(10));
    expect(r1.opposed_resolved).toEqual({
      mode: 'opposed_fallback',
      difficulty: 10,
      stat_name: 'no_existe',
    });
    // Payload con stat presente pero no numérico (typo del autor de la tabla).
    const r2 = resolveEvadeCheck(
      'combat',
      { no_existe: 'alto' },
      check,
      baseCharacter(),
      rngWithDie(10),
    );
    expect(r2.opposed_resolved.mode).toBe('opposed_fallback');
  });

  it('skill ausente del personaje cuenta como valor 0', () => {
    const character = baseCharacter({ skills: {} });
    const check = baseEvade({ skill: 'inexistente', difficulty: 10 });
    // valor 0 + die 9 = 9 < 10 → failure
    const result = resolveEvadeCheck('combat', {}, check, character, rngWithDie(9));
    expect(result.branch).toBe('failure');
  });

  it('trains_skill=true marca trained_skill; false lo deja null', () => {
    const trains = baseEvade({ trains_skill: true });
    const noTrains = baseEvade({ trains_skill: false });
    expect(
      resolveEvadeCheck('combat', {}, trains, baseCharacter(), rngWithDie(10)).trained_skill,
    ).toBe('sigilo');
    expect(
      resolveEvadeCheck('combat', {}, noTrains, baseCharacter(), rngWithDie(10)).trained_skill,
    ).toBeNull();
  });

  it('cascada de trampa: primaria falla → ejecuta fallback_check', () => {
    // Trampa según §4.15.7: Percepción pasiva → si falla, Reflejos activa.
    const fallback = baseEvade({
      skill: 'reflejos',
      difficulty: 10,
      cost: { type: 'action_point', amount: 1 },
      on_success: { outcome: 'esquivada_ultima_hora' },
    });
    const primary = baseEvade({
      skill: 'percepcion',
      difficulty: 15,
      fallback_check: fallback,
    });
    // Personaje sin reflejos pero con percepcion=2.
    // Primaria: sigilo no, percepcion=2, die=5 → total=7 < 15 → failure.
    // Cascada: reflejos=0, die=15 → total=15 ≥ 10 → success.
    const result = resolveEvadeCheck('trap', {}, primary, baseCharacter(), rngWithDie(5, 15));
    expect(result.branch).toBe('failure');
    expect(result.cascade).not.toBeNull();
    expect(result.cascade!.branch).toBe('success');
    expect(result.cascade!.outcome.outcome).toBe('esquivada_ultima_hora');
  });

  it('cascada NO se activa si la primaria tiene éxito', () => {
    const fallback = baseEvade({ skill: 'reflejos' });
    const primary = baseEvade({ fallback_check: fallback });
    // sigilo=2, die=10 → total=12 ≥ 10 → success
    const result = resolveEvadeCheck('trap', {}, primary, baseCharacter(), rngWithDie(10, 1));
    expect(result.branch).toBe('success');
    expect(result.cascade).toBeNull();
  });

  it('cascada se activa también con pifia primaria en trampa', () => {
    const fallback = baseEvade({ skill: 'reflejos', difficulty: 5 });
    const primary = baseEvade({
      skill: 'percepcion',
      on_fumble: { outcome: 'sangrado' },
      fallback_check: fallback,
    });
    // Primaria: die=1 → fumble (trap aplica pifia). Cascada: die=10 → reflejos=0+10=10 ≥ 5 → success.
    const result = resolveEvadeCheck('trap', {}, primary, baseCharacter(), rngWithDie(1, 10));
    expect(result.branch).toBe('fumble');
    expect(result.cascade?.branch).toBe('success');
  });
});

// -----------------------------------------------------------------------------
// Cobertura del catálogo §4.15.3 (los 10 tipos)
// -----------------------------------------------------------------------------

describe('catálogo de tipos §4.15.3', () => {
  // Smoke test: para cada tipo del catálogo, una entrada válida pasa por el
  // pipeline sin romper. Lo que importa de cada tipo se prueba arriba; aquí
  // garantizamos que el switch implícito del módulo no se olvida de ninguno.
  const allTypes = [
    'combat',
    'npc',
    'discovery',
    'trap',
    'environmental',
    'poi',
    'narrative',
    'ambush',
    'shelter',
    'nothing',
  ] as const;

  it('los 10 tipos del catálogo se aceptan en una entrada válida', () => {
    for (const t of allTypes) {
      const table: BiomeTable = { biome: 'bosque', entries: [entry({ type: t, weight: 10 })] };
      const ev = rollExplorationTick(baseWorld(), baseCharacter(), 'step_tile', table, createRng(1));
      expect(ev.entry?.type).toBe(t);
    }
  });

  it('pifia aplica solo a combat, ambush y trap', () => {
    const check = baseEvade({ on_fumble: { outcome: 'pifiado' } });
    const fumblesIn = ['combat', 'ambush', 'trap'] as const;
    const noFumblesIn = ['npc', 'discovery', 'environmental', 'poi', 'narrative', 'shelter', 'nothing'] as const;
    for (const t of fumblesIn) {
      const r = resolveEvadeCheck(t, {}, check, baseCharacter(), rngWithDie(1));
      expect(r.branch).toBe('fumble');
    }
    for (const t of noFumblesIn) {
      const r = resolveEvadeCheck(t, {}, check, baseCharacter(), rngWithDie(1));
      expect(r.branch).toBe('failure');
    }
  });
});
