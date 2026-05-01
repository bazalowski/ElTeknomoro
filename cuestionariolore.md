# Cuestionario de Lore — El Teknomoro

> **Director:** el-teknomoro-director
> **Fecha:** 26 de abril de 2026
> **Lector:** Bazalo. Responde en bloques. El director procesa bloque por bloque.
> **Marco canon inmutable:** mundo post-humano, naturaleza vencedora, mutaciones como eje, esoterismo demoníaco raro y reverencial.

---

## 📚 Inventario del repo ElTeknomoro

- **Nombre y posicionamiento ya cerrados:** "El Teknomoro" (decisión #6, v0.3); el placeholder anterior ("Mundos Fracturados") está deprecado. Subtítulo de género: RPG de mundo abierto procedural, un personaje,una mision, permadeath.
- **Pilar lore-físico canon registrado en memoria (2026-04-26):** mundo post-humano + naturaleza vencedora + mutaciones + esoterismo demoníaco ancestral y reverencial. Vegetación viva hostil,alquimia presente. Importancia a los recursos de la tierra (minerales, gases) no desierto Mad Max, no ruina seca, no neón.
- **Evento fundacional citado pero nunca descrito:** PRODUCT.md §Brand habla de "evento de extinción"; biblia §2 habla de "evento arcano que fracturó el mundo"; los starting decks de skills hablan de "lo que el evento arcano dejó atrás" (skill `arcanismo`). El evento existe como referencia, pero **no hay un solo párrafo que lo nombre, datifique o explique**. ⚠️ Hueco crítico. "Evento de extincion" <5000 años despues de la caida de una civilizacion mundial en paz controlada por la IA. la caida se produce por un cataclismo que destruyo toda conexion digital y electricidad cableada. Epoca oscura del mundo (guerras hambres pandemia destruccion de ciudades) diezmo la poblacion al 99,5%. 4500 años despues> =EL TEKNOMORO
- **Tono de mundo establecido en marca:** "Realista" + Tecnico, Maravilloso; lore "extenso" explícitamente fuera de v1 (scope §2), mapa de historia "mínimo viable, no épico".
- **Decisiones de reglamento numérico cerradas (46):** atributos FUE/DES/CON/INT/VOL, pool d6 4+ en combate, 1d20 en exploración, permadeath con epitafio, nivel máx 50, 5 arquetipos, 10 habilidades, 5 perks iniciales, onboarding con bandera narrativa (`viajero_audaz` / `viajero_cauto`), Suerte derivada de INT+VOL.
- **Biomas provisionales declarados (5):** llanura, bosque, desierto, glaciar, ruinas de civilizacion. Marcados como "se redefinen cuando lore entre en scope" (biblia §4.10).
- **Arquetipos ya redactados con sabor:** ARCH1, ARCH2, ARCH3, ARCH4, ARCH5 (`src/data/archetypes.ts`). Aún no escrito.
- **Habilidades con micro-lore embebido:** `arcanismo` ("lo que el evento arcano dejó atrás"), `voluntad` (resiste "dominación mental, ilusiones, locura"). Ya hay sustrato de magia + horror mental.
- **Perks con sabor:** Golpe Brutal, Pies Ligeros, Piel Dura, Ojo Clínico, Temple. Temple introduce "miedo / pánico" como estado del juego. Sin ningún perk vinculado todavía a lo demoníaco.
- **Facciones (3 en MVP):** identidad pendiente. La guía recomienda explícitamente "no espejadas: tres ejes en tensión, no buenos vs malos".
- **Onboarding usa arquetipo de criatura "lobo"** como tier de combate forzado (decisión #45). Es la única criatura del mundo nombrada en algún documento.
- **Banderas narrativas reservadas:** `viajero_audaz`, `viajero_cauto` (decisión binaria post-tutorial).
- **Frase-semilla del modo Libre como mecanismo de worldbuilding del jugador:** decisión #13. Ejemplo dado por Bazalo: *"una tormenta mágica ha despertado algo bajo el glaciar"*. Confirma que magia, glaciar y "algo durmiente" están dentro del paraguas.
- **Quest principal del modo Historia:** condición de victoria (decisión #44) **sin definir en absoluto**. Es el mayor agujero narrativo bloqueante para H4.
- **⚠️ Tensión interna a vigilar:** PRODUCT.md describe el mundo como "fracturado por un evento de extinción" y habla de "muerte permanente" sin más, mientras que la memoria de lore canónica dice "mundo vivo, vegetación hostil, NO apocalipsis seco". Ambos son compatibles, pero la palabra "extinción" arrastra inercia post-apocalíptica que conviene reencuadrar explícitamente para que el copy futuro no se desvíe hacia Mad Max.

---

## ❓ Cuestionario de Lore

### Bloque 1 — Premisa y tono

1. [★] En una sola frase de pitch (máx 25 palabras), ¿qué es El Teknomoro para alguien que nunca ha oído hablar del mundo? [REPO] (existe pitch de producto, falta pitch de mundo).
- Un juego de rol en web , en el que exploras un futuro apocaliptico, con mecanicas rpg, en busca de las verdades del antiguo mundo
2. [★] ¿Qué tres referentes (libros, juegos, películas, cómics) son los primarios para entender el tono del mundo, en orden de cercanía?
- The Road, Cormac Mcarthy
- Fallout 3 - Bethesda Games
- Dark Souls - From Software
- Nacidos de los Hombres - Alfonso CUARON
- El libro de Eli 
3. [REPO] El brand dice "tétrico, sombras largas, no gore". Confirma o matiza: ¿el horror del mundo es **psicológico, fisiológico, ecológico, espiritual** o una mezcla concreta de varios?
- Mas que horror, hay que cambiarlo por la palabra tension. Es un mundo peligroso, pero gratificante. Asombroso, pero destructivo.
4. ¿Qué emoción quieres que sienta el jugador la primera vez que sale al mapa abierto: cautela, asombro, melancolía, hostilidad, soledad, fascinación, o cuál?
-Espectacion y cautela.
5. ¿Hay humor en el mundo? Si lo hay, ¿de qué tipo (negro, seco, popular, irónico, ausente del todo)?
- Seco. Pero de esto me encargaré yo.
6. ¿Qué NO es El Teknomoro? Da tres ejemplos de mundos o juegos cuyo tono debería cualquier copy o arte evitar emular.
- No es un stardew valley
- NO es project zomboid
- No es Baldurs Gate
7. [★] La palabra "Teknomoro" en el mundo del juego, ¿es **un nombre propio** (ciudad, entidad, era, tecnología, dios) o solo el nombre externo del producto sin diégesis?
- Son un grupo reducido de personas: Los Teknomoros. Motor de la historia principal.
8. Si "Teknomoro" es diegético, ¿quién lo pronuncia y en qué contexto? Si no lo es, ¿qué nombre interno usan los habitantes del mundo para nombrar al mundo (o al "después" de la humanidad)? 
- Terra. 
9. Nivel de letalidad ambiente, en una escala 1-10, donde 1 es Stardew y 10 es Dark Souls a oscuras: ¿en qué número vive el día a día del jugador y por qué?
- Oscilante dependiendo zonas, tu equipo, tu azar en la ruta elegida. Puede ser de 3/10 a 9/10. En ocasiones puntuales es -3 y +9.
10. ¿El tono moral del mundo es **trágico** (la caída ya pasó, solo queda dignidad), **ambiguo** (cada facción tiene razón parcial), **brutal** (la moral es lujo de los vivos) o **reverencial** (lo que queda merece respeto, no juicio)?
- Cada facción tendrá un color diferente en su forma de ver y hacer en el mundo.
11. ¿Hay esperanza en el mundo? Si la hay, ¿es esperanza de **restauración**, de **adaptación** o de **trascendencia**?
- Es ambigua.
12. ¿Cuál es el primer adjetivo que un NPC usa para describir el lugar donde vive (no su mundo entero, su lugar)?
- Zona (por escribir)

### Bloque 2 — Cosmología y metafísica

13. [★] ¿Qué fue exactamente "el evento arcano" que aparece nombrado en biblia §2 y en `arcanismo`? Da una versión canónica de una sola frase (sin metáforas).
14. ¿Cuándo ocurrió el evento, medido desde el ahora del juego: décadas, siglos, milenios, o tiempo no cuantificable?
15. ¿El evento tuvo un origen **interno** (los humanos lo provocaron), **externo** (algo vino y lo causó), **emergente** (la naturaleza lo desencadenó sola) o **cíclico** (ya había pasado antes)?
16. ¿Sigue ocurriendo el evento en alguna forma residual, o terminó y solo quedan consecuencias?
17. [★] Antes de la humanidad, ¿hubo otra cosa? Si sí, ¿lo recuerda alguien o algo en el mundo?
18. ¿Existen planos, dimensiones o reinos distintos del físico? Si sí, ¿cuántos y cómo se relacionan con el mundo material?
19. ¿Cómo funciona el tiempo en este mundo: lineal homogéneo, lineal pero perceptiblemente acelerado/lento por zonas, cíclico, fracturado, o algo más raro?
20. [★] ¿Qué le pasa al alma (o a lo que sea equivalente) de un ser vivo cuando muere? *(Si respondes que no hay alma, salta 21 y 22 y responde 23.)*
21. *(Si respondiste que sí hay alma en 20)* ¿A dónde va, quién la recibe, puede regresar?
22. *(Si respondiste que sí hay alma en 20)* ¿Las criaturas mutadas tienen el mismo tipo de alma que tendría un humano clásico, o algo cambió?
23. *(Si respondiste que no hay alma en 20)* ¿Qué queda entonces de un ser cuando muere — recuerdos en otros, masa orgánica, eco arcano, nada?
24. ¿El esoterismo demoníaco implica entidades reales con voluntad, o son fenómenos sin sujeto que la gente personifica por miedo?
25. *(Si respondiste "entidades reales" en 24)* ¿Son finitas, contables, conocidas, o son potencialmente infinitas y sin nombre?
26. ¿Existe destino, providencia, predestinación en este mundo, o todo es contingente?
27. ¿Hay leyes físicas que el evento rompió o reescribió? Da un ejemplo concreto de una ley que aquí ya no se cumple como en nuestro mundo.

### Bloque 3 — Geografía y cartografía

28. [★] ¿El mundo del juego es **un continente**, un archipiélago, una región dentro de un mundo mayor, o no se sabe porque nadie lo ha cartografiado entero?
29. ¿Qué escala tiene la zona jugable: el equivalente a una comarca, a un país, a un continente, o irrelevante porque la geografía es subjetiva?
30. [REPO] Los 5 biomas de MVP son llanura, bosque, desierto, glaciar, ruinas arcanas. Confirma o cambia los nombres internos de cada bioma para que dejen de ser genéricos.
31. ¿Cada bioma tiene una identidad propia (un nombre propio, una historia), o son categorías genéricas tipo "el bosque del norte"?
32. ¿Existen fronteras visibles entre biomas (líneas, ríos, muros, accidentes) o las transiciones son borrosas y orgánicas?
33. ¿Qué bioma es el más peligroso del mundo y por qué motivo concreto (no solo "es duro")?
34. ¿Qué bioma es el más sagrado o reverenciado, si lo hay?
35. ¿Hay lugares **prohibidos**: zonas a las que nadie va, ni siquiera los más temerarios? ¿Por qué están prohibidas — peligro físico, tabú, contaminación arcana, otra cosa?
36. ¿Hay lugares **imposibles**: que no deberían existir según las leyes que el mundo aún reconoce (ciudades flotantes, mares sin agua, bosques bajo tierra)?
37. ¿Las ruinas arcanas son ruinas **de la humanidad clásica**, de algo anterior, de algo posterior, o de los tres mezclados?
38. [★] ¿Qué recurso natural del mundo es más valioso (no en valor de mercado, en valor de supervivencia)?
39. ¿Hay mares u océanos en la zona jugable, o el mundo es interior?
40. ¿Existen rutas de comercio activas, o cada asentamiento es una isla?
41. ¿Hay ciclo día/noche **normal** o el cielo cambió tras el evento? Si cambió, describe qué se ve ahora cuando el jugador mira hacia arriba.
42. ¿Hay constelaciones, lunas, o cuerpos celestes con nombre y rol mítico?

### Bloque 4 — Historia y cronología

43. ¿Cómo cuenta el mundo el tiempo: años humanos antiguos, eras desde el evento, ciclos naturales, o no se cuenta más allá de "después"?
44. [★] Da nombre y duración aproximada a las eras del mundo (mínimo 2: pre-evento y post-evento; añade más si las hay).
45. ¿La memoria del mundo pre-evento se conserva como **historia documentada**, **leyenda oral**, **ruinas mudas**, o **se ha perdido del todo**?
46. ¿Qué fue exactamente la humanidad clásica antes de caer: una civilización tecnológica, mágica, mixta, o el dato no es accesible?
47. [★] ¿Cómo cayó la humanidad: en un día, en una guerra de generaciones, por colapso lento, por elección propia, por extinción biológica, o por algo más extraño?
48. ¿Hubo culpables identificables de la caída? ¿Sus nombres se recuerdan?
49. ¿Existe una versión oficial de la caída que es mentira, una versión popular distinta, y una verdad real? *(Si todas coinciden, dilo.)*
50. ¿Ha habido cataclismos posteriores al evento principal? ¿Cuántos, cuándo?
51. ¿Hay guerras vivas en el mundo del juego, o todo el conflicto activo es de baja intensidad?
52. ¿Existe algún suceso histórico que cualquier habitante del mundo conozca por nombre (tipo "la Caída", "la Larga Noche", "el Despertar")?
53. ¿Algún calendario, festividad o efeméride marca todavía la vida cotidiana, o el tiempo es solo estaciones y luz?
54. ¿Existe una profecía, una promesa o una amenaza colectiva que el mundo sepa pendiente?
55. ¿Algún personaje histórico (no necesariamente humano) tiene estatus mítico hoy?
56. ¿La fecha exacta del evento es conocida o es disputada?
57. ¿Algún lugar sirve de "monumento" colectivo a la caída — visitado por todos, respetado por todos?
58. ¿Hay registro escrito anterior al evento que sobreviva y que el jugador pueda leer en partida?
59. ¿La escritura humana clásica se sigue entendiendo, o ha cambiado el lenguaje?
60. ¿Hay alguien vivo hoy que recuerde personalmente el evento? *(Si la longevidad post-humana lo permite, esta pregunta abre lore enorme.)*

### Bloque 5 — Razas, especies y pueblos sapientes

61. [★] ¿Qué especies sapientes existen hoy en el mundo del juego? Lista cerrada de nombres internos, breve etiqueta cada una.
62. [★] ¿Existen humanos clásicos en alguna forma — supervivientes, descendientes degradados, momificados conservados, ninguno?
63. ¿Hay descendientes mutados de humanos que sigan reconociéndose como "ex-humanos", o esa identidad se perdió?
64. ¿Cuál es la especie sapiente dominante en número hoy? ¿Cuál es la dominante en poder?
65. ¿Hay especies sapientes muy raras o casi extintas que el jugador podría encontrar y ese encuentro sería un evento?
66. ¿Las especies sapientes pueden cruzarse biológicamente entre sí? Si sí, ¿hay mestizos comunes, raros, o están vetados culturalmente?
67. ¿Cuál es la longevidad media de la especie sapiente más común? ¿Y de la más longeva?
68. ¿Las mutaciones se transmiten por herencia, por contagio ambiental, por exposición arcana, por elección, o por varias vías?
69. ¿Hay especies sapientes vegetales, fúngicas o de origen claramente no animal?
70. ¿Hay sapientes que ya no son orgánicos en sentido humano (cristalinos, gaseosos, simbiontes, conciencias colectivas)?
71. ¿Cómo se reproducen las especies sapientes principales — sexual al modo conocido, asexual, partenogénesis, esporulación, otra cosa?
72. ¿Hay pueblos sapientes que **no se desplazan** y son geográficamente fijos como un bosque o un nido?
73. ¿Existe una especie cuya sola presencia es socialmente tabú — "no se les nombra, no se les caza, no se les ayuda"?
74. ¿Cuál es la relación dominante entre especies: convivencia tensa, segregación geográfica, guerra abierta, indiferencia mutua, jerarquía?
75. ¿Hay especies sapientes consideradas demoníacas o tocadas por lo arcano que vivan apartadas y temidas?
76. ¿Algún pueblo sapiente fue creado **deliberadamente** por la humanidad antes de caer (siervos, soldados, mascotas hipertrofiadas)?
77. ¿Hay diferencias mecánicas o jugables entre especies en MVP, o el jugador encarna siempre una sola especie por defecto? *(Si es lo segundo, ¿cuál?)*
78. ¿Cómo se ve un cuerpo "estándar" del jugador: ¿es ex-humano, mutado, mezcla, o ambiguo a propósito?

### Bloque 6 — Sistema mágico / sobrenatural / tecnológico

79. [★] ¿Cuál es la fuente única o múltiple de lo arcano en este mundo? *(Naturaleza, residuo del evento, entidades, herencia humana, otra.)*
80. ¿Lo arcano es **algo que se aprende** (estudio), **algo que se hereda** (linaje), **algo que se sufre** (afecta sin querer) o **algo que se pacta** (con entidades)?
81. ¿La habilidad `arcanismo` (leer runas, identificar) es un saber académico, una sensibilidad innata, o ambos?
82. [★] ¿Qué le ocurre físicamente al cuerpo de alguien que practica el esoterismo demoníaco durante años?
83. ¿El esoterismo demoníaco es una de las formas de lo arcano, la única, o algo separado de lo arcano "normal"?
84. ¿Qué precio se paga por usar magia menor? ¿Y mayor? ¿Hay magia gratis?
85. ¿Existen lugares donde la magia es más fuerte, más débil, o imposible?
86. ¿Hay limitación de "maná" tipo recurso, o el coste es físico, social, narrativo, o todo eso a la vez?
87. ¿Qué ítems o materiales del mundo son intrínsecamente arcanos (no porque alguien los encantara, sino porque nacieron así)?
88. ¿La tecnología clásica humana sobrevivió en alguna forma — utensilios sueltos, ruinas de máquinas, conocimiento perdido, motores aún activos en alguna parte?
89. ¿Existe algún artefacto pre-evento que aún funciona y que la gente teme tocar?
90. ¿La relación magia / tecnología es de **sucesión** (la magia llegó después y reemplazó), de **convivencia**, de **antagonismo**, o de **fusión** (lo arcano emerge de tecnología que dejó de entenderse)?
91. ¿Las runas que un Lector de Runas lee son lenguaje humano antiguo, lenguaje arcano no-humano, código tecnológico, o categorías mezcladas?
92. ¿La magia se puede registrar en libros, transmitir verbalmente, solo demostrar en presencia, o algunas cosas no se pueden enseñar en absoluto?
93. ¿Hay protección efectiva contra lo demoníaco — amuletos, gestos, sangre, palabras, plantas, sales? ¿O cualquier protección es ilusión?
94. ¿Quién en el mundo tiene **prohibido** acceder a lo arcano y por qué?
95. ¿La habilidad `voluntad` resiste "dominación mental, ilusiones, locura": ¿de qué naturaleza son estas amenazas — siempre arcanas, también químicas/biológicas, también divinas?

### Bloque 7 — Religiones, cultos y panteones

96. [★] ¿Hay religión organizada en el mundo? Si sí, ¿cuántas tradiciones distintas conviven?
97. ¿Las religiones del mundo veneran a entidades **activas** (que responden, intervienen) o a entidades **ausentes** (silenciosas, perdidas, muertas)?
98. ¿Existen entidades demoníacas con nombre propio que el mundo conozca (aunque no se invoquen)?
99. ¿Hay un panteón "natural" — entidades vinculadas a bioma, fenómeno, organismo — distinto de lo demoníaco?
100. ¿Algún culto venera al evento mismo como si fuera un dios?
101. ¿Hay clero, sacerdotes, oficiantes? ¿Cómo se les distingue visualmente del resto?
102. ¿Los milagros son verificables: si un sacerdote bendice un campo, el campo cambia de manera medible, o la fe es siempre acto de creer sin pruebas?
103. ¿Existe herejía y, si existe, qué cosa cuenta como herejía aquí?
104. ¿Hay cultos prohibidos universalmente reconocidos, o "prohibido" depende de la región?
105. ¿Algún culto practica sacrificio (de tiempo, sangre, memoria, vida, otra cosa)? ¿De quién?
106. ¿La muerte tiene rituales — entierro, cremación, devolución al bosque, momificación, exposición? ¿Varían por especie?
107. ¿Existe un día sagrado o una hora sagrada del año para alguien?
108. ¿Algún animal o planta tiene estatus religioso o tabú?
109. ¿Hay literatura sagrada accesible al jugador en partida (libros recogidos, inscripciones, oraciones)?
110. ¿La habilidad `voluntad` se usa también ante experiencias religiosas, o solo ante amenazas?

### Bloque 8 — Política y geopolítica

111. [★] En un mundo post-humano y fracturado, ¿qué cuenta como "nación" o entidad política mayor — ciudad-estado, tribu, gremio, territorio, alianza de nodos, ninguna?
112. ¿Hay alguna autoridad reconocida más allá de la inmediata (jefe local, anciano, asamblea)?
113. ¿Las **3 facciones del MVP** ya tienen identidad mental aunque no estén redactadas? Para cada una: ¿cuál es su tesis del mundo, no su nombre?
114. [★] *(Sigue de 113)* ¿Cuál es el conflicto vivo central entre las tres facciones — recurso, ideología, territorio, herencia, supervivencia?
115. ¿Alguna facción es claramente "dominante" hoy, o están en equilibrio?
116. ¿Hay una facción que el jugador no pueda unirse, ni siquiera con esfuerzo extremo?
117. ¿Existen alianzas estables entre facciones, o todas son contingentes?
118. ¿Hay diplomacia formal — embajadores, tratados, encuentros — o todo se negocia caso a caso en el camino?
119. ¿Alguna facción es **secreta** (nadie sabe quiénes son sus miembros)?
120. ¿La reputación del jugador con una facción afecta su trato por **otras facciones aliadas u hostiles**, o cada reputación es independiente?
121. ¿Las facciones tienen **iconos visibles** (banderas, marcas, tatuajes, vestimentas) o se reconocen solo por conducta?
122. ¿Hay líderes nombrados por facción, o el liderazgo es difuso?
123. ¿Alguna facción tiene plan de **expansión** o están todas en modo defensivo?
124. ¿Hay sub-facciones, células, herejías internas dentro de cada facción del MVP?
125. ¿Quién declara la guerra en este mundo y con qué pretexto?

### Bloque 9 — Economía, comercio y recursos

126. [★] ¿Hay moneda en el mundo, o el comercio es trueque, favor, deuda, otra cosa?
127. *(Si hay moneda)* ¿De qué está hecha y quién la respalda?
128. *(Si no hay moneda)* ¿Cuál es la unidad de valor implícita más usada (días de trabajo, unidades de comida, balas, agua, sal, recuerdo, otra)?
129. ¿Qué bien es **escaso** en todo el mundo? ¿Qué bien es **abundante**?
130. ¿Hay monopolio sobre algún recurso por una facción concreta?
131. ¿Existe mercado negro y, si existe, qué se vende ahí que no se vende en abierto?
132. ¿Las estaciones de crafteo (forja, alquimia) son propiedad privada, comunal, religiosa, gremial?
133. ¿Quién fabrica armas en este mundo y bajo qué control?
134. ¿Existe esclavitud, servidumbre, trabajo forzoso, o todo trabajo es voluntario por defecto?
135. ¿Qué se considera lujo aquí — un libro, una pieza de carne, una ducha, una semilla, una conversación tranquila?
136. ¿El equipo y los items raros se transmiten por herencia, se venden, se entierran con el dueño, o circulan libremente?
137. ¿Hay rutas comerciales con nombre propio que el jugador pueda escuchar mencionar?

### Bloque 10 — Sociedad, clases y vida cotidiana

138. ¿Hay clases sociales reconocibles en los asentamientos del mundo? Si sí, ¿cuáles?
139. ¿Cómo se forma una familia o unidad doméstica en el mundo del juego — pareja, comuna, manada, clan extenso, casa de oficio, otra?
140. ¿Existe el concepto de género tal como lo entendemos? ¿O las especies sapientes lo organizan distinto, o no lo organizan?
141. ¿Cómo se cría a los niños — familia núcleo, comunidad entera, escuela, oficio, no se crían (las especies maduran solas)?
142. ¿La vejez es respetada, temida, escondida, ignorada?
143. ¿Qué come la gente normal en un día normal? *(Da 1-2 ejemplos concretos por bioma habitable.)*
144. ¿Cómo viste la gente normal? Material, color dominante, función vs ornamento.
145. ¿Hay tatuajes, escarificaciones, marcas corporales con significado público?
146. ¿Existe la noción de **propiedad privada** del suelo o la tierra es de quien la ocupa?
147. ¿Qué se hace por las noches en un asentamiento típico — se duerme, se vela, se trabaja, se reza, se esconde?

### Bloque 11 — Cultura, arte y lenguaje

148. [★] ¿Cuántos idiomas conviven en el mundo del juego? Da el nombre interno de cada uno y quién lo habla.
149. ¿Existe una **lengua franca** que todos los sapientes entienden?
150. ¿Hay un idioma muerto que solo los Lectores de Runas pueden leer? ¿Tiene nombre?
151. ¿La palabra "Yermo" (que aparece en `arq_vol = Voz del Yermo`) es **un topónimo concreto** del mundo o un sustantivo común para zonas hostiles?
152. ¿La palabra "Teknomoro" es jerga, lenguaje sagrado, lenguaje técnico antiguo, o invención reciente del mundo?
153. ¿La música existe en el mundo? ¿Qué instrumentos se conservan o se han inventado?
154. ¿Hay tradición literaria viva — alguien escribe poemas, leyendas, crónicas? ¿O la cultura escrita es solo conservación de lo antiguo?
155. ¿Cómo es la arquitectura típica de un asentamiento del mundo: materiales, formas dominantes, escala?
156. ¿Hay festividades vivas que el jugador pueda atravesar al pasar por un nodo en la fecha correcta?
157. ¿Qué tabúes culturales son más fuertes — sobre el cuerpo, la muerte, lo arcano, lo antiguo, otra cosa?
158. ¿Existe el arte por el arte, o todo objeto cultural tiene función?
159. ¿Hay deportes, juegos, apuestas?

### Bloque 12 — Ley, crimen y justicia

160. ¿Existe un código de leyes formal en alguna parte del mundo? *(Si responde "no", salta 161.)*
161. *(Si sí en 160)* ¿Quién lo redactó y quién lo aplica?
162. ¿La justicia es retributiva (castigo), restaurativa (reparación), preventiva (exilio), o ausente (la ofensa la cobra el ofendido)?
163. ¿Cuál es el peor crimen posible en el mundo y cuál es su castigo arquetípico?
164. ¿Hay criminales famosos vivos, con nombre y leyenda, que el jugador pueda escuchar mencionar?
165. ¿Existen organizaciones criminales — gremios de ladrones, sindicatos, cárteles — o el crimen es siempre individual o de banda pequeña?
166. ¿La corrupción es asumida y normalizada, vergonzante, o algo que el mundo no concibe?
167. ¿Hay cárceles, o el castigo es siempre inmediato (multa, exilio, ejecución, esclavitud)?
168. ¿La sangre demoníaca, el contagio arcano o la mutación visible son tratadas como crimen, enfermedad, condición, o nada?
169. ¿Qué se considera "merecer la muerte" en el sentido coloquial — qué actos hacen que el matar al actor sea aceptado por todos?

### Bloque 13 — Guerra, milicia y conflicto

170. ¿Hay ejércitos permanentes en alguna facción, o todo combate organizado es ad-hoc?
171. ¿Existen mercenarios profesionales reconocidos? ¿Forman gremio?
172. ¿Qué armamento es típico — frío (cuchillo, espada, hacha), arrojadizo (arco, ballesta), explosivo, arcano, mixto?
173. ¿Sobreviven armas de fuego pre-evento? Si sí, ¿son raras, comunes, prohibidas, sagradas, peligrosas de usar?
174. ¿Hay doctrina de guerra propia de alguna facción — "luchamos así porque creemos esto"?
175. ¿Qué guerra está viva ahora mismo en el mundo del juego, aunque sea de baja intensidad?
176. ¿Se han producido atrocidades recordadas — masacres, genocidios, contaminaciones intencionadas — recientes?
177. ¿La guerra contra criaturas mutadas o demoníacas se considera **guerra** o **plaga**?
178. ¿Quién entierra a los muertos de batalla, y cómo?

### Bloque 14 — Bestiario y naturaleza no sapiente

> **CRÍTICO:** la naturaleza ha vencido. Este bloque define el carácter del mundo.

179. [★] Da 5 nombres internos de criaturas mutadas que el jugador encontrará seguro en los 5 biomas (una por bioma). Una palabra o dos cada una, sabor canónico.
180. ¿Las mutaciones son **estables** (el lobo mutado siempre es así) o **inestables** (cada lobo mutado es distinto)?
181. ¿Hay un "lobo del Yermo" definido (apareció en biblia §4.6 como tier de combate forzado del onboarding)? Descríbelo en una frase.
182. [★] ¿Qué criatura es la más temida del mundo, no necesariamente la más fuerte: la que asusta su nombre?
183. ¿Hay criaturas demoníacas distinguibles de las mutadas, o son la misma cosa con interpretación distinta?
184. ¿Qué planta del mundo es venenosa por contacto, y qué planta es sagrada y comestible?
185. ¿Existe fauna mansa, doméstica, vinculada a humanos / sapientes, o toda criatura es salvaje?
186. ¿Hay enjambres, plagas, o animales gregarios cuya colectividad es la amenaza, no el individuo?
187. ¿Existen ecosistemas únicos — bosque que se mueve, glaciar que respira, ruina que sangra — que el jugador pueda atravesar?
188. ¿Qué ocurre cuando un cadáver de criatura mutada se descompone — material útil, riesgo de contagio, semilla de algo nuevo?
189. ¿Hay criaturas **inteligentes pero no sapientes** (perros viejos del mundo, depredadores que recuerdan, plantas que aprenden)?
190. ¿Algún animal es considerado "guardián" de un bioma o lugar concreto?

### Bloque 15 — Facciones, gremios y organizaciones

191. [★] Para cada una de las 3 facciones del MVP, da: nombre interno, líder o falta de líder, agenda en una frase, conflicto principal con las otras dos. *(Tres respuestas paralelas.)*
192. ¿Hay un gremio profesional con poder real (alquimistas, herreros, lectores, cazadores)?
193. ¿Existe una organización dedicada a estudiar lo arcano? ¿Cuál es su nombre, postura ante lo demoníaco?
194. ¿Hay una hermandad o culto dedicado específicamente a lo demoníaco — temerlo, venerarlo, contenerlo, usarlo?
195. ¿Qué facción u organización tiene rituales de iniciación serios — no formalismo, sino prueba real?
196. ¿Alguna facción tiene secretos que destruirían su credibilidad si salieran a la luz?
197. ¿Existen organizaciones extintas pero recordadas, cuya herencia el jugador puede encontrar (artefactos, refugios, símbolos)?
198. ¿Las facciones tienen **enemigos comunes** — cosas externas a ellas que las unen ocasionalmente?
199. ¿Hay facciones no humanas / no sapientes — un bosque organizado, una manada con propósito, una colonia inteligente?
200. ¿Qué pasa si el jugador traiciona a las tres facciones a la vez — queda solo, hay una cuarta vía, muere socialmente?

### Bloque 16 — Personajes vivos clave / NPCs

201. [★] Nombra 3 NPCs vivos hoy en el mundo cuyo nombre cualquier habitante reconocería. Para cada uno: rol, por qué importa.
202. ¿Hay un antagonista principal del mapa de historia ya pensado, aunque no escrito? *(Si lo hay, una frase. Si no, dilo.)*
203. ¿Existe un mentor, sabio o referente que el jugador pueda buscar y consultar?
204. ¿Hay un paria famoso — alguien expulsado de todo y conocido precisamente por eso?
205. ¿Alguien vivo recuerda personalmente el evento original?
206. ¿Hay NPCs no orgánicos, no naturales — algo que sigue activo desde antes y mantiene presencia?
207. ¿Algún NPC tiene una recompensa (oficial o no) puesta sobre su cabeza?
208. ¿Alguien gobierna el asentamiento principal del mapa de historia? Nombre, tipo de poder.

### Bloque 17 — Misterios, leyendas y ganchos narrativos

209. [★] ¿Cuál es **la pregunta del mundo** que el propio mundo no puede responder y que define la curiosidad del jugador atento?
210. ¿Existen profecías vivas que el mundo cree que se cumplirán? Da 1-2.
211. ¿Hay un lugar perdido cuya sola mención hace callar a la gente?
212. ¿Existen artefactos legendarios cuya posesión sería un evento histórico si reaparecieran? Nombra 1-3.
213. ¿Hay leyendas del mundo cuyo relato cambia según quién las cuente — versión "oficial" vs versión "vieja"?
214. ¿Algún mito propone una **redención** o **cura** para el mundo, aunque nadie la crea seriamente?
215. [★] ¿Cuál es el gancho inicial que mueve al PJ a salir del primer asentamiento — necesidad, deuda, exilio, encargo, hambre, llamada arcana, otra?
216. ¿Hay un secreto del mundo que el jugador puede descubrir en una sola partida, o todo descubrimiento es parcial entre vidas (aprovechando el permadeath)?

### Bloque 18 — Capa TTRPG / mesa

217. [REPO] La biblia v0.4 retiró la fase de mesa del proceso activo. Confirma: ¿el cuestionario debe ignorar mesa por completo, o sigues queriendo que el lore sea **portable a mesa** algún día? *(De la respuesta dependen 218-228.)*
218. *(Si confirmas que el lore debe ser portable a mesa)* ¿Qué sistema de reglas hipotético tienes en mente para la versión mesa — propio derivado del web, hack de un sistema existente, narrativo ligero?
219. *(Igual que 218)* ¿Qué nivel de poder máximo tendrían los PJs en mesa — mismo techo 7, o reescalado?
220. ¿Qué tipo de aventuras emergerían más naturalmente del mundo: exploración, intriga, supervivencia, mistery cult, mercenariado, peregrinaje?
221. ¿Cuál sería el **hook inicial estándar** que un máster usaría para arrancar una campaña en este mundo?
222. ¿Hay líneas (cosas que no se tocan jamás) en mesa? Y velos (cosas que se tratan elípticamente)? Da 2-3 de cada.
223. ¿Qué tono de mesa quieres por defecto — investigación, supervivencia tensa, gesta trágica, picaresca oscura?
224. ¿Cómo se resuelve la magia en mesa para conservar la "rareza reverencial" del esoterismo demoníaco — coste alto, tirada con consecuencia, requisito narrativo, otra?
225. ¿Cuál es la duración esperada de una campaña típica — one-shot, sandbox abierto, arco de 6-12 sesiones, larga estilo OSR?
226. ¿Qué NO debería hacer un PJ aquí, ni siquiera siendo libre — qué accion rompería el mundo si se permitiese?
227. ¿Hay especies sapientes que el jugador NO debería poder encarnar aunque existan en el mundo? ¿Cuáles y por qué?
228. ¿La muerte en mesa también es permanente, o ahí relajarías el permadeath del web?

---

Cuando termines, pégame las respuestas en bloques. Procesaré bloque por bloque.
