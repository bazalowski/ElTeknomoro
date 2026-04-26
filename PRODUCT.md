# Product

## Register

product

> Nota de alcance: existe también un registro **brand** secundario, reservado a una eventual landing pública del proyecto (presentación del juego, captura de jugadores externos para playtest, eventual comercialización si la fase web genera tracción). Esa landing **no se construye en v1** y, cuando se construya, hereda los principios de este documento pero se rige por el reference de brand de impeccable. Hasta entonces, todo lo que diseñemos es product.

## Users

Bazalo (autor) y, en cuanto H3 cierre, jugadores externos invitados a playtest.

Perfil del jugador objetivo: rolero veterano de mesa o de RPG digital con criterio. Juega en casa, en portátil de 14" o monitor de escritorio, normalmente de tarde-noche. Mood contemplativo, sesiones de 30 a 60 minutos. Llega esperando que cada decisión pese, que la muerte sea final, y que el sistema sea entendible sin manual a mano. Sabe leer una hoja de personaje. Tolera (incluso pide) que el juego le exponga la tirada y los modificadores en lugar de esconderlos.

No es el público de RPG-acción AAA ni el de cozy-game. Es alguien que probablemente jugó Disco Elysium con paciencia y que disfruta una hoja de personaje bien densa.

## Product Purpose

El Teknomoro es un RPG de mundo abierto con permadeath donde cada tirada está expuesta y cada decisión es definitiva. El producto no es un juego de mesa digitalizado: es un juego nativo de navegador construido sobre un reglamento simulado numéricamente antes de existir. La UI sirve a una premisa concreta — **que el jugador sienta que está jugando rol, sin tener que abrir el manual**.

Éxito = el jugador entiende qué está pasando en pantalla, por qué pasa, y qué puede hacer al respecto, sin glosario externo. Fracaso = jugador confundido sobre qué tiraron los dados o por qué su personaje hizo lo que hizo.

## Brand Personality

Cinco palabras: **Original · Tétrico · Legible · Artesanal · Austero**.

- **Original**: huye del molde RPG digital al uso. Si una decisión visual se puede encontrar en cualquier otro juego del género, se rechaza por defecto.
- **Tétrico**: el mundo está fracturado por un evento de extinción y la muerte es permanente. La interfaz lo respira sin caer en el terror gore. Sombras largas, no efectos de sangre.
- **Legible**: cada elemento de pantalla se puede explicar en una frase. Cada tirada se ve. Cada modificador se nombra. La transparencia es ideológica, no decorativa.
- **Artesanal**: se nota la mano detrás. Tipografía elegida, no genérica. Espaciado pensado, no aproximado. Nada huele a asset-flip ni a librería de componentes. Se nota la mano de un equipo de los mejores diseñadores de interfaces de videojuegos.
- **Austero**: si un elemento no aporta lectura, no aparece. Sin gradientes decorativos. Sin glow. Sin sombras de cinco capas. Sin partículas ambientales que no comuniquen estado o identifiquen algo muy importante.

Voz: directa, en español de España, sin emojis, sin signos de exclamación de marketing. Tuteo. Cuando el juego habla al jugador, lo hace como un máster que respeta su tiempo: una frase, no tres.

## Anti-references

Vetos explícitos confirmados por Bazalo:

- **Cliché RPG digital actual** (Diablo IV / Path of Exile / Last Epoch): UI sobrecargada, glow, bordes dorados, partículas ambientales, números flotantes saturando la pantalla, tooltips de seis líneas con iconos. **Rechazado por completo.**
- **Cliché RPG mesa digital neón retro** (Citizen Sleeper, ciertos derivados de Disco Elysium con verde fosfo): pixel art deliberado + paletas neón sobre negro absoluto. **Rechazado.**
- **Cliché indie cozy pastel** (Stardew, Spiritfarer, kawaii con acuarela suave): paletas pastel, tipografías redondas amables, world-tone amigable. **Rechazado.**

Tolerancia controlada:

