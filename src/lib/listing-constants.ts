export const ITEM_CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Hostel & PG Essentials",
  "Furniture",
  "Clothing",
  "Cycles & Transport",
  "Lab & Stationery",
  "Other",
] as const;

export const SKILL_CATEGORIES = [
  "Tutoring",
  "JEE/NEET/GATE Prep",
  "Coding Help",
  "Design",
  "Writing & Editing",
  "Music & Audio",
  "Fitness",
  "Languages",
  "Other",
] as const;

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
] as const;

export type ListingType = "item" | "skill";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPriceLabel(input: {
  priceCents: number | null;
  freeOrTrade: "price" | "free" | "trade" | "swap";
  type: ListingType;
}): string {
  if (input.freeOrTrade === "free") return "Free";
  if (input.freeOrTrade === "trade") return "Trade";
  if (input.freeOrTrade === "swap") return "Skill swap";
  if (input.priceCents == null) return input.type === "skill" ? "Skill swap" : "Free";
  // price_cents stores paise (1 INR = 100 paise)
  return INR.format(input.priceCents / 100);
}
