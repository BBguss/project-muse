/**
 * mailService.js
 * 
 * Service ini menangani koneksi SMTP menggunakan 'nodemailer'.
 * Service ini membaca variabel environment gaya Laravel (MAIL_HOST, dll).
 * 
 * Install dependencies: npm install nodemailer dotenv
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// 1. Konfigurasi Transporter (Tukang Pos)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_PORT == 465, // true untuk 465, false untuk port lain (587)
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Fungsi untuk mengirim Email OTP
 * @param {string} toEmail - Alamat email penerima
 * @param {string} otpCode - Kode 6 digit
 */
const sendOTPEmail = async (toEmail, otpCode) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: toEmail,
      subject: 'Kode Verifikasi Masuk MUSE',
      // Versi Text (untuk klien email jadul)
      text: `Kode verifikasi Anda adalah: ${otpCode}. Jangan berikan kode ini kepada siapapun.`,
      // Versi HTML (Modern)
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">MUSE Roleplay</h2>
          <p>Halo,</p>
          <p>Kami menerima permintaan masuk menggunakan alamat email ini.</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otpCode}</span>
          </div>
          <p>Kode ini akan kedaluwarsa dalam 5 menit.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>
        </div>
      `,
    });

    console.log("Email terkirim: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Gagal mengirim email:", error);
    return false;
  }
};

module.exports = { sendOTPEmail };