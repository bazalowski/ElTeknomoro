# H2 — Dudas de contenido para arrancar la UI de creación

> **Propósito:** cerrar las tres minidecisiones de contenido que H2 necesita ANTES de tocar UI. No es diseño nuevo: el reglamento ya está cerrado (biblia v0.8). Esto es **redacción**.
> **Director:** el-teknomoro-director
> **Lector:** Bazalo. Rellena los huecos marcados con `>>>` y devuélvelo.
> **Salida esperada:** este mismo .md con las respuestas pegadas debajo de cada bloque. Yo lo convierto en `data/archetypes.ts`, `data/skills.ts` y `data/portraits.ts`.

---

## Reglas que enmarcan las decisiones (no se tocan)

Recordatorio rápido de lo que ya está cerrado y NO se está discutiendo aquí:

- **5 atributos:** FUE, DES, CON, INT, VOL.
- **Creación de atributos:** 12 puntos a repartir, mínimo 1, máximo 4 al crear.
- **Creación de habilidades:** 10 puntos a repartir, máximo 3 al crear.
- **Perk inicial:** exactamente 1.
- **HP máx:** `8 + 2·CON` (CON 1 → 10 HP, CON 4 → 16 HP, CON 7 → 22 HP).
- **DEF:** `2 + floor(DES/2) + armadura`.
- **Suerte (derivada):** `floor((INT+VOL)/2) - floor(level/10)`.
- **Habilidades suben:** por uso (techo blando) y por XP (rompe techo, máx 7).
- **Inventario inicial fijo por arquetipo** + botón "Sorpréndeme".

Lo que decidamos aquí debe **respetar estos números**. Si algo no encaja, lo flagueo y discutimos.

---

## Bloque 1 — Los 5 arquetipos

Necesito, **por arquetipo**, 4 cosas:

1. **Nombre** (corto, evocador, en castellano o jerga del Teknomoro).
2. **Concepto en una frase** (qué fantasía cumple, para que el jugador entienda en 2 segundos por qué elegirlo).
3. **Stat-line** de los 5 atributos (suma = 12, mínimo 1, máximo 4 — yo verifico).
4. **Habilidades sugeridas** (2-3 IDs de la lista del Bloque 2 con +2/+3 puntos asignados, total ≤ 10).

El reparto de puntos al elegir un preset NO bloquea: el jugador puede ajustarlos después. Es un punto de partida sensato.

### 1.1 Arquetipo dominante FUE

- **Nombre:** `>>>` (sugerencia mía: *Bárbaro*, *Mercenario*, *Rompemuros*, *Bruto del Yunque*)
- **Concepto en una frase:** `>>>`
- **Stat-line:**
  - FUE: `>>>` (ej. 4)
  - DES: `>>>`
  - CON: `>>>`
  - INT: `>>>`
  - VOL: `>>>`
  - **Total:** debe sumar 12.
- **Habilidades de partida sugeridas (≤10 puntos, máx 3 por habilidad):** `>>>`

### 1.2 Arquetipo dominante DES

- **Nombre:** `>>>` (sugerencia mía: *Pícaro*, *Cazador*, *Filo Veloz*, *Sombra*)
- **Concepto en una frase:** `>>>`
- **Stat-line:**
  - FUE: `>>>`
  - DES: `>>>` (ej. 4)
  - CON: `>>>`
  - INT: `>>>`
  - VOL: `>>>`
  - **Total:** debe sumar 12.
- **Habilidades de partida sugeridas:** `>>>`

### 1.3 Arquetipo dominante CON

- **Nombre:** `>>>` (sugerencia mía: *Centinela*, *Guardián*, *Ariete*, *Aguantapalos*)
- **Concepto en una frase:** `>>>`
- **Stat-line:**
  - FUE: `>>>`
  - DES: `>>>`
  - CON: `>>>` (ej. 4)
  - INT: `>>>`
  - VOL: `>>>`
  - **Total:** debe sumar 12.
- **Habilidades de partida sugeridas:** `>>>`

### 1.4 Arquetipo dominante INT

- **Nombre:** `>>>` (sugerencia mía: *Erudito*, *Arcanista*, *Tecnomante*, *Lector de Runas*)
- **Concepto en una frase:** `>>>`
- **Stat-line:**
  - FUE: `>>>`
  - DES: `>>>`
  - CON: `>>>`
  - INT: `>>>` (ej. 4)
  - VOL: `>>>`
  - **Total:** debe sumar 12.
- **Habilidades de partida sugeridas:** `>>>`

