const express = require("express");
const router = express.Router();
const { jwtMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");
const { createPromotion, getPromotions, getPromotionById, patchPromotion, deletePromotion } = require("../controllers/promotionController");

router.post("/", jwtMiddleware, requireRole("MANAGER"), createPromotion);
router.get("/", jwtMiddleware, requireRole("REGULAR"), getPromotions);

router.get("/:promotionId", jwtMiddleware, requireRole("REGULAR"), getPromotionById);
router.patch("/:promotionId", jwtMiddleware, requireRole("REGULAR"), patchPromotion);

router.delete("/:promotionId", jwtMiddleware, requireRole("MANAGER"), deletePromotion);
  
module.exports = router;
