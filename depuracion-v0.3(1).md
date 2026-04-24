# Depuración v0.3 — Archivo histórico

> Documento de referencia. Conserva la depuración completa del v0.2 de DeepSeek que dio lugar a la v0.3 del reglamento.
> **Fecha:** 24 de abril de 2026.
> **Propósito:** que dentro de seis meses podamos releer por qué se tomaron las decisiones, no solo cuáles fueron.

---

## Lectura general

El v0.2 tenía un problema de género: estaba escrito como plan de producto cuando lo que había delante era un prototipo de reglas. Son cosas distintas. Un plan de producto habla de fases, migraciones y comunidad. Un prototipo de reglas habla de qué pasa cuando dos jugadores se sientan a jugar durante tres horas. Si lo segundo no funciona, lo primero sobra.

El TL;DR del v0.2 ordenaba bien (mesa → navegador → motor), pero después el documento se iba al código sin haber cerrado el reglamento. El error más común en diseño amateur de RPG: confundir "tengo un sistema" con "tengo un sistema jugado". No son lo mismo.

---

## §1.1 — Balance numérico inicial

**Qué decía el v0.2:** bajar de 12 puntos a 10 en atributos, máximo 3, "para coherencia con el tono más rasante del inicio".

**Problema:** la justificación era estética ("rasante") cuando la decisión era matemática. Y las matemáticas no estaban hechas.

Preguntas que el v0.2 no respondía:

- ¿Cuántos dados tira un personaje medio en su acción más común?
- ¿Qué probabilidad de éxito debería tener contra un enemigo medio?
- ¿Cómo escala eso al nivel 5? ¿Al 10?

Sin esas tres curvas en una hoja de cálculo, ajustar puntos es ir a ciegas.

**Problema adicional:** con máximo 3 al crear y 5 atributos, el espacio de construcción de personaje colapsa. Quedan unas seis distribuciones viables. Para un juego que presume de "mundo abierto" con libertad de rol, seis arquetipos iniciales es muy poco.

**Decisión v0.3:** mantener 12 puntos / máximo 4 / mínimo 1 obligatorio. Esto da unas 20 distribuciones, tiradas iniciales de 4-7 dados (rango cómodo en cualquier sistema de pool), y deja 5/6/7 como "esto lo consigues jugando".

**Pendiente:** validar con hoja de cálculo de simulación antes de cerrar números.

---

## §1.2 — La tirada de defensa

**Qué decía el v0.2:** cambio de `DEF = 10 + DES` a `DEF = 2 + armadura`, con Destreza recuperada solo vía acción de Esquivar.

**Diagnóstico correcto, ejecución incompleta.** El diagnóstico era válido: una defensa de 11-15 éxitos es absurda. Pero la solución propuesta rompía algo sin mencionarlo.

**Lo que rompía:** al quitar contribución pasiva de Destreza, un personaje con DES 4 y uno con DES 1 pasaban a ser igual de difíciles de golpear si no gastaban acción en esquivar. Narrativamente absurdo. Mecánicamente, castigo a los builds de agilidad (la mitad del electorado de cualquier RPG).

**Decisión v0.3:** `DEF = 2 + floor(DES/2) + armadura`. La Destreza escala la defensa pero acotada. Esquivar sigue siendo acción, pero da bono fijo de +2, no suma DES entera.

Tabla resultante:

- Sin armadura, torpe: 2 éxitos (suelo)
- Sin armadura, ágil: 4 éxitos (ya cuesta)
- Con armadura pesada, ágil: 7 éxitos (pide crítico, buff, o trabajo en equipo — exactamente como debe ser)

---

## §1.3 — El "turno cero" de sesión

**Qué decía el v0.2:** añadir ritual de inicio con semilla del mundo (una frase) y pregunta de personaje por jugador.

**Diagnóstico correcto, corto.** Ese ritual es lo que hace cualquier manual narrativo desde *Dungeon World* (2012). No es innovación, es higiene mínima.

**Decisión v0.3:** tres capas, no dos:

1. Semilla del mundo (una frase).
2. Pregunta de personaje — pero con **tres opciones cerradas**, no pregunta abierta. Las preguntas abiertas en sesión 1 colapsan al jugador nuevo.
3. **Vínculo cruzado:** cada jugador nombra a otro personaje en la mesa y declara algo concreto que comparten (deuda, secreto, juramento). Motor que impide que la sesión 3 se convierta en cinco solitarios paralelos.

**En versión navegador:** pantalla de onboarding de 90 segundos máximo. Tres pantallas, tres decisiones cerradas, al mapa. Más de 90 segundos = jugador perdido.

---

## §1.4 — El crafteo subespecificado

**Qué decía el v0.2:** formato JSON de receta con `id`, `resources`, `skill_check`, `output`, `time_hours`.

**Punto más sólido del v0.2.** Pero incompleto en tres dimensiones que iban a doler a los tres meses.

**Lo que faltaba:**

- **Calidad de output.** Una tirada con 2 éxitos y una con 5 producen la misma venda. Eso mata la progresión de habilidades de crafteo.
- **Coste de fracaso.** ¿Qué pasa si el check falla? ¿Materiales perdidos? ¿Tiempo? ¿Ambos? Decisión de diseño crítica: determina si el jugador cree que merece la pena craftear lo arriesgado o solo lo seguro.
- **Requisitos de estación/herramienta.** Una venda la haces en el campo. Una espada necesita fragua. El JSON no lo contemplaba.

**Decisión v0.3:** formato extendido.

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

Este formato aguanta mil recetas. El del v0.2 aguantaba veinte antes de romperse.

---

## Lo que el v0.2 no cubría

Cuatro ausencias que la v0.3 incorpora como trabajo pendiente:

**1. Loop de sesión.** ¿Qué hace un jugador en 15 min / 1h / 4h? Sin respuesta en una frase por tramo, no hay juego — hay reglamento. *Skyrim* en 15 min: "exploro, encuentro algo, me meto en lío, salgo". *Darkest Dungeon* en 15 min: "compongo party, entro, 3-4 decisiones de alto riesgo, salgo". ¿Cuál es el de El Teknomoro?

**2. Gancha del primer minuto.** En navegador es literal: el jugador llega a la URL, ¿qué ve? Si es creación de personaje con cinco atributos, pérdida. Los RPG web que funcionan (*Candy Box*, *A Dark Room*, *Universal Paperclips*) empiezan con **una sola acción** disponible y van abriendo el sistema.

**3. Condición de victoria/derrota.** Mundo abierto sin condición de fin = jugador desenganchado a los 40 minutos. No necesita ser épica: puede ser pregunta inicial que se responde al final ("¿qué pasó con tu hermano?"). Pero tiene que existir.

**4. Nombre.** El v0.2 se escribió sobre "Mundos Fracturados", placeholder débil. "El Teknomoro" pasa a ser el nombre oficial del proyecto desde v0.3.

---

## Veredicto

**El v0.2 no estaba listo para código.** No por malo — no lo era — sino porque saltaba la fase que el propio TL;DR marcaba como paso 1: cerrar el reglamento de mesa jugando partidas reales.

**Plan resultante (v0.3):**

1. Hoja de cálculo con simulación de tiradas. Una tarde.
2. PDF del reglamento v0.3. Dos tardes.
3. Dos partidas de prueba reales. Tres horas cada una.
4. v0.4 con loop, gancha y condición de victoria definidos.
5. Solo entonces, prototipo navegador.

Este calendario ocupa dos fines de semana. Saltárselo significa construir sobre un reglamento que falla y reescribir entero al mes siguiente.
