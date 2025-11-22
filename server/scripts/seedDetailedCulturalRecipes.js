// MongoDB Seeder Script for Filipino Cultural Recipes
// Based on The Kitchn's "48 Delicious Filipino Recipes" 
// Regional categorization based on culinary research

const recipes = [
  // ==================== LUZON DISHES ====================
  {
    name: "Filipino Chicken Adobo",
    desc: "The national dish of the Philippines featuring chicken braised in vinegar, soy sauce, garlic, and black peppercorns. This iconic dish predates Spanish colonization and represents the perfect balance of salty, sour, and savory flavors.",
    region: "Luzon",
    img: "/images/chicken-adobo.jpg",
    ingredients: [
      "5 garlic cloves, smashed and peeled",
      "3 pounds chicken thighs, drumsticks, or combination",
      "1/2 teaspoon kosher salt",
      "1 tablespoon neutral oil",
      "3 dried bay leaves",
      "2 teaspoons whole black peppercorns",
      "1/2 cup soy sauce",
      "1/2 cup cane vinegar",
      "1/4 cup water",
      "3 tablespoons oyster sauce",
      "2 tablespoons granulated sugar"
    ],
    instructions: [
      "Smash and peel garlic cloves. Pat chicken dry with paper towels and season all over with kosher salt.",
      "Heat neutral oil in Dutch oven or large heavy-bottomed pot over medium-high heat until shimmering.",
      "Working in 2 batches, add chicken to pot (skin-side down if using thighs). Sear until browned on all sides, about 6 minutes per batch. Transfer to plate.",
      "Place garlic, bay leaves, and peppercorns in pot. Stir until garlic cloves and peppercorns are slightly toasted and fragrant, 30 seconds to 1 minute.",
      "Add water, soy sauce, cane vinegar, and oyster sauce, scraping any brown bits on bottom.",
      "Return chicken to pot and bring to boil. Reduce heat and simmer uncovered until chicken is cooked through and tender, about 30-35 minutes.",
      "Optional: For crispy skin, broil chicken for few minutes at end.",
      "Serve over rice with sauce."
    ]
  },
  {
    name: "Chicken Adobo with Coconut Milk (Adobo sa Gatâ)",
    desc: "A luxurious variation of the classic adobo enriched with creamy coconut milk. Popular in regions with abundant coconuts, this version adds richness and depth to the traditional vinegar-soy base.",
    region: "Luzon",
    img: "/images/adobo-sa-gata.jpg",
    ingredients: [
      "8 garlic cloves, coarsely chopped",
      "1 Fresno chile (half sliced into rounds, half finely chopped)",
      "2 pounds bone-in chicken (thighs or drumsticks)",
      "1 cup soy sauce (divided)",
      "2 1/2 teaspoons black pepper (divided)",
      "2 tablespoons vegetable oil",
      "1/2 cup cane vinegar",
      "1/2 cup coconut milk",
      "1/2 cup water",
      "2 tablespoons raw sugar",
      "4 bay leaves",
      "2 scallions, thinly sliced (for garnish)",
      "Cooked rice (for serving)"
    ],
    instructions: [
      "Season chicken with 1 tablespoon soy sauce and 1/2 teaspoon pepper.",
      "Brown chicken skin-side down in oil over medium-high heat.",
      "Add garlic, chile, remaining soy sauce, vinegar, coconut milk, water, sugar, bay leaves, and remaining pepper.",
      "Bring to a boil, then reduce heat and simmer partially covered for 20 minutes.",
      "Flip chicken and continue simmering uncovered until tender and sauce thickens, about 15 minutes.",
      "Garnish with scallions and serve with rice."
    ]
  },
  {
    name: "Bistek Tagalog",
    desc: "Filipino beef steak featuring thin slices of beef marinated in soy sauce and calamansi, then seared with caramelized onion rings. A Spanish-influenced dish with distinctly Filipino flavors.",
    region: "Luzon",
    img: "/images/bistek-tagalog.jpg",
    ingredients: [
      "1 pound boneless ribeye steak, half-frozen then thinly sliced",
      "1 large yellow onion, cut into 1/2-inch thick rounds",
      "4 garlic cloves, thinly sliced",
      "1/2 cup soy sauce",
      "1/2 cup calamansi juice (or substitute with lemon-lime mix)",
      "4 bay leaves",
      "1/2 teaspoon black pepper",
      "2 tablespoons neutral oil (divided)"
    ],
    instructions: [
      "Freeze steak until half-frozen for easier slicing (about 1 hour), then slice thinly.",
      "Marinate sliced steak with soy sauce, calamansi juice, onion rounds, garlic, bay leaves, and pepper for at least 4 hours or overnight.",
      "Remove onions from marinade. Sear onion rounds in oil until caramelized. Set aside.",
      "Remove beef from marinade (reserve marinade). Sear beef briefly, about 1-2 minutes per side.",
      "Add reserved marinade and a splash of water to pan. Bring to boil and simmer to reduce slightly.",
      "Return beef to pan briefly to coat with sauce.",
      "Serve beef topped with caramelized onions and sauce over rice."
    ]
  },
  {
    name: "Ginataan na Sugpo",
    desc: "A Bicolano specialty featuring prawns cooked in rich coconut milk with aromatics. This dish showcases Bicol's love for coconut milk and spicy flavors, creating a creamy, savory seafood stew.",
    region: "Luzon",
    img: "/images/ginataan-na-sugpo.jpg",
    ingredients: [
      "3 tablespoons neutral oil",
      "2-inch piece fresh ginger, peeled and julienned",
      "4 garlic cloves, smashed and peeled",
      "3 anchovy fillets",
      "1 stalk lemongrass, trimmed and smashed",
      "8 ounces tomatoes, chopped",
      "2 cans (13.5 oz each) coconut milk",
      "1/2 teaspoon kosher salt",
      "1/4 teaspoon black pepper",
      "1 1/2 pounds head-on prawns, rinsed",
      "3 cups greens (baby spinach, taro leaves, or chile leaves)",
      "Thai chiles (optional, for serving)"
    ],
    instructions: [
      "Sauté ginger, garlic, anchovies, and lemongrass in oil until fragrant.",
      "Add tomatoes and cook until they collapse and release juices.",
      "Pour in coconut milk and bring to a boil.",
      "Reduce heat and simmer until reduced by about a quarter, stirring occasionally.",
      "Season with salt and pepper.",
      "Add prawns, cover and cook until pink and opaque, about 5 minutes.",
      "Add greens and cook until wilted, about 2 minutes.",
      "Serve hot with rice and optional Thai chiles."
    ]
  },
  {
    name: "Kare-Kare",
    desc: "A festive oxtail and vegetable stew in rich peanut sauce, traditionally from Pampanga. This labor-of-love dish is reserved for special occasions and always served with fermented shrimp paste (bagoong).",
    region: "Luzon",
    img: "/images/kare-kare.jpg",
    ingredients: [
      "2 pounds oxtails",
      "2 pounds beef short ribs",
      "12 cups beef broth (divided)",
      "8 garlic cloves, smashed",
      "2 tablespoons kosher salt",
      "2 bay leaves",
      "1 tablespoon whole black peppercorns",
      "1/4 cup neutral oil",
      "1 medium yellow onion, diced",
      "6 garlic cloves, minced",
      "2 cups smooth peanut butter",
      "1/4 cup all-purpose flour",
      "2 tablespoons annatto powder",
      "2 Japanese eggplants, cut into 2-inch pieces",
      "1 pound long green beans, cut into 2-inch pieces",
      "1 pound baby bok choy, halved lengthwise",
      "Bagoong guisado (sautéed fermented shrimp paste) for serving"
    ],
    instructions: [
      "Pre-boil oxtails and short ribs with 8 cups broth, garlic, salt, bay leaves, and peppercorns until tender (2.5-3 hours).",
      "Strain and reserve the broth. Set meat aside.",
      "In a large pot, sauté onion and minced garlic in oil until fragrant.",
      "Add peanut butter, flour, and annatto powder. Stir to combine.",
      "Gradually add 6-8 cups of reserved broth to create smooth sauce.",
      "Return meat to pot and simmer for 20 minutes.",
      "Blanch vegetables separately and add to stew just before serving.",
      "Serve with bagoong guisado and rice."
    ]
  },
  {
    name: "Lechon Kawali",
    desc: "Crispy deep-fried pork belly with crackling skin. This Tagalog dish is the home cook's version of whole roasted lechon, featuring perfectly crispy skin and tender meat.",
    region: "Luzon",
    img: "/images/lechon-kawali.jpg",
    ingredients: [
      "3 pounds pork belly, skin on",
      "8 cups water",
      "1/4 cup kosher salt (divided)",
      "6 garlic cloves, smashed",
      "2 tablespoons whole black peppercorns",
      "4 bay leaves",
      "2 tablespoons soy sauce",
      "Vegetable oil for deep frying",
      "Vinegar-based dipping sauce or liver sauce (for serving)"
    ],
    instructions: [
      "Boil pork belly with water, 2 tablespoons salt, garlic, peppercorns, bay leaves, and soy sauce until tender (about 1 hour).",
      "Remove pork and let cool completely. Pat very dry with paper towels.",
      "Optional: Refrigerate overnight uncovered to dry out skin further.",
      "Score the skin and rub with remaining salt.",
      "Heat oil to 350°F in a deep pot or wok.",
      "Carefully lower pork into oil (it will splatter violently - use a splatter screen).",
      "Deep-fry until skin is golden brown and crispy, about 15-20 minutes.",
      "Drain on paper towels and let rest 5 minutes before slicing.",
      "Serve immediately with dipping sauce."
    ]
  },
  {
    name: "Sinigang na Baboy",
    desc: "A sour tamarind-based soup with pork and vegetables, representing the Filipino love for sour flavors. This comfort food from Tagalog regions is perfect for rainy days.",
    region: "Luzon",
    img: "/images/sinigang-baboy.jpg",
    ingredients: [
      "1 1/2 pounds pork ribs (spareribs or baby back ribs)",
      "2 tablespoons neutral oil",
      "8 ounces tomatoes, chopped",
      "1 large yellow onion, diced",
      "3 garlic cloves, crushed",
      "5 cups water",
      "1 whole hot green pepper",
      "2 tablespoons tamarind soup base (Knorr or Mama Sita's)",
      "2 tablespoons fish sauce",
      "1 teaspoon kosher salt",
      "8 ounces daikon radish, peeled and cut into 1/2-inch half-moons",
      "2 cups green beans, trimmed and cut into 2-inch pieces",
      "2 cups spinach or kangkong (water spinach)"
    ],
    instructions: [
      "Sear pork ribs in oil until browned on all sides. Set aside.",
      "In the same pot, sauté tomatoes, onion, and garlic until softened.",
      "Return ribs to pot with water, green pepper, tamarind base, fish sauce, and salt.",
      "Bring to boil then simmer until pork is tender, about 30 minutes.",
      "Add daikon and green beans. Cook until vegetables are tender, about 10 minutes.",
      "Add spinach and cook until wilted, about 2 minutes.",
      "Taste and adjust sourness with more tamarind base if desired.",
      "Serve hot with steamed rice."
    ]
  },
  {
    name: "Gising-Gising",
    desc: "A spicy vegetable dish from Nueva Ecija featuring green beans in coconut milk with shrimp paste. The name means 'wake-up wake-up' referring to its spicy kick that awakens the palate.",
    region: "Luzon",
    img: "/images/gising-gising.jpg",
    ingredients: [
      "2 tablespoons canola oil",
      "4 shallots, thinly sliced",
      "6 garlic cloves, minced",
      "1 1/2 Chinese sausages, sliced",
      "8 ounces ground pork",
      "2 tablespoons bagoong (shrimp paste)",
      "1 can (14 oz) coconut milk",
      "1 pound green beans, cut into 1-inch pieces",
      "2 Fresno chiles, deseeded and sliced",
      "1 tablespoon oyster sauce",
      "1 1/2 teaspoons fish sauce",
      "1 teaspoon black pepper",
      "1/2 teaspoon kosher salt",
      "Crushed pork rinds (for garnish)"
    ],
    instructions: [
      "Heat oil and sauté shallots and garlic until fragrant.",
      "Add Chinese sausage and cook until slightly crispy.",
      "Add ground pork and cook until browned, breaking up lumps.",
      "Stir in bagoong (shrimp paste) and cook for 1 minute.",
      "Pour in coconut milk and bring to a simmer.",
      "Simmer until sauce reduces and oil starts to separate, about 10 minutes.",
      "Add green beans and chiles. Cook until beans are crisp-tender.",
      "Season with oyster sauce, fish sauce, pepper, and salt.",
      "Serve over rice topped with crushed pork rinds."
    ]
  },
  {
    name: "Tocino",
    desc: "Sweet cured pork from Pampanga, traditionally eaten for breakfast. The meat is marinated in sugar, salt, and spices, giving it a distinctive sweet-savory flavor and red color.",
    region: "Luzon",
    img: "/images/tocino.jpg",
    ingredients: [
      "2 pounds pork shoulder, sliced thinly",
      "1/2 cup brown sugar",
      "1/4 cup pineapple juice",
      "2 tablespoons soy sauce",
      "1 tablespoon salt",
      "1 teaspoon Prague powder #1 (optional, for color)",
      "4 garlic cloves, minced",
      "1/2 teaspoon black pepper",
      "Red food coloring (optional)"
    ],
    instructions: [
      "Partially freeze pork for easier slicing, about 1 hour.",
      "Slice pork into 1/4-inch thick pieces.",
      "Mix all marinade ingredients in a bowl.",
      "Add pork slices and mix thoroughly to coat.",
      "Transfer to container and marinate in refrigerator for at least 24 hours, up to 3 days.",
      "To cook: Place tocino in pan with 1/2 cup water.",
      "Bring to boil and simmer until water evaporates.",
      "Continue cooking in rendered fat until caramelized and slightly charred.",
      "Serve with garlic fried rice and fried egg for traditional tocilog."
    ]
  },
  {
    name: "Halo-Halo",
    desc: "The ultimate Filipino shaved ice dessert from Manila. 'Mix-mix' in English, this colorful treat layers sweetened beans, fruits, jellies, and ube with shaved ice and evaporated milk.",
    region: "Luzon",
    img: "/images/halo-halo.jpg",
    ingredients: [
      "2 tablespoons sweetened red beans",
      "2 tablespoons sweetened white beans",
      "2 tablespoons macapuno (coconut sport)",
      "2 tablespoons sweetened jackfruit",
      "2 tablespoons nata de coco",
      "2 tablespoons kaong (sugar palm fruit)",
      "2 tablespoons sweetened saba bananas",
      "2 tablespoons sago pearls",
      "Shaved ice",
      "1/4 cup evaporated milk",
      "2 tablespoons sweetened condensed milk",
      "1 scoop ube ice cream",
      "1 slice leche flan (optional)",
      "2 tablespoons ube halaya",
      "Pinipig or Rice Krispies for topping"
    ],
    instructions: [
      "In a tall glass, layer the sweetened beans, macapuno, jackfruit, nata de coco, kaong, bananas, and sago pearls.",
      "Fill glass with shaved ice, mounding it on top.",
      "Mix evaporated milk and condensed milk, then pour over ice.",
      "Top with a scoop of ube ice cream.",
      "Add a slice of leche flan if using.",
      "Add a spoonful of ube halaya on top.",
      "Sprinkle with pinipig or Rice Krispies.",
      "Serve with a long spoon.",
      "Mix everything together before eating."
    ]
  },
  {
    name: "Palitaw",
    desc: "Sweet rice cakes from Pangasinan that 'float' when cooked. These chewy glutinous rice cakes are coated with grated coconut, sesame seeds, and sugar.",
    region: "Luzon",
    img: "/images/palitaw.jpg",
    ingredients: [
      "2 cups glutinous rice flour",
      "1 cup water",
      "1/2 teaspoon salt",
      "1 cup freshly grated coconut",
      "1/2 cup toasted sesame seeds",
      "1/2 cup granulated sugar"
    ],
    instructions: [
      "Mix glutinous rice flour with water and salt to form a smooth dough.",
      "Divide dough into small portions (about 1 tablespoon each).",
      "Roll each portion into a ball, then flatten into oval discs about 1/4-inch thick.",
      "Bring a pot of water to boil.",
      "Drop flattened dough pieces into boiling water.",
      "When they float to the surface, they're done (about 2-3 minutes).",
      "Remove with slotted spoon and drain.",
      "Mix grated coconut with a pinch of salt.",
      "Mix sesame seeds with sugar.",
      "Roll each palitaw in grated coconut, then sprinkle with sesame-sugar mixture.",
      "Serve as snack or dessert."
    ]
  },
  {
    name: "Tapa",
    desc: "Cured beef strips from Pampanga, traditionally dried in the sun. Modern versions are marinated in soy sauce, calamansi, and garlic, creating a sweet-salty breakfast meat.",
    region: "Luzon",
    img: "/images/tapa.jpg",
    ingredients: [
      "1 pound beef sirloin, cut into thin strips",
      "3 tablespoons soy sauce",
      "3 tablespoons calamansi juice or lemon juice",
      "1 tablespoon garlic, finely minced",
      "1/2 teaspoon sugar",
      "1/8 teaspoon ground pepper",
      "1/4 teaspoon baking soda (optional, for tenderizing)",
      "Oil for frying"
    ],
    instructions: [
      "Pound beef strips with mallet until about 1/4 inch thick.",
      "If using, sprinkle beef with baking soda and mix well.",
      "Add calamansi juice and mix, then add remaining marinade ingredients.",
      "Cover and marinate in refrigerator overnight.",
      "Heat oil in large pan over medium-high heat.",
      "Fry marinated beef strips for 3-5 minutes per side until browned and slightly caramelized.",
      "Serve with garlic fried rice and fried egg for traditional tapsilog.",
      "Accompany with spicy vinegar for dipping."
    ]
  },
  {
    name: "Cassava Cake", 
    desc: "A chewy and sticky cake from Quezon province made with grated cassava, coconut milk, and topped with a creamy custard layer. A popular dessert at Filipino gatherings.",
    region: "Luzon",
    img: "/images/cassava-cake.jpg",
    ingredients: [
      "16 ounces frozen grated cassava, thawed",
      "1 can (14 oz) sweetened condensed milk",
      "1 can (14 oz) coconut milk",
      "1/2 cup coconut cream",
      "2 eggs",
      "1/4 cup melted butter",
      "1/2 cup macapuno strings (optional)",
      "1 teaspoon vanilla extract",
      "For topping: 1/2 cup coconut cream, 1/4 cup condensed milk, 1 egg yolk"
    ],
    instructions: [
      "Preheat oven to 350°F and grease a 9x13 inch baking dish.",
      "Mix grated cassava, condensed milk, coconut milk, coconut cream, eggs, butter, macapuno, and vanilla.",
      "Pour mixture into prepared baking dish.",
      "Bake for 45 minutes until set but still jiggly.",
      "Meanwhile, prepare topping by mixing coconut cream, condensed milk, and egg yolk.",
      "Pour topping over partially baked cassava cake.",
      "Return to oven and bake for another 20 minutes.",
      "Broil for 3-5 minutes until top is golden brown.",
      "Let cool completely before slicing.",
      "Serve at room temperature or chilled."
    ]
  },
  {
    name: "Ensaymada",
    desc: "Soft, buttery brioche-like pastries from Pampanga topped with buttercream and cheese. These Spanish-influenced coiled buns are a beloved morning treat or afternoon snack.",
    region: "Luzon",
    img: "/images/ensaymada.jpg",
    ingredients: [
      "1 cup warm milk",
      "1/3 cup sugar",
      "1/2 cup softened shortening",
      "1 packet active dry yeast",
      "1/4 cup warm water",
      "3 1/2 cups all-purpose flour",
      "3 egg yolks",
      "1/2 teaspoon salt",
      "1/4 cup softened butter (for brushing)",
      "For topping: 1/2 cup softened butter, 1/2 cup powdered sugar, 1 cup grated cheese"
    ],
    instructions: [
      "Proof yeast in warm water with a pinch of sugar for 10 minutes.",
      "Mix warm milk, sugar, shortening, and salt.",
      "Add half the flour and proofed yeast. Mix for 3-5 minutes.",
      "Add egg yolks and remaining flour. Mix until sticky dough forms.",
      "Cover and let rise in warm place for 2-3 hours until doubled.",
      "Divide dough into 16 portions.",
      "Roll each portion into rectangle, brush with butter, then roll into log.",
      "Coil each log and place in greased muffin tin or ensaymada mold.",
      "Let rise again for 30-60 minutes.",
      "Bake at 300°F for 20-25 minutes until golden.",
      "Cool completely, then top with buttercream and grated cheese."
    ]
  },
  {
    name: "Pichi-Pichi",
    desc: "Translucent steamed cassava cakes from Quezon Province, rolled in grated coconut or cheese. These chewy, sweet treats are popular at children's parties.",
    region: "Luzon",
    img: "/images/pichi-pichi.jpg",
    ingredients: [
      "2 cups grated cassava",
      "3/4 cup sugar",
      "1 3/4 cups water",
      "2 teaspoons lye water or 1 tablespoon baking soda solution",
      "Food coloring (optional)",
      "1 cup grated coconut (for coating)",
      "1 cup grated cheese (optional, for coating)"
    ],
    instructions: [
      "Combine cassava, sugar, water, and lye water in a bowl. Mix thoroughly.",
      "Add food coloring if desired.",
      "Pour mixture into individual muffin molds, filling 3/4 full.",
      "Steam for 20-30 minutes until translucent and firm.",
      "Let cool completely (can refrigerate to speed up).",
      "Remove from molds carefully.",
      "Roll each piece in grated coconut or grated cheese.",
      "Serve chilled or at room temperature."
    ]
  },
  {
    name: "Ukoy",
    desc: "Crispy shrimp and vegetable fritters from Marilao, Bulacan. These crunchy pancakes feature whole shrimp on top and are perfect as appetizers or pulutan (beer food).",
    region: "Luzon",
    img: "/images/ukoy.jpg",
    ingredients: [
      "2 cups shredded sweet potato",
      "1 cup shredded carrot",
      "1/2 cup thinly sliced scallions",
      "1/4 cup diced red onion",
      "1 1/4 cups cornstarch",
      "1 cup cold beer or club soda",
      "2 tablespoons fish sauce",
      "1/4 teaspoon kosher salt",
      "20 medium raw shrimp, peeled and deveined",
      "1/2 cup dried anchovies",
      "4 cups vegetable oil for frying",
      "For sauce: 1/2 cup vinegar, 2 tbsp soy sauce, minced garlic and chili"
    ],
    instructions: [
      "Mix shredded vegetables in a bowl.",
      "Make batter by combining cornstarch, beer, fish sauce, and salt.",
      "Heat oil to 350°F.",
      "On an oiled plate, form 3/4 cup vegetables into a nest shape.",
      "Top with 2 shrimp and a few anchovies.",
      "Spoon 2 tablespoons batter over top.",
      "Carefully slide into hot oil using spatula.",
      "Fry for 3 minutes per side until golden brown and crispy.",
      "Drain on paper towels.",
      "Serve immediately with spiced vinegar dipping sauce."
    ]
  },
  {
    name: "Ginataang Bilo-Bilo",
    desc: "Sweet coconut soup with glutinous rice balls from Tuguegarao. This comforting dessert features chewy rice balls, jackfruit, and tapioca pearls in creamy coconut milk.",
    region: "Luzon",
    img: "/images/ginataang-bilo-bilo.jpg",
    ingredients: [
      "1/2 cup mini sago pearls",
      "1 cup glutinous rice flour",
      "1/2 cup water",
      "4 cups coconut milk",
      "1 cup sugar",
      "1 cup coconut cream",
      "1 cup ripe jackfruit, shredded",
      "1 cup sweet potato, diced (optional)",
      "Food coloring (optional, for colored balls)"
    ],
    instructions: [
      "Boil water and cook sago pearls for 15-20 minutes until translucent. Drain and set aside.",
      "Mix glutinous rice flour with water to form smooth dough.",
      "Form dough into small balls (about 1/2 inch diameter).",
      "Optional: Divide dough and add food coloring for variety.",
      "In pot, combine coconut milk and sugar. Bring to gentle simmer.",
      "Add rice balls and cook for 8-10 minutes until they float.",
      "Add sweet potato if using, cook until tender.",
      "Add coconut cream and stir gently.",
      "Add cooked sago and jackfruit. Simmer 3-5 minutes.",
      "Serve hot, warm, or cold with extra coconut cream on top."
    ]
  },
  {
    name: "Arroz Caldo",
    desc: "Filipino rice porridge with Spanish name and Chinese influence, popular in Tagalog regions. This comforting chicken and rice soup is flavored with ginger and topped with fried garlic.",
    region: "Luzon",
    img: "/images/arroz-caldo.jpg",
    ingredients: [
      "1 whole chicken (3-4 pounds), cut into pieces",
      "1 tablespoon canola oil",
      "1 onion, chopped",
      "6 cloves garlic, minced (divided)",
      "4 tablespoons fresh ginger, minced",
      "2 tablespoons fish sauce",
      "1 cup uncooked jasmine rice",
      "6 cups water",
      "2 chicken bouillon cubes",
      "Salt and pepper to taste",
      "3 hardboiled eggs, halved",
      "1/4 cup fried garlic bits",
      "1/4 cup green onions, chopped",
      "Calamansi or lemon wedges"
    ],
    instructions: [
      "In large pot, heat oil and sauté onion, half the garlic, and ginger until softened.",
      "Add chicken pieces and cook until lightly browned.",
      "Add fish sauce and cook for 1-2 minutes.",
      "Add rice and stir for 1-2 minutes until lightly toasted.",
      "Add water and bouillon cubes. Bring to boil.",
      "Reduce heat, cover, and simmer for 45 minutes until rice breaks down and becomes porridge-like.",
      "Stir occasionally to prevent sticking. Add more water if too thick.",
      "Season with salt and pepper.",
      "Meanwhile, fry remaining garlic in oil until golden and crispy.",
      "Serve in bowls topped with hardboiled egg, fried garlic, green onions.",
      "Serve with calamansi and fish sauce on the side."
    ]
  },
  {
    name: "Banana Ketchup",
    desc: "A uniquely Filipino condiment invented in Batangas during WWII when tomatoes were scarce. Made from mashed bananas, vinegar, and spices, it's sweeter than tomato ketchup.",
    region: "Luzon",
    img: "/images/banana-ketchup.jpg",
    ingredients: [
      "4 ripe bananas, mashed",
      "1/2 cup sweet onion, finely chopped",
      "2 cloves garlic, minced",
      "1 Thai red chili pepper, minced (optional)",
      "3/4 cup brown sugar",
      "1/2 cup apple cider vinegar",
      "2 tablespoons tomato paste (for color)",
      "1 tablespoon canola oil",
      "1 teaspoon turmeric",
      "1/2 teaspoon allspice",
      "1/4 teaspoon cinnamon",
      "Salt to taste"
    ],
    instructions: [
      "Heat oil in saucepan over medium heat.",
      "Sauté garlic, onions, and chili until softened, about 5 minutes.",
      "Add mashed bananas, brown sugar, vinegar, tomato paste, turmeric, allspice, and cinnamon.",
      "Bring to boil, then reduce heat.",
      "Simmer for 15-20 minutes, stirring continuously until thickened.",
      "Remove from heat and cool slightly.",
      "Puree with immersion blender until smooth.",
      "Season with salt to taste.",
      "Cool completely before transferring to storage container.",
      "Store in refrigerator for up to 2-3 weeks.",
      "Serve with fried chicken, hot dogs, or Filipino spaghetti."
    ]
  },
  {
    name: "Silog (Sinangag at Itlog)",
    desc: "The iconic Filipino breakfast combination from Marikina/Quezon City. 'Silog' meals pair garlic fried rice and egg with various proteins like tocino, tapa, or longganisa.",
    region: "Luzon",
    img: "/images/silog.jpg",
    ingredients: [
      "3-4 cups cooked rice (day-old, cold preferred)",
      "1 tablespoon canola oil",
      "6-8 cloves garlic, minced",
      "Kosher salt to taste",
      "Black pepper to taste",
      "2-3 eggs",
      "Protein of choice (tocino, tapa, longganisa, spam, bangus, etc.)",
      "Vinegar with chili for dipping"
    ],
    instructions: [
      "Heat oil in large skillet over medium heat.",
      "Add minced garlic and cook until golden brown and fragrant.",
      "Season cold rice with salt and pepper.",
      "Add rice to skillet with garlic oil.",
      "Toss rice until evenly coated with garlic.",
      "Spread rice across skillet and let it sit undisturbed for 6-7 minutes to form crispy bottom.",
      "Meanwhile, cook your chosen protein according to its recipe.",
      "Fry eggs sunny-side up or to preference.",
      "Serve garlic rice with fried egg and protein.",
      "Accompany with spiced vinegar for dipping.",
      "Popular combinations: Tapsilog (tapa), Tocilog (tocino), Longsilog (longganisa)."
    ]
  },

  // ==================== VISAYAS DISHES ====================
  {
    name: "Chicken Inasal",
    desc: "Bacolod's famous grilled chicken marinated in calamansi, vinegar, and annatto oil. This Ilonggo specialty features a unique tangy-savory flavor and signature golden color from annatto.",
    region: "Visayas",
    img: "/images/chicken-inasal.jpg",
    ingredients: [
      "1/2 cup olive oil",
      "1 tablespoon ground annatto (for annatto oil)",
      "2 tablespoons finely chopped lemongrass",
      "2 tablespoons grated ginger",
      "4 garlic cloves, finely grated",
      "1/4 cup packed light brown sugar",
      "1/4 cup soy sauce",
      "1/4 cup cane vinegar",
      "2 tablespoons calamansi juice",
      "1 teaspoon kosher salt",
      "1/2 teaspoon black pepper",
      "3 pounds boneless, skinless chicken thighs"
    ],
    instructions: [
      "Make annatto oil by warming olive oil with annatto powder, then cooling.",
      "Whisk together 1/4 cup annatto oil with lemongrass, ginger, garlic, brown sugar, soy sauce, vinegar, calamansi juice, salt, and pepper.",
      "Marinate chicken in mixture for at least 4 hours or overnight.",
      "Preheat grill to medium-high heat.",
      "Grill chicken, basting frequently with remaining annatto oil.",
      "Cook until internal temperature reaches 165°F, about 6-8 minutes per side.",
      "Let rest 5 minutes before serving.",
      "Serve with rice, atchara (pickled papaya), and sinamak (spiced vinegar)."
    ]
  },
  {
    name: "Lumpiang Sariwa (Fresh Lumpia)",
    desc: "Fresh spring rolls from Negros Occidental filled with vegetables and sometimes shrimp. The Visayan original from Silay City uses no sauce, with flavors mixed directly into the filling.",
    region: "Visayas",
    img: "/images/lumpiang-sariwa.jpg",
    ingredients: [
      "For crepe wrapper: 1 cup flour, 2 eggs, 1 1/2 cups water, 1/2 tsp salt",
      "2 tablespoons oil",
      "3 cloves garlic, minced",
      "1 onion, diced",
      "1/2 pound shrimp, chopped",
      "1/2 pound ground pork",
      "2 cups shredded cabbage",
      "1 cup julienned carrots",
      "1 cup green beans, cut into strips",
      "1 cup heart of palm (ubod), julienned",
      "2 tablespoons soy sauce",
      "Salt and pepper to taste",
      "Lettuce leaves",
      "For sauce: 1/2 cup sugar, 2 tbsp soy sauce, 1/4 cup water, 1 tbsp cornstarch, crushed peanuts"
    ],
    instructions: [
      "Make crepes: Mix wrapper ingredients until smooth. Cook thin crepes in non-stick pan. Set aside.",
      "Heat oil and sauté garlic and onion until fragrant.",
      "Add shrimp and pork, cook until done.",
      "Add vegetables and cook until tender-crisp.",
      "Season with soy sauce, salt, and pepper. Cool.",
      "Make sauce: Combine sugar, soy sauce, water, and cornstarch. Cook until thick.",
      "To assemble: Place lettuce leaf on wrapper.",
      "Add cooled filling.",
      "Fold bottom edge over filling, fold in sides, leave top open.",
      "Drizzle with sauce and sprinkle with crushed peanuts.",
      "Note: Original Silay version mixes seasonings into filling without separate sauce."
    ]
  },
  {
    name: "Kinilaw",
    desc: "Pre-colonial raw fish 'cooked' in vinegar, originating from Southern Visayas over 1000 years ago. This indigenous ceviche predates Spanish influence and showcases fresh seafood with local souring agents.",
    region: "Visayas",
    img: "/images/kinilaw.jpg",
    ingredients: [
      "1 pound fresh tuna or tanigue (Spanish mackerel), cubed",
      "1 cup coconut vinegar or cane vinegar",
      "1/4 cup calamansi juice",
      "1 thumb-sized ginger, julienned",
      "1 red onion, thinly sliced",
      "2-3 Thai chilies, sliced",
      "1 cucumber, diced (optional)",
      "1 green mango, julienned (optional)",
      "Salt and pepper to taste",
      "Coconut cream (optional)"
    ],
    instructions: [
      "Use very fresh fish. Cut into 1/2 inch cubes.",
      "Place fish in a bowl with vinegar and calamansi juice.",
      "Add ginger, onion, and chilies.",
      "Season with salt and pepper.",
      "Marinate for 10-30 minutes until fish turns opaque.",
      "Do not over-marinate or fish becomes tough.",
      "Add cucumber and green mango if using.",
      "Optional: Drizzle with coconut cream before serving.",
      "Serve immediately as appetizer or pulutan.",
      "Note: Different Visayan regions use different souring agents like tamarind or green mango."
    ]
  },

  // ==================== NATIONAL/PAN-PHILIPPINE DISHES ====================
  {
    name: "Lumpia Shanghai",
    desc: "Crispy fried spring rolls filled with seasoned ground pork and vegetables. Despite the name, these Chinese-influenced rolls came from Fujian immigrants and are now essential at every Filipino celebration.",
    region: "Luzon", // Often associated with Chinese-Filipino communities in Manila
    img: "/images/lumpia-shanghai.jpg",
    ingredients: [
      "1 pound ground pork",
      "1 large carrot, peeled and grated",
      "1 small yellow onion, finely chopped",
      "2 medium scallions, finely chopped",
      "3 garlic cloves, grated",
      "1 large egg (yolk for filling, white for sealing)",
      "1/2 cup panko breadcrumbs",
      "1 tablespoon soy sauce",
      "2 teaspoons fish sauce",
      "2 teaspoons oyster sauce",
      "1/4 teaspoon kosher salt",
      "1/4 teaspoon black pepper",
      "Lumpia wrappers",
      "Oil for deep frying",
      "Sweet chili sauce or banana ketchup for dipping"
    ],
    instructions: [
      "Mix ground pork, carrot, onion, scallions, garlic, egg yolk, breadcrumbs, and all seasonings thoroughly.",
      "Place wrapper on flat surface with one corner pointing toward you.",
      "Place 1 tablespoon filling near the bottom corner and form into 5-inch log.",
      "Fold bottom corner over filling tightly.",
      "Fold in side corners and roll tightly.",
      "Seal with egg white.",
      "Heat oil to 350°F.",
      "Fry lumpia in batches until golden brown and crispy, about 3-4 minutes.",
      "Drain on paper towels.",
      "Serve hot with dipping sauce.",
      "Can be frozen before or after frying for later use."
    ]
  },
  {
    name: "Bola-Bola",
    desc: "Filipino meatballs with Chinese-Spanish heritage, featuring a sweet-savory flavor profile. These versatile meatballs are served as appetizers, in soup, or over rice.",
    region: "Luzon", // Common throughout but often associated with Tagalog regions
    img: "/images/bola-bola.jpg",
    ingredients: [
      "1 small yellow onion, grated (1/4 cup)",
      "1 medium carrot, peeled and grated (3/4 cup)",
      "3 garlic cloves, grated",
      "1 pound ground pork",
      "1/2 cup panko breadcrumbs",
      "1 large egg",
      "1 tablespoon soy sauce",
      "2 teaspoons fish sauce",
      "2 teaspoons oyster sauce",
      "1/4 teaspoon kosher salt",
      "1/4 teaspoon black pepper",
      "2 cups neutral oil for frying",
      "Sweet chili sauce for serving"
    ],
    instructions: [
      "Combine all ingredients except oil in a bowl and mix until evenly combined.",
      "Form mixture into 2-tablespoon portions and roll into smooth balls.",
      "Heat oil to 350°F in deep pan.",
      "Fry 10-12 meatballs at a time, turning occasionally.",
      "Cook until golden brown and cooked through, about 5-6 minutes.",
      "Internal temperature should reach 165°F.",
      "Drain on paper towels.",
      "Serve with sweet chili sauce or spiced vinegar.",
      "Can be made 2 days ahead and refrigerated.",
      "Great in pandesal sandwiches or over rice."
    ]
  },
  {
    name: "Picadillo",
    desc: "Filipino version of the Spanish-Latin American ground meat dish, adapted with fish sauce and soy sauce. This one-skillet comfort food features potatoes, carrots, and raisins for sweetness.",
    region: "Luzon", // Spanish colonial influence strongest in Luzon
    img: "/images/picadillo.jpg",
    ingredients: [
      "1 pound lean ground beef or ground pork",
      "1 medium yellow onion, finely chopped",
      "4 garlic cloves, minced",
      "8 ounces russet potatoes, peeled and diced",
      "2 tablespoons vegetable oil",
      "1 teaspoon kosher salt (divided)",
      "1 cup tomato sauce",
      "2 tablespoons tomato paste",
      "1 cup water",
      "1/2 cup raisins",
      "1 cup frozen peas and carrots",
      "1/2 teaspoon black pepper"
    ],
    instructions: [
      "Heat oil in large skillet over medium-high heat.",
      "Brown ground meat with half the salt, breaking into small pieces.",
      "Add onion and cook until translucent.",
      "Add garlic and cook for 1 minute.",
      "Stir in tomato sauce, tomato paste, and water.",
      "Add diced potatoes and bring to simmer.",
      "Cover and cook until potatoes are tender, about 15 minutes.",
      "Add raisins and frozen vegetables.",
      "Season with remaining salt and pepper.",
      "Simmer until vegetables are tender and sauce thickens.",
      "Serve over rice or as filling for empanadas."
    ]
  },
  {
    name: "Mechado",
    desc: "Spanish-influenced beef stew that evolved from Mexican menudo during colonial times. Distinguished by its tomato-based sauce with soy sauce and calamansi, creating a uniquely Filipino flavor.",
    region: "Luzon", // Spanish colonial dish most common in Tagalog areas
    img: "/images/mechado.jpg",
    ingredients: [
      "2 pounds boneless beef chuck roast, cut into 1 1/2-inch pieces",
      "3 tablespoons neutral oil (divided)",
      "1 large yellow onion, diced",
      "6 garlic cloves, minced",
      "1 tablespoon tomato paste",
      "1 can (14.5 oz) diced tomatoes",
      "3 cups beef broth",
      "1/4 cup soy sauce",
      "3 tablespoons cane vinegar",
      "2 bay leaves",
      "1 teaspoon kosher salt",
      "1/2 teaspoon black pepper",
      "2 medium russet potatoes, cut into 1-inch pieces",
      "2 medium carrots, cut into 1-inch pieces",
      "1 red bell pepper, cut into 1-inch pieces"
    ],
    instructions: [
      "Heat 2 tablespoons oil in Dutch oven over medium-high heat.",
      "Sear beef in batches until browned on all sides. Set aside.",
      "Add remaining oil and sauté onion and garlic until softened.",
      "Add tomato paste and cook for 1 minute.",
      "Add diced tomatoes, broth, soy sauce, vinegar, bay leaves, salt, and pepper.",
      "Return beef to pot and bring to boil.",
      "Reduce heat, cover, and simmer for 1.5-2 hours until beef is tender.",
      "Add potatoes and carrots, cook for 20 minutes.",
      "Add bell pepper and cook for 10 more minutes.",
      "Adjust seasoning and serve over rice."
    ]
  },
  {
    name: "Pancit Bihon",
    desc: "Rice noodle stir-fry brought by Chinese immigrants, now a symbol of long life served at birthdays. This versatile dish combines thin rice noodles with vegetables, meat, and seafood.",
    region: "Luzon", // Chinese influence through Manila's Binondo
    img: "/images/pancit-bihon.jpg",
    ingredients: [
      "8 ounces dried rice noodles (bihon)",
      "1 tablespoon toasted sesame oil",
      "2 tablespoons vegetable oil",
      "1 pound boneless chicken breast, cut into strips",
      "1/2 pound shrimp, peeled and deveined",
      "3 cloves garlic, minced",
      "1 onion, sliced",
      "2 cups shredded cabbage",
      "1 cup julienned carrots",
      "1 cup snow peas",
      "3 tablespoons soy sauce",
      "2 cups chicken broth",
      "Salt and pepper to taste",
      "Green onions for garnish",
      "Calamansi wedges for serving"
    ],
    instructions: [
      "Soak rice noodles in warm water until softened, about 15 minutes. Drain.",
      "Heat oils in large wok over high heat.",
      "Stir-fry chicken until cooked through. Remove and set aside.",
      "Cook shrimp until pink. Remove and set aside.",
      "Sauté garlic and onion until fragrant.",
      "Add cabbage, carrots, and snow peas. Stir-fry for 2 minutes.",
      "Add drained noodles and soy sauce.",
      "Pour in chicken broth gradually while tossing noodles.",
      "Return chicken and shrimp to wok.",
      "Toss everything together until noodles absorb liquid.",
      "Season with salt and pepper.",
      "Garnish with green onions and serve with calamansi."
    ]
  },
  {
    name: "Sinangag (Garlic Fried Rice)",
    desc: "The foundation of Filipino breakfast, this garlic-infused fried rice transforms leftover rice into a flavorful base for silog meals. Simple yet essential to Filipino cuisine.",
    region: "Luzon", // Universal but formalized as part of silog in Luzon
    img: "/images/sinangag.jpg",
    ingredients: [
      "3-4 cups cooked rice (day-old, cold preferred)",
      "1 tablespoon canola oil (plus more as needed)",
      "6-8 cloves garlic, minced",
      "1/2 teaspoon kosher salt",
      "1/4 teaspoon black pepper"
    ],
    instructions: [
      "Break up cold rice with hands to separate grains.",
      "Heat oil in large skillet or wok over medium heat.",
      "Add minced garlic and cook until golden brown and fragrant, stirring frequently.",
      "Season rice with salt and pepper.",
      "Add more oil if needed.",
      "Add seasoned rice to skillet and toss with garlic oil.",
      "Spread rice across skillet surface.",
      "Let sit undisturbed for 6-7 minutes to form crispy bottom.",
      "Stir and cook for another 2-3 minutes.",
      "Taste and adjust seasoning.",
      "Serve hot as base for silog meals or as side dish."
    ]
  },
  {
    name: "Filipino Spaghetti",
    desc: "Sweet-style spaghetti with hot dogs and banana ketchup, born from American influence and WWII ingenuity. This uniquely Filipino pasta is sweeter and meatier than Italian versions.",
    region: "Luzon", // American influence strongest in Luzon/Manila
    img: "/images/filipino-spaghetti.jpg",
    ingredients: [
      "12 ounces dried spaghetti",
      "2 tablespoons olive oil",
      "5 hot dogs, sliced diagonally",
      "4 garlic cloves, minced",
      "1 medium yellow onion, finely chopped",
      "1 pound ground beef",
      "3 dried bay leaves",
      "3/4 teaspoon kosher salt",
      "1/4 teaspoon black pepper",
      "1 cup tomato sauce",
      "1/2 cup banana ketchup or tomato ketchup",
      "2 tablespoons soy sauce",
      "1 tablespoon fish sauce",
      "2-3 tablespoons sugar",
      "1 cup shredded cheddar cheese"
    ],
    instructions: [
      "Cook spaghetti according to package directions. Drain and set aside.",
      "Heat 1 tablespoon oil and fry hot dog slices until browned. Set aside.",
      "Add remaining oil and sauté garlic until fragrant.",
      "Add onion and cook until softened.",
      "Add ground beef, bay leaves, salt, and pepper. Cook until browned.",
      "Add tomato sauce, ketchup, soy sauce, fish sauce, and sugar.",
      "Return hot dogs to pan.",
      "Simmer sauce for 10-15 minutes until thickened.",
      "Taste and adjust sweetness.",
      "Toss spaghetti with sauce or serve sauce on top.",
      "Top generously with shredded cheese.",
      "Serve at children's parties or family gatherings."
    ]
  },
  {
    name: "Lugaw",
    desc: "Filipino rice porridge that's the base for many comfort foods. This simple congee can be plain or enriched with chicken (arroz caldo) or beef tripe (goto).",
    region: "Luzon", // Chinese influence but thoroughly Filipino
    img: "/images/lugaw.jpg",
    ingredients: [
      "1 cup jasmine rice",
      "1 1/2 pounds bone-in chicken (thighs or drumsticks)",
      "8 cups chicken broth (low-sodium)",
      "4-inch piece fresh ginger, sliced",
      "1 medium yellow onion, diced",
      "4 cloves garlic, minced",
      "2 tablespoons fish sauce",
      "Salt and pepper to taste",
      "For toppings: fried garlic, green onions, hardboiled eggs, calamansi"
    ],
    instructions: [
      "In large pot, heat oil and brown chicken pieces. Remove and set aside.",
      "Sauté onion, garlic, and ginger until fragrant.",
      "Add rice and stir to coat with oil.",
      "Return chicken to pot and add broth.",
      "Bring to boil, then reduce heat to low.",
      "Simmer for 1.5 hours, stirring occasionally, until rice breaks down and becomes creamy.",
      "Remove chicken, shred meat, discard bones.",
      "Return shredded chicken to pot.",
      "Season with fish sauce, salt, and pepper.",
      "If too thick, add water to reach desired consistency.",
      "Serve in bowls topped with fried garlic, green onions, and hardboiled eggs.",
      "Serve with calamansi and fish sauce on the side."
    ]
  },
  {
    name: "Taho",
    desc: "Soft silken tofu topped with brown sugar syrup and tapioca pearls, sold by roaming vendors. This Chinese-influenced treat has become a beloved Filipino street food tradition.",
    region: "Luzon", // Chinese influence, popularized in Manila
    img: "/images/taho.jpg",
    ingredients: [
      "For Arnibal (syrup): 3 cups water, 2 cups dark brown sugar, 1 tsp vanilla extract",
      "For Sago: 1 cup instant tapioca pearls, 2 cups water",
      "2 pounds soft silken tofu (store-bought or homemade)"
    ],
    instructions: [
      "Make arnibal: Combine water and brown sugar in saucepan.",
      "Bring to boil, stirring until sugar dissolves.",
      "Add vanilla extract.",
      "Simmer until syrup thickens slightly, about 3 minutes. Keep warm.",
      "Cook sago: Bring water to boil in small pot.",
      "Add tapioca pearls and boil until translucent and chewy, about 2 minutes.",
      "Drain and set aside.",
      "Warm tofu by steaming for 2 minutes or microwaving briefly.",
      "To serve: Scoop warm soft tofu into glasses or bowls.",
      "Top with cooked tapioca pearls.",
      "Drizzle generously with warm arnibal syrup.",
      "Serve immediately while warm.",
      "Traditional vendors call out 'Tahooooo!' in neighborhoods."
    ]
  },
  {
    name: "Pandesal",
    desc: "The most popular Filipino bread roll, slightly sweet despite its name meaning 'salt bread'. These soft, fluffy rolls coated in breadcrumbs are essential to Filipino breakfast.",
    region: "Luzon", // Spanish influence, perfected in Manila
    img: "/images/pandesal.jpg",
    ingredients: [
      "4 cups bread flour",
      "1 cup all-purpose flour",
      "1/3 cup sugar",
      "2 teaspoons salt",
      "1 teaspoon baking powder",
      "1 packet (2 1/4 tsp) active dry yeast",
      "1/4 cup warm water",
      "1 cup warm milk",
      "2 eggs",
      "1/4 cup melted butter",
      "2 tablespoons vegetable oil",
      "1 cup fine breadcrumbs for coating"
    ],
    instructions: [
      "Proof yeast in warm water with pinch of sugar for 10 minutes.",
      "Combine flours, sugar, salt, and baking powder in large bowl.",
      "Add warm milk, eggs, melted butter, oil, and proofed yeast.",
      "Mix and knead until smooth elastic dough forms, about 10 minutes.",
      "Place in greased bowl, cover, and rise until doubled, about 1 hour.",
      "Punch down dough and divide into 24 portions.",
      "Shape each into oval or round roll.",
      "Roll each piece in breadcrumbs to coat.",
      "Place on baking sheets with space between.",
      "Cover and rise again for 45 minutes.",
      "Bake at 375°F for 15-18 minutes until golden.",
      "Serve warm with butter, cheese, or coconut jam."
    ]
  },
  {
    name: "Atchara",
    desc: "Pickled green papaya relish with Indian origins, adapted as the perfect accompaniment to grilled and fried Filipino dishes. The sweet-sour pickle cuts through rich flavors.",
    region: "Luzon", // Indian influence through trade
    img: "/images/atchara.jpg",
    ingredients: [
      "4 cups green papaya, julienned (or daikon radish)",
      "1 medium carrot, julienned",
      "1 red bell pepper, julienned",
      "1 white onion, sliced thin",
      "2-inch piece ginger, julienned",
      "4 cloves garlic, sliced",
      "1/4 cup raisins",
      "2 tablespoons salt (for draining)",
      "1 1/2 cups white vinegar",
      "1 cup sugar",
      "1 teaspoon salt",
      "1/2 teaspoon black peppercorns"
    ],
    instructions: [
      "Toss julienned papaya with 2 tablespoons salt.",
      "Let sit in colander for 30 minutes to draw out moisture.",
      "Rinse thoroughly and squeeze out excess water.",
      "Combine with carrot, bell pepper, onion, ginger, garlic, and raisins.",
      "In pot, combine vinegar, sugar, 1 teaspoon salt, and peppercorns.",
      "Bring to boil and stir until sugar dissolves.",
      "Pour hot pickling liquid over vegetables.",
      "Let cool to room temperature.",
      "Transfer to sterilized jars.",
      "Refrigerate for at least 2 hours before serving.",
      "Keeps for up to 1 month refrigerated.",
      "Serve with grilled meats, fried fish, or longganisa."
    ]
  },
  {
    name: "Filipino Fruit Salad",
    desc: "Holiday dessert adapted from American ambrosia salad, featuring canned fruit cocktail with Filipino additions like nata de coco and condensed milk. Reserved for special occasions.",
    region: "Luzon", // American influence
    img: "/images/fruit-salad.jpg",
    ingredients: [
      "1 can (30 oz) fruit cocktail, drained",
      "1 can (15 oz) peaches, drained and diced",
      "1 cup frozen young coconut (buko), thawed",
      "1 cup white nata de coco, drained",
      "1/2 cup nata de piña, drained (optional)",
      "1/2 cup kaong (sugar palm fruit), drained",
      "1 can (14 oz) sweetened condensed milk",
      "1 cup heavy cream or all-purpose cream",
      "1/2 cup mayonnaise (optional, traditional)",
      "1/2 cup grated cheese (optional)"
    ],
    instructions: [
      "Drain all canned fruits thoroughly for at least 30 minutes.",
      "In large bowl, combine fruit cocktail, peaches, young coconut, nata de coco, nata de piña, and kaong.",
      "In separate bowl, mix condensed milk, cream, and mayonnaise if using.",
      "Pour cream mixture over fruits.",
      "Fold gently until well combined.",
      "Add grated cheese if using (traditional in some families).",
      "Cover and refrigerate for at least 4 hours or overnight.",
      "Serve chilled in individual cups or family-style.",
      "Traditional Christmas (Noche Buena) and New Year dessert.",
      "Some families add marshmallows or fresh fruits."
    ]
  },
  {
    name: "Biko (Bibingkang Malagkit)",
    desc: "Sweet sticky rice cake with coconut caramel topping. This Chinese-influenced kakanin topped with latik (coconut curd) is served at celebrations to symbolize unity and sweetness.",
    region: "Luzon", // Chinese influence, popular throughout
    img: "/images/biko.jpg",
    ingredients: [
      "2 cups glutinous rice",
      "2 cups coconut milk (divided)",
      "1 cup water",
      "1/2 teaspoon kosher salt (divided)",
      "1 cup coconut cream",
      "1 cup brown sugar",
      "2 pandan leaves (optional)",
      "Banana leaves for lining (optional)"
    ],
    instructions: [
      "If using banana leaves, pass over flame to soften, then line 8x8 baking dish.",
      "Otherwise, grease dish with coconut oil.",
      "Rinse glutinous rice until water runs clear.",
      "Combine rice, 1.5 cups coconut milk, water, and 1/4 teaspoon salt in pot.",
      "Add pandan leaves if using.",
      "Cook over medium heat, stirring frequently, until liquid is absorbed and rice is tender.",
      "Transfer cooked rice to prepared baking dish, pressing down evenly.",
      "For topping: In saucepan, combine coconut cream, remaining coconut milk, brown sugar, and remaining salt.",
      "Cook over medium heat, stirring constantly, until thick and caramelized, about 15 minutes.",
      "Pour coconut caramel over rice, spreading evenly.",
      "Bake at 350°F for 25-30 minutes until top is golden and bubbly.",
      "Cool completely before cutting into squares.",
      "Serve at room temperature."
    ]
  },
  {
    name: "Mango Royale (Mango Float)",
    desc: "No-bake icebox cake with layers of graham crackers, whipped cream, and Philippine mangoes. This American-influenced dessert showcases the country's prized fruit.",
    region: "Luzon", // American influence, uses Philippine mangoes
    img: "/images/mango-royale.jpg",
    ingredients: [
      "6 large ripe yellow mangoes (Carabao or Ataulfo), diced",
      "2 cups heavy cream",
      "2/3 cup sweetened condensed milk",
      "1 teaspoon vanilla extract",
      "1/4 teaspoon salt",
      "1 box graham crackers"
    ],
    instructions: [
      "Peel and dice mangoes into small cubes. Set aside.",
      "In large bowl, whip heavy cream until stiff peaks form.",
      "Gently fold in condensed milk, vanilla extract, and salt.",
      "In 8x8 inch pan, arrange layer of graham crackers on bottom.",
      "Spread 1/3 of whipped cream mixture over crackers.",
      "Add 1/3 of diced mangoes.",
      "Repeat layers two more times, ending with mangoes on top.",
      "Cover with plastic wrap.",
      "Refrigerate overnight or freeze for 4 hours.",
      "If frozen, let sit 10 minutes before serving.",
      "Cut into squares and serve chilled.",
      "Can garnish with additional mango slices."
    ]
  },
  {
    name: "Ube Ice Cream",
    desc: "Purple yam ice cream that's become an internationally recognized Filipino flavor. This no-churn version features the earthy, nutty taste of ube with creamy sweetness.",
    region: "Luzon", // American ice cream technique, Filipino ube
    img: "/images/ube-ice-cream.jpg",
    ingredients: [
      "4 ounces white chocolate, chopped",
      "2 tablespoons ube extract or ube halaya",
      "2 cups heavy cream",
      "1 can (14 oz) sweetened condensed milk",
      "1 teaspoon vanilla extract",
      "1/4 teaspoon salt",
      "Purple food coloring (optional, for deeper color)",
      "1/2 cup toasted coconut flakes (optional)"
    ],
    instructions: [
      "Make ube ganache: Melt white chocolate with ube extract in microwave or double boiler. Let cool.",
      "Whip heavy cream until stiff peaks form.",
      "In separate bowl, mix condensed milk, vanilla, salt, and food coloring if using.",
      "Gently fold whipped cream into condensed milk mixture.",
      "Pour half of mixture into loaf pan.",
      "Drizzle with half of ube ganache and swirl with knife.",
      "Add remaining cream mixture.",
      "Drizzle with remaining ganache and create swirl pattern.",
      "Optional: Sprinkle toasted coconut on top.",
      "Cover with plastic wrap and freeze at least 6 hours or overnight.",
      "Let soften 5 minutes before scooping.",
      "Serve in cones or bowls."
    ]
  },
  {
    name: "Bibingka",
    desc: "Traditional Christmas rice cake cooked in clay pots with coals above and below. This ancient kakanin is enjoyed during Simbang Gabi (dawn masses) topped with coconut, cheese, and salted egg.",
    region: "Luzon", // National but most associated with Tagalog Christmas tradition
    img: "/images/bibingka.jpg",
    ingredients: [
      "2 cups rice flour",
      "1/2 cup all-purpose flour",
      "1 tablespoon baking powder",
      "1 teaspoon salt",
      "3 eggs",
      "1 can (14 oz) coconut milk",
      "1/2 cup sugar",
      "1/4 cup melted butter",
      "Banana leaves (optional, for lining)",
      "For topping: grated coconut, cheese slices, salted egg slices, butter, sugar"
    ],
    instructions: [
      "Preheat oven to 375°F.",
      "If using banana leaves, pass over flame to soften, then line round baking pans.",
      "Mix rice flour, all-purpose flour, baking powder, and salt.",
      "Beat eggs, then add coconut milk, sugar, and melted butter.",
      "Combine wet and dry ingredients until smooth.",
      "Pour batter into prepared pans, filling 2/3 full.",
      "Bake for 15 minutes until set but not fully cooked.",
      "Add toppings: salted egg slices, cheese strips.",
      "Continue baking 10-15 minutes until golden and toothpick comes out clean.",
      "Brush with butter and sprinkle with grated coconut and sugar.",
      "Serve warm, traditionally sold outside churches during Christmas season."
    ]
  },
  {
    name: "Puto",
    desc: "Steamed rice cakes with countless regional variations. These bite-sized treats are often paired with savory dishes like dinuguan or enjoyed as merienda with cheese or coconut.",
    region: "Luzon", // National with regional variants
    img: "/images/puto.jpg",
    ingredients: [
      "1 1/2 cups all-purpose flour",
      "1 cup sugar",
      "1 tablespoon baking powder",
      "3 eggs",
      "6 ounces evaporated milk",
      "1/2 cup water",
      "2 tablespoons melted butter",
      "1 teaspoon vanilla extract",
      "1/2 cup grated cheddar cheese",
      "Food coloring (optional)",
      "Cheese slices for topping"
    ],
    instructions: [
      "Combine flour, sugar, and baking powder in bowl.",
      "Beat eggs one at a time, incorporating well.",
      "Add evaporated milk and beat until smooth.",
      "Add water gradually while mixing until batter is thin and smooth.",
      "Mix in melted butter and vanilla.",
      "Fold in grated cheese.",
      "Add food coloring if desired.",
      "Fill greased puto molds 3/4 full with batter.",
      "Arrange molds in steamer.",
      "Steam for 8-10 minutes until toothpick comes out clean.",
      "Turn off heat and top each with small piece of cheese.",
      "Cover steamer for 1 minute to melt cheese.",
      "Cool slightly before removing from molds.",
      "Serve warm or at room temperature."
    ]
  },
  {
    name: "Longganisa",
    desc: "Filipino sausage with hundreds of regional variants. This sweet Pampanga-style version showcases the diversity of Filipino longganisa from garlicky Vigan to sweet Cebu styles.",
    region: "Luzon", // Pampanga style shown, but truly national
    img: "/images/longganisa.jpg",
    ingredients: [
      "2 pounds lean ground pork",
      "1 pound pork fat, minced",
      "1 head garlic, minced",
      "2 tablespoons soy sauce",
      "2 tablespoons vinegar",
      "1/2 cup brown sugar",
      "1 tablespoon salt",
      "1 teaspoon black pepper",
      "1 teaspoon paprika",
      "Hog casings (optional, for traditional)",
      "For cooking: 1 cup water, 2 tablespoons oil"
    ],
    instructions: [
      "Mix ground pork, pork fat, garlic, soy sauce, vinegar, brown sugar, salt, pepper, and paprika.",
      "Refrigerate mixture for 2 hours to develop flavors.",
      "If using casings: Soak in warm water 30 minutes, then stuff mixture into casings.",
      "Twist at 4-inch intervals to form links.",
      "If skinless: Form mixture into small patties or logs.",
      "Refrigerate overnight or freeze for storage.",
      "To cook: Place longganisa in pan with water.",
      "Bring to boil and simmer until water evaporates and meat is cooked.",
      "Add oil and continue cooking until caramelized and slightly charred.",
      "Serve with garlic rice and egg for longsilog breakfast."
    ]
  },
  {
    name: "Turon",
    desc: "Crispy fried banana spring rolls with caramelized sugar coating. This popular street food features ripe saba bananas and jackfruit wrapped in lumpia wrapper.",
    region: "Luzon", // Common street food nationwide
    img: "/images/turon.jpg",
    ingredients: [
      "6 ripe saba bananas (or plantains), cut in half lengthwise",
      "12 lumpia wrappers",
      "1 cup ripe jackfruit, sliced (optional)",
      "1 1/2 cups brown sugar",
      "2 cups cooking oil for frying",
      "Water for sealing"
    ],
    instructions: [
      "Place brown sugar on a plate.",
      "Roll each banana half in sugar to coat completely.",
      "Place sugared banana diagonally on lumpia wrapper.",
      "Add a strip of jackfruit alongside banana if using.",
      "Fold bottom corner over banana, then fold in sides.",
      "Roll tightly and seal edge with water.",
      "Heat oil to 350°F.",
      "Add some brown sugar to oil (this will caramelize on the turon).",
      "Fry turon in batches, turning occasionally.",
      "Cook until wrapper is golden brown and sugar caramelizes, forming a crispy coating.",
      "Drain on paper towels and let cool 5 minutes.",
      "Serve hot as snack or dessert.",
      "Can serve with vanilla ice cream."
    ]
  },
  {
    name: "Leche Flan",
    desc: "Silky smooth caramel custard inherited from Spanish colonization. This beloved dessert graces every Filipino celebration with its rich, creamy texture and golden caramel topping.",
    region: "Luzon", // Spanish colonial, nationwide
    img: "/images/leche-flan.jpg",
    ingredients: [
      "For caramel: 1 cup granulated sugar, 1/4 cup water",
      "12 egg yolks from large eggs",
      "1 can (14 oz) sweetened condensed milk",
      "1 can (12 oz) evaporated milk",
      "1 teaspoon vanilla extract (optional)"
    ],
    instructions: [
      "Make caramel: In saucepan, combine sugar and water.",
      "Cook over medium heat without stirring until golden amber.",
      "Quickly pour caramel into llanera or round baking dish, tilting to coat bottom. Set aside to harden.",
      "In bowl, gently combine egg yolks (avoid creating bubbles).",
      "Add condensed milk and mix gently in one direction.",
      "Add evaporated milk and vanilla, stirring gently.",
      "Strain mixture through fine mesh to remove any lumps.",
      "Pour mixture into caramel-lined mold.",
      "Cover tightly with aluminum foil.",
      "Steam for 50-60 minutes or bake in water bath at 350°F for 50-60 minutes.",
      "Test with toothpick - should come out clean.",
      "Cool completely, then refrigerate at least 4 hours or overnight.",
      "To unmold, run knife around edges, then invert onto plate.",
      "Caramel will flow over flan as sauce."
    ]
  },
  {
    name: "Tortang Talong",
    desc: "Simple yet satisfying eggplant omelet found in every Filipino home. Grilled eggplant is flattened, dipped in beaten eggs, and fried until golden.",
    region: "Luzon", // Common home cooking nationwide
    img: "/images/tortang-talong.jpg",
    ingredients: [
      "4 Chinese or Japanese eggplants",
      "4 eggs",
      "1 teaspoon salt",
      "1/4 teaspoon black pepper",
      "6 tablespoons cooking oil",
      "Optional filling: ground meat cooked with onions and garlic",
      "Banana ketchup or vinegar for serving"
    ],
    instructions: [
      "Grill or broil whole eggplants until skin is charred and flesh is soft.",
      "Let cool, then carefully peel off skin, keeping stem intact.",
      "Gently flatten eggplant with fork, maintaining its shape.",
      "Beat eggs with salt and pepper in shallow bowl.",
      "If using filling, place some on flattened eggplant.",
      "Holding stem, dip entire eggplant in beaten egg, coating both sides.",
      "Heat oil in pan over medium heat.",
      "Carefully transfer egg-coated eggplant to pan.",
      "Pour extra egg over eggplant if desired.",
      "Fry 3-4 minutes per side until golden brown.",
      "Serve hot with rice and banana ketchup or spiced vinegar."
    ]
  },
  {
    name: "Dynamite Lumpia",
    desc: "Spicy appetizer of cheese-stuffed long green chilies wrapped in lumpia wrapper. This modern creation has become a favorite pulutan (beer food) and party snack.",
    region: "Luzon", // Modern creation, popular nationwide
    img: "/images/dynamite-lumpia.jpg",
    ingredients: [
      "12-15 long green chilies (siling haba) or jalapeños",
      "1/2 pound ground pork",
      "2 cloves garlic, minced",
      "1 small onion, minced",
      "Salt and pepper to taste",
      "12-15 strips of cheese (cheddar or mozzarella)",
      "12-15 lumpia wrappers",
      "2 cups vegetable oil for frying",
      "Water or egg white for sealing"
    ],
    instructions: [
      "Cook ground pork with garlic and onion until browned. Season with salt and pepper. Cool.",
      "Make a lengthwise slit in each chili, keeping stem intact.",
      "Remove seeds and membranes (keep some for heat if desired).",
      "Stuff each chili with cooked pork mixture.",
      "Insert a strip of cheese into each chili.",
      "Wrap each stuffed chili in lumpia wrapper, leaving stem exposed.",
      "Seal wrapper with water or egg white.",
      "Heat oil to 350°F.",
      "Fry dynamite lumpia until golden brown and crispy, about 2-3 minutes per side.",
      "Drain on paper towels.",
      "Let cool 5-10 minutes before serving (filling will be very hot).",
      "Serve with sweet chili sauce or vinegar dipping sauce."
    ]
  },
  {
    name: "Ginataan Pancit Canton Noodles",
    desc: "Creamy noodle dish combining Filipino and Italian influences. Canton noodles are tossed in coconut milk with miso and pink peppercorns for a unique fusion.",
    region: "Luzon", // Modern fusion dish
    img: "/images/ginataan-pancit.jpg",
    ingredients: [
      "8 oz pancit canton noodles",
      "1 can (14 oz) coconut milk",
      "3 tablespoons white miso paste",
      "1 tablespoon pink peppercorns, coarsely crushed",
      "3 cloves garlic, minced",
      "1-inch piece ginger, minced",
      "Salt to taste",
      "Lemon wedges for serving",
      "Green onions for garnish"
    ],
    instructions: [
      "Cook pancit canton noodles according to package directions, reserving 1 cup pasta water.",
      "Coarsely crush pink peppercorns in mortar and pestle.",
      "In large pan, sauté garlic and ginger until fragrant.",
      "Add coconut milk and miso paste, whisking until miso dissolves completely.",
      "Bring to gentle simmer and cook until sauce thickens slightly, about 2 minutes.",
      "Add cooked noodles to sauce and toss to coat.",
      "If sauce is too thick, add reserved noodle water tablespoon by tablespoon.",
      "Season with salt to taste.",
      "Sprinkle with remaining pink peppercorns.",
      "Garnish with green onions.",
      "Serve with lemon wedges."
    ]
  },
  {
    name: "Shrimp and Fish Sinigang",
    desc: "Lighter seafood version of the classic sour soup. This quick-cooking variation uses fish and shrimp instead of pork, perfect for a healthy weeknight meal.",
    region: "Luzon", // Tagalog soup with seafood variation
    img: "/images/seafood-sinigang.jpg",
    ingredients: [
      "8 ounces tilapia fillets, cut into chunks",
      "8 ounces unpeeled shrimp",
      "1 medium yellow onion, quartered",
      "4 garlic cloves, crushed",
      "1 jalapeño, halved",
      "4 small tomatoes, quartered",
      "4 ounces green beans, cut into 1-inch pieces",
      "1/2 daikon radish, sliced",
      "2 bunches baby bok choy, separated",
      "1 packet sinigang seasoning mix",
      "4 cups water",
      "Fish sauce to taste"
    ],
    instructions: [
      "In pot, combine water, onion, garlic, jalapeño, and tomatoes.",
      "Add sinigang seasoning packet and bring to boil.",
      "Add green beans and daikon. Simmer until daikon softens, about 6 minutes.",
      "Add tilapia and shrimp. Cook until halfway done, about 2 minutes.",
      "Add bok choy and cook until wilted, about 2 minutes.",
      "Season with fish sauce to taste.",
      "Adjust sourness with more sinigang mix if desired.",
      "Serve hot with steamed rice."
    ]
  }
];

