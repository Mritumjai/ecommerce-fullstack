const { AppError } = require("../lib/errors");
const { createId } = require("../lib/id");
const { hashPassword, signJwt, verifyJwt, verifyPassword } = require("../lib/crypto");

function createAuthService(store, config) {
  async function register(input = {}) {
    if (!input.name || !input.email || !input.password) {
      throw new AppError(400, "name, email, and password are required");
    }

    const normalizedEmail = input.email.toLowerCase();
    const existing = Array.from(store.users.values()).find((user) => user.email === normalizedEmail);
    if (existing) {
      throw new AppError(409, "User already exists");
    }

    const role = input.role === "admin" ? "admin" : "customer";
    const user = {
      id: createId("user"),
      name: input.name,
      email: normalizedEmail,
      passwordHash: hashPassword(input.password),
      role,
      createdAt: new Date().toISOString()
    };

    await store.saveUser(user);
    return buildAuthResponse(user);
  }

  function login(input = {}) {
    if (!input.email || !input.password) {
      throw new AppError(400, "email and password are required");
    }

    const user = Array.from(store.users.values()).find((entry) => entry.email === input.email.toLowerCase());
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError(401, "Invalid credentials");
    }

    return buildAuthResponse(user);
  }

  function authenticate(token) {
    try {
      const payload = verifyJwt(token, config.jwtSecret);
      const user = store.users.get(payload.sub);
      if (!user) {
        throw new AppError(401, "User not found for token");
      }
      return sanitizeUser(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(401, "Invalid or expired token");
    }
  }

  function buildAuthResponse(user) {
    const accessToken = signJwt(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      config.jwtSecret
    );

    return {
      accessToken,
      user: sanitizeUser(user)
    };
  }

  function sanitizeUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  }

  return {
    register,
    login,
    authenticate
  };
}

module.exports = {
  createAuthService
};
