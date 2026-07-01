import { AppStore } from '../store.js';
import { firebaseService } from '../services/firebaseService.js';
import { PERU_DEPARTMENTS } from '../data/ubigeo.js';
import { escapeHTML } from '../utils.js';

export async function checkoutView() {
  const items = AppStore.getCartItems().map(item => ({
    ...item,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0
  }));
  const subtotal = AppStore.getCartSubtotal();
  const language = AppStore.state.language;
  const todayStr = new Date().toISOString().split('T')[0];
  const currentUser = AppStore.state.currentUser;
  
  const formatPrice = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
  };
  
  let deliverySlots = [];
  try {
    deliverySlots = await firebaseService.fetchDeliverySlots();
  } catch (err) {
    console.error("Error loading delivery slots:", err);
  }
  
  const couponDiscount = sessionStorage.getItem('bf_coupon_discount') || 0;
  const discountPercent = parseFloat(couponDiscount);
  const discountAmount = subtotal * discountPercent;
  
  const initialDistrict = currentUser?.district || 'Miraflores';
  const initialShippingCost = AppStore.getShippingCost(initialDistrict);
  const initialIgv = (subtotal - discountAmount) * 0.18;
  const initialTotal = (subtotal - discountAmount) + initialIgv + initialShippingCost;

  if (items.length === 0) {
    return `
      <div class="container section text-center" style="padding: 6rem 1rem;">
        <i data-lucide="credit-card" class="empty-icon" style="width: 64px; height: 64px; margin: 0 auto 1.5rem auto; opacity: 0.5;"></i>
        <h2>${AppStore.t('catalogNoProducts')}</h2>
        <p class="text-muted" style="margin-top: 1rem;">${AppStore.t('toastEmptyCart')}</p>
        <a href="#/catalog" class="btn btn-primary" style="margin-top: 2rem;">${AppStore.t('notFoundBtnCatalog')}</a>
      </div>
    `;
  }

  const tTitle = AppStore.t('checkoutPageTitle');
  const tStep1 = AppStore.t('checkoutStep1');
  const tStep2 = AppStore.t('checkoutStep2');
  const tFullName = AppStore.t('checkoutFullName');
  const tEmail = AppStore.t('checkoutEmail');
  const tPhone = AppStore.t('checkoutPhone');
  const tAddress = AppStore.t('checkoutAddress');
  const tDistrict = AppStore.t('checkoutDistrict');
  const tSelectDistrict = AppStore.t('checkoutSelectDistrict');
  const tNotes = AppStore.t('checkoutNotes');
  const tNotesPlaceholder = AppStore.t('checkoutNotesPlaceholder');
  
  const tTabCard = AppStore.t('checkoutTabCard');
  const tTabYape = AppStore.t('checkoutTabYape');
  const tTabTransfer = AppStore.t('checkoutTabTransfer');
  
  const tCardNumber = AppStore.t('checkoutCardNumber');
  const tCardExpiry = AppStore.t('checkoutCardExpiry');
  const tCardCvv = AppStore.t('checkoutCardCvv');
  
  const tQrText = AppStore.t('checkoutQrText');
  const tQrTotal = AppStore.t('checkoutQrTotal');
  const tTransferText = AppStore.t('checkoutTransferText');
  const tTransferDetails = AppStore.t('checkoutTransferDetails');
  
  const tSubmitBtn = AppStore.t('checkoutSubmitBtn');
  const tDisclaimer = AppStore.t('checkoutDisclaimer');
  const tSummaryTitle = AppStore.t('cartSummaryCheckoutTitle');
  
  const tSubtotal = AppStore.t('cartSubtotalRow');
  const tDiscount = AppStore.t('cartDiscountRow');
  const tShipping = AppStore.t('cartShippingRow');
  const tTotal = AppStore.t('cartTotalRow');
  const tFree = AppStore.t('freeShipping');
  
  const tProcessingTitle = AppStore.t('checkoutProcessingTitle');
  const tProcessingDesc = AppStore.t('checkoutProcessingDesc');

  return `
    <div class="container section">
      <h1 class="page-title" style="margin-bottom: 2.5rem;">${tTitle}</h1>

      <div class="checkout-layout grid grid-3-cols gap-3 mobile-stack">
        
        <!-- Left: Checkout steps (2 cols) -->
        <div class="checkout-forms col-span-2">
          
          <!-- Loading overlay for payment simulation -->
          <div id="payment-loading-screen" class="payment-loading-screen flex flex-col align-center justify-center">
            <div class="payment-spinner"></div>
            <h3>${tProcessingTitle}</h3>
            <p class="text-muted">${tProcessingDesc}</p>
          </div>

          <!-- Step 1: Shipping Address -->
          <div class="checkout-card" id="step-shipping-card">
            <div class="checkout-card-header flex align-center gap-05">
              <span class="step-number">1</span>
              <h2>${tStep1}</h2>
            </div>
            
            <!-- Shipping policy warning box -->
            <div class="shipping-info-banner flex gap-1" style="background: rgba(15, 76, 58, 0.05); padding: 1rem; border-radius: 8px; margin-top: 1rem; border-left: 4px solid var(--primary-color); font-size: 0.85rem; line-height: 1.5; color: var(--text-dark); text-align: left;">
              <i data-lucide="info" style="color: var(--primary-color); flex-shrink: 0; width: 18px; height: 18px; margin-top: 0.1rem;"></i>
              <div>
                <p style="margin-bottom: 0.5rem; font-weight: 700; color: var(--primary-color);">Información Importante de Envío:</p>
                <ul style="padding-left: 1.25rem; margin-bottom: 0;">
                  <li><strong>Solo Delivery:</strong> No contamos con retiro en tienda física.</li>
                  <li><strong>Reserva de Productos:</strong> Solo separamos productos mediante el pago.</li>
                  <li><strong>Horario de Envíos:</strong> Lunes a Viernes de 9:00 AM a 6:00 PM, Sábados de 10:00 AM a 1:00 PM.</li>
                  <li><strong>Provincias:</strong> Envíos a todo el país vía Shalom (pago adelantado según el peso de tu pedido).</li>
                </ul>
              </div>
            </div>
            
            <form id="shipping-form" class="checkout-form-grid" style="margin-top: 1.5rem;">
              <div class="form-group col-span-2">
                <label for="shipping-name">${tFullName}</label>
                <input type="text" id="shipping-name" placeholder="Ej. Carlos Mendoza" required value="${currentUser ? currentUser.name : ''}">
              </div>
              
              <div class="form-group">
                <label for="shipping-email">${tEmail}</label>
                <input type="email" id="shipping-email" placeholder="carlos@example.com" required value="${currentUser ? currentUser.email : ''}">
              </div>

              <div class="form-group">
                <label for="shipping-phone">${tPhone}</label>
                <input type="tel" id="shipping-phone" placeholder="Ej. 987654321" required value="${currentUser ? currentUser.phone : ''}">
              </div>

              <div class="form-group col-span-2" id="general-address-group">
                <label for="shipping-address">${tAddress}</label>
                <input type="text" id="shipping-address" placeholder="Av. Larco 456, Dpto 302" required value="${currentUser ? currentUser.address : ''}">
              </div>

              <div class="form-group">
                <label for="shipping-district">${tDistrict}</label>
                <select id="shipping-district" required>
                  <option value="">${tSelectDistrict}</option>
                  <!-- ZONA 01 - S/. 7.00 -->
                  <optgroup label="Zona 1 (S/. 7.00)">
                    <option value="Miraflores" selected>Miraflores</option>
                    <option value="Surquillo">Surquillo</option>
                    <option value="San Isidro">San Isidro</option>
                    <option value="Barranco">Barranco</option>
                    <option value="Lince">Lince</option>
                  </optgroup>
                  <!-- ZONA 02 - S/. 10.00 -->
                  <optgroup label="Zona 2 (S/. 10.00)">
                    <option value="San Borja">San Borja</option>
                    <option value="La Victoria">La Victoria</option>
                    <option value="Jesús María">Jesús María</option>
                    <option value="Breña">Breña</option>
                    <option value="San Luis">San Luis</option>
                    <option value="Magdalena del Mar">Magdalena del Mar</option>
                    <option value="Santiago de Surco">Santiago de Surco</option>
                  </optgroup>
                  <!-- ZONA 03 - S/. 13.00 -->
                  <optgroup label="Zona 3 (S/. 13.00)">
                    <option value="San Miguel">San Miguel</option>
                    <option value="La Molina">La Molina</option>
                    <option value="Chorrillos">Chorrillos</option>
                    <option value="Pueblo Libre">Pueblo Libre</option>
                    <option value="Santa Anita">Santa Anita</option>
                    <option value="Rímac">Rímac</option>
                    <option value="Cercado de Lima">Cercado de Lima</option>
                    <option value="Villa María del Triunfo">Villa María del Triunfo</option>
                    <option value="San Juan de Miraflores">San Juan de Miraflores</option>
                  </optgroup>
                  <!-- ZONA 04 - S/. 18.00 -->
                  <optgroup label="Zona 4 (S/. 18.00)">
                    <option value="San Martín de Porres">San Martín de Porres</option>
                    <option value="Los Olivos">Los Olivos</option>
                    <option value="Comas">Comas</option>
                    <option value="Callao">Callao</option>
                  </optgroup>
                  <!-- Provincias -->
                  <optgroup label="Provincias (Shalom)">
                    <option value="Provincia (Shalom)">Provincia (Shalom)</option>
                  </optgroup>
                </select>
              </div>

              <div class="form-group">
                <label for="shipping-dni">${AppStore.t('checkoutDniLabel')}</label>
                <input type="text" id="shipping-dni" placeholder="${AppStore.t('checkoutDniPlaceholder')}" required value="${currentUser ? (currentUser.dni || '') : ''}">
              </div>

              <!-- Departamento y Provincia (ocultos por defecto, visibles para Shalom provincia) -->
              <div class="form-group col-span-2" id="province-fields-group" style="display: none; border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px; background: rgba(15, 76, 58, 0.03); margin-top: 0.5rem;">
                <p class="font-semibold text-sm" style="color: var(--primary-color); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                  <i data-lucide="info" style="width: 16px; height: 16px;"></i>
                  <span>${AppStore.t('checkoutShalomInfo')}</span>
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label for="shipping-department" style="font-size: 0.85rem; font-weight: 600;">${AppStore.t('checkoutDepartment')} *</label>
                    <select id="shipping-department">
                      <option value="">-- ${language === 'es' ? 'Seleccionar' : 'Selecionar'} --</option>
                      ${Object.keys(PERU_DEPARTMENTS).sort().map(dep => `<option value="${dep}">${dep}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label for="shipping-province" style="font-size: 0.85rem; font-weight: 600;">${AppStore.t('checkoutProvince')} *</label>
                    <select id="shipping-province" disabled>
                      <option value="">-- ${language === 'es' ? 'Seleccionar' : 'Selecionar'} --</option>
                    </select>
                  </div>
                  <div class="form-group" style="margin-bottom: 0; grid-column: span 2;">
                    <label for="shipping-district-prov" style="font-size: 0.85rem; font-weight: 600;">${AppStore.t('checkoutDistrictProv')} *</label>
                    <input type="text" id="shipping-district-prov" placeholder="${AppStore.t('checkoutDistrictProvPlaceholder')}">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 0.5rem;">${AppStore.t('checkoutShalomDeliveryTypeLabel')}</label>
                  <div style="display: flex; gap: 1.5rem; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.9rem; cursor: pointer;">
                      <input type="radio" name="shalom-delivery-type" value="Agencia" id="shalom-delivery-type-agency" checked>
                      <span>${AppStore.t('checkoutShalomRecojoAgencia')}</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.9rem; cursor: pointer;">
                      <input type="radio" name="shalom-delivery-type" value="Domicilio" id="shalom-delivery-type-home">
                      <span>${AppStore.t('checkoutShalomHomeDelivery')}</span>
                    </label>
                  </div>
                </div>

                <div class="form-group" id="shalom-agency-name-group" style="margin-bottom: 1rem;">
                  <label for="shipping-agency-name" style="font-size: 0.85rem; font-weight: 600;">${AppStore.t('checkoutShalomAgencyNameLabel')}</label>
                  <input type="text" id="shipping-agency-name" placeholder="${AppStore.t('checkoutShalomAgencyNamePlaceholder')}">
                </div>

                <div class="form-group" id="shalom-home-address-group" style="margin-bottom: 1rem; display: none;">
                  <label for="shipping-shalom-home-address" style="font-size: 0.85rem; font-weight: 600;">${AppStore.t('checkoutShalomHomeAddress')}</label>
                  <input type="text" id="shipping-shalom-home-address" placeholder="${AppStore.t('checkoutShalomHomeAddressPlaceholder')}">
                </div>

                <!-- Weight Info and Rate Selector -->
                <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
                  <div id="shalom-weight-estimate-box" class="font-semibold text-sm" style="color: var(--primary-color); margin-bottom: 0.75rem; background: var(--bg-color); padding: 0.5rem 0.75rem; border-radius: 6px; border-left: 3px solid var(--primary-color);">
                    <!-- Will be dynamically filled -->
                  </div>

                  <div id="shalom-weight-warning-box" class="font-semibold text-sm text-danger" style="display: none; margin-bottom: 0.75rem; background: #fff5f5; padding: 0.5rem 0.75rem; border-radius: 6px; border-left: 3px solid var(--danger-color); color: var(--danger-color);">
                    <i data-lucide="alert-triangle" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px; margin-top: -2px;"></i>
                    <span>${AppStore.t('checkoutShalomWeightWarning')}</span>
                  </div>

                  <div class="form-group" style="margin-bottom: 0.5rem;">
                    <label for="shipping-weight-rate" style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 0.25rem;">${AppStore.t('checkoutShalomWeightRateLabel')}</label>
                    <p class="text-muted text-xs" style="margin-top: -0.25rem; margin-bottom: 0.5rem; font-style: italic;">
                      ⚠️ ${AppStore.t('checkoutShalomWeightVerifyAlert')}
                    </p>
                    <select id="shipping-weight-rate">
                      <option value="">-- ${AppStore.t('checkoutShalomWeightRateSelect')} --</option>
                      <option value="15">${AppStore.t('checkoutShalomWeightRate1')}</option>
                      <option value="28">${AppStore.t('checkoutShalomWeightRate2')}</option>
                      <option value="35">${AppStore.t('checkoutShalomWeightRate3')}</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="form-group" id="delivery-date-group">
                <label for="shipping-date">${AppStore.t('checkoutDeliveryDate') || (language === 'es' ? 'Fecha de Entrega' : 'Data de Entrega')}</label>
                <input type="date" id="shipping-date" required min="${todayStr}">
              </div>
              
              <div class="form-group" id="delivery-slot-group">
                <label for="shipping-time-slot">${language === 'es' ? 'Horario de Entrega' : 'Horário de Entrega'}</label>
                <select id="shipping-time-slot" required>
                  <option value="">${language === 'es' ? 'Seleccionar Horario' : 'Selecionar Horário'}</option>
                  ${deliverySlots.filter(s => s.active).map(s => {
                    const slotLabel = s.label[language] || s.label['es'];
                    return `<option value="${slotLabel}">${slotLabel}</option>`;
                  }).join('')}
                </select>
              </div>

              <div class="form-group col-span-2">
                <label for="shipping-notes">${tNotes}</label>
                <input type="text" id="shipping-notes" placeholder="${tNotesPlaceholder}">
              </div>
            </form>
          </div>

          <!-- Step 2: Payment Method -->
          <div class="checkout-card" id="step-payment-card" style="margin-top: 2rem;">
            <div class="checkout-card-header flex align-center gap-05">
              <span class="step-number">2</span>
              <h2>${tStep2}</h2>
            </div>

            <!-- Tabs selector -->
            <div class="payment-tabs flex gap-1" style="margin-top: 1.5rem;">
              <button class="payment-tab-btn active" data-target="pay-card">
                <i data-lucide="credit-card"></i> ${tTabCard}
              </button>
              <button class="payment-tab-btn" data-target="pay-yape">
                <i data-lucide="smartphone"></i> ${tTabYape}
              </button>
              <button class="payment-tab-btn" data-target="pay-transfer">
                <i data-lucide="landmark"></i> ${tTabTransfer}
              </button>
            </div>

            <!-- Tab Content: Credit Card -->
            <div class="payment-tab-content active" id="pay-card" style="margin-top: 1.5rem;">
              <div class="checkout-form-grid">
                <div class="form-group col-span-2">
                  <label for="card-number">${tCardNumber}</label>
                  <input type="text" id="card-number" placeholder="0000 0000 0000 0000" maxlength="19">
                </div>
                <div class="form-group">
                  <label for="card-expiry">${tCardExpiry}</label>
                  <input type="text" id="card-expiry" placeholder="MM/AA" maxlength="5">
                </div>
                <div class="form-group">
                  <label for="card-cvv">${tCardCvv}</label>
                  <input type="password" id="card-cvv" placeholder="123" maxlength="4">
                </div>
              </div>
            </div>

            <!-- Tab Content: Yape/Plin -->
            <div class="payment-tab-content" id="pay-yape" style="margin-top: 1.5rem;">
              <div class="qr-payment-wrapper text-center bg-surface" style="padding: 1.5rem; border-radius: 12px;">
                <p style="margin-bottom: 1rem;">${tQrText}</p>
                <div class="qr-placeholder" style="width: 180px; height: 180px; background: white; border: 1px solid var(--border-color); margin: 0 auto; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                  <div style="padding: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; width: 100%;">
                    ${Array.from({ length: 16 }).map(() => `<div style="background: ${Math.random() > 0.4 ? 'var(--primary-color)' : 'transparent'}; border-radius: 2px;"></div>`).join('')}
                  </div>
                </div>
                <p class="font-semibold" style="margin-top: 1rem; color: var(--primary-color);">Brasil Fusión PE</p>
                <p class="text-sm text-muted">${tQrTotal} S/. ${initialTotal.toFixed(2)}</p>
                
                <div class="form-group" style="margin-top: 1.5rem; max-width: 300px; margin-left: auto; margin-right: auto; text-align: left;">
                  <label for="yape-voucher-file" style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600;">
                    ${language === 'es' ? 'Subir Comprobante (Obligatorio) *:' : 'Enviar Comprovante (Obrigatório) *:'}
                  </label>
                  <input type="file" id="yape-voucher-file" accept="image/*,application/pdf" style="font-size: 0.8rem; padding: 0.4rem; border: 1px dashed var(--border-color); border-radius: 8px; width: 100%; cursor: pointer;">
                </div>
              </div>
            </div>

            <!-- Tab Content: Transfer -->
            <div class="payment-tab-content" id="pay-transfer" style="margin-top: 1.5rem;">
              <div class="bank-details-wrapper bg-surface" style="padding: 1.5rem; border-radius: 12px; font-size: 0.95rem; line-height: 1.6;">
                <p style="margin-bottom: 1rem;">${tTransferText}</p>
                <div class="bank-accounts" style="margin-bottom: 1.5rem;">
                  ${tTransferDetails}
                </div>
                
                <div class="form-group" style="text-align: left; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                  <label for="transfer-voucher-file" style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600;">
                    ${language === 'es' ? 'Subir Comprobante (Obligatorio) *:' : 'Enviar Comprovante (Obrigatório) *:'}
                  </label>
                  <input type="file" id="transfer-voucher-file" accept="image/*,application/pdf" style="font-size: 0.8rem; padding: 0.4rem; border: 1px dashed var(--border-color); border-radius: 8px; width: 100%; cursor: pointer;">
                </div>
              </div>
            </div>
          </div>

          <!-- Final CTA -->
          <div style="margin-top: 2rem;">
            <button id="place-order-submit" class="btn btn-primary btn-lg w-full flex align-center justify-center gap-05">
              <i data-lucide="shield-check"></i> ${tSubmitBtn} <span id="checkout-submit-total-val" style="margin-left: 4px;">S/. ${initialTotal.toFixed(2)}</span>
            </button>
            <p class="text-center text-xs text-muted" style="margin-top: 0.75rem;">${tDisclaimer}</p>
          </div>

        </div>

        <!-- Right: Order Summary Sidebar (1 col) -->
        <aside class="order-summary-sidebar bg-surface" style="padding: 2rem; border-radius: 16px; height: fit-content;">
          <h3 style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">${tSummaryTitle}</h3>
          
          <!-- Items List -->
          <div class="checkout-items-summary-list" style="max-height: 250px; overflow-y: auto; margin-bottom: 1.5rem;">
            ${items.map(item => {
              const productName = item.name[language] || item.name['es'];

              return `
                <div class="checkout-summary-item flex align-center gap-1" style="padding: 0.5rem 0;">
                  <img src="${item.image}" alt="${productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                  <div style="flex: 1;">
                    <h4 style="font-size: 0.9rem; font-weight: 600; line-height: 1.2;">${productName}</h4>
                    <span class="text-xs text-muted">Cant: ${item.quantity} x S/. ${formatPrice(item.price)}</span>
                  </div>
                  <span class="font-semibold text-sm">S/. ${formatPrice(item.price * item.quantity)}</span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="price-row flex justify-between text-muted" style="margin-bottom: 0.75rem; font-size: 0.95rem;">
            <span>${tSubtotal}</span>
            <span>S/. ${subtotal.toFixed(2)}</span>
          </div>

          ${discountPercent > 0 ? `
            <div class="price-row flex justify-between text-success" style="margin-bottom: 0.75rem; font-size: 0.95rem;">
              <span>${tDiscount} (${discountPercent * 100}%)</span>
              <span>- S/. ${discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="price-row flex justify-between text-muted" style="margin-bottom: 0.75rem; font-size: 0.95rem;">
            <span>${AppStore.t('cartTaxRow')}</span>
            <span id="checkout-igv-cost-val">S/. ${initialIgv.toFixed(2)}</span>
          </div>

          <div class="price-row flex justify-between text-muted" style="margin-bottom: 0.75rem; font-size: 0.95rem;">
            <span>${tShipping}</span>
            <span id="checkout-shipping-cost-val">${(initialDistrict === 'Provincia (Shalom)' || initialDistrict === 'Provincias (Shalom - Pago en destino)') ? (language === 'es' ? 'Selecciona tarifa' : 'Selecione tarifa') : `S/. ${initialShippingCost.toFixed(2)}`}</span>
          </div>

          <hr style="margin: 1.25rem 0; border: 0; border-top: 1px solid var(--border-color);">

          <div class="price-row total-row flex justify-between font-bold" style="font-size: 1.25rem; color: var(--primary-color);">
            <span>${tTotal}</span>
            <span id="checkout-total-val">S/. ${initialTotal.toFixed(2)}</span>
          </div>
        </aside>

      </div>
    </div>
  `;
}

checkoutView.init = function() {
  const language = AppStore.state.language;
  const submitBtn = document.getElementById('place-order-submit');
  const loadingScreen = document.getElementById('payment-loading-screen');
  const appContainer = document.getElementById('app');

  const tabBtns = document.querySelectorAll('.payment-tab-btn');
  const tabContents = document.querySelectorAll('.payment-tab-content');

  let activeMethod = 'Tarjeta';

  // Payment tabs navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-target');
      document.getElementById(target).classList.add('active');

      if (target === 'pay-card') activeMethod = 'Tarjeta';
      if (target === 'pay-yape') activeMethod = 'Yape';
      if (target === 'pay-transfer') activeMethod = 'Transferencia';
    });
  });

  const districtSelect = document.getElementById('shipping-district');
  const shippingValEl = document.getElementById('checkout-shipping-cost-val');
  const totalValEl = document.getElementById('checkout-total-val');
  const submitTotalValEl = document.getElementById('checkout-submit-total-val');
  const currentUser = AppStore.state.currentUser;

  if (districtSelect && shippingValEl && totalValEl && submitTotalValEl) {
    // If the user has a stored district, pre-select it
    if (currentUser && currentUser.district) {
      districtSelect.value = currentUser.district;
    }

    const provinceFieldsGroup = document.getElementById('province-fields-group');
    const departmentInput = document.getElementById('shipping-department');
    const provinceInput = document.getElementById('shipping-province');
    const districtProvInput = document.getElementById('shipping-district-prov');
    const agencyNameInput = document.getElementById('shipping-agency-name');
    const deliveryDateGroup = document.getElementById('delivery-date-group');
    const deliverySlotGroup = document.getElementById('delivery-slot-group');
    const dateInput = document.getElementById('shipping-date');
    const slotSelect = document.getElementById('shipping-time-slot');
    
    const deliveryTypeHome = document.getElementById('shalom-delivery-type-home');
    const deliveryTypeAgency = document.getElementById('shalom-delivery-type-agency');
    const shalomAgencyGroup = document.getElementById('shalom-agency-name-group');
    const weightEstimateBox = document.getElementById('shalom-weight-estimate-box');
    const weightWarningBox = document.getElementById('shalom-weight-warning-box');
    const weightRateSelect = document.getElementById('shipping-weight-rate');
    const placeOrderBtn = document.getElementById('place-order-submit');
    
    // Dynamic population of provinces based on department select
    if (departmentInput && provinceInput) {
      departmentInput.addEventListener('change', () => {
        const selectedDept = departmentInput.value;
        const lang = AppStore.state.language;
        
        // Clear old options
        provinceInput.innerHTML = `<option value="">-- ${lang === 'es' ? 'Seleccionar' : 'Selecionar'} --</option>`;
        
        if (selectedDept && PERU_DEPARTMENTS[selectedDept]) {
          // Populate provinces and enable
          PERU_DEPARTMENTS[selectedDept].slice().sort().forEach(prov => {
            const opt = document.createElement('option');
            opt.value = prov;
            opt.textContent = prov;
            provinceInput.appendChild(opt);
          });
          provinceInput.disabled = false;
        } else {
          // Disable if no department selected
          provinceInput.disabled = true;
        }
      });
    }
    
    // Function to update totals and fields visibility
    const updateCheckoutTotals = () => {
      const selectedDistrict = districtSelect.value;
      const subtotal = AppStore.getCartSubtotal();
      
      const couponDiscount = sessionStorage.getItem('bf_coupon_discount') || 0;
      const discountPercent = parseFloat(couponDiscount);
      const discountAmount = subtotal * discountPercent;
      
      const isProvince = selectedDistrict === 'Provincia (Shalom)' || selectedDistrict === 'Provincias (Shalom - Pago en destino)';
      
      let shippingCost = 0;
      const totalWeight = AppStore.getCartTotalWeight();
      
      const generalAddressGroup = document.getElementById('general-address-group');
      const addressInput = document.getElementById('shipping-address');
      const shalomHomeAddressGroup = document.getElementById('shalom-home-address-group');
      const shalomHomeAddressInput = document.getElementById('shipping-shalom-home-address');

      if (isProvince) {
        // Hide general address and make NOT required
        if (generalAddressGroup) generalAddressGroup.style.display = 'none';
        if (addressInput) addressInput.required = false;

        // Show province fields and make required
        if (provinceFieldsGroup) provinceFieldsGroup.style.display = 'block';
        if (departmentInput) departmentInput.required = true;
        if (provinceInput) provinceInput.required = true;
        if (districtProvInput) districtProvInput.required = true;
        
        // Hide date/slot and make NOT required
        if (deliveryDateGroup) deliveryDateGroup.style.display = 'none';
        if (deliverySlotGroup) deliverySlotGroup.style.display = 'none';
        if (dateInput) { dateInput.required = false; dateInput.value = ''; }
        if (slotSelect) { slotSelect.required = false; slotSelect.value = ''; }
        
        // Handle delivery type radio toggles and requirements
        const isHome = deliveryTypeHome && deliveryTypeHome.checked;
        if (isHome) {
          if (shalomAgencyGroup) shalomAgencyGroup.style.display = 'none';
          if (agencyNameInput) { agencyNameInput.required = false; agencyNameInput.value = ''; }
          if (shalomHomeAddressGroup) shalomHomeAddressGroup.style.display = 'block';
          if (shalomHomeAddressInput) shalomHomeAddressInput.required = true;
        } else {
          if (shalomAgencyGroup) shalomAgencyGroup.style.display = 'block';
          if (agencyNameInput) agencyNameInput.required = true;
          if (shalomHomeAddressGroup) shalomHomeAddressGroup.style.display = 'none';
          if (shalomHomeAddressInput) { shalomHomeAddressInput.required = false; shalomHomeAddressInput.value = ''; }
        }
        
        // Set up weight estimate text
        if (weightEstimateBox) {
          weightEstimateBox.innerHTML = `<i data-lucide="scale" style="width:16px; height:16px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${AppStore.t('checkoutShalomWeightEstimate', { weight: totalWeight.toFixed(2) })}`;
        }
        
        // Check weight limits
        if (totalWeight > 9.5) {
          if (weightWarningBox) weightWarningBox.style.display = 'block';
          if (placeOrderBtn) {
            placeOrderBtn.disabled = true;
            placeOrderBtn.style.opacity = '0.5';
            placeOrderBtn.style.cursor = 'not-allowed';
          }
        } else {
          if (weightWarningBox) weightWarningBox.style.display = 'none';
          if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.style.opacity = '1';
            placeOrderBtn.style.cursor = 'pointer';
          }
        }
        
        // Calculate dynamic cost
        const weightRateVal = Number(weightRateSelect?.value) || 0;
        if (weightRateSelect) weightRateSelect.required = true;
        
        shippingCost = AppStore.getShippingCost(selectedDistrict, weightRateVal, isHome);
      } else {
        // Standard Lima delivery
        shippingCost = AppStore.getShippingCost(selectedDistrict);
        
        // Show general address and make required
        if (generalAddressGroup) generalAddressGroup.style.display = 'block';
        if (addressInput) addressInput.required = true;

        // Hide province fields and make NOT required
        if (provinceFieldsGroup) provinceFieldsGroup.style.display = 'none';
        if (departmentInput) { departmentInput.required = false; departmentInput.value = ''; }
        if (provinceInput) { 
          provinceInput.required = false; 
          provinceInput.value = ''; 
          provinceInput.innerHTML = `<option value="">-- ${language === 'es' ? 'Seleccionar' : 'Selecionar'} --</option>`;
          provinceInput.disabled = true; 
        }
        if (districtProvInput) { districtProvInput.required = false; districtProvInput.value = ''; }
        if (agencyNameInput) { agencyNameInput.required = false; agencyNameInput.value = ''; }
        if (weightRateSelect) { weightRateSelect.required = false; weightRateSelect.value = ''; }
        if (shalomHomeAddressGroup) shalomHomeAddressGroup.style.display = 'none';
        if (shalomHomeAddressInput) { shalomHomeAddressInput.required = false; shalomHomeAddressInput.value = ''; }
        
        // Show date/slot and make required
        if (deliveryDateGroup) deliveryDateGroup.style.display = 'block';
        if (deliverySlotGroup) deliverySlotGroup.style.display = 'block';
        if (dateInput) dateInput.required = true;
        if (slotSelect) slotSelect.required = true;
        
        // Reset warning and enable btn
        if (weightWarningBox) weightWarningBox.style.display = 'none';
        if (placeOrderBtn) {
          placeOrderBtn.disabled = false;
          placeOrderBtn.style.opacity = '1';
          placeOrderBtn.style.cursor = 'pointer';
        }
      }
      const taxableBase = subtotal - discountAmount;
      const newIgv = taxableBase * 0.18;
      const newTotal = taxableBase + newIgv + shippingCost;
      
      const igvValEl = document.getElementById('checkout-igv-cost-val');
      if (igvValEl) {
        igvValEl.textContent = `S/. ${newIgv.toFixed(2)}`;
      }
      
      shippingValEl.textContent = isProvince && !weightRateSelect?.value
        ? (language === 'es' ? 'Selecciona tarifa' : 'Selecione tarifa')
        : `S/. ${shippingCost.toFixed(2)}`;
      
      totalValEl.textContent = `S/. ${newTotal.toFixed(2)}`;
      submitTotalValEl.textContent = `S/. ${newTotal.toFixed(2)}`;
      
      if (window.lucide) {
        window.lucide.createIcons({
          attrs: { class: 'lucide-icon' }
        });
      }
    };

    districtSelect.addEventListener('change', updateCheckoutTotals);
    if (weightRateSelect) weightRateSelect.addEventListener('change', updateCheckoutTotals);
    if (deliveryTypeHome) deliveryTypeHome.addEventListener('change', updateCheckoutTotals);
    if (deliveryTypeAgency) deliveryTypeAgency.addEventListener('change', updateCheckoutTotals);
    
    // Initial run to ensure correct values on page load
    updateCheckoutTotals();
  }

  // Sunday validation
  const dateInput = document.getElementById('shipping-date');
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      if (!dateInput.value) return;
      const dateObj = new Date(dateInput.value + 'T00:00:00'); // Use local timezone representation
      if (dateObj.getDay() === 0) { // 0 is Sunday
        AppStore.showToast(AppStore.t('checkoutSundayError') || "No realizamos entregas los domingos. Por favor selecciona otro día.", "error");
        dateInput.value = '';
      }
    });
  }

  const cardNumber = document.getElementById('card-number');
  const cardExpiry = document.getElementById('card-expiry');

  if (cardNumber) {
    cardNumber.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let formattedValue = '';
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedValue += ' ';
        }
        formattedValue += value[i];
      }
      e.target.value = formattedValue;
    });
  }

  if (cardExpiry) {
    cardExpiry.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\//g, '').replace(/[^0-9]/gi, '');
      if (value.length > 2) {
        e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
      } else {
        e.target.value = value;
      }
    });
  }

  if (submitBtn && loadingScreen && appContainer) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const shippingForm = document.getElementById('shipping-form');
      if (shippingForm && !shippingForm.checkValidity()) {
        shippingForm.reportValidity();
        return;
      }

      const MAX_VOUCHER_SIZE = 8 * 1024 * 1024; // 8MB
      const ALLOWED_VOUCHER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
      
      const validateVoucher = (file) => {
        if (!file) return false;
        if (file.size > MAX_VOUCHER_SIZE) {
          AppStore.showToast(AppStore.t('toastVoucherSizeError') || "El comprobante supera el límite de 8MB. Por favor, sube un archivo más ligero.", "error");
          return false;
        }
        
        const fileType = file.type ? file.type.toLowerCase() : '';
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        
        const isAllowedType = ALLOWED_VOUCHER_TYPES.includes(fileType);
        const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(fileExt);
        
        if (!isAllowedType && !isAllowedExt) {
          AppStore.showToast(AppStore.t('toastVoucherTypeError') || "Formato no válido. Solo se aceptan imágenes (JPG, PNG, WebP) o PDFs.", "error");
          return false;
        }
        return true;
      };

      let voucherFile = null;
      if (activeMethod === 'Yape') {
        const input = document.getElementById('yape-voucher-file');
        if (input && input.files && input.files[0]) {
          const file = input.files[0];
          if (!validateVoucher(file)) return;
          voucherFile = file;
        } else {
          AppStore.showToast(AppStore.t('checkoutVoucherRequiredError') || "El comprobante de pago es obligatorio para finalizar la compra.", "error");
          return;
        }
      } else if (activeMethod === 'Transferencia') {
        const input = document.getElementById('transfer-voucher-file');
        if (input && input.files && input.files[0]) {
          const file = input.files[0];
          if (!validateVoucher(file)) return;
          voucherFile = file;
        } else {
          AppStore.showToast(AppStore.t('checkoutVoucherRequiredError') || "El comprobante de pago es obligatorio para finalizar la compra.", "error");
          return;
        }
      } else if (activeMethod === 'Tarjeta') {
        const cardNum = document.getElementById('card-number').value.trim();
        const cardExp = document.getElementById('card-expiry').value.trim();
        const cardCvv = document.getElementById('card-cvv').value.trim();
        if (!cardNum || !cardExp || !cardCvv) {
          AppStore.showToast(language === 'es' ? "Los datos de la tarjeta son obligatorios." : "Os dados do cartão são obrigatórios.", "error");
          return;
        }
        if (cardNum.replace(/\s+/g, '').length < 13 || cardExp.length < 5 || cardCvv.length < 3) {
          AppStore.showToast(language === 'es' ? "Por favor ingresa datos de tarjeta válidos." : "Por favor insira dados de cartão válidos.", "error");
          return;
        }
      }

      const selectedDistrict = document.getElementById('shipping-district').value;
      const isProvince = selectedDistrict === 'Provincia (Shalom)' || selectedDistrict === 'Provincias (Shalom - Pago en destino)';
      const dep = isProvince ? document.getElementById('shipping-department').value.trim() : '';
      const prov = isProvince ? document.getElementById('shipping-province').value.trim() : '';
      const districtProv = isProvince ? document.getElementById('shipping-district-prov').value.trim() : '';
      const isHome = isProvince && document.getElementById('shalom-delivery-type-home').checked;
      const agencyName = (isProvince && !isHome) ? document.getElementById('shipping-agency-name').value.trim() : '';
      const weightRate = isProvince ? Number(document.getElementById('shipping-weight-rate').value) : 0;
      let fullAddress = '';
      let shalomHomeAddress = '';
      if (isProvince) {
        if (isHome) {
          shalomHomeAddress = document.getElementById('shipping-shalom-home-address').value.trim();
          fullAddress = `${shalomHomeAddress}, ${districtProv}, ${prov}, ${dep} (Shalom - A domicilio)`;
        } else {
          fullAddress = `Agencia Shalom: ${agencyName}, ${districtProv}, ${prov}, ${dep}`;
        }
      } else {
        fullAddress = document.getElementById('shipping-address').value.trim();
      }
 
      const shippingInfo = {
        name: document.getElementById('shipping-name').value,
        email: document.getElementById('shipping-email').value,
        phone: document.getElementById('shipping-phone').value,
        address: fullAddress + ', ' + selectedDistrict,
        notes: document.getElementById('shipping-notes').value,
        deliveryDate: document.getElementById('shipping-date').value || 'Por definir (Shalom)',
        timeSlot: document.getElementById('shipping-time-slot').value || 'Sujeto a Shalom',
        district: selectedDistrict,
        dni: document.getElementById('shipping-dni').value.trim(),
        department: dep,
        province: prov,
        districtProv: districtProv,
        isHomeDelivery: isHome,
        agencyName: agencyName,
        shalomHomeAddress: shalomHomeAddress,
        manualProvinceRate: weightRate
      };

      loadingScreen.classList.add('active');

      try {
        const newOrder = await AppStore.placeOrder(shippingInfo, activeMethod, voucherFile);
        sessionStorage.removeItem('bf_coupon_discount');
        loadingScreen.classList.remove('active');
        if (newOrder) {
          renderSuccessScreen(newOrder);
        }
      } catch (err) {
        console.error("Checkout order placement error:", err);
        loadingScreen.classList.remove('active');
      }
    });
  }

  function renderSuccessScreen(order) {
    if (!appContainer || !order) return;

    const language = AppStore.state.language;
    const tSuccessTitle = AppStore.t('checkoutSuccessTitle');
    const tSuccessSubtitle = AppStore.t('checkoutSuccessSubtitle');
    const tSuccessReceipt = AppStore.t('checkoutSuccessReceipt');
    
    const tDate = AppStore.t('checkoutReceiptDate');
    const tClient = AppStore.t('checkoutReceiptClient');
    const tAddress = AppStore.t('checkoutReceiptAddress');
    const tMethod = AppStore.t('checkoutReceiptMethod');
    const tDetailsHeader = AppStore.t('checkoutReceiptDetailsHeader');
    const tTotalPaid = AppStore.t('checkoutReceiptTotalPaid');
    
    const tOrdersCTA = AppStore.t('checkoutSuccessOrdersCTA');
    const tCatalogCTA = AppStore.t('checkoutSuccessCatalogCTA');

    appContainer.innerHTML = `
      <div class="container section text-center" style="max-width: 600px; padding: 4rem 1rem;">
        <div class="success-icon-wrapper" style="width: 80px; height: 80px; background: rgba(15, 76, 58, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem auto;">
          <i data-lucide="check" style="width: 48px; height: 48px; color: var(--primary-color);"></i>
        </div>
        <h1 style="font-size: 2.2rem; margin-bottom: 0.5rem;">${tSuccessTitle}</h1>
        <p class="text-success font-semibold" style="font-size: 1.1rem; margin-bottom: 2rem;">${tSuccessSubtitle}</p>
        
        <!-- Receipt Card -->
        <div class="receipt-card bg-surface" style="padding: 2rem; border-radius: 16px; border: 1px dashed var(--border-color); text-align: left; margin-bottom: 2.5rem;">
          <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem; display: flex; justify-content: space-between;">
            <span>${tSuccessReceipt}</span>
            <span style="color: var(--primary-color);">${escapeHTML(order.id)}</span>
          </h3>
          <div style="font-size: 0.95rem; line-height: 1.6;">
            <p><strong>${tDate}</strong> ${escapeHTML(order.date)}</p>
            <p><strong>${tClient}</strong> ${escapeHTML(order.shipping.name)}</p>
            <p><strong>Documento:</strong> ${escapeHTML(order.shipping.dni || 'No registrado')}</p>
            <p><strong>${tAddress}</strong> ${escapeHTML(order.shipping.address)}</p>
            <p><strong>${language === 'es' ? 'Fecha de Entrega:' : 'Data de Entrega:'}</strong> ${escapeHTML(order.shipping.deliveryDate || 'Por definir')}</p>
            <p><strong>${language === 'es' ? 'Horario de Entrega:' : 'Horário de Entrega:'}</strong> ${escapeHTML(order.shipping.timeSlot || 'Por definir')}</p>
            <p><strong>${tMethod}</strong> ${escapeHTML(order.paymentMethod)}</p>
            <p style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
              <strong>${tDetailsHeader}</strong>
            </p>
            <ul style="list-style: none; padding-left: 0; margin-bottom: 1rem;">
              ${order.items.map(item => {
                const productName = escapeHTML(item.name[language] || item.name['es'] || item.name);
                return `
                  <li class="flex justify-between text-sm">
                    <span>${productName} x ${item.quantity}</span>
                    <span>S/. ${formatPrice(item.price * item.quantity)}</span>
                  </li>
                `;
              }).join('')}
            </ul>
            <div class="flex justify-between font-bold" style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; font-size: 1.1rem; color: var(--primary-color);">
              <span>${tTotalPaid}</span>
              <span>S/. ${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="flex gap-1 justify-center mobile-stack">
          <a href="#/orders" class="btn btn-primary">${tOrdersCTA}</a>
          <a href="#/catalog" class="btn btn-secondary-outline">${tCatalogCTA}</a>
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { class: 'lucide-icon' }
      });
    }
  }
};
