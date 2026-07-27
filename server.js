const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// public/images papkasidagi rasmlarni /images/... orqali xizmat qilish
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

const products = [
  {
    num: '01',
    brand: 'Nike',
    tag: 'Maysa uchun (FG)',
    name: 'Nike Mercurial Superfly 9',
    desc: 'Zoom Air amortizatsiyasi, yengil korpus va tezlik uchun maxsus taglik',
    price: '980 000',
    sizes: '39 – 45',
    img: '/images/mercurial-superfly-9.png'
  },
  {
    num: '02',
    brand: 'Adidas',
    tag: 'Maysa uchun (FG)',
    name: 'Adidas Predator Elite',
    desc: 'Strikeskin rezina elementlari va maksimal koptok nazorati',
    price: '1 050 000',
    sizes: '40 – 44',
    img: '/images/adidas-predator-elite.png'
  },
  {
    num: '03',
    brand: 'Puma',
    tag: "Shtik / Sun'iy maydon (TF)",
    name: 'Puma Future Ultimate TF',
    desc: 'PWRTAPE ushlab turuvchi tasmali yengil va elastik korpus',
    price: '890 000',
    sizes: '38 – 43',
    img: '/images/puma-future-ultimate-tf.png'
  },
  {
    num: '04',
    brand: 'Nike',
    tag: 'Maysa uchun (FG)',
    name: 'Nike Phantom GX II Elite',
    desc: "Gripknit ustki qoplamasi va aniq zarbalar uchun mukammal moslik",
    price: '1 120 000',
    sizes: '39 – 44',
    img: '/images/nike-phantom-gx-ii-elite.png'
  },
  {
    num: '05',
    brand: 'Nike',
    tag: 'Maysa uchun (FG)',
    name: 'Nike Tiempo Legend 10',
    desc: "FlyTouch Pro yumshoq sun'iy teri va klassik qulaylik",
    price: '920 000',
    sizes: '40 – 45',
    img: '/images/nike-tiempo-legend-10.png'
  },
  {
    num: '06',
    brand: 'Adidas',
    tag: 'Maysa uchun (FG)',
    name: 'Adidas X Crazyfast.1',
    desc: 'Aeropacity Speedskin ultrafoydali yengil korpus va sprint taglik',
    price: '990 000',
    sizes: '39 – 43',
    img: '/images/adidas-x-crazyfast.png'
  },
  {
    num: '07',
    brand: 'Mizuno',
    tag: 'Zal uchun (IN / IC)',
    name: 'Mizuno Morelia Neo IN',
    desc: 'Yapon sifati, keng oyoqlar uchun ideal va sirpanmaydigan taglik',
    price: '850 000',
    sizes: '38 – 44',
    img: '/images/mizuno-morelia-neo-in.png'
  },
  {
    num: '08',
    brand: 'Puma',
    tag: 'Maysa uchun (FG)',
    name: 'Puma King Match FG',
    desc: 'K-Better materiali, yengil konstruksiya va klassik nazorat',
    price: '870 000',
    sizes: '39 – 44',
    img: '/images/puma-king-match-fg.png'
  }
];

const TELEGRAM_USERNAME = 'Moysinjonvv';

function productCard(p) {
  const tgUrl = 'https://t.me/' + TELEGRAM_USERNAME + '?text=' + encodeURIComponent('Salom! ' + p.name + ' haqida malumot bering');
  return `
    <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div class="relative bg-white h-52 flex items-center justify-center">
        <span class="jersey-num absolute -top-2 right-3 text-6xl font-bold select-none">${p.num}</span>
        <img src="${p.img}" alt="${p.name}" class="h-40 object-contain" loading="lazy">
      </div>
      <div class="p-5 flex flex-col flex-1">
        <span class="text-xs uppercase tracking-wider text-flash font-semibold">${p.tag}</span>
        <h3 class="font-display font-semibold text-xl my-2">${p.name}</h3>
        <p class="text-muted text-sm mb-3">${p.desc}</p>
        <p class="text-flash font-bold text-2xl mb-3">${p.price} <span class="text-sm font-normal text-muted">so'm</span></p>
        <p class="text-xs text-muted mb-4">O'lchamlar: ${p.sizes}</p>
        <a href="${tgUrl}" target="_blank" rel="noopener"
           class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-sm font-semibold text-center px-4 py-3 rounded-full inline-flex items-center justify-center gap-2">
          <i class="fa-brands fa-telegram"></i> Telegram'da buyurtma
        </a>
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
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: { base: '#0B0B0D', surface: '#17181C', flash: '#FF3D2E', muted: '#8B8D93' },
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
</style>
</head>
<body class="bg-base text-white font-body">

<header class="sticky top-0 z-50 bg-base/90 backdrop-blur-md border-b border-white/10">
  <div class="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between h-20">
    <a href="#" class="font-display font-bold text-2xl">FB FLASHBOOTS <span class="text-flash text-sm block font-body font-normal">Pro Sport Store</span></a>
    <a href="https://t.me/${TELEGRAM_USERNAME}" target="_blank" rel="noopener" class="bg-flash hover:bg-red-600 transition-colors text-white font-semibold text-sm px-5 py-2.5 rounded-full inline-flex items-center gap-2">
      <i class="fa-brands fa-telegram"></i> Aloqa
    </a>
  </div>
</header>

<section class="max-w-7xl mx-auto px-5 md:px-8 py-16 text-center">
  <span class="text-flash text-xs uppercase tracking-widest font-semibold">Original & Premium Sifat</span>
  <h1 class="font-display font-bold text-4xl md:text-5xl uppercase mt-3 mb-4">Maydonda Ustunlik Qiling</h1>
  <p class="text-muted max-w-xl mx-auto">Jahon yulduzlari tanlaydigan eng so'nggi futbol butsilari hamda futzalka modellari. Cheklangan miqdorda va kafolatlangan sifat bilan.</p>
</section>

<section id="katalog" class="max-w-7xl mx-auto px-5 md:px-8 py-10">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="font-display font-bold text-2xl uppercase">Katalog</h2>
      <p class="text-muted text-sm">Barcha
