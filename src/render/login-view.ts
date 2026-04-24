import { signIn, signUp } from '../backend/auth';

export function renderLoginView(root: HTMLElement): void {
  root.innerHTML = `
    <main class="view login-view">
      <h1>El Teknomoro</h1>
      <form id="auth-form" class="auth-form">
        <label>
          Email
          <input type="email" name="email" required autocomplete="email" />
        </label>
        <label>
          Contraseña
          <input type="password" name="password" required minlength="6" autocomplete="current-password" />
        </label>
        <div class="auth-actions">
          <button type="submit" data-action="login">Entrar</button>
          <button type="button" data-action="signup">Crear cuenta</button>
        </div>
        <p class="auth-error" id="auth-error" role="alert"></p>
      </form>
    </main>
  `;

  const form = root.querySelector<HTMLFormElement>('#auth-form')!;
  const errorEl = root.querySelector<HTMLParagraphElement>('#auth-error')!;
  const signupBtn = root.querySelector<HTMLButtonElement>('[data-action="signup"]')!;

  const readCredentials = () => {
    const data = new FormData(form);
    return {
      email: String(data.get('email') ?? '').trim(),
      password: String(data.get('password') ?? ''),
    };
  };

  const showError = (msg: string) => {
    errorEl.textContent = msg;
  };

  const setBusy = (busy: boolean) => {
    form.querySelectorAll('button').forEach((b) => (b.disabled = busy));
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const { email, password } = readCredentials();
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al entrar');
    } finally {
      setBusy(false);
    }
  });

  signupBtn.addEventListener('click', async () => {
    showError('');
    const { email, password } = readCredentials();
    if (!email || password.length < 6) {
      showError('Email válido y contraseña de al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      await signUp(email, password);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al crear cuenta');
    } finally {
      setBusy(false);
    }
  });
}
