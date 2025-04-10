const express = require("express");
const router = express.Router();
const { register, getAllUsers, getUserById, updateUserById, updateCurrentUser, updateMyPassword, getCurrentUserInfo } = require("../controllers/userController");
const { jwtMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");
const { createTransferTransaction, getUserTransactions, createUserTransaction } = require("../controllers/transactionController");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${req.user.utorid}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });


router.post("/", jwtMiddleware, requireRole("MANAGER"), register);
router.get("/", jwtMiddleware, requireRole("MANAGER"), getAllUsers);

router.patch("/me/password", jwtMiddleware, requireRole("REGULAR"), updateMyPassword);
router.patch("/me", jwtMiddleware, upload.single("avatar"), updateCurrentUser);
router.get("/me", jwtMiddleware, requireRole("REGULAR"), getCurrentUserInfo);

router.post("/me/transactions", jwtMiddleware, requireRole("REGULAR"), createUserTransaction);
router.get("/me/transactions", jwtMiddleware, requireRole("REGULAR"), getUserTransactions);

router.patch("/:userId", jwtMiddleware, requireRole("MANAGER"), updateUserById);
router.get("/:userId", jwtMiddleware, requireRole("CASHIER"), getUserById);

router.post("/:userId/transactions", jwtMiddleware, requireRole("REGULAR"), createTransferTransaction);

module.exports = router;
