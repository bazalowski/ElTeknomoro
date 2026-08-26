# Cuestionario de Lore v2 — capa de producción

> **Director:** el-teknomoro-director
> **Fecha:** 26 de agosto de 2026
> **Continúa a:** `cuestionariolore.md` (228 preguntas, bloques 1-4 respondidos).
> **Numeración:** las preguntas nuevas arrancan en la **229** para no colisionar.
> Las de segundo nivel se anclan a su pregunta madre (`61.1` cuelga de la 61).
> **Marco canon inmutable:** post-humano, naturaleza vencedora, mutaciones como
> eje, esoterismo demoníaco raro y reverencial (#47).

---

## Cómo usar este documento

Tiene tres partes y **no se responden en orden**:

- **Parte 0 — Contradicciones.** Doce choques concretos entre tus respuestas del v1,
  la biblia y el dataset real del mundo. Son las únicas preguntas de aquí que
  **bloquean trabajo**: hasta que se cierren, escribir contenido es apostar.
- **Parte I — Segundo nivel sobre los bloques 5-18.** Esos bloques siguen sin
  responder. Estas no los sustituyen: son la capa de detalle que hará falta
  **además**, y están aquí para que cuando contestes la pregunta madre ya sepas
  hasta dónde llega. Si te agobia, sáltatelas enteras y vuelve luego.
- **Parte II — Bloques nuevos de producción (19-35).** Cada bloque alimenta una
  tabla concreta de `contenido/plantillas/`. Estas son las que convierten lore en
  contenido escribible. **Si solo vas a responder una parte, que sea esta.**

Marca `[ABIERTO]` lo que no quieras cerrar todavía. Marcar abierto es una
respuesta legítima: lo que rompe cosas es responder algo que no piensas sostener.

Etiquetas: **[★]** condiciona muchas otras · **[BLOQUEA]** hay contenido parado
esperándola · **[→ TABLA]** su respuesta se vuelca directo en una tabla.

---

# Parte 0 — Contradicciones y cabos sueltos

Doce cosas que no encajan. No son trampas: son el precio normal de escribir lore
en sesiones separadas. Cada una lleva el dato que la delata.

### C1. Los nombres de las cinco regiones no coinciden [★] [BLOQUEA]

El dataset del mundo lleva desde 4a estos nombres, y la decisión #91 ya los pintó
en pantalla en la vista regional:

| Región | Nombre en el juego (canon, #91) | Tu respuesta 30 |
|---|---|---|
| centro | Cuenca Central | Zona Cero |
| norte | Estepas del Norte | Bosque Lluvioso |
| sur | Marismas del Sur | Tierras Cálidas |
| este | Bosques del Este | Llanuras costeras |
| oeste | Costa del Oeste | Costa Montañosa |

Tres son incompatibles de raíz: una estepa no es un bosque lluvioso, una marisma
no es tierra cálida, y unas llanuras costeras no son un bosque. **¿Cuál manda?**
Si mandan los tuyos hay que renombrar `regiones.json` y la decoración de la vista
regional, que #91 derivó *"únicamente de esos cinco nombres"* (marisma, estepa,
bosque, costa, cuenca). Es media hora de trabajo, pero hay que decidirlo antes de
escribir 720 nombres de POI que hablen de un paisaje u otro.

### C2. ¿Cuál es la región más peligrosa? [BLOQUEA]

Tu respuesta 30 puntúa la dificultad: Centro 5, Norte 4, Oeste 3, Este 2, Sur 1.
Tu respuesta 33 dice que el bioma más peligroso es **el Norte**. Y tu respuesta 35
describe la Zona Cero (Centro) como peligro mortal donde pocos se aventuran.
¿El Norte es "el más peligroso al que la gente va" y el Centro "el sitio del que
no se vuelve"? Si es eso, dilo con esas palabras: cambia cómo se escriben las
tablas de las dos regiones.

### C3. La cronología no cuadra [★]

Tu respuesta 43 da tres eras: años antiguos (2000-2558, llega la tormenta solar),
años oscuros (2558-4500), nuevo mundo (4898 → hoy). De ahí salen tres problemas:

- **Faltan 398 años** entre el final de los años oscuros (4500) y el principio del
  nuevo mundo (4898). ¿Es un hueco a propósito — un periodo del que no se sabe
  nada — o un descuadre?
- **La respuesta 14 dice "unos 4000 años" desde el evento.** Con estas fechas han
  pasado 4898 − 2558 = **2340**. ¿Cuál es la buena?
- **La nota del inventario del v1 dice "4500 años después = EL TEKNOMORO"**, que da
  una tercera cifra.

Elige una y las otras dos se convierten en lore: versiones equivocadas que circulan
por el mundo (§10.6 pide 5-10 pares de contradicciones explícitas, y esta es una
regalada).

### C4. ¿98% o 99,5%?

Tu respuesta 15 dice que se perdió el **98%** de la población. La nota del
inventario del v1 dice **99,5%**. La diferencia no es cosmética: con 99,5% quedan
~350.000 personas en toda la península y un asentamiento es un milagro; con 98%
quedan 1,4 millones y hay comercio de verdad. La respuesta decide cuánta gente
puede haber viva en los 75 POIs de arquetipo asentamiento.

### C5. Los Pirineos están en el sitio equivocado

Tu respuesta 32 pone las fronteras: Sur = Mediterráneo, Oeste = **Atlántico +
Pirineos**, Norte = Mar Oscuro, Este = costa desértica. En la península real los
Pirineos son la frontera **noreste** y el Atlántico el **oeste**; la costa este es
mediterránea, no desértica. ¿Es deliberado — la geografía cambió, o el mapa está
rotado — o hay que recolocarlo? Si es literalmente la Tierra (respuesta 28), un
jugador español lo va a notar en el primer minuto.

### C6. La escala del mundo contra las 8 acciones por día [★] [BLOQUEA]

Esta es la más gorda y sale de cruzar tu respuesta 28 con la mecánica ya cableada.

Si los 180 grids cubren la península ibérica (~590.000 km²), cada grid mide unos
**3.300 km²**, o sea unos **57 × 57 km**. La regla #71 dice que una acción = moverse
al grid siguiente, y que hay **8 acciones al día**. Eso son 57 km por acción y hasta
456 km al día andando. Una jornada de marcha real son 25-30 km.

Cuatro salidas posibles, y la que elijas cambia el tono del juego entero:

- **a)** El mapa no es toda la península, es una porción (una comarca grande, un
  tercio del país). Los 180 grids se quedan como están y las distancias funcionan.
