const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const BranchUser = require("../models/branch_user.model.js");
const Role = require("../models/role.model.js");
const Clinic = require("../models/clinic.model.js");
const Branch = require("../models/branch.model.js");
const crypto = require("crypto");
const emailQueue = require("../services/queues/email.queue.js");
const { checkEmailRateLimit } = require("../utils/emailRateLimit.js");
const generateToken = require("../utils/generateToken.js");

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const getActorRoleInClinic = async (userId, clinicId) => {
  return await BranchUser.findUserRoleInClinic(clinicId, userId);
};

const getInviteForSetup = asyncHandler(async function (req, res) {
  const inviteId = parseInt(req.params.inviteId, 10);

  if (!inviteId) {
    res.status(400);
    throw new Error("Invite ID is required.");
  }

  const invite = await BranchUser.findInviteById(inviteId);

  if (!invite) {
    res.status(404);
    throw new Error("Invitation not found.");
  }

  if (invite.status !== "accepted") {
    res.status(403);
    throw new Error(
      "Only accepted invitations can be used to set up a profile.",
    );
  }

  if (invite.staff_profile_id) {
    res.status(400);
    throw new Error(
      "This invitation already has a profile set up. Use the edit page instead.",
    );
  }

  res.status(200);
  responseHandler(res, { invite });
});

const setupStaffProfile = asyncHandler(async function (req, res) {
  const inviteId = parseInt(req.params.inviteId, 10);
  const actorId = req.user?.id;

  if (!inviteId) {
    res.status(400);
    throw new Error("Invite ID is required.");
  }

  const invite = await BranchUser.findInviteById(inviteId);

  if (!invite) {
    res.status(404);
    throw new Error("Invitation not found.");
  }

  if (invite.status !== "accepted") {
    res.status(403);
    throw new Error(
      "Only accepted invitations can be used to set up a profile.",
    );
  }

  if (invite.staff_profile_id) {
    res.status(400);
    throw new Error("Profile already set up. Use the edit endpoint instead.");
  }

  if (!invite.invited_user_id) {
    res.status(400);
    throw new Error("No user account is linked to this invitation email.");
  }

  const actorRole = await getActorRoleInClinic(actorId, invite.clinic_id);
  if (!actorRole) {
    res.status(403);
    throw new Error("You do not have a role in this clinic.");
  }

  const canManage = await Role.canActorManageTarget(
    actorRole.role_id,
    invite.role_id,
  );
  if (!canManage) {
    res.status(403);
    throw new Error(
      "You cannot set up a profile for a staff member with an equal or higher role.",
    );
  }

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
  } = req.body;

  const result = await BranchUser.createStaffProfile({
    user_id: invite.invited_user_id,
    clinic_id: invite.clinic_id,
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
  });

  if (!result) {
    res.status(500);
    throw new Error("Failed to save staff profile.");
  }

  res.status(200);
  responseHandler(res, {
    message: "Staff profile created.",
    staff_profile_id: result.id,
    staff_id: result.staff_id,
  });
});

const getStaffProfileForEdit = asyncHandler(async function (req, res) {
  const staffProfileId = parseInt(req.params.staffId, 10);
  const clinicId = parseInt(req.params.clinicId, 10);

  if (!staffProfileId) {
    res.status(400);
    throw new Error("Staff ID is required.");
  }

  const profile = await BranchUser.findStaffProfileById(
    staffProfileId,
    clinicId,
  );

  if (!profile) {
    res.status(404);
    throw new Error("Staff profile not found.");
  }

  res.status(200);
  responseHandler(res, { profile });
});

