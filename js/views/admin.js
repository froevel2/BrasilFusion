import { AppStore } from '../store.js';
import { firebaseService } from '../services/firebaseService.js';
import { escapeHTML } from '../utils.js';

let activeTab = 'dashboard';
let allProducts = [];
let allCategories = [];
let allOrders = [];
let allCustomers = [];
let allAdmins = [];
let deliverySlots = [];
let generalConfig = {};

// Active charts references so we can destroy them on re-render
let charts = {
  salesMonthly: null,
  salesDaily: null,
  topProducts: null,
  frequentCustomers: null
};

function buildProductTags(product, isFeatured) {
  const defaultEs = product?.tags?.es?.filter(t => t !== 'Destacado') || ["Orgánico"];
  const defaultPt = product?.tags?.pt?.filter(t => t !== 'Destacado') || ["Orgânico"];
  if (isFeatured) {
    if (!defaultEs.includes('Destacado')) defaultEs.unshift('Destacado');
    if (!defaultPt.includes('Destaque')) defaultPt.unshift('Destaque');
  }
  return { es: defaultEs, pt: defaultPt };
}

export async function adminView() {
  const currentUser = AppStore.state.currentUser;

  // Guard: Check if the user is an admin
  if (!currentUser || currentUser.role !== 'admin') {
    return `
      <div class="container section text-center" style="min-height: 70vh; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 1.5rem;">
        <i data-lucide="shield-alert" style="width: 64px; height: 64px; color: var(--danger-color);"></i>
        <h1 class="page-title">Acceso Denegado / Acesso Negado</h1>
        <p class="text-muted" style="max-width: 480px;">No tienes permisos de administrador para visualizar esta sección. Por favor, inicia sesión con una cuenta autorizada.</p>
        <div class="flex gap-1">
          <a href="#/login" class="btn btn-primary">Iniciar Sesión</a>
          <a href="#/" class="btn btn-secondary-outline">Volver a Inicio</a>
        </div>
      </div>
    `;
  }

  // Load active data
  try {
    allProducts = await firebaseService.fetchProducts();
    allCategories = await firebaseService.fetchCategories();
    allOrders = await firebaseService.fetchOrders(null, "admin");
    allCustomers = await firebaseService.fetchAllCustomers();
    allAdmins = await firebaseService.fetchAllAdmins();
    deliverySlots = await firebaseService.fetchDeliverySlots();
    generalConfig = await firebaseService.fetchGeneralConfig() || { contactPhone: "+51987654321", coupon: { code: '', discount: 10, active: false } };
  } catch (err) {
    console.error("Error loading admin dashboard data:", err);
  }

  return `
    <div class="admin-layout">
      <!-- Sidebar Navigation -->
      <aside class="admin-sidebar">
        <div class="admin-sidebar-header flex align-center gap-05">
          <i data-lucide="shield-check" class="text-success" style="width: 28px; height: 28px;"></i>
          <span class="logo-text" style="font-size: 1.25rem;">Panel <span class="logo-accent">Admin</span></span>
        </div>
        
        <nav class="admin-nav">
          <a class="admin-nav-link ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            <i data-lucide="layout-dashboard"></i> Dashboard
          </a>
          <a class="admin-nav-link ${activeTab === 'products' ? 'active' : ''}" data-tab="products">
            <i data-lucide="package"></i> Productos
          </a>
          <a class="admin-nav-link ${activeTab === 'categories' ? 'active' : ''}" data-tab="categories">
            <i data-lucide="tags"></i> Categorías
          </a>
          <a class="admin-nav-link ${activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
            <i data-lucide="shopping-cart"></i> Pedidos
          </a>
          <a class="admin-nav-link ${activeTab === 'customers' ? 'active' : ''}" data-tab="customers">
            <i data-lucide="users"></i> Clientes
          </a>
          <a class="admin-nav-link ${activeTab === 'config' ? 'active' : ''}" data-tab="config">
            <i data-lucide="settings"></i> Configuración
          </a>
          <a class="admin-nav-link ${activeTab === 'admins' ? 'active' : ''}" data-tab="admins">
            <i data-lucide="user-check"></i> Administradores
          </a>
        </nav>
        
        <div style="margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
          <div class="flex align-center gap-05" style="margin-bottom: 1rem;">
            <div class="user-avatar-icon" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(15, 76, 58, 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="user" style="width: 16px; height: 16px;"></i>
            </div>
            <div class="flex-col">
              <span class="font-semibold text-sm" style="display:block; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${currentUser.name}</span>
              <span class="admin-badge">Admin</span>
            </div>
          </div>
          <button id="admin-logout-btn" class="btn btn-secondary btn-sm w-full">Cerrar Sesión</button>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="admin-main">
        <header class="admin-header">
          <div class="admin-title-section">
            <h2>${getTabTitle(activeTab)}</h2>
            <p class="text-muted text-sm">Gestión en tiempo real de Brasil Fusión</p>
          </div>
          <div class="flex align-center gap-1">
            <span class="text-sm text-muted font-semibold">${new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        <!-- Dynamic Tab Contents -->
        <div id="admin-tab-content">
          ${renderTabContent(activeTab)}
        </div>
      </main>
    </div>

    <!-- Modals Container (Hidden by default) -->
    <div id="admin-modal" class="admin-modal-overlay">
      <div class="admin-modal-container" id="admin-modal-container">
        <!-- Content will be injected dynamically -->
      </div>
    </div>

    <!-- Customer History Modal Container -->
    <div id="customer-orders-modal" class="admin-modal-overlay">
      <div class="admin-modal-container" style="max-width: 750px;">
        <div class="admin-modal-header">
          <h3 id="customer-modal-title">Historial del Cliente</h3>
          <button class="admin-modal-close" onclick="document.getElementById('customer-orders-modal').classList.remove('active')">&times;</button>
        </div>
        <div id="customer-modal-body" style="margin-top: 1rem;">
          <!-- Content injected dynamically -->
        </div>
      </div>
    </div>
  `;
}

function getTabTitle(tab) {
  const titles = {
    dashboard: 'Dashboard de Rendimiento',
    products: 'Catálogo de Productos',
    categories: 'Categorías de la Tienda',
    orders: 'Gestión de Pedidos',
    customers: 'Directorio de Clientes',
    config: 'Configuración General',
    admins: 'Cuentas de Administradores'
  };
  return titles[tab] || 'Administración';
}

function renderTabContent(tab) {
  if (tab === 'dashboard') {
    return renderDashboardTab();
  } else if (tab === 'products') {
    return renderProductsTab();
  } else if (tab === 'categories') {
    return renderCategoriesTab();
  } else if (tab === 'orders') {
    return renderOrdersTab();
  } else if (tab === 'customers') {
    return renderCustomersTab();
  } else if (tab === 'config') {
    return renderConfigTab();
  } else if (tab === 'admins') {
    return renderAdminsTab();
  }
  return '';
}

