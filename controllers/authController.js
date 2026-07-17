const supabase = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        const { data: existing, error: findErr } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (findErr) {
            console.log(findErr);
            return res.status(500).json({ message: "Database Error" });
        }

        if (existing) {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error: insertErr } = await supabase
            .from("users")
            .insert([{ fullname, email, password: hashedPassword }]);

        if (insertErr) {
            console.log(insertErr);
            return res.status(500).json({ message: "Gagal register" });
        }

        res.status(201).json({ message: "Register berhasil" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// LOGIN
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Database Error" });
        }

        if (!user) {
            return res.status(401).json({ message: "Email atau password salah" });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: "Email atau password salah" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login berhasil",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};
