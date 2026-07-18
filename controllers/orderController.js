const supabase = require("../config/db");

exports.create = async (req, res) => {
    const { recipient_name, recipient_email, payment_method, items, total } = req.body;
    const orderId = "NX" + Date.now();
    const userId = req.user.id; // dari authMiddleware

    try {
        const { error } = await supabase
            .from("orders")
            .insert([{
                id: orderId,
                user_id: userId,
                recipient_name,
                recipient_email,
                payment_method,
                items,
                total
            }]);

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Gagal membuat pesanan" });
        }

        res.status(201).json({ message: "Pesanan berhasil", orderId });
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
