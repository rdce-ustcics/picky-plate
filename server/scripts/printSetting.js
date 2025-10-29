const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Setting = require(path.join(__dirname, '..', 'models', 'Setting.js')); // ✅ singular

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'pickaplate',
    });
    console.log('DB =', mongoose.connection.name);

    const doc = await Setting.findOne({ key: 'cultural_explorer' }).lean();
    console.log('cultural_explorer =>', JSON.stringify(doc, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
