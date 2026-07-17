const supabase = require("../config/db");

async function uploadImage(req, res) {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "File tidak ditemukan"
            });
        }

       const ext = req.file.originalname.split(".").pop();

const fileName =
    Date.now() +
    "-" +
    Math.random().toString(36).substring(2, 8) +
    "." +
    ext;

        const { error } = await supabase.storage
            .from("products")
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) throw error;

        const { data } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);

        res.json({
            url: data.publicUrl
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: err.message
        });

    }

}

module.exports = {
    uploadImage
};