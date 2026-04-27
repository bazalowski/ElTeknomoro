# El Teknomoro — Proceso de dirección

> Documento de ruta. Lo que el director está haciendo, por qué, y en qué paso estamos.
> **Versión:** v0.4 · **Fecha:** 27 de abril de 2026
> **Cambio v0.3 → v0.4:** sustituidas en el Paso 1 las referencias obsoletas a `ELTEKNOMORODESIGNDIRECTOR.yaml` y `Teknomoro-Assistant-Skill-v01.md` (fuentes que ya no existen en el repo) por `.claude/agents/el-teknomoro-director.md` y `.claude/skills/modopipeline/SKILL.md`. Alineación con la estructura real de `.claude/`.
> **Cambio v0.2 → v0.3:** añadida sección "Pipeline de UI" (Prompt Master → director → impeccable) como protocolo obligatorio para H2 en adelante. El lore del mundo deja de estar fuera de scope: queda fijado en decisión #47 de la biblia v0.9.
> Autor: el-teknomoro-director.

---

## Para qué existe este documento

Para que Bazalo no se pierda. Cada vez que volvamos al proyecto después de días fuera, este documento dice:

1. Qué se ha hecho ya.
2. Qué se está haciendo ahora.
3. Qué viene después y por qué en ese orden.
4. Qué **no** se va a hacer todavía (y por qué no).

No es un roadmap de producto. Es el cuaderno de bitácora del director.

---

## La regla sagrada que gobierna todo el proceso

> **No se escribe código de una mecánica hasta que sus números estén validados por simulación.**

El coste de reescribir una regla en TypeScript es muy superior al coste de reescribirla en una hoja de cálculo. Cada bloqueante del reglamento se cierra con **simulación numérica** (hoja de cálculo, script de dados) antes de tocar `rules.ts`. Cuando el prototipo web esté en pie, los ajustes finos de balance se validan jugando el propio prototipo.

La fase de juego de mesa (PDF) está **fuera del proceso activo**. Si en el futuro se recupera, se reincorpora a este documento. Por ahora no existe.

---

## Las cinco zonas del proyecto

Cuando Bazalo pregunta algo, la pregunta cae en una de estas cinco zonas. Saber en cuál estamos evita confundir diseño con implementación.

| Zona | Qué contiene | Estado hoy |
|---|---|---|
| 1. Reglamento | Dado, atributos, habilidades, DEF, crafteo, loop | v0.3 en revisión, cinco bloqueantes abiertas |
| 2. Mundo y narrativa | Lore, facciones, tono, biomas | Fuera de scope hasta que reglamento cierre |
| 3. UX del navegador | Pantallas, flujos, controles | **Aquí estamos ahora** (test de 130 + profundización) |
| 4. Arquitectura de código | `rules.ts`, render, save, data | Planificada en biblia §7, sin tocar |
| 5. Producción y scope | Qué entra en MVP, qué no, fechas | Gestionada en cada hito |

---

## El flujo que estamos ejecutando

### Paso 1 — Diagnóstico del estado (hecho)

Leídos y asimilados:

- `biblia-del-juego.md` v0.3 — reglamento, decisiones cerradas, preguntas abiertas.
- `test-funcionalidades-mvp.md` — 130 preguntas de UX/funcionalidad del MVP web, ya respondidas por Bazalo.
- `.claude/agents/el-teknomoro-director.md` — rol de dirección de diseño.
- `.claude/skills/modopipeline/SKILL.md` — contrato del pipeline de UI.

**Resultado del diagnóstico**: el test de funcionalidades está **respondido pero no es suficiente para escribir código**. Tiene decisiones a nivel UX pero deja ambigüedades que, si se resuelven mal, condicionan la arquitectura de `rules.ts` durante el resto del proyecto.

### Paso 2 — Segundo test de profundización (haciendo ahora)

**Archivo**: `test-profundizacion-v0.1.md`.

