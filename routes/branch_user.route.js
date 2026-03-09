const express = require("express");
const router = express.Router();
const validateTokenHandler = require("../middleware/validateTokenHandler");

const {
  checkSubscriptionLimit,
  checkSubscriptionFeature,
} = require("../middleware/subscriptionGuard");
const { inviteStaff } = require("../controllers/branch_user.controller");
router.post(
  "/:clinicId/invite",
  validateTokenHandler,
  checkSubscriptionFeature("staff.create"),
  checkSubscriptionLimit("users"),
  inviteStaff,
);

module.exports = router;