// ==========================================================================
// 1. DASHBOARD TAB VIEW
// ==========================================================================
function renderDashboardTab() {
  // Metric Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM

  const dailyOrders = allOrders.filter(o => o.date === todayStr && o.status !== "Cancelado");
  const dailySales = dailyOrders.reduce((sum, o) => sum + o.total, 0);

  const monthlyOrders = allOrders.filter(o => o.date.startsWith(thisMonthStr) && o.status !== "Cancelado");
  const monthlySales = monthlyOrders.reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersCount = allOrders.filter(o => o.status === "En preparación" || o.status === "En camino").length;
  const lowStockCount = allProducts.filter(p => p.stock <= 5).length;
  
  // Expiration warnings: products expiring in next 30 days
  const todayTime = new Date().getTime();
  const next30DaysTime = todayTime + (30 * 24 * 60 * 60 * 1000);
  const criticalExpiryCount = allProducts.filter(p => {
    if (!p.expiryDate) return false;
    const expTime = new Date(p.expiryDate).getTime();
    return expTime > todayTime && expTime <= next30DaysTime;
  }).length;

  return `
    <div class="flex flex-col gap-2">
      <!-- Summary metrics grid -->
      <section class="admin-metrics-grid">
        <div class="admin-metric-card">
          <div class="metric-icon-wrapper" style="background-color:rgba(46, 125, 50, 0.1); color:var(--success-color);">
            <i data-lucide="trending-up"></i>
          </div>
          <div class="metric-info">
            <span class="metric-title">Ventas del Día</span>
            <span class="metric-value">S/. ${dailySales.toFixed(2)}</span>
          </div>
        </div>
        <div class="admin-metric-card">
          <div class="metric-icon-wrapper">
            <i data-lucide="dollar-sign"></i>
          </div>
          <div class="metric-info">
            <span class="metric-title">Ventas Mensuales</span>
            <span class="metric-value">S/. ${monthlySales.toFixed(2)}</span>
          </div>
        </div>
        <div class="admin-metric-card">
          <div class="metric-icon-wrapper" style="background-color:rgba(245, 124, 0, 0.1); color:var(--warning-color);">
            <i data-lucide="clock"></i>
          </div>
          <div class="metric-info">
            <span class="metric-title">Pedidos Pendientes</span>
            <span class="metric-value">${pendingOrdersCount}</span>
          </div>
        </div>
        <div class="admin-metric-card">
          <div class="metric-icon-wrapper" style="background-color:rgba(198, 40, 40, 0.1); color:var(--danger-color);">
            <i data-lucide="alert-triangle"></i>
          </div>
          <div class="metric-info">
            <span class="metric-title">Poco Inventario</span>
            <span class="metric-value">${lowStockCount} <span class="text-sm text-muted" style="font-size:0.8rem;">pzas</span></span>
          </div>
        </div>
      </section>

      <!-- Charts layout -->
      <section class="admin-charts-grid">
        <!-- Sales Analysis -->
        <div class="admin-chart-card">
          <h3>Ventas Mensuales (S/.)</h3>
          <div class="chart-wrapper">
            <canvas id="chart-sales-monthly"></canvas>
          </div>
        </div>
        
        <!-- Popular Products -->
        <div class="admin-chart-card">
          <h3>Productos Más Vendidos</h3>
          <div class="chart-wrapper">
            <canvas id="chart-top-products"></canvas>
          </div>
        </div>
      </section>

      <section class="admin-charts-grid">
        <!-- Daily sales history -->
        <div class="admin-chart-card">
          <h3>Ventas Semanales / Diarias</h3>
          <div class="chart-wrapper">
            <canvas id="chart-sales-daily"></canvas>
          </div>
        </div>

        <!-- Expiration warning lists -->
        <div class="admin-chart-card">
          <h3>Clientes Frecuentes</h3>
          <div class="chart-wrapper">
            <canvas id="chart-frequent-customers"></canvas>
          </div>
        </div>
      </section>

      <!-- Critical Stock / Expiration lists -->
      <div class="grid grid-2 gap-15">
        <div class="admin-card">
          <h3 class="admin-card-title flex align-center gap-05" style="color:var(--danger-color); margin-bottom:1rem;">
            <i data-lucide="package-x"></i> Alertas de Stock Bajo
          </h3>
          <div class="admin-table-wrapper">
            <table class="admin-table text-sm">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock actual</th>
                  <th>Categoría</th>
                </tr>
              </thead>
              <tbody>
                ${allProducts.filter(p => p.stock <= 5).map(p => `
                  <tr>
                    <td class="font-semibold">${p.name.es || p.name}</td>
                    <td class="text-danger font-bold">${p.stock} pzas</td>
                    <td>${p.category.es || p.category}</td>
                  </tr>
                `).join('') || `<tr><td colspan="3" class="text-center text-muted">Todos los productos tienen buen stock.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <div class="admin-card">
          <h3 class="admin-card-title flex align-center gap-05" style="color:var(--warning-color); margin-bottom:1rem;">
            <i data-lucide="calendar-off"></i> Alertas de Caducidad (Próximos 30 días)
          </h3>
          <div class="admin-table-wrapper">
            <table class="admin-table text-sm">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Vencimiento</th>
                  <th>Días restantes</th>
                </tr>
              </thead>
              <tbody>
                ${allProducts.filter(p => {
                  if (!p.expiryDate) return false;
                  const diff = new Date(p.expiryDate).getTime() - todayTime;
                  return diff > 0 && diff <= (30 * 24 * 60 * 60 * 1000);
                }).map(p => {
                  const diffDays = Math.ceil((new Date(p.expiryDate).getTime() - todayTime) / (24 * 60 * 60 * 1000));
                  return `
                    <tr>
                      <td class="font-semibold">${p.name.es || p.name}</td>
                      <td>${p.expiryDate}</td>
                      <td class="text-warning font-bold">${diffDays} días</td>
                    </tr>
                  `;
                }).join('') || `<tr><td colspan="3" class="text-center text-muted">Ningún producto próximo a vencer.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Dashboard Charts drawing using Chart.js library
function drawDashboardCharts() {
  const ctxMonthly = document.getElementById('chart-sales-monthly');
  const ctxTop = document.getElementById('chart-top-products');
  const ctxDaily = document.getElementById('chart-sales-daily');
  const ctxFreq = document.getElementById('chart-frequent-customers');

  if (!ctxMonthly || !ctxTop || !ctxDaily || !ctxFreq) return;

  // Destroy previous charts if active
  Object.keys(charts).forEach(key => {
    if (charts[key]) {
      try {
        charts[key].destroy();
      } catch (err) {
        console.warn("Error destroying chart instance:", err);
      }
      charts[key] = null;
    }
  });

  // Data processing: Monthly sales (last 6 months)
  const monthlyData = {};
  allOrders.filter(o => o.status !== "Cancelado").forEach(o => {
    const month = o.date.substring(0, 7); // YYYY-MM
    monthlyData[month] = (monthlyData[month] || 0) + o.total;
  });
  const monthLabels = Object.keys(monthlyData).sort();
  const monthValues = monthLabels.map(l => monthlyData[l]);

  charts.salesMonthly = new Chart(ctxMonthly, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{
        label: 'Ventas (S/.)',
        data: monthValues,
        borderColor: '#0F4C3A',
        backgroundColor: 'rgba(15, 76, 58, 0.1)',
        tension: 0.3,
        fill: true,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });

  // Data processing: Top products sold
  const productQuantities = {};
  allOrders.filter(o => o.status !== "Cancelado").forEach(o => {
    o.items.forEach(item => {
      const name = item.name.es || item.name;
      productQuantities[name] = (productQuantities[name] || 0) + item.quantity;
    });
  });
  const sortedProds = Object.keys(productQuantities).sort((a, b) => productQuantities[b] - productQuantities[a]).slice(0, 5);
  const prodValues = sortedProds.map(p => productQuantities[p]);

  charts.topProducts = new Chart(ctxTop, {
    type: 'doughnut',
    data: {
      labels: sortedProds,
      datasets: [{
        data: prodValues,
        backgroundColor: ['#0F4C3A', '#D4AF37', '#2e7d32', '#f57c00', '#c62828']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 8,
            font: { size: 10 }
          }
        }
      }
    }
  });

  // Data processing: Daily sales (last 7 days)
  const dailyData = {};
  // Get last 7 days list
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyData[dateStr] = 0;
  }
  allOrders.filter(o => o.status !== "Cancelado").forEach(o => {
    if (o.date in dailyData) {
      dailyData[o.date] += o.total;
    }
  });
  const dailyLabels = Object.keys(dailyData).sort();
  const dailyValues = dailyLabels.map(l => dailyData[l]);

  charts.salesDaily = new Chart(ctxDaily, {
    type: 'bar',
    data: {
      labels: dailyLabels.map(l => l.substring(5)), // MM-DD
      datasets: [{
        label: 'Ventas Diarias (S/.)',
        data: dailyValues,
        backgroundColor: '#D4AF37'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });

  // Data processing: Customer Engagement
  const customerOrdersMap = {};
  allOrders.forEach(o => {
    if (!o.customerId || o.customerId === "anonymous-client") return;
    customerOrdersMap[o.customerId] = (customerOrdersMap[o.customerId] || 0) + 1;
  });
  const sortedCustomerIds = Object.keys(customerOrdersMap).sort((a, b) => customerOrdersMap[b] - customerOrdersMap[a]).slice(0, 5);
  const customerNames = sortedCustomerIds.map(id => {
    const c = allCustomers.find(cust => cust.uid === id);
    return c ? c.name : 'Cliente Registrado';
  });
  const customerCounts = sortedCustomerIds.map(id => customerOrdersMap[id]);

  charts.frequentCustomers = new Chart(ctxFreq, {
    type: 'bar',
    data: {
      labels: customerNames,
      datasets: [{
        label: 'Número de pedidos',
        data: customerCounts,
        backgroundColor: '#0F4C3A'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

// ==========================================================================
// 2. PRODUCTS TAB VIEW
// ==========================================================================
function renderProductsTab() {
  return `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Listado de Artículos</h3>
        <button id="add-product-btn" class="btn btn-primary btn-sm flex align-center gap-05">
          <i data-lucide="plus"></i> Crear Producto
        </button>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Código / ID</th>
              <th>Nombre (ES)</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Vencimiento</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${allProducts.map(p => `
              <tr data-id="${p.id}">
                <td><img src="${p.image}" alt="${p.name.es || p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);"></td>
                <td class="font-semibold">${p.id}</td>
                <td>${p.name.es || p.name}</td>
                <td class="font-bold">
                  ${p.salePrice && p.salePrice < p.price
                    ? `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.8rem; display: block;">S/. ${p.price.toFixed(2)}</span>
                       <span style="color: var(--danger-color);">S/. ${p.salePrice.toFixed(2)}</span>`
                    : `S/. ${p.price.toFixed(2)}`
                  }
                </td>
                <td class="${p.stock <= 5 ? 'text-danger font-bold' : ''}">${p.stock} pzas</td>
                <td>${p.expiryDate || 'N/A'}</td>
                <td>${p.category.es || p.category}</td>
                <td class="admin-actions-cell">
                  <button class="btn btn-secondary btn-sm edit-prod-btn" data-id="${p.id}" title="Editar"><i data-lucide="edit-2"></i></button>
                  <button class="btn btn-secondary-outline btn-sm delete-prod-btn" data-id="${p.id}" title="Eliminar"><i data-lucide="trash-2"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openProductModal(product = null) {
  const modal = document.getElementById('admin-modal');
  const container = document.getElementById('admin-modal-container');
  if (!modal || !container) return;

  container.style.maxWidth = '900px';

  const isEdit = !!product;
  let productImages = product?.images || (product?.image ? [product.image] : []);

  container.innerHTML = `
    <div class="admin-modal-header">
      <h3>${isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
      <button class="admin-modal-close" onclick="document.getElementById('admin-modal').classList.remove('active')">&times;</button>
    </div>
    <form id="product-form" class="admin-form-grid">
      <div class="admin-form-group">
        <label for="prod-id">Código / Slug ID</label>
        <input type="text" id="prod-id" value="${product?.id || ''}" ${isEdit ? 'disabled' : 'required'} placeholder="ej: acai-premium">
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0;">
        <div class="admin-form-group" style="margin-bottom: 0;">
          <label for="prod-price">Precio Normal (S/.)</label>
          <input type="number" id="prod-price" value="${product?.price || ''}" step="0.1" min="0" required placeholder="0.00">
        </div>
        <div class="admin-form-group" style="margin-bottom: 0;">
          <label for="prod-sale-price">Precio Oferta (S/.) (Opcional)</label>
          <input type="number" id="prod-sale-price" value="${product?.salePrice || ''}" step="0.1" min="0" placeholder="0.00">
        </div>
      </div>

      <div class="admin-form-group">
        <label for="prod-name-es">Nombre (Español)</label>
        <input type="text" id="prod-name-es" value="${product?.name?.es || product?.name || ''}" required placeholder="Nombre en español">
      </div>
      <div class="admin-form-group">
        <label for="prod-name-pt">Nombre (Portugués)</label>
        <input type="text" id="prod-name-pt" value="${product?.name?.pt || ''}" required placeholder="Nombre en portugués">
      </div>

      <div class="admin-form-group col-span-2">
        <label for="prod-desc-es">Descripción (Español)</label>
        <textarea id="prod-desc-es" rows="3" required placeholder="Descripción corta en español">${product?.description?.es || ''}</textarea>
      </div>
      <div class="admin-form-group col-span-2">
        <label for="prod-desc-pt">Descripción (Portugués)</label>
        <textarea id="prod-desc-pt" rows="3" required placeholder="Descripción corta en portugués">${product?.description?.pt || ''}</textarea>
      </div>

      <div class="admin-form-group col-span-2">
        <label for="prod-ing-es">Ingredientes (Español)</label>
        <input type="text" id="prod-ing-es" value="${product?.ingredients?.es || ''}" placeholder="Separados por comas">
      </div>
      <div class="admin-form-group col-span-2">
        <label for="prod-ing-pt">Ingredientes (Portugués)</label>
        <input type="text" id="prod-ing-pt" value="${product?.ingredients?.pt || ''}" placeholder="Separados por comas">
      </div>

      <div class="admin-form-group">
        <label for="prod-stock">Stock Inicial</label>
        <input type="number" id="prod-stock" value="${product?.stock ?? ''}" min="0" required placeholder="0">
      </div>
      <div class="admin-form-group">
        <label for="prod-expiry">Fecha de Vencimiento</label>
        <input type="date" id="prod-expiry" value="${product?.expiryDate || ''}">
      </div>

      <div class="admin-form-group">
        <label for="prod-cat">Categoría</label>
        <select id="prod-cat" required>
          ${allCategories.map(c => `<option value="${c.id}" ${product?.category?.es === c.id || product?.category === c.id ? 'selected' : ''}>${c.name.es}</option>`).join('')}
        </select>
      </div>
      <div class="admin-form-group">
        <label for="prod-weight">Contenido Neto / Peso</label>
        <input type="text" id="prod-weight" value="${product?.weight || ''}" placeholder="ej: 500g, 350ml">
      </div>

      <div class="admin-form-group col-span-2" style="justify-content: flex-start; align-items: center;">
        <label class="filter-checkbox-label" style="gap: 0.5rem; cursor: pointer; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center;">
          <input type="checkbox" id="prod-featured" ${product?.tags?.es?.includes('Destacado') ? 'checked' : ''}>
          <i data-lucide="star" style="width: 16px; height: 16px; color: var(--accent-color);"></i> Producto Destacado
        </label>
      </div>

      <div class="admin-form-group col-span-2" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
        <label style="font-weight: 700; margin-bottom: 0.75rem; display: block;">Galería de Imágenes del Producto</label>
        <div id="admin-images-container" class="flex flex-col gap-1 w-full">
          <!-- Dinámicamente inyectado -->
        </div>
        <button type="button" id="admin-add-image-btn" class="btn btn-secondary btn-sm flex align-center gap-05" style="margin-top: 1rem; align-self: flex-start;">
          <i data-lucide="plus"></i> Añadir otra imagen
        </button>
      </div>

      <div class="admin-form-actions col-span-2" style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-modal').classList.remove('active')">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `;

  modal.classList.add('active');

  // Render function for images list inputs
  function renderProductImageRows() {
    const imagesContainer = document.getElementById('admin-images-container');
    if (!imagesContainer) return;

    if (productImages.length === 0) {
      productImages.push(''); // Al menos un renglón
    }

    imagesContainer.innerHTML = productImages.map((imgUrl, index) => {
      const previewSrc = imgUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';
      return `
        <div class="admin-image-row flex align-center gap-1" data-index="${index}" style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: var(--radius-md); background: rgba(0,0,0,0.01); width: 100%;">
          <img src="${previewSrc}" alt="Preview" class="admin-image-preview" id="preview-img-${index}" style="width: 55px; height: 55px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          
          <div class="flex flex-col gap-05 flex-1">
            <div class="flex gap-05 align-center mobile-stack w-full">
              <input type="text" class="prod-img-url-input font-mono text-xs w-full" id="img-url-${index}" value="${imgUrl}" placeholder="https://..." style="padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border-color);">
              <span class="text-xs text-muted">o</span>
              <div class="admin-file-input-wrapper" style="position: relative; overflow: hidden; display: inline-block;">
                <button type="button" class="btn btn-secondary btn-sm" style="white-space: nowrap;">Subir Archivo</button>
                <input type="file" class="prod-img-file-input" id="img-file-${index}" accept="image/*" style="position: absolute; font-size: 100px; opacity: 0; right: 0; top: 0; cursor: pointer;">
              </div>
            </div>
          </div>
          
          <button type="button" class="btn btn-secondary-outline btn-sm delete-image-row-btn" data-index="${index}" style="padding: 0; width: 32px; height: 32px; border-radius: 50%; font-size: 1.2rem; line-height: 1; display: flex; align-items: center; justify-content: center;" title="Eliminar foto">
            &times;
          </button>
        </div>
      `;
    }).join('');

    // Bind URL input changes
    imagesContainer.querySelectorAll('.prod-img-url-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.id.replace('img-url-', ''));
        productImages[idx] = e.target.value.trim();
        const preview = document.getElementById(`preview-img-${idx}`);
        if (preview && e.target.value.trim()) {
          preview.src = e.target.value.trim();
        }
      });
    });

    // Bind File changes
    imagesContainer.querySelectorAll('.prod-img-file-input').forEach(fileInput => {
      fileInput.addEventListener('change', (e) => {
        const idx = parseInt(fileInput.id.replace('img-file-', ''));
        const file = e.target.files[0];
        if (file) {
          const preview = document.getElementById(`preview-img-${idx}`);
          if (preview) {
            preview.src = URL.createObjectURL(file);
          }
        }
      });
    });

    // Bind delete row action
    imagesContainer.querySelectorAll('.delete-image-row-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        productImages.splice(idx, 1);
        renderProductImageRows();
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { class: 'lucide-icon' }
      });
    }
  }

  renderProductImageRows();

  // Add new image row action
  const addImageBtn = document.getElementById('admin-add-image-btn');
  if (addImageBtn) {
    addImageBtn.addEventListener('click', () => {
      productImages.push('');
      renderProductImageRows();
    });
  }

  // Submit form handler
  const form = document.getElementById('product-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('prod-id').value.trim();
      const price = parseFloat(document.getElementById('prod-price').value);
      const salePriceValue = document.getElementById('prod-sale-price').value.trim();
      const salePrice = salePriceValue ? parseFloat(salePriceValue) : null;
      
      const nameEs = document.getElementById('prod-name-es').value.trim();
      const namePt = document.getElementById('prod-name-pt').value.trim();
      const descEs = document.getElementById('prod-desc-es').value.trim();
      const descPt = document.getElementById('prod-desc-pt').value.trim();
      const ingEs = document.getElementById('prod-ing-es').value.trim();
      const ingPt = document.getElementById('prod-ing-pt').value.trim();
      const stock = parseInt(document.getElementById('prod-stock').value);
      const expiry = document.getElementById('prod-expiry').value;
      const catId = document.getElementById('prod-cat').value;
      const weight = document.getElementById('prod-weight').value.trim();

      const chosenCategory = allCategories.find(c => c.id === catId);
      const categoryMap = chosenCategory ? chosenCategory.name : { es: catId, pt: catId };

      AppStore.showToast(isEdit ? "Actualizando producto..." : "Creando producto...", "info");

      const imagesList = [];
      const imageRows = document.querySelectorAll('.admin-image-row');

      // Process each row to gather URLs or upload files
      for (let idx = 0; idx < imageRows.length; idx++) {
        const row = imageRows[idx];
        const urlInput = row.querySelector('.prod-img-url-input');
        const fileInput = row.querySelector('.prod-img-file-input');
        
        let finalUrl = urlInput ? urlInput.value.trim() : '';
        const file = fileInput?.files?.[0];
        
        if (file) {
          try {
            // Upload to Storage with indexed unique name to prevent collisions
            const uniqueIdName = `${id}_img_${idx}_${Date.now()}`;
            finalUrl = await firebaseService.uploadProductImage(file, uniqueIdName);
          } catch (uploadErr) {
            console.error("Storage upload failed for row index", idx, uploadErr);
          }
        }
        
        if (finalUrl) {
          imagesList.push(finalUrl);
        }
      }

      if (imagesList.length === 0) {
        imagesList.push("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600"); // placeholder
      }

      const productDoc = {
        id,
        price,
        salePrice: (salePrice !== null && salePrice > 0 && salePrice < price) ? salePrice : null,
        stock,
        expiryDate: expiry || "",
        image: imagesList[0], // fallback image principal
        images: imagesList,   // array completo de imágenes
        rating: product?.rating || 5.0,
        reviewsCount: product?.reviewsCount || 0,
        weight: weight,
        name: { es: nameEs, pt: namePt },
        category: categoryMap,
        description: { es: descEs, pt: descPt },
        ingredients: { es: ingEs, pt: ingPt },
        tags: buildProductTags(product, document.getElementById('prod-featured').checked)
      };

      try {
        if (isEdit) {
          await firebaseService.updateProduct(id, productDoc);
          AppStore.showToast("Producto actualizado exitosamente.", "success");
        } else {
          await firebaseService.addProduct(productDoc);
          AppStore.showToast("Producto creado exitosamente.", "success");
        }

        modal.classList.remove('active');
        // Refresh product list and events locally
        allProducts = await firebaseService.fetchProducts();
        const contentEl = document.getElementById('admin-tab-content');
        if (contentEl) contentEl.innerHTML = renderProductsTab();
        initTabEvents('products');
      } catch (err) {
        console.error("Error saving product:", err);
        AppStore.showToast("Error al guardar el producto en Firestore.", "error");
      }
    });
  }
}

