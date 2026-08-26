// Tests del compilador de contenido (sub-paso 4f.0, decisiones #92 y #97).
//
// El compilador vive en `scripts/compile-contenido.mjs` y corre en node pelado,
// sin toolchain de TypeScript. Estos tests lo invocan como subproceso contra
// árboles de fixture en un temp, que es como se usa de verdad: así se prueban
// también el código de salida y el texto de los errores, que es la mitad del
// valor de la herramienta — un compilador que falla mudo no sirve de nada.
//
// La otra mitad de la validación vive aquí y no puede vivir en el script: la
// **integridad referencial**. Que una entrada diga `enemigo lobo_del_bosque`
// sólo es correcto si ese id existe en el catálogo, y los catálogos son TS.
// Es el mismo contrato de "sin loot huérfano" de `src/data/enemies.test.ts`.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ENEMIES_BY_ID } from '../data/enemies.ts';
import { ITEMS_BY_ID } from '../data/items.ts';
import { SKILLS } from '../data/skills.ts';

const COMPILADOR = join(process.cwd(), 'scripts', 'compile-contenido.mjs');

let raiz: string;
let salida: string;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'teknomoro-contenido-'));
  salida = mkdtempSync(join(tmpdir(), 'teknomoro-salida-'));
  mkdirSync(join(raiz, 'pois', 'sur'), { recursive: true });
  mkdirSync(join(raiz, 'fallbacks'), { recursive: true });
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
  rmSync(salida, { recursive: true, force: true });
});

function escribeGrid(nombre: string, cuerpo: string): void {
  writeFileSync(join(raiz, 'pois', 'sur', `${nombre}.md`), cuerpo, 'utf8');
}

interface Resultado {
  ok: boolean;
  salida: string;
}

