# El Teknomoro — Test de profundización del MVP web

> Segundo pase. Cada pregunta deriva de una respuesta concreta del test de 130.
> **Versión:** v0.2 · **Fecha:** 24 de abril de 2026
> **Cambio v0.1 → v0.2:** eliminadas las referencias a juego de mesa y PDF. Todo se centra en el prototipo web.
> **Reglas de uso:**
> - Responde breve. Si no lo tienes claro, `[ABIERTO]` y sigue.
> - Si una pregunta lleva `[REGLAMENTO]`, **no la contestes aquí**: depende de cerrar un bloqueante del reglamento con simulación numérica primero.
> - Si lleva `[DECIDE-TÚ]`, el director propone una opción: basta con "ok" o "no, prefiero X".
> - Si lleva `[CRÍTICO]`, condiciona arquitectura: cerrarla mal cuesta días de reescritura.

---

## Bloque A — Menú principal y sesión (deriva de Bloque 1)

**A1.** Dijiste "Nueva Partida / Cargar Partida / Privado". ¿El modo Privado aparece **siempre** en el menú o solo cuando detecta un flag de dev (variable de entorno, query `?dev=1`, combinación de teclas)? `[CRÍTICO]` — si aparece siempre, hay que pensar protección; si es flag, el build de producción ni lo compila.

- Solo aparece con flag de Dev, bajo usuario y contraseña.

**A2.** Los 3 slots de guardado: ¿son 3 **por dispositivo** (LocalStorage) o se pueden mover entre dispositivos vía export/import JSON? (Nota: ya dijiste que el Banco sí es exportable; pregunto por partidas en curso).

- El juego requiere un login. Se almacena la informacion en servidor tipo Supabase.

**A3.** Guardado "mixto": ¿qué eventos dispararían un autoguardado? Propongo tres candidatos: (a) cambio de zona de mapa, (b) fin de combate, (c) subida de nivel. ¿Añadirías/quitarías alguno?
Me parecen todos perfectos.

**A4.** Si el jugador cierra la pestaña y rechaza la confirmación del navegador (a veces el browser no la muestra), ¿aceptamos perder los minutos desde el último autoguardado, o montamos un autosave "heartbeat" cada N turnos como red de seguridad? `[DECIDE-TÚ]` — propongo heartbeat cada 5 turnos en silencio.
Perfecto.

**A5.** Tutorial in-game lo dejaste `[ABIERTO]`. Para cerrar scope necesito una decisión binaria para el MVP: **(a) sin tutorial, el jugador aprende jugando**; **(b) tooltips contextuales la primera vez que aparece una mecánica**; **(c) escena tutorial guiada de 5 min**. ¿Cuál?
C.

**A6.** "Decisión inmediata + Combate" como gancha del primer minuto. ¿Esa decisión es **antes** de crear personaje (ambientas al jugador) o **después** (el personaje ya creado toma su primera decisión)? `[CRÍTICO]` — cambia el orden de las pantallas del onboarding.

Despues.

---

## Bloque B — Creación de personaje (deriva de Bloque 2)

**B1.** "Creación mixta" (arquetipo + libre). ¿El flujo es: **(a) eliges arquetipo, luego ajustas con +/-**; **(b) empiezas libre, puedes cargar un arquetipo como preset**; **(c) las dos opciones desde pantalla inicial "empezar de cero / empezar con preset"**? Propongo (c).

c.

**B2.** ¿Cuántos arquetipos predefinidos en el MVP? Propongo 4-5 para cubrir los arquetipos de atributo dominante (FUE, DES, CON, INT, VOL) sin saturar al jugador nuevo. `[DECIDE-TÚ]` si te vale 5.
Si.

**B3.** Set fijo de retratos: ¿cuántos en el MVP? ¿Mezclados géneros/etnias/edades, o agrupados por categorías? Propongo 12 retratos sin categorizar, estilo uniforme, el jugador los ojea en grid.
Si.

**B4.** "Rasgos/talentos/perks" en v1. ¿Se eligen en creación o se desbloquean subiendo de nivel? ¿Cuántos arranca el personaje con? `[REGLAMENTO]` si todavía no tienes el sistema de rasgos cerrado.
Se elije uno al arrancar, Y se van desbloqueando dependiendo el arquetipo elegido.

**B5.** "Inventario fijo + opción aleatorio". La opción aleatoria: ¿es una tirada de dados visible (más rollera) o un botón "sorpréndeme" que rellena sin animación? Propongo botón "sorpréndeme" con lista visible antes de confirmar.
SI.

