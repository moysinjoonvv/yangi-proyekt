const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// public/images papkasidagi rasmlarni /images/... orqali xizmat qilish
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

const TELEGRAM_USERNAME = 'Moysinjonvv';

// ============================================================
//  Fayl asosidagi oddiy ma'lumotlar bazasi (users / sessions / orders)
// ============================================================
const USERS_FILE = path.join(__dirname, 'users.json');
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'EliteBoots';

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------- Parollarni xavfsiz shifrlash (Node crypto, qo'shimcha kutubxonasiz) ----------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// ---------- Cookie bilan ishlash (qo'shimcha kutubxonasiz) ----------
function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  });
  return cookies;
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = readJSON(SESSIONS_FILE, {});
  sessions[token] = userId;
  writeJSON(SESSIONS_FILE, sessions);
  return token;
}

function getCurrentUser(req) {
  const cookies = parseCookies(req);
  const token = cookies['fb_session'];
  if (!token) return null;
  const sessions = readJSON(SESSIONS_FILE, {});
  const userId = sessions[token];
  if (!userId) return null;
  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `fb_session=${token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax`);
}

// ============================================================
//  AUTH API (email orqali ro'yxatdan o'tish / kirish)
// ============================================================
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Barcha maydonlarni to'ldiring" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Parol kamida 6 belgidan iborat bo'lishi kerak" });
  }
  const users = readJSON(USERS_FILE, []);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, message: "Bu email allaqachon ro'yxatdan o'tgan" });
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const user = {
    id: 'U-' + Date.now(),
    name, email,
    salt, passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeJSON(USERS_FILE, users);

  const token = createSession(user.id);
  setSessionCookie(res, token);
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email va parolni kiriting' });
  }
  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
    return res.status(400).json({ success: false, message: "Email yoki parol noto'g'ri" });
  }
  const token = createSession(user.id);
  setSessionCookie(res, token);
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies['fb_session'];
  if (token) {
    const sessions = readJSON(SESSIONS_FILE, {});
    delete sessions[token];
    writeJSON(SESSIONS_FILE, sessions);
  }
  res.setHeader('Set-Cookie', 'fb_session=; HttpOnly; Path=/; Max-Age=0');
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: getCurrentUser(req) });
});

// ============================================================
//  BUYURTMALAR API
// ============================================================
app.post('/api/order', (req, res) => {
  const { name, phone, address, lat, lng, comment, cart } = req.body || {};
  if (!name || !phone || !address || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: "Ma'lumotlar to'liq emas" });
  }

  // Ombordagi mavjudlikni tekshirish
  const stock = getStock();
  for (const item of cart) {
    if (item.size == null) continue; // o'lchamsiz mahsulot (anjomlar)
    const available = (stock[item.id] && stock[item.id][item.size]) || 0;
    if (item.qty > available) {
      return res.status(400).json({ success: false, message: `"${item.id}" uchun ${item.size}-o'lchamdan faqat ${available} dona qoldi` });
    }
  }
  // Kamaytirish
  cart.forEach(item => {
    if (item.size == null) return;
    if (stock[item.id]) stock[item.id][item.size] -= item.qty;
  });
  saveStock(stock);

  const user = getCurrentUser(req);
  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const order = {
    id: 'FB-' + Date.now(),
    date: new Date().toISOString(),
    userId: user ? user.id : null,
    name, phone, address, lat: lat || null, lng: lng || null,
    comment: comment || '',
    cart, total
  };
  const orders = readJSON(ORDERS_FILE, []);
  orders.unshift(order);
  writeJSON(ORDERS_FILE, orders);
  res.json({ success: true, orderId: order.id });
});

