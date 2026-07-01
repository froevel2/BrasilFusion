import { AppStore } from '../store.js';
 
export async function authView(params) {
  const isForgotPassword = window.location.hash.includes('/forgot-password');
  const isLogin = !window.location.hash.includes('/register') && !isForgotPassword;

  const tTitle = isForgotPassword 
    ? (AppStore.state.language === 'es' ? 'Recuperar Contraseña' : 'Recuperar Senha')
    : (isLogin ? AppStore.t('authLoginTitle') : AppStore.t('authRegisterTitle'));

  const tDesc = isForgotPassword
    ? (AppStore.state.language === 'es' ? 'Ingresa tu correo electrónico para recibir un enlace de recuperación.' : 'Digite seu e-mail para receber um link de recuperação.')
    : (isLogin ? AppStore.t('authLoginDesc') : AppStore.t('authRegisterDesc'));

  const tNameLabel = AppStore.t('checkoutFullName');
  const tEmailLabel = AppStore.t('checkoutEmail');
  const tPasswordLabel = AppStore.state.language === 'es' ? 'Contraseña' : 'Senha';
  
  const tRemember = AppStore.t('authRememberMe');
  const tForgot = AppStore.t('authForgotPassword');
  const tTerms = AppStore.t('authAcceptTerms');
  
  const tSubmit = isForgotPassword
    ? (AppStore.state.language === 'es' ? 'Enviar Enlace' : 'Enviar Link')
    : (isLogin ? AppStore.t('authLoginTitle') : AppStore.t('authRegisterTitle'));
  
  const tNoAccount = AppStore.t('authNoAccount');
  const tRegisterHere = AppStore.t('authRegisterHere');
  const tHaveAccount = AppStore.t('authHaveAccount');
  const tLoginHere = AppStore.t('authLoginHere');
  const tBackToLogin = AppStore.state.language === 'es' ? 'Volver a Iniciar Sesión' : 'Voltar para o login';

  let formContent = '';
  let footerContent = '';

  if (isForgotPassword) {
    formContent = `
      <div class="form-group">
        <label for="auth-email">${tEmailLabel}</label>
        <input type="email" id="auth-email" placeholder="carlos@example.com" required>
      </div>

      <button type="submit" id="auth-submit-btn" class="btn btn-primary w-full" style="margin-top: 1.5rem; padding: 0.85rem;">
        ${tSubmit}
      </button>
    `;

    footerContent = `
      <div class="text-center text-sm">
        <a href="#/login" class="font-semibold" style="color: var(--primary-color);">${tBackToLogin}</a>
      </div>
    `;
  } else {
    formContent = `
      ${!isLogin ? `
        <div class="form-group">
          <label for="auth-name">${tNameLabel}</label>
          <input type="text" id="auth-name" placeholder="Ej. Carlos Mendoza" required>
        </div>
      ` : ''}

      <div class="form-group">
        <label for="auth-email">${tEmailLabel}</label>
        <input type="email" id="auth-email" placeholder="carlos@example.com" required value="${isLogin ? 'carlos@brasilfusion.pe' : ''}">
      </div>

      <div class="form-group">
        <label for="auth-password">${tPasswordLabel}</label>
        <div style="position: relative;">
          <input type="password" id="auth-password" placeholder="••••••••" required minlength="6" value="${isLogin ? 'contraseña123' : ''}" style="width: 100%; padding-right: 2.5rem;">
          <button type="button" id="password-toggle-btn" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted);" aria-label="Mostrar senha">
            <i data-lucide="eye" style="width: 18px;"></i>
          </button>
        </div>
      </div>

      ${isLogin ? `
        <div class="flex justify-between align-center" style="font-size: 0.875rem;">
          <label class="flex align-center gap-05" style="cursor: pointer;">
            <input type="checkbox" id="auth-remember">
            <span>${tRemember}</span>
          </label>
          <a href="#/forgot-password" class="btn-link text-sm">${tForgot}</a>
        </div>
      ` : `
        <div class="form-group" style="font-size: 0.875rem;">
          <label class="flex align-start gap-05" style="cursor: pointer; line-height: 1.4;">
            <input type="checkbox" required>
            <span>${tTerms}</span>
          </label>
        </div>
      `}

      <button type="submit" id="auth-submit-btn" class="btn btn-primary w-full" style="margin-top: 1.5rem; padding: 0.85rem;">
        ${tSubmit}
      </button>

      <div class="flex align-center gap-05 justify-center" style="margin: 1rem 0; color: var(--text-muted); font-size: 0.85rem;">
        <hr style="flex: 1; border: 0; border-top: 1px solid var(--border-color); margin: 0;">
        <span>${AppStore.state.language === 'es' ? 'O continúa con' : 'Ou continue com'}</span>
        <hr style="flex: 1; border: 0; border-top: 1px solid var(--border-color); margin: 0;">
      </div>

      <button type="button" id="google-auth-btn" class="btn btn-secondary-outline w-full flex align-center justify-center gap-05" style="padding: 0.85rem; border-color: var(--border-color); font-weight: 500; font-size: 0.9rem;">
        <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        Google
      </button>
    `;

    footerContent = `
      <div class="text-center text-sm">
        ${isLogin ? `
          <span>${tNoAccount} </span>
          <a href="#/register" class="font-semibold" style="color: var(--primary-color);">${tRegisterHere}</a>
        ` : `
          <span>${tHaveAccount} </span>
          <a href="#/login" class="font-semibold" style="color: var(--primary-color);">${tLoginHere}</a>
        `}
      </div>
    `;
  }

  return `
    <div class="container section flex justify-center align-center" style="min-height: 70vh;">
      <div class="auth-card bg-surface fade-in" style="width: 100%; max-width: 480px; padding: 2.5rem; border-radius: 16px; box-shadow: var(--shadow-md); border: 1px solid var(--border-color);">
        
        <div class="text-center" style="margin-bottom: 2rem;">
          <a href="#/" style="display: inline-block; margin-bottom: 1.25rem;">
            <img src="assets/images/logo_claro_sin_fondo.png" alt="Brasil Fusión" class="auth-logo" style="height: 90px; width: auto; max-width: 100%; object-fit: contain; margin-bottom: 0.5rem;">
          </a>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: var(--primary-color); margin-top: 0.25rem;">${tTitle}</h1>
          <p class="text-muted" style="margin-top: 0.5rem;">${tDesc}</p>
        </div>

        <form id="auth-form" class="flex flex-col gap-1">
          ${formContent}
        </form>

        <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border-color);">

        ${footerContent}

      </div>
    </div>
  `;
}

