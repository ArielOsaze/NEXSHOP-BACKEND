const nodemailer = require("nodemailer");
require("dotenv").config();

if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log("❌ EMAIL_USER atau EMAIL_APP_PASSWORD belum diisi di .env");
}

// Pakai Gmail SMTP. EMAIL_APP_PASSWORD itu "App Password" 16-digit dari
// Google Account (BUKAN password akun gmail biasa) — wajib aktifkan
// 2-Step Verification dulu di akun gmail-nya, baru bisa generate App Password
// di: myaccount.google.com > Security > 2-Step Verification > App passwords
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

async function sendOtpEmail(to, otp) {
    await transporter.sendMail({
        from: `"NexShop" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Kode Verifikasi NexShop",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color:#7C3AED;">NexShop</h2>
                <p>Gunakan kode berikut untuk memverifikasi akun kamu:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background: #f2f1f8; padding: 16px; text-align: center; border-radius: 8px;">
                    ${otp}
                </div>
                <p style="color:#666; font-size: 13px; margin-top: 16px;">
                    Kode ini berlaku selama 10 menit. Jangan bagikan kode ini ke siapa pun,
                    termasuk pihak yang mengaku dari NexShop.
                </p>
            </div>
        `
    });
}

module.exports = { sendOtpEmail };
