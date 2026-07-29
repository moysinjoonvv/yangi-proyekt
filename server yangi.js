const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// public/images papkasidagi rasmlarni /images/... orqali xizmat qilish
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

const TELEGRAM_USERNAME = 'Moysinjonvv';

// ---------- Buyurtmalarni saqlash (fayl asosida, oddiy tizim) ----------
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'flashboots2026'; // /admin/orders sahifasiga kirish uchun

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

app.post('/api/order', (req, res) => {
  const { name, phone, address, lat, lng, comment, cart } = req.body || {};

  if (!name || !phone || !address || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: "Ma'lumotlar to'liq emas" });
  }

  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const order = {
    id: 'FB-' + Date.now(),
    date: new Date().toISOString(),
    name, phone, address, lat: lat || null, lng: lng || null,
    comment: comment || '',
    cart, total
  };

  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);

  res.json({ success: true, orderId: order.id });
});

app.get('/admin/orders', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send('<body style="background:#0B0B0D;color:#fff;font-family:sans-serif;padding:40px;">Ruxsat yo\'q — to\'g\'ri kalit (?key=...) kerak.</body>');
  }
  const orders = readOrders();
  const rows = orders.map(o => `
    <tr style="border-bottom:1px solid #2a2a2e;">
      <td style="padding:12px;">${o.id}</td>
      <td style="padding:12px;">${new Date(o.date).toLocaleString('uz-UZ')}</td>
      <td style="padding:12px;">${o.name}</td>
      <td style="padding:12px;"><a href="tel:${o.phone}" style="color:#FF3D2E;">${o.phone}</a></td>
      <td style="padding:12px;max-width:260px;">${o.address}${o.lat ? ` <a href="https://www.google.com/maps?q=${o.lat},${o.lng}" target="_blank" style="color:#00B2FF;">(xaritada)</a>` : ''}</td>
      <td style="padding:12px;">${o.cart.map(i => i.name + ' ×' + i.qty + ' (razmer ' + i.size + ')').join('<br>')}</td>
      <td style="padding:12px;font-weight:bold;color:#FF3D2E;">${o.total.toLocaleString('ru-RU').replace(/,/g,' ')} so'm</td>
    </tr>`).join('');

  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Buyurtmalar — Admin</title>
