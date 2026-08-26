// Compilador de la capa de autoría (sub-paso 4f.0, decisiones #92 y #97).
//
// Traduce lo que se escribe a mano en `contenido/` al JSON que lee el motor:
//
//   contenido/pois/<region>/<gridId>.md   ← lo escribe Bazalo
//   contenido/fallbacks/*.md              ← lo escribe Bazalo
//             ↓  este script
//   src/data/exploration/*.json           ← lo lee el motor
//
// El autor nunca escribe JSON y nunca escribe un payload. Escribe frases cortas
// (`mecanica: oro 12 + estado poisoned`) y este compilador las traduce.
//
// QUÉ VALIDA Y QUÉ NO. Aquí se valida todo lo que se puede saber leyendo sólo
// `contenido/`: bandas correctas, tipos del catálogo de §4.15.3, gramática de
// `mecanica` y de `tirada`, duplicados, slots fuera de rango. Lo que NO se
// valida aquí es la integridad referencial (que `lobo_del_bosque` exista de
// verdad): eso vive en `src/dev/contenido.test.ts`, que sí puede importar los
// catálogos de TypeScript. La separación es deliberada — este script corre en
// node pelado, sin toolchain de TS.
//
// FALLA RUIDOSAMENTE. Un error de gramática aborta la compilación entera con
// el archivo, la línea y el texto que no supo leer. Es el mismo contrato de
// "sin loot huérfano" que ya valida `src/data/enemies.test.ts`.
//
// Uso:
//   node scripts/compile-contenido.mjs           compila a src/data/exploration/
//   node scripts/compile-contenido.mjs --dry     valida y reporta, no escribe
//   node scripts/compile-contenido.mjs --stats   añade el mapa de cobertura
//
// Formato de entrada: `contenido/plantillas/PLANTILLA-POI.md`.
// Reparto de bandas: biblia §9.5. Si esto y la biblia se contradicen, manda la
// biblia.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const STATS = process.argv.includes('--stats');

// `--root <dir>` reapunta el árbol de contenido y `--out <dir>` la salida.
// Existen para que los tests puedan compilar un árbol de fixtures en un temp
// sin tocar `contenido/`, y de paso permiten compilar una rama de contenido
// aparte sin pisar la del repo.
function opcion(nombre, porDefecto) {
  const i = process.argv.indexOf(nombre);
  if (i === -1 || process.argv[i + 1] === undefined) return porDefecto;
  const valor = process.argv[i + 1];
  return valor.startsWith('/') ? valor : join(process.cwd(), valor);
}

const CONTENIDO = opcion('--root', join(ROOT, 'contenido'));
const SALIDA = opcion('--out', join(ROOT, 'src', 'data', 'exploration'));

// -----------------------------------------------------------------------------
// Contratos del formato
// -----------------------------------------------------------------------------

// Los 10 tipos de evento de §4.15.3. Es el enum `EventType` de
// `src/rules/exploration.ts`; si crece allí, crece aquí.
const TIPOS = new Set([
  'combat', 'npc', 'discovery', 'trap', 'environmental',
  'poi', 'narrative', 'ambush', 'shelter', 'nothing',
]);

// Reparto de bandas de §9.5, idéntico en los 720 POIs. `permitidos` es el
// conjunto de tipos que la banda acepta sin romper el balance: el default más
// las alternativas que la plantilla declara.
const BANDAS = [
  { slots: [1], nombre: 'peligro real', permitidos: ['trap', 'ambush'] },
  { slots: [2, 3], nombre: 'combate menor', permitidos: ['combat', 'ambush'] },
  {
    slots: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    nombre: 'color del mundo',
    permitidos: ['environmental', 'nothing', 'narrative'],
  },
  { slots: [13, 14, 15], nombre: 'encuentro neutral', permitidos: ['npc', 'shelter'] },
  { slots: [16, 17], nombre: 'recurso', permitidos: ['discovery'] },
  { slots: [18], nombre: 'pista / rumor', permitidos: ['discovery', 'poi', 'narrative'] },
  { slots: [19], nombre: 'oportunidad', permitidos: ['npc', 'shelter', 'discovery'] },
  { slots: [20], nombre: 'legendario', permitidos: ['narrative', 'discovery', 'combat'] },
];

const BANDA_POR_SLOT = new Map();
for (const b of BANDAS) for (const s of b.slots) BANDA_POR_SLOT.set(s, b);

