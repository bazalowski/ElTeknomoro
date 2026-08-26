# El Teknomoro — Tirada reactiva de mitigación

> Documento de diseño para cerrar el bloqueante 6 de la biblia v0.5.
> **Versión:** v0.1 · **Fecha:** 24 de abril de 2026
> **Estado: RESUELTO Y ARCHIVADO (24 abril 2026).** Bazalo aprobó todas las propuestas del director. Contenido migrado a:
> - `biblia-del-juego.md` §4.15.6–§4.15.9 (marco común + tabla por tipo + arquitectura + formato `evade_check` ampliado).
> - `scope-mvp-web-v0.1.md` H1 (entregable ampliado con `resolveEvadeCheck` y tests por tipo).
>
> Este archivo queda como registro histórico del proceso de diseño. No se edita más.

---

## Por qué existe este documento

En §4.15.6 de la biblia cerramos que **toda entrada de tabla de exploración declara un `evade_check` reactivo**. No es opcional: es parte del contrato del sistema.

Pero hasta hoy no hemos decidido **qué tirada concreta** aplica a cada tipo de evento. Hay diez tipos en el catálogo (§4.15.3) y cada uno necesita:

1. **Qué habilidad / atributo** se tira.
2. **Qué dificultad** (rango de valores aceptable).
3. **Qué pasa si éxito** (evitas, mitigas, modificas el evento).
4. **Qué pasa si fracaso** (¿sucede el evento tal cual, o con penalización adicional?).
5. **Qué coste** tiene intentar la tirada (gratis, un recurso, un turno, un punto de acción).
6. **Si es automática** (se ofrece al jugador) o **disparable** (el jugador la gasta voluntariamente).

Sin esto cerrado no puedo escribir `rules/exploration.ts` en H1: el tipo `ExplorationEvent` depende de `evade_check`, y `evade_check` depende de estas decisiones.

---

## Cómo responder

- Responde en línea debajo de cada pregunta.
- `[DECIDE-TÚ]` y sigo con la propuesta del director.
- `[ABIERTO]` si no lo tienes claro (lo dejo pendiente y el módulo se construye sin esa rama).
- Si una decisión depende del sistema de dados de combate (bloqueante 1), marca `[REGLAMENTO]`.
- Cuestiona la propuesta si algo no te encaja, son solo semillas.

---

## Bloque 1 — Marco común (aplica a todos los tipos)

**M1. Momento de la tirada reactiva respecto al evento.** Propongo:

- Entre el momento en que la tirada raíz 1d20 revela el evento y el momento en que el evento se "consuma".
- El jugador ve: *"Evento: Emboscada de lobos. [Intentar evitar con Sigilo, DIF 3] [Afrontar]".*
- Si pulsa "Afrontar" o no tiene habilidad suficiente, el evento sucede tal cual.
- Si pulsa "Intentar", se hace la tirada reactiva visible.

`[DECIDE-TÚ]`

---

**M2. Coste base del intento.** Propongo:

- **Gratis** si solo usa atributo/habilidad pasiva (Percepción, Instinto).
- **1 punto de acción del turno actual** si consume acción activa (Sigilo, Esquiva, Persuasión).
- **Consumible** si usa ítem (amuleto, hechizo, poción).

Los tres conviven según qué tirada ofrezca cada evento. No hay una tabla única.

`[DECIDE-TÚ]`

---

**M3. Qué tipo de tirada son.** Opciones:

- **(a)** Tirada de **habilidad** contra dificultad fija (ej. Sigilo vs DIF 3 = necesitas sacar ≥ DIF con pool/d20 según sistema).
- **(b)** Tirada enfrentada contra stat del evento (ej. tu Sigilo vs Percepción del enemigo).
- **(c)** Mixto según evento.

Propongo **(c)**: tiradas pasivas/ambientales son contra dificultad fija; tiradas contra enemigos conscientes son enfrentadas. Es la aproximación más natural para el jugador.

`[DECIDE-TÚ]`

---

**M4. Qué dado usa la tirada reactiva.** `[CRÍTICO]`

- **(a)** El dado de combate (sistema aún abierto — pool d6 u otro).
- **(b)** El 1d20 de exploración, reutilizado.
- **(c)** Un tercer sistema propio.

> Nota del director: **(a)** tiene sentido temático — es una acción del personaje, no del mundo. Pero bloquea H1 hasta que el dado de combate esté cerrado.
> **(b)** desbloquea H1 inmediatamente: el 1d20 ya está cerrado. Es el atajo pragmático.
> **(c)** es innecesario. Descartado por dirección.
>
> Mi recomendación: **(b) durante H1 provisional, con migración a (a) cuando el dado de combate cierre**. Así no paramos el proyecto esperando al otro bloqueante. La arquitectura de `rules/dice.ts` permite el cambio sin tocar `exploration.ts` si encapsulamos bien.