### 1.5 Arquetipo dominante VOL

- **Nombre:** `>>>` (sugerencia mía: *Inquebrantable*, *Mártir*, *Profeta*, *Voz del Yermo*)
- **Concepto en una frase:** `>>>`
- **Stat-line:**
  - FUE: `>>>`
  - DES: `>>>`
  - CON: `>>>`
  - INT: `>>>`
  - VOL: `>>>` (ej. 4)
  - **Total:** debe sumar 12.
- **Habilidades de partida sugeridas:** `>>>`

> **Nota mía:** el inventario inicial por arquetipo (5 ítems aprox.) lo dejo para H5, donde está el catálogo de items. En H2 el preset lo deja vacío y la pantalla "Inventario inicial" muestra placeholder hasta H5. Si quieres adelantarlo, dilo.

---

## Bloque 2 — Lista mínima de habilidades

El scope dice 8-12 habilidades. Mi recomendación: **10**, dos por atributo, para que cada arquetipo tenga al menos dos vías de progresión naturales.

Lo que necesito de ti:

1. **Confirmar o cambiar la lista propuesta** (los 10 nombres).
2. **Confirmar a qué atributo se asocia cada habilidad** (el atributo que se suma a la tirada cuando se usa).
3. **Confirmar si una habilidad cubre un verbo del juego** (algunas son obligatorias porque la biblia §4.15 las nombra: Sigilo, Percepción, Supervivencia, Persuasión, Esquiva, Instinto).

### Propuesta inicial

| ID interno | Nombre visible | Atributo asociado | Para qué se usa | ¿Obligatoria por biblia? |
|---|---|---|---|---|
| `armas_cuerpo` | Armas de cuerpo | FUE | Atacar con espada/maza/hacha | No |
| `atletismo` | Atletismo | FUE | Saltar, escalar, romper, cargar | No |
| `armas_distancia` | Armas a distancia | DES | Atacar con arco/ballesta/arma de fuego | No |
| `sigilo` | Sigilo | DES | Evitar emboscadas, colarse | **Sí** (§4.15.6) |
| `aguante` | Aguante | CON | Resistir veneno, frío, fatiga, sangrado | No |
| `supervivencia` | Supervivencia | CON | Acampar, refugio, comida, rastreo | **Sí** (§4.15.6) |
| `arcanismo` | Arcanismo | INT | Leer runas, identificar items mágicos, lanzar | No |
| `percepcion` | Percepción | INT | Detectar trampas, NPCs ocultos, pistas | **Sí** (§4.15.6) |
| `persuasion` | Persuasión | VOL | Convencer NPCs, regatear, intimidar | **Sí** (§4.15.6) |
| `voluntad` | Voluntad | VOL | Resistir miedo, dominación mental, locura | No |

**Decisiones a confirmar:**

- ¿Te vale **esta lista de 10**? `>>>` (sí / no / cambios)
- ¿Cambias algún nombre? `>>>`
- ¿Falta algún verbo del juego sin habilidad? `>>>`
- ¿Sobra alguna que no veas que vaya a usarse en MVP? `>>>`
- **Esquiva e Instinto** los menciona la biblia (§4.15.6) pero los he plegado dentro de DES (esquiva = atributo) y VOL/INT (instinto = derivado). ¿Te parece bien o prefieres que existan como habilidades explícitas? `>>>`

---

## Bloque 3 — Set de 12 retratos placeholder

El scope confirma: **12 retratos fijos en grid, sin categorizar por género/edad/etnia, estilo visual uniforme**. Para H2 valen rectángulos de color con un número grande, suficiente para validar el flujo. Los reales entran en H9.

Decisiones que necesito:

- **¿Confirmas placeholder visual?** Mi propuesta: 12 cuadrados con un color único cada uno + número 01-12 en grande. Sin caras, sin pixel art, sin nada que parezca diseño definitivo (para que nadie se enamore del placeholder). `>>>` (sí / no / contrapropuesta)
- **¿Quieres que en H2 ya tengan un nombre interno temático** (ej. "retrato_cazador_01") **o IDs neutros** (`portrait_01` ... `portrait_12`)? Recomiendo neutros: que el jugador no vea sesgo. `>>>`
- **Paleta:** 12 colores distintos, alto contraste entre sí. ¿Tienes preferencia de paleta, o uso una neutra (HSL distribuido a 30°)? `>>>`

---

## Bloque 4 — Perk inicial (1 obligatorio)

El scope dice: **el jugador elige 1 perk al crear. Los perks del árbol se desbloquean según el arquetipo elegido (o según atributo dominante si empezó libre).**

