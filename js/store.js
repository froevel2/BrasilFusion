import { firebaseService } from './services/firebaseService.js';

function parseWeightToKg(weightStr) {
  if (!weightStr) return 0;
  const clean = weightStr.toLowerCase().trim();
  
  // Match patterns like "1.5kg" or "1 kg" or "1kg (para..."
  const kgMatch = clean.match(/^([\d.,]+)\s*kg/);
  if (kgMatch) {
    return parseFloat(kgMatch[1].replace(',', '.'));
  }
  
  // Match patterns like "500g" or "500 g" or "250g (8 unidades)"
  const gMatch = clean.match(/^([\d.,]+)\s*(g|ml)/);
  if (gMatch) {
    return parseFloat(gMatch[1].replace(',', '.')) / 1000;
  }
  
  if (clean.includes('g') || clean.includes('ml')) {
    const num = parseFloat(clean);
    if (!isNaN(num)) return num / 1000;
  } else {
    const num = parseFloat(clean);
    if (!isNaN(num)) return num;
  }
  return 0;
}

class Store {
  constructor() {
    // Initial state
    const savedCart = JSON.parse(localStorage.getItem('bf_cart')) || [];
    this.state = {
      products: [], // Loaded asynchronously from Firestore
      categories: [], // Loaded asynchronously from Firestore
      cart: Array.isArray(savedCart)
        ? savedCart.map(item => ({
            ...item,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0
          }))
        : [],
      currentUser: null, // Loaded asynchronously from Firebase Auth
      orders: [], // Loaded asynchronously from Firestore
      theme: localStorage.getItem('bf_theme') || 'light',
      language: localStorage.getItem('bf_lang') || 'es'
    };

    // Callback listeners
    this.listeners = {
      cart: [],
      auth: [],
      theme: [],
      orders: [],
      language: [],
      catalog: [] // Listener for catalog loading updates
    };

    // Initialize Firebase Auth Listener
    this.initAuthListener();

    // Load Initial Data from Firestore
    this.initFirestoreData();
  }

  // Helper method to retrieve translations
  t(key, params = {}) {
    const lang = this.state.language;
    // Imports translations dynamically to avoid circular dependencies
    // since translations imports store, and store imports translations
    let translation = window.bf_translations?.[lang]?.[key] || key;
    
    // Interpolate parameters if provided (e.g. {id}, {name})
    Object.keys(params).forEach(param => {
      translation = translation.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
    
    return translation;
  }

  // Subscriptions
  subscribe(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type].push(callback);
    }
    return () => {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    };
  }

