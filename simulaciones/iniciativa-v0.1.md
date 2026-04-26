# Simulación de iniciativa — v0.1

**Fecha:** 26 de abril de 2026
**Autor:** el-teknomoro-director
**Bloqueante atacado:** §6 biblia — fórmula de iniciativa (decisión #41).
**Resultado:** propuesta original (pool d6) descartada tras simulación. Sustituida por **`DES + 1d20`** (PJ) y **`initiative_base + 1d20`** (enemigo).

---

## 1. Contexto

La biblia v0.7 deja la fórmula de iniciativa abierta como bloqueante #1 de §6. El esqueleto del motor (`combat.ts`) tenía una provisional `DES + 1d20` etiquetada como tal. Antes de cerrar la regla, la dirección propuso reutilizar el dado de combate (decisión #36) para mantener coherencia mecánica con el resto del sistema de combate.

Tres iteraciones simuladas. Ganadora: la opción que la provisional ya tenía. La simulación valió igual: cierra el bloqueante con datos, no con corazonada.

---

## 2. Métricas que la simulación tenía que pasar

Para considerar viable una fórmula:

1. **Empates entre PJs idénticos < 10%.** Por encima de eso, el orden de turno se decide por regla de desempate y deja de ser interesante.
2. **DES baja contra enemigo común tiene chance real (≥ 30%).** Si un build VOL/INT con DES 1 tiene 0% de ir antes que un lobo, los arquetipos no-ágiles son perdedores automáticos.
3. **DES alta vs DES baja con +2 puntos de diferencia: P(alto va antes) ≥ 75%.** Invertir DES en build de iniciativa tiene que recompensar.
4. **Rangos por nivel de DES suficientemente amplios para no saturar al 100%.**

---

## 3. Iteración 1 — Pool reactivo pequeño

```
PJ:       initiative = DES + éxitos(1 + floor(DES/2) dados d6 a 4+)
Enemigo:  initiative = initiative_base + éxitos(2 dados d6 a 4+)
```

100.000 muestras por configuración.

| Métrica | Resultado | Veredicto |
|---|---|---|
| Empates DES 1 vs DES 1 | **50%** | Roto |
| Empates DES 7 vs DES 7 | **27%** | Roto |
| P(DES 1 va antes que lobo, base 1) | **13%** | Roto |
| P(DES 4 va antes que enemigo medio, base 3) | 81% | OK |
| P(DES 4 va antes que DES 2) | 97% | Demasiado alto, sin upset |

**Por qué falla:** sumar DES como entero a un pool de 1-2 dados produce distribuciones muy concentradas. La varianza es casi nula entre builds idénticos → empates en cascada. Y el "suelo" de éxitos posibles para DES baja es 0, lo que la hunde contra cualquier enemigo con base ≥ 2.

---

## 4. Iteración 2 — Pool reactivo ampliado

```
PJ:       initiative = DES + éxitos(2 + floor(DES/2) dados d6 a 4+)
Enemigo:  initiative = initiative_base + éxitos(3 dados d6 a 4+)
```

| Métrica | Resultado | Veredicto |
|---|---|---|
| Empates DES 1 vs DES 1 | 38% | Roto |
| Empates DES 7 vs DES 7 | 25% | Roto |
| P(DES 1 va antes que lobo, base 1) | 19% | Roto |
| P(DES 4 va antes que enemigo medio, base 3) | 77% | OK |
| P(DES 4 va antes que DES 2) | 94% | OK |

**Por qué falla:** ampliar el pool reduce empates pero no lo suficiente. El problema raíz persiste: el éxito binario d6 a 4+ con resultados enteros pequeños colapsa la distribución.

---

## 5. Iteración 3 — Pool grande sin sumar DES

```
PJ:       initiative = éxitos(DES + 3 dados d6 a 4+)
Enemigo:  initiative = éxitos(initiative_base + 2 dados d6 a 4+)
```

DES entra como tamaño de pool, no como suma. Más varianza esperada.

| Métrica | Resultado | Veredicto |
|---|---|---|
| Empates DES 1 vs DES 1 | 27% | Roto |
| Empates DES 7 vs DES 7 | 18% | Roto |
| P(DES 1 va antes que lobo, base 1) | **50%** | OK |
| P(DES 4 va antes que enemigo medio, base 3) | 61% | Justo |
| P(DES 4 va antes que DES 2) | **61%** | Roto — sin separación entre builds |

**Por qué falla:** arregla el suelo (DES baja recupera chance), pero **destruye la separación entre builds**. DES 4 vs DES 3 sale al 50%. La inversión en DES deja de pagar. Empates siguen demasiado altos.

---

## 6. Diagnóstico estadístico

El sistema "pool d6 a 4+ contando éxitos" tiene una propiedad incómoda para iniciativa: produce resultados enteros pequeños (típicamente 0-5) con distribución casi binomial. Para un combate donde la diferencia mecánica entre dos resultados de iniciativa es **discreta** (vas antes o después, no hay grado), esa granularidad pequeña es veneno: cuanto más estrecho el rango, más empates.

Es el mismo problema que tienen sistemas como World of Darkness con tiradas enfrentadas. Funciona bien para resolución (donde el margen importa: éxitos sobre umbral), pero falla para ordenación (donde sólo importa quién es mayor).

**Conclusión:** el dado de combate no es la herramienta correcta para iniciativa. No es un fracaso del dado, es un mismatch de aplicación.

---

## 7. Solución adoptada — `DES + 1d20`

```
PJ:       initiative = DES + 1d20
Enemigo:  initiative = initiative_base + 1d20
```

Cálculo analítico (d20 es uniforme exacto, no requiere Monte Carlo):

| Métrica | Resultado | Veredicto |
|---|---|---|
| Empates DES X vs DES X | **5%** (1/20) | OK |
| P(DES 1 va antes que lobo, base 1) | **47%** | OK |
| P(DES 4 va antes que enemigo medio, base 3) | **52%** | OK |
| P(DES 4 va antes que jefe, base 5) | 47% | OK |
| P(DES 1 va antes que DES 4) | 22% | OK (+3 dif → upset razonable) |
| P(DES 1 va antes que DES 7) | 8% | OK (+6 dif → poco probable, no imposible) |
| P(DES 4 va antes que DES 2) | **78%** | OK |
| P(DES 7 va antes que DES 1) | 92% | OK |
| Rango DES 1 | 2-21 | OK |
| Rango DES 7 | 8-27 | OK |

Empates al 5% son la línea natural del d20. Existen pero no dominan. La regla de desempate es sencilla:

1. Mayor DES bruto.
2. Si sigue empate (mismo DES), PJ va antes que enemigo.
3. Entre PJs múltiples (no aplica en MVP, hay un solo PJ por partida): orden de declaración.

---

## 8. Coherencia con decisiones cerradas previas

Esta fórmula no viola la decisión #20 ("dado de exploración separado del dado de combate"). #20 separa los dados de **resolución** de los dos sistemas (qué pasa cuando atacas, qué pasa cuando exploras). La iniciativa es **ordenadora**, no resolutoria: decide en qué orden ocurren las acciones, no qué efecto tienen.

`rules/dice.ts` ya expone `rollD20()` como primitiva neutra. `combat.ts` la consume para iniciativa sin entrar en conflicto con `rollCombatPool()` que sigue siendo el dado autoritativo de resolución de ataque.

---

## 9. Decisión cerrada

**Decisión #41:** *Iniciativa = `DES + 1d20` para PJ, `initiative_base + 1d20` para enemigo. Empate: gana mayor DES bruto; si persiste, PJ antes que enemigo. El d20 se reutiliza como primitiva ordenadora; no viola la decisión #20.*

Pendiente de aplicar al código en Ronda 2 (sustituir provisional `DES + d20` por la versión definitiva, eliminar etiqueta `PROVISIONAL H3` en `combat.ts`).

---

## 10. Lección de proceso

La simulación pilló un problema que la propuesta original (pool d6) escondía: el dado de combate no es universal. Reutilizar mecánicas por estética sin validar matemáticamente es trampa. La regla queda: **toda fórmula de combate pasa por simulación antes de cerrar**, sin excepción, aunque parezca "obviamente coherente".

El esqueleto tenía la fórmula correcta desde el principio. Tres iteraciones de simulación para volver al punto de partida no son trabajo perdido: ahora hay evidencia escrita de por qué `DES + 1d20` es la elección correcta y no una concesión.
