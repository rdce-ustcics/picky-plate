require("dotenv").config();
const mongoose = require("mongoose");
const CulturalRecipe = require("../models/CulturalRecipe");

/**
 * Comprehensive Filipino Cultural Recipes Database Seeder
 *
 * This seeder contains authentic Filipino recipes categorized by region:
 * - Luzon: Northern and Central Philippines
 * - Visayas: Central island group
 * - Mindanao: Southern Philippines
 *
 * Data compiled from multiple authoritative sources on Filipino cuisine
 * focusing on traditional, culturally significant dishes.
 */

const culturalRecipes = [
  // ==================== LUZON RECIPES ====================
  {
    name: "Sinigang na Baboy",
    desc: "A comforting sour soup featuring tamarind broth with pork and fresh vegetables. This quintessential Filipino dish creates a symphony of flavors that warm the soul.",
    region: "Luzon",
    img: "https://images.unsplash.com/photo-1559847844-d087c5e8f4ba?w=800",
    recipe: [
      "1 kg pork belly or ribs, cut into serving pieces",
      "8 cups water",
      "2 medium tomatoes, quartered",
      "1 large onion, quartered",
      "3-4 pieces taro (gabi), peeled and halved",
      "1 bundle kangkong (water spinach)",
      "2 pieces long green pepper (siling haba)",
      "1 pack tamarind soup base or fresh tamarind",
      "2-3 pieces radish (labanos), sliced",
      "Salt and fish sauce to taste",
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
    name: "Adobo",
    desc: "The quintessential Filipino dish - savory meat marinated and braised in vinegar, soy sauce, garlic, and spices. Every Filipino family has their own cherished version of this beloved classic.",
    region: "Luzon",
    img: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800",
    recipe: [
      "1 kg chicken pieces or pork belly, cut into serving sizes",
      "1/2 cup soy sauce",
      "1/2 cup white vinegar",
      "1 head garlic, minced",
      "1 teaspoon whole black peppercorns",
      "3-4 bay leaves (dahon ng laurel)",
      "1 cup water",
      "2 tablespoons cooking oil",
      "Salt and sugar to taste (optional)",
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
    name: "Sisig",
    desc: "A sizzling dish from Pampanga using chopped pig's head and liver, seasoned with calamansi and chili peppers. This exemplifies the bold, innovative flavors of Kapampangan cuisine.",
    region: "Luzon",
    img: "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=800",
    recipe: [
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
      "Mayonnaise (optional)",
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
    name: "Kare-Kare",
    desc: "A rich peanut-based stew with oxtail, tripe, and vegetables in a thick savory peanut sauce. Traditionally served with bagoong (fermented shrimp paste) on the side.",
    region: "Luzon",
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    recipe: [
      "1 kg oxtail, cut into 2-inch pieces",
      "500g beef tripe, cleaned and cut",
      "1 cup peanut butter",
      "1/2 cup ground toasted rice (bigas na pinanggang ginamit sa pagpapaganda ng sabaw)",
      "1 bundle string beans (sitaw), cut into 2-inch pieces",
      "1 eggplant, sliced",
      "1 banana heart (puso ng saging), sliced",
      "1 bundle bok choy (pechay)",
      "1 onion, chopped",
      "4 cloves garlic, minced",
      "Bagoong (shrimp paste) for serving",
      "Salt and pepper to taste",
      "8-10 cups water",
      "Boil oxtail and tripe in water until tender (2-3 hours)",
      "Reserve broth and set meat aside",
      "In a pot, sauté garlic and onions",
      "Add back the meat and 6 cups of broth",
      "Mix peanut butter and ground rice with some broth until smooth",
      "Pour peanut mixture into the pot and stir well",
      "Simmer for 15-20 minutes until sauce thickens",
      "Add vegetables: banana heart first, then eggplant and string beans",
      "Add bok choy last and cook for 2 minutes",
      "Season with salt and pepper",
      "Serve hot with steamed rice and bagoong on the side"
    ]
  },
  {
    name: "Bulalo",
    desc: "A rich beef marrow soup with tender beef shanks, corn, and vegetables. This hearty Batangas specialty is perfect for sharing with family on a cool day.",
    region: "Luzon",
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    recipe: [
      "2 kg beef shanks with bone marrow",
      "12 cups water",
      "1 large onion, quartered",
      "2 pieces corn, each cut into 3 parts",
      "2 bundles bok choy (pechay), separated",
      "1 small cabbage, quartered",
      "2 tablespoons whole peppercorns",
      "Fish sauce (patis) to taste",
      "Salt to taste",
      "In a large pot, boil beef shanks in water",
      "Add onion and peppercorns",
      "Boil for 1.5 to 2 hours or until meat is very tender",
      "Add corn and cook for another 10 minutes",
      "Add cabbage and cook for 5 minutes",
      "Add bok choy and cook for 2 minutes",
      "Season with fish sauce and salt",
      "Serve hot, making sure each bowl has bone marrow"
    ]
  },
  {
    name: "Bicol Express",
    desc: "A spicy pork dish cooked with coconut milk and chili peppers from the Bicol region. This fiery dish represents the bold flavors of Bicolano cuisine.",
    region: "Luzon",
    img: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
    recipe: [
      "500g pork belly, cut into strips",
      "1 cup coconut milk (first extract/gata)",
      "1 cup coconut cream (second extract/kakang gata)",
      "2 tablespoons shrimp paste (bagoong alamang)",
      "6-8 pieces Thai chili peppers (siling labuyo), sliced",
      "4 cloves garlic, minced",
      "1 large onion, sliced",
      "2 tablespoons cooking oil",
      "Salt and pepper to taste",
      "Heat oil in a pan and sauté garlic and onions",
      "Add pork and cook until lightly browned",
      "Add shrimp paste and stir for 1-2 minutes",
      "Pour in coconut cream and bring to a boil",
      "Reduce heat and simmer uncovered for 20 minutes until pork is tender",
      "Add coconut milk and chili peppers",
      "Simmer for another 10-15 minutes until sauce thickens",
      "Season with salt and pepper",
      "Serve with lots of steamed rice"
    ]
  },
  {
    name: "Pinakbet",
    desc: "A savory vegetable stew from Ilocos Norte featuring bitter melon, eggplant, squash, and local produce cooked with shrimp paste. This dish highlights Luzon's agricultural abundance.",
    region: "Luzon",
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    recipe: [
      "250g pork belly, sliced thinly",
      "2 pieces bitter melon (ampalaya), sliced",
      "2 pieces eggplant, sliced",
      "1 cup squash (kalabasa), cubed",
      "1 cup string beans (sitaw), cut into 2-inch pieces",
      "1 cup okra",
      "2 medium tomatoes, quartered",
      "1 onion, sliced",
      "4 cloves garlic, minced",
      "3 tablespoons shrimp paste (bagoong)",
      "1/2 cup water",
      "2 tablespoons cooking oil",
      "Sauté garlic, onions, and tomatoes in oil",
      "Add pork and cook until lightly browned",
      "Add shrimp paste and stir for 1 minute",
      "Add squash and water, cover and simmer for 5 minutes",
      "Add eggplant and bitter melon, cook for 3 minutes",
      "Add string beans and okra",
      "Cover and cook for 5 minutes without stirring (to keep vegetables intact)",
      "Gently mix before serving"
    ]
  },
  {
    name: "Tinolang Manok",
    desc: "A ginger-based chicken soup with green papaya and chili leaves. This comforting home-cooked dish is a Filipino household staple known for its clear, aromatic broth.",
    region: "Luzon",
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    recipe: [
      "1 kg chicken, cut into serving pieces",
      "1 thumb-sized ginger, sliced into strips",
      "1 onion, sliced",
      "4 cloves garlic, crushed",
      "1 green papaya or sayote, peeled and sliced",
      "1 bundle chili leaves (dahon ng sili) or malunggay leaves",
      "6 cups water or rice washing",
      "2 tablespoons fish sauce (patis)",
      "2 tablespoons cooking oil",
      "Salt and pepper to taste",
      "Heat oil in a pot and sauté garlic, onion, and ginger",
      "Add chicken pieces and cook until lightly browned",
      "Pour in fish sauce and cook for 2 minutes",
      "Add water and bring to a boil",
      "Lower heat and simmer for 20-25 minutes until chicken is cooked",
      "Add papaya or sayote and cook for 5-7 minutes",
      "Add chili leaves or malunggay",
      "Season with salt and pepper",
      "Simmer for 2 minutes and serve hot"
    ]
  },

  // ==================== VISAYAS RECIPES ====================
  {
    name: "Lechon",
    desc: "The centerpiece of Filipino celebrations - a whole roasted pig with crispy, golden-brown skin and succulent meat. Cebu's lechon is world-renowned for its exceptional flavor.",
    region: "Visayas",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    recipe: [
      "1 whole pig (10-15 kg), cleaned",
      "1 cup rock salt",
      "2 heads garlic, crushed",
      "5-6 stalks lemongrass, pounded",
      "10 pieces bay leaves",
      "2 tablespoons whole black peppercorns",
      "5-6 pieces onions, quartered",
      "Fresh herbs (tanglad, spring onions)",
      "1/2 cup soy sauce",
      "1/4 cup calamansi juice",
      "Liver sauce or vinegar for dipping",
      "Clean the pig thoroughly inside and out",
      "Make a marinade of soy sauce, calamansi, salt, and pepper",
      "Rub marinade inside and outside the pig",
      "Stuff cavity with lemongrass, onions, garlic, bay leaves, and herbs",
      "Sew the cavity closed with wire",
      "Mount the pig on a bamboo spit",
      "Roast over charcoal for 3-5 hours, turning constantly",
      "Baste occasionally with oil to achieve crispy skin",
      "Cook until skin is deep golden brown and crispy",
      "Let rest for 10-15 minutes before carving",
      "Serve with liver sauce or spiced vinegar"
    ]
  },
  {
    name: "Chicken Inasal",
    desc: "Grilled chicken from Bacolod with a distinctive red-orange hue and smoky flavor, marinated in calamansi, vinegar, and annatto oil. A beloved street food turned restaurant favorite.",
    region: "Visayas",
    img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800",
    recipe: [
      "1 kg chicken, cut into serving pieces",
      "1/2 cup calamansi juice",
      "1/4 cup vinegar",
      "1 head garlic, minced",
      "1 thumb-sized ginger, grated",
      "1 stalk lemongrass, chopped finely",
      "1/4 cup brown sugar",
      "2 tablespoons soy sauce",
      "1/4 cup annatto oil (atsuete)",
      "Salt and pepper to taste",
      "Bamboo skewers",
      "Mix calamansi juice, vinegar, garlic, ginger, lemongrass, sugar, and soy sauce",
      "Marinate chicken in the mixture for at least 4 hours or overnight",
      "Prepare annatto oil by heating oil with annatto seeds, then strain",
      "Thread chicken pieces onto bamboo skewers",
      "Grill over hot charcoal, basting frequently with annatto oil",
      "Cook for 30-40 minutes, turning regularly until fully cooked",
      "The chicken should have a beautiful red-orange color",
      "Serve with steamed rice, pickled papaya (atsara), and chicken oil"
    ]
  },
  {
    name: "La Paz Batchoy",
    desc: "A hearty noodle soup from Iloilo with pork organs, crushed chicharon, and egg noodles in a rich, flavorful broth. This comfort food reflects Chinese and Spanish influences.",
    region: "Visayas",
    img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
    recipe: [
      "500g fresh egg noodles (miki)",
      "250g pork loin, boiled and sliced",
      "250g pork liver, boiled and sliced",
      "100g pork intestines, cleaned and boiled",
      "8 cups pork broth (from boiling pork bones)",
      "4 cloves garlic, minced",
      "1 onion, chopped",
      "2 tablespoons cooking oil",
      "2 tablespoons shrimp paste (guinamos)",
      "Fish sauce (patis) to taste",
      "Crushed chicharon (pork cracklings)",
      "Green onions, chopped",
      "2-3 eggs",
      "Fried garlic",
      "In a pot, heat oil and sauté garlic and onions",
      "Add pork broth and bring to a boil",
      "Add shrimp paste and fish sauce to taste",
      "In serving bowls, place egg noodles",
      "Top with sliced pork, liver, and intestines",
      "Pour hot broth over noodles",
      "Add a raw egg and let it cook in the hot soup",
      "Top generously with crushed chicharon, green onions, and fried garlic",
      "Serve immediately while hot"
    ]
  },
  {
    name: "Kinilaw na Isda",
    desc: "Filipino ceviche featuring fresh fish or seafood marinated in vinegar, calamansi juice, and spices. This refreshing appetizer showcases the Visayas' abundant seafood.",
    region: "Visayas",
    img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800",
    recipe: [
      "500g fresh fish (tuna, tanigue, or lapu-lapu), cut into cubes",
      "1/2 cup coconut vinegar or cane vinegar",
      "1/4 cup calamansi juice",
      "1 thumb-sized ginger, julienned",
      "1 large red onion, sliced thinly",
      "2-3 pieces bird's eye chili (siling labuyo), sliced",
      "1 cup coconut cream (optional)",
      "Salt and pepper to taste",
      "1 cucumber, diced (optional)",
      "Ensure fish is very fresh and properly cleaned",
      "Cut fish into bite-sized cubes",
      "In a bowl, combine fish, vinegar, and calamansi juice",
      "Add ginger, onions, and chilies",
      "Season with salt and pepper",
      "Mix well and marinate for 10-15 minutes in the refrigerator",
      "Add coconut cream if desired for a creamier version",
      "Adjust seasoning and add cucumber for crunch",
      "Serve immediately as an appetizer"
    ]
  },
  {
    name: "Binakol",
    desc: "A Visayan chicken soup cooked with coconut water inside a bamboo tube, giving it a unique smoky flavor. The soup is light, refreshing, and aromatic.",
    region: "Visayas",
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    recipe: [
      "1 whole native chicken, cut into serving pieces",
      "3-4 cups fresh coconut water (buko juice)",
      "2 cups young coconut meat, sliced into strips",
      "1 thumb-sized ginger, sliced",
      "1 stalk lemongrass, pounded",
      "2 pieces green papaya or sayote, cubed",
      "2 tablespoons fish sauce (patis)",
      "Salt and pepper to taste",
      "Malunggay or chili leaves (optional)",
      "In a pot, bring coconut water to a boil",
      "Add chicken, ginger, and lemongrass",
      "Simmer for 20-25 minutes until chicken is tender",
      "Add fish sauce and season with salt and pepper",
      "Add green papaya or sayote and cook for 5-7 minutes",
      "Add coconut meat strips",
      "Add malunggay or chili leaves if using",
      "Simmer for 2 minutes",
      "Serve hot (traditionally cooked and served in bamboo)"
    ]
  },
  {
    name: "Humba",
    desc: "Visayan-style braised pork belly with fermented black beans, similar to Chinese hong shao rou. Sweet, savory, and tender, this is a Visayan household favorite.",
    region: "Visayas",
    img: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800",
    recipe: [
      "1 kg pork belly, cut into chunks",
      "1/4 cup soy sauce",
      "1/4 cup vinegar",
      "1/4 cup brown sugar",
      "3 tablespoons fermented black beans (tausi)",
      "1 head garlic, crushed",
      "1 onion, sliced",
      "3-4 bay leaves",
      "1 teaspoon whole peppercorns",
      "1 cup pineapple juice or dried banana blossoms",
      "1 cup water",
      "2 tablespoons cooking oil",
      "Hard-boiled eggs (optional)",
      "In a pan, heat oil and brown pork belly on all sides",
      "Add garlic and onions, sauté until fragrant",
      "Add fermented black beans and stir",
      "Pour in soy sauce, vinegar, and pineapple juice",
      "Add water, sugar, bay leaves, and peppercorns",
      "Bring to a boil, then lower heat and simmer covered for 1-1.5 hours",
      "Add hard-boiled eggs if using",
      "Continue simmering uncovered until sauce thickens and becomes syrupy",
      "The pork should be very tender and the sauce glossy",
      "Serve with steamed rice"
    ]
  },

  // ==================== MINDANAO RECIPES ====================
  {
    name: "Tuna Kinilaw",
    desc: "A Mindanao specialty ceviche-style dish with fresh tuna marinated in coconut vinegar, calamansi juice, and chili peppers. This showcases Mindanao's coastal seafood bounty, especially from General Santos (Tuna Capital).",
    region: "Mindanao",
    img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    recipe: [
      "500g fresh yellowfin or skipjack tuna, cut into cubes",
      "1/2 cup coconut vinegar (sukang tuba)",
      "1/4 cup calamansi juice",
      "1 thumb-sized ginger, julienned finely",
      "1 large red onion, sliced thinly",
      "4-5 pieces bird's eye chili (siling labuyo), sliced",
      "1/2 cup coconut cream (optional, for creamy version)",
      "Salt and cracked black pepper to taste",
      "Ensure tuna is sushi-grade fresh",
      "Cut tuna into bite-sized cubes and place in a bowl",
      "Pour coconut vinegar and calamansi juice over tuna",
      "Add ginger, onions, and chilies",
      "Season generously with salt and pepper",
      "Gently mix and let marinate for 10-15 minutes in refrigerator",
      "The acid will 'cook' the fish, turning it opaque",
      "For creamy version, add coconut cream before serving",
      "Serve immediately as an appetizer with cold beer or rice"
    ]
  },
  {
    name: "Satti",
    desc: "Spicy skewered meat from Zamboanga served with peanut sauce and hanging rice (puso). This traditional Muslim dish reflects Mindanao's rich Islamic heritage.",
    region: "Mindanao",
    img: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800",
    recipe: [
      "500g beef or chicken, cut into small cubes",
      "Bamboo skewers, soaked in water",
      "For marinade:",
      "2 tablespoons soy sauce",
      "2 tablespoons calamansi juice",
      "1 teaspoon curry powder",
      "4-5 pieces bird's eye chili, minced",
      "For peanut sauce:",
      "1 cup ground roasted peanuts",
      "3 tablespoons palm sugar or brown sugar",
      "3 cloves garlic, minced",
      "2 cups water",
      "2 tablespoons tamarind paste",
      "Salt to taste",
      "Hanging rice (puso) for serving",
      "Mix marinade ingredients and marinate meat for 2 hours",
      "Thread meat onto bamboo skewers",
      "For sauce: sauté garlic, add water, ground peanuts, sugar, and tamarind",
      "Simmer sauce until thick, season with salt",
      "Grill skewers over charcoal until cooked and slightly charred",
      "Serve hot with peanut sauce and hanging rice"
    ]
  },
  {
    name: "Tiyula Itum",
    desc: "A dark, savory soup from Tawi-Tawi featuring burnt coconut and aromatic spices. This traditional Tausug dish has a unique black color and complex flavor profile.",
    region: "Mindanao",
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    recipe: [
      "500g beef or chicken, cut into chunks",
      "1 whole coconut, meat extracted and toasted until black",
      "1 thumb-sized ginger, sliced",
      "1 thumb-sized turmeric (luyang dilaw), sliced",
      "5-6 shallots, peeled",
      "4 cloves garlic",
      "2 stalks lemongrass, pounded",
      "3-4 pieces bird's eye chili",
      "6 cups water",
      "Salt to taste",
      "Toast coconut meat in a dry pan until completely black (burnt)",
      "Grind or pound the burnt coconut into small pieces",
      "Wrap burnt coconut in cheesecloth and steep in hot water to extract black color",
      "In a pot, boil meat with ginger, turmeric, shallots, and garlic",
      "Add the black coconut water and lemongrass",
      "Simmer for 1-2 hours until meat is very tender",
      "Add chilies and season with salt",
      "The soup should be dark brown to black in color",
      "Serve hot with rice"
    ]
  },
  {
    name: "Beef Rendang",
    desc: "Tender beef slow-cooked in coconut milk with fragrant spices. This Malay-inspired dish from Mindanao reflects the region's Southeast Asian culinary influences.",
    region: "Mindanao",
    img: "https://images.unsplash.com/photo-1504973960431-1c467e159aa4?w=800",
    recipe: [
      "1 kg beef chuck, cut into cubes",
      "2 cups coconut milk",
      "1 cup coconut cream",
      "4 stalks lemongrass, pounded",
      "8 pieces dried red chilies",
      "8 shallots",
      "6 cloves garlic",
      "1 thumb-sized ginger",
      "1 thumb-sized galangal",
      "2 teaspoons coriander powder",
      "2 teaspoons cumin powder",
      "1 teaspoon turmeric powder",
      "4 kaffir lime leaves",
      "3 tablespoons tamarind paste",
      "3 tablespoons palm sugar or brown sugar",
      "Salt to taste",
      "Blend chilies, shallots, garlic, ginger, and galangal into a smooth paste",
      "In a pot, combine beef, spice paste, lemongrass, and coconut milk",
      "Add coriander, cumin, turmeric, and kaffir lime leaves",
      "Bring to a boil, then reduce heat and simmer uncovered for 2-3 hours",
      "Stir occasionally to prevent sticking",
      "Add tamarind paste and palm sugar",
      "Continue cooking until sauce is very thick and oil separates",
      "The beef should be dark brown and very tender",
      "Season with salt and serve with rice"
    ]
  },
  {
    name: "Pastil",
    desc: "Steamed rice with shredded chicken or beef wrapped in banana leaves. This traditional Muslim dish from Maguindanao is a portable, flavorful meal.",
    region: "Mindanao",
    img: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=800",
    recipe: [
      "4 cups cooked rice, preferably sticky rice",
      "500g chicken or beef, shredded",
      "1 onion, chopped finely",
      "4 cloves garlic, minced",
      "1 thumb-sized ginger, minced",
      "2 tablespoons turmeric powder (for yellow color)",
      "2 tablespoons cooking oil",
      "Salt and pepper to taste",
      "Banana leaves, cut into squares and wilted over flame",
      "For spicy sauce:",
      "5-6 bird's eye chilies",
      "2 tomatoes",
      "1 onion",
      "Salt and calamansi",
      "Sauté garlic, onion, and ginger in oil",
      "Add shredded meat and turmeric powder",
      "Season with salt and pepper, cook until well combined",
      "Place a portion of rice on banana leaf",
      "Top with meat mixture",
      "Fold banana leaf to wrap completely",
      "Steam wrapped pastil for 10-15 minutes",
      "For sauce: grind chilies, tomatoes, and onion together",
      "Season sauce with salt and calamansi juice",
      "Serve pastil with spicy dipping sauce"
    ]
  },
  {
    name: "Pianggang Manok",
    desc: "Grilled chicken in burnt coconut sauce from Tawi-Tawi. This Tausug specialty features a unique smoky flavor from charred coconut mixed with spices.",
    region: "Mindanao",
    img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800",
    recipe: [
      "1 whole chicken, cut into serving pieces",
      "1 coconut, meat extracted",
      "1 thumb-sized ginger, minced",
      "1 thumb-sized turmeric, minced",
      "6 shallots, minced",
      "4 cloves garlic, minced",
      "2 stalks lemongrass, chopped finely",
      "4-5 bird's eye chilies, sliced",
      "3 tablespoons coconut oil",
      "Salt and pepper to taste",
      "Banana leaves for wrapping",
      "Toast half of the coconut meat until dark brown (not completely black)",
      "Grind toasted coconut with some water to make a paste",
      "Grate the remaining coconut and extract coconut cream",
      "Mix burnt coconut paste with ginger, turmeric, shallots, garlic, lemongrass",
      "Marinate chicken in spice mixture for at least 2 hours",
      "Wrap marinated chicken pieces in banana leaves",
      "Grill wrapped chicken over charcoal for 30-40 minutes, turning occasionally",
      "Unwrap and grill directly for crispy skin (optional)",
      "Serve with steamed rice and extra chilies"
    ]
  }
];

/**
 * Main seeder function
 */
async function seedCulturalRecipes() {
  try {
    console.log("🌾 Starting Cultural Recipes Seeder...\n");

    // Connect to MongoDB (using same logic as server)
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

    // Clear existing cultural recipes (optional - comment out if you want to keep existing)
    console.log("🗑️  Clearing existing cultural recipes...");
    await CulturalRecipe.deleteMany({});
    console.log("✅ Existing recipes cleared\n");

    // Insert new recipes
    console.log("📝 Inserting authentic Filipino cultural recipes...\n");

    let luzonCount = 0;
    let visayasCount = 0;
    let mindanaoCount = 0;

    for (const recipe of culturalRecipes) {
      try {
        await CulturalRecipe.create({
          ...recipe,
          isActive: true,
          createdBy: null, // System-generated recipes
        });

        // Count by region
        if (recipe.region === "Luzon") luzonCount++;
        else if (recipe.region === "Visayas") visayasCount++;
        else if (recipe.region === "Mindanao") mindanaoCount++;

        console.log(`  ✓ Added: ${recipe.name} (${recipe.region})`);
      } catch (error) {
        console.error(`  ✗ Failed to add ${recipe.name}:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\n📍 Regional Distribution:`);
    console.log(`   • Luzon: ${luzonCount} recipes`);
    console.log(`   • Visayas: ${visayasCount} recipes`);
    console.log(`   • Mindanao: ${mindanaoCount} recipes`);
    console.log(`   • Total: ${luzonCount + visayasCount + mindanaoCount} recipes\n`);

    // Verify final count
    const finalCount = await CulturalRecipe.countDocuments({ isActive: true });
    console.log(`✅ Database now contains ${finalCount} active cultural recipes`);
    console.log("\n🍽️  Your Cultural Explorer is now ready with authentic Filipino recipes!");
    console.log("🌏 Visit http://localhost:3000/explorer to explore the dishes!\n");

  } catch (error) {
    console.error("\n❌ ERROR during seeding:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("📡 Database connection closed");
    process.exit(0);
  }
}

// Run the seeder
seedCulturalRecipes();
