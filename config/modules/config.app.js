const env = require("../../utils/env");
const system = {
  PORT: env("PORT", 5000),
  APP_NAME: env("APP_NAME", "MediCore"),
  APP_URL: env("APP_URL"),
  API_URL: env("API_URL"),
  SECRET_KEY: env("JWT_SECRET"),
  NODE_ENV: env("NODE_ENV", "development"),
};

module.exports = system;
