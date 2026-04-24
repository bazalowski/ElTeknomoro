1# El Teknomoro — Biblia del juego

> Documento vivo. Consolida todo lo que sabemos (y lo que no sabemos) sobre el proyecto.
> **Versión:** v0.3 · **Fecha:** 24 de abril de 2026 · **Autor:** Bazalo con dirección de El Teknomoro Assistant

---

## Índice

1. Identidad del proyecto
2. Visión y scope
3. Estado actual y roadmap
4. Reglamento v0.3 (estado en revisión)
5. Decisiones cerradas
6. Preguntas abiertas (lo que hay que responder)
7. Arquitectura técnica planeada
8. Historial de versiones

---

## 1. Identidad del proyecto

**Nombre:** El Teknomoro.

**Nombre anterior:** Mundos Fracturados (placeholder de trabajo, deprecado).

**Género:** RPG de mundo abierto con componente procedural.

**Plataformas objetivo, en orden:**
1. PDF jugable de mesa (pen & paper).
2. Web app en navegador (vanilla TypeScript + Canvas).
3. Motor de videojuegos (Godot 4 preferido, Unity alternativa).

**Autor:** Bazalo (@bazalowski).

**Tipo de proyecto:** personal, no comercial inicialmente. Puede comercializarse en fase 3 si la fase 2 genera tracción.

---

## 2. Visión y scope

El Teknomoro es un RPG donde el jugador explora un mundo fracturado por un evento arcano, compone personajes con atributos y habilidades, combate, craftea, se une a facciones y toma decisiones que modifican el mundo de manera persistente.

La fase de mesa existe porque **las reglas se prueban con dados y papel antes que con código**. Esa convicción es el norte del proyecto. No es nostalgia pen-and-paper: es economía de desarrollo. Reescribir reglas en código cuesta diez veces más que reescribirlas en un PDF.

La fase de navegador existe porque es el camino más corto entre "tengo reglas probadas" y "tengo jugadores externos probándolo". Un ejecutable de Godot requiere instalación; una URL no.

La fase de motor existe como posibilidad, no como compromiso. Solo se activa si hay demanda real.

---

## 3. Estado actual y roadmap

**Estado hoy (24 abril 2026):** diseño en revisión. Documento v0.2 recibido de un LLM externo (DeepSeek), depurado a v0.3 por dirección. Pendiente de validación con partidas reales.

**Siguiente milestone antes de tocar código:**

1. Hoja de cálculo con simulación de tiradas. Una tarde.
2. PDF del reglamento v0.3 con las notas de dirección integradas. Dos tardes.
3. Dos partidas de prueba (pareja + amigo). Tres horas cada una. Notas de dónde se atasca el sistema.
4. v0.4 del documento con loop de sesión, gancha y condición de victoria definidos.
5. **Solo entonces** se habla de prototipo navegador.

**Cuello de botella real:** tiempo del autor. Bazalo trabaja turnos alternos y tiene otros proyectos (Furbito v2.0, YouTube, ventas en Vinted/Cardmarket). El Teknomoro vive en los bloques cognitivos libres. Estimar ritmo realista: una a dos sesiones de diseño al mes hasta que el reglamento esté cerrado.

---

## 4. Reglamento v0.3 (estado en revisión)

### 4.1 Atributos

**Estado: abierto, depende de simulación numérica.**

Propuesta de trabajo actual (pendiente de validar con hoja de cálculo):

- 5 atributos.
- 12 puntos para repartir (no 10 como proponía DeepSeek).
- Máximo 4 al crear, mínimo 1 obligatorio en cada uno.
- Techo absoluto en nivel 10: 7.

La decisión de 12/4 sobre 10/3 responde a dar espacio de build real. Con 10/3 solo hay unas seis distribuciones viables; con 12/4 hay aproximadamente 20. En un RPG que presume de libertad, la variedad de arquetipos iniciales importa.

Atributos concretos: pendiente de definir. Un candidato razonable: Fuerza, Destreza, Constitución, Intelecto, Voluntad. Se confirma o reemplaza cuando el loop de combate esté diseñado.

### 4.2 Habilidades

**Estado: abierto.**

Propuesta de trabajo: 10 puntos para repartir, máximo 3 al crear. Esto sí se mantiene del v0.2 porque 3 éxitos consistentes en habilidades es un buen techo inicial.

Lista de habilidades: pendiente.

### 4.3 Sistema de tiradas

