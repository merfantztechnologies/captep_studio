const { db } = require("../../dbconnect");
const {
  transformWorkflowToPayload,
  convertWorkflowToTaskMap,
  ToolParams,
  ToolAgentLlmMapping,
  getSuperAgentsFromEdges,
} = require("../../utils");
const { refreshAllTokens } = require("../integration");

const getWorkflow = async (request, response) => {
  const { created_by } = request.body;
  try {
    const getWorkflow = (
      await db.query(
        `SELECT 
        w.id,
        w.name,
        w.updated_at,
        json_build_object( 
          'id', u.id,
          'name', u.first_name || ' ' || u.last_name
        ) AS created_by
     FROM ${process.env.WORKFLOW} AS w
     INNER JOIN ${process.env.USER} AS u 
       ON w.created_by = u.id
     WHERE w.created_by = $1 ORDER BY w.created_at DESC`,
        [created_by]
      )
    )?.rows;
    response.status(200).json({ status: "success", data: getWorkflow });
  } catch (error) {
    console.error("Error in workflow controller:", error);
    response
      .status(500)
      .json({ status: "error", message: " Internal Server Error" });
  }
};

const updateWorkflow = async (req, res) => {
  const { workflow_id, payload, updated_by } = req.body;
  console.log("called updatedworkflow");
  const client = await db.connect();

  try {
    console.log("Incoming Payload →", JSON.stringify(payload, null, 2));

    const workflowExists = await client.query(
      `SELECT * FROM ${process.env.WORKFLOW} WHERE id = $1`,
      [workflow_id]
    );

    if (workflowExists.rows.length === 0) {
      throw new Error(`Workflow with ID ${workflow_id} not found`);
    }

    const agentIdMap = {};
    const toolIdMap = {};
    const taskIdMap = {};

    // 1️⃣ Update Workflow Info
    await client.query(
      `UPDATE ${process.env.WORKFLOW}
       SET name = $1, memory = $2, edges = $3, updated_at = NOW()
       WHERE id = $4;`,
      [
        payload?.name,
        payload?.memoryEnabled,
        JSON.stringify(payload?.edges || []),
        workflow_id,
      ]
    );

    // 2️⃣ Update or Insert Agents
    for (const node of payload.nodes || []) {
      if (node.nodeType === "agent node") {
        let dbAgentId;

        if (!node.id || node.id.startsWith("agent-")) {
          const agentRes = await client.query(
            `INSERT INTO ${process.env.AGENT}
             (workflow_id, name, description, service, role, goal, backstory, instruction, created_by, position,function_calling_llm, ver_bose,
          allow_delegation, max_iter, max_rpm, max_execution_time, max_retry_limit, allow_code_execution, code_execution_mode, respect_context_window,
          use_system_prompt, multimodal, inject_date, date_format, reasoning, max_reasoning_attempts, knowledge_sources, embedder,
          system_template, prompt_template, response_template)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30 , $31)
          RETURNING id;`,
            [
              workflow_id,
              node.data.name,
              node.data.description || "",
              node.data.service || "",
              node.data.role || "",
              node.data.goal || "",
              node.data.backstory || "",
              node.data.systemprompt || "",
              updated_by,
              node?.position ? JSON.stringify(node.position) : null,
              node?.data?.function_calling_llm,
              node?.data?.verbose,
              node?.data?.allow_delegation,
              node?.data?.max_iter,
              node?.data?.max_rpm,
              node?.data?.max_execution_time,
              node?.data?.max_retry_limit,
              node?.data?.allow_code_execution,
              node?.data?.code_execution_mode,
              node?.data?.respect_context_window,
              node?.data?.use_system_prompt,
              node?.data?.multimodal,
              node?.data?.inject_date,
              node?.data?.date_format,
              node?.data?.reasoning,
              node?.data?.max_reasoning_attempts,
              node?.data?.knowledge_sources,
              node?.data?.embedder,
              node?.data?.system_template,
              node?.data?.prompt_template,
              node?.data?.response_template,
            ]
          );
          dbAgentId = agentRes.rows[0].id;
          const insertModelQuery = await db.query(
            `INSERT INTO ${process.env.REGISTERMODEL} (model_name,api_key,icon_path,agent_id,provider,stream,temperature,max_completion_tokens,top_p) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
              node?.data?.model,
              node?.data?.apiKey,
              "",
              agentRes?.rows[0]?.id,
              node?.data?.provider,
              false,
              node?.data?.temperature,
              node?.data?.maxTokens,
              node?.data?.topP,
            ]
          );
        } else {
          dbAgentId = node.id;
          console.log("updating agent ---->>", node?.id);
          const agentRes = await client.query(
            `UPDATE ${process.env.AGENT}
          SET workflow_id = $1,
              name = $2,
              description = $3,
              service = $4,
              role = $5,
              goal = $6,
              backstory = $7,
              instruction = $8,
              position = $9,
              function_calling_llm = $10,
              ver_bose = $11,
              allow_delegation = $12,
              max_iter = $13,
              max_rpm = $14,
              max_execution_time = $15,
              max_retry_limit = $16,
              allow_code_execution = $17,
              code_execution_mode = $18,
              respect_context_window = $19,
              use_system_prompt = $20,
              multimodal = $21,
              inject_date = $22,
              date_format = $23,
              reasoning = $24,
              max_reasoning_attempts = $25,
              knowledge_sources = $26,
              embedder = $27,
              system_template = $28,
              prompt_template = $29,   
              response_template = $30,
              updated_at = NOW()
          WHERE id = $31 RETURNING id;;`,
            [
              workflow_id,
              node.data.name,
              node.data.description || "",
              node.data.service || "",
              node.data.role || "",
              node.data.goal || "",
              node.data.backstory || "",
              node.data.systemprompt || "",
              node?.position ? JSON.stringify(node.position) : null,
              node?.data?.function_calling_llm,
              node?.data?.verbose,
              node?.data?.allow_delegation,
              node?.data?.max_iter,
              node?.data?.max_rpm,
              node?.data?.max_execution_time,
              node?.data?.max_retry_limit,
              node?.data?.allow_code_execution,
              node?.data?.code_execution_mode,
              node?.data?.respect_context_window,
              node?.data?.use_system_prompt,
              node?.data?.multimodal,
              node?.data?.inject_date,
              node?.data?.date_format,
              node?.data?.reasoning,
              node?.data?.max_reasoning_attempts,
              node?.data?.knowledge_sources,
              node?.data?.embedder,
              node?.data?.system_template,
              node?.data?.prompt_template,
              node?.data?.response_template,
              node.id,
            ]
          );
          console.log("executed agent now working on model update....");
          const queryModelCheck = await db.query(
            `SELECT * FROM ${process.env.REGISTERMODEL} WHERE agent_id = $1`,
            [node?.id]
          );
          if (queryModelCheck?.rows?.length > 0) {
            await db.query(
              `UPDATE ${process.env.REGISTERMODEL}
              SET model_name = $1,
                  api_key = $2,
                  provider = $3,
                  stream = $4,
                  temperature = $5,
                  max_completion_tokens = $6,
                  top_p = $7
              WHERE agent_id = $8
              RETURNING *`,
              [
                node?.data?.model,
                node?.data?.apiKey,
                node?.data?.provider,
                false,
                node?.data?.temperature,
                node?.data?.maxTokens,
                node?.data?.topP,
                node?.id,
              ]
            );
          } else {
            console.log("Not there Model inserting new one --->");
            await db.query(
              `INSERT INTO ${process.env.REGISTERMODEL} (model_name,api_key,icon_path,agent_id,provider,stream,temperature,max_completion_tokens,top_p) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
              [
                node?.data?.model,
                node?.data?.apiKey,
                "",
                node?.id,
                node?.data?.provider,
                false,
                node?.data?.temperature,
                node?.data?.maxTokens,
                node?.data?.topP,
              ]
            );
          }

          console.log("called ---->");
        }
        agentIdMap[node.id] = dbAgentId;
      }
    }

    // 3️⃣ Update or Insert Tools (from edges)
    for (const edge of payload.edges || []) {
      const sourceNode = payload.nodes.find((n) => n.id === edge.source);
      const targetNode = payload.nodes.find((n) => n.id === edge.target);

      if (
        sourceNode?.nodeType === "agent node" &&
        targetNode?.nodeType === "tool node"
      ) {
        const parentAgentId = agentIdMap[sourceNode.id];
        let dbToolId;

        if (!targetNode.id || targetNode.id.startsWith("tool-")) {
          const toolRes = await client.query(
            `INSERT INTO ${process.env.REGISTERTOOL}
             (name, description, input, register_tool_id, agent_id, position, connected, created_by, workflow_id, service, object,operation,oauth_id , oauth_connecname )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             RETURNING id;`,
            [
              targetNode.data?.toolName || "Unnamed Tool",
              targetNode.data?.description || "",
              JSON.stringify(targetNode.data?.inputFields || []),
              targetNode.id,
              parentAgentId,
              targetNode?.position ? JSON.stringify(targetNode.position) : null,
              targetNode?.data?.connected ?? true,
              updated_by,
              workflow_id,
              targetNode?.data?.service?.toLowerCase() ?? "",
              targetNode?.data?.selectedObject,
              targetNode?.data?.toolAction,
              targetNode?.data?.configOauth?.oauth_id,
              targetNode?.data?.configOauth?.oauth_connecname,
            ]
          );
          dbToolId = toolRes.rows[0].id;
        } else {
          dbToolId = targetNode.id;
          await client.query(
            `UPDATE ${process.env.REGISTERTOOL}
             SET name = $1, description = $2, input = $3, position = $4,
                 connected = $5, service = $6, agent_id = $7, updated_at = NOW(), object = $9, operation = $10, oauth_id = $11 , oauth_connecname = $12
             WHERE id = $8;`,
            [
              targetNode.data?.toolName || "Unnamed Tool",
              targetNode.data?.description || "",
              JSON.stringify(targetNode.data?.inputFields || []),
              targetNode?.position ? JSON.stringify(targetNode.position) : null,
              targetNode?.data?.connected ?? true,
              targetNode?.data?.service?.toLowerCase() ?? "",
              parentAgentId,
              targetNode.id,
              targetNode?.data?.selectedObject,
              targetNode?.data?.toolAction,
              targetNode?.data?.configOauth?.oauth_id,
              targetNode?.data?.configOauth?.oauth_connecname,
            ]
          );
        }

        toolIdMap[targetNode.id] = dbToolId;
      }
    }

    // 4️⃣ Update or Insert Tasks
    for (const edge of payload.edges || []) {
      const sourceNode = payload.nodes.find((n) => n.id === edge.source);
      const targetNode = payload.nodes.find((n) => n.id === edge.target);

      if (
        sourceNode?.nodeType === "agent node" &&
        targetNode?.nodeType === "task node"
      ) {
        const parentAgentId = agentIdMap[sourceNode.id];
        let dbTaskId;

        if (!targetNode.id || targetNode.id.startsWith("task-")) {
          const taskRes = await client.query(
            `INSERT INTO ${process.env.TASK}
             (name, description, expected_output, created_by, position, agent_id,async_execution, human_input, markdown, guardrail_max_retries)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id;`,
            [
              targetNode.data?.task?.name || "Untitled Task",
              targetNode.data?.task?.description || "",
              targetNode.data?.task?.expected_output || "",
              updated_by,
              targetNode?.position ? JSON.stringify(targetNode.position) : null,
              parentAgentId,
              targetNode?.data?.async_execution || false,
              targetNode?.data?.human_input || false,
              targetNode?.data?.markdown || false,
              targetNode?.data?.guardrail_max_retries || 0,
            ]
          );
          dbTaskId = taskRes.rows[0].id;
        } else {
          dbTaskId = targetNode.id;
          await client.query(
            `UPDATE ${process.env.TASK}
             SET name = $1, description = $2, expected_output = $3,
                 position = $4, updated_at = NOW(), async_execution = $6, human_input = $7, markdown = $8, guardrail_max_retries = $9
             WHERE id = $5;`,
            [
              targetNode.data?.task?.name,
              targetNode.data?.task?.description,
              targetNode.data?.task?.expected_output,
              targetNode?.position ? JSON.stringify(targetNode.position) : null,
              targetNode.id,
              targetNode?.data?.task?.async_execution || false,
              targetNode?.data?.task?.human_input || false,
              targetNode?.data?.task?.markdown || false,
              targetNode?.data?.task?.guardrail_max_retries || 0,
            ]
          );
        }

        taskIdMap[targetNode.id] = dbTaskId;
      }
    }

    // 5️⃣ Update Workflow Edges
    const replaceId = (oldId) =>
      agentIdMap[oldId] || toolIdMap[oldId] || taskIdMap[oldId] || oldId;

    const updatedEdges = (payload.edges || []).map((edge) => ({
      ...edge,
      source: replaceId(edge.source),
      target: replaceId(edge.target),
    }));

    await client.query(
      `UPDATE ${process.env.WORKFLOW} SET edges = $1 WHERE id = $2;`,
      [JSON.stringify(updatedEdges), workflow_id]
    );
    const agentPayload = await transformWorkflowToPayload(payload, workflow_id);
    const taskPayload = await convertWorkflowToTaskMap(payload, workflow_id);

    console.log(
      "Update Agent PayLoad----->>>",
      JSON.stringify(agentPayload, null, 2)
    );
    console.log(
      "Update Task PayLoad----->>>",
      JSON.stringify(taskPayload, null, 2)
    );

    const agentPost = await fetch(
      "${process.env.BACKEND_API_URL}:8000/api/create-agent/",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(agentPayload),
      }
    );
    const taskPost = await fetch(
      "${process.env.BACKEND_API_URL}:8001/api/create-task/",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(taskPayload),
      }
    );

    res.status(200).json({
      status: "success",
      message: "Workflow updated successfully",
      data: {
        workflow_id,
        agents_processed: Object.keys(agentIdMap).length,
        tools_processed: Object.keys(toolIdMap).length,
        tasks_processed: Object.keys(taskIdMap).length,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error in updateWorkflow:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
};

const createWorkflow = async (req, res) => {
  const { payload, created_by } = req.body;
  const client = await db.connect();

  try {
    console.log("Incoming Payload →", JSON.stringify(payload, null, 2));

    // 1️⃣ Insert Workflow
    const workflowInsert = `
      INSERT INTO ${process.env.WORKFLOW} (name, memory, created_by, edges)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const workflowValues = [
      payload?.name,
      payload?.memoryEnabled,
      created_by,
      JSON.stringify(payload?.edges || []),
    ];
    const workflow = (await client.query(workflowInsert, workflowValues))
      .rows[0];

    // 🧠 ID Maps (to replace temporary node IDs with DB IDs)
    const agentIdMap = {};
    const toolIdMap = {};
    const taskIdMap = {};

    // 2️⃣ Insert Agent Nodes
    for (const node of payload.nodes || []) {
      if (node.nodeType === "agent node") {
        const insertAgentQuery = `
          INSERT INTO ${process.env.AGENT}
          (workflow_id, name, description,service ,role, goal, backstory, instruction, created_by, position,function_calling_llm, ver_bose,
          allow_delegation, max_iter, max_rpm, max_execution_time, max_retry_limit, allow_code_execution, code_execution_mode, respect_context_window,
          use_system_prompt, multimodal, inject_date, date_format, reasoning, max_reasoning_attempts, knowledge_sources, embedder,
          system_template, prompt_template, response_template)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
          RETURNING id;
        `;
        const agentRes = await client.query(insertAgentQuery, [
          workflow.id,
          node.data.name || "Unnamed Agent",
          node.data.description || "",
          node.data.service || "",
          node.data.role || "",
          node.data.goal || "",
          node.data.backstory || "",
          node.data.systemprompt || "",
          created_by,
          node?.position ? JSON.stringify(node.position) : null,
          node?.data?.function_calling_llm,
          node?.data?.verbose,
          node?.data?.allow_delegation,
          node?.data?.max_iter,
          node?.data?.max_rpm,
          node?.data?.max_execution_time,
          node?.data?.max_retry_limit,
          node?.data?.allow_code_execution,
          node?.data?.code_execution_mode,
          node?.data?.respect_context_window,
          node?.data?.use_system_prompt,
          node?.data?.multimodal,
          node?.data?.inject_date,
          node?.data?.date_format,
          node?.data?.reasoning,
          node?.data?.max_reasoning_attempts,
          node?.data?.knowledge_sources,
          node?.data?.embedder,
          node?.data?.system_template,
          node?.data?.prompt_template,
          node?.data?.response_template,
        ]);
        const dbAgentId = agentRes.rows[0].id;
        agentIdMap[node.id] = dbAgentId;
        const insertModelQuery = await db.query(
          `INSERT INTO ${process.env.REGISTERMODEL} (model_name,api_key,icon_path,agent_id,provider,stream,temperature,max_completion_tokens,top_p) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            node?.data?.model,
            node?.data?.apiKey,
            "",
            agentRes?.rows[0]?.id,
            node?.data?.provider,
            false,
            node?.data?.temperature,
            node?.data?.maxTokens,
            node?.data?.topP,
          ]
        );
      }
    }

    // 3️⃣ Insert Tools (based on edges)
    for (const edge of payload.edges || []) {
      const sourceNode = payload.nodes.find((n) => n.id === edge.source);
      const targetNode = payload.nodes.find((n) => n.id === edge.target);

      if (
        sourceNode?.nodeType === "agent node" &&
        targetNode?.nodeType === "tool node"
      ) {
        const parentAgentId = agentIdMap[sourceNode.id];

        const toolQuery = `
          INSERT INTO ${process.env.REGISTERTOOL}
          (name, description, input, register_tool_id, agent_id, position, connected, created_by, workflow_id, service,object,operation,oauth_id , oauth_connecname)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 , $14)
          RETURNING id;
        `;
        const toolRes = await client.query(toolQuery, [
          targetNode.data?.toolName,
          targetNode.data?.description || "",
          JSON.stringify(targetNode.data?.inputFields || []),
          targetNode.id,
          parentAgentId,
          targetNode?.position ? JSON.stringify(targetNode.position) : null,
          targetNode?.data?.connected ?? true,
          created_by,
          workflow.id,
          targetNode?.data?.service?.toLowerCase() ?? "",
          targetNode?.data?.selectedObject,
          targetNode?.data?.toolAction,
          targetNode?.data?.configOauth?.oauth_id,
          targetNode?.data?.configOauth?.oauth_connecname,
        ]);
        toolIdMap[targetNode.id] = toolRes.rows[0].id;
      }
    }

    // 4️⃣ Insert Tasks (based on edges)
    for (const edge of payload.edges || []) {
      const sourceNode = payload.nodes.find((n) => n.id === edge.source);
      const targetNode = payload.nodes.find((n) => n.id === edge.target);

      if (
        sourceNode?.nodeType === "agent node" &&
        targetNode?.nodeType === "task node"
      ) {
        const parentAgentId = agentIdMap[sourceNode.id];

        const taskQuery = `
          INSERT INTO ${process.env.TASK}
          (name, description, expected_output, created_by, position, agent_id,async_execution, human_input, markdown, guardrail_max_retries)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id;
        `;
        const taskRes = await client.query(taskQuery, [
          targetNode.data?.task?.name || "Untitled Task",
          targetNode.data?.task?.description || "",
          targetNode.data?.task?.expected_output || "",
          created_by,
          targetNode?.position ? JSON.stringify(targetNode.position) : null,
          parentAgentId,
          targetNode?.data?.async_execution || false,
          targetNode?.data?.human_input || false,
          targetNode?.data?.markdown || false,
          targetNode?.data?.guardrail_max_retries || 0,
        ]);
        taskIdMap[targetNode.id] = taskRes.rows[0].id;
      }
    }

    // 5️⃣ Handle Agent→Agent Parent Links (if present)
    const replaceId = (oldId) =>
      agentIdMap[oldId] || toolIdMap[oldId] || taskIdMap[oldId] || oldId;

    const updatedEdges = (payload.edges || []).map((edge) => ({
      ...edge,
      source: replaceId(edge.source),
      target: replaceId(edge.target),
    }));

    // Update parent-child agent relationships
    for (const edge of updatedEdges) {
      const sourceAgentId = agentIdMap[edge.source];
      const targetAgentId = agentIdMap[edge.target];
      if (sourceAgentId && targetAgentId) {
        await client.query(
          `UPDATE ${process.env.AGENT} SET parent_agent_id = $1 WHERE id = $2;`,
          [sourceAgentId, targetAgentId]
        );
      }
    }

    await client.query(
      `UPDATE ${process.env.WORKFLOW} SET edges = $1 WHERE id = $2;`,
      [JSON.stringify(updatedEdges), workflow.id]
    );

    const agentPayload = await transformWorkflowToPayload(
      payload,
      workflow?.id
    );
    console.log("agentPayload----->>>", JSON.stringify(agentPayload, null, 2));
    const taskPayload = await convertWorkflowToTaskMap(payload, workflow?.id);
    console.log("taskPayload----->>>", JSON.stringify(taskPayload, null, 2));
    const agentPost = await fetch(
      "${process.env.BACKEND_API_URL}:8000/api/create-agent/",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(agentPayload),
      }
    );
    const taskPost = await fetch(
      "${process.env.BACKEND_API_URL}:8001/api/create-task/",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(taskPayload),
      }
    );
    // 6️⃣ Update Workflow with real edges


    // ✅ 7️⃣ Final Response
    res.status(201).json({
      status: "success",
      message: "Workflow created successfully using edge-based relationships",
      data: {
        workflow_id: workflow.id,
        agents_inserted: Object.keys(agentIdMap).length,
        tools_inserted: Object.keys(toolIdMap).length,
        tasks_inserted: Object.keys(taskIdMap).length,
      },
    });
  } catch (err) {
    console.error("❌ Error while creating workflow:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// const createdemoworkflow = async (request, response) => {
//   try {
//     // ✅ Extract payload safely
//     const payload = request.body.payload || request.body;
//     console.log("test body --->", payload);

//     // ✅ Ensure memory is JSON string (for JSONB column)
//     const memory = JSON.stringify({
//       agent: payload.agent,
//       task: payload.task,
//     });

//     // ✅ Step 1: Insert workflow into DB
//     const workflowResult = await db.query(
//       `INSERT INTO ${process.env.WORKFLOW} (name, created_by, memory)
//        VALUES ($1, $2, $3)
//        RETURNING id;`,
//       [payload.name, payload.created_by, true]
//     );

//     const workflowId = workflowResult?.rows?.[0]?.id;
//     if (!workflowId) {
//       return response.status(400).json({
//         status: "error",
//         message: "Failed to create workflow",
//       });
//     }

//     // ✅ Step 2: Insert into register_tool table
//     const input = {
//       [workflowId]: {
//         inputFields: [],
//       },
//     };

//     await db.query(
//       `INSERT INTO ${process.env.REGISTERTOOL} (input, workflow_id)
//        VALUES ($1, $2);`,
//       [JSON.stringify(input), workflowId] // ✅ must stringify object
//     );

//     // ✅ Step 3: Prepare agent and task payloads
//     const agent = { ...payload.agent, workflow_id: workflowId };
//     const task = { ...payload.task, workflow_id: workflowId };

//     // ✅ Step 4: Create agent
//     const agentRes = await fetch(
//       "${process.env.BACKEND_API_URL}:8000/api/create-agent/",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(agent),
//       }
//     );

//     if (!agentRes.ok) {
//       const errText = await agentRes.text();
//       console.error("Failed to create agent:", errText);
//       return response.status(500).json({
//         status: "error",
//         message: "Failed to create agent",
//       });
//     }

//     const agentData = await agentRes.json();

//     // ✅ Step 5: Create task
//     const taskRes = await fetch(
//       "${process.env.BACKEND_API_URL}:8001/api/create-task/",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(task),
//       }
//     );

//     if (!taskRes.ok) {
//       const errText = await taskRes.text();
//       console.error("Failed to create task:", errText);
//       return response.status(500).json({
//         status: "error",
//         message: "Failed to create task",
//       });
//     }

//     const taskData = await taskRes.json();

//     // ✅ Final Success
//     console.log("Workflow created successfully:", workflowId);
//     return response.status(200).json({
//       status: "success",
//       message: "Demo workflow created successfully",
//       workflow_id: workflowId,
//       agent: agentData,
//       task: taskData,
//     });
//   } catch (error) {
//     console.error("Error in createdemoworkflow:", error);
//     return response.status(500).json({
//       status: "error",
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

const cancelChatbot = async (request, response) => {
  const { id } = request.body;

  try {
    console.log("Cancelling chatbot for workflow ID:", id);

    const res = await fetch(`${process.env.BACKEND_API_URL}:8003/api/stop_runner/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workflow_id: id }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to stop runner:", errorText);
      return response.status(res.status).json({
        status: "error",
        message: `Failed to stop runner: ${res.statusText}`,
      });
    }

    const data = await res.json();
    console.log("Stop runner response:", data);

    return response.status(200).json({
      status: "success",
      message: "Chatbot cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling chatbot:", error);
    return response.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

const getWorkflowById = async (req, res) => {
  const { id } = req.body;

  console.log("called workflow--->");
  try {
    console.log("called workflow--->");
    // 1️⃣ Get workflow base
    const workflowResult = await db.query(
      `SELECT * FROM ${process.env.WORKFLOW} WHERE id = $1`,
      [id]
    );
    const workflow = workflowResult.rows[0];

    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    // 2️⃣ Get agents
    const agents = (
      await db.query(
        `SELECT * FROM ${process.env.AGENT} WHERE workflow_id = $1`,
        [id]
      )
    ).rows;

    // 3️⃣ Get tools and tasks
    const tools = (await db.query(`SELECT * FROM ${process.env.REGISTERTOOL}`))
      .rows;
    const tasks = (await db.query(`SELECT * FROM ${process.env.TASK}`)).rows;

    // 4️⃣ Reconstruct nodes
    const nodes = [];

    // Agents
    for (const agent of agents) {
      const agentTools = tools.filter((t) => t.agent_id === agent.id);
      console.log("Agent id--->", agent?.id, agent?.agent_id);
      const queryregistermodel = await db.query(
        `SELECT * FROM ${process.env.REGISTERMODEL} WHERE agent_id=$1`,
        [agent?.id]
      );

      nodes.push({
        id: agent.id,
        nodeType: "agent node",
        position: agent.position ? JSON.parse(agent.position) : { x: 0, y: 0 },
        data: {
          name: agent.name,
          description: agent.description,
          role: agent.role,
          goal: agent.goal,
          backstory: agent.backstory,
          systemprompt: agent.instruction,
          function_calling_llm: agent?.function_calling_llm || "None",
          verbose: agent?.ver_bose || false,
          allow_delegation: agent?.allow_delegation || false,
          max_iter: agent?.max_iter || 20,
          max_rpm: agent?.max_rpm || "",
          max_execution_time: agent?.max_execution_time || "",
          max_retry_limit: agent?.max_retry_limit || 2,
          allow_code_execution: agent?.allow_code_execution || false,
          code_execution_mode: agent?.code_execution_mode || "safe",
          respect_context_window: agent?.respect_context_window || false,
          use_system_prompt: agent?.use_system_prompt || false,
          multimodal: agent?.multimodal || false,
          inject_date: agent?.inject_date || false,
          date_format: agent?.date_format || "%Y-%m-%d",
          reasoning: agent?.reasoning || false,
          max_reasoning_attempts: agent?.max_reasoning_attempts || "",
          knowledge_sources: agent?.knowledge_sources || "",
          embedder: agent?.embedder || "",
          system_template: agent?.system_template || "",
          prompt_template: agent?.prompt_template || "",
          response_template: agent?.response_template || "",
          provider: queryregistermodel?.rows?.[0]?.provider || "google",
          model:
            queryregistermodel?.rows?.[0]?.model_name || "gemini-1.5-flash",
          apiKey: queryregistermodel?.rows?.[0]?.api_key || "",
          temperature: queryregistermodel?.rows[0]?.temperature || 0.7,
          maxTokens: queryregistermodel?.rows[0]?.max_completion_tokens || 1000,
          topP: queryregistermodel?.rows[0]?.top_p || 1,
          tools: agentTools.map((t) => t.id),
        },
      });

      // Add each tool node
      for (const t of agentTools) {
        const baseToolsResult = await db.query(
          `SELECT id, service FROM ${process.env.CUSTOMTOOL}`
        );
        const toolOauth = await db.query(
          `SELECT * FROM ${process.env.CONFIG_TOOL} WHERE id=$1`,
          [t?.oauth_id]
        );
        const baseTools = baseToolsResult.rows;
        // :fire: Match with baseTools table
        const matchedBaseTool = baseTools.find(
          (b) => b.service?.toLowerCase() === t.service?.toLowerCase()
        );

        if (t.id) {
          nodes.push({
            id: t.id,
            nodeType: "tool node",
            position: t.position ? JSON.parse(t.position) : { x: 0, y: 0 },
            data: {
              label: t.name,
              description: t.description,
              inputFields: t.input,
              service: t.service?.toLowerCase() ?? "",
              connected: t.connected,
              basetoolId: matchedBaseTool?.id ?? null,
              selectedObject: t?.object,
              toolAction: t?.operation,
              configOauth: {
                oauth_connecname: t?.oauth_connecname,
                oauth_id: t?.oauth_id,
              },
            },
          });
        }
      }
      const agentTask = tasks.filter((t) => t.agent_id === agent.id);
      for (const task of agentTask) {
        if (task.id) {
          nodes.push({
            id: `${task.id}`,
            nodeType: "task node",
            position: task.position
              ? JSON.parse(task.position)
              : { x: 0, y: 0 },
            data: {
              task: {
                name: task.name,
                description: task.description,
                expected_output: task.expected_output,
                async_execution: task?.async_execution || false,
                human_input: task?.human_input || false,
                markdown: task?.markdown || false,
                guardrail_max_retries: task?.guardrail_max_retries || 0,
              },
            },
          });
        }
      }
    }

    // Tasks

    // 5️⃣ Safely parse edges
    let edges = [];
    if (workflow.edges) {
      if (typeof workflow.edges === "string") {
        try {
          edges = JSON.parse(workflow.edges);
        } catch (e) {
          console.warn("Edges parse failed, using raw:", e);
          edges = [];
        }
      } else {
        edges = workflow.edges; // already object or array
      }
    }

    // 6️⃣ Build response JSON
    const workflowData = {
      id: workflow.id,
      name: workflow.name,
      memoryEnabled: workflow.memory,
      agentType: "react",
      nodes,
      edges,
    };

    console.log(
      "Workflow  Id based data---->",
      JSON.stringify(workflowData, null, 2)
    );

    res.status(200).json({ success: true, data: workflowData });
  } catch (err) {
    console.error("Error fetching workflow:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const testworkflow = async (request, response) => {
  const { id } = request.body;
  console.log("Testing workflow with Id:", id?.id);
  try {
    if (id?.id) {
      console.log("Auto-refreshing any expired OAuth tokens for workflow");
      await refreshAllTokens(id.id);

      let config = {};
      const workflow = (
        await db.query(
          `SELECT id,name,memory,agent_src_files,task_src_files,type, edges FROM ${process.env.WORKFLOW} WHERE id=$1`,
          [id?.id]
        )
      )?.rows[0];
      // const agents = await getSuperAgentsFromEdges(workflow?.edges);
      // console.log("agent id--->",agents);
      const tools = (
        await db.query(
          `SELECT o.custom_tool_id as custom_tool_id, r.object as object
     FROM ${process.env.REGISTERTOOL} AS r 
     INNER JOIN ${process.env.CONFIG_TOOL} AS o
      ON r.oauth_id = o.id
     WHERE r.workflow_id = $1`,
          [id?.id]
        )
      ).rows;
      // 1️⃣ Fetch agent → custom_tool_id + object
      let mappingResult = await db.query(
        `
    SELECT json_object_agg(agent_name, tools) AS agent_tools
    FROM (
      SELECT 
        a.name AS agent_name,
        json_agg(
          json_build_object(
            'custom_tool_id', o.custom_tool_id,
            'object', r.object
          )
        ) AS tools
      FROM ${process.env.AGENT} AS a
      INNER JOIN ${process.env.REGISTERTOOL} AS r 
        ON a.id = r.agent_id
          INNER JOIN ${process.env.CONFIG_TOOL} AS o
        ON o.id = r.oauth_id
      WHERE a.workflow_id = $1
      GROUP BY a.name
    ) sub;
  `,
        [id?.id]
      );

      let toolMapping = mappingResult.rows[0]?.agent_tools;

      // 2️⃣ Convert to nested-tool-id → simple array of IDs
      for (const agent in toolMapping) {
        const tools = toolMapping[agent];

        toolMapping[agent] = await Promise.all(
          tools.map(async (tool) => {
            const nestedTool = await db.query(
              `SELECT id
           FROM ${process.env.CUSTOMNESTEDTOOL}
           WHERE name = $1 AND custom_tool_id = $2`,
              [tool.object, tool.custom_tool_id]
            );
            const filter = await db.query(`SELECT * FROM ${process.env.CUSTOMNESTEDTOOL} where custom_tool_id=$1`, [tool?.custom_tool_id]);
            if (nestedTool?.rows?.length > 0) {
              return filter?.rows?.length > 1 && nestedTool?.rows?.length > 0 ? nestedTool?.rows?.[0]?.id : tool.custom_tool_id;
            }

            return tool.custom_tool_id;
          })
        );
      }

      console.log("FINAL RESULT", toolMapping);

      const agentMappingLLM = await db.query(
        `SELECT a.name as name, rm.model_name as model_name, rm.provider as provider, rm.api_key as api_key, rm.temperature as temperature, rm.max_completion_tokens as max_completion_tokens,
        rm.top_p as top_p FROM 
        ${process.env.AGENT} AS a INNER JOIN ${process.env.REGISTERMODEL} AS rm ON a.id=rm.agent_id WHERE a.workflow_id=$1`,
        [id?.id]
      );
      const toolParams = await db.query(
        `
        SELECT 
          r.id,
          jsonb_strip_nulls(
            jsonb_build_object(
              'access_token', NULLIF(o.access_token, ''),
              'instance_url', NULLIF(o.instance_url, '')
            )
          ) AS credentials,
          json_build_object(
            'operation', r.operation,
            'tool_description', r.description,
            'input_fields', r.input
          ) AS user_inputs,
           r.object as object,
           r.oauth_id as oauth_id,
           o.custom_tool_id as custom_tool_id
        FROM ${process.env.REGISTERTOOL} AS r
        INNER JOIN ${process.env.CONFIG_TOOL} AS o 
          ON r.oauth_id = o.id
        WHERE r.workflow_id = $1
        GROUP BY r.id, o.access_token, o.instance_url, o.refresh_token, r.operation,o.custom_tool_id
        `,
        [id?.id]
      );
      const toolParamsMapping = await ToolParams(toolParams?.rows);
      const toolIds = await Promise.all(
        tools?.map(async (row) => {
          const toolsId = await db.query(
            `SELECT id
         FROM ${process.env.CUSTOMNESTEDTOOL}
         WHERE name = $1
           AND custom_tool_id = $2`,
            [row?.object, row?.custom_tool_id]
          );
          const filter = await db.query(`SELECT * FROM ${process.env.CUSTOMNESTEDTOOL} where custom_tool_id=$1`, [row?.custom_tool_id]);
          if (toolsId?.rows?.length > 0 && filter?.rows?.length > 1) {
            return toolsId?.rows?.[0]?.id || row?.custom_tool_id; // fallback
          }
          return row?.custom_tool_id;
        })
      );

      const toolAgentLLMMapping = ToolAgentLlmMapping(agentMappingLLM?.rows);
      console.log("toolAgentLLMMapping---->", toolAgentLLMMapping);
      console.log("tool params--->", toolParamsMapping);
      config = {
        ...config,
        workflow_id: id?.id,
        class_name: workflow?.name,
        memory_enabled: workflow?.memory,
        exec_type: workflow?.type,
        // manager_agent:workflow?.type ==='sequential' ? null : agents?.[0]?.name,
        manager_agent: workflow?.type === 'sequential' ? null : 'customer agent',
        agent_content: workflow?.agent_src_files,
        task_path: workflow?.task_src_files,
        tool_input: toolIds,
        tool_params: {
          ...toolParamsMapping,
        },
        env_datas: {
          // default: {
          //   llm: false,
          //   tool: true,
          //   api_key: "6e25b61bda760c57e6462b1aa5639190db9317b3",
          //   model: "",
          //   provider: "SERPER",
          // },
          ...toolAgentLLMMapping,
        },
        tool_agent_mapping: toolMapping,
      };

      console.log("\n" + "=".repeat(60));

      console.log("CONFIG AS JSON (copy-paste friendly):");
      console.log("=".repeat(60));
      console.log(JSON.stringify(config, null, 2));
      // const res = await fetch(
      //   "${process.env.BACKEND_API_URL}:8002/api/agent_configs/",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(config),
      //   }
      // );
      // const data = await res.json();
      // console.log("Response from agent_configs:", data?.details);
      response.status(200).json({
        status: "success",
        message: "Agent Test working fine",
        // data: data?.details,
        // data: config
      });
    }
  } catch (error) {
    console.error("Error in workflow controller:", error);
    response
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};

const testchatbot = async (request, response) => {
  const { port, query } = request.body;
  try {
    // const queryrun_process = (
    //   await db.query(
    //     `SELECT * FROM ${process.env.RUNPROCESS} WHERE port=$1 AND status=$2`,
    //     [port, "active"]
    //   )
    // )?.rows;
    // console.log("queryrun_process queryrun_process[0]?.port --->",queryrun_process[0]?.port);

    console.log("port--->", port);
    // console.log("query--->", query, `${process.env.BACKEND_API_URL}:${port}/ask`);

    const postMessage = await fetch(`${process.env.BACKEND_API_URL}:${port}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: query }),
    });
    console.log("postMessage--->", postMessage);
    console.log("successfully data has retrived-->");
    const data = await postMessage.json();
    console.log("data---->", data);
    console.log("data from chatbot--->", data);
    response.status(200)?.json({
      status: "success",
      message: "retrieve the response",
      data: data,
    });

  } catch (error) {
    console.error("chatbot facing the some issues-->", error);
    response
      ?.status(500)
      ?.json({ status: "error", message: "Internal Server Error" });
  }
};

module.exports = {
  getWorkflow,
  createWorkflow,
  getWorkflowById,
  testworkflow,
  testchatbot,
  // createdemoworkflow,
  cancelChatbot,
  updateWorkflow,
};