// Los 4 statuses de #78. Cerrado en v1; si el catálogo crece, crece aquí.
const ESTADOS = new Set(['bleeding', 'poisoned', 'stunned', 'dodging']);

const ARQUETIPOS = new Set(['natural', 'ruina', 'asentamiento', 'arcano']);

// -----------------------------------------------------------------------------
// Errores
// -----------------------------------------------------------------------------

const errores = [];

function error(archivo, linea, mensaje) {
  errores.push({ archivo, linea, mensaje });
}

// -----------------------------------------------------------------------------
// Gramática de `mecanica`
// -----------------------------------------------------------------------------

// Traduce una frase de autor a un efecto declarativo. Las formas están en
// PLANTILLA-POI.md §5.1 y se cierran aquí contra lo que de verdad se escriba.
//
//   enemigo lobo_del_bosque          → { kind: 'enemy', id, count: 1 }
//   enemigo lobo_del_bosque x2       → { kind: 'enemy', id, count: 2 }
//   daño 3 / cura 2 / oro 12 / xp 25 → { kind: 'damage'|'heal'|'gold'|'xp', amount }
//   item diente_de_lobo x2           → { kind: 'item', id, count }
//   estado bleeding                  → { kind: 'status', id }
//   revela sur-016-poi-3             → { kind: 'reveal_poi', id }
//   flag viajero_audaz               → { kind: 'flag', id }
//
// Se encadenan con ` + `. Vacío devuelve null (la entrada es sólo texto).
function parseMecanica(bruto, archivo, linea) {
  const texto = bruto.trim();
  if (texto === '') return null;

  const efectos = [];
  for (const trozo of texto.split('+')) {
    const t = trozo.trim();
    if (t === '') continue;
    const efecto = parseEfecto(t, archivo, linea);
    if (efecto !== null) efectos.push(efecto);
  }
  return efectos.length === 0 ? null : efectos;
}

const ID_VALIDO = /^[a-z0-9_-]+$/;

function parseEfecto(t, archivo, linea) {
  const partes = t.split(/\s+/);
  const verbo = partes[0];

  // Verbos con cantidad simple: `daño 3`.
  const CANTIDAD = { 'daño': 'damage', 'dano': 'damage', cura: 'heal', oro: 'gold', xp: 'xp' };
  if (Object.hasOwn(CANTIDAD, verbo)) {
    const n = Number(partes[1]);
    if (partes.length !== 2 || !Number.isInteger(n) || n <= 0) {
      error(archivo, linea, `\`${t}\`: "${verbo}" espera un entero positivo. Ejemplo: "${verbo} 3".`);
      return null;
    }
    return { kind: CANTIDAD[verbo], amount: n };
  }

  // Verbos con id y multiplicador opcional: `item diente_de_lobo x2`.
  const CON_ID = { enemigo: 'enemy', item: 'item' };
  if (Object.hasOwn(CON_ID, verbo)) {
    const id = partes[1];
    if (id === undefined || !ID_VALIDO.test(id)) {
      error(archivo, linea, `\`${t}\`: "${verbo}" espera un id en snake_case. Ejemplo: "${verbo} lobo_del_bosque".`);
      return null;
    }
    let count = 1;
    if (partes.length === 3) {
      const m = /^x(\d+)$/.exec(partes[2]);
      if (m === null || Number(m[1]) <= 0) {
        error(archivo, linea, `\`${t}\`: el multiplicador se escribe "x2", no "${partes[2]}".`);
        return null;
      }
      count = Number(m[1]);
    } else if (partes.length !== 2) {
      error(archivo, linea, `\`${t}\`: sobran palabras. Forma válida: "${verbo} <id>" o "${verbo} <id> x2".`);
      return null;
    }
    return { kind: CON_ID[verbo], id, count };
  }

  // Verbos con id pelado.
  const SOLO_ID = { estado: 'status', revela: 'reveal_poi', flag: 'flag' };
  if (Object.hasOwn(SOLO_ID, verbo)) {
    const id = partes[1];
    if (partes.length !== 2 || id === undefined || !ID_VALIDO.test(id)) {
      error(archivo, linea, `\`${t}\`: "${verbo}" espera exactamente un id.`);
      return null;
    }
    if (verbo === 'estado' && !ESTADOS.has(id)) {
      error(archivo, linea, `\`${t}\`: "${id}" no es un status. Catálogo (#78): ${[...ESTADOS].join(', ')}.`);
      return null;
    }
    return { kind: SOLO_ID[verbo], id };
  }

  error(
    archivo, linea,
    `\`${t}\`: verbo desconocido "${verbo}". Verbos válidos: enemigo, item, daño, cura, oro, xp, estado, revela, flag.`,
  );
  return null;
}

