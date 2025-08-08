const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: In a real production environment, these should be stored as environment variables,
// not hardcoded in the source file.
const APP_ID = "4c502aed";
const APP_key = "9a3222b9fe5c26bb3bb8f7754ecb0f2d";

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '')));

// API proxy endpoint
app.get('/api/search', async (req, res) => {
    try {
        const { q, diet, next } = req.query;

        let apiUrl = "";
        if (next) {
            // If a 'next' URL is provided for pagination, use it directly.
            // The URL already contains all necessary parameters including app_id and app_key.
            apiUrl = decodeURIComponent(next);
        } else if (q) {
            // For a new search, construct the URL.
            apiUrl = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(q)}&app_id=${APP_ID}&app_key=${APP_key}`;
            if (diet) {
                apiUrl += `&diet=${diet}`;
            }
        } else {
            return res.status(400).json({ error: 'Search query is required.' });
        }

        const apiResponse = await fetch(apiUrl);
        if (!apiResponse.ok) {
            throw new Error(`Edamam API responded with status: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        res.json(data);

    } catch (error) {
        console.error('Proxy server error:', error);
        res.status(500).json({ error: 'Failed to fetch data from Edamam API.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
