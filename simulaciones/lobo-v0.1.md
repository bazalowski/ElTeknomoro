# Simulación del Lobo del Bosque — v0.1

**Fecha:** 29 de abril de 2026
**Autor:** el-teknomoro-director
**Hito atacado:** H3.2b — calibrado del primer enemigo del juego.
**Resultado:** stat-line del lobo cerrada (ver §8). Build A × arma_media cae al **33.4%** de victoria (target 25-40%); duración mediana 5 turnos; ningún one-shot por crítico observado en 60.000 muestras.

---

## 1. Contexto narrativo y por qué los targets son los que son

El primer combate del juego es **tutorial scripteado donde es probable que el jugador muera**. No es 50/50; la balanza pesa hacia la derrota. Esto no es un bug de diseño, es la ejecución literal de PRODUCT §Design Principles 3 — *un personaje, un mundo, una vida* — en el primer minuto de juego. La permadeath se enseña cumpliéndose. El primer epitafio que aparece en la pantalla de Cargar Partida no es un accidente: es la lección que el sistema imparte sin texto.

De ahí los constraints, todos cerrados con Bazalo antes de simular:

| Constraint | Valor | Por qué |
|---|---|---|
| Build A · arma media · victoria | **25-40%** | El jugador "promedio realista" pierde más de lo que gana. La franja deja margen para que sienta que ganar tuvo mérito y morir era plausible. |
| HP final del PJ-que-gana / HP máx | **30-60%** | Si ganas con > 60% el combate fue un paseo (rompe la lección). Si ganas con < 30% es aceptable, mejor incluso (la victoria tiene precio). |
| Tasa de muerte en turno 1 por crítico | **< 5% (idealmente < 2%)** | Morir en el primer ataque del lobo sin haber jugado un turno es injusto y rompe la pedagogía. La permadeath enseña; el RNG bruto no. |
| Mediana de turnos hasta resolución | **4-7 turnos** | Combate tutorial: no debe durar 15 turnos. Un combate corto y decidido. |
| Build B · arma baja · victoria | reportar, no target | Build B es contraste: queremos ver el spread. Si saliera > 50% algo raro pasa. |

Build B no se usa para calibrar. La stat-line se ajusta contra A.

---

## 2. Lo que el motor real impuso (y el briefing no anticipó)

Antes de correr, leí `src/rules/character.ts` y `src/rules/combat.ts` para no calibrar contra números fantasma. Tres correcciones obligadas:

1. **DEF de los builds**: la fórmula es `2 + floor(DES/2) + armadura` (`computeDefense`). Con DES 2 → DEF 3 (no 4). Con DES 3 → DEF 3. Ambos builds tienen **DEF 3**, no 4.
2. **Threshold del PJ contra el lobo**: `ceil(DEF/3) = ceil(3/3) = 1`. El lobo necesita solo **1 éxito** para impactar al PJ. Esto encaja con la tasa de impacto observada (~87%) y explica por qué incluso un lobo con pool 3 pega tanto.
3. **HP máximo**: confirma briefing — Build A `8 + 2·3 = 14`, Build B `8 + 2·2 = 12`.

Pool de ataque del PJ con habilidad armas_cuerpo:
- Build A: FUE 3 + 3 = **6 dados**.
- Build B: FUE 2 + 1 = **3 dados**.

Con threshold 2 (DEF 4 del lobo provisional), Build A saca ~3 éxitos de media → margen 1 → daño 2+1 = 3 base, frecuente crítico (≥2 seises ocurren en ~30% con 6 dados). Esto es lo que sobre-calibra al PJ contra el lobo del briefing.

---

## 3. Armas del inventario inicial — paramétricas

H2.5a (paso 5/7 del Hito 2) cierra una pantalla de inventario inicial **placeholder**: cinco ítems narrativos con glifos, sin `Item` real, sin stats, sin `weapon_damage`. El catálogo de Items definitivo no está cerrado (se abrirá en H5).

Para no inventar narrativa antes de tiempo y aún así calibrar contra una dimensión real, simulamos contra **tres armas paramétricas**:

