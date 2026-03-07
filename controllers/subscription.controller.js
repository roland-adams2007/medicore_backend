const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const generateUUID = require("../utils/generateUUID.js");
const Subscription = require("../models/subscription.model.js");

const getSubs = asyncHandler(async function (req, res) {
  const subs = await Subscription.getAll();
  res.status(200);
  responseHandler(res, { subs });
});

module.exports = {
  getSubs,
};
