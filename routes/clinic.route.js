const express = require("express");
const router = express.Router();
const validateTokenHandler = require("../middleware/validateTokenHandler");
const {
  getClinics,
  getClinic,
  createClinic,
  createBranch,
  getSubscription,
} = require("../controllers/clinic.controller");
const {
  checkSubscriptionLimit,
  checkSubscriptionFeature,
} = require("../middleware/subscriptionGuard");

// GET  /clinics               → list all clinics for the logged-in user
router.get("/", validateTokenHandler, getClinics);

// POST /clinics               → create a new clinic (includes first branch)
router.post("/create", validateTokenHandler, createClinic);

// GET  /clinics/:clinicId     → get single clinic details
router.get("/:clinicId", validateTokenHandler, getClinic);

// GET  /clinics/:clinicId/subscription  → get active subscription + usage
router.get("/:clinicId/subscription", validateTokenHandler, getSubscription);

// POST /clinics/:clinicId/branches
// Guards (run in order):
//   1. checkSubscriptionFeature("branches.create") → does their plan allow branch creation?
//   2. checkSubscriptionLimit("branches")           → are they under the max_branches cap?
router.post(
  "/:clinicId/branches",
  validateTokenHandler,
  checkSubscriptionFeature("branches.create"),
  checkSubscriptionLimit("branches"),
  createBranch,
);

module.exports = router;
