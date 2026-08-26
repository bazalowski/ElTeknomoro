# Ejemplo de POI relleno — fixture de formato, NO es contenido canon

> **Qué es esto y qué NO es.**
>
> Es el entregable de validación de 4f.0: un POI con sus 21 bloques (los 20
> slots más el curado) escritos de punta a punta, para demostrar que el formato
> aguanta **antes** de que se escriban 500. Ejercita todas las bandas de §9.5,
> todos los verbos de `mecanica` y todas las formas de `tirada`.
>
> **No es contenido del juego.** El texto de aquí lo escribió el director como
> andamiaje de prueba, y la higiene de `PLANTILLA-POI.md` §8 es explícita: las
> entradas las escribe Bazalo (#77). Este archivo vive en `plantillas/` y no en
> `pois/` justamente para eso — **el compilador no lo lee**, así que nada de lo
> que hay aquí puede acabar en una partida por accidente.
>
> **Además hoy no podría ser canon aunque quisiera.** La Parte 0 del cuestionario
> de lore v2 tiene sin cerrar C1: los nombres de las cinco regiones del dataset
> contradicen las respuestas del lore v1 en tres de los cinco casos. Hasta que eso
> se firme, cualquier descripción que mencione el paisaje es una apuesta. Por eso
> el texto de abajo es deliberadamente **neutro de bioma** y deliberadamente
> plano: su trabajo es pasar por el parser, no emocionar a nadie.
>
> **Cómo se usa:** ábrelo al lado de un archivo de `contenido/pois/` cuando vayas
> a escribir, para ver cómo queda cada campo relleno. Cuando escribas el POI
> piloto de verdad, este archivo deja de hacer falta.

---

## ejemplo-000-poi-1
arquetipo: ruina
curado: si
posicion: 1,1
nombre: Nave de los Contrafuertes
descripcion: Media bóveda sigue en pie porque las raíces la sostienen desde dentro. La otra media está en el suelo, ordenada por tamaño, como si alguien hubiera empezado a clasificarla.

### 00 · curado
titulo: Lo que quedó del archivo
texto: Bajo la bóveda caída hay una sala que el derrumbe selló en lugar de destruir. Dentro, estanterías de piedra vacías salvo una: alguien volvió después del final y dejó ahí lo que consideró que merecía sobrevivir. No hay forma de saber si acertó.
mecanica: item pocion_curacion_menor + xp 40
agotable: si

### 01 · peligro real
tipo: trap
texto: El suelo de la nave suena a hueco tres pasos antes de dejar de serlo.
mecanica: daño 4 + estado bleeding
tirada: percepcion 4

### 02 · combate menor
tipo: combat
texto: Algo llevaba tiempo usando la bóveda como cubil y no le gusta la visita.
mecanica: enemigo lobo_del_bosque
tirada: sigilo vs percepcion

### 03 · combate menor
tipo: ambush
texto: Salen de detrás de los contrafuertes, coordinados, por los dos lados a la vez.
mecanica: enemigo lobo_del_bosque x2
tirada: percepcion 5

### 04 · color del mundo
tipo: environmental
texto: Las raíces que sostienen la bóveda son más gruesas que el brazo de un hombre y siguen creciendo.

### 05 · color del mundo
tipo: environmental
texto: Alguien apiló los sillares por tamaño y se fue sin terminar.

### 06 · color del mundo
tipo: environmental
texto: Hay marcas de agua en la pared a la altura del pecho. La crecida no fue reciente.

### 07 · color del mundo
tipo: nothing
texto: Nada. El sitio está tan quieto que se oye la propia respiración.

### 08 · color del mundo
tipo: environmental
texto: Un nido ocupa la hornacina donde debía haber una figura. La figura está debajo, boca abajo.

### 09 · color del mundo
tipo: environmental
texto: El musgo crece sólo en la mitad norte de la nave. La otra mitad sigue recibiendo sol por el agujero del techo.

### 10 · color del mundo
tipo: narrative
texto: Hay nombres rascados en la piedra, decenas, con letras distintas y a alturas distintas. El último está a ras de suelo y lo escribió alguien que ya no podía levantarse.

### 11 · color del mundo
tipo: environmental
texto: Las losas del suelo están numeradas. Falta la siete.

### 12 · color del mundo
tipo: environmental
texto: Huele a piedra mojada y a algo dulce que no se identifica y que conviene no buscar.

### 13 · encuentro neutral
tipo: npc
texto: Un hombre mide la bóveda con una cuerda de nudos. Dice que lleva tres días y que va por la mitad.
tirada: ninguna

### 14 · encuentro neutral
tipo: npc
texto: Una mujer se ha instalado en el rincón seco. Tiene fuego, no lo comparte, pero tampoco lo esconde.
mecanica: flag conoce_a_la_del_rincon

### 15 · encuentro neutral
tipo: shelter
texto: El tramo bajo la bóveda intacta está seco y tiene una sola entrada. Es el mejor sitio para pasar la noche en varios kilómetros.

### 16 · recurso
tipo: discovery
texto: Entre dos sillares hay una bolsa de cuero reseco. Aguantó porque nadie miró ahí.
mecanica: oro 12

### 17 · recurso
tipo: discovery
texto: Alguien dejó provisiones envueltas en tela encerada, y la tela encerada hizo su trabajo.
mecanica: item diente_de_lobo x2

### 18 · pista / rumor
tipo: poi
texto: Un mapa rascado en la pared marca un punto al otro lado del valle con tres rayas. Quien lo rascó consideró importante que se supiera.
mecanica: revela sur-001-poi-2

### 19 · oportunidad
tipo: npc
texto: El hombre de la cuerda de nudos ofrece un trato: si le ayudas a medir la mitad que falta, comparte lo que encuentre.
mecanica: oro 20 + xp 15
tirada: atletismo 3 auto

### 20 · legendario
tipo: narrative
texto: En la clave de la bóveda, donde ningún andamio llega, hay una inscripción que no está gastada. Alguien la puso ahí después de que todo lo demás se cayera, y no hay forma humana de haber subido.
mecanica: xp 100 + flag vio_la_clave
tirada: voluntad 5
