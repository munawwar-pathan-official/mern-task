const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern-task';
  try {
    // Attempt standard connection with 3s timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB Connected successfully to: ${uri}`);
  } catch (err) {
    console.warn(`Could not connect to MongoDB at ${uri}. Starting embedded MongoMemoryServer...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`Connected to MongoMemoryServer at: ${memUri}`);
    } catch (memErr) {
      console.error('Failed to start MongoMemoryServer:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
