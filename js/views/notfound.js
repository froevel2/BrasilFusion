import { AppStore } from '../store.js';

export async function notFoundView() {
  const tTitle = AppStore.t('notFoundTitle');
  const tDesc = AppStore.t('notFoundDesc');
  const tBtnSearch = AppStore.t('notFoundBtnSearch');
  const tBtnHome = AppStore.t('notFoundBtnHome');
  const tBtnCatalog = AppStore.t('notFoundBtnCatalog');
  const tSearchPlaceholder = AppStore.t('navSearchPlaceholder');

  return `
    <div class="container section flex flex-col align-center justify-center text-center" style="min-height: 70vh; padding: 4rem 1rem;">
      <div class="error-illustration" style="margin-bottom: 2.5rem; position: relative;">
        <span style="font-size: 8rem; font-weight: 900; line-height: 1; color: rgba(15, 76, 58, 0.08); display: block; user-select: none;">404</span>
        <div style="position: absolute; left: 50%; top: 55%; transform: translate(-50%, -50%);">
          <i data-lucide="compass" style="width: 72px; height: 72px; color: var(--accent-color); animation: spin 8s linear infinite;"></i>
        </div>
      </div>
      
      <h1 style="font-size: 2.2rem; margin-bottom: 0.75rem; color: var(--primary-color);">${tTitle}</h1>
      <p class="text-muted" style="max-width: 500px; margin-bottom: 2.5rem; font-size: 1.05rem; line-height: 1.6;">
        ${tDesc}
      </p>

      <!-- Search form inside 404 -->
      <form id="notfound-search-form" class="flex gap-05" style="width: 100%; max-width: 480px; margin-bottom: 2rem;">
        <input type="text" id="notfound-search-input" placeholder="${tSearchPlaceholder}" required style="flex: 1; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px;">
        <button type="submit" class="btn btn-primary px-15 flex align-center gap-05">
          <i data-lucide="search" style="width: 16px;"></i> ${tBtnSearch}
        </button>
      </form>

      <div class="flex gap-1 justify-center mobile-stack">
        <a href="#/catalog" class="btn btn-secondary-outline">${tBtnCatalog}</a>
        <a href="#/" class="btn btn-primary">${tBtnHome}</a>
      </div>
    </div>
  `;
}

notFoundView.init = function() {
  const form = document.getElementById('notfound-search-form');
  const input = document.getElementById('notfound-search-input');

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = encodeURIComponent(input.value.trim());
      window.location.hash = `#/catalog?search=${query}`;
    });
  }
};
