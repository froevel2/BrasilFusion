import { AppStore } from '../store.js';
import { escapeHTML } from '../utils.js';

export async function ordersView() {
  const orders = [...AppStore.state.orders].sort((a, b) => {
    const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0);
    const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0);
    return timeB - timeA;
  });
  const language = AppStore.state.language;

  const tTitle = AppStore.t('ordersPageTitle');
  const tDesc = AppStore.t('ordersPageDesc');
  const tEmptyTitle = AppStore.t('ordersEmptyTitle');
  const tEmptyDesc = AppStore.t('ordersEmptyDesc');
  const tEmptyCTA = AppStore.t('ordersEmptyCTA');
  
  const tCode = AppStore.t('ordersCodeHeader');
  const tDate = AppStore.t('ordersDateHeader');
  const tTotal = AppStore.t('ordersTotalHeader');
  const tStatus = AppStore.t('ordersStatusHeader');
  
  const tInvoiceBtn = AppStore.t('ordersInvoiceBtn');
  const tSupportBtn = AppStore.t('ordersSupportBtn');
  const tDetailsHeader = AppStore.t('ordersDetailsHeader');
  const tShippingHeader = AppStore.t('ordersShippingSectionHeader');

  return `
    <div class="container section">
      <div class="flex justify-between align-center mobile-stack gap-1" style="margin-bottom: 2.5rem;">
        <div>
          <h1 class="page-title">${tTitle}</h1>
          <p class="text-muted">${tDesc}</p>
        </div>
        <a href="#/catalog" class="btn btn-secondary-outline btn-sm flex align-center gap-05">
          <i data-lucide="shopping-bag"></i> ${AppStore.t('cartContinueShopping')}
        </a>
      </div>

      ${orders.length === 0 ? `
        <div class="text-center bg-surface" style="padding: 6rem 1rem; border-radius: 16px; border: 1px solid var(--border-color);">
          <i data-lucide="package" class="empty-icon" style="width: 64px; height: 64px; margin: 0 auto 1.5rem auto; opacity: 0.5;"></i>
          <h2>${tEmptyTitle}</h2>
          <p class="text-muted" style="margin-top: 1rem; max-width: 400px; margin-left: auto; margin-right: auto;">
            ${tEmptyDesc}
          </p>
          <a href="#/catalog" class="btn btn-primary" style="margin-top: 2rem;">${tEmptyCTA}</a>
        </div>
      ` : `
        <div class="orders-list flex flex-col gap-15">
          ${orders.map((order, idx) => {
            const isFirst = idx === 0;
            
            // Translate status badge
            let displayStatus = order.status;
            if (language === 'pt') {
              if (order.status === 'Entregado') displayStatus = 'Entregue';
              if (order.status === 'En preparación') displayStatus = 'Em preparação';
            }
            
            const statusClass = order.status === 'Entregado' ? 'status-delivered' : 'status-pending';
            
            return `
              <div class="order-card bg-surface ${isFirst ? 'active' : ''}" data-id="${order.id}">
                <!-- Order Card Summary Header -->
                <div class="order-card-header flex justify-between align-center mobile-stack gap-1 cursor-pointer">
                  <div class="flex gap-2 mobile-stack gap-05">
                    <div>
                      <span class="text-xs text-muted block font-semibold">${tCode}</span>
                      <span class="font-bold text-dark" style="font-size: 1.1rem;">${escapeHTML(order.id)}</span>
                    </div>
                    <div>
                      <span class="text-xs text-muted block font-semibold">${tDate}</span>
                      <span class="font-semibold text-dark">${order.date}</span>
                    </div>
                    <div>
                      <span class="text-xs text-muted block font-semibold">${tTotal}</span>
                      <span class="font-bold text-dark">S/. ${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div class="flex align-center gap-1">
                    <span class="order-status-badge ${statusClass}">${displayStatus}</span>
                    <i data-lucide="chevron-down" class="order-card-toggle-icon"></i>
                  </div>
                </div>

                <!-- Order Card Details (Collapsible) -->
                <div class="order-card-details">
                  <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid var(--border-color);">
                  


                  <div class="grid grid-2 gap-2 mobile-stack">
                    <!-- Items Purchased -->
                    <div>
                      <h4 style="margin-bottom: 1rem; color: var(--primary-color); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">${tDetailsHeader}</h4>
                      <div class="order-items-details-list flex flex-col gap-05">
                        ${order.items.map(item => {
                          const itemName = item.name[language] || item.name['es'] || item.name;
                          return `
                            <div class="flex justify-between align-center text-sm py-05" style="border-bottom: 1px dashed var(--border-color);">
                              <span><strong>${itemName}</strong> x ${item.quantity}</span>
                              <span class="font-semibold">S/. ${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>

                    <!-- Shipping and payment info -->
                    <div class="bg-surface" style="padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
                      <h4 style="margin-bottom: 1rem; color: var(--primary-color);">${tShippingHeader}</h4>
                      <p class="text-sm" style="margin-bottom: 0.5rem;"><strong>${language === 'es' ? 'Destinatario:' : 'Destinatário:'}</strong> ${escapeHTML(order.shipping.name)}</p>
                       <p class="text-sm" style="margin-bottom: 0.5rem;"><strong>${language === 'es' ? 'Dirección:' : 'Endereço:'}</strong> ${escapeHTML(order.shipping.address)}</p>
                      <p class="text-sm" style="margin-bottom: 0.5rem;"><strong>${language === 'es' ? 'Contacto:' : 'Contato:'}</strong> ${escapeHTML(order.shipping.phone)}</p>
                      <p class="text-sm" style="margin-bottom: 0.5rem;"><strong>${language === 'es' ? 'Entrega Programada:' : 'Entrega Programada:'}</strong> ${escapeHTML(order.shipping.deliveryDate || 'Hoy/Inmediato')} (${escapeHTML(order.shipping.timeSlot || 'Por definir')})</p>
                      <p class="text-sm" style="margin-bottom: 0.5rem;"><strong>${language === 'es' ? 'Método de Pago:' : 'Forma de Pagamento:'}</strong> ${escapeHTML(order.paymentMethod)}</p>
                      <p class="text-sm" style="margin-bottom: 0.5rem;">
                        <strong>${language === 'es' ? 'Comprobante:' : 'Comprovante:'}</strong> 
                        ${order.voucherUrl 
                          ? `<a href="${order.voucherUrl}" target="_blank" class="text-success font-semibold" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="file-check" style="width:14px; height:14px;"></i> ${language === 'es' ? 'Ver comprobante' : 'Ver comprovante'}</a>`
                          : `<span class="text-muted">${language === 'es' ? 'No adjuntado' : 'Não enviado'}</span>`
                        }
                      </p>

                      <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
                        <div class="flex gap-05" style="display: flex; gap: 0.5rem; width: 100%;">
                          <button class="btn btn-secondary-outline btn-sm w-full download-invoice-btn" data-id="${order.id}" style="display: flex; align-items: center; justify-content: center; gap: 4px;"><i data-lucide="download" style="width: 14px;"></i> ${tInvoiceBtn}</button>
                          <button class="btn btn-secondary-outline btn-sm w-full support-order-btn" data-id="${order.id}" style="display: flex; align-items: center; justify-content: center; gap: 4px;"><i data-lucide="message-circle" style="width: 14px;"></i> ${tSupportBtn}</button>
                        </div>
                        <button class="btn btn-secondary-outline btn-sm w-full claim-order-btn" data-id="${order.id}" data-date="${order.date}" style="display: flex; align-items: center; justify-content: center; gap: 4px; color: var(--danger-color); border-color: var(--danger-color); font-weight: 600;"><i data-lucide="alert-triangle" style="width: 14px;"></i> ${AppStore.t('ordersReportClaimBtn')}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

ordersView.init = function() {
  const cards = document.querySelectorAll('.order-card');
  cards.forEach(card => {
    const header = card.querySelector('.order-card-header');
    header.addEventListener('click', () => {
      const isActive = card.classList.contains('active');
      cards.forEach(c => c.classList.remove('active'));
      if (!isActive) {
        card.classList.add('active');
      }
    });
  });

  document.querySelectorAll('.support-order-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const supportMsg = AppStore.t('toastSupportRedirect', { id: id });
      AppStore.showToast(supportMsg, 'info');
      setTimeout(() => {
        window.open(`https://wa.me/51987654321?text=Olá,%20gostaria%20de%20ajuda%20com%20meu%20pedido%20${id}`, '_blank');
      }, 1000);
    });
  });

  document.querySelectorAll('.download-invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const invoiceMsg = AppStore.t('toastInvoiceDownload', { id: id });
      AppStore.showToast(invoiceMsg, 'success');
    });
  });

  document.querySelectorAll('.claim-order-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const date = btn.getAttribute('data-date');
      const email = 'yasmin_lucia@hotmail.com';
      const isEs = AppStore.state.language === 'es';
      
      // Copiar correo al portapapeles como respaldo por si falla su cliente de correo local
      navigator.clipboard.writeText(email).then(() => {
        AppStore.showToast(isEs 
          ? "Correo de soporte (yasmin_lucia@hotmail.com) copiado al portapapeles. Abriendo tu app de correo..." 
          : "E-mail de suporte (yasmin_lucia@hotmail.com) copiado para a área de transferência. Abrindo seu app de e-mail...", 
          "info"
        );
      }).catch(err => {
        console.warn("No se pudo copiar al portapapeles:", err);
      });

      const subject = encodeURIComponent(isEs ? `Reclamo sobre mi Pedido ${id}` : `Reclamação sobre meu Pedido ${id}`);
      const body = encodeURIComponent(isEs
        ? `Hola Brasil Fusión, deseo reportar un inconveniente con mi pedido ${id} realizado el ${date}. Adjunto a este correo las fotografías de los productos afectados y detallo el inconveniente a continuación:\n\n[Escribe aquí tu mensaje describiendo qué productos llegaron dañados o en mal estado]`
        : `Olá Brasil Fusión, desejo relatar um inconveniente com meu pedido ${id} feito em ${date}. Anexo a este e-mail as fotografias dos produtos afetados e detalho o problema a seguir:\n\n[Escreva aqui sua mensagem descrevendo quais produtos chegaram danificados ou em mau estado]`);
      
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    });
  });
};
