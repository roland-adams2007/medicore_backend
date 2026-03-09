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

  findPending: async (email, branchId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT id FROM branch_user_invites
         WHERE email = ? AND branch_id = ? AND status = 'pending' AND expires_at > NOW()
         LIMIT 1`,
        [email, branchId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  // create: async (data) => {
  //   try {
  //     const {
  //       branch_id,
  //       clinic_id,
  //       email,
  //       role_id,
  //       invited_by,
  //       token,
  //       status,
  //       expires_at,
  //       created_at,
  //     } = data;
  //     const [result] = await db_connection.execute(
  //       `INSERT INTO branch_user_invites
  //          (branch_id, clinic_id, email, role_id, invited_by, token, status, expires_at, created_at)
  //        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  //       [
  //         branch_id,
  //         clinic_id,
  //         email,
  //         role_id,
  //         invited_by,
  //         token,
  //         status,
  //         expires_at,
  //         created_at,
  //       ],
  //     );
  //     return result.insertId || null;
  //   } catch (error) {
  //     console.error(error);
  //     return null;
  //   }
  // },

  findByEmailAndBranch: async (email, branchId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT bu.id FROM branch_users bu
       JOIN users u ON bu.user_id = u.id
       WHERE u.email = ? AND bu.branch_id = ?
       LIMIT 1`,
        [email, branchId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  findInviteTokenByToken: async (token) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT
          i.id, i.email, i.status, i.expires_at,
          i.branch_id, i.clinic_id, i.role_id,
          c.name  AS clinic_name,
          b.name  AS branch_name,
          r.name  AS role_name,
          CONCAT(u.fname, ' ', u.lname) AS invited_by_name
       FROM branch_user_invites i
       JOIN clinics  c ON i.clinic_id   = c.id
       JOIN branches b ON i.branch_id   = b.id
       JOIN roles    r ON i.role_id     = r.id
       JOIN users    u ON i.invited_by  = u.id
       WHERE i.token = ?
       LIMIT 1`,
        [token],
      );
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  updateInviteTokenStatus: async (inviteId, status) => {
    try {
      const query = `UPDATE branch_user_invites SET status = ?  WHERE id = ?`;
      const [result] = await db_connection.execute(query, [status, inviteId]);
      return result.affectedRows > 0;
    } catch (error) {
      return null;
    }
  },
  create: async ({ branch_id, user_id, role_id }) => {
    try {
      const [result] = await db_connection.execute(
        `INSERT INTO branch_users (branch_id, user_id, role_id)
       VALUES (?, ?, ?)`,
        [branch_id, user_id, role_id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
};

module.exports = BranchUser;
