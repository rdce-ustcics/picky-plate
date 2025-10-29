const mongoose = require('mongoose');
const { Schema } = mongoose;

const settingSchema = new Schema({
  key: { type: String, unique: true, required: true, index: true },
  data: { type: Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', settingSchema);
