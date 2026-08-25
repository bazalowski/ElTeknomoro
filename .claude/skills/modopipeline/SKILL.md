---
name: modopipeline
description: Pipeline obligatorio para crear o modificar UI en El Teknomoro. Encadena Prompt Master → director El Teknomoro → impeccable. Dispara cuando Bazalo dice "modo pipeline", "/modopipeline", "MODOPIPELINE", o cuando pide UI/pantalla/componente nuevo en El Teknomoro. NO se usa para backend, reglas, datos, ni para Furbito u otros proyectos.
---

# MODO PIPELINE — UI El Teknomoro

Protocolo para producir UI premium +++ en El Teknomoro. Aprobado por Bazalo el 2026-04-26. **v2 (2026-05-06): tres carriles y un solo hilo.** El orden de los pasos sigue siendo sagrado; lo que cambia es cuántos pasos aplica cada tarea y cuánto contexto arrastra cada uno.

## La cadena

```
[INPUT]   Bazalo escribe la intención.
   ↓
[PUERTA]  Clasificas la entrada en carril A, B o C.
   ↓
[PASO 1]  Prompt Master        → compila el brief UI     (carril A)
[PASO 2]  el-teknomoro-director → valida contra biblia    (carriles A y B)
[PASO 3]  impeccable           → diseña / implementa      (siempre)
   ↓
[OUTPUT]  Entrega revisable.
```

Nunca al revés. Nunca saltando un paso que el carril sí exige.

---

## Regla de hilo único

**Los tres pasos corren en la MISMA sesión.** Nada de "abre chat nuevo entre paso y paso": eso era necesario cuando la ventana de contexto no daba para la biblia entera, y hoy sólo sirve para pagar tres veces la misma lectura. La biblia son ~46.500 tokens; `DESIGN.md` ~14.500. Partir el hilo los vuelve a cargar desde cero en cada corte.

El artefacto `.claude/pipeline/<hito>-<subpaso>.md` se sigue escribiendo, pero como **registro de lo decidido**, no como mecanismo de traspaso entre chats.

---

## PUERTA — clasificar la entrada

Antes de invocar a nadie, decide el carril. Se decide por **cuán cerrada está la decisión de producto**, no por el tamaño de la pantalla.

