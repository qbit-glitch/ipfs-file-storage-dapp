// api/transactions.js
import { Pool } from 'pg';

// Consolidated connection configuration
const getPoolConfig = () => ({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

// Utility function for hash validation
const validateHash = (hash) => {
  const MAX_HASH_LENGTH = 255;
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  if (hash.length > MAX_HASH_LENGTH || hash.length === 0) {
    return false;
  }
  return true;
};

// Memoize pool to prevent multiple pool creations
let pool;
const getPool = () => {
  if (!pool) {
    pool = new Pool(getPoolConfig());
  }
  return pool;
};

export default async (req, res) => {
  // Enhanced CORS handling
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to database pool
    const pool = getPool();

    if (req.method === 'GET' && req.query.type === 'count') {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM transactions`;
        const result = await pool.query(countQuery);
        res.status(200).json({
          count: parseInt(result.rows[0].count, 10)
        });
        return;
      } catch (err) {
        console.error("Error counting records:", err);
        res.status(500).json({ 
          error: "Failed to count records",
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
        return;
      }
    }

    if (req.method === 'GET') {
      const requestedLimit = parseInt(req.query.limit);
      const limit = !isNaN(requestedLimit) ? Math.min(Math.max(1, requestedLimit), 100) : 10;

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
        return;
      } catch (err) {
        console.error("Error retrieving records:", err);
        res.status(500).json({ 
          error: "Failed to retrieve records",
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
        return;
      }
    }

    // Default method not allowed
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ 
      error: "Unexpected server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};