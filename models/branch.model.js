const { db_connection } = require("../config/config.inc");
const generateUUID = require("../utils/generateUUID");

const Branch = {
  findForClinic: async (clinicId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT 
            b.id, b.uuid, b.name, b.phone,
            b.address, b.city, b.state_id,
            s.name AS state_name,
            b.created_at
         FROM branches b
         LEFT JOIN states s ON b.state_id = s.id
         WHERE b.clinic_id = ?
         ORDER BY b.created_at ASC`,
        [clinicId],
      );
      return rows || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  findById: async (id, clinicId = null) => {
    try {
      let query = `
        SELECT b.id, b.uuid, b.name, b.phone,
          b.address, b.city, b.state_id,
          s.name AS state_name, b.created_at
        FROM branches b
        LEFT JOIN states s ON b.state_id = s.id
        WHERE b.id = ?
      `;
      const params = [id];
      if (clinicId) { query += ` AND b.clinic_id = ?`; params.push(clinicId); }
      query += ` LIMIT 1`;
      const [rows] = await db_connection.execute(query, params);
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  create: async (branchData) => {
    try {
      const { clinic_id, name, address, phone, city, state_id, created_at } = branchData;
      const uuid = generateUUID();
      const [result] = await db_connection.execute(
        `INSERT INTO branches (uuid, clinic_id, name, address, phone, city, state_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid, clinic_id, name, address ?? null, phone ?? null, city ?? null, state_id ?? null, created_at],
      );
      return result.insertId;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
};

module.exports = Branch;