function compila(): Resultado {
  try {
    const stdout = execFileSync(
      'node',
      [COMPILADOR, '--root', raiz, '--out', salida],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return { ok: true, salida: stdout };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, salida: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

function leeTablas(): Record<string, unknown> {
  return JSON.parse(readFileSync(join(salida, 'poi-tables.json'), 'utf8')) as Record<string, unknown>;
}

// Cabecera mínima de un POI. `slots` se pega detrás.
function poi(id: string, slots: string, arquetipo = 'natural'): string {
  return [
    `## ${id}`,
    `arquetipo: ${arquetipo}`,
    `curado: no`,
    `posicion: 1,1`,
    `nombre:`,
    `descripcion:`,
    ``,
    slots,
  ].join('\n');
}

const slot = (n: number, tipo: string, extra = ''): string =>
  [`### ${String(n).padStart(2, '0')} · banda`, `tipo: ${tipo}`, `texto: Texto de prueba.`, extra, ``].join('\n');

// -----------------------------------------------------------------------------

describe('compilador de contenido — casos felices', () => {
  it('un árbol vacío compila sin error y reporta 0 entradas', () => {
    const r = compila();
    expect(r.ok).toBe(true);
    expect(r.salida).toContain('grids leídos: 0');
  });

  it('un archivo de andamiaje sin rellenar no produce entradas ni errores', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'environmental').replace('texto: Texto de prueba.', 'texto:')));
    const r = compila();
    expect(r.ok).toBe(true);
    const tablas = leeTablas() as { pois: Record<string, { slots: Record<string, unknown> }> };
    expect(Object.keys(tablas.pois['sur-001-poi-1']!.slots)).toHaveLength(0);
  });

  it('compila una entrada con texto y la indexa por su número de slot', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(7, 'environmental')));
    expect(compila().ok).toBe(true);
    const tablas = leeTablas() as {
      pois: Record<string, { slots: Record<string, { type: string; text: string }> }>;
    };
    const entrada = tablas.pois['sur-001-poi-1']!.slots['7']!;
    expect(entrada.type).toBe('environmental');
    expect(entrada.text).toBe('Texto de prueba.');
  });

  it('lee nombre y descripción de la cabecera del POI', () => {
    escribeGrid('sur-001', [
      '## sur-001-poi-1',
      'arquetipo: natural',
      'curado: no',
      'posicion: 1,1',
      'nombre: El Vado Corto',
      'descripcion: Dos frases. Y la segunda.',
      '',
      slot(4, 'environmental'),
    ].join('\n'));
    expect(compila().ok).toBe(true);
    const tablas = leeTablas() as { pois: Record<string, { name: string; description: string }> };
    expect(tablas.pois['sur-001-poi-1']!.name).toBe('El Vado Corto');
    expect(tablas.pois['sur-001-poi-1']!.description).toBe('Dos frases. Y la segunda.');
  });

  it('el bloque curado se compila aparte de los 20 slots', () => {
    escribeGrid('sur-001', [
      '## sur-001-poi-1',
      'arquetipo: ruina',
      'curado: si',
      'posicion: 1,1',
      'nombre:',
      'descripcion:',
      '',
      '### 00 · curado',
      'titulo: Lo que quedó',
      'texto: El texto largo del curado.',
      'mecanica: xp 40',
      'agotable: si',
      '',
      slot(4, 'environmental'),
    ].join('\n'));
    expect(compila().ok).toBe(true);
    const tablas = leeTablas() as {
      pois: Record<string, {
        curated: boolean;
        curatedEntry: { title: string; text: string; exhaustible: boolean } | null;
        slots: Record<string, unknown>;
      }>;
    };
    const p = tablas.pois['sur-001-poi-1']!;
    expect(p.curated).toBe(true);
    expect(p.curatedEntry!.title).toBe('Lo que quedó');
    expect(p.curatedEntry!.exhaustible).toBe(true);
    // El curado NO ocupa uno de los 20: son las dos cosas (§9.3).
    expect(Object.keys(p.slots)).toEqual(['4']);
  });

  it('`agotable: no` se respeta', () => {
    escribeGrid('sur-001', [
      '## sur-001-poi-1', 'arquetipo: ruina', 'curado: si', 'posicion: 1,1', 'nombre:', 'descripcion:', '',
      '### 00 · curado', 'titulo: T', 'texto: X', 'mecanica:', 'agotable: no', '',
    ].join('\n'));
    expect(compila().ok).toBe(true);
    const tablas = leeTablas() as { pois: Record<string, { curatedEntry: { exhaustible: boolean } }> };
    expect(tablas.pois['sur-001-poi-1']!.curatedEntry.exhaustible).toBe(false);
  });

  it('las líneas de comentario `>` del andamiaje no ensucian los campos', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', [
      '### 04 · color del mundo',
      '> Este comentario lo puso el generador y el autor no debería tener que borrarlo.',
      'tipo: environmental',
      'texto: Texto limpio.',
      '',
    ].join('\n')));
    expect(compila().ok).toBe(true);
    const tablas = leeTablas() as { pois: Record<string, { slots: Record<string, { text: string }> }> };
    expect(tablas.pois['sur-001-poi-1']!.slots['4']!.text).toBe('Texto limpio.');
  });

  it('un `texto:` de varias líneas se junta en una sola cadena', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', [
      '### 04 · color del mundo',
      'tipo: environmental',
      'texto: Primera línea',
      '  y su continuación.',
      'mecanica:',
      '',
    ].join('\n')));
    expect(compila().ok).toBe(true);
    const tablas = leeTablas() as { pois: Record<string, { slots: Record<string, { text: string }> }> };
    expect(tablas.pois['sur-001-poi-1']!.slots['4']!.text).toBe('Primera línea y su continuación.');
  });
});