// ==========================================================================
// 3. CATEGORIES TAB VIEW
// ==========================================================================
function renderCategoriesTab() {
  return `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Categorías del Negocio</h3>
        <button id="add-category-btn" class="btn btn-primary btn-sm flex align-center gap-05">
          <i data-lucide="plus"></i> Crear Categoría
        </button>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Nombre (ES)</th>
              <th>Nombre (PT)</th>
              <th>Icono / Ilustración</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${allCategories.map(c => `
              <tr data-id="${c.id}">
                <td class="font-semibold">${c.id}</td>
                <td>${c.name.es}</td>
                <td>${c.name.pt}</td>
                <td><img src="${c.image}" alt="${c.name.es}" style="width: 40px; height: 40px; object-fit: contain; border-radius: var(--radius-sm);"></td>
                <td class="admin-actions-cell">
                  <button class="btn btn-secondary btn-sm edit-cat-btn" data-id="${c.id}" title="Editar"><i data-lucide="edit-2"></i></button>
                  <button class="btn btn-secondary-outline btn-sm delete-cat-btn" data-id="${c.id}" title="Eliminar"><i data-lucide="trash-2"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openCategoryModal(category = null) {
  const modal = document.getElementById('admin-modal');
  const container = document.getElementById('admin-modal-container');
  if (!modal || !container) return;

  container.style.maxWidth = '650px';

  const isEdit = !!category;

  // Filter products belonging to this category
  const categoryProducts = category
    ? allProducts.filter(p => {
        const prodCat = p.category?.es || p.category;
        return prodCat === category.id;
      })
    : [];

  container.innerHTML = `
    <div class="admin-modal-header">
      <h3>${isEdit ? 'Editar Categoría' : 'Crear Nueva Categoría'}</h3>
      <button class="admin-modal-close" onclick="document.getElementById('admin-modal').classList.remove('active')">&times;</button>
    </div>
    <form id="category-form" class="admin-form-grid">
      <div class="admin-form-group col-span-2">
        <label for="cat-id">Identificador de Código (ID)</label>
        <input type="text" id="cat-id" value="${category?.id || ''}" ${isEdit ? 'disabled' : 'required'} placeholder="ej: Gourmet, Bebidas, Dulces">
      </div>
      <div class="admin-form-group">
        <label for="cat-name-es">Nombre (Español)</label>
        <input type="text" id="cat-name-es" value="${category?.name?.es || ''}" required placeholder="Nombre de categoría en español">
      </div>
      <div class="admin-form-group">
        <label for="cat-name-pt">Nombre (Portugués)</label>
        <input type="text" id="cat-name-pt" value="${category?.name?.pt || ''}" required placeholder="Nombre de categoría en portugués">
      </div>
      
      ${categoryProducts.length > 0 ? `
        <div class="admin-form-group col-span-2">
          <label for="cat-product-img-select">Usar foto de un producto de esta categoría:</label>
          <select id="cat-product-img-select" style="width: 100%;">
            <option value="">-- Usar imagen personalizada (escribir URL abajo) --</option>
            ${categoryProducts.map(p => {
              const isSelected = p.image === category?.image;
              return `<option value="${p.image}" ${isSelected ? 'selected' : ''}>${p.name.es || p.name}</option>`;
            }).join('')}
          </select>
        </div>
      ` : ''}

      <div class="admin-form-group col-span-2">
        <label for="cat-img">Ilustración / Ruta de Imagen</label>
        <div style="display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; width: 100%;">
          <img id="cat-img-preview" src="${category?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'}" alt="Preview" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: white; flex-shrink: 0;">
          <input type="text" id="cat-img" value="${category?.image || ''}" required placeholder="ej: assets/images/coffee.png" style="flex: 1;">
        </div>
      </div>

      <div class="admin-form-actions col-span-2">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-modal').classList.remove('active')">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `;

  modal.classList.add('active');

  const productImgSelect = document.getElementById('cat-product-img-select');
  const catImgInput = document.getElementById('cat-img');
  const catImgPreview = document.getElementById('cat-img-preview');

  const toggleUrlInputVisibility = () => {
    if (!productImgSelect || !catImgInput) return;
    if (productImgSelect.value) {
      catImgInput.style.display = 'none';
      catImgInput.required = false;
    } else {
      catImgInput.style.display = 'block';
      catImgInput.required = true;
    }
  };

  if (productImgSelect && catImgInput && catImgPreview) {
    productImgSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        catImgInput.value = val;
        catImgPreview.src = val;
      }
      toggleUrlInputVisibility();
    });
  }

  if (catImgInput && catImgPreview) {
    catImgInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        catImgPreview.src = val;
      }
    });
  }

  // Initial check to hide input if a product image is selected
  toggleUrlInputVisibility();

  const form = document.getElementById('category-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('cat-id').value.trim();
      const nameEs = document.getElementById('cat-name-es').value.trim();
      const namePt = document.getElementById('cat-name-pt').value.trim();
      const image = document.getElementById('cat-img').value.trim();

      const catDoc = {
        id,
        name: { es: nameEs, pt: namePt },
        image
      };

      try {
        if (isEdit) {
          await firebaseService.updateCategory(id, catDoc);
          AppStore.showToast("Categoría actualizada.", "success");
        } else {
          await firebaseService.addCategory(catDoc);
          AppStore.showToast("Categoría creada.", "success");
        }
        modal.classList.remove('active');
        // Refresh category list and events locally
        allCategories = await firebaseService.fetchCategories();
        const contentEl = document.getElementById('admin-tab-content');
        if (contentEl) contentEl.innerHTML = renderCategoriesTab();
        initTabEvents('categories');
      } catch (err) {
        console.error(err);
        AppStore.showToast("Error al guardar la categoría.", "error");
      }
    });
  }
}