  notify(type) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => callback(this.state[type]));
    }
  }

  // ==========================================================================
  // DATA LOAD & SEEDING INITS
  // ==========================================================================
  initAuthListener() {
    firebaseService.observeAuthState(async (user, profile) => {
      if (user && profile) {
        this.state.currentUser = profile;
        localStorage.setItem('bf_user', JSON.stringify(profile));
        
        // Fetch orders for logged-in user
        try {
          const userOrders = await firebaseService.fetchOrders(user.uid, profile.role);
          this.state.orders = userOrders;
          localStorage.setItem('bf_orders', JSON.stringify(userOrders));
          this.notify('orders');
        } catch (ordersErr) {
          console.error("Error loading user orders on auth change:", ordersErr);
        }
      } else {
        this.state.currentUser = null;
        this.state.orders = [];
        localStorage.removeItem('bf_user');
        localStorage.removeItem('bf_orders');
        this.notify('orders');
      }
      this.notify('auth');
    });
  }

  async initFirestoreData() {
    try {
      // 1. Fetch products
      let list = await firebaseService.fetchProducts();
      
      // 2. Auto-seed if empty
      if (list.length === 0) {
        this.showToast("Inicializando base de datos en la nube...", "info");
        await firebaseService.seedInitialDatabase();
        list = await firebaseService.fetchProducts();
      }

      this.state.products = list;
      
      // 3. Fetch categories
      const categories = await firebaseService.fetchCategories();
      this.state.categories = categories;

      this.notify('catalog');
    } catch (err) {
      console.error("Firestore initialization error in store:", err);
      this.showToast("Error al conectar con Firestore. Revisa las reglas de seguridad.", "error");
    }
  }

  // ==========================================================================
  // CART ACTIONS
  // ==========================================================================
  getCartItems() {
    return this.state.cart;
  }

  getCartCount() {
    return this.state.cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  }

  getCartSubtotal() {
    return this.state.cart.reduce((total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  }

  getShippingCost(district = 'Miraflores', manualProvinceRate = 0, isHomeDelivery = false) {
    if (district === 'Provincia (Shalom)' || district === 'Provincias (Shalom - Pago en destino)') {
      return Number(manualProvinceRate) + (isHomeDelivery ? 10 : 0);
    }
    
    const zones = {
      'Miraflores': 7, 'Surquillo': 7, 'San Isidro': 7, 'Barranco': 7, 'Lince': 7,
      'San Borja': 10, 'La Victoria': 10, 'Jesús María': 10, 'Breña': 10, 'San Luis': 10, 'Magdalena del Mar': 10, 'Santiago de Surco': 10,
      'San Miguel': 13, 'La Molina': 13, 'Chorrillos': 13, 'Pueblo Libre': 13, 'Santa Anita': 13, 'Rímac': 13, 'Cercado de Lima': 13, 'Villa María del Triunfo': 13, 'San Juan de Miraflores': 13,
      'San Martín de Porres': 18, 'Los Olivos': 18, 'Comas': 18, 'Callao': 18
    };
    const cost = zones[district];
    return cost !== undefined ? cost : 7.00;
  }

  getCartTotalWeight() {
    return this.state.cart.reduce((total, item) => {
      const itemWeight = item.weight || '';
      const qty = Number(item.quantity) || 0;
      return total + (parseWeightToKg(itemWeight) * qty);
    }, 0);
  }

  getCartTotal(district = 'Miraflores', discountPercent = 0, manualProvinceRate = 0, isHomeDelivery = false) {
    const subtotal = this.getCartSubtotal();
    const discountAmount = subtotal * discountPercent;
    const discountedSubtotal = subtotal - discountAmount;
    const igv = discountedSubtotal * 0.18;
    const shipping = this.getShippingCost(district, manualProvinceRate, isHomeDelivery);
    return discountedSubtotal + igv + shipping;
  }

  getCartIGV(discountPercent = 0) {
    const subtotal = this.getCartSubtotal();
    const discountAmount = subtotal * discountPercent;
    const discountedSubtotal = subtotal - discountAmount;
    return discountedSubtotal * 0.18;
  }

  addToCart(productId, quantity = 1) {
    const product = this.state.products.find(p => p.id === productId);
    if (!product) {
      this.showToast("Cargando productos. Por favor espera...", "info");
      return false;
    }

    // Check stock
    const cartItemIndex = this.state.cart.findIndex(item => item.productId === productId);
    const currentQtyInCart = cartItemIndex > -1 ? this.state.cart[cartItemIndex].quantity : 0;
    
    if (currentQtyInCart + quantity > product.stock) {
      const errorMsg = this.t('toastInsufficientStock', { stock: product.stock });
      this.showToast(errorMsg || `Stock insuficiente. Quedan ${product.stock} unidades.`, 'error');
      return false;
    }

    const productName = product.name[this.state.language] || product.name['es'];
    const cartProductPrice = (product.salePrice && product.salePrice > 0 && product.salePrice < product.price) ? product.salePrice : product.price;

    if (cartItemIndex > -1) {
      this.state.cart[cartItemIndex].quantity += quantity;
      // Update price in case it has changed
      this.state.cart[cartItemIndex].price = cartProductPrice;
    } else {
      this.state.cart.push({
        productId: product.id,
        name: product.name,
        price: cartProductPrice,
        image: product.image,
        category: product.category,
        quantity: quantity,
        stock: product.stock,
        weight: product.weight || ""
      });
    }

    this.saveCart();
    this.notify('cart');
    
    const addedMsg = this.t('toastAddedToCart', { name: productName });
    this.showToast(addedMsg || `Añadido: ${productName}`, 'success');
    return true;
  }

  updateCartQuantity(productId, quantity) {
    const cartItemIndex = this.state.cart.findIndex(item => item.productId === productId);
    if (cartItemIndex === -1) return;

    const product = this.state.products.find(p => p.id === productId);
    if (quantity > product.stock) {
      const errorMsg = this.t('toastInsufficientStock', { stock: product.stock });
      this.showToast(errorMsg || `Stock insuficiente. Quedan ${product.stock} unidades.`, 'error');
      return;
    }

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.state.cart[cartItemIndex].quantity = quantity;
    this.saveCart();
    this.notify('cart');
  }

  removeFromCart(productId) {
    const item = this.state.cart.find(i => i.productId === productId);
    this.state.cart = this.state.cart.filter(item => item.productId !== productId);
    this.saveCart();
    this.notify('cart');
    if (item) {
      const productName = item.name[this.state.language] || item.name['es'] || item.name;
      const removedMsg = this.t('toastRemovedFromCart', { name: productName });
      this.showToast(removedMsg || `Eliminado: ${productName}`, 'info');
    }
  }

  clearCart() {
    this.state.cart = [];
    this.saveCart();
    this.notify('cart');
  }

  saveCart() {
    const normalizedCart = this.state.cart.map(item => ({
      ...item,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 0
    }));
    localStorage.setItem('bf_cart', JSON.stringify(normalizedCart));
  }

  // ==========================================================================
  // AUTH ACTIONS
  // ==========================================================================
  async login(email, password) {
    if (!email || !password) {
      this.showToast(this.t('toastFillAllFields') || "Completa todos los campos.", "error");
      return false;
    }

    try {
      this.showToast(this.state.language === 'es' ? "Iniciando sesión..." : "Iniciando sessão...", "info");
      const { user, profile } = await firebaseService.loginUser(email, password);
      
      this.state.currentUser = profile;
      localStorage.setItem('bf_user', JSON.stringify(profile));
      this.notify('auth');
      
      const welcomeMsg = this.t('toastWelcomeBack', { name: profile.name });
      this.showToast(welcomeMsg || `Bienvenido, ${profile.name}`, 'success');
      return true;
    } catch (err) {
      console.error("Auth Login Error in store:", err);
      let errorMsg = this.state.language === 'es' ? "Usuario o contraseña incorrectos." : "Usuário ou senha incorretos.";
      if (err.code === 'auth/invalid-credential') {
        errorMsg = this.state.language === 'es' ? "Credenciales inválidas." : "Credenciais inválidas.";
      }
      this.showToast(errorMsg, "error");
      return false;
    }
  }

  async loginWithGoogle() {
    try {
      this.showToast(this.state.language === 'es' ? "Conectando con Google..." : "Conectando com o Google...", "info");
      const { user, profile } = await firebaseService.loginWithGoogle();
      
      this.state.currentUser = profile;
      localStorage.setItem('bf_user', JSON.stringify(profile));
      this.notify('auth');
      
      const welcomeMsg = this.t('toastWelcome', { name: profile.name });
      this.showToast(welcomeMsg || `Bienvenido, ${profile.name}`, 'success');
      return true;
    } catch (err) {
      console.error("Google Auth Error in store:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        const errorMsg = this.state.language === 'es' ? "Error al autenticar con Google." : "Erro ao autenticar com o Google.";
        this.showToast(errorMsg, "error");
      }
      return false;
    }
  }

  async register(name, email, password) {
    if (!name || !email || !password) {
      this.showToast(this.t('toastFillAllFields') || "Completa todos los campos.", "error");
      return false;
    }

    try {
      this.showToast(this.state.language === 'es' ? "Registrando cuenta..." : "Criando conta...", "info");
      const { user, profile } = await firebaseService.registerUser(name, email, password);
      
      this.state.currentUser = profile;
      localStorage.setItem('bf_user', JSON.stringify(profile));
      this.notify('auth');

      const welcomeMsg = this.t('toastWelcome', { name: name });
      this.showToast(welcomeMsg || `Registro exitoso, ${name}!`, 'success');
      return true;
    } catch (err) {
      console.error("Auth Register Error in store:", err);
      let errorMsg = this.state.language === 'es' ? "Error al registrar la cuenta." : "Erro ao cadastrar conta.";
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = this.state.language === 'es' ? "El correo electrónico ya está registrado." : "O e-mail ya está registrado.";
      } else if (err.code === 'auth/weak-password') {
        errorMsg = this.state.language === 'es' ? "La contraseña debe tener al menos 6 caracteres." : "A senha deve ter pelo menos 6 caracteres.";
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = this.state.language === 'es' ? "El correo electrónico no es válido." : "O e-mail inserido é inválido.";
      } else if (err.message && err.message.includes("permission-denied")) {
        errorMsg = this.state.language === 'es' ? "Error de permisos al guardar perfil en Firestore." : "Erro de permissão ao salvar perfil no Firestore.";
      }
      this.showToast(errorMsg, "error");
      return false;
    }
  }

  async logout() {
    try {
      await firebaseService.logoutUser();
      this.state.currentUser = null;
      this.state.orders = [];
      localStorage.removeItem('bf_user');
      localStorage.removeItem('bf_orders');
      this.notify('auth');
      this.notify('orders');
      
      this.showToast(this.t('toastLoggedOut') || "Sesión cerrada.", "info");
    } catch (err) {
      console.error("Auth Logout Error in store:", err);
    }
  }

  async updateProfile(updatedData) {
    if (!this.state.currentUser) return false;
    
    try {
      await firebaseService.updateUserProfile(this.state.currentUser.uid, updatedData);
      
      this.state.currentUser = {
        ...this.state.currentUser,
        ...updatedData
      };
      localStorage.setItem('bf_user', JSON.stringify(this.state.currentUser));
      this.notify('auth');
      this.showToast(this.t('toastProfileUpdated') || "Perfil actualizado.", "success");
      return true;
    } catch (err) {
      console.error("Store Update Profile Error:", err);
      this.showToast(this.state.language === 'es' ? "Error al guardar perfil." : "Erro ao salvar perfil.", "error");
      return false;
    }
  }

  async sendPasswordReset(email) {
    if (!email) {
      this.showToast(this.t('toastFillAllFields') || "Completa todos los campos.", "error");
      return false;
    }
    try {
      await firebaseService.resetPassword(email);
      const successMsg = this.state.language === 'es' 
        ? "Se ha enviado un enlace de recuperación a tu correo." 
        : "Um link de recuperação foi enviado para o seu e-mail.";
      this.showToast(successMsg, "success");
      return true;
    } catch (err) {
      console.error("Reset password error in store:", err);
      let errorMsg = this.state.language === 'es' 
        ? "Error al enviar el correo de recuperación. Verifica si el correo es correcto." 
        : "Erro ao enviar o e-mail de redefinição. Verifique se o e-mail está correto.";
      if (err.code === 'auth/invalid-email') {
        errorMsg = this.state.language === 'es' ? "El correo electrónico no es válido." : "O e-mail inserido é inválido.";
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = this.state.language === 'es' ? "No existe un usuario con este correo." : "Não existe usuário com este e-mail.";
      }
      this.showToast(errorMsg, "error");
      return false;
    }
  }

  // ==========================================================================================
  // ORDERS ACTIONS
  // ==========================================================================
  async placeOrder(shippingInfo, paymentMethod, voucherFile = null) {
    if (this.state.cart.length === 0) {
      this.showToast(this.t('toastEmptyCart') || "El carrito está vacío.", "error");
      return null;
    }

    // Default anonymous user ID if not logged in (fallback with anonymous login)
    let customerId = this.state.currentUser ? this.state.currentUser.uid : null;

    if (!customerId) {
      try {
        const anonUser = await firebaseService.loginAnonymously();
        customerId = anonUser.uid;
      } catch (anonErr) {
        console.error("Anonymous authentication failed, using fallback:", anonErr);
        customerId = "anonymous-client";
      }
    }

    const orderId = `BF-${Math.floor(1000 + Math.random() * 9000)}`;

    const requiresVoucher = paymentMethod === "Yape" || paymentMethod === "Transferencia";
    
    if (requiresVoucher && !voucherFile) {
      const errorMsg = this.t('checkoutVoucherRequiredError') || "El comprobante de pago es obligatorio.";
      this.showToast(errorMsg, "error");
      return null;
    }

    let voucherUrl = "";
    if (voucherFile) {
      try {
        const loadingMsg = this.state.language === 'es' ? "Subiendo comprobante de pago..." : "Enviando comprovante...";
        this.showToast(loadingMsg, "info");
        
        // Wrap the upload in a 30-second timeout to prevent checkout hangs
        const uploadPromise = firebaseService.uploadOrderVoucher(voucherFile, orderId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(this.t('toastVoucherTimeout') || "Timeout: La subida del comprobante tardó demasiado.")), 30000)
        );
        
        voucherUrl = await Promise.race([uploadPromise, timeoutPromise]);
      } catch (uploadErr) {
        console.error("Voucher upload failed:", uploadErr);
        let errorMsg = this.t('toastVoucherUploadError') || "No se pudo subir el comprobante.";
        if (uploadErr.message && uploadErr.message.includes("Timeout")) {
          errorMsg = uploadErr.message;
        }
        this.showToast(errorMsg, "error");
        
        if (requiresVoucher) {
          return null;
        }
      }
    }

    if (requiresVoucher && !voucherUrl) {
      const errorMsg = this.t('toastVoucherUploadError') || "No se pudo subir el comprobante obligatorio.";
      this.showToast(errorMsg, "error");
      return null;
    }

    // Apply coupon discount if any
    const couponDiscount = sessionStorage.getItem('bf_coupon_discount') || 0;
    const discountPercent = parseFloat(couponDiscount);
    
    // Get manualProvinceRate and isHomeDelivery from shippingInfo if it's province
    const manualProvinceRate = Number(shippingInfo.manualProvinceRate) || 0;
    const isHomeDelivery = !!shippingInfo.isHomeDelivery;
    
    const orderTotal = this.getCartTotal(
      shippingInfo.district, 
      discountPercent, 
      manualProvinceRate, 
      isHomeDelivery
    );

    const newOrder = {
      id: orderId,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      total: orderTotal,
      status: "En preparación",
      paymentStatus: "pending",
      paymentMethod: paymentMethod,
      items: this.state.cart.map(item => ({
        productId: item.productId,
        name: item.name, // Bilingual map
        price: item.price,
        quantity: item.quantity
      })),
      shipping: shippingInfo,
      customerId: customerId,
      voucherUrl: voucherUrl
    };

    try {
      const placedOrder = await firebaseService.createOrder(newOrder);
      
      // Clear cart
      this.state.cart = [];
      this.saveCart();
      this.notify('cart');
      
      // Update local orders list
      this.state.orders.unshift(placedOrder);
      localStorage.setItem('bf_orders', JSON.stringify(this.state.orders));
      this.notify('orders');
      
      // Trigger stock loading refresh in-memory
      const refreshedProducts = await firebaseService.fetchProducts();
      this.state.products = refreshedProducts;
      this.notify('catalog');

      const successMsg = this.t('toastOrderSuccess', { id: placedOrder.id });
      this.showToast(successMsg || `Pedido ${placedOrder.id} realizado!`, 'success');
      return placedOrder;
    } catch (err) {
      console.error("Store Place Order Error:", err);
      this.showToast(err.message || "Error al procesar el pedido.", "error");
      return null;
    }
  }

  // ==========================================================================
  // GENERAL SETTINGS & LANGUAGE
  // ==========================================================================
  setLanguage(lang) {
    if (lang === 'es' || lang === 'pt') {
      this.state.language = lang;
      localStorage.setItem('bf_lang', lang);
      this.notify('language');
      
      const msg = lang === 'es' ? 'Idioma cambiado a Español 🇵🇪' : 'Idioma alterado para Português 🇧🇷';
      this.showToast(msg, 'info');
    }
  }

  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.state.theme = newTheme;
    localStorage.setItem('bf_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    this.notify('theme');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-triangle';
    if (type === 'info') icon = 'info';

    toast.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);
    
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { class: 'lucide-icon' }
      });
    }

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }
}

export const AppStore = new Store();
document.documentElement.setAttribute('data-theme', AppStore.state.theme);