| ID | Label | weapon_damage | Justificación |
|---|---|---|---|
| `arma_baja` | dmg 1 | 1 | Cuchillo / daga corta. Banda mínima razonable. |
| `arma_media` | dmg 2 | 2 | Banda esperada del arma de inicio. Es la celda de calibración. |
| `arma_alta` | dmg 3 | 3 | Arma "buena" inicial. Banda máxima razonable. |

Todas usan `weapon_attribute: 'fue'` y `weapon_skill: 'armas_cuerpo'` (skill id real verificado en `src/data/skills.ts`). Cuando H5 cierre el catálogo, esta simulación se renombra a `lobo-v0.2.md` con los tres ítems concretos. El esqueleto de la simulación no cambia.

---

## 4. Metodología

- **10.000 combates por celda** (build × arma). 6 celdas → 60.000 muestras por iteración.
- **Seed determinista por celda**: `(seed_maestro ^ cellIdx·0x9e3779b1 ^ iter·0x85ebca77) >>> 0`, con `seed_maestro = 0xc0ffee42`. Dos celdas no comparten trayectoria del PRNG.
- **Algoritmo de un combate**:
  1. `createCharacter` con la build, equipar arma con `addItem` + `equipFromSlot`.
  2. `startCombat` con un `EnemyState` del lobo.
  3. Ciclar: si el actor del turno actual es `'character'` → `applyCharacterAction({ kind: 'attack', target_instance_id: 'lobo#1' })`; si es enemigo → `applyEnemyTurn`.
  4. Salir cuando `state.status !== 'ongoing'`. Cota dura de 200 iteraciones por seguridad (nunca alcanzada).
- **Sin mocks**: importa `combat.ts`, `character.ts`, `inventory.ts`, `dice.ts` directos. El motor es el motor.

### Métricas registradas

| Métrica | Cómo se calcula |
|---|---|
| `victoryRate` | victorias / 10.000 |
| `turnsMedian / P25 / P75 / P95` | percentiles del campo `turns = max(pjAttacks, loboAttacks)` |
| `pjHpRatioWhenWin_mean` | media de `pjHpAtEnd / pjHpMax` solo en combates ganados |
| `diedTurn1ByCritRate` | combates donde el lobo mata al PJ en su **primer** ataque y ese ataque fue heurísticamente crítico |
| `damageReceivedPerTurn_mean` | daño total recibido / ataques del lobo (proxy de letalidad) |
| `loboHitRate` | impactos del lobo / ataques del lobo |
| `pjCritRate / loboCritRate` | tasas de crítico observadas (heurística: `dmg ≥ 2·weapon_damage && dmg par`; aproximación, no load-bearing) |

> **Nota sobre la heurística de crítico**: `resolveAttack` no expone el flag `critical` por fuera del `AttackResult` y este simulador no instrumenta dentro de `applyCharacterAction`/`applyEnemyTurn`. Aproximamos el crítico desde el daño aplicado. Es preciso para la métrica clave (muerte turno 1 por crit) porque si el lobo te mata con `dmg ≥ HP_max`, el crit se nota; las tasas de crítico globales pueden tener ±2-3% de ruido — irrelevante para los constraints.

---

## 5. Iteración 1 — hipótesis del briefing

Stat-line:
```
attack_pool: 3   defense_threshold: 2   weapon_damage: 2   initiative_base: 4   hp_max: 8
```

| Build | Arma | Vict% | Mort% | TurnsMed | P75 | P95 | HP%win | DT1Crit | Dmg/turn | LobHit% |
|---|---|---|---|---|---|---|---|---|---|---|
| A | dmg 1 | **86.1%** | 13.9% | 3 | 4 | 6 | 51.0% | 0.0% | 2.57 | 87.3% |
| A | dmg 2 | **95.7%** | 4.3% | 3 | 3 | 4 | 61.8% | 0.0% | 2.61 | 87.1% |
| A | dmg 3 | **98.0%** | 2.0% | 2 | 3 | 4 | 68.4% | 0.0% | 2.62 | 87.5% |
| B | dmg 1 | 4.8% | 95.2% | 5 | 6 | 7 | 28.4% | 0.0% | 2.38 | 87.5% |
| B | dmg 2 | 29.9% | 70.1% | 5 | 5 | 7 | 36.1% | 0.0% | 2.42 | 87.4% |
| B | dmg 3 | 50.1% | 49.9% | 4 | 5 | 6 | 43.7% | 0.0% | 2.46 | 87.7% |

