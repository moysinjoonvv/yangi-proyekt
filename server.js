const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BootsStore — Original Futbol Butsilari | Nike, Adidas, Puma</title>
<meta name="description" content="BootsStore — O'zbekistonda original Nike Mercurial, Adidas Predator, Puma Future va Phantom GX futbol butsilarini eng qulay narxlarda xarid qiling. Tez yetkazib berish, 100% original kafolat.">
<meta name="keywords" content="futbol butsi, futbol krossovkasi, Nike Mercurial, Adidas Predator, Puma Future, Phantom GX, original butsi, Toshkent butsi do'koni">
<meta name="author" content="BootsStore">
<meta name="robots" content="index, follow">

<!-- Google Site Verification -->
<meta name="google-site-verification" content="osGraURC-Y5MRG12VYCnGuOzZm7wNwN1DwQeYqXpD8A" />

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="BootsStore — Original va Premium Futbol Butsilari ⚽">
<meta property="og:description" content="Nike, Adidas, Puma va boshqa jahon brendlarining original futbol butsilari. Telegram orqali qulay buyurtma bering.">
<meta property="og:image" content="https://images.unsplash.com/photo-1517927033932-b3d18e61fb8e?w=1200&q=80">
<meta property="og:url" content="https://bootsstore.uz/">
<meta property="og:locale" content="uz_UZ">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BootsStore — Original va Premium Futbol Butsilari ⚽">
<meta name="twitter:description" content="Original Nike, Adidas, Puma futbol butsilari — tez yetkazib berish va 100% original kafolat bilan.">
<meta name="twitter:image" content="https://images.unsplash.com/photo-1517927033932-b3d18e61fb8e?w=1200&q=80">

<link rel="icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/861/861512.png">

<!-- Tailwind CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<!-- FontAwesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<!-- Google Fonts: Oswald (display) + Inter (body) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          base: '#0B0B0D',
          surface: '#17181C',
          surface2: '#1F2025',
          flash: '#FF3D2E',
          gold: '#C9A227',
          ink: '#F5F5F0',
          muted: '#8B8D93'
        },
        fontFamily: {
          display: ['Oswald', 'sans-serif'],
          body: ['Inter', 'sans-serif']
        }
      }
    }
  }
</script>