- **Cliché AAA empresarial** (Cyberpunk 2077 / Starfield UI HUD militar holográfico): no se replica, pero **su sentido del ritmo y de la jerarquía técnica sí se respeta**. Cuando hay que mostrar muchos números a la vez (hoja de personaje, log de combate, sistema de tirada de exploración), la inspiración estructural de "panel técnico de operador" es válida — sin caer en el HUD chrome ni en las animaciones holográficas.

Otras prohibiciones que se derivan de las tres anteriores y conviene escribir:

- **Sin gradientes** sobre texto ni sobre superficies amplias. Un fondo es un fondo, no un degradado.
- **Sin glassmorphism** decorativo. Si un blur ocurre alguna vez, será por motivo funcional explícito.
- **Sin "hero metric"** SaaS (número gigante + label pequeño + supporting stats).
- **Sin grids idénticos de cards** repitiendo el patrón icono + heading + texto.
- **Sin emojis nunca**, ni en UI ni en copy.
- **Sin em dashes** en copy (preferir comas, dos puntos, paréntesis).

## Design Principles

Cinco principios estratégicos. No son reglas visuales (el color, el tamaño, las fuentes viven en DESIGN.md): son la brújula que decide cuándo una decisión visual está alineada con el producto.

1. **El reglamento es el héroe, no el adorno.** Toda la UI sirve a que la regla se entienda y se vea ejecutarse. Si un elemento embellece sin clarificar, sobra. Inspiración: cómo un buen libro de rol expone la fórmula de tirada — la fórmula es el contenido, no algo a ocultar tras animaciones.

2. **Mostrar el dado.** Cuando hay tirada, el resultado y los modificadores se exponen sin tooltips ocultos. El jugador siempre puede leer "tiré 14, sumé +3 de DES, +1 de habilidad, total 18, umbral 16, éxito". Esto es ideológico. Si una pantalla rompe esto, está rota.

3. **Un personaje, un mundo, una vida.** Permadeath es la espina dorsal. La UI nunca minimiza la gravedad de las decisiones. Las confirmaciones modales para acciones irreversibles existen y son sobrias, no melodramáticas.

4. **Densidad sobre amabilidad.** El público objetivo prefiere una hoja de personaje densa y legible a una "amigable" con espacios vacíos. Cuando hay que elegir entre comprimir información útil o estirar con aire decorativo, comprimir gana — pero respetando legibilidad (ratio de contraste, jerarquía tipográfica, line-length 65–75ch en cuerpo).

5. **Placeholder honesto, no simulación de pulido.** El scope marca explícitamente que la estética visual definitiva se decide en H9. Hasta entonces, lo que diseñemos es **un sistema visual provisional coherente** que prioriza claridad y carácter sobre acabado final. No se simulan pantallas falsas-pulidas; se construye una versión austera que comunique correctamente y que pueda escalar a la versión definitiva sin reescribirse desde cero.

## Accessibility & Inclusion

Compromiso firme: **WCAG AA** en todo lo que toquemos (contraste mínimo 4.5:1 en texto cuerpo, 3:1 en texto grande y elementos UI no-textuales).

Compromisos del scope MVP web v0.1 §1.12 que la UI debe respetar:

- 3 tamaños de texto (S/M/L) ofrecidos al jugador. Slider continuo queda fuera de v1.
- Teclado + ratón. Todo flujo principal navegable con teclado, sin atajos ocultos sin discoverability.
- Desktop only en v1 (Chromium + Firefox). Mobile y tablet quedan fuera.
- Modo daltónico queda fuera de v1 — pero el sistema de color se diseña para no depender exclusivamente de la diferencia hue (todo estado importante se acompaña de cambio en luminancia + iconografía + texto), de forma que la migración a modo daltónico en v1.1 sea aditiva, no destructiva.

Sin compromiso formal de WCAG AAA, sin lectores de pantalla en v1, sin reduced-motion explícito por ahora — pero motion siempre será sobrio (ease-out, sin bounce, sin elastic), de modo que un usuario sensible no sufre.
