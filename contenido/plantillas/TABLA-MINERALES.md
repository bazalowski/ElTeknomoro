# Tabla de minerales y materiales

> **Sistema abierto por ti en la respuesta 27 del cuestionario de lore:**
>
> > *"Los minerales. Debido a la evolución, adquirieron poderes ampliados.
> > Ej: Una espada forjada con una aleación de diamante y volcanita añadiría
> > +resistencia +daño de fuego."*
>
> Y reforzado en la 38: los minerales son **el recurso más valioso del mundo en
> valor de supervivencia**, y en la 15: las descargas solares cargaron los
> minerales de la tierra con poderes que podrían llamarse mágicos.
>
> **Esto no está en la biblia todavía.** Es lore tuyo que abre un sistema
> mecánico, y es de los pocos sitios donde el lore genera regla en vez de
> decorarla. Antes de rellenar la tabla hay que cerrar una bifurcación.

---

## La bifurcación que hay que cerrar primero

Tu ejemplo admite dos lecturas incompatibles, y dan catálogos y código distintos:

**Lectura A — el mineral es un ingrediente.** "Espada de volcanita" es un item
del catálogo con su stat-line escrita a mano. El mineral vive en el lore y en la
receta, no en el motor.
· Coste: bajo. Cabe en las 8 recetas y en los 20 items de §3.1. Cero código nuevo.
· Techo: bajo. No hay combinatoria; cada aleación que quieras es un item más del
cupo de 20.

**Lectura B — el mineral es una capa de modificación.** Existe un arma base y una
tabla de materiales que le aplican modificadores al forjarla. `ItemStats` crece
con tipos de daño elemental y el crafteo pasa a producir variantes.
· Coste: alto. Toca `rules/inventory.ts` (SAGRADO), `rules/crafting.ts`, el
combate (daño elemental no existe hoy: `resolveAttack` no conoce tipos de daño)
y el balance entero.
· Techo: alto. Es un sistema de verdad, con profundidad de build.
· Aviso: roza el tropo prohibido nº3 de §11, "crafteo-spreadsheet". La frontera
está en el número de materiales: 5 son un sistema, 40 son una hoja de cálculo.

**Recomendación de dirección: lectura A para v1, tabla escrita como si fuera B.**
Rellenas los minerales con sus propiedades igualmente (son lore, y alimentan el
color del mundo de los 720 POIs), pero v1 los entrega como items concretos. Si el
juego pide profundidad de crafteo en v1.1, la tabla ya está escrita y solo hay que
cablearla. Escribir el lore no cuesta scope; cablear el sistema sí.

---

## Minerales

| id | nombre | rareza | dónde aparece | propiedad mecánica | propiedad narrativa | quién lo trabaja |
|---|---|---|---|---|---|---|
| | Volcanita | | | +daño de fuego | | |
| | Diamante | | | +resistencia | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |

- **rareza**: usa la escala de items (`common` … `legendary`) para que el día que
  se compilen a `Item` no haya traducción.
- **dónde aparece**: región, bioma o arquetipo de POI. Esto es lo que conecta la
  tabla con la banda 16-17 (recurso) de los 720 POIs: **si un mineral no tiene un
  sitio donde salir, no existe en el juego**.
- **propiedad mecánica**: en lectura A es la stat del item resultante; en lectura B
  es el modificador. Escríbela en lenguaje llano.
- **propiedad narrativa**: para qué lo usa la gente, qué se dice de él, quién lo
  teme. Esto es material directo para átomos de lore de voz `objeto` (§10.3).

## Aleaciones

| id | nombre | mineral A | mineral B | resultado | quién sabe hacerla |
|---|---|---|---|---|---|
| | | diamante | volcanita | +resistencia, +daño de fuego | |
| | | | | | |

---

## Lo que esta tabla arrastra

- **Daño elemental no existe en el motor.** `rules/combat.ts` es SAGRADO (#75) y
  resuelve daño como número plano. "+daño de fuego" no tiene dónde aterrizar hoy.
  En lectura A se resuelve como más daño plano y el fuego es narrativo; en lectura
  B hay que abrir el motor, y eso es una decisión con número propio en la biblia.
- **Los minerales son la economía.** Tu respuesta 38 los pone como recurso más
  valioso: eso los convierte en la moneda real del mundo por encima del oro. Está
  en el Bloque 26 del cuestionario v2 (economía), y decide qué vende un mercader.
- **La Zona Cero (Centro) es el sitio.** Tu respuesta 35 dice que allí hay
  tecnología del pasado con riesgo inmenso, y #82 dejó su función dramática
  diferida a fase 2. Los minerales son el candidato natural a ser esa función.
