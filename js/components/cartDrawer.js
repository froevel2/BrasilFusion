import { AppStore } from '../store.js';

const formatPrice = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
};

export function renderCartDrawer() {
  const items = AppStore.getCartItems().map(item => ({
    ...item,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0
  }));
  const subtotal = Number(AppStore.getCartSubtotal()) || 0;
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  const count = AppStore.getCartCount();
  const language = AppStore.state.language;

  const tCartTitle = AppStore.t('cartTitle', { count: count });
  const tSubtotal = AppStore.t('cartSubtotalRow');
  const tShipping = AppStore.t('cartShippingRow');
  const tTotal = AppStore.t('cartTotalRow');
  const tFree = AppStore.t('freeShipping');
  const tViewCart = AppStore.t('cartFullViewBtn');
  const tCheckout = AppStore.t('cartCheckoutBtn');
  const tShopNow = AppStore.t('shopNow');
  const tEmptyTitle = AppStore.t('cartEmptyTitle');
  const tEmptyDesc = AppStore.t('cartEmptyDesc');

  return `
    <div id="cart-drawer-backdrop" class="cart-drawer-backdrop"></div>
    <div class="cart-drawer-content">
      <!-- Header -->
      <div class="cart-drawer-header">
        <h3>${tCartTitle}</h3>
        <button id="cart-drawer-close" class="cart-drawer-close-btn">&times;</button>
      </div>

      <!-- Body -->
      <div class="cart-drawer-body">
        ${items.length === 0 ? `
          <div class="cart-empty-state">
            <i data-lucide="shopping-bag" class="empty-icon"></i>
            <h4>${tEmptyTitle}</h4>
            <p>${tEmptyDesc}</p>
            <a href="#/catalog" id="cart-drawer-shop-btn" class="btn btn-primary">${tShopNow}</a>
          </div>
        ` : `
          <div class="cart-items-list">
            ${items.map(item => {
              const productName = item.name[language] || item.name['es'] || item.name;
              const categoryName = item.category[language] || item.category['es'] || item.category;
              const quantity = Number(item.quantity) || 0;
              
              return `
                <div class="cart-item" data-id="${item.productId}">
                  <img src="${item.image}" alt="${productName}" class="cart-item-img">
                  <div class="cart-item-info">
                    <span class="cart-item-cat">${categoryName}</span>
                    <a href="#/product/${item.productId}" class="cart-item-name">${productName}</a>
                    <div class="cart-item-pricing">
                      <span class="cart-item-price">S/. ${formatPrice(item.price)}</span>
                    </div>
                    
                    <div class="cart-item-controls">
                      <div class="quantity-selector-sm">
                        <button class="qty-btn-minus" data-id="${item.productId}">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn-plus" data-id="${item.productId}">+</button>
                      </div>
                      <button class="cart-item-delete" data-id="${item.productId}" aria-label="Eliminar">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Footer -->
      ${items.length > 0 ? `
        <div class="cart-drawer-footer">
          <div class="price-row">
            <span>${tSubtotal}</span>
            <span>S/. ${formatPrice(subtotal)}</span>
          </div>
          <div class="price-row">
            <span>${AppStore.t('cartTaxRow')}</span>
            <span>S/. ${formatPrice(igv)}</span>
          </div>
          <div class="price-row">
            <span>${tShipping}</span>
            <span style="font-size: 0.9rem; color: var(--text-muted);">${language === 'es' ? 'Calculado al pagar' : 'Calculado no checkout'}</span>
          </div>
          <div class="price-row total-row">
            <span>${tTotal}</span>
            <span>S/. ${formatPrice(total)}</span>
          </div>
          <div class="cart-drawer-actions">
            <a href="#/cart" id="cart-drawer-view-cart" class="btn btn-secondary w-full text-center">${tViewCart}</a>
            <a href="#/checkout" id="cart-drawer-checkout" class="btn btn-primary w-full text-center" style="margin-top: 0.5rem;">${tCheckout}</a>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function initCartDrawer() {
  const cartDrawer = document.getElementById('cart-drawer');
  if (!cartDrawer) return;

  // Render content
  cartDrawer.innerHTML = renderCartDrawer();
  
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: 'lucide-icon' }
    });
  }

  // Bind close buttons
  const closeBtn = document.getElementById('cart-drawer-close');
  const backdrop = document.getElementById('cart-drawer-backdrop');
  const shopBtn = document.getElementById('cart-drawer-shop-btn');
  const viewCartBtn = document.getElementById('cart-drawer-view-cart');
  const checkoutBtn = document.getElementById('cart-drawer-checkout');

  const closeDrawer = () => {
    cartDrawer.classList.remove('active');
    document.body.classList.remove('no-scroll');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  if (shopBtn) shopBtn.addEventListener('click', closeDrawer);
  if (viewCartBtn) viewCartBtn.addEventListener('click', closeDrawer);
  if (checkoutBtn) checkoutBtn.addEventListener('click', closeDrawer);

  // Bind quantity change and delete events
  cartDrawer.querySelectorAll('.qty-btn-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const item = AppStore.getCartItems().find(i => i.productId === id);
      if (item) {
        AppStore.updateCartQuantity(id, item.quantity - 1);
      }
    });
  });

  cartDrawer.querySelectorAll('.qty-btn-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const item = AppStore.getCartItems().find(i => i.productId === id);
      if (item) {
        AppStore.updateCartQuantity(id, item.quantity + 1);
      }
    });
  });

  cartDrawer.querySelectorAll('.cart-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.closest('.cart-item-delete');
      const id = target.getAttribute('data-id');
      AppStore.removeFromCart(id);
    });
  });
}

// Global subscription to rebuild drawer when cart changes
AppStore.subscribe('cart', () => {
  initCartDrawer();
});
