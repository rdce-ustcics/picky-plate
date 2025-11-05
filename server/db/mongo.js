// server/db/mongo.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbName =
      process.env.MONGODB_DB ||
      process.env.DB_NAME ||
      'pickaplate';

    const isProd = process.env.NODE_ENV === 'production';
    mongoose.set('autoIndex', !isProd);
    mongoose.set('strictQuery', false);

    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/pickaplate';

    const conn = await mongoose.connect(uri, {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => console.log('🟢 Mongoose connected'));
mongoose.connection.on('reconnected', () => console.log('🟡 Mongoose reconnected'));
mongoose.connection.on('disconnected', () => console.log('⚠️  Mongoose disconnected'));
mongoose.connection.on('error', (err) => console.error(`❌ Mongoose error: ${err}`));

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed (SIGINT)');
  process.exit(0);
});

module.exports = connectDB;
