const { AppError } = require("./errors");

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Authorization token is required");
  }
  return token;
}

function requireRole(user, allowedRoles) {
  if (!user || !allowedRoles.includes(user.role)) {
    throw new AppError(403, "Forbidden");
  }
}

module.exports = {
  readBearerToken,
  requireRole
};
