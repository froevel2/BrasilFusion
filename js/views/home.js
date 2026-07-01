import { AppStore } from '../store.js';
import { TESTIMONIALS, FAQS } from '../data.js';

export async function homeView() {
  const language = AppStore.state.language;
  const featured = AppStore.state.products.filter(p => p && p.tags && p.tags.es && Array.isArray(p.tags.es) && p.tags.es.includes('Destacado')).slice(0, 3);

  // Fetch translations
  const tHeroBadge = AppStore.t('homeHeroBadge');
  const tHeroHeadingLine1 = AppStore.t('homeHeroHeadingLine1');
  const tHeroHeadingLine2 = AppStore.t('homeHeroHeadingLine2');
  const tHeroDesc = AppStore.t('homeHeroDesc');
  const tHeroCTA1 = AppStore.t('homeHeroCTA1');
  const tHeroCTA2 = AppStore.t('homeHeroCTA2');
  
  
  const tFeatSub = AppStore.t('homeFeaturedSub');
  const tFeatHeading = AppStore.t('homeFeaturedHeading');
  const tFeatAll = AppStore.t('homeFeaturedAll');
  
  const tTestSub = AppStore.t('homeTestimonialsSub');
  const tTestHeading = AppStore.t('homeTestimonialsHeading');
  
  const tFaqSub = AppStore.t('homeFAQSub');
  const tFaqHeading = AppStore.t('homeFAQHeading');

  const tStockLow = AppStore.t('lowStock');
  const tViewDetail = AppStore.t('viewDetails');
  const tOutOfStock = AppStore.t('outOfStock');
  
  const tMissionHeading = AppStore.t('homeMissionHeading');
  const tMissionText = AppStore.t('homeMissionText');

  return `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-radial-bg"></div>
      <div class="container">
        <!-- Left Content -->
        <div class="hero-content-left fade-in-up">
          <div class="hero-badge-container">
            <span class="hero-custom-badge">${tHeroBadge}</span>
          </div>
          <h1 class="hero-custom-title">
            <span class="title-line-1">${tHeroHeadingLine1}</span>
            <span class="title-line-2">${tHeroHeadingLine2}</span>
          </h1>
          <p class="hero-custom-desc">${tHeroDesc}</p>
          <div class="hero-custom-actions">
            <a href="#/catalog" class="btn-hero-primary">${tHeroCTA1}</a>
            <a href="#/destacados" class="btn-hero-secondary" style="display:inline-flex; align-items:center; gap:8px;"><i data-lucide="star" style="width:18px; height:18px;"></i> ${tHeroCTA2}</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="section mission-section text-center" style="background-color: var(--primary-light); padding: 5rem 1rem; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
      <div class="container" style="max-width: 800px; margin: 0 auto;">
        <span class="sub-heading" style="color: var(--accent-color); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.85rem; display: block; margin-bottom: 1rem;">
          ${language === 'es' ? 'Nuestra Misión' : 'Nossa Missão'}
        </span>
        <h2 style="font-size: 2rem; font-weight: 800; line-height: 1.3; margin-bottom: 1.5rem; font-family: var(--font-heading); color: var(--primary-color);">
          ${tMissionHeading}
        </h2>
        <p style="font-size: 1.2rem; color: var(--text-dark); opacity: 0.95; line-height: 1.8; font-style: italic; font-family: var(--font-body); max-width: 720px; margin: 0 auto;">
          "${tMissionText}"
        </p>
        <div style="width: 60px; height: 3px; background: var(--accent-color); margin: 2rem auto 0 auto; border-radius: var(--radius-full);"></div>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section id="featured-products" class="section featured-section bg-surface">
      <div class="container">
        <div class="section-header flex justify-between align-end mobile-stack">
          <div>
            <span class="sub-heading">${tFeatSub}</span>
            <h2>${tFeatHeading}</h2>
          </div>
          <a href="#/catalog" class="btn-link">${tFeatAll} <i data-lucide="arrow-right"></i></a>
        </div>
        
        <div class="grid grid-3 gap-2" style="margin-top: 3rem;">
          ${featured.map(product => {
            const productName = product.name[language] || product.name['es'];
            const productCategory = product.category[language] || product.category['es'];
            const productStockLow = tStockLow.replace('{stock}', product.stock);
            const hasDiscount = product.salePrice && product.salePrice > 0 && product.salePrice < product.price;

            return `
              <div class="product-card fade-in">
                <div class="product-img-wrapper">
                  <img src="${product.image}" alt="${productName}" class="product-img">
                  ${product.stock === 0 
                    ? `<span class="product-badge badge-danger">${tOutOfStock}</span>` 
                    : product.stock <= 10 
                      ? `<span class="product-badge badge-warning">${productStockLow}</span>` 
                      : ''
                  }
                  ${hasDiscount ? `<span class="product-badge badge-discount" style="background-color: var(--danger-color); color: white; position: absolute; top: 1rem; right: 1rem; padding: 0.35rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; z-index: 10;">-${Math.round((1 - (product.salePrice / product.price)) * 100)}%</span>` : ''}
                  <a href="#/product/${product.id}" class="quick-view-badge-overlay" title="${tViewDetail}">
                    <span>${tViewDetail}</span>
                  </a>
                </div>
                <div class="product-card-body">
                  <span class="product-category">${productCategory}</span>
                  <h3 class="product-title"><a href="#/product/${product.id}">${productName}</a></h3>
                  <div class="product-rating flex align-center gap-05">
                    <div class="stars flex">
                      ${Array.from({ length: 5 }).map((_, i) => `
                        <i data-lucide="star" class="${i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}"></i>
                      `).join('')}
                    </div>
                    <span class="rating-val">(${product.reviewsCount})</span>
                  </div>
                  <div class="product-footer flex justify-between align-center" style="margin-top: 1rem;">
                    <div class="product-price-blockflex" style="display: flex; flex-direction: column;">
                      ${hasDiscount 
                        ? `<span class="product-price-original" style="text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem;">S/. ${product.price.toFixed(2)}</span>
                           <span class="product-price-discount font-bold" style="color: var(--danger-color); font-size: 1.15rem;">S/. ${product.salePrice.toFixed(2)}</span>`
                        : `<span class="product-price font-bold" style="font-size: 1.15rem;">S/. ${product.price.toFixed(2)}</span>`
                      }
                    </div>
                    <button class="quick-add-btn-footer btn btn-primary btn-sm flex align-center justify-center ${product.stock === 0 ? 'btn-disabled' : ''}" data-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''} title="${AppStore.t('quickAdd')}" style="padding: 0.5rem; border-radius: 50%; width: 36px; height: 36px;">
                      <i data-lucide="shopping-cart" style="width: 18px; height: 18px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="section testimonials-section">
      <div class="container">
        <div class="section-header text-center">
          <span class="sub-heading">${tTestSub}</span>
          <h2>${tTestHeading}</h2>
        </div>

        <div class="grid grid-3 gap-2" style="margin-top: 3rem;">
          ${TESTIMONIALS.map(t => {
            const testimonialRole = t.role[language] || t.role['es'];
            const testimonialComment = t.comment[language] || t.comment['es'];

            return `
              <div class="testimonial-card">
                <div class="testimonial-header flex align-center gap-1">
                  <img src="${t.avatar}" alt="${t.name}" class="testimonial-avatar">
                  <div>
                    <h4>${t.name}</h4>
                    <span class="testimonial-role">${testimonialRole}</span>
                  </div>
                </div>
                <div class="testimonial-rating">
                  ${Array.from({ length: 5 }).map((_, i) => `
                    <i data-lucide="star" class="star-filled" style="width: 16px; height: 16px;"></i>
                  `).join('')}
                </div>
                <p class="testimonial-comment">"${testimonialComment}"</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="section faq-section bg-surface">
      <div class="container">
        <div class="section-header text-center">
          <span class="sub-heading">${tFaqSub}</span>
          <h2>${tFaqHeading}</h2>
        </div>

        <div class="faq-container" style="max-width: 800px; margin: 3rem auto 0 auto;">
          ${FAQS.map((faq, index) => {
            const faqQuestion = faq.question[language] || faq.question['es'];
            const faqAnswer = faq.answer[language] || faq.answer['es'];

            return `
              <div class="faq-item" data-index="${index}">
                <button class="faq-question flex justify-between align-center">
                  <span>${faqQuestion}</span>
                  <i data-lucide="chevron-down" class="faq-icon"></i>
                </button>
                <div class="faq-answer">
                  <div class="faq-answer-content">
                    <p>${faqAnswer}</p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}

// Bind FAQ and featured scrolling click actions
homeView.init = function() {
  if (window.location.hash.includes('/faq')) {
    setTimeout(() => {
      const faqSection = document.querySelector('.faq-section');
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }

  if (window.location.hash.includes('/destacados')) {
    setTimeout(() => {
      const featuredSection = document.getElementById('featured-products');
      if (featuredSection) {
        featuredSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  const quickAddBtns = document.querySelectorAll('.quick-add-btn-footer');
  quickAddBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      AppStore.addToCart(id, 1);
    });
  });
}