**B6.** Respondiste que "el Banco de creación no es para eso" sobre cuántos personajes tiene un jugador. Aclárame: ¿cuántos personajes jugables tiene un jugador en una partida? Propongo **uno por slot de partida** (no hay party, personaje único). ¿Correcto? `[CRÍTICO]` — cambia el modelo de datos entero.
UNo por slot.

**B7.** Has dicho que el inventario es "por personaje o compartido si hubiera party (probablemente no en MVP)" → "sí". Esa respuesta no cuadra con B6. ¿Confirmas: **MVP = un solo personaje por partida, sin party**?
Si

**B8.** Estructura JSON del personaje portable a Godot (lo dejaste a mi criterio). Propongo este esquema:

```json
{
  "id": "uuid",
  "name": "string",
  "portraitId": "string",
  "attributes": { "fue": 0, "des": 0, "con": 0, "int": 0, "vol": 0 },
  "skills": { "skillId": 0 },
  "perks": ["perkId"],
  "level": 1,
  "xp": 0,
  "hp": { "current": 0, "max": 0 },
  "inventory": { "slots": [], "equipped": {} },
  "location": { "mapId": "string", "x": 0, "y": 0 },
  "flags": {}
}
```

¿Te vale como semilla o quieres cambiar algo ya? `[DECIDE-TÚ]` para dar el ok.

OK

---

## Bloque C — Banco y Campo de pruebas (deriva de Bloques 3 y 4)

**C1.** "El Banco y el Campo son uno" (respuesta 36). ¿Entonces la UI es: **(a) un solo menú "Privado" con pestañas [Creación | Juego de pruebas]**; **(b) el Banco es una barra lateral dentro del mundo de pruebas**? Propongo (a).

**C2.** "Yo decido como admin qué pasa a ser parte del juego". ¿Ese workflow lo imaginas como: **(a) un botón "Publicar al juego base" en cada ítem del Banco**; **(b) un archivo `content-approved.json` que edito a mano**; **(c) ambas**? `[CRÍTICO]` para saber si hay que montar UI de publicación o basta con pipeline de JSON.

**C3.** "Plantillas vs instancias" (pregunta 28, respondiste "no entiendo"). Traducción: cuando juegas con un personaje del Banco, ¿los cambios (XP, heridas) se guardan en el Banco o el Banco es siempre la versión "de fábrica" y al jugar se clona? Propongo **plantilla**: el Banco siempre inmutable, la partida clona al iniciar.

**C4.** Backup del Banco ante pérdida de storage. Propongo: botón "Exportar todo" que descarga un único `.tkm.json` con todo el Banco. Autoexport cada X cambios al disco sería invasivo en navegador, no lo haré. `[DECIDE-TÚ]`.

**C5.** "Forzar próxima tirada a 6" (pregunta 38). ¿Lo quieres como: **(a) seed controlada del PRNG**; **(b) cola de resultados forzados ["próximas 3 tiradas: 6, 1, 4"]**? Propongo (b), es más útil para reproducir bugs.

**C6.** Simulación masiva IA vs IA: ¿cuántos combates simultáneos te vale como mínimo útil? Propongo 1.000 combates sin UI en ~5 segundos. Más que eso, ya quieres CSV y análisis offline (que respondiste "opcional" → lo dejo fuera del MVP).

---

## Bloque D — Mapa y exploración (deriva de Bloque 5)

**D1.** "Grid + nodos point-and-click". Aclara el modelo mental: ¿es **(a) un mapa-mundi con nodos (ciudades/mazmorras), cada nodo abre un sub-mapa en grid**; **(b) un único mapa grid con algunas casillas "especiales" que son nodos de interés**? `[CRÍTICO]` — son arquitecturas muy distintas de mundo. Propongo (a).

**D2.** Top-down vs isométrica lo dejaste sin decidir. Para el MVP web propongo **top-down 2D con tiles cuadrados**. La isométrica es más bonita pero duplica el coste de assets y el código de render sin aportar al juego. `[DECIDE-TÚ]`.

**D3.** Generación procedural + mapa de historia. ¿Conviven en la misma partida o son modos distintos? Propongo: **Nueva Partida → "Historia" (mapa fijo) | "Libre" (procedural con semilla)**. `[DECIDE-TÚ]`.

**D4.** Semilla procedural (dejaste "crea tú"). Propongo: **el jugador escribe una frase**, de esa frase se deriva el hash que alimenta el PRNG. Encaja con la "semilla del mundo" del turno cero (biblia §4.6). `[DECIDE-TÚ]`.

**D5.** 5 biomas. ¿Tienes ya los cinco en la cabeza o los decido yo? Si decido yo, propongo provisionales: **llanura, bosque, desierto, glaciar, ruinas arcanas**. Se redefinen cuando el lore entre en scope.

