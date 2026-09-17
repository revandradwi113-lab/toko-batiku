// supabaseClient.js
// Client Supabase khusus untuk Storage (upload gambar), pakai service_role key
// karena ini dipanggil dari server (bukan browser).
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // JANGAN pakai anon key di sini
);

module.exports = supabase;