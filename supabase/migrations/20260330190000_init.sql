-- Ticket das Vaquejadas (Supabase) - Initial schema

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'organizer', 'admin');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Organizers (linked to a user)
create table if not exists public.organizers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  document text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_organizers_updated_at on public.organizers;
create trigger set_organizers_updated_at
before update on public.organizers
for each row execute function public.set_updated_at();

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete restrict,
  slug text not null unique,
  title text not null,
  description text not null,
  start_date date not null,
  end_date date,
  city text not null,
  state text not null,
  venue_name text,
  address text,
  cover_image_url text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_organizer_id_idx on public.events (organizer_id);
create index if not exists events_start_date_idx on public.events (start_date);

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- Event images
create table if not exists public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_images_event_id_idx on public.event_images (event_id);

-- Ticket types / lots
create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  quantity_total int not null check (quantity_total >= 0),
  quantity_sold int not null default 0 check (quantity_sold >= 0),
  is_active boolean not null default true,
  sales_start timestamptz,
  sales_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ticket_types_event_id_idx on public.ticket_types (event_id);

drop trigger if exists set_ticket_types_updated_at on public.ticket_types;
create trigger set_ticket_types_updated_at
before update on public.ticket_types
for each row execute function public.set_updated_at();

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_id uuid not null references public.events(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled')),
  total_cents int not null check (total_cents >= 0),
  currency text not null default 'BRL',
  buyer_name text,
  buyer_email text,
  buyer_document text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_event_id_idx on public.orders (event_id);
create index if not exists orders_created_at_idx on public.orders (created_at);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  name text not null,
  quantity int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_ticket_type_id_idx on public.order_items (ticket_type_id);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  status text not null default 'pending',
  pix_qr_code text,
  pix_qr_code_base64 text,
  pix_copy_paste text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_provider_payment_id_ux on public.payments (provider_payment_id) where provider_payment_id is not null;
create index if not exists payments_order_id_idx on public.payments (order_id);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- Tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete restrict,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  code text not null unique,
  qr_payload text not null,
  status text not null default 'active' check (status in ('active', 'used', 'canceled')),
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tickets_order_id_idx on public.tickets (order_id);
create index if not exists tickets_event_id_idx on public.tickets (event_id);

-- Check-ins
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.tickets(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  checked_in_by uuid references auth.users(id) on delete set null,
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists checkins_event_id_idx on public.checkins (event_id);

-- Auth trigger: create a profile row automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS (mínimo viável)
alter table public.profiles enable row level security;
alter table public.organizers enable row level security;
alter table public.events enable row level security;
alter table public.event_images enable row level security;
alter table public.ticket_types enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.tickets enable row level security;
alter table public.checkins enable row level security;

-- Profiles: only owner can read/update
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (auth.uid() = id);

-- Organizers: only owner can read
drop policy if exists organizers_select_own on public.organizers;
create policy organizers_select_own on public.organizers
for select using (auth.uid() = user_id);

-- Events: public can read published
drop policy if exists events_select_published on public.events;
create policy events_select_published on public.events
for select using (status = 'published');

-- Event images: public can read images of published events
drop policy if exists event_images_select_published on public.event_images;
create policy event_images_select_published on public.event_images
for select using (
  exists (
    select 1 from public.events e
    where e.id = event_images.event_id and e.status = 'published'
  )
);

-- Ticket types: public can read active types of published events
drop policy if exists ticket_types_select_public on public.ticket_types;
create policy ticket_types_select_public on public.ticket_types
for select using (
  is_active
  and exists (
    select 1 from public.events e
    where e.id = ticket_types.event_id and e.status = 'published'
  )
);

-- Orders: user can read own orders
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
for select using (auth.uid() = user_id);

-- Order items: user can read items of own orders
drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  )
);

-- Tickets: user can read own tickets
drop policy if exists tickets_select_own on public.tickets;
create policy tickets_select_own on public.tickets
for select using (auth.uid() = user_id);

