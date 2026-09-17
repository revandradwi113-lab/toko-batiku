// Model untuk tabel produk (Supabase)
const supabase = require("../config/db");

// Ambil semua produk
async function findAllProduk() {
  const { data, error } = await supabase
    .from("produk")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Ambil satu produk by id_produk
async function findProdukById(id) {
  const { data, error } = await supabase
    .from("produk")
    .select("*")
    .eq("id_produk", id)
    .single();

  if (error) throw error;
  return data;
}

// Tambah produk baru, return id_produk
async function insertProduk(data) {
  const { nama_produk, deskripsi, harga, gambar, kategori } = data;

  const { data: result, error } = await supabase
    .from("produk")
    .insert({
      nama_produk,
      deskripsi,
      harga,
      gambar,
      kategori,
    })
    .select("id_produk")
    .single();

  if (error) throw error;
  return result.id_produk;
}

// Update produk by id_produk, return jumlah baris yang terpengaruh
async function updateProduk(id, data) {
  const { nama_produk, deskripsi, harga, gambar, kategori } = data;

  const { data: result, error } = await supabase
    .from("produk")
    .update({
      nama_produk,
      deskripsi,
      harga,
      gambar,
      kategori,
    })
    .eq("id_produk", id)
    .select();

  if (error) throw error;
  return result.length; // mirip affectedRows
}

// Hapus produk by id_produk
async function deleteProduk(id) {
  const { data, error } = await supabase
    .from("produk")
    .delete()
    .eq("id_produk", id)
    .select();

  if (error) throw error;
  return data.length;
}

// Hitung total produk di katalog
async function countProduk() {
  const { count, error } = await supabase
    .from("produk")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count;
}

module.exports = {
  findAllProduk,
  findProdukById,
  insertProduk,
  updateProduk,
  deleteProduk,
  countProduk,
};