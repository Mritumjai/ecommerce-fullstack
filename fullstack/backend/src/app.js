const http = require("http");
const { createRouter } = require("./router");
const { createStorage } = require("./storage");
const { getConfig } = require("./config");

async function buildApp() {
  const config = getConfig();
  const store = await createStorage(config);
  return createRouter(store, config);
}

async function createServer() {
  const app = await buildApp();
  return http.createServer(app);
}

module.exports = {
  buildApp,
  createServer
};
