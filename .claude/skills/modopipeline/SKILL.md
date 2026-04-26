---
name: modopipeline
description: Pipeline obligatorio para crear o modificar UI en El Teknomoro. Encadena Prompt Master → director El Teknomoro → impeccable. Dispara cuando Bazalo dice "modo pipeline", "/modopipeline", "MODOPIPELINE", o cuando pide UI/pantalla/componente nuevo en El Teknomoro. NO se usa para backend, reglas, datos, ni para Furbito u otros proyectos.
---

# MODO PIPELINE — UI El Teknomoro

Protocolo fijo para producir UI premium +++ en El Teknomoro. Bazalo lo aprobó el 2026-04-26. No se salta ningún paso. No se reordena.

## La cadena (en este orden, sin atajos)

```
[INPUT]   Bazalo escribe la intención en bruto.
   ↓
[PASO 1]  Prompt Master  → estructura el prompt UI
   ↓
[PASO 2]  el-teknomoro-director  → valida reglamento / scope / biblia
   ↓
[PASO 3]  impeccable  → diseña / implementa
   ↓
[OUTPUT]  Entrega revisable
```

Si te saltas un paso, Bazalo te lo va a echar en cara. La skill existe precisamente para que no lo hagas.

---

## Prerrequisitos (one-time, no se repiten cada tarea)

Antes de la PRIMERA invocación de la skill en el proyecto, verifica:

1. `PRODUCT.md` existe en raíz y no es placeholder.
2. `DESIGN.md` existe en raíz (recomendado, no bloqueante).

Si falta `PRODUCT.md`, detén el pipeline e indica a Bazalo:
> "Falta PRODUCT.md. Antes de arrancar el pipeline, ejecutamos `$impeccable teach` una sola vez. Después seguimos con tu intención original."

No avances al PASO 1 hasta que el setup esté listo.

---

## PASO 1 — Prompt Master

**Objetivo**: convertir la intención bruta de Bazalo en un prompt UI quirúrgico, listo para ser validado por el director.

**Cómo se ejecuta**:
- Invoca la skill `prompt-master` (vía la herramienta Skill) pasándole la intención de Bazalo y el contexto: target tool = `impeccable` (skill de diseño dentro de Claude Code, register=product, proyecto El Teknomoro).
- Si Prompt Master pregunta hasta 3 clarificaciones, las trasladas a Bazalo tal cual. No respondes tú por él.
- El output esperado es un prompt UI estructurado con: tarea, contexto del proyecto, restricciones, criterio de éxito, formato de salida.

**Antes de avanzar al PASO 2, muestra a Bazalo el prompt que ha producido Prompt Master.** Sin su OK, no avanzas. Esto no es opcional.

---

## PASO 2 — Director El Teknomoro

**Objetivo**: validar que el prompt del PASO 1 respeta reglamento, scope MVP, biblia y decisiones cerradas. El director es la última línea antes de que se mueva un píxel.

**Cómo se ejecuta**:
- Invoca el agente `el-teknomoro-director` (vía la herramienta Agent, `subagent_type: "el-teknomoro-director"`).
- Pásale el prompt del PASO 1 íntegro y pídele explícitamente que conteste en este formato:
  1. **Veredicto**: APTO / APTO CON CAMBIOS / NO APTO.
  2. **Razones**: cita de biblia, scope o decisión cerrada.
  3. **Cambios al prompt** (si APTO CON CAMBIOS): el prompt corregido, listo para PASO 3.
  4. **Bloqueo** (si NO APTO): qué falta jugar, simular o cerrar antes de tocar UI.

**Reglas de avance**:
- APTO → avanzas al PASO 3 con el prompt original.
- APTO CON CAMBIOS → avanzas al PASO 3 con el prompt corregido. Avisas a Bazalo del cambio en una línea.
- NO APTO → **detienes el pipeline**. Le cuentas a Bazalo qué dijo el director y le devuelves la pelota. No improvises código.

---

## PASO 3 — Impeccable

**Objetivo**: ejecutar el diseño/implementación con la skill `impeccable`, usando el prompt validado.

**Cómo se ejecuta**:
- Invoca la skill `impeccable` (vía la herramienta Skill) pasando el prompt aprobado por el director.
- Register esperado: **product** (El Teknomoro es app/juego, no marketing). Si en algún caso fuera brand (web pública, landing), el director lo habrá indicado en el PASO 2.
- Sigue las reglas de impeccable al pie: shared design laws, register product, sin atajos.

---

## OUTPUT

Tras el PASO 3, entregas a Bazalo:
1. Resumen de una frase de qué se ha producido.
2. Archivos creados/modificados con rutas markdown clicables.
3. Pasos de validación visual (qué abrir, qué probar).

Nada más. Sin recapitular el pipeline, sin felicitarte.

---

## Cuándo NO usar esta skill

- Cambios de reglas, datos o motor (`rules.ts`, biblia, simulaciones) → director directo, sin impeccable.
- Backend, supabase, scripts → director o trabajo normal.
- Otros proyectos (Furbito, etc.) → la skill no aplica, ignórala.
- Microajustes triviales en UI ya existente (renombrar un label, subir 2px un padding) → puedes hacerlo directo, pero si Bazalo dice "modo pipeline" lo respetas igualmente.

---

## Reglas de oro

1. **El orden es sagrado**: Prompt Master → Director → Impeccable. Nunca al revés, nunca saltando.
2. **Cada paso muestra su output a Bazalo antes de avanzar.** Él aprueba o corrige.
3. **Si el director dice NO APTO, el pipeline se detiene.** Cero excepciones.
4. **No mezcles roles**: Prompt Master no diseña, el director no escribe CSS, impeccable no valida reglas.
5. **Una tarea = un pipeline completo.** No reutilizas el prompt del PASO 1 de la tarea anterior para una tarea nueva.
