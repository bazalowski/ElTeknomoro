# Simulación del dado de combate — v0.2

> **Propósito:** dar a B y C un set de DEF que les permita pelear a su altura, para comparar los tres candidatos sin que B/C lleguen saturados al 95-99% de impactar.
> **Versión:** v0.2 · **Fecha:** 25 de abril de 2026
> **Autor:** el-teknomoro-director
> **Estado:** cerrada. Decisión tomada: **Candidato A · pool d6 4+** (decisión #36 en biblia v0.6).
> **Predecesor:** [`dado-combate-v0.1.md`](./dado-combate-v0.1.md)

---

## 1. Por qué existe esta v0.2

La v0.1 corrió los tres candidatos con la **misma tabla de DEF** (4, 4, 8, 12). Eso favorecía a A (pool d6) y aplastaba a B y C: con ATR+HAB sumando 9-13 y DEF de 4-12, un 1d20 o un 2d10 casi siempre superan el umbral. Resultado: B y C marcaban 95-99% de impactar en casi todos los perfiles y la comparación no era honesta.

v0.2 corrige ese desbalance dándole a cada candidato **su propia tabla de DEF**, calibrada al rango operativo de su dado:

| Perfil | DEF para A | DEF para B/C |
|---|---|---|
| Novato vs novato | 4 | 10 |
| Experto vs novato | 4 | 14 |
| Medio 1v1 | 8 | 18 |
| Jefe vs mid | 12 | 22 |

Lo demás (ATR, HAB, HP del objetivo, daño base de arma, semilla del PRNG, número de iteraciones) se mantiene **idéntico** a v0.1. Lo que medimos es el dado, no la curva de HP.

---

## 2. Qué hice exactamente en el código

Cambios en [`simulaciones/dado-combate.mjs`](./dado-combate.mjs):

1. Separé la definición de los perfiles en dos partes:
   - `PERFILES_BASE`: nombre, ATR, HAB, HP objetivo, daño base de arma. Sin DEF.
   - `DEFS_POR_CANDIDATO`: tabla de DEF por nombre de candidato.
2. Función `perfilesPara(candidato)` que combina ambas para devolver el set final del candidato.
3. La salida ahora imprime la columna `DEF` por fila y la lista de DEFs en la cabecera de cada candidato, para que se vea de un vistazo a qué DEF se enfrenta cada uno.
4. Ningún cambio en los algoritmos de los tres candidatos. El dado sigue siendo el dado.

Reproducible: misma semilla (`0xcafebabe`), mismas 10.000 iteraciones por celda, dos ejecuciones seguidas dan exactamente los mismos números.

---

## 3. Tablas resultantes

Salida literal del script tras la recalibración.

### A · pool d6 4+ (DEFs: 4 / 4 / 8 / 12)

| Perfil | DEF | P(imp) | P(crit) | P(pif) | DañoMed | σ | CV | KO turnos | Δ+1atr imp | Δ+1atr daño |
|---|---|---|---|---|---|---|---|---|---|---|
| Novato vs novato | 4 | 50.2% | 7.4% | 12.1% | 1.31 | 1.51 | 1.15 | 7.64 | **+18.9%** | +0.83 |
| Experto vs novato | 4 | 99.7% | 66.5% | 0.0% | 12.74 | 5.24 | 0.41 | 0.78 | +0.1% | +1.25 |
| Medio 1v1 | 8 | 90.8% | 44.8% | 0.2% | 6.63 | 3.97 | 0.60 | 3.01 | +3.8% | +1.12 |
| Jefe vs mid | 12 | 74.3% | 40.3% | 0.2% | 4.86 | 3.85 | 0.79 | 8.24 | +8.2% | +1.14 |

### B · 1d20 + mods (DEFs: 10 / 14 / 18 / 22)

| Perfil | DEF | P(imp) | P(crit) | P(pif) | DañoMed | σ | CV | KO turnos | Δ+1atr imp | Δ+1atr daño |
|---|---|---|---|---|---|---|---|---|---|---|
| Novato vs novato | 10 | 70.9% | 5.0% | 4.9% | 4.56 | 3.82 | 0.84 | 2.19 | +4.3% | +1.14 |
| Experto vs novato | 14 | 95.1% | 5.0% | 4.9% | 11.19 | 4.83 | 0.43 | 0.89 | -0.1% | +1.24 |
| Medio 1v1 | 18 | 60.8% | 5.0% | 4.9% | 5.67 | 5.26 | 0.93 | 3.53 | +4.2% | +1.21 |
| Jefe vs mid | 22 | 40.5% | 5.0% | 4.9% | 3.65 | 4.94 | 1.35 | 10.95 | +4.2% | +0.87 |

### C · 2d10 + mods (DEFs: 10 / 14 / 18 / 22)

| Perfil | DEF | P(imp) | P(crit) | P(pif) | DañoMed | σ | CV | KO turnos | Δ+1atr imp | Δ+1atr daño |
|---|---|---|---|---|---|---|---|---|---|---|
| Novato vs novato | 10 | 85.5% | 0.9% | 1.0% | 4.68 | 2.40 | 0.51 | 2.13 | +4.7% | +1.33 |
| Experto vs novato | 14 | 99.0% | 0.9% | 1.0% | 11.07 | 2.36 | **0.21** | 0.90 | +0.1% | +1.31 |
| Medio 1v1 | 18 | 72.6% | 0.9% | 1.0% | 5.90 | 3.89 | 0.66 | 3.39 | +6.7% | +1.48 |
| Jefe vs mid | 22 | 36.1% | 0.9% | 1.0% | 2.79 | 3.87 | 1.38 | 14.32 | +8.2% | +1.11 |

---

## 4. Lectura honesta de los tres

Tres lentes para mirar la tabla, una por criterio que la biblia §4.3 / §1.5 ya tiene cerrado.

### 4.1 ¿Qué dado da más sensación de progresión? (criterio: "subir un punto se siente")

- **A**: novato → +1 atributo da **+18.9%** de P(impactar). Brutal. Los perfiles altos saturan a +0% porque ya están al techo, pero ese ya es otro problema (ver §5).
- **B**: el +1 atributo da **+4.2-4.3%** estable en todo el rango. Constante, predecible, plano.
- **C**: similar a B (+4.7-8.2%), con una pequeña curva favorable en perfiles altos.

**Ganador del criterio:** A en niveles bajos por goleada. C en niveles altos. B nunca.

### 4.2 ¿Qué dado tiene la varianza adecuada? (criterio: ni ruleta ni determinismo)

CV (coeficiente de variación) en el perfil clave **Novato vs novato**:

- A: 1.15 → caótico.
- B: 0.84 → caótico.
- C: 0.51 → equilibrado.

CV en **Medio 1v1** (la mayor parte del juego):

- A: 0.60 → equilibrado, justo en la frontera.
- B: 0.93 → caótico.
- C: 0.66 → equilibrado, justo en la frontera.

**Ganador del criterio:** C, claramente. La campana del 2d10 hace lo que prometía.

### 4.3 ¿Qué dado tiene críticos a la altura del MVP? (criterio: §1.5, "diferenciados pero no constantes")

- **A**: P(crit) varía de 7% (novato) a 66% (experto vs novato). Es decir: el experto **se siente experto**, pero el "crítico" como evento raro deja de existir cuando el pool es grande.
- **B**: P(crit) fija al 5% siempre. Es el clásico "5% de Nat 20". Predecible. No premia el build.
- **C**: P(crit) fija al ~1% (la suma 20 en 2d10 es 1/100). Casi nunca pasa. Posible problema.

**Ganador del criterio:** depende de qué quieras del crítico.
- Si crítico = "premio al que invierte en el build" → **A**.
- Si crítico = "evento raro de la noche" → **B**.
- Si crítico = "casi no existe" → **C** (problema; habría que añadir una regla de crítico extra).

### 4.4 ¿Qué dado da el ritmo que pide el MVP? (criterio: 3-5 turnos enemigo básico, 6-10 jefe)

KO turnos en **Medio 1v1** (proxy de combate típico) y **Jefe vs mid**:

| Candidato | Medio 1v1 | Jefe vs mid |
|---|---|---|
| A | 3.0 turnos | 8.2 turnos |
| B | 3.5 turnos | 11.0 turnos |
| C | 3.4 turnos | 14.3 turnos |

**Ganador del criterio:** A da el ritmo más cercano al objetivo del MVP. B y C alargan los jefes; en C el jefe se hace lento.

---

## 5. Lo que la simulación NO te puede decir, pero conviene anotar

- **Saturación de A en niveles altos.** El experto pega al novato con 99.7% de impacto y 66.5% de críticos. Eso es congruente con "el experto se siente experto" pero a partir de cierto pool, subir más atributos deja de tener efecto en P(impactar). El crecimiento en niveles altos se canaliza solo por **daño**, no por consistencia. Si A se elige, hay que decidir si eso te parece bien o si quieres una mecánica de techo (DEF crece más rápido, defensa con dados, etc.).
- **Pifia del 5% en B.** Es el problema clásico del d20: en niveles altos, el experto sigue fallando 1 de cada 20 ataques contra un mocoso. Daggerheart lo resolvió quitando la pifia mecánica. Si B se elige, hay que decidir.
- **Crítico testimonial en C.** 1% es casi inexistente. Si C se elige, probablemente haya que añadir una segunda fuente de crítico (margen ≥ X, doble dado igual, etc.).
- **Render y UX de A.** No medido. 17 dados en pantalla con ATR 7 + HAB 10 sigue siendo un problema técnico real para el render de combate. La simulación no lo ve, pero existe.
- **Coherencia de "lenguaje de dados".** El dado de **exploración** ya está cerrado en 1d20. Elegir B alinea ambos sistemas en el mismo dado físico (un solo "idioma"). A y C divergen del dado de exploración. Es preferencia, no métrica.

---

## 6. Mi recomendación, sin que sustituya a la tuya

Si tuviera que elegir hoy con esta tabla en la mano, iría con **A (pool d6 4+)** por dos razones de diseño:
1. Es el único que cumple el criterio de la biblia §4.3 ("subir un punto se siente") en niveles bajos sin necesidad de poner asteriscos.
2. Es el único que da un **crítico jugable** sin tener que añadir reglas extra.

Las dos contras (saturación en niveles altos, dados en pantalla) son resolubles con decisiones posteriores y no rompen H1.

**C (2d10)** sería mi segunda opción si valoras la varianza más bien acotada por encima de la sensación de progresión. Es la opción "europea limpia": predecible, elegante, requiere parche para los críticos.

**B (1d20)** sería mi tercera. La única razón fuerte para elegirlo es la coherencia con el dado de exploración. Como dado de combate, hace todo bien sin destacar en nada.

---

## 7. Qué pasa después de tu decisión

Sea cual sea la elegida:

1. La decisión se anota en §5 de la biblia con número de decisión nuevo (probable: #36).
2. Se cierra el bloqueante #1 en §6 de la biblia.
3. Se actualiza §4.3 de la biblia con el dado cerrado.
4. **H1 se desbloquea.** Procedo con `rules/dice.ts` (añadir primitiva de combate junto a la de exploración) y bajamos por `character.ts` → `progression.ts` → `exploration.ts` + `resolveEvadeCheck` con sus tests.
5. Bloqueantes #2 (iniciativa) y #3 (curva XP) entran en cola, cada uno con su propia simulación.

---

## 8. Historial

**v0.2** — 25/4/2026. Recalibración de DEF por candidato para evitar saturación de B y C. Sin cambios algorítmicos. Conclusión: A sigue ganando los criterios de progresión y crítico; C gana varianza; B no destaca pero alinea con el dado de exploración. **Bazalo cierra con A (pool d6 4+)** el mismo día. Anotado como decisión #36 en biblia v0.6, bloqueante #1 cerrado en §6, §4.3 reescrito.

**v0.1** — 25/4/2026. Primera ejecución con tabla de DEF común. Detectó saturación de B/C al 95-99% de impactar y motivó esta v0.2.
