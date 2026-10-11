const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not set. MongoDB connection skipped.');
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
}

module.exports = connectDB;