describe('compilador de contenido — gramática de `mecanica`', () => {
  function mecanica(frase: string): Resultado {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'environmental', `mecanica: ${frase}`)));
    return compila();
  }

  function efectos(): readonly Record<string, unknown>[] {
    const tablas = leeTablas() as {
      pois: Record<string, { slots: Record<string, { mechanic: Record<string, unknown>[] }> }>;
    };
    return tablas.pois['sur-001-poi-1']!.slots['4']!.mechanic;
  }

  it('`enemigo <id>` sin multiplicador asume 1', () => {
    expect(mecanica('enemigo lobo_del_bosque').ok).toBe(true);
    expect(efectos()).toEqual([{ kind: 'enemy', id: 'lobo_del_bosque', count: 1 }]);
  });

  it('`enemigo <id> x2` lee el multiplicador', () => {
    expect(mecanica('enemigo lobo_del_bosque x2').ok).toBe(true);
    expect(efectos()).toEqual([{ kind: 'enemy', id: 'lobo_del_bosque', count: 2 }]);
  });

  it('acepta `daño` con eñe y `dano` sin ella', () => {
    expect(mecanica('daño 3').ok).toBe(true);
    expect(efectos()).toEqual([{ kind: 'damage', amount: 3 }]);
    expect(mecanica('dano 3').ok).toBe(true);
    expect(efectos()).toEqual([{ kind: 'damage', amount: 3 }]);
  });

  it('encadena efectos con `+`', () => {
    expect(mecanica('oro 12 + estado poisoned + xp 25').ok).toBe(true);
    expect(efectos()).toEqual([
      { kind: 'gold', amount: 12 },
      { kind: 'status', id: 'poisoned' },
      { kind: 'xp', amount: 25 },
    ]);
  });

  it('una mecánica vacía deja el campo a null, no a lista vacía', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'environmental', 'mecanica:')));
    expect(compila().ok).toBe(true);
    const tablas = leeTablas() as { pois: Record<string, { slots: Record<string, { mechanic: unknown }> }> };
    expect(tablas.pois['sur-001-poi-1']!.slots['4']!.mechanic).toBeNull();
  });

  it('rechaza un verbo desconocido y lo nombra en el error', () => {
    const r = mecanica('teletransporta sur-002');
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('verbo desconocido "teletransporta"');
  });

  it('rechaza un status que no está en el catálogo de #78', () => {
    const r = mecanica('estado ardiendo');
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('no es un status');
  });

  it('rechaza una cantidad no entera', () => {
    expect(mecanica('oro doce').ok).toBe(false);
  });

  it('rechaza un multiplicador mal escrito', () => {
    const r = mecanica('item diente_de_lobo 2');
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('se escribe "x2"');
  });
});

describe('compilador de contenido — gramática de `tirada`', () => {
  function tirada(frase: string): Resultado {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'environmental', `tirada: ${frase}`)));
    return compila();
  }

  function evade(): Record<string, unknown> | null {
    const tablas = leeTablas() as {
      pois: Record<string, { slots: Record<string, { evade: Record<string, unknown> | null }> }>;
    };
    return tablas.pois['sur-001-poi-1']!.slots['4']!.evade;
  }

  it('`<habilidad> <dificultad>`', () => {
    expect(tirada('percepcion 4').ok).toBe(true);
    expect(evade()).toEqual({ skill: 'percepcion', difficulty: 4, opposed: false, auto: false });
  });

  it('`<habilidad> vs <stat>` marca la tirada como enfrentada', () => {
    expect(tirada('sigilo vs percepcion').ok).toBe(true);
    expect(evade()).toEqual({ skill: 'sigilo', opposed: true, opposed_stat: 'percepcion', auto: false });
  });

  it('el sufijo `auto` se resuelve sin preguntar al jugador', () => {
    expect(tirada('voluntad 3 auto').ok).toBe(true);
    expect(evade()).toMatchObject({ auto: true });
  });

  it('`ninguna` marca la entrada como no evadible', () => {
    expect(tirada('ninguna').ok).toBe(true);
    expect(evade()).toEqual({ none: true });
  });

  it('vacío deja null para que el motor inyecte el default de §4.15.7', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'environmental', 'tirada:')));
    expect(compila().ok).toBe(true);
    expect(evade()).toBeNull();
  });

  it('rechaza una dificultad no numérica', () => {
    expect(tirada('percepcion dificil').ok).toBe(false);
  });

  it('rechaza palabras de más', () => {
    expect(tirada('percepcion 4 auto y algo').ok).toBe(false);
  });
});