---

**M5. ¿Hay fracaso crítico (peor que fracaso simple)?** Ejemplo: fallar Sigilo por mucho = emboscada con desventaja doble.

- **(a)** Sí, siempre que la tirada caiga por debajo de un umbral de margen.
- **(b)** Solo en algunos tipos de evento (combate, emboscada, trampas).
- **(c)** No. Fracasar = el evento sucede tal cual.

Propongo **(b)**. Da peso a la decisión sin castigar al jugador en eventos narrativos.

`[DECIDE-TÚ]`

---

**M6. ¿Hay éxito crítico (mejor que éxito simple)?** Ejemplo: Sigilo brutal = no solo evitas el combate, también obtienes ventaja para el siguiente.

- **(a)** Sí, siempre.
- **(b)** Solo en algunos tipos.
- **(c)** No. Éxito = evento evitado, punto.

Propongo **(a)**. Los éxitos críticos son la recompensa del sistema — la sensación de "me ha salido bordado". Cuesta poco implementar.

`[DECIDE-TÚ]`

---

## Bloque 2 — Tirada reactiva por tipo de evento

Para cada tipo propongo:
- **Habilidad/atributo** que se tira.
- **DIF base** orientativa (1-5, balanceable luego).
- **Éxito** / **Fracaso** / **Crítico** / **Pifia** (si aplica).
- **Coste** del intento.
- **Modo** (ofrecida automáticamente o el jugador tiene que disparar).

Responde con "ok" si la propuesta te vale, o corrige las partes que quieras.

---

### R1. Combate (enfrentamiento estándar)

- **Habilidad:** Sigilo (enfrentada contra Percepción del grupo enemigo).
- **DIF:** varía con el nivel/percepción del enemigo.
- **Éxito:** evitas el combate, ganas paso libre.
- **Crítico:** evitas y además obtienes 1 turno gratis de ventaja si decides volver a atacar después.
- **Fracaso:** el combate sucede normal.
- **Pifia:** no aplica (usamos regla M5(b)).
- **Coste:** 1 punto de acción.
- **Modo:** ofrecida automáticamente si el jugador tiene Sigilo ≥ 1.

`[DECIDE-TÚ]`

---

### R2. Encuentro NPC

- **Habilidad:** ninguna — los NPCs no son amenaza por defecto. Entras al diálogo si quieres.
- **DIF:** —
- **Éxito/Fracaso:** —
- **Coste:** —
- **Modo:** el modal ofrece [Hablar] [Ignorar] [Atacar]. No hay tirada de evitar.

> Nota de dirección: si un NPC es hostil encubierto, se trata como **emboscada** (R8), no como encuentro NPC.

`[DECIDE-TÚ]`

---

### R3. Hallazgo (recurso, item, pista, libro de receta)

- **Habilidad:** Percepción (pasiva, automática).
- **DIF:** 1-3 según rareza del hallazgo.
- **Éxito:** ves el hallazgo, puedes recogerlo.
- **Crítico:** hallazgo mejorado (más cantidad, o ítem de rareza superior).
- **Fracaso:** el modal te dice "sientes que hay algo cerca" y puedes gastar tiempo/recurso para buscar mejor.
- **Coste:** gratis.
- **Modo:** automática, sin confirmación. El jugador ve el resultado, no la tirada.

> Nota de dirección: este es el único tipo donde la tirada se resuelve **antes** de mostrar el evento. El jugador no elige intentar; la Percepción ya está tirando de fondo por él.

`[DECIDE-TÚ]`

---

### R4. Trampa / hazard

- **Habilidad:** Percepción (reactiva).
- **DIF:** 2-4 según complejidad de la trampa.
- **Éxito:** detectas la trampa a tiempo, no se activa, puedes desarmarla o rodearla.
- **Crítico:** además extraes un recurso de la trampa (dardo envenenado, trozo de cuerda, mecanismo).
- **Fracaso:** la trampa se activa. Sufres daño fuerte pero **nunca por debajo de 1 HP** (regla cerrada §4.15).
- **Pifia (M5(b) sí aplica aquí):** la trampa se activa con daño agravado (un atributo tirado temporalmente, estado de sangrado, etc.).
- **Coste:** gratis (tirada pasiva reactiva).
- **Modo:** automática al pisar la casilla. Si falla, se ofrece al jugador **una segunda tirada activa** (Reflejos / DES) con coste de punto de acción para esquivar.

`[DECIDE-TÚ]`

---

### R5. Evento ambiental (tormenta, derrumbe, aurora, aparición arcana)

