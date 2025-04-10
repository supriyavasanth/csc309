const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /promotions
const createPromotion = async (req, res) => {
  const role = req.user?.role?.toUpperCase();

  if (!role) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!["MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    name,
    description,
    type,
    startTime,
    endTime,
    minSpending,
    rate,
    points
  } = req.body;

  if (!name || !description || !type || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["automatic", "one_time"].includes(type)) {
    return res.status(400).json({ error: "Invalid promotion type" });
  }

  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  if (start < now) {
    return res.status(400).json({ error: "Start time must not be in the past" });
  }

  if (end <= start) {
    return res.status(400).json({ error: "End time must be after start time" });
  }

  if (minSpending !== undefined && (typeof minSpending !== "number" || minSpending <= 0)) {
    return res.status(400).json({ error: "Invalid minSpending" });
  }

  if (rate !== undefined && (typeof rate !== "number" || rate <= 0)) {
    return res.status(400).json({ error: "Invalid rate" });
  }

  if (points !== undefined && (!Number.isInteger(points) || points < 0)) {
    return res.status(400).json({ error: "Invalid points" });
  }

  try {
    const promo = await prisma.promotion.create({
      data: {
        name,
        description,
        type,
        startTime: start,
        endTime: end,
        minSpending: minSpending ?? null,
        rate: rate ?? null,
        points: points ?? 0,
        used: false,
        userId: req.user.id
      }
    });

    return res.status(201).json({
      id: promo.id,
      name: promo.name,
      description: promo.description,
      type: promo.type,
      startTime: promo.startTime.toISOString(),
      endTime: promo.endTime.toISOString(),
      minSpending: promo.minSpending,
      rate: promo.rate,
      points: promo.points
    });
  } catch (err) {
    console.error("Create promotion error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /promotions
const getPromotions = async (req, res) => {
  const role = req.user?.role?.toUpperCase();
  const userId = req.user?.id;

  if (!["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const {
    name,
    type,
    started,
    ended,
    page = 1,
    limit = 10
  } = req.query;

  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  if (parseInt(page) < 1 || isNaN(skip) || isNaN(take) || take <= 0) {
    return res.status(400).json({ error: "Invalid pagination" });
  }

  if (started !== undefined && ended !== undefined && ["MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(400).json({ error: "Cannot filter both started and ended" });
  }

  const now = new Date();
  const filters = {};

  if (name) {
    filters.name = { contains: name, mode: "insensitive" };
  }

  if (type) {
    filters.type = type;
  }

  if (["MANAGER", "SUPERUSER"].includes(role)) {
    if (started !== undefined) {
      filters.startTime = started === "true" ? { lte: now } : { gt: now };
    }

    if (ended !== undefined) {
      filters.endTime = ended === "true" ? { lte: now } : { gt: now };
    }
  }

  if (role === "REGULAR") {
    filters.startTime = { lte: now };
    filters.endTime = { gt: now };
    filters.used = false;
    filters.userId = userId;
  }

  try {
    const [count, promotions] = await Promise.all([
      prisma.promotion.count({ where: filters }),
      prisma.promotion.findMany({
        where: filters,
        skip,
        take,
        orderBy: { id: "desc" }
      })
    ]);

    const results = promotions.map(promo => {
      const base = {
        id: promo.id,
        name: promo.name,
        type: promo.type,
        endTime: promo.endTime.toISOString(),
        minSpending: promo.minSpending,
        rate: promo.rate,
        points: promo.points
      };

      if (["MANAGER", "SUPERUSER"].includes(role)) {
        base.startTime = promo.startTime.toISOString();
      }

      return base;
    });

    return res.status(200).json({ count, results });
  } catch (err) {
    console.error("Error fetching promotions:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /promotions/:promotionId
const getPromotionById = async (req, res) => {
  const role = req.user?.role?.toUpperCase();
  const promotionId = parseInt(req.params.promotionId);
  const now = new Date();

  if (!["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (isNaN(promotionId)) {
    return res.status(400).json({ error: "Invalid promotion ID" });
  }

  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId }
    });

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    if (["REGULAR", "CASHIER"].includes(role)) {
      if (promotion.startTime > now || promotion.endTime <= now) {
        return res.status(404).json({ error: "Promotion not available" });
      }
    }

    const response = {
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      endTime: promotion.endTime.toISOString(),
      minSpending: promotion.minSpending,
      rate: promotion.rate,
      points: promotion.points,
    };

    if (["MANAGER", "SUPERUSER"].includes(role)) {
      response.startTime = promotion.startTime.toISOString();
    }

    return res.status(200).json(response);

  } catch (err) {
    console.error("Error retrieving promotion:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /promotions/:promotionId
const patchPromotion = async (req, res) => {
  const role = req.user?.role?.toUpperCase();
  const promotionId = parseInt(req.params.promotionId);
  const {
    name,
    description,
    type,
    startTime,
    endTime,
    minSpending,
    rate,
    points,
  } = req.body;

  if (!["MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (isNaN(promotionId)) {
    return res.status(400).json({ error: "Invalid promotion ID" });
  }

  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    const now = new Date();
    const hasStarted = promotion.startTime <= now;
    const hasEnded = promotion.endTime <= now;

    if (startTime && new Date(startTime) < now) {
      return res.status(400).json({ error: "Start time is in the past" });
    }
    if (endTime && new Date(endTime) < now) {
      return res.status(400).json({ error: "End time is in the past" });
    }

    if (
      hasStarted &&
      (name || description || type || startTime || minSpending !== undefined || rate !== undefined || points !== undefined)
    ) {
      return res.status(400).json({ error: "Cannot update restricted fields after promotion has started" });
    }

    if (hasEnded && endTime) {
      return res.status(400).json({ error: "Cannot update endTime after promotion has ended" });
    }

    if (type && !["automatic", "one_time"].includes(type)) {
      return res.status(400).json({ error: "Invalid promotion type" });
    }

    if (rate !== undefined && (typeof rate !== "number" || rate < 0)) {
      return res.status(400).json({ error: "Invalid rate" });
    }

    if (minSpending !== undefined && (typeof minSpending !== "number" || minSpending < 0)) {
      return res.status(400).json({ error: "Invalid minSpending" });
    }

    if (points !== undefined && (!Number.isInteger(points) || points < 0)) {
      return res.status(400).json({ error: "Invalid points" });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (type) updateFields.type = type;
    if (startTime) updateFields.startTime = new Date(startTime);
    if (endTime) updateFields.endTime = new Date(endTime);
    if (minSpending !== undefined) updateFields.minSpending = minSpending;
    if (rate !== undefined) updateFields.rate = rate;
    if (points !== undefined) updateFields.points = points;

    const updated = await prisma.promotion.update({
      where: { id: promotionId },
      data: updateFields,
    });

    const response = {
      id: updated.id,
      name: updated.name,
      type: updated.type,
    };

    if (description) response.description = updated.description;
    if (startTime) response.startTime = updated.startTime.toISOString();
    if (endTime) response.endTime = updated.endTime.toISOString();
    if (minSpending !== undefined) response.minSpending = updated.minSpending;
    if (rate !== undefined) response.rate = updated.rate;
    if (points !== undefined) response.points = updated.points;

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error updating promotion:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deletePromotion = async (req, res) => {
  const promotionId = parseInt(req.params.promotionId);

  if (isNaN(promotionId)) {
    console.error("Invalid promotion ID");
    return res.status(400).json({ error: "Invalid promotion ID" });
  }
  
  const role = req.user?.role?.toUpperCase();

  if (!["MANAGER", "SUPERUSER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    const now = new Date();
    if (promotion.startTime <= now) {
      return res.status(403).json({ error: "Cannot delete promotion that has already started" });
    }

    await prisma.promotion.delete({ where: { id: promotionId } });

    return res.status(204).send();
  } catch (err) {
    console.error("Error deleting promotion:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
  
module.exports = {
  createPromotion,
  getPromotions, 
  getPromotionById, 
  patchPromotion, 
  deletePromotion
};
