export const DEFAULT_FOOD_IMAGES = [
  'photo-1504674900247-0877df9cc836',
  'photo-1555939594-58d7cb561ad1',
  'photo-1517248135467-4c7edcad34c4',
  'photo-1552566626-52f8b828add9',
  'photo-1414235077428-338989a2e8c0',
  'photo-1550966871-3ed3cdb5ed0c',
  'photo-1544148103-0773bf10d330',
  'photo-1565299624946-b28f40a0ae38',
  'photo-1565958011703-44f9829ba187',
  'photo-1476224203421-9ac39bcb3327',
  'photo-1493770348161-369560ae357d',
  'photo-1482049016688-2d3e1b311543',
  'photo-1484723091791-c0e7e53c979a',
  'photo-1564834724105-918b73d1b9e0',
  'photo-1534080564583-6be75777b70a',
];

export const getRestaurantImage = (id: string, width: number, height: number) => {
  // Simple hash of the ID to get a consistent image for a given restaurant
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % DEFAULT_FOOD_IMAGES.length;
  const imageId = DEFAULT_FOOD_IMAGES[index];
  
  return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
};

/**
 * Resolves an image URL to one that works in the current environment.
 *
 * Problem: Images were previously stored in MongoDB with a hardcoded absolute
 * URL (e.g. http://52.66.123.200/api/v1/images/<id>).  When the app is served
 * over HTTPS on a different domain the browser blocks these as mixed-content.
 *
 * Solution: Extract just the image <id> from any stored URL and rebuild the
 * path using the VITE_API_URL env var (or the default relative /api/v1 path
 * which nginx proxies to the API container).  This works whether the stored
 * URL is:
 *   • http://52.66.123.200/api/v1/images/<id>   (old hardcoded IP)
 *   • http://localhost:5000/api/v1/images/<id>   (local dev)
 *   • /api/v1/images/<id>                        (new relative path)
 *   • https://foodhub.dedyn.io/api/v1/images/<id> (new absolute)
 */
export const resolveImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;

  const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

  // Any URL that contains our image serve path — rewrite via current API_BASE
  if (url.includes('/api/v1/images/')) {
    const id = url.split('/api/v1/images/')[1];
    return `${API_BASE}/images/${id}`;
  }

  // All other URLs (Unsplash, picsum, external CDN, etc.) — pass through as-is
  return url;
};
