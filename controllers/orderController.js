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