**Estado: abierto, necesita decisión de dado primero.**

Pregunta fundamental sin responder: ¿dado pool (tiro N dados, cuento éxitos sobre un umbral) o dado único (tiro un d20/d100, sumo modificadores)?

Hasta que esa pregunta se responda, todos los números de balance son provisionales. Recomendación de dirección: **pool de d6 con umbral de éxito en 4+**. Razones:

- Más dados = más sensación de progresión palpable (pasar de 3 a 4 dados se siente).
- d6 es el dado más accesible (los hay en cualquier Parchís).
- Umbral 4+ da 50% base por dado, fácil de intuir mentalmente.

Esta recomendación NO está cerrada. Se cierra solo con simulación.

### 4.4 Defensa

**Estado: propuesta de dirección, pendiente de validar.**

Fórmula recomendada: `DEF = 2 + floor(DES/2) + armadura`.

Tabla resultante:

| DES | Bono pasivo | DEF sin armadura | DEF con armadura pesada (+3) |
|-----|-------------|------------------|------------------------------|
| 1-2 | +0 | 2 | 5 |
| 3-4 | +1 | 3 | 6 |
| 5-6 | +2 | 4 | 7 |
| 7-8 | +3 | 5 | 8 |

Acción de Esquivar: bono fijo de +2 durante un turno, no suma de DES entera.

Racional: la defensa pasiva debe escalar con DES (si no, los builds ágiles pierden identidad), pero acotada para no volver imposible golpear a high-DES. Esquivar se mantiene como decisión táctica ("¿ataco o me cubro?") con coste de acción.

### 4.5 Crafteo

**Estado: formato de receta propuesto, pendiente de catálogo inicial.**

Formato de receta definitivo:

```json
{
  "id": "venda_simple",
  "resources": { "tela": 1, "hierba_curativa": 1 },
  "skill_check": { "skill": "primeros_auxilios", "difficulty": 1 },
  "station": null,
  "time_hours": 1,
  "outputs": {
    "success": { "item": "venda", "quantity": 2 },
    "critical": { "item": "venda_esteril", "quantity": 2 },
    "failure": { "resources_lost": 0.5, "time_lost": 1 }
  }
}
```

Campos clave y por qué existen:

- `outputs` con tres ramas (success/critical/failure) en vez de un output único: permite que la habilidad del personaje importe más allá de "puedes o no puedes craftear".
- `station` (null o string): permite restringir crafteos a localizaciones específicas (fragua, laboratorio) sin romper las recetas simples de campo.
- `failure.resources_lost` como fraccional: permite "perdiste la mitad de materiales" como consecuencia intermedia, no solo "todo o nada".

### 4.6 Turno cero de sesión

**Estado: estructura propuesta, pendiente de implementar.**

Tres capas, en este orden:

1. **Semilla del mundo.** Una frase que tiñe la sesión. Ejemplo: "una tormenta mágica ha despertado algo bajo el glaciar". En la web app, esta frase se convierte literalmente en el `seed` del generador procedural.
2. **Pregunta de personaje.** Tres opciones cerradas por jugador (no preguntas abiertas, que colapsan al jugador nuevo). Ejemplos de ejes: ¿qué has perdido? ¿a quién debes un favor? ¿qué juraste no volver a hacer?
3. **Vínculo cruzado.** Cada jugador nombra a otro personaje en la mesa y declara algo concreto que comparten: una deuda, un secreto, un juramento. Esto evita que la sesión 3 se convierta en cinco solitarios paralelos.

En la versión navegador, esto se traduce en **pantalla de onboarding de 90 segundos máximo**. Tres pantallas, tres decisiones cerradas, al mapa.

---

## 5. Decisiones cerradas

Estas no se reabren sin motivo fuerte. Si Bazalo las cuestiona, la dirección le pide razón. Si la razón convence, se reabren — pero el default es que están firmes.

| # | Decisión | Cerrada en |
|---|----------|-----------|
| 1 | Orden de fases: mesa → navegador → motor. | v0.2 |
| 2 | Stack de navegador: vanilla TypeScript + Canvas. | v0.2 |
| 3 | Arquitectura: módulo `rules.ts` aislado del render. | v0.2 |
| 4 | Motor futuro preferido: Godot 4 sobre Unity. | v0.2 |
| 5 | Nombre del proyecto: El Teknomoro. | v0.3 |
| 6 | Formato de receta de crafteo con outputs ramificados. | v0.3 |
| 7 | No se escribe código hasta tener dos partidas de mesa probadas. | v0.3 |

