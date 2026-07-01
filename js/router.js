import { homeView } from './views/home.js?v=1.0.7';
import { catalogView } from './views/catalog.js?v=1.0.7';
import { productView } from './views/product.js?v=1.0.7';
import { cartView } from './views/cart.js?v=1.0.7';
import { checkoutView } from './views/checkout.js?v=1.0.7';
import { authView } from './views/auth.js?v=1.0.7';
import { profileView } from './views/profile.js?v=1.0.7';
import { ordersView } from './views/orders.js?v=1.0.7';
import { adminView } from './views/admin.js?v=1.0.7';
import { notFoundView } from './views/notfound.js?v=1.0.7';
import { devolucionesView } from './views/devoluciones.js?v=1.0.7';

class Router {
  constructor() {
    this.routes = [
      { path: '/', view: homeView },
      { path: '/catalog', view: catalogView },
      { path: '/product/:id', view: productView },
      { path: '/cart', view: cartView },
      { path: '/checkout', view: checkoutView },
      { path: '/login', view: authView },
      { path: '/register', view: authView },
      { path: '/forgot-password', view: authView },
      { path: '/profile', view: profileView },
      { path: '/orders', view: ordersView },
      { path: '/faq', view: homeView },
      { path: '/destacados', view: homeView },
      { path: '/admin', view: adminView },
      { path: '/devoluciones', view: devolucionesView },
      { path: '/404', view: notFoundView }
    ];

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  // Convert route path to regex
  pathToRegex(path) {
    return new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");
  }

  getParams(match) {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);

    return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  }

  navigate(path) {
    window.location.hash = path;
  }

  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/';

    // Clean up admin real-time orders subscription if leaving the admin section
    if (hash !== '/admin' && window.adminOrdersUnsubscribe) {
      try {
        window.adminOrdersUnsubscribe();
      } catch (e) {
        console.warn("Error cleaning up admin orders subscription:", e);
      }
      window.adminOrdersUnsubscribe = null;
    }

    // Test routes
    const potentialMatches = this.routes.map(route => {
      return {
        route: route,
        result: hash.match(this.pathToRegex(route.path))
      };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);

    // If no match found, redirect to 404
    if (!match) {
      match = {
        route: this.routes.find(r => r.path === '/404'),
        result: [hash]
      };
    }

    const params = this.getParams(match);
    const appContainer = document.getElementById('app');

    // Page fade transition
    if (appContainer) {
      appContainer.classList.add('page-exit');
      
      // Wait for exit animation
      await new Promise(resolve => setTimeout(resolve, 200));

      // Render view
      try {
        appContainer.innerHTML = await match.route.view(params);
        
        // Trigger page-specific JS initialization
        if (typeof match.route.view.init === 'function') {
          match.route.view.init(params);
        } else if (match.route.view.onRender) {
          match.route.view.onRender(params);
        }
      } catch (error) {
        console.error("Error rendering view:", error);
        appContainer.innerHTML = `<div class="container section text-center"><h2>Error</h2><p>Hubo un problema al cargar esta página.</p></div>`;
      }

      // Refresh scroll and trigger icons
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      if (window.lucide) {
        window.lucide.createIcons({
          attrs: { class: 'lucide-icon' }
        });
      }

      appContainer.classList.remove('page-exit');
      appContainer.classList.add('page-enter');
      
      setTimeout(() => {
        appContainer.classList.remove('page-enter');
      }, 300);
    }

    this.updateActiveNavLinks(hash);
  }

  updateActiveNavLinks(hash) {
    // Clean all active classes from header navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${hash}` || (hash === '/' && href === '#/')) {
        link.classList.add('active');
      }
    });
  }
}

export const AppRouter = new Router();
