const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="uz" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flash Boots — Professional Futbol Butsilari</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            flash: '#DC2626',
            surface: '#111827',
            surface2: '#1F2937',
            muted: '#9CA3AF'
          },
          fontFamily: {
            display: ['Montserrat', 'sans-serif'],
            body: ['Inter', 'sans-serif']
          }
        }
      }
    }
  </script>
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">

  <style>
    body { font-family: 'Inter', sans-serif; }
    h1, h2, h3, .font-display { font-family: 'Montserrat', sans-serif; }
    .card-hover {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-hover:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 25px -5px rgba(220, 38, 38, 0.25), 0 8px 10px -6px rgba(220, 38, 38, 0.2);
    }
    .jersey-num {
      -webkit-text-stroke: 1px rgba(0, 0, 0, 0.15);
      color: transparent;
    }
  </style>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen flex flex-col antialiased">

  <!-- HEADER / NAVBAR -->
  <header class="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      
      <!-- Logo -->
      <a href="#" class="flex items-center gap-3 group">
        <div class="w-10 h-10 bg-flash rounded-xl flex items-center justify-center font-black text-xl italic tracking-tighter transform -skew-x-12 group-hover:scale-105 transition-transform text-white">
          FB
        </div>
        <div class="flex flex-col">
          <span class="font-display font-black text-xl tracking-wider uppercase leading-none">FLASH<span class="text-flash">BOOTS</span></span>
          <span class="text-[10px] text-muted tracking-widest uppercase font-semibold">Pro Sport Store</span>
        </div>
      </a>

      <!-- Telegram Button -->
      <a href="https://t.me/Moysinjonvv" target="_blank" rel="noopener" 
         class="bg-flash hover:bg-red-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-flash/30 hover:shadow-flash/50">
        <i class="fa-brands fa-telegram text-lg"></i>
        <span>Aloqa</span>
      </a>

    </div>
  </header>

  <!-- HERO SECTION -->
  <section class="relative py-16 overflow-hidden bg-gradient-to-b from-surface2/50 to-transparent border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <span class="text-flash font-bold text-xs uppercase tracking-widest bg-flash/10 border border-flash/20 px-4 py-1.5 rounded-full inline-block mb-4">
        Original & Premium Sifat
      </span>
      <h1 class="text-4xl sm:text-6xl font-black uppercase tracking-tight mb-4">
        Maydonda <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Ustunlik</span> Qiling
      </h1>
      <p class="text-muted max-w-2xl mx-auto text-sm sm:text-base mb-8">
        Jahon yulduzlari tanlaydigan eng so'nggi va zamonaviy futbol butsilari hamda futzalka modellari. Cheklangan miqdorda va kafolatlangan sifat bilan.
      </p>
    </div>
  </section>

  <!-- CATALOG SECTION -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
    
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-black uppercase tracking-wide">Katalog</h2>
        <p class="text-xs text-muted">Barcha turdagi maydonlar uchun butsilar</p>
      </div>
      <span class="text-xs text-muted bg-surface2 px-3 py-1.5 rounded-lg border border-white/5">8 ta model</span>
    </div>

    <!-- CARDS GRID -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

      <!-- Card 1: Nike Mercurial Superfly 9 -->
      <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col p-2">
        <div class="relative bg-white rounded-xl h-52 flex items-center justify-center p-3 overflow-hidden">
          <span class="jersey-num absolute top-1 right-3 text-5xl font-black select-none opacity-20">01</span>
          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" 
               alt="Nike Mercurial Superfly 9" 
               class="h-40 w-full object-contain hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-4 flex flex-col flex-1">
          <span class="text-[11px] uppercase font-bold text-flash mb-1">Maysa uchun (FG)</span>
          <h3 class="font-display font-bold text-lg mb-1 text-white">Nike Mercurial Superfly 9</h3>
          <p class="text-xs text-muted mb-3 line-clamp-2">Zoom Air amortizatsiyasi, yengil korpus va tezlik uchun maxsus taglik</p>
          <p class="text-flash font-extrabold text-2xl mb-3">980 000 <span class="text-xs font-normal text-muted">so'm</span></p>
          <p class="text-xs text-muted mb-4">O'lchamlar: 39 – 45</p>
          <a href="https://t.me/Moysinjonvv?text=Salom!%20Nike%20Mercurial%20Superfly%209%20haqida%20malumot%20bering" target="_blank" rel="noopener"
             class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-xs font-bold text-center px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2">
            <i class="fa-brands fa-telegram text-sm"></i> Telegram'da buyurtma
          </a>
        </div>
      </div>

      <!-- Card 2: Adidas Predator Elite Laceless -->
      <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col p-2">
        <div class="relative bg-white rounded-xl h-52 flex items-center justify-center p-3 overflow-hidden">
          <span class="jersey-num absolute top-1 right-3 text-5xl font-black select-none opacity-20">02</span>
          <img src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80" 
               alt="Adidas Predator Elite" 
               class="h-40 w-full object-contain hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-4 flex flex-col flex-1">
          <span class="text-[11px] uppercase font-bold text-flash mb-1">Maysa uchun (FG)</span>
          <h3 class="font-display font-bold text-lg mb-1 text-white">Adidas Predator Elite</h3>
          <p class="text-xs text-muted mb-3 line-clamp-2">Strikeskin rezina elementlari va maksimal koptok nazorati</p>
          <p class="text-flash font-extrabold text-2xl mb-3">1 050 000 <span class="text-xs font-normal text-muted">so'm</span></p>
          <p class="text-xs text-muted mb-4">O'lchamlar: 40 – 44</p>
          <a href="https://t.me/Moysinjonvv?text=Salom!%20Adidas%20Predator%20Elite%20haqida%20malumot%20bering" target="_blank" rel="noopener"
             class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-xs font-bold text-center px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2">
            <i class="fa-brands fa-telegram text-sm"></i> Telegram'da buyurtma
          </a>
        </div>
      </div>

      <!-- Card 3: Puma Future Ultimate TF -->
      <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col p-2">
        <div class="relative bg-white rounded-xl h-52 flex items-center justify-center p-3 overflow-hidden">
          <span class="jersey-num absolute top-1 right-3 text-5xl font-black select-none opacity-20">03</span>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF9x2bZSE9_YRfiOFCv6wxgnb4fQVxydDnBDNFt7uRfQ&s=10" 
               alt="Puma Future Ultimate TF" 
               class="h-40 w-full object-contain hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-4 flex flex-col flex-1">
          <span class="text-[11px] uppercase font-bold text-flash mb-1">Shtik / Sun'iy maydon (TF)</span>
          <h3 class="font-display font-bold text-lg mb-1 text-white">Puma Future Ultimate TF</h3>
          <p class="text-xs text-muted mb-3 line-clamp-2">PWRTAPE ushlab turuvchi tasmali yengil va elastik korpus</p>
          <p class="text-flash font-extrabold text-2xl mb-3">890 000 <span class="text-xs font-normal text-muted">so'm</span></p>
          <p class="text-xs text-muted mb-4">O'lchamlar: 38 – 43</p>
          <a href="https://t.me/Moysinjonvv?text=Salom!%20Puma%20Future%20Ultimate%20TF%20haqida%20malumot%20bering" target="_blank" rel="noopener"
             class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-xs font-bold text-center px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2">
            <i class="fa-brands fa-telegram text-sm"></i> Telegram'da buyurtma
          </a>
        </div>
      </div>

      <!-- Card 4: Nike Phantom GX II Elite -->
      <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col p-2">
        <div class="relative bg-white rounded-xl h-52 flex items-center justify-center p-3 overflow-hidden">
          <span class="jersey-num absolute top-1 right-3 text-5xl font-black select-none opacity-20">04</span>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMA_poDoKoJoDm9bMuMaCJwbQA8O0_Cd02aWvH91I2pQ&s=10" 
               alt="Nike Phantom GX II Elite" 
               class="h-40 w-full object-contain hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-4 flex flex-col flex-1">
          <span class="text-[11px] uppercase font-bold text-flash mb-1">Maysa uchun (FG)</span>
          <h3 class="font-display font-bold text-lg mb-1 text-white">Nike Phantom GX II Elite</h3>
          <p class="text-xs text-muted mb-3 line-clamp-2">Gripknit ustki qoplamasi va aniq zarbalar uchun mukammal moslik</p>
          <p class="text-flash font-extrabold text-2xl mb-3">1 120 000 <span class="text-xs font-normal text-muted">so'm</span></p>
          <p class="text-xs text-muted mb-4">O'lchamlar: 39 – 44</p>
          <a href="https://t.me/Moysinjonvv?text=Salom!%20Nike%20Phantom%20GX%20II%20Elite%20haqida%20malumot%20bering" target="_blank" rel="noopener"
             class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-xs font-bold text-center px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2">
            <i class="fa-brands fa-telegram text-sm"></i> Telegram'da buyurtma
          </a>
        </div>
      </div>

      <!-- Card 5: Nike Tiempo Legend 10 -->
      <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col p-2">
        <div class="relative bg-white rounded-xl h-52 flex items-center justify-center p-3 overflow-hidden">
          <span class="jersey-num absolute top-1 right-3 text-5xl font-black select-none opacity-20">05</span>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVwSgWQugxbeMe0VkQ75YORqbikdTxNB4u2dls0WRc5Q&s=10" 
               alt="Nike Tiempo Legend 10" 
               class="h-40 w-full object-contain hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-4 flex flex-col flex-1">
          <span class="text-[11px] uppercase font-bold text-flash mb-1">Maysa uchun (FG)</span>
          <h3 class="font-display font-bold text-lg mb-1 text-white">Nike Tiempo Legend 10</h3>
          <p class="text-xs text-muted mb-3 line-clamp-2">FlyTouch Pro yumshoq sun'iy teri va klassik qulaylik</p>
          <p class="text-flash font-extrabold text-2xl mb-3">920 000 <span class="text-xs font-normal text-muted">so'm</span></p>
          <p class="text-xs text-muted mb-4">O'lchamlar: 40 – 45</p>
          <a href="https://t.me/Moysinjonvv?text=Salom!%20Nike%20Tiempo%20Legend%2010%20haqida%20malumot%20bering" target="_blank" rel="noopener"
             class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-xs font-bold text-center px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2">
            <i class="fa-brands fa-telegram text-sm"></i> Telegram'da buyurtma
          </a>
        </div>
      </div>

      <!-- Card 6: Adidas X Crazyfast.1 -->
      <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col p-2">
        <div class="relative bg-white rounded-xl h-52 flex items-center justify-center p-3 overflow-hidden">
          <span class="jersey-num absolute top-1 right-3 text-5xl font-black select-none opacity-20">06</span>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF7WM4mC8ZUDidojtfh47n0BZmHUJHP5CSw1QaDRmDqQ&s=10" 
               alt="Adidas X Crazyfast.1" 
               class="h-40 w-full object-contain hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-4 flex flex-col flex-1">
          <span class="text-[11px] uppercase font-bold text-flash mb-1">Maysa uchun (FG)</span>
          <h3 class="font-display font-bold text-lg mb-1 text-white">Adidas X Crazyfast.1</h3>
          <p class="text-xs text-muted mb-3 line-clamp-2">Aeropacity Speedskin ultrafoydali yengil korpus va sprint taglik</p>
          <p class="text-flash font-extrabold text-2xl mb-3">990 000 <span class="text-xs font-normal text-muted">so'm</span></p>
          <p class="text-xs text-muted mb-4">O'lchamlar: 39 – 43</p>
          <a href="https://t.me/Moysinjonvv?text=Salom!%20Adidas%20X%20Crazyfast.1%20haqida%20malumot%20bering" target="_blank" rel="noopener"
             class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-xs font-bold text-center px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2">
            <i class="fa-brands fa-telegram text-sm"></i> Telegram'da buyurtma
          </a>
        </div>
      </div>

      <!-- Card 7: Mizuno Morelia Neo IN -->
      <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col p-2">
        <div class="relative bg-white rounded-xl h-52 flex items-center justify-center p-3 overflow-hidden">
          <span class="jersey-num absolute top-1 right-3 text-5xl font-black select-none opacity-20">07</span>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSId7R86_Dnsej71H0-LVU1AyGNDgcvtj7sNovJSaGH_Q&s=10" 
               alt="Mizuno Morelia Neo IN" 
               class="h-40 w-full object-contain hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-4 flex flex-col flex-1">
          <span class="text-[11px] uppercase font-bold text-flash mb-1">Zal uchun (IN / IC)</span>
          <h3 class="font-display font-bold text-lg mb-1 text-white">Mizuno Morelia Neo IN</h3>
          <p class="text-xs text-muted mb-3 line-clamp-2">Yapon sifati, keng oyoqlar uchun ideal va sirpanmaydigan taglik</p>
          <p class="text-flash font-extrabold text-2xl mb-3">850 000 <span class="text-xs font-normal text-muted">so'm</span></p>
          <p class="text-xs text-muted mb-4">O'lchamlar: 38 – 44</p>
          <a href="https://t.me/Moysinjonvv?text=Salom!%20Mizuno%20Morelia%20Neo%20IN%20haqida%20malumot%20bering" target="_blank" rel="noopener"
             class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-xs font-bold text-center px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2">
            <i class="fa-brands fa-telegram text-sm"></i> Telegram'da buyurtma
          </a>
        </div>
      </div>

      <!-- Card 8: Puma King Match FG -->
      <div class="card-hover bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col p-2">
        <div class="relative bg-white rounded-xl h-52 flex items-center justify-center p-3 overflow-hidden">
          <span class="jersey-num absolute top-1 right-3 text-5xl font-black select-none opacity-20">08</span>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0NvdbBFH2j71T54OaiwFUURv7PoTsmDJD2TvReUcrA&s=10" 
               alt="Puma King Match FG" 
               class="h-40 w-full object-contain hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-4 flex flex-col flex-1">
          <span class="text-[11px] uppercase font-bold text-flash mb-1">Maysa uchun (FG)</span>
          <h3 class="font-display font-bold text-lg mb-1 text-white">Puma King Match FG</h3>
          <p class="text-xs text-muted mb-3 line-clamp-2">K-Better materiali, yengil konstruksiya va klassik nazorat</p>
          <p class="text-flash font-extrabold text-2xl mb-3">870 000 <span class="text-xs font-normal text-muted">so'm</span></p>
          <p class="text-xs text-muted mb-4">O'lchamlar: 39 – 44</p>
          <a href="https://t.me/Moysinjonvv?text=Salom!%20Puma%20King%20Match%20FG%20haqida%20malumot%20bering" target="_blank" rel="noopener"
             class="mt-auto bg-flash hover:bg-red-600 transition-colors text-white text-xs font-bold text-center px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2">
            <i class="fa-brands fa-telegram text-sm"></i> Telegram'da buyurtma
          </a>
        </div>
      </div>

    </div>
  </main>

  <!-- FOOTER -->
  <footer class="bg-surface border-t border-white/10 py-8 mt-12">
    <div class="max-w-7xl mx-auto px-4 text-center text-xs text-muted">
      <p class="mb-2">© 2026 Flash Boots Store. Barcha huquqlar himoyalangan.</p>
      <p>O'zbekiston bo'ylab yetkazib berish xizmati mavjud.</p>
    </div>
  </footer>

</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server ishga tushdi: http://localhost:${PORT}`);
});
