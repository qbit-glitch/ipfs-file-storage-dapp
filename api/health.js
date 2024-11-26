// api/health.js
export default async (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  };