- **Habilidad:** Supervivencia o Voluntad (depende del evento — tormenta usa Supervivencia, aparición arcana usa Voluntad).
- **DIF:** 2-4.
- **Éxito:** mitigas efectos negativos del evento (cobijarte de la tormenta, resistir la presencia arcana).
- **Crítico:** aprovechas el evento (la tormenta te esconde de otros eventos hostiles durante N casillas).
- **Fracaso:** sufres los efectos del evento (daño por frío, pérdida temporal de VOL, niebla que reduce Percepción).
- **Coste:** gratis o 1 consumible si el jugador quiere garantizar (refugio portátil, amuleto mental).
- **Modo:** ofrecida automáticamente con el modal del evento.

`[DECIDE-TÚ]`

---

### R6. Estructura / POI descubierto

- **Habilidad:** Percepción (pasiva) para detectar POIs ocultos; no hay check de evitar.
- **DIF:** 1-4 según cuán oculto está el POI.
- **Éxito:** el POI aparece en el mapa como nodo visible y accesible.
- **Crítico:** se añaden entradas al diario con pista extra sobre el POI.
- **Fracaso:** el POI queda invisible. Puede redescubrirse más tarde si el jugador vuelve con mejor Percepción.
- **Coste:** gratis.
- **Modo:** automática al pasar por la casilla. No hay opción de "evitar": descubrir un POI es siempre positivo.

`[DECIDE-TÚ]`

---

### R7. Evento narrativo

- **Habilidad:** ninguna por defecto — los eventos narrativos se consumen completos. No se evitan.
- **Caso especial:** si el evento ofrece decisiones internas, cada decisión puede tener su propia tirada (Persuasión, Intimidar, Intelecto) dentro del modal.
- **DIF:** depende del guion.
- **Coste:** depende.
- **Modo:** las tiradas internas se ofrecen en el propio modal, no son "evitar el evento".

> Nota de dirección: este tipo es el único donde la tirada reactiva global no aplica. Los eventos narrativos son escenas. Las tiradas viven dentro del guion.

`[DECIDE-TÚ]`

---

### R8. Emboscada

- **Habilidad:** Percepción (reactiva, no Sigilo — aquí eres tú el cazado).
- **DIF:** 3-4 (más alta que combate normal, porque el enemigo está intentando esconderse).
- **Éxito:** detectas la emboscada, entras al combate sin desventaja inicial.
- **Crítico:** giras la situación: entras con **ventaja** inicial (primer turno garantizado, iniciativa +2 o equivalente).
- **Fracaso:** combate con desventaja inicial (enemigos actúan primero, tú pierdes 1 turno o entras con estado "sorprendido").
- **Pifia (M5(b) aplica):** combate con desventaja doble (dos turnos perdidos o estado "aturdido").
- **Coste:** gratis.
- **Modo:** automática. El modal muestra el resultado de la tirada antes de entrar al combate.

`[DECIDE-TÚ]`

---

### R9. Refugio / punto de descanso

- **Habilidad:** Supervivencia (pasiva, determina calidad del refugio).
- **DIF:** 1-3.
- **Éxito:** recuperas HP según tabla estándar.
- **Crítico:** recuperas HP extra + refrescas 1 consumible de habilidad.
- **Fracaso:** el refugio está comprometido (tirada posterior en cadena de evento ambiental o emboscada).
- **Coste:** gratis.
- **Modo:** automática cuando el jugador elige "Descansar" en el modal del refugio.

> Nota de dirección: aquí la tirada reactiva no es para **evitar** sino para **modular calidad**. Es un caso especial legítimo: no todas las mitigaciones son "escapar del evento".

`[DECIDE-TÚ]`

---

### R10. Nada

- **Habilidad:** ninguna.
- Sin modal, sin tirada reactiva.
- Se resuelve en silencio: avanza reloj, +1-2 HP, −1 durabilidad mínima.
- La única tirada es la raíz 1d20 que lo generó.

`[DECIDE-TÚ]`

---

## Bloque 3 — Edge cases y zona gris

**E1. ¿Qué pasa si el jugador no tiene la habilidad requerida?** Ejemplo: le sale Emboscada con DIF 3 de Percepción, pero su Percepción es 0.

- **(a)** Se tira igual. Al ser DIF ≥ valor de habilidad, solo éxito crítico lo salva.
- **(b)** La opción "intentar" se muestra desactivada con tooltip ("Percepción insuficiente").
- **(c)** Se tira por atributo relacionado (INT) con penalizador.

Propongo **(b)**. Limpio y honesto con el jugador.

`[DECIDE-TÚ]`

---

**E2. ¿Puede el jugador encadenar dos mitigaciones?** Ejemplo: falla Percepción contra trampa → intenta Reflejos para esquivar en el último momento (R4 ya lo propone). ¿Se permite esta cascada en otros eventos?

