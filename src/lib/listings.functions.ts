import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const filterSchema = z.object({
  type: z.enum(["all", "item", "skill"]).default("all"),
  category: z.string().nullable().optional(),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).nullable().optional(),
  search: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(48),
});

export const listListings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => filterSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("listings")
      .select("id, type, category, condition, title, description, price_label, price_cents, tags, images, status, created_at, user_id, profiles:profiles!listings_user_id_fkey(id, username, full_name, avatar_url, major)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.type !== "all") q = q.eq("type", data.type);
    if (data.category) q = q.eq("category", data.category);
    if (data.condition) q = q.eq("condition", data.condition);
    if (data.search && data.search.trim()) {
      const term = data.search.trim().replace(/[%,]/g, "");
      q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getListing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("listings")
      .select("*, profiles:profiles!listings_user_id_fkey(id, username, full_name, avatar_url, major, year_of_study, rating_avg, rating_count, bio)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Listing not found");
    return row;
  });

const createSchema = z.object({
  type: z.enum(["item", "skill"]),
  category: z.string().min(1).max(60),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).nullable(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(4000).default(""),
  price_cents: z.number().int().min(0).max(10_000_000).nullable(),
  price_label: z.string().trim().min(1).max(40),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  images: z.array(z.string().url()).max(6).default([]),
});

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("listings")
      .insert({ ...data, user_id: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listListingsByUsername = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ username: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("username", data.username)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Profile not found");

    const { data: listings, error: lErr } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    if (lErr) throw new Error(lErr.message);

    return { profile, listings: listings ?? [] };
  });
