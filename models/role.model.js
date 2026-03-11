const { db_connection } = require("../config/config.inc");

const Role = {
  findById: async (id) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT id, name, parent_id FROM roles WHERE id = ? LIMIT 1`,
        [id]
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
          p.name AS parent_name
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

  getAncestorIds: async (roleId) => {
    try {
      const ancestors = [];
      let currentId = roleId;
      const visited = new Set();

      while (currentId) {
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const [rows] = await db_connection.execute(
          `SELECT id, parent_id FROM roles WHERE id = ? LIMIT 1`,
          [currentId]
        );

        if (!rows[0]) break;
        currentId = rows[0].parent_id;
        if (currentId) ancestors.push(currentId);
      }

      return ancestors;
    } catch (error) {
      console.error("Error in getAncestorIds:", error);
      return [];
    }
  },

  getDescendantIds: async (roleId) => {
    try {
      const descendants = [];
      const queue = [roleId];
      const visited = new Set();

      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);

        const [rows] = await db_connection.execute(
          `SELECT id FROM roles WHERE parent_id = ?`,
          [current]
        );

        for (const row of rows) {
          descendants.push(row.id);
          queue.push(row.id);
        }
      }

      return descendants;
    } catch (error) {
      console.error("Error in getDescendantIds:", error);
      return [];
    }
  },

  canActorManageTarget: async (actorRoleId, targetRoleId) => {
    try {
      if (actorRoleId === targetRoleId) return false;

      const descendants = await Role.getDescendantIds(actorRoleId);
      return descendants.includes(targetRoleId);
    } catch (error) {
      console.error("Error in canActorManageTarget:", error);
      return false;
    }
  },
};

module.exports = Role;