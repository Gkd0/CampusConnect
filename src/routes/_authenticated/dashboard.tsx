import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { listListings } from "@/lib/listings.functions";
import { listFavoriteIds, toggleFavorite } from "@/lib/favorites.functions";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ITEM_CATEGORIES, SKILL_CATEGORIES, CONDITIONS } from "@/lib/listing-constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Feed — CampusConnect" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fetchListings = useServerFn(listListings);
  const fetchFavs = useServerFn(listFavoriteIds);
  const toggleFn = useServerFn(toggleFavorite);
  const qc = useQueryClient();

  const [type, setType] = useState<"all" | "item" | "skill">("all");
  const [category, setCategory] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", type, category, condition, search],
    queryFn: () =>
      fetchListings({
        data: {
          type,
          category: category || null,
          condition: (condition || null) as any,
          search: search || null,
          limit: 48,
        },
      }),
  });
  const { data: favIds = [] } = useQuery({ queryKey: ["favIds"], queryFn: () => fetchFavs() });

  const favMutation = useMutation({
    mutationFn: (v: { id: string; next: boolean }) =>
      toggleFn({ data: { listing_id: v.id, favorited: v.next } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favIds"] }),
  });

  const cats = type === "skill" ? SKILL_CATEGORIES : type === "item" ? ITEM_CATEGORIES : [...ITEM_CATEGORIES, ...SKILL_CATEGORIES];
  const favSet = new Set(favIds);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">The feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fresh items and skill swaps from your campus.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, descriptions…"
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={(v) => { setType(v as any); setCategory(""); }}>
          <SelectTrigger className="w-[130px]"><SlidersHorizontal className="h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="item">Items</SelectItem>
            <SelectItem value="skill">Skills</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category || "__all"} onValueChange={(v) => setCategory(v === "__all" ? "" : v)}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All categories</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {type !== "skill" && (
          <Select value={condition || "__all"} onValueChange={(v) => setCondition(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Any condition</SelectItem>
              {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {(category || condition || search || type !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setType("all"); setCategory(""); setCondition(""); setSearch(""); }}>
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl border border-border/60 bg-card/40" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-16 text-center">
          <p className="font-display text-lg font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or be the first to post.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((l: any) => (
            <ListingCard
              key={l.id}
              listing={l as ListingCardData}
              favorited={favSet.has(l.id)}
              onToggleFavorite={(id, next) => favMutation.mutate({ id, next })}
            />
          ))}
        </div>
      )}
    </main>
  );
}
