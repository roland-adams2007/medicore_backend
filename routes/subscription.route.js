const express = require("express");
const { getSubs, getPermissionsBySubId } = require("../controllers/subscription.controller");

const router = express.Router();

router.get("/", getSubs);
router.get("/:id/permissions", getPermissionsBySubId);

module.exports = router;