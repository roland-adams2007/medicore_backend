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
  getAll: async () => {
    try {
      const [rows] = await db_connection.execute(`
      SELECT 
        r.id, 
        r.name,
        r.parent_id,
        p.name as parent_name
      FROM roles r
      LEFT JOIN roles p ON r.parent_id = p.id
      ORDER BY r.name ASC
    `);
      return rows.length > 0 ? rows : [];
    } catch (error) {
      console.error("Error fetching roles:", error.message);
      return [];
    }
  },
};

module.exports = Role;
