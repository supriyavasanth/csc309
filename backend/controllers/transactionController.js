const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /transactions
const createTransaction = async (req, res) => {
  let { utorid, type, spent, amount, relatedId, promotionIds, remark = "" } = req.body;

  if (!Array.isArray(promotionIds)) {
    promotionIds = [];
  }

  if (!req.user || !req.user.role) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const role = req.user.role.toUpperCase();

  const creatorUser = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!creatorUser) {
    return res.status(403).json({ error: "Creator not found" });
  }
  const createdBy = creatorUser.utorid;

  try {
    const user = await prisma.user.findUnique({ where: { utorid } });
    if (!user) {
      return res.status(400).json({ error: "Invalid utorid" });
    }

    if (type === "purchase") {
      if (!["CASHIER", "MANAGER", "SUPERUSER"].includes(role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (typeof spent !== "number" || spent <= 0) {
        return res.status(400).json({ error: "Invalid spent amount" });
      }

      const earned = Math.round(spent / 0.25);

      const cashier = await prisma.user.findUnique({ where: { id: req.user.id } });
      const isSuspicious = cashier?.suspicious ?? false;

      const validPromotions = await prisma.promotion.findMany({
        where: {
          id: { in: promotionIds },
          used: false
        }
      });

      if (promotionIds.length && validPromotions.length !== promotionIds.length) {
        return res.status(400).json({ error: "Invalid or used promotions" });
      }

      const transaction = await prisma.transaction.create({
        data: {
          type: "purchase",
          amount: earned,
          spent,
          remark,
          suspicious: isSuspicious,
          createdBy,
          userId: user.id
        }
      });

      if (validPromotions.length > 0) {
        await prisma.transactionPromotion.createMany({
          data: validPromotions.map(promo => ({
            transactionId: transaction.id,
            promotionId: promo.id
          }))
        });
      }

      if (!isSuspicious) {
        await prisma.user.update({
          where: { id: user.id },
          data: { points: user.points + earned }
        });
      } 

      return res.status(201).json({
        id: transaction.id,
        utorid,
        type: "purchase",
        spent,
        earned: isSuspicious ? 0 : earned,
        remark,
        promotionIds,
        createdBy
      });

    } else if (type === "adjustment") {
      if (!["MANAGER", "SUPERUSER"].includes(role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (typeof amount !== "number" || amount === 0 || !Number.isInteger(amount)) {
        return res.status(400).json({ error: "Invalid adjustment amount" });
      }

      const relatedTxn = await prisma.transaction.findUnique({ where: { id: relatedId } });
      if (!relatedTxn) {
        return res.status(400).json({ error: "Invalid related transaction ID" });
      }

      const validPromotions = await prisma.promotion.findMany({
        where: {
          id: { in: promotionIds },
          used: false
        }
      });

      if (promotionIds.length && validPromotions.length !== promotionIds.length) {
        return res.status(400).json({ error: "Invalid or used promotions" });
      }

      const transaction = await prisma.transaction.create({
        data: {
          type: "adjustment",
          amount,
          relatedId,
          remark,
          suspicious: false,
          createdBy,
          userId: user.id
        }
      });

      if (validPromotions.length > 0) {
        await prisma.transactionPromotion.createMany({
          data: validPromotions.map(promo => ({
            transactionId: transaction.id,
            promotionId: promo.id
          }))
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { points: user.points + amount }
      });

      return res.status(201).json({
        id: transaction.id,
        utorid,
        amount,
        type: "adjustment",
        relatedId,
        remark,
        promotionIds,
        createdBy
      });
    }

    return res.status(400).json({ error: "Invalid transaction type" });

  } catch (err) {
    console.error("Transaction error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /transactions
const getTransactions = async (req, res) => {
  const role = req.user?.role?.toUpperCase();
  if (!["MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const {
    name,
    createdBy,
    suspicious,
    promotionId,
    type,
    relatedId,
    amount,
    operator,
    page = 1,
    limit = 10
  } = req.query;

  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  if (isNaN(skip) || isNaN(take) || take <= 0 || skip < 0) {
    return res.status(400).json({ error: "Invalid pagination" });
  }

  const filters = {};
  const userFilters = {};

  if (name) {
    userFilters.OR = [
      { utorid: { contains: name, mode: "insensitive" } },
      { name: { contains: name, mode: "insensitive" } }
    ];
  }

  if (createdBy) filters.createdBy = createdBy;
  if (type) filters.type = type;
  if (relatedId !== undefined) filters.relatedId = parseInt(relatedId);
  if (suspicious !== undefined) filters.suspicious = suspicious === "true";

  if (amount !== undefined && operator) {
    const amt = parseInt(amount);
    if (operator === "gte") {
      filters.amount = { gte: amt };
    } else if (operator === "lte") {
      filters.amount = { lte: amt };
    }
  }

  const whereClause = {
    ...filters,
    user: Object.keys(userFilters).length ? userFilters : undefined,
    promotions: promotionId ? {
      some: {
        promotionId: parseInt(promotionId)
      }
    } : undefined
  };

  try {
    const [count, transactions] = await Promise.all([
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.findMany({
        where: whereClause,
        include: { user: true, promotions: true },
        orderBy: { id: "desc" },
        skip,
        take
      })
    ]);

    const results = transactions.map(txn => {

      const base = {
        id: txn.id,
        utorid: txn.user.utorid,
        amount: txn.amount,
        type: txn.type,
        remark: txn.remark ?? "",
        createdBy: txn.createdBy,
        promotionIds: txn.promotions.map(p => p.promotionId),
        suspicious: txn.suspicious ?? false,
        spent: txn.spent ?? null,
        redeemed: txn.redeemed ?? null,
        relatedId: txn.relatedId ?? null,
      };

      return base;
    });

    const response = { count, results };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error retrieving transactions:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /transactions/:transactionId
const getTransactionById = async (req, res) => {
    const { transactionId } = req.params;
    const role = req.user?.role?.toUpperCase();
  
    if (!["MANAGER", "SUPERUSER"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  
    try {
      const txn = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: {
          user: true,
          promotions: { include: { promotion: true } }
        }
      });
  
      if (!txn) return res.status(404).json({ error: "Transaction not found" });
  
      const promotionIds = txn.promotions.map(p => p.promotionId);
  
      return res.status(200).json({
        id: txn.id,
        utorid: txn.user.utorid,
        type: txn.type,
        spent: txn.spent ?? undefined,
        amount: txn.amount,
        promotionIds,
        suspicious: txn.suspicious,
        remark: txn.remark || "",
        createdBy: txn.createdBy
      });
    } catch (err) {
      console.error("Error retrieving transaction:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /transactions/:transactionId/suspicious
const patchTransactionSuspicious = async (req, res) => {
    const { transactionId } = req.params;
    const { suspicious } = req.body;
    const role = req.user?.role?.toUpperCase();
  
    if (!["MANAGER", "SUPERUSER"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  
    if (typeof suspicious !== "boolean") {
      return res.status(400).json({ error: "suspicious must be a boolean" });
    }
  
    try {
      const txn = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: {
          user: true,
          promotions: { include: { promotion: true } }
        }
      });
  
      if (!txn) return res.status(404).json({ error: "Transaction not found" });
  
      const promotionIds = txn.promotions.map(p => p.promotionId);
  
      if (txn.suspicious !== suspicious) {
        await prisma.user.update({
          where: { id: txn.userId },
          data: {
            points: suspicious
              ? txn.user.points - txn.amount
              : txn.user.points + txn.amount
          }
        });
      }
  
      const updatedTxn = await prisma.transaction.update({
        where: { id: txn.id },
        data: { suspicious }
      });
  
      return res.status(200).json({
        id: updatedTxn.id,
        utorid: txn.user.utorid,
        type: updatedTxn.type,
        spent: updatedTxn.spent ?? undefined,
        amount: updatedTxn.amount,
        promotionIds,
        suspicious: updatedTxn.suspicious,
        remark: updatedTxn.remark || "",
        createdBy: updatedTxn.createdBy
      });
    } catch (err) {
      console.error("Error patching suspicious flag:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};

// POST /users/:userId/transactions
const createUserTransaction = async (req, res) => {
    const { type, amount, remark = "" } = req.body;
    const user = req.user;
  
    if (!["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"].includes(user.role?.toUpperCase())) {
      return res.status(403).json({ error: "Forbidden" });
    }
  
    if (!user.verified) {
      return res.status(403).json({ error: "User is not verified" });
    }
  
    if (type !== "redemption") {
      return res.status(400).json({ error: "Invalid transaction type" });
    }
  
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive integer" });
    }
  
    if (user.points < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
  
    try {
      const txn = await prisma.transaction.create({
        data: {
          type: "redemption",
          amount: -amount,
          remark,
          userId: user.id,
          createdBy: user.utorid,
        }
      });
  
      return res.status(201).json({
        id: txn.id,
        utorid: user.utorid,
        type: txn.type,
        amount: -amount,
        processedBy: null,
        remark: txn.remark || "",
        createdBy: user.utorid
      });
    } catch (err) {
      console.error("Redemption error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};

// GET /me/transactions
const getUserTransactions = async (req, res) => {
  const user = req.user;

  if (!user || !["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"].includes(user.role?.toUpperCase())) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const {
    type,
    relatedId,
    promotionId,
    amount,
    operator,
    page = 1,
    limit = 10
  } = req.query;

  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  if (isNaN(take) || isNaN(skip) || take <= 0 || skip < 0) {
    return res.status(400).json({ error: "Invalid pagination" });
  }

  const filters = {
    userId: user.id
  };

  if (type) filters.type = type;
  if (relatedId !== undefined && type) {
    filters.relatedId = parseInt(relatedId);
  }
  if (amount !== undefined && operator) {
    const amt = parseInt(amount);
    if (operator === "gte") filters.amount = { gte: amt };
    else if (operator === "lte") filters.amount = { lte: amt };
  }

  const promotionFilter = promotionId
    ? { some: { promotionId: parseInt(promotionId) } }
    : undefined;

  try {
    const [count, transactions] = await Promise.all([
      prisma.transaction.count({
        where: {
          ...filters,
          promotions: promotionFilter,
        },
      }),
      prisma.transaction.findMany({
        where: {
          ...filters,
          promotions: promotionFilter,
        },
        include: {
          promotions: true,
        },
        orderBy: { id: "desc" },
        skip,
        take,
      }),
    ]);

    const results = transactions.map(txn => {
      const txnObj = {
        id: txn.id,
        type: txn.type,
        amount: txn.amount,
        remark: txn.remark || "",
        createdBy: txn.createdBy,
        promotionIds: txn.promotions.map(p => p.promotionId),
      };

      if (txn.type === "purchase") {
        txnObj.spent = txn.spent;
      }

      if (["adjustment", "transfer", "redemption", "event"].includes(txn.type)) {
        txnObj.relatedId = txn.relatedId ?? null;
      }

      if (txn.type === "redemption") {
        txnObj.redeemed = -txn.amount;
      }

      return txnObj;
    });

    return res.status(200).json({ count, results });
  } catch (err) {
    console.error("Get user transactions error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /users/:userId/transactions
const createTransferTransaction = async (req, res) => {
  const sender = req.user;
  const recipientId = parseInt(req.params.userId);
  const { type, amount, remark = "" } = req.body;

  if (!["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"].includes(sender.role?.toUpperCase())) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!sender.verified) {
    return res.status(403).json({ error: "User is not verified" });
  }

  if (type !== "transfer") {
    return res.status(400).json({ error: "Invalid transaction type" });
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive integer" });
  }

  if (isNaN(recipientId)) {
    return res.status(400).json({ error: "Invalid recipient ID" });
  }

  try {
    if (sender.points < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    const [senderTx, receiverTx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: "transfer",
          amount: -amount,
          remark,
          userId: sender.id,
          relatedId: recipient.id,
          createdBy: sender.utorid,
        },
      }),

      prisma.transaction.create({
        data: {
          type: "transfer",
          amount: amount,
          remark,
          userId: recipient.id,
          relatedId: sender.id,
          createdBy: sender.utorid,
        },
      }),

      prisma.user.update({
        where: { id: sender.id },
        data: { points: { decrement: amount } },
      }),

      prisma.user.update({
        where: { id: recipient.id },
        data: { points: { increment: amount } },
      }),
    ]);

    return res.status(201).json({
      id: senderTx.id,
      sender: sender.utorid,
      recipient: recipient.utorid,
      type: "transfer",
      sent: amount,
      remark,
      createdBy: sender.utorid,
    });
  } catch (err) {
    console.error("Transfer transaction error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /transactions/:transactionId/processed
const patchRedemptionProcessed = async (req, res) => {
  const { transactionId } = req.params;
  const { processed } = req.body;
  const role = req.user?.role?.toUpperCase();
  const cashierUtorid = req.user?.utorid;

  if (!["CASHIER", "MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (processed !== true) {
    return res.status(400).json({ error: "Invalid payload: 'processed' must be true" });
  }

  try {
    const txn = await prisma.transaction.findUnique({
      where: { id: parseInt(transactionId) },
      include: { user: true }
    });

    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (txn.type !== "redemption") {
      return res.status(400).json({ error: "Transaction is not of type 'redemption'" });
    }

    if (txn.processedBy) {
      return res.status(400).json({ error: "Redemption already processed" });
    }

    const user = await prisma.user.findUnique({ where: { id: txn.userId } });

    if (!user || user.points < -txn.amount) {
      return res.status(400).json({ error: "Insufficient points to process redemption" });
    }

    const updatedTxn = await prisma.transaction.update({
      where: { id: txn.id },
      data: { processedBy: cashierUtorid }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { points: user.points + txn.amount } 
    });

    return res.status(200).json({
      id: updatedTxn.id,
      utorid: txn.user.utorid,
      type: txn.type,
      processedBy: cashierUtorid,
      redeemed: -txn.amount,
      remark: txn.remark || "",
      createdBy: txn.createdBy
    });

  } catch (err) {
    console.error("Error processing redemption:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

  
module.exports = { createTransaction, getTransactions, getTransactionById, patchTransactionSuspicious, getUserTransactions, createUserTransaction, createTransferTransaction, patchRedemptionProcessed };
