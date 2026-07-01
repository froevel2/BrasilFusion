import { AppStore } from '../store.js';

export async function devolucionesView() {
  const language = AppStore.state.language;

  const isEs = language === 'es';

  return `
    <div class="container section" style="max-width: 800px; padding: 4rem 1rem;">
      <h1 class="page-title text-center" style="margin-bottom: 3rem; color: var(--primary-color);">
        ${isEs ? 'Política de Devoluciones y Cambios' : 'Política de Devoluções e Trocas'}
      </h1>

      <div class="checkout-card bg-surface" style="padding: 2.5rem; border-radius: 16px; border: 1px solid var(--border-color); line-height: 1.8; color: var(--text-dark);">
        
        <p style="font-size: 1.1rem; margin-bottom: 2rem; font-weight: 500; text-align: center; color: var(--text-muted);">
          ${isEs 
            ? 'La satisfacción de nuestros clientes es muy importante para nosotros. Por ello, contamos con la siguiente política de devoluciones y cambios.' 
            : 'A satisfação dos nossos clientes é muito importante para nós. Por isso, contamos com a seguinte política de devoluções e trocas.'}
        </p>

        <h3 style="color: var(--primary-color); margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.3rem; border-left: 4px solid var(--accent-color); padding-left: 0.75rem; font-weight: 700;">
          ${isEs ? '1. Productos dañados o con defectos' : '1. Produtos danificados ou com defeitos'}
        </h3>
        <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
          ${isEs
            ? 'Si algún producto llega dañado, defectuoso o en malas condiciones, el cliente deberá comunicarse con nosotros por correo electrónico dentro de las primeras <strong>48 horas</strong> posteriores a la recepción del pedido, enviando fotografías claras del producto y una descripción detallada del inconveniente.'
            : 'Se algum produto chegar danificado, defeituoso ou em más condições, o cliente deverá entrar em contato conosco por e-mail dentro das primeiras <strong>48 horas</strong> após o recebimento do pedido, enviando fotos nítidas do produto e uma descrição detalhada do problema.'}
        </p>
        <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
          ${isEs
            ? 'Una vez revisada la información, evaluaremos el caso y, de corresponder, procederemos con el reembolso del importe pagado por el producto afectado.'
            : 'Após analisarmos as informações, avaliaremos o caso e, se aplicável, procederemos com o reembolso do valor pago pelo produto afetado.'}
        </p>

        <h3 style="color: var(--primary-color); margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.3rem; border-left: 4px solid var(--accent-color); padding-left: 0.75rem; font-weight: 700;">
          ${isEs ? '2. Devoluciones por decisión del cliente' : '2. Devoluções por decisão do cliente'}
        </h3>
        <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
          ${isEs
            ? 'Por motivos de higiene, seguridad alimentaria y control de calidad, <strong>no aceptamos devoluciones ni cambios de productos alimenticios una vez entregados</strong>, salvo que presenten defectos, daños o errores en el pedido atribuibles a nuestra empresa.'
            : 'Por motivos de higiene, segurança alimentar e controle de qualidade, <strong>não aceitamos devoluções nem trocas de produtos alimentícios após a entrega</strong>, exceto se apresentarem defeitos, danos ou erros no pedido atribuíveis à nossa empresa.'}
        </p>
        <p style="margin-bottom: 1.5rem; font-size: 0.95rem; font-style: italic; color: var(--text-muted);">
          ${isEs
            ? 'Antes de confirmar su compra, recomendamos verificar cuidadosamente los productos seleccionados.'
            : 'Antes de confirmar sua compra, recomendamos verificar cuidadosamente os produtos selecionados.'}
        </p>

        <h3 style="color: var(--primary-color); margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.3rem; border-left: 4px solid var(--accent-color); padding-left: 0.75rem; font-weight: 700;">
          ${isEs ? '3. Productos enviados a provincia' : '3. Produtos enviados para província'}
        </h3>
        <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
          ${isEs
            ? 'En caso de que un producto llegue dañado durante el transporte, el cliente deberá notificarnos dentro de las primeras <strong>48 horas</strong> posteriores a la recepción del pedido, adjuntando fotografías del producto y del embalaje recibido.'
            : 'Caso um produto seja danificado durante o transporte, o cliente deverá nos notificar dentro das primeiras <strong>48 horas</strong> após o recebimento do pedido, anexando fotos do produto e da embalagem recebida.'}
        </p>
        <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
          ${isEs
            ? 'Cada caso será evaluado de manera individual para determinar la solución correspondiente.'
            : 'Cada caso será avaliado individualmente para determinar a solução correspondente.'}
        </p>

        <h3 style="color: var(--primary-color); margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.3rem; border-left: 4px solid var(--accent-color); padding-left: 0.75rem; font-weight: 700;">
          ${isEs ? '4. Reembolsos' : '4. Reembolsos'}
        </h3>
        <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
          ${isEs
            ? 'Cuando corresponda un reembolso, este se realizará mediante transferencia bancaria a la cuenta indicada por el cliente. El plazo para procesar el reembolso es de hasta <strong>3 días hábiles</strong> a partir de la aprobación de la solicitud.'
            : 'Quando for cabível um reembolso, este será realizado via transferência bancária para a conta indicada pelo cliente. O prazo para processar o reembolso é de até <strong>3 dias úteis</strong> a partir da aprovação da solicitação.'}
        </p>

        <!-- Help box -->
        <div style="background: rgba(15, 76, 58, 0.05); padding: 1.5rem; border-radius: 8px; margin-top: 3rem; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <i data-lucide="help-circle" style="color: var(--primary-color); width: 32px; height: 32px; flex-shrink: 0;"></i>
          <div style="flex: 1; min-width: 250px;">
            <h5 style="margin-bottom: 0.25rem; font-weight: 700; color: var(--primary-color);">
              ${isEs ? '¿Tienes alguna duda o reporte?' : 'Você tem alguma dúvida ou relato?'}
            </h5>
            <p style="margin-bottom: 0; font-size: 0.85rem; color: var(--text-muted);">
              ${isEs 
                ? 'Comunícate con nosotros directamente a nuestro correo de soporte:' 
                : 'Entre em contato conosco diretamente pelo nosso e-mail de suporte:'}
              <a href="mailto:yasmin_lucia@hotmail.com" class="btn-link" style="font-weight: 600; text-decoration: underline; margin-left: 4px;">yasmin_lucia@hotmail.com</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  `;
}

devolucionesView.init = function() {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: 'lucide-icon' }
    });
  }
};
