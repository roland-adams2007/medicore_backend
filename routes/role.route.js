const express = require("express");
const validateTokenHandler = require("../middleware/validateTokenHandler");
const { getRoles } = require("../controllers/role.controller");

const router = express.Router();
router.get("/", getRoles);

module.exports = router;
