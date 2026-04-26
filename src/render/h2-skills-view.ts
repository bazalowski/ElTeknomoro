import type { H2StepCtx } from '../state/h2-flow';

export function renderH2SkillsView(root: HTMLElement, ctx: H2StepCtx): void {
  root.innerHTML = `
    <main class="view h2-flow__step">
      <button type="button" class="h2-flow__exit" data-action="exit">Salir</button>
      <h1 class="h2-flow__heading">Habilidades</h1>
      <nav class="h2-flow__nav" aria-label="Navegación del flujo">
        <button type="button" class="h2-flow__nav-button" data-action="back">Atrás</button>
        <button type="button" class="h2-flow__nav-button h2-flow__nav-button--primary" data-action="next">Continuar</button>
        <button type="button" class="h2-flow__nav-button" data-action="reset">Reset</button>
      </nav>
    </main>
  `;

  root.querySelector<HTMLButtonElement>('[data-action="exit"]')!.addEventListener('click', () => ctx.exit());
  root.querySelector<HTMLButtonElement>('[data-action="back"]')!.addEventListener('click', () => ctx.goBack());
  root.querySelector<HTMLButtonElement>('[data-action="next"]')!.addEventListener('click', () => ctx.goNext());
  root.querySelector<HTMLButtonElement>('[data-action="reset"]')!.addEventListener('click', () => ctx.reset());
}
