const { db_connection } = require("../config/config.inc");

const Patient = {
  findPatientByEmail: async (email) => {
    try {
      const rows = await db_connection.execute(
        "SELECT * FROM patients WHERE email = ? LIMIT 1",
        [email],
      );
      return rows[0] || null;
    } catch (error) {
      return null;
    }
  },
  findPatientById: async (id) => {
    try {
      const rows = await db_connection.execute(
        "SELECT * FROM patients WHERE id = ? LIMIT 1",
        [id],
      );
      return rows[0] || null;
    } catch (error) {
      return null;
    }
  },
  findPatientByCode: async (patientCode) => {
    try {
      const rows = await db_connection.execute(
        "SELECT * FROM patients WHERE patient_code = ? LIMIT 1",
        [patientCode],
      );
      return rows[0] || null;
    } catch (error) {
      return null;
    }
  },
  create: async (patientData) => {
    try {
      const {
        uuid,
        clinic_id,
        branch_id,
        patient_code,
        first_name,
        last_name,
        middle_name,
        gender,
        date_of_birth,
        phone,
        alt_phone,
        email,
        profile_photo_url,
        address,
        city,
        state_id,
        blood_group,
        genotype,
        allergies,
        chronic_conditions,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        status,
        registered_by,
        created_at,
      } = patientData;

      const [result] = await db_connection.execute(
        `INSERT INTO patients (uuid,clinic_id,branch_id,patient_code,first_name,last_name,middle_name,gender,date_of_birth,phone,alt_phone,email,profile_photo_url,address,city,state_id,blood_group,genotype,allergies,chronic_conditions,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship,status,registered_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          uuid,
          clinic_id,
          branch_id,
          patient_code,
          first_name,
          last_name,
          middle_name,
          gender,
          date_of_birth,
          phone,
          alt_phone,
          email,
          profile_photo_url,
          address,
          city,
          state_id,
          blood_group,
          genotype,
          allergies,
          chronic_conditions,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          status,
          registered_by,
          created_at,
        ],
      );
      return result.insertId;
    } catch (error) {
      return null;
    }
  },
  addUserToDeptment: async (deptData) => {
    try {
      const { patient_id, department_id, assigned_at } = deptData;
      const [result] = await db_connection.execute(
        `INSERT INTO patient_departments(patient_id,department_id,assigned_atI) VALUES(?,?,?)`,
        [patient_id, department_id, assigned_at],
      );
      return result.insertId;
    } catch (error) {
      return null;
    }
  },
  createPortal: async (portalData) => {
    try {
      const {
        patient_id,
        email,
        password_hash,
        is_active,
        created_by,
        created_at,
      } = portalData;

      const [result] = await db_connection.execute(
        `INSERT INTO patient_portal_accounts (patient_id,email,password_hash,is_active,created_by,created_at)  VALUES(?,?,?,?,?,?)`,
        [patient_id, email, password_hash, is_active, created_by, created_at],
      );
      return result.insertId;
    } catch (error) {
      return null;
    }
  },
};

module.exports = Patient;
