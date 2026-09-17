// config/db.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // pakai service_role di backend
);

// Tes koneksi
supabase
  .from("produk")
  .select("id_produk")
  .limit(1)
  .then(({ error }) => {
    if (error) {
      console.error("Supabase gagal konek:", error.message);
    } else {
      console.log("Supabase connected");
    }
  });

module.exports = supabase;