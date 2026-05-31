import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { listListingsByUsername } from "@/lib/listings.functions";
import { ListingCard, type ListingCardData } from "@/components/listing-card";

export const Route = createFileRoute("/profile/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const fn = useServerFn(listListingsByUsername);
  const { data, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fn({ data: { username } }),
  });

  if (isLoading || !data) {
    return <div className="mx-auto max-w-4xl p-8"><div className="h-40 animate-pulse rounded-xl bg-card/40" /></div>;
  }

  const { profile, listings } = data;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="text-xl">{(profile.full_name ?? profile.username).slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{profile.full_name ?? `@${profile.username}`}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username} · {profile.major ?? "Student"}{profile.year_of_study ? ` · ${profile.year_of_study}` : ""}</p>
            <div className="mt-2 inline-flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{Number(profile.rating_avg ?? 0).toFixed(1)}</span>
              <span className="text-muted-foreground">({profile.rating_count} reviews)</span>
            </div>
            {profile.bio && <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>}
          </div>
        </div>
      </Card>

      <h2 className="mt-8 font-display text-xl font-bold">Listings</h2>
      <div className="mt-4">
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l: any) => (
              <ListingCard key={l.id} listing={{ ...l, profiles: profile } as ListingCardData} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
