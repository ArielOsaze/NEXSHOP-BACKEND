const supabase = require("../config/db");
const { getSnapClient } = require("../config/midtrans");

exports.create = async (req, res) => {
    const { recipient_name, recipient_email, items } = req.body;
    // req.user bisa null (guest checkout) berkat optionalAuthMiddleware
    const userId = req.user ? req.user.id : null;

    if (!recipient_name || !recipient_email || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Data pesanan tidak lengkap" });
    }

    try {
        // Ambil harga produk langsung dari database kita sendiri — JANGAN percaya
        // `total`/harga yang dikirim dari frontend, karena itu bisa dimanipulasi
        // di browser. Ini juga wajib secara teknis: Midtrans akan menolak
        // transaksi kalau gross_amount tidak sama dengan total item_details.
        const ids = items.map((i) => i.id);
        const { data: products, error: prodErr } = await supabase
            .from("products")
            .select("id, name, price")
            .in("id", ids);

        if (prodErr) {
            console.log(prodErr);
            return res.status(500).json({ message: "Gagal mengambil data produk" });
        }

        let item_details;
        try {
            item_details = items.map((item) => {
                const p = products.find((x) => x.id === item.id);
                if (!p) throw new Error(`Produk id ${item.id} tidak ditemukan`);
                if (!item.qty || item.qty <= 0) throw new Error(`Jumlah produk tidak valid`);
                return {
                    id: String(p.id),
                    name: p.name.slice(0, 50), // Midtrans membatasi max 50 karakter
                    price: p.price,
                    quantity: item.qty
                };
            });
        } catch (e) {
            return res.status(400).json({ message: e.message });
        }

        const total = item_details.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const orderId = "NX" + Date.now();

        // Simpan order dulu dengan status pending, sebelum minta snap_token ke Midtrans
        const { error: insertErr } = await supabase
            .from("orders")
            .insert([{
                id: orderId,
                user_id: userId,
                recipient_name,
                recipient_email,
                payment_method: "midtrans",
                items,
                total,
                status: "pending"
            }]);

        if (insertErr) {
            console.log(insertErr);
            return res.status(500).json({ message: "Gagal membuat pesanan" });
        }

        // Buat transaksi Midtrans, dapetin snap_token buat dibuka di frontend
        let transaction;
        try {
            const snap = await getSnapClient();
            transaction = await snap.createTransaction({
                transaction_details: {
                    order_id: orderId,
                    gross_amount: total
                },
                item_details,
                customer_details: {
                    first_name: recipient_name,
                    email: recipient_email
                }
            });
        } catch (midtransErr) {
            console.log(midtransErr);
            // order sudah kepalang tercatat, tandai gagal biar gak nggantung di "pending"
            await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
            return res.status(500).json({ message: "Gagal membuat transaksi pembayaran" });
        }

        // simpan snap_token, berguna kalau mau di-generate ulang / dicek nanti
        await supabase
            .from("orders")
            .update({ snap_token: transaction.token })
            .eq("id", orderId);

        res.status(201).json({
            message: "Pesanan berhasil dibuat",
            orderId,
            snap_token: transaction.token
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Database Error" });
        }

        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// ===========================
// GET SEMUA PESANAN (untuk admin dashboard)
// select("*") dipakai (bukan enumerasi kolom) supaya tidak error kalau
// skema tabel `orders` kamu belum/tidak punya kolom tertentu (mis. status).
// Nama field di-alias di sini supaya langsung cocok dengan yang dipakai
// dashboard.js di frontend (customerName, date, dst) — tidak perlu ubah
// frontend lagi.
// ===========================
exports.getAllOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Database Error" });
        }

        const orders = data.map(order => ({
            id: order.id,
            customerName: order.recipient_name,
            email: order.recipient_email,
            items: order.items,
            total: order.total,
            status: order.status || "pending", // fallback kalau kolom status belum ada
            paymentMethod: order.payment_method,
            date: order.created_at
        }));

        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// ===========================
// WEBHOOK NOTIFIKASI MIDTRANS
// Dipanggil langsung oleh server Midtrans (bukan dari frontend) tiap kali
// status pembayaran berubah. Ini SUMBER KEBENARAN status order — jangan
// pernah update status order cuma berdasarkan callback di frontend, karena
// itu bisa dipalsukan oleh user. `snap.transaction.notification()` otomatis
// memverifikasi keasliannya ke server Midtrans.
//
// Daftarkan URL endpoint ini (https://domain-kamu/api/orders/notification)
// di Midtrans Dashboard > Settings > Configuration > Payment Notification URL
// ===========================
exports.handleNotification = async (req, res) => {
    try {
        const snap = await getSnapClient();
        const notification = await snap.transaction.notification(req.body);

        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        let status = "pending";

        if (transactionStatus === "capture") {
            status = fraudStatus === "accept" ? "paid" : "challenge";
        } else if (transactionStatus === "settlement") {
            status = "paid";
        } else if (transactionStatus === "pending") {
            status = "pending";
        } else if (["deny", "cancel", "expire", "failure"].includes(transactionStatus)) {
            status = "failed";
        }

        const updatePayload = {
            status,
            payment_type: notification.payment_type,
            transaction_id: notification.transaction_id
        };
        if (status === "paid") {
            updatePayload.paid_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from("orders")
            .update(updatePayload)
            .eq("id", orderId);

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Gagal update status pesanan" });
        }

        // Midtrans expect balasan 200 OK sederhana
        res.status(200).json({ message: "OK" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message || "Server Error" });
    }
};
