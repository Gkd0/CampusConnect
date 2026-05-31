
-- Enums
create type public.listing_type as enum ('item', 'skill');
create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair', 'poor');
create type public.listing_status as enum ('active', 'sold', 'closed');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  major text,
  year_of_study text,
  avatar_url text,
  bio text,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.listing_type not null,
  category text not null,
  condition public.listing_condition,
  title text not null,
  description text not null default '',
  price_cents int,
  price_label text not null default 'Free',
  tags text[] not null default '{}',
  images text[] not null default '{}',
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_user_id_idx on public.listings(user_id);
create index listings_type_idx on public.listings(type);
create index listings_category_idx on public.listings(category);
create index listings_created_at_idx on public.listings(created_at desc);

grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;

alter table public.listings enable row level security;
create policy "Listings are viewable by everyone"
  on public.listings for select using (true);
create policy "Users can insert their own listings"
  on public.listings for insert with check (auth.uid() = user_id);
create policy "Users can update their own listings"
  on public.listings for update using (auth.uid() = user_id);
create policy "Users can delete their own listings"
  on public.listings for delete using (auth.uid() = user_id);

-- favorites
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

alter table public.favorites enable row level security;
create policy "Users can view their own favorites"
  on public.favorites for select using (auth.uid() = user_id);
create policy "Users can add their own favorites"
  on public.favorites for insert with check (auth.uid() = user_id);
create policy "Users can remove their own favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
create index conversations_buyer_idx on public.conversations(buyer_id);
create index conversations_seller_idx on public.conversations(seller_id);

grant select, insert, update on public.conversations to authenticated;
grant all on public.conversations to service_role;

alter table public.conversations enable row level security;
create policy "Participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers can create conversations"
  on public.conversations for insert
  with check (auth.uid() = buyer_id);
create policy "Participants can update conversation"
  on public.conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages(conversation_id, created_at);

grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;

alter table public.messages enable row level security;

create or replace function public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = _conversation_id
      and (c.buyer_id = _user_id or c.seller_id = _user_id)
  )
$$;

create policy "Participants can read messages"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id, auth.uid()));
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_conversation_participant(conversation_id, auth.uid())
  );

-- Update conversation last_message_at on new message
create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_last_message();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username',
             split_part(new.email, '@', 1),
             'user'),
    '[^a-z0-9_]+', '', 'g'
  ));
  if base_username = '' then base_username := 'user'; end if;
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, full_name, major, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'full_name', candidate),
    new.raw_user_meta_data->>'major',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