**Objetivo**: cerrar las ambigüedades del primer test **sin** entrar en implementación. Cada pregunta deriva de una respuesta concreta del test de 130 que abre más dudas de las que cierra.

**Criterio de selección de preguntas**:

- Solo pregunto lo que condiciona arquitectura o scope.
- No pregunto lo que ya se puede inferir del reglamento.
- No pregunto lo que sea pura opinión estética sin consecuencia técnica.
- Marco `[REGLAMENTO]` si la respuesta depende de cerrar un bloqueante del reglamento primero.

**Formato**: igual que el test de 130 (bloques temáticos, preguntas numeradas, posibilidad de marcar `[ABIERTO]`).

**Salida esperada**: cuando Bazalo responda este segundo test, tendré suficiente para producir un **Documento de Scope v0.1 del MVP web** (Paso 3) sin volver a preguntarle nada trivial.

### Paso 3 — Documento de Scope del MVP web (pendiente)

Se genera **después** de responder el test de profundización.

Contenido:

- Qué entra en el MVP web (lista cerrada).
- Qué no entra (lista explícita, para cortar scope creep).
- Orden de construcción (qué se implementa primero y por qué).
- Dependencias con el reglamento (qué bloqueantes hay que cerrar antes de cada módulo).
- Estimación gruesa de esfuerzo por módulo.

Este documento **no incluye código ni arquitectura detallada**. Es el contrato de alcance.

### Paso 4 — Cierre de bloqueantes del reglamento (pendiente, en paralelo)

Los cinco bloqueantes del reglamento (`biblia-del-juego.md` §6) siguen abiertos. Dos son especialmente críticos para el navegador:

1. **Pool de dados o dado único** → determina cómo se anima la tirada, cómo se muestra el resultado, cómo se estructura `dice.ts`.
2. **Gancha del primer minuto** → determina la primera pantalla post-creación.

Se cierran con **simulación numérica** (hoja de cálculo o script de Monte Carlo). Ese es el instrumento de validación.

### Paso 5 — Arquitectura técnica detallada (pendiente)

Se produce después de:
- Tener el Documento de Scope (Paso 3).
- Tener al menos las dos bloqueantes críticas del reglamento cerradas (Paso 4).

Hasta entonces, la sección §7 de la biblia es suficiente.

### Paso 6 — Código (pendiente)

No se toca hasta:
- Scope cerrado.
- Bloqueantes numéricos del reglamento simulados y validados.
- Arquitectura firmada.

Cuando se empiece, el primer módulo que se construye es `rules/dice.ts` + `rules/character.ts`, por este orden, y con tests unitarios desde la primera línea.

### Paso 7 — Playtest del prototipo (pendiente, recurrente)

Una vez el prototipo tenga crear-personaje + un combate jugable, **el propio prototipo se convierte en la mesa de pruebas**. Cada iteración de balance pasa por: cambiar número → jugar sesión → anotar fricción → iterar.

---

## En qué paso estamos hoy

**Paso 2, en ejecución.**

Producido hoy:
- `proceso-director.md` (este archivo, v0.2).
- `test-profundizacion-v0.1.md` (el segundo test).

Esperando de Bazalo:
- Respuestas al test de profundización.
- (Paralelo) avance en simulaciones numéricas del sistema de dados.

---

## Qué NO estoy haciendo ahora mismo (y por qué no)

