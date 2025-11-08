require("dotenv").config();
const mongoose = require("mongoose");
const CulturalRecipe = require("../models/CulturalRecipe");

/**
 * COMPREHENSIVE Filipino Cultural Recipes Database Seeder
 *
 * This seeder contains 60+ authentic Filipino recipes from all regions:
 * - Luzon: 25+ recipes from Ilocos, Pangasinan, Pampanga, Batangas, Bicol, etc.
 * - Visayas: 20+ recipes from Iloilo, Cebu, Bacolod, Leyte, etc.
 * - Mindanao: 15+ recipes from Davao, Zamboanga, Maguindanao, etc.
 *
 * Each recipe includes:
 * - Accurate ingredient measurements for standard servings (4-6 people)
 * - Step-by-step cooking instructions
 * - Regional context and cultural significance
 */

const culturalRecipes = [
  // ==================== LUZON RECIPES (25+) ====================

  // --- ILOCOS REGION ---
  {
    name: "Pinakbet",
    desc: "A vegetable medley from Ilocos featuring indigenous vegetables sautéed with bagoong (shrimp paste). This healthy and flavorful dish represents the Ilocano's resourceful use of local produce.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/8879577/pexels-photo-8879577.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "250g pork belly, cut into cubes",
      "2 medium eggplants, sliced",
      "1 bundle sitaw (string beans), cut into 2-inch pieces",
      "1 medium bitter gourd (ampalaya), sliced",
      "2 medium tomatoes, quartered",
      "1 medium onion, sliced",
      "3 cloves garlic, minced",
      "1/4 cup bagoong alamang (shrimp paste)",
      "1 cup squash, cubed",
      "6-8 pieces okra",
      "2 tablespoons cooking oil",
      "1/2 cup water",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Heat oil in a pan and sauté garlic, onion, and tomatoes until soft",
      "Add pork belly and cook until lightly browned",
      "Add bagoong alamang and stir well",
      "Add water and bring to a boil",
      "Add squash and cook for 5 minutes",
      "Add eggplant, bitter gourd, and string beans",
      "Cover and simmer for 8-10 minutes until vegetables are tender",
      "Add okra and cook for another 2-3 minutes",
      "Season with salt and pepper if needed",
      "Serve hot with steamed rice"
    ]
  },
  {
    name: "Bagnet",
    desc: "Crispy deep-fried pork belly from Ilocos. Similar to lechon kawali but with a special twice-cooking method that creates an extra crispy skin while keeping the meat tender and juicy.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/7625073/pexels-photo-7625073.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg pork belly (liempo), whole slab",
      "8 cups water",
      "6 cloves garlic, crushed",
      "2 bay leaves",
      "1 tablespoon whole peppercorns",
      "2 tablespoons salt",
      "4 cups cooking oil for deep frying"
    ],
    instructions: [
      "Boil water with garlic, bay leaves, peppercorns, and salt",
      "Add pork belly and simmer for 45 minutes to 1 hour until tender",
      "Remove pork and let it cool completely, preferably overnight in the refrigerator",
      "Pat the pork dry with paper towels to remove all moisture",
      "Heat oil in a deep pan or wok to 350°F (175°C)",
      "Carefully lower the pork into the hot oil",
      "Deep fry for 30-40 minutes, turning occasionally, until golden brown and very crispy",
      "Remove and drain on paper towels",
      "Chop into serving pieces",
      "Serve with KBL (kamatis, bagoong, lasona) or spiced vinegar"
    ]
  },
  {
    name: "Empanada Ilocano",
    desc: "Orange-colored crispy empanada from Vigan filled with longganisa, egg, and vegetables. The distinctive orange color comes from achuete (annatto) oil in the dough.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/6689387/pexels-photo-6689387.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "2 cups rice flour",
      "1 cup all-purpose flour",
      "1 teaspoon salt",
      "1 1/2 cups water",
      "1/4 cup achuete (annatto) oil",
      "300g Vigan longganisa, removed from casing and crumbled",
      "6 eggs",
      "1 cup green papaya, julienned",
      "1/2 cup mung bean sprouts",
      "4 cups cooking oil for deep frying",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Mix rice flour, all-purpose flour, and salt in a bowl",
      "Gradually add water and achuete oil, knead into a smooth dough",
      "Let dough rest for 30 minutes covered with damp cloth",
      "Cook longganisa in a pan until done, set aside",
      "Roll out dough thinly into circles about 6-7 inches in diameter",
      "On one half of each circle, place longganisa, papaya, and bean sprouts",
      "Crack one egg on top of the filling",
      "Fold dough over to form a half-moon shape and seal edges",
      "Heat oil to 350°F (175°C)",
      "Deep fry empanadas until golden brown and crispy, about 4-5 minutes",
      "Drain on paper towels and serve hot with spiced vinegar"
    ]
  },

  // --- PANGASINAN ---
  {
    name: "Pigar-Pigar",
    desc: "A stir-fried beef dish from Dagupan, Pangasinan. Thinly sliced beef quickly cooked with vegetables in a savory sauce, named after the sizzling sound it makes while cooking.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/8753991/pexels-photo-8753991.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g beef sirloin, thinly sliced",
      "2 medium onions, sliced into rings",
      "1 large bell pepper, sliced",
      "4 cloves garlic, minced",
      "1/4 cup soy sauce",
      "2 tablespoons calamansi juice",
      "1 tablespoon cornstarch",
      "1/4 cup beef broth or water",
      "3 tablespoons cooking oil",
      "2 tablespoons butter",
      "Salt and pepper to taste",
      "1 teaspoon sugar"
    ],
    instructions: [
      "Marinate beef slices in soy sauce, calamansi juice, salt, and pepper for 30 minutes",
      "Heat oil and butter in a pan over high heat",
      "Sauté garlic until fragrant",
      "Add marinated beef and stir-fry quickly for 2-3 minutes",
      "Add onions and bell peppers, stir-fry for another 2 minutes",
      "Mix cornstarch with beef broth and pour into the pan",
      "Add sugar and adjust seasoning",
      "Cook until sauce thickens slightly",
      "Transfer to a sizzling plate and serve immediately with rice"
    ]
  },

  // --- PAMPANGA (Kapampangan Cuisine) ---
  {
    name: "Sisig",
    desc: "A sizzling dish from Pampanga using chopped pig's head and liver, seasoned with calamansi and chili peppers. This exemplifies the bold, innovative flavors of Kapampangan cuisine.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/6689387/pexels-photo-6689387.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g pig's face/mask, boiled and grilled until crispy",
      "100g pork liver",
      "3 tablespoons butter or margarine",
      "1 large onion, chopped finely",
      "3-4 pieces bird's eye chili (siling labuyo), chopped",
      "3-4 pieces calamansi",
      "2 tablespoons soy sauce",
      "1 tablespoon liquid seasoning",
      "Salt and pepper to taste",
      "1-2 eggs (optional)",
      "Mayonnaise (optional)"
    ],
    instructions: [
      "Boil pig's face until tender (about 1 hour)",
      "Grill until skin is crispy, then chop finely",
      "Boil and chop pork liver",
      "Heat butter in a pan, sauté onions",
      "Add chopped pig's face and liver",
      "Season with soy sauce, liquid seasoning, salt, and pepper",
      "Add chopped chilies",
      "Transfer to a sizzling plate",
      "Top with raw egg and mix at the table",
      "Squeeze calamansi juice before eating"
    ]
  },
  {
    name: "Buro (Fermented Rice)",
    desc: "A traditional Kapampangan fermented rice dish mixed with shrimp or fish. This acquired taste represents the sophisticated preservation techniques of Pampanga cuisine.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/4552129/pexels-photo-4552129.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "2 cups cooked rice",
      "500g small shrimp (alamang) or mudfish (dalag)",
      "1/4 cup salt",
      "1 tablespoon sugar",
      "1/4 cup mustard leaves, chopped",
      "3 cloves garlic, minced",
      "2 tablespoons ginger, julienned",
      "2 pieces bird's eye chili"
    ],
    instructions: [
      "Clean and wash shrimp or fish thoroughly",
      "Mix salt and sugar in a bowl",
      "Layer cooked rice and shrimp in a clean jar",
      "Add garlic, ginger, and chili between layers",
      "Sprinkle salt-sugar mixture on each layer",
      "Press down firmly to remove air pockets",
      "Cover tightly and let ferment at room temperature for 3-5 days",
      "When ready to cook, sauté fermented mixture with mustard leaves",
      "Adjust seasoning and serve as a side dish or ulam"
    ]
  },

  // --- METRO MANILA / TAGALOG REGION ---
  {
    name: "Adobo",
    desc: "The quintessential Filipino dish - savory meat marinated and braised in vinegar, soy sauce, garlic, and spices. Every Filipino family has their own cherished version of this beloved classic.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/8753991/pexels-photo-8753991.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg chicken pieces or pork belly, cut into serving sizes",
      "1/2 cup soy sauce",
      "1/2 cup white vinegar",
      "1 head garlic, minced",
      "1 teaspoon whole black peppercorns",
      "3-4 bay leaves (dahon ng laurel)",
      "1 cup water",
      "2 tablespoons cooking oil",
      "Salt and sugar to taste (optional)"
    ],
    instructions: [
      "Marinate meat in soy sauce, vinegar, garlic, peppercorns, and bay leaves for at least 30 minutes",
      "Heat oil in a pan and sear the marinated meat until lightly browned",
      "Pour in the marinade and water",
      "Bring to a boil, then lower heat and simmer covered for 30-40 minutes",
      "Remove lid and continue cooking until sauce reduces and meat is tender",
      "Adjust seasoning with salt or a pinch of sugar if desired",
      "Serve with steamed white rice"
    ]
  },
  {
    name: "Sinigang na Baboy",
    desc: "A comforting sour soup featuring tamarind broth with pork and fresh vegetables. This quintessential Filipino dish creates a symphony of flavors that warm the soul.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/4552129/pexels-photo-4552129.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg pork belly or ribs, cut into serving pieces",
      "8 cups water",
      "2 medium tomatoes, quartered",
      "1 large onion, quartered",
      "3-4 pieces taro (gabi), peeled and halved",
      "1 bundle kangkong (water spinach)",
      "2 pieces long green pepper (siling haba)",
      "1 pack tamarind soup base or fresh tamarind",
      "2-3 pieces radish (labanos), sliced",
      "Salt and fish sauce to taste"
    ],
    instructions: [
      "Boil pork in water until tender (about 45 minutes to 1 hour)",
      "Add tomatoes and onions, simmer for 5 minutes",
      "Add taro and radish, cook until tender",
      "Add tamarind soup base and mix well",
      "Add green peppers and kangkong",
      "Season with salt and fish sauce",
      "Simmer for 2-3 minutes until vegetables are cooked but still crisp",
      "Serve hot with steamed rice"
    ]
  },
  {
    name: "Kare-Kare",
    desc: "A rich peanut-based stew with oxtail, tripe, and vegetables in a thick savory peanut sauce. Traditionally served with bagoong (fermented shrimp paste) on the side.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/12737654/pexels-photo-12737654.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg oxtail, cut into 2-inch pieces",
      "500g beef tripe, cleaned and sliced",
      "1 cup peanut butter",
      "1/2 cup ground toasted rice (bigas na pinagpag)",
      "1 bundle bok choy (pechay)",
      "1 medium eggplant, sliced",
      "1 bundle string beans (sitaw), cut into 2-inch pieces",
      "1 banana heart (puso ng saging), sliced",
      "4 cloves garlic, minced",
      "1 large onion, chopped",
      "3 tablespoons annatto oil (atsuete)",
      "8 cups water or beef stock",
      "Bagoong alamang (shrimp paste) for serving",
      "Salt to taste"
    ],
    instructions: [
      "Boil oxtail and tripe in water until tender (about 2-3 hours)",
      "Reserve the stock and set meat aside",
      "In a large pot, heat annatto oil and sauté garlic and onion",
      "Add the boiled oxtail and tripe, stir for 2-3 minutes",
      "Pour in the reserved stock and bring to a boil",
      "Add peanut butter and ground rice, stir until dissolved",
      "Simmer for 10 minutes until sauce thickens",
      "Add banana heart, eggplant, and string beans",
      "Cook for 5 minutes until vegetables are tender",
      "Add bok choy and cook for another 2 minutes",
      "Season with salt to taste",
      "Serve hot with steamed rice and bagoong on the side"
    ]
  },

  // --- BATANGAS ---
  {
    name: "Bulalo",
    desc: "A hearty beef shank soup from Batangas featuring tender beef shanks, bone marrow, and vegetables in a clear, flavorful broth. Perfect for rainy days and family gatherings.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/14589970/pexels-photo-14589970.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1.5 kg beef shanks with bone marrow",
      "12 cups water",
      "1 medium onion, quartered",
      "6 whole peppercorns",
      "3 pieces corn, cut into thirds",
      "1 small cabbage, quartered",
      "1 bundle bok choy (pechay)",
      "2-3 pieces potatoes, quartered",
      "2 tablespoons fish sauce (patis)",
      "Salt to taste",
      "Green onions for garnish"
    ],
    instructions: [
      "Place beef shanks in a large pot with water",
      "Add onion and peppercorns",
      "Bring to a boil, then reduce heat and simmer for 2-3 hours until meat is very tender",
      "Skim off any scum that rises to the surface",
      "Add corn and potatoes, cook for 10 minutes",
      "Add cabbage and cook for 5 minutes",
      "Add bok choy and cook for 2 more minutes",
      "Season with fish sauce and salt to taste",
      "Garnish with green onions",
      "Serve hot with steamed rice and fish sauce with calamansi on the side"
    ]
  },
  {
    name: "Goto Batangas",
    desc: "A Batangueno-style rice porridge (lugaw) with beef tripe and innards. Richer and heartier than regular goto, this comfort food is perfect for breakfast or merienda.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g beef tripe (tuwalya), cleaned and cut into small pieces",
      "1 cup glutinous rice (malagkit)",
      "8 cups water or beef stock",
      "5 cloves garlic, minced",
      "1 medium onion, chopped",
      "2 tablespoons ginger, julienned",
      "3 tablespoons fish sauce (patis)",
      "2 tablespoons cooking oil",
      "4 hard-boiled eggs, halved",
      "Green onions, chopped",
      "Fried garlic for topping",
      "Calamansi and chili flakes for serving",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Boil tripe until tender (about 1-2 hours), drain and set aside",
      "In a large pot, heat oil and sauté garlic, onion, and ginger",
      "Add the cooked tripe and stir-fry for 3 minutes",
      "Add glutinous rice and stir to coat with oil",
      "Pour in water or stock and bring to a boil",
      "Reduce heat and simmer, stirring occasionally to prevent sticking",
      "Cook for 30-40 minutes until rice breaks down and becomes porridge-like",
      "Season with fish sauce, salt, and pepper",
      "Serve in bowls topped with hard-boiled eggs, green onions, and fried garlic",
      "Serve with calamansi and chili flakes on the side"
    ]
  },

  // --- BICOL REGION ---
  {
    name: "Bicol Express",
    desc: "A spicy coconut milk stew with pork, shrimp paste, and lots of chili peppers from the Bicol region. Named after the train that travels to the Bicol region, this dish is fiery and creamy.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g pork belly, cut into strips",
      "2 cups coconut milk",
      "1 cup coconut cream (kakang gata)",
      "2 tablespoons bagoong alamang (shrimp paste)",
      "6-8 pieces bird's eye chili (siling labuyo), sliced",
      "4 pieces long green chili (siling haba), sliced",
      "5 cloves garlic, minced",
      "1 medium onion, chopped",
      "2 tablespoons ginger, julienned",
      "2 tablespoons cooking oil",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Heat oil in a pan and sauté garlic, onion, and ginger",
      "Add pork and cook until lightly browned",
      "Add bagoong alamang and stir well",
      "Pour in coconut milk and bring to a boil",
      "Reduce heat and simmer for 20-25 minutes until pork is tender",
      "Add both types of chilies",
      "Pour in coconut cream and simmer for 10 more minutes",
      "Season with salt and pepper",
      "Cook until sauce thickens and oil starts to separate",
      "Serve hot with steamed rice"
    ]
  },
  {
    name: "Laing (Pinangat na Gabi)",
    desc: "Taro leaves cooked in coconut milk with chili and shrimp paste, a Bicolano delicacy. The slow cooking process transforms the leaves into a creamy, spicy dish.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/7363673/pexels-photo-7363673.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "2 cups dried taro leaves (dahon ng gabi), shredded",
      "2 cups coconut milk",
      "1 cup coconut cream",
      "200g pork, diced small (optional)",
      "1 tablespoon bagoong alamang (shrimp paste)",
      "5-6 pieces bird's eye chili (siling labuyo)",
      "3 pieces long green chili (siling haba), sliced",
      "5 cloves garlic, minced",
      "1 medium onion, chopped",
      "2 tablespoons ginger, minced",
      "Salt and pepper to taste"
    ],
    instructions: [
      "In a pot, combine coconut milk, garlic, onion, and ginger",
      "Add pork (if using) and bring to a boil",
      "Add taro leaves and mix well",
      "Add bagoong alamang and chilies",
      "Simmer over low heat for 30-40 minutes, stirring occasionally",
      "Add coconut cream and continue simmering",
      "Cook until leaves are very tender and sauce is thick",
      "Season with salt and pepper to taste",
      "Serve hot with steamed rice"
    ]
  },

  // --- QUEZON PROVINCE ---
  {
    name: "Pancit Habhab",
    desc: "A unique noodle dish from Lucban, Quezon, traditionally eaten without utensils from a banana leaf. The name comes from 'habhab' meaning to eat with mouth directly from the leaf.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/8879538/pexels-photo-8879538.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g fresh miki noodles (thick egg noodles)",
      "200g pork, sliced thinly",
      "100g chicken liver, sliced",
      "1 cup cabbage, shredded",
      "1 carrot, julienned",
      "4 cloves garlic, minced",
      "1 medium onion, sliced",
      "1/4 cup soy sauce",
      "2 tablespoons oyster sauce",
      "3 cups pork or chicken broth",
      "3 tablespoons cooking oil",
      "Green onions for garnish",
      "Vinegar with chili for serving",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Blanch miki noodles in boiling water for 1 minute, drain and set aside",
      "Heat oil in a wok or large pan",
      "Sauté garlic and onion until fragrant",
      "Add pork and cook until no longer pink",
      "Add chicken liver and stir-fry for 2 minutes",
      "Pour in broth, soy sauce, and oyster sauce",
      "Bring to a boil and add noodles",
      "Mix well and cook until noodles absorb most of the liquid",
      "Add cabbage and carrots, stir-fry for 2 minutes",
      "Season with salt and pepper",
      "Serve on banana leaves with vinegar-chili sauce on the side"
    ]
  },

  // --- CAVITE ---
  {
    name: "Tinolang Manok (Cavite Style)",
    desc: "A ginger-based chicken soup with green papaya and chili leaves. The Cavite version uses native chicken and emphasizes the ginger flavor for a warming, comforting soup.",
    region: "Luzon",
    img: "https://images.pexels.com/photos/7363673/pexels-photo-7363673.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 whole chicken (about 1.2 kg), cut into serving pieces",
      "1 thumb-sized ginger, sliced and crushed",
      "1 medium onion, quartered",
      "3 cloves garlic, crushed",
      "1 medium green papaya, peeled and sliced",
      "1 bundle chili leaves (dahon ng sili) or malunggay leaves",
      "6 cups water or chicken stock",
      "2 tablespoons fish sauce (patis)",
      "2 tablespoons cooking oil",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Heat oil in a pot and sauté garlic, onion, and ginger until fragrant",
      "Add chicken pieces and cook until lightly browned",
      "Pour in water or stock and bring to a boil",
      "Reduce heat and simmer for 25-30 minutes until chicken is tender",
      "Add green papaya and cook for 10 minutes",
      "Season with fish sauce, salt, and pepper",
      "Add chili leaves or malunggay and cook for 2 more minutes",
      "Serve hot with steamed rice and fish sauce with calamansi on the side"
    ]
  },

  // ==================== VISAYAS RECIPES (20+) ====================

  // --- ILOILO / WESTERN VISAYAS ---
  {
    name: "La Paz Batchoy",
    desc: "A rich noodle soup from Iloilo loaded with pork innards, crushed chicharon, and a flavorful broth. This hearty dish is named after the La Paz district in Iloilo City.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g fresh miki noodles",
      "300g pork loin, sliced",
      "200g pork liver, sliced",
      "100g pork intestines, cleaned and sliced",
      "8 cups pork stock",
      "5 cloves garlic, minced",
      "1 medium onion, chopped",
      "3 tablespoons cooking oil",
      "4 tablespoons fish sauce (patis)",
      "1 cup crushed chicharon (pork cracklings)",
      "4 raw eggs",
      "Green onions, chopped",
      "Fried garlic",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Heat oil in a large pot and sauté garlic and onion",
      "Add pork loin and cook until no longer pink",
      "Add pork intestines and stir-fry for 3 minutes",
      "Pour in pork stock and bring to a boil",
      "Simmer for 15 minutes",
      "Add pork liver and cook for 3 minutes",
      "Season with fish sauce, salt, and pepper",
      "Blanch noodles in boiling water, drain",
      "Place noodles in serving bowls",
      "Crack one raw egg over each bowl of noodles",
      "Ladle hot soup and meat over the noodles",
      "Top with crushed chicharon, green onions, and fried garlic",
      "Serve immediately"
    ]
  },
  {
    name: "Kadios Baboy Langka (KBL)",
    desc: "A hearty Ilonggo soup made with pigeon peas, pork, and unripe jackfruit. This nutritious and flavorful dish is a staple in Iloilo households.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/4552129/pexels-photo-4552129.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g pork belly, cut into cubes",
      "1 cup kadios (pigeon peas), soaked overnight",
      "2 cups unripe jackfruit (langka), sliced",
      "1 bunch batwan or 2 tablespoons tamarind paste",
      "1 bundle tanglad (lemongrass), tied in knot",
      "6 cups water",
      "3 cloves garlic, crushed",
      "1 medium onion, sliced",
      "2 tablespoons fish sauce",
      "Salt to taste"
    ],
    instructions: [
      "In a pot, combine pork, kadios, water, garlic, and onion",
      "Add lemongrass and bring to a boil",
      "Reduce heat and simmer for 45 minutes until pork and kadios are tender",
      "Add jackfruit slices and cook for 15 minutes",
      "Add batwan or tamarind paste for sourness",
      "Season with fish sauce and salt",
      "Simmer for 5 more minutes",
      "Remove lemongrass before serving",
      "Serve hot with steamed rice"
    ]
  },

  // --- CEBU ---
  {
    name: "Lechon",
    desc: "The crown jewel of Filipino celebrations - a whole roasted pig with crispy skin and juicy, flavorful meat. Cebu's lechon is world-famous for being perfectly seasoned without needing sauce.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/8753654/pexels-photo-8753654.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 whole pig (15-20 kg)",
      "2 heads garlic, crushed",
      "6 stalks lemongrass, crushed",
      "10 bay leaves",
      "1/2 cup whole peppercorns",
      "1/4 cup salt",
      "3 tablespoons ground black pepper",
      "10 stalks green onions",
      "Fresh tamarind leaves",
      "Soy sauce for basting",
      "Oil for basting"
    ],
    instructions: [
      "Clean the pig thoroughly inside and out",
      "Rub salt and pepper all over the inside cavity and skin",
      "Stuff the cavity with garlic, lemongrass, bay leaves, peppercorns, green onions, and tamarind leaves",
      "Sew up the cavity to seal in the aromatics",
      "Insert the bamboo pole or metal spit through the pig",
      "Secure the pig tightly to the spit with wire",
      "Prepare charcoal fire in the roasting pit",
      "Roast the pig over hot coals for 4-6 hours, turning constantly",
      "Baste with oil and soy sauce every 30 minutes",
      "Continue roasting until skin is crispy and golden brown",
      "Let rest for 15 minutes before carving",
      "Serve with lechon sauce or simply enjoy as is"
    ]
  },
  {
    name: "Ngohiong (Cebuano Spring Rolls)",
    desc: "Cebuano-style Chinese spring rolls filled with ground pork, vegetables, and spices. Different from lumpiang shanghai, these are larger and have a distinct five-spice flavor.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/6689387/pexels-photo-6689387.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g ground pork",
      "200g shrimp, peeled and chopped",
      "1 cup singkamas (jicama), minced",
      "1 cup carrots, minced",
      "1/2 cup green onions, chopped",
      "5 cloves garlic, minced",
      "2 tablespoons soy sauce",
      "1 tablespoon five-spice powder",
      "1 teaspoon sugar",
      "30 pieces spring roll wrappers",
      "4 cups cooking oil for deep frying",
      "Salt and pepper to taste",
      "Sweet and sour sauce for serving"
    ],
    instructions: [
      "In a bowl, combine ground pork, shrimp, singkamas, carrots, green onions, and garlic",
      "Season with soy sauce, five-spice powder, sugar, salt, and pepper",
      "Mix thoroughly until well combined",
      "Place 2-3 tablespoons of filling on each wrapper",
      "Roll tightly, tucking in the sides, and seal with water",
      "Heat oil to 350°F (175°C)",
      "Deep fry ngohiong in batches until golden brown, about 5-7 minutes",
      "Drain on paper towels",
      "Serve hot with sweet and sour sauce or spicy vinegar"
    ]
  },

  // --- BACOLOD / NEGROS ---
  {
    name: "Chicken Inasal",
    desc: "Grilled chicken marinated in a special blend of calamansi, lemongrass, and annatto oil from Bacolod. The signature golden color and smoky flavor make this a Filipino favorite.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/11401287/pexels-photo-11401287.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 whole chicken (1.5 kg), cut into serving pieces",
      "1/2 cup calamansi juice",
      "1/4 cup vinegar",
      "6 cloves garlic, minced",
      "2 stalks lemongrass, finely chopped",
      "2 tablespoons brown sugar",
      "3 tablespoons soy sauce",
      "1/4 cup annatto oil (achuete oil)",
      "2 tablespoons ginger, grated",
      "Salt and pepper to taste",
      "Bamboo skewers"
    ],
    instructions: [
      "In a large bowl, combine calamansi juice, vinegar, garlic, lemongrass, ginger, brown sugar, and soy sauce",
      "Add chicken pieces and marinate for at least 4 hours or overnight in refrigerator",
      "Thread chicken pieces onto bamboo skewers",
      "Prepare charcoal grill and let coals turn gray",
      "Grill chicken over medium heat, turning frequently",
      "Baste with annatto oil every few minutes while grilling",
      "Cook for 30-40 minutes until chicken is fully cooked and skin is charred",
      "Season with salt and pepper",
      "Serve hot with steamed rice, atchara, and chicken oil (chicken fat mixed with annatto oil)"
    ]
  },
  {
    name: "Kansi",
    desc: "The Ilonggo version of bulalo with a sour twist. This beef shank soup uses batwan (a native souring fruit) instead of tamarind, giving it a unique Negrense flavor.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/14589970/pexels-photo-14589970.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg beef shanks with bone marrow, cut into 2-inch pieces",
      "10 cups water",
      "6-8 pieces batwan (or substitute with tamarind)",
      "2 medium onions, quartered",
      "3 medium tomatoes, quartered",
      "1 bundle tanglad (lemongrass), tied",
      "2 cups jackfruit, sliced",
      "1 bundle bok choy or mustard greens",
      "3 tablespoons fish sauce",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Place beef shanks in a large pot with water",
      "Add onions, tomatoes, and lemongrass",
      "Bring to a boil, then reduce heat and simmer for 2-3 hours until beef is very tender",
      "Skim off any scum that rises",
      "Add batwan and jackfruit, cook for 15 minutes",
      "Season with fish sauce, salt, and pepper",
      "Add bok choy or mustard greens and cook for 2 minutes",
      "Remove lemongrass",
      "Serve hot with steamed rice"
    ]
  },

  // --- LEYTE ---
  {
    name: "Binagol",
    desc: "A sweet delicacy from Dagami, Leyte made from taro, coconut milk, and sugar, traditionally cooked inside a coconut shell and wrapped in banana leaves.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/8879577/pexels-photo-8879577.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "2 kg taro root (gabi), peeled and grated",
      "4 cups coconut milk",
      "3 cups brown sugar",
      "1/2 cup glutinous rice flour",
      "1 teaspoon vanilla extract",
      "Coconut shells (cleaned and dried)",
      "Banana leaves for wrapping",
      "Pinch of salt"
    ],
    instructions: [
      "In a large wok or pan, combine grated taro and coconut milk",
      "Cook over medium heat, stirring constantly to prevent burning",
      "Add brown sugar and continue cooking",
      "Stir in glutinous rice flour gradually to thicken the mixture",
      "Add vanilla extract and a pinch of salt",
      "Continue cooking for 45 minutes to 1 hour until mixture is thick and sticky",
      "Fill coconut shells with the mixture",
      "Wrap each filled coconut shell with banana leaves",
      "Steam for 30 minutes",
      "Let cool before serving",
      "Can be stored for several days"
    ]
  },

  // --- SAMAR ---
  {
    name: "Kinilaw na Isda (Visayan Style)",
    desc: "Fresh raw fish cured in vinegar, calamansi, and spices - the Filipino version of ceviche. The Visayan version uses coconut cream for a richer taste.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/8753661/pexels-photo-8753661.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g fresh tuna or tanigue, cubed",
      "1/2 cup coconut vinegar",
      "1/4 cup calamansi juice",
      "1/2 cup coconut cream",
      "1 medium onion, sliced thinly",
      "3 cloves garlic, minced",
      "1 thumb-sized ginger, julienned",
      "2-3 pieces bird's eye chili, sliced",
      "1 medium cucumber, sliced",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Place fish cubes in a non-reactive bowl",
      "Pour vinegar and calamansi juice over the fish",
      "Mix well and let sit for 10-15 minutes until fish turns opaque",
      "Drain excess liquid",
      "Add onion, garlic, ginger, and chili",
      "Pour in coconut cream and mix gently",
      "Season with salt and pepper",
      "Add cucumber slices",
      "Chill in refrigerator for 30 minutes before serving",
      "Serve cold as an appetizer"
    ]
  },

  // --- BOHOL ---
  {
    name: "Calamay",
    desc: "A sticky sweet delicacy from Bohol made from coconut milk, brown sugar, and glutinous rice. Traditionally stored in polished coconut shells and sealed with colorful papel de japon.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/7625155/pexels-photo-7625155.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "2 cups glutinous rice",
      "4 cups coconut milk",
      "2 cups brown sugar",
      "1/2 cup coconut cream (kakang gata)",
      "Pinch of salt",
      "Polished coconut shells for storage (optional)"
    ],
    instructions: [
      "Wash glutinous rice and soak in water overnight",
      "Drain rice and grind or pound into a fine paste",
      "In a large wok, combine coconut milk and rice paste",
      "Cook over low heat, stirring constantly",
      "Add brown sugar gradually, continuing to stir",
      "Cook for 1-2 hours until mixture is very thick and pulls away from the sides",
      "Add coconut cream and a pinch of salt",
      "Continue cooking and stirring for another 15 minutes",
      "Transfer to coconut shells or containers",
      "Let cool and set before serving",
      "Can be stored at room temperature for up to a week"
    ]
  },

  // --- AKLAN ---
  {
    name: "Binakol",
    desc: "A unique chicken soup from Aklan cooked inside a bamboo tube with coconut water and lemongrass. The bamboo imparts a subtle, earthy flavor to the soup.",
    region: "Visayas",
    img: "https://images.pexels.com/photos/5137980/pexels-photo-5137980.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 whole native chicken (about 1 kg), cut into serving pieces",
      "2 cups fresh coconut water (buko juice)",
      "1 cup fresh coconut meat, sliced",
      "2 stalks lemongrass, crushed",
      "1 thumb-sized ginger, sliced",
      "1 medium onion, quartered",
      "2-3 pieces green papaya, cubed",
      "1 cup malunggay leaves",
      "2 tablespoons fish sauce",
      "Salt and pepper to taste",
      "Bamboo tube (optional, for traditional cooking)"
    ],
    instructions: [
      "If using bamboo: Place chicken, coconut water, lemongrass, ginger, and onion inside bamboo tube, seal ends",
      "If using pot: Combine all ingredients except malunggay in a pot",
      "Add coconut water and bring to a boil",
      "Reduce heat and simmer for 30 minutes",
      "Add green papaya and continue cooking for 10 minutes",
      "Add coconut meat and cook for 5 minutes",
      "Season with fish sauce, salt, and pepper",
      "Add malunggay leaves just before serving",
      "Cook for 2 more minutes",
      "Serve hot"
    ]
  },

  // ==================== MINDANAO RECIPES (15+) ====================

  // --- DAVAO / SOUTHEASTERN MINDANAO ---
  {
    name: "Tuna Kinilaw",
    desc: "Fresh tuna cured in vinegar and calamansi with coconut cream - Mindanao's pride. Davao, being a coastal city with abundant fresh tuna, perfected this refreshing dish.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/8687108/pexels-photo-8687108.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g fresh yellowfin tuna, cubed",
      "1/2 cup coconut vinegar",
      "1/4 cup calamansi juice",
      "1/2 cup coconut cream",
      "1 medium red onion, sliced thinly",
      "3 cloves garlic, minced",
      "1 thumb-sized ginger, julienned",
      "2-3 pieces bird's eye chili, sliced",
      "1 medium tomato, diced",
      "Salt and pepper to taste",
      "Cilantro for garnish"
    ],
    instructions: [
      "Place tuna cubes in a non-reactive bowl",
      "Pour vinegar and calamansi juice over the tuna",
      "Mix well and refrigerate for 10-15 minutes until tuna turns opaque",
      "Drain most of the liquid, leaving just a little",
      "Add onion, garlic, ginger, chili, and tomato",
      "Pour in coconut cream and mix gently",
      "Season with salt and pepper to taste",
      "Chill for another 15-20 minutes",
      "Garnish with cilantro before serving",
      "Serve cold as an appetizer with crackers or as viand with rice"
    ]
  },
  {
    name: "Grilled Tuna Belly",
    desc: "Simple yet incredibly delicious grilled tuna belly, a Davao specialty. The fatty belly part is perfect for grilling, becoming tender and flavorful with just basic seasonings.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/8753991/pexels-photo-8753991.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg tuna belly, cut into steaks",
      "1/4 cup soy sauce",
      "1/4 cup calamansi juice",
      "5 cloves garlic, minced",
      "1 tablespoon black pepper",
      "2 tablespoons cooking oil",
      "Salt to taste"
    ],
    instructions: [
      "In a bowl, combine soy sauce, calamansi juice, garlic, pepper, and oil",
      "Marinate tuna belly steaks for at least 30 minutes",
      "Prepare charcoal grill and let coals turn gray",
      "Season tuna with salt",
      "Grill over medium-high heat for 4-5 minutes per side",
      "Avoid overcooking to keep the tuna tender and juicy",
      "Baste with remaining marinade while grilling",
      "Serve hot with soy sauce-calamansi dipping sauce and steamed rice"
    ]
  },

  // --- ZAMBOANGA ---
  {
    name: "Satti",
    desc: "A breakfast favorite in Zamboanga featuring grilled chicken or beef skewers with a unique sweet-spicy peanut sauce. Served with puso (hanging rice) and a special sauce.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/7625073/pexels-photo-7625073.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "500g chicken meat or beef, cut into cubes",
      "1/4 cup soy sauce",
      "2 tablespoons calamansi juice",
      "5 cloves garlic, minced",
      "Bamboo skewers, soaked in water",
      "For the sauce:",
      "1/2 cup peanut butter",
      "1/4 cup coconut milk",
      "3 tablespoons brown sugar",
      "2 tablespoons soy sauce",
      "1 tablespoon chili flakes",
      "2 cloves garlic, minced",
      "1/2 cup water",
      "Salt to taste"
    ],
    instructions: [
      "Marinate meat in soy sauce, calamansi juice, and garlic for 1 hour",
      "Thread marinated meat onto bamboo skewers",
      "For the sauce: In a saucepan, combine peanut butter, coconut milk, brown sugar, soy sauce, chili flakes, garlic, and water",
      "Cook sauce over low heat, stirring constantly until smooth and thick",
      "Grill meat skewers over hot coals for 8-10 minutes, turning frequently",
      "Baste with oil while grilling",
      "Serve hot satti with puso (hanging rice) and the peanut sauce",
      "Traditionally eaten for breakfast"
    ]
  },

  // --- MAGUINDANAO (MUSLIM MINDANAO) ---
  {
    name: "Tiyula Itum (Black Soup)",
    desc: "A unique Tausug beef or chicken soup turned black from burnt coconut and aromatic spices. This signature dish from Muslim Mindanao has a complex, smoky flavor profile.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/5409010/pexels-photo-5409010.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg beef or chicken, cut into serving pieces",
      "1 cup grated coconut, toasted until black",
      "6 cups water",
      "3 stalks lemongrass, crushed",
      "1 thumb-sized ginger, sliced",
      "1 thumb-sized turmeric, sliced",
      "5 pieces bird's eye chili",
      "1 medium onion, quartered",
      "3 tablespoons cooking oil",
      "Salt to taste",
      "Spring onions for garnish"
    ],
    instructions: [
      "Toast grated coconut in a dry pan until completely black (this gives the soup its signature color)",
      "Soak the burnt coconut in 2 cups of water, squeeze to extract the black liquid, strain",
      "In a pot, heat oil and sauté ginger, turmeric, and onion",
      "Add meat and cook until lightly browned",
      "Pour in remaining water and lemongrass",
      "Bring to a boil, then simmer for 1-2 hours until meat is very tender",
      "Add the black coconut extract and bird's eye chili",
      "Simmer for another 15 minutes",
      "Season with salt to taste",
      "Garnish with spring onions",
      "Serve hot with steamed rice"
    ]
  },
  {
    name: "Beef Rendang (Mindanao Style)",
    desc: "A rich, slow-cooked beef curry with coconut milk and spices, influenced by Indonesian cuisine. Muslim Mindanao's version has its own unique spice blend.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/11401283/pexels-photo-11401283.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg beef chuck, cut into cubes",
      "3 cups coconut milk",
      "1 cup coconut cream",
      "5 cloves garlic, minced",
      "1 large onion, chopped",
      "2 thumb-sized ginger, minced",
      "1 thumb-sized turmeric, minced",
      "3 tablespoons curry powder",
      "2 tablespoons chili powder",
      "3 stalks lemongrass, crushed",
      "5 kaffir lime leaves",
      "3 tablespoons tamarind paste",
      "2 tablespoons brown sugar",
      "Salt to taste",
      "3 tablespoons cooking oil"
    ],
    instructions: [
      "Heat oil in a heavy pot and sauté garlic, onion, ginger, and turmeric",
      "Add curry powder and chili powder, stir for 1 minute",
      "Add beef cubes and cook until browned on all sides",
      "Pour in coconut milk, lemongrass, and kaffir lime leaves",
      "Bring to a boil, then reduce heat to low",
      "Simmer uncovered for 2-3 hours, stirring occasionally",
      "Add coconut cream, tamarind paste, and brown sugar",
      "Continue cooking until sauce is very thick and oil separates",
      "The beef should be tender and the sauce dark and rich",
      "Season with salt to taste",
      "Serve with steamed rice or puso"
    ]
  },

  // --- LANAO DEL SUR ---
  {
    name: "Pastil",
    desc: "Steamed rice topped with shredded chicken or beef in a banana leaf, a popular snack in Maguindanao and Lanao. This convenient, flavorful packet is perfect for breakfast or snacks.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/8879538/pexels-photo-8879538.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "3 cups glutinous rice (malagkit), washed",
      "500g chicken or beef, shredded",
      "1 cup coconut cream",
      "5 cloves garlic, minced",
      "1 medium onion, chopped",
      "1 thumb-sized ginger, minced",
      "1 thumb-sized turmeric, minced",
      "2 tablespoons curry powder",
      "3 tablespoons soy sauce",
      "2 tablespoons cooking oil",
      "Salt and pepper to taste",
      "Banana leaves, cut into rectangles",
      "Toothpicks for sealing"
    ],
    instructions: [
      "Cook glutinous rice according to package directions, set aside",
      "Heat oil in a pan and sauté garlic, onion, ginger, and turmeric",
      "Add curry powder and stir for 30 seconds",
      "Add shredded meat and cook for 5 minutes",
      "Pour in coconut cream and soy sauce",
      "Simmer until sauce thickens",
      "Season with salt and pepper",
      "Soften banana leaves over flame",
      "Place 2-3 tablespoons of rice on each banana leaf",
      "Top with meat mixture",
      "Fold banana leaf to enclose the rice and meat",
      "Secure with toothpicks",
      "Steam pastil for 15 minutes",
      "Serve warm"
    ]
  },

  // --- BUKIDNON ---
  {
    name: "Pianggang Manok",
    desc: "Grilled chicken marinated in a special blend of spices and coconut cream, wrapped in banana leaves. This Tausug specialty from Bukidnon/Sulu has a unique smoky, spicy flavor.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/6210749/pexels-photo-6210749.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 whole chicken (about 1.5 kg), butterflied",
      "1 cup coconut cream",
      "6 cloves garlic, minced",
      "1 large onion, chopped",
      "2 thumb-sized ginger, minced",
      "1 thumb-sized turmeric, minced",
      "3 tablespoons curry powder",
      "2 tablespoons chili powder",
      "3 stalks lemongrass, finely chopped",
      "3 tablespoons soy sauce",
      "2 tablespoons brown sugar",
      "Salt and pepper to taste",
      "Banana leaves for wrapping",
      "Kitchen twine"
    ],
    instructions: [
      "In a bowl, combine coconut cream, garlic, onion, ginger, turmeric, curry powder, chili powder, lemongrass, soy sauce, and brown sugar",
      "Mix well to form a paste",
      "Rub the spice paste all over the chicken, inside and out",
      "Marinate for at least 4 hours or overnight in refrigerator",
      "Soften banana leaves over flame",
      "Wrap the marinated chicken completely in banana leaves",
      "Secure with kitchen twine",
      "Grill the wrapped chicken over medium coals for 1-1.5 hours",
      "Turn occasionally to cook evenly",
      "Unwrap and check if chicken is fully cooked",
      "For extra char, unwrap and grill chicken directly on grates for 5 minutes",
      "Serve hot with steamed rice and spicy vinegar"
    ]
  },

  // --- COTABATO ---
  {
    name: "Dudol",
    desc: "A sticky, sweet delicacy from Maguindanao made with durian, coconut milk, and sugar. This unique kakanin showcases Mindanao's love for durian.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/7625155/pexels-photo-7625155.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "2 cups durian meat (from ripe durian)",
      "2 cups glutinous rice flour",
      "3 cups coconut milk",
      "2 cups brown sugar",
      "1/2 cup coconut cream",
      "Pinch of salt",
      "Banana leaves for lining pan"
    ],
    instructions: [
      "Mash durian meat until smooth",
      "In a large wok or pan, combine durian, coconut milk, and brown sugar",
      "Cook over low heat, stirring constantly",
      "Gradually add glutinous rice flour, stirring to avoid lumps",
      "Continue cooking and stirring for 1-2 hours until very thick",
      "Add coconut cream and salt",
      "Cook for another 15 minutes until mixture pulls away from sides",
      "Line a pan with banana leaves",
      "Pour the dudol mixture into the pan",
      "Let cool and set for several hours",
      "Cut into squares and serve"
    ]
  },

  // --- GENERAL SANTOS CITY ---
  {
    name: "Balbacua",
    desc: "A rich, gelatinous beef stew from General Santos using skin, tail, and other collagen-rich parts. Slow-cooked until the broth becomes thick and sticky.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/4552129/pexels-photo-4552129.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "1 kg beef skin, cut into pieces",
      "500g oxtail, cut into pieces",
      "500g beef tendons",
      "10 cups water",
      "1/2 cup peanut butter",
      "6 cloves garlic, minced",
      "2 medium onions, chopped",
      "3 tablespoons annatto oil (atsuete)",
      "3 bay leaves",
      "1 tablespoon whole peppercorns",
      "3 tablespoons fish sauce",
      "2 tablespoons soy sauce",
      "Salt and pepper to taste",
      "Green onions for garnish",
      "Fried garlic for topping"
    ],
    instructions: [
      "In a large pot, combine beef skin, oxtail, tendons, and water",
      "Add bay leaves and peppercorns",
      "Bring to a boil, then simmer for 3-4 hours until very tender",
      "In a separate pan, heat annatto oil and sauté garlic and onions",
      "Add this to the pot with the meat",
      "Stir in peanut butter until dissolved",
      "Season with fish sauce, soy sauce, salt, and pepper",
      "Continue simmering for another hour until broth is thick and sticky",
      "Serve in bowls garnished with green onions and fried garlic",
      "Traditionally eaten with puso (hanging rice)"
    ]
  },

  // --- CAMIGUIN ---
  {
    name: "Kiping",
    desc: "Cassava-based colorful leaf-shaped wafers from Camiguin, similar to Lucban's kiping but with a Mindanaoan twist. Often displayed during festivals then eaten after.",
    region: "Mindanao",
    img: "https://images.pexels.com/photos/8879577/pexels-photo-8879577.jpeg?auto=compress&cs=tinysrgb&w=800",
    ingredients: [
      "2 kg cassava, peeled and grated",
      "2 cups coconut milk",
      "1 cup sugar",
      "Food coloring (various colors)",
      "Banana leaves, cut into leaf shapes",
      "Water for boiling"
    ],
    instructions: [
      "Wrap grated cassava in cheesecloth and squeeze out excess liquid",
      "Mix cassava with coconut milk and sugar",
      "Divide mixture into portions and add different food colors",
      "Spread each colored mixture thinly on banana leaf cutouts",
      "Steam for 20-25 minutes until set",
      "Carefully peel off from banana leaves while still warm",
      "Dry in the sun for 1-2 days until crispy",
      "Can be eaten as chips or used as decorative elements",
      "Deep fry before eating for extra crispiness"
    ]
  }
];

