import { AppStore } from '../store.js';
import { firebaseService } from '../services/firebaseService.js';

export async function cartView() {
  const items = AppStore.getCartItems();
  const subtotal = AppStore.getCartSubtotal();
  const total = AppStore.getCartTotal();
  const count = AppStore.getCartCount();
  const language = AppStore.state.language;
  // Check if coupon applied
  const couponDiscount = sessionStorage.getItem('bf_coupon_discount') || 0;
  const discountPercent = parseFloat(couponDiscount);
  const discountAmount = subtotal * discountPercent;
  const taxableBase = subtotal - discountAmount;
  const igv = taxableBase * 0.18;
  const finalTotal = taxableBase + igv;

  const tPageTitle = AppStore.t('cartPageTitle');
  const tEmptyTitle = AppStore.t('cartEmptyTitle');
  const tEmptyPageDesc = AppStore.t('cartEmptyPageDesc');
  const tShopNow = AppStore.t('shopNow');
  
  const tProductHeader = AppStore.t('cartProductHeader');
  const tQuantityHeader = AppStore.t('cartQuantityHeader');
  const tTotalHeader = AppStore.t('cartTotalHeader');
  
  const tContinueShopping = AppStore.t('cartContinueShopping');
  const tClearBtn = AppStore.t('cartClearBtn');
  const tSummaryTitle = AppStore.t('cartSummaryTitle');
  
  const tSubtotal = AppStore.t('cartSubtotalRow');
  const tDiscount = AppStore.t('cartDiscountRow');
  const tShipping = AppStore.t('cartShippingRow');
  const tTotal = AppStore.t('cartTotalRow');
  const tFree = AppStore.t('freeShipping');
  
  const tCouponLabel = AppStore.t('cartCouponLabel');
  const tCouponPlaceholder = AppStore.t('cartCouponPlaceholder');
  const tCouponApply = AppStore.t('cartCouponApply');
  const tCouponRemove = AppStore.t('cartCouponRemove');
  const tCouponSuccess = AppStore.t('cartCouponAppliedSuccess');
  
  const tCheckoutBtn = AppStore.t('cartCheckoutBtn');
  const tSecurityBadge = AppStore.t('cartSecurityBadge');

  const tDeleteLabel = language === 'es' ? 'Eliminar' : 'Remover';
  const tUnitVal = language === 'es' ? 'c/u' : 'cada';

  return `
    <div class="container section">
      <h1 class="page-title" style="margin-bottom: 2rem;">${tPageTitle}</h1>

      ${items.length === 0 ? `
        <div class="cart-empty-state text-center" style="padding: 6rem 1rem;">
          <i data-lucide="shopping-cart" class="empty-icon" style="width: 64px; height: 64px; margin: 0 auto 1.5rem auto; opacity: 0.5;"></i>
          <h2>${tEmptyTitle}</h2>
          <p class="text-muted" style="margin-top: 1rem; max-width: 400px; margin-left: auto; margin-right: auto;">
            ${tEmptyPageDesc}
          </p>
          <a href="#/catalog" class="btn btn-primary btn-lg" style="margin-top: 2rem;">${tShopNow}</a>
        </div>
      ` : `
        <div class="cart-page-layout grid grid-3-cols gap-2 mobile-stack">
          
          <!-- Left: Cart Items (spans 2 columns) -->
          <div class="cart-items-wrapper col-span-2">
            <div class="cart-table-header flex justify-between text-muted text-sm" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; font-weight: 600;">
              <span style="flex: 2;">${tProductHeader}</span>
              <span class="text-center" style="flex: 1;">${tQuantityHeader}</span>
              <span class="text-right" style="flex: 1;">${tTotalHeader}</span>
            </div>

            <div class="cart-page-items-list" style="margin-top: 1rem;">
              ${items.map(item => {
                const productName = item.name[language] || item.name['es'];
                const productCategory = item.category[language] || item.category['es'];

                return `
                  <div class="cart-page-item flex justify-between align-center" data-id="${item.productId}" style="border-bottom: 1px solid var(--border-color); padding: 1.5rem 0;">
                    <!-- Product details -->
                    <div class="flex align-center gap-1" style="flex: 2;">
                      <img src="${item.image}" alt="${productName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                      <div>
                        <span class="text-sm text-muted">${productCategory}</span>
                        <h3 style="font-size: 1.1rem; margin-top: 0.25rem;"><a href="#/product/${item.productId}" class="text-dark">${productName}</a></h3>
                        <span class="text-sm text-muted">S/. ${Number(item.price).toFixed(2)} ${tUnitVal}</span>
                      </div>
                    </div>

                    <!-- Quantity selector -->
                    <div class="flex justify-center" style="flex: 1;">
                      <div class="quantity-selector-sm">
                        <button class="qty-btn-minus" data-id="${item.productId}">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn-plus" data-id="${item.productId}">+</button>
                      </div>
                    </div>

                    <!-- Subtotal and delete -->
                    <div class="text-right flex flex-col align-end justify-between" style="flex: 1; height: 80px;">
                      <span class="font-semibold" style="font-size: 1.1rem;">S/. ${(Number(item.price) * item.quantity).toFixed(2)}</span>
                      <button class="cart-page-item-delete flex align-center gap-05 text-danger btn-link text-sm" data-id="${item.productId}">
                        <i data-lucide="trash-2" style="width: 14px;"></i> ${tDeleteLabel}
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            
            <div class="flex justify-between" style="margin-top: 1.5rem;">
              <a href="#/catalog" class="btn btn-secondary-outline flex align-center gap-05">
                <i data-lucide="arrow-left"></i> ${tContinueShopping}
              </a>
              <button id="clear-cart-page-btn" class="btn btn-secondary flex align-center gap-05">
                <i data-lucide="rotate-ccw"></i> ${tClearBtn}
              </button>
            </div>
          </div>

          <!-- Right: Order Summary -->
          <aside class="order-summary-sidebar bg-surface" style="padding: 2rem; border-radius: 16px; height: fit-content;">
            <h3 style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">${tSummaryTitle}</h3>
            
            <div class="price-row flex justify-between text-muted" style="margin-bottom: 1rem;">
              <span>${tSubtotal}</span>
              <span>S/. ${subtotal.toFixed(2)}</span>
            </div>

            <!-- Coupon discount -->
            ${discountPercent > 0 ? `
              <div class="price-row flex justify-between text-success" style="margin-bottom: 1rem;">
                <span>${tDiscount} (${discountPercent * 100}%)</span>
                <span>- S/. ${discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="price-row flex justify-between text-muted" style="margin-bottom: 1rem;">
              <span>${AppStore.t('cartTaxRow')}</span>
              <span>S/. ${igv.toFixed(2)}</span>
            </div>

            <div class="price-row flex justify-between text-muted" style="margin-bottom: 1rem;">
              <span>${tShipping}</span>
              <span style="font-size: 0.9rem; color: var(--text-muted);">${language === 'es' ? 'Calculado al pagar' : 'Calculado no checkout'}</span>
            </div>

            <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid var(--border-color);">

            <div class="price-row total-row flex justify-between font-bold" style="font-size: 1.25rem; margin-bottom: 2rem; color: var(--primary-color);">
              <span>${tTotal}</span>
              <span id="cart-page-total-val">S/. ${finalTotal.toFixed(2)}</span>
            </div>

            <!-- Coupon Code Field -->
            <div class="coupon-box" style="margin-bottom: 2rem;">
              <label for="coupon-input" class="text-sm text-muted block" style="margin-bottom: 0.5rem; font-weight: 500;">${tCouponLabel}</label>
              <div class="flex gap-05">
                <input type="text" id="coupon-input" placeholder="${tCouponPlaceholder}" style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.875rem;" ${discountPercent > 0 ? 'disabled' : ''}>
                ${discountPercent > 0 ? `
                  <button id="coupon-remove-btn" class="btn btn-secondary btn-sm">${tCouponRemove}</button>
                ` : `
                  <button id="coupon-apply-btn" class="btn btn-secondary btn-sm">${tCouponApply}</button>
                `}
              </div>
              <span id="coupon-message" class="text-sm text-success font-semibold" style="margin-top: 0.5rem; display: block;">
                ${discountPercent > 0 ? tCouponSuccess : ''}
              </span>
            </div>

            <a href="#/checkout" class="btn btn-primary w-full text-center flex align-center justify-center gap-05 py-1" style="font-size: 1.1rem;">
              ${tCheckoutBtn} <i data-lucide="credit-card"></i>
            </a>

            <div class="security-badge flex align-center justify-center gap-05 text-xs text-muted" style="margin-top: 1.5rem;">
              <i data-lucide="shield-check" class="text-success" style="width: 16px;"></i> ${tSecurityBadge}
            </div>
          </aside>

        </div>
      `}
    </div>
  `;
}

cartView.init = function() {
  const pageContainer = document.getElementById('app');
  if (!pageContainer) return;

  pageContainer.querySelectorAll('.qty-btn-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const item = AppStore.getCartItems().find(i => i.productId === id);
      if (item) {
        AppStore.updateCartQuantity(id, item.quantity - 1);
        reRenderView();
      }
    });
  });

  pageContainer.querySelectorAll('.qty-btn-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const item = AppStore.getCartItems().find(i => i.productId === id);
      if (item) {
        AppStore.updateCartQuantity(id, item.quantity + 1);
        reRenderView();
      }
    });
  });

  pageContainer.querySelectorAll('.cart-page-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.closest('.cart-page-item-delete');
      const id = target.getAttribute('data-id');
      AppStore.removeFromCart(id);
      reRenderView();
    });
  });

  const clearBtn = document.getElementById('clear-cart-page-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      AppStore.clearCart();
      reRenderView();
    });
  }

  const couponInput = document.getElementById('coupon-input');
  const applyBtn = document.getElementById('coupon-apply-btn');
  const removeBtn = document.getElementById('coupon-remove-btn');
  const couponMsg = document.getElementById('coupon-message');

  if (applyBtn && couponInput && couponMsg) {
    applyBtn.addEventListener('click', async () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === '') {
        AppStore.showToast(AppStore.t('toastCouponRequired'), "info");
        return;
      }
      try {
        const config = await firebaseService.fetchGeneralConfig();
        const coupon = config?.coupon || {};
        if (coupon.active && coupon.code && coupon.code.toUpperCase() === code) {
          const discountDecimal = (coupon.discount || 0) / 100;
          sessionStorage.setItem('bf_coupon_discount', discountDecimal.toString());
          AppStore.showToast(AppStore.t('toastCouponApplied'), "success");
          reRenderView();
        } else {
          AppStore.showToast(AppStore.t('toastCouponInvalid'), "error");
          couponMsg.textContent = AppStore.t('toastCouponInvalid');
          couponMsg.className = "text-sm text-danger font-semibold";
        }
      } catch (err) {
        AppStore.showToast(AppStore.t('toastCouponInvalid'), "error");
      }
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      sessionStorage.removeItem('bf_coupon_discount');
      AppStore.showToast(AppStore.t('toastCouponRemoved'), "info");
      reRenderView();
    });
  }

  async function reRenderView() {
    pageContainer.innerHTML = await cartView();
    cartView.init();
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { class: 'lucide-icon' }
      });
    }
  }
};
