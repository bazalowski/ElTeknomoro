# El Teknomoro — Tirada de exploración (sistema raíz)

> Documento de diseño para definir el latido del mundo: qué pasa cuando el jugador se mueve.
> **Versión:** v0.1 · **Fecha:** 24 de abril de 2026
> **Estado:** test de diseño, sin respuestas aún.
> **Destino:** cuando Bazalo responda, se integra en `biblia-del-juego.md` como §4.15 y en `scope-mvp-web-v0.1.md` como componente de los Hitos H1 y H4.
>
> **Por qué existe este documento aparte:**
> Bazalo ha declarado que "la tirada que determina el evento es raíz del juego". Un sistema raíz toca el reglamento numérico, la arquitectura de `rules/`, el diseño de mapa, el ritmo de sesión y la percepción de agencia del jugador. No cabe como comentario en un test: necesita su propio pase de preguntas.

---

## Cómo responder

- Responde en línea debajo de cada pregunta, frases cortas o números.
- Si no sabes, `[ABIERTO]`.
- Si confías en el criterio del director, `[DECIDE-TÚ]` y sigo.
- Si una pregunta depende de otro bloqueante (típicamente el dado), marca `[REGLAMENTO]`.
- Si una pregunta está mal planteada, dilo y la reformulo.

---

## Bloque 1 — Naturaleza del sistema (las 4 preguntas raíz)

**R1. Cuándo se dispara la tirada.** Señala todos los disparadores que aplican en v1:

- [x] **(a)** En cada casilla que pisa el personaje al moverse por un sub-mapa.
- [x] **(b)** Al entrar a un nodo (ciudad, mazmorra, POI) desde el mapa-mundi.
- [ ] **(c)** Al transitar entre nodos usando viaje rápido.
- [x] **(d)** Al cambiar de zona / bioma dentro de un sub-mapa.
- [ ] **(e)** Al cambiar de turno de día (amanecer, atardecer, medianoche).
- [ ] **(f)** Al gastar X puntos de acción acumulados (cada 10 acciones, por ejemplo).
- [x] **(g)** Al dormir / acampar.
- [ ] **(h)** Otro — descríbelo:

> Nota del director: (a) es lo más "roguelike" y carga de tensión cada paso. (c) es lo más "JRPG clásico" (eventos en viaje). (b)+(d)+(e) hacen sistemas de eventos más narrativos tipo Darkest Dungeon o King's Bounty. (a) solo genera fatiga; nunca elegiría (a) en solitario.

---

**R2. Qué variables entran en la fórmula de la tirada.** Marca las que quieres en v1 (las no marcadas pasan a v1.1 o se descartan):

- [x] Bioma (desierto favorece hazards, bosque favorece combate con bestias, etc.).
- [x] Hora del día (noche = más peligro / eventos distintos).
- [x] Clima (tormenta, niebla, despejado).
- [x] Nivel del personaje (escala de riesgo/recompensa con el avance).
- [ ] Atributo del personaje (¿cuál? ¿VOL para fortuna? ¿INT para percepción? ¿ninguno?).
- [ ] Habilidad del personaje (Percepción, Supervivencia).
- [x] Reputación con facción que domina la zona.
- [x] Flags narrativos (has matado al jefe X → empiezan a aparecer vengadores).
- [ ] Racha del jugador (si lleva 5 casillas tranquilas, el siguiente evento está más cerca — "pity timer").
- [x] Suerte como atributo derivado o stat oculto.
- [ ] Semilla del mundo (para que "tormenta mágica" cargue mundo hacia eventos arcanos).
- [ ] Otra:

> Nota del director: cuantas más variables metes, más te cuesta simular balance. Recomiendo abrir v1 con 4-5 variables activas y dejar la arquitectura lista para sumar sin reescribir. Mi apuesta: bioma + hora + nivel + semilla + pity timer.

---

