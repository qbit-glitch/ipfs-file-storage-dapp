// index.js
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const serverless = require("serverless-http");

const MAX_HASH_LENGTH = 255;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const app = express();

// CORS configuration for Vercel
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL] // Your frontend URL
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware
app.use(bodyParser.json());

// API Routes (same as before)
app.post("/api/transactions", async (req, res) => {
  const { hash } = req.body;

  if (!validateHash(hash)) {
    return res.status(400).json({
      error: "Invalid hash format",
      details: "Hash must be a non-empty string of maximum 255 characters"
    });
  }

  try {
    const query = `
      INSERT INTO transactions (hash) 
      VALUES ($1) 
      RETURNING id, hash, timestamp
    `;
    const result = await pool.query(query, [hash]);

    if (process.env.NODE_ENV === 'development') {
      await pool.query(`NOTIFY new_transaction, '${result.rows[0].id}'`);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error storing hash:", err);
    res.status(500).json({
      error: "Failed to store hash",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get("/api/transactions", async (req, res) => {
  const requestedLimit = parseInt(req.query.limit);
  const limit = !isNaN(requestedLimit) ? 
    Math.min(Math.max(1, requestedLimit), MAX_LIMIT) : 
    DEFAULT_LIMIT;

  try {
    const query = `
      SELECT id, hash, timestamp 
      FROM transactions 
      ORDER BY timestamp DESC 
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    res.status(200).json({
      transactions: result.rows,
      limit: limit,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error retrieving records:", err);
    res.status(500).json({
      error: "Failed to retrieve records",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Export the handler for Vercel
module.exports.handler = serverless(app);
