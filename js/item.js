/* ============================================
   M_T Bags - Item Page Logic
   Gallery, zoom, sizes, add to cart
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    const product = getProductById(productId);
    if (!product) {
        window.location.href = 'index.html';
        return;
    }

    renderItemPage(product);
    initZoom();
});

/* ===== STATE ===== */
let selectedSize = null;
let currentImageIndex = 0;
let itemImages = [];
let quantity = 1;

/* ===== RENDER ITEM PAGE ===== */

function renderItemPage(product) {
    itemImages = getProductImages(product);
    const mainImageSrc = itemImages[0];

    /* Update page title */
    document.title = `${product.name} | M_T Bags`;

    /* Breadcrumb */
    const breadcrumb = document.getElementById('item-breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <a href="index.html">الرئيسية</a>
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            <span>${product.name}</span>`;
    }

    /* Product name */
    const nameEl = document.getElementById('item-name');
    if (nameEl) nameEl.textContent = product.name;

    /* Price */
    updatePriceDisplay(product);

    /* Gallery */
    renderGallery(product);

    /* Sizes */
    renderSizes(product);

    /* Quantity */
    initQuantity();

    /* Add to cart */
    const addBtn = document.getElementById('add-to-cart');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (product.sizes && !selectedSize) {
                showToast('اختر المقاس الأول');
                return;
            }
            const colorUrl = itemImages[currentImageIndex];
            const typedColor = document.getElementById('color-input') ? document.getElementById('color-input').value.trim() : '';
            cart.addItem(product.id, selectedSize, quantity, colorUrl, typedColor);
            addBtn.classList.add('added');
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                تمت الإضافة`;
            setTimeout(() => {
                addBtn.classList.remove('added');
                addBtn.innerHTML = `
                    <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    أضف للسلة`;
            }, 1500);
        });
    }
}

/* ===== PRICE ===== */

function updatePriceDisplay(product) {
    const priceEl = document.getElementById('item-price');
    if (!priceEl) return;

    if (product.sizes && selectedSize) {
        const sizeObj = product.sizes.find(s => s.name === selectedSize);
        priceEl.innerHTML = `${sizeObj.price.toLocaleString('ar-EG')} <span class="currency">ج.م</span>`;
    } else if (product.sizes) {
        priceEl.innerHTML = `${getDisplayPrice(product)}`;
    } else {
        priceEl.innerHTML = `${product.price.toLocaleString('ar-EG')} <span class="currency">ج.م</span>`;
    }
}

/* ===== GALLERY ===== */

function renderGallery(product) {
    const mainImg = document.getElementById('main-image');
    const thumbContainer = document.getElementById('thumbnails');
    if (!mainImg || !thumbContainer) return;

    mainImg.src = itemImages[0];
    mainImg.alt = product.name;

    thumbContainer.innerHTML = itemImages.map((img, i) => `
        <div class="item-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
            <img src="${img}" alt="${product.name} - ${i + 1}" loading="lazy">
        </div>
    `).join('');

    /* Thumbnail click */
    thumbContainer.addEventListener('click', (e) => {
        const thumb = e.target.closest('.item-thumb');
        if (!thumb) return;
        const index = parseInt(thumb.dataset.index);
        setActiveImage(index);
    });

    /* Main image click → open zoom */
    const mainImageContainer = document.getElementById('main-image-container');
    if (mainImageContainer) {
        mainImageContainer.addEventListener('click', () => {
            openZoom(currentImageIndex);
        });
    }
}

function setActiveImage(index) {
    currentImageIndex = index;
    const mainImg = document.getElementById('main-image');
    if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
            mainImg.src = itemImages[index];
            mainImg.style.opacity = '1';
        }, 150);
    }
    document.querySelectorAll('.item-thumb').forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}

/* ===== SIZES ===== */

function renderSizes(product) {
    const container = document.getElementById('sizes-container');
    if (!container) return;

    if (!product.sizes) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = `
        <p class="item-sizes-label">اختر المقاس</p>
        <div class="item-sizes-options">
            ${product.sizes.map(size => `
                <button class="size-option" data-size="${size.name}" data-price="${size.price}">
                    ${size.name}
                    <span class="size-price">${formatPrice(size.price)}</span>
                </button>
            `).join('')}
        </div>`;

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.size-option');
        if (!btn) return;
        document.querySelectorAll('.size-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.dataset.size;
        updatePriceDisplay(product);
    });
}

/* ===== QUANTITY ===== */

function initQuantity() {
    const minusBtn = document.getElementById('qty-minus');
    const plusBtn = document.getElementById('qty-plus');
    const qtyDisplay = document.getElementById('qty-value');

    minusBtn?.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            if (qtyDisplay) qtyDisplay.textContent = quantity;
        }
    });

    plusBtn?.addEventListener('click', () => {
        quantity++;
        if (qtyDisplay) qtyDisplay.textContent = quantity;
    });
}

/* ===== IMAGE ZOOM ===== */

let zoomScale = 1;
let zoomTranslateX = 0;
let zoomTranslateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let lastTranslateX = 0;
let lastTranslateY = 0;
let initialPinchDistance = 0;
let initialPinchScale = 1;