**R3. Qué tipos de evento puede generar la tirada.** Taxonomía propuesta (marca, añade, quita):

- [x] **Combate** (1-5 enemigos según bioma/nivel).
- [x] **Encuentro NPC** (amigable, neutral, comerciante ambulante).
- [x] **Hallazgo** (recurso, item, pista, libro de receta).
- [x] **Trampa / hazard** (daño inmediato sin combate — caída, espinas, piso inestable).
- [x] **Evento ambiental** (tormenta que empieza, derrumbe, aparición arcana, aurora).
- [x] **Estructura / POI descubierto** (ruina, altar, señal de camino — añade nodo al mapa).
- [x] **Evento narrativo** (escena breve ligada al lore / quest de facción).
- [x] **Emboscada** (variante de combate con desventaja inicial).
- [x] **Refugio / punto de descanso** (oportunidad de recuperar HP con coste de tiempo).
- [x] **Nada** (casilla tranquila, avanza reloj interno).
- [ ] Otra:

> Nota del director: "Nada" es un evento de pleno derecho y debe tener probabilidad real. Si cada casilla tiene algo, el jugador se satura y el peligro pierde peso. Recomiendo que "Nada" sea la entrada más frecuente en biomas seguros, y caiga en biomas peligrosos.

---

**R4. Relación con el dado del combate.** `[CRÍTICO]` — impacta el bloqueante 1 de la biblia.

- [ ] **(a)** Mismo sistema de dados que el combate (si combate es pool d6, exploración también lo es).
- [x] **(b)** Dado propio de exploración (tabla d100, por ejemplo), independiente del combate.
- [ ] **(c)** Dado compartido pero tabla de interpretación distinta (tiramos el mismo pool y según número de éxitos se mapea a tipo de evento).

> Nota del director: (a) da coherencia mecánica y reduce carga cognitiva. (b) permite afinar sin tocar el combate. (c) es elegante pero requiere que la fórmula del dado esté cerrada antes de diseñar la tabla de eventos. Si vas hacia (a) o (c), cerrar el bloqueante 1 de la biblia cierra esto de paso. Si (b), son dos decisiones separadas.

---

## Bloque 2 — Frecuencia y ritmo

**R5. ¿Cuántos eventos esperas en una sesión de 30-45 min?** Rango orientativo:

- [ ] Pocos y pesados (5-8 eventos, cada uno significativo).
- [x] Medio (10-15 eventos, mezcla de tranquilos y fuertes).
- [ ] Muchos y densos (20+ eventos, constante interrupción).

**R6. ¿Qué porcentaje aproximado de eventos debería ser "combate" en una sesión tipo?** (Orientativo para balancear la tabla). de un 20% a un 45%

**R7. ¿El jugador puede ver que se ha tirado un dado** (aunque el resultado sea "nada") **o la tirada es invisible**? Opciones: 

- [ ] Invisible (el jugador solo nota cuando algo pasa, el resto es simple movimiento).
- [ ] Visible discreta (un pequeño indicador "..." aparece y desaparece).
- [x] Visible completa (se ve el dado en log / HUD con cada paso).

> Nota del director: invisible es lo habitual en JRPG/roguelike. Visible introduce la "sensación de dados" de los juegos de rol que presumimos. Tiene mérito.

**R8. Si sale "Nada", ¿consume recursos del jugador igual?** (tiempo de juego, comida, fatiga, durabilidad de botas — o nada).

---

## Bloque 3 — Interacción con el jugador

**R9. ¿Puede el jugador influir activamente en la tirada antes de que ocurra?** Opciones no exclusivas:

- [x] **(a)** Sí, gastando una habilidad de Percepción / Sigilo (reduce probabilidad de eventos hostiles).
- [x] **(b)** Sí, consumiendo un ítem (amuleto, hechizo de ocultación, brújula de fortuna).
- [ ] **(c)** Sí, modo de desplazamiento (moverse "sigiloso" vs "rápido" vs "cauto" — cada uno modifica la tabla).
- [x] **(d)** Sí, acampando o descansando antes de entrar a una zona peligrosa.
- [ ] **(e)** No, la tirada es del mundo y el jugador no puede tocarla.

