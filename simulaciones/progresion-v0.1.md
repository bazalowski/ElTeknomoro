# Sesión de diseño — Progresión

> **Propósito:** cerrar los 4 huecos abiertos del sistema de progresión que bloquean `rules/progression.ts` (módulo restante de H1).
> **Versión:** v0.1 · **Fecha:** 25 de abril de 2026
> **Autor:** el-teknomoro-director
> **Estado:** **cerrado.** Las 4 propuestas del director aprobadas por Bazalo en una sola pasada (25/4/2026). Decisiones #37-#40 anotadas en biblia v0.7.
> **Script de soporte:** [`progresion.mjs`](./progresion.mjs)

---

## Cómo se usa este documento

Cuatro preguntas en orden lógico (la 1 condiciona la 2, la 3 condiciona la 4). Para cada una:

- **Qué cierra** y por qué bloquea el código.
- **Lo que la biblia ya da** como restricción dura.
- **Opciones concretas** con números si los hay (de `simulaciones/progresion.mjs`).
- **Mi recomendación** y por qué.

Tú respondes las cuatro de un tirón. Yo cierro biblia §4.2 / §4.11 con decisiones #37-#40, escribo `progression.ts` con números reales y H1 queda cerrado.

**Regla de la sesión:** si una pregunta te bloquea, salta. Mejor cerrar 3 que ninguna. Las que queden abiertas las marcamos para siguiente iteración.

---

## P1 — Curva de XP por nivel

### Qué cierra

Cuánta XP cuesta pasar del nivel N-1 al nivel N. Determina:

- Cuántas sesiones de juego separa al nivel 1 del nivel 50.
- Si la curva es plana (todos los niveles cuestan parecido) o escala (cada nivel cuesta más).
- El ritmo de "se siente que estoy progresando" vs "esto se eterniza".

### Restricciones duras de biblia

