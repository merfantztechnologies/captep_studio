const querystring = require("querystring");
const crypto = require("crypto");
const https = require("https");
const { generateState } = require("../../utils");
const { db } = require("../../dbconnect");

const SALESFORCE_DOMAIN = process.env.SALESFORCE_DOMAIN || "login.salesforce.com";
const stateToCodeVerifier = new Map(); // Temporary PKCE store

// ---------- Utility Functions ----------
function base64Url(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier() {
  return base64Url(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64Url(hash);
}

// ---------- Build Authorization URL ----------
async function buildAuthorizeUrl(platform, state) {
  const provider = (await db.query(`SELECT * FROM ${process.env.INTEGRATION} WHERE custom_tool_id=$1`, [platform])).rows[0];

  console.log("provider--->", provider)
  if (!provider) return null;

  const scopeValue = Array.isArray(provider?.scope)
    ? provider.scope.join(" ")
    : String(provider.scope || "").trim();

  const params = {
    client_id: provider?.client_id,
    redirect_uri: provider?.redirecturl,
    response_type: provider?.responsetype,
    scope: scopeValue,
    state
  };

  if (["gmail", "calendar"].includes(platform) || provider?.authorizeurl?.includes("google")) {
    params.access_type = "offline";
    params.prompt = "consent"; // Forces refresh_token even on repeat login
  }

  if (provider?.pkce) {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    stateToCodeVerifier.set(state, codeVerifier);
    params.code_challenge = codeChallenge;
    params.code_challenge_method = "S256";
  }

  return `${provider?.authorizeurl}?${querystring.stringify(params)}`;
}

// ---------- HTTPS Request Helper (no fetch) ----------
function httpsPost(url, data) {
  return new Promise((resolve, reject) => {
    const { hostname, pathname, search } = new URL(url);
    const options = {
      hostname,
      path: pathname + (search || ""),
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 400) {
            return reject(new Error(`Token exchange failed (${res.statusCode}): ${body}`));
          }
          resolve(json);
        } catch (err) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(querystring.stringify(data));
    req.end();
  });
}

// ---------- Exchange Code for Token ----------
async function exchangeCodeForToken(platform, code, state) {
  console.log("called exchangeCodeforToken",platform,code,state)
  let platformCap = platform
  ? platform.charAt(0).toUpperCase() + platform.slice(1)
  : platform;
  if (platformCap === "Googlecalendar") {
    platformCap = "GoogleCalendar";
  }
  const platformId= (await db.query(`SELECT * FROM ${process.env.CUSTOMTOOL} WHERE name=$1`, [platformCap]))?.rows[0]?.id;
  console.log("data-->",platformId)
  const provider = (await db.query(`SELECT * FROM ${process.env.INTEGRATION} WHERE custom_tool_id=$1`, [platformId]))?.rows[0];
  if (!provider) throw new Error("Invalid platform");
  console.log("called exchange",{
    client_id: provider?.client_id,
    client_secret: provider?.client_secret,
    code,
    grant_type: provider?.granttype,
    redirect_uri: provider?.redirecturl
  });
  const body = {
    client_id: provider?.client_id,
    client_secret: provider?.client_secret,
    code,
    grant_type: provider?.granttype,
    redirect_uri: provider?.redirecturl
  };

  if (provider?.pkce) {
    const codeVerifier = await stateToCodeVerifier.get(state);
    if (codeVerifier) {
      body.code_verifier = codeVerifier;
      stateToCodeVerifier.delete(state);
    }
  }
  console.log("before final step",provider?.tokenurl,body)
  const responseData= await httpsPost(provider?.tokenurl, body);
  console.log("\n responseData--->");
  console.log(JSON.stringify(responseData, null, 2));

  let expireInDate = null;

  if (platformCap.toLowerCase() === "salesforce") {
    // Salesforce uses `issued_at` (milliseconds)
    if (responseData.issued_at) {
      const issuedAt = parseInt(responseData.issued_at, 10);
      // Default: 2 hours (7200 seconds) — standard for most orgs
      const ACCESS_TOKEN_TTL_SECONDS = 7200;
      expireInDate = new Date(issuedAt + ACCESS_TOKEN_TTL_SECONDS * 1000);
      console.log("Salesforce: Using issued_at for expiry");
      console.log("Issued at:", new Date(issuedAt).toISOString());
    }
  } else if (responseData.expires_in) {
    // Google, QuickBooks, etc.
    const expiresIn = parseInt(responseData.expires_in, 10);
    expireInDate = new Date(Date.now() + expiresIn * 1000);
    console.log("Using expires_in:", expiresIn);
  } else {
    console.warn("No expiry info found in token response");
  }
  
  console.log("Token will expire at (expire_in column):", expireInDate?.toISOString());

  console.log("after final step")
  return {responseData,platformId, expireInDate}
}

// ---------- OAuth Callback ----------
const oauth = async (req, res) => {
  try {
    const { platform } = req.params;
    let oauth;
    const { code, state, error } = req.query;
    console.log("code--->", code, platform, state, error)
    if (error) return res.status(400).json({ status: "error", message: String(error) });
    if (!platform || !code)
      return res.status(400).json({ status: "error", message: "Missing platform or code" });

    const tokenData = await exchangeCodeForToken(platform, code, state);
    console.log("tokenData---->", tokenData)

    const { responseData, platformId, expireInDate } = tokenData;

    if (tokenData) {
      const resultQuery = await db.query(
        `INSERT INTO ${process.env.CONFIG_TOOL} 
        (custom_tool_id, access_token, refresh_token, instance_url, 
          expire_in, updated_at, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          platformId,
          responseData.access_token,
          responseData.refresh_token || null,
          responseData.instance_url || null,
          expireInDate,           // THIS IS THE CORRECT DATE (NOT expires_in number!)
          new Date(),
          new Date()
        ]
      );

      const saved = resultQuery.rows[0];
      console.log("SAVED TO DB! expire_in =", saved.expire_in?.toISOString());

      oauth={
        status:true,
        message: "Successfully Integrated",
        data: resultQuery?.rows[0]?.id
      }
      const messageData = JSON.stringify(oauth);
      const targetOrigin = "*"; // Match your frontend origin
      
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Success</title>
          </head>
          <body>
            <script>
              (function() {
                const messageData = ${messageData};
                const targetOrigin = "${targetOrigin}";
                
                console.log("Sending message to parent:", messageData);
                
                if (window.opener) {
                  window.opener.postMessage(messageData, targetOrigin);
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                } else {
                  console.error("No window.opener found");
                  document.body.innerHTML = "<p>Authentication successful! You can close this window.</p>";
                }
              })();
            </script>
            <p>Authentication successful! This window will close automatically...</p>
          </body>
        </html>
      `);
    } else {
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ---------- Integration Starter ----------
const integrationService = async (req, res) => {
  try {
    const { platform } = req.body;
    if (!platform)
      return res.status(400).json({ status: "error", message: "platform is required" });


    const stateParam = generateState();
    console.log("s-->",stateParam)
    const authorizeUrl = await buildAuthorizeUrl(platform, stateParam);
    res.status(200).json({
      status: "success",
      platform,
      authorizeUrl,
      state: stateParam
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const createConnection=async(request,response)=>{
    const { id, name, created_by} = request.body;
    console.log("ID:", id);
    console.log("Name:", name);
    try{
        const updateQuery=await db.query(`UPDATE ${process.env.CONFIG_TOOL} SET name=$1, created_by=$2 WHERE id=$3 RETURNING *`,[name,created_by,id]);
        
        if(updateQuery.rows.length === 0){
            return response.status(404).json({status:"error", message:"Connection not found"});
        }

        const updatedRow = updateQuery.rows[0];
        console.log("NAME SAVED IN DB:", updatedRow.name);
        
        response.status(200).json({status:"success", message:"Connection updated successfully", data:updateQuery.rows[0]});
    }catch(error){
        console.error("Error updating connection:", error);
        response.status(500).json({status:"error", message:"Internal Server Error"});
    }
}

const refreshAllTokens = async (workflowId) => {
  const now = new Date();

  // 1. Get all OAuth configs linked to tools in this workflow
  const result = await db.query(`
    SELECT DISTINCT
      ct.id AS config_tool_id,
      ct.refresh_token,
      ct.expire_in,
      ct.access_token,
      ct.instance_url,
      ct.custom_tool_id,
      i.client_id,
      i.client_secret,
      i.tokenurl
    FROM ${process.env.CONFIG_TOOL} ct
    JOIN ${process.env.REGISTERTOOL} rt ON rt.oauth_id = ct.id
    JOIN ${process.env.INTEGRATION} i ON ct.custom_tool_id = i.custom_tool_id
    WHERE rt.workflow_id = $1
      AND ct.refresh_token IS NOT NULL
  `, [workflowId]);

  const refreshPromises = result.rows.map(async (config) => {

    // Skip — If they have no refresh_token
    if (!config.refresh_token) {
      return { config_tool_id: config.config_tool_id, refreshed: false, skipped: true };
    }

    // Main logic: Is token expired OR expiring soon (within 5 minutes)?
    const tokenExpiryTime = config.expire_in ? new Date(config.expire_in) : null;
    const isExpired = !tokenExpiryTime || tokenExpiryTime <= now;

    // 5-minute buffer: refresh if expires in < 5 min
    const expiresSoon = tokenExpiryTime
      ? new Date(tokenExpiryTime - 5 * 60 * 1000) <= now
      : false;
    if (!isExpired && !expiresSoon) {
      console.log(`Token still valid for config_tool_id: ${config.config_tool_id}`);
      return { config_tool_id: config.config_tool_id, refreshed: false };
    }
    console.log(`Token expired for config_tool_id: ${config.config_tool_id}, refreshing...`);
    try {
      const body = {
        grant_type: "refresh_token",
        refresh_token: config.refresh_token,
        client_id: config.client_id,
        client_secret: config.client_secret,
      };
      const tokenResponse = await httpsPost(config.tokenurl, body);
      // Determine expiry
      let newExpireIn = null;
      const platformRes = await db.query(
        `SELECT name FROM ${process.env.CUSTOMTOOL} WHERE id = $1`,
        [config.custom_tool_id]
      );
      const platformName = platformRes.rows[0]?.name?.toLowerCase() || "";
      if (platformName.includes("salesforce") && tokenResponse.issued_at) {
        const issuedAt = parseInt(tokenResponse.issued_at, 10);
        newExpireIn = new Date(issuedAt + 7200 * 1000); // Salesforce: 2 hours
      } else if (tokenResponse.expires_in) {
        newExpireIn = new Date(Date.now() + tokenResponse.expires_in * 1000);
      }
      // Update DB
      await db.query(`
        UPDATE ${process.env.CONFIG_TOOL}
        SET
          access_token = $1,
          instance_url = COALESCE($2, instance_url),
          expire_in = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [
        tokenResponse.access_token,
        tokenResponse.instance_url || null,
        newExpireIn,
        config.config_tool_id
      ]);
      console.log(`Token refreshed successfully for config_tool_id: ${config.config_tool_id}`);
      return { config_tool_id: config.config_tool_id, refreshed: true, newToken: tokenResponse.access_token };
    } catch (error) {
      console.error(`Failed to refresh token for config_tool_id ${config.config_tool_id}:`, error.message);
      if (error.message.includes("invalid_grant") || error.message.includes("expired")) {
        // Optionally mark as invalid so UI can prompt re-auth
        await db.query(`UPDATE ${process.env.CONFIG_TOOL} SET expire_in = NOW() - INTERVAL '1 day' WHERE id = $1`, [config.config_tool_id]);
      }
      return { config_tool_id: config.config_tool_id, refreshed: false, error: error.message };
    }
  });
  return await Promise.all(refreshPromises);
};

module.exports = { oauth, integrationService, createConnection, refreshAllTokens };