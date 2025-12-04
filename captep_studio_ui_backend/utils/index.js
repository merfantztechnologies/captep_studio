const { db } = require("../dbconnect");

const generateState = () => {
  return require("crypto").randomBytes(16).toString("hex");
};

const transformWorkflowToPayload = (workflow, workflow_id) => {
  const payload = {
    workflow_id: workflow_id,
  };
  // STEP 1: filter agent nodes
  let agents = workflow.nodes.filter((n) => n.nodeType === "agent node");
  // STEP 2: Sort agents based on service
  agents.sort((a, b) => {
    const order = {
      "supervisor agent": 1,
      "assistant agent": 2,
    };
    const aOrder = order[a?.data?.service] || 99;
    const bOrder = order[b?.data?.service] || 99;
    return aOrder - bOrder;
  });
  // STEP 3: finalize payload
  for (const agent of agents) {
    const agentKey = agent.data.name;
    payload[agentKey] = {
      role: agent?.data?.role,
      goal: agent?.data?.goal,
      backstory: agent?.data?.backstory,
      function_calling_llm: agent?.data?.function_calling_llm,
      verbose: agent?.data?.verbose,
      allow_delegation: agent?.data?.allow_delegation,
      max_iter: agent?.data?.max_iter,
      max_rpm: agent?.data?.max_rpm,
      max_execution_time: agent?.data?.max_execution_time,
      max_retry_limit: agent?.data?.max_retry_limit,
      allow_code_execution: agent?.data?.allow_code_execution,
      code_execution_mode: agent?.data?.code_execution_mode,
      respect_context_window: agent?.data?.respect_context_window,
      use_system_prompt: agent?.data?.use_system_prompt,
      multimodal: agent?.data?.multimodal,
      inject_date: agent?.data?.inject_date,
      date_format: agent?.data?.date_format,
      reasoning: agent?.data?.reasoning,
      max_reasoning_attempts: agent?.data?.max_reasoning_attempts,
      knowledge_sources: agent?.data?.knowledge_sources,
      embedder: agent?.data?.embedder,
      system_template: agent?.data?.system_template,
      prompt_template: agent?.data?.prompt_template,
      response_template: agent?.data?.response_template,
    };
  }
  return payload;
};

function convertWorkflowToTaskMap(workflow, workflow_id) {
  const { nodes, edges } = workflow;
  const nodeMap = {};
  nodes.forEach((n) => (nodeMap[n.id] = n));

  const taskMap = {
    workflow_id: workflow_id,
  };

  // 1️⃣ Find all task nodes
  const taskNodes = nodes.filter((n) => n.nodeType === "task node");

  taskNodes.forEach((taskNode) => {
    const taskName = taskNode.data.task.name;
    const taskDescription = taskNode.data.task.description;
    const taskOutput = taskNode.data.task.expected_output;
    const asyncExecution = taskNode?.data?.async_execution;
    const humanInput = taskNode?.data?.human_input;
    const markdown = taskNode?.data?.markdown;
    const guardrailMaxRetries = taskNode?.data?.guardrail_max_retries;

    // 2️⃣ Find direct edges where agent → task
    const directEdges = edges.filter((e) => e.target === taskNode.id);
    let agentNode = directEdges
      .map((e) => nodeMap[e.source])
      .find((n) => n && n.nodeType === "agent node");

    // 3️⃣ If no direct agent → task edge, trace indirect agent → agent → task
    if (!agentNode) {
      const fromNodes = directEdges.map((e) => nodeMap[e.source]);
      const fromIds = fromNodes.map((n) => n?.id);
      const upstreamEdges = edges.filter((e) => fromIds.includes(e.target));
      agentNode = upstreamEdges
        .map((e) => nodeMap[e.source])
        .find((n) => n && n.nodeType === "agent node");
    }

    const agentName = agentNode?.data?.name || "Unknown Agent";

    // 4️⃣ Add to result
    taskMap[taskName] = {
      description: taskDescription,
      expected_output: taskOutput,
      async_execution: asyncExecution,
      human_input: humanInput,
      markdown: markdown,
      guardrail_max_retries: guardrailMaxRetries,
      agent: agentName,
    };
  });

  return taskMap;
}

const ToolParams = async (data) => {
  const formatted = {};
  console.log("data in tool params", data);

  for (const row of data) {
    let toolsId = null;

      toolsId = await db.query(
        `SELECT id 
         FROM ${process.env.CUSTOMNESTEDTOOL} 
         WHERE name = $1 
           AND custom_tool_id = $2`,
        [row?.object, row?.custom_tool_id] // 🔥 FIXED HERE
      );
    const filter= await db.query(`SELECT * FROM ${process.env.CUSTOMNESTEDTOOL} where custom_tool_id=$1`,[row?.custom_tool_id]);

    const userInputs = {
      operation: row.user_inputs.operation,
      tool_description: row?.user_inputs?.tool_description
    };

    if (Array.isArray(row.user_inputs.input_fields)) {
      for (const field of row.user_inputs.input_fields) {
        userInputs[field.name] =
          typeof field.value === "object" ? field.value?.name : field.value;
      }
    }

    const key =
      toolsId?.rows?.length > 0 && filter?.rows?.length > 1
        ? toolsId.rows[0].id
        : row?.custom_tool_id; // fallback key
    console.log("tool id", key, toolsId)
    formatted[key] = {
      credentials: row.credentials,
      user_inputs: userInputs,
    };
  }
  console.log('Formatted data ---->',formatted)
  return formatted;
};



const ToolAgentLlmMapping= (data) =>{
  const formatted={};
  data.forEach((row)=>{
    formatted[row.name]={
      llm:true,
      tool:false,
      api_key: row?.api_key,
      model: row?.model_name,
      provider: row?.provider,
      temperature: row?.temperature,
      max_completion_tokens: row?.max_completion_tokens,
      top_p: row?.top_p,
      stream: false,
    }
  })
  return formatted;
}

const getSuperAgentsFromEdges = async (edges) => {
  const superAgentEdges = edges.filter(
    (e) => e.sourceHandle === "tool" || e.sourceHandle === "memory"
  );

  const superAgentIds = [...new Set(superAgentEdges.map((e) => e.source))];

  if (superAgentIds.length === 0) return [];

  const { rows } = await db.query(
    `SELECT id, name FROM agent WHERE id = ANY($1)`,
    [superAgentIds]
  );

  return rows;
};


module.exports = {
  ToolAgentLlmMapping,
  ToolParams,
  generateState,
  transformWorkflowToPayload,
  convertWorkflowToTaskMap,
  getSuperAgentsFromEdges
};
