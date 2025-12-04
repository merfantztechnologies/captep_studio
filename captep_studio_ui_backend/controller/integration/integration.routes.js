const express = require("express");
const { integrationService, oauth, createConnection } = require(".");
const router = express.Router();

// POST /api/v1/integration/service
router.post("/service", integrationService);
router.post("/create-connection", createConnection)
// router.post("/refreshAccessToken", refreshAccessToken)

// GET /api/v1/integration/oauth/:platform/callback
router.get("/oauth/:platform/callback", oauth);


module.exports = router;