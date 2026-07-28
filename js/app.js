/* ============================================
   M_T Bags - Home Page Logic
   Hero slider, products grid, search
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    renderProducts(PRODUCTS);
    initSearch();
});

/* ===== HERO SLIDER ===== */

function initHeroSlider() {
    const slidesContainer = document.getElementById('hero-slides');
    const dotsContainer = document.getElementById('hero-dots');
    if (!slidesContainer || !dotsContainer) return;

    /* Pick hero images from different products */
    const heroItems = [
        { product: PRODUCTS[11], text: 'أناقة تدوم', sub: 'اكتشف أجود الشنط المدرسية' },
        { product: PRODUCTS[7], text: 'جودة عالية', sub: 'تصاميم عصرية تناسب جميع الأذواق' },
        { product: PRODUCTS[1], text: 'أسعار مميزة', sub: 'أفضل الخامات بأحسن الأسعار' },
        { product: PRODUCTS[4], text: 'تشكيلة واسعة', sub: 'أكثر من ١٢ موديل مختلف' }
    ];

    slidesContainer.innerHTML = heroItems.map(item => `
        <div class="hero-slide">
            <img src="${getProductMainImage(item.product)}" alt="${item.text}" loading="eager">
            <div class="hero-overlay">
                <h2>${item.text}</h2>
                <p>${item.sub}</p>
            </div>
        </div>
    `).join('');

    dotsContainer.innerHTML = heroItems.map((_, i) =>
        `<span class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
    ).join('');

    let currentSlide = 0;
    const totalSlides = heroItems.length;

    function goToSlide(index) {
        currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
        
        document.querySelectorAll('.hero-slide').forEach((slide, i) => {
            let offset = i - currentSlide;
            // Handle wrap-around for infinite feeling
            if (offset > totalSlides / 2) offset -= totalSlides;
            if (offset < -totalSlides / 2) offset += totalSlides;
            
            slide.style.setProperty('--offset', offset);
            slide.classList.toggle('active', i === currentSlide);
        });

        document.querySelectorAll('.hero-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    /* Navigation buttons */
    document.getElementById('hero-prev')?.addEventListener('click', () => goToSlide(currentSlide - 1));
    document.getElementById('hero-next')?.addEventListener('click', () => goToSlide(currentSlide + 1));

    /* Dots click */
    dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.hero-dot');
        if (dot) goToSlide(parseInt(dot.dataset.index));
    });

    // Initialize positions
    goToSlide(0);

    /* Auto-play */
    let autoPlay = setInterval(() => goToSlide(currentSlide + 1), 4500);

    /* Pause on hover */
    const hero = document.querySelector('.hero');
    hero?.addEventListener('mouseenter', () => clearInterval(autoPlay));
    hero?.addEventListener('mouseleave', () => {
        autoPlay = setInterval(() => goToSlide(currentSlide + 1), 4500);
    });

    /* Touch swipe */
    let touchStartX = 0;
    hero?.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(autoPlay);
    }, { passive: true });
    hero?.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            /* RTL: swipe directions are reversed */
            goToSlide(currentSlide + (diff < 0 ? 1 : -1));
        }
        autoPlay = setInterval(() => goToSlide(currentSlide + 1), 4500);
    }, { passive: true });
}

/* ===== PRODUCTS GRID ===== */

function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>لا توجد نتائج</p>
            </div>`;
        return;
    }

    grid.innerHTML = products.map((product, i) => `
        <div class="product-card animate-in" style="animation-delay: ${i * 0.06}s">
            <a href="item.html?id=${product.id}" class="product-card-link">
                <div class="product-card-img">
                    <img src="${getProductMainImage(product)}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-card-info">
                    <h3 class="product-card-name">${product.name}</h3>
                    <p class="product-card-price">${getDisplayPrice(product)}</p>
                    <button class="product-card-btn" onclick="event.preventDefault(); window.location.href='item.html?id=${product.id}'">
                        تفاصيل
                    </button>
                </div>
            </a>
        </div>
    `).join('');
}

/* ===== SEARCH ===== */

function initSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    if (!searchBtn || !searchInput) return;

    searchBtn.addEventListener('click', () => {
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            renderProducts(PRODUCTS);
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
            renderProducts(PRODUCTS);
            return;
        }
        const filtered = PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(query)
        );
        renderProducts(filtered);
    });

    /* Close search on Escape */
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.classList.remove('active');
            searchInput.value = '';
            renderProducts(PRODUCTS);
        }
    });
}
