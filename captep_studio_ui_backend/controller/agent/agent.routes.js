const express = require("express");
const {
  getModels,
  testAgent,
  createTask,
  getListOfTools,
  getAllAgents,
  getAgent,
} = require(".");
const router = express.Router();

router.get("/tools", getListOfTools);
router.get("/getmodels", getModels);
router.post("/testagent", testAgent);
router.post("/createtask", createTask);
router.post("/getAllAgents", getAllAgents);
router.post("/getAgent", getAgent);

module.exports = router;
