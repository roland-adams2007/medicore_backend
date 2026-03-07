const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const generateUUID = require("../utils/generateUUID.js");
const State = require("../models/state.model.js");

const getStates = asyncHandler(async function (req, res) {
  const states = await State.getAll();
  res.status(200);
  responseHandler(res, { states });
});

module.exports = {
  getStates,
};
