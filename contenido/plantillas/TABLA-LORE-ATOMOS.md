# Tabla de átomos de lore

> **Compila a `src/data/lore/`** (largos y medios) y **junto al sistema que los
> consume** (cortos: descripciones de POI, de item, de perk). Schema canónico en
> biblia §10.2.
>
> **Cupo de v1: ~100 átomos seed** — 20 largos + 30 medios + 50 cortos.
> Estimación de la biblia: ~50 horas de escritura, a mano, en lotes (#74).
> Nada de esto se genera con IA (#77).
>
> **No hay códice** (#73). Un átomo que no tenga dónde salir en el flujo de juego
> no existe: la columna `dónde sale` no es opcional.

---

## Antes de escribir el primer átomo: `references/lore-voces.md`

§10.3 lo exige y **no existe todavía**. Un párrafo-muestra por cada una de las 4
voces, fijado antes de la escritura masiva, contra el que se valida todo lo demás:

| Voz | Registro | Párrafo-muestra |
|---|---|---|
| `cronista` | narrador externo, distante, semi-formal. Autoritativo pero no omnisciente | ❌ por escribir |
| `npc` | personaje vivo. Coloquial, con sesgo, **posible mentira** | ❌ por escribir |
| `objeto` | inscripción, marca grabada, descripción de ítem. Lacónica | ❌ por escribir |
| `ambiente` | observación del entorno, sin narrador. Sensorial | ❌ por escribir |

Es el prerrequisito real de las 14.400 entradas de POI, no solo de los 100 átomos:
la `descripcion` de cada POI es un átomo corto de voz `ambiente`, y las 9 entradas
de "color del mundo" de cada POI también. **Cuatro párrafos ahora ahorran una
reescritura de miles de líneas después.**

---

## Los 20 largos

Párrafos de varias frases, voz `cronista` predominante.

| id | tema | voz | dónde sale | tags | contradice a |
|---|---|---|---|---|---|
| | la Caída | cronista | | `caida` | |
| | los años oscuros | cronista | | `caida` | |
| | los Teknomoros | | | `teknomoro` | |
| | los minerales cargados | | | `mineral` | |
| | el 98% que murió | | | `caida` | |
| | | | | | |

*(15 filas más)*

## Los 30 medios

1-2 frases con peso, mezcla de las 4 voces.

| id | tema | voz | dónde sale | tags | contradice a |
|---|---|---|---|---|---|
| | | | | | |

*(29 filas más)*

## Los 50 cortos

Frase única. Descripciones de POI, de item, de perk. **Son los más baratos y los
que más se leen.**

| id | tema | voz | dónde sale | tags |
|---|---|---|---|---|
| | | objeto | descripción de `daga` | |
| | | objeto | descripción de `diente_de_lobo` | |
| | | ambiente | POI curado de `sur-001` | |
| | | | | |

*(46 filas más)*

---

## Contradicciones explícitas (5-10 pares)

§10.6: dos átomos de **voces distintas** que dan versiones incompatibles del mismo
hecho. El jugador las descubre jugando y decide (o no) cuál se cree. Se marcan
apuntándose entre sí con `relatedAtoms` + tag compartido `contradiccion:<tema>`.

| par | átomo A (voz) | átomo B (voz) | sobre qué | quién miente, si alguien |
|---|---|---|---|---|
| 1 | | | la causa de la Caída | |
| 2 | | | cuánto tiempo pasó | |
| 3 | | | qué son los Teknomoros | |
| 4 | | | | |
| 5 | | | | |

Tu material ya trae dos contradicciones servidas y no hace falta inventarlas:

- **Respuesta 14**: pasaron ~4.000 años "pero no todos los personajes del mundo
  conocen este dato". Un `cronista` que da la cifra y un `npc` que da otra es el
  par 2 hecho.
- **Respuestas 13 y 15**: la causa real fue tormenta solar + cataclismos, pero
  "el mundo ha recurrido a sus propios dioses creados, sus deidades, sus
  teorías". La versión física y la versión religiosa del mismo suceso son el par 1.

---

## Dónde puede salir un átomo (§10.1)

Si la columna `dónde sale` no cae en una de estas, el átomo no llega al jugador:

- Descripción de POI al entrar (720 sitios).
- Entradas de "color del mundo" de la tabla d20 (9 de cada 20, 6.480 sitios).
- Resultado del 18 (pista/rumor) y del 20 (legendario).
- Lápida del PJ caído (ya implementada).
- Banner narrativo de evento.
- Copy de item, perk o habilidad al descubrirlo.
- Diálogo con NPC.
