import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Manual proxy route to avoid http-proxy-middleware issues
app.get('/api/flipp', async (req, res) => {
  try {
    const url = new URL('https://backflipp.wishabi.com/flipp/items/search');
    for (const [key, value] of Object.entries(req.query)) {
      url.searchParams.append(key, value);
    }
    
    // We use native fetch (available in Node 18+)
    const fetchRes = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    if (!fetchRes.ok) {
      throw new Error(`Upstream responded with status ${fetchRes.status}`);
    }
    
    const data = await fetchRes.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Failed to fetch from upstream API', details: err.message });
  }
});

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});