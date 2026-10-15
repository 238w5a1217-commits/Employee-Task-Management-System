import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows DNS SRV record resolution issue for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if unable to override DNS servers
}

export const connectDB = async (uri) => {
  const connectionUri =
    uri ||
    process.env.MONGODB_URI ||
    'mongodb+srv://mern:Nagoor271@test.gg7r1on.mongodb.net/employee_task_db?retryWrites=true&w=majority&appName=Test';

  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(connectionUri);
    console.log('✅ MongoDB connected successfully to database:', mongoose.connection.name);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};
