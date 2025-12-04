const express= require("express");
const { getTools, getToolId, getIntegrationTools, getCreatedListOfTools, createRegisterTool } = require(".");
const router = express.Router();

router.get("/getNodes", getTools);
router.post("/getToolById", getToolId);
router.post("/getIntegrationTools", getIntegrationTools);
router.post("/getcreatedtools", getCreatedListOfTools);
router.post("/createRegistertool", createRegisterTool)

module.exports= router;