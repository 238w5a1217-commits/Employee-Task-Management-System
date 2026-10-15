import app from '../src/server/server.js';
import { connectDB } from '../src/server/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB serverless connection error:', err);
    return res.status(500).json({
      error: 'Database connection failed: ' + (err.message || 'Unknown error'),
    });
  }

  return app(req, res);
}
