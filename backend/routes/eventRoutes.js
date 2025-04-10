const express = require("express");
const router = express.Router();
const { createEvent, getEvents, getEventById, patchEventById, deleteEventById, addEventOrganizer, removeEventOrganizer, addEventGuest, removeEventGuest, joinEventAsGuest, leaveEventAsGuest, createEventTransaction } = require("../controllers/eventController");
const { jwtMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");

router.get("/", jwtMiddleware, requireRole("REGULAR"), getEvents);
router.post("/", jwtMiddleware, requireRole("MANAGER"), createEvent);

router.get("/:eventId", jwtMiddleware, getEventById);
router.patch("/:eventId", jwtMiddleware, patchEventById);

router.post("/:eventId/organizers", jwtMiddleware, requireRole("MANAGER"), addEventOrganizer);
router.delete("/:eventId/organizers/:userId", jwtMiddleware, requireRole("MANAGER"), removeEventOrganizer);

router.post("/:eventId/guests", jwtMiddleware, addEventGuest);
router.delete("/:eventId/guests/:userId", jwtMiddleware, requireRole("MANAGER"), removeEventGuest);

router.post("/:eventId/guests/me", jwtMiddleware, requireRole("REGULAR"), joinEventAsGuest);
router.delete("/:eventId/guests/me", jwtMiddleware, requireRole("REGULAR"), leaveEventAsGuest);

router.post("/:eventId/transactions", jwtMiddleware, requireRole("REGULAR"), createEventTransaction);

router.delete("/:eventId", jwtMiddleware, requireRole("MANAGER"), deleteEventById);

module.exports = router;