app.get('/admin/orders', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send('<body style="background:#0B0B0D;color:#fff;font-family:sans-serif;padding:40px;">Ruxsat yo\'q — to\'g\'ri kalit (?key=...) kerak.</body>');
  }
  const orders = readJSON(ORDERS_FILE, []);
  const rows = orders.map(o => `
    <tr style="border-bottom:1px solid #2a2a2e;">
      <td style="padding:12px;">${o.id}</td>
      <td style="padding:12px;">${new Date(o.date).toLocaleString('uz-UZ')}</td>
      <td style="padding:12px;">${o.name}</td>
      <td style="padding:12px;"><a href="tel:${o.phone}" style="color:#1F5C34;">${o.phone}</a></td>
      <td style="padding:12px;max-width:260px;">${o.address}${o.lat ? ` <a href="https://www.google.com/maps?q=${o.lat},${o.lng}" target="_blank" style="color:#00B2FF;">(xaritada)</a>` : ''}</td>
      <td style="padding:12px;">${o.cart.map(i => i.name + ' ×' + i.qty + ' (razmer ' + i.size + ')').join('<br>')}</td>
      <td style="padding:12px;font-weight:bold;color:#1F5C34;">${o.total.toLocaleString('ru-RU').replace(/,/g,' ')} so'm</td>
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

// ============================================================
//  MAHSULOTLAR (uz / ru / en tarjimalari bilan)
// ============================================================
const products = [
  {
    id: '01', brand: 'Nike', price: 980000, oldPrice: null, minSize: 34, maxSize: 45,
    img: '/images/mercurial-superfly-9.png',
    i18n: {
      uz: { tag: 'Maysa uchun (FG)', name: 'Nike Mercurial Superfly 9', desc: 'Zoom Air amortizatsiyasi, yengil korpus va tezlik uchun maxsus taglik' },
      ru: { tag: 'Для газона (FG)', name: 'Nike Mercurial Superfly 9', desc: 'Амортизация Zoom Air, лёгкий корпус и подошва для скорости' },
      en: { tag: 'Firm Ground (FG)', name: 'Nike Mercurial Superfly 9', desc: 'Zoom Air cushioning, lightweight build and a speed-tuned outsole' }
    }
  },
  {
    id: '02', brand: 'Adidas', price: 1050000, oldPrice: 1250000, minSize: 34, maxSize: 45,
    img: '/images/adidas-predator-elite.png',
    i18n: {
      uz: { tag: 'Maysa uchun (FG)', name: 'Adidas Predator Elite', desc: 'Strikeskin rezina elementlari va maksimal koptok nazorati' },
      ru: { tag: 'Для газона (FG)', name: 'Adidas Predator Elite', desc: 'Резиновые элементы Strikeskin и максимальный контроль мяча' },
      en: { tag: 'Firm Ground (FG)', name: 'Adidas Predator Elite', desc: 'Strikeskin rubber elements for maximum ball control' }
    }
  },
  {
    id: '03', brand: 'Puma', price: 890000, oldPrice: null, minSize: 34, maxSize: 45,
    img: '/images/puma-future-ultimate-tf.png',
    i18n: {
      uz: { tag: "Sun'iy maydon (TF)", name: 'Puma Future Ultimate TF', desc: 'PWRTAPE ushlab turuvchi tasmali yengil va elastik korpus' },
      ru: { tag: 'Искусственное поле (TF)', name: 'Puma Future Ultimate TF', desc: 'Лёгкий эластичный корпус с фиксирующей лентой PWRTAPE' },
      en: { tag: 'Turf (TF)', name: 'Puma Future Ultimate TF', desc: 'Lightweight, adaptive build with the PWRTAPE fit strap' }
    }
  },
  {
    id: '04', brand: 'Nike', price: 1120000, oldPrice: null, minSize: 34, maxSize: 45,
    img: '/images/nike-phantom-gx-ii-elite.png',
    i18n: {
      uz: { tag: 'Maysa uchun (FG)', name: 'Nike Phantom GX II Elite', desc: 'Gripknit ustki qoplamasi va aniq zarbalar uchun mukammal moslik' },
      ru: { tag: 'Для газона (FG)', name: 'Nike Phantom GX II Elite', desc: 'Верх Gripknit для точных ударов и идеальной посадки' },
      en: { tag: 'Firm Ground (FG)', name: 'Nike Phantom GX II Elite', desc: 'Gripknit upper for precision strikes and a locked-in fit' }
    }
  },
  {
    id: '05', brand: 'Nike', price: 920000, oldPrice: null, minSize: 34, maxSize: 45,
    img: '/images/nike-tiempo-legend-10.png',
    i18n: {
      uz: { tag: 'Maysa uchun (FG)', name: 'Nike Tiempo Legend 10', desc: "FlyTouch Pro yumshoq sun'iy teri va klassik qulaylik" },
      ru: { tag: 'Для газона (FG)', name: 'Nike Tiempo Legend 10', desc: 'Мягкая искусственная кожа FlyTouch Pro и классический комфорт' },
      en: { tag: 'Firm Ground (FG)', name: 'Nike Tiempo Legend 10', desc: 'Soft FlyTouch Pro synthetic leather with classic comfort' }
    }
  },
  {
    id: '06', brand: 'Adidas', price: 990000, oldPrice: null, minSize: 34, maxSize: 45,
    img: '/images/adidas-x-crazyfast.png',
    i18n: {
      uz: { tag: 'Maysa uchun (FG)', name: 'Adidas X Crazyfast.1', desc: 'Aeropacity Speedskin ultrafoydali yengil korpus va sprint taglik' },
      ru: { tag: 'Для газона (FG)', name: 'Adidas X Crazyfast.1', desc: 'Сверхлёгкий корпус Aeropacity Speedskin и подошва для спринта' },
      en: { tag: 'Firm Ground (FG)', name: 'Adidas X Crazyfast.1', desc: 'Ultra-light Aeropacity Speedskin build with a sprint-tuned sole' }
    }
  },
  {
    id: '07', brand: 'Mizuno', price: 850000, oldPrice: null, minSize: 34, maxSize: 45,
    img: '/images/mizuno-morelia-neo-in.png',
    i18n: {
      uz: { tag: 'Zal uchun (IN / IC)', name: 'Mizuno Morelia Neo IN', desc: 'Yapon sifati, keng oyoqlar uchun ideal va sirpanmaydigan taglik' },
      ru: { tag: 'Для зала (IN / IC)', name: 'Mizuno Morelia Neo IN', desc: 'Японское качество, идеально для широкой стопы, нескользящая подошва' },
      en: { tag: 'Indoor (IN / IC)', name: 'Mizuno Morelia Neo IN', desc: 'Japanese craftsmanship, ideal for wider feet, non-slip sole' }
    }
  },
  {
    id: '08', brand: 'Puma', price: 870000, oldPrice: 950000, minSize: 34, maxSize: 45,
    img: '/images/puma-king-match-fg.png',
    i18n: {
      uz: { tag: 'Maysa uchun (FG)', name: 'Puma King Match FG', desc: 'K-Better materiali, yengil konstruksiya va klassik nazorat' },
      ru: { tag: 'Для газона (FG)', name: 'Puma King Match FG', desc: 'Материал K-Better, лёгкая конструкция и классический контроль' },
      en: { tag: 'Firm Ground (FG)', name: 'Puma King Match FG', desc: 'K-Better material, lightweight build and classic control' }
    }
  }
];

// ---------- Mashhur futbolchilar uchun maxsus (signature) editionlar ----------
// Eslatma: haqiqiy futbolchilar ismi ishlatilmagan (huquqiy sabablarga ko'ra) — umumiy nomlar.
const signatureProducts = [
  {
    id: 'S01', brand: 'Nike', price: 1450000, oldPrice: 1650000, minSize: 34, maxSize: 45,
    img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&q=80',
    i18n: {
      uz: { tag: 'Kapitan Edition', name: 'Mercurial "Captain" Signature', desc: "Terma jamoa kapitanlari uslubida ishlangan maxsus reja, oltin detallar bilan" },
      ru: { tag: 'Capitan Edition', name: 'Mercurial "Captain" Signature', desc: 'Особая версия в стиле капитанов сборных, с золотыми деталями' },
      en: { tag: 'Captain Edition', name: 'Mercurial "Captain" Signature', desc: 'A special colourway inspired by national team captains, with gold accents' }
    }
  },
  {
    id: 'S02', brand: 'Adidas', price: 1550000, oldPrice: null, minSize: 34, maxSize: 45,
    img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
    i18n: {
      uz: { tag: 'Afsona Edition', name: 'Predator "Legend" Signature', desc: "O'tmish afsonalari sharafiga chiqarilgan cheklangan seriya" },
      ru: { tag: 'Afsona Edition', name: 'Predator "Legend" Signature', desc: 'Лимитированная серия в честь легенд прошлого' },
      en: { tag: 'Legend Edition', name: 'Predator "Legend" Signature', desc: 'A limited series honouring football legends of the past' }
    }
  },
  {
    id: 'S03', brand: 'Puma', price: 1380000, oldPrice: null, minSize: 34, maxSize: 45,
    img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80',
    i18n: {
      uz: { tag: 'Chempion Edition', name: 'Future "Champion" Signature', desc: "Chempionlar ligasi g'oliblari sharafiga ishlab chiqarilgan model" },
      ru: { tag: 'Chempion Edition', name: 'Future "Champion" Signature', desc: 'Модель, выпущенная в честь победителей Лиги чемпионов' },
      en: { tag: 'Champion Edition', name: 'Future "Champion" Signature', desc: 'A model released to honour Champions League winners' }
    }
  },
  {
    id: 'S04', brand: 'Nike', price: 1620000, oldPrice: 1800000, minSize: 34, maxSize: 45,
    img: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=600&q=80',
    i18n: {
      uz: { tag: 'MVP Edition', name: 'Phantom "MVP" Signature', desc: "Mavsumning eng yaxshi o'yinchisi sharafiga chiqarilgan noyob dizayn" },
      ru: { tag: 'MVP Edition', name: 'Phantom "MVP" Signature', desc: 'Уникальный дизайн в честь лучшего игрока сезона' },
      en: { tag: 'MVP Edition', name: 'Phantom "MVP" Signature', desc: "A unique design celebrating the season's most valuable player" }
    }
  }
];

// ---------- Futbolga oid boshqa mahsulotlar (anjomlar) ----------
const equipmentProducts = [
  {
    id: 'E01', category: 'ball', price: 320000, oldPrice: null, sizes: false,
    img: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=600&q=80',
    i18n: {
      uz: { name: "Professional futbol to'pi", desc: "FIFA standartlariga mos, barcha maydon turlari uchun" },
      ru: { name: 'Профессиональный футбольный мяч', desc: 'Соответствует стандартам FIFA, для всех типов полей' },
      en: { name: 'Professional Match Ball', desc: 'FIFA-standard, suitable for all pitch types' }
    }
  },
  {
    id: 'E02', category: 'gloves', price: 280000, oldPrice: 340000, sizes: false,
    img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80',
    i18n: {
      uz: { name: "Golkiper qo'lqoplari", desc: "Kuchli ushlab turish va bilakni himoya qiladigan qattiqlagich bilan" },
      ru: { name: 'Вратарские перчатки', desc: 'Отличный захват и защита запястья жёстким фиксатором' },
      en: { name: 'Goalkeeper Gloves', desc: 'Strong grip with a supportive wrist strap' }
    }
  },
  {
    id: 'E03', category: 'jersey', price: 250000, oldPrice: null, sizes: false,
    img: 'https://images.unsplash.com/photo-1614632537197-55d17061c2bd?w=600&q=80',
    i18n: {
      uz: { name: "Jamoa formasi (komplekt)", desc: "Nafas oluvchi mato, terlashni tez shimib oluvchi texnologiya" },
      ru: { name: 'Игровая форма (комплект)', desc: 'Дышащая ткань, технология быстрого впитывания пота' },
      en: { name: 'Team Jersey Kit', desc: 'Breathable fabric with fast-drying moisture technology' }
    }
  },
  {
    id: 'E04', category: 'socks', price: 85000, oldPrice: null, sizes: false,
    img: 'https://images.unsplash.com/photo-1586350977771-2a1d3bc7b7c5?w=600&q=80',
    i18n: {
      uz: { name: 'Futbol paypoqlari', desc: "Silliqlanib ketmaydigan, mahkam ushlab turadigan elastik material" },
      ru: { name: 'Футбольные гетры', desc: 'Не скользят, плотно облегающий эластичный материал' },
      en: { name: 'Football Socks', desc: 'Non-slip, snug-fitting elastic material' }
    }
  },
  {
    id: 'E05', category: 'protection', price: 95000, oldPrice: null, sizes: false,
    img: 'https://images.unsplash.com/photo-1552318965-6e6be7484ada?w=600&q=80',
    i18n: {
      uz: { name: 'Tizza himoya vositasi (schitnik)', desc: "Yengil va mustahkam, zarbalardan to'liq himoya qiladi" },
      ru: { name: 'Щитки', desc: 'Лёгкие и прочные, полная защита от ударов' },
      en: { name: 'Shin Guards', desc: 'Lightweight and durable, full impact protection' }
    }
  },
  {
    id: 'E06', category: 'ball', price: 210000, oldPrice: 260000, sizes: false,
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80',
    i18n: {
      uz: { name: "Mashg'ulot to'pi", desc: "Kundalik mashg'ulotlar uchun chidamli va arzon variant" },
      ru: { name: 'Тренировочный мяч', desc: 'Прочный и доступный вариант для ежедневных тренировок' },
      en: { name: 'Training Ball', desc: 'Durable, affordable option for everyday training' }
    }
  }
];


// ============================================================
const STOCK_FILE = path.join(__dirname, 'stock.json');
const SIZE_LIST = [34,35,36,37,38,39,40,41,42,43,44,45];
const BASE_STOCK = [5,8,12,18,26,32,28,22,16,11,7,4];

function buildDefaultStock() {
  const stock = {};
  [...products, ...signatureProducts, ...equipmentProducts].forEach((p, idx) => {
    if (p.sizes === false) return; // o'lchamsiz mahsulot (masalan to'p)
    stock[p.id] = {};
    SIZE_LIST.forEach((size, i) => {
      const variance = (idx % 3) - 1;
      stock[p.id][size] = Math.max(0, BASE_STOCK[i] + variance * 3);
    });
  });
  return stock;
}

function getStock() {
  let stock = readJSON(STOCK_FILE, null);
  if (!stock) {
    stock = buildDefaultStock();
    writeJSON(STOCK_FILE, stock);
  }
  return stock;
}
function saveStock(stock) { writeJSON(STOCK_FILE, stock); }

app.get('/', (req, res) => {
  const stock = getStock();
  const productsWithStock = products.map(p => Object.assign({}, p, { stock: stock[p.id] || {} }));
  const signatureWithStock = signatureProducts.map(p => Object.assign({}, p, { stock: stock[p.id] || {} }));

  res.send(`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Elite Boots — Professional Futbol Butsilari</title>
<meta name="description" content="Elite Boots — Nike, Adidas, Puma va Mizuno original futbol butsilari.">
<meta name="google-site-verification" content="osGraURC-Y5MRG12VYCnGuOzZm7wNwN1DwQeYqXpD8A" />
<meta property="og:type" content="website">
<meta property="og:title" content="Elite Boots — Professional Futbol Butsilari">
<meta property="og:url" content="https://yangi-proyekt.onrender.com/">
<link rel="icon" type="image/png" href="/images/logo.png">

<!-- Mavzu flashini oldini olish uchun eng erta ishga tushadigan skript -->
<script>
  (function() {
    if (localStorage.getItem('fb_theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  })();
</script>

<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          base: 'var(--c-bg)', surface: 'var(--c-surface)', surface2: 'var(--c-surface2)',
          flash: '#1F5C34', muted: 'var(--c-muted)'
        },
        fontFamily: { display: ['Oswald','sans-serif'], body: ['Inter','sans-serif'] }
      }
    }
  }
</script>
<style>
  :root, html.dark {
    --c-bg: #0B0B0D; --c-surface: #17181C; --c-surface2: #1F2025;
    --c-muted: #8B8D93; --c-text: #F5F5F0; --c-border: rgba(255,255,255,.1);
    --c-overlay: rgba(0,0,0,.7); --c-badge: rgba(0,0,0,.6);
  }
  html.light {
    --c-bg: #F4F4F6; --c-surface: #FFFFFF; --c-surface2: #EFEFF2;
    --c-muted: #63656C; --c-text: #0B0B0D; --c-border: rgba(0,0,0,.1);
    --c-overlay: rgba(0,0,0,.4); --c-badge: rgba(255,255,255,.85);
  }
  html { scroll-behavior: smooth; }
  body { background-color: var(--c-bg); color: var(--c-text); transition: background-color .25s ease, color .25s ease; }
  .card-hover { transition: transform .3s ease, box-shadow .3s ease; }
  .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -12px rgba(255,61,46,.25); }
  .jersey-num { font-family:'Oswald',sans-serif; -webkit-text-stroke:1px rgba(0,0,0,.08); color: transparent; }
  .size-btn.selected { background:#1F5C34; color:#fff; border-color:#1F5C34; }
  .overlay { transition: opacity .25s ease; }
  .drawer { transition: transform .3s ease; }
  .brand-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 9999px;
    border: 1px solid var(--c-border);
    background: var(--c-surface); color: var(--c-muted);
    font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em;
    transition: all .2s ease; cursor: pointer;
  }
  .brand-tab:hover { border-color: #1F5C34; color: var(--c-text); }
  .brand-tab.active { background: #1F5C34; border-color: #1F5C34; color: #fff; }
  .lang-btn {
    padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;
    color: var(--c-muted); transition: all .2s ease; cursor: pointer;
  }
  .lang-btn.active { background: #1F5C34; color: #fff; }
  .lang-btn:hover:not(.active) { color: var(--c-text); }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-thumb { background: #1F5C34; border-radius: 4px; }
  .auth-tab { padding: 10px; text-align:center; font-weight:600; font-size:14px; color: var(--c-muted); cursor:pointer; border-bottom: 2px solid transparent; }
  .auth-tab.active { color: var(--c-text); border-color: #1F5C34; }
</style>
</head>
<body class="font-body">

<header class="sticky top-0 z-50 backdrop-blur-md border-b" style="background-color:color-mix(in srgb, var(--c-bg) 90%, transparent); border-color:var(--c-border);">
  <div class="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between h-20">
    <a href="#top" class="flex items-center gap-3 font-display font-bold text-2xl">
      <img src="/images/logo.png" alt="Elite Boots" class="w-11 h-11 rounded-full object-cover">
      EB ELITEBOOTS <span class="text-flash text-sm block font-body font-normal">Pro Sport Store</span>
    </a>

    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Til tanlash -->
      <div class="hidden sm:flex items-center gap-1 bg-surface border rounded-full px-1.5 py-1" style="border-color:var(--c-border);">
        <button class="lang-btn active" id="langBtnUz" onclick="setLang('uz')">UZ</button>
        <button class="lang-btn" id="langBtnRu" onclick="setLang('ru')">RU</button>
        <button class="lang-btn" id="langBtnEn" onclick="setLang('en')">EN</button>
      </div>

      <!-- Mavzu almashtirish -->
      <button onclick="toggleTheme()" class="w-11 h-11 rounded-full bg-surface border flex items-center justify-center hover:border-flash transition-colors" style="border-color:var(--c-border);">
        <i id="themeIcon" class="fa-solid fa-sun"></i>
      </button>

      <!-- Aloqa (yumaloq ikonka) -->
      <a href="https://t.me/${TELEGRAM_USERNAME}" target="_blank" rel="noopener" class="hidden sm:flex w-11 h-11 rounded-full bg-surface border items-center justify-center hover:border-flash hover:text-flash transition-colors" style="border-color:var(--c-border);">
        <i class="fa-brands fa-telegram"></i>
      </a>

      <!-- Auth -->
      <div id="authArea"></div>

      <!-- Savat -->
      <button onclick="openCart()" class="relative w-11 h-11 rounded-full bg-surface border flex items-center justify-center hover:border-flash transition-colors" style="border-color:var(--c-border);">
        <i class="fa-solid fa-cart-shopping"></i>
        <span id="cartBadge" class="hidden absolute -top-1.5 -right-1.5 bg-flash text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">0</span>
      </button>

      <!-- Mobil menyu tugmasi -->
      <button onclick="document.getElementById('mobileNav').classList.toggle('hidden')" class="md:hidden w-11 h-11 rounded-full bg-surface border flex items-center justify-center" style="border-color:var(--c-border);">
        <i class="fa-solid fa-bars"></i>
      </button>
    </div>
  </div>

  <!-- Navigatsiya menyusi -->
  <nav class="hidden md:flex items-center justify-center gap-8 border-t py-3 text-sm font-semibold uppercase tracking-wide" style="border-color:var(--c-border);">
    <a href="#top" class="hover:text-flash transition-colors" data-i18n="nav_home"></a>
    <a href="#signature" class="hover:text-flash transition-colors" data-i18n="nav_signature"></a>
    <a href="#anjomlar" class="hover:text-flash transition-colors" data-i18n="nav_equipment"></a>
    <a href="#katalog" class="hover:text-flash transition-colors" data-i18n="nav_catalog"></a>
    <a href="#about" class="hover:text-flash transition-colors" data-i18n="nav_about"></a>
  </nav>

  <!-- Mobil navigatsiya -->
  <nav id="mobileNav" class="hidden md:hidden flex flex-col border-t py-3 text-sm font-semibold uppercase tracking-wide" style="border-color:var(--c-border);">
    <a href="#top" class="px-5 py-3 hover:text-flash transition-colors" data-i18n="nav_home"></a>
    <a href="#signature" class="px-5 py-3 hover:text-flash transition-colors" data-i18n="nav_signature"></a>
    <a href="#anjomlar" class="px-5 py-3 hover:text-flash transition-colors" data-i18n="nav_equipment"></a>
    <a href="#katalog" class="px-5 py-3 hover:text-flash transition-colors" data-i18n="nav_catalog"></a>
    <a href="#about" class="px-5 py-3 hover:text-flash transition-colors" data-i18n="nav_about"></a>
    <a href="https://t.me/${TELEGRAM_USERNAME}" target="_blank" rel="noopener" class="px-5 py-3 text-flash flex items-center gap-2"><i class="fa-brands fa-telegram"></i> <span data-i18n="footer_contact"></span></a>
  </nav>

  <!-- Mobil til tanlash qatori -->
  <div class="sm:hidden flex items-center justify-center gap-1 pb-3">
    <button class="lang-btn active" id="langBtnUzM" onclick="setLang('uz')">UZ</button>
    <button class="lang-btn" id="langBtnRuM" onclick="setLang('ru')">RU</button>
    <button class="lang-btn" id="langBtnEnM" onclick="setLang('en')">EN</button>
  </div>
</header>


<section id="top" class="relative overflow-hidden">
  <div class="absolute -top-32 -right-32 w-96 h-96 bg-flash/15 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>
  <div class="max-w-7xl mx-auto px-5 md:px-8 py-16 text-center relative z-10">
    <span class="text-flash text-xs uppercase tracking-widest font-semibold" data-i18n="hero_badge"></span>
    <h1 class="font-display font-bold text-4xl md:text-5xl uppercase mt-3 mb-4" data-i18n="hero_title"></h1>
    <p class="text-muted max-w-xl mx-auto mb-8" data-i18n="hero_subtitle"></p>

    <div class="flex flex-wrap gap-3 justify-center mb-10">
      <a href="#katalog" class="bg-flash hover:bg-[#163F24] transition-colors text-white font-semibold px-7 py-3.5 rounded-full inline-flex items-center gap-2">
        <span data-i18n="hero_cta_catalog"></span> <i class="fa-solid fa-arrow-right"></i>
      </a>
      <a href="#signature" class="bg-surface border hover:border-flash transition-colors font-semibold px-7 py-3.5 rounded-full inline-flex items-center gap-2" style="border-color:var(--c-border);">
        <i class="fa-solid fa-star text-flash"></i> <span data-i18n="hero_cta_signature"></span>
      </a>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
      <div class="bg-surface border rounded-2xl py-5 px-3" style="border-color:var(--c-border);">
        <p class="font-display font-bold text-2xl text-flash">8+</p>
        <p class="text-muted text-xs uppercase tracking-wider mt-1" data-i18n="stat_models"></p>
      </div>
      <div class="bg-surface border rounded-2xl py-5 px-3" style="border-color:var(--c-border);">
        <p class="font-display font-bold text-2xl text-flash">100%</p>
        <p class="text-muted text-xs uppercase tracking-wider mt-1" data-i18n="stat_original"></p>
      </div>
      <div class="bg-surface border rounded-2xl py-5 px-3" style="border-color:var(--c-border);">
        <p class="font-display font-bold text-2xl text-flash">34-45</p>
        <p class="text-muted text-xs uppercase tracking-wider mt-1" data-i18n="stat_sizes"></p>
      </div>
      <div class="bg-surface border rounded-2xl py-5 px-3" style="border-color:var(--c-border);">
        <p class="font-display font-bold text-2xl text-flash">24/7</p>
        <p class="text-muted text-xs uppercase tracking-wider mt-1" data-i18n="stat_support"></p>
      </div>
    </div>
  </div>
</section>

<!-- FUTBOL DUNYOSIDAN: maslahat/yangiliklar (bosh sahifadagi katalog o'rniga) -->
<section class="max-w-7xl mx-auto px-5 md:px-8 py-14">
  <div class="text-center mb-10">
    <span class="text-flash text-xs uppercase tracking-widest font-semibold" data-i18n="news_badge"></span>
    <h2 class="font-display font-bold text-3xl uppercase mt-2" data-i18n="news_title"></h2>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-surface border rounded-2xl p-6" style="border-color:var(--c-border);">
      <div class="w-12 h-12 rounded-full bg-flash/15 flex items-center justify-center text-flash text-xl mb-4"><i class="fa-solid fa-ruler"></i></div>
      <h3 class="font-display font-semibold text-lg mb-2" data-i18n="news1_title"></h3>
      <p class="text-muted text-sm" data-i18n="news1_desc"></p>
    </div>
    <div class="bg-surface border rounded-2xl p-6" style="border-color:var(--c-border);">
      <div class="w-12 h-12 rounded-full bg-flash/15 flex items-center justify-center text-flash text-xl mb-4"><i class="fa-solid fa-scale-balanced"></i></div>
      <h3 class="font-display font-semibold text-lg mb-2" data-i18n="news2_title"></h3>
      <p class="text-muted text-sm" data-i18n="news2_desc"></p>
    </div>
    <div class="bg-surface border rounded-2xl p-6" style="border-color:var(--c-border);">
      <div class="w-12 h-12 rounded-full bg-flash/15 flex items-center justify-center text-flash text-xl mb-4"><i class="fa-solid fa-shoe-prints"></i></div>
      <h3 class="font-display font-semibold text-lg mb-2" data-i18n="news3_title"></h3>
      <p class="text-muted text-sm" data-i18n="news3_desc"></p>
    </div>
  </div>
</section>

<!-- MASHHUR FUTBOLCHILAR EDITION -->
<section id="signature" class="max-w-7xl mx-auto px-5 md:px-8 py-14">
  <div class="mb-8">
    <h2 class="font-display font-bold text-2xl uppercase" data-i18n="signature_title"></h2>
    <p class="text-muted text-sm" data-i18n="signature_subtitle"></p>
  </div>
  <div id="signatureGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
</section>

<!-- FUTBOL ANJOMLARI -->
<section id="anjomlar" class="max-w-7xl mx-auto px-5 md:px-8 py-14">
  <div class="mb-8">
    <h2 class="font-display font-bold text-2xl uppercase" data-i18n="equipment_title"></h2>
    <p class="text-muted text-sm" data-i18n="equipment_subtitle"></p>
  </div>
  <div class="flex flex-wrap gap-2 mb-8">
    <button class="brand-tab active" data-cat="all" onclick="filterEquipment('all', this)"><span data-i18n="filter_all"></span></button>
    <button class="brand-tab" data-cat="ball" onclick="filterEquipment('ball', this)" data-i18n="cat_ball"></button>
    <button class="brand-tab" data-cat="gloves" onclick="filterEquipment('gloves', this)" data-i18n="cat_gloves"></button>
    <button class="brand-tab" data-cat="jersey" onclick="filterEquipment('jersey', this)" data-i18n="cat_jersey"></button>
    <button class="brand-tab" data-cat="socks" onclick="filterEquipment('socks', this)" data-i18n="cat_socks"></button>
    <button class="brand-tab" data-cat="protection" onclick="filterEquipment('protection', this)" data-i18n="cat_protection"></button>
  </div>
  <div id="equipmentGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
</section>

<section id="katalog" class="max-w-7xl mx-auto px-5 md:px-8 py-10">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
    <div>
      <h2 class="font-display font-bold text-2xl uppercase" data-i18n="catalog_title"></h2>
      <p class="text-muted text-sm" data-i18n="catalog_subtitle"></p>
    </div>
    <span id="resultCount" class="bg-surface border rounded-full px-4 py-1.5 text-sm w-fit" style="border-color:var(--c-border);"></span>
  </div>

  <div class="flex flex-wrap gap-2 mb-8">
    <button class="brand-tab active" data-brand="all" onclick="filterBrand('all', this)">
      <i class="fa-solid fa-border-all"></i> <span data-i18n="filter_all"></span>
    </button>
    <button class="brand-tab" data-brand="Nike" onclick="filterBrand('Nike', this)"><i class="fa-solid fa-check"></i> Nike</button>
    <button class="brand-tab" data-brand="Adidas" onclick="filterBrand('Adidas', this)"><i class="fa-solid fa-star"></i> Adidas</button>
    <button class="brand-tab" data-brand="Puma" onclick="filterBrand('Puma', this)"><i class="fa-solid fa-paw"></i> Puma</button>
    <button class="brand-tab" data-brand="Mizuno" onclick="filterBrand('Mizuno', this)"><i class="fa-solid fa-bolt"></i> Mizuno</button>
  </div>

  <div id="productGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
  <p id="emptyState" class="hidden text-center text-muted py-16" data-i18n="empty_state"></p>
</section>

<!-- BIZ HAQIMIZDA -->
<section id="about" class="max-w-7xl mx-auto px-5 md:px-8 py-16">
  <div class="bg-surface border rounded-3xl p-8 md:p-12 text-center" style="border-color:var(--c-border);">
    <h2 class="font-display font-bold text-2xl md:text-3xl uppercase mb-4" data-i18n="about_title"></h2>
    <p class="text-muted max-w-2xl mx-auto" data-i18n="about_text"></p>
  </div>
</section>


<footer class="border-t py-8 text-center text-xs text-muted" style="border-color:var(--c-border);">
  &copy; ${new Date().getFullYear()} Elite Boots Store. <span data-i18n="footer_rights"></span><br>
  <span data-i18n="footer_delivery"></span>
</footer>

<!-- O'LCHAM TANLASH MODAL -->
<div id="sizeModalOverlay" class="overlay hidden fixed inset-0 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" style="background-color:var(--c-overlay);" onclick="if(event.target===this) closeSizeModal()">
  <div class="bg-surface w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col">
    <div class="p-5 border-b flex items-center justify-between shrink-0" style="border-color:var(--c-border);">
      <h3 class="font-display font-semibold text-lg" data-i18n="modal_choose_size"></h3>
      <button onclick="closeSizeModal()" class="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="p-5 overflow-y-auto">
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
      <p class="text-xs uppercase tracking-wider text-muted mb-1" data-i18n="label_size"></p>
      <p class="text-xs text-muted mb-3" data-i18n="select_sizes_hint"></p>
      <div id="sizeOptions" class="space-y-2 mb-4"></div>

      <button onclick="confirmAddToCart()" class="w-full bg-flash hover:bg-[#163F24] transition-colors text-white font-semibold py-3.5 rounded-full" data-i18n="btn_add_to_cart_confirm"></button>
    </div>
  </div>
</div>

<!-- SAVAT DRAWER -->
<div id="cartOverlay" class="overlay hidden fixed inset-0 backdrop-blur-sm z-[60]" style="background-color:var(--c-overlay);" onclick="if(event.target===this) closeCart()">
  <div id="cartDrawer" class="drawer fixed top-0 right-0 h-full w-full sm:w-[420px] bg-surface translate-x-full flex flex-col">
    <div class="p-5 border-b flex items-center justify-between" style="border-color:var(--c-border);">
      <h3 class="font-display font-semibold text-lg flex items-center gap-2"><i class="fa-solid fa-cart-shopping text-flash"></i> <span data-i18n="cart_title"></span></h3>
      <button onclick="closeCart()" class="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div id="cartItems" class="flex-1 overflow-y-auto p-5 space-y-4"></div>
    <div id="cartFooter" class="border-t p-5 space-y-4" style="border-color:var(--c-border);">
      <div class="flex items-center justify-between text-lg">
        <span class="text-muted" data-i18n="cart_total"></span>
        <span id="cartTotal" class="font-display font-bold text-flash text-2xl">0 so'm</span>
      </div>
      <button onclick="openCheckout()" class="w-full bg-flash hover:bg-[#163F24] transition-colors text-white font-semibold py-3.5 rounded-full inline-flex items-center justify-center gap-2">
        <i class="fa-solid fa-truck-fast"></i> <span data-i18n="btn_order"></span>
      </button>
    </div>
  </div>
</div>

<!-- CHECKOUT MODAL -->
<div id="checkoutOverlay" class="overlay hidden fixed inset-0 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" style="background-color:var(--c-overlay);" onclick="if(event.target===this) closeCheckout()">
  <div class="bg-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] flex flex-col">
    <div class="p-5 border-b flex items-center justify-between shrink-0" style="border-color:var(--c-border);">
      <h3 class="font-display font-semibold text-lg" data-i18n="checkout_title"></h3>
      <button onclick="closeCheckout()" class="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="p-5 overflow-y-auto space-y-4">
      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block" data-i18n="label_name"></label>
        <input id="ckName" type="text" class="w-full bg-surface2 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash" style="border-color:var(--c-border);">
      </div>
      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block" data-i18n="label_phone"></label>
        <input id="ckPhone" type="tel" placeholder="+998 90 123 45 67" class="w-full bg-surface2 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash" style="border-color:var(--c-border);">
      </div>
      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block" data-i18n="label_address"></label>
        <button type="button" onclick="useCurrentLocation()" class="mb-2 inline-flex items-center gap-2 bg-surface2 border rounded-full px-4 py-2 text-xs font-semibold hover:border-flash transition-colors" style="border-color:var(--c-border);">
          <i class="fa-solid fa-location-crosshairs text-flash"></i> <span id="locBtnLabel" data-i18n="use_current_location"></span>
        </button>
        <div id="deliveryMap" class="w-full h-64 rounded-xl overflow-hidden border" style="border-color:var(--c-border);"></div>
        <p class="text-xs text-muted mt-2" data-i18n="map_hint"></p>
        <input id="ckAddress" type="text" class="w-full mt-2 bg-surface2 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash" style="border-color:var(--c-border);">
      </div>
      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block" data-i18n="label_comment"></label>
        <textarea id="ckComment" rows="2" class="w-full bg-surface2 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash resize-none" style="border-color:var(--c-border);"></textarea>
      </div>
      <div class="bg-surface2 rounded-xl p-4 flex items-center justify-between">
        <span class="text-muted text-sm" data-i18n="total_payment"></span>
        <span id="ckTotal" class="font-display font-bold text-flash text-xl">0 so'm</span>
      </div>
    </div>
    <div class="p-5 border-t shrink-0" style="border-color:var(--c-border);">
      <button id="ckSubmitBtn" onclick="submitOrder()" class="w-full bg-flash hover:bg-[#163F24] transition-colors text-white font-semibold py-3.5 rounded-full inline-flex items-center justify-center gap-2">
        <i class="fa-solid fa-check"></i> <span data-i18n="btn_confirm_order"></span>
      </button>
    </div>
  </div>
</div>

<!-- BUYURTMA TASDIQLANDI OYNASI -->
<div id="orderSuccessOverlay" class="overlay hidden fixed inset-0 backdrop-blur-sm z-[80] flex items-center justify-center p-4" style="background-color:var(--c-overlay);">
  <div class="w-full sm:max-w-sm rounded-3xl overflow-hidden text-center relative" style="background: linear-gradient(160deg, #1F5C34 0%, #2D8659 50%, #163F24 100%);">
    <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%);"></div>
    <div class="relative p-10">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center">
        <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center">
          <i class="fa-solid fa-check text-3xl" style="color:#1F5C34;"></i>
        </div>
      </div>
      <h3 class="font-display font-bold text-2xl text-white uppercase mb-2" data-i18n="order_success_title"></h3>
      <p class="text-white/80 text-sm mb-1" data-i18n="order_id_label"></p>
      <p id="orderSuccessId" class="font-display font-bold text-xl text-white mb-8"></p>
      <button onclick="closeOrderSuccess()" class="w-full bg-white text-black font-semibold py-3.5 rounded-full hover:bg-white/90 transition-colors" data-i18n="btn_close"></button>
    </div>
  </div>
</div>

<!-- AUTH MODAL -->
<div id="authOverlay" class="overlay hidden fixed inset-0 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" style="background-color:var(--c-overlay);" onclick="if(event.target===this) closeAuth()">
  <div class="bg-surface w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden">
    <div class="p-5 border-b flex items-center justify-between" style="border-color:var(--c-border);">
      <h3 class="font-display font-semibold text-lg" data-i18n="auth_title"></h3>
      <button onclick="closeAuth()" class="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="flex border-b" style="border-color:var(--c-border);">
      <div id="authTabSignin" class="auth-tab active flex-1" onclick="switchAuthTab('signin')" data-i18n="auth_signin_tab"></div>
      <div id="authTabSignup" class="auth-tab flex-1" onclick="switchAuthTab('signup')" data-i18n="auth_signup_tab"></div>
    </div>
    <div class="p-5 space-y-4">
      <div id="authNameField" class="hidden">
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block" data-i18n="auth_fullname"></label>
        <input id="authName" type="text" class="w-full bg-surface2 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash" style="border-color:var(--c-border);">
      </div>
      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block">Email</label>
        <input id="authEmail" type="email" class="w-full bg-surface2 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash" style="border-color:var(--c-border);">
      </div>
      <div>
        <label class="text-xs uppercase tracking-wider text-muted mb-1.5 block" data-i18n="auth_password"></label>
        <input id="authPassword" type="password" class="w-full bg-surface2 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-flash" style="border-color:var(--c-border);">
      </div>
      <p id="authError" class="text-flash text-sm hidden"></p>
      <button id="authSubmitBtn" onclick="submitAuth()" class="w-full bg-flash hover:bg-[#163F24] transition-colors text-white font-semibold py-3.5 rounded-full" data-i18n="auth_signin_btn"></button>
    </div>
  </div>
</div>

<script>
  const PRODUCTS = ${JSON.stringify(productsWithStock)};
  const SIGNATURE = ${JSON.stringify(signatureWithStock)};
  const EQUIPMENT = ${JSON.stringify(equipmentProducts)};
  const TG_USERNAME = ${JSON.stringify(TELEGRAM_USERNAME)};

  function fmt(n) { return n.toLocaleString('ru-RU').replace(/,/g, ' '); }

  // ============================================================
  //  I18N (uz / ru / en)
  // ============================================================
  const I18N = {
    uz: {
      hero_badge: "Original & Premium Sifat",
      hero_title: "Maydonda Ustunlik Qiling",
      hero_subtitle: "Jahon yulduzlari tanlaydigan eng so'nggi futbol butsilari hamda futzalka modellari. Cheklangan miqdorda va kafolatlangan sifat bilan.",
      stat_models: "Model", stat_original: "Original", stat_sizes: "O'lcham", stat_support: "Qo'llab-quvvatlash",
      catalog_title: "Kataloglar", catalog_subtitle: "Brend bo'yicha tanlang yoki barchasini ko'ring",
      filter_all: "Barchasi", results_suffix: "ta model",
      empty_state: "Bu brendda hozircha mahsulot yo'q",
      label_sizes: "O'lchamlar:", btn_add_cart: "Savatga",
      modal_choose_size: "O'lchamni tanlang", label_size: "O'lcham", label_qty: "Soni",
      btn_add_to_cart_confirm: "Savatga qo'shish", alert_choose_size: "Iltimos, o'lchamni tanlang",
      cart_title: "Savat", cart_empty: "Savat bo'sh", cart_total: "Jami:", btn_order: "Buyurtma berish",
      checkout_title: "Buyurtmani rasmiylashtirish", label_name: "Ismingiz", label_phone: "Telefon raqami",
      label_address: "Yetkazib berish manzili — xaritadan belgilang",
      map_hint: "Xaritada kerakli nuqtaga bosing — manzil avtomatik aniqlanadi.",
      label_comment: "Izoh (ixtiyoriy)", total_payment: "Jami to'lov:", btn_confirm_order: "Buyurtmani tasdiqlash",
      footer_rights: "Barcha huquqlar himoyalangan.", footer_delivery: "O'zbekiston bo'ylab yetkazib berish xizmati mavjud.",
      auth_title: "Akkount", auth_signin_tab: "Kirish", auth_signup_tab: "Ro'yxatdan o'tish",
      auth_fullname: "Ism Familiya", auth_password: "Parol",
      auth_signin_btn: "Kirish", auth_signup_btn: "Ro'yxatdan o'tish",
      auth_login_header: "Kirish", auth_logout: "Chiqish",
      order_success: "Buyurtmangiz qabul qilindi! Buyurtma raqami: ",
      order_success2: "\\nTez orada operatorimiz siz bilan bog'lanadi.",
      err_fill_all: "Barcha maydonlarni to'ldiring", err_server: "Server bilan bog'lanishda xatolik yuz berdi.",
      nav_home: "Bosh sahifa", nav_signature: "Mashhur futbolchilar", nav_equipment: "Futbol anjomlari",
      nav_catalog: "Kataloglar", nav_about: "Biz haqimizda", footer_contact: "Aloqa",
      hero_cta_catalog: "Kataloglarni ko'rish", hero_cta_signature: "Signature'larni ko'rish",
      news_badge: "Futbol dunyosidan", news_title: "Maslahat va yangiliklar",
      news1_title: "To'g'ri butsi qanday tanlanadi", news1_desc: "Oyoq shakli, maydon turi (FG/TF/IN) va o'lchamga qarab butsi tanlash bo'yicha qisqa qo'llanma.",
      news2_title: "Futbol qoidalaridagi so'nggi o'zgarishlar", news2_desc: "IFAB tomonidan tasdiqlangan eng so'nggi qoidalar yangilanishlari haqida umumiy ma'lumot.",
      news3_title: "Butsingizni qanday parvarish qilish kerak", news3_desc: "Butsi umrini uzaytirish uchun tozalash va saqlash bo'yicha amaliy tavsiyalar.",
      signature_title: "Mashhur futbolchilar edition'lari", signature_subtitle: "Cheklangan seriyadagi maxsus dizaynlar",
      equipment_title: "Futbol anjomlari", equipment_subtitle: "O'yin uchun kerakli barcha aksessuarlar",
      cat_ball: "To'plar", cat_gloves: "Qo'lqoplar", cat_jersey: "Formalar", cat_socks: "Paypoqlar", cat_protection: "Himoya vositalari",
      about_title: "Biz haqimizda", about_text: "Elite Boots — O'zbekistondagi original futbol butsilari va anjomlari bo'yicha ishonchli do'kon. Biz faqat rasmiy distribyutorlardan olib kelingan, 100% original mahsulotlarni taklif qilamiz.",
      label_left: "ta qoldi", label_out_of_stock: "Tugagan", only_left_badge: "Faqat",
      use_current_location: "Joriy manzilim", locating: "Aniqlanmoqda...",
      order_success_title: "Buyurtmangiz tasdiqlandi!", order_id_label: "Buyurtma raqami:", btn_close: "Yopish",
      select_sizes_hint: "Har bir o'lcham uchun kerakli sonni kiriting"
    },
    ru: {
      hero_badge: "Оригинальное и премиум качество",
      hero_title: "Превосходство на поле",
      hero_subtitle: "Новейшие футбольные бутсы и футзалки, которым доверяют звёзды мирового футбола. Ограниченное количество и гарантия качества.",
      stat_models: "Моделей", stat_original: "Оригинал", stat_sizes: "Размер", stat_support: "Поддержка",
      catalog_title: "Каталоги", catalog_subtitle: "Выберите по бренду или смотрите все",
      filter_all: "Все", results_suffix: "моделей",
      empty_state: "В этом бренде пока нет товаров",
      label_sizes: "Размеры:", btn_add_cart: "В корзину",
      modal_choose_size: "Выберите размер", label_size: "Размер", label_qty: "Количество",
      btn_add_to_cart_confirm: "Добавить в корзину", alert_choose_size: "Пожалуйста, выберите размер",
      cart_title: "Корзина", cart_empty: "Корзина пуста", cart_total: "Итого:", btn_order: "Оформить заказ",
      checkout_title: "Оформление заказа", label_name: "Ваше имя", label_phone: "Номер телефона",
      label_address: "Адрес доставки — отметьте на карте",
      map_hint: "Нажмите на нужную точку на карте — адрес определится автоматически.",
      label_comment: "Комментарий (необязательно)", total_payment: "Итого к оплате:", btn_confirm_order: "Подтвердить заказ",
      footer_rights: "Все права защищены.", footer_delivery: "Доставка по всему Узбекистану.",
      auth_title: "Аккаунт", auth_signin_tab: "Вход", auth_signup_tab: "Регистрация",
      auth_fullname: "Имя Фамилия", auth_password: "Пароль",
      auth_signin_btn: "Войти", auth_signup_btn: "Зарегистрироваться",
      auth_login_header: "Войти", auth_logout: "Выйти",
      order_success: "Ваш заказ принят! Номер заказа: ",
      order_success2: "\\nНаш оператор скоро свяжется с вами.",
      err_fill_all: "Заполните все поля", err_server: "Ошибка соединения с сервером.",
      nav_home: "Главная", nav_signature: "Именные модели", nav_equipment: "Футбольный инвентарь",
      nav_catalog: "Каталоги", nav_about: "О нас", footer_contact: "Контакты",
      hero_cta_catalog: "Смотреть каталоги", hero_cta_signature: "Смотреть именные модели",
      news_badge: "Из мира футбола", news_title: "Советы и новости",
      news1_title: "Как выбрать правильные бутсы", news1_desc: "Краткое руководство по выбору бутс в зависимости от формы стопы, типа поля (FG/TF/IN) и размера.",
      news2_title: "Последние изменения в правилах футбола", news2_desc: "Обзор последних обновлений правил, утверждённых IFAB.",
      news3_title: "Как ухаживать за бутсами", news3_desc: "Практические советы по чистке и хранению для продления срока службы бутс.",
      signature_title: "Именные модели известных футболистов", signature_subtitle: "Эксклюзивный дизайн ограниченной серии",
      equipment_title: "Футбольный инвентарь", equipment_subtitle: "Все аксессуары, необходимые для игры",
      cat_ball: "Мячи", cat_gloves: "Перчатки", cat_jersey: "Форма", cat_socks: "Гетры", cat_protection: "Защита",
      about_title: "О нас", about_text: "Elite Boots — надёжный магазин оригинальных футбольных бутс и инвентаря в Узбекистане. Мы предлагаем только 100% оригинальную продукцию от официальных дистрибьюторов.",
      label_left: "шт. осталось", label_out_of_stock: "Нет в наличии", only_left_badge: "Осталось всего",
      use_current_location: "Моё текущее местоположение", locating: "Определение...",
      order_success_title: "Ваш заказ подтверждён!", order_id_label: "Номер заказа:", btn_close: "Закрыть",
      select_sizes_hint: "Введите нужное количество для каждого размера"
    },
    en: {
      hero_badge: "Original & Premium Quality",
      hero_title: "Dominate The Pitch",
      hero_subtitle: "The latest football boots and futsal shoes trusted by world-class players. Limited stock, guaranteed authenticity.",
      stat_models: "Models", stat_original: "Original", stat_sizes: "Sizes", stat_support: "Support",
      catalog_title: "Catalogs", catalog_subtitle: "Filter by brand or browse everything",
      filter_all: "All", results_suffix: "models",
      empty_state: "No products in this brand yet",
      label_sizes: "Sizes:", btn_add_cart: "Add to Cart",
      modal_choose_size: "Choose Size", label_size: "Size", label_qty: "Quantity",
      btn_add_to_cart_confirm: "Add to Cart", alert_choose_size: "Please choose a size",
      cart_title: "Cart", cart_empty: "Your cart is empty", cart_total: "Total:", btn_order: "Place Order",
      checkout_title: "Checkout", label_name: "Your Name", label_phone: "Phone Number",
      label_address: "Delivery Address — pick on the map",
      map_hint: "Click the location on the map — the address is detected automatically.",
      label_comment: "Comment (optional)", total_payment: "Total Payment:", btn_confirm_order: "Confirm Order",
      footer_rights: "All rights reserved.", footer_delivery: "Delivery available across Uzbekistan.",
      auth_title: "Account", auth_signin_tab: "Sign In", auth_signup_tab: "Sign Up",
      auth_fullname: "Full Name", auth_password: "Password",
      auth_signin_btn: "Sign In", auth_signup_btn: "Sign Up",
      auth_login_header: "Sign In", auth_logout: "Log Out",
      order_success: "Your order has been placed! Order ID: ",
      order_success2: "\\nOur team will contact you shortly.",
      err_fill_all: "Please fill in all fields", err_server: "Could not connect to the server.",
      nav_home: "Home", nav_signature: "Signature Boots", nav_equipment: "Football Gear",
      nav_catalog: "Catalogs", nav_about: "About Us", footer_contact: "Contact",
      hero_cta_catalog: "Browse Catalogs", hero_cta_signature: "View Signature Editions",
      news_badge: "From The World Of Football", news_title: "Tips & News",
      news1_title: "How To Choose The Right Boots", news1_desc: "A quick guide to picking boots based on foot shape, pitch type (FG/TF/IN) and size.",
      news2_title: "Latest Changes To The Laws Of The Game", news2_desc: "An overview of the most recent rule updates approved by IFAB.",
      news3_title: "How To Care For Your Boots", news3_desc: "Practical cleaning and storage tips to extend the life of your boots.",
      signature_title: "Signature Editions By Famous Players", signature_subtitle: "Exclusive limited-series designs",
      equipment_title: "Football Gear", equipment_subtitle: "Everything you need to play",
      cat_ball: "Balls", cat_gloves: "Gloves", cat_jersey: "Jerseys", cat_socks: "Socks", cat_protection: "Protection",
      about_title: "About Us", about_text: "Elite Boots is a trusted store for original football boots and gear in Uzbekistan. We only offer 100% authentic products sourced from official distributors.",
      label_left: "left", label_out_of_stock: "Out of stock", only_left_badge: "Only",
      use_current_location: "My current location", locating: "Locating...",
      order_success_title: "Your order is confirmed!", order_id_label: "Order ID:", btn_close: "Close",
      select_sizes_hint: "Enter the quantity you need for each size"
    }
  };

  let currentLang = localStorage.getItem('fb_lang') || 'uz';

  function t(key) { return (I18N[currentLang] && I18N[currentLang][key]) || key; }

  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('fb_lang', lang);
    applyLanguage();
  }

  function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    ['Uz','Ru','En'].forEach(suf => {
      const btn = document.getElementById('langBtn' + suf);
      const btnM = document.getElementById('langBtn' + suf + 'M');
      const isActive = suf.toLowerCase() === currentLang;
      if (btn) btn.classList.toggle('active', isActive);
      if (btnM) btnM.classList.toggle('active', isActive);
    });
    renderProductGrid();
    renderCart();
  }

  // ============================================================
  //  MAVZU (dark / light)
  // ============================================================
  function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.classList.toggle('light');
    localStorage.setItem('fb_theme', isLight ? 'light' : 'dark');
    document.getElementById('themeIcon').className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
  (function initThemeIcon() {
    const isLight = document.documentElement.classList.contains('light');
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('themeIcon').className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    });
  })();

  // ============================================================
  //  MAHSULOTLAR GRIDINI CHIZISH (joriy tilga qarab)
  // ============================================================
  const ALL_BOOTS = PRODUCTS.concat(SIGNATURE);

  function totalStock(p) {
    if (!p.stock) return null;
    return Object.values(p.stock).reduce((s, n) => s + n, 0);
  }

  function productCardHTML(p) {
    const info = p.i18n[currentLang] || p.i18n.uz;
    const hasDiscount = p.oldPrice && p.oldPrice > p.price;
    const discountPct = hasDiscount ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const stockSum = totalStock(p);
    return \`
      <div class="product-card card-hover bg-surface border rounded-2xl overflow-hidden flex flex-col relative" style="border-color:var(--c-border);" data-brand="\${p.brand}">
        \${hasDiscount ? \`<span class="absolute top-3 left-3 z-10 bg-flash text-white text-xs font-bold px-2.5 py-1 rounded-full">-\${discountPct}%</span>\` : ''}
        <span class="absolute top-3 right-3 z-10 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur" style="background-color:var(--c-badge); border-color:var(--c-border);">\${p.brand}</span>
        <div class="relative bg-white h-52 flex items-center justify-center">
          <span class="jersey-num absolute -top-2 right-3 text-6xl font-bold select-none">\${p.id}</span>
          <img src="\${p.img}" alt="\${info.name}" class="h-40 object-contain" loading="lazy">
        </div>
        <div class="p-5 flex flex-col flex-1">
          <span class="text-xs uppercase tracking-wider text-flash font-semibold">\${info.tag}</span>
          <h3 class="font-display font-semibold text-xl my-2">\${info.name}</h3>
          <p class="text-muted text-sm mb-3">\${info.desc}</p>
          <div class="flex items-baseline gap-2 mb-1">
            <p class="text-flash font-bold text-2xl">\${fmt(p.price)} <span class="text-sm font-normal text-muted">so'm</span></p>
            \${hasDiscount ? \`<p class="text-muted text-sm line-through">\${fmt(p.oldPrice)}</p>\` : ''}
          </div>
          \${hasDiscount && stockSum != null ? \`<p class="text-flash text-xs font-semibold mb-2"><i class="fa-solid fa-fire"></i> \${t('only_left_badge')} \${stockSum} \${t('label_left')}</p>\` : '<div class="mb-2"></div>'}
          <p class="text-xs text-muted mb-4">\${t('label_sizes')} \${p.minSize} – \${p.maxSize}</p>
          <button onclick="openSizeModal('\${p.id}')" class="mt-auto bg-flash hover:bg-[#163F24] transition-colors text-white text-sm font-semibold text-center px-4 py-3 rounded-full inline-flex items-center justify-center gap-2">
            <i class="fa-solid fa-cart-plus"></i> \${t('btn_add_cart')}
          </button>
        </div>
      </div>\`;
  }

  function renderProductGrid() {
    const grid = document.getElementById('productGrid');
    if (grid) {
      grid.innerHTML = PRODUCTS.map(productCardHTML).join('');
      const activeTab = document.querySelector('#katalog .brand-tab.active');
      const activeBrand = activeTab ? activeTab.dataset.brand : 'all';
      applyBrandFilter(activeBrand);
    }
    const sigGrid = document.getElementById('signatureGrid');
    if (sigGrid) sigGrid.innerHTML = SIGNATURE.map(productCardHTML).join('');
    renderEquipmentGrid();
  }

  function applyBrandFilter(brand) {
    const cards = document.querySelectorAll('#productGrid .product-card');
    let visibleCount = 0;
    cards.forEach(card => {
      const matches = (brand === 'all' || card.dataset.brand === brand);
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });
    document.getElementById('resultCount').textContent = visibleCount + ' ' + t('results_suffix');
    document.getElementById('emptyState').classList.toggle('hidden', visibleCount > 0);
  }

  function filterBrand(brand, btnEl) {
    document.querySelectorAll('#katalog .brand-tab').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    applyBrandFilter(brand);
  }

  // ---------- Futbol anjomlari (o'lchamsiz mahsulotlar) ----------
  function equipmentCardHTML(p) {
    const info = p.i18n[currentLang] || p.i18n.uz;
    const hasDiscount = p.oldPrice && p.oldPrice > p.price;
    const discountPct = hasDiscount ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return \`
      <div class="equipment-card card-hover bg-surface border rounded-2xl overflow-hidden flex flex-col relative" style="border-color:var(--c-border);" data-cat="\${p.category}">
        \${hasDiscount ? \`<span class="absolute top-3 left-3 z-10 bg-flash text-white text-xs font-bold px-2.5 py-1 rounded-full">-\${discountPct}%</span>\` : ''}
        <div class="relative bg-white h-52 flex items-center justify-center">
          <img src="\${p.img}" alt="\${info.name}" class="h-40 object-contain" loading="lazy">
        </div>
        <div class="p-5 flex flex-col flex-1">
          <h3 class="font-display font-semibold text-lg my-1">\${info.name}</h3>
          <p class="text-muted text-sm mb-3">\${info.desc}</p>
          <div class="flex items-baseline gap-2 mb-4">
            <p class="text-flash font-bold text-xl">\${fmt(p.price)} <span class="text-sm font-normal text-muted">so'm</span></p>
            \${hasDiscount ? \`<p class="text-muted text-sm line-through">\${fmt(p.oldPrice)}</p>\` : ''}
          </div>
          <button onclick="addEquipmentToCart('\${p.id}')" class="mt-auto bg-flash hover:bg-[#163F24] transition-colors text-white text-sm font-semibold text-center px-4 py-3 rounded-full inline-flex items-center justify-center gap-2">
            <i class="fa-solid fa-cart-plus"></i> \${t('btn_add_cart')}
          </button>
        </div>
      </div>\`;
  }

  function renderEquipmentGrid() {
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;
    grid.innerHTML = EQUIPMENT.map(equipmentCardHTML).join('');
    const activeTab = document.querySelector('#anjomlar .brand-tab.active');
    const activeCat = activeTab ? activeTab.dataset.cat : 'all';
    applyEquipmentFilter(activeCat);
  }

  function applyEquipmentFilter(cat) {
    document.querySelectorAll('.equipment-card').forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
    });
  }

  function filterEquipment(cat, btnEl) {
    document.querySelectorAll('#anjomlar .brand-tab').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    applyEquipmentFilter(cat);
  }

  function addEquipmentToCart(id) {
    const p = EQUIPMENT.find(x => x.id === id);
    if (!p) return;
    const cart = getCart();
    const existing = cart.find(i => i.id === id && i.size == null);
    if (existing) existing.qty += 1;
    else cart.push({ id: p.id, price: p.price, img: p.img, size: null, qty: 1 });
    saveCart(cart);
    openCart();
  }

  // ============================================================

  //  SAVAT
  // ============================================================
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

  let currentModalProduct = null;

  function openSizeModal(id) {
    const p = ALL_BOOTS.find(x => x.id === id);
    if (!p) return;
    const info = p.i18n[currentLang] || p.i18n.uz;
    currentModalProduct = p;

    document.getElementById('modalImg').src = p.img;
    document.getElementById('modalImg').alt = info.name;
    document.getElementById('modalName').textContent = info.name;
    document.getElementById('modalPrice').textContent = fmt(p.price) + " so'm";
    const oldEl = document.getElementById('modalOldPrice');
    if (p.oldPrice && p.oldPrice > p.price) {
      oldEl.textContent = fmt(p.oldPrice) + " so'm";
      oldEl.classList.remove('hidden');
    } else {
      oldEl.classList.add('hidden');
    }

    const sizeBox = document.getElementById('sizeOptions');
    sizeBox.innerHTML = '';
    for (let s = p.minSize; s <= p.maxSize; s++) {
      const available = (p.stock && p.stock[s] != null) ? p.stock[s] : 0;
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between bg-surface2 rounded-xl px-4 py-2.5';
      const isOut = available <= 0;
      row.innerHTML = \`
        <div>
          <span class="font-semibold">\${s}</span>
          <span class="text-xs \${isOut ? 'text-flash' : 'text-muted'} ml-2">\${isOut ? t('label_out_of_stock') : available + ' ' + t('label_left')}</span>
        </div>
        <div class="flex items-center gap-2 bg-surface rounded-full px-2 py-1">
          <button type="button" class="size-qty-minus w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center" \${isOut ? 'disabled' : ''}>−</button>
          <span class="size-qty-value w-6 text-center font-semibold text-sm">0</span>
          <button type="button" class="size-qty-plus w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center" \${isOut ? 'disabled' : ''}>+</button>
        </div>\`;
      row.dataset.size = s;
      row.dataset.max = available;
      const valueEl = row.querySelector('.size-qty-value');
      row.querySelector('.size-qty-minus').onclick = () => {
        let v = parseInt(valueEl.textContent, 10);
        v = Math.max(0, v - 1);
        valueEl.textContent = v;
      };
      row.querySelector('.size-qty-plus').onclick = () => {
        let v = parseInt(valueEl.textContent, 10);
        const max = parseInt(row.dataset.max, 10);
        v = Math.min(max, v + 1);
        valueEl.textContent = v;
      };
      sizeBox.appendChild(row);
    }

    document.getElementById('sizeModalOverlay').classList.remove('hidden');
  }

  function closeSizeModal() { document.getElementById('sizeModalOverlay').classList.add('hidden'); }

  function confirmAddToCart() {
    const rows = document.querySelectorAll('#sizeOptions > div');
    const selections = [];
    rows.forEach(row => {
      const qty = parseInt(row.querySelector('.size-qty-value').textContent, 10);
      if (qty > 0) selections.push({ size: parseInt(row.dataset.size, 10), qty });
    });

    if (selections.length === 0) { alert(t('alert_choose_size')); return; }

    const cart = getCart();
    selections.forEach(sel => {
      const existing = cart.find(i => i.id === currentModalProduct.id && i.size === sel.size);
      if (existing) existing.qty += sel.qty;
      else cart.push({ id: currentModalProduct.id, price: currentModalProduct.price, img: currentModalProduct.img, size: sel.size, qty: sel.qty });
    });
    saveCart(cart);
    closeSizeModal();
    openCart();
  }

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
    if (!box) return;
    if (cart.length === 0) {
      box.innerHTML = '<p class="text-muted text-center py-10">' + t('cart_empty') + '</p>';
      document.getElementById('cartTotal').textContent = "0 so'm";
      return;
    }
    box.innerHTML = cart.map((item, idx) => {
      const boot = ALL_BOOTS.find(x => x.id === item.id);
      const equip = boot ? null : EQUIPMENT.find(x => x.id === item.id);
      const p = boot || equip;
      const info = p ? (p.i18n[currentLang] || p.i18n.uz) : { name: item.id };
      const sizeLine = item.size != null
        ? \`\${t('label_size')}: \${item.size} · \${t('label_qty')}: \${item.qty}\`
        : \`\${t('label_qty')}: \${item.qty}\`;
      return \`
      <div class="flex gap-3 bg-surface2 rounded-xl p-3">
        <img src="\${item.img}" class="w-16 h-16 object-contain bg-white rounded-lg p-1">
        <div class="flex-1">
          <p class="font-semibold text-sm">\${info.name}</p>
          <p class="text-muted text-xs mb-1">\${sizeLine}</p>
          <p class="text-flash font-bold text-sm">\${fmt(item.price * item.qty)} so'm</p>
        </div>
        <button onclick="removeFromCart(\${idx})" class="text-muted hover:text-flash transition-colors self-start">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>\`;
    }).join('');
    const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
    document.getElementById('cartTotal').textContent = fmt(total) + " so'm";
  }

  function removeFromCart(idx) {
    const cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart);
    renderCart();
  }

  // ============================================================
  //  CHECKOUT (xarita bilan)
  // ============================================================
  let deliveryMap = null;
  let deliveryMarker = null;
  let selectedLat = null;
  let selectedLng = null;
  const TASHKENT_CENTER = [41.2995, 69.2401];

  function openCheckout() {
    const cart = getCart();
    if (cart.length === 0) { alert(t('cart_empty')); return; }
    document.getElementById('ckTotal').textContent = document.getElementById('cartTotal').textContent;
    document.getElementById('checkoutOverlay').classList.remove('hidden');

    setTimeout(() => {
      if (!deliveryMap) {
        deliveryMap = L.map('deliveryMap').setView(TASHKENT_CENTER, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(deliveryMap);
        deliveryMap.on('click', function(e) { setDeliveryPoint(e.latlng.lat, e.latlng.lng); });
      } else {
        deliveryMap.invalidateSize();
      }
    }, 50);
  }

  function setDeliveryPoint(lat, lng) {
    selectedLat = lat; selectedLng = lng;
    if (deliveryMarker) { deliveryMarker.setLatLng([lat, lng]); }
    else {
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
    addrInput.value = '...';
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
      .then(r => r.json())
      .then(data => { addrInput.value = data.display_name || (lat.toFixed(5) + ', ' + lng.toFixed(5)); })
      .catch(() => { addrInput.value = lat.toFixed(5) + ', ' + lng.toFixed(5); });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert(t('err_server'));
      return;
    }
    const label = document.getElementById('locBtnLabel');
    const original = label.textContent;
    label.textContent = t('locating');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        if (deliveryMap) { deliveryMap.setView([latitude, longitude], 15); }
        setDeliveryPoint(latitude, longitude);
        label.textContent = original;
      },
      () => {
        label.textContent = original;
        alert(t('err_server'));
      }
    );
  }

  function closeCheckout() { document.getElementById('checkoutOverlay').classList.add('hidden'); }

  function submitOrder() {
    const name = document.getElementById('ckName').value.trim();
    const phone = document.getElementById('ckPhone').value.trim();
    const address = document.getElementById('ckAddress').value.trim();
    const comment = document.getElementById('ckComment').value.trim();
    const cart = getCart();

    if (!name || !phone || !address) { alert(t('err_fill_all')); return; }
    if (cart.length === 0) { alert(t('cart_empty')); return; }

    const btn = document.getElementById('ckSubmitBtn');
    btn.disabled = true;

    fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, address, lat: selectedLat, lng: selectedLng, comment, cart })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          saveCart([]);
          renderCart();
          closeCheckout();
          closeCart();
          document.getElementById('ckName').value = '';
          document.getElementById('ckPhone').value = '';
          document.getElementById('ckAddress').value = '';
          document.getElementById('ckComment').value = '';
          showOrderSuccess(data.orderId);
        } else {
          alert(data.message || t('err_server'));
        }
      })
      .catch(() => alert(t('err_server')))
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ' + t('btn_confirm_order');
      });
  }

  function showOrderSuccess(orderId) {
    document.getElementById('orderSuccessId').textContent = orderId;
    document.getElementById('orderSuccessOverlay').classList.remove('hidden');
  }
  function closeOrderSuccess() {
    document.getElementById('orderSuccessOverlay').classList.add('hidden');
  }

  // ============================================================
  //  AUTH (email orqali kirish / ro'yxatdan o'tish)
  // ============================================================
  let currentUser = null;
  let authMode = 'signin';

  function renderAuthArea() {
    const box = document.getElementById('authArea');
    if (currentUser) {
      box.innerHTML = \`
        <button onclick="logout()" class="flex items-center gap-2 bg-surface border rounded-full pl-1.5 pr-4 py-1.5 hover:border-flash transition-colors" style="border-color:var(--c-border);">
          <span class="w-8 h-8 rounded-full bg-flash text-white flex items-center justify-center font-bold text-sm">\${currentUser.name.charAt(0).toUpperCase()}</span>
          <span class="text-sm font-medium hidden md:inline">\${currentUser.name}</span>
          <i class="fa-solid fa-arrow-right-from-bracket text-xs text-muted"></i>
        </button>\`;
    } else {
      box.innerHTML = \`
        <button onclick="openAuth()" class="w-11 h-11 sm:w-auto sm:px-5 rounded-full bg-surface border flex items-center justify-center gap-2 hover:border-flash transition-colors" style="border-color:var(--c-border);">
          <i class="fa-solid fa-user"></i><span class="hidden sm:inline text-sm font-semibold" data-i18n="auth_login_header">\${t('auth_login_header')}</span>
        </button>\`;
    }
  }

  function openAuth() {
    document.getElementById('authError').classList.add('hidden');
    document.getElementById('authOverlay').classList.remove('hidden');
  }
  function closeAuth() { document.getElementById('authOverlay').classList.add('hidden'); }

  function switchAuthTab(mode) {
    authMode = mode;
    document.getElementById('authTabSignin').classList.toggle('active', mode === 'signin');
    document.getElementById('authTabSignup').classList.toggle('active', mode === 'signup');
    document.getElementById('authNameField').classList.toggle('hidden', mode !== 'signup');
    document.getElementById('authSubmitBtn').textContent = mode === 'signup' ? t('auth_signup_btn') : t('auth_signin_btn');
    document.getElementById('authError').classList.add('hidden');
  }

  function submitAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value.trim();
    const errEl = document.getElementById('authError');
    errEl.classList.add('hidden');

    if (!email || !password || (authMode === 'signup' && !name)) {
      errEl.textContent = t('err_fill_all');
      errEl.classList.remove('hidden');
      return;
    }

    const url = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
    const payload = authMode === 'signup' ? { name, email, password } : { email, password };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          currentUser = data.user;
          renderAuthArea();
          closeAuth();
          document.getElementById('authEmail').value = '';
          document.getElementById('authPassword').value = '';
          document.getElementById('authName').value = '';
          // Checkout formani login ma'lumotlari bilan avtomatik to'ldirish
          const ckName = document.getElementById('ckName');
          if (ckName && !ckName.value) ckName.value = currentUser.name;
        } else {
          errEl.textContent = data.message || t('err_server');
          errEl.classList.remove('hidden');
        }
      })
      .catch(() => {
        errEl.textContent = t('err_server');
        errEl.classList.remove('hidden');
      });
  }

  function logout() {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => { currentUser = null; renderAuthArea(); });
  }

  function checkAuth() {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        currentUser = data.user;
        renderAuthArea();
      })
      .catch(() => { renderAuthArea(); });
  }

  // ============================================================
  //  Ishga tushirish
  // ============================================================
  updateCartBadge();
  applyLanguage();
  checkAuth();
</script>

</body>
</html>`);
});

app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