> Nota del director: (c) es una mecánica barata de implementar y enorme en sensación de agencia. Recomiendo fuerte.

**R10. ¿Una vez ocurre el evento, puede el jugador modificarlo / evitarlo en el momento?** Por ejemplo: salta un combate → tirada de Sigilo para evitarlo antes de que empiece. Salta una trampa → tirada de Percepción reactiva. Salta un NPC hostil → opción de diálogo previa.

- [x] Sí, siempre hay una tirada reactiva de evitar/mitigar.
- [ ] Sí, pero solo para ciertos tipos de evento.
- [ ] No, el evento pasa y el jugador lo afronta.

**R11. ¿Cómo se presenta visualmente la aparición del evento?** Opciones no exclusivas:

- [x] Modal a pantalla completa ("Has encontrado...").
- [x] Banner superior con texto + botones de acción.
- [ ] Sprite / icono sobre la casilla, el jugador se acerca para interactuar (pasivo).
- [ ] Diálogo del personaje / narrador en panel lateral.
- [ ] Directo a pantalla de combate / pantalla de loot / pantalla de NPC (sin modal previo).

---

## Bloque 4 — Arquitectura de la tabla

**R12. ¿Las tablas de eventos son JSON editables** (como las recetas de crafteo) **o hardcodeadas**?

> Nota del director: JSON editable es la única respuesta razonable si quieres que el Modo Privado sirva para algo. Pregunta por completar.

**R13. ¿Cuántas tablas distintas esperas en v1?** Una global, una por bioma, una por bioma + hora, una por bioma + nivel, combinatoria plena (bioma × hora × nivel)…

> Nota del director: combinatoria plena = explosión imposible de balancear. Recomiendo **una tabla por bioma**, modulada por los demás factores como pesos, no como tablas separadas.

**R14. Formato propuesto de entrada en la tabla.** ¿Te vale este esquema como semilla?

```json
{
  "id": "encuentro_lobos_bosque",
  "biome": "bosque",
  "weight": 30,
  "conditions": {
    "min_level": 1,
    "max_level": 10,
    "time_of_day": ["day", "night"],
    "weather": ["any"],
    "required_flags": [],
    "forbidden_flags": ["pacto_lobos"]
  },
  "type": "combat",
  "payload": {
    "enemy_group": "lobos_3",
    "ambush_chance": 0.2,
    "evade_check": { "skill": "sigilo", "difficulty": 2 }
  }
}
```

> `weight` define la probabilidad relativa dentro de su tabla de bioma. `conditions` filtra si la entrada es elegible en este tick. `payload` depende del `type`.

`[DECIDE-TÚ] - OK a todo

**R15. ¿Dónde vive el código de la tirada?** `[DECIDE-TÚ]` — mi propuesta: nuevo módulo `rules/exploration.ts`, hermano de `rules/combat.ts` y `rules/crafting.ts`. Consume `rules/dice.ts`. Es puro y determinista dada la misma semilla + estado.

**R16. ¿Se guarda el historial de tiradas de exploración** (para auditar balance en el Campo de pruebas) **o se descarta tras resolver**?


`[DECIDE-TÚ] - OK a todo



---

## Bloque 5 — Implicaciones en sistemas ya cerrados

**R17. Viaje rápido.** En el scope actual (biblia §4.10) el viaje rápido "avanza el reloj interno, sin encuentros aleatorios en MVP". Si la tirada de exploración es raíz del juego, esto se contradice:

- [x] **(a)** Mantener viaje rápido sin tirada (decisión explícita: el jugador renuncia a eventos a cambio de velocidad).
- [ ] **(b)** Viaje rápido dispara una o varias tiradas "condensadas" al llegar.
- [ ] **(c)** Viaje rápido dispara la tirada normal por cada "tramo" simulado, el jugador ve un resumen.