// ==========================================================================
// 4. ORDERS TAB VIEW
// ==========================================================================
function renderOrdersTab() {
  return `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Pedidos del E-Commerce</h3>
        <div class="flex gap-05 align-center flex-wrap">
          <input type="date" id="order-date-from" style="padding:0.4rem; border:1px solid var(--border-color); border-radius:var(--radius-md); font-size:0.85rem;">
          <input type="date" id="order-date-to" style="padding:0.4rem; border:1px solid var(--border-color); border-radius:var(--radius-md); font-size:0.85rem;">
          <input type="text" id="order-search" placeholder="Buscar por código o nombre..." style="padding:0.4rem 0.8rem; border:1px solid var(--border-color); border-radius:var(--radius-md); font-size:0.85rem;">
          <select id="order-status-filter" style="padding:0.4rem; border:1px solid var(--border-color); border-radius:var(--radius-md); font-size:0.85rem;">
            <option value="all">Todos los estados</option>
            <option value="En preparación">En preparación</option>
            <option value="En camino">En camino</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <select id="order-payment-filter" style="padding:0.4rem; border:1px solid var(--border-color); border-radius:var(--radius-md); font-size:0.85rem;">
            <option value="all">Todos los pagos</option>
            <option value="paid">Pagado</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table" id="admin-orders-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Distrito</th>
              <th>Monto Total</th>
              <th>Entrega Programada</th>
              <th>Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${renderOrdersTableRows(allOrders)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderOrdersTableRows(ordersList) {
  return ordersList.map(o => {
    let statusClass = 'status-preparation';
    if (o.status === "En camino") statusClass = 'status-shipping';
    if (o.status === "Entregado") statusClass = 'status-delivered';
    if (o.status === "Cancelado") statusClass = 'status-cancelled';

    const clientName = escapeHTML(o.shipping?.name || 'Invitado');
    const district = escapeHTML(o.shipping?.district || 'No especificado');
    const deliveryDate = escapeHTML(o.shipping?.deliveryDate || 'Hoy');
    const slotStr = escapeHTML(o.shipping?.timeSlot || 'Por definir');
    const isPaid = o.paymentStatus === 'paid';
    const payClass = isPaid ? 'status-delivered' : 'status-cancelled';
    const payLabel = isPaid ? 'Pagado' : 'Pendiente';

    return `
      <tr data-id="${o.docId}">
        <td class="font-semibold">${escapeHTML(o.id)}</td>
        <td>${escapeHTML(o.date)}</td>
        <td>${clientName}</td>
        <td>${district}</td>
        <td class="font-bold">S/. ${o.total.toFixed(2)}</td>
        <td>
          <div style="display:flex; flex-direction:column; gap:2px; font-size:0.85rem;">
            <span style="display:inline-flex; align-items:center; gap:4px; font-weight:600;"><i data-lucide="calendar" style="width:12px; height:12px;"></i> ${deliveryDate}</span>
            <span style="display:inline-flex; align-items:center; gap:4px;" class="text-muted"><i data-lucide="clock" style="width:12px; height:12px;"></i> ${slotStr}</span>
          </div>
        </td>
        <td>
          <span class="badge-status ${payClass}" style="cursor:default;">${payLabel}</span>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px; font-weight:500;">
            ${escapeHTML(o.paymentMethod || 'No especificado')}
          </div>
        </td>
        <td><span class="badge-status ${statusClass}">${escapeHTML(o.status)}</span></td>
        <td>
          <div class="flex gap-05 align-center" style="display: flex; gap: 0.5rem; align-items: center;">
            ${!isPaid ? `<button class="btn btn-success btn-sm mark-paid-btn" data-id="${o.docId}" title="Confirmar Pago Recibido" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:var(--success-color); color:white; border:none; border-radius:var(--radius-sm); cursor:pointer;">Confirmar</button>` : ''}
            <select class="change-status-select" data-id="${o.docId}" style="padding:0.25rem 0.5rem; font-size:0.8rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <option value="En preparación" ${o.status === 'En preparation' || o.status === 'En preparación' ? 'selected' : ''}>Preparar</option>
              <option value="En camino" ${o.status === 'En camino' ? 'selected' : ''}>Despachar</option>
              <option value="Entregado" ${o.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
              <option value="Cancelado" ${o.status === 'Cancelado' ? 'selected' : ''}>Cancelar</option>
            </select>
            <button class="btn btn-secondary btn-sm view-admin-order-details-btn" data-id="${o.docId}" title="Ver Detalles" style="padding: 0.35rem 0.6rem;">
              <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
            </button>
            ${o.voucherUrl ? `<i data-lucide="file-check" class="text-success" title="Comprobante adjuntado" style="width:18px; height:18px;"></i>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="9" class="text-center text-muted">No se encontraron pedidos.</td></tr>`;
}

function openAdminOrderDetailsModal(orderDocId) {
  const modal = document.getElementById('admin-modal');
  const container = document.getElementById('admin-modal-container');
  if (!modal || !container) return;

  container.style.maxWidth = '850px';

  const order = allOrders.find(o => o.docId === orderDocId);
  if (!order) {
    AppStore.showToast("No se pudo encontrar la información del pedido.", "error");
    return;
  }

  const clientName = escapeHTML(order.shipping?.name || 'Invitado');
  const phone = escapeHTML(order.shipping?.phone || 'No especificado');
  const email = escapeHTML(order.shipping?.email || 'No especificado');
  const address = escapeHTML(order.shipping?.address || 'No especificado');
  const notes = escapeHTML(order.shipping?.notes || 'Ninguna');
  const deliveryDate = escapeHTML(order.shipping?.deliveryDate || 'Hoy/Inmediato');
  const slotStr = escapeHTML(order.shipping?.timeSlot || 'Por definir');

  container.innerHTML = `
    <div class="admin-modal-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
      <h3>Detalles del Pedido: ${escapeHTML(order.id)}</h3>
      <button class="admin-modal-close" onclick="document.getElementById('admin-modal').classList.remove('active')">&times;</button>
    </div>
    <div class="admin-order-detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem; text-align: left;">
      <!-- Col 1: Shipping and client info -->
      <div style="background: var(--bg-color); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color);">
        <h4 style="margin-bottom: 0.75rem; color: var(--primary-color); border-bottom: 1px dashed var(--border-color); padding-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="user"></i> Información del Cliente</h4>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Cliente:</strong> ${clientName}</p>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Documento:</strong> ${escapeHTML(order.shipping?.dni || 'No registrado')}</p>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Email:</strong> ${email}</p>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Teléfono:</strong> ${phone}</p>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Dirección:</strong> ${address}</p>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Fecha de Entrega:</strong> ${deliveryDate}</p>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Horario de Entrega:</strong> ${slotStr}</p>
        ${order.shipping?.district === 'Provincia (Shalom)' ? `
          <p class="text-sm" style="margin-bottom: 0.4rem; color: var(--primary-color);"><strong>Departamento:</strong> ${escapeHTML(order.shipping.department || 'N/A')}</p>
          <p class="text-sm" style="margin-bottom: 0.4rem; color: var(--primary-color);"><strong>Provincia:</strong> ${escapeHTML(order.shipping.province || 'N/A')}</p>
          <p class="text-sm" style="margin-bottom: 0.4rem; color: var(--primary-color);"><strong>Distrito Destino:</strong> ${escapeHTML(order.shipping.districtProv || 'N/A')}</p>
          <p class="text-sm" style="margin-bottom: 0.4rem; color: var(--primary-color);"><strong>Despacho Shalom:</strong> ${order.shipping.isHomeDelivery ? 'A Domicilio (+ S/. 10)' : 'Recojo en Oficina'}</p>
          ${order.shipping.isHomeDelivery 
            ? `<p class="text-sm" style="margin-bottom: 0.4rem; color: var(--primary-color);"><strong>Dirección de Entrega:</strong> ${escapeHTML(order.shipping.shalomHomeAddress || 'N/A')}</p>`
            : `<p class="text-sm" style="margin-bottom: 0.4rem; color: var(--primary-color);"><strong>Agencia Shalom:</strong> ${escapeHTML(order.shipping.agencyName || 'N/A')}</p>`
          }
        ` : ''}
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Método de Pago:</strong> ${escapeHTML(order.paymentMethod)}</p>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Estado del Pago:</strong> <span style="color: ${order.paymentStatus === 'paid' ? 'var(--success-color)' : 'var(--danger-color)'};">${order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}</span></p>
        <p class="text-sm" style="margin-bottom: 0.4rem;"><strong>Notas:</strong> ${notes}</p>
      </div>

      <!-- Col 2: Voucher / Payment Verification -->
      <div style="background: var(--bg-color); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column;">
        <h4 style="margin-bottom: 0.75rem; color: var(--primary-color); border-bottom: 1px dashed var(--border-color); padding-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="credit-card"></i> Comprobante de Pago</h4>
        ${order.voucherUrl 
          ? `
            <div class="voucher-preview-wrapper" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; background: var(--surface-color); text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 180px;">
              ${order.voucherUrl.toLowerCase().includes('.pdf') 
                ? `<a href="${order.voucherUrl}" target="_blank" class="btn btn-secondary-outline btn-sm" style="margin: 1.5rem 0;"><i data-lucide="file-text" style="margin-right: 6px; width: 16px; height: 16px;"></i> Ver documento PDF</a>`
                : `<img src="${order.voucherUrl}" alt="Comprobante" style="max-height: 140px; max-width: 100%; object-fit: contain; cursor: zoom-in; border-radius: 4px;" onclick="window.open('${order.voucherUrl}', '_blank')">`
              }
              <div style="margin-top: 0.5rem; width: 100%; border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: flex; gap: 0.5rem; justify-content: center;">
                <a href="${order.voucherUrl}" target="_blank" class="btn-link text-xs flex align-center justify-center gap-02" style="font-size: 0.8rem;"><i data-lucide="external-link" style="width: 14px; height: 14px;"></i> Abrir en pantalla completa</a>
                <button class="btn-link text-xs text-danger flex align-center justify-center gap-02" style="font-size: 0.8rem; color: var(--danger-color);" onclick="deleteOrderVoucher('${order.docId}', '${order.voucherUrl}')"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Eliminar comprobante</button>
              </div>
            </div>
          `
          : `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 2rem 0; color: var(--text-muted);">
              <i data-lucide="alert-circle" style="width: 36px; height: 36px; margin-bottom: 0.5rem; opacity: 0.6;"></i>
              <p class="text-sm">No se subió ningún comprobante para este pedido.</p>
            </div>
          `
        }
      </div>

      <!-- Full width: Items Purchased -->
      <div class="col-span-2" style="grid-column: span 2; margin-top: 0.5rem;">
        <h4 style="margin-bottom: 0.75rem; color: var(--primary-color); border-bottom: 1px dashed var(--border-color); padding-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="shopping-bag"></i> Artículos Comprados</h4>
        <div class="admin-table-wrapper" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
          <table class="admin-table text-sm" style="margin: 0;">
            <thead>
              <tr style="background: var(--bg-color);">
                <th>Producto</th>
                <th>Precio unitario</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td class="font-semibold">${item.name.es || item.name}</td>
                  <td>S/. ${item.price.toFixed(2)}</td>
                  <td>${item.quantity} uds</td>
                  <td class="font-bold">S/. ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid var(--border-color); font-weight: bold; background: var(--bg-color);">
                <td colspan="3" class="text-right" style="text-align: right; padding-right: 1.5rem;">Total General:</td>
                <td style="color: var(--primary-color); font-size: 1.1rem;">S/. ${order.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="admin-modal-actions" style="margin-top: 2rem; text-align: right; border-top: 1px solid var(--border-color); padding-top: 1rem;">
      <button class="btn btn-primary" onclick="document.getElementById('admin-modal').classList.remove('active')">Cerrar Detalles</button>
    </div>
  `;

  modal.classList.add('active');
  
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: 'lucide-icon' }
    });
  }
}

