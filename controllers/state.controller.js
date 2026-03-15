const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const generateUUID = require("../utils/generateUUID.js");
const State = require("../models/state.model.js");
const cache = require("../utils/cache.js");

const getStates = asyncHandler(async function (req, res) {
  const cacheKey = "states:all";

  const cachedStates = await cache.get(cacheKey);
  if (cachedStates) {
    return responseHandler(res, { states: cachedStates }, "States");
  }

  const states = await State.getAll();

  await cache.set(cacheKey, states || [], 86400);

  res.status(200);
  responseHandler(res, { states });
});

module.exports = {
  getStates,
};
