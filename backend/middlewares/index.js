// Middleware autentikasi, otorisasi role, dan upload gambar
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const supabase = require("../supabaseClient"); // sesuaikan kalau lokasinya beda

// Cek token JWT dari header Authorization: Bearer <token>
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Simpan payload token ({ id, role }) ke req.user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa" });
  }
}

// Batasi akses berdasarkan role, dipanggil setelah authenticate
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    next();
  };
}

// Nama bucket di Supabase Storage. Buat bucket ini dulu di dashboard
// Supabase > Storage > New Bucket, dan set jadi Public.
const BUCKET_NAME = "images";

// Dulu multer nyimpen file ke disk (uploads/images). Sekarang cukup
// ditampung di memory, lalu diteruskan ke Supabase Storage.
const storage = multer.memoryStorage();

// Hanya terima file gambar
function fileFilter(req, file, cb) {
  const validExt = /jpeg|jpg|png|webp/;
  const isValid = validExt.test(path.extname(file.originalname).toLowerCase());
  if (isValid) return cb(null, true);
  cb(new Error("File harus berupa gambar (jpg, jpeg, png, webp)"));
}

// Middleware upload single file dari field "gambar", maks 5MB
// (masih dipakai persis sama seperti sebelumnya di routes)
const middlewareUploadGambar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("gambar");

// Upload buffer file ke Supabase Storage, lalu kirim public URL-nya
// sebagai response JSON (menggantikan path lokal /uploads/images/...)
async function sendHasilUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Gambar tidak ditemukan" });
  }

  try {
    const unik = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(unik, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      return res.status(500).json({ message: "Gagal upload gambar ke storage", error: uploadError.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(unik);

    res.status(200).json({
      message: "Upload berhasil",
      path: publicUrlData.publicUrl, // dulu: `/uploads/images/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal upload gambar", error: err.message });
  }
}

module.exports = { authenticate, requireRole, middlewareUploadGambar, sendHasilUpload };