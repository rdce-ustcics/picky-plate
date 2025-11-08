require("dotenv").config();
const mongoose = require("mongoose");
const CulturalRecipe = require("../models/CulturalRecipe");

(async () => {
  const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'pickaplate';
  await mongoose.connect(process.env.MONGODB_URI, { dbName });

  const sample = await CulturalRecipe.findOne({ name: 'Adobo' }).lean();

  console.log('Current Database Structure for Adobo:');
  console.log('=====================================');
  console.log('Name:', sample.name);
  console.log('Region:', sample.region);
  console.log('Description:', sample.desc.substring(0, 60) + '...');
  console.log('Image URL:', sample.img);
  console.log('Recipe array length:', sample.recipe.length);
  console.log('\nFirst 5 recipe items:');
  sample.recipe.slice(0, 5).forEach((item, i) => {
    console.log(`  [${i+1}] ${item}`);
  });
  console.log('\nLast 3 recipe items:');
  sample.recipe.slice(-3).forEach((item, i) => {
    console.log(`  [${sample.recipe.length - 3 + i + 1}] ${item}`);
  });

  console.log('\n\nCurrent Schema Fields:');
  console.log('======================');
  console.log(Object.keys(sample));

  await mongoose.connection.close();
  process.exit(0);
})();
