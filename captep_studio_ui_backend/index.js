const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./dbconnect");
const routes = require("./routes"); // make sure this matches your exports

dotenv.config(); // load environment variables first

const app = express();

// Middleware
app.use(cors("*"));
app.use(express.json()); // use express built-in body parser

// Routes
app.use("/api/v1", routes);

// Port
const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
  });
