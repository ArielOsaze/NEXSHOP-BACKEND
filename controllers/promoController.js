const supabase = require("../config/db");

// Publik — dipanggil dari halaman toko buat nampilin hero banner
exports.getPromo = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("promo_banner")
            .select("*")
            .eq("id", 1)
            .maybeSingle();

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Database Error" });
        }

        res.json(data || {});
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin only — dipanggil dari admin dashboard buat update isi promo
exports.updatePromo = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Akses ditolak, khusus admin" });
    }

    const { badge_text, title, description, cta_text, cta_link } = req.body;

    try {
        const { data, error } = await supabase
            .from("promo_banner")
            .upsert({
                id: 1,
                badge_text,
                title,
                description,
                cta_text,
                cta_link,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Gagal menyimpan promo" });
        }

        res.json({ message: "Promo berhasil diperbarui", data: data[0] });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};
