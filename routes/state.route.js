const express = require("express");
const validateTokenHandler = require("../middleware/validateTokenHandler");
const { getStates } = require("../controllers/state.controller");

const router = express.Router();
router.get("/", getStates);

module.exports = router;
