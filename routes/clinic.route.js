const express = require("express");
const router = express.Router();
const validateTokenHandler = require("../middleware/validateTokenHandler");
const {
  getClinics,
  getClinic,
  createClinic,
  createBranch,
  getSubscription,
  getStaffs,
  getStaffInvitations,
} = require("../controllers/clinic.controller");
const {
  getInviteForSetup,
  setupStaffProfile,
  resendInvite,
} = require("../controllers/staff_setup.controller");
const {
  checkSubscriptionLimit,
  checkSubscriptionFeature,
} = require("../middleware/subscriptionGuard");
const { checkRolePermission } = require("../middleware/rolePermission");

router.get("/", validateTokenHandler, getClinics);
router.post("/create", validateTokenHandler, createClinic);
router.get("/:clinicId", validateTokenHandler, getClinic);
router.get("/:clinicId/subscription", validateTokenHandler, getSubscription);

router.post(
  "/:clinicId/branches",
  validateTokenHandler,
  checkSubscriptionFeature("branches.create"),
  checkSubscriptionLimit("branches"),
  createBranch,
);

router.get(
  "/:clinicId/branches/:branchId/staff",
  validateTokenHandler,
  checkSubscriptionFeature("staff.view"),
  getStaffs,
);

router.get(
  "/:clinicId/branches/:branchId/staff/invites",
  validateTokenHandler,
  checkSubscriptionFeature("staff.view"),
  getStaffInvitations,
);

router.get(
  "/:clinicId/branches/:branchId/staff/invites/:inviteId/setup",
  validateTokenHandler,
  checkRolePermission("staff.create"),
  getInviteForSetup,
);

router.post(
  "/:clinicId/branches/:branchId/staff/invites/:inviteId/setup",
  validateTokenHandler,
  checkRolePermission("staff.create"),
  setupStaffProfile,
);

router.post(
  "/:clinicId/branches/:branchId/staff/invites/:inviteId/resend",
  validateTokenHandler,
  checkRolePermission("staff.create"),
  resendInvite,
);

module.exports = router;
