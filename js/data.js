/* ============================================
   M_T Bags - Products Data
   ============================================ */

const WHATSAPP_NUMBER = '201125085044';
const LOGO_PATH = './pictures/logo/logo.jpeg';

const PRODUCTS = [
    {
        id: 1,
        name: 'جربنديه تش تشا',
        price: 850,
        imageCount: 7,
        sizes: null
    },
    {
        id: 2,
        name: 'طقم فيجين',
        price: 1300,
        imageCount: 7,
        sizes: null
    },
    {
        id: 3,
        name: 'جربنديه كوكب',
        price: 800,
        imageCount: 5,
        sizes: null
    },
    {
        id: 4,
        name: 'طقم فيجو',
        price: 1150,
        imageCount: 4,
        sizes: null
    },
    {
        id: 5,
        name: 'طقم سيشين',
        price: 1200,
        imageCount: 10,
        sizes: null
    },
    {
        id: 6,
        name: 'جربنديه بيركن',
        price: 800,
        imageCount: 4,
        sizes: null
    },
    {
        id: 7,
        name: 'طقم يوني كورن',
        price: null,
        imageCount: 11,
        sizes: [
            { name: 'مقاس 16 (صغير)', price: 1000 },
            { name: 'مقاس 18 (كبير)', price: 1100 }
        ]
    },
    {
        id: 8,
        name: 'ماجستيك مشجر',
        price: 1400,
        imageCount: 17,
        sizes: null
    },
    {
        id: 9,
        name: 'عمالقه',
        price: null,
        imageCount: 10,
        sizes: [
            { name: 'صغير', price: 1200 },
            { name: 'كبير', price: 1300 }
        ]
    },
    {
        id: 10,
        name: 'فلوريد ٢ حاجز',
        price: 1050,
        imageCount: 15,
        sizes: null
    },
    {
        id: 11,
        name: 'مشجر ممولي',
        price: 1100,
        imageCount: 15,
        sizes: null
    },
    {
        id: 12,
        name: 'جراند',
        price: 1900,
        imageCount: 15,
        sizes: null
    }
];

/* ===== HELPER FUNCTIONS ===== */

function getProductById(id) {
    return PRODUCTS.find(p => p.id === parseInt(id));
}

function getProductImages(product) {
    const images = [];
    for (let i = 1; i <= product.imageCount; i++) {
        images.push(`./pictures/${product.id}/${i}.jpeg`);
    }
    return images;
}

function getProductMainImage(product) {
    return `./pictures/${product.id}/1.jpeg`;
}

function getDisplayPrice(product) {
    if (product.sizes) {
        const prices = product.sizes.map(s => s.price);
        if (prices[0] === prices[prices.length - 1]) {
            return formatPrice(prices[0]);
        }
        return `${formatPrice(prices[0])} - ${formatPrice(prices[prices.length - 1])}`;
    }
    return formatPrice(product.price);
}

function getProductBasePrice(product) {
    if (product.sizes) {
        return product.sizes[0].price;
    }
    return product.price;
}

function formatPrice(price) {
    return `${price.toLocaleString('ar-EG')} ج.م`;
}
