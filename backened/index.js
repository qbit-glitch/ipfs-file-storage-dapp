// index.js
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Create a new table for storing hashes
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      hash VARCHAR(255) NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};

let transaction = [];

// Check database connection
const checkDatabaseConnection = async () => {
  try {
    await pool.connect();
    console.log("Connected to the database successfully!");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1); // Exit the process with failure
  }
};

// Listen for new transaction notifications
const listenForNotifications = async () => {
  const client = await pool.connect();
  await client.query('LISTEN new_transaction');

  client.on('notification', (msg) => {
    console.log("New transaction added:", msg.payload);
  });

  // Handle errors
  client.on('error', (err) => {
    console.error("Error in notification listener:", err);
  });
};

// Call the connection check and table creation
const init = async () => {
  await checkDatabaseConnection();
  await createTable();
  await listenForNotifications(); // Start listening for notifications
};

// Endpoint to store a new hash
app.post("/api/transactions", async (req, res) => {
  const { hash } = req.body;
  try {
    const query = "INSERT INTO transactions (hash) VALUES ($1) RETURNING *";
    const result = await pool.query(query, [hash]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to store hash" });
  }
});

// Endpoint to retrieve records
app.get("/api/transactions", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // Default limit to 10
  try {
    const query = "SELECT * FROM transactions ORDER BY timestamp DESC LIMIT $1";
    const result = await pool.query(query, [limit]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve records" });
  }
});

// Endpoint to get the total number of transactions
// Endpoint to get the total number of transactions
app.get('/api/transactions/count', async (req, res) => {
    try {
        const query = "SELECT COUNT(*) AS count FROM transactions"; // Query to count the total number of transactions
        const result = await pool.query(query);
        const count = parseInt(result.rows[0].count); // Get the count from the result
        res.json({ count }); // Respond with the count in JSON format
    } catch (err) {
        console.error("Error fetching total transactions:", err);
        res.status(500).json({ error: "Failed to fetch total transactions" });
    }
});

// Start the server
init()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("Failed to initialize the server:", err);
  });