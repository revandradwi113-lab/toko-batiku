// Model untuk tabel pembelian (Supabase)
const supabase = require("../config/db");

// Ambil semua pembelian + detail pembeli & produk (untuk admin)
async function findAllPembelianWithDetail() {
  const { data, error } = await supabase
    .from("pembelian")
    .select(`
      *,
      users:id_pembeli (nama_d, nama_b, email, uname),
      produk:id_produk (nama_produk, harga, gambar)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // rapikan hasil supaya mirip query lama
  return data.map((pb) => ({
    ...pb,
    nama_pembeli: pb.users ? `${pb.users.nama_d} ${pb.users.nama_b}` : null,
    email_pembeli: pb.users?.email || null,
    uname_pembeli: pb.users?.uname || null,
    nama_produk: pb.produk?.nama_produk || null,
    harga: pb.produk?.harga || null,
    gambar_produk: pb.produk?.gambar || null,
  }));
}

// Ambil satu pembelian berdasarkan ID
async function findPembelianById(id) {
  const { data, error } = await supabase
    .from("pembelian")
    .select(`
      *,
      users:id_pembeli (nama_d, nama_b, email, uname),
      produk:id_produk (nama_produk, harga, gambar)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    ...data,
    nama_pembeli: data.users ? `${data.users.nama_d} ${data.users.nama_b}` : null,
    email_pembeli: data.users?.email || null,
    uname_pembeli: data.users?.uname || null,
    nama_produk: data.produk?.nama_produk || null,
    harga: data.produk?.harga || null,
    gambar_produk: data.produk?.gambar || null,
  };
}

// Tambah pembelian baru
async function insertPembelian(data) {
  const {
    id_pembeli,
    id_produk,
    jumlah,
    nama_pembeli,
    alamat_pembeli,
    phone_pembeli,
    metode_pembayaran,
    pengiriman,
    catatan,
  } = data;

  const qty = Math.max(1, parseInt(jumlah, 10) || 1);

  const { data: result, error } = await supabase
    .from("pembelian")
    .insert({
      id_pembeli,
      id_produk,
      jumlah: qty,
      nama_pembeli,
      alamat_pembeli,
      phone_pembeli,
      metode_pembayaran,
      pengiriman,
      catatan,
    })
    .select("id")
    .single();

  if (error) throw error;
  return result.id;
}