window.deleteOrderVoucher = async function(docId, voucherUrl) {
  if (!confirm("¿Eliminar el comprobante de pago? Esta acción liberará espacio en Storage.")) return;
  try {
    await firebaseService.deleteOrderVoucher(docId, voucherUrl);
    AppStore.showToast("Comprobante eliminado.", "success");
    const modal = document.getElementById('admin-modal');
    if (modal) modal.classList.remove('active');
    window.location.hash = '#/admin';
  } catch (err) {
    console.error(err);
    AppStore.showToast("Error al eliminar comprobante.", "error");
  }
};

// ==========================================================================
// 5. CUSTOMERS TAB VIEW
// ==========================================================================
function renderCustomersTab() {
  return `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Listado de Clientes Registrados</h3>
        <input type="text" id="customer-search" placeholder="Buscar por nombre o correo..." style="padding:0.4rem 0.8rem; border:1px solid var(--border-color); border-radius:var(--radius-md); font-size:0.85rem;">
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table" id="admin-customers-table">
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>Correo electrónico</th>
              <th>Teléfono</th>
              <th>Dirección de envío</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${renderCustomersTableRows(allCustomers)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCustomersTableRows(customersList) {
  return customersList.map(c => `
    <tr data-uid="${escapeHTML(c.uid)}">
      <td class="font-semibold">${escapeHTML(c.name)}</td>
      <td>${escapeHTML(c.email)}</td>
      <td>${escapeHTML(c.phone || 'N/A')}</td>
      <td>${escapeHTML(c.address || 'Sin dirección registrada')}</td>
      <td>
        <button class="btn btn-secondary btn-sm view-customer-history-btn" data-uid="${escapeHTML(c.uid)}" data-name="${escapeHTML(c.name)}">
          <i data-lucide="eye"></i> Historial
        </button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="5" class="text-center text-muted">No se encontraron clientes registrados.</td></tr>`;
}

async function showCustomerHistoryModal(uid, name) {
  const modal = document.getElementById('customer-orders-modal');
  const body = document.getElementById('customer-modal-body');
  const title = document.getElementById('customer-modal-title');
  if (!modal || !body || !title) return;

  title.textContent = `Historial de Pedidos: ${name}`;
  body.innerHTML = `<div class="text-center" style="padding:2rem;"><div class="payment-spinner" style="margin:0 auto;"></div></div>`;
  modal.classList.add('active');

  try {
    const orders = await firebaseService.fetchOrders(uid, "client");
    if (orders.length === 0) {
      body.innerHTML = `<p class="text-muted text-center" style="padding:2rem;">Este cliente aún no ha realizado ninguna compra.</p>`;
      return;
    }

    body.innerHTML = `
      <div class="admin-table-wrapper">
        <table class="admin-table text-sm">
          <thead>
            <tr>
              <th>Código</th>
              <th>Fecha</th>
              <th>Artículos</th>
              <th>Monto Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => {
              let statusClass = 'status-preparation';
              if (o.status === "En camino") statusClass = 'status-shipping';
              if (o.status === "Entregado") statusClass = 'status-delivered';
              if (o.status === "Cancelado") statusClass = 'status-cancelled';

              const itemsStr = o.items.map(i => `${i.quantity}x ${i.name.es || i.name}`).join(', ');

              return `
                <tr>
                  <td class="font-semibold">${o.id}</td>
                  <td>${o.date}</td>
                  <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${itemsStr}">${itemsStr}</td>
                  <td class="font-bold">S/. ${o.total.toFixed(2)}</td>
                  <td><span class="badge-status ${statusClass}">${o.status}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error("Error loading customer history:", err);
    body.innerHTML = `<p class="text-danger text-center">Error al cargar la información.</p>`;
  }
}

// ==========================================================================
// 6. CONFIG TAB VIEW
// ==========================================================================
function renderConfigTab() {
  const coupon = generalConfig.coupon || { code: '', discount: 10, active: false };
  return `
    <div class="admin-card" style="max-width: 500px;">
      <h3 class="admin-card-title" style="margin-bottom: 2rem;">Variables Generales</h3>
      <form id="config-form" class="flex flex-col gap-15">
        <div class="admin-form-group">
          <label for="conf-phone">Número de Contacto / WhatsApp Soporte</label>
          <input type="text" id="conf-phone" value="${generalConfig.contactPhone}" required placeholder="+51987654321">
        </div>

        <hr style="margin: 1rem 0; border: 0; border-top: 1px solid var(--border-color);">

        <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">Cupón de Descuento</h4>
        <div class="admin-form-group">
          <label for="conf-coupon-code">Código del cupón</label>
          <input type="text" id="conf-coupon-code" value="${coupon.code}" placeholder="Ej: FUSION10">
        </div>
        <div class="admin-form-group">
          <label for="conf-coupon-discount">Descuento (%)</label>
          <input type="number" id="conf-coupon-discount" value="${coupon.discount}" min="1" max="100">
        </div>
        <div class="admin-form-group flex gap-05 align-center" style="flex-direction: row;">
          <input type="checkbox" id="conf-coupon-active" ${coupon.active ? 'checked' : ''} style="width: 18px; height: 18px;">
          <label for="conf-coupon-active">Cupón activo</label>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Guardar Parámetros</button>
      </form>
    </div>
  `;
}

// ==========================================================================
// 7. ADMINS TAB VIEW
// ==========================================================================
function renderAdminsTab() {
  return `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Cuentas con Permiso Administrador</h3>
        <button id="add-admin-btn" class="btn btn-primary btn-sm flex align-center gap-05">
          <i data-lucide="plus"></i> Promover a Administrador
        </button>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>UID del Usuario</th>
              <th>Nombre completo</th>
              <th>Correo electrónico</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${allAdmins.map(a => `
              <tr>
                <td class="font-semibold text-muted text-xs" style="font-size:0.75rem;">${escapeHTML(a.uid)}</td>
                <td class="font-semibold">${escapeHTML(a.name || 'Admin')}</td>
                <td>${escapeHTML(a.email)}</td>
                <td><span class="admin-badge">Admin</span></td>
                <td>
                  ${a.uid === 'admin-fallback-uid' || a.email === 'admin@brasilfusion.pe'
                    ? '<span class="text-sm text-muted">Protegido</span>'
                    : `<button class="btn btn-secondary-outline btn-sm demote-admin-btn" data-uid="${escapeHTML(a.uid)}" title="Revocar Administrador"><i data-lucide="shield-off"></i> Revocar</button>`
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddAdminModal() {
  const modal = document.getElementById('admin-modal');
  const container = document.getElementById('admin-modal-container');
  if (!modal || !container) return;

  container.style.maxWidth = '600px';

  container.innerHTML = `
    <div class="admin-modal-header">
      <h3>Promover Usuario a Administrador</h3>
      <button class="admin-modal-close" onclick="document.getElementById('admin-modal').classList.remove('active')">&times;</button>
    </div>
    <form id="admin-promotion-form" class="flex flex-col gap-15">
      <div class="admin-form-group">
        <label for="adm-uid">Escribe el UID exacto de Firebase del usuario:</label>
        <input type="text" id="adm-uid" required placeholder="ej: AIzaSyD0Ap2f...">
        <span class="text-sm text-muted">Tip: Puedes copiar el UID del directorio de la pestaña de "Clientes".</span>
      </div>
      <div class="admin-form-group">
        <label for="adm-name">Nombre en el panel</label>
        <input type="text" id="adm-name" required placeholder="ej: Administrador 2">
      </div>
      <div class="admin-form-group">
        <label for="adm-email">Correo electrónico</label>
        <input type="email" id="adm-email" required placeholder="admin2@brasilfusion.pe">
      </div>

      <div class="admin-form-actions">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-modal').classList.remove('active')">Cancelar</button>
        <button type="submit" class="btn btn-primary">Promover</button>
      </div>
    </form>
  `;

  modal.classList.add('active');

  const form = document.getElementById('admin-promotion-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uid = document.getElementById('adm-uid').value.trim();
      const name = document.getElementById('adm-name').value.trim();
      const email = document.getElementById('adm-email').value.trim();

      AppStore.showToast("Promoviendo usuario...", "info");
      try {
        await firebaseService.addAdmin(uid, name, email);
        AppStore.showToast("Usuario promovido a Administrador con éxito.", "success");
        modal.classList.remove('active');
        // Refresh admin list and events locally
        allAdmins = await firebaseService.fetchAllAdmins();
        const contentEl = document.getElementById('admin-tab-content');
        if (contentEl) contentEl.innerHTML = renderAdminsTab();
        initTabEvents('admins');
      } catch (err) {
        console.error(err);
        AppStore.showToast("Error al promover el usuario.", "error");
      }
    });
  }
}

// ==========================================================================
// 8. CONTROLLER EVENTS AND BINDINGS INITS
// ==========================================================================
// ==========================================================================
// 8. TAB EVENTS REGISTRATION & CONTROLLER INITS
// ==========================================================================
function initTabEvents(tab) {
  // Run lucide icons binding
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: 'lucide-icon' }
    });
  }

  // 1. Dashboard Tab specific initialization
  if (tab === 'dashboard') {
    drawDashboardCharts();
  }

  // 2. Products Tab specific bindings
  if (tab === 'products') {
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => openProductModal());
    }

    document.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = allProducts.find(p => p.id === id);
        if (prod) openProductModal(prod);
      });
    });

    document.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${id}"?`)) {
          AppStore.showToast("Eliminando producto...", "info");
          try {
            await firebaseService.deleteProduct(id);
            AppStore.showToast("Producto eliminado correctamente.", "success");
            // Refresh local list and re-draw tab content
            allProducts = await firebaseService.fetchProducts();
            const contentEl = document.getElementById('admin-tab-content');
            if (contentEl) contentEl.innerHTML = renderProductsTab();
            initTabEvents('products');
          } catch (err) {
            console.error(err);
            AppStore.showToast("Error al eliminar el producto de Firestore.", "error");
          }
        }
      });
    });
  }

  // 3. Categories Tab specific bindings
  if (tab === 'categories') {
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', () => openCategoryModal());
    }

    document.querySelectorAll('.edit-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cat = allCategories.find(c => c.id === id);
        if (cat) openCategoryModal(cat);
      });
    });

    document.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`¿Estás seguro de eliminar la categoría "${id}"? Los productos con esta categoría no se borrarán, pero se romperá la vinculación.`)) {
          AppStore.showToast("Eliminando categoría...", "info");
          try {
            await firebaseService.deleteCategory(id);
            AppStore.showToast("Categoría eliminada correctamente.", "success");
            // Refresh local list and re-draw tab content
            allCategories = await firebaseService.fetchCategories();
            const contentEl = document.getElementById('admin-tab-content');
            if (contentEl) contentEl.innerHTML = renderCategoriesTab();
            initTabEvents('categories');
          } catch (err) {
            console.error(err);
            AppStore.showToast("Error al eliminar la categoría.", "error");
          }
        }
      });
    });
  }

  // 4. Orders Tab filters & status changer bindings
  if (tab === 'orders') {
    const searchInput = document.getElementById('order-search');
    const statusFilter = document.getElementById('order-status-filter');
    const paymentFilter = document.getElementById('order-payment-filter');
    const dateFrom = document.getElementById('order-date-from');
    const dateTo = document.getElementById('order-date-to');
    const ordersTableBody = document.querySelector('#admin-orders-table tbody');

    const filterAndRenderOrders = () => {
      if (!ordersTableBody) return;
      const query = searchInput?.value.toLowerCase().trim() || '';
      const status = statusFilter?.value || 'all';
      const payment = paymentFilter?.value || 'all';
      const from = dateFrom?.value || '';
      const to = dateTo?.value || '';

      let filtered = [...allOrders];

      if (status !== 'all') {
        filtered = filtered.filter(o => o.status === status);
      }

      if (payment !== 'all') {
        filtered = filtered.filter(o => (o.paymentStatus || 'pending') === payment);
      }

      if (from) {
        filtered = filtered.filter(o => o.date >= from);
      }
      if (to) {
        filtered = filtered.filter(o => o.date <= to);
      }

      if (query) {
        filtered = filtered.filter(o => {
          const clientName = (o.shipping?.name || '').toLowerCase();
          const orderCode = (o.id || '').toLowerCase();
          const district = (o.shipping?.district || '').toLowerCase();
          return clientName.includes(query) || orderCode.includes(query) || district.includes(query);
        });
      }

      ordersTableBody.innerHTML = renderOrdersTableRows(filtered);
      bindOrderStatusSelectors();
    };

    if (searchInput) searchInput.addEventListener('input', filterAndRenderOrders);
    if (statusFilter) statusFilter.addEventListener('change', filterAndRenderOrders);
    if (paymentFilter) paymentFilter.addEventListener('change', filterAndRenderOrders);
    if (dateFrom) dateFrom.addEventListener('change', filterAndRenderOrders);
    if (dateTo) dateTo.addEventListener('change', filterAndRenderOrders);

    const bindOrderStatusSelectors = () => {
      document.querySelectorAll('.change-status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
          const orderDocId = select.getAttribute('data-id');
          const nextStatus = e.target.value;

          AppStore.showToast(`Cambiando estado del pedido a: ${nextStatus}...`, "info");
          try {
            await firebaseService.updateOrderStatus(orderDocId, nextStatus);
            AppStore.showToast("Estado de pedido actualizado correctamente.", "success");
            allOrders = await firebaseService.fetchOrders(null, "admin");
            filterAndRenderOrders();
          } catch (err) {
            console.error(err);
            AppStore.showToast("Error al actualizar el estado en Firestore.", "error");
          }
        });
      });

      // Bind Details modal click
      document.querySelectorAll('.view-admin-order-details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderDocId = btn.getAttribute('data-id');
          openAdminOrderDetailsModal(orderDocId);
        });
      });

      // Bind Mark as Paid buttons
      document.querySelectorAll('.mark-paid-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderDocId = btn.getAttribute('data-id');
          AppStore.showToast("Marcando pedido como pagado...", "info");
          try {
            await firebaseService.markOrderAsPaid(orderDocId);
            AppStore.showToast("Pedido marcado como pagado.", "success");
            allOrders = await firebaseService.fetchOrders(null, "admin");
            filterAndRenderOrders();
          } catch (err) {
            console.error(err);
            AppStore.showToast("Error al marcar como pagado.", "error");
          }
        });
      });
    };

    bindOrderStatusSelectors();
  }

  // 5. Customers Tab list search & view history bindings
  if (tab === 'customers') {
    const searchInput = document.getElementById('customer-search');
    const customersTableBody = document.querySelector('#admin-customers-table tbody');

    if (searchInput && customersTableBody) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        let filtered = [...allCustomers];
        if (query) {
          filtered = filtered.filter(c => {
            const name = (c.name || '').toLowerCase();
            const email = (c.email || '').toLowerCase();
            return name.includes(query) || email.includes(query);
          });
        }
        customersTableBody.innerHTML = renderCustomersTableRows(filtered);
        bindCustomerHistoryButtons();
      });
    }

    const bindCustomerHistoryButtons = () => {
      document.querySelectorAll('.view-customer-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const uid = btn.getAttribute('data-uid');
          const name = btn.getAttribute('data-name');
          showCustomerHistoryModal(uid, name);
        });
      });
    };

    bindCustomerHistoryButtons();
  }

  // 6. Configurations Tab form save bindings
  if (tab === 'config') {
    const configForm = document.getElementById('config-form');
    if (configForm) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('conf-phone').value.trim();
        const couponCode = document.getElementById('conf-coupon-code').value.trim().toUpperCase();
        const couponDiscount = parseInt(document.getElementById('conf-coupon-discount').value) || 0;
        const couponActive = document.getElementById('conf-coupon-active').checked;

        AppStore.showToast("Actualizando parámetros...", "info");
        try {
          await firebaseService.updateGeneralConfig({
            contactPhone: phone,
            coupon: { code: couponCode, discount: couponDiscount, active: couponActive }
          });
          AppStore.showToast("Parámetros de configuración guardados.", "success");
          generalConfig = { contactPhone: phone, coupon: { code: couponCode, discount: couponDiscount, active: couponActive } };
        } catch (err) {
          console.error(err);
          AppStore.showToast("Error al guardar la configuración.", "error");
        }
      });
    }
  }

  // 7. Admin promotion tab bindings
  if (tab === 'admins') {
    const addAdminBtn = document.getElementById('add-admin-btn');
    if (addAdminBtn) {
      addAdminBtn.addEventListener('click', () => openAddAdminModal());
    }

    document.querySelectorAll('.demote-admin-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.getAttribute('data-uid');
        if (confirm(`¿Estás seguro de que deseas revocar los permisos de administrador del usuario con UID: "${uid}"?`)) {
          AppStore.showToast("Revocando permisos...", "info");
          try {
            await firebaseService.removeAdmin(uid);
            AppStore.showToast("Rol de administrador revocado correctamente.", "success");
            allAdmins = await firebaseService.fetchAllAdmins();
            const contentEl = document.getElementById('admin-tab-content');
            if (contentEl) contentEl.innerHTML = renderAdminsTab();
            initTabEvents('admins');
          } catch (err) {
            console.error(err);
            AppStore.showToast("Error al revocar los permisos.", "error");
          }
        }
      });
    });
  }
}

