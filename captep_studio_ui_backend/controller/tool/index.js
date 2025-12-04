const { db } = require("../../dbconnect");

require("dotenv").config();

const getTools = async (request, response) => {
  try {
    const getListOfTools = (
      await db.query(`SELECT c.name AS name, c.name AS name,
    json_agg(
        json_build_object(
            'sname', ct.name,
            'description', ct.description,
            'id', ct.id,
            'icon', ct.icon_path
        )
    ) AS tools_list FROM ${process.env.CATEGORY} AS c INNER JOIN ${process.env.CUSTOMTOOL} AS ct ON c.id=ct.category_id GROUP BY c.name`)
    )?.rows;

    const query = (
      await db.query(`
            SELECT 
                c.name, 
                json_agg(
                    json_build_object(
                        'id', n.id, 
                        'name', n.name, 
                        'description',n.description,
                        'type', n.type
                    )
                ) AS list 
            FROM node AS n 
            INNER JOIN ${process.env.CATEGORY} AS c ON n.category_id = c.id 
            GROUP BY c.name
        `)
    )?.rows;

    response.status(200).json({
      status: "success",
      message: "retrieve all tools successfully",
      data: { tool: getListOfTools, node: query },
    });
  } catch (error) {
    response
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};

const getToolId = async (req, res) => {
  try {
    const { id } = req.body;

    // 1️⃣ Check base tool exists
    const baseTool = (
      await db.query(
        `SELECT id FROM base_tools WHERE id = $1`,
        [id]
      )
    ).rows[0];

    if (!baseTool) {
      return res.status(404).json({
        status: "error",
        message: "Tool not found"
      });
    }

    // 2️⃣ Fetch nested tools
    const rows = (
      await db.query(
        `
        SELECT 
            nt.id AS nested_tool_id,
            nt.name AS nested_tool_name,
            at.action_name,
            at.input_fields
        FROM basenested_tools nt
        LEFT JOIN basenested_action_tools at
            ON at.basenested_tools_id = nt.id
        WHERE nt.custom_tool_id = $1;
        `,
        [id]
      )
    ).rows;

    // 3️⃣ Group JSON cleanly
    const grouped = {};

    rows.forEach(r => {
      if (!grouped[r.nested_tool_id]) {
        grouped[r.nested_tool_id] = {
          SObjectName: r.nested_tool_name,
          actions: []
        };
      }

      if (r.action_name) {
        grouped[r.nested_tool_id].actions.push({
          action_name: r.action_name,
          input_fields: r.input_fields
        });
      }
    });

   
    return res.status(200).json({
      status: "success",
      message: "retrieved tools",
      data: Object.values(grouped),
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
};



const getIntegrationTools = async (request, response) => {
  const { tool_id, created_by } = request.body;
  console.log("getIntegrationTools -- req body", request.body)
  try {
    const retrieveIntegrationTools = (
      await db.query(
        `SELECT id, name, created_at, updated_at, expire_in FROM ${process.env.CONFIG_TOOL} where custom_tool_id=$1 AND created_by=$2 order by created_at desc`,
        [tool_id, created_by] 
      )
    )?.rows;

    response.status(200).json({
      status: "success",
      message: "Retrieved Successfully",
      data: retrieveIntegrationTools || [],
    });
  } catch (error) {
    console.error("Error retrieving Integration tools: ", error);
    response
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};

const getCreatedListOfTools = async (request, response) => {
  const { created_by } = request.body;

  try {
    const query = `
      SELECT 
        r.name,
        r.description,
        r.service AS type,
        r.created_at,
        r.updated_at,
        r.connected,
        json_build_object(
          'id', u.id,
          'name', u.first_name || ' ' || u.last_name
        ) AS created_by
      FROM ${process.env.REGISTERTOOL} AS r
      INNER JOIN ${process.env.USER} AS u 
        ON r.created_by = u.id
      WHERE r.created_by = $1
      ORDER BY r.created_at DESC;
    `;

    const result = await db.query(query, [created_by]);

    response.status(200).json({
      status: "success",
      message: "Retrieved created list of tools successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error retrieving list of created tools:", error);
    response.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const createRegisterTool = async (request, response) => {
  try {
    const { name, description, inputjson, created_by } = request.body;
    console.log("create REgister tools---->>", request.body )
    if (!name || !description || !input || !created_by) {
      return response.status(400).json({
        status: "error",
        message: "Missing required fields: name, description, input, created_by",
      });
    }
    const insertQuery = `
      INSERT INTO ${process.env.REGISTERTOOL}
        (name, description, input, created_by, created_at, updated_at)
      VALUES
        ($1, $2, $3::jsonb, $4, NOW(), NOW())
      RETURNING id, name, description, input, created_at;
    `;
    const result = await db.query(insertQuery, [
      name,
      description,
      JSON.stringify(inputjson),
      created_by,
    ]);
    response.status(201).json({
      status: "success",
      message: "Tool registered successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating register tool:", error);
    response.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  getTools,
  getToolId,
  getIntegrationTools,
  getCreatedListOfTools,
  createRegisterTool
};
