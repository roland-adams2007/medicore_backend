const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const BranchUser = require("../models/branch_user.model.js");
const Clinic = require("../models/clinic.model.js");
const Branch = require("../models/branch.model.js");
const crypto = require("crypto");
const emailQueue = require("../services/queues/email.queue.js");
const { checkEmailRateLimit } = require("../utils/emailRateLimit.js");
const Role = require("../models/role.model.js");
const generateToken = require("../utils/generateToken.js");

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

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

  res.status(200);
  responseHandler(res, { invite });
});

const setupStaffProfile = asyncHandler(async function (req, res) {
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

  if (!invite.invited_user_id) {
    res.status(400);
    throw new Error("No user account is linked to this invitation email.");
  }

  const {
    staff_id,
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
    staff_id,
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
    message: result.updated
      ? "Staff profile updated."
      : "Staff profile created.",
    staff_profile_id: result.id,
  });
});

const resendInvite = asyncHandler(async function (req, res) {
  const inviteId = parseInt(req.params.inviteId, 10);
  const userId = req.user?.id;
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

  if (!inviteId) {
    res.status(400);
    throw new Error("Invite ID is required.");
  }

  // --- Rate limit per invite resend ---
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

  // --- Generate new token and expiry ---
  const rawToken = generateToken();
  const tokenHash = sha256(rawToken);
  const nowUtc = new Date();
  const expiresAt = new Date(nowUtc.getTime() + 48 * 60 * 60 * 1000);
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace("T", " ");

  await BranchUser.updateInviteToken(tokenHash, expiresAtStr, inviteId);

  // --- Fetch additional data for email (if needed) ---
  const clinic = await Clinic.findById(invite.clinic_id);
  const branch = await Branch.findById(invite.branch_id);
  const role = await Role.findById(invite.role_id);

  // --- Queue invite email ---
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
  resendInvite,
};
