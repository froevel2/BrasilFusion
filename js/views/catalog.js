import { AppStore } from '../store.js';

export async function catalogView() {
  const language = AppStore.state.language;
  
  const tTitle = AppStore.t('catalogTitle');
  const tDesc = AppStore.t('catalogDesc');
  const tSearchPlaceholder = AppStore.t('catalogSearchPlaceholder');
  const tResultsCount = AppStore.t('catalogResultsCount');
  const tFilterBtn = AppStore.t('catalogFilterBtn');
  const tSortLabel = AppStore.t('catalogSortLabel');
  
  const tSortPopular = AppStore.t('catalogSortPopular');
  const tSortLowHigh = AppStore.t('catalogSortLowHigh');
  const tSortHighLow = AppStore.t('catalogSortHighLow');
  const tSortAZ = AppStore.t('catalogSortAZ');
  
  const tCategoriesTitle = AppStore.t('catalogCategoriesTitle');
  const tCatAll = AppStore.t('catalogCatAll');
  
  const tGourmet = AppStore.t('footerGourmet');
  const tDrinks = AppStore.t('footerDrinks');
  const tDesserts = AppStore.t('footerDesserts');
  
  const tPriceTitle = AppStore.t('catalogPriceTitle');
  const tStockTitle = AppStore.t('catalogStockTitle');
  const tStockOnly = AppStore.t('catalogStockOnly');
  const tClearFilters = AppStore.t('catalogClearFilters');

  return `
    <div class="container section">
      <div class="catalog-page-layout">
        <!-- Page Title -->
        <div class="catalog-header flex justify-between align-center mobile-stack gap-1">
          <div>
            <h1 class="page-title">${tTitle}</h1>
            <p class="text-muted">${tDesc}</p>
          </div>
          
          <!-- Search Bar -->
          <div class="catalog-search-wrapper">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="catalog-search-input" placeholder="${tSearchPlaceholder}">
            <button id="catalog-search-clear" class="search-clear-btn">&times;</button>
          </div>
        </div>

        <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid var(--border-color);">

        <!-- Controls (Filter button for mobile, Sort drop-down) -->
        <div class="catalog-controls flex justify-between align-center gap-1">
          <div class="flex gap-05 align-center">
            <button id="mobile-filter-trigger" class="btn btn-secondary-outline btn-sm flex align-center gap-05">
              <i data-lucide="sliders-horizontal"></i> ${tFilterBtn}
            </button>
            <span class="results-count" id="catalog-results-count">${tResultsCount}</span>
          </div>

          <div class="flex gap-05 align-center">
            <label for="catalog-sort-select" class="desktop-only text-sm text-muted">– ${tSortLabel}</label>
            <select id="catalog-sort-select" class="sort-select">
              <option value="popular">${tSortPopular}</option>
              <option value="price-asc">${tSortLowHigh}</option>
              <option value="price-desc">${tSortHighLow}</option>
              <option value="name-asc">${tSortAZ}</option>
            </select>
          </div>
        </div>

        <div class="catalog-main-content grid grid-4" style="margin-top: 1.5rem;">
          <!-- Filter Sidebar (Left) -->
          <aside id="catalog-filters-sidebar" class="filters-sidebar">
            <div class="sidebar-header mobile-only flex justify-between align-center">
              <h3>${tFilterBtn}</h3>
              <button id="mobile-filter-close" class="close-btn">&times;</button>
            </div>
            
            <!-- Category Filter -->
            <div class="filter-group">
              <h4>${tCategoriesTitle}</h4>
              <div class="filter-options">
                <label class="filter-checkbox-label">
                  <input type="checkbox" name="category" value="all" id="cat-all-checkbox" checked>
                  <span>${tCatAll}</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" name="category" value="Alimentos" class="cat-checkbox">
                  <span>${language === 'es' ? 'Alimentos' : 'Alimentos'}</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" name="category" value="Bebidas" class="cat-checkbox">
                  <span>${language === 'es' ? 'Bebidas' : 'Bebidas'}</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" name="category" value="Snacks e doces" class="cat-checkbox">
                  <span>${language === 'es' ? 'Snacks e doces' : 'Snacks e doces'}</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" name="category" value="Packs" class="cat-checkbox">
                  <span>${language === 'es' ? 'Packs' : 'Packs'}</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" name="category" value="Sin Gluten" class="cat-checkbox">
                  <span>${language === 'es' ? 'Sin Gluten' : 'Sem Glúten'}</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" name="category" value="Novedades" class="cat-checkbox">
                  <span>${language === 'es' ? 'Novedades' : 'Novidades'}</span>
                </label>
              </div>
            </div>


            <!-- Stock Filter -->
            <div class="filter-group">
              <h4>${tStockTitle}</h4>
              <div class="filter-options">
                <label class="filter-checkbox-label">
                  <input type="checkbox" id="stock-available-checkbox">
                  <span>${tStockOnly}</span>
                </label>
              </div>
            </div>

            <!-- Clear Filters -->
            <button id="clear-all-filters-btn" class="btn btn-secondary-outline btn-sm w-full" style="margin-top: 1rem;">${tClearFilters}</button>


            <!-- Sidebar Trust Badge List -->
            <div class="sidebar-trust-badges" style="margin-top: 1.5rem;">
              <div class="trust-item flex gap-05">
                <i data-lucide="snowflake" class="text-primary" style="width: 18px; height: 18px; flex-shrink: 0; margin-top: 0.1rem;"></i>
                <div class="trust-text">
                  <h5>${language === 'es' ? 'Cadena de Frío' : 'Cadeia de Frio'}</h5>
                  <p>${language === 'es' ? 'Açaí y Pão de Queijo 100% frescos' : 'Açaí e Pão de Queijo 100% frescos'}</p>
                </div>
              </div>
              <div class="trust-item flex gap-05" style="margin-top: 1rem;">
                <i data-lucide="sparkles" class="text-primary" style="width: 18px; height: 18px; flex-shrink: 0; margin-top: 0.1rem;"></i>
                <div class="trust-text">
                  <h5>${language === 'es' ? 'Garantía Fusión' : 'Garantia Fusão'}</h5>
                  <p>${language === 'es' ? 'Sabores auténticos importados' : 'Sabores autênticos importados'}</p>
                </div>
              </div>
            </div>

            <!-- Sidebar Shipping Info Card -->
            <div class="sidebar-shipping-info-card" style="margin-top: 1.5rem; padding: 1.25rem; background-color: var(--primary-light); border-radius: var(--radius-lg); border: 1px solid rgba(15, 76, 58, 0.08); font-size: 0.85rem; line-height: 1.45; text-align: left;">
              <h5 style="color: var(--primary-color); font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
                <i data-lucide="truck" style="width: 18px; height: 18px; color: var(--primary-color);"></i>
                <span>${language === 'es' ? 'Envíos y Horarios' : 'Envios e Horários'}</span>
              </h5>
              <p style="margin-bottom: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
                <strong>Horario de Envíos:</strong><br>
                • Lun a Vie: 9:00 AM - 6:00 PM<br>
                • Sábados: 10:00 AM - 1:00 PM
              </p>
              <p style="margin-bottom: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
                <strong>Tarifas de Delivery:</strong><br>
                • <strong>Zona 1 (S/. 7.00):</strong> Miraflores, Surquillo, San Isidro, Barranco, Lince.<br>
                • <strong>Zona 2 (S/. 10.00):</strong> San Borja, Surco, Jesús María, Breña, etc.<br>
                • <strong>Zona 3 (S/. 13.00):</strong> La Molina, San Miguel, Chorrillos, etc.<br>
                • <strong>Zona 4 (S/. 18.00):</strong> Los Olivos, Callao, SMP, Comas.<br>
                • <strong>Provincias:</strong> Envíos vía Shalom (Desde S/. 15.00 según peso).
              </p>
              <p style="margin-bottom: 0; font-size: 0.775rem; color: var(--primary-color); font-weight: 700;">
                ⚠️ Solo separamos productos mediante el pago. Envíos solo por delivery (sin retiro en tienda).
              </p>
            </div>
          </aside>

          <!-- Products Grid (Right, spans 3 columns on desktop) -->
          <div class="products-grid-wrapper col-span-3">
            <div id="catalog-products-grid" class="grid grid-3 gap-2">
              <!-- Skeletons will be rendered here first -->
              ${Array.from({ length: 6 }).map(() => `
                <div class="product-card skeleton-card">
                  <div class="skeleton skeleton-img"></div>
                  <div class="product-card-body">
                    <div class="skeleton skeleton-text skeleton-sm" style="width: 40%"></div>
                    <div class="skeleton skeleton-text" style="width: 80%; margin-top: 0.5rem;"></div>
                    <div class="skeleton skeleton-text skeleton-sm" style="width: 60%; margin-top: 0.5rem;"></div>
                    <div class="skeleton skeleton-btn" style="margin-top: 1rem;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Keep track of active filters state in memory during view instantiation
let currentFilters = {
  search: '',
  categories: [],
  maxPrice: 60,
  onlyInStock: false,
  sortBy: 'popular'
};

catalogView.init = function() {
  const productsGrid = document.getElementById('catalog-products-grid');
  const resultsCount = document.getElementById('catalog-results-count');
  
  const searchInput = document.getElementById('catalog-search-input');
  const searchClear = document.getElementById('catalog-search-clear');
  
  const sortSelect = document.getElementById('catalog-sort-select');
  
  const catAllCheckbox = document.getElementById('cat-all-checkbox');
  const catCheckboxes = document.querySelectorAll('.cat-checkbox');
  
  
  const stockCheckbox = document.getElementById('stock-available-checkbox');
  const clearFiltersBtn = document.getElementById('clear-all-filters-btn');
  
  const filtersSidebar = document.getElementById('catalog-filters-sidebar');
  const mobileFilterTrigger = document.getElementById('mobile-filter-trigger');
  const mobileFilterClose = document.getElementById('mobile-filter-close');

  const language = AppStore.state.language;

  // Parse URL hash parameters for initial filters (e.g. catalog?category=Gourmet)
  const hashParts = window.location.hash.split('?');
  if (hashParts.length > 1) {
    const params = new URLSearchParams(hashParts[1]);
    const catParam = params.get('category');
    if (catParam) {
      currentFilters.categories = [catParam];
      // Sync checkbox state
      catAllCheckbox.checked = false;
      catCheckboxes.forEach(cb => {
        if (cb.value === catParam) cb.checked = true;
      });
    }
    const searchParam = params.get('search');
    if (searchParam) {
      currentFilters.search = searchParam;
      searchInput.value = searchParam;
    }
  }

  // Trigger loading simulation (skeleton loader)
  setTimeout(() => {
    renderFilteredProducts();
  }, 750); // 750ms of skeleton loading animation

  // Re-render dynamically as soon as products finish loading from Firestore
  AppStore.subscribe('catalog', () => {
    renderFilteredProducts();
  });

  // Filtering Logic Function
  function renderFilteredProducts() {
    if (!productsGrid) return;

    let items = [...AppStore.state.products];

    // Search filter
    if (currentFilters.search) {
      const q = currentFilters.search.toLowerCase();
      items = items.filter(p => {
        const name = (p.name[language] || p.name['es'] || '').toLowerCase();
        const desc = (p.description[language] || p.description['es'] || '').toLowerCase();
        const cat = (p.category[language] || p.category['es'] || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    // Category filter
    if (currentFilters.categories.length > 0) {
      items = items.filter(p => {
        const catVal = p.category['es'] || p.category; // match the code categories in checkboxes ('Gourmet', 'Bebidas', 'Postres')
        return currentFilters.categories.includes(catVal);
      });
    }


    // Stock availability filter
    if (currentFilters.onlyInStock) {
      items = items.filter(p => p.stock > 0);
    }

    // Sorting logic
    if (currentFilters.sortBy === 'popular') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (currentFilters.sortBy === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (currentFilters.sortBy === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (currentFilters.sortBy === 'name-asc') {
      items.sort((a, b) => {
        const nameA = a.name[language] || a.name['es'] || '';
        const nameB = b.name[language] || b.name['es'] || '';
        return nameA.localeCompare(nameB);
      });
    }

    // Update results count
    const singleProductText = language === 'es' ? 'producto encontrado' : 'produto encontrado';
    const multiProductText = language === 'es' ? 'productos encontrados' : 'produtos encontrados';
    resultsCount.textContent = `${items.length} ${items.length === 1 ? singleProductText : multiProductText}`;

    // Show search clear button
    if (currentFilters.search) {
      searchClear.classList.add('visible');
    } else {
      searchClear.classList.remove('visible');
    }

    // Render results
    if (items.length === 0) {
      productsGrid.innerHTML = `
        <div class="col-span-3 text-center empty-state" style="padding: 4rem 1rem;">
          <i data-lucide="package-search" class="empty-icon" style="width: 48px; height: 48px; margin: 0 auto 1.5rem auto; opacity: 0.5;"></i>
          <h3>${AppStore.t('catalogNoProducts')}</h3>
          <p class="text-muted" style="margin-bottom: 1.5rem;">${AppStore.t('catalogNoProductsDesc')}</p>
          <button id="reset-filters-empty-btn" class="btn btn-primary">${AppStore.t('catalogNoProductsBtn')}</button>
        </div>
      `;
      
      const resetBtn = document.getElementById('reset-filters-empty-btn');
      if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
      
      if (window.lucide) window.lucide.createIcons({ attrs: { class: 'lucide-icon' } });
      return;
    }

    const tOutOfStock = AppStore.t('outOfStock');
    const tStockLowPrefix = AppStore.t('lowStock');
    const tViewDetail = AppStore.t('viewDetails');

    productsGrid.innerHTML = items.map(p => {
      const productName = p.name[language] || p.name['es'];
      const productCategory = p.category[language] || p.category['es'];
      const productDescription = p.description[language] || p.description['es'];
      const productStockLow = tStockLowPrefix.replace('{stock}', p.stock);
      const hasDiscount = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;

      return `
        <div class="product-card fade-in">
          <div class="product-img-wrapper">
            <img src="${p.image}" alt="${productName}" class="product-img">
            ${p.stock === 0 
              ? `<span class="product-badge badge-danger">${tOutOfStock}</span>` 
              : p.stock <= 10 
                ? `<span class="product-badge badge-warning">${productStockLow}</span>` 
                : ''
            }
            ${hasDiscount ? `<span class="product-badge badge-discount" style="background-color: var(--danger-color); color: white; position: absolute; top: 1rem; right: 1rem; padding: 0.35rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; z-index: 10;">-${Math.round((1 - (p.salePrice / p.price)) * 100)}%</span>` : ''}
            <a href="#/product/${p.id}" class="quick-view-badge-overlay" title="${tViewDetail}">
              <span>${tViewDetail}</span>
            </a>
          </div>
          <div class="product-card-body">
            <span class="product-category">${productCategory}</span>
            <h3 class="product-title"><a href="#/product/${p.id}">${productName}</a></h3>
            <div class="product-rating flex align-center gap-05">
              <div class="stars flex">
                ${Array.from({ length: 5 }).map((_, i) => `
                  <i data-lucide="star" class="${i < Math.floor(p.rating) ? 'star-filled' : 'star-empty'}"></i>
                `).join('')}
              </div>
              <span class="rating-val">(${p.reviewsCount})</span>
            </div>
            <p class="product-card-desc text-muted">${productDescription.substring(0, 75)}...</p>
            <div class="product-footer flex justify-between align-center">
              <div class="product-price-blockflex" style="display: flex; flex-direction: column;">
                ${hasDiscount 
                  ? `<span class="product-price-original" style="text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem;">S/. ${p.price.toFixed(2)}</span>
                     <span class="product-price-discount font-bold" style="color: var(--danger-color); font-size: 1.15rem;">S/. ${p.salePrice.toFixed(2)}</span>`
                  : `<span class="product-price font-bold" style="font-size: 1.15rem;">S/. ${p.price.toFixed(2)}</span>`
                }
              </div>
              <button class="quick-add-btn-footer btn btn-primary btn-sm flex align-center justify-center ${p.stock === 0 ? 'btn-disabled' : ''}" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''} title="${AppStore.t('quickAdd')}" style="padding: 0.5rem; border-radius: 50%; width: 36px; height: 36px;">
                <i data-lucide="shopping-cart" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind Quick Add to Cart Buttons
    productsGrid.querySelectorAll('.quick-add-btn-footer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        AppStore.addToCart(id, 1);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { class: 'lucide-icon' }
      });
    }
  }

  // EVENT LISTENERS
  let searchDebounce;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentFilters.search = e.target.value;
        renderFilteredProducts();
      }, 300);
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      currentFilters.search = '';
      renderFilteredProducts();
    });
  }

  // Sorting
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sortBy = e.target.value;
      renderFilteredProducts();
    });
  }

  // Categories Checkboxes
  if (catAllCheckbox) {
    catAllCheckbox.addEventListener('change', () => {
      if (catAllCheckbox.checked) {
        currentFilters.categories = [];
        catCheckboxes.forEach(cb => cb.checked = false);
        renderFilteredProducts();
      }
    });
  }

  catCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        catAllCheckbox.checked = false;
        currentFilters.categories.push(cb.value);
      } else {
        currentFilters.categories = currentFilters.categories.filter(c => c !== cb.value);
        if (currentFilters.categories.length === 0) {
          catAllCheckbox.checked = true;
        }
      }
      renderFilteredProducts();
    });
  });


  // Stock checkbox
  if (stockCheckbox) {
    stockCheckbox.addEventListener('change', (e) => {
      currentFilters.onlyInStock = e.target.checked;
      renderFilteredProducts();
    });
  }

  // Mobile Filter Sidesheet Drawer Toggles
  if (mobileFilterTrigger && filtersSidebar) {
    mobileFilterTrigger.addEventListener('click', () => {
      filtersSidebar.classList.add('active');
    });
  }

  if (mobileFilterClose && filtersSidebar) {
    mobileFilterClose.addEventListener('click', () => {
      filtersSidebar.classList.remove('active');
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', resetAllFilters);
  }

  function resetAllFilters() {
    currentFilters = {
      search: '',
      categories: [],
      maxPrice: 60,
      onlyInStock: false,
      sortBy: 'popular'
    };

    if (searchInput) searchInput.value = '';
    if (catAllCheckbox) catAllCheckbox.checked = true;
    catCheckboxes.forEach(cb => cb.checked = false);

    if (stockCheckbox) stockCheckbox.checked = false;
    if (sortSelect) sortSelect.value = 'popular';

    renderFilteredProducts();
  }
};
