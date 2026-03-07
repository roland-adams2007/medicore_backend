const express = require("express");
const validateTokenHandler = require("../middleware/validateTokenHandler");
const { getSubs } = require("../controllers/subscription.controller");

const router = express.Router();
router.get("/", getSubs);

module.exports = router;
