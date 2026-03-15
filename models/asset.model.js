const { db_connection } = require("../config/config.inc");

const Asset = {
  create: async ({ clinic_id, user_id, file_uuid, file_original_name, file_url, file_name, file_size, mime_type, extension, created_at }) => {
    try {
      const [result] = await db_connection.execute(
        `INSERT INTO clinic_assets (clinic_id, user_id, file_uuid, file_original_name, file_url, file_name, file_size, mime_type, extension, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [clinic_id, user_id, file_uuid, file_original_name, file_url, file_name, file_size, mime_type, extension, created_at]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error in Asset.create:", error);
      return null;
    }
  },

  findById: async (id) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT ca.*, u.fname, u.lname, u.email AS owner_email
         FROM clinic_assets ca
         LEFT JOIN users u ON u.id = ca.user_id
         WHERE ca.id = ? AND ca.deleted_at IS NULL
         LIMIT 1`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error in Asset.findById:", error);
      return null;
    }
  },

  /**
   * Fetch assets scoped to a specific user within a clinic.
   * Used when a staff member should only see their own uploads.
   */
  findByClinicAndUser: async ({ clinicId, userId, page = 1, limit = 20, search = null, mimeType = null }) => {
    try {
      const offset = (page - 1) * limit;
      const params = [clinicId, userId];
      const conditions = ["ca.clinic_id = ?", "ca.user_id = ?", "ca.deleted_at IS NULL"];

      if (search) {
        conditions.push("ca.file_original_name LIKE ?");
        params.push(`%${search}%`);
      }
      if (mimeType) {
        conditions.push("ca.mime_type LIKE ?");
        params.push(`${mimeType}%`);
      }

      const where = conditions.join(" AND ");

      const [[{ total }]] = await db_connection.execute(
        `SELECT COUNT(*) AS total FROM clinic_assets ca WHERE ${where}`,
        [...params]
      );

      if (total === 0) return { assets: [], total: 0 };

      const [rows] = await db_connection.execute(
        `SELECT ca.*, u.fname, u.lname, u.email AS owner_email
         FROM clinic_assets ca
         LEFT JOIN users u ON u.id = ca.user_id
         WHERE ${where}
         ORDER BY ca.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return { assets: rows, total };
    } catch (error) {
      console.error("Error in Asset.findByClinicAndUser:", error);
      return { assets: [], total: 0 };
    }
  },

  /**
   * Fetch all assets in a clinic (admin/owner view).
   */
  findByClinic: async ({ clinicId, page = 1, limit = 20, search = null, mimeType = null }) => {
    try {
      const offset = (page - 1) * limit;
      const params = [clinicId];
      const conditions = ["ca.clinic_id = ?", "ca.deleted_at IS NULL"];

      if (search) {
        conditions.push("ca.file_original_name LIKE ?");
        params.push(`%${search}%`);
      }
      if (mimeType) {
        conditions.push("ca.mime_type LIKE ?");
        params.push(`${mimeType}%`);
      }

      const where = conditions.join(" AND ");
      const countParams = [...params];

      const [[{ total }]] = await db_connection.execute(
        `SELECT COUNT(*) AS total FROM clinic_assets ca WHERE ${where}`,
        countParams
      );

      if (total === 0) return { assets: [], total: 0 };

      const dataParams = [...params, limit, offset];
      const [rows] = await db_connection.execute(
        `SELECT ca.*, u.fname, u.lname, u.email AS owner_email
         FROM clinic_assets ca
         LEFT JOIN users u ON u.id = ca.user_id
         WHERE ${where}
         ORDER BY ca.created_at DESC
         LIMIT ? OFFSET ?`,
        dataParams
      );

      return { assets: rows, total };
    } catch (error) {
      console.error("Error in Asset.findByClinic:", error);
      return { assets: [], total: 0 };
    }
  },

  delete: async (id, clinicId) => {
    try {
      const nowUtc = new Date().toISOString().slice(0, 19).replace("T", " ");
      const [result] = await db_connection.execute(
        `UPDATE clinic_assets SET deleted_at = ? WHERE id = ? AND clinic_id = ?`,
        [nowUtc, id, clinicId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in Asset.delete:", error);
      return false;
    }
  },

  /**
   * Delete only if the asset belongs to the given user (ownership check).
   */
  deleteOwnedByUser: async (id, clinicId, userId) => {
    try {
      const nowUtc = new Date().toISOString().slice(0, 19).replace("T", " ");
      const [result] = await db_connection.execute(
        `UPDATE clinic_assets SET deleted_at = ? WHERE id = ? AND clinic_id = ? AND user_id = ?`,
        [nowUtc, id, clinicId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in Asset.deleteOwnedByUser:", error);
      return false;
    }
  },

  findTransfersByAsset: async (assetId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT ft.*, 
          s.fname AS sender_fname, s.lname AS sender_lname,
          r.fname AS receiver_fname, r.lname AS receiver_lname, r.email AS receiver_email
         FROM asset_transfers ft
         LEFT JOIN users s ON s.id = ft.sender_id
         LEFT JOIN users r ON r.id = ft.receiver_id
         WHERE ft.asset_id = ?
         ORDER BY ft.created_at DESC`,
        [assetId]
      );
      return rows;
    } catch (error) {
      console.error("Error in Asset.findTransfersByAsset:", error);
      return [];
    }
  },

  createTransfer: async ({ asset_id, sender_id, receiver_id, message, created_at }) => {
    try {
      const [result] = await db_connection.execute(
        `INSERT INTO asset_transfers (asset_id, sender_id, receiver_id, message, status, created_at)
         VALUES (?, ?, ?, ?, 'sent', ?)`,
        [asset_id, sender_id, receiver_id, message || null, created_at]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error in Asset.createTransfer:", error);
      return null;
    }
  },

  findTransferById: async (transferId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT ft.*,
          ca.file_url, ca.file_original_name, ca.mime_type,
          s.fname AS sender_fname, s.lname AS sender_lname,
          r.fname AS receiver_fname, r.lname AS receiver_lname
         FROM asset_transfers ft
         LEFT JOIN clinic_assets ca ON ca.id = ft.asset_id
         LEFT JOIN users s ON s.id = ft.sender_id
         LEFT JOIN users r ON r.id = ft.receiver_id
         WHERE ft.id = ?
         LIMIT 1`,
        [transferId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error in Asset.findTransferById:", error);
      return null;
    }
  },

  updateTransferStatus: async (transferId, status) => {
    try {
      const nowUtc = new Date().toISOString().slice(0, 19).replace("T", " ");
      const [result] = await db_connection.execute(
        `UPDATE asset_transfers SET status = ?, received_at = ? WHERE id = ?`,
        [status, nowUtc, transferId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in Asset.updateTransferStatus:", error);
      return false;
    }
  },

  findTransfersByReceiver: async (userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT ft.*,
          ca.file_url, ca.file_original_name, ca.mime_type, ca.file_size,
          s.fname AS sender_fname, s.lname AS sender_lname
         FROM asset_transfers ft
         LEFT JOIN clinic_assets ca ON ca.id = ft.asset_id
         LEFT JOIN users s ON s.id = ft.sender_id
         WHERE ft.receiver_id = ?
         ORDER BY ft.created_at DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      console.error("Error in Asset.findTransfersByReceiver:", error);
      return [];
    }
  },
};

module.exports = Asset;