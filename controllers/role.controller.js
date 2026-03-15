const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const generateUUID = require("../utils/generateUUID.js");
const Role = require("../models/role.model.js");
const cache = require("../utils/cache.js");

const getRoles = asyncHandler(async function (req, res) {
  const cacheKey = "roles:all";

  const cachedRoles = await cache.get(cacheKey);
  if (cachedRoles) {
    return responseHandler(res, { roles: cachedRoles }, "Roles");
  }

  const roles = await Role.getAll();

  await cache.set(cacheKey, roles || [], 86400);

  res.status(200);
  responseHandler(res, { roles });
});

module.exports = {
  getRoles,
};