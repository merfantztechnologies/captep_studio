const { Pool } = require("pg");
require("dotenv").config();

const connectDB = async () => {
  try {
    await db.query("SELECT NOW()");
    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Database Connection Failed:", error);
  }
};

const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = { db, connectDB };
