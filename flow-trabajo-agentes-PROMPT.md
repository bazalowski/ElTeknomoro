# Prompt — Diseño de flow de trabajo con agentes para El Teknomoro

> Generado el 2026-04-26 vía Prompt Master.
> Uso: pegar el bloque de prompt íntegro a una sesión nueva con el agente `el-teknomoro-director` activo (o invocarlo desde Claude Code en el repo). El director es quien debe resolverlo; el resto de skills no.

---

## Cómo usarlo

1. Abrir Claude Code en `/home/bazalowski/ElTeknomoro`.
2. Decir: `modo director` (dispara `el-teknomoro-director`).
3. Pegar el bloque entre `===PROMPT===`.
4. Revisar el entregable. Aceptar, corregir, o pedir v0.2.

---

## ===PROMPT===

```
<contexto>
Eres el-teknomoro-director. Trabajas para Bazalo en El Teknomoro, RPG post-humano (TypeScript + Vite, fase Navegador). El proyecto tiene:

- Una "biblia" viva: biblia-del-juego.md (v0.9), scope-mvp-web-v0.1.md, cuestionariolore.md, proceso-director.md (v0.3), DESIGN.md, PRODUCT.md, h2-guia-redaccion-contenido.md, h2-dudas-contenido.md.
- Datos H2: src/data/* (skills, perks, portraits, archetypes).
- Render H2: src/render/h2-*.ts + src/state/h2-flow.ts. Reglas en src/rules/.
- Skills/agentes registrados: el-teknomoro-director (.claude/agents/), modopipeline (.claude/skills/modopipeline/), impeccable (.claude/skills/impeccable/), prompt-master, design-taste-frontend, high-end-visual-design, redesign-existing-projects, claude-code-guide.
- Regla sagrada (proceso-director.md): no se escribe código de una mecánica hasta que sus números estén validados por simulación.
- Pipeline UI ya fijado (modopipeline): Prompt Master → director → impeccable, sin saltos.

Bazalo siente que la biblia y los agentes operan en silos. Quiere un flow real que conecte: "qué dice la biblia" → "qué agente toca" → "qué archivo se modifica" → "cómo se valida" → "cómo se cierra el ciclo y se actualiza la biblia".
</contexto>

<tarea>
Diseña el flow de trabajo de El Teknomoro v1.0. Un solo documento, ejecutable, anclado en archivos reales del repo. No teoría, no listado de agentes con su descripción. Reglas concretas que Bazalo pueda imprimir y seguir mañana.
</tarea>

<entregable>
Un único archivo Markdown llamado `flow-trabajo-v1.md`, con estas seis secciones EXACTAS y en este orden:

## 1. Las cinco zonas y su agente dueño
Tabla: Zona (las cinco de proceso-director.md) | Agente dueño | Skill secundaria si aplica | Archivos del repo que toca | Documento-fuente en la biblia. Sin agentes huérfanos. Sin zonas sin dueño.

## 2. Triggers — qué dispara qué
Tabla: Frase/intención de Bazalo (ejemplos reales, en español) | Agente que arranca | Por qué arranca ese y no otro | Modo (consultivo / pipeline / código). Mínimo 12 triggers cubriendo: reglamento, balance, UI nueva, UI rediseño, lore, scope, dudas de contenido H2, ajuste de datos, refactor de rules.ts, bug visible, decisión bloqueante abierta, actualización de biblia.

## 3. Handoffs — qué entrega cada agente al siguiente
Para cada uno de los pipelines reales del proyecto (mínimo tres: pipeline UI vía modopipeline, pipeline de reglamento → código, pipeline de lore/scope → biblia), describe:
- Input que recibe el agente (formato y de dónde sale).
- Output que entrega (formato y dónde se guarda).
- Criterio binario de "listo para el siguiente paso".
Sin "etc.". Sin "y demás".

## 4. Puntos de validación de Bazalo
Lista numerada. Para cada pipeline: en qué momento exacto Bazalo aprueba, qué se commitea en ese punto, y qué NO se hace antes de su OK. Recuerda la regla guardada en memoria: commits y pushes requieren OK explícito por cada acción, no se asume que OK a uno = OK al otro.

## 5. La biblia como fuente viva
- Quién puede tocar cada archivo de la biblia (biblia-del-juego.md, scope-mvp-web-v0.1.md, cuestionariolore.md, proceso-director.md, DESIGN.md, PRODUCT.md, guías H2).
- Cuándo se sube versión (criterio binario, no "cuando haga falta").
- Qué sección de qué archivo se actualiza tras cada tipo de cambio (UI cerrada, regla validada, decisión de lore, bloqueante resuelto).
- Cómo se evita que la biblia y el código diverjan: una regla operativa concreta.

## 6. Anti-patrones que invalidan el flow
Lista de seis a diez situaciones reales que rompen el flow (ej.: "impeccable toca rules.ts", "se commitea código antes de validar números", "se actualiza biblia sin versionar"), cada una con su corrección de una línea.
</entregable>

<restricciones>
- Español de España, tuteo. Cero emojis salvo que el documento los necesite para señalización.
- Terse. Frases cortas. Sin "es importante destacar".
- Cada agente que menciones debe existir realmente en .claude/agents/ o .claude/skills/. No inventes agentes.
- Cada archivo que cites debe existir en el repo. Si no estás seguro, dilo: "[verificar]".
- No reescribes proceso-director.md. Lo referencias.
- No propones agentes nuevos en v1.0. Trabajas con los que hay.
- No hay sección de "conclusiones" ni "próximos pasos" al final. El documento termina en la sección 6.
- Si detectas una contradicción entre la biblia y un agente existente, la marcas con `[CONFLICTO]` y propones resolución de una línea. Sin debate.
</restricciones>

<criterio_de_éxito>
Bazalo lee el documento una vez, lo guarda en la raíz del repo, y la próxima vez que diga "quiero rediseñar la pantalla de skills" o "hay que validar el daño base" sabe sin pensar:
- Qué agente arranca.
- Qué archivos se tocan.
- En qué punto él aprueba.
- Qué se actualiza en la biblia al cerrar.

Si el documento no permite eso, no está terminado.
</criterio_de_éxito>

<formato_salida>
Devuelves SOLO el contenido de flow-trabajo-v1.md, listo para escribir a disco. Sin preámbulo, sin "aquí tienes", sin epílogo. Empieza directamente con `# El Teknomoro — Flow de trabajo v1.0`.
</formato_salida>
```

## ===FIN PROMPT===