- **(a)** Sí, en todos los tipos — si falla la primaria, se ofrece secundaria.
- **(b)** No. Una tirada por evento.
- **(c)** Solo en los tipos donde el diseño lo justifique (trampa, emboscada).

Propongo **(c)**. Ya está anotado en R4. Para el resto, una tirada es suficiente y evita complejidad.

`[DECIDE-TÚ]`

---

**E3. ¿Se puede renunciar a intentar la tirada y afrontar directamente?** Ejemplo: Emboscada de 2 lobos pelados, el jugador prefiere combatir para entrenar habilidad de combate, en vez de evitar.

Propongo: **sí, siempre.** Botón [Afrontar] disponible en todo modal con mitigación ofrecida. Es agencia del jugador, gratis de implementar.

`[DECIDE-TÚ]`

---

**E4. ¿La tirada reactiva entrena la habilidad que usa?** Si el jugador tira Sigilo para evitar emboscada, ¿sube `skills.sigilo.usage`?

- **(a)** Sí, ganes o pierdas. Cada uso cuenta.
- **(b)** Solo si tienes éxito (Morrowind-style: aprendes de lo que haces bien).
- **(c)** No, las tiradas reactivas no entrenan (solo el uso voluntario en combate/diálogo).

Propongo **(a)**. Consistente con la brújula ("cautela y preparación" debe premiar al jugador que *intenta*, no solo al que acierta). El cap de uso + el XP (§4.2) evitan farmeo absurdo.

`[DECIDE-TÚ]`

---

**E5. ¿Cómo se muestran visualmente éxito/fracaso?**

Propongo:
- **Dado visible rodando** (la misma animación que en combate, dado diferente).
- **Número comparado con DIF** en overlay.
- **Texto del resultado** ("¡Sigilo supera Percepción 4 vs 3! Evitas el combate.").
- **Color-coding:** verde éxito, amarillo justo, rojo fracaso, dorado crítico, morado pifia.

`[DECIDE-TÚ]`

---

## Bloque 4 — Arquitectura

**A1. Esquema de `evade_check` en la entrada de tabla.** Propongo ampliar el formato de §4.15.8:

```json
"evade_check": {
  "skill": "sigilo",
  "difficulty": 3,
  "opposed": false,
  "opposed_stat": null,
  "cost": { "type": "action_point", "amount": 1 },
  "on_success": { "outcome": "skip_event", "bonus": null },
  "on_critical": { "outcome": "skip_event", "bonus": { "type": "initiative", "value": 2 } },
  "on_failure": { "outcome": "resolve_as_normal", "penalty": null },
  "on_fumble": { "outcome": "resolve_as_normal", "penalty": { "type": "status", "value": "stunned" } },
  "auto": true,
  "trains_skill": true,
  "fallback_check": null
}
```

Campos:
- `opposed` / `opposed_stat`: si true, se enfrenta contra ese stat del evento (payload) en vez de dificultad fija.
- `cost`: lo definido en M2.
- `on_*`: define el efecto. `fallback_check` permite la cadena del E2 (trampa → reflejos).
- `auto`: si true se lanza sin pedir al jugador (R3, R6); si false, se ofrece como botón.
- `trains_skill`: E4.

`[DECIDE-TÚ]`

---

**A2. Dónde vive el evaluador.** Propongo `rules/exploration.ts` expone:

```
resolveEvadeCheck(event, character, dice) → EvadeResult
```

Consume `dice.rollD20()` (por M4(b)) y aplica el `evade_check` de la entrada. Determinista dado el mismo `dice` state.

`[DECIDE-TÚ]`

---

**A3. ¿Persistimos el resultado de la tirada reactiva?**

- **(a)** Sí, en el historial de exploración (junto a la 1d20 raíz).
- **(b)** No, solo el resultado final del evento.

Propongo **(a)**. Cuesta lo mismo y el Campo de pruebas lo necesitará para depurar balance.

`[DECIDE-TÚ]`

---

## Cierre

Cuando respondas:

1. Actualizo **biblia §4.15.6** con el marco común cerrado (M1-M6 resueltos).
2. Actualizo **biblia §4.15.8** con el formato de `evade_check` ampliado (A1).
3. Añado decisiones cerradas 27+ sobre tiradas reactivas.
4. Elimino bloqueante 6 del §6 de la biblia.
5. Actualizo el scope: el entregable de H1 ahora incluye `resolveEvadeCheck` como función pura del módulo, con test de distribución por tipo.

Con esto, **todo lo necesario para arrancar H1 queda cerrado** salvo el dado de combate. Y H0 no depende de nada, así que se puede empezar ya.