| Carril | Cuándo | Pasos |
|---|---|---|
| **A · intención bruta** | Bazalo describe un deseo ("que la pantalla de X se sienta Y") y no hay decisión cerrada que lo fije. | 1 → 2 → 3 |
| **B · decisión cerrada** | El sub-paso ya tiene decisiones numeradas en biblia (#N) que fijan qué se pinta y cómo. | 2 → 3 |
| **C · microajuste** | Retoque en UI existente: un label, un padding, un color ya cerrado. | 3 |

**Por qué existe el carril B.** Cuando un cuestionario de scope ya se cerró y sus decisiones están escritas en la biblia, el PASO 1 no compila información nueva: la reescribe con otras palabras. En ese caso el brief se **compila citando** las decisiones, y el director valida la traducción decisión→UI en vez de revalidar la decisión.

**Si dudas entre A y B, es A.** El coste de un paso de más es mucho menor que el de diseñar sobre una decisión que nadie cerró.

**Anuncia el carril a Bazalo en una línea antes de arrancar.** Él puede subirte de carril.

---

## PASO 1 — Prompt Master (sólo carril A)

Convierte la intención bruta en un brief UI quirúrgico.

- Invoca la skill `prompt-master` con la intención de Bazalo y el contexto: target = `impeccable`, register = `product`, proyecto El Teknomoro.
- Si pregunta clarificaciones (máx. 3), las trasladas a Bazalo tal cual. No respondes tú por él.
- **Muestra el brief a Bazalo antes del PASO 2.** Sin su OK no avanzas.

En carril B compilas tú el brief citando las decisiones. Mismo formato, misma exigencia, sin invocar a nadie.

### Formato del brief (obligatorio en A y B)

El brief es la pieza que hace barato el PASO 3: **lleva destilado lo que impeccable necesita para no abrir `DESIGN.md` ni la biblia.** Secciones fijas:

1. **Contexto** — proyecto, register, tokens y reglas inviolables de `DESIGN.md` que apliquen (citados, no referenciados).
2. **Estado de partida** — qué existe ya en el repo, contratos de los módulos que va a consumir, qué está testeado.
3. **Tarea** — una frase.
4. **Estructura interna requerida** — numerada.
5. **Constraints** — lo que NO puede hacer.
6. **Output format** — archivos exactos, firmas exactas.
7. **Done when** — criterio verificable (`npm test`, `tsc --noEmit`, qué se ve en pantalla).
8. **Out of scope** — lo que es de otro sub-paso.

**Techo: ~250 líneas.** Si no cabe, el sub-paso es demasiado grande y se parte antes de diseñar nada.

---

## PASO 2 — Director El Teknomoro (carriles A y B)

Última línea antes de que se mueva un píxel.

- Invócalo vía Agent (`subagent_type: "el-teknomoro-director"`).
- **Pásale el extracto, no la biblioteca.** El brief íntegro + las decisiones citadas **con su texto pegado** (no sólo el número). Un spawn arranca en frío: si le dices "valida contra biblia" se lee 46.500 tokens para comprobar seis párrafos.
- Regla explícita para él: *si necesita abrir la biblia entera, que lo diga y por qué*. Es señal legítima — significa que sospecha un conflicto fuera de lo citado, y eso es exactamente su trabajo.

Formato de respuesta que le exiges:

1. **Veredicto**: APTO / APTO CON CAMBIOS / NO APTO.
2. **Razones**: cita de biblia, scope o decisión cerrada.
3. **Cambios al brief** (si APTO CON CAMBIOS): el brief corregido, listo para el PASO 3.
4. **Bloqueo** (si NO APTO): qué falta jugar, simular o cerrar antes de tocar UI.

**Avance:**
- APTO → PASO 3 con el brief original.
- APTO CON CAMBIOS → PASO 3 con el corregido. Avisas a Bazalo del cambio en una línea.
- NO APTO → **detienes el pipeline.** Se lo cuentas a Bazalo y le devuelves la pelota. No improvisas código.

---

## PASO 3 — Impeccable (siempre)

- Invoca la skill `impeccable` con el brief aprobado.
- Register: **product**. Sólo sería brand si fuera landing pública, y en ese caso el director lo habrá dicho en el PASO 2.
- Sigue sus reglas al pie: shared design laws, register product, sin atajos.

---

## OUTPUT

1. Resumen de una frase de qué se ha producido.
2. Archivos creados/modificados con rutas markdown clicables.
3. Pasos de validación visual: qué abrir, qué probar.
4. Verificación real: `npm test`, `npx tsc --noEmit`. Si algo no se pudo correr, se dice.

Nada más. Sin recapitular el pipeline, sin felicitarte.

---

## Cuándo NO usar esta skill

- Reglas, datos o motor (`src/rules/`, biblia, simulaciones) → director directo.
- Backend, Supabase, scripts → director o trabajo normal.
- Otros proyectos (Furbito, etc.) → no aplica.

---

## Reglas de oro

1. **El orden es sagrado.** Prompt Master → director → impeccable. El carril decide cuántos pasos, nunca en qué orden.
2. **Cada paso muestra su output a Bazalo antes de avanzar.**
3. **NO APTO detiene el pipeline.** Cero excepciones.
4. **No mezcles roles.** Prompt Master no diseña, el director no escribe CSS, impeccable no valida reglas.
5. **Una tarea = un pipeline.** No reutilizas el brief de la tarea anterior.
6. **El contexto se paga una vez.** Hilo único, extracto en vez de biblioteca, y el brief carga el destilado para que el ejecutor no abra el corpus.
