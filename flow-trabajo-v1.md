# El Teknomoro — Flow de trabajo v1.0

Documento operativo. Conecta biblia → agente → archivo → validación → cierre. Imprimible. Anclado en archivos reales del repo a fecha de hoy.

Agentes/skills verificados existentes:
- `el-teknomoro-director` (`.claude/agents/el-teknomoro-director.md`).
- `modopipeline` (`.claude/skills/modopipeline/SKILL.md`).
- `impeccable` (`.claude/skills/impeccable/` → `.agents/skills/impeccable/SKILL.md`).
- `prompt-master`, `design-taste-frontend`, `high-end-visual-design`, `redesign-existing-projects` (skills globales de usuario).
- `claude-code-guide` [verificar] — no localizado en `.claude/agents/` ni en `~/.claude/skills/`. No se le asigna propiedad en v1.0.

Regla sagrada (proceso-director.md §"Principio rector"): no se escribe código de una mecánica hasta que sus números estén validados por simulación.

---

## 1. Las cinco zonas y su agente dueño

Las cinco zonas son las definidas en `proceso-director.md` (sección "Las cinco zonas del proyecto").

| Zona | Agente dueño | Skill secundaria | Archivos del repo que toca | Documento-fuente en la biblia |
|---|---|---|---|---|
| 1. Reglamento | `el-teknomoro-director` (Modo B → Modo A) | `prompt-master` para formular tests/preguntas | `simulaciones/*.mjs`, `simulaciones/*.md`, `src/rules/*.ts`, `src/rules/*.test.ts` | `biblia-del-juego.md` (reglamento, §bloqueantes), `proceso-director.md` |
| 2. Mundo y narrativa | `el-teknomoro-director` (Modo B) | `prompt-master` para depurar preguntas de lore | `cuestionariolore.md`, `h2-guia-redaccion-contenido.md`, `src/data/*.ts` (campos narrativos) | `cuestionariolore.md`, `biblia-del-juego.md` (decisión #47 lore y derivadas) |
| 3. UX del navegador | `el-teknomoro-director` orquesta el pipeline `modopipeline` | `prompt-master` (paso 1), `impeccable` (paso 3); `design-taste-frontend`, `high-end-visual-design`, `redesign-existing-projects` como referencia consultiva dentro de impeccable | `src/render/h2-*.ts`, `src/render/home-view.ts`, `src/render/login-view.ts`, `src/render/confirm-modal.ts`, `src/state/h2-flow.ts`, `src/state/h2-defaults.ts`, `src/style.css` | `DESIGN.md`, `scope-mvp-web-v0.1.md`, `h2-guia-redaccion-contenido.md`, `h2-dudas-contenido.md` |
| 4. Arquitectura de código | `el-teknomoro-director` (Modo A) | — | `src/rules/*.ts` (+ tests), `src/data/*.ts` (+ tests), `src/backend/*.ts`, `src/main.ts` | `biblia-del-juego.md` §arquitectura, `proceso-director.md` |
| 5. Producción y scope | `el-teknomoro-director` (Modo B, dirección de producto) | — | `scope-mvp-web-v0.1.md`, `PRODUCT.md`, `proceso-director.md` | `PRODUCT.md`, `scope-mvp-web-v0.1.md`, `proceso-director.md` |

Sin agentes huérfanos. Sin zonas sin dueño. `claude-code-guide` [verificar] no figura porque no está localizado.

---

## 2. Triggers — qué dispara qué

Modo: **consultivo** = sólo el director responde, no se toca código. **pipeline** = arranca `modopipeline` (Prompt Master → director → impeccable). **código** = el director entra en Modo A y produce diff.

| # | Frase/intención de Bazalo | Agente que arranca | Por qué ese y no otro | Modo |
|---|---|---|---|---|
| 1 | "Hay que validar el daño base del cuchillo" | `el-teknomoro-director` (zona 1) | Es reglamento sin números cerrados. Antes de tocar `src/rules/`, simulación en `simulaciones/`. | consultivo → simulación |
| 2 | "Codifica la fórmula de DEF" | `el-teknomoro-director` (zona 4) | Implementación en `src/rules/`. Sólo si la simulación de la zona 1 está validada y la regla está en biblia. | código |
| 3 | "Quiero la tasa de éxito de reserva 4 dados, umbral 2" | `el-teknomoro-director` (zona 1) | Pregunta numérica pura. Se resuelve con script en `simulaciones/`, no con prosa. | consultivo → simulación |
| 4 | "Quiero rediseñar la pantalla de skills" | `modopipeline` | Es UI nueva o reformulada. Pipeline obligatorio: prompt-master → director → impeccable. Toca `src/render/h2-skills-view.ts`. | pipeline |
| 5 | "Crea la pantalla de inventario H2" | `modopipeline` | UI nueva del flow H2. Misma cadena. Toca `src/render/h2-inventory-view.ts` y `src/state/h2-flow.ts`. | pipeline |
| 6 | "Las facciones del norte, ¿son una o dos?" | `el-teknomoro-director` (zona 2) | Decisión de lore. Se ancla en `cuestionariolore.md`, no en código. | consultivo |
| 7 | "¿Esto entra en el MVP o lo cortamos?" | `el-teknomoro-director` (zona 5) | Producto/scope. Se decide contra `scope-mvp-web-v0.1.md` y `PRODUCT.md`. La respuesta es a menudo "no". | consultivo |
| 8 | "Tengo dudas sobre los textos del perk X" | `el-teknomoro-director` (zona 2 + zona 3) | Contenido H2. Se vuelca a `h2-dudas-contenido.md` con la regla de redacción de `h2-guia-redaccion-contenido.md`. Si la duda cierra una decisión, va a biblia. | consultivo |
| 9 | "Ajusta los valores de `src/data/skills.ts`" | `el-teknomoro-director` (zona 4) | Edición de datos. Test (`skills.test.ts`) debe seguir verde. Si el cambio depende de balance, primero zona 1. | código |
| 10 | "Refactor de `rules.ts` para separar X" | `el-teknomoro-director` (zona 4) | Arquitectura pura. Modo A. Tests de `src/rules/*.test.ts` como red de seguridad. | código |
| 11 | "El botón de confirmar no responde / se ve roto" | `el-teknomoro-director` (zona 3) | Bug visible de UI. Se diagnostica primero (¿lógica en `h2-flow.ts` o render en `h2-confirm-view.ts`?). Si toca repensar UX, escala a `modopipeline`. | consultivo → código o pipeline |
| 12 | "El bloqueante #3 del reglamento sigue abierto, hay que cerrarlo" | `el-teknomoro-director` (zona 1 → 5) | Bloqueante de biblia. Se cierra con simulación o con sesión de diseño. Hasta cerrarlo, no se codifica nada que dependa. | consultivo → simulación |
| 13 | "Actualiza la biblia con la decisión de hoy" | `el-teknomoro-director` (zona 5) | Custodia de biblia. Sube versión y marca decisión. Ver §5. | consultivo |

---

## 3. Handoffs — qué entrega cada agente al siguiente

### Pipeline A — UI (vía `modopipeline`)

Disparador: triggers 4, 5, 11 (cuando 11 escala). Cadena: `prompt-master` → `el-teknomoro-director` → `impeccable`.

**Paso 1 — `prompt-master`**
- Input: petición en bruto de Bazalo (frase libre). Origen: chat.
- Output: prompt estructurado con objetivo, restricciones, archivos diana de `src/render/`, criterios de aceptación visuales y funcionales. Formato: bloque markdown entregado en chat. No se guarda en disco salvo que Bazalo lo pida.
- Listo para siguiente paso si: el prompt cita archivo(s) concreto(s) de `src/render/` o `src/state/`, referencia sección de `DESIGN.md` o `scope-mvp-web-v0.1.md`, y enumera criterios de aceptación binarios.

**Paso 2 — `el-teknomoro-director`**
- Input: prompt estructurado del paso 1.
- Output: plan de cambios en chat — qué archivos toca, qué módulos sagrados (`src/rules/`, `src/data/`) NO toca, qué reglas de `biblia-del-juego.md` aplican, qué textos vienen de `h2-guia-redaccion-contenido.md`. Formato: lista en chat. Sin código todavía.
- Listo para siguiente paso si: Bazalo da OK al plan (validación humana, ver §4), y el plan no requiere abrir bloqueantes de reglamento.

**Paso 3 — `impeccable`**
- Input: plan aprobado del paso 2 + archivos `src/render/h2-*.ts` y `src/style.css` actuales.
- Output: diff sobre los archivos de render/style en disco. Sin tocar `src/rules/` ni `src/data/`. Formato: archivos editados directamente vía herramienta Edit/Write.
- Listo para cierre si: `npm run build` pasa, los tests existentes (`src/rules/*.test.ts`, `src/data/*.test.ts`) siguen verdes, la pantalla se ve y funciona en navegador, Bazalo da OK visual.

### Pipeline B — Reglamento → código

Disparador: triggers 1, 2, 3, 9, 10, 12. Cadena: `el-teknomoro-director` (zona 1) → simulación → `el-teknomoro-director` (zona 4).

**Paso 1 — Director, zona 1 (diseño numérico)**
- Input: pregunta de Bazalo o bloqueante abierto en `biblia-del-juego.md`.
- Output: especificación numérica candidata (fórmula, rango, dado). Formato: bloque en chat o draft `simulaciones/<nombre>-vX.Y.md`.
- Listo para siguiente paso si: la spec es ejecutable como script (sin ambigüedad de interpretación).

**Paso 2 — Simulación**
- Input: spec numérica del paso 1.
- Output: script `simulaciones/<nombre>.mjs` + informe `simulaciones/<nombre>-vX.Y.md` con tasas, percentiles, conclusión. Ejemplos vivos: `dado-combate.mjs`, `iniciativa.mjs`, `progresion.mjs`.
- Listo para siguiente paso si: el informe contiene veredicto binario (validada / requiere ajuste / descartada) y Bazalo lo aprueba.

**Paso 3 — Director, zona 4 (implementación)**
- Input: informe de simulación validado + sección correspondiente de `biblia-del-juego.md`.
- Output: edición en `src/rules/<modulo>.ts` + test en `src/rules/<modulo>.test.ts` que audita exactamente la regla simulada (mismo número, mismo umbral). Comentario en código que cita la sección de la biblia.
- Listo para cierre si: `npm test` pasa, el test nuevo cubre el caso del informe, `npm run build` pasa, biblia actualizada (§5).

### Pipeline C — Lore / Scope → biblia

Disparador: triggers 6, 7, 8, 13. Cadena: `el-teknomoro-director` (zona 2 o 5) → custodia de biblia.

**Paso 1 — Director, captura**
- Input: pregunta o decisión propuesta por Bazalo.
- Output: respuesta razonada en chat + ubicación destino concreta (qué archivo, qué sección). Formato: chat.
- Listo para siguiente paso si: Bazalo da OK explícito a la decisión y a la ubicación.

**Paso 2 — Director, asentamiento**
- Input: decisión aprobada.
- Output: edición del archivo de biblia que corresponde:
  - Lore puro → `cuestionariolore.md`.
  - Decisión que afecta a reglamento o producto → `biblia-del-juego.md` (con número de decisión incrementado).
  - Cambio de scope → `scope-mvp-web-v0.1.md` y/o `PRODUCT.md`.
  - Norma de proceso → `proceso-director.md`.
  - Texto H2 → `h2-guia-redaccion-contenido.md` o resolución en `h2-dudas-contenido.md`.
- Listo para cierre si: archivo editado, versión subida según §5, Bazalo da OK al commit.

---

## 4. Puntos de validación de Bazalo

Recordatorio: OK a commit ≠ OK a push. Cada acción se aprueba aparte.

### Pipeline A (UI)
1. **Tras paso 1** (prompt-master): Bazalo aprueba el prompt estructurado. NO se llama al director hasta este OK.
2. **Tras paso 2** (director): Bazalo aprueba el plan. NO se invoca a impeccable, NO se edita `src/render/`, NO se commitea hasta este OK.
3. **Tras paso 3** (impeccable): Bazalo aprueba visualmente y funcionalmente la pantalla. Sólo entonces:
   - OK a commit → se commitea con mensaje describiendo la pantalla y archivos tocados.
   - OK a push (separado) → se pushea.
   - Si Bazalo sólo da OK a commit, no se pushea.

### Pipeline B (Reglamento → código)
4. **Tras paso 1** (spec numérica): Bazalo aprueba la spec. NO se escribe script de simulación hasta este OK.
5. **Tras paso 2** (simulación): Bazalo aprueba el informe. NO se toca `src/rules/` hasta este OK. El informe `.md` y el `.mjs` se commitean en este punto si Bazalo lo autoriza explícitamente.
6. **Tras paso 3** (código de regla): Bazalo aprueba la implementación + tests verdes. Sólo entonces:
   - OK a commit (código de `src/rules/` + actualización de biblia juntos en el mismo commit, ver §5).
   - OK a push (separado).

### Pipeline C (Lore / Scope → biblia)
7. **Tras paso 1** (decisión razonada): Bazalo aprueba la decisión y su ubicación. NO se edita ningún archivo de biblia hasta este OK.
8. **Tras paso 2** (asentamiento): Bazalo revisa el diff de biblia. Sólo entonces:
   - OK a commit del archivo de biblia.
   - OK a push (separado).

Regla operativa: ningún agente commitea autónomamente. Ningún agente pushea autónomamente. Si Bazalo dice "commit", se commitea y se espera. Si dice "push", se pushea.

---

## 5. La biblia como fuente viva

### Quién puede tocar cada archivo

| Archivo | Quién edita | Quién NO edita |
|---|---|---|
| `biblia-del-juego.md` | `el-teknomoro-director` (zonas 1, 2, 4, 5) bajo OK de Bazalo | `impeccable`, `prompt-master` |
| `scope-mvp-web-v0.1.md` | `el-teknomoro-director` (zona 5) bajo OK de Bazalo | resto |
| `cuestionariolore.md` | `el-teknomoro-director` (zona 2) bajo OK de Bazalo | resto |
| `proceso-director.md` | `el-teknomoro-director` bajo OK de Bazalo. Cualquier cambio sube versión. | resto |
| `DESIGN.md` | `el-teknomoro-director` bajo OK de Bazalo, normalmente al cerrar pipeline A | `impeccable` lo lee, no lo edita |
| `PRODUCT.md` | `el-teknomoro-director` (zona 5) bajo OK de Bazalo | resto |
| `h2-guia-redaccion-contenido.md` | `el-teknomoro-director` (zonas 2/3) bajo OK de Bazalo | resto |
| `h2-dudas-contenido.md` | `el-teknomoro-director` (registro continuo de dudas y resoluciones) | resto |

`impeccable` es **estrictamente** consumidor de la biblia. Nunca la edita. Si detecta una contradicción entre lo que dice la biblia y lo que pide el plan, escala al director.

### Cuándo se sube versión (criterio binario)

Sube versión menor (v0.9 → v0.10):
- Se cierra una decisión nueva en `biblia-del-juego.md` (incrementa el contador de decisiones).
- Se cierra un bloqueante listado en biblia.
- Se valida una regla numérica nueva tras simulación.
- Se cierra una pantalla del MVP en `scope-mvp-web-v0.1.md` o `DESIGN.md`.

Sube versión mayor (v0.x → v1.0):
- Cuando todos los bloqueantes activos del reglamento estén cerrados Y el MVP H2 esté completo en navegador. No antes.

No sube versión:
- Correcciones de tipo, reformateo, reordenación de secciones sin cambio semántico.

### Qué se actualiza tras cada tipo de cambio

| Tipo de cambio | Sección/archivo a actualizar | En el mismo commit que… |
|---|---|---|
| UI cerrada (pipeline A) | `DESIGN.md` (sección de la pantalla) + nota en `scope-mvp-web-v0.1.md` si la pantalla estaba pendiente | el commit de `src/render/*` |
| Regla validada (pipeline B) | `biblia-del-juego.md` (incrementa decisión + cita el informe de `simulaciones/`) | el commit de `src/rules/*.ts` + test |
| Decisión de lore | `cuestionariolore.md` y, si tiene impacto en reglamento, decisión nueva en `biblia-del-juego.md` | commit propio del archivo de biblia |
| Bloqueante resuelto | Marcar el bloqueante como cerrado en `biblia-del-juego.md` con número de decisión y enlace al informe o pantalla que lo cierra | el commit que lo cierra (regla, pantalla o documento de scope) |
| Norma de proceso | `proceso-director.md` (sube versión) | commit propio |

### Regla operativa contra la divergencia biblia ↔ código

**Todo commit que toca `src/rules/`, `src/data/` o `src/state/h2-*.ts` debe incluir en el mismo commit la actualización del archivo de biblia que respalda el cambio.** Si el cambio no requiere actualizar biblia, el director lo declara explícitamente en el mensaje del commit ("no afecta a biblia: refactor interno"). Si afecta y no se actualiza, el commit no se aprueba.

---

## 6. Anti-patrones que invalidan el flow

1. **`impeccable` toca `src/rules/` o `src/data/`.** Corrección: impeccable se limita a `src/render/`, `src/style.css` y, si procede, `src/state/h2-*.ts` para cableado de UI; cualquier cambio de regla o dato vuelve al director.
2. **Se commitea código de regla antes de que su simulación esté validada.** Corrección: bloquear el commit hasta que exista `simulaciones/<nombre>-vX.Y.md` con veredicto "validada".
3. **Se actualiza un archivo de biblia sin subir versión cuando los criterios de §5 lo exigen.** Corrección: el director rechaza el commit y exige bump de versión en el mismo diff.
4. **Se salta `prompt-master` y se llama directamente a `impeccable` para una pantalla nueva.** Corrección: revertir, arrancar `modopipeline` desde el paso 1.
5. **Se asume que un OK a commit implica OK a push.** Corrección: tras commit, esperar OK explícito de Bazalo para push. Si no llega, no se pushea.
6. **Se edita biblia y código en commits separados sin enlazarlos.** Corrección: el commit de código y el commit de biblia que lo respalda van en el mismo push, idealmente en un solo commit; si se separan, el mensaje de cada uno cita el hash del otro.
7. **Se abre un bloqueante de reglamento desde una conversación de UI.** Corrección: el director corta el pipeline A, redirige a pipeline B, y la pantalla espera.
8. **Se inventa un agente que no existe en `.claude/agents/` o `.claude/skills/`.** Corrección: si una tarea no encaja en los agentes verificados, el director la asume él mismo en consultivo; no se crean agentes en v1.0.
9. **`cuestionariolore.md` recibe decisiones de reglamento.** Corrección: las decisiones de reglamento van a `biblia-del-juego.md` con número; el cuestionario de lore solo guarda lore.
10. **Se ejecuta `modopipeline` para backend, datos o reglas.** Corrección: `modopipeline` es exclusivo de UI; backend/datos/reglas van por pipeline B con el director directo.
