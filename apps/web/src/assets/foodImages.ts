// ─── Food Image Assets ───────────────────────────────────────────────────────
// Generated food images that serve as fallbacks when menu items have no image.

import foodPizza from './food-pizza.png';
import foodButter from './food-butter-chicken.png';
import foodBurger from './food-burger.png';
import foodSushi from './food-sushi.png';
import foodBiryani from './food-biryani.png';
import foodPasta from './food-pasta.png';
import foodDosa from './food-dosa.png';
import foodNoodles from './food-noodles.png';
import foodDessert from './food-dessert.png';

/** All available local food images */
export const foodImages = {
  pizza:         foodPizza,
  butter:        foodButter,
  burger:        foodBurger,
  sushi:         foodSushi,
  biryani:       foodBiryani,
  pasta:         foodPasta,
  dosa:          foodDosa,
  noodles:       foodNoodles,
  ramen:         foodNoodles,
  dessert:       foodDessert,
  cake:          foodDessert,
  chocolate:     foodDessert,
} as const;

/**
 * Returns a local fallback image path for a menu item based on its name and
 * category. Falls back to a deterministic pick from the full image pool so
 * every menu item always has a visual.
 */
export function getMenuItemImage(
  name: string,
  category?: string,
  remoteImage?: string,
): string {
  // Prefer a real image from the backend
  if (remoteImage) return remoteImage;

  const haystack = `${name} ${category ?? ''}`.toLowerCase();

  // Keyword matching – order matters (most specific first)
  if (/pizza/.test(haystack))                           return foodPizza;
  if (/burger|sandwich|wrap/.test(haystack))           return foodBurger;
  if (/sushi|maki|roll|nigiri/.test(haystack))         return foodSushi;
  if (/biryani|rice|pulao/.test(haystack))             return foodBiryani;
  if (/butter chicken|tikka|curry|masala|paneer|dal/.test(haystack)) return foodButter;
  if (/pasta|spaghetti|carbonara|alfredo|penne/.test(haystack))      return foodPasta;
  if (/dosa|idli|vada|sambar|chutney/.test(haystack))               return foodDosa;
  if (/noodle|ramen|udon|pho|noodles/.test(haystack))               return foodNoodles;
  if (/dessert|cake|chocolate|ice cream|gulab|halwa|kheer|brownie/.test(haystack)) return foodDessert;

  // Category-level fallback
  if (/chinese|asian/.test(haystack))   return foodNoodles;
  if (/italian/.test(haystack))         return foodPasta;
  if (/japanese/.test(haystack))        return foodSushi;
  if (/indian|south indian/.test(haystack)) return foodBiryani;
  if (/american|fast food/.test(haystack))  return foodBurger;

  // Round-robin deterministic fallback using the item name
  const all = [foodPizza, foodBurger, foodSushi, foodBiryani, foodButter, foodPasta, foodDosa, foodNoodles, foodDessert];
  const index = name.charCodeAt(0) % all.length;
  return all[index];
}