describe('compilador de contenido — el balance de §9.5 no se negocia', () => {
  it('rechaza un tipo fuera del catálogo de §4.15.3', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'catastrofe')));
    const r = compila();
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('no está en el catálogo');
  });

  it('rechaza un combate en la banda de color del mundo', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(7, 'combat')));
    const r = compila();
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('no lo admite esta banda');
  });

  it('acepta los tipos alternativos que la banda sí declara', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(1, 'ambush') + slot(20, 'discovery')));
    expect(compila().ok).toBe(true);
  });

  it('rechaza un slot duplicado', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'environmental') + slot(4, 'environmental')));
    const r = compila();
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('duplicado');
  });

  it('rechaza un slot fuera del rango 1-20', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(21, 'narrative')));
    expect(compila().ok).toBe(false);
  });

  it('rechaza un arquetipo desconocido y remite al JSON del mundo', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'environmental'), 'pantano'));
    const r = compila();
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('pois.json');
  });

  it('rechaza mecánica sin texto: sería un efecto que el jugador no ve explicado', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', [
      '### 04 · color del mundo', 'tipo: environmental', 'texto:', 'mecanica: oro 5', '',
    ].join('\n')));
    const r = compila();
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('sin explicación');
  });

  it('no escribe nada cuando hay errores', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(7, 'combat')));
    const r = compila();
    expect(r.ok).toBe(false);
    expect(r.salida).toContain('No se ha escrito nada');
    expect(() => leeTablas()).toThrow();
  });
});

describe('compilador de contenido — cascada de fallbacks (§9.5)', () => {
  it('la tabla de arquetipo se compila indexada por slot', () => {
    writeFileSync(join(raiz, 'fallbacks', 'arquetipo-natural.md'), [
      '### 04 · color del mundo', 'tipo: environmental', 'texto: Genérica de bosque.', '',
    ].join('\n'), 'utf8');
    expect(compila().ok).toBe(true);
    const fb = JSON.parse(readFileSync(join(salida, 'fallbacks.json'), 'utf8')) as {
      archetypes: Record<string, Record<string, { text: string }>>;
    };
    expect(fb.archetypes['natural']!['4']!.text).toBe('Genérica de bosque.');
  });

  it('una banda genérica se expande a todos los slots de su rango', () => {
    writeFileSync(join(raiz, 'fallbacks', 'genericas-por-banda.md'), [
      '## combate menor · d20 2-3',
      '### variante 1', 'tipo: combat', 'texto: Algo hostil.', '',
    ].join('\n'), 'utf8');
    expect(compila().ok).toBe(true);
    const fb = JSON.parse(readFileSync(join(salida, 'fallbacks.json'), 'utf8')) as {
      generic: Record<string, { text: string }[]>;
    };
    // "2-3" cubre los dos slots de la banda con la misma variante.
    expect(fb.generic['2']).toHaveLength(1);
    expect(fb.generic['3']).toHaveLength(1);
    expect(fb.generic['3']![0]!.text).toBe('Algo hostil.');
  });

  it('varias variantes de una banda se acumulan como lista', () => {
    writeFileSync(join(raiz, 'fallbacks', 'genericas-por-banda.md'), [
      '## peligro real · d20 1',
      '### variante 1', 'tipo: trap', 'texto: Una.', '',
      '### variante 2', 'tipo: trap', 'texto: Dos.', '',
      '### variante 3', 'tipo: trap', 'texto: Tres.', '',
    ].join('\n'), 'utf8');
    expect(compila().ok).toBe(true);
    const fb = JSON.parse(readFileSync(join(salida, 'fallbacks.json'), 'utf8')) as {
      generic: Record<string, unknown[]>;
    };
    expect(fb.generic['1']).toHaveLength(3);
  });

  it('la cobertura reportada cuenta el fallback, no sólo lo escrito a mano', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', ''));
    writeFileSync(join(raiz, 'fallbacks', 'genericas-por-banda.md'), [
      '## color del mundo · d20 4-12',
      '### variante 1', 'tipo: environmental', 'texto: Neutra.', '',
    ].join('\n'), 'utf8');
    const r = compila();
    expect(r.ok).toBe(true);
    // 9 de los 20 slots del POI quedan cubiertos por la banda 4-12.
    expect(r.salida).toContain('cobertura jugable: 9 / 20');
  });
});