// MongoDB connection and seeding script
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const CulturalRecipe = require('../models/CulturalRecipe');

// Get connection details from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pickaplate';
const DB_NAME = process.env.MONGODB_DB || process.env.DB_NAME || 'pickaplate';

async function seedDatabase() {
  try {
    // Connect to MongoDB using mongoose
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('\n✅ Connected to MongoDB');
    console.log(`📊 Database: ${DB_NAME}\n`);

    // Optional: Clear existing cultural recipes
    const deleteResult = await CulturalRecipe.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing recipes\n`);

    // Prepare recipes for insertion
    const recipesWithMetadata = recipes.map(recipe => ({
      name: recipe.name,
      desc: recipe.desc,
      region: recipe.region,
      img: recipe.img,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      recipe: recipe.instructions || [], // For backward compatibility
      isActive: true,
      createdBy: null,
      updatedBy: null,
    }));

    // Insert recipes one by one and display each
    console.log('📝 Inserting Filipino Cultural Recipes:\n');
    console.log('='.repeat(80));

    for (let i = 0; i < recipesWithMetadata.length; i++) {
      const recipe = recipesWithMetadata[i];
      const inserted = await CulturalRecipe.create(recipe);

      console.log(`\n[${i + 1}/${recipesWithMetadata.length}] ${recipe.name}`);
      console.log('-'.repeat(80));
      console.log(`📍 Region: ${recipe.region}`);
      console.log(`📖 Description: ${recipe.desc.substring(0, 100)}...`);
      console.log(`🖼️  Image: ${recipe.img}`);
      console.log(`🥘 Ingredients: ${recipe.ingredients.length} items`);
      console.log(`👨‍🍳 Instructions: ${recipe.instructions.length} steps`);
      console.log(`✅ Inserted with ID: ${inserted._id}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n🎉 Successfully inserted ${recipesWithMetadata.length} Filipino recipes!\n`);

    // Log distribution by region
    const luzonCount = recipes.filter(r => r.region === "Luzon").length;
    const visayasCount = recipes.filter(r => r.region === "Visayas").length;
    const mindanaoCount = recipes.filter(r => r.region === "Mindanao").length;

    console.log("📊 Regional Distribution:");
    console.log(`   🏝️  Luzon: ${luzonCount} recipes`);
    console.log(`   🏝️  Visayas: ${visayasCount} recipes`);
    console.log(`   🏝️  Mindanao: ${mindanaoCount} recipes`);

    // Display some sample recipes
    console.log("\n📋 Sample Recipes in Database:");
    const samples = await CulturalRecipe.find({ isActive: true })
      .limit(5)
      .select('name region desc')
      .lean();

    samples.forEach((recipe, idx) => {
      console.log(`\n${idx + 1}. ${recipe.name} (${recipe.region})`);
      console.log(`   ${recipe.desc.substring(0, 80)}...`);
    });

    console.log('\n✨ Database seeding complete!\n');

  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Disconnected from MongoDB\n");
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();

// Export for use in other scripts
module.exports = { recipes };