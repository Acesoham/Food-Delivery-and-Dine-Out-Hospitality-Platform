/**
 * Dish-name → public asset path mapping.
 * Keys are lowercase dish name substrings for fuzzy matching.
 */
const DISH_IMAGE_MAP: Record<string, string> = {
  // exact / partial name fragments (lowercase)
  'misal pav': '/assets/misal_pav.png',
  'spicy misal': '/assets/misal_pav.png',
  'misal': '/assets/misal_pav.png',
  'paneer butter masala': '/assets/paneer_butter_masala.png',
  'paneer tikka masala': '/assets/paneer_butter_masala.png',
  'paneer chilli': '/assets/paneer_chilli_dry.png',
  'paneer': '/assets/paneer_butter_masala.png',
  'hakka noodles': '/assets/veg_hakka_noodles.png',
  'noodle': '/assets/veg_hakka_noodles.png',
  'manchurian': '/assets/manchurian_gravy.png',
  'chicken manchurian': '/assets/manchurian_gravy.png',
  'schezwan fried rice': '/assets/schezwan_fried_rice.png',
  'fried rice': '/assets/schezwan_fried_rice.png',
  'dal tadka': '/assets/dal_tadka_and_jeera_rice.png',
  'veg thali': '/assets/veg_maharashtrian_thali.png',
  'thali': '/assets/veg_maharashtrian_thali.png',
  'maharashtrian': '/assets/veg_maharashtrian_thali.png',
  'sabudana khichdi': '/assets/sabudana_khichdi.png',
  'kanda bhaji': '/assets/kanda_bhaji.png',
  'kanda poha': '/assets/maharashtrian_snacks_platter.png',
  'snack': '/assets/maharashtrian_snacks_platter.png',
  'margherita pizza': '/assets/margherita_pizza.png',
  'pizza': '/assets/margherita_pizza.png',
  'white sauce pasta': '/assets/white_sauce_pasta.png',
  'pasta alfredo': '/assets/white_sauce_pasta.png',
  'pasta': '/assets/white_sauce_pasta.png',
  'garlic bread': '/assets/cheese_garlic_bread.png',
  'cheese garlic': '/assets/cheese_garlic_bread.png',
  'butter naan': '/assets/butter_naan.png',
  'garlic naan': '/assets/butter_naan.png',
  'naan': '/assets/butter_naan.png',
  'gulab jamun': '/assets/gulab_jamun.png',
  'jalebi': '/assets/gulab_jamun.png',
  'sweet': '/assets/gulab_jamun.png',
  'brownie': '/assets/brownie_with_ice_cream.png',
  'chocolate fondant': '/assets/brownie_with_ice_cream.png',
  'tiramisu': '/assets/classic_tiramisu.png',
  'matcha ice cream': '/assets/brownie_with_ice_cream.png',
  'dessert': '/assets/brownie_with_ice_cream.png',
  'belgian waffle': '/assets/belgian_waffle_chocolate.png',
  'waffle': '/assets/belgian_waffle_chocolate.png',
  'burger': '/assets/loaded_veg_burger.png',
  'loaded fries': '/assets/peri_peri_fries.png',
  'peri peri': '/assets/peri_peri_fries.png',
  'fries': '/assets/peri_peri_fries.png',
  'nachos': '/assets/veg_loaded_nachos.png',
  'cappuccino': '/assets/cold_coffee.png',
  'hazelnut latte': '/assets/cold_coffee.png',
  'cold coffee': '/assets/cold_coffee.png',
  'coffee': '/assets/cold_coffee.png',
  'chocolate shake': '/assets/chocolate_shake.png',
  'milkshake': '/assets/chocolate_shake.png',
  'shake': '/assets/chocolate_shake.png',
  'spring roll': '/assets/kanda_bhaji.png',
  'vada pav': '/assets/maharashtrian_snacks_platter.png',
};

/**
 * Resolves a dish image from a dish name using substring matching.
 */
export function getDishImage(dishName: string): string | undefined {
  const lower = dishName.toLowerCase();
  // Try exact first, then partial
  for (const [key, path] of Object.entries(DISH_IMAGE_MAP)) {
    if (lower.includes(key)) return path;
  }
  return undefined;
}

/**
 * Category → banner image for restaurant cards.
 */
const CATEGORY_BANNER_MAP: Record<string, string> = {
  premium:  '/assets/paneer_butter_masala.png',
  cafe:     '/assets/cold_coffee.png',
  family:   '/assets/veg_maharashtrian_thali.png',
  chinese:  '/assets/veg_hakka_noodles.png',
  local:    '/assets/misal_pav.png',
};