// -----------------------------------------------------------------------------
// Gramática de `tirada`
// -----------------------------------------------------------------------------

// Override de la tirada reactiva. Vacío = el default de §4.15.7 para el tipo,
// que inyecta el motor: la decisión #24 obliga a que toda entrada declare una,
// y escribir 14.400 a mano es imposible.
//
//   percepcion 4              → { skill, difficulty: 4, opposed: false, auto: false }
//   sigilo vs percepcion      → { skill, opposed: true, opposed_stat }
//   voluntad 3 auto           → { ..., auto: true }
//   ninguna                   → { none: true }
function parseTirada(bruto, archivo, linea) {
  const texto = bruto.trim();
  if (texto === '') return null;
  if (texto === 'ninguna') return { none: true };

  const partes = texto.split(/\s+/);
  const skill = partes[0];
  if (skill === undefined || !ID_VALIDO.test(skill)) {
    error(archivo, linea, `tirada \`${texto}\`: se esperaba una habilidad en snake_case.`);
    return null;
  }

  if (partes[1] === 'vs') {
    const contra = partes[2];
    if (partes.length !== 3 || contra === undefined || !ID_VALIDO.test(contra)) {
      error(archivo, linea, `tirada \`${texto}\`: la forma enfrentada es "<habilidad> vs <stat>".`);
      return null;
    }
    return { skill, opposed: true, opposed_stat: contra, auto: false };
  }

  const dificultad = Number(partes[1]);
  if (!Number.isInteger(dificultad) || dificultad <= 0) {
    error(archivo, linea, `tirada \`${texto}\`: se esperaba una dificultad entera positiva.`);
    return null;
  }
  const auto = partes[2] === 'auto';
  if (partes.length > 3 || (partes.length === 3 && !auto)) {
    error(archivo, linea, `tirada \`${texto}\`: sobran palabras. Formas válidas en PLANTILLA-POI.md §5.2.`);
    return null;
  }
  return { skill, difficulty: dificultad, opposed: false, auto };
}

// -----------------------------------------------------------------------------
// Parser de bloques
// -----------------------------------------------------------------------------

// Lee `campo: valor` acumulando hasta el siguiente campo o cabecera. Las líneas
// que empiezan por `>` son comentarios de andamiaje y se descartan: el autor
// escribe alrededor de ellas y no debería tener que borrarlas.
function parseCampos(lineas, desde, hasta, archivo) {
  const campos = new Map();
  let actual = null;

  for (let i = desde; i < hasta; i++) {
    const linea = lineas[i];
    if (linea === undefined) continue;
    const limpia = linea.trimEnd();
    if (limpia.trimStart().startsWith('>')) continue;

    const m = /^([a-zA-Zñáéíóú]+):\s?(.*)$/.exec(limpia);
    if (m !== null) {
      actual = { nombre: m[1].toLowerCase(), linea: i + 1 };
      campos.set(actual.nombre, { valor: m[2] ?? '', linea: i + 1 });
      continue;
    }
    // Continuación de un campo multilínea (un `texto:` largo).
    if (actual !== null && limpia.trim() !== '') {
      const previo = campos.get(actual.nombre);
      previo.valor = previo.valor === '' ? limpia.trim() : `${previo.valor} ${limpia.trim()}`;
    }
  }
  return campos;
}

const campo = (campos, nombre) => (campos.get(nombre)?.valor ?? '').trim();
const lineaDe = (campos, nombre) => campos.get(nombre)?.linea ?? 0;

