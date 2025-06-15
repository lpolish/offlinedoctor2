const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:1420', 'http://localhost:5173'],
  credentials: true
}));

// Proxy requests to Ollama
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:11434',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}));

app.listen(PORT, () => {
  console.log(`🔄 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying Ollama API from http://localhost:11434`);
});
