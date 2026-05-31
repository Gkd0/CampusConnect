import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("conversations")
      .select("id, listing_id, buyer_id, seller_id, last_message_at, created_at, listings:listings!conversations_listing_id_fkey(id, title, images, price_label), buyer:profiles!conversations_buyer_id_fkey(id, username, full_name, avatar_url), seller:profiles!conversations_seller_id_fkey(id, username, full_name, avatar_url)")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { conversations: data ?? [], userId };
  });

export const openConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ listing_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: listing, error: lErr } = await supabaseAdmin
      .from("listings")
      .select("id, user_id")
      .eq("id", data.listing_id)
      .maybeSingle();
    if (lErr) throw new Error(lErr.message);
    if (!listing) throw new Error("Listing not found");
    if (listing.user_id === userId) {
      throw new Error("You can't message yourself");
    }

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", data.listing_id)
      .eq("buyer_id", userId)
      .maybeSingle();

    if (existing) return { id: existing.id };

    const { data: row, error } = await supabase
      .from("conversations")
      .insert({
        listing_id: data.listing_id,
        buyer_id: userId,
        seller_id: listing.user_id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: convo, error } = await supabase
      .from("conversations")
      .select("id, listing_id, buyer_id, seller_id, listings:listings!conversations_listing_id_fkey(id, title, images, price_label), buyer:profiles!conversations_buyer_id_fkey(id, username, full_name, avatar_url), seller:profiles!conversations_seller_id_fkey(id, username, full_name, avatar_url)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!convo) throw new Error("Conversation not found");
    return convo;
  });

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ conversation_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .eq("conversation_id", data.conversation_id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        conversation_id: z.string().uuid(),
        body: z.string().trim().min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversation_id,
        sender_id: userId,
        body: data.body,
      })
      .select("id, conversation_id, sender_id, body, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