// Compila un bloque de entrada (`### NN · banda`) al shape del motor. Devuelve
// null si la entrada está vacía: un slot sin texto NO es un error, es un hueco
// que la cascada de §9.5 rellena.
function compilaEntrada(campos, slot, archivo, contexto) {
  const texto = campo(campos, 'texto');
  const tipo = campo(campos, 'tipo');
  const mecanicaBruta = campo(campos, 'mecanica');
  const tiradaBruta = campo(campos, 'tirada');

  if (texto === '') {
    // Un slot vacío con mecánica escrita es casi seguro un descuido: el jugador
    // recibiría un efecto sin leer por qué.
    if (mecanicaBruta !== '') {
      error(archivo, lineaDe(campos, 'mecanica'),
        `${contexto} slot ${slot}: hay \`mecanica\` pero no \`texto\`. El jugador vería un efecto sin explicación.`);
    }
    return null;
  }

  const banda = BANDA_POR_SLOT.get(slot);
  if (!TIPOS.has(tipo)) {
    error(archivo, lineaDe(campos, 'tipo'),
      `${contexto} slot ${slot}: tipo "${tipo}" no está en el catálogo de §4.15.3.`);
  } else if (banda !== undefined && !banda.permitidos.includes(tipo)) {
    error(archivo, lineaDe(campos, 'tipo'),
      `${contexto} slot ${slot} (${banda.nombre}): tipo "${tipo}" no lo admite esta banda. Válidos: ${banda.permitidos.join(', ')}.`);
  }

  return {
    slot,
    type: tipo,
    text: texto,
    mechanic: parseMecanica(mecanicaBruta, archivo, lineaDe(campos, 'mecanica')),
    evade: parseTirada(tiradaBruta, archivo, lineaDe(campos, 'tirada')),
  };
}

// Localiza los `### NN · banda` de un tramo y devuelve sus rangos de línea.
function localizaEntradas(lineas, desde, hasta) {
  const marcas = [];
  for (let i = desde; i < hasta; i++) {
    const m = /^###\s+(\d{2})\s*·/.exec(lineas[i] ?? '');
    if (m !== null) marcas.push({ slot: Number(m[1]), desde: i + 1 });
  }
  for (let k = 0; k < marcas.length; k++) {
    marcas[k].hasta = k + 1 < marcas.length ? marcas[k + 1].desde - 1 : hasta;
  }
  return marcas;
}

// -----------------------------------------------------------------------------
// Archivos de grid
// -----------------------------------------------------------------------------

function compilaGrid(ruta, relativa) {
  const lineas = readFileSync(ruta, 'utf8').split('\n');

  // Cada `## <poiId>` abre un POI y se cierra donde empieza el siguiente.
  const marcas = [];
  for (let i = 0; i < lineas.length; i++) {
    const m = /^##\s+([a-z]+-\d+-poi-\d+)\s*$/.exec(lineas[i] ?? '');
    if (m !== null) marcas.push({ id: m[1], desde: i + 1 });
  }
  for (let k = 0; k < marcas.length; k++) {
    marcas[k].hasta = k + 1 < marcas.length ? marcas[k + 1].desde - 1 : lineas.length;
  }

  const pois = [];
  for (const marca of marcas) {
    const entradas = localizaEntradas(lineas, marca.desde, marca.hasta);
    const finCabecera = entradas.length > 0 ? entradas[0].desde - 1 : marca.hasta;
    const cabecera = parseCampos(lineas, marca.desde, finCabecera, relativa);

    const arquetipo = campo(cabecera, 'arquetipo');
    if (!ARQUETIPOS.has(arquetipo)) {
      error(relativa, lineaDe(cabecera, 'arquetipo'),
        `${marca.id}: arquetipo "${arquetipo}" desconocido. Se arregla en src/data/world/pois.json y se regenera, no aquí.`);
    }

    const poi = {
      poiId: marca.id,
      archetype: arquetipo,
      curated: campo(cabecera, 'curado') === 'si',
      name: campo(cabecera, 'nombre') || null,
      description: campo(cabecera, 'descripcion') || null,
      curatedEntry: null,
      slots: {},
    };

    const vistos = new Set();
    for (const e of entradas) {
      const campos = parseCampos(lineas, e.desde, e.hasta, relativa);

      if (e.slot === 0) {
        const texto = campo(campos, 'texto');
        if (texto !== '') {
          poi.curatedEntry = {
            title: campo(campos, 'titulo') || null,
            text: texto,
            mechanic: parseMecanica(campo(campos, 'mecanica'), relativa, lineaDe(campos, 'mecanica')),
            exhaustible: campo(campos, 'agotable') !== 'no',
          };
        }
        continue;
      }

      if (e.slot < 1 || e.slot > 20) {
        error(relativa, e.desde, `${marca.id}: slot ${e.slot} fuera del rango 1-20.`);
        continue;
      }
      if (vistos.has(e.slot)) {
        error(relativa, e.desde, `${marca.id}: slot ${e.slot} duplicado.`);
        continue;
      }
      vistos.add(e.slot);

      const compilada = compilaEntrada(campos, e.slot, relativa, marca.id);
      if (compilada !== null) poi.slots[String(e.slot)] = compilada;
    }

    if (poi.curated && poi.curatedEntry === null && Object.keys(poi.slots).length > 0) {
      // No es error: un POI curado puede tener slots escritos y el curado aún no.
    }
    pois.push(poi);
  }

  return pois;
}