Para que H2 no se quede en placeholder absoluto necesito **al menos 5 perks iniciales** (uno por arquetipo / atributo dominante). Estos son los visibles en la pantalla "Perk inicial" cuando el jugador llega ahí.

Mi propuesta de 5 perks iniciales (uno por dominante). Necesito tu OK o cambios:

| ID | Nombre | Dominante | Efecto mecánico |
|---|---|---|---|
| `perk_golpe_brutal` | Golpe Brutal | FUE | Tu primer ataque del combate suma +1 éxito al pool |
| `perk_pies_ligeros` | Pies Ligeros | DES | +2 a iniciativa permanente |
| `perk_piel_dura` | Piel Dura | CON | +2 HP máx adicionales (sobre la base 8+2·CON) |
| `perk_ojo_clinico` | Ojo Clínico | INT | Identificas rareza y daño base de items sin tooltip especial |
| `perk_temple` | Temple | VOL | Inmune al primer estado de miedo / pánico que recibas en la partida |

- ¿Te valen los 5? `>>>`
- ¿Cambias nombre o efecto de alguno? `>>>`
- ¿Quieres ofrecer al jugador los 5 sin filtro al crear, o solo el de su arquetipo dominante + 1-2 cruzados? `>>>` (recomiendo: **los 5 visibles**, el dominante destacado. Da agencia desde el día 1).

---

## Bloque 5 — Cosas que decido yo (te aviso, no te pregunto)

Para que no se te acumulen las decisiones triviales:

- **IDs de los arquetipos:** `arq_fue`, `arq_des`, `arq_con`, `arq_int`, `arq_vol`. Los nombres visibles los pones tú; los IDs internos los fijo así para que el código sea legible.
- **Orden de las pantallas de creación:** Retrato → Atributos → Habilidades → Perk → Inventario (preview) → Confirmación. Coincide con scope §1.3 y con cómo escala la complejidad cognitiva.
- **Botón "Sorpréndeme" del inventario en H2:** muestra un placeholder ("Generación de inventario aleatorio — disponible en H5"). En H2 el inventario sigue vacío.
- **Preview en pantalla de combate antes de confirmar:** lo dejo como mock estático en H2 (silueta + stats + retrato sobre fondo neutro). El combate real es H3.
- **Persistencia:** el personaje se escribe en Supabase al pulsar "Confirmar". Antes solo vive en estado local.

Si alguna de estas no te convence, dilo y la subo a "decisión tuya".

---

## Deuda técnica conocida (revisar al cerrar las 5 pantallas H2)

- `src/state/h2-defaults.ts` línea 53: `portraitId` por defecto literal `'placeholder'`. Desde el cierre de la pantalla de retrato (v0.10, 27/4/2026) la vista impide pasar al siguiente paso sin elegir uno de los 12 retratos válidos, por lo que `buildCreateInputFromDraft` ya nunca recibe el draft con `portraitId` vacío en runtime. El default literal queda como código defensivo huérfano.
- `src/state/h2-defaults.ts` líneas 13-19: `DEFAULT_ATTRIBUTES = { fue: 3, des: 3, con: 2, int: 2, vol: 2 }`. Desde el cierre de la pantalla de atributos (v0.11, 27/4/2026) la vista exige suma == 12 y rango `[1, 4]` antes de habilitar Continuar, por lo que `buildCreateInputFromDraft` ya nunca recibe `draft.attributes` parcial o ausente en runtime. El bloque `if (draft.attributes)` y los defaults son código defensivo huérfano.
  - **Acción común:** una vez las 5 pantallas H2 estén cerradas y todos los campos del draft lleguen rellenos, eliminar los defaults literales que ya no se ejercitan en runtime y reemplazar por validación dura (`throw` si el draft no está completo al confirmar). No tocar antes, porque las 3 pantallas restantes siguen siendo stubs y los defaults son lo único que mantiene el confirm operativo end-to-end.

---

## Cierre

Cuando me devuelvas este .md relleno:

1. Genero `src/data/archetypes.ts`, `src/data/skills.ts`, `src/data/portraits.ts`, `src/data/perks-initial.ts`.
2. Añado tests sobre cada arquetipo: que su stat-line valida con `validateCreation` (suma 12, ningún atributo > 4 ni < 1).
3. Arrancamos la pantalla 1 de creación (retrato).

Si quieres puedes responder solo el Bloque 2 (habilidades) primero — es el más bloqueante porque el Bloque 1 las referencia.
