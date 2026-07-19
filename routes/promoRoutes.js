const express = require("express");
const router = express.Router();
const promoController = require("../controllers/promoController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", promoController.getSlides);                          // publik, buat carousel di toko
router.get("/all", authMiddleware, promoController.getAllSlidesAdmin); // admin, termasuk yg nonaktif
router.post("/", authMiddleware, promoController.createSlide);
router.put("/:id", authMiddleware, promoController.updateSlide);
router.delete("/:id", authMiddleware, promoController.deleteSlide);

module.exports = router;
