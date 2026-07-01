import { AppStore } from './store.js';
import { AppRouter } from './router.js?v=1.0.7';
import { renderHeader, initHeader } from './components/header.js?v=1.0.7';
import { renderFooter, initFooter } from './components/footer.js';
import { initCartDrawer } from './components/cartDrawer.js?v=1.0.7';
import { TRANSLATIONS } from './translations.js';

// Expose translations globally to prevent circular dependencies in store.js t()
window.bf_translations = TRANSLATIONS;
window.AppStore = AppStore;

// Render the outer layout shell of the application
function initAppShell() {
  const body = document.body;

  // 1. Create global containers if they don't exist
  if (!document.getElementById('header')) {
    const headerNode = document.createElement('header');
    headerNode.id = 'header';
    headerNode.className = 'site-header';
    body.insertBefore(headerNode, document.getElementById('app'));
  }

  if (!document.getElementById('footer')) {
    const footerNode = document.createElement('footer');
    footerNode.id = 'footer';
    footerNode.className = 'site-footer';
    body.appendChild(footerNode);
  }

  if (!document.getElementById('cart-drawer')) {
    const cartDrawerNode = document.createElement('div');
    cartDrawerNode.id = 'cart-drawer';
    cartDrawerNode.className = 'cart-drawer';
    body.appendChild(cartDrawerNode);
  }

  if (!document.getElementById('toast-container')) {
    const toastContainerNode = document.createElement('div');
    toastContainerNode.id = 'toast-container';
    toastContainerNode.className = 'toast-container';
    body.appendChild(toastContainerNode);
  }

  // 2. Render dynamic layout contents
  updateHeader();
  updateFooter();
  initCartDrawer();
}

function updateHeader() {
  const header = document.getElementById('header');
  if (header) {
    header.innerHTML = renderHeader();
    initHeader();
  }
}

function updateFooter() {
  const footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML = renderFooter();
    initFooter();
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  // Setup core layouts
  initAppShell();

  // Run the router to render the correct page view
  AppRouter.handleRoute();

  // Re-subscribe header to store updates so it updates automatically
  // when the user logs in, logs out, or modifies their profile.
  AppStore.subscribe('auth', () => {
    updateHeader();
  });

  // Re-subscribe to language updates to dynamically translate the shell and page content
  AppStore.subscribe('language', () => {
    updateHeader();
    updateFooter();
    initCartDrawer();
    AppRouter.handleRoute(); // Refreshes active view in the new language
  });

  // Re-subscribe to theme updates in case anything global needs syncing
  AppStore.subscribe('theme', () => {
    // Logo or body-level class syncs if necessary
  });

  // Re-subscribe to catalog updates to dynamically refresh views when Firestore finishes loading
  AppStore.subscribe('catalog', () => {
    AppRouter.handleRoute();
  });
});
