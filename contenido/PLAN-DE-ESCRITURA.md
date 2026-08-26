# Cómo afrontar `contenido/`

> Documento de método, no de contenido. Qué escribir, en qué orden, y por qué ese
> orden y no otro. Compañero de `README.md` (qué hay) y `plantillas/PLANTILLA-POI.md`
> (cómo se escribe una entrada).

---

## 1. El número honesto

Escribir las 14.400 entradas enteras, a mano, con nombre y descripción para los 720
POIs, cuesta **entre 700 y 1.400 horas**. El rango sale de suponer 2-4 minutos por
entrada de color del mundo y 6-10 por entrada con mecánica; a 6 horas semanales son
**entre 2 y 4 años y medio**.

Ese número no es un argumento para recortar #92. Es el argumento para no organizar
el trabajo como si fuera un libro que hay que terminar. **No hay que terminarlo.**

La cifra es una estimación de despacho, no una medición. La primera cosa que hay
que hacer es sustituirla por tu velocidad real: escribe el POI piloto de 4f.0
cronometrando, y rellena esto:

| Tipo de entrada | Estimación | Tu tiempo real |
|---|---|---|
| Color del mundo (1-3 frases) | 2-4 min | |
| Entrada con mecánica (combate, recurso, peligro) | 6-10 min | |
| Nombre + descripción de un POI | 5-8 min | |
| Un POI completo, 20 slots | 60-110 min | |
| Un evento curado | 45-90 min | |

Con esos cinco números medidos, todo lo de abajo se recalcula solo y deja de ser
una promesa.

---

## 2. La idea que lo hace posible: cobertura ≠ completitud

La cascada de §9.5 desacopla las dos cosas. Un POI sin una sola línea escrita es
jugable, porque cae a la tabla de su arquetipo y de ahí a la genérica de la banda.

Eso significa que **la calidad percibida del mundo no depende de cuántos POIs tengas
escritos, sino de cuántos niveles de fallback tengas llenos**. Y los niveles altos
son ridículamente baratos comparados con la cola larga:

| Nivel | Entradas | Horas | Qué consigue |
|---|---|---|---|
| Genéricas por banda | 24 | ~2 | Los 720 POIs jugables de punta a punta |
| Tablas de arquetipo | 80 | ~5-7 | Una ruina suena a ruina y un asentamiento a asentamiento |
| Arquetipo × región *(propuesto, §3)* | 200 | ~12-15 | El bosque del Norte no suena a la marisma del Sur |
| **Subtotal** | **304** | **~20-25** | **El mundo entero deja de sonar igual** |
| Entradas propias de POI | 14.400 | 700-1.400 | Cada sitio es único |

**Veinticinco horas contra mil.** Ese es todo el plan: gastar las primeras
veinticinco en los tres niveles de arriba y después escribir POIs propios durante
el tiempo que quieras, sin que ninguna hora sea obligatoria.

---

## 3. Propuesta: un cuarto nivel en la cascada

Hoy la cascada tiene tres escalones: POI → arquetipo → genérica. Propongo meter uno
más entre los dos primeros: **arquetipo × región**.

```
entrada propia del POI
   ↓ si no existe
tabla de arquetipo × región      ← NUEVO
   ↓ si no existe
tabla de arquetipo
   ↓ si no existe
genérica de la banda             ← nunca falla
```

En código es una búsqueda más en la misma función. En mundo percibido es la
diferencia entre cinco regiones que se llaman distinto y cinco regiones que **son**
distintas, que es exactamente lo que #81 compró al meter las cinco en v1 y lo que
#82 dejó pendiente.

Y no hay que escribir las veinte combinaciones. El reparto real de los 720 POIs
está brutalmente concentrado:

| Combinación | POIs | Acumulado |
|---|---|---|
| centro × natural | 114 | 15,8% |
| norte × natural | 87 | 27,9% |
| este × natural | 78 | 38,8% |
| sur × natural | 73 | 48,9% |
| oeste × natural | 72 | 58,9% |
| centro × ruina | 66 | 68,1% |
| norte × ruina | 39 | 73,5% |
| oeste × ruina | 36 | 78,5% |
| sur × ruina | 35 | 83,3% |
| este × ruina | 31 | 87,6% |
| *(las otras diez)* | 88 | 100% |

