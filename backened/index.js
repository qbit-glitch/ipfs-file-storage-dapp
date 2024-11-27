// index.js
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// Constants
const MAX_HASH_LENGTH = 255;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const app = express();

// CORS configuration based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL] // Your frontend Vercel URL
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
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Direct PostgreSQL configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Create transactions table
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      hash VARCHAR(${MAX_HASH_LENGTH}) NOT NULL,
      address VARCHAR(42) NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT hash_not_empty CHECK (hash <> '')
    );
    
    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp 
    ON transactions(timestamp DESC);

    CREATE INDEX IF NOT EXISTS idx_transactions_address
    ON transactions(address);
  `;
  try {
    await pool.query(query);
    console.log('Table creation successful');
  } catch (err) {
    console.error('Table creation failed:', err);
    throw err;
  }
};

// Hash validation
const validateHash = (hash) => {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  if (hash.length > MAX_HASH_LENGTH || hash.length === 0) {
    return false;
  }
  // Optional: Add additional hash format validation
  return true;
};

// validation functions for validating address
const validateAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  // Basic Ethereum address validation (0x followed by 40 hex characters)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};


// Database connection check with retry mechanism
const checkDatabaseConnection = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log("Database connection successful!");
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed:`, err);
      if (i === retries - 1) {
        throw new Error("Failed to connect to database after multiple attempts");
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Notification listener setup
const listenForNotifications = async () => {
  if (process.env.NODE_ENV === 'development') {
    const setupListener = async () => {
      const client = await pool.connect();
      await client.query('LISTEN new_transaction');
      
      client.on('notification', (msg) => {
        console.log("New transaction added:", msg.payload);
      });

      client.on('error', async (err) => {
        console.error("Error in notification listener:", err);
        client.release();
        setTimeout(setupListener, 5000);
      });

      return client;
    };

    try {
      await setupListener();
    } catch (err) {
      console.error("Failed to set up notification listener:", err);
      setTimeout(setupListener, 5000);
    }
  }
};

// API Routes
// POST route for transactions
// Modify the POST route in index.js
app.post("/api/transactions", async (req, res) => {
  const { hash, address } = req.body;

  if (!validateHash(hash)) {
    return res.status(400).json({ 
      error: "Invalid hash format",
      details: "Hash must be a non-empty string of maximum 255 characters"
    });
  }

  if (!validateAddress(address)) {
    return res.status(400).json({ 
      error: "Invalid address format",
      details: "Address must be a valid Ethereum address"
    });
  }

  try {
    const query = `
      INSERT INTO transactions (hash, address) 
      VALUES ($1, $2) 
      RETURNING id, hash, address, timestamp
    `;
    const result = await pool.query(query, [hash, address]);
    
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

// GET route to filter by user address
app.get("/api/transactions", async (req, res) => {
  const requestedLimit = parseInt(req.query.limit);
  const userAddress = req.query.address;
  const limit = !isNaN(requestedLimit) ? 
    Math.min(Math.max(1, requestedLimit), MAX_LIMIT) : 
    DEFAULT_LIMIT;

  try {
    let query, params;
    if (userAddress) {
      query = `
        SELECT id, hash, timestamp 
        FROM transactions 
        WHERE address = $1
        ORDER BY timestamp DESC 
        LIMIT $2
      `;
      params = [userAddress, limit];
    } else {
      query = `
        SELECT id, hash, timestamp 
        FROM transactions 
        ORDER BY timestamp DESC 
        LIMIT $1
      `;
      params = [limit];
    }

    const result = await pool.query(query, params);
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

app.get('/api/transactions/count', async (req, res) => {
  try {
    const query = "SELECT COUNT(*) AS count FROM transactions";
    const result = await pool.query(query);
    const count = parseInt(result.rows[0].count);
    
    res.json({ 
      count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error fetching total transactions:", err);
    res.status(500).json({ 
      error: "Failed to fetch total transactions",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Error handling for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  try {
    await pool.end();
    console.log('Database pool has ended');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Initialize function
const init = async () => {
  await checkDatabaseConnection();
  await createTable();
  if (process.env.NODE_ENV === 'development') {
    await listenForNotifications();
  }
};

// Development server
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  init()
    .then(() => {
      app.listen(port, () => {
        console.log(`Development server running on http://localhost:${port}`);
      });
    })
    .catch(err => {
      console.error("Failed to initialize the server:", err);
      process.exit(1);
    });
}

// Export for Vercel
module.exports = app;