<style>
  html { scroll-behavior: smooth; }
  body { background-color: #0B0B0D; }
  .stripe-bg {
    background-image: repeating-linear-gradient(
      115deg,
      transparent 0px,
      transparent 38px,
      rgba(255,61,46,0.06) 38px,
      rgba(255,61,46,0.06) 40px
    );
  }
  .card-hover { transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease; }
  .card-hover:hover { transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgba(255,61,46,0.25); border-color: #FF3D2E; }
  .jersey-num {
    font-family: 'Oswald', sans-serif;
    -webkit-text-stroke: 1px rgba(245,245,240,0.15);
    color: transparent;
  }
  .clip-diagonal { clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%); }
  @media (prefers-reduced-motion: reduce) {
    .card-hover { transition: none; }
  }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #0B0B0D; }
  ::-webkit-scrollbar-thumb { background: #FF3D2E; border-radius: 4px; }
</style>
</head>

<body class="bg-base text-ink font-body antialiased">

<!-- HEADER -->
<header class="sticky top-0 z-50 bg-base/90 backdrop-blur-md border-b border-white/10">
  <div class="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between h-20">
    <a href="#" class="flex items-center gap-2 font-display font-bold text-2xl tracking-wide">
      <i class="fa-solid fa-futbol text-flash"></i>
      Boots<span class="text-flash">Store</span>
    </a>

    <nav class="hidden md:flex items-center gap-8 font-medium text-sm uppercase tracking-wider text-muted">
      <a href="#katalog" class="hover:text-flash transition-colors">Katalog</a>
      <a href="#afzalliklar" class="hover:text-flash transition-colors">Afzalliklar</a>
      <a href="#footer" class="hover:text-flash transition-colors">Aloqa</a>
    </nav>

    <a href="https://t.me/bootsstore_uz" target="_blank" rel="noopener"
       class="hidden md:flex items-center gap-2 bg-flash hover:bg-red-600 transition-colors text-white font-semibold text-sm px-5 py-2.5 rounded-full">
      <i class="fa-brands fa-telegram text-lg"></i> Telegram
    </a>

    <button id="menuBtn" class="md:hidden text-2xl text-ink">
      <i class="fa-solid fa-bars"></i>
    </button>
  </div>

  <!-- Mobile menu -->
  <div id="mobileMenu" class="hidden md:hidden bg-surface border-t border-white/10 px-5 py-4 space-y-4">
    <a href="#katalog" class="block text-sm uppercase tracking-wider text-muted">Katalog</a>
    <a href="#afzalliklar" class="block text-sm uppercase tracking-wider text-muted">Afzalliklar</a>
    <a href="#footer" class="block text-sm uppercase tracking-wider text-muted">Aloqa</a>
    <a href="https://t.me/bootsstore_uz" target="_blank" rel="noopener"
       class="flex items-center justify-center gap-2 bg-flash text-white font-semibold text-sm px-5 py-3 rounded-full">
      <i class="fa-brands fa-telegram text-lg"></i> Telegramda yozish
    </a>
  </div>
</header>

<!-- HERO -->
<section class="relative overflow-hidden stripe-bg">
  <div class="absolute -top-24 -right-24 w-96 h-96 bg-flash/20 rounded-full blur-3xl"></div>
  <div class="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center relative z-10">
    <div>
      <span class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold border border-gold/40 rounded-full px-4 py-1.5 mb-6">
        <i class="fa-solid fa-shield-halved"></i> 100% Original kafolat
      </span>
      <h1 class="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] uppercase mb-6">
        Original va Premium <span class="text-flash">Futbol Butsilari</span> ⚽
      </h1>
      <p class="text-muted text-lg mb-10 max-w-md">
        Nike, Adidas, Puma va boshqa dunyoning yetakchi brendlaridan chinakam sport ruhini his eting. Maydonda tezlik va nazorat — endi siznikida.
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="#katalog" class="bg-flash hover:bg-red-600 transition-colors text-white font-semibold px-8 py-4 rounded-full inline-flex items-center gap-2">
          Katalogga o'tish <i class="fa-solid fa-arrow-right"></i>
        </a>
        <a href="https://t.me/bootsstore_uz" target="_blank" rel="noopener" class="border border-white/20 hover:border-flash transition-colors px-8 py-4 rounded-full inline-flex items-center gap-2 font-semibold">
          <i class="fa-brands fa-telegram"></i> Telegram orqali so'rov
        </a>
      </div>
    </div>
    <div class="relative">
      <div class="absolute inset-0 bg-flash/10 rounded-3xl rotate-3"></div>
      <img src="https://images.unsplash.com/photo-1511886929837-354d827aae26?w=900&q=80"
           alt="Futbol butsilari" class="relative rounded-3xl w-full h-[380px] md:h-[460px] object-cover border border-white/10">
    </div>
  </div>
</section>

<!-- KATALOG -->
<section id="katalog" class="max-w-7xl mx-auto px-5 md:px-8 py-20">
  <div class="mb-12 text-center">
    <span class="text-flash font-display uppercase tracking-widest text-sm">Katalog</span>
    <h2 class="font-display font-bold text-3xl md:text-4xl uppercase mt-2">Eng ommabop butsilar</h2>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

    <!-- Card 1 -->
    <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div class="relative clip-diagonal bg-surface2 h-52 flex items-center justify-center">
        <span class="jersey-num absolute -top-2 right-3 text-6xl font-bold select-none">01</span>
        <img src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500&q=80" alt="Nike Mercurial" class="h-40 object-contain">
      </div>
      <div class="p-5 flex flex-col flex-1">
        <span class="text-xs uppercase tracking-wider text-muted">Nike</span>
        <h3 class="font-display font-semibold text-xl mb-2">Mercurial Superfly</h3>
        <p class="text-flash font-bold text-2xl mb-3">890 000 <span class="text-sm font-normal text-muted">so'm</span></p>
        <p class="text-xs text-muted mb-4">O'lchamlar: 39 – 45</p>
        <a href="https://t.me/bootsstore_uz?text=Salom!%20Nike%20Mercurial%20haqida%20maslahat%20kerak" target="_blank" rel="noopener"
           class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-sm font-semibold text-center px-4 py-3 rounded-full inline-flex items-center justify-center gap-2">
          <i class="fa-brands fa-telegram"></i> Telegram'da buyurtma
        </a>
      </div>
    </div>

    <!-- Card 2 -->
    <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div class="relative clip-diagonal bg-surface2 h-52 flex items-center justify-center">
        <span class="jersey-num absolute -top-2 right-3 text-6xl font-bold select-none">02</span>
        <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80" alt="Adidas Predator" class="h-40 object-contain">
      </div>
      <div class="p-5 flex flex-col flex-1">
        <span class="text-xs uppercase tracking-wider text-muted">Adidas</span>
        <h3 class="font-display font-semibold text-xl mb-2">Predator Elite</h3>
        <p class="text-flash font-bold text-2xl mb-3">820 000 <span class="text-sm font-normal text-muted">so'm</span></p>
        <p class="text-xs text-muted mb-4">O'lchamlar: 39 – 45</p>
        <a href="https://t.me/bootsstore_uz?text=Salom!%20Adidas%20Predator%20haqida%20maslahat%20kerak" target="_blank" rel="noopener"
           class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-sm font-semibold text-center px-4 py-3 rounded-full inline-flex items-center justify-center gap-2">
          <i class="fa-brands fa-telegram"></i> Telegram'da buyurtma
        </a>
      </div>
    </div>

    <!-- Card 3 -->
    <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div class="relative clip-diagonal bg-surface2 h-52 flex items-center justify-center">
        <span class="jersey-num absolute -top-2 right-3 text-6xl font-bold select-none">03</span>
        <img src="https://images.unsplash.com/photo-1519861531473-9200262188bf?w=500&q=80" alt="Puma Future" class="h-40 object-contain">
      </div>
      <div class="p-5 flex flex-col flex-1">
        <span class="text-xs uppercase tracking-wider text-muted">Puma</span>
        <h3 class="font-display font-semibold text-xl mb-2">Future Ultimate</h3>
        <p class="text-flash font-bold text-2xl mb-3">760 000 <span class="text-sm font-normal text-muted">so'm</span></p>
        <p class="text-xs text-muted mb-4">O'lchamlar: 39 – 45</p>
        <a href="https://t.me/bootsstore_uz?text=Salom!%20Puma%20Future%20haqida%20maslahat%20kerak" target="_blank" rel="noopener"
           class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-sm font-semibold text-center px-4 py-3 rounded-full inline-flex items-center justify-center gap-2">
          <i class="fa-brands fa-telegram"></i> Telegram'da buyurtma
        </a>
      </div>
    </div>

    <!-- Card 4 -->
    <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div class="relative clip-diagonal bg-surface2 h-52 flex items-center justify-center">
        <span class="jersey-num absolute -top-2 right-3 text-6xl font-bold select-none">04</span>
        <img src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=80" alt="Phantom GX" class="h-40 object-contain">
      </div>
      <div class="p-5 flex flex-col flex-1">
        <span class="text-xs uppercase tracking-wider text-muted">Nike</span>
        <h3 class="font-display font-semibold text-xl mb-2">Phantom GX</h3>
        <p class="text-flash font-bold text-2xl mb-3">910 000 <span class="text-sm font-normal text-muted">so'm</span></p>
        <p class="text-xs text-muted mb-4">O'lchamlar: 39 – 45</p>
        <a href="https://t.me/bootsstore_uz?text=Salom!%20Phantom%20GX%20haqida%20maslahat%20kerak" target="_blank" rel="noopener"
           class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-sm font-semibold text-center px-4 py-3 rounded-full inline-flex items-center justify-center gap-2">
          <i class="fa-brands fa-telegram"></i> Telegram'da buyurtma
        </a>
      </div>
    </div>

  </div>
</section>

<!-- AFZALLIKLAR -->
<section id="afzalliklar" class="bg-surface border-y border-white/10">
  <div class="max-w-7xl mx-auto px-5 md:px-8 py-20">
    <div class="mb-12 text-center">
      <span class="text-flash font-display uppercase tracking-widest text-sm">Nega aynan biz</span>
      <h2 class="font-display font-bold text-3xl md:text-4xl uppercase mt-2">Afzalliklarimiz</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center px-4">
        <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-flash/15 flex items-center justify-center text-flash text-2xl">
          <i class="fa-solid fa-truck-fast"></i>
        </div>
        <h3 class="font-display font-semibold text-lg mb-2 uppercase">Qulay yetkazib berish</h3>
        <p class="text-muted text-sm">O'zbekiston bo'ylab tez va ishonchli yetkazib berish xizmati, uyingizgacha yetib boradi.</p>
      </div>
      <div class="text-center px-4">
        <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-flash/15 flex items-center justify-center text-flash text-2xl">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <h3 class="font-display font-semibold text-lg mb-2 uppercase">100% Original kafolat</h3>
        <p class="text-muted text-sm">Barcha mahsulotlarimiz rasmiy distribyutorlardan olib kelinadi va originalligi kafolatlanadi.</p>
      </div>
      <div class="text-center px-4">
        <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-flash/15 flex items-center justify-center text-flash text-2xl">
          <i class="fa-solid fa-tags"></i>
        </div>
        <h3 class="font-display font-semibold text-lg mb-2 uppercase">Hamyonbop narxlar</h3>
        <p class="text-muted text-sm">Bozordagi eng maqbul narxlar va doimiy chegirmalar sport ixlosmandlari uchun.</p>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer id="footer" class="bg-base">
  <div class="max-w-7xl mx-auto px-5 md:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
    <div>
      <div class="flex items-center gap-2 font-display font-bold text-2xl mb-4">
        <i class="fa-solid fa-futbol text-flash"></i> Boots<span class="text-flash">Store</span>
      </div>
      <p class="text-muted text-sm">O'zbekistondagi original futbol butsilari bo'yicha ishonchli manzilingiz.</p>
    </div>
    <div>
      <h4 class="font-display font-semibold uppercase mb-4 text-sm tracking-wider">Aloqa</h4>
      <ul class="space-y-3 text-sm text-muted">
        <li class="flex items-center gap-2"><i class="fa-solid fa-phone text-flash"></i> +998 90 123 45 67</li>
        <li class="flex items-center gap-2"><i class="fa-solid fa-location-dot text-flash"></i> Toshkent shahri, O'zbekiston</li>
        <li class="flex items-center gap-2"><i class="fa-solid fa-clock text-flash"></i> Har kuni 09:00 – 21:00</li>
      </ul>
    </div>
    <div>
      <h4 class="font-display font-semibold uppercase mb-4 text-sm tracking-wider">Ijtimoiy tarmoqlar</h4>
      <div class="flex gap-3">
        <a href="https://t.me/bootsstore_uz" target="_blank" rel="noopener" class="w-11 h-11 rounded-full bg-surface2 hover:bg-flash transition-colors flex items-center justify-center"><i class="fa-brands fa-telegram"></i></a>
        <a href="#" class="w-11 h-11 rounded-full bg-surface2 hover:bg-flash transition-colors flex items-center justify-center"><i class="fa-brands fa-instagram"></i></a>
        <a href="#" class="w-11 h-11 rounded-full bg-surface2 hover:bg-flash transition-colors flex items-center justify-center"><i class="fa-brands fa-facebook"></i></a>
        <a href="#" class="w-11 h-11 rounded-full bg-surface2 hover:bg-flash transition-colors flex items-center justify-center"><i class="fa-brands fa-tiktok"></i></a>
      </div>
    </div>
  </div>
  <div class="border-t border-white/10 py-6 text-center text-xs text-muted">
    &copy; ${new Date().getFullYear()} BootsStore. Barcha huquqlar himoyalangan.
  </div>
</footer>

<script>
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
</script>

</body>
</html>`);
});

app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