**Diez tablas de 20 entradas cubren el 88% del mundo con sabor regional.** Las diez
restantes no valen la pena: `este × arcano` son 2 POIs — esos se escriben a mano
directamente, sale más barato.

*(Esto es una propuesta de dirección, no una decisión. Toca §9.5 y §4.15.8, así que
necesita número propio en la biblia antes de que 4f.0 la implemente.)*

---

## 4. La ley del 4 de 20

Cuando llegues a escribir POIs propios, **no escribas los 20 slots**. Escribe cuatro:

| Slot | Banda | Por qué este sí |
|---|---|---|
| 1 | Peligro real | Es lo que hace que este sitio dé miedo y no otro |
| 18 | Pista / rumor | Es lo único que ata este POI al resto del mapa |
| 19 | Oportunidad | Es la razón de volver |
| 20 | Legendario | Es lo que el jugador va a contarle a alguien |

Los otros 16 caen al fallback y **nadie lo nota**, porque los 16 son las bandas
donde el jugador espera repetición: color del mundo, combate menor, recurso,
encuentro neutral. Un lobo es un lobo en cualquier bosque.

Eso baja la cola larga de 14.400 entradas a **2.880**, de 700-1.400 horas a
250-400, sin perder nada de lo que hace memorable un sitio. Y cuando un POI te
apetezca de verdad, le escribes los 20. La plantilla no te lo impide: te lo permite.

---

## 5. Orden de ataque

Siete fases. Cada una **entrega algo visible** y ninguna bloquea a la siguiente más
de lo que dice aquí.

### Fase 0 — Desbloqueo (~10-15 h)
1. **`references/lore-voces.md`** — cuatro párrafos, uno por voz (§10.3). Bloquea el
   tono de las 14.400. Es el bloque 32 del cuestionario v2.
2. **Convención de nombres** — diez topónimos de muestra. Bloquea 720 nombres.
   Bloque 19.
3. **Catálogos mínimos** — la **Ración** (que no existe y dos sistemas la exigen),
   5-6 ítems más, 3-4 enemigos. Bloquea toda línea `mecanica:` que escribas después.

> Sin la fase 0 se puede escribir igual, pero se escribe con deuda: cada entrada que
> nombre un ítem inexistente hay que revisitarla. Trescientas entradas con deuda son
> una tarde perdida; tres mil son un mes.

### Fase 1 — Las 24 genéricas (~2 h)
`fallbacks/genericas-por-banda.md`. Al terminar, **el juego es jugable de punta a
punta**. Es la hora de trabajo con mejor retorno de todo el proyecto.

### Fase 2 — Las 4 tablas de arquetipo (~5-7 h)
80 entradas. Al terminar, los 720 POIs tienen carácter.

### Fase 3 — Las 10 combinaciones que importan (~12-15 h)
Si la propuesta del §3 se aprueba. 200 entradas, 88% del mundo con sabor regional.

### Fase 4 — El primer anillo del Hogar (~40 h)
El PJ arranca en `sur-001` **en todas las runs**, y con permadeath eso significa que
sus vecinos son lo más visto del juego con diferencia. Los datos:

| Anillo | Grids | POIs | Qué es |
|---|---|---|---|
| 1 | 6 | 24 | `sur-002` `sur-008` `sur-009` `oeste-030` `centro-041` `centro-042` |
| 2 | 12 | 48 | |
| 3 | 18 | 72 | |

Escribe los anillos 1 y 2 completos (18 grids, 72 POIs). Es el 10% del mundo y el
80% de lo que un jugador ve antes de morir por primera vez.

### Fase 5 — Los 80 curados (~80-120 h)
El contenido de mayor valor por entrada del juego. Se pueden repartir en meses; cada
uno es independiente.

