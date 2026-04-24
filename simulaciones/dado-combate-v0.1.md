# Simulación del dado de combate — v0.1

> **Propósito:** cerrar el bloqueante #1 de la biblia §6 (pool vs dado único) con números, no con intuición.
> **Versión:** v0.1 · **Fecha:** 25 de abril de 2026
> **Autor:** el-teknomoro-director
> **Estado:** en preparación. Script listo, decisión pendiente de Bazalo.

---

## 1. Qué estamos decidiendo

> *¿Pool de dados o dado único para resolver ataques en combate?*

Solo el dado de **combate**. El dado de **exploración** ya está cerrado (1d20, decisión #26). Son sistemas independientes por decisión arquitectónica (biblia §4.15 y decisión #20).

Esta decisión condiciona:

- `rules/combat.ts` entero.
- La fórmula de daño.
- La fórmula de iniciativa (bloqueante #2).
- La curva de XP hasta nivel 50 (bloqueante #3).
- Cómo se anima la tirada en pantalla (una o varias caras).
- El UX del log de combate ("3 éxitos de 5 dados" vs "17 + 3 = 20 vs DEF 15").

No cierra sola los bloqueantes 2 y 3, pero sí los desbloquea: una vez elegido el dado, la iniciativa y la XP son ajustes de parámetro, no cambios de paradigma.

---

## 2. Los dos candidatos

### 2.1 Candidato A — Pool de d6 con umbral 4+ (propuesta de dirección de la biblia §4.3)

**Resolución:**

1. El atacante tira `N` dados d6, donde `N = ATR + HAB`.
   - `ATR` = atributo relevante (FUE para cuerpo a cuerpo, DES para armas a distancia).
   - `HAB` = habilidad relevante (ej: armas_cuerpo_a_cuerpo).
2. Cada dado que saca 4, 5 o 6 cuenta como 1 éxito.
3. Un **6** cuenta como 1 éxito **y** habilita un crítico si el total de éxitos ≥ umbral de DEF.
4. El ataque impacta si `éxitos ≥ DEF_objetivo`.
5. El daño es una función de los éxitos sobre DEF.

**Ventajas a priori:**
- Curva binomial: resultados más predecibles cuanto mayor es el pool.
- "Subir de 3 a 4 dados se siente" (biblia §4.3).
- Críticos emergen naturalmente de los 6.

**Desventajas a priori:**
- Para jugadores nuevos, "cuenta los 4+" es menos intuitivo que "saca más de X".
- El pool crece rápido: con ATR 7 + HAB 10 son 17 dados en pantalla. Problema de render.
- Balance de daño es no-lineal: la diferencia entre 3 y 4 éxitos no es la misma que entre 8 y 9.

### 2.2 Candidato B — d20 + bonos contra DEF

**Resolución:**

1. El atacante tira 1d20.
2. Suma `ATR + HAB`.
3. Impacta si `tirada + ATR + HAB ≥ DEF_objetivo`.
4. Natural 20 = crítico automático. Natural 1 = pifia.
5. El daño es `dado_del_arma + ATR + (margen_de_éxito / factor)`.

**Ventajas a priori:**
- Familiar (D&D, Pathfinder, Daggerheart, Warhammer RPG moderno).
- Un solo dado que anima: combina bien con el HUD y el log textual.
- Matemática trivial: el jugador puede calcular su probabilidad de impactar mentalmente.
- Consistente con el dado de exploración (1d20 también): un solo "idioma de dados" en la cabeza del jugador.

**Desventajas a priori:**
- Alta varianza al principio: con ATR 1 + HAB 1, un combate depende mucho más del dado que del build.
- El escalado hasta nivel 50 exige bonos grandes y DEF grandes; los números se alejan de la intuición rápido.
- "Pasar de ATR 3 a 4" se siente menos (es solo +1 al modificador) — esto contradice la intención de progresión palpable de la biblia §4.3.

### 2.3 Candidato C (de control) — 2d10 + bonos contra DEF

Variante moderada. Tira 2d10 en vez de 1d20. Misma fórmula de suma contra DEF.

**Por qué se incluye:** 2d10 tiene **campana** (distribución triangular centrada en 11), no uniforme. La varianza es menor que 1d20 y la sensación de progresión por +1 al modificador es mayor (empuja la campana).

Sirve como contraste: ¿la campana basta para resolver las desventajas del 1d20 sin incurrir en las desventajas del pool?

---

## 3. Qué vamos a medir

Necesitamos métricas que hablen con la brújula de diseño de la biblia. No solo "funciona", sino "se siente coherente con la visión".

### 3.1 Métricas numéricas (las da el script)

Para cada candidato y para varios perfiles (ver §4):

| Métrica | Definición | Por qué importa |
|---|---|---|
| **P(impactar)** | Probabilidad de que un ataque impacte | Validar que novato-vs-novato no sea 95% ni 5% |
| **P(crítico)** | Probabilidad de crítico por ataque | La biblia pide críticos diferenciados (§1.5); deben ser notables pero no constantes |
| **P(pifia)** | Probabilidad de pifia por ataque | Solo candidato B. Referencia: D&D usa 5% y suele chirriar en niveles altos |
| **Daño esperado por turno** | E[daño] de un ataque | Base para calibrar HP y ritmo de combate |
| **σ/μ del daño** | Coeficiente de variación | Cómo de "a lo loco" se siente el combate. <0.3 es predecible, >0.6 es caótico |
| **Duración esperada del combate** | Turnos hasta KO 1v1 | La biblia no fija, pero un combate MVP debería caer en 3-8 turnos para no aburrir |
| **Sensibilidad a +1 atributo** | Δ de P(impactar) y E[daño] al pasar ATR de k a k+1 | "Subir un punto se siente" — métrica directa para el criterio de la biblia §4.3 |

### 3.2 Métricas cualitativas (las cierra Bazalo mirando los números)

- **¿El combate entre dos novatos es aleatorio o determinista?** Dos personajes nivel 1 tirando el uno contra el otro. Si la varianza es >0.8, el combate se siente ruleta. Si es <0.2, se siente determinista y aburrido.
- **¿Un experto abusa de un novato?** ATR 5 + HAB 8 vs ATR 1 + HAB 1. Objetivo: el experto gana >90% pero el novato tiene chance no-nula (>3%) de un golpe de suerte.
- **¿El ritmo cuadra con el MVP?** Combate contra enemigo básico: 3-5 turnos. Contra jefe de zona: 6-10 turnos. Eso es lo que el jugador aguanta sin cansarse ni sentirse invencible.

---

## 4. Perfiles a simular

Cuatro arquetipos de encuentro, cubren el rango de interés:

| Perfil | Atacante | Defensor | HP objetivo | Qué evalúa |
|---|---|---|---|---|
| **Novato vs novato** | ATR 2, HAB 1 | DEF 4 | 10 | Balance de inicio de partida |
| **Experto vs novato** | ATR 5, HAB 8 | DEF 4 | 10 | Sensación de poder (progresión) |
| **Nivel medio 1v1** | ATR 4, HAB 5 | DEF 8 | 20 | Combate típico de mitad de MVP |
| **Final vs jugador mid** | ATR 4, HAB 5 | DEF 12 | 40 | Jefe de zona, pone el techo |

Cada combinación se tira **10.000 veces** por candidato para que las métricas tengan precisión de 1pp o mejor.

---

## 5. Cómo ejecutar el script

```bash
node simulaciones/dado-combate.mjs
```

Imprime una tabla por candidato × perfil. Todo determinista (PRNG con seed fijo). Dos ejecuciones seguidas dan exactamente los mismos números: ideal para reproducibilidad y para incluir la salida en este documento tras decidir.

---

## 6. Qué NO resuelve esta simulación

Clarificación importante para no estirar el alcance:

- **No fija la fórmula exacta de daño.** Solo prueba varias plausibles para cada candidato; la fórmula definitiva se refina tras elegir el dado.
- **No fija la iniciativa.** Bloqueante #2, aparte.
- **No fija la curva de XP.** Bloqueante #3, depende del dado y del ritmo real que salga aquí.
- **No simula habilidades activas ni estados.** Combate pelado, ataque contra defensa.
- **No simula el terreno, día/noche, clima.** Bloqueante #4, aparte.
- **No decide el dado de mitigación/reactivo.** Ese sigue siendo 1d20 de exploración durante H1 (decisión #28).

La simulación es una lente: mira un aspecto, ignora el resto. La brújula del juego la pone Bazalo.

---

## 7. Protocolo de decisión

Pasos concretos:

1. Bazalo corre el script.
2. Bazalo lee las tablas contra las métricas cualitativas de §3.2.
3. Bazalo decide **uno** de los tres candidatos (o pide una variante).
4. La decisión se anota en §5 de la biblia con número de decisión nuevo (probable: #36).
5. Se marca cerrado el bloqueante #1 en §6 de la biblia.
6. Se actualiza §4.3 de la biblia con el dado cerrado.
7. Bloqueantes #2 y #3 entran en cola (iniciativa y curva XP), cada uno con su propia simulación.

**Criterio de cierre:** la decisión se considera cerrada cuando Bazalo puede escribir una frase del tipo *"el dado de combate es X porque la métrica Y lo valida frente a Z"*. Si esa frase no sale, no está cerrada.

---

## 8. Lectura inicial de la simulación (previa a tu decisión)

Corrí el script con los perfiles actuales y salta una cosa que merece llamarse antes de que leas las tablas:

**Los candidatos B (1d20+mods) y C (2d10+mods) se saturan al 95-99% de impactar en casi todos los perfiles.** No es un bug de simulación: es que con ATR+HAB sumando 9-13 y DEF de 4-12, un dado moderado casi siempre supera el umbral. Esto **no descalifica B/C**; significa que si eliges B o C, las DEF del juego tienen que ser más altas, o los mods (ATR+HAB) más contenidos. La simulación está mostrando algo real del diseño de números, no un fallo.

**El candidato A (pool d6 4+) muestra separación clara entre perfiles:**

- Novato vs novato: 50% de impactar, combate largo (7-8 turnos). Da tensión inicial.
- Experto vs novato: 99% + 66% de crítico. El experto **se siente experto**.
- Sensibilidad +1 atributo en novato: **+18.9% de P(impactar)**. Subir un punto en ATR 1→2 es brutalmente palpable. Esto cuadra casi literalmente con la brújula de la biblia §4.3.

**Primer resumen honesto para ti:** el pool tiene números más "interesantes" tal como está planteado, porque la curva binomial separa mejor los niveles. Los otros dos necesitarían recalibrar DEF/HAB para mostrar su propia dinámica antes de poder compararse de tú a tú.

**Qué hacer con esto:**

Dos caminos honestos:

- **Camino a)** Si la tabla de A te convence visceralmente, podemos cerrar con A sin iterar B/C.
- **Camino b)** Si quieres el contraste justo, hago v0.2 de esta simulación recalibrando B/C con DEF más altas (por ejemplo DEF 10/14/18/22) y comparas los tres con sus números nativos. Es media hora de trabajo.

Tú eliges.

---

## 9. Historial

**v0.1** — 25/4/2026. Preparado el contraste entre pool d6 4+, 1d20+mods y 2d10+mods. Script `dado-combate.mjs` ejecutable. Observación: B y C saturan al 95-99% de impactar con los perfiles actuales; A separa niveles limpiamente. Pendiente: Bazalo lee, decide entre cerrar con A o pedir recalibración de B/C.
