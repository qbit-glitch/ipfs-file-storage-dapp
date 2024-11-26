// api/transactions.js
import { Pool } from 'pg';
import { validateHash } from './utils'; // Assuming you create a utils file for validation

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }, // Adjust as necessary for your production environment
});

export default async (req, res) => {
  if (req.method === 'POST') {
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

      // Notify new transaction if in development mode
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
  } else if (req.method === 'GET') {
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
    } catch (err) {
      console.error("Error retrieving records:", err);
      res.status(500).json({ 
        error: "Failed to retrieve records",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
};

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