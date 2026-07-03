const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const pool = {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

const ssl =
  process.env.DB_SSL === "true"
    ? { require: true, rejectUnauthorized: false }
    : undefined;

if (process.env.DATABASE_URL) {
  module.exports = {
    useUrl: true,
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    dialectOptions: ssl ? { ssl } : {},
    pool,
  };
} else {
  module.exports = {
    useUrl: false,
    HOST: process.env.DB_HOST || "localhost",
    USER: process.env.DB_USER || "postgres",
    PASSWORD: process.env.DB_PASSWORD || "Joker0328",
    DB: process.env.DB_NAME || "road",
    dialect: "postgres",
    dialectOptions: ssl ? { ssl } : {},
    pool,
  };
}
