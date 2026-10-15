import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows DNS SRV record resolution issue for MongoDB Atlas in local dev
if (process.platform === 'win32' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore
  }
}

// Global cached connection for Serverless (Vercel / AWS) & fast re-use
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async (uri) => {
  if (cached.conn) {
    return cached.conn;
  }

  const connectionUri =
    uri ||
    process.env.MONGODB_URI ||
    'mongodb+srv://mern:Nagoor271@test.gg7r1on.mongodb.net/employee_task_db?retryWrites=true&w=majority&appName=Test';

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(connectionUri, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB connected to database:', mongooseInstance.connection.name);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }

  return cached.conn;
};
