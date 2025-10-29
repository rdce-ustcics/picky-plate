const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// ✅ point exactly to server/models/Setting.js (singular)
const Setting = require(path.join(__dirname, '..', 'models', 'Setting.js'));

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'pickaplate',
    });
    console.log('DB =', mongoose.connection.name);

    const payload = {
      enabled: true,
      featuredRegions: ['Ilocano', 'Kapampangan'],
      rotationDays: 7,
      description: '',
    };

    const doc = await Setting.findOneAndUpdate(
      { key: 'cultural_explorer' },
      { $set: { data: payload, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();

    console.log('Upserted settings:', doc);
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
})();
