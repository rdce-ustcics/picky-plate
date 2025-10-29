// server/scripts/seedRoles.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB =', mongoose.connection.name);

    // 1) Default missing roles to 'user'
    const def = await User.updateMany(
      { $or: [{ role: { $exists: false } }, { role: null }] },
      { $set: { role: 'user' } }
    );
    console.log('Defaulted to user:', def.modifiedCount);

    // 2) Promote admins (case-insensitive match)
    const admins = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    for (const rawEmail of admins) {
      const re = new RegExp(`^${escapeRegex(rawEmail)}$`, 'i');
      const before = await User.findOne({ email: re }).lean();
      if (!before) {
        console.log(`No user found for ${rawEmail}. Did you sign up with this email in DB "${mongoose.connection.name}"?`);
        continue;
      }
      const res = await User.updateOne({ _id: before._id }, { $set: { role: 'admin' } });
      console.log(`Admin set for ${before.email}: +${res.modifiedCount}`);
    }

    // 3) Show the result for quick sanity
    const show = await User.find(
      { email: { $in: admins } },
      { email: 1, role: 1 }
    ).lean();
    console.log('Now in DB:', show);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