- Nivel máximo = **50** (§4.11, decisión #15).
- Subir es manual (botón, pausa el juego).
- Densidad objetivo: 10-15 eventos de exploración por sesión de 30-45 min (§4.15.5).
- 20-45% de eventos son combate (§4.15.5).

### Lo que asumo provisional para hablar de números

XP por sesión típica: **250-500 XP**. Esto sale de "10-15 eventos × ~25-35 XP por evento medio". Si te chirría la cifra base, la cambio y rehago tablas.

### Opciones (extracto de `progresion.mjs`)

Sesiones para llegar a nivel 10 / 30 / 50 según curva (asumiendo 250 XP/sesión, lo bajo):

| Curva | Sesiones a nivel 10 | A nivel 30 | A nivel 50 |
|---|---|---|---|
| **Lineal** (`100·n`) | 22 | 186 | **510** |
| **Suave** (`100·n^1.5`) | 57 | 821 | **2.899** |
| **JRPG** (`50·n² + 100·n`) | 98 | 2.076 | **9.094** |
| **Cuadrática** (`50·n²`) | 77 | 1.891 | **8.585** |

A 500 XP/sesión, divide entre 2.

### Lectura honesta

- **Lineal**: 510 sesiones de 250 XP para llegar a 50. Si cada sesión es 30 min, son 255 horas de juego. Mucho para un MVP. Si rebajas a 100 sesiones de 45 min con 500 XP, son 75 horas. Razonable.
- **Suave**: 2.899 sesiones es desproporcionado para un single-player.
- **JRPG / Cuadrática**: 8.500-9.000 sesiones. Eso es un MMO coreano. Descartado.

El verdadero rango útil son **lineal y suave**. La pregunta real:

> ¿Quieres que el nivel 10 cueste 22 sesiones (lineal) o 57 (suave)?

### Mi recomendación: **lineal o muy levemente cuadrática**

Razones:

1. El MVP no aspira a tener cien horas de contenido. Forzar grindeo es matar la rejugabilidad.
2. La biblia §4.11 dice "subir nivel pausa el juego" — quieres que ese momento ocurra **a menudo**, sea ritual emocional. Cada 5-8 sesiones está bien. Cada 30 está mal.
3. La progresión palpable está en la curva del **dado de combate** (§4.3, decisión #36): subir 1 atributo da +18.9% en niveles bajos. Eso ya da la sensación de poder; la curva de XP no necesita reforzarla siendo brutal.

**Propuesta concreta:** `XP(n) = 100 · n` (lineal). Llegas a 50 en ~510 sesiones bajo, ~250 alto. Si te parece muy plano, subes a `XP(n) = 75 · n^1.3` y queda en ~150-300 sesiones.

### Pregunta directa

**¿Qué fórmula? Lineal `100·n`, ajustada `75·n^1.3`, o me das tu propia.**

---

## P2 — Cadencia de puntos por nivel

### Qué cierra

Al pulsar "subir nivel", cuántos puntos recibe el jugador y de qué tipo:

- ¿Atributos? (FUE/DES/CON/INT/VOL)
- ¿Habilidades?
- ¿Perks (talentos)?

### Restricciones duras de biblia

- Atributos: techo absoluto 7 (§4.1, decisión #8).
- Habilidades: suben por uso + XP (§4.2, decisión #9).
- Perks: 1 al crear (§4.7). La cadencia post-creación NO está fijada.
- Re-spec con coste de recurso de juego (scope §1.8).

### Análisis del techo absoluto

Empiezas con 12 puntos repartidos en 5 atributos = media base **2.4**. Si subes hasta el techo 7 en uno solo, te has gastado 5 puntos. Para tener todos los atributos al máximo (7×5 = 35), te faltan 35 - 12 = **23 puntos** desde el inicio.

Sweet spot de diseño: que el jugador termine la partida con **3-4 atributos altos y 1-2 bajos**. Builds con identidad. Esto requiere que los puntos totales por progresión NO permitan maximizar todo.

### Opciones simuladas

| Modelo | Atr/nivel | Hab/nivel | Perks | Atr total | Hab total | ATR medio final |
|---|---|---|---|---|---|---|
| **A · Solo habilidades** | 0 | 2 | cada 5 | 0 | 98 | 2.4 (sin cambio) |
| **B · Mixto bajo** | 0.2 (1 cada 5) | 2 | cada 5 | 9.8 | 98 | 4.4 |
| **C · Mixto alto** | 1 | 2 | cada 3 | 49 | 98 | **12.2** (rompe techo) |

### Lectura honesta

- **A** rompe la sensación de progresión: nunca subes atributos por nivel, solo por… nada. Tendrías que subirlos por uso de habilidad (modelo Skyrim, ya descartado por la biblia). Mal modelo.
- **C** te permite maximizar todo (ATR medio teórico 12.2 contra techo 7). Construir builds pierde sentido porque siempre tienes margen para reasignar tras re-spec barato.
- **B** te deja con ATR medio 4.4. Suficiente para sentir poder, suficientemente lejos del techo para que las elecciones cuesten. Sweet spot.

### Mi recomendación: **modelo B con ajustes**

Concretamente:

- **+2 puntos de habilidad por nivel** (98 totales en 49 niveles).
- **+1 punto de atributo cada 5 niveles** (10 totales).
- **+1 perk cada 5 niveles** (10 perks adicionales en 49 niveles).
- Niveles "redondos" (5, 10, 15…) son los **rituales**: dan los tres tipos a la vez. El resto solo habilidades. Refuerza el momento de pulsar el botón.

Por qué cuadra:

- 10 puntos de atributo en 49 niveles = decisiones que pesan. No puedes ponerlos todos en FUE.
- 2 habilidades por nivel mantiene el flujo de personalización constante.
- 10 perks adicionales sobre el inicial = catálogo total de 11 perks por personaje en partida completa. Manejable de diseñar para el MVP (el árbol completo puede tener 30-40 perks; el jugador pillaría ~30%).

### Pregunta directa

**¿Apruebas modelo B (1 atr cada 5, 2 hab/nivel, 1 perk cada 5)? ¿O ajustas algún número?**

---

## P3 — Techo blando del uso

### Qué cierra

Hasta dónde puede subir una habilidad **solo usándola** (sin XP). La biblia §4.2 dice "el uso premia coherencia" pero "el XP rompe el techo". Si el techo blando no existe, Skyrim. Si está mal puesto, se vuelve grindeable o irrelevante.

### Restricciones duras de biblia

- Modelo cerrado: uso + XP conviven (§4.2, decisión #9).
- Subir habilidades por XP: necesario para "romper el techo" — no puede ser que el uso solo te lleve hasta un valor bajo si el XP nunca te deja gastar puntos. Esto enlaza con P2.

### Opciones

Tres formas de definir el techo blando:

**Opción A — Techo absoluto fijo** (ej. valor 3)
- El uso te lleva hasta habilidad = 3, no más. A partir de ahí solo XP.
- Pro: trivial de implementar. El jugador entiende rápido el límite.
- Con: ¿Por qué exactamente 3? Sabe arbitrario.

**Opción B — Techo dinámico ligado al nivel del personaje**
- El uso te lleva hasta `floor(level / 2) + 1`. Nivel 1 → techo 1. Nivel 10 → techo 6. Nivel 14+ → techo absoluto 7.
- Pro: sensación de "el cuerpo se acostumbra al ritmo del aventurero". Coherente.
- Con: jugador novato no entiende por qué su sigilo deja de subir aunque siga usándolo.

**Opción C — Techo dinámico ligado al valor (con coste creciente)**
- No hay techo formal. El uso siempre puede subir, pero la cantidad de tiradas para subir crece exponencialmente. A partir de cierto valor (ej. 4), el coste se vuelve prohibitivo y solo el XP es viable.
- Pro: no hay "muro". Sigue subiendo, solo que muy despacio.
- Con: si la curva no está bien calibrada, el jugador grindea igualmente porque la barra avanza.

### Mi recomendación: **B con explicación visible**

Concretamente:

- Techo blando del uso = `min(floor(level / 2) + 2, 7)`.
- Nivel 1 = techo 2. Nivel 5 = techo 4. Nivel 10 = techo 7 (cap absoluto).
- En la UI, junto a la barra de progreso de uso, aparece "techo: X (sube nivel para superar)". Sin sorpresa.

Por qué cuadra:

- Personaje empieza con habilidades 0-3 (creación). El techo blando inicial 2 ya está superado en algunas habilidades, así que solo XP las sube de inicio. Premia el build inicial.
- A partir de nivel 10 el techo blando es 7 (absoluto). Habilidad no usada nunca puede subir igual hasta 7 con XP. Habilidad muy usada llega ahí sola.

### Pregunta directa

**¿Aprobamos B (`min(floor(level/2)+2, 7)`)? ¿O prefieres A (techo fijo) o C (sin techo, curva caro)?**

---

## P4 — Curva de uso (cuántas tiradas suben un escalón)

### Qué cierra

Cuántas entradas en `skills.{id}.usage` hacen falta para que `value` pase de `v` a `v+1`. Es la pieza más sensible al farmeo.

### Restricciones duras

- Toda tirada reactiva entrena (decisión #30 / E4 §4.15.6). Ganes o pierdas suma.
- Densidad: ~10-15 eventos por sesión, ~50-70% con tirada reactiva. **Estimación: 7-10 tiradas que entrenan por sesión, todas habilidades distintas si juegas variado**, todas iguales si grindeas.

### Opciones (extracto de `progresion.mjs`)

Tiradas para subir 0→1, 2→3, 4→5, 6→7 en cada candidata:

| Curva | 0→1 | 2→3 | 4→5 | 6→7 | Acumulado a 7 |
|---|---|---|---|---|---|
| **Lineal** (`10·(v+1)`) | 10 | 30 | 50 | 70 | **280** |
| **Exponencial** (`5·1.7^v`) | 5 | 14 | 42 | 121 | **287** |
| **Cuadrática** (`5·(v+1)²`) | 5 | 45 | 125 | 245 | **700** |

### Lectura honesta

- Si el techo blando es 2 (nivel 1, propuesta P3-B), las únicas subidas relevantes para el uso a inicio de partida son **0→1, 1→2**. La curva apenas importa al principio porque pronto pegas con el techo y solo XP rompe.
- A medida que el personaje sube nivel, el techo blando se relaja y **más escalones** se abren al uso. Aquí es donde la forma de la curva pesa: si es lineal, puedes farmear 4→5 con 50 tiradas (~5 sesiones de uso intensivo de esa habilidad); si es exponencial, ~5 sesiones también. Si es cuadrática, ~12-15.

### Mi recomendación: **exponencial con base 5 y tasa 1.7**

- 0→1 = 5 tiradas. Habilidades nuevas suben rápido (gratifica probar cosas).
- 4→5 = 42 tiradas (~5 sesiones de uso intensivo). Suficientemente lento para que no sea trivial.
- 6→7 = 121 tiradas (~15 sesiones). Solo el extremista llega; al resto le compensa más subir habilidades nuevas.

Por qué cuadra con tu brújula (§4.15: "libertad → cautela y opción a preparar"):

- Habilidades infrautilizadas suben rápido al primer toque. Premia explorar nuevos verbos.
- Habilidades dominantes se vuelven caras. Empuja a diversificar el build a medida que avanzas.
- La diferencia entre lineal y exponencial es invisible al principio (5 vs 10) y crítica al final (70 vs 121). Hace que el endgame sea diferente del earlygame, sin tocar más sistemas.

### Pregunta directa

**¿Aprobamos exponencial `5·1.7^v`? ¿O lineal `10·(v+1)` (más predecible) o cuadrática `5·(v+1)²` (más durra)?**

---

## Resumen de las decisiones cerradas

Las 4 propuestas del director aprobadas tal cual por Bazalo:

- **P1 — curva XP**: **lineal `XP(n) = 100·n`**. → decisión #37.
- **P2 — cadencia de puntos**: modelo B. **+2 hab/nivel + 1 atr cada 5 niveles + 1 perk cada 5 niveles**. Niveles redondos (5, 10, 15…) son los rituales: dan los tres tipos a la vez. → decisión #38.
- **P3 — techo blando del uso**: **`min(floor(level/2) + 2, 7)`**. → decisión #39.
- **P4 — curva de uso**: **exponencial `5·1.7^v`** (redondeada al entero más cercano). → decisión #40.

---

## Historial

**v0.1** — 25/4/2026. Primera y única ronda de las 4 preguntas con simulación numérica de soporte (`progresion.mjs`). Bazalo aprueba las 4 propuestas del director sin cambios. Decisiones #37-#40 anotadas en biblia v0.7. Bloqueante "curva de XP al nivel 50" cerrado en §6. `rules/progression.ts` desbloqueado.
