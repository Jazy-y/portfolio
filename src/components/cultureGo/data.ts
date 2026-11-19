/**
 * Data layer of the CultureGo recreation. Like the real app
 * (src/services/mealdb-service.ts in the PFE repository), it loads meals from
 * TheMealDB and enriches them with a price in Tunisian dinars and a rating.
 */

export type Meal = {
  id: string;
  name: string;
  thumb: string;
  price: string;
  rating: number;
  ratingCount: number;
};

export type MealDetail = Meal & {
  category: string;
  area: string;
  ingredients: string[];
  instructions: string;
};

/** Country chips shown on the home screen, mapped to TheMealDB area names. */
export const COUNTRIES: { label: string; area: string }[] = [
  { label: "American", area: "United States" },
  { label: "British", area: "British" },
  { label: "Canadian", area: "Canadian" },
  { label: "Chinese", area: "Chinese" },
  { label: "Italian", area: "Italian" },
  { label: "Japanese", area: "Japanese" },
  { label: "Mexican", area: "Mexican" },
  { label: "Moroccan", area: "Moroccan" },
  { label: "Tunisian", area: "Tunisian" },
  { label: "Thai", area: "Thai" },
];

const API = "https://www.themealdb.com/api/json/v1/1";

/** Deterministic price/rating so every visitor sees the same values. */
function enhance(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const price = 9 + (h % 1600) / 100; // 9.00 – 24.99 DT
  const rating = 4.2 + ((h >> 4) % 8) / 10; // 4.2 – 4.9
  const ratingCount = 40 + ((h >> 8) % 260);
  return { price: `${price.toFixed(2)} DT`, rating: Math.min(4.9, Number(rating.toFixed(1))), ratingCount };
}

/** Offline fallback (same dish as the app screenshots) if TheMealDB is unreachable. */
const FALLBACK: MealDetail = {
  id: "53085",
  name: "15-minute chicken & halloumi burgers",
  thumb: "https://www.themealdb.com/images/media/meals/vdwloy1713225718.jpg",
  ...enhance("53085"),
  category: "Chicken",
  area: "United States",
  ingredients: ["2 Chicken Breasts", "1 tbsp Oil", "4 tbsp Hotsauce", "½ Lemon Juice", "2 Buns", "250g Cheese", "¼ Cabbage", "2 tbsp Mayonnaise"],
  instructions:
    "Put the chicken breasts between two pieces of baking parchment and flatten them with a rolling pin. Brush with oil and hot sauce, then grill with the halloumi until golden. Serve in toasted buns with cabbage slaw and mayonnaise.",
};

const cache = new Map<string, unknown>();

async function getJSON<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`);
  const json = (await res.json()) as T;
  cache.set(url, json);
  return json;
}

type ApiMeal = Record<string, string | null>;

export async function mealsByCountry(area: string): Promise<Meal[]> {
  try {
    const data = await getJSON<{ meals: ApiMeal[] | null }>(`${API}/filter.php?a=${encodeURIComponent(area)}`);
    if (!data.meals?.length) return [FALLBACK];
    return data.meals.slice(0, 12).map((m) => ({
      id: m.idMeal!,
      name: m.strMeal!,
      thumb: m.strMealThumb!,
      ...enhance(m.idMeal!),
    }));
  } catch {
    return [FALLBACK];
  }
}

export async function mealDetail(meal: Meal): Promise<MealDetail> {
  try {
    const data = await getJSON<{ meals: ApiMeal[] | null }>(`${API}/lookup.php?i=${meal.id}`);
    const m = data.meals?.[0];
    if (!m) return { ...FALLBACK, ...meal };
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = m[`strIngredient${i}`]?.trim();
      const measure = m[`strMeasure${i}`]?.trim();
      if (ing) ingredients.push(`${measure ? `${measure} ` : ""}${ing}`);
    }
    return {
      ...meal,
      category: m.strCategory ?? "",
      area: m.strArea ?? "",
      ingredients,
      instructions: (m.strInstructions ?? "").replace(/\r/g, "").replace(/STEP \d+\n*/gi, "").trim(),
    };
  } catch {
    return { ...FALLBACK, ...meal };
  }
}

/** Sample restaurants, as returned by the app's restaurant service in demo mode. */
export const RESTAURANTS = [
  { name: "Bistro Food Bar (Authentic)", rating: 3, reviews: 486, address: "6643 High St St", distance: "2.1 km away" },
  { name: "Golden Cuisine Kitchen (Authentic)", rating: 3, reviews: 82, address: "7663 Mill Rd St", distance: "2.4 km away" },
  { name: "Maison du Goût (Traditional)", rating: 4, reviews: 214, address: "12 Rue de Marseille", distance: "3.0 km away" },
];

/** Sample OCR output used by the translation demo (from the app screenshots). */
export const SAMPLE_TRANSLATION = [
  "Poi Rai (Machha Munda, Demi/Plein)",
  "Poulet Jhola (Half-3PC / Full-5PC)",
  "Poulet Kasa (Half-3PC / Full-5PC)",
  "Rôti de poulet au ghee (Half-3PC / Full-5PC)",
  "Poulet Besara (BL, demi / plein)",
  "Aloo Chingudi Chadchadi (Demi / Plein)",
  "Crevette Masala",
  "Mutton Jhola (Half-PC / Full-5PC)",
  "Mutton Kasa (Half-3PC / Full-5PC)",
];
