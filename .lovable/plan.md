# CampusConnect — Build Plan

A peer-to-peer marketplace and skill-share platform for college students. Dark-first, modern, minimalist tech aesthetic using **Midnight Indigo** (deep navy + electric indigo accents) with **Syne / Plus Jakarta Sans** typography.

## Tech stack
- React + TanStack Start (already scaffolded), Tailwind CSS, Lucide icons
- Lovable Cloud (Supabase) for auth, database, and realtime chat
- Email/password + Google sign-in
- Dark mode toggle (default dark)

## Design system
- Palette: `#0a0a1a` background, `#141432` surfaces, `#1e1e5a` elevated, `#4f46e5` primary accent
- Fonts: Syne (headings, display), Plus Jakarta Sans (body)
- Tokens in `src/styles.css` (oklch), shadcn components themed via semantic tokens
- Subtle borders, soft glow on primary, generous spacing, rounded-xl cards

## Database schema (Lovable Cloud)

```text
profiles
  id (uuid, FK auth.users)        full_name
  username (unique)                major
  avatar_url                       year_of_study
  bio                              rating_avg (numeric, default 0)
  rating_count (int, default 0)

listings
  id (uuid)                        user_id (FK profiles)
  type (enum: item | skill)        title
  category (enum)                  description
  condition (enum, nullable)       price_cents (int, nullable)
  price_label (text)  -- "Free", "Trade", "$25", "Skill swap"
  tags (text[])                    images (text[], optional)
  status (enum: active|sold|closed) created_at

favorites
  user_id + listing_id (composite PK), created_at

conversations
  id, listing_id, buyer_id, seller_id, last_message_at
  unique(listing_id, buyer_id)

messages
  id, conversation_id, sender_id, body, created_at
```

RLS on every table; `profiles` auto-created via trigger on signup. Realtime enabled on `messages` and `conversations`.

## Routes

```text
/                       Landing (hero + featured listings, CTA to sign up)
/login                  Email/password + Google
/signup
/_authenticated/
  dashboard             Feed: filter by type/category/condition, search, sort
  listings/$id          Listing detail + "Message seller" + favorite toggle
  listings/new          Multi-step creator (type → details → price/tags → review)
  watchlist             Saved listings grid
  chat                  Conversation list + active thread (realtime)
  chat/$conversationId  Deep link to a thread
  profile/$username     Public profile: listings, rating, major
  settings              Edit own profile, theme toggle
```

## Feature breakdown

**Auth & profiles**
- Email/password + Google via Lovable broker
- `_authenticated` layout guards protected routes
- Trigger creates `profiles` row on signup; settings page edits major/bio/avatar
- Public profile shows listings + aggregate rating

**Dashboard / feed**
- Server fn returns paginated listings with filters (type, category, condition, price range, search)
- Card grid with image, title, price chip, seller mini-card, favorite heart
- Sticky filter sidebar on desktop, sheet on mobile

**Listing creator (multi-step)**
- Step 1: Item vs Skill
- Step 2: Title, category, condition (items only), description
- Step 3: Price input or Free/Trade/Skill-swap toggle, tags input
- Step 4: Review + publish
- Progress indicator, back/next, draft kept in component state

**Chat (realtime)**
- "Message seller" on listing creates/opens a conversation
- Split view: conversation list left, thread right (mobile stacks)
- Supabase realtime subscription on `messages` for the active conversation
- Optimistic send, auto-scroll, timestamps

**Watchlist**
- Heart toggle on any listing card writes to `favorites`
- `/watchlist` shows saved listings; empty state with CTA

**Theme**
- Dark default; toggle in header persists to localStorage and `<html class="dark">`

## Implementation order
1. Enable Lovable Cloud, run schema migration with RLS + grants + signup trigger + realtime
2. Design tokens, fonts, theme toggle, app shell (header + nav)
3. Auth pages + `_authenticated` guard + profile bootstrap
4. Listings: server fns (list/get/create), dashboard feed, detail page, creator wizard
5. Favorites toggle + watchlist page
6. Chat: conversations, thread view, realtime subscription
7. Public profile page + ratings display (read-only for v1)
8. Responsive polish + empty states + landing page

## Out of scope (v1)
- Actual payments (price is display only)
- Image uploads (use URL field or placeholder; can add Supabase Storage later)
- Leaving ratings (display only; can be added in v2)
- Push notifications

Ready to build on approval.