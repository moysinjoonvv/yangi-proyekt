const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            
            <!-- Google Search Console tasdiqlash kodi -->
            <meta name="google-site-verification" content="osGraURC-Y5MRG12VYCnGuOzZm7wNwN1DwQeYqXpD8A" />

            <!-- Google va qidiruv tizimlari uchun SEO teglari -->
            <title>Original Butsilar Do'koni | Futbol Oyoq Kiyimlari</title>
            <meta name="description" content="Eng sifatli va original futbol butsilarini hamyonbop narxlarda sotib oling.">
            <meta name="keywords" content="butsi, futbol butsisi, original butsi, nike, adidas">
        </head>
        <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h1>Original Butsilar Do'koni ⚽</h1>
            <h2 style="color: #007bff;">Tez orada eng zo'r butsilar joylanadi!</h2>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});
