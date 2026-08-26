// Generador del andamiaje de autoría de los 720 POIs (decisión #92, sub-paso 4f.0).
//
// Qué hace: lee el dataset canónico del mundo (src/data/world/*.json) y escribe
// un archivo Markdown por grid en contenido/pois/<region>/<gridId>.md con los 4
// POIs de ese grid y sus 20 slots de banda vacíos, listos para escribir a mano.
//
// Por qué Markdown y no JSON: #92 declara 14.400 entradas escritas a mano y la
// propia biblia dice que editarlas en JSON sería trabajo tirado. El Markdown es
// la herramienta de autoría disponible hoy, sin esperar al Campo de pruebas
// (§4.14). El compilador a JSON se escribe en 4f.0/4f, cuando el schema cierre.
//
// GARANTÍA: NUNCA sobrescribe un archivo existente. Si el archivo ya está, lo
// salta y lo cuenta como "conservado". Regenerar es seguro con contenido dentro.
// Para forzar el rehacer de un grid concreto, bórralo a mano y vuelve a correr.
//
// Uso:
//   node scripts/gen-poi-scaffold.mjs           genera lo que falta
//   node scripts/gen-poi-scaffold.mjs --dry     enseña qué haría, no escribe
//
// La plantilla canónica y la explicación de cada campo viven en
// contenido/plantillas/PLANTILLA-POI.md. Si cambias el formato aquí, cambia
// también ese documento: son el mismo contrato escrito dos veces.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const pois = read('src/data/world/pois.json');
const grids = read('src/data/world/grids.json');
const regiones = read('src/data/world/regiones.json');

// El Hogar (#85). Se marca en el andamiaje porque su POI no se escribe como los
// otros 719: es campamento, no tirada.
const HOME_POI_ID = 'sur-001-poi-1';

// Las 8 bandas de §9.5. `slots` es el reparto fijo e idéntico en los 720: la
// plantilla es la que garantiza el balance, no la disciplina del autor.
// `tipo` es el tipo de evento por defecto del catálogo de §4.15.3; el autor lo
// cambia si su entrada pide otro. `alt` son los tipos que la banda admite sin
// romper el balance.
const BANDAS = [
  { slots: [1], nombre: 'peligro real', tipo: 'trap', alt: 'ambush' },
  { slots: [2, 3], nombre: 'combate menor', tipo: 'combat', alt: 'ambush' },
  { slots: [4, 5, 6, 7, 8, 9, 10, 11, 12], nombre: 'color del mundo', tipo: 'environmental', alt: 'nothing, narrative' },
  { slots: [13, 14, 15], nombre: 'encuentro neutral', tipo: 'npc', alt: 'shelter' },
  { slots: [16, 17], nombre: 'recurso', tipo: 'discovery', alt: '—' },
  { slots: [18], nombre: 'pista / rumor', tipo: 'discovery', alt: 'poi, narrative' },
  { slots: [19], nombre: 'oportunidad', tipo: 'npc', alt: 'shelter, discovery' },
  { slots: [20], nombre: 'legendario', tipo: 'narrative', alt: 'discovery, combat' },
];

// slot → { banda, tipo, alt }
const PORCarril = new Map();
for (const b of BANDAS) for (const s of b.slots) PORCarril.set(s, b);

const regionById = new Map(regiones.map((r) => [r.id, r]));
const poisByGrid = new Map();
for (const p of pois) {
  if (!poisByGrid.has(p.gridId)) poisByGrid.set(p.gridId, []);
  poisByGrid.get(p.gridId).push(p);
}

function bloqueEntrada(slot) {
  const b = PORCarril.get(slot);
  const n = String(slot).padStart(2, '0');
  return [
    `### ${n} · ${b.nombre}`,
    `tipo: ${b.tipo}`,
    `texto:`,
    `mecanica:`,
    `tirada:`,
    ``,
  ].join('\n');
}

function bloquePOI(poi) {
  const esHogar = poi.id === HOME_POI_ID;
  const cabecera = [
    `## ${poi.id}`,
    `arquetipo: ${poi.archetype}`,
    `curado: ${poi.hasCuratedSlot ? 'si' : 'no'}`,
    `posicion: ${poi.position.x},${poi.position.y}`,
    `nombre:`,
    `descripcion:`,
  ];

  if (esHogar) {
    cabecera.push(
      ``,
      `> ESTE POI ES EL HOGAR (#85, #87). Hoy no se resuelve por tirada d20: al`,
      `> entrar abre el campamento. Sus 20 slots están igualmente aquí — la cuenta`,
      `> canónica de #92 es 720 × 20 = 14.400 — pero son los últimos que escribir:`,
      `> hasta que alguien decida que el Hogar tira, no se leen nunca.`,
    );
  }

  const partes = [cabecera.join('\n'), ''];

  if (poi.hasCuratedSlot) {
    partes.push(
      [
        `### 00 · curado`,
        `> Evento fijo que PUENTEA el d20 la primera vez que se entra (§9.3).`,
        `> No sustituye a los 20 slots: este POI lleva las dos cosas.`,
        `titulo:`,
        `texto:`,
        `mecanica:`,
        `agotable: si`,
        ``,
      ].join('\n'),
    );
  }

  for (let s = 1; s <= 20; s++) partes.push(bloqueEntrada(s));

  return partes.join('\n');
}

function archivoGrid(grid) {
  const region = regionById.get(grid.regionId);
  const misPois = poisByGrid.get(grid.id) ?? [];
  const cabecera = [
    `# ${grid.id} — ${region ? region.displayName : grid.regionId}`,
    ``,
    `> Andamiaje generado por \`scripts/gen-poi-scaffold.mjs\`. El texto lo escribe Bazalo a mano (#77).`,
    `> Formato y significado de cada campo: \`contenido/plantillas/PLANTILLA-POI.md\`.`,
    `>`,
    `> Región: ${grid.regionId} · Posición del grid: ${grid.position.x},${grid.position.y}`,
    `> POIs: ${misPois.length} · Curados: ${misPois.filter((p) => p.hasCuratedSlot).length}`,
    `>`,
    `> Un campo vacío NO es un error: el motor cae en cascada a la tabla del`,
    `> arquetipo y luego a la genérica de la banda (§9.5). Se puede jugar con este`,
    `> archivo entero en blanco. Cada línea que escribas sustituye a su fallback.`,
    ``,
  ].join('\n');

  return cabecera + '\n' + misPois.map(bloquePOI).join('\n') + '\n';
}

let escritos = 0;
let conservados = 0;

for (const grid of grids) {
  const dir = join(ROOT, 'contenido', 'pois', grid.regionId);
  const ruta = join(dir, `${grid.id}.md`);

  if (existsSync(ruta)) {
    conservados++;
    continue;
  }
  if (DRY) {
    escritos++;
    continue;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(ruta, archivoGrid(grid), 'utf8');
  escritos++;
}

const verbo = DRY ? 'se escribirían' : 'escritos';
console.log(`${verbo}: ${escritos} archivos · conservados (ya existían): ${conservados}`);
console.log(`total grids: ${grids.length} · total POIs: ${pois.length}`);