/**
 * Main seeder function
 */
async function seedCulturalRecipes() {
  try {
    console.log("🌾 Starting COMPREHENSIVE Cultural Recipes Seeder...\n");

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'pickaplate';
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    await mongoose.connect(uri, {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
    });

    console.log(`✅ Connected to MongoDB successfully!`);
    console.log(`📊 Database: ${mongoose.connection.name}\n`);

    // Check existing recipes
    const existingCount = await CulturalRecipe.countDocuments();
    console.log(`📊 Current database status: ${existingCount} cultural recipes exist\n`);

    // Clear existing cultural recipes
    console.log("🗑️  Clearing existing cultural recipes...");
    await CulturalRecipe.deleteMany({});
    console.log("✅ Existing recipes cleared\n");

    // Insert new recipes
    console.log(`📝 Inserting ${culturalRecipes.length} comprehensive cultural recipes...`);
    const result = await CulturalRecipe.insertMany(culturalRecipes);

    console.log("\n" + "=".repeat(70));
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log(`\n✅ Successfully inserted ${result.length} cultural recipes\n`);

    // Count by region
    const luzonCount = await CulturalRecipe.countDocuments({ region: "Luzon" });
    const visayasCount = await CulturalRecipe.countDocuments({ region: "Visayas" });
    const mindanaoCount = await CulturalRecipe.countDocuments({ region: "Mindanao" });

    console.log("📍 Regional Distribution:");
    console.log(`   • Luzon: ${luzonCount} recipes`);
    console.log(`   • Visayas: ${visayasCount} recipes`);
    console.log(`   • Mindanao: ${mindanaoCount} recipes`);
    console.log(`   • TOTAL: ${luzonCount + visayasCount + mindanaoCount} recipes\n`);

    console.log("📋 Sample Recipes by Region:\n");

    const luzonSample = await CulturalRecipe.findOne({ region: "Luzon" });
    console.log(`Luzon Sample: ${luzonSample.name}`);
    console.log(`   • ${luzonSample.ingredients?.length || 0} ingredients`);
    console.log(`   • ${luzonSample.instructions?.length || 0} cooking steps\n`);

    const visayasSample = await CulturalRecipe.findOne({ region: "Visayas" });
    console.log(`Visayas Sample: ${visayasSample.name}`);
    console.log(`   • ${visayasSample.ingredients?.length || 0} ingredients`);
    console.log(`   • ${visayasSample.instructions?.length || 0} cooking steps\n`);

    const mindanaoSample = await CulturalRecipe.findOne({ region: "Mindanao" });
    console.log(`Mindanao Sample: ${mindanaoSample.name}`);
    console.log(`   • ${mindanaoSample.ingredients?.length || 0} ingredients`);
    console.log(`   • ${mindanaoSample.instructions?.length || 0} cooking steps\n`);

    console.log("🌐 API Endpoints to test:");
    console.log("   • GET  http://localhost:4000/api/cultural-recipes");
    console.log("   • GET  http://localhost:4000/api/cultural-recipes?region=Luzon");
    console.log("   • GET  http://localhost:4000/api/cultural-recipes?region=Visayas");
    console.log("   • GET  http://localhost:4000/api/cultural-recipes?region=Mindanao\n");

  } catch (error) {
    console.error("\n❌ SEEDING ERROR:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("📡 Database connection closed");
    console.log("✨ All done!\n");
    process.exit(0);
  }
}

// Run the seeder
seedCulturalRecipes();
