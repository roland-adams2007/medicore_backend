const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const Clinic = require("../models/clinic.model.js");
const Branch = require("../models/branch.model.js");
const BranchUser = require("../models/branch_user.model.js");
const crypto = require("crypto");
const emailQueue = require("../services/queues/email.queue.js");
const { checkEmailRateLimit } = require("../utils/emailRateLimit.js");
const Role = require("../models/role.model.js");

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

  if (!email || !branch_id || !role_id) {
    res.status(400);
    throw new Error("email, branch_id, and role_id are required.");
  }

  // Cannot invite yourself
  if (email.toLowerCase() === req.user?.email?.toLowerCase()) {
    res.status(400);
    throw new Error("You cannot invite yourself.");
  }

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

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    res.status(404);
    throw new Error("Clinic not found.");
  }

  const requesterRole = await BranchUser.findUserRole(branch_id, userId);
  if (!requesterRole && clinic.owner_id !== userId) {
    res.status(403);
    throw new Error(
      "You do not have permission to invite staff to this branch.",
    );
  }

  // Cannot invite someone already in this branch
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

  const branch = await Branch.findById(branch_id);
  const role = await Role.findById(role_id);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const nowUtc = new Date();
  const expiresAt = new Date(nowUtc.getTime() + 48 * 60 * 60 * 1000);
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace("T", " ");
  const nowStr = nowUtc.toISOString().slice(0, 19).replace("T", " ");

  const inviteId = await BranchUser.create({
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

const acceptStaffInvite = asyncHandler(async function (req, res) {});
const rejectStaffInvite = asyncHandler(async function (req, res) {});

module.exports = { inviteStaff };
