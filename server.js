const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'CafeRadius Backend läuft!' });
});

// Cafe endpoints (später erweitern)
app.get('/api/cafes', (req, res) => {
  res.json({ 
    message: 'Cafe-Endpunkt bereit',
    cafes: [] 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
