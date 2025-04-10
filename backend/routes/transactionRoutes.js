const express = require("express");
const router = express.Router();
const { createTransaction, getTransactions, getTransactionById, patchTransactionSuspicious, patchRedemptionProcessed } = require("../controllers/transactionController");
const { jwtMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");

router.post("/", jwtMiddleware, requireRole("CASHIER"), createTransaction);
router.get("/", jwtMiddleware, requireRole("CASHIER"), getTransactions);

router.patch("/:transactionId/processed", jwtMiddleware, requireRole("CASHIER"), patchRedemptionProcessed);
  
router.get("/:transactionId", jwtMiddleware, requireRole("MANAGER"), getTransactionById);
router.patch("/:transactionId/suspicious", jwtMiddleware, requireRole("MANAGER"), patchTransactionSuspicious);  

module.exports = router;
