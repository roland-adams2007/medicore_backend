const { db_connection } = require("../config/config.inc");

const generateStaffId = async (clinicId) => {
  const prefix = `STF-${clinicId}-`;
  const [rows] = await db_connection.execute(
    `SELECT staff_id FROM staff_profiles WHERE clinic_id = ? AND staff_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [clinicId, `${prefix}%`],
  );

  if (rows.length === 0) {
    return `${prefix}001`;
  }

  const last = rows[0].staff_id;
  const num = parseInt(last.replace(prefix, ""), 10);
  const next = isNaN(num) ? 1 : num + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};

const BranchUser = {
  findUserRoleWithPermissions: async (branchId, userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT
            bu.id, bu.branch_id, bu.user_id, bu.role_id,
            r.name AS role_name,
            r.parent_id AS role_parent_id,
            COALESCE(JSON_ARRAYAGG(p.name ORDER BY p.name), JSON_ARRAY()) AS permissions
         FROM branch_users bu
         JOIN roles r ON bu.role_id = r.id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE bu.branch_id = ? AND bu.user_id = ?
         GROUP BY bu.id, bu.branch_id, bu.user_id, bu.role_id, r.name, r.parent_id
         LIMIT 1`,
        [branchId, userId],
      );
      if (!rows[0]) return null;
      const row = rows[0];
      row.permissions =
        typeof row.permissions === "string"
          ? JSON.parse(row.permissions)
          : (row.permissions ?? []);
      return row;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  findUserRole: async (branchId, userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT bu.id, bu.branch_id, bu.user_id, bu.role_id, r.name AS role_name, r.parent_id AS role_parent_id
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

  findUserRoleInClinic: async (clinicId, userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT bu.role_id, r.name AS role_name, r.parent_id AS role_parent_id
         FROM branch_users bu
         JOIN branches b ON b.id = bu.branch_id AND b.clinic_id = ?
         JOIN roles r ON r.id = bu.role_id
         WHERE bu.user_id = ?
         ORDER BY r.parent_id ASC
         LIMIT 1`,
        [clinicId, userId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
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
          c.name AS clinic_name,
          b.name AS branch_name,
          r.name AS role_name,
          CONCAT(u.fname, ' ', u.lname) AS invited_by_name
         FROM branch_user_invites i
         JOIN clinics  c ON i.clinic_id = c.id
         JOIN branches b ON i.branch_id = b.id
         JOIN roles    r ON i.role_id   = r.id
         JOIN users    u ON i.invited_by = u.id
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

  findInviteById: async (inviteId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT
          bui.id,
          bui.email,
          bui.status,
          bui.expires_at,
          bui.accepted_at,
          bui.created_at,
          bui.branch_id,
          bui.clinic_id,
          bui.role_id,
          bui.invited_by,

          r.name  AS role_name,
          r.parent_id AS role_parent_id,

          u.id    AS invited_by_user_id,
          u.fname AS invited_by_fname,
          u.lname AS invited_by_lname,

          c.name  AS clinic_name,
          b.name  AS branch_name,

          iu.id   AS invited_user_id,
          sp.id   AS staff_profile_id

        FROM branch_user_invites bui
        LEFT JOIN roles    r  ON r.id  = bui.role_id
        LEFT JOIN users    u  ON u.id  = bui.invited_by
        LEFT JOIN clinics  c  ON c.id  = bui.clinic_id
        LEFT JOIN branches b  ON b.id  = bui.branch_id
        LEFT JOIN users    iu ON iu.email = bui.email
        LEFT JOIN staff_profiles sp ON sp.user_id = iu.id AND sp.clinic_id = bui.clinic_id
        WHERE bui.id = ?
        LIMIT 1`,
        [inviteId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error in findInviteById:", error);
      return null;
    }
  },

  findStaffProfileById: async (staffProfileId, clinicId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT
          sp.*,
          u.fname,
          u.lname,
          u.email,
          u.id AS user_id,
          r.id AS role_id,
          r.name AS role_name,
          r.parent_id AS role_parent_id,
          bu.branch_id,
          b.name AS branch_name,
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('id', d.id, 'name', d.name))
            FROM staff_departments sd
            JOIN departments d ON d.id = sd.department_id
            WHERE sd.staff_profile_id = sp.id
          ) AS departments
         FROM staff_profiles sp
         JOIN users u ON u.id = sp.user_id
         LEFT JOIN branch_users bu ON bu.user_id = sp.user_id
         LEFT JOIN branches b ON b.id = bu.branch_id AND b.clinic_id = ?
         LEFT JOIN roles r ON r.id = bu.role_id
         WHERE sp.id = ? AND sp.clinic_id = ?
         LIMIT 1`,
        [clinicId, staffProfileId, clinicId],
      );
      if (!rows[0]) return null;
      const row = rows[0];
      row.departments =
        typeof row.departments === "string"
          ? JSON.parse(row.departments)
          : (row.departments ?? []);
      row.departments = row.departments.filter(Boolean);
      return row;
    } catch (error) {
      console.error("Error in findStaffProfileById:", error);
      return null;
    }
  },

  syncStaffDepartments: async (staffProfileId, departmentIds) => {
    const conn = await db_connection.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `DELETE FROM staff_departments WHERE staff_profile_id = ?`,
        [staffProfileId],
      );

      if (Array.isArray(departmentIds) && departmentIds.length > 0) {
        const validIds = departmentIds
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id) && id > 0);

        if (validIds.length > 0) {
          const placeholders = validIds.map(() => "(?, ?)").join(", ");
          const values = validIds.flatMap((id) => [staffProfileId, id]);
          await conn.execute(
            `INSERT IGNORE INTO staff_departments (staff_profile_id, department_id) VALUES ${placeholders}`,
            values,
          );
        }
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Error in syncStaffDepartments:", error);
      return false;
    } finally {
      conn.release();
    }
  },

  updateStaffProfile: async (staffProfileId, clinicId, data) => {
    try {
      const {
        phone,
        alt_phone,
        gender,
        date_of_birth,
        profile_photo_url,
        address,
        city,
        state_id,
        date_joined,
        date_left,
        employment_type,
        salary,
        salary_frequency,
        specialization,
        license_number,
        license_expiry,
        qualification,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        notes,
        status,
      } = data;

      const [result] = await db_connection.execute(
        `UPDATE staff_profiles SET
          phone = ?,
          alt_phone = ?,
          gender = ?,
          date_of_birth = ?,
          profile_photo_url = ?,
          address = ?,
          city = ?,
          state_id = ?,
          date_joined = ?,
          date_left = ?,
          employment_type = ?,
          salary = ?,
          salary_frequency = ?,
          specialization = ?,
          license_number = ?,
          license_expiry = ?,
          qualification = ?,
          emergency_contact_name = ?,
          emergency_contact_phone = ?,
          emergency_contact_relationship = ?,
          notes = ?,
          status = ?,
          updated_at = NOW()
         WHERE id = ? AND clinic_id = ?`,
        [
          phone || null,
          alt_phone || null,
          gender || null,
          date_of_birth || null,
          profile_photo_url || null,
          address || null,
          city || null,
          state_id || null,
          date_joined || null,
          date_left || null,
          employment_type || null,
          salary || null,
          salary_frequency || "monthly",
          specialization || null,
          license_number || null,
          license_expiry || null,
          qualification || null,
          emergency_contact_name || null,
          emergency_contact_phone || null,
          emergency_contact_relationship || null,
          notes || null,
          status || "active",
          staffProfileId,
          clinicId,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in updateStaffProfile:", error);
      return false;
    }
  },

  updateStaffRole: async (userId, branchId, newRoleId) => {
    try {
      const [result] = await db_connection.execute(
        `UPDATE branch_users SET role_id = ? WHERE user_id = ? AND branch_id = ?`,
        [newRoleId, userId, branchId],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in updateStaffRole:", error);
      return false;
    }
  },

  updateInviteTokenStatus: async (inviteId, status) => {
    try {
      const [result] = await db_connection.execute(
        `UPDATE branch_user_invites SET status = ? WHERE id = ?`,
        [status, inviteId],
      );
      return result.affectedRows > 0;
    } catch (error) {
      return null;
    }
  },

  updateInviteToken: async (tokenHash, expiresAtStr, inviteId) => {
    try {
      const [result] = await db_connection.execute(
        `UPDATE branch_user_invites SET token = ?, status = 'pending', expires_at = ? WHERE id = ?`,
        [tokenHash, expiresAtStr, inviteId],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in updateInviteToken:", error);
      return false;
    }
  },

  create: async ({ branch_id, user_id, role_id }) => {
    try {
      const [result] = await db_connection.execute(
        `INSERT INTO branch_users (branch_id, user_id, role_id) VALUES (?, ?, ?)`,
        [branch_id, user_id, role_id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  createStaffProfile: async ({
    user_id,
    clinic_id,
    phone,
    alt_phone,
    gender,
    date_of_birth,
    profile_photo_url,
    address,
    city,
    state_id,
    date_joined,
    date_left,
    employment_type,
    salary,
    salary_frequency,
    specialization,
    license_number,
    license_expiry,
    qualification,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    notes,
  }) => {
    try {
      const [existing] = await db_connection.execute(
        `SELECT id FROM staff_profiles WHERE user_id = ? LIMIT 1`,
        [user_id],
      );

      if (existing.length > 0) {
        return { id: existing[0].id, already_exists: true };
      }

      const staff_id = await generateStaffId(clinic_id);

      const [result] = await db_connection.execute(
        `INSERT INTO staff_profiles (
          user_id, clinic_id, staff_id, phone, alt_phone, gender,
          date_of_birth, profile_photo_url, address, city, state_id,
          date_joined, date_left, employment_type, salary, salary_frequency,
          specialization, license_number, license_expiry, qualification,
          emergency_contact_name, emergency_contact_phone,
          emergency_contact_relationship, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          user_id,
          clinic_id,
          staff_id,
          phone || null,
          alt_phone || null,
          gender || null,
          date_of_birth || null,
          profile_photo_url || null,
          address || null,
          city || null,
          state_id || null,
          date_joined || null,
          date_left || null,
          employment_type || null,
          salary || null,
          salary_frequency || "monthly",
          specialization || null,
          license_number || null,
          license_expiry || null,
          qualification || null,
          emergency_contact_name || null,
          emergency_contact_phone || null,
          emergency_contact_relationship || null,
          notes || null,
        ],
      );
      return { id: result.insertId, staff_id, already_exists: false };
    } catch (error) {
      console.error("Error in createStaffProfile:", error);
      return null;
    }
  },

  findStaffByBranch: async ({
    clinicId,
    branchId,
    search = null,
    roleId = null,
    status = null,
    limit = 20,
    offset = 0,
  }) => {
    try {
      const params = [];
      const conditions = ["bu.branch_id = ?", "b.clinic_id = ?"];
      params.push(branchId, clinicId);

      if (search) {
        conditions.push(
          `(u.fname LIKE ? OR u.lname LIKE ? OR u.email LIKE ? OR sp.staff_id LIKE ?)`,
        );
        const like = `%${search}%`;
        params.push(like, like, like, like);
      }
      if (roleId) {
        conditions.push("bu.role_id = ?");
        params.push(roleId);
      }
      if (status) {
        conditions.push("sp.status = ?");
        params.push(status);
      }

      const where = conditions.join(" AND ");
      const countParams = [...params];
      const [[{ total }]] = await db_connection.execute(
        `SELECT COUNT(DISTINCT bu.id) AS total
         FROM branch_users bu
         JOIN branches b ON b.id = bu.branch_id
         JOIN users u ON u.id = bu.user_id
         LEFT JOIN staff_profiles sp ON sp.user_id = u.id
         WHERE ${where}`,
        countParams,
      );

      if (total === 0) return { staff: [], total: 0 };

      const dataParams = [...params, limit, offset];
      const [rows] = await db_connection.execute(
        `SELECT
          bu.id AS branch_user_id,
          u.id AS user_id,
          u.uuid AS user_uuid,
          u.fname, u.lname, u.email, u.is_active,
          r.id AS role_id,
          r.name AS role_name,
          r.parent_id AS role_parent_id,
          sp.id AS staff_profile_id,
          sp.staff_id,
          sp.phone,
          sp.gender,
          sp.profile_photo_url,
          sp.employment_type,
          sp.status AS staff_status,
          sp.specialization,
          sp.date_joined,
          bu.assigned_at,
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('id', d.id, 'name', d.name))
            FROM staff_departments sd2
            LEFT JOIN departments d ON d.id = sd2.department_id
            WHERE sd2.staff_profile_id = sp.id AND d.branch_id = bu.branch_id
          ) AS departments
         FROM branch_users bu
         LEFT JOIN branches b ON b.id = bu.branch_id
         LEFT JOIN users u ON u.id = bu.user_id
         LEFT JOIN roles r ON r.id = bu.role_id
         LEFT JOIN staff_profiles sp ON sp.user_id = u.id
         WHERE ${where}
         GROUP BY bu.id
         ORDER BY u.fname ASC, u.lname ASC
         LIMIT ? OFFSET ?`,
        dataParams,
      );

      const staff = rows.map((row) => ({
        ...row,
        departments:
          typeof row.departments === "string"
            ? JSON.parse(row.departments)
            : (row.departments ?? []),
      }));

      return { staff, total };
    } catch (error) {
      console.error(error);
      return { staff: [], total: 0 };
    }
  },

  findStaffByClinic: async ({
    clinicId,
    search = null,
    roleId = null,
    status = null,
    limit = 20,
    offset = 0,
  }) => {
    try {
      const params = [clinicId];
      const conditions = ["sp.clinic_id = ?"];

      if (search) {
        conditions.push(
          `(u.fname LIKE ? OR u.lname LIKE ? OR u.email LIKE ? OR sp.staff_id LIKE ?)`,
        );
        const like = `%${search}%`;
        params.push(like, like, like, like);
      }
      if (roleId) {
        conditions.push("bu.role_id = ?");
        params.push(roleId);
      }
      if (status) {
        conditions.push("sp.status = ?");
        params.push(status);
      }

      const where = conditions.join(" AND ");
      const countParams = [...params];

      const [[{ total }]] = await db_connection.execute(
        `SELECT COUNT(DISTINCT sp.id) AS total
         FROM staff_profiles sp
         JOIN users u ON u.id = sp.user_id
         LEFT JOIN branch_users bu ON bu.user_id = sp.user_id
         LEFT JOIN branches b ON b.id = bu.branch_id AND b.clinic_id = ?
         WHERE ${where}`,
        [clinicId, ...countParams],
      );

      if (total === 0) return { staff: [], total: 0 };

      const dataParams = [...params, clinicId, limit, offset];
      const [rows] = await db_connection.execute(
        `SELECT
          sp.id AS staff_profile_id,
          sp.staff_id,
          sp.phone,
          sp.gender,
          sp.profile_photo_url,
          sp.employment_type,
          sp.status AS staff_status,
          sp.specialization,
          sp.date_joined,
          u.id AS user_id,
          u.uuid AS user_uuid,
          u.fname, u.lname, u.email, u.is_active,
          bu.id AS branch_user_id,
          bu.branch_id,
          b.name AS branch_name,
          r.id AS role_id,
          r.name AS role_name,
          r.parent_id AS role_parent_id,
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('id', d.id, 'name', d.name))
            FROM staff_departments sd
            JOIN departments d ON d.id = sd.department_id
            WHERE sd.staff_profile_id = sp.id
          ) AS departments
         FROM staff_profiles sp
         JOIN users u ON u.id = sp.user_id
         LEFT JOIN branch_users bu ON bu.user_id = sp.user_id
         LEFT JOIN branches b ON b.id = bu.branch_id AND b.clinic_id = ?
         LEFT JOIN roles r ON r.id = bu.role_id
         WHERE ${where}
         GROUP BY sp.id
         ORDER BY u.fname ASC, u.lname ASC
         LIMIT ? OFFSET ?`,
        dataParams,
      );

      const staff = rows.map((row) => ({
        ...row,
        departments:
          typeof row.departments === "string"
            ? JSON.parse(row.departments)
            : (row.departments ?? []),
        departments_clean: undefined,
      }));

      return { staff, total };
    } catch (error) {
      console.error("Error in findStaffByClinic:", error);
      return { staff: [], total: 0 };
    }
  },

  invite: async ({
    branch_id,
    clinic_id,
    email,
    role_id,
    invited_by,
    token,
    status,
    expires_at,
    created_at,
  }) => {
    try {
      const [result] = await db_connection.execute(
        `INSERT INTO branch_user_invites
         (branch_id, clinic_id, email, role_id, invited_by, token, status, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          branch_id,
          clinic_id,
          email,
          role_id,
          invited_by,
          token,
          status,
          expires_at,
          created_at,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating branch user invite:", error);
      return null;
    }
  },

  findStaffInviteByClinicAndBranch: async ({
    branchId,
    clinicId,
    search = null,
    roleId = null,
    status = null,
    limit = 20,
    offset = 0,
  }) => {
    try {
      const params = [];
      const conditions = ["bui.clinic_id = ?", "bui.branch_id = ?"];
      params.push(clinicId, branchId);

      if (search) {
        conditions.push(
          `(bui.email LIKE ? OR u.fname LIKE ? OR u.lname LIKE ?)`,
        );
        const like = `%${search}%`;
        params.push(like, like, like);
      }
      if (roleId) {
        conditions.push("bui.role_id = ?");
        params.push(roleId);
      }
      if (status) {
        conditions.push("bui.status = ?");
        params.push(status);
      }

      const where = conditions.join(" AND ");
      const countParams = [...params];

      const [[{ total }]] = await db_connection.execute(
        `SELECT COUNT(DISTINCT bui.id) AS total
         FROM branch_user_invites bui
         LEFT JOIN users u ON bui.invited_by = u.id
         LEFT JOIN roles r ON bui.role_id = r.id
         WHERE ${where}`,
        countParams,
      );

      if (total === 0) return { staffInvites: [], total: 0 };

      const dataParams = [...params, limit.toString(), offset.toString()];
      const [rows] = await db_connection.execute(
        `SELECT
          bui.id,
          bui.email,
          bui.status,
          bui.expires_at,
          bui.accepted_at,
          bui.created_at,
          bui.invited_by,

          r.id   AS role_id,
          r.name AS role_name,
          r.parent_id AS role_parent_id,

          u.id    AS invited_by_user_id,
          u.fname AS invited_by_fname,
          u.lname AS invited_by_lname,

          iu.id   AS invited_user_id,
          sp.id   AS staff_profile_id

         FROM branch_user_invites bui
         LEFT JOIN users u  ON u.id  = bui.invited_by
         LEFT JOIN roles r  ON r.id  = bui.role_id
         LEFT JOIN users iu ON iu.email = bui.email
         LEFT JOIN staff_profiles sp ON sp.user_id = iu.id AND sp.clinic_id = bui.clinic_id
         WHERE ${where}
         ORDER BY bui.created_at DESC
         LIMIT ? OFFSET ?`,
        dataParams,
      );

      return { staffInvites: rows || [], total };
    } catch (error) {
      console.error("Error in findStaffInviteByClinicAndBranch:", error);
      return { staffInvites: [], total: 0 };
    }
  },

  findUserRolesAcrossClinic: async (clinicId, userId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT bu.branch_id, bu.role_id, r.name AS role_name, b.name AS branch_name
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