# El Teknomoro

RPG de mundo abierto que se construye en tres fases: **navegador** (TypeScript + Canvas vanilla) → **motor** (Godot 4). La fase de mesa quedó fuera del proceso activo en v0.4 de la biblia.

Repositorio activo del autor (Bazalo). Trabajo en solitario con dirección técnica externa.

---

## Estado actual

- **H0 cerrado.** Repositorio Vite + TypeScript + Canvas, login Supabase end-to-end, Vercel con deploy automático por push a `main`.
- **H1 cerrado.** Motor de reglas núcleo: dados, personaje, exploración, progresión. Todo puro y determinista. 118 tests verdes.
- **H2 siguiente.** Creación de personaje en UI sobre los módulos de H1.

Para el detalle vivo de qué entra en el MVP, en qué orden y qué bloqueantes quedan: [`scope-mvp-web-v0.1.md`](./scope-mvp-web-v0.1.md).

Para las decisiones de reglamento (atributos, dado de combate, exploración, progresión, …): [`biblia-del-juego.md`](./biblia-del-juego.md). Sección §5 lista las 40 decisiones cerradas, §6 los bloqueantes abiertos, §9 el historial de versiones.

---

## Cómo se lee este repositorio

```
biblia-del-juego.md       Reglamento autoritativo. Cualquier número del juego nace aquí.
scope-mvp-web-v0.1.md     Qué entra/no entra en v1, hitos H0..H9, bloqueantes externos.
proceso-director.md       Cómo trabajamos Bazalo + dirección técnica. Incluye pipeline UI.
PRODUCT.md                Marca, register, anti-references, principios. Fuente de marca.
DESIGN.md                 Paleta OKLCH, tipografía, contrastes. Sistema visual provisional.

simulaciones/             Documentos de cierre de bloqueantes numéricos.
  dado-combate-v0.2.md    Cierre del dado de combate (decisión #36).
  progresion-v0.1.md      Cierre del subsistema de progresión (#37-#40).
  *.mjs                   Scripts deterministas con seed fija. Reproducibles.

src/
  rules/                  MÓDULO SAGRADO. Puro, determinista, sin DOM/Canvas/Supabase.
                          Cualquier regla del juego vive aquí o no vive.
    dice.ts               rollD20 (exploración) + rollCombatPool (combate).
    character.ts          Modelo autoritativo, validación de creación, derivados.
    exploration.ts        Tirada raíz + tirada reactiva con cascada.
    progression.ts        XP, nivel, cadencia de puntos, uso de habilidad.
  render/                 Canvas. Lee state, no muta reglas.
  state/                  Estado de la sesión activa.
  backend/                Capa Supabase aislada. Si hay que migrar, se cambia esta carpeta.
  dev/                    Modo Privado (H8): Banco, Campo de pruebas, simulación masiva.
  data/                   Catálogos JSON. exploration/ por bioma.
```

---

## Comandos

```bash
npm install              # Instalación inicial
npm run dev              # Servidor local con HMR
npm run build            # Build de producción
npx vitest run           # Suite de tests
npx tsc --noEmit         # Verificación de tipos sin emitir
node simulaciones/<x>.mjs   # Reproduce cualquier simulación documentada
```

---

## Despliegue

Cualquier push a `main` dispara deploy automático en Vercel. La rama `main` representa siempre el estado canónico desplegable: si entra algo aquí, en cuestión de minutos está en producción.

---

## Decisiones cerradas que NO se reabren

(Salvo que Bazalo las cuestione explícitamente.)

1. Fases: navegador → motor. Mesa fuera del proceso activo.
2. Stack navegador: TypeScript + Canvas vanilla. Sin frameworks.
3. Backend: Supabase (login + persistencia autoritativa).
4. Arquitectura: `rules/` aislado del render. Determinismo como invariante.
5. Motor futuro: Godot 4 sobre Unity.
6. Nombre: El Teknomoro. "Mundos Fracturados" deprecated.

Las 40 decisiones cerradas viven en biblia §5. Las que aparecen aquí son las arquitectónicas.
