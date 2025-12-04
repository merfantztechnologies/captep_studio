const express = require("express");
const {
  getWorkflow,
  createWorkflow,
  getWorkflowById,
  testworkflow,
  testchatbot,
  // createdemoworkflow,
  cancelChatbot,
  updateWorkflow,
} = require(".");
const router = express.Router();

router.post("/getworkflow", getWorkflow);
router.post("/createworkflow", createWorkflow);
router.post("/getworkflowbyid", getWorkflowById);
router.post("/testworkflow", testworkflow);
router.post("/chatbot", testchatbot);
router.post("/createworkflow", createWorkflow)
// router.post("/createdemoworkflow", createdemoworkflow);
router.post("/cancel-bot", cancelChatbot);
router.post('/update-workflow', updateWorkflow)

module.exports = router;
