const express = require('express');
const routes=express.Router();
const AgentRoutes=require("../controller/agent/agent.routes");
const AuthRoutes=require("../controller/authentication/auth.routes");
const toolRoutes=require("../controller/tool/tool.routes");
const IntegrationRoutes=require("../controller/integration/integration.routes");
const workflowRoutes= require("../controller/workflow/workflow.routes")

routes.use('/auth',AuthRoutes);
routes.use('/agent',AgentRoutes);
routes.use('/tool', toolRoutes);
routes.use('/workflow',workflowRoutes)
routes.use('/integration', IntegrationRoutes);

module.exports=routes;