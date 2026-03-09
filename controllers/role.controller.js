const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const generateUUID = require("../utils/generateUUID.js");
const Role = require("../models/role.model.js");

const getRoles = asyncHandler(async function (req, res) {
  const roles = await Role.getAll();
  res.status(200);
  responseHandler(res, { roles });
});

module.exports = {
  getRoles,
};
