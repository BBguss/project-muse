/**
 * authController.js
 * 
 * Contoh Logic Controller untuk Express.js
 * Ini menghubungkan request dari Frontend (React) dengan MailService.
 */

const { sendOTPEmail } = require('./mailService');

// Simulasi Database Sederhana (Gunakan Redis/MySQL di production)
const otpDatabase = new Map(); 

// --- 1. LOGIC REQUEST OTP (Langkah 1 & 2 di Frontend) ---
const requestLogin = async (req, res) => {
  const { email, password } = req.body;

  // Validasi Input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  // Validasi @gmail.com (Backend Validation)
  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ message: 'Hanya alamat @gmail.com yang diizinkan' });
  }

  // TODO: Verifikasi password user di Database Anda di sini...
  // const user = await User.findOne({ email });
  // if (!bcrypt.compareSync(password, user.password)) ...

  try {
    // 1. Generate Kode OTP 6 Digit
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Simpan OTP sementara (Set expiry 5 menit)
    // Di production, gunakan Redis: await redis.set(`otp:${email}`, otpCode, 'EX', 300);
    otpDatabase.set(email, {
      code: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 menit
    });

    // 3. Kirim Email
    const emailSent = await sendOTPEmail(email, otpCode);

    if (emailSent) {
      return res.status(200).json({ 
        success: true, 
        message: 'OTP telah dikirim ke email Anda' 
      });
    } else {
      return res.status(500).json({ message: 'Gagal mengirim email OTP' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// --- 2. LOGIC VERIFIKASI OTP (Langkah 3 di Frontend) ---
const verifyOTP = async (req, res) => {
  const { email, otpCode } = req.body;

  const record = otpDatabase.get(email);

  // 1. Cek apakah OTP ada
  if (!record) {
    return res.status(400).json({ message: 'Kode OTP kadaluarsa atau tidak ditemukan' });
  }

  // 2. Cek apakah OTP kadaluarsa
  if (Date.now() > record.expiresAt) {
    otpDatabase.delete(email);
    return res.status(400).json({ message: 'Kode OTP telah kadaluarsa' });
  }

  // 3. Cek kecocokan kode
  if (record.code === otpCode) {
    // BERHASIL! Hapus OTP agar tidak bisa dipakai ulang
    otpDatabase.delete(email);

    // TODO: Generate JWT Token untuk login session
    // const token = jwt.sign({ email }, process.env.JWT_SECRET);

    return res.status(200).json({ 
      success: true, 
      message: 'Login Berhasil',
      // token: token
    });
  } else {
    return res.status(400).json({ message: 'Kode OTP salah' });
  }
};

module.exports = { requestLogin, verifyOTP };