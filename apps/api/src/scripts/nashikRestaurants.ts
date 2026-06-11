/**
 * nashikRestaurants.ts
 * ─────────────────────
 * Dish-image and category-banner helpers used by seed tooling.
 * The fake restaurant lists have been removed — only real registered
 * restaurants should appear in the platform.
 */

/**
 * Dish-name → public asset path mapping.
 * Keys are lowercase dish name substrings for fuzzy matching.
 */
const DISH_IMAGE_MAP: Record<string, string> = {
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
  for (const [key, path] of Object.entries(DISH_IMAGE_MAP)) {
    if (lower.includes(key)) return path;
  }
  return undefined;
}

/**
 * Returns an empty array — fake restaurant seeding has been disabled.
 * Only restaurants registered by real users through the app are shown.
 */
export const generateNashikRestaurants = (): any[] => [];
