const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const Clinic = require("../models/clinic.model.js");
const Branch = require("../models/branch.model.js");
const BranchUser = require("../models/branch_user.model.js");
const Subscription = require("../models/subscription.model.js");
const generateUUID = require("../utils/generateUUID.js");

const getClinics = asyncHandler(async function (req, res) {
  const userId = req.user?.id;

  const ownedClinics = await Clinic.findForUser(userId);
  const memberClinics = await Clinic.findForBranchMember(userId);

  // merge, deduplicate — owned takes priority
  const allClinicMap = new Map();
  for (const c of ownedClinics) allClinicMap.set(c.id, { ...c, _isOwner: true });
  for (const c of memberClinics) {
    if (!allClinicMap.has(c.id)) allClinicMap.set(c.id, { ...c, _isOwner: false });
  }

  const clinics = await Promise.all(
    Array.from(allClinicMap.values()).map(async (clinic) => {
      const branches = await Branch.findForClinic(clinic.id);

      let role = null;
      let roles = [];

      if (clinic._isOwner) {
        role = "owner";
        roles = ["owner"];
      } else {
        const branchRoles = await BranchUser.findUserRolesAcrossClinic(clinic.id, userId);
        roles = [...new Set(branchRoles.map((r) => r.role_name))];
        role = roles[0] ?? null;
      }

      const { _isOwner, ...clinicData } = clinic;
      return { ...clinicData, branches, role, roles };
    }),
  );

  res.status(200);
  responseHandler(res, { clinics });
});

const getClinic = asyncHandler(async function (req, res) {
  const clinicId = req.params.clinicId;
  const userId = req.user?.id;

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    res.status(404);
    throw new Error("Clinic not found");
  }

  clinic.branches = await Branch.findForClinic(clinicId);

  if (clinic.owner_id === userId) {
    clinic.role = "owner";
    clinic.roles = ["owner"];
  } else {
    const branchRoles = await BranchUser.findUserRolesAcrossClinic(clinicId, userId);
    clinic.roles = [...new Set(branchRoles.map((r) => r.role_name))];
    clinic.role = clinic.roles[0] ?? null;
    if (!clinic.role) {
      res.status(403);
      throw new Error("Access denied");
    }
  }

  res.status(200);
  responseHandler(res, { clinic });
});

const createClinic = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const { name, email, phone, address, city, state_id, branch } = req.body;
  const nowUtc = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (!name) { res.status(400); throw new Error("Clinic name is required"); }
  if (!branch?.name) { res.status(400); throw new Error("Branch name is required"); }

  const clinicId = await Clinic.create({
    name, email: email || null, phone: phone || null,
    address: address || null, city: city || null, state_id: state_id || null,
    owner_id: userId, uuid: generateUUID(), subscription_id: 1, is_active: 1, created_at: nowUtc,
  });

  if (!clinicId) { res.status(500); throw new Error("Failed to create clinic"); }

  await Clinic.addClinicSub({ clinic_id: clinicId, subscription_id: 1, start_date: nowUtc, end_date: null, price_paid: 0, status: "active", created_at: nowUtc });

  await Branch.create({
    clinic_id: clinicId, name: branch.name, address: branch.address || null,
    phone: branch.phone || null, city: branch.city || null, state_id: branch.state_id || null, created_at: nowUtc,
  });

  const newClinic = await Clinic.findById(clinicId);
  newClinic.branches = await Branch.findForClinic(clinicId);
  newClinic.role = "owner";
  newClinic.roles = ["owner"];

  res.status(201);
  responseHandler(res, { clinic: newClinic });
});

const createBranch = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const clinicId = parseInt(req.params.clinicId, 10);
  const { name, phone, address, city, state_id } = req.body;
  const nowUtc = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (!name) { res.status(400); throw new Error("Branch name is required"); }

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) { res.status(404); throw new Error("Clinic not found"); }
  if (clinic.owner_id !== userId) { res.status(403); throw new Error("Only the clinic owner can add branches"); }

  const branchId = await Branch.create({ clinic_id: clinicId, name, phone: phone || null, address: address || null, city: city || null, state_id: state_id || null, created_at: nowUtc });
  if (!branchId) { res.status(500); throw new Error("Failed to create branch"); }

  const newBranch = await Branch.findById(branchId, clinicId);
  res.status(201);
  responseHandler(res, { branch: newBranch });
});

const getSubscription = asyncHandler(async function (req, res) {
  const clinicId = parseInt(req.params.clinicId, 10);
  const userId = req.user?.id;

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) { res.status(404); throw new Error("Clinic not found"); }

  // must be owner or staff of this clinic
  const isOwner = clinic.owner_id === userId;
  if (!isOwner) {
    const branchRoles = await BranchUser.findUserRolesAcrossClinic(clinicId, userId);
    if (!branchRoles.length) { res.status(403); throw new Error("Access denied"); }
  }

  const sub = await Subscription.getActiveWithPermissions(clinicId);
  if (!sub) { res.status(404); throw new Error("No active subscription found"); }

  // attach current usage counts
  sub.current_branches = await Subscription.countBranches(clinicId);
  sub.current_users = await Subscription.countUsers(clinicId);

  res.status(200);
  responseHandler(res, { subscription: sub });
});

module.exports = { getClinics, getClinic, createClinic, createBranch, getSubscription };