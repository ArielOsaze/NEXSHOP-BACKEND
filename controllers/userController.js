const supabase = require("../config/db");

// ===========================
// GET SEMUA USER (untuk admin dashboard)
// select("*") lalu di-map manual: ini SENGAJA supaya kolom password
// (walau sudah di-hash bcrypt) tidak pernah ikut terkirim ke frontend,
// apapun kolom yang ada di tabel `users`.
// ===========================
exports.getUsers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Database Error" });
        }

        const users = data.map(u => ({
            id: u.id,
            name: u.fullname,        // kolom di DB namanya fullname, di-alias jadi "name"
            email: u.email,
            role: u.role || "user",
            created_at: u.created_at || null
        }));

        res.json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};
