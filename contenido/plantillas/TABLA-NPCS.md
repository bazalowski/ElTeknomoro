# Tabla de NPCs

> **Compila a `src/data/npcs.ts`** (no existe todavía). Columnas = campos reales
> de `Npc` y `DialogTopic` en `src/rules/dialog.ts` (módulo SAGRADO, ya escrito).
>
> El sistema de diálogo es **lista de temas estilo Morrowind**, no árbol ramificado:
> hasta 6 temas visibles, tirada social visible antes de comprometerse, comercio en
> pantalla dedicada. Eso condiciona cómo se escribe un NPC: no escribes una
> conversación, escribes **una persona con temas**.
>
> Sin cupo fijado en §3.1. Propuesta de dirección: **12-15 NPCs con nombre** para
> v1, de los cuales 3-4 comerciantes. Más que eso no cabe en 80 POIs curados.

---

## Ficha de NPC

| Campo | Qué es |
|---|---|
| `id` | slug en español: `mercader_del_paso` |
| `nombre` | lo que ve el jugador |
| `retrato` | id de `src/data/portraits.ts` (12 hues generados; no hay arte a mano en fase 1) |
| `faccion` | id de `TABLA-FACCIONES.md`, o vacío si es independiente |
| `comercia` | id de inventario de tienda, o vacío |
| `dónde` | POI concreto (`sur-004-poi-2`) o "ambulante" si sale por la banda 13-15 |

## Los NPCs

| id | nombre | rol | facción | comercia | dónde | por qué existe (una frase) |
|---|---|---|---|---|---|---|
| | | | | | `sur-001-poi-1` (Hogar) | el primer NPC del juego, si es que hay uno |
| | | mercader | | sí | | |
| | | mercader ambulante | | sí | banda 13-15 | tu respuesta 40: "puede que tengas la suerte de encontrarte con alguno vagando" |
| | | herrero | | sí | | |
| | | mentor / sabio | | | | pregunta 203 del cuestionario v1 |
| | | paria | | | | pregunta 204 |
| | | líder facción 1 | | | | pregunta 191 |
| | | líder facción 2 | | | | pregunta 191 |
| | | líder facción 3 | | | | pregunta 191 |
| | | Teknomoro | | | | los Teknomoros son el motor de la historia (tu respuesta 7). ¿Se les ve? |
| | | antagonista | | | | pregunta 202 |
| | | | | | | |

## Temas de un NPC

Se escribe una tabla como esta **por NPC**. Máximo 6 temas visibles a la vez.

| tema | etiqueta (lo que se lee en el menú) | respuesta | condición | tirada social | efecto |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |

- **condición**: reputación mínima con su facción, flag narrativo, POI visitado,
  nivel. Vacío = siempre visible.
- **tirada social**: `persuasion` contra dificultad. Se enseña ANTES de elegir el
  tema: el jugador decide sabiendo lo que arriesga.
- **efecto**: sube/baja reputación, da item, pone flag, revela POI, abre comercio.

---

## Tres decisiones de lore que bloquean esta tabla

- **¿Cómo habla la gente aquí?** §10.3 fija la voz `npc` como "coloquial, con
  sesgo, posible mentira" y exige un **párrafo-muestra por voz antes de la
  escritura masiva**, guardado en `references/lore-voces.md`. Ese archivo no
  existe todavía. Es literalmente el paso previo a rellenar esta tabla, y también
  a las 14.400 entradas de POI.
- **¿Los NPCs saben lo que pasó?** Tu respuesta 14 dice que fueron ~4.000 años
  "pero no todos los personajes del mundo conocen este dato". Eso significa que
  cada NPC necesita una postura: qué cree que pasó. Es la contradicción explícita
  de §10.6 convertida en gente.
- **¿Hay idioma común?** La pregunta 59 (¿se sigue entendiendo la escritura
  antigua?) sigue sin responder y decide si un NPC puede leerte una inscripción.
