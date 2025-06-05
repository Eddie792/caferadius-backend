const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'CafeRadius Backend läuft!' });
});

// Get cafes
app.get('/api/cafes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*');
    
    if (error) throw error;
    
    res.json({ cafes: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create voucher
app.post('/api/vouchers/create', async (req, res) => {
  try {
    const { cafe_id, device_id } = req.body;
    
    // Generate voucher code
    const code = 'CAFE' + Math.random().toString(36).substr(2, 4).toUpperCase();
    const valid_until = new Date();
    valid_until.setHours(valid_until.getHours() + 24);
    
    const { data, error } = await supabase
      .from('vouchers')
      .insert([{
        code,
        cafe_id,
        device_id,
        valid_until
      }])
      .select();
    
    if (error) throw error;
    
    res.json({ voucher: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify voucher
app.get('/api/vouchers/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const { data, error } = await supabase
      .from('vouchers')
      .select('*, cafes(*)')
      .eq('code', code)
      .single();
    
    if (error) throw error;
    
    res.json({ voucher: data });
  } catch (error) {
    res.status(404).json({ error: 'Voucher nicht gefunden' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
