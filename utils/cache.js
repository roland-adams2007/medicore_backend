const { redis } = require("../config/config.inc");
const cache = {
  async set(key, data, seconds = 60) {
    try {
      const value = JSON.stringify(data);
      await redis.set(key, value, "EX", seconds);
      return true;
    } catch (err) {
      console.error("Redis SET error:", err.message);
      return false;
    }
  },

  // Get data
  async get(key) {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (err) {
      console.error("Redis GET error:", err.message);
      return null;
    }
  },

  // Update existing key
  async update(key, data, seconds = 60) {
    try {
      const exists = await redis.exists(key);
      if (!exists) return false;

      const value = JSON.stringify(data);
      await redis.set(key, value, "EX", seconds);
      return true;
    } catch (err) {
      console.error("Redis UPDATE error:", err.message);
      return false;
    }
  },

  // Delete key
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (err) {
      console.error("Redis DEL error:", err.message);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    const exists = await redis.exists(key);
    return exists === 1;
  },
};

module.exports = cache;