**Veredicto:** la stat-line del briefing se cae. Build A · arma media gana **95.7%** (target 25-40%). El lobo es un cachorro. Razones:

- HP 8 muere en 2-3 turnos contra pool 6 (~3 éxitos × dmg 2 + crítico frecuente).
- Threshold 2 con pool 6: el PJ saca 3+ éxitos casi siempre, margen ≥1, daño 3+ por golpe.
- Crítico del PJ en arma media: **28.7%** observado. El motor convierte el pool grande en críticos frecuentes (regla #36: ≥2 seises). Eso multiplica todo por 2.

Las únicas celdas que parecen sanas son Build B con armas baja/media — pero Build B no es target. Es el contraste que queríamos ver: **Build A es absurdamente fuerte, Build B muere sin chances.**

---

## 6. Resumen de iteraciones (qué tocó cada una)

| Iter | attack_pool | defense_threshold | weapon_damage | hp_max | A·media Vict% | A·media HP%win | TurnsMed | Veredicto |
|---|---|---|---|---|---|---|---|---|
| 1 | 3 | 2 | 2 | 8 | 95.7% | 61.8% | 3 | Lobo cachorro. |
| 2a | 3 | 2 | 2 | 10 | 91.6% | 54.8% | 3 | Subir HP solo no mueve la aguja. |
| 2b | 3 | 2 | **1** | 10 | 99.1% | 68.0% | 3 | Bajar dmg sube HP%win, sube victoria. Peor. |
| 2c | 3 | 2 | 2 | **6** | 98.3% | 68.7% | 2 | Lobo más fácil aún. Descartado. |
| 2d | 3 | **3** | 2 | 8 | 79.5% | 51.5% | 3 | Subir threshold reduce margen del PJ. Cierra B (1.4%) y A baja, pero sigue alto. |
| 2e | **4** | 2 | 2 | 8 | 87.0% | 55.9% | 3 | Más letalidad sin tanque no resuelve la victoria. |
| 3a | 3 | **3** | 2 | **12** | 55.8% | 39.1% | 5 | Cerca pero alto. Build B se va a 0% (esperado). |
| 3b | 3 | 3 | 2 | **14** | 43.9% | 35.0% | 5 | Casi en zona. |
| **3c** | **3** | **3** | **2** | **16** | **33.4%** | **31.5%** | **5** | **EN ZONA. Centro de la banda.** |
| 3d | **4** | 3 | 2 | 14 | 25.6% | 32.5% | 4 | También en zona, extremo bajo. Combates más cortos. |
| 3e | 4 | 3 | 2 | 16 | 17.0% | 28.8% | 4 | Demasiado duro. HP%win cae bajo el 30%. |
| 3f | 4 | 3 | **1** | 12 | 63.0% | 41.7% | 5 | Pool alto compensado con dmg bajo: vuelve a desbalancear. |

**Total: 12 iteraciones, 720.000 combates simulados.** Los movimientos que importaron, en orden de impacto:

1. **`defense_threshold: 2 → 3`** (−15 a −30 puntos de victoria en A·media). El cambio palanca. El PJ tiene pool 6 contra threshold 2 → casi siempre supera con margen alto. Subir a threshold 3 hace que el PJ deba sacar 3+ éxitos (probabilidad ~0.66 por dado a 4+, P(≥3 éxitos en 6 dados) ≈ 65%, no 99%).
2. **`hp_max: 8 → 16`** (−20 a −25 puntos de victoria adicionales). Una vez baja la frecuencia de impacto-con-margen, el HP del lobo determina cuántos turnos sobrevive.
3. `weapon_damage` y `attack_pool` del lobo: **mover por debajo no merece la pena**. Subir el daño del lobo hunde el HP%win por debajo del 30%; bajarlo deja al PJ con un saco de boxeo que no muerde.

---

## 7. Iteración ganadora — 3c

Stat-line:
```
attack_pool: 3   defense_threshold: 3   weapon_damage: 2   initiative_base: 4   hp_max: 16
```

| Build | Arma | Vict% | Mort% | TurnsMed | P75 | P95 | HP%win | DT1Crit | Dmg/turn | LobHit% |
|---|---|---|---|---|---|---|---|---|---|---|
| A | dmg 1 | 8.0% | 92.0% | 6 | 7 | 8 | 25.7% | 0.0% | 2.41 | 87.4% |
| **A** | **dmg 2** | **33.4%** | **66.6%** | **5** | **6** | **7** | **31.5%** | **0.0%** | 2.46 | 87.1% |
| A | dmg 3 | 55.7% | 44.3% | 5 | 6 | 7 | 38.1% | 0.0% | 2.51 | 87.5% |
| B | dmg 1 | 0.0% | 100.0% | 5 | 6 | 7 | — | 0.0% | 2.37 | 87.5% |
| B | dmg 2 | 0.0% | 100.0% | 5 | 6 | 7 | — | 0.0% | 2.37 | 87.4% |
| B | dmg 3 | 0.1% | 99.9% | 5 | 6 | 7 | 20.8% | 0.0% | 2.37 | 87.6% |

### Verificación de constraints (Build A · arma media, celda principal)

| Constraint | Valor objetivo | Valor obtenido | ✓ / ✗ |
|---|---|---|---|
| Victoria | 25-40% | **33.4%** | ✓ centro de la banda |
| HP%win (PJ-que-gana) | 30-60% | **31.5%** | ✓ extremo bajo (mejor: la victoria cuesta) |
| DT1Crit | < 5% (ideal < 2%) | **0.0%** | ✓ inalcanzable matemáticamente con esta stat-line |
| TurnsMed | 4-7 | **5** | ✓ |

### Build B (contraste, no target)

Build B muere casi siempre (0-0.1% victoria). Es el resultado **esperado**: con FUE 2 + skill 1 = pool 3, contra threshold 3 del lobo, el PJ saca el threshold ~24% de las veces (P(≥3 éxitos con 3 dados a 4+) = 0.5³ = 12.5% si fueran solo 3, y como cada dado es 50%, P(≥3) = 12.5%; observamos 12-13% de hits coherente). El daño esperado por turno del PJ B es ínfimo y el HP del lobo (16) lo hace inalcanzable. **No es un error: es la lección.** Si Bazalo decide que Build B con arma alta debe tener al menos un 5% de chance, hay que reabrir; mi recomendación es no abrirlo, B es contraste.

### Sobre A·alta (55.7%) saliendo del 40% superior

A·alta queda por encima del target. El briefing especifica el target sobre **arma_media**, no sobre las tres. Es correcto que el spread por arma exista (jugador con suerte de loot inicial gana más). No es un bug a corregir. Si Bazalo quisiera apretar más, habría que mover a iteración 3d (pool 4, hp 14): A·alta cae a 45.5%, A·media a 25.6%. La elección es preferencia narrativa: 3c centra A·media en 33.4% y deja un combate de 5 turnos cómodo; 3d centra A·media en 25.6% (más muerto) y combate de 4 turnos más rápido.

---

## 8. Stat-line final validada

```ts
// Lobo del Bosque — primer enemigo del juego (H3.2c).
// Validado en simulaciones/lobo-v0.1.md con 60.000 combates por iteración,
// 12 iteraciones, motor real. Build A · arma_media: 33.4% victoria
// (target 25-40%), HP%win 31.5% (target 30-60%), 5 turnos mediana,
// 0% muertes turno 1 por crítico.
{
  id: 'lobo_del_bosque',
  name: 'Lobo del Bosque',
  level: 1,
  attack_pool: 3,
  defense_threshold: 3,
  weapon_damage: 2,
  initiative_base: 4,
  hp_max: 16,
}
```

**Cambios respecto al briefing**: dos. `defense_threshold` 2 → 3, `hp_max` 8 → 16. `attack_pool`, `weapon_damage` e `initiative_base` quedan como se propusieron.

---

## 9. Hallazgos no anticipados

1. **DEF de los builds del briefing es 3, no 4.** La fórmula `computeDefense` es `2 + floor(DES/2)`. Con DES 2 → 3, con DES 3 → 3. El briefing decía DEF≈4 pero el motor da 3. **Implicación**: el threshold contra el PJ es 1, no 2 → el lobo impacta el 87% del tiempo (vs ~50% que asumiría DEF 4). Si Bazalo quiere que el PJ se sienta más resistente, habría que reabrir la fórmula de DEF, no la stat-line del lobo.
2. **El one-shot por crítico es matemáticamente imposible** con esta stat-line. weapon_damage 2 + margen máximo (~3) + crítico (×2) → 10 dmg cap. Build A (HP 14) y Build B (HP 12) están por encima. Constraint **trivialmente cumplido**, no es virtud del balanceo: es ley algebraica.
3. **El crítico del PJ es muy frecuente con pool grande**: 26-28% en Build A. Esto encaja con el dado #36 (P(≥2 seises en 6 dados) ≈ 26.3%). Es una característica del sistema, no un bug; el director ya lo conocía por la simulación del dado v0.2 (§5: "saturación de A en niveles altos"). En H3 no es problema; en niveles altos la curva pedirá vigilancia.
4. **Build B no es jugable** contra el lobo final. 0-0.1% victoria. Si Bazalo monta una mecánica narrativa para que el primer combate sea menos punitivo con builds bajas (huida fácil, perk de "primera vida", o variante de tutorial), va aparte de esta stat-line. La permadeath educativa funciona; no la suavizamos en este sub-paso.
5. **La duración del combate no pelea con la tasa de victoria** en 3c. P95 de 7 turnos: en el peor 5% de combates el PJ sigue sin sobrepasar el límite superior del target (4-7). Combate decidido y corto siempre.

---

## 10. Trade-offs

Ninguno bloqueante. Trade-off aceptado: A·alta (dmg 3) sale a 55.7%, fuera del target del 40%. Justificación: el target del briefing aplica a arma_media. El spread por arma representa la suerte de loot inicial, que es deseable. Si Bazalo prefiere apretar y aceptar combates más cortos: pasar a 3d (pool 4, hp 14, dmg 2). Recomendación firme: **3c**.

---

## 11. Lo que viene

Sub-paso H3.2c: meter esta stat-line en `data/enemies.ts`. **No se hace en 2b**: 2b solo valida. El .md y el .sim.ts quedan como evidencia para revisión.

Cuando H5 cierre el catálogo de Items y las armas iniciales tengan `weapon_damage` real, se reabre como **lobo-v0.2.md** con las armas concretas. El esqueleto de la simulación no cambia; solo se sustituyen las armas paramétricas por las definitivas y se re-corre el grid. Si una de las armas concretas cae fuera de la banda 25-40%, decide entonces Bazalo: ajustar arma o aceptar el spread.

---

## 12. Volcado JSON de referencia

El archivo completo (~2.150 líneas) se obtiene corriendo `npx tsx simulaciones/lobo-v0.1.sim.ts | awk '/JSON_DUMP_BEGIN/,/JSON_DUMP_END/'`. Cabecera reproducible:

```json
{
  "meta": {
    "iteracionesPorCelda": 10000,
    "seedMaestro": "0xc0ffee42",
    "fecha": "2026-04-29",
    "derivados": {
      "buildA_HpMax": 14, "buildA_Def": 3, "buildA_Threshold": 1, "buildA_Pool": 6,
      "buildB_HpMax": 12, "buildB_Def": 3, "buildB_Threshold": 1, "buildB_Pool": 3
    }
  }
}
```

Reproducción: misma seed, mismas 10.000 iteraciones, dos ejecuciones consecutivas dan exactamente los mismos números.

---

## 13. Historial

**v0.1** — 29/4/2026. Primera simulación del primer enemigo. Hipótesis del briefing (`pool 3, thr 2, dmg 2, hp 8`) refutada (Build A · arma media → 95.7% victoria). Doce iteraciones. Cierre: `pool 3, thr 3, dmg 2, ini 4, hp 16` (iteración 3c). Constraints cumplidos: 33.4% victoria en celda principal, HP%win 31.5%, 0% muertes turno 1 por crítico, 5 turnos mediana. Hallazgo colateral: DEF de los builds del briefing es 3 (no 4), implicación documentada en §9.
