const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const register = async (req, res) => {
  const { utorid, name, email, password } = req.body;

  if (!utorid || !name || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!/^[a-zA-Z0-9]{8}$/.test(utorid)) {
    return res.status(400).json({ error: "Invalid utorid format" });
  }

  if (!/^[\w.-]+@mail\.utoronto\.ca$/.test(email)) {
    return res.status(400).json({ error: "Invalid UofT email" });
  }

  if (name.length > 50) {
    return res.status(400).json({ error: "Name too long" });
  }

  try {
    const exists = await prisma.user.findUnique({ where: { utorid } });
    if (exists) {
      return res.status(409).json({ error: "User already exists" });
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const userData = {
      utorid,
      name,
      email,
      verified: false,
      createdAt: new Date(),
      resetTokens: {
        create: {
          token: resetToken,
          expiresAt,
        },
      },
    };

    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }

    const newUser = await prisma.user.create({
      data: userData,
      include: {
        resetTokens: true,
      },
    });

    res.status(201).json({
      id: newUser.id,
      utorid: newUser.utorid,
      name: newUser.name,
      email: newUser.email,
      verified: newUser.verified,
      expiresAt: expiresAt.toISOString(),
      resetToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  const {
    name,
    role,
    verified,
    activated,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  if (isNaN(pageNumber) || pageNumber < 1 || isNaN(pageSize) || pageSize < 1) {
    return res.status(400).json({ error: "Invalid page or limit" });
  }

  const where = {};

  if (role) {
    where.role = role.toUpperCase();
  }

  if (verified === "true") {
    where.verified = true;
  } else if (verified === "false") {
    where.verified = false;
  }

  if (activated === "true") {
    where.lastLogin = { not: null };
  } else if (activated === "false") {
    where.lastLogin = null;
  }

  try {
    let allUsers = await prisma.user.findMany({
      where,
      orderBy: { id: "asc" },
      select: {
        id: true,
        utorid: true,
        name: true,
        email: true,
        birthday: true,
        role: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        verified: true,
        avatarUrl: true,
      },
    });

    if (name) {
      const lowered = name.toLowerCase();
      allUsers = allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(lowered) ||
          user.utorid.toLowerCase().includes(lowered)
      );
    }

    const count = allUsers.length;
    const paginated = allUsers.slice(
      (pageNumber - 1) * pageSize,
      pageNumber * pageSize
    );

    res.status(200).json({
      count,
      results: paginated,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserById = async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        promotions: {
          where: {
            used: false,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cashierView = {
      id: user.id,
      utorid: user.utorid,
      name: user.name,
      points: user.points,
      verified: user.verified,
      promotions: user.promotions.map((p) => ({
        id: p.id,
        name: p.name,
        minSpending: p.minSpending,
        rate: p.rate,
        points: p.points,
      })),
    };

    const managerView = {
      ...cashierView,
      email: user.email,
      birthday: user.birthday,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      avatarUrl: user.avatarUrl,
    };
        
    const role = req.user?.role?.toUpperCase();

    if (role === "MANAGER" || role === "SUPERUSER") {
      return res.status(200).json(managerView);
    } else if (role === "CASHIER") {
      return res.status(200).json(cashierView);
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


const updateUserById = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { email, verified, suspicious, role } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const allFieldsNull = [email, verified, suspicious, role].every(
    (field) => field === undefined || field === null
  );

  if (allFieldsNull) {
    return res.status(400).json({ error: "Empty update payload" });
  }
  
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }


    const updates = {};
    const currentRole = req.user?.role?.toUpperCase();

    // EMAIL
    if ("email" in req.body && email !== null) {
      if (
        email === null || typeof email !== "string" ||
        !/^[\w.-]+@mail\.utoronto\.ca$/.test(email)
      ) {
        return res.status(400).json({ error: "Invalid UofT email" });
      }
      updates.email = email;
    }

    // VERIFIED
    if ("verified" in req.body && verified !== null) {

      if (verified !== true) {
        return res.status(400).json({ error: "Invalid verified value" });
      }
    
      if (verified === null || typeof verified !== "boolean") {
        return res.status(400).json({ error: "Invalid verified value" });
      }
      if (["MANAGER", "SUPERUSER"].includes(currentRole)) {
        updates.verified = verified;
      } else {
        return res.status(403).json({ error: "Insufficient permission to verify user" });
      }
    }
    
    // SUSPICIOUS
    if ("suspicious" in req.body && suspicious !== null) {
      if (suspicious === null || typeof suspicious !== "boolean") {
        return res.status(400).json({ error: "Invalid suspicious value" });
      }
      if (["MANAGER", "SUPERUSER"].includes(currentRole)) {
        updates.suspicious = suspicious;
      } else {
        return res.status(403).json({ error: "Insufficient permission to update suspicious flag" });
      }
    }

    // ROLE
    if ("role" in req.body && role !== null) {
      const normalizedRole = role.toUpperCase();
      const validRoles = ["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"];

      if (!validRoles.includes(normalizedRole)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (currentRole === "MANAGER") {
        if (!["REGULAR", "CASHIER"].includes(normalizedRole)) {
          return res.status(403).json({ error: "Managers can only assign cashier or regular roles" });
        }
        if (normalizedRole === "CASHIER" && user.role !== "CASHIER") {
          updates.suspicious = false; // when promoting
        }
      } else if (currentRole !== "SUPERUSER") {
        return res.status(403).json({ error: "Insufficient permission to change roles" });
      }

      updates.role = normalizedRole;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    const response = {
      id: updatedUser.id,
      utorid: updatedUser.utorid,
      name: updatedUser.name,
    };

    if ("email" in updates) response.email = updatedUser.email;
    if ("verified" in updates) response.verified = updatedUser.verified;
    if ("suspicious" in updates) response.suspicious = updatedUser.suspicious;
    if ("role" in updates) response.role = updatedUser.role;

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateCurrentUser = async (req, res) => {
  const userId = req.user?.id;
  const { name, email, birthday } = req.body;
  const file = req.file;

  if (!userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!name && !email && !birthday && !file) {
    return res.status(400).json({ error: "No update fields provided" });
  }

  const updates = {};

  if (name !== undefined && name !== null) {
    if (typeof name !== "string" || name.length < 1 || name.length > 50) {
      return res.status(400).json({ error: "Name must be 1-50 characters" });
    }
    updates.name = name;
  }

  if (email !== undefined && email !== null) {
    if (
      typeof email !== "string" ||
      !/^[\w.-]+@mail\.utoronto\.ca$/.test(email)
    ) {
      return res.status(400).json({ error: "Invalid UofT email" });
    }

    const existing = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
    });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    updates.email = email;
  }

  if (birthday) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthday)) {
      return res.status(400).json({ error: "Invalid birthday format" });
    }
  
    const parsed = Date.parse(birthday);
    const dateObj = new Date(birthday);
    if (isNaN(parsed) || dateObj.toISOString().slice(0, 10) !== birthday) {
      return res.status(400).json({ error: "Invalid birthday value" });
    }
  
    updates.birthday = new Date(birthday);
  }
  
  if (file) {
    updates.avatarUrl = `/uploads/avatars/${file.filename}`;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    return res.status(200).json({
      id: updatedUser.id,
      utorid: updatedUser.utorid,
      name: updatedUser.name,
      email: updatedUser.email,
      birthday: updatedUser.birthday,
      role: updatedUser.role,
      points: updatedUser.points,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin,
      verified: updatedUser.verified,
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


const updateMyPassword = async (req, res) => {
  const userId = req.user?.id;
  const { old, new: newPassword } = req.body;

  if (!old || !newPassword) {
    return res.status(400).json({ error: "Missing old or new password" });
  }

  const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/.test(newPassword);
  if (!passwordValid) {
    return res.status(400).json({ error: "Invalid password format" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return res.status(404).json({ error: "User not found or no password set" });
    }

    const isMatch = await bcrypt.compare(old, user.password);
    if (!isMatch) {
      return res.status(403).json({ error: "Incorrect current password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return res.status(200).json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Error updating password:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCurrentUserInfo = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    console.error("Missing or invalid user ID in JWT.");
    return res.status(400).json({ error: "Invalid token or user ID" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        promotions: true,
      },
    });

    if (!user) {
      console.error("User not found in database for ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      id: user.id,
      utorid: user.utorid,
      name: user.name,
      email: user.email,
      birthday: user.birthday,
      role: user.role.toLowerCase(),
      points: user.points,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      verified: user.verified,
      avatarUrl: user.avatarUrl,
      promotions: user.promotions || [],
    });
  } catch (err) {
    console.error("Failed to get user info:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { register, getAllUsers, getUserById, updateUserById, updateCurrentUser, updateMyPassword, getCurrentUserInfo };