<style>
  body { background:#0B0B0D; color:#fff; font-family: sans-serif; padding: 30px; }
  table { width:100%; border-collapse: collapse; font-size: 14px; }
  th { text-align:left; padding:12px; background:#17181C; text-transform:uppercase; font-size:11px; letter-spacing:.05em; color:#8B8D93; }
</style></head>
<body>
  <h1>Buyurtmalar (${orders.length})</h1>
  <table>
    <thead><tr><th>ID</th><th>Sana</th><th>Ism</th><th>Telefon</th><th>Manzil</th><th>Mahsulotlar</th><th>Jami</th></tr></thead>
    <tbody>${rows || '<tr><td style="padding:20px;" colspan="7">Hali buyurtma yo\'q</td></tr>'}</tbody>
  </table>
</body></html>`);
});

// Har bir mahsulot: price/oldPrice so'mda (raqam). oldPrice bo'lsa chegirma ko'rsatiladi.
const products = [
  {
    id: '01',
    brand: 'Nike',
    tag: 'Maysa uchun (FG)',
    name: 'Nike Mercurial Superfly 9',
    desc: 'Zoom Air amortizatsiyasi, yengil korpus va tezlik uchun maxsus taglik',
    price: 980000,
    oldPrice: null,
    minSize: 34,
    maxSize: 45,
    img: '/images/mercurial-superfly-9.png'
  },
  {
    id: '02',
    brand: 'Adidas',
    tag: 'Maysa uchun (FG)',
    name: 'Adidas Predator Elite',
    desc: 'Strikeskin rezina elementlari va maksimal koptok nazorati',
    price: 1050000,
    oldPrice: 1250000,
    minSize: 34,
    maxSize: 45,
    img: '/images/adidas-predator-elite.png'
  },
  {
    id: '03',
    brand: 'Puma',
    tag: "Shtik / Sun'iy maydon (TF)",
    name: 'Puma Future Ultimate TF',
    desc: 'PWRTAPE ushlab turuvchi tasmali yengil va elastik korpus',
    price: 890000,
    oldPrice: null,
    minSize: 34,
    maxSize: 45,
    img: '/images/puma-future-ultimate-tf.png'
  },
  {
    id: '04',
    brand: 'Nike',
    tag: 'Maysa uchun (FG)',
    name: 'Nike Phantom GX II Elite',
    desc: "Gripknit ustki qoplamasi va aniq zarbalar uchun mukammal moslik",
    price: 1120000,
    oldPrice: null,
    minSize: 34,
    maxSize: 45,
    img: '/images/nike-phantom-gx-ii-elite.png'
  },
  {
    id: '05',
    brand: 'Nike',
    tag: 'Maysa uchun (FG)',
    name: 'Nike Tiempo Legend 10',
    desc: "FlyTouch Pro yumshoq sun'iy teri va klassik qulaylik",
    price: 920000,
    oldPrice: null,
    minSize: 34,
    maxSize: 45,
    img: '/images/nike-tiempo-legend-10.png'
  },
  {
    id: '06',
    brand: 'Adidas',
    tag: 'Maysa uchun (FG)',
    name: 'Adidas X Crazyfast.1',
    desc: 'Aeropacity Speedskin ultrafoydali yengil korpus va sprint taglik',
    price: 990000,
    oldPrice: null,
    minSize: 34,
    maxSize: 45,
    img: '/images/adidas-x-crazyfast.png'
  },
  {
    id: '07',
    brand: 'Mizuno',
    tag: 'Zal uchun (IN / IC)',
    name: 'Mizuno Morelia Neo IN',
    desc: 'Yapon sifati, keng oyoqlar uchun ideal va sirpanmaydigan taglik',
    price: 850000,
    oldPrice: null,
    minSize: 34,
    maxSize: 45,
    img: '/images/mizuno-morelia-neo-in.png'
  },
  {
    id: '08',
    brand: 'Puma',
    tag: 'Maysa uchun (FG)',
    name: 'Puma King Match FG',
    desc: 'K-Better materiali, yengil konstruksiya va klassik nazorat',
    price: 870000,
    oldPrice: 950000,
    minSize: 34,
    maxSize: 45,
    img: '/images/puma-king-match-fg.png'
  }
];

const BRAND_COLORS = {
  Nike: { accent: '#FF3D2E', ring: 'ring-flash' },
  Adidas: { accent: '#00B2FF', ring: 'ring-sky-400' },
  Puma: { accent: '#FFC400', ring: 'ring-yellow-400' },
  Mizuno: { accent: '#8B5CF6', ring: 'ring-violet-400' }
};

function fmt(n) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ');
}

function productCard(p) {
  const hasDiscount = p.oldPrice && p.oldPrice > p.price;
  const discountPct = hasDiscount ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return `
    <div class="product-card card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col relative" data-brand="${p.brand}">
      ${hasDiscount ? `<span class="absolute top-3 left-3 z-10 bg-flash text-white text-xs font-bold px-2.5 py-1 rounded-full">-${discountPct}%</span>` : ''}
      <span class="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">${p.brand}</span>
      <div class="relative bg-white h-52 flex items-center justify-center">
        <span class="jersey-num absolute -top-2 right-3 text-6xl font-bold select-none">${p.id}</span>
        <img src="${p.img}" alt="${p.name}" class="h-40 object-contain" loading="lazy">
      </div>
      <div class="p-5 flex flex-col flex-1">
        <span class="text-xs uppercase tracking-wider text-flash font-semibold">${p.tag}</span>
        <h3 class="font-display font-semibold text-xl my-2">${p.name}</h3>
        <p class="text-muted text-sm mb-3">${p.desc}</p>
        <div class="flex items-baseline gap-2 mb-3">
          <p class="text-flash font-bold text-2xl">${fmt(p.price)} <span class="text-sm font-normal text-muted">so'm</span></p>
          ${hasDiscount ? `<p class="text-muted text-sm line-through">${fmt(p.oldPrice)}</p>` : ''}
        </div>
        <p class="text-xs text-muted mb-4">O'lchamlar: ${p.minSize} – ${p.maxSize}</p>
        <button onclick="openSizeModal('${p.id}')"
           class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-sm font-semibold text-center px-4 py-3 rounded-full inline-flex items-center justify-center gap-2">
          <i class="fa-solid fa-cart-plus"></i> Savatga
        </button>
      </div>
    </div>`;
}

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flash Boots — Professional Futbol Butsilari</title>
<meta name="description" content="Flash Boots — Nike, Adidas, Puma va Mizuno original futbol butsilari. Maysa, sun'iy maydon va zal uchun 8 xil model, qulay narx va tez yetkazib berish.">
<meta name="google-site-verification" content="osGraURC-Y5MRG12VYCnGuOzZm7wNwN1DwQeYqXpD8A" />
<meta property="og:type" content="website">
<meta property="og:title" content="Flash Boots — Professional Futbol Butsilari">
<meta property="og:description" content="Original Nike, Adidas, Puma va Mizuno futbol butsilari — Telegram orqali buyurtma bering.">
<meta property="og:url" content="https://yangi-proyekt.onrender.com/">

<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: { base: '#0B0B0D', surface: '#17181C', surface2: '#1F2025', flash: '#FF3D2E', muted: '#8B8D93' },
        fontFamily: { display: ['Oswald','sans-serif'], body: ['Inter','sans-serif'] }
      }
    }
  }
</script>
<style>
  html { scroll-behavior: smooth; }
  body { background-color: #0B0B0D; }
  .card-hover { transition: transform .3s ease, box-shadow .3s ease; }
  .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -12px rgba(255,61,46,.25); }
  .jersey-num { font-family:'Oswald',sans-serif; -webkit-text-stroke:1px rgba(0,0,0,.08); color: transparent; }
  .size-btn.selected { background:#FF3D2E; color:#fff; border-color:#FF3D2E; }
  .overlay { transition: opacity .25s ease; }
  .drawer { transition: transform .3s ease; }
  .brand-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 9999px;
    border: 1px solid rgba(255,255,255,.15);
    background: #17181C; color: #8B8D93;
    font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em;
    transition: all .2s ease; cursor: pointer;
  }
  .brand-tab:hover { border-color: #FF3D2E; color: #fff; }
  .brand-tab.active { background: #FF3D2E; border-color: #FF3D2E; color: #fff; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-thumb { background: #FF3D2E; border-radius: 4px; }
</style>
</head>
<body class="bg-base text-white font-body">

<header class="sticky top-0 z-50 bg-base/90 backdrop-blur-md border-b border-white/10">
  <div class="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between h-20">
    <a href="#" class="font-display font-bold text-2xl">FB FLASHBOOTS <span class="text-flash text-sm block font-body font-normal">Pro Sport Store</span></a>
    <div class="flex items-center gap-3">
      <a href="https://t.me/${TELEGRAM_USERNAME}" target="_blank" rel="noopener" class="hidden sm:inline-flex bg-flash hover:bg-red-600 transition-colors text-white font-semibold text-sm px-5 py-2.5 rounded-full items-center gap-2">
        <i class="fa-brands fa-telegram"></i> Aloqa
      </a>
      <button onclick="openCart()" class="relative w-11 h-11 rounded-full bg-surface2 border border-white/10 flex items-center justify-center hover:border-flash transition-colors">
        <i class="fa-solid fa-cart-shopping"></i>
        <span id="cartBadge" class="hidden absolute -top-1.5 -right-1.5 bg-flash text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">0</span>
      </button>
    </div>
  </div>
</header>

<section class="relative overflow-hidden">
  <div class="absolute -top-32 -right-32 w-96 h-96 bg-flash/15 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>
  <div class="max-w-7xl mx-auto px-5 md:px-8 py-16 text-center relative z-10">
    <span class="text-flash text-xs uppercase tracking-widest font-semibold">Original & Premium Sifat</span>
    <h1 class="font-display font-bold text-4xl md:text-5xl uppercase mt-3 mb-4">Maydonda Ustunlik Qiling</h1>
    <p class="text-muted max-w-xl mx-auto mb-10">Jahon yulduzlari tanlaydigan eng so'nggi futbol butsilari hamda futzalka modellari. Cheklangan miqdorda va kafolatlangan sifat bilan.</p>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
      <div class="bg-surface border border-white/10 rounded-2xl py-5 px-3">
        <p class="font-display font-bold text-2xl text-flash">8+</p>
        <p class="text-muted text-xs uppercase tracking-wider mt-1">Model</p>
      </div>
      <div class="bg-surface border border-white/10 rounded-2xl py-5 px-3">
        <p class="font-display font-bold text-2xl text-flash">100%</p>
        <p class="text-muted text-xs uppercase tracking-wider mt-1">Original</p>
      </div>
      <div class="bg-surface border border-white/10 rounded-2xl py-5 px-3">
        <p class="font-display font-bold text-2xl text-flash">34-45</p>
        <p class="text-muted text-xs uppercase tracking-wider mt-1">O'lcham</p>
      </div>
      <div class="bg-surface border border-white/10 rounded-2xl py-5 px-3">
        <p class="font-display font-bold text-2xl text-flash">24/7</p>
        <p class="text-muted text-xs uppercase tracking-wider mt-1">Qo'llab-quvvatlash</p>
      </div>
    </div>
  </div>
</section>

<section id="katalog" class="max-w-7xl mx-auto px-5 md:px-8 py-10">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
    <div>
      <h2 class="font-display font-bold text-2xl uppercase">Kataloglar</h2>
      <p class="text-muted text-sm">Brend bo'yicha tanlang yoki barchasini ko'ring</p>
    </div>
    <span id="resultCount" class="bg-surface border border-white/10 rounded-full px-4 py-1.5 text-sm w-fit">${products.length} ta model</span>
  </div>

  <div class="flex flex-wrap gap-2 mb-8">
    <button class="brand-tab active" data-brand="all" onclick="filterBrand('all', this)">
      <i class="fa-solid fa-border-all"></i> Barchasi
    </button>
    <button class="brand-tab" data-brand="Nike" onclick="filterBrand('Nike', this)">
      <i class="fa-solid fa-check"></i> Nike
    </button>
    <button class="brand-tab" data-brand="Adidas" onclick="filterBrand('Adidas', this)">
      <i class="fa-solid fa-star"></i> Adidas
    </button>
    <button class="brand-tab" data-brand="Puma" onclick="filterBrand('Puma', this)">
      <i class="fa-solid fa-paw"></i> Puma
    </button>
    <button class="brand-tab" data-brand="Mizuno" onclick="filterBrand('Mizuno', this)">
      <i class="fa-solid fa-bolt"></i> Mizuno
    </button>
  </div>

  <div id="productGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    ${products.map(productCard).join('')}
  </div>
  <p id="emptyState" class="hidden text-center text-muted py-16">Bu brendda hozircha mahsulot yo'q</p>
</section>

<footer class="border-t border-white/10 py-8 text-center text-xs text-muted">
  &copy; ${new Date().getFullYear()} Flash Boots Store. Barcha huquqlar himoyalangan.<br>
  O'zbekiston bo'ylab yetkazib berish xizmati mavjud.
</footer>

<!-- O'LCHAM TANLASH MODAL -->
<div id="sizeModalOverlay" class="overlay hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="if(event.target===this) closeSizeModal()">
  <div class="bg-surface w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden">
    <div class="p-5 border-b border-white/10 flex items-center justify-between">
      <h3 class="font-display font-semibold text-lg">O'lchamni tanlang</h3>
      <button onclick="closeSizeModal()" class="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="p-5">
      <div class="flex gap-4 items-center mb-5">
        <img id="modalImg" src="" alt="" class="w-24 h-24 object-contain bg-white rounded-xl p-2">
        <div>
          <p id="modalName" class="font-display font-semibold text-lg"></p>
          <div class="flex items-baseline gap-2">
            <p id="modalPrice" class="text-flash font-bold text-xl"></p>
            <p id="modalOldPrice" class="text-muted text-sm line-through hidden"></p>
          </div>
        </div>
      </div>
      <p class="text-xs uppercase tracking-wider text-muted mb-2">O'lcham</p>
      <div id="sizeOptions" class="flex flex-wrap gap-2 mb-6"></div>

      <div class="flex items-center justify-between mb-6">
        <p class="text-xs uppercase tracking-wider text-muted">Soni</p>
        <div class="flex items-center gap-3 bg-surface2 rounded-full px-3 py-1.5">
          <button onclick="changeQty(-1)" class="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center">−</button>
          <span id="modalQty" class="w-6 text-center font-semibold">1</span>
          <button onclick="changeQty(1)" class="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center">+</button>
        </div>
      </div>

      <button onclick="confirmAddToCart()" class="w-full bg-flash hover:bg-red-600 transition-colors text-white font-semibold py-3.5 rounded-full">
        Savatga qo'shish
      </button>
    </div>
  </div>
</div>

<!-- SAVAT DRAWER -->
<div id="cartOverlay" class="overlay hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onclick="if(event.target===this) closeCart()">
  <div id="cartDrawer" class="drawer fixed top-0 right-0 h-full w-full sm:w-[420px] bg-surface translate-x-full flex flex-col">
    <div class="p-5 border-b border-white/10 flex items-center justify-between">
      <h3 class="font-display font-semibold text-lg flex items-center gap-2"><i class="fa-solid fa-cart-shopping text-flash"></i> Savat</h3>
      <button onclick="closeCart()" class="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div id="cartItems" class="flex-1 overflow-y-auto p-5 space-y-4"></div>
    <div id="cartFooter" class="border-t border-white/10 p-5 space-y-4">
      <div class="flex items-center justify-between text-lg">
        <span class="text-muted">Jami:</span>
        <span id="cartTotal" class="font-display font-bold text-flash text-2xl">0 so'm</span>
      </div>
      <button onclick="openCheckout()" class="w-full bg-flash hover:bg-red-600 transition-colors text-white font-semibold py-3.5 rounded-full inline-flex items-center justify-center gap-2">
        <i class="fa-solid fa-truck-fast"></i> Buyurtma berish
      </button>
    </div>
  </div>
</div>

<!-- CHECKOUT (Buyurtmani rasmiylashtirish) MODAL -->
<div id="checkoutOverlay" class="overlay hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="if(event.target===this) closeCheckout()">
  <div class="bg-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] flex flex-col">
    <div class="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
      <h3 class="font-display font-semibold text-lg">Buyurtmani rasmiylashtirish</h3>
      <button onclick="closeCheckout()" class="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="p-5 overflow-y-auto space-y-4">
      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block">Ismingiz</label>
        <input id="ckName" type="text" placeholder="Ism Familiya" class="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash">
      </div>
      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block">Telefon raqami</label>
        <input id="ckPhone" type="tel" placeholder="+998 90 123 45 67" class="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash">
      </div>

      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block">Yetkazib berish manzili — xaritadan belgilang</label>
        <div id="deliveryMap" class="w-full h-64 rounded-xl overflow-hidden border border-white/10"></div>
        <p class="text-xs text-muted mt-2">Xaritada kerakli nuqtaga bosing — manzil avtomatik aniqlanadi. Kerak bo'lsa quyida qo'lda tahrirlashingiz mumkin.</p>
        <input id="ckAddress" type="text" placeholder="Manzil (xaritadan tanlanadi yoki qo'lda yozing)" class="w-full mt-2 bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash">
      </div>

      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block">Izoh (ixtiyoriy)</label>
        <textarea id="ckComment" rows="2" placeholder="Masalan: podъezd raqami, mo'ljal va h.k." class="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash resize-none"></textarea>
      </div>

      <div class="bg-surface2 rounded-xl p-4 flex items-center justify-between">
        <span class="text-muted text-sm">Jami to'lov:</span>
        <span id="ckTotal" class="font-display font-bold text-flash text-xl">0 so'm</span>
      </div>
    </div>

    <div class="p-5 border-t border-white/10 shrink-0">
      <button id="ckSubmitBtn" onclick="submitOrder()" class="w-full bg-flash hover:bg-red-600 transition-colors text-white font-semibold py-3.5 rounded-full inline-flex items-center justify-center gap-2">
        <i class="fa-solid fa-check"></i> Buyurtmani tasdiqlash
      </button>
    </div>
  </div>
</div>

<script>
  const PRODUCTS = ${JSON.stringify(products)};
  const TG_USERNAME = ${JSON.stringify(TELEGRAM_USERNAME)};

  function fmt(n) { return n.toLocaleString('ru-RU').replace(/,/g, ' '); }

  // ----- Savat holati (localStorage orqali saqlanadi) -----
  function getCart() {
    try { return JSON.parse(localStorage.getItem('fb_cart') || '[]'); }
    catch(e) { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem('fb_cart', JSON.stringify(cart));
    updateCartBadge();
  }
  function updateCartBadge() {
    const cart = getCart();
    const count = cart.reduce((s,i) => s + i.qty, 0);
    const badge = document.getElementById('cartBadge');
    if (count > 0) { badge.textContent = count; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
  }

  // ----- O'lcham tanlash modal -----
  let currentModalProduct = null;
  let currentModalSize = null;
  let currentModalQty = 1;

  function openSizeModal(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    currentModalProduct = p;
    currentModalSize = null;
    currentModalQty = 1;

    document.getElementById('modalImg').src = p.img;
    document.getElementById('modalImg').alt = p.name;
    document.getElementById('modalName').textContent = p.name;
    document.getElementById('modalPrice').textContent = fmt(p.price) + " so'm";
    const oldEl = document.getElementById('modalOldPrice');
    if (p.oldPrice && p.oldPrice > p.price) {
      oldEl.textContent = fmt(p.oldPrice) + " so'm";
      oldEl.classList.remove('hidden');
    } else {
      oldEl.classList.add('hidden');
    }
    document.getElementById('modalQty').textContent = '1';

    const sizeBox = document.getElementById('sizeOptions');
    sizeBox.innerHTML = '';
    for (let s = p.minSize; s <= p.maxSize; s++) {
      const btn = document.createElement('button');
      btn.textContent = s;
      btn.className = 'size-btn w-12 h-12 rounded-lg border border-white/20 hover:border-flash transition-colors font-semibold';
      btn.onclick = () => selectSize(s, btn);
      sizeBox.appendChild(btn);
    }

    document.getElementById('sizeModalOverlay').classList.remove('hidden');
  }

  function selectSize(size, btnEl) {
    currentModalSize = size;
    document.querySelectorAll('#sizeOptions .size-btn').forEach(b => b.classList.remove('selected'));
    btnEl.classList.add('selected');
  }

  function changeQty(delta) {
    currentModalQty = Math.max(1, currentModalQty + delta);
    document.getElementById('modalQty').textContent = currentModalQty;
  }

  function closeSizeModal() {
    document.getElementById('sizeModalOverlay').classList.add('hidden');
  }

  function confirmAddToCart() {
    if (!currentModalSize) {
      alert("Iltimos, o'lchamni tanlang");
      return;
    }
    const cart = getCart();
    const existing = cart.find(i => i.id === currentModalProduct.id && i.size === currentModalSize);
    if (existing) {
      existing.qty += currentModalQty;
    } else {
      cart.push({
        id: currentModalProduct.id,
        name: currentModalProduct.name,
        price: currentModalProduct.price,
        img: currentModalProduct.img,
        size: currentModalSize,
        qty: currentModalQty
      });
    }
    saveCart(cart);
    closeSizeModal();
    openCart();
  }

  // ----- Savat paneli -----
  function openCart() {
    renderCart();
    document.getElementById('cartOverlay').classList.remove('hidden');
    setTimeout(() => { document.getElementById('cartDrawer').classList.remove('translate-x-full'); }, 10);
  }
  function closeCart() {
    document.getElementById('cartDrawer').classList.add('translate-x-full');
    setTimeout(() => { document.getElementById('cartOverlay').classList.add('hidden'); }, 300);
  }

  function renderCart() {
    const cart = getCart();
    const box = document.getElementById('cartItems');
    if (cart.length === 0) {
      box.innerHTML = '<p class="text-muted text-center py-10">Savat bo\\'sh</p>';
      document.getElementById('cartTotal').textContent = '0 so\\'m';
      return;
    }
    box.innerHTML = cart.map((item, idx) => \`
      <div class="flex gap-3 bg-surface2 rounded-xl p-3">
        <img src="\${item.img}" class="w-16 h-16 object-contain bg-white rounded-lg p-1">
        <div class="flex-1">
          <p class="font-semibold text-sm">\${item.name}</p>
          <p class="text-muted text-xs mb-1">O'lcham: \${item.size} · Soni: \${item.qty}</p>
          <p class="text-flash font-bold text-sm">\${fmt(item.price * item.qty)} so'm</p>
        </div>
        <button onclick="removeFromCart(\${idx})" class="text-muted hover:text-flash transition-colors self-start">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    \`).join('');
    const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
    document.getElementById('cartTotal').textContent = fmt(total) + " so'm";
  }

  function removeFromCart(idx) {
    const cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart);
    renderCart();
  }

  // ----- Checkout (buyurtmani rasmiylashtirish) -----
  let deliveryMap = null;
  let deliveryMarker = null;
  let selectedLat = null;
  let selectedLng = null;
  const TASHKENT_CENTER = [41.2995, 69.2401];

  function openCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
      alert('Savat bo\\'sh — avval mahsulot qo\\'shing');
      return;
    }
    document.getElementById('ckTotal').textContent = document.getElementById('cartTotal').textContent;
    document.getElementById('checkoutOverlay').classList.remove('hidden');

    // Xaritani faqat bir marta ishga tushiramiz
    setTimeout(() => {
      if (!deliveryMap) {
        deliveryMap = L.map('deliveryMap').setView(TASHKENT_CENTER, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(deliveryMap);

        deliveryMap.on('click', function(e) {
          setDeliveryPoint(e.latlng.lat, e.latlng.lng);
        });
      } else {
        deliveryMap.invalidateSize();
      }
    }, 50);
  }

  function setDeliveryPoint(lat, lng) {
    selectedLat = lat;
    selectedLng = lng;
    if (deliveryMarker) {
      deliveryMarker.setLatLng([lat, lng]);
    } else {
      deliveryMarker = L.marker([lat, lng], { draggable: true }).addTo(deliveryMap);
      deliveryMarker.on('dragend', function() {
        const pos = deliveryMarker.getLatLng();
        setDeliveryPoint(pos.lat, pos.lng);
      });
    }
    reverseGeocode(lat, lng);
  }

  function reverseGeocode(lat, lng) {
    const addrInput = document.getElementById('ckAddress');
    addrInput.value = 'Manzil aniqlanmoqda...';
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
      .then(r => r.json())
      .then(data => {
        addrInput.value = data.display_name || (lat.toFixed(5) + ', ' + lng.toFixed(5));
      })
      .catch(() => {
        addrInput.value = lat.toFixed(5) + ', ' + lng.toFixed(5);
      });
  }

  function closeCheckout() {
    document.getElementById('checkoutOverlay').classList.add('hidden');
  }

  function submitOrder() {
    const name = document.getElementById('ckName').value.trim();
    const phone = document.getElementById('ckPhone').value.trim();
    const address = document.getElementById('ckAddress').value.trim();
    const comment = document.getElementById('ckComment').value.trim();
    const cart = getCart();

    if (!name) { alert('Iltimos, ismingizni kiriting'); return; }
    if (!phone) { alert('Iltimos, telefon raqamingizni kiriting'); return; }
    if (!address) { alert('Iltimos, xaritadan yetkazib berish manzilini tanlang'); return; }
    if (cart.length === 0) { alert('Savat bo\\'sh'); return; }

    const btn = document.getElementById('ckSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Yuborilmoqda...';

    fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, address, lat: selectedLat, lng: selectedLng, comment, cart })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          alert("Buyurtmangiz qabul qilindi! Buyurtma raqami: " + data.orderId + "\\nTez orada operatorimiz siz bilan bog'lanadi.");
          saveCart([]);
          renderCart();
          closeCheckout();
          closeCart();
          document.getElementById('ckName').value = '';
          document.getElementById('ckPhone').value = '';
          document.getElementById('ckAddress').value = '';
          document.getElementById('ckComment').value = '';
        } else {
          alert('Xatolik: ' + (data.message || "Buyurtmani yuborib bo'lmadi"));
        }
      })
      .catch(() => alert("Server bilan bog'lanishda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring."))
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Buyurtmani tasdiqlash';
      });
  }

  updateCartBadge();

  // ----- Brend bo'yicha filtrlash -----
  function filterBrand(brand, btnEl) {
    document.querySelectorAll('.brand-tab').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');

    const cards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    cards.forEach(card => {
      const matches = (brand === 'all' || card.dataset.brand === brand);
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    document.getElementById('resultCount').textContent = visibleCount + " ta model";
    document.getElementById('emptyState').classList.toggle('hidden', visibleCount > 0);
  }
</script>

</body>
</html>`);
});

app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
