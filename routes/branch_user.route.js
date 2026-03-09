const express = require("express");
const router = express.Router();
const validateTokenHandler = require("../middleware/validateTokenHandler");
const {
  checkSubscriptionLimit,
  checkSubscriptionFeature,
} = require("../middleware/subscriptionGuard");
const {
  inviteStaff,
  staffInviteLookup,
  acceptStaffInvite,
  rejectStaffInvite,
} = require("../controllers/branch_user.controller");
const { checkAnyRolePermission } = require("../middleware/rolePermission");
router.get("/invite/lookup", staffInviteLookup);
router.post("/invite/accept", validateTokenHandler, acceptStaffInvite);
router.post("/invite/reject", validateTokenHandler, rejectStaffInvite);
router.post(
  "/:clinicId/invite",
  validateTokenHandler,
  checkSubscriptionFeature("staff.create"),
  checkSubscriptionLimit("users"),
  checkAnyRolePermission("staff.create"),
  inviteStaff,
);

module.exports = router;
