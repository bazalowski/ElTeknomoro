# Tabla de objetos — consumibles, materiales y misceláneos

> **Compila a `src/data/items.ts`** (`category: 'consumable' | 'material' |
> 'recipe_book' | 'misc'`). Todo lo que no se equipa.
>
> **Cupo de v1: 20 items en total** contando `TABLA-EQUIPO.md` (§3.1 elemento 5).
> **8 recetas de crafteo** (§3.1 y §11: el crafteo es ritual menor, no minijuego;
> el "crafteo-spreadsheet" es tropo prohibido).

---

## Consumibles

La ración es el consumible estructural del juego: §9.7 la exige para acampar y
sin ella el PJ acampa con penalización de HP. Es el único item del que depende
una vía de muerte.

| id | nombre | rareza | efecto | apilable | peso | dónde se obtiene | notas |
|---|---|---|---|---|---|---|---|
| `pocion_curacion_menor` | Poción de curación menor | common | cura HP | 5 | 0,5 | loot del lobo | **YA EN CÓDIGO.** |
| | Ración | common | permite acampar sin penalización (§9.7) | | | | **FALTA Y ES CRÍTICA**: §9.7 la da por existente y el catálogo no la tiene |
| | | | | | | | |
| | | | antídoto / cura `poisoned` | | | | los 4 statuses de #78 son `bleeding`, `poisoned`, `stunned`, `dodging` |
| | | | cura `bleeding` | | | | |

## Materiales de crafteo

| id | nombre | rareza | de qué sale | usado en receta | peso | notas |
|---|---|---|---|---|---|---|
| `diente_de_lobo` | Diente de Lobo | common | loot del lobo | | 0,1 | **YA EN CÓDIGO.** Hoy es trofeo sin receta que lo consuma. |
| | | | | | | |
| | | | | | | |

## Libros de receta y misceláneos

| id | nombre | rareza | qué hace | notas |
|---|---|---|---|---|
| | | | enseña receta X | `category: 'recipe_book'` |
| | | | | item de salvación (#65): evita UNA muerte y se gasta. Raro por diseño. |

---

## Recetas (cupo: 8)

| id | nombre | entrada | salida éxito | salida crítico | salida fallo | habilidad | dificultad | estación |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |
| | | | | | | | | |

`rules/crafting.ts` ya soporta outputs ramificados (éxito / crítico / fallo),
descubrimiento por combinación, lote ×10 y encadenado ×3. La tabla solo tiene que
declararlos.

---

## Dos huecos que esta tabla deja a la vista

1. **No existe la Ración.** §9.7 cablea acampar contra ella y §9.8 cobra "1 ración
   + 2 acciones" por fast travel. Dos sistemas del hito actual dependen de un item
   que el catálogo no tiene. Es el primer item que hay que escribir.
2. **`diente_de_lobo` no lo consume ninguna receta.** Es loot huérfano por el otro
   lado: no es un item inexistente, es un item sin destino. Se cierra cuando entren
   las 8 recetas.
