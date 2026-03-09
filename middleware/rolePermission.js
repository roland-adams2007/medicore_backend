const asyncHandler = require("express-async-handler");
const BranchUser = require("../models/branch_user.model");
const Clinic = require("../models/clinic.model");

/**
 * checkRolePermission(permissionName)
 *
 * permissionName: e.g. "staff.invite", "staff.remove", "branch.edit", "reports.view"
 *
 * Verifies that the authenticated user holds a role in the target branch
 * (or is the clinic owner) AND that their role includes the given permission.
 *
 * Expects:
 *   - req.user.id        — set by your auth middleware
 *   - req.params.clinicId and/or req.params.branch_id / req.body.branch_id
 */
const checkRolePermission = (permissionName) =>
  asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    const clinicId = parseInt(req.params.clinicId || req.body.clinicId, 10);
    const branchId = parseInt(
      req.params.branch_id || req.params.branchId || req.body.branch_id,
      10,
    );

    if (!clinicId) {
      res.status(400);
      throw new Error("Clinic ID is required.");
    }

    // Clinic owners bypass all role permission checks
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      res.status(404);
      throw new Error("Clinic not found.");
    }

    if (clinic.owner_id === userId) {
      req.requesterRole = null; // owner — no role needed
      return next();
    }

    // For non-owners a branch context is required
    if (!branchId) {
      res.status(400);
      throw new Error("Branch ID is required.");
    }

    // Fetch the user's role in this branch
    const roleRecord = await BranchUser.findUserRoleWithPermissions(
      branchId,
      userId,
    );

    if (!roleRecord) {
      res.status(403);
      throw new Error("You are not a member of this branch.");
    }

    // roleRecord.permissions should be a string[] / Set of permission names
    const permissions = roleRecord.permissions ?? [];
    if (!permissions.includes(permissionName)) {
      res.status(403);
      throw new Error(
        `Your role (${roleRecord.role_name}) does not have permission to perform this action.`,
      );
    }

    // Attach for downstream use (mirrors how req.subscription is attached)
    req.requesterRole = roleRecord;
    next();
  });

/**
 * checkAnyRolePermission(permissionNames)
 *
 * Passes if the user holds ANY ONE of the listed permissions.
 * Useful for routes accessible by multiple roles.
 *
 * Example: checkAnyRolePermission(["staff.invite", "admin.manage"])
 */
const checkAnyRolePermission = (permissionNames = []) =>
  asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    const clinicId = parseInt(req.params.clinicId || req.body.clinicId, 10);
    const branchId = parseInt(req.params.branch_id || req.body.branch_id, 10);

    if (!clinicId) {
      res.status(400);
      throw new Error("Clinic ID is required.");
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      res.status(404);
      throw new Error("Clinic not found.");
    }

    if (clinic.owner_id === userId) {
      req.requesterRole = null;
      return next();
    }

    if (!branchId) {
      res.status(400);
      throw new Error("Branch ID is required.");
    }

    const roleRecord = await BranchUser.findUserRoleWithPermissions(
      branchId,
      userId,
    );

    if (!roleRecord) {
      res.status(403);
      throw new Error("You are not a member of this branch.");
    }

    const permissions = roleRecord.permissions ?? [];
    const hasAny = permissionNames.some((p) => permissions.includes(p));

    if (!hasAny) {
      res.status(403);
      throw new Error(
        `Your role (${roleRecord.role_name}) does not have permission to perform this action.`,
      );
    }

    req.requesterRole = roleRecord;
    next();
  });

/**
 * attachRequesterRole
 *
 * Non-blocking — attaches the user's branch role + permissions to req.
 * Use on routes where role info is useful but not strictly enforced.
 */
const attachRequesterRole = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  const branchId = parseInt(
    req.params.branch_id || req.body.branch_id || req.query.branch_id,
    10,
  );

  if (userId && branchId) {
    const roleRecord = await BranchUser.findUserRoleWithPermissions(
      branchId,
      userId,
    );
    req.requesterRole = roleRecord || null;
  } else {
    req.requesterRole = null;
  }

  next();
});

module.exports = {
  checkRolePermission,
  checkAnyRolePermission,
  attachRequesterRole,
};