export const premiumDining = [
  "THE TEROTALE",
  "Millionaires Panaromic Rooftop & Exquisite Dining Restaurant",
  "Roof top kitchen & bar Nashik",
  "Arbor Kitchen",
  "The Smoked Vine",
  "HOG - Courtyard by Marriott",
  "Tamara",
  "Amber - Palm Springs Resort",
  "Turmeric",
  "Grape Embassy",
  "Caves County Resort",
  "Desi AA Italiano",
  "Boulangerie Cafe at Express Inn",
  "Brotein Bistro",
  "Spice Route",
  "Barbeque Ville",
  "Divtya Budhlya Wada Restaurant",
  "River Dine Restaurant",
  "Soma Vine Village Restaurant",
  "Sula Vineyards Restaurant",
  "York Winery Restaurant"
];

export const cafes = [
  "Charlies Deck | Best Cafe In Nashik",
  "Oliv- Taste the Calm",
  "D'mora cafe & Bistro",
  "The Breakfast Story Cafe & Bistro",
  "The Kachori Cafe - Nashik",
  "BREW HUB COFFEE",
  "Cafe Nirvana",
  "Cafe Bliss",
  "The Sidewalk",
  "Brewbakes",
  "Tales & Spirits",
  "Le Cafetino",
  "The News Cafe",
  "Mazda Cafe",
  "My Bruschettas",
  "Chai Ketali",
  "Pokket Cafe",
  "Green Bakes Cafe",
  "Jaspers Cafe",
  "Lolo Cafe",
  "Coffee Meets Waffle",
  "Mumbai Streets Cafe",
  "Purohit's Cafe",
  "Damo's Cafe",
  "Eira Bistro and Cafe",
  "Andagram",
  "The Baker's Emporium & Cafe",
  "Friends Bistro",
  "Coffee Club NX",
  "Cafe Katta"
];

export const familyVeg = [
  "The Namastey Nashik – Best Pure Veg Restaurant",
  "Shree Rajbhog Thali, Mumbai Naka",
  "The Five Elements Restaurant",
  "Curry Leaves",
  "Udupi Tadka",
  "Sadhana Restaurant - Chulivarachi Misal",
  "Krishna Vijay",
  "Hotel Panchavati",
  "Maharashtra Darbar",
  "Hotel Rama Heritage",
  "Hotel Yahoo",
  "Hotel City Garden",
  "Spice Garden",
  "Sai Palace",
  "Bamboos Family Restaurant",
  "Garwa Family Restobar",
  "Vithal Kamats",
  "Hotel Sanskruti",
  "Hotel New Punjab",
  "Rasoi Family Restaurant",
  "Aakash Family Restaurant"
];

export const chinese = [
  "Dragon Masala - Best Chinese Restaurant in Nashik",
  "Chinese Wok",
  "Munch Box",
  "Urban Tadka",
  "Asian Wok",
  "Wok Express",
  "China Town",
  "Noodle Bowl",
  "Red Chilli Asian Kitchen"
];

export const localSpots = [
  "Sadhana Misal",
  "Krishna Vijay Misal",
  "Budha Halwai",
  "Samarth Juice Center",
  "Mama's Food Truck",
  "Kaka Ka Dhaba",
  "Bagga Sweets",
  "Sayantara",
  "Shiv Sagar",
  "Om Tea House",
  "Saheba Misal",
  "Shamsundar Misal",
  "Hotel Grape City"
];

