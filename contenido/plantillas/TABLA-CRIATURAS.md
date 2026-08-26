# Tabla de criaturas — bestiario y loot

> **Compila a `src/data/enemies.ts`.** Columnas = campos reales de `Enemy` en
> `src/rules/combat.ts` (módulo SAGRADO) y de `LootTable` en `enemies.ts`.
>
> **Cupo de v1: 15 enemigos con stat-line y loot tabulado** (§3.1 elemento 4).
> Hoy el catálogo tiene **uno**.
>
> **REGLA SAGRADA DEL PROCESO:** ninguna stat-line entra en código sin simulación.
> No se acepta "creo que tiene poco HP"; se acepta "simulé 60.000 combates con
> HP 16 y la victoria queda en 33,4%". El formato canónico vive en
> `simulaciones/*.md` + `*.sim.ts`. Esta tabla es donde **propones**; el `.sim.ts`
> es donde se **valida**.

---

## Cómo se lee una stat-line

| Campo | Qué es | Rango sano hoy |
|---|---|---|
| `nivel` | Nivel del enemigo. Filtra encuentros por nivel del PJ. | 1-50 |
| `pool` | Dados de d6 que tira al atacar. Impacta con 4+. | 3-12 |
| `DEF` | Umbral: éxitos que el PJ necesita para impactarle. `ceil(DEF/3)` (#46). | 4-12 |
| `daño` | Daño base si impacta. | 1-8 |
| `iniciativa` | Base pasiva; se le suma 1d20 (#41). | 0-10 |
| `HP` | Puntos de vida. | 8-60 |
| `IA` | `agresivo` (siempre ataca) / `evasor` (alterna) / `cauteloso` (defiende herido) / `toxico` (envenena una vez, luego ataca). Catálogo cerrado en #78/#79. | — |

## Bestiario

| id | nombre | nivel | pool | DEF | daño | inic. | HP | IA | bioma | arquetipo de POI | simulado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `lobo_del_bosque` | Lobo del Bosque | 1 | — | — | — | — | — | agresivo | — | natural | ✅ `simulaciones/lobo-v0.1.md` (720.000 combates) |
| | | 1 | | | | | | | | | ❌ |
| | | 1 | | | | | | | | | ❌ |
| | | 2 | | | | | | | | | ❌ |
| | | 2 | | | | | | | | | ❌ |
| | | 3 | | | | | | | | | ❌ |
| | | 3 | | | | | | | | | ❌ |
| | | 4 | | | | | | | | | ❌ |
| | | 4 | | | | | | | | | ❌ |
| | | 5 | | | | | | | | | ❌ |
| | | 5 | | | | | | | | | ❌ |
| | | 6 | | | | | | | | | ❌ |
| | | 7 | | | | | | | | | ❌ |
| | | 8 | | | | | | | | | ❌ |
| | | — | | | | | | | | | ❌ — ¿jefe? ¿algo del Centro? |

Los valores del lobo están a propósito en blanco: **no los copies de aquí**, están
en `src/data/enemies.ts` y son la única stat-line verdadera del juego.

## Tablas de loot

Una fila por drop. `probabilidad` ∈ [0,1]. `min ≤ max`. **Todo `item_id` tiene que
existir en `TABLA-OBJETOS.md` / `TABLA-EQUIPO.md`**: `enemies.test.ts` falla si hay
loot huérfano.

| enemigo | tipo | item_id | min | max | probabilidad |
|---|---|---|---|---|---|
| `lobo_del_bosque` | item | `diente_de_lobo` | — | — | — |
| `lobo_del_bosque` | item | `pocion_curacion_menor` | — | — | — |
| | oro | — | | | |
| | | | | | |

---

## Lo que el lore tiene que decidir antes de que esto se rellene

Recogido en el Bloque 24 del cuestionario v2 (fauna y flora):

- **¿Qué es una criatura aquí?** Tu marco dice mutaciones + naturaleza vencedora.
  ¿El bestiario es *fauna real mutada* (lobo, jabalí, corvo), *vegetación hostil*
  (§11: "bosque vivo hostil"), *humanos degradados*, o los tres repartidos?
- **La vegetación hostil no tiene stat-line todavía.** Es el rasgo más distintivo
  del mundo según #47 y §11, y el catálogo no tiene una sola planta. Si el bosque
  ataca, ataca con qué pool y con qué DEF.
- **¿Hay criaturas arcanas/demoníacas?** #47 dice que lo arcano es raro y
  reverencial: si el 20% del bestiario es demoníaco, deja de serlo.
- **15 enemigos para 5 regiones** son 3 por región. ¿Reparto por región, por bioma,
  por nivel, o compartidos con reskin? El reskin es barato y honesto si el lore lo
  sostiene ("el mismo animal, distinto de comer en cada sitio").
