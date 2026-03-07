const asyncHandler = require("express-async-handler");
const Subscription = require("../models/subscription.model");

/**
 * checkSubscriptionLimit(resource)
 *
 * resource: "branches" | "users"
 *
 * Checks the clinic's active subscription max_* limit.
 * Expects req.params.clinicId OR req.body.clinicId.
 * If limit is NULL (Enterprise = unlimited), it passes through.
 */
const checkSubscriptionLimit = (resource) =>
  asyncHandler(async (req, res, next) => {
    const clinicId = parseInt(req.params.clinicId || req.body.clinicId, 10);
    if (!clinicId) {
      res.status(400);
      throw new Error("Clinic ID is required");
    }

    const sub = await Subscription.getActiveForClinic(clinicId);

    if (!sub) {
      res.status(403);
      throw new Error("No active subscription found for this clinic");
    }

    const limitKey = `max_${resource}`;
    const limit = sub[limitKey];

    // NULL = unlimited (Enterprise)
    if (limit === null || limit === undefined) return next();

    let current = 0;
    if (resource === "branches") {
      current = await Subscription.countBranches(clinicId);
    } else if (resource === "users") {
      current = await Subscription.countUsers(clinicId);
    }

    if (current >= limit) {
      res.status(403);
      throw new Error(
        `Your ${sub.name} plan allows a maximum of ${limit} ${resource}. ` +
          `You currently have ${current}. Please upgrade to add more.`,
      );
    }

    // attach subscription info to req for downstream use
    req.subscription = sub;
    next();
  });

/**
 * checkSubscriptionFeature(permissionName)
 *
 * permissionName: e.g. "analytics.advanced", "lab.create", "whitelabel.access"
 *
 * Uses vw_subscription_permissions which inherits parent plan permissions.
 */
const checkSubscriptionFeature = (permissionName) =>
  asyncHandler(async (req, res, next) => {
    const clinicId = parseInt(req.params.clinicId || req.body.clinicId, 10);
    if (!clinicId) {
      res.status(400);
      throw new Error("Clinic ID is required");
    }

    const sub = await Subscription.getActiveForClinic(clinicId);

    if (!sub) {
      res.status(403);
      throw new Error("No active subscription found for this clinic");
    }

    const permissions = await Subscription.getPermissions(sub.id);

    if (!permissions.includes(permissionName)) {
      res.status(403);
      throw new Error(
        `Your ${sub.name} plan does not include access to this feature. ` +
          `Please upgrade your subscription.`,
      );
    }

    req.subscription = sub;
    next();
  });

/**
 * attachSubscription
 *
 * Non-blocking middleware — just attaches sub + permissions to req.
 * Use on routes where you want subscription info available but not enforced.
 */
const attachSubscription = asyncHandler(async (req, res, next) => {
  const clinicId = parseInt(req.params.clinicId || req.body.clinicId || req.query.clinicId, 10);
  if (clinicId) {
    const sub = await Subscription.getActiveWithPermissions(clinicId);
    req.subscription = sub || null;
  }
  next();
});

module.exports = { checkSubscriptionLimit, checkSubscriptionFeature, attachSubscription };