import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listFavorites, toggleFavorite } from "@/lib/favorites.functions";
import { ListingCard, type ListingCardData } from "@/components/listing-card";

export const Route = createFileRoute("/_authenticated/watchlist")({
  head: () => ({ meta: [{ title: "Saved — CampusConnect" }] }),
  component: Watchlist,
});

function Watchlist() {
  const fetchFavs = useServerFn(listFavorites);
  const toggle = useServerFn(toggleFavorite);
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({ queryKey: ["favorites"], queryFn: () => fetchFavs() });
  const mut = useMutation({
    mutationFn: (id: string) => toggle({ data: { listing_id: id, favorited: false } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["favIds"] });
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Saved listings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Items and skills you've bookmarked.</p>

      <div className="mt-8">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-card/40" />
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-16 text-center">
            <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-semibold">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any listing to keep it here.</p>
            <Button asChild className="mt-4 gradient-primary text-primary-foreground hover:opacity-90">
              <Link to="/dashboard">Browse the feed</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((f: any) =>
              f.listings ? (
                <ListingCard
                  key={f.listing_id}
                  listing={f.listings as ListingCardData}
                  favorited
                  onToggleFavorite={(id) => mut.mutate(id)}
                />
              ) : null
            )}
          </div>
        )}
      </div>
    </main>
  );
}
