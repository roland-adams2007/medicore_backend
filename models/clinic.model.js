const { db_connection } = require("../config/config.inc");

const Clinic = {
  // clinics this user owns
  findForUser: async (userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT c.id, c.uuid, c.name, c.email, c.phone,
            c.address, c.city, c.state_id, c.owner_id,
            s.name AS state_name, c.created_at
         FROM clinics c
         LEFT JOIN states s ON c.state_id = s.id
         WHERE c.owner_id = ? AND c.is_active = 1
         ORDER BY c.created_at DESC`,
        [userId],
      );
      return rows || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // clinics this user is a staff member in (via branch_users)
  findForBranchMember: async (userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT DISTINCT c.id, c.uuid, c.name, c.email, c.phone,
            c.address, c.city, c.state_id, c.owner_id,
            s.name AS state_name, c.created_at
         FROM clinics c
         LEFT JOIN states s ON c.state_id = s.id
         JOIN branches b ON b.clinic_id = c.id
         JOIN branch_users bu ON bu.branch_id = b.id
         WHERE bu.user_id = ? AND c.is_active = 1
         ORDER BY c.created_at DESC`,
        [userId],
      );
      return rows || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  findById: async (id, userId = null) => {
    try {
      let query = `
        SELECT c.id, c.uuid, c.name, c.email, c.phone,
          c.address, c.city, c.state_id, c.owner_id,
          s.name AS state_name,
          c.subscription_id, c.is_active, c.created_at
        FROM clinics c
        LEFT JOIN states s ON c.state_id = s.id
        WHERE c.id = ?
      `;
      const params = [id];
      if (userId) { query += ` AND c.owner_id = ?`; params.push(userId); }
      query += ` AND c.is_active = 1 LIMIT 1`;
      const [rows] = await db_connection.execute(query, params);
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  findByUUID: async (uuid, userId = null) => {
    try {
      let query = `
        SELECT c.id, c.uuid, c.name, c.email, c.phone,
          c.address, c.city, c.state_id, c.owner_id,
          s.name AS state_name,
          c.subscription_id, c.is_active, c.created_at
        FROM clinics c
        LEFT JOIN states s ON c.state_id = s.id
        WHERE c.uuid = ?
      `;
      const params = [uuid];
      if (userId) { query += ` AND c.owner_id = ?`; params.push(userId); }
      query += ` AND c.is_active = 1 LIMIT 1`;
      const [rows] = await db_connection.execute(query, params);
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  create: async (clinicData) => {
    try {
      const { name, uuid, email, phone, address, city, state_id, owner_id, subscription_id, is_active, created_at } = clinicData;
      const [result] = await db_connection.execute(
        `INSERT INTO clinics (name, uuid, email, phone, address, city, state_id, owner_id, subscription_id, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, uuid, email, phone, address, city, state_id, owner_id, subscription_id, is_active, created_at],
      );
      return result.insertId;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  addClinicSub: async (data) => {
    try {
      const { clinic_id, subscription_id, start_date, end_date, price_paid, status, created_at } = data;
      const [result] = await db_connection.execute(
        `INSERT INTO clinic_subscriptions (clinic_id, subscription_id, start_date, end_date, price_paid, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [clinic_id, subscription_id, start_date, end_date, price_paid, status, created_at],
      );
      return result.affectedRows > 0;
    } catch {
      return false;
    }
  },

  deleteById: async (id) => {
    try {
      await db_connection.execute(`DELETE FROM clinics WHERE id = ?`, [id]);
      return true;
    } catch {
      return false;
    }
  },
};

module.exports = Clinic;