const updateStaffProfile = asyncHandler(async function (req, res) {
  const staffProfileId = parseInt(req.params.staffId, 10);
  const clinicId = parseInt(req.params.clinicId, 10);
  const actorId = req.user?.id;

  if (!staffProfileId) {
    res.status(400);
    throw new Error("Staff ID is required.");
  }

  const profile = await BranchUser.findStaffProfileById(
    staffProfileId,
    clinicId,
  );

  if (!profile) {
    res.status(404);
    throw new Error("Staff profile not found.");
  }

  const actorRole = await getActorRoleInClinic(actorId, clinicId);
  responseHandler(res, { actorRole, actorId, clinicId }, "JII", 403);
  return;
  if (!actorRole) {
    res.status(403);
    throw new Error("You do not have a role in this clinic.");
  }

  if (profile.role_id) {
    const canManage = await Role.canActorManageTarget(
      actorRole.role_id,
      profile.role_id,
    );
    if (!canManage) {
      res.status(403);
      throw new Error(
        "You cannot edit a staff member with an equal or higher role.",
      );
    }
  }

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
    new_role_id,
  } = req.body;

  if (new_role_id && new_role_id !== profile.role_id) {
    const canAssignNewRole = await Role.canActorManageTarget(
      actorRole.role_id,
      parseInt(new_role_id, 10),
    );
    if (!canAssignNewRole) {
      res.status(403);
      throw new Error("You cannot assign a role equal to or above your own.");
    }

    if (profile.branch_id) {
      await BranchUser.updateStaffRole(
        profile.user_id,
        profile.branch_id,
        new_role_id,
      );
    }
  }

  const result = await BranchUser.updateStaffProfile(staffProfileId, clinicId, {
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
  });

  if (!result) {
    res.status(500);
    throw new Error("Failed to update staff profile.");
  }

  res.status(200);
  responseHandler(res, {
    message: "Staff profile updated.",
    staff_profile_id: staffProfileId,
  });
});

const getClinicStaff = asyncHandler(async function (req, res) {
  const clinicId = parseInt(req.params.clinicId, 10);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const search = req.query.search?.trim() || null;
  const roleId = req.query.role_id ? parseInt(req.query.role_id, 10) : null;
  const status = req.query.status || null;
  const offset = (page - 1) * limit;

  const { staff, total } = await BranchUser.findStaffByClinic({
    clinicId,
    search,
    roleId,
    status,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);

  res.status(200);
  responseHandler(res, {
    staff,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      lastPage: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
});

const resendInvite = asyncHandler(async function (req, res) {
  const inviteId = parseInt(req.params.inviteId, 10);
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

  if (!inviteId) {
    res.status(400);
    throw new Error("Invite ID is required.");
  }

  const rl = await checkEmailRateLimit(`resend:${inviteId}`, ipAddress, 3, 60);
  if (!rl.allowed) {
    res.status(429);
    throw new Error("Too many resend attempts. Please try again later.");
  }

  const invite = await BranchUser.findInviteById(inviteId);

  if (!invite) {
    res.status(404);
    throw new Error("Invitation not found.");
  }

  if (invite.status === "accepted") {
    res.status(400);
    throw new Error("This invitation has already been accepted.");
  }

  if (invite.status === "declined") {
    res.status(400);
    throw new Error("This invitation was declined and cannot be resent.");
  }

  const rawToken = generateToken();
  const tokenHash = sha256(rawToken);
  const nowUtc = new Date();
  const expiresAt = new Date(nowUtc.getTime() + 48 * 60 * 60 * 1000);
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace("T", " ");

  await BranchUser.updateInviteToken(tokenHash, expiresAtStr, inviteId);

  const clinic = await Clinic.findById(invite.clinic_id);
  const branch = await Branch.findById(invite.branch_id);
  const role = await Role.findById(invite.role_id);

  await emailQueue.add("sendEmail", {
    type: "INVITE_STAFF",
    payload: {
      to: invite.email,
      token: rawToken,
      clinicName: clinic?.name || invite.clinic_name,
      branchName: branch?.name || invite.branch_name,
      roleName: role?.name || invite.role_name || "Staff Member",
      inviterName: req.user?.fname || "Your clinic admin",
    },
  });

  res.status(200);
  responseHandler(res, { message: "Invitation resent successfully." });
});

module.exports = {
  getInviteForSetup,
  setupStaffProfile,
  getStaffProfileForEdit,
  updateStaffProfile,
  getClinicStaff,
  resendInvite,
};