// -----------------------------------------------------------------------------
// Fallbacks
// -----------------------------------------------------------------------------

function compilaFallbackArquetipo(arquetipo) {
  const relativa = `fallbacks/arquetipo-${arquetipo}.md`;
  const ruta = join(CONTENIDO, relativa);
  if (!existsSync(ruta)) return {};

  const lineas = readFileSync(ruta, 'utf8').split('\n');
  const entradas = localizaEntradas(lineas, 0, lineas.length);
  const salida = {};

  for (const e of entradas) {
    const campos = parseCampos(lineas, e.desde, e.hasta, relativa);
    const compilada = compilaEntrada(campos, e.slot, relativa, `arquetipo ${arquetipo}`);
    if (compilada !== null) salida[String(e.slot)] = compilada;
  }
  return salida;
}

// Las genéricas se agrupan por banda con N variantes, y el motor elige entre
// ellas al azar para que un jugador con cero contenido escrito no lea tres
// veces la misma línea seguida.
function compilaGenericas() {
  const relativa = 'fallbacks/genericas-por-banda.md';
  const ruta = join(CONTENIDO, relativa);
  if (!existsSync(ruta)) return {};

  const lineas = readFileSync(ruta, 'utf8').split('\n');
  const salida = {};
  let slotsActuales = null;

  const marcas = [];
  for (let i = 0; i < lineas.length; i++) {
    const banda = /^##\s+(.+?)\s*·\s*d20\s+(.+)$/.exec(lineas[i] ?? '');
    if (banda !== null) {
      marcas.push({ kind: 'banda', rango: banda[2], desde: i });
      continue;
    }
    if (/^###\s+variante\s+\d+/i.test(lineas[i] ?? '')) {
      marcas.push({ kind: 'variante', desde: i + 1 });
    }
  }
  for (let k = 0; k < marcas.length; k++) {
    marcas[k].hasta = k + 1 < marcas.length ? marcas[k + 1].desde : lineas.length;
  }

  for (const marca of marcas) {
    if (marca.kind === 'banda') {
      // "1", "2-3", "4-12" → lista de slots.
      const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(marca.rango.trim());
      if (m === null) {
        error(relativa, marca.desde + 1, `no supe leer el rango de d20 "${marca.rango}".`);
        slotsActuales = null;
        continue;
      }
      const a = Number(m[1]);
      const b = m[2] === undefined ? a : Number(m[2]);
      slotsActuales = [];
      for (let s = a; s <= b; s++) slotsActuales.push(s);
      continue;
    }

    if (slotsActuales === null) continue;
    const campos = parseCampos(lineas, marca.desde, marca.hasta, relativa);
    // La variante se valida contra el primer slot de su banda: todos comparten
    // los mismos tipos permitidos, por construcción de §9.5.
    const compilada = compilaEntrada(campos, slotsActuales[0], relativa, 'genéricas');
    if (compilada === null) continue;

    for (const s of slotsActuales) {
      const clave = String(s);
      if (salida[clave] === undefined) salida[clave] = [];
      salida[clave].push({ ...compilada, slot: s });
    }
  }
  return salida;
}

// -----------------------------------------------------------------------------
// Ejecución
// -----------------------------------------------------------------------------

const gridsCompilados = [];
const regiones = existsSync(join(CONTENIDO, 'pois'))
  ? readdirSync(join(CONTENIDO, 'pois'), { withFileTypes: true }).filter((d) => d.isDirectory())
  : [];

for (const region of regiones) {
  const dir = join(CONTENIDO, 'pois', region.name);
  for (const archivo of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const relativa = `pois/${region.name}/${archivo}`;
    gridsCompilados.push({
      gridId: archivo.replace(/\.md$/, ''),
      region: region.name,
      pois: compilaGrid(join(dir, archivo), relativa),
    });
  }
}

const fallbacks = {
  archetypes: Object.fromEntries([...ARQUETIPOS].map((a) => [a, compilaFallbackArquetipo(a)])),
  generic: compilaGenericas(),
};

// --- Reporte de errores antes de escribir nada ---

if (errores.length > 0) {
  console.error(`\n✗ ${errores.length} error(es) de contenido. No se ha escrito nada.\n`);
  for (const e of errores.slice(0, 40)) {
    console.error(`  ${e.archivo}:${e.linea}  ${e.mensaje}`);
  }
  if (errores.length > 40) console.error(`  … y ${errores.length - 40} más.`);
  console.error('');
  process.exit(1);
}

