/********************************************************************
 * CafeRadius Backend – express + supabase-js v2
 * Fix für Render-Container ohne IPv6:
 *   – IPv4 bevorzugen (DNS & HTTPS-Agent)
 *   – Supabase-SDK mit node-fetch-Polyfill betreiben
 *******************************************************************/

// ---------- IPv4 erzwingen ----------------------------------------
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');        // AAAA überspringen

const https = require('https');
https.globalAgent.options.family = 4;          // nur IPv4 sockets

// ---------- Fetch-Polyfill (node-fetch) ---------------------------
const fetch = (...args) =>
  import('node-fetch').then(m => m.default(...args)); // ESM import hack

// ---------- Bibliotheken / Initialisierung ------------------------
const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// ---------- Middleware --------------------------------------------
app.use(cors());
app.use(express.json());

// ---------- Supabase-Client ---------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { global: { fetch } }                       // <-- wichtig!
);

// ---------- Endpunkte ---------------------------------------------

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Kurzer Funktionstest
app.get('/api/test', (_req, res) => {
  res.json({ message: 'CafeRadius Backend läuft!' });
});

// Debug Info (zeigt, ob ENV-Variablen gesetzt sind)
app.get('/api/debug', (_req, res) => {
  res.json({
    message: 'Debug Info',
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_KEY,
    nodeEnv: process.env.NODE_ENV
  });
});

// Alle Cafés abrufen
app.get('/api/cafes', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('cafes').select('*');
    if (error) throw error;
    res.json({ cafes: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Voucher anlegen
app.post('/api/vouchers/create', async (req, res) => {
  try {
    const { cafe_id, device_id } = req.body;

    // Zufälligen Code erzeugen
    const code = 'CAFE' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const valid_until = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 h

    const { data, error } = await supabase
      .from('vouchers')
      .insert([{ code, cafe_id, device_id, valid_until }])
      .select();
    if (error) throw error;

    res.json({ voucher: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Voucher prüfen
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
  } catch {
    res.status(404).json({ error: 'Voucher nicht gefunden' });
  }
});

// ---------- Server starten ----------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