**D6.** Día/noche y clima afectan tiradas (55-56). `[REGLAMENTO]` — no cerramos esto hasta decidir el sistema de dados y qué tipo de modificador existe (ventaja/desventaja, bono numérico, dado extra).

**D7.** Viaje rápido como único modo de tránsito: ¿hay **coste** (tiempo, recursos, encuentros aleatorios) o es gratis? `[CRÍTICO]` — si es gratis, la exploración pierde peso; si es costoso, necesitamos sistema de tiempo/recursos de viaje. Propongo: coste de tiempo de juego (avanza el reloj interno), sin encuentros aleatorios en MVP.

---

## Bloque E — Combate (deriva de Bloque 6)

**E1.** Timeline completa de orden de turno: ¿muestra los próximos N turnos solamente (p.ej. siguientes 6) o la ronda entera? Propongo los próximos 8 iconos horizontales arriba.

**E2.** Iniciativa "estadística + tirada". `[REGLAMENTO]` — concreta la fórmula solo cuando el sistema de dados esté cerrado. Para el wireframe basta saber que se ordena de mayor a menor y se muestra.

**E3.** Targeting "ambas" (66). Traducción propuesta: clic directo sobre el enemigo, **o** Tab para ciclar objetivos con teclado. ¿Vale?

**E4.** "Pantalla dedicada de loot". ¿El combate **no termina** hasta que recoges (modal bloqueante) o la pantalla de loot es un post-resumen y puedes cerrarla y seguir en el mundo? Propongo modal bloqueante con botón "Dejar" que te saca sin coger nada.

**E5.** Terreno con efectos (cobertura, altura, hazards) = sí. `[REGLAMENTO]` — los efectos concretos dependen del sistema de dados y defensa. Para wireframe basta saber que las casillas pueden tener tags.

**E6.** Huir del combate "a revisar". Lo dejo `[REGLAMENTO]` hasta que haya regla. Pero para UX, ¿reservamos ya un botón "Huir" en la barra de acciones o se añade después? Propongo **reservar el slot** aunque esté grisado.

**E7.** Permadeath confirmado. ¿Borra el slot de partida automáticamente, o el slot queda marcado como "muerto" (solo lectura, consultable como epitafio)? Propongo epitafio, es más satisfactorio y no cuesta.

**E8.** Motor de combate desacoplado del render (79). `[DECIDE-TÚ]` — sí, lo será. Lo confirmo ahora para que sepas que sí: el motor correrá en modo "cabeza" para el Campo de pruebas masivo (C6).

**E9.** Modo replay lo descartaste. ¿Y un "log de la última tirada" legible y copiable, sin replay visual? Cuesta poco y ayuda a depurar. `[DECIDE-TÚ]` propongo añadirlo al panel lateral de log.

---

## Bloque F — Inventario y crafteo (deriva de Bloques 7 y 8)

**F1.** Slots de inventario: ¿número fijo de slots (p.ej. 20) o crece con atributo (p.ej. CON)? `[REGLAMENTO]` — depende del sistema. Para wireframe asumo cuadrícula fija de 5x4.

**F2.** Slots de equipo: enumera los que quieres en MVP. Propongo: **cabeza, torso, manos, arma principal, arma secundaria, accesorio**. `[DECIDE-TÚ]`.

**F3.** Durabilidad confirmada. ¿Al llegar a 0: **(a) se rompe y se destruye**, **(b) queda inservible hasta reparar**? Propongo (b) para no frustrar.

**F4.** 255 items distintos es un techo ambicioso para MVP. Propongo **50 items en v1 del MVP**, con la arquitectura preparada para llegar a 255. `[DECIDE-TÚ]`.

**F5.** "Probar combinaciones desbloquea recetas" + "leer libros también". `[CRÍTICO]` — necesito saber el comportamiento exacto: si intento una combinación que es receta pero no la conozco, ¿**(a) me sale el ítem y la receta queda registrada**; **(b) me sale el ítem pero sin registro, tengo que repetir X veces para que se aprenda**; **(c) no me sale nada hasta que la aprenda por libro**? Propongo (a).

**F6.** Porcentajes visibles antes de craftear (95). ¿Se muestran **siempre** o solo cuando el personaje tiene la habilidad de "analizar receta"? Para el MVP propongo siempre visibles, simplifica UX.

**F7.** Cola de crafteo de 3: si la pantalla se cierra, ¿la cola sigue procesando? Como dijiste "microsegundos", asumo que sí es instantáneo y no hay cola real temporal. ¿Confirmas que la "cola" es solo para encadenar 3 recetas en un clic?

