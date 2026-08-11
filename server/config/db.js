const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  // Use MONGODB_URI environment variable or default to live MongoDB Atlas cluster
  const defaultAtlasUri = 'mongodb+srv://admin:myPassword$10@cluster0.zlqwoa5.mongodb.net/mern-task?retryWrites=true&w=majority';
  const uri = process.env.MONGODB_URI || defaultAtlasUri;

  try {
    // Attempt standard connection with 5s timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected successfully to database`);
  } catch (err) {
    console.warn(`Could not connect to primary MongoDB at ${uri}. Reason: ${err.message}`);
    console.warn(`Starting embedded MongoMemoryServer fallback...`);
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
