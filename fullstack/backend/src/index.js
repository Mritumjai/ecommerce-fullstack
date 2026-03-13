const { createServer } = require("./app");
const { getConfig } = require("./config");

async function start() {
  const config = getConfig();
  const server = await createServer();
  server.listen(config.port, () => {
    console.log(`E-commerce backend listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exitCode = 1;
});