---

## 6. Preguntas abiertas

Las decisiones sin cerrar. En orden aproximado de prioridad.

### Bloqueantes (hay que responderlas antes de v0.4)

1. **¿Pool de dados o dado único?** Determina todas las matemáticas del resto del sistema.
2. **¿Cuántos atributos y cuáles?** La cifra 5 es provisional.
3. **¿Cuál es el loop de sesión?** ¿Qué hace un jugador en 15 min / 1h / 4h?
4. **¿Cuál es la condición de victoria/derrota?** Mundo abierto necesita arco de cierre igualmente.
5. **¿Cuál es la gancha del primer minuto?** Especialmente crítica para navegador.

### Importantes (v0.5 puede vivir sin ellas, pero no mucho más)

6. Lista concreta de habilidades.
7. Tabla de progresión de XP y niveles.
8. Catálogo inicial de recetas de crafteo (objetivo: 30-50 recetas para el MVP).
9. Catálogo inicial de enemigos (objetivo: 10 tipos con variantes).
10. Biomas y su generación procedural.

### Diferibles (no bloquean nada a corto plazo)

11. Sistema de facciones y reputación.
12. Diálogos y árboles de conversación.
13. Monetización en fase 3 (si llega).
14. Branding visual y música.

---

## 7. Arquitectura técnica planeada

**NOTA: todo esto es para la fase 2 (navegador). No se implementa hasta que el reglamento de mesa esté cerrado.**

### Stack

- Vanilla TypeScript, sin framework.
- Canvas 2D para render.
- Vite como bundler.
- LocalStorage para guardado inicial. Si crece, IndexedDB.
- Sin backend en MVP. Todo corre en cliente.
- Despliegue: Netlify o Vercel (decisión diferida).

### Estructura de proyecto propuesta

```
el-teknomoro/
├── src/
│   ├── rules/           # SAGRADO. Lógica pura. Sin imports de Canvas/DOM.
│   │   ├── character.ts
│   │   ├── combat.ts
│   │   ├── crafting.ts
│   │   ├── dice.ts
│   │   └── world-gen.ts
│   ├── render/          # Todo lo visual. Consume rules/, nunca al revés.
│   │   ├── canvas.ts
│   │   ├── ui.ts
│   │   └── map-view.ts
│   ├── state/           # Estado persistente. Guardado/carga.
│   │   └── save.ts
│   ├── data/            # JSONs de contenido: recetas, enemigos, items.
│   │   ├── recipes.json
│   │   └── enemies.json
│   └── main.ts
├── public/
└── index.html
```

### Por qué `rules/` aislado

La razón no es purismo académico. Es migración.

Cuando llegue la fase 3 (motor de videojuegos), el 70% del trabajo será portar `rules/` a GDScript (Godot) o C# (Unity). Todo lo demás (render, UI, guardado) se reescribe igualmente, porque las APIs son diferentes. Si las reglas están mezcladas con el render, hay que desenredarlas antes de portar — y ese desenredo es donde mueren los proyectos.

Con `rules/` aislado, portar es un proceso mecánico, no arqueológico.

---

## 8. Historial de versiones

**v0.1** — Brief inicial de Bazalo. No conservado en este documento.

**v0.2** — Propuesta de DeepSeek. 12/4 en atributos, DEF = 10 + DES, crafteo con JSON simple, tres fases de producto. Problemas: balance no simulado, DEF imposible, crafteo subespecificado, faltaba loop de sesión.

**v0.3** — Depuración de dirección (abril 2026). Cambios principales:

- Nombre oficial: El Teknomoro.
- Atributos: 12/4 mantenido (DeepSeek había bajado a 10/3 sin justificación numérica).
- Defensa: fórmula `2 + floor(DES/2) + armadura`, con Esquivar como bono táctico de +2.
- Crafteo: formato extendido con outputs ramificados, station, y coste de fracaso.
- Turno cero: añadida capa de vínculo cruzado.
- Añadidas cuatro áreas que el v0.2 no cubría: loop de sesión, gancha del primer minuto, condición de victoria, y nombre del juego.
- Establecida regla: no hay código hasta dos partidas de mesa probadas.

**v0.4** — Pendiente. Se produce tras dos partidas de prueba reales. Debe cerrar las cinco preguntas bloqueantes.
