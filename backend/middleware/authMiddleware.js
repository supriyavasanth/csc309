const jwt = require("jsonwebtoken");
const SECRET = "supersecretassignmentkeysosecretive";

const jwtMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET);

    req.user = {
      id: payload.userId,
      role: payload.role?.toUpperCase(), 
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = { jwtMiddleware };
