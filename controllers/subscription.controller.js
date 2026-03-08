const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const Subscription = require("../models/subscription.model.js");

const getSubs = asyncHandler(async function (req, res) {
  const subs = await Subscription.getAll();
  res.status(200);
  responseHandler(res, { subs });
});

const getPermissionsBySubId = asyncHandler(async function (req, res) {
  const { id } = req.params;
  const permissions = await Subscription.getPermissions(id);
  res.status(200);
  responseHandler(res, { permissions });
});

module.exports = {
  getSubs,
  getPermissionsBySubId,
};