const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();
const SECRET = "supersecretassignmentkeysosecretive";

const login = async (req, res) => {
  const { utorid, password } = req.body;

  if (!utorid || !password) {
    return res.status(400).json({ error: "Missing utorid or password" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { utorid },
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const requestPasswordReset = async (req, res) => {
    const { utorid } = req.body;
  
    if (!utorid) {
      return res.status(400).json({ error: "Missing utorid" });
    }
  
    try {
      const user = await prisma.user.findUnique({ where: { utorid } });
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      await prisma.resetToken.deleteMany({
        where: { userId: user.id },
      });
  
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
      await prisma.resetToken.create({
        data: {
          token,
          expiresAt,
          userId: user.id,
        },
      });
    
      res.status(202).json({
        expiresAt: expiresAt.toISOString(),
        resetToken: token,
      });
    } catch (err) {
      console.error("500: Internal error during reset request", err);
      res.status(500).json({ error: "Internal server error" });
    }
};
    
const resetPassword = async (req, res) => {
    const { utorid, password } = req.body;
    const { resetToken } = req.params;
    
    if (!utorid || !password) {
      return res.status(400).json({ error: "Missing utorid or password" });
    }
  
    const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/.test(password);
    if (!passwordValid) {
      return res.status(400).json({ error: "Invalid password format" });
    }
  
    const tokenRecord = await prisma.resetToken.findUnique({
      where: { token: resetToken },
      include: { user: true },
    });
  
    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid token" });
    }
  
    if (tokenRecord.expiresAt < new Date()) {
      return res.status(410).json({ error: "Token expired" });
    }
  
    if (tokenRecord.user.utorid !== utorid) {
      return res.status(401).json({ error: "Utorid does not match token" });
    }
    
    const hashed = await bcrypt.hash(password, 10);
  
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashed },
    });
  
    await prisma.resetToken.delete({ where: { token: resetToken } });
  
    res.status(200).json({ message: "Password reset successful" });
};
          
module.exports = {
  login,
  requestPasswordReset,
  resetPassword,
};
