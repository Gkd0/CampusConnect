import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { listConversations } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [{ title: "Chat — CampusConnect" }] }),
  component: ChatIndex,
});

function ChatIndex() {
  const fetchConvos = useServerFn(listConversations);
  const { data, isLoading } = useQuery({ queryKey: ["conversations"], queryFn: () => fetchConvos() });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">All your conversations in one place.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
        {isLoading ? (
          <div className="h-40 animate-pulse" />
        ) : !data || data.conversations.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-semibold">No messages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start a chat from any listing you're interested in.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.conversations.map((c: any) => {
              const other = c.buyer_id === data.userId ? c.seller : c.buyer;
              return (
                <li key={c.id}>
                  <Link to="/chat/$conversationId" params={{ conversationId: c.id }} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40">
                    <Avatar className="h-10 w-10">
                      {other?.avatar_url && <AvatarImage src={other.avatar_url} />}
                      <AvatarFallback>{(other?.full_name ?? other?.username ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{other?.full_name ?? `@${other?.username}`}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.listings?.title ?? "Listing"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(c.last_message_at).toLocaleDateString()}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