**F8.** Editor visual de recetas en Campo de pruebas (102): ¿editas el JSON con un form (campos, dropdowns) o con editor de texto JSON raw? Propongo form, el JSON raw lo hago yo como admin sin UI.

---

## Bloque G — Progresión, diálogo, presentación (deriva de Bloques 9, 10, 11)

**G1.** "Habilidades suben por uso Y por XP repartido" (respuesta 104, dijiste sí a ambos). `[CRÍTICO]` — son dos modelos incompatibles si conviven mal. Aclara: **(a) ambos suben, uso acumula pequeño, XP sube más rápido**; **(b) uso sube hasta cierto techo, XP rompe el techo**; **(c) eligió mal en la respuesta, solo uno de los dos**. Propongo (b).

**G2.** Nivel máximo 50. ¿La curva de XP es **lineal, exponencial suave o exponencial dura**? `[REGLAMENTO]`. Para wireframe basta reservar espacio de "XP: 1.234 / 9.999".

**G3.** "Hay opciones" en re-spec. Concretemos: **(a) gratis siempre**, **(b) una vez por partida**, **(c) cuesta recurso de juego**. Propongo (c), es lo sano para un RPG.

**G4.** Logros y facciones en MVP confirmados. ¿Cuántos logros mínimos útiles? Propongo **15 logros** que cubran hitos clave (primer combate, primer craft, primera muerte evitada, etc.). ¿Cuántas facciones? Propongo **3** para que las decisiones tengan contraste real sin explosión combinatoria.

**G5.** Lista de temas en diálogos (115). ¿Cuántos temas máximo por NPC antes de saturar la UI? Propongo 6 visibles con scroll.

**G6.** Atacar NPC no hostil "por escribir" (120). `[REGLAMENTO]` — lo dejo para cuando la regla esté cerrada. Para MVP: ¿el botón de ataque está **disponible siempre** sobre NPCs (aunque sean amistosos) o se desactiva hasta que sean hostiles? Propongo siempre disponible con confirmación ("¿atacar a este NPC pacífico?").

**G7.** Texto redimensionable confirmado. ¿Tres tamaños predefinidos (S/M/L) o slider continuo? Propongo 3 tamaños, basta.

**G8.** Fricciones web que el motor futuro debe resolver (pregunta 130, dejaste a mi criterio). Propongo las cuatro siguientes como prioritarias: **(1)** input lag de Canvas vs input nativo; **(2)** carga inicial de bundle (Godot carga on-demand); **(3)** ausencia de threading real (Web Workers es lo mejor que tenemos); **(4)** persistencia (LocalStorage 5MB, IndexedDB compleja). ¿Añadirías alguna que ya presientes?

---

## Bloque H — Scope y orden de construcción (preguntas nuevas, sin derivar)

Estas no están en el primer test pero hacen falta antes del Documento de Scope (Paso 3 del proceso).

**H1.** ¿Cuál es tu **definición de MVP jugable**? Marca las features sin las cuales NO se publica v1:
- [ ] Crear personaje
- [ ] Explorar un mapa (historia o procedural)
- [ ] Combatir al menos un tipo de enemigo
- [ ] Subir al menos un nivel
- [ ] Craftear al menos una receta
- [ ] Hablar con al menos un NPC
- [ ] Guardar y cargar partida
- [ ] Morir con permadeath
- [ ] (añade las que falten)

**H2.** ¿Cuál es el **tiempo objetivo de una sesión de MVP**? ¿Cuántos minutos de contenido debería dar v1 antes de que el jugador diga "ya lo he visto"? Propongo 30-45 min para el loop básico.

**H3.** ¿Hay un **público de prueba** pensado para v1 del navegador? (Pareja, amigos, Discord, público abierto). Condiciona cuánto pulido necesita la UI.

**H4.** ¿Existe un **deadline blando** que te hayas puesto? (No presiono, pero si lo hay lo incorporo al plan).

**H5.** De los cinco bloqueantes del reglamento (biblia §6), ¿en cuál estás invirtiendo tiempo **esta semana**? Condiciona el orden en que te puedo ayudar.

---

## Cierre

Cuando respondas este test:

- Marca las respuestas en línea, igual que el primero.
- Las `[REGLAMENTO]` déjalas vacías, las recogemos cuando se cierre el bloqueante correspondiente.
- Las `[DECIDE-TÚ]`: "ok" basta, o "no, prefiero X".
- Cualquier pregunta que encuentres mal planteada, di "mal planteada, reformula": no pasa nada.

Salida esperada tras tu pase: pasamos al **Paso 3 del proceso**, producción del Documento de Scope v0.1 del MVP web.
