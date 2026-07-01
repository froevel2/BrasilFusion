import { AppStore } from '../store.js';

export async function productView(params) {
  const id = params.id;
  const product = AppStore.state.products.find(p => p.id === id);
  const language = AppStore.state.language;

  if (!product) {
    return `
      <div class="container section text-center" style="padding: 6rem 1rem;">
        <i data-lucide="alert-circle" class="empty-icon" style="width: 48px; height: 48px; margin: 0 auto 1.5rem auto; color: var(--danger-color);"></i>
        <h2>${AppStore.t('notFoundAlertTitle')}</h2>
        <p class="text-muted" style="margin-top: 1rem;">${AppStore.t('notFoundAlertDesc')}</p>
        <a href="#/catalog" class="btn btn-primary" style="margin-top: 2rem;">${AppStore.t('notFoundBtnCatalog')}</a>
      </div>
    `;
  }

  const productName = product.name[language] || product.name['es'];
  const productCategory = product.category[language] || product.category['es'];
  const productDescription = product.description[language] || product.description['es'];
  const productIngredients = product.ingredients[language] || product.ingredients['es'];

  // Related products
  let related = AppStore.state.products
    .filter(p => p.id !== product.id && p.category['es'] === product.category['es'])
    .slice(0, 4);
    
  if (related.length < 4) {
    const additional = AppStore.state.products
      .filter(p => p.id !== product.id && p.category['es'] !== product.category['es'])
      .slice(0, 4 - related.length);
    related = [...related, ...additional];
  }

  // Stock indicator styles
  const stockPercent = Math.min(100, (product.stock / 50) * 100);
  let stockClass = 'stock-good';
  let stockMessage = AppStore.t('stockRemaining', { stock: product.stock });
  
  if (product.stock === 0) {
    stockClass = 'stock-out';
    stockMessage = AppStore.t('stockOutText');
  } else if (product.stock <= 10) {
    stockClass = 'stock-low';
    stockMessage = AppStore.t('stockLowText', { stock: product.stock });
  }

  // Formatting date
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateLocale = language === 'es' ? 'es-PE' : 'pt-BR';
  const formattedDate = new Date(product.expiryDate).toLocaleDateString(dateLocale, dateOptions);

  const tConsumeBefore = AppStore.t('consumeBefore');
  const tWeight = AppStore.t('weightLabel');
  const tIngredients = AppStore.t('ingredientsLabel');
  const tTax = AppStore.t('taxIncluded');
  const tRelatedHeading = language === 'es' ? 'También podría interesarte' : 'Você também pode gostar';
  const tStockWarning = AppStore.t('stockRunningOut');
  const tOutOfStock = AppStore.t('outOfStock');
  const tStockLowPrefix = AppStore.t('lowStock');
  const tViewDetail = AppStore.t('viewDetails');

  return `
    <div class="container section">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs text-sm text-muted" style="margin-bottom: 2rem;">
        <a href="#/">Home</a> &gt; 
        <a href="#/catalog">${AppStore.t('navCatalog')}</a> &gt; 
        <a href="#/catalog?category=${product.category['es']}">${productCategory}</a> &gt; 
        <span class="text-dark">${productName}</span>
      </nav>

      <!-- Product Main Grid -->
      <div class="grid grid-2 gap-3 mobile-stack">
        
        <!-- Left Column: Product Image Gallery -->
        <div class="product-gallery">
          <div class="main-image-wrapper">
            <img src="${product.image}" id="product-main-img" alt="${productName}" class="main-image" style="border-radius: var(--radius-lg); width: 100%; height: 400px; object-fit: contain; background: #faf8f5; padding: 1.5rem; box-shadow: var(--shadow-md);">
            ${product.stock === 0 ? `<div class="badge-out-of-stock">${tOutOfStock}</div>` : ''}
          </div>
          ${product.images && product.images.length > 1 ? `
            <div class="gallery-thumbnails flex gap-1" style="margin-top: 1rem; flex-wrap: wrap;">
              ${product.images.map((imgUrl, idx) => `
                <div class="thumbnail ${idx === 0 ? 'active' : ''}" data-src="${imgUrl}" style="width: 80px; height: 80px; border-radius: var(--radius-sm); overflow: hidden; border: 2px solid ${idx === 0 ? 'var(--primary-color)' : 'transparent'}; cursor: pointer; transition: all var(--transition-fast);">
                  <img src="${imgUrl}" alt="Vista ${idx + 1}" style="width: 100%; height: 100%; object-fit: contain; background: #faf8f5; padding: 0.25rem;">
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Right Column: Product Info -->
        <div class="product-details-info flex flex-col justify-between">
          <div>
            <span class="badge category-badge">${productCategory}</span>
            <h1 class="product-title-large" style="margin-top: 0.5rem; line-height: 1.2;">${productName}</h1>
            
            <!-- Rating & Reviews -->
            <div class="product-rating flex align-center gap-05" style="margin-top: 1rem;">
              <div class="stars flex">
                ${Array.from({ length: 5 }).map((_, i) => `
                  <i data-lucide="star" class="${i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}"></i>
                `).join('')}
              </div>
              <span class="rating-val" style="font-weight: 600;">${product.rating.toFixed(1)}</span>
              <span class="text-muted">| ${product.reviewsCount} ${language === 'es' ? 'opiniones de clientes' : 'avaliações de clientes'}</span>
            </div>

            <!-- Price -->
            <div class="product-pricing" style="margin-top: 1.5rem; display: flex; align-items: baseline; gap: 1rem;">
              ${product.salePrice && product.salePrice > 0 && product.salePrice < product.price
                ? `<span class="product-price-original" style="text-decoration: line-through; color: var(--text-muted); font-size: 1.2rem;">S/. ${product.price.toFixed(2)}</span>
                   <span class="product-price-large" style="color: var(--danger-color); font-size: 2.2rem; font-weight: 800;">S/. ${product.salePrice.toFixed(2)}</span>`
                : `<span class="product-price-large" style="font-size: 2.2rem; font-weight: 800;">S/. ${product.price.toFixed(2)}</span>`
              }
              <span class="price-tax text-sm text-muted">${tTax}</span>
            </div>

            <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid var(--border-color);">

            <!-- Description -->
            <p class="product-description">${productDescription}</p>

            <!-- Metadata -->
            <div class="product-metadata-box bg-surface" style="margin-top: 1.5rem; padding: 1.25rem; border-radius: 12px;">
              <div class="meta-row flex align-center gap-1 text-sm" style="margin-bottom: 0.5rem;">
                <i data-lucide="calendar" class="text-muted" style="width: 18px;"></i>
                <span>${tConsumeBefore} <strong>${formattedDate}</strong></span>
              </div>
              ${product.weight ? `
                <div class="meta-row flex align-center gap-1 text-sm" style="margin-bottom: 0.5rem;">
                  <i data-lucide="weight" class="text-muted" style="width: 18px;"></i>
                  <span>${tWeight} <strong>${product.weight}</strong></span>
                </div>
              ` : ''}
              ${productIngredients ? `
                <div class="meta-row flex align-start gap-1 text-sm">
                  <i data-lucide="leaf" class="text-muted" style="width: 18px; margin-top: 2px;"></i>
                  <span>${tIngredients} <span class="text-muted">${productIngredients}</span></span>
                </div>
              ` : ''}
            </div>

            <!-- Stock Progress Bar -->
            <div class="stock-indicator-container" style="margin-top: 1.5rem;">
              <div class="stock-status-text flex justify-between text-sm" style="margin-bottom: 0.5rem;">
                <span class="${stockClass}">${stockMessage}</span>
                ${product.stock > 0 && product.stock <= 10 ? `<span class="text-danger font-semibold">${tStockWarning}</span>` : ''}
              </div>
              ${product.stock > 0 ? `
                <div class="stock-progress-bar">
                  <div class="stock-progress-fill ${stockClass}" style="width: ${stockPercent}%"></div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Add to Cart Actions -->
          <div class="product-actions-block" style="margin-top: 2rem;">
            ${product.stock > 0 ? `
              <div class="flex gap-1 align-center mobile-stack">
                <div class="quantity-selector-lg">
                  <button id="qty-decrement-btn" class="qty-btn-lg">-</button>
                  <input type="number" id="product-qty-input" value="1" min="1" max="${product.stock}">
                  <button id="qty-increment-btn" class="qty-btn-lg">+</button>
                </div>
                <button id="add-to-cart-btn" class="btn btn-primary btn-lg flex-1 flex align-center justify-center gap-05">
                  <i data-lucide="shopping-bag"></i> ${AppStore.t('quickAdd')}
                </button>
              </div>
            ` : `
              <button class="btn btn-secondary btn-lg w-full flex align-center justify-center gap-05 btn-disabled" disabled>
                <i data-lucide="slash"></i> ${tOutOfStock}
              </button>
            `}
          </div>
        </div>
      </div>

      <div class="related-products-section section" style="margin-top: 6rem; border-top: 1px solid var(--border-color); padding-top: 4rem;">
        <h2 class="text-center" style="margin-bottom: 3rem;">${tRelatedHeading}</h2>
        
        <div class="grid grid-4 gap-2">
          ${related.map(p => {
            const relName = p.name[language] || p.name['es'];
            const relCat = p.category[language] || p.category['es'];
            const relStockLow = tStockLowPrefix.replace('{stock}', p.stock);
            const hasRelDiscount = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;

            return `
              <div class="product-card fade-in">
                <div class="product-img-wrapper">
                  <img src="${p.image}" alt="${relName}" class="product-img">
                  ${p.stock === 0 
                    ? `<span class="product-badge badge-danger">${tOutOfStock}</span>` 
                    : p.stock <= 10 
                      ? `<span class="product-badge badge-warning">${relStockLow}</span>` 
                      : ''
                  }
                  ${hasRelDiscount ? `<span class="product-badge badge-discount" style="background-color: var(--danger-color); color: white; position: absolute; top: 1rem; right: 1rem; padding: 0.35rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; z-index: 10;">-${Math.round((1 - (p.salePrice / p.price)) * 100)}%</span>` : ''}
                  <a href="#/product/${p.id}" class="quick-view-badge-overlay" title="${tViewDetail}">
                    <span>${tViewDetail}</span>
                  </a>
                </div>
                <div class="product-card-body">
                  <span class="product-category">${relCat}</span>
                  <h3 class="product-title" style="font-size: 1rem;"><a href="#/product/${p.id}">${relName}</a></h3>
                  <div class="product-footer flex justify-between align-center" style="margin-top: 1rem;">
                    <div class="product-price-blockflex" style="display: flex; flex-direction: column;">
                      ${hasRelDiscount 
                        ? `<span class="product-price-original" style="text-decoration: line-through; color: var(--text-muted); font-size: 0.8rem;">S/. ${p.price.toFixed(2)}</span>
                           <span class="product-price-discount font-bold" style="color: var(--danger-color); font-size: 1rem;">S/. ${p.salePrice.toFixed(2)}</span>`
                        : `<span class="product-price font-bold" style="font-size: 1rem;">S/. ${p.price.toFixed(2)}</span>`
                      }
                    </div>
                    <button class="quick-add-btn-footer btn btn-primary btn-sm flex align-center justify-center ${p.stock === 0 ? 'btn-disabled' : ''}" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''} title="${AppStore.t('quickAdd')}" style="padding: 0.4rem; border-radius: 50%; width: 32px; height: 32px;">
                      <i data-lucide="shopping-cart" style="width: 16px; height: 16px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

productView.init = function(params) {
  const product = AppStore.state.products.find(p => p.id === params.id);
  if (!product) return;

  const mainImg = document.getElementById('product-main-img');
  const thumbnails = document.querySelectorAll('.thumbnail');
  
  const qtyInput = document.getElementById('product-qty-input');
  const qtyDec = document.getElementById('qty-decrement-btn');
  const qtyInc = document.getElementById('qty-increment-btn');
  const addToCartBtn = document.getElementById('add-to-cart-btn');

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbnails.forEach(t => {
        t.classList.remove('active');
        t.style.borderColor = 'transparent';
      });
      thumb.classList.add('active');
      thumb.style.borderColor = 'var(--primary-color)';
      const src = thumb.getAttribute('data-src');
      if (mainImg) mainImg.src = src;
    });
  });

  if (qtyInput && qtyDec && qtyInc) {
    qtyDec.addEventListener('click', () => {
      let currentVal = parseInt(qtyInput.value) || 1;
      if (currentVal > 1) {
        qtyInput.value = currentVal - 1;
      }
    });

    qtyInc.addEventListener('click', () => {
      let currentVal = parseInt(qtyInput.value) || 1;
      if (currentVal < product.stock) {
        qtyInput.value = currentVal + 1;
      }
    });

    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value);
      if (isNaN(val) || val < 1) {
        qtyInput.value = 1;
      } else if (val > product.stock) {
        qtyInput.value = product.stock;
      }
    });
  }

  if (addToCartBtn && qtyInput) {
    addToCartBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value) || 1;
      AppStore.addToCart(product.id, qty);
    });
  }

  document.querySelectorAll('.quick-add-btn-footer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      AppStore.addToCart(id, 1);
    });
  });
};
