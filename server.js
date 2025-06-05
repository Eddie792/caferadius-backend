// IPv4-DNS-Reihenfolge wird global durch NODE_OPTIONS erzwungen
const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase-Client (nutzt eingebautes fetch von Node 18+)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Health- & Debug-Routes
app.get('/api/health', (_req, res) => res.json({ status: 'OK' }));
app.get('/api/debug', (_req, res) =>
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_KEY
  })
);

// Beispiel-Route
app.get('/api/cafes', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('cafes').select('*');
    if (error) throw error;
    res.json({ cafes: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
