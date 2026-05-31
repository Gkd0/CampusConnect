import { Link } from "@tanstack/react-router";
import { Heart, MessageSquare, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type ListingCardData = {
  id: string;
  type: "item" | "skill";
  category: string;
  condition: string | null;
  title: string;
  price_label: string;
  tags: string[];
  images: string[];
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    major: string | null;
  } | null;
};

export function ListingCard({
  listing,
  favorited,
  onToggleFavorite,
}: {
  listing: ListingCardData;
  favorited?: boolean;
  onToggleFavorite?: (id: string, next: boolean) => void;
}) {
  const seller = listing.profiles;
  const initials = (seller?.full_name ?? seller?.username ?? "U").slice(0, 2).toUpperCase();
  const cover = listing.images?.[0];

  return (
    <Card className="group relative flex flex-col overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-all hover:border-primary/50 hover:glow-primary">
      <Link
        to="/listings/$listingId"
        params={{ listingId: listing.id }}
        className="block aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary"
      >
        {cover ? (
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <span className="font-display text-5xl font-bold opacity-20">
              {listing.type === "skill" ? "✦" : "◆"}
            </span>
          </div>
        )}
      </Link>

      {onToggleFavorite && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={favorited ? "Remove from saved" : "Save listing"}
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(listing.id, !favorited);
          }}
          className="absolute right-3 top-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur hover:bg-background"
        >
          <Heart className={`h-4 w-4 ${favorited ? "fill-destructive text-destructive" : ""}`} />
        </Button>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-xs text-primary">
            {listing.type === "skill" ? "Skill" : listing.category}
          </Badge>
          <span className="font-display text-base font-bold text-foreground">
            {listing.price_label}
          </span>
        </div>

        <Link
          to="/listings/$listingId"
          params={{ listingId: listing.id }}
          className="line-clamp-2 font-display text-lg font-semibold leading-tight hover:text-primary"
        >
          {listing.title}
        </Link>

        {listing.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                <Tag className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          {seller ? (
            <Link
              to="/profile/$username"
              params={{ username: seller.username }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Avatar className="h-6 w-6">
                {seller.avatar_url && <AvatarImage src={seller.avatar_url} />}
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <span className="truncate">{seller.full_name ?? `@${seller.username}`}</span>
            </Link>
          ) : (
            <span />
          )}
          <Link
            to="/listings/$listingId"
            params={{ listingId: listing.id }}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <MessageSquare className="h-3 w-3" /> View
          </Link>
        </div>
      </div>
    </Card>
  );
}
