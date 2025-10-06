require("dotenv").config();
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  await client.connect();
  const db = client.db(process.env.DB_NAME || "pappy_demo");
  const dishes = db.collection("dishes");
  const users = db.collection("users");

  // Insert dishes if missing
  const sample = [
    {
      name: "Sinigang na Baboy",
      region: "Luzon",
      img: "/images/sinigang.jpg",
      desc: "Sour stew flavored with tamarind.",
      recipe: ["1 kg pork belly", "8 cups water", "tamarind base", "salt/pepper"],
    },
    {
      name: "Adobong Manok",
      region: "Luzon",
      img: "/images/adobo.jpg",
      desc: "Chicken braised in vinegar and soy sauce.",
      recipe: ["1 kg chicken", "1/2 cup soy", "1/2 cup vinegar", "garlic", "bay leaves"],
    },
    {
      name: "Kare-Kare",
      region: "Luzon",
      img: "/images/karakare.jpg",
      desc: "Peanut-based stew with oxtail and veggies.",
      recipe: ["oxtail", "peanut butter", "banana heart", "string beans", "eggplant", "bagoong"],
    },
  ];
  for (const d of sample) {
    await dishes.updateOne({ name: d.name }, { $setOnInsert: d }, { upsert: true });
  }

  // Add one dish to the first user as a favorite
  const user = await users.findOne({}, { projection: { _id: 1 } });
  if (user) {
    const sinigang = await dishes.findOne({ name: "Sinigang na Baboy" }, { projection: { _id: 1 } });
    await users.updateOne(
      { _id: user._id },
      { $addToSet: { favorites: sinigang._id } }
    );
    console.log("Seeded favorites for user:", user._id.toString());
  } else {
    console.log("No users found. Register/login first, then bookmark from Explorer.");
  }

  await client.close();
  process.exit(0);
})();
