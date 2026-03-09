const { db_connection } = require("../config/config.inc");
const generateUUID = require("../utils/generateUUID");

const Role = {
  findById: async (id) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT id, name FROM roles WHERE id = ? LIMIT 1`,
        [id],
      );
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
};

module.exports = Role;
