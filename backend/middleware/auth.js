const jwt = require("jsonwebtoken");

// Very small JWT auth middleware
const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;
