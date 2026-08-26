# Tabla de equipo — armas y armaduras

> **Compila a `src/data/items.ts`** (`category: 'weapon' | 'armor'`). Las columnas
> son los campos reales de `Item` e `ItemStats` en `src/rules/inventory.ts`: lo
> que rellenes aquí entra en código sin traducción.
>
> **Cupo de v1: 20 items en total** entre este archivo y `TABLA-OBJETOS.md`
> (biblia §3.1 elemento 5). Aviso de contradicción: la cabecera de
> `src/data/items.ts` habla de "~50 items". Manda §3.1 hasta que se decida otra
> cosa; si quieres los 50, es una decisión de scope con número propio.
>
> **Números provisionales.** #61 (esqueleto > contenido > pulido) y §3.1 dicen que
> el catálogo se calibra en H6. Escribe la stat-line que te parezca honesta; el
> balance fino sale de simulación, no de esta tabla (regla sagrada del proceso).

---

## Reglas duras que la tabla debe cumplir

Están validadas por `src/data/items.test.ts`. Si las rompes, el test falla:

1. **Todo item con `durabilidad` tiene `apilable = 1`.** Los objetos únicos no se
   apilan (regla de `rules/inventory.ts`).
2. **Todo item con `slot` tiene un slot del set fijo**: `head`, `torso`, `hands`,
   `main_hand`, `off_hand`, `accessory`.
3. **Toda arma declara `daño`, `atributo` y `habilidad`.** El pool de combate es
   `atributo + habilidad` (§4.1); un arma sin ellos no puede atacar.
4. **`habilidad` tiene que existir en `src/data/skills.ts`**: `armas_cuerpo`,
   `armas_distancia`, `atletismo`, `sigilo`, `aguante`, `supervivencia`,
   `arcanismo`, `percepcion`, `persuasion`, `voluntad`.

---

## Armas

| id | nombre | rareza | slot | daño | atributo | habilidad | durabilidad | peso | notas |
|---|---|---|---|---|---|---|---|---|---|
| `daga` | Daga | common | main_hand | 2 | fue | armas_cuerpo | 30 | 1 | **YA EN CÓDIGO.** Arma inicial (`STARTING_WEAPON_ID`). Stat-line validada en `simulaciones/lobo-v0.1.md`: 33,4% de victoria contra el lobo con pool 6. No la toques sin volver a simular. |
| | | | main_hand | | fue | armas_cuerpo | | | |
| | | | main_hand | | fue | armas_cuerpo | | | |
| | | | main_hand | | des | armas_distancia | | | |
| | | | main_hand | | des | armas_distancia | | | |
| | | | off_hand | | | | | | escudo o segunda mano |
| | | | main_hand | | | arcanismo | | | ¿hay arma arcana? Ojo con #47: lo arcano es raro y reverencial |

## Armaduras

| id | nombre | rareza | slot | DEF | atributo+ | durabilidad | peso | notas |
|---|---|---|---|---|---|---|---|---|
| | | | head | | | | | |
| | | | torso | | | | | |
| | | | hands | | | | | |
| | | | accessory | | | | | |

---

## Preguntas que esta tabla te va a obligar a contestar

Son las que el cuestionario de lore v2 recoge en el Bloque 22 (equipo). Si las
respondes ahí primero, esta tabla se rellena sola:

- ¿De qué está hecho el equipo de un superviviente medio — chatarra reaprovechada,
  forja real, orgánico curtido, tejido de restos? Tu respuesta 38 dice que los
  minerales son el recurso más valioso: ¿eso implica que hay herreros de verdad?
- ¿Existe equipo pre-Caída que todavía funcione, y es mejor o solo raro?
- La aleación de tu respuesta 27 (diamante + volcanita = +resistencia +fuego):
  ¿es un item concreto del catálogo o un **sistema** de mejora sobre items base?
  Las dos lecturas dan tablas muy distintas. Ver `TABLA-MINERALES.md`.
- ¿Los Teknomoros llevan equipo reconocible a simple vista?
