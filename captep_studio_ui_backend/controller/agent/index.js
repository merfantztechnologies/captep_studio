const { db } = require("../../dbconnect");
const getListOfTools = async (request, response) => {
  try {
    const queryConnecter = `SELECT * FROM ${process.env.CUSTOMTOOL}`;
    const result = await db.query(queryConnecter);
    if (result?.rows?.length > 0) {
      response
        .status(200)
        .json({
          status: "success",
          message: "List of Tools Fetched Successfully",
          data: result?.rows,
        });
    }
  } catch (error) {
    response
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};
const createTask = async (request, response) => {
  const { task_name, description, expected_output, agent_id, created_by } =
    request.body;
  try {
    const insertQuery = `INSERT INTO ${process.env.TASK} (name, description, expected_output, agent_id, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await db.query(insertQuery, [
      task_name,
      description,
      expected_output,
      agent_id,
      created_by,
    ]);
    if (result?.rows?.length > 0) {
      response.status(201).json({
        status: "success",
        message: "Task Created Successfully",
        data: result?.rows[0],
      });
    }
  } catch (error) {
    response
      .statuc(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};
const   getModels = async (request, response) => {
  try {
    console.log("called models");
    const queryListOfModels = `
      SELECT
        provider,
        json_agg(
          json_build_object(
            'name', name,
            'model_name', modal_name,
            'icon_path', icon_path
          )
        ) AS models
      FROM ${process.env.LISTOFMODEL}
      GROUP BY provider
      ORDER BY provider;
    `;
    const result = await db.query(queryListOfModels);
    console.log("query successful");
    if (result?.rows?.length > 0) {
      response.status(200).json({ status: "success", data: result?.rows });
    } else {
      response.status(200).json({ status: "success", data: [] });
    }
  } catch (error) {
    console.error(error); // log error for debugging
    response
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};
const createAgent = async (request, response) => {
  const { agent_name, instruction, goal, backstory } = request.body;
  try {
    const insertQuery = `INSERT INTO ${process.env.AGENTS} (agent_name, instruction, goal, backstory) VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await db.query(insertQuery, [
      agent_name,
      instruction,
      goal,
      backstory,
    ]);
    if (result?.rows?.length > 0) {
      response.status(201).json({
        status: "success",
        messsage: "Agent Created Successfully",
        data: result?.rows[0],
      });
    }
  } catch (error) {
    response
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};
const getAllAgents = async (request, response) => {
  const { userId } = request.body;
  // console.log("getAllAgents userId", userId);
  try {
    const query = `
      SELECT
        a.id,
        a.name,
        a.created_at,
        a.updated_at,
        CONCAT(u.first_name, COALESCE(' ' || u.last_name, '')) AS created_by,
        t.name AS task,
        w.name AS workflow
      FROM ${process.env.AGENT} a
      INNER JOIN ${process.env.USER} u ON a.created_by = u.id
      LEFT JOIN ${process.env.WORKFLOW} w ON a.workflow_id = w.id
      LEFT JOIN ${process.env.TASK} t ON t.agent_id = a.id
      WHERE a.created_by = $1
      ORDER BY a.created_at DESC;
    `;
    const result = await db.query(query, [userId]);
    const agents = result?.rows ?? [];
    // console.log("Fetched agents:", agents);
    response.status(200).json({
      status: "success",
      message: "All agents fetched successfully",
      data: agents,
    });
  } catch (error) {
    console.error("getAllAgents error:", error);
    response.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
const getAgent = async (request, response) => {
  const { agentId } = request.body;
  console.log("getAgent called with agentId:", agentId);
  try {
    const query = `
      SELECT
        a.name,
        a.description,
        a.role,
        a.goal,
        a.backstory,
        json_agg(
          json_build_object(
            'id',          t.id,
            'name',        t.name,
            'description', t.description,
            'service',     t.service
          )
        ) FILTER (WHERE t.id IS NOT NULL) AS tools
      FROM ${process.env.AGENT} a
      LEFT JOIN ${process.env.REGISTERTOOL} t ON a.id = t.agent_id
      WHERE a.id = $1
      GROUP BY a.id, a.name, a.description, a.role, a.goal, a.backstory;
    `;
    const result = await db.query(query, [agentId]);
    const agent = result.rows[0];
    console.log("Fetched agent:", agent);
    response.status(200).json({
      status: "success",
      message: "Agent fetched successfully",
      data: agent,
    });
  } catch (error) {
    response
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};
const testAgent = async (request, response) => {
  try {
    // const payload = {
    //   "workflow_id" : "8c55e4e0-a0e5-464f-8d89-d24b3f722ecc",
    //   idea_analyzer: {
    //     role: "Business Idea Validation and Market Research Expert",
    //     goal: "Analyze the provided business type, budget, and target audience to assess market feasibility and identify potential opportunities or risks.",
    //     backstory:
    //       "A data-driven business analyst specialized in evaluating startup ideas. With expertise in market research, trend analysis, and competitor benchmarking, this agent ensures that only practical and high-demand business ideas move forward. It validates assumptions and refines the idea into a realistic opportunity before development."
    //   },
    //   plan_builder: {
    //     role: "Strategic Business Planner and Operations Architect",
    //     goal: "Convert a validated business idea into a detailed operational and financial plan, including setup strategy, team structure, resource allocation, and budget utilization roadmap.",
    //     backstory:
    //       "A seasoned startup consultant who has helped numerous founders turn their raw ideas into structured business models. Skilled at breaking down abstract concepts into actionable steps, this agent defines the foundation for a sustainable business setup."
    //   },
    //   growth_strategist: {
    //     role: "Marketing, Branding, and Expansion Specialist",
    //     goal: "Develop customer acquisition strategies, branding frameworks, and long-term growth plans that align with the business model and target market.",
    //     backstory:
    //       "A creative marketing strategist and brand architect who has scaled startups into profitable ventures. With deep knowledge of digital marketing, customer psychology, and scalability tactics, this agent designs data-backed strategies for sustainable growth and brand visibility."
    //   },
    // };
    const payload = {
      workflow_id: "8c55e4e0-a0e5-464f-8d89-d24b3f722ecc",
      idea_validation_task: {
        description:
          "Analyze the provided business details — business type, budget, location, and target audience — and validate whether the business idea is feasible. Conduct lightweight market research (demand, competitors, trends) and recommend refinements if necessary.",
        expected_output:
          "A structured report summarizing idea feasibility, insights on market demand, and improvement recommendations.",
        agent: "ideal_analyzer",
        name: "idea validator",
      },
      business_plan_task: {
        description:
          "Based on the validated idea, create a detailed operational plan that includes: Business model outline (products/services, value proposition), Cost breakdown and suggested budget utilization, Resource and staffing requirements, Short-term and long-term operational goals, Step-by-step plan for setting up the business",
        expected_output:
          "A clear and concise business plan document ready for implementation, structured as bullet points or sections.",
        agent: "plan_builder",
      },
      growth_strategy_task: {
        description:
          "Using the business plan and market context, create a growth roadmap that focuses on customer acquisition and brand building. Include: Ideal marketing channels and campaign ideas, Branding tone and positioning, Pricing and promotion suggestions, Customer retention and feedback mechanisms, Growth metrics and KPIs",
        expected_output:
          "A strategic marketing and growth plan designed for early-stage execution and scaling.",
        agent: "growth_strategist",
      },
    };
    // const postData = await fetch(
    //   "http://DESKTOP-5KUI11E:8000/api/create-agent/",
    //   {
    //     method: "POST",
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //     body: JSON.stringify(payload),
    //   }
    // );
    const postData = await fetch(
      "http://DESKTOP-5KUI11E:8001/api/create-task/",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    console.log("postData", postData.status);
    response
      .status(200)
      .json({ status: "success", message: "Agent Tested Successfully" });
  } catch (error) {
    response
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};
module.exports = {
  getListOfTools,
  getModels,
  createAgent,
  getAgent,
  testAgent,
  createTask,
  getAllAgents,
};