> Nota del director: (a) es la decisión de scope vigente, pero si exploración es raíz, probablemente quieras (b) o (c). La (a) convierte viaje rápido en "atajo para saltarse el sistema raíz", y eso romperá la tensión de la partida.

**R18. Escena del primer combate forzado del onboarding.** ¿Se dispara por tirada o es un evento scriptado fuera del sistema?

- [x] Scriptado, fuera de la tirada (la historia lo impone).
- [ ] Tirada con el resultado predeterminado (entra por el mismo sistema, pero con `weight: 9999` para que salga seguro).

**R19. Modo Libre (procedural por frase-semilla).** ¿La semilla de frase afecta la tabla de eventos? ¿Cómo?

- [ ] Solo afecta al mapa generado, las tiradas son independientes.
- [ ] Afecta a la tabla aplicando modificadores semánticos ("tormenta" aumenta peso de eventos arcanos + climáticos).
- [x] Afecta al PRNG de las tiradas para que la misma frase dé la misma sucesión de eventos.

> Nota del director: la tercera es la más elegante y consistente. La segunda es más rica pero costosa.

**R20. Permadeath.** Si el jugador muere por una tirada de exploración de "trampa", ¿se siente justo? Esto condiciona el diseño de trampas:

- [ ] Sí, las trampas pueden matar directamente (el jugador asume riesgo al moverse en zona peligrosa sin precaución).
- [x] No, las trampas dañan fuerte pero nunca matan directamente (siempre dejan al jugador en 1 HP mínimo).
- [ ] Depende del nivel / habilidad del jugador.

---

## Bloque 6 — Integración con Modo Privado

**R21. ¿Qué debe permitir el Campo de pruebas sobre la tirada de exploración?** Marca:

- [x] Forzar próximo evento (el admin escribe "próximo evento = combate_lobos").
- [x] Ver la tabla actual que se está aplicando en el tick.
- [x] Simular 1.000 tiradas de una zona para ver distribución de eventos.
- [x] Editar la tabla en vivo con formulario.
- [x] Log detallado: "se tiró en tabla bosque, resultado X, peso Y, condición Z aplicada".

---

## Bloque 7 — Pregunta final de dirección

**R22.** En una frase: **¿qué sensación quieres que tenga el jugador cada vez que se mueve una casilla en este juego?**

(Respuestas útiles de referencia: "tensión constante, podría pasar cualquier cosa" — "curiosidad, siempre hay algo que descubrir" — "cuidado, cada paso gasta algo" — "libertad, el mundo me deja explorar en paz la mayoría del tiempo").

Esa frase es la brújula que gobierna el balance de la tabla. Cuando tengamos la frase, yo sé qué pesos poner de default. Sin la frase, estamos optimizando a ciegas.

Las que usaste me parecen las mejores. Pero la libertad no te da paz, te da cautela y opcion a preparar tu siguiente movimiento.

---

## Cierre

Cuando respondas:

1. Actualizo `biblia-del-juego.md` añadiendo §4.15 "Tirada de exploración" con todas las decisiones cerradas.
2. Actualizo `scope-mvp-web-v0.1.md`:
   - H1 añade `rules/exploration.ts` como módulo del núcleo.
   - H4 añade la tirada como parte del entregable.
   - H8 añade las herramientas del Campo de pruebas para tabla de eventos.
3. Si R4 elige (a) o (c), se reformula el bloqueante 1 (dados) para que abarque también exploración; si (b), se añade nuevo bloqueante propio.
4. R22 queda citado textual en la biblia como "intención de diseño" de exploración, para anclar futuras decisiones.

No se toca código hasta que este documento esté cerrado. Es raíz. Si se construye mal, se rompe H3, H4 y el feel del juego entero.
