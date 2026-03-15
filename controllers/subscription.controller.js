const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const Subscription = require("../models/subscription.model.js");
const cache = require("../utils/cache.js");

const getSubs = asyncHandler(async function (req, res) {
  const cacheKey = "subscriptions:all";

  const cachedSubs = await cache.get(cacheKey);
  if (cachedSubs) {
    return responseHandler(res, { subs: cachedSubs }, "Subscriptions");
  }

  const subs = await Subscription.getAll();

  await cache.set(cacheKey, subs || [], 86400);

  res.status(200);
  responseHandler(res, { subs });
});

const getPermissionsBySubId = asyncHandler(async function (req, res) {
  const { id } = req.params;
  const cacheKey = `subscription:${id}:permissions`;

  const cachedPermissions = await cache.get(cacheKey);
  if (cachedPermissions) {
    return responseHandler(res, { permissions: cachedPermissions }, "Permissions");
  }

  const permissions = await Subscription.getPermissions(id);

  await cache.set(cacheKey, permissions || [], 86400);

  res.status(200);
  responseHandler(res, { permissions });
});

module.exports = {
  getSubs,
  getPermissionsBySubId,
};