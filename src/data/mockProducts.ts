import type { Category, Product, ProductVariant, VariantStash, StashType } from "@/types/shop";
import { COUNTRIES } from "./locations";

export const CATEGORIES: Category[] = [
  { slug: "gummies", name: { ru: "Жевательное", en: "Gummies" }, emoji: "🍬", gradient: "gradient-grape" },
  { slug: "chocolate", name: { ru: "Шоколад", en: "Chocolate" }, emoji: "🍫", gradient: "gradient-mango" },
  { slug: "cookies", name: { ru: "Печенье", en: "Cookies" }, emoji: "🍪", gradient: "gradient-mango" },
  { slug: "drinks", name: { ru: "Напитки", en: "Drinks" }, emoji: "🥤", gradient: "gradient-mint" },
  { slug: "vapes", name: { ru: "Вейпы", en: "Vapes" }, emoji: "💨", gradient: "gradient-grape" },
];

const buildDemoVariants = (cities: string[], basePrice: number): ProductVariant[] => {
  const countryPriceFactor: Record<string, number> = {
    thailand: 1,
    vietnam: 0.85,
    bali: 1.1,
    kl: 1.2,
  };

  const countriesUsed = new Set<string>();
  const districtsByCity = new Map<string, string[]>();
  for (const country of COUNTRIES) {
    for (const city of country.cities) {
      if (!cities.includes(city.slug)) continue;
      countriesUsed.add(country.slug);
      const ds = (city.districts ?? []).slice(0, 2).map((d) => d.slug);
      districtsByCity.set(city.slug, ds);
    }
  }

  const allDistricts = Array.from(districtsByCity.values()).flat();
  const firstDistricts = Array.from(districtsByCity.values())
    .map((ds) => ds[0])
    .filter(Boolean);

  const types: StashType[] = ["prikop", "klad", "magnit"];
  const grams = [1, 2, 5];
  return grams.map((g, idx) => {
    const pricesByCountry: Record<string, number> = {};
    for (const c of countriesUsed) {
      const factor = countryPriceFactor[c] ?? 1;
      pricesByCountry[c] = Math.round(basePrice * g * factor * (1 - idx * 0.05));
    }
    const districts = g === 1 ? allDistricts : firstDistricts;
    const stashes: VariantStash[] = districts.map((d, i) => ({
      districtSlug: d,
      type: types[i % types.length],
    }));
    return {
      id: `${g}g`,
      grams: g,
      pricesByCountry,
      stashes,
    };
  });
};

const make = (p: Omit<Product, "variants"> & { basePrice?: number }): Product => ({
  ...p,
  variants: buildDemoVariants(p.cities ?? [], p.basePrice ?? 10),
});

export const PRODUCTS: Product[] = [];