authView.init = function(params) {
  const form = document.getElementById('auth-form');
  const passwordInput = document.getElementById('auth-password');
  const passwordToggle = document.getElementById('password-toggle-btn');
  
  const nameInput = document.getElementById('auth-name');
  const isForgotPassword = window.location.hash.includes('/forgot-password');
  const isLogin = !nameInput && !isForgotPassword;

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      const icon = type === 'password' ? 'eye' : 'eye-off';
      passwordToggle.innerHTML = `<i data-lucide="${icon}" style="width: 18px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('auth-email').value;
      
      let success = false;
      if (isForgotPassword) {
        success = await AppStore.sendPasswordReset(email);
        if (success) {
          window.location.hash = '#/login';
        }
        return;
      }

      const password = passwordInput.value;
      if (isLogin) {
        success = await AppStore.login(email, password);
      } else {
        const name = nameInput.value;
        success = await AppStore.register(name, email, password);
      }

      if (success) {
        const role = AppStore.state.currentUser?.role;
        window.location.hash = role === 'admin' ? '#/admin' : '#/profile';
      }
    });
  }

  const googleBtn = document.getElementById('google-auth-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const success = await AppStore.loginWithGoogle();
      if (success) {
        const role = AppStore.state.currentUser?.role;
        window.location.hash = role === 'admin' ? '#/admin' : '#/profile';
      }
    });
  }
};