- **b)** El mapa es la península y **una acción no es un día de marcha**: el tiempo
  del juego es abstracto y no se mide en kilómetros. Barato, pero mata cualquier
  frase del tipo "tres días hasta el paso".
- **c)** El mapa es la península y hay algo que explica el viaje rápido a pie —
  monturas, corrientes, rutas antiguas que se recorren de otra forma.
- **d)** v1 no es la península entera. Tu respuesta 29 ya dice "un país en v1, un
  continente en v2, el mundo en v3": quizá v1 es solo el sur peninsular y la
  península completa es v2.

### C7. ¿Hay alma o no?

Respuesta 20: *"No hay alma como tal de manera influyente"*. Respuesta 21, 22 y 23:
hay personajes que las reencarnan en demonios, que las imbuyen en artefactos
minerales, y las de humanos conscientes *"tienen más poder"*. Es decir: **sí hay
alma, y además es un recurso mecánico**. ¿La lectura correcta es "el alma existe,
pero la inmensa mayoría de la gente muere sin que a la suya le pase nada"? Si es
así, dilo con esas palabras: es una frase que puede vivir en un átomo de lore tal
cual.

### C8. Los Teknomoros: ¿facción o trama?

Tu respuesta 7 los define como grupo cerrado y hermético tipo templarios, motor de
la historia principal. El MVP tiene 3 facciones con reputación numérica (§4.11) y
el verbo del juego (#63) lista "perseguir leyenda Teknomoro" como cosa aparte de
las facciones. ¿Los Teknomoros son una de las tres, o son la cuarta cosa que está
por encima? Un grupo hermético con barra de reputación farmeable deja de ser
hermético. *(Recomendación de dirección en `contenido/plantillas/TABLA-FACCIONES.md`:
trama, no facción.)*

### C9. La letalidad 3-9 contra la dificultad 1-5

Respuesta 9: la letalidad oscila entre 3/10 y 9/10, con puntas de −3 y +9.
Respuesta 30: las regiones puntúan 1 a 5. ¿Cómo se mapean las dos escalas? Lo
pregunto porque la de las regiones es la que se va a convertir en niveles de
enemigo, y necesito saber si "Sur = 1" significa letalidad 3 o letalidad 1.

### C10. "Terra" ya está en pantalla

Tu respuesta 8 dice que el mundo se llama **Terra**, y la decisión #91 ya lo puso
como cabecera de la vista regional. Es la única pieza de lore tuyo que ya está en
el juego. Confirmación: ¿"Terra" es cómo lo llama la gente hoy, o es el nombre
antiguo que sobrevive en documentos y nadie usa al hablar?

### C11. Falta la pregunta 44

En `cuestionariolore.md` el bloque 4 salta de la 43 a la 45. Se perdió una pregunta
al escribir el documento. La reemplazo aquí: **¿en qué año estamos ahora mismo, el
día que arranca la partida?** Con número. Aunque casi nadie en el mundo lo sepa,
el autor tiene que saberlo.

### C12. La biblia dice "lore extenso fuera de v1"

El scope §2 dice explícitamente que el lore extenso queda fuera de v1 y que el mapa
de historia es "mínimo viable, no épico". Este cuestionario y las tablas de
`contenido/` empujan en la dirección contraria. No es un problema — es tu proyecto
y no hay deadline (§3) — pero conviene decirlo en voz alta: **¿el lore pasa a ser
un entregable de v1, o sigue siendo trabajo de fondo que se escribe en paralelo y
entra cuando entre?** De la respuesta depende si esto va a `scope-mvp-web-v0.1.md`
como elemento nuevo o se queda como capa lateral.

---

# Parte I — Segundo nivel sobre los bloques 5-18

Los bloques 5 a 18 del v1 siguen sin responder (preguntas 61-228). Lo de aquí no
los sustituye: es la capa de detalle que hará falta cuando los contestes. Están
agrupadas por bloque madre y ancladas a su pregunta.

## Bloque 5 — Razas y pueblos (madres: 61-78)

**61.1** Cuando cierres la lista de especies sapientes: ¿cuántas de ellas puede
**encontrarse el jugador en un POI cualquiera**, y cuántas son de encuentro único?
**61.2** ¿Cuántas tienen lenguaje hablado que el PJ entiende sin intermediario?
**62.1** Si quedan humanos clásicos: ¿son minoría reverenciada, minoría despreciada,
o simplemente gente más?
**68.1** Las mutaciones: ¿son visibles siempre, a veces, o hay quien las esconde?
Lo pregunto porque el perk `callo_de_intemperie` y `pulmon_de_ceniza` ya están en
código descritos como mutaciones físicas del PJ. ¿El PJ está mutado desde el
minuto uno?
**78.1** ¿El PJ puede saber qué es él mismo, o el juego se lo oculta a propósito?

## Bloque 6 — Lo arcano (madres: 79-95)

**79.1** Tu respuesta 15 dice que las descargas solares cargaron **los minerales**
de poderes. ¿Eso significa que todo lo arcano del mundo sale, en última instancia,
de la piedra? Si la respuesta es sí, es la ley física del mundo y hay que escribirla
en una frase.
**82.1** El precio físico de practicar esoterismo: ¿es visible para otros? ¿Un
personaje puede mirar a otro y saber lo que hace?
**87.1** [→ TABLA] Lista de materiales intrínsecamente arcanos, con nombre. Van
directos a `TABLA-MINERALES.md`.
**89.1** ¿Hay artefactos pre-Caída que funcionan? Si los hay, ¿el jugador puede
llevar uno encima, o son de tamaño lugar?
**91.1** Las runas que lee `arcanismo`: ¿son escritura humana antigua o algo que
no escribió una persona? Decide si un POI de ruina puede llevar texto legible.

## Bloque 7 — Religión y cultos (madres: 96-110)

**96.1** [→ TABLA] Nombres de las tradiciones que convivan, aunque sean tres
palabras cada una.
**98.1** ¿Cuántas entidades demoníacas con nombre hay? Tu respuesta 25 dice
"finitas y conocidas": pon el número. Si son 7, el mundo tiene una forma; si son
70, tiene otra.
**105.1** El sacrificio de los cultos: ¿qué se sacrifica exactamente? Tu respuesta
24 habla de posesiones que mutan a lo que atacan — eso ya implica víctimas.
**106.1** ¿Cómo se entierra a un muerto? Es de las cosas que más aparecen en un
mundo con 98% de bajas, y es material directo para la banda de color del mundo.

## Bloque 8 — Política (madres: 111-120)

**113.1** [→ TABLA] La tesis de cada facción en una frase, sin nombre todavía.
Va directo a `TABLA-FACCIONES.md`.
**114.1** ¿El conflicto entre las tres es **activo** (pasan cosas mientras juegas) o
**latente** (lleva años congelado)? Cambia si la reputación sube deprisa o despacio.
**115.1** ¿Alguna de las tres controla territorio de forma que el jugador lo note al
entrar en un grid?

## Bloque 9 — Economía (madres: 121-127)

**121.1** [→ TABLA] [BLOQUEA] ¿Qué se usa como moneda? El motor tiene `oro` como
escalar. Tu respuesta 38 dice que **los minerales** son el recurso más valioso en
supervivencia. ¿El oro del código es literalmente oro, es una abstracción de
"valor", o hay que renombrarlo?
**123.1** ¿Cuánto vale una ración en esa moneda? Es el precio de referencia de todo
el juego: la ración es el único consumible del que depende una vía de muerte.

## Bloque 10 — Sociedad (madres: 128-140)

**128.1** ¿Cuánta gente vive en un asentamiento típico de los 75 del mapa? Da un
número: 20, 200, 2.000. Decide si un POI de asentamiento es una aldea o una ciudad.
**131.1** ¿Quién hace el trabajo duro — hay esclavitud, servidumbre, gremios,
familias?
**134.1** ¿Los niños existen en este mundo? Es una pregunta de tono, y de líneas
rojas: decide si aparecen en los POIs de asentamiento.

## Bloque 11 — Cultura y lenguaje (madres: 141-155)

**141.1** [★] [→ TABLA] **Convención de nombres.** Vas a escribir 720 topónimos.
¿De qué idioma salen — castellano llano, castellano arcaizante, deformaciones de
nombres reales ibéricos, palabras nuevas? Da **cinco ejemplos inventados ahora**;
serán la vara de medir de los 720.
**141.2** ¿Los nombres de lugar los pusieron los vivos o son restos de los nombres
antiguos mal recordados? *(Un cartel de autopista medio comido da un topónimo muy
distinto a un nombre puesto por quien vive allí.)*
**148.1** ¿Hay canciones, dichos o fórmulas fijas que la gente repita? Tres o cuatro
dichos son de las cosas más rentables que se pueden escribir: caben en cualquier
entrada de color del mundo.

## Bloque 12 — Ley y crimen (madres: 156-165)

**156.1** ¿Qué es un delito en un sitio donde no hay estado? ¿Robar comida, robar
minerales, matar, mentir sobre lo que viste?
**160.1** ¿El jugador puede robar? Si puede, ¿alguien lo persigue?

## Bloque 13 — Guerra (madres: 166-175)

**166.1** ¿Hay guerra abierta ahora mismo en algún sitio del mapa, o todo el
conflicto es de baja intensidad? Tu respuesta 10 sugiere lo segundo.
**170.1** ¿Alguien tiene armas de fuego, o la pólvora se perdió? Decide medio
catálogo de equipo de un plumazo.

## Bloque 14 — Bestiario (madres: 176-190)

**176.1** [★] [→ TABLA] [BLOQUEA] ¿Qué proporción del bestiario es **fauna real
mutada**, **vegetación hostil** y **humanos degradados**? Son 15 enemigos: dame el
reparto en números. §11 dice que el mundo es "bosque vivo hostil", y hoy el
catálogo no tiene una sola planta.
**176.2** ¿Las criaturas son fauna ibérica reconocible (lobo, jabalí, buitre, lince)
mutada, o cosas sin equivalente? El lobo del bosque, único enemigo del juego,
apunta a lo primero.
**182.1** ¿Se come lo que se mata? Conecta el bestiario con la ración.
**190.1** ¿Hay criaturas que no atacan y solo se miran? La banda 13-15 (encuentro
neutral) son 3 de cada 20 entradas: 2.160 encuentros pacíficos que llenar.

## Bloque 15 — Facciones (madres: 191-200)

**191.1** [→ TABLA] Nombre interno de cada facción. Aunque sea provisional.
**196.1** ¿Cuál de las tres tiene el secreto más feo? Es el gancho de quest más
barato que existe.

## Bloque 16 — NPCs (madres: 201-208)

**201.1** [→ TABLA] ¿Cuántos NPCs con nombre quieres en v1? Propuesta de dirección:
12-15, de ellos 3-4 comerciantes. Más no cabe en 80 POIs curados.
**203.1** ¿El mentor está vivo cuando empieza la partida, o el jugador llega tarde?
**206.1** ¿Hay algo pre-Caída que siga "encendido" y con lo que se pueda hablar?
Tu respuesta 13 menciona una civilización controlada por IA. **¿Queda algo de esa
IA?** Es la pregunta más gorda del bloque y puede ser el final del juego.

## Bloque 17 — Misterios (madres: 209-216)

**209.1** [★] La pregunta del mundo, en una frase de menos de quince palabras.
**212.1** [→ TABLA] Uno a tres artefactos legendarios con nombre. Son candidatos
directos a las 720 entradas de banda 20 (legendario).
**215.1** [BLOQUEA] El gancho que saca al PJ del Hogar. Sin esto, el primer minuto
del juego no se puede escribir — y el Hogar (`sur-001-poi-1`) ya está en código.

## Bloque 18 — Capa de mesa (madres: 217-228)

**217.1** Antes de nada: ¿sigue interesándote la portabilidad a mesa, sí o no? Si
la respuesta es no, las once preguntas restantes del bloque 18 se archivan y
dejamos de arrastrarlas de documento en documento.

---

# Parte II — Bloques nuevos de producción (19-35)

Cada bloque alimenta una tabla concreta. La cabecera dice cuál.

---

## Bloque 19 — Toponimia: cómo se llaman los 720 sitios
**Alimenta:** `contenido/pois/**` (campo `nombre` de los 720 POIs).
**Por qué importa:** es el campo que más veces vas a escribir en todo el proyecto.

229. [★] Da **diez nombres de POI inventados ahora mismo**, sin pensarlos mucho: dos
   por arquetipo (natural, ruina, asentamiento, arcano) y dos que no sepas clasificar.
   Serán la vara de medir de los otros 710.
230. De esos diez, ¿cuáles te suenan **a ti** a El Teknomoro y cuáles a otro juego?
   La respuesta vale más que la lista.
231. ¿Los nombres son **descriptivos** ("El Vado Roto"), **nominales** ("Casa Merino"),
   **funcionales** ("Punto 41") o mezcla? Si es mezcla, ¿en qué proporción?
232. ¿Qué proporción de POIs debería tener nombre **feo o banal** a propósito?
   Un mundo donde todo se llama "Cripta del Aliento Corto" deja de dar miedo.
233. ¿Sobreviven topónimos reales ibéricos deformados? Si sí, da tres ejemplos.
234. ¿Hay nombres en más de un idioma — restos de portugués, catalán, euskera,
   árabe, latín? La península real los tiene y son cuatro capas de historia gratis.
235. ¿Quién bautiza un sitio: quien vive allí, quien pasa, o el nombre viene de antes?
236. ¿Puede un POI tener **dos nombres** según quién hable? (Coste: cero. Ganancia:
   el mundo se siente habitado.)
237. ¿Los POIs de arquetipo arcano llevan nombre, o son de los que no se nombran?
238. [→ TABLA] ¿Cómo se llama el Hogar (`sur-001-poi-1`)? Es el POI que más veces
   va a leer el jugador y ya está en código sin nombre.

## Bloque 20 — Anatomía de un POI
**Alimenta:** campo `descripcion` de los 720 + las 9 entradas de color del mundo de cada uno.

239. [★] ¿Qué es un POI en este mundo, dicho por un habitante? ¿Un sitio al que se
   va, un sitio del que se habla, una parada en una ruta, un peligro conocido?
240. ¿A qué distancia está un POI del siguiente, en tiempo de camino? *(Ojo con C6.)*
241. ¿Un POI cambia entre visitas? El motor tiene depleción dentro de la run (§9.5);
   la pregunta es si el **mundo** cambia o solo se agota lo que hay que ver.
242. ¿Hay POIs que otra gente también visita — señales de que alguien pasó por aquí
   ayer? Es la forma más barata de que el mundo no parezca un museo.
243. La descripción que se lee al entrar: ¿cuántas frases? ¿Una, dos, tres?
   Multiplica por 720 antes de contestar.
244. ¿Habla en presente o en pasado? ¿En segunda persona ("ves") o impersonal ("hay")?
245. ¿La descripción dice lo que el PJ **siente** o solo lo que **hay**?
246. ¿Los cuatro arquetipos suenan distinto al leerlos, o el tono es único?
247. ¿Qué NO debe aparecer nunca en la descripción de un POI? (Cosas que romperían
   el tono o adelantarían lo que el d20 va a decidir.)
248. Las 9 entradas de color del mundo de cada POI: ¿son **variaciones del mismo
   sitio** o **cosas que pasan** en él? Es la decisión de formato más importante de
   las 14.400 entradas, porque afecta a 6.480 de ellas.

## Bloque 21 — Minerales y materiales
**Alimenta:** `TABLA-MINERALES.md`. **Sistema abierto por tu respuesta 27.**

249. [★] [BLOQUEA] Antes que nada, la bifurcación de `TABLA-MINERALES.md`: el mineral
   ¿es un **ingrediente** (la espada de volcanita es un ítem escrito a mano) o una
   **capa de modificación** (hay armas base y materiales que las modifican)? La
   segunda toca el motor de combate, que es sagrado.
250. [→ TABLA] Lista los minerales con nombre. Cinco bastan para empezar; cuarenta
   son el tropo prohibido nº3 (crafteo-spreadsheet).
251. ¿La volcanita es cosa tuya o existe en el mundo real con otro nombre? *(Existe
   una "volcanita" real, mineral raro; si no lo sabías, decide si te importa.)*
252. ¿Los minerales cargados se ven distintos, pesan distinto, suenan distinto?
253. ¿Se agotan? ¿Hay vetas que se acaban, o el mundo los repone?
254. ¿Quién sabe trabajarlos — cualquiera con fuego, un oficio concreto, un secreto?
255. ¿Un mineral cargado es peligroso de llevar encima?
256. ¿Hay minerales que no se deben mezclar? Una sola pareja prohibida da mil frases.
257. ¿Se pueden descargar, gastar, apagar?
258. ¿La gente lleva minerales por superstición aunque no sepa usarlos?
259. ¿Qué mineral es el más valioso y por qué no lo tiene todo el mundo?

## Bloque 22 — Objetos y equipo
**Alimenta:** `TABLA-EQUIPO.md` y `TABLA-OBJETOS.md`. **Cupo: 20 ítems en v1.**

260. [★] ¿De qué está hecho el equipo de un superviviente medio: chatarra
   reaprovechada, forja real, orgánico curtido, tejido de restos?
261. ¿Hay herreros de verdad — con fragua, yunque y oficio — o todo es apaño?
262. ¿Qué lleva encima alguien que sale de casa un día normal?
263. ¿Existe equipo pre-Caída que aún funcione? ¿Es mejor, o solo raro?
264. [→ TABLA] Nombra tres armas del mundo, con material y quién las usa.
265. [→ TABLA] Nombra tres piezas de armadura. Los slots del motor son cabeza,
   torso, manos, mano principal, mano secundaria y accesorio.
266. ¿Qué es un "accesorio" aquí — amuleto, herramienta, marca, reliquia?
267. La Daga es el arma inicial del juego y ya está en código. ¿De dónde la saca el
   PJ? ¿Es suya de siempre, se la dieron, la robó?
268. ¿Las armas tienen nombre propio, o solo las legendarias?
269. ¿Un arma se rompe del todo o se degrada? El motor tiene durabilidad; la Daga
   arranca con 30 puntos.
270. ¿Se puede reparar, con qué y quién? *(Aviso de scope: el sistema de reparación
   es v1.1 — el scope §2 lo excluye y el equipo queda inservible al llegar a 0. La
   pregunta es de lore, no de mecánica: si en el mundo se repara, el copy no puede
   decir lo contrario.)*
271. ¿Qué objeto cotidiano de nuestro mundo sigue existiendo, casi igual, 2.000 años
   después? La respuesta a esto suele ser el mejor átomo de lore de voz `objeto`.

## Bloque 23 — Comer, beber, dormir
**Alimenta:** `TABLA-OBJETOS.md` (la Ración) y la mecánica de acampada de #71.

272. [★] [BLOQUEA] **¿Qué es una ración?** El motor la exige para acampar y para el
   fast travel, y no existe en el catálogo. Es el ítem más urgente del juego.
273. ¿Se caza, se cultiva, se recolecta, se conserva, se comercia?
274. ¿Hay agua potable, o el agua es un problema? *(Si lo es, es un segundo recurso
   de jornada y hay que decidirlo antes de H6.)*
275. ¿Qué se come en el Sur y qué se come en el Norte? Una diferencia de dieta hace
   dos regiones distintas más rápido que cualquier descripción de paisaje.
276. ¿La comida mutada es comestible? ¿Segura?
277. ¿Cuánto aguanta una persona sin comer aquí, en días?
278. ¿Dormir a la intemperie es peligroso por el frío, por los animales, por la
   gente, o por otra cosa?
279. ¿Se hace fuego, o el fuego te delata?
280. ¿Hay algo parecido al alcohol, al tabaco, a un estimulante?
281. ¿Comer en compañía significa algo? Es la escena que más veces se puede repetir
   en la banda de encuentro neutral sin cansar.

## Bloque 24 — Fauna y flora
**Alimenta:** `TABLA-CRIATURAS.md`. **Cupo: 15 enemigos en v1.**

282. [★] [BLOQUEA] Reparto de los 15: ¿cuántos son fauna mutada, cuántos vegetación
   hostil, cuántos humanos degradados, cuántos arcanos?
283. [★] La vegetación hostil es el rasgo más distintivo del mundo según #47 y §11,
   y no hay ni una planta en el catálogo. **¿Cómo ataca una planta?** ¿Espera,
   persigue, envuelve, envenena?
284. ¿La fauna es ibérica reconocible (lobo, jabalí, buitre, lince, toro) mutada, o
   son cosas sin equivalente?
285. El Lobo del Bosque es el único enemigo del juego y el primer combate que ve
   todo jugador. ¿Qué le pasó al lobo? ¿En qué se diferencia del de hace 2.000 años?
286. ¿Los animales tienen miedo de la gente, o al revés?
287. ¿Hay animales domésticos? ¿Monturas? *(Enlaza con C6.)*
288. ¿Qué animal es buena señal al verlo? ¿Cuál es mala señal?
289. ¿Hay insectos, y son un problema?
290. ¿Los árboles son los mismos árboles? ¿Hay bosque de verdad o algo que lo parece?
291. ¿Existe algo parecido a los hongos como fuerza del mundo? Tu respuesta 37 dice
   que las ruinas están cubiertas de *"capas milenarias de hongos"* — eso apunta a
   que sí, y a que son un pilar y no un adorno.
292. ¿Alguna planta o animal es sagrado, tabú o intocable?
293. ¿Qué se oye de noche?

## Bloque 25 — Mutación
**Alimenta:** perks, retratos, bestiario, descripciones de NPC. **Es un pilar de #47.**

294. [★] ¿La mutación es enfermedad, adaptación, herencia, castigo o bendición?
   ¿Depende de a quién le preguntes?
295. ¿Se contagia? ¿Se hereda? ¿Se provoca?
296. ¿Hay grados? ¿Alguien "muy mutado" deja de considerarse persona?
297. ¿El PJ está mutado? Los perks `callo_de_intemperie` y `pulmon_de_ceniza` ya
   están en código descritos como mutaciones físicas.
298. ¿Se puede revertir?
299. ¿Qué mutación es común hasta la banalidad? ¿Cuál hace que la gente se aparte?
300. ¿Hay sitios que mutan más deprisa? *(Candidato natural: la Zona Cero.)*
301. ¿La mutación duele?
302. ¿Alguien la busca a propósito?
303. ¿Qué palabra usa la gente para "mutado"? ¿Es un insulto?

## Bloque 26 — Economía y comercio
**Alimenta:** `TABLA-NPCS.md` (mercaderes), precios, loot de oro.

304. [★] [BLOQUEA] ¿Qué es el "oro" que el motor ya cuenta como escalar? ¿Moneda
   acuñada, metal al peso, o abstracción de valor?
305. ¿Hay trueque puro en algún sitio?
306. ¿Cuánto vale una ración, una daga, una noche a cubierto? Tres precios de
   referencia y el resto del catálogo se calibra solo.
307. Tu respuesta 40 dice que hay pocas rutas de comercio. ¿Quién se atreve a
   recorrerlas y por qué le compensa?
308. ¿Un mercader ambulante viaja solo? ¿Armado? ¿Con qué protección?
309. ¿Se fía? ¿Existe la deuda?
310. ¿Hay algo que no se venda por ningún precio?
311. ¿Los minerales son la moneda real por encima del oro? *(Tu respuesta 38 apunta
   ahí y cambiaría cómo se escribe cada mercader.)*
312. ¿Qué compra un asentamiento y qué vende?
313. ¿El jugador puede vender cualquier cosa, o hay quien no le compra a un extraño?

## Bloque 27 — Asentamientos
**Alimenta:** los **75 POIs de arquetipo asentamiento** + `arquetipo-asentamiento.md`.

314. [★] ¿Cuánta gente vive en uno típico? Da un número.
315. ¿Están amurallados, escondidos, a la vista, encaramados?
316. ¿De qué vive un asentamiento: agricultura, caza, minería, comercio, saqueo de
   ruinas?
317. ¿Quién manda en uno pequeño? ¿Y en el mayor del mapa?
318. ¿Cómo recibe un asentamiento a un desconocido armado? *(Es lo que el PJ es
   siempre.)*
319. ¿Se puede entrar de noche?
320. ¿Hay asentamientos abandonados? ¿Se distinguen de una ruina?
321. ¿Qué edificio hay en todos ellos, sin excepción?
322. ¿Cuál es el ruido de fondo de un asentamiento?
323. El Sur es el hub estructural con la mayor densidad de asentamientos (#82).
   ¿Por qué allí y no en otro sitio?
324. ¿Los asentamientos saben unos de otros?
325. En un POI de asentamiento el jugador ve `[Hablar]` en vez de `[Combatir]`.
   ¿Se puede atacar un asentamiento? El motor hoy dice que no, y por eso su grid
   nunca puede llegar a "controlado" (deuda abierta de #95).

## Bloque 28 — Ruinas
**Alimenta:** los **207 POIs de arquetipo ruina** + `arquetipo-ruina.md`.

326. [★] ¿Qué queda en pie después de 2.000 años? Tu respuesta 37 dice escombros
   bajo hongos: ¿algo tiene todavía forma reconocible?
327. ¿Se distingue una ruina de un edificio? ¿Se distingue una ruina de una colina?
328. ¿Qué clase de edificios eran? ¿Hay ruinas de ciudad, de industria, de
   infraestructura, de vivienda?
329. ¿Hay carreteras? ¿Se siguen usando para caminar?
330. ¿Qué se saca de una ruina que valga la pena?
331. ¿Por qué no está ya todo saqueado, después de 2.000 años? *(Es la pregunta
   incómoda de cualquier mundo post-apocalíptico y conviene tener respuesta.)*
332. ¿Son peligrosas por lo que hay dentro o por cómo están construidas?
333. ¿Vive alguien en las ruinas?
334. ¿La gente entiende lo que está viendo, o una ruina es un accidente geográfico?
335. ¿Hay algo escrito, y alguien capaz de leerlo? *(Enlaza con la 59 del v1.)*
336. ¿Qué ruina es la más famosa del mapa?
337. ¿Qué siente un habitante de hoy al entrar en una — respeto, indiferencia,
   codicia, miedo?

## Bloque 29 — Lo arcano en el sitio
**Alimenta:** los **14 POIs de arquetipo arcano** + `arquetipo-arcano.md`.
**Aviso:** son el 2% de los POIs. Es deliberado: #47 dice raro y reverencial.

338. [★] ¿Cómo se ve un lugar arcano desde fuera? ¿Se nota antes de llegar?
339. ¿Es un sitio que **alguien hizo** o un sitio donde **pasó algo**?
340. ¿La gente los evita, los visita, los cuida, los explota?
341. ¿Hay marcas, señales o avisos alrededor?
342. ¿Qué le pasa a alguien que se queda a dormir en uno?
343. ¿Son estables? ¿Un lugar arcano puede apagarse o moverse?
344. ¿Hay uno solo que sea distinto de los otros trece?
345. ¿Se puede sacar algo de allí?
346. ¿El silencio, el olor, la luz — qué sentido avisa primero?
347. ¿Qué NO debe pasar nunca en un POI arcano para que sigan siendo raros? *(La
   respuesta a esta es la que protege el pilar #47 durante las 280 entradas que hay
   que escribir para ellos.)*

## Bloque 30 — Naturaleza
**Alimenta:** los **424 POIs de arquetipo natural** — el 59% del mundo — y
`arquetipo-natural.md`. **Es el bloque que más entradas va a generar.**

348. [★] ¿Cómo es el paisaje dominante, en tres frases?
349. ¿Qué ha cambiado de la naturaleza ibérica real? ¿Más agua, menos, más frío,
   más vegetación, otra vegetación?
350. ¿El bosque es hostil de verdad o solo peligroso? §11 dice "bosque vivo hostil":
   ¿el bosque **quiere** algo?
351. ¿Hay estaciones? ¿Se notan?
352. ¿Qué tiempo hace normalmente?
353. ¿Cómo huele el mundo?
354. ¿Hay sitios naturales que la gente considere buenos, seguros, hospitalarios?
355. ¿El agua es limpia?
356. ¿Se ve el cielo entre la vegetación? Tu respuesta 41 dice que el cielo sin
   contaminación lumínica es una visión ancestral: ¿se ve desde el suelo del bosque
   o solo desde lo alto?
357. ¿Qué es lo más bonito que puede ver un jugador en este mundo? *(Casi todo el
   contenido de color del mundo es feo o neutro por defecto; conviene saber dónde
   está el techo.)*
358. ¿Y lo más desolador?
359. ¿Qué detalle pequeño se repite por todo el mapa y ancla el mundo? *(Un tipo de
   flor, un liquen, una marca, un sonido. Sirve para 424 POIs.)*

## Bloque 31 — Las cinco regiones, una por una
**Alimenta:** identidad regional, pesos de tablas, distribución de enemigos y POIs
curados. **Cierra el hueco de #82** (cuatro de las cinco funciones dramáticas están
diferidas a fase 2 desde hace tres versiones de la biblia).

Para **cada** región, cinco preguntas paralelas. Contesta primero la que tengas más
clara; suele arrastrar a las otras cuatro.

360. **Centro (50 grids, el mayor).** ¿Qué es la Zona Cero exactamente? Tu respuesta
   35 la pinta como ruinas antiguas, peligro mortal y tecnología del pasado, con
   "la verdad aguardando desde milenios". ¿Es un sitio, o son 50 grids de sitio?
361. **Centro.** ¿Por qué se llama Zona Cero — pasó algo concreto allí?
362. **Centro.** ¿Qué le pasa a la gente que vuelve de allí?
363. **Norte (35 grids).** ¿Bosque lluvioso o estepa? *(Ver C1.)* ¿Y qué lo hace el
   sitio más peligroso al que la gente va de verdad?
364. **Norte.** ¿Qué hay allí que compense el riesgo?
365. **Norte.** ¿Qué es el Mar Oscuro y por qué se llama así?
366. **Sur (35 grids, hub, tu inicio).** Es la región con más asentamientos y donde
   arranca la partida. ¿Por qué es la zona tranquila — geografía, gente, distancia
   a algo?
367. **Sur.** Tu respuesta 34 dice que es lo más sagrado o reverenciado. ¿Reverenciado
   por qué, y por quién?
368. **Sur.** ¿Qué se ve desde el Hogar al salir por la mañana?
369. **Este (30 grids).** ¿Llanuras costeras o bosque? *(Ver C1.)* ¿Qué la hace
   distinta del Sur, con el que comparte mar?
370. **Este.** ¿Qué es la "costa desértica" de tu respuesta 32?
371. **Oeste (30 grids).** Costa montañosa y Atlántico. ¿Qué tiene el Oeste que no
   tenga nadie más?
372. **Oeste.** ¿El mar se usa? ¿Hay barcos, pesca, alguien que mire hacia fuera?
373. [★] De las cinco, ¿cuál te apetece más escribir? Empieza por esa: el andamiaje
   no impone orden y las 5 tienen curaduría equivalente (#81).
374. ¿Qué región es la que un jugador va a recordar cuando cierre el juego?

## Bloque 32 — Voces y registro
**Alimenta:** `references/lore-voces.md`, que §10.3 exige **antes** de la escritura
masiva y que no existe. Es el prerrequisito real de las 14.400 entradas.

375. [★] [BLOQUEA] Escribe un párrafo de voz `cronista` sobre cualquier cosa.
376. [★] [BLOQUEA] Escribe dos o tres frases de voz `npc`: alguien contando algo con
   sesgo, o mintiendo.
377. [★] [BLOQUEA] Escribe una inscripción o descripción de objeto, voz `objeto`.
   Lacónica.
378. [★] [BLOQUEA] Escribe dos frases de voz `ambiente`, sensoriales, sin narrador.
379. De las cuatro, ¿cuál te sale más natural? Esa debería ser el 70% del juego.
380. ¿El cronista es una persona concreta o una convención? ¿Tiene agenda?
381. ¿La voz `ambiente` puede decir cosas que el PJ no puede saber?
382. ¿Se permite el humor seco en alguna de las cuatro? Tu respuesta 5 dice que hay
   humor seco y que de eso te encargas tú.
383. ¿Cuántas palabras, como máximo, para una entrada de color del mundo? Pon un
   techo y respétalo: es lo que hace que 6.480 entradas sean posibles.
384. ¿Qué palabra, giro o muletilla NO quieres leer nunca en este juego?

## Bloque 33 — La gente
**Alimenta:** `TABLA-NPCS.md`.

385. [★] Nombra cinco personas del mundo. Nombre y una línea. Sin pensarlo mucho.
386. ¿Cómo se llama la gente aquí — nombres castellanos, deformados, de oficio,
   apodos?
387. ¿Qué hace alguien normal todo el día?
388. ¿Qué teme alguien normal?
389. ¿Qué le pasa a un viejo aquí?
390. ¿La gente confía en un desconocido armado que llega a su puerta?
391. ¿Alguien viaja por gusto?
392. ¿Qué se hace con un cadáver que encuentras en el camino?
393. ¿Cómo se saluda la gente?
394. ¿Hay alguien que sepa leer y escribir? ¿Es raro?
395. ¿Qué NPC te gustaría escribir aunque no sirviera para nada? Escríbelo igual;
   suele ser el mejor del juego.

## Bloque 34 — Los Teknomoros y el final
**Alimenta:** la quest principal (H5), el cierre de #44 y el nombre del juego.

396. [★] [BLOQUEA] ¿Facción o trama? *(Ver C8.)*
397. ¿Cuántos son?
398. ¿Se les reconoce al verlos?
399. ¿Cómo se entra? ¿Se puede salir?
400. ¿Qué hacen con lo que recolectan — lo guardan, lo estudian, lo destruyen, lo
   veneran?
401. ¿Qué es un "tek inclasificable" de tu respuesta 7? Da un ejemplo concreto.
402. ¿Buscan algo en particular, o lo buscan todo?
403. ¿La gente normal sabe que existen? ¿Qué se cuenta de ellos?
404. [★] El final del juego es "el cierre Teknomoro" (#44, #63). ¿Qué es ese cierre:
   encontrarles, unirse, sustituirles, impedirles algo, entender lo que saben?
405. ¿El PJ empieza sabiendo que existen?
406. ¿El nombre del juego lo entiende el jugador antes o después de terminarlo?

## Bloque 35 — Peligro, muerte y epitafios
**Alimenta:** copy de muerte, epitafios (ya implementados), banda 1 de los 720 POIs.

407. [★] ¿Cómo muere la gente aquí, por orden de frecuencia?
408. La lápida del PJ ya está en el juego. ¿Quién la escribe, dentro del mundo?
409. ¿La muerte del PJ deja rastro en el mundo, o el mundo no se entera?
410. ¿Qué se dice de alguien que no volvió?
411. La banda 1 (peligro real) es 1 de cada 20 entradas: 720 formas de que algo
   pueda matarte. ¿Qué mata en un sitio tranquilo?
412. ¿Hay muertes que la gente considere buenas?
413. ¿Se entierra a los desconocidos?
414. Tu respuesta 3 cambia "horror" por **tensión**: mundo peligroso pero
   gratificante, asombroso pero destructivo. ¿Cómo se escribe una muerte que sea
   tensa y no macabra?
415. ¿Qué es lo peor que le puede pasar a alguien aquí, peor que morir?
416. ¿Con qué frase te gustaría que se quedara un jugador que muere por primera vez?

---

## Cuando termines

Pega las respuestas en bloques, como el v1. El director procesa bloque por bloque
y las convierte en:

- **Decisiones de biblia §5** con número propio, si tocan estructura.
- **Filas de las tablas** de `contenido/plantillas/`, si tocan catálogo.
- **`references/lore-voces.md`**, si son el bloque 32.

Prioridad recomendada si solo vas a responder una parte: **Parte 0** (desbloquea),
luego **bloque 32** (voces), luego **bloque 19** (nombres). Con esos tres se puede
empezar a escribir POIs de verdad.
