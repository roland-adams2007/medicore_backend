const IORedis = require("ioredis");
const env = require("../../utils/env");
const redis = new IORedis({
  host: env("REDIS_HOST"),
  port: env("REDIS_PORT"),
  username: env("REDIS_USERNAME"),
  password: env("REDIS_PASSWORD"),
  tls: {},
  maxRetriesPerRequest: null,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("ready", () => console.log("🚀 Redis ready"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

module.exports = redis;
