/* ============================================
   M_T Bags - Cart Manager
   Handles cart state, rendering, and WhatsApp
   ============================================ */

class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('mt_cart') || '[]');
        this.isOpen = false;
    }

    init() {
        this.updateBadge();
        this.render();
        /* Close cart on overlay click */
        const overlay = document.getElementById('cart-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }
    }

    /* ---- Item Operations ---- */

    addItem(productId, size = null, quantity = 1, colorUrl = null, typedColor = '') {
        const key = `${productId}_${size || 'default'}_${colorUrl || 'default'}_${typedColor || 'default'}`;
        const existing = this.items.find(item =>
            item.productId === productId && item.size === size && item.colorUrl === colorUrl && item.typedColor === typedColor
        );

        if (existing) {
            existing.quantity += quantity;
        } else {
            this.items.push({ productId, size, quantity, colorUrl, typedColor });
        }

        this.save();
        this.updateBadge();
        this.render();
        this.animateCartIcon();
        showToast('تمت الإضافة للسلة - تأكيد الطلب عبر الواتساب');
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.save();
        this.updateBadge();
        this.render();
    }

    updateQuantity(index, delta) {
        this.items[index].quantity += delta;
        if (this.items[index].quantity <= 0) {
            this.removeItem(index);
            return;
        }
        this.save();
        this.updateBadge();
        this.render();
    }

    /* ---- Persistence ---- */

    save() {
        localStorage.setItem('mt_cart', JSON.stringify(this.items));
    }

    /* ---- Calculations ---- */

    getItemPrice(item) {
        const product = getProductById(item.productId);
        if (!product) return 0;
        if (item.size && product.sizes) {
            const sizeObj = product.sizes.find(s => s.name === item.size);
            return sizeObj ? sizeObj.price : getProductBasePrice(product);
        }
        return product.price;
    }

    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (this.getItemPrice(item) * item.quantity);
        }, 0);
    }

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /* ---- UI Toggle ---- */

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        const panel = document.getElementById('cart-panel');
        const overlay = document.getElementById('cart-overlay');
        if (panel) panel.classList.add('open');
        if (overlay) overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        const panel = document.getElementById('cart-panel');
        const overlay = document.getElementById('cart-overlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    /* ---- Badge ---- */

    updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;
        const count = this.getItemCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }

    animateCartIcon() {
        const btn = document.getElementById('cart-btn');
        if (!btn) return;
        btn.classList.add('cart-bounce');
        setTimeout(() => btn.classList.remove('cart-bounce'), 600);
    }

    /* ---- Render ---- */

    render() {
        const container = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="cart-empty">
                    <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    <p>السلة فارغة</p>
                </div>`;
            if (totalEl) totalEl.textContent = formatPrice(0);
            return;
        }

        container.innerHTML = this.items.map((item, index) => {
            const product = getProductById(item.productId);
            if (!product) return '';
            const price = this.getItemPrice(item);
            const imgPath = item.colorUrl ? item.colorUrl : getProductMainImage(product);

            return `
                <div class="cart-item">
                    <img src="${imgPath}" alt="${product.name}" loading="lazy">
                    <div class="cart-item-info">
                        <h4>${product.name}</h4>
                        ${item.size ? `<span class="cart-item-size">${item.size}</span>` : ''}
                        ${item.typedColor ? `<span class="cart-item-size">لون: ${item.typedColor}</span>` : (item.colorUrl ? `<span class="cart-item-size">لون مخصص</span>` : '')}
                        <span class="cart-item-price">${formatPrice(price)}</span>
                    </div>
                    <div class="cart-item-quantity">
                        <button onclick="cart.updateQuantity(${index}, -1)" aria-label="أقل">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="cart.updateQuantity(${index}, 1)" aria-label="أكتر">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="cart.removeItem(${index})" aria-label="حذف">×</button>
                </div>`;
        }).join('');

        if (totalEl) totalEl.textContent = formatPrice(this.getTotal());
    }

    /* ---- WhatsApp ---- */

    sendToWhatsApp() {
        if (this.items.length === 0) {
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello M_T Bags, I would like to inquire about your products.')}`;
            window.open(url, '_blank');
            return;
        }

        let msg = 'Hello M_T Bags, I would like to order the following:\n\n';
        this.items.forEach((item, i) => {
            const product = getProductById(item.productId);
            if (!product) return;
            const price = this.getItemPrice(item);
            msg += `${i + 1}. ${product.name}\n`;
            if (item.size) msg += `Size: ${item.size}\n`;
            if (item.typedColor) {
                msg += `Color: ${item.typedColor}\n`;
            }
            msg += `Quantity: ${item.quantity}\n`;
            msg += `Price: EGP ${price.toLocaleString('en-US')}\n`;
            
            // Add image link
            const imgPath = item.colorUrl ? item.colorUrl : getProductMainImage(product);
            const fullUrl = new URL(imgPath, window.location.href).href;
            msg += `Link: ${fullUrl}\n\n`;
            
            msg += `--------------------\n\n`;
        });
        msg += `Total: EGP ${this.getTotal().toLocaleString('en-US')}\n\nThank you.`;

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }
}

/* ===== TOAST ===== */

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        ${message}`;
    /* Force reflow */
    toast.offsetHeight;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ===== INIT ===== */
const cart = new Cart();
document.addEventListener('DOMContentLoaded', () => cart.init());