adminView.init = function() {
  const currentUser = AppStore.state.currentUser;
  if (!currentUser || currentUser.role !== 'admin') return;

  // Bind sidebar navigation tabs clicks locally
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      if (tab && tab !== activeTab) {
        activeTab = tab;

        // Update active class styles
        document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Update header workspace title
        const titleEl = document.querySelector('.admin-title-section h2');
        if (titleEl) titleEl.textContent = getTabTitle(tab);

        // Render tab content inside panel container
        const contentEl = document.getElementById('admin-tab-content');
        if (contentEl) contentEl.innerHTML = renderTabContent(tab);

        // Initialize bindings for that tab
        initTabEvents(tab);
      }
    });
  });

  // Logout action click
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AppStore.logout();
      window.location.hash = '#/';
    });
  }

  // Load first tab events
  initTabEvents(activeTab);

  // Subscribe to real-time orders updates
  if (!window.adminOrdersUnsubscribe) {
    window.adminOrdersUnsubscribe = firebaseService.subscribeToOrders((orders) => {
      allOrders = orders;
      
      // Update dashboard dynamically if current tab is dashboard
      if (activeTab === 'dashboard') {
        const contentEl = document.getElementById('admin-tab-content');
        if (contentEl) {
          contentEl.innerHTML = renderDashboardTab();
          drawDashboardCharts();
        }
      }
      
      // Update orders list dynamically if current tab is orders
      if (activeTab === 'orders') {
        const searchInput = document.getElementById('order-search');
        const statusFilter = document.getElementById('order-status-filter');
        const paymentFilter = document.getElementById('order-payment-filter');
        const dateFrom = document.getElementById('order-date-from');
        const dateTo = document.getElementById('order-date-to');
        const ordersTableBody = document.querySelector('#admin-orders-table tbody');

        if (ordersTableBody) {
          const query = searchInput?.value.toLowerCase().trim() || '';
          const status = statusFilter?.value || 'all';
          const payment = paymentFilter?.value || 'all';
          const from = dateFrom?.value || '';
          const to = dateTo?.value || '';

          let filtered = [...allOrders];

          if (status !== 'all') {
            filtered = filtered.filter(o => o.status === status);
          }

          if (payment !== 'all') {
            filtered = filtered.filter(o => (o.paymentStatus || 'pending') === payment);
          }

          if (from) {
            filtered = filtered.filter(o => o.date >= from);
          }
          if (to) {
            filtered = filtered.filter(o => o.date <= to);
          }

          if (query) {
            filtered = filtered.filter(o => {
              const clientName = (o.shipping?.name || '').toLowerCase();
              const orderCode = (o.id || '').toLowerCase();
              const district = (o.shipping?.district || '').toLowerCase();
              return clientName.includes(query) || orderCode.includes(query) || district.includes(query);
            });
          }

          ordersTableBody.innerHTML = renderOrdersTableRows(filtered);
          
          // Re-bind Lucide icons for the new rows
          if (window.lucide) {
            window.lucide.createIcons({
              attrs: { class: 'lucide-icon' }
            });
          }

          // Re-bind status changer selects and view details buttons
          document.querySelectorAll('.change-status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
              const orderDocId = select.getAttribute('data-id');
              const nextStatus = e.target.value;

              AppStore.showToast(`Cambiando estado del pedido a: ${nextStatus}...`, "info");
              try {
                await firebaseService.updateOrderStatus(orderDocId, nextStatus);
                AppStore.showToast("Estado de pedido actualizado correctamente.", "success");
              } catch (err) {
                console.error(err);
                AppStore.showToast("Error al actualizar el estado en Firestore.", "error");
              }
            });
          });

          document.querySelectorAll('.view-admin-order-details-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const orderDocId = btn.getAttribute('data-id');
              openAdminOrderDetailsModal(orderDocId);
            });
          });

          document.querySelectorAll('.mark-paid-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const orderDocId = btn.getAttribute('data-id');
              AppStore.showToast("Marcando pedido como pagado...", "info");
              try {
                await firebaseService.markOrderAsPaid(orderDocId);
                AppStore.showToast("Pedido marcado como pagado.", "success");
              } catch (err) {
                console.error(err);
                AppStore.showToast("Error al marcar como pagado.", "error");
              }
            });
          });
        }
      }
    });
  }
};