export const generateNashikRestaurants = () => {
  const allRestaurants: any[] = [];

  const addRestaurants = (
    names: string[],
    categoryDesc: string,
    cuisineTypes: string[],
    priceRange: number,
    defaultItems: { name: string; description: string; price: number; category: string; tags: string[] }[],
    bannerKey: keyof typeof CATEGORY_BANNER_MAP,
  ) => {
    names.forEach((name) => {
      allRestaurants.push({
        name,
        description: `${categoryDesc} Experience the best at ${name}.`,
        cuisineTypes,
        priceRange,
        coordinates: [73.7898 + (Math.random() * 0.1 - 0.05), 19.9975 + (Math.random() * 0.1 - 0.05)],
        address: { street: 'Main Road', city: 'Nashik', state: 'Maharashtra', zipCode: '422001' },
        // Restaurant banner image
        images: [CATEGORY_BANNER_MAP[bannerKey]],
        items: defaultItems.map(item => ({
          ...item,
          price: item.price + Math.floor(Math.random() * 50),
          // Resolve dish image
          image: getDishImage(item.name),
        })),
      });
    });
  };

  addRestaurants(
    premiumDining,
    'Premium Fine Dining.',
    ['Indian', 'Continental', 'Fine Dining'],
    4,
    [
      { name: 'Truffle Mushroom Risotto', description: 'Creamy Arborio rice with black truffle', price: 650, category: 'Main Course', tags: ['veg', 'premium'] },
      { name: 'Paneer Butter Masala', description: 'Rich and creamy cottage cheese curry', price: 450, category: 'Main Course', tags: ['veg', 'popular'] },
      { name: 'Butter Naan', description: 'Soft flatbread with butter', price: 120, category: 'Breads', tags: ['veg'] },
      { name: 'Chocolate Fondant', description: 'Molten chocolate cake with vanilla ice cream', price: 350, category: 'Desserts', tags: ['veg', 'sweet'] },
      { name: 'Classic Tiramisu', description: 'Italian coffee-flavored layered dessert', price: 300, category: 'Desserts', tags: ['veg'] },
    ],
    'premium',
  );

  addRestaurants(
    cafes,
    'Cozy Cafe & Youth Hangout.',
    ['Cafe', 'Beverages', 'Fast Food'],
    2,
    [
      { name: 'Cappuccino', description: 'Freshly brewed espresso with steamed milk foam', price: 150, category: 'Beverages', tags: ['veg', 'popular'] },
      { name: 'Belgian Waffle Chocolate', description: 'Crispy waffle with warm chocolate sauce', price: 220, category: 'Desserts', tags: ['veg'] },
      { name: 'Peri Peri Fries', description: 'Crispy fries tossed in spicy peri peri seasoning', price: 120, category: 'Snacks', tags: ['veg', 'spicy'] },
      { name: 'Margherita Pizza', description: 'Classic cheese and tomato pizza', price: 250, category: 'Pizza', tags: ['veg'] },
      { name: 'Cold Coffee', description: 'Chilled blended coffee with milk', price: 160, category: 'Beverages', tags: ['veg'] },
    ],
    'cafe',
  );

  addRestaurants(
    familyVeg,
    'Pure Veg Family Restaurant.',
    ['Indian', 'North Indian', 'South Indian', 'Pure Veg'],
    2,
    [
      { name: 'Veg Thali', description: 'Complete meal with roti, dal, sabzi, rice, and sweet', price: 250, category: 'Thali', tags: ['veg', 'popular'] },
      { name: 'Paneer Butter Masala', description: 'Rich and creamy paneer curry', price: 220, category: 'Main Course', tags: ['veg'] },
      { name: 'Dal Tadka and Jeera Rice', description: 'Yellow lentils with cumin-scented rice', price: 180, category: 'Main Course', tags: ['veg'] },
      { name: 'Garlic Naan', description: 'Soft bread with garlic butter', price: 60, category: 'Breads', tags: ['veg'] },
      { name: 'Gulab Jamun', description: 'Sweet milk solid dumplings', price: 60, category: 'Desserts', tags: ['veg', 'sweet'] },
    ],
    'family',
  );

  addRestaurants(
    chinese,
    'Authentic Chinese & Asian Fusion.',
    ['Chinese', 'Asian', 'Thai'],
    2,
    [
      { name: 'Veg Hakka Noodles', description: 'Wok-tossed noodles with fresh vegetables', price: 180, category: 'Noodles', tags: ['veg', 'popular'] },
      { name: 'Chicken Manchurian', description: 'Crispy chicken in spicy manchurian gravy', price: 240, category: 'Starters', tags: ['non-veg', 'spicy'] },
      { name: 'Paneer Chilli Dry', description: 'Crispy paneer tossed in Indo-Chinese sauces', price: 200, category: 'Starters', tags: ['veg'] },
      { name: 'Schezwan Fried Rice', description: 'Spicy wok-tossed rice with schezwan sauce', price: 200, category: 'Rice', tags: ['veg', 'spicy'] },
      { name: 'White Sauce Pasta', description: 'Creamy bechamel pasta with herbs', price: 180, category: 'Pasta', tags: ['veg'] },
    ],
    'chinese',
  );

  addRestaurants(
    localSpots,
    'Famous Local Food Spots of Nashik.',
    ['Street Food', 'Maharashtrian', 'Snacks'],
    1,
    [
      { name: 'Spicy Misal Pav', description: 'Authentic Nashik style misal with 2 pavs', price: 90, category: 'Snacks', tags: ['veg', 'spicy', 'popular'] },
      { name: 'Kanda Bhaji', description: 'Crispy onion fritters, a Nashik street favourite', price: 60, category: 'Snacks', tags: ['veg'] },
      { name: 'Sabudana Khichdi', description: 'Tapioca pearls cooked with peanuts and green chilli', price: 70, category: 'Breakfast', tags: ['veg'] },
      { name: 'Maharashtrian Snacks Platter', description: 'Assorted local snacks – chivda, chakli, shev', price: 120, category: 'Snacks', tags: ['veg'] },
      { name: 'Gulab Jamun', description: 'Soft milk-solid dumplings soaked in sugar syrup', price: 50, category: 'Desserts', tags: ['veg', 'sweet'] },
    ],
    'local',
  );

  return allRestaurants;
};
