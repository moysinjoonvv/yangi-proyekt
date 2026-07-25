const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h1>Mening birinchi saytim 🚀</h1>
            <h2 style="color: #007bff;">MuhammadAmir aka nma gap</h2>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`Server ishlamoqda: http://localhost:${PORT}`);
});