- **No estoy escribiendo código.** Regla sagrada: bloqueantes numéricos sin cerrar.
- **No estoy diseñando la arquitectura detallada de `rules.ts`.** Depende del dado.
- **No estoy eligiendo librerías ni definiendo `tsconfig.json`.** Prematuro.
- **No estoy generando biomas concretos ni catálogos de contenido todavía.** El marco lore del mundo sí está fijado (decisión #47 biblia v0.9: post-humano, naturaleza vencedora, esoterismo raro y reverencial), pero los biomas, NPCs, items y recetas concretos se redactan en su hito.
- **No estoy generando catálogos de items, enemigos o recetas.** Son entregables del Paso 3/4.
- **No estoy abriendo Figma.** El MVP web es Canvas; el wireframe llega después del Scope.
- **No estoy pensando en versión de mesa ni en PDF de reglas.** Eliminada del proceso activo.

---

## Protocolo si Bazalo se desorienta

Si en algún momento Bazalo no sabe en qué estamos:

1. Abre este documento.
2. Mira "En qué paso estamos hoy".
3. Si sigue sin encajar, pregunta al director: **"¿en qué paso estamos?"**. El director responde citando este documento, no improvisando.

Si Bazalo quiere **cambiar el orden del proceso** (ej. "quiero empezar a codificar ya"), el director dice no y explica por qué citando esta ruta. Si la razón de Bazalo convence, se actualiza este documento antes de actuar.

---

## Pipeline de UI (obligatorio desde H2)

Toda creación o modificación de UI en El Teknomoro pasa por una cadena fija de tres pasos. No se salta ni se reordena. Aplica desde H2 (creación de personaje en UI) en adelante.

```
[Intención bruta de Bazalo]
   ↓
[1] Prompt Master           — estructura el prompt UI (tarea, contexto, restricciones, criterio de éxito, formato)
   ↓
[2] el-teknomoro-director   — valida contra biblia, scope, decisión #47 y PRODUCT/DESIGN. Veredicto: APTO / APTO CON CAMBIOS / NO APTO.
   ↓
[3] impeccable              — diseña/implementa con PRODUCT.md y DESIGN.md cargados.
   ↓
[Output revisable]
```

**Reglas de avance:**
- Cada paso muestra su output a Bazalo antes de avanzar al siguiente.
- Si el director devuelve **NO APTO**, el pipeline se detiene. La razón típica: regla todavía no jugada/simulada, contenido no cerrado, decisión arquitectónica reabierta sin justificación.
- Si devuelve **APTO CON CAMBIOS**, se avanza al paso 3 con el prompt corregido por el director, no con el original.

**Prerrequisitos one-time (cerrados en v0.9):**
- `PRODUCT.md` en raíz (marca, register, anti-references, principios estratégicos).
- `DESIGN.md` en raíz (paleta OKLCH cerrada, tipografía, contrastes, pares prohibidos).
- Skill `.claude/skills/modopipeline/SKILL.md` que enforza el flujo.

**Cuándo NO aplica el pipeline:**
- Cambios de reglas, datos o motor (`rules/`, biblia, simulaciones) → director directo, sin impeccable.
- Backend, Supabase, scripts → trabajo normal sin skill.
- Microajustes triviales en UI ya existente (renombrar un label, ajustar 2px de padding) → permitido directo, salvo que Bazalo invoque "modo pipeline" explícitamente.

---

## Historial de este documento

**v0.1** — creación tras diagnóstico inicial. Seis pasos, uno en curso. Incluía fase de mesa como requisito previo al código.

**v0.2** — eliminada fase de mesa del proceso activo. El reglamento se valida por simulación numérica y por playtest del propio prototipo web. Añadido Paso 7 (playtest). Ajustada la regla sagrada para centrarla en simulación, no en mesa.

**v0.3** — añadida sección "Pipeline de UI" (Prompt Master → director → impeccable) como protocolo obligatorio desde H2 en adelante, con `PRODUCT.md`, `DESIGN.md` y skill `modopipeline` como prerrequisitos cerrados. El lore del mundo (decisión #47 biblia v0.9) sale de la lista "fuera de scope": el marco está fijado, lo que queda fuera son los catálogos concretos de contenido por hito.

**v0.4** — sustituidas en el Paso 1 las referencias a `ELTEKNOMORODESIGNDIRECTOR.yaml` y `Teknomoro-Assistant-Skill-v01.md` (no existen en el repo) por `.claude/agents/el-teknomoro-director.md` y `.claude/skills/modopipeline/SKILL.md`. Cierra el `[CONFLICTO]` señalado en `flow-trabajo-v1.md` §1.
