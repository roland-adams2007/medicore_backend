const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const Clinic = require("../models/clinic.model.js");
const Branch = require("../models/branch.model.js");
const BranchUser = require("../models/branch_user.model.js");
const crypto = require("crypto");
const emailQueue = require("../services/queues/email.queue.js");
const { checkEmailRateLimit } = require("../utils/emailRateLimit.js");
const Role = require("../models/role.model.js");
const generateToken = require("../utils/generateToken.js");

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const addStaff = asyncHandler(async function (req, res) {
  const { email } = req.body;
});

const getStaffs = asyncHandler(async function (req, res) {});

const getStaff = asyncHandler(async function (req, res) {});

const inviteStaff = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const clinicId = parseInt(req.params.clinicId, 10);
  const { email, branch_id, role_id } = req.body;
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

  // --- Validation ---
  if (!email || !branch_id || !role_id) {
    res.status(400);
    throw new Error("email, branch_id, and role_id are required.");
  }

  // Cannot invite yourself
  if (email.toLowerCase() === req.user?.email?.toLowerCase()) {
    res.status(400);
    throw new Error("You cannot invite yourself.");
  }

  // --- Rate limit per email ---
  const rl = await checkEmailRateLimit(
    `${email}:INVITE_STAFF`,
    ipAddress,
    5,
    60,
  );
  if (!rl.allowed) {
    res.status(429);
    throw new Error("Too many invite attempts. Please try again later.");
  }

  // --- Clinic exists (already guaranteed by checkRolePermission middleware,
  //     but we need the record for the email payload below) ---
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    res.status(404);
    throw new Error("Clinic not found.");
  }

  // NOTE: role/membership check is now handled upstream by:
  //   checkRolePermission("staff.invite")
  // No need to re-check requesterRole here.

  // --- Duplicate checks ---
  const existingMember = await BranchUser.findByEmailAndBranch(
    email,
    branch_id,
  );
  if (existingMember) {
    res.status(409);
    throw new Error("This user is already a member of this branch.");
  }

  const existingInvite = await BranchUser.findPending(email, branch_id);
  if (existingInvite) {
    res.status(409);
    throw new Error(
      "A pending invite already exists for this email and branch.",
    );
  }

  // --- Fetch branch + role for email payload ---
  const branch = await Branch.findById(branch_id);
  const role = await Role.findById(role_id);

  // --- Generate invite token ---
  const rawToken = generateToken();
  const tokenHash = sha256(rawToken);
  const nowUtc = new Date();
  const expiresAt = new Date(nowUtc.getTime() + 48 * 60 * 60 * 1000);
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace("T", " ");
  const nowStr = nowUtc.toISOString().slice(0, 19).replace("T", " ");

  // --- Persist invite ---
  const inviteId = await BranchUser.invite({
    branch_id,
    clinic_id: clinicId,
    email,
    role_id,
    invited_by: userId,
    token: tokenHash,
    status: "pending",
    expires_at: expiresAtStr,
    created_at: nowStr,
  });

  if (!inviteId) {
    res.status(500);
    throw new Error("Failed to create invite.");
  }

  // --- Queue invite email ---
  await emailQueue.add("sendEmail", {
    type: "INVITE_STAFF",
    payload: {
      to: email,
      token: rawToken,
      clinicName: clinic.name,
      branchName: branch?.name || null,
      roleName: role?.name || "Staff Member",
      inviterName: req.user?.fname || "Your clinic admin",
    },
  });

  res.status(200);
  responseHandler(res, null, "Invite sent successfully.");
});

const acceptStaffInvite = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("Invite token is required.");
  }
  const tokenHash = sha256(token);

  const invite = await BranchUser.findInviteTokenByToken(tokenHash);

  if (!invite) {
    res.status(404);
    throw new Error("Invite not found or has already been used.");
  }

  // Wrong user trying to accept
  if (invite.email.toLowerCase() !== req.user?.email?.toLowerCase()) {
    res.status(403);
    throw new Error("This invite was sent to a different email address.");
  }

  if (invite.status !== "pending") {
    res.status(410);
    throw new Error(`This invite has already been ${invite.status}.`);
  }

  if (new Date(invite.expires_at) < new Date()) {
    await BranchUser.updateInviteTokenStatus(invite.id, "expired");
    res.status(410);
    throw new Error("This invite link has expired.");
  }

  const assigned = await BranchUser.create({
    branch_id: invite.branch_id,
    user_id: userId,
    role_id: invite.role_id,
  });

  if (!assigned) {
    res.status(500);
    throw new Error("Failed to add you to the branch.");
  }

  await BranchUser.updateInviteTokenStatus(invite.id, "accepted");

  res.status(200);
  responseHandler(res, null, "Invite accepted successfully.");
});

const rejectStaffInvite = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("Invite token is required.");
  }

  const tokenHash = sha256(token);

  const invite = await BranchUser.findInviteTokenByToken(tokenHash);

  if (!invite) {
    res.status(404);
    throw new Error("Invite not found or has already been used.");
  }

  if (invite.email.toLowerCase() !== req.user?.email?.toLowerCase()) {
    res.status(403);
    throw new Error("This invite was sent to a different email address.");
  }

  if (invite.status !== "pending") {
    res.status(410);
    throw new Error(`This invite has already been ${invite.status}.`);
  }

  if (new Date(invite.expires_at) < new Date()) {
    await BranchUser.updateInviteTokenStatus(invite.id, "expired");
    res.status(410);
    throw new Error("This invite link has expired.");
  }

  await BranchUser.updateInviteTokenStatus(invite.id, "declined");

  res.status(200);
  responseHandler(res, null, "Invite declined.");
});

const staffInviteLookup = asyncHandler(async function (req, res) {
  const { token } = req.query;
  if (!token) {
    res.status(400);
    throw new Error("Invite token is required.");
  }
  const tokenHash = sha256(token);

  const invite = await BranchUser.findInviteTokenByToken(tokenHash);

  if (!invite) {
    res.status(400);
    throw new Error("Invite not found or has already been used.");
  }

  if (invite.status !== "pending") {
    res.status(400);
    throw new Error(`This invite has already been ${invite.status}.`);
  }

  if (new Date(invite.expires_at) < new Date()) {
    await BranchUser.updateInviteTokenStatus(invite.id, "expired");
    res.status(400);
    throw new Error("This invite link has expired.");
  }

  res.status(200);
  responseHandler(res, {
    email: invite.email,
    clinic_name: invite.clinic_name,
    branch_name: invite.branch_name,
    role_name: invite.role_name,
    invited_by: invite.invited_by_name,
    expires_at: invite.expires_at,
  });
});

module.exports = {
  inviteStaff,
  staffInviteLookup,
  acceptStaffInvite,
  rejectStaffInvite,
};
