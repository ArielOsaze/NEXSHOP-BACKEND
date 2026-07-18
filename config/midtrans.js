const midtransClient = require("midtrans-client");
require("dotenv").config();

if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
    console.log("❌ MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY belum diisi di .env");
}

// isProduction: false = Sandbox (testing), true = Production (transaksi asli)
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

module.exports = snap;
