const express = require("express");
const router = express.Router();
const {
  login,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");

router.post("/tokens", login);
router.post("/resets", requestPasswordReset);
router.post("/resets/:resetToken", resetPassword);

module.exports = router;
