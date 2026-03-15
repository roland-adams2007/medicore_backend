const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const generateUUID = require("../utils/generateUUID.js");
const Patient = require("../models/patient.model");

function randomString(length = 3) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const createPatient = asyncHandler(async function (req, res) {
  try {
    const userId = req.user?.id;
    const clinicId = parseInt(req.params.clinicId, 10);
    const branchId = parseInt(req.params.branchId, 10);
    const {
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
      department_id,
      createPortal,
    } = req.body;
    const nowUtc = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (!first_name) {
      res.status(400);
      throw new Error("First name is required.");
    }

    if (!last_name) {
      res.status(400);
      throw new Error("Last name is required.");
    }

    if (!gender) {
      res.status(400);
      throw new Error("Gender is required.");
    }

    if (!date_of_birth) {
      res.status(400);
      throw new Error("Date of birth is required.");
    }

    if (email) {
      const existingPatient = await Patient.findPatientByEmail(email);
      if (
        existingPatient &&
        Number(existingPatient.clinic_id) === Number(clinicId)
      ) {
        res.status(400);
        throw new Error("A patient with this email already exists.");
      }
    }

    const patientCode = `${clinicId.toString().padStart(2, "0")}${first_name[0].toUpperCase()}${last_name[0].toUpperCase()}${randomString()}`;
    const patientData = {
      uuid: generateUUID(),
      clinic_id: clinicId,
      branch_id: branchId,
      patient_code: patientCode,
      first_name,
      last_name,
      middle_name,
      phone,
      email,
      alt_phone,
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
      registered_by: userId,
      created_at: nowUtc,
    };

    const newPatient = await Patient.create(patientData);
    if (!newPatient) {
      res.status(500);
      throw new Error("Could not create patient. Please try again.");
    }

    const addUserToDept = await Patient.addUserToDeptment({
      patient_id: newPatient,
      department_id,
      assigned_at: nowUtc,
    });
    if (!addUserToDept) {
      res.status(500);
      throw new Error("Patient created but department assignment failed.");
    }

    if (createPortal === true && email) {
      const password_hash = await bcrypt.hash(password, 10);
      const portalCreated = await Patient.createPortal({
        patient_id: newPatient,
        email,
        password_hash,
        is_active: 1,
        created_by: userId,
        created_at: nowUtc,
      });

      if (!portalCreated) {
        res.status(500);
        throw new Error("Patient created but portal setup failed.");
      }

      return responseHandler(
        res,
        null,
        "Patient registered and portal created successfully.",
      );
    }

    return responseHandler(res, null, "Patient registered successfully.");
  } catch (error) {
    res.status(500);
    throw new Error("Failed to create Patient");
  }
});

module.exports = { createPatient };
