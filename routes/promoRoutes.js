const express = require("express");
const router = express.Router();
const promoController = require("../controllers/promoController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", promoController.getPromo);
router.put("/", authMiddleware, promoController.updatePromo);

module.exports = router;