// Update pembelian
async function updatePembelian(id, data) {
  const { pembayaran, status, catatan, foto_bukti } = data;

  const { data: result, error } = await supabase
    .from("pembelian")
    .update({
      pembayaran,
      status,
      catatan,
      foto_bukti,
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  return result.length;
}

// Hapus pembelian
async function deletePembelian(id) {
  const { data, error } = await supabase
    .from("pembelian")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;
  return data.length;
}

// Riwayat pembelian milik pembeli
async function findPembelianByPembeliIdWithDetail(idPembeli) {
  const { data, error } = await supabase
    .from("pembelian")
    .select(`
      *,
      produk:id_produk (nama_produk, harga, gambar)
    `)
    .eq("id_pembeli", idPembeli)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((pb) => ({
    ...pb,
    nama_produk: pb.produk?.nama_produk || null,
    harga: pb.produk?.harga || null,
    gambar: pb.produk?.gambar || null,
  }));
}

// Ambil pembelian berdasarkan ID dan ID pembeli
async function findPembelianByIdAndPembeliId(id, idPembeli) {
  const { data, error } = await supabase
    .from("pembelian")
    .select(`
      *,
      produk:id_produk (nama_produk, harga, gambar)
    `)
    .eq("id", id)
    .eq("id_pembeli", idPembeli)
    .single();

  if (error) throw error;

  return {
    ...data,
    nama_produk: data.produk?.nama_produk || null,
    harga: data.produk?.harga || null,
    gambar: data.produk?.gambar || null,
  };
}

// Statistik pembelian milik satu pembeli
async function getStatsByPembeliId(idPembeli) {
  const { data, error } = await supabase
    .from("pembelian")
    .select("status")
    .eq("id_pembeli", idPembeli);

  if (error) throw error;

  const stats = {};
  data.forEach((row) => {
    stats[row.status] = (stats[row.status] || 0) + 1;
  });

  return Object.entries(stats).map(([status, total]) => ({ status, total }));
}

// Statistik pembelian keseluruhan
async function getAdminStats() {
  const { data, error } = await supabase.from("pembelian").select("status");

  if (error) throw error;

  const stats = {};
  data.forEach((row) => {
    stats[row.status] = (stats[row.status] || 0) + 1;
  });

  return Object.entries(stats).map(([status, total]) => ({ status, total }));
}

// Pesanan selesai tetapi belum dibayar
async function countTerjualBelumBayar() {
  const { count, error } = await supabase
    .from("pembelian")
    .select("*", { count: "exact", head: true })
    .eq("status", "Selesai")
    .ilike("pembayaran", "%belum%");

  if (error) throw error;
  return count || 0;
}

// Total semua transaksi
async function countTransaksi() {
  const { count, error } = await supabase
    .from("pembelian")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

// Total produk terjual (status Selesai)
async function countProdukTerjual() {
  const { data, error } = await supabase
    .from("pembelian")
    .select("jumlah")
    .eq("status", "Selesai");

  if (error) throw error;
  return data.reduce((sum, row) => sum + (row.jumlah || 1), 0);
}

// Pesanan yang masih aktif
async function countPesananAktif() {
  const { count, error } = await supabase
    .from("pembelian")
    .select("*", { count: "exact", head: true })
    .neq("status", "Selesai");

  if (error) throw error;
  return count || 0;
}

// Total pendapatan (status Selesai)
async function sumPendapatanDibayar() {
  const { data, error } = await supabase
    .from("pembelian")
    .select(`
      jumlah,
      produk:id_produk (harga)
    `)
    .eq("status", "Selesai");

  if (error) throw error;

  return data.reduce((sum, row) => {
    const harga = row.produk?.harga || 0;
    const qty = row.jumlah || 1;
    return sum + harga * qty;
  }, 0);
}

// Pembelian terbaru
async function getRecentPembelian(limit = 5) {
  const { data, error } = await supabase
    .from("pembelian")
    .select(`
      *,
      users:id_pembeli (nama_d, nama_b),
      produk:id_produk (nama_produk)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((pb) => ({
    ...pb,
    nama_pembeli: pb.users ? `${pb.users.nama_d} ${pb.users.nama_b}` : null,
    nama_produk: pb.produk?.nama_produk || null,
  }));
}

// Pesanan terbaru milik satu pembeli
async function getRecentByPembeliId(idPembeli, limit = 5) {
  const { data, error } = await supabase
    .from("pembelian")
    .select(`
      id, status, pembayaran, created_at,
      produk:id_produk (nama_produk, harga, gambar)
    `)
    .eq("id_pembeli", idPembeli)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((pb) => ({
    ...pb,
    nama_produk: pb.produk?.nama_produk || null,
    harga: pb.produk?.harga || null,
    gambar: pb.produk?.gambar || null,
  }));
}

// Total belanja pembeli yang sudah dibayar
async function sumBelanjaDibayarByPembeli(idPembeli) {
  const { data, error } = await supabase
    .from("pembelian")
    .select(`
      jumlah,
      pembayaran,
      produk:id_produk (harga)
    `)
    .eq("id_pembeli", idPembeli);

  if (error) throw error;

  return data.reduce((sum, row) => {
    const bayar = (row.pembayaran || "").toLowerCase();
    if (bayar.includes("sudah") || bayar.includes("lunas") || bayar.includes("dibayar")) {
      const harga = row.produk?.harga || 0;
      const qty = row.jumlah || 1;
      return sum + harga * qty;
    }
    return sum;
  }, 0);
}

// Jumlah pesanan belum dibayar milik pembeli
async function countBelumBayarByPembeli(idPembeli) {
  const { data, error } = await supabase
    .from("pembelian")
    .select("pembayaran")
    .eq("id_pembeli", idPembeli);

  if (error) throw error;

  return data.filter((row) => {
    const bayar = (row.pembayaran || "").toLowerCase().trim();
    return !bayar || bayar === "belum bayar" || bayar === "belum";
  }).length;
}

// Laporan admin (versi sederhana)
async function getLaporanSummary(fromDate, toDate) {
  let query = supabase
    .from("pembelian")
    .select(`
      *,
      produk:id_produk (id_produk, nama_produk, harga, gambar)
    `);

  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", toDate + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;

  const total_transaksi = data.length;
  let total_pendapatan = 0;
  let pendapatan_dibayar = 0;
  const byStatus = {};
  const produkMap = {};

  data.forEach((pb) => {
    const status = pb.status || "Unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;

    const harga = pb.produk?.harga || 0;
    const qty = pb.jumlah || 1;
    const subtotal = harga * qty;

    if (status.toLowerCase() === "selesai") {
      total_pendapatan += subtotal;
    }

    const bayar = (pb.pembayaran || "").toLowerCase();
    if (bayar.includes("sudah") || bayar.includes("lunas")) {
      pendapatan_dibayar += subtotal;
    }

    if (pb.produk) {
      const key = pb.produk.id_produk;
      if (!produkMap[key]) {
        produkMap[key] = {
          id_produk: key,
          nama_produk: pb.produk.nama_produk,
          harga: pb.produk.harga,
          gambar: pb.produk.gambar,
          terjual: 0,
          omzet: 0,
        };
      }
      produkMap[key].terjual += qty;
      produkMap[key].omzet += subtotal;
    }
  });

  const top_produk = Object.values(produkMap)
    .sort((a, b) => b.terjual - a.terjual)
    .slice(0, 10);

  return {
    total_transaksi,
    total_pendapatan,
    pendapatan_dibayar,
    by_status: Object.entries(byStatus).map(([status, total]) => ({ status, total })),
    top_produk,
    per_bulan: [], // bisa dikembangkan nanti
  };
}

module.exports = {
  findAllPembelianWithDetail,
  findPembelianById,
  updatePembelian,
  deletePembelian,
  insertPembelian,
  findPembelianByPembeliIdWithDetail,
  findPembelianByIdAndPembeliId,
  getStatsByPembeliId,
  getAdminStats,
  getRecentPembelian,
  countTerjualBelumBayar,
  countTransaksi,
  countProdukTerjual,
  countPesananAktif,
  sumPendapatanDibayar,
  getLaporanSummary,
  getRecentByPembeliId,
  sumBelanjaDibayarByPembeli,
  countBelumBayarByPembeli,
};