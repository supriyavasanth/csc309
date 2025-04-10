const requireRole = (role) => {
    return (req, res, next) => {
      const userRole = req.user?.role?.toUpperCase();
      const requiredRole = role.toUpperCase();
  
      if (!userRole) {
        console.log("403: Missing or invalid user role in request", req.user);
        return res.status(401).json({ error: "Forbidden" });
      }
  
      const levels = ["REGULAR", "CASHIER", "MANAGER", "SUPERUSER"];
      const userIndex = levels.indexOf(userRole);
      const requiredIndex = levels.indexOf(requiredRole);
  
      if (userIndex === -1 || requiredIndex === -1 || userIndex < requiredIndex) {
        return res.status(403).json({ error: "Forbidden" });
      }
  
      next();
    };
  };
  
  module.exports = { requireRole };
  