function getConfig() {
  return {
    port: Number(process.env.PORT || 3000),
    jwtSecret: process.env.JWT_SECRET || "dev-secret",
    storageDriver: process.env.STORAGE_DRIVER || "memory",
    databaseUrl: process.env.DATABASE_URL || ""
  };
}

module.exports = {
  getConfig
};