function initZoom() {
    const modal = document.getElementById('zoom-modal');
    if (!modal) return;

    const img = document.getElementById('zoom-image');
    const closeBtn = document.getElementById('zoom-close');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const prevBtn = document.getElementById('zoom-prev');
    const nextBtn = document.getElementById('zoom-next');

    /* Close */
    closeBtn?.addEventListener('click', closeZoom);
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('zoom-image-container')) {
            closeZoom();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('open')) return;
        if (e.key === 'Escape') closeZoom();
        if (e.key === 'ArrowRight') navigateZoom(-1);
        if (e.key === 'ArrowLeft') navigateZoom(1);
        if (e.key === '+' || e.key === '=') zoomBy(0.3);
        if (e.key === '-') zoomBy(-0.3);
    });

    /* Zoom buttons */
    zoomInBtn?.addEventListener('click', (e) => { e.stopPropagation(); zoomBy(0.5); });
    zoomOutBtn?.addEventListener('click', (e) => { e.stopPropagation(); zoomBy(-0.5); });
    zoomResetBtn?.addEventListener('click', (e) => { e.stopPropagation(); resetZoom(); });

    /* Navigation */
    prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); navigateZoom(-1); });
    nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); navigateZoom(1); });

    /* Mouse wheel zoom */
    modal.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        zoomBy(delta);
    }, { passive: false });

    /* Mouse drag */
    img?.addEventListener('mousedown', (e) => {
        if (zoomScale <= 1) return;
        e.preventDefault();
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        lastTranslateX = zoomTranslateX;
        lastTranslateY = zoomTranslateY;
        modal.classList.add('dragging');
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        zoomTranslateX = lastTranslateX + (e.clientX - dragStartX);
        zoomTranslateY = lastTranslateY + (e.clientY - dragStartY);
        applyZoomTransform();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        modal.classList.remove('dragging');
    });

    /* Double click to toggle zoom */
    img?.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (zoomScale > 1) {
            resetZoom();
        } else {
            zoomScale = 2.5;
            applyZoomTransform();
        }
    });

    /* Touch: pinch zoom and drag */
    let touchStartDistance = 0;

    img?.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            /* Pinch start */
            e.preventDefault();
            initialPinchDistance = getTouchDistance(e.touches);
            initialPinchScale = zoomScale;
        } else if (e.touches.length === 1 && zoomScale > 1) {
            /* Drag start */
            isDragging = true;
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
            lastTranslateX = zoomTranslateX;
            lastTranslateY = zoomTranslateY;
        }
    }, { passive: false });

    img?.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            /* Pinch move */
            e.preventDefault();
            const dist = getTouchDistance(e.touches);
            zoomScale = Math.max(0.5, Math.min(5, initialPinchScale * (dist / initialPinchDistance)));
            applyZoomTransform();
        } else if (e.touches.length === 1 && isDragging) {
            /* Drag move */
            e.preventDefault();
            zoomTranslateX = lastTranslateX + (e.touches[0].clientX - dragStartX);
            zoomTranslateY = lastTranslateY + (e.touches[0].clientY - dragStartY);
            applyZoomTransform();
        }
    }, { passive: false });

    img?.addEventListener('touchend', () => {
        isDragging = false;
    });

    /* Touch swipe for navigation (when not zoomed) */
    let swipeStartX = 0;
    modal.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && zoomScale <= 1) {
            swipeStartX = e.touches[0].clientX;
        }
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
        if (zoomScale <= 1 && swipeStartX) {
            const diff = swipeStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 60) {
                navigateZoom(diff < 0 ? 1 : -1);
            }
            swipeStartX = 0;
        }
    }, { passive: true });
}

function openZoom(index) {
    const modal = document.getElementById('zoom-modal');
    const img = document.getElementById('zoom-image');
    if (!modal || !img) return;

    currentImageIndex = index;
    img.src = itemImages[index];
    resetZoom();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeZoom() {
    const modal = document.getElementById('zoom-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    resetZoom();
}

function navigateZoom(direction) {
    const newIndex = ((currentImageIndex + direction) % itemImages.length + itemImages.length) % itemImages.length;
    currentImageIndex = newIndex;
    const img = document.getElementById('zoom-image');
    if (img) {
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = itemImages[newIndex];
            img.style.opacity = '1';
        }, 150);
    }
    resetZoom();
    /* Also update main page thumbnail */
    setActiveImage(newIndex);
}

function zoomBy(delta) {
    zoomScale = Math.max(0.5, Math.min(5, zoomScale + delta));
    if (zoomScale <= 1) {
        zoomTranslateX = 0;
        zoomTranslateY = 0;
    }
    applyZoomTransform();
}

function resetZoom() {
    zoomScale = 1;
    zoomTranslateX = 0;
    zoomTranslateY = 0;
    applyZoomTransform();
}

function applyZoomTransform() {
    const img = document.getElementById('zoom-image');
    if (img) {
        img.style.transform = `translate(${zoomTranslateX}px, ${zoomTranslateY}px) scale(${zoomScale})`;
    }
}

function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}
