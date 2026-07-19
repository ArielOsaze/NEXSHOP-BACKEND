const supabase = require("../config/db");

// Publik — dipanggil dari halaman toko buat nampilin carousel
exports.getSlides = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("promo_slides")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Database Error" });
        }

        res.json(data || []);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin only — semua slide termasuk yang nonaktif, buat ditampilin di dashboard
exports.getAllSlidesAdmin = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Akses ditolak, khusus admin" });
    }

    try {
        const { data, error } = await supabase
            .from("promo_slides")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Database Error" });
        }

        res.json(data || []);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createSlide = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Akses ditolak, khusus admin" });
    }

    const { type, badge_text, title, description, cta_text, cta_link, image_url, is_active, sort_order } = req.body;

    if (!title) {
        return res.status(400).json({ message: "Judul wajib diisi" });
    }

    try {
        const { data, error } = await supabase
            .from("promo_slides")
            .insert([{
                type: type || "promo",
                badge_text, title, description, cta_text, cta_link, image_url,
                is_active: is_active !== undefined ? is_active : true,
                sort_order: sort_order || 0
            }])
            .select();

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Gagal membuat slide" });
        }

        res.status(201).json({ message: "Slide berhasil dibuat", data: data[0] });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateSlide = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Akses ditolak, khusus admin" });
    }

    const { id } = req.params;
    const { type, badge_text, title, description, cta_text, cta_link, image_url, is_active, sort_order } = req.body;

    try {
        const { data, error } = await supabase
            .from("promo_slides")
            .update({ type, badge_text, title, description, cta_text, cta_link, image_url, is_active, sort_order })
            .eq("id", id)
            .select();

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Gagal update slide" });
        }

        if (!data.length) {
            return res.status(404).json({ message: "Slide tidak ditemukan" });
        }

        res.json({ message: "Slide berhasil diperbarui", data: data[0] });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteSlide = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Akses ditolak, khusus admin" });
    }

    const { id } = req.params;

    try {
        const { error } = await supabase
            .from("promo_slides")
            .delete()
            .eq("id", id);

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Gagal menghapus slide" });
        }

        res.json({ message: "Slide berhasil dihapus" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};
