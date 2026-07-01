import { AppStore } from '../store.js';

export function renderFooter() {
  const tExplore = AppStore.t('footerExplore');
  const tSupport = AppStore.t('footerSupport');
  const tAllProducts = AppStore.t('footerAllProducts');
  const tGourmet = AppStore.t('footerGourmet');
  const tDrinks = AppStore.t('footerDrinks');
  const tDesserts = AppStore.t('footerDesserts');
  const tFAQ = AppStore.t('footerFAQ');
  const tCopyright = AppStore.t('footerCopyright');

  return `
    <div class="footer-inner container">
      <div class="footer-top flex align-center justify-between mobile-stack" style="gap: 2rem;">
        <div class="footer-brand-col flex align-center gap-2 mobile-stack" style="align-items: center; gap: 1.5rem;">
          <a href="#/"><img src="assets/images/logo_claro_sin_fondo.png" alt="Brasil Fusión" class="logo-img-footer"></a>
          <a href="https://www.instagram.com/brasilfusion.pe?igsh=MW9xaDJ6anU4ZXdkaQ%3D%3D&utm_source=qr" target="_blank" class="btn btn-secondary-outline btn-sm flex align-center gap-05" style="border-radius: var(--radius-full); padding: 0.5rem 1.2rem; font-size: 0.85rem; font-weight: 600; text-transform: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-color: var(--primary-color); color: var(--primary-color);">
            <img src="assets/images/instagram.png" alt="Instagram" style="width: 18px; height: 18px; object-fit: contain;"> Instagram
          </a>
        </div>
        <div class="footer-nav-col flex gap-3">
          <div class="footer-links">
            <h3>${tExplore}</h3>
            <ul>
              <li><a href="#/catalog">${tAllProducts}</a></li>
              <li><a href="#/catalog?category=Alimentos">${AppStore.state.language === 'es' ? 'Alimentos' : 'Alimentos'}</a></li>
              <li><a href="#/catalog?category=Bebidas">${tDrinks}</a></li>
              <li><a href="#/catalog?category=Sin Gluten">${AppStore.state.language === 'es' ? 'Sin Gluten' : 'Sem Glúten'}</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h3>${tSupport}</h3>
            <ul>
              <li><a href="#/faq">${tFAQ}</a></li>
              <li><a href="#/devoluciones">${AppStore.t('footerReturns')}</a></li>
              <li><a href="https://www.instagram.com/brasilfusion.pe?igsh=MW9xaDJ6anU4ZXdkaQ%3D%3D&utm_source=qr" target="_blank" style="display: inline-flex; align-items: center; gap: 8px;"><img src="assets/images/instagram.png" alt="Instagram" style="width: 16px; height: 16px; object-fit: contain;"> Instagram</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container flex justify-between align-center mobile-stack">
        <p class="copyright">${tCopyright}</p>
        <div class="payment-methods">
          <span class="payment-icon card-icon" title="Visa"><i data-lucide="credit-card"></i> Visa</span>
          <span class="payment-icon card-icon" title="MasterCard"><i data-lucide="credit-card"></i> MasterCard</span>
          <span class="payment-icon mobile-pay" title="Yape"><i data-lucide="smartphone"></i> Yape</span>
          <span class="payment-icon mobile-pay" title="Plin"><i data-lucide="smartphone"></i> Plin</span>
        </div>
      </div>
    </div>
  `;
}

export function initFooter() {
}
