const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

function readToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function authenticate(req, res, next) {
  const payload = readToken(req);
  if (!payload) return next(new AppError(401, "Silakan login terlebih dahulu"));
  req.user = { id: payload.id, role: payload.role };
  next();
}

function optionalAuth(req, res, next) {
  const payload = readToken(req);
  if (payload) req.user = { id: payload.id, role: payload.role };
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Kamu tidak punya akses ke fitur ini"));
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, authorize };
