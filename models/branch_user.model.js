const { db_connection } = require("../config/config.inc");

const BranchUser = {
  findUserRole: async (branchId, userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT 
            bu.id,
            bu.branch_id,
            bu.user_id,
            bu.role_id,
            r.name AS role_name
         FROM branch_users bu
         JOIN roles r ON bu.role_id = r.id
         WHERE bu.branch_id = ? AND bu.user_id = ?
         LIMIT 1`,
        [branchId, userId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  findUserRolesAcrossClinic: async (clinicId, userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT 
            bu.branch_id,
            bu.role_id,
            r.name AS role_name,
            b.name AS branch_name
         FROM branch_users bu
         JOIN roles r ON bu.role_id = r.id
         JOIN branches b ON bu.branch_id = b.id
         WHERE b.clinic_id = ? AND bu.user_id = ?`,
        [clinicId, userId],
      );
      return rows || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },
};

module.exports = BranchUser;