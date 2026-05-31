import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getConversation, listMessages, sendMessage } from "@/lib/chat.functions";
import { useAuthSession } from "@/hooks/use-auth-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
  component: ChatThread,
});

function ChatThread() {
  const { conversationId } = Route.useParams();
  const { user } = useAuthSession();
  const getC = useServerFn(getConversation);
  const getM = useServerFn(listMessages);
  const send = useServerFn(sendMessage);
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: convo } = useQuery({
    queryKey: ["convo", conversationId],
    queryFn: () => getC({ data: { id: conversationId } }),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getM({ data: { conversation_id: conversationId } }),
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    await send({ data: { conversation_id: conversationId, body } });
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
  };

  const other = convo ? (convo.buyer_id === user?.id ? (convo as any).seller : (convo as any).buyer) : null;

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 py-3">
        <Button asChild variant="ghost" size="icon" className="md:hidden">
          <Link to="/chat"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        {other && (
          <>
            <Avatar className="h-9 w-9">
              {other.avatar_url && <AvatarImage src={other.avatar_url} />}
              <AvatarFallback>{(other.full_name ?? other.username).slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold">{other.full_name ?? `@${other.username}`}</p>
              {convo?.listings && (
                <Link to="/listings/$listingId" params={{ listingId: (convo as any).listings.id }} className="truncate text-xs text-primary hover:underline">
                  {(convo as any).listings.title} · {(convo as any).listings.price_label}
                </Link>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Say hi 👋</p>
        ) : messages.map((m: any) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                mine ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                {m.body}
                <div className={`mt-1 text-[10px] opacity-70 ${mine ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border/60 py-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
        <Button type="submit" disabled={!text.trim()} className="gradient-primary text-primary-foreground hover:opacity-90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </main>
  );
}
