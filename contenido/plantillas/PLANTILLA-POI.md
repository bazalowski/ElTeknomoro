# Plantilla de POI — formato de autoría de las 14.400 entradas

> **Propuesta de formato para el sub-paso 4f.0** (decisión #97). No es canon
> hasta que 4f.0 la ratifique y §4.15.9 se reescriba contra ella.
> **Fuente de verdad del reparto de bandas:** biblia §9.5. Si esto y la biblia
> se contradicen, manda la biblia.
> **Fuente de verdad del generador:** `scripts/gen-poi-scaffold.mjs`. Si cambias
> el formato, cambia los dos.

---

## 1. Qué es esta capa y por qué existe

La decisión #92 pide **20 eventos escritos a mano en cada uno de los 720 POIs**:
14.400 entradas. La propia biblia dice que editarlas a mano en JSON sería trabajo
tirado, y que el Campo de pruebas (§4.14) es prerrequisito del hito de contenido.

Esta capa resuelve el hueco intermedio: **se escribe hoy, en texto plano, sin
esperar a la herramienta**. Un compilador (4f.0 / 4f) traduce estos archivos al
formato que consume `src/rules/exploration.ts`. El autor nunca escribe JSON.

```
contenido/pois/<region>/<gridId>.md   ← escribes aquí (180 archivos, 4 POIs cada uno)
          ↓  compilador (4f.0)
src/data/exploration/*.json           ← lo lee el motor
```

**Regla que gobierna toda la capa:** un campo vacío **no es un error**. La
cascada de §9.5 resuelve entrada propia → tabla del arquetipo → genérica de la
banda. El juego es jugable con los 180 archivos en blanco. Cada línea que
escribes sustituye a su fallback y nada más.

---

## 2. Anatomía de un archivo de grid

Un archivo = un grid = 4 POIs = 80 slots de banda. Es la unidad de sesión de
escritura: te sientas, escribes un grid, lo cierras.

```
# sur-014 — Marismas del Sur          ← cabecera generada, no la toques
> metadatos del grid

## sur-014-poi-1                       ← un POI
arquetipo: natural                     ← generado, viene de pois.json
curado: no                             ← generado, viene de hasCuratedSlot
posicion: 1,3                          ← generado, posición en el mini-grid 5×5
nombre:                                ← LO ESCRIBES TÚ
descripcion:                           ← LO ESCRIBES TÚ

### 01 · peligro real                  ← un slot de la tabla d20
tipo: trap
texto:
mecanica:
tirada:

### 02 · combate menor
...
### 20 · legendario
```

Los tres campos generados (`arquetipo`, `curado`, `posicion`) **son datos, no
texto**: salen de `src/data/world/pois.json` y son la verdad del mundo fijo
(#72). Si quieres cambiar el arquetipo de un POI, se cambia en el JSON y se
regenera, no se edita aquí.

---

## 3. Campos de cabecera de POI

| Campo | Quién lo pone | Qué es |
|---|---|---|
| `arquetipo` | generado | `natural` / `ruina` / `asentamiento` / `arcano` (§9.4). Decide de qué tabla de fallback cuelga el POI. |
| `curado` | generado | `si` en los 80 con `hasCuratedSlot` (§9.3). Los `si` llevan además el bloque `### 00 · curado`. |
| `posicion` | generado | Coordenada dentro del mini-grid 5×5. Sirve para orientarte al escribir (¿está en el borde? ¿pegado a otro POI?). |
| `nombre` | **tú** | El nombre que se revela al visitar. Bajo niebla el jugador ve `???` (§9.9). Una vez escrito, es el nombre del lugar para siempre: el mundo es fijo (#72). |
| `descripcion` | **tú** | 1-2 frases que se muestran al entrar. Es un **átomo de lore corto** (§10.5, voz `ambiente` normalmente). Aquí vive la mitad del lore embebido del juego. |

**Sobre el nombre.** 720 nombres es mucho nombre. Dos avisos de dirección:
no hace falta que todos sean evocadores — un `Poste de kilómetro 41` vale tanto
como un `Cripta del Aliento Corto`, y alternarlos es lo que hace que el segundo
suene a algo. Y el nombre puede quedar vacío: el fallback del arquetipo da un
nombre neutro y el POI sigue siendo jugable.

---

## 4. Los 20 slots: la plantilla de bandas

El reparto es **idéntico en los 720** y no se negocia POI a POI. Eso es lo que
hace que el balance no dependa de tu disciplina entrada a entrada (§9.5).

| Slots | Banda | % | Qué va aquí | `tipo` por defecto | Otros `tipo` válidos |
|---|---|---|---|---|---|
| 1 | Peligro real | 5% | Trampa, emboscada con pifia, algo que puede matar | `trap` | `ambush` |
| 2-3 | Combate menor | 10% | Encuentro hostil resoluble | `combat` | `ambush` |
| 4-12 | **Color del mundo** | **45%** | Detalle ambiental, observación, fragmento de lore, escena sin combate | `environmental` | `nothing`, `narrative` |
| 13-15 | Encuentro neutral | 15% | NPC, animal pacífico, viajero, mercader | `npc` | `shelter` |
| 16-17 | Recurso | 10% | Material, ración, oro menor | `discovery` | — |
| 18 | Pista / rumor | 5% | Información sobre otro POI o sobre el lore | `discovery` | `poi`, `narrative` |
| 19 | Oportunidad | 5% | Valor estratégico: alianza, info de facción, descuento | `npc` | `shelter`, `discovery` |
| 20 | Legendario | 5% | Recompensa singular: ítem único, hito narrativo, perk | `narrative` | `discovery`, `combat` |

**9 de cada 20 entradas son color del mundo**, la clase más barata de escribir.
El volumen de #92 se concentra deliberadamente en la mitad ligera de la tabla:
si escribes un POI entero de una sentada, casi la mitad del trabajo son frases
de ambiente de una línea.

---

## 5. Campos de una entrada

```
### 07 · color del mundo
tipo: environmental
texto: Alguien apiló las vértebras por tamaño y se fue sin terminar.
mecanica:
tirada:
```

| Campo | Obligatorio | Qué es |
|---|---|---|
| `tipo` | viene relleno | Uno de los 10 tipos de evento de §4.15.3. Cámbialo si tu entrada pide otro de los válidos de la banda. |
| `texto` | **el que importa** | Lo que lee el jugador. Una a tres frases en color del mundo; más largo en legendario y curado. |
| `mecanica` | opcional | Qué pasa además del texto, **en tu idioma, no en JSON**. El compilador lo traduce. Vacío = solo texto. |
| `tirada` | opcional | Override de la tirada reactiva. Vacío = **el default de §4.15.7 para ese `tipo`**. |

### 5.1 `mecanica` — lenguaje de una línea

No escribes payloads. Escribes frases cortas que el compilador entiende. Formas
previstas (se cierran en 4f.0 contra lo que de verdad acabes escribiendo):

```
mecanica: enemigo lobo_del_bosque
mecanica: enemigo lobo_del_bosque x2
mecanica: daño 3
mecanica: cura 2
mecanica: item diente_de_lobo
mecanica: item pocion_curacion_menor x2
mecanica: oro 12
mecanica: estado bleeding
mecanica: revela sur-016-poi-3
mecanica: flag viajero_audaz
mecanica: xp 25
```

Se pueden encadenar con `+`: `mecanica: oro 12 + estado poisoned`.

Todo id que escribas aquí (`lobo_del_bosque`, `diente_de_lobo`) tiene que existir
en su catálogo. El compilador falla ruidosamente si no existe — es el mismo
contrato de "sin loot huérfano" que ya valida `src/data/enemies.test.ts`.

### 5.2 `tirada` — solo cuando te desvías

La decisión #24 obliga a que **toda** entrada declare una tirada reactiva. Escribir
14.400 `evade_check` a mano es imposible y además innecesario: §4.15.7 ya fija la
tirada por defecto de cada tipo de evento. El compilador la inyecta.

Solo escribes `tirada:` cuando esta entrada concreta se desvía:

```
tirada: percepcion 4              ← habilidad y dificultad, tirada fija
tirada: sigilo vs percepcion      ← enfrentada contra el stat del enemigo
tirada: voluntad 3 auto           ← se resuelve sin preguntar al jugador
tirada: ninguna                   ← esta entrada no admite evasión
```

---

## 6. El bloque curado (80 POIs)

Los 80 POIs con `curado: si` llevan **además** de sus 20 slots un evento fijo que
puentea el d20 (§9.3). No son otra clase de POI: son otro grado de curaduría.

```
### 00 · curado
titulo: 
texto: 
mecanica: 
agotable: si
```

- `titulo` — encabeza el modal. Los otros 20 slots no llevan título.
- `texto` — el más largo del archivo. Es un átomo de lore medio o largo (§10.5).
- `agotable` — `si`: se dispara la primera vez y después el POI pasa a resolver
  por d20 normal. `no`: se dispara cada visita (úsalo con cuidado; es la puerta
  de atrás al farmeo que §9.5 cierra a propósito).

Distribución de los 80: ~22 Centro / ~16 Norte / ~16 Sur / ~13 Este / ~13 Oeste.
Ya está marcada en los datos; solo tienes que rellenarla.

---

## 7. Orden de escritura recomendado

No empieces por `centro-001`. El orden que menos trabajo tira a la basura:

1. **Un POI piloto completo** — los 20 slots de uno solo, de principio a fin.
   Es el entregable literal de 4f.0: valida el formato en una tarde en lugar de
   descubrir el fallo con 500 escritos.
2. **Las 4 tablas de arquetipo** (`contenido/fallbacks/`) — 4 × 20 = 80 entradas
   que cubren los 720 POIs desde el primer día. Es el mejor ratio esfuerzo/cobertura
   del proyecto entero.
3. **El grid de inicio y sus vecinos** (`sur-001` y alrededores) — es lo que todo
   jugador ve en sus primeros 20 minutos, en todas las runs.
4. **Los 80 curados** — el contenido de mayor valor por entrada.
5. **El resto, por región**, dejando el Centro (Zona Cero) para el final: es la
   región de más grids y la de función dramática todavía sin cerrar (#82).

---

## 8. Higiene

- **No generes entradas con IA** (#77). Esta capa existe para que las escribas tú.
  La IA puede montar el andamiaje, el compilador y los tests; el texto no.
- **No edites la cabecera generada** de un archivo de grid. Si un dato está mal,
  se arregla en `src/data/world/pois.json` y se regenera.
- **Regenerar es seguro**: `node scripts/gen-poi-scaffold.mjs` nunca sobrescribe
  un archivo existente. Crea solo lo que falte.
- **Un archivo a medias es un archivo válido.** No hay estado "incompleto" que
  rompa nada.
