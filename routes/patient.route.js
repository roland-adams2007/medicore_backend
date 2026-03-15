const express = require("express");
const router = express.Router();
const validateTokenHandler = require("../middleware/validateTokenHandler");
const { createPatient } = require("../controllers/patient.controller");
const {
  checkSubscriptionLimit,
  checkSubscriptionFeature,
} = require("../middleware/subscriptionGuard");
const { checkRolePermission } = require("../middleware/rolePermission");
router.get(
  "/:clinicId/branches/:branchId/create",
  validateTokenHandler,
  checkSubscriptionFeature("patients.create"),
  createPatient,
);

module.exports = router;
