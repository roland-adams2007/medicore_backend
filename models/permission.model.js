const { db_connection } = require("../config/config.inc");

const Permission = {
  getPermissionsByRole: async function (roleId) {
    try {
      const [rows] = await db_connection.execute(
        `SELECT p.id, p.name FROM permission p
        LEFT JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?`,
        [roleId],
      );
      return rows || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },
};

module.exports = Permission;
