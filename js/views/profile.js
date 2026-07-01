import { AppStore } from '../store.js';

export async function profileView() {
  const currentUser = AppStore.state.currentUser;

  if (!currentUser) {
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 50);
    return `
      <div class="container section text-center" style="padding: 6rem 1rem;">
        <div class="payment-spinner" style="margin: 0 auto 1.5rem auto;"></div>
        <p class="text-muted">${AppStore.t('profileRedirecting')}</p>
      </div>
    `;
  }

  const orderCount = AppStore.state.orders.length;
  
  const tTitle = AppStore.t('profileTitle');
  const tOrdersStat = AppStore.t('profileOrdersStat');
  
  const tNameLabel = AppStore.t('profileNameLabel');
  const tEmailLabel = AppStore.t('profileEmailLabel');
  const tPhoneLabel = AppStore.t('profilePhoneLabel');
  const tAddressLabel = AppStore.t('profileAddressLabel');
  const tSubmitBtn = AppStore.t('profileSubmitBtn');
  const tLogout = AppStore.t('navLogout');

  return `
    <div class="container section">
      <div class="profile-layout grid grid-3-cols gap-2 mobile-stack">
        
        <!-- Left: Profile Sidebar Card (1 col) -->
        <aside class="profile-sidebar bg-surface" style="padding: 2rem; border-radius: 16px; height: fit-content; text-align: center; border: 1px solid var(--border-color);">
          <div class="user-avatar-icon" style="width: 80px; height: 80px; border-radius: 50%; background: rgba(15, 76, 58, 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
            <i data-lucide="user" style="width: 40px; height: 40px;"></i>
          </div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${currentUser.name}</h2>
          <p class="text-muted text-sm" style="margin-bottom: 1.5rem;">${currentUser.email}</p>
          
          <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid var(--border-color);">
          
          <div class="profile-stats flex justify-center text-center" style="margin-bottom: 1.5rem;">
            <div>
              <span class="font-bold text-lg" style="color: var(--primary-color);">${orderCount}</span>
              <p class="text-xs text-muted">${tOrdersStat}</p>
            </div>
          </div>

          <button id="profile-logout-btn" class="btn btn-secondary w-full flex align-center justify-center gap-05">
            <i data-lucide="log-out"></i> ${tLogout}
          </button>
        </aside>

        <!-- Right: Profile Info Form (2 cols) -->
        <main class="profile-main col-span-2 bg-surface" style="padding: 2.5rem; border-radius: 16px; border: 1px solid var(--border-color);">
          <h2 style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">${tTitle}</h2>
          
          <form id="profile-edit-form" class="checkout-form-grid">
            <div class="form-group col-span-2">
              <label for="profile-name">${tNameLabel}</label>
              <input type="text" id="profile-name" value="${currentUser.name}" required>
            </div>

            <div class="form-group">
              <label for="profile-email">${tEmailLabel}</label>
              <input type="email" id="profile-email" value="${currentUser.email}" disabled style="background: var(--bg-color); cursor: not-allowed;">
            </div>

            <div class="form-group">
              <label for="profile-phone">${tPhoneLabel}</label>
              <input type="tel" id="profile-phone" value="${currentUser.phone || ''}" placeholder="Ej. 987654321">
            </div>

            <div class="form-group col-span-2">
              <label for="profile-address">${tAddressLabel}</label>
              <input type="text" id="profile-address" value="${currentUser.address || ''}" placeholder="Av. Larco 456, Dpto 302, Miraflores">
            </div>

            <div class="col-span-2 flex justify-end" style="margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary px-2">${tSubmitBtn}</button>
            </div>
          </form>
        </main>

      </div>
    </div>
  `;
}

profileView.init = function() {
  const logoutBtn = document.getElementById('profile-logout-btn');
  const editForm = document.getElementById('profile-edit-form');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AppStore.logout();
      window.location.hash = '#/';
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('profile-name').value;
      const phone = document.getElementById('profile-phone').value;
      const address = document.getElementById('profile-address').value;

      await AppStore.updateProfile({
        name,
        phone,
        address
      });
    });
  }
};
