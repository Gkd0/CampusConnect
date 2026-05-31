import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, MessageSquare, Tag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getListing } from "@/lib/listings.functions";
import { listFavoriteIds, toggleFavorite } from "@/lib/favorites.functions";
import { openConversation } from "@/lib/chat.functions";
import { useAuthSession } from "@/hooks/use-auth-session";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/listings/$listingId")({
  component: ListingDetail,
});

function ListingDetail() {
  const { listingId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const get = useServerFn(getListing);
  const favs = useServerFn(listFavoriteIds);
  const toggle = useServerFn(toggleFavorite);
  const openConvo = useServerFn(openConversation);
  const qc = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => get({ data: { id: listingId } }),
  });
  const { data: favIds = [] } = useQuery({ queryKey: ["favIds"], queryFn: () => favs() });

  const favMutation = useMutation({
    mutationFn: (next: boolean) => toggle({ data: { listing_id: listingId, favorited: next } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favIds"] }),
  });

  const message = useMutation({
    mutationFn: () => openConvo({ data: { listing_id: listingId } }),
    onSuccess: (res) => navigate({ to: "/chat/$conversationId", params: { conversationId: res.id } }),
    onError: (e: any) => toast.error(e.message ?? "Could not open chat"),
  });

  if (isLoading || !listing) {
    return <div className="mx-auto max-w-4xl p-8"><div className="h-96 animate-pulse rounded-xl bg-card/40" /></div>;
  }

  const fav = favIds.includes(listing.id);
  const seller = (listing as any).profiles;
  const cover = (listing.images as string[])?.[0];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary">
          {cover ? (
            <img src={cover} alt={listing.title} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="grid aspect-[4/3] w-full place-items-center">
              <span className="font-display text-8xl font-bold opacity-20">
                {listing.type === "skill" ? "✦" : "◆"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-primary">
              {listing.type === "skill" ? "Skill" : listing.category}
            </Badge>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{listing.title}</h1>
            <p className="mt-2 font-display text-2xl text-gradient-primary">{listing.price_label}</p>
          </div>

          {listing.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
          )}

          {(listing.tags as string[])?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(listing.tags as string[]).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" /> {t}
                </span>
              ))}
            </div>
          )}

          {seller && (
            <Card className="border-border/60 bg-card/60 p-4 backdrop-blur">
              <Link to="/profile/$username" params={{ username: seller.username }} className="flex items-center gap-3">
                <Avatar>
                  {seller.avatar_url && <AvatarImage src={seller.avatar_url} />}
                  <AvatarFallback>{(seller.full_name ?? seller.username).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-display font-semibold">{seller.full_name ?? `@${seller.username}`}</p>
                  <p className="truncate text-xs text-muted-foreground">{seller.major ?? "Student"} · ★ {Number(seller.rating_avg ?? 0).toFixed(1)}</p>
                </div>
              </Link>
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={() => message.mutate()} disabled={message.isPending} className="flex-1 gradient-primary text-primary-foreground hover:opacity-90">
              <MessageSquare className="h-4 w-4" /> Message seller
            </Button>
            <Button variant="outline" size="icon" onClick={() => favMutation.mutate(!fav)} aria-label="Save">
              <Heart className={`h-4 w-4 ${fav ? "fill-destructive text-destructive" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
