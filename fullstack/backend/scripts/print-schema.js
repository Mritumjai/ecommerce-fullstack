const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "db", "init.sql");
process.stdout.write(fs.readFileSync(schemaPath, "utf8"));
