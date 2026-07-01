import { AppStore } from '../store.js';
import { escapeHTML } from '../utils.js';

export function renderHeader() {
  const currentUser = AppStore.state.currentUser;
  const cartCount = AppStore.getCartCount();
  const theme = AppStore.state.theme;
  const language = AppStore.state.language;

  // Fetch translations
  const tHome = AppStore.t('navHome');
  const tCatalog = AppStore.t('navCatalog');
  const tOrders = AppStore.t('navOrders');
  const tMyOrders = AppStore.t('navMyOrders');
  const tProfile = AppStore.t('navProfile');
  const tLogin = AppStore.t('navLogin');
  const tRegister = AppStore.t('navRegister');
  const tLogout = AppStore.t('navLogout');
  const tSearchPlaceholder = AppStore.t('navSearchPlaceholder');
  const tSearchLabel = AppStore.t('navSearchLabel');
  const tThemeLabel = AppStore.t('navThemeLabel');
  
  return `
    <div class="header-container container">
      <!-- Logo -->
      <a href="#/" class="logo" style="display: flex; align-items: center;">
        <img src="assets/images/logo_claro_sin_fondo.png" alt="Brasil Fusión" class="logo-img-header">
      </a>

      <!-- Navigation Links (Desktop) -->
      <nav class="nav-desktop">
        <a href="#/" class="nav-link">${tHome}</a>
        <a href="#/catalog" class="nav-link">${tCatalog}</a>
        <a href="#/orders" class="nav-link">${tOrders}</a>
        ${currentUser?.role === 'admin' ? `<a href="#/admin" class="nav-link" style="color:var(--accent-color); font-weight:700;"><i data-lucide="shield-check" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px; margin-top:-2px;"></i>Admin</a>` : ''}
      </nav>

      <!-- Actions (Cart, Search, Theme, Language, Profile) -->
      <div class="header-actions">
        <!-- Search Trigger -->
        <button id="search-trigger" class="header-btn" aria-label="${tSearchLabel}">
          <i data-lucide="search"></i>
        </button>


        <!-- Language Toggle -->
        <button id="language-toggle" class="language-btn-accent" title="Mudar Idioma / Cambiar Idioma">
          <i data-lucide="languages"></i>
          <span>${language === 'es' ? '🇧🇷 PT' : '🇵🇪 ES'}</span>
        </button>

        <!-- User Profile -->
        <div class="profile-dropdown">
          <a href="${currentUser ? '#/profile' : '#/login'}" class="header-btn" id="profile-btn" aria-label="${tProfile}">
            <i data-lucide="user"></i>
          </a>
        </div>

        <!-- Cart Trigger -->
        <button id="cart-trigger" class="header-btn cart-btn" aria-label="Ver carrito">
          <i data-lucide="shopping-bag"></i>
          <span class="cart-badge ${cartCount > 0 ? 'visible' : ''}" id="cart-badge-count">${cartCount}</span>
        </button>

        <!-- Mobile Menu Toggle -->
        <button id="mobile-menu-trigger" class="header-btn mobile-menu-btn" aria-label="Menú">
          <i data-lucide="menu"></i>
        </button>
      </div>
    </div>

    <!-- Search Overlay -->
    <div id="search-overlay" class="search-overlay">
      <div class="search-box">
        <div class="search-input-wrapper">
          <i data-lucide="search" class="search-icon"></i>
          <input type="text" id="search-overlay-input" placeholder="${tSearchPlaceholder}" autocomplete="off">
          <button id="search-overlay-close" class="search-close-btn">&times;</button>
        </div>
        <div id="search-results-preview" class="search-results-preview"></div>
      </div>
    </div>

    <!-- Mobile Nav Menu Overlay -->
    <div id="mobile-menu" class="mobile-menu">
      <div class="mobile-menu-header">
        <a href="#/" class="logo" style="display: flex; align-items: center;">
          <img src="assets/images/logo_claro_sin_fondo.png" alt="Brasil Fusión" class="logo-img-mobile">
        </a>
        <button id="mobile-menu-close" class="mobile-menu-close">&times;</button>
      </div>
      <nav class="nav-mobile">
        <a href="#/" class="mobile-nav-link">${tHome}</a>
        <a href="#/catalog" class="mobile-nav-link">${tCatalog}</a>
        <a href="#/orders" class="mobile-nav-link">${tMyOrders}</a>
        ${currentUser?.role === 'admin' ? `<a href="#/admin" class="mobile-nav-link" style="color:var(--accent-color); font-weight:700;">Panel Admin</a>` : ''}
        <hr class="mobile-divider">
        ${currentUser ? `
          <div class="mobile-user-info" style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="user-avatar-icon" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(15, 76, 58, 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="user" style="width: 18px; height: 18px;"></i>
            </div>
            <div class="mobile-user-details">
              <span class="mobile-user-name">${currentUser.name}</span>
              <a href="#/profile" class="mobile-profile-link">${tProfile}</a>
            </div>
          </div>
          <button id="mobile-logout-btn" class="btn btn-secondary btn-sm w-full" style="margin-top: 1rem;">${tLogout}</button>
        ` : `
          <a href="#/login" class="btn btn-primary btn-sm w-full text-center">${tLogin}</a>
          <a href="#/register" class="btn btn-secondary btn-sm w-full text-center" style="margin-top: 0.5rem;">${tRegister}</a>
        `}
      </nav>
    </div>
  `;
}

export function initHeader() {
  const searchTrigger = document.getElementById('search-trigger');
  const searchOverlay = document.getElementById('search-overlay');
  const searchOverlayClose = document.getElementById('search-overlay-close');
  const searchOverlayInput = document.getElementById('search-overlay-input');
  const searchResultsPreview = document.getElementById('search-results-preview');
  

  const languageToggle = document.getElementById('language-toggle');
  
  const cartTrigger = document.getElementById('cart-trigger');
  const cartDrawer = document.getElementById('cart-drawer');
  
  const mobileMenuTrigger = document.getElementById('mobile-menu-trigger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');

  // Open Search
  if (searchTrigger && searchOverlay) {
    searchTrigger.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      setTimeout(() => searchOverlayInput.focus(), 100);
    });
  }

  // Close Search
  if (searchOverlayClose && searchOverlay) {
    searchOverlayClose.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
      searchOverlayInput.value = '';
      if (searchResultsPreview) searchResultsPreview.innerHTML = '';
    });
  }

  // Handle Search Input Preview
  if (searchOverlayInput && searchResultsPreview) {
    searchOverlayInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length < 2) {
        searchResultsPreview.innerHTML = '';
        return;
      }

      const lang = AppStore.state.language;
      const matches = AppStore.state.products.filter(p => {
        const name = (p.name[lang] || p.name['es'] || '').toLowerCase();
        const desc = (p.description[lang] || p.description['es'] || '').toLowerCase();
        const cat = (p.category[lang] || p.category['es'] || '').toLowerCase();
        return name.includes(query) || desc.includes(query) || cat.includes(query);
      }).slice(0, 5);

      if (matches.length === 0) {
        const queryText = escapeHTML(e.target.value);
        searchResultsPreview.innerHTML = `<p class="no-results">${AppStore.t('noResultsFound', { query: queryText })}</p>`;
        return;
      }

      searchResultsPreview.innerHTML = matches.map(p => {
        const productName = p.name[lang] || p.name['es'];
        return `
          <a href="#/product/${p.id}" class="search-result-item">
            <img src="${p.image}" alt="${productName}">
            <div class="result-details">
              <span class="result-name">${productName}</span>
              <span class="result-price">S/. ${p.price.toFixed(2)}</span>
            </div>
          </a>
        `;
      }).join('');
      
      // Auto close search overlay when clicking a search result
      searchResultsPreview.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          searchOverlay.classList.remove('active');
          searchOverlayInput.value = '';
          searchResultsPreview.innerHTML = '';
        });
      });
    });
  }

  // Close search overlay on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay && searchOverlay.classList.contains('active')) {
      searchOverlay.classList.remove('active');
    }
  });


  // Toggle Language
  if (languageToggle) {
    languageToggle.addEventListener('click', () => {
      const nextLang = AppStore.state.language === 'es' ? 'pt' : 'es';
      AppStore.setLanguage(nextLang);
    });
  }

  // Open Cart
  if (cartTrigger && cartDrawer) {
    cartTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      cartDrawer.classList.add('active');
      document.body.classList.add('no-scroll');
    });
  }

  // Mobile Menu Toggles
  if (mobileMenuTrigger && mobileMenu) {
    mobileMenuTrigger.addEventListener('click', () => {
      mobileMenu.classList.add('active');
    });
  }

  if (mobileMenuClose && mobileMenu) {
    mobileMenuClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
    });
  }

  // Mobile navigation links click should close mobile menu
  document.querySelectorAll('.mobile-nav-link, .mobile-profile-link').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.remove('active');
    });
  });

  // Mobile Logout
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', () => {
      AppStore.logout();
      if (mobileMenu) mobileMenu.classList.remove('active');
      window.location.hash = '#/';
    });
  }

  // Subscribe to store updates to keep UI cart badge synced
  AppStore.subscribe('cart', () => {
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      const count = AppStore.getCartCount();
      badge.textContent = count;
      if (count > 0) {
        badge.classList.add('visible');
        badge.classList.add('wiggle');
        setTimeout(() => badge.classList.remove('wiggle'), 500);
      } else {
        badge.classList.remove('visible');
      }
    }
  });
}
