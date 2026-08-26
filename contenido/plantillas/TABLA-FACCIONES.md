# Tabla de facciones y cultos

> **Compila a `src/data/factions.ts`** (no existe todavía). Columnas = campos de
> `Faction` en `src/rules/faction.ts` (SAGRADO, ya escrito).
>
> **Cupo cerrado: 3 facciones en MVP** (§4.11). No es una tabla que crezca: son
> tres, y las tres tienen que ser jugables en las 5 regiones.
>
> La reputación es **numérica y bidireccional**, con 5 tramos y cortes en
> −50 / −10 / +10 / +50: `hated`, `unfriendly`, `neutral`, `friendly`, `honored`.
> Subir con una **no** baja automáticamente con otra: eso lo decides tú evento a
> evento. Si quieres que sea automático, es una decisión con número propio.

---

## Las 3 facciones

| # | id | nombre | tesis del mundo (una frase) | qué quiere | reputación inicial | dónde manda |
|---|---|---|---|---|---|---|
| 1 | | | | | 0 | |
| 2 | | | | | 0 | |
| 3 | | | | | 0 | |

**"Tesis del mundo" no es el nombre ni el rollo.** Es qué cree cada una que hay
que hacer con lo que queda. Tu respuesta 10 dice que *"cada facción tendrá un
color diferente en su forma de ver y hacer en el mundo"*: aquí es donde ese color
se escribe en una línea que se pueda contradecir.

## El conflicto vivo

| Entre | y | por qué | qué pasa si el jugador se mete |
|---|---|---|---|
| facción 1 | facción 2 | | |
| facción 2 | facción 3 | | |
| facción 1 | facción 3 | | |

## Efectos mecánicos de la reputación

| Facción | En `hated` | En `neutral` | En `honored` |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

Vías que el motor ya soporta: precios de mercader, temas de diálogo bloqueados o
abiertos (`rules/dialog.ts`), y peso de entradas de la tabla d20 vía
`weight_modifiers.if_min_reputation` (§4.15.9).

---

## Los Teknomoros

Tu respuesta 7 los define: **grupo reducido, hermético, tipo templarios, que
busca y recolecta todo lo del mundo antiguo — chatarra o teks inclasificables.
Motor de la historia principal.**

Eso plantea una pregunta de estructura que hay que contestar antes de rellenar
nada: **¿los Teknomoros son una de las 3 facciones, o son una cuarta cosa?**

- **Si son facción**: tienen reputación, temas de diálogo, mercaderes, y el
  jugador puede ganársela o perderla. Quedan 2 facciones para el resto del mundo.
- **Si son la trama**: no tienen barra de reputación; son el final del juego (#44:
  la partida cierra por muerte o por la quest principal, "cierre Teknomoro"). Las
  3 facciones son gente del mundo y los Teknomoros están por encima de ellas.

Lectura recomendada: **la trama, no facción**. Un grupo hermético con el que se
puede farmear reputación deja de ser hermético, y el verbo del juego (#63) ya
incluye "perseguir leyenda Teknomoro" como cosa aparte de las facciones.

## Cultos

Distintos de las facciones: no llevan reputación numérica en v1. Tu respuesta 24
los gradúa por poder — la mayoría solo imbuye objetos, los más poderosos invocan
entidades o hacen posesiones que mutan a lo que atacan.

| id | nombre | qué venera | qué practica | nivel de poder | dónde aparece |
|---|---|---|---|---|---|
| | | | imbuir objetos | menor | |
| | | | invocación | mayor | |
| | | | posesión | mayor | |

**Techo de dirección**: #47 dice que lo arcano es **raro y reverencial**, y que la
grieta arcana es evento singular, nunca atmósfera de fondo. Con 14 POIs de
arquetipo arcano en los 720 (un 2%), el mundo ya está calibrado para eso. Si los
cultos aparecen en POIs de otros arquetipos, se rompe: son lo raro del mundo.