describe('integridad referencial contra los catálogos reales', () => {
  // Esto es lo que el compilador NO puede validar solo: corre en node pelado y
  // los catálogos son TypeScript. Aquí sí se importan.

  const IDS_ITEM = new Set(Object.keys(ITEMS_BY_ID));
  const IDS_ENEMIGO = new Set(Object.keys(ENEMIES_BY_ID));
  const IDS_SKILL = new Set(SKILLS.map((s) => s.id));

  interface Efecto { kind: string; id?: string }
  interface Entrada { mechanic: Efecto[] | null; evade: { skill?: string } | null }

  function entradasDe(json: string): Entrada[] {
    const datos = JSON.parse(json) as {
      pois?: Record<string, { slots: Record<string, Entrada>; curatedEntry: Entrada | null }>;
    };
    const out: Entrada[] = [];
    for (const p of Object.values(datos.pois ?? {})) {
      out.push(...Object.values(p.slots));
      if (p.curatedEntry !== null) out.push(p.curatedEntry);
    }
    return out;
  }

  it('todo `enemigo <id>` escrito apunta a un enemigo del catálogo', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(2, 'combat', 'mecanica: enemigo lobo_del_bosque')));
    expect(compila().ok).toBe(true);
    for (const entrada of entradasDe(readFileSync(join(salida, 'poi-tables.json'), 'utf8'))) {
      for (const efecto of entrada.mechanic ?? []) {
        if (efecto.kind === 'enemy') expect(IDS_ENEMIGO).toContain(efecto.id);
      }
    }
  });

  it('todo `item <id>` escrito apunta a un item del catálogo', () => {
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(16, 'discovery', 'mecanica: item pocion_curacion_menor x2')));
    expect(compila().ok).toBe(true);
    for (const entrada of entradasDe(readFileSync(join(salida, 'poi-tables.json'), 'utf8'))) {
      for (const efecto of entrada.mechanic ?? []) {
        if (efecto.kind === 'item') expect(IDS_ITEM).toContain(efecto.id);
      }
    }
  });

  it('toda `tirada` escrita apunta a una habilidad del catálogo', () => {
    const habilidad = SKILLS[0]!.id;
    escribeGrid('sur-001', poi('sur-001-poi-1', slot(4, 'environmental', `tirada: ${habilidad} 4`)));
    expect(compila().ok).toBe(true);
    for (const entrada of entradasDe(readFileSync(join(salida, 'poi-tables.json'), 'utf8'))) {
      if (entrada.evade?.skill !== undefined) expect(IDS_SKILL).toContain(entrada.evade.skill);
    }
  });

  it('el árbol real de `contenido/` compila limpio', () => {
    // Guardia de regresión sobre lo que Bazalo tenga escrito hoy. Con el
    // andamiaje en blanco pasa trivialmente; en cuanto se escriba, este test
    // es el que avisa de una errata de gramática sin tener que acordarse de
    // correr el compilador a mano.
    const stdout = execFileSync('node', [COMPILADOR, '--dry'], { encoding: 'utf8' });
    expect(stdout).toContain('grids leídos: 180');
    expect(stdout).toContain('POIs: 720');
  });
});
