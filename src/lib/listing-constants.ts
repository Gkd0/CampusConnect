export const ITEM_CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Furniture",
  "Clothing",
  "Bikes & Transport",
  "Dorm & Home",
  "Other",
] as const;

export const SKILL_CATEGORIES = [
  "Tutoring",
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

export function formatPriceLabel(input: {
  priceCents: number | null;
  freeOrTrade: "price" | "free" | "trade" | "swap";
  type: ListingType;
}): string {
  if (input.freeOrTrade === "free") return "Free";
  if (input.freeOrTrade === "trade") return "Trade";
  if (input.freeOrTrade === "swap") return "Skill swap";
  if (input.priceCents == null) return input.type === "skill" ? "Skill swap" : "Free";
  return `$${(input.priceCents / 100).toFixed(input.priceCents % 100 === 0 ? 0 : 2)}`;
}