// --- Cobertura ---

let poisTotales = 0;
let poisConNombre = 0;
let entradasEscritas = 0;
let curadosEscritos = 0;
for (const g of gridsCompilados) {
  for (const p of g.pois) {
    poisTotales++;
    if (p.name !== null) poisConNombre++;
    entradasEscritas += Object.keys(p.slots).length;
    if (p.curatedEntry !== null) curadosEscritos++;
  }
}
const entradasArquetipo = Object.values(fallbacks.archetypes).reduce((n, t) => n + Object.keys(t).length, 0);
const variantesGenericas = Object.values(fallbacks.generic).reduce((n, v) => n + v.length, 0);

// La cobertura real del jugador: un slot está cubierto si lo llena la entrada
// propia, la del arquetipo o una genérica. Es el número honesto de #92.
const slotsTotales = poisTotales * 20;
let slotsCubiertos = 0;
for (const g of gridsCompilados) {
  for (const p of g.pois) {
    const tabla = fallbacks.archetypes[p.archetype] ?? {};
    for (let s = 1; s <= 20; s++) {
      const clave = String(s);
      if (p.slots[clave] !== undefined) { slotsCubiertos++; continue; }
      if (tabla[clave] !== undefined) { slotsCubiertos++; continue; }
      if ((fallbacks.generic[clave] ?? []).length > 0) slotsCubiertos++;
    }
  }
}

const pct = (n, d) => (d === 0 ? '0.0' : ((n / d) * 100).toFixed(1));

console.log(`\ngrids leídos: ${gridsCompilados.length} · POIs: ${poisTotales}`);
console.log(`entradas propias escritas: ${entradasEscritas} / ${slotsTotales} (${pct(entradasEscritas, slotsTotales)}%)`);
console.log(`nombres de POI escritos:   ${poisConNombre} / ${poisTotales}`);
console.log(`eventos curados escritos:  ${curadosEscritos}`);
console.log(`fallback de arquetipo:     ${entradasArquetipo} / 80 entradas`);
console.log(`genéricas por banda:       ${variantesGenericas} variantes`);
console.log(`\ncobertura jugable: ${slotsCubiertos} / ${slotsTotales} slots (${pct(slotsCubiertos, slotsTotales)}%)`);
if (slotsCubiertos < slotsTotales) {
  console.log(`  ↑ los slots sin cubrir hoy caen en hueco: el motor no tiene nada que enseñar.`);
  console.log(`    Rellenar genericas-por-banda.md los cubre TODOS de golpe (§9.5).`);
}

if (STATS) {
  console.log(`\npor región:`);
  const porRegion = new Map();
  for (const g of gridsCompilados) {
    const acc = porRegion.get(g.region) ?? { grids: 0, escritas: 0 };
    acc.grids++;
    for (const p of g.pois) acc.escritas += Object.keys(p.slots).length;
    porRegion.set(g.region, acc);
  }
  for (const [region, acc] of [...porRegion].sort()) {
    console.log(`  ${region.padEnd(8)} ${String(acc.grids).padStart(3)} grids · ${acc.escritas} entradas escritas`);
  }
}

if (DRY) {
  console.log(`\n--dry: validado sin escribir.\n`);
  process.exit(0);
}

// --- Escritura ---

mkdirSync(SALIDA, { recursive: true });

const pois = {};
for (const g of gridsCompilados) {
  for (const p of g.pois) pois[p.poiId] = p;
}

const meta = {
  generatedBy: 'scripts/compile-contenido.mjs',
  decision: '#92 (tabla d20 por POI) · #97 (sub-paso 4f.0)',
  bands: BANDAS.map((b) => ({ slots: b.slots, name: b.nombre, types: b.permitidos })),
  coverage: {
    pois: poisTotales,
    slots: slotsTotales,
    ownEntries: entradasEscritas,
    covered: slotsCubiertos,
  },
};

writeFileSync(join(SALIDA, 'poi-tables.json'), JSON.stringify({ meta, pois }, null, 2) + '\n', 'utf8');
writeFileSync(join(SALIDA, 'fallbacks.json'), JSON.stringify(fallbacks, null, 2) + '\n', 'utf8');

console.log(`\n✓ escrito ${SALIDA}/poi-tables.json y fallbacks.json\n`);
