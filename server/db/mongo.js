const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Prefer MONGODB_DB, fall back to DB_NAME (if you still have it)
    const dbName =
      process.env.MONGODB_DB ||
      process.env.DB_NAME || // optional fallback
      'pickaplate';

    // Helpful defaults; tune if you like
    const isProd = process.env.NODE_ENV === 'production';

    // In dev, allow autoIndex so your unique indexes get created automatically.
    // In prod, you usually keep this false and create indexes via migrations or admin routes.
    mongoose.set('autoIndex', !isProd);

    // Optional: silence strictQuery deprecation warnings (use true if you want stricter behavior)
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
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

// Connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected');
});
mongoose.connection.on('reconnected', () => {
  console.log('🟡 Mongoose reconnected');
});
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected');
});
mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose error: ${err}`);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed (SIGINT)');
  process.exit(0);
});

module.exports = connectDB;
