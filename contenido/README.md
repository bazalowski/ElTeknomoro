# `contenido/` — capa de autoría de El Teknomoro

Aquí se **escribe** el contenido del juego. En `src/data/` es donde el motor lo
**lee**. Entre las dos hay un compilador que todavía no existe (se cierra en 4f.0).

Esta capa existe por una razón concreta: la decisión #92 pide 14.400 entradas de
POI escritas a mano, y la propia biblia declara como deuda que *"las 14.400
entradas de #92 no se editan a mano en JSON: hace falta herramienta de autoría"*.
El Campo de pruebas (§4.14) es esa herramienta, pero está a varios hitos de
distancia. Texto plano en el repo es lo que hay hoy, y es suficiente: se escribe
sin esperar a nadie, se diffea, se revisa y se compila.

---

## Mapa

```
contenido/
├── PLAN-DE-ESCRITURA.md         ← en qué orden atacar todo esto. Empieza aquí.
├── plantillas/
│   ├── PLANTILLA-POI.md         ← formato de las 14.400 entradas. Léelo primero.
│   ├── TABLA-EQUIPO.md          ← armas y armaduras      → src/data/items.ts
│   ├── TABLA-OBJETOS.md         ← consumibles, materiales, recetas → src/data/items.ts
│   ├── TABLA-CRIATURAS.md       ← bestiario y loot       → src/data/enemies.ts
│   ├── TABLA-NPCS.md            ← NPCs y temas de diálogo → src/data/npcs.ts (por crear)
│   ├── TABLA-MINERALES.md       ← minerales y aleaciones (sistema abierto por ti)
│   ├── TABLA-FACCIONES.md       ← 3 facciones + cultos   → src/data/factions.ts (por crear)
│   └── TABLA-LORE-ATOMOS.md     ← los ~100 átomos de §10 → src/data/lore/ (por crear)
├── fallbacks/
│   ├── arquetipo-natural.md     ← cubre 424 POIs
│   ├── arquetipo-ruina.md       ← cubre 207 POIs
│   ├── arquetipo-asentamiento.md← cubre  75 POIs
│   ├── arquetipo-arcano.md      ← cubre  14 POIs
│   └── genericas-por-banda.md   ← cubre los 720. Nunca falla.
└── pois/
    ├── centro/  (50 archivos · 200 POIs)
    ├── norte/   (35 archivos · 140 POIs)
    ├── sur/     (35 archivos · 140 POIs)
    ├── este/    (30 archivos · 120 POIs)
    └── oeste/   (30 archivos · 120 POIs)
```

180 archivos de grid × 4 POIs × 20 slots = **14.400 entradas**. Más 80 bloques
curados. Está todo generado y en blanco.

---

## La regla que hace esto llevadero

**Vacío no es roto.** La cascada de §9.5 resuelve entrada propia del POI → tabla
del arquetipo → genérica de la banda. Puedes jugar el juego entero con los 180
archivos en blanco. Cada línea que escribes sustituye a su fallback y nada más.

Esto significa que **no hay que terminar nada**. No hay estado "incompleto" que
bloquee un hito, ni un archivo que haya que cerrar antes de pasar al siguiente.

---

## Por dónde empezar (orden de máximo retorno)

*Versión corta. El razonamiento, los números y las estimaciones de horas están en
[`PLAN-DE-ESCRITURA.md`](PLAN-DE-ESCRITURA.md).*

1. **`references/lore-voces.md`** — cuatro párrafos, uno por voz (§10.3). No está
   escrito y es prerrequisito de todo lo demás: la mitad de las 14.400 entradas
   son texto de voz `ambiente`. Cuatro párrafos ahora evitan reescribir miles
   de líneas después.
2. **`fallbacks/genericas-por-banda.md`** — 24 entradas que hacen jugables los 720
   POIs. Es el mejor ratio esfuerzo/cobertura del proyecto entero.
3. **Un POI piloto completo**, los 20 slots de uno solo. Es el entregable literal
   del sub-paso 4f.0: valida el formato en una tarde en vez de descubrir el fallo
   con 500 escritos.
4. **Las 4 tablas de arquetipo** — 80 entradas más, y los 720 POIs pasan de
   genéricos a tener carácter según lo que sean.
5. **`sur-001` y sus vecinos** — el grid de inicio. Es lo que todo jugador ve en
   sus primeros veinte minutos, en todas las runs.
6. **Los 80 curados**, el contenido de mayor valor por entrada.
7. **El resto por región**, dejando el Centro para el final: es la región de más
   grids y la única con función dramática todavía sin cerrar (#82).

Las tablas de catálogo (`plantillas/TABLA-*.md`) se rellenan en paralelo, cuando el
lore te dé material. No compiten con los POIs: se alimentan del mismo trabajo.

---

## Regenerar el andamiaje

```bash
node scripts/gen-poi-scaffold.mjs        # crea sólo lo que falte
node scripts/gen-poi-scaffold.mjs --dry  # dice qué haría, sin tocar nada
```

**Nunca sobrescribe un archivo existente.** Es seguro correrlo con contenido
escrito dentro. Si añades o cambias POIs en `src/data/world/pois.json`, corres el
generador y aparecen los archivos nuevos sin tocar los viejos.

---

## Estado

| Pieza | Estado |
|---|---|
| Andamiaje de los 720 POIs | ✅ generado, en blanco |
| Formato de entrada | 🟡 **propuesta**, se ratifica en 4f.0 |
| Tablas de fallback | ✅ generadas, en blanco |
| Tablas de catálogo | ✅ plantillas listas, en blanco |
| Compilador `contenido/` → `src/data/` | ❌ 4f.0 |
| Tirada cableada en pantalla | ❌ 4f |
| `references/lore-voces.md` | ❌ y es el primer paso |