### Fase 6 — La cola larga (indefinida)
Los POIs propios, con la ley del 4 de 20, por región. El Centro el último: es la
región de más grids (200 POIs) y la única con función dramática sin cerrar (#82).

### Fase 7 — Los ~100 átomos de lore (~50 h, en paralelo desde la fase 2)
No es una fase secuencial: los átomos salen de escribir POIs. Cuando una entrada te
salga demasiado buena para ser una entrada, es un átomo — cópiala a
`TABLA-LORE-ATOMOS.md` y sigue.

---

## 6. Dos modos de sesión

Los mismos archivos aguantan dos formas de trabajar. Alterna según el día:

- **Vertical — un POI entero.** Abres un archivo de grid, eliges un POI, escribes
  sus 20 slots (o sus 4). Sale un sitio coherente, donde la banda 18 habla de lo
  que la banda 20 remata. Más lento por entrada, mucho mejor resultado.
- **Horizontal — una banda en muchos POIs.** Recorres treinta POIs escribiendo solo
  la banda 1. Casi el doble de rápido por entrada, porque no cambias de registro
  mental. Ideal para las bandas repetitivas y para días de poca cabeza.

Regla práctica: **vertical para los curados y el anillo del Hogar, horizontal para
todo lo demás.**

---

## 7. Dos hallazgos del mapa que afectan a lo que escribas

Salen de medir el dataset, no del lore, y conviene decidirlos antes de escribir el
Centro o el Sur.

**El mundo tiene forma de cruz y el Centro es el único pasillo.** Norte, Sur, Este y
Oeste tocan **solo** con el Centro; entre ellos no comparten un solo borde. Ir del
Sur al Norte obliga a cruzar la Zona Cero — la región que tu respuesta 35 describe
como "pocos se aventuran ahí si no están bien equipados". O eso es deliberado y
brutal (el mundo te obliga a pasar por el infierno para ir a cualquier parte, y es
un rasgo de identidad enorme), o es geometría heredada de 4a que nadie miró. Las dos
son defendibles; escribir 200 POIs de Centro sin haberlo decidido, no.

**El Hogar está pegado a la Zona Cero.** `sur-001` está en (0,10) y `centro-041`
está en (0,9): el primer grid al norte de tu casa ya es el Centro. El jugador puede
salir del campamento y meterse en la región de dificultad 5 en un movimiento. Eso
decide qué dice la descripción del Hogar y qué hay en el horizonte cuando sales por
la mañana (pregunta 368 del cuestionario v2).

*(Segunda lectura: #82 llama al Sur "hub estructural". Topológicamente el hub es el
Centro; el Sur es una esquina sin salida. Los dos sentidos de "hub" pueden convivir
— social uno, geográfico el otro — pero conviene saber que son distintos.)*

---

## 8. Higiene

- **Nunca escribas en orden de ID.** El andamiaje no impone orden porque no lo hay.
  Escribe donde te apetezca; la cascada tapa el resto.
- **Un archivo a medias es un archivo válido.** No existe el estado "incompleto".
- **Todo id que escribas en `mecanica:` tiene que existir** en su tabla. Es la misma
  regla de "sin loot huérfano" que ya valida `enemies.test.ts`.
- **Techo de palabras para color del mundo.** Ponlo en la pregunta 383 y respétalo.
  Es lo que hace posibles 6.480 entradas.
- **Cuando una banda te aburra, cambia de banda, no de proyecto.** El aburrimiento
  al escribir la banda 4-12 cuarenta veces seguidas es una señal de modo de sesión
  equivocado, no de que el sistema esté mal.
- **Nada de IA para el texto** (#77). El andamiaje, el compilador y los tests sí;
  las frases no.

---

## 9. Lo que falta de herramienta, y cuándo hará falta

| Herramienta | Cuándo se vuelve necesaria | Estado |
|---|---|---|
| Generador de andamiaje | ya | ✅ `scripts/gen-poi-scaffold.mjs` |
| Contador de progreso (entradas escritas, cobertura por región) | fase 2 | ❌ media hora de trabajo |
| Validador (bandas correctas, ids existentes, techo de palabras) | fase 3 | ❌ |
| Compilador `contenido/` → `src/data/` | 4f.0, antes de ver nada en pantalla | ❌ |
| Campo de pruebas §4.14 (editar tabla en vivo, forzar tirada) | fase 5-6 | ❌ H9 |

El contador es el que más rinde por lo poco que cuesta: ver "1.240 de 14.400" subir
cada semana es la diferencia entre un proyecto y una condena.

---

## 10. Resumen en cinco líneas

1. Fase 0 antes de escribir una sola entrada: voces, nombres, Ración.
2. Veinticinco horas en genéricas + arquetipos + regiones y **el mundo entero deja
   de sonar igual**.
3. Después, la ley del 4 de 20: cuatro slots por POI, no veinte.
4. Empieza por los dos anillos del Hogar; termina por el Centro.
5. Mide tu velocidad real en el POI piloto y recalcula todo lo de arriba.
