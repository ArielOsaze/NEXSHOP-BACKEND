const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, orderController.create);
router.get("/my", authMiddleware, orderController.getMyOrders);
router.get("/", authMiddleware, orderController.getAllOrders); // baru: buat admin dashboard

module.exports = router;
