-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Coffees table
create table if not exists public.coffees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  supplier text,
  origin text,
  process text,
  roast_level text check (roast_level in ('light', 'medium-light', 'medium', 'medium-dark', 'dark')),
  flavor_notes text[] default '{}',
  weight_grams integer not null default 250,
  remaining_grams integer not null default 250,
  roast_date date not null,
  purchase_date date,
  rest_days integer not null default 7,
  peak_end_days integer not null default 30,
  status text not null default 'active' check (status in ('active', 'finished', 'on_order')),
  color text not null default '#E8A87C',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Brews table (completed brews log)
create table if not exists public.brews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  coffee_id uuid references public.coffees(id) on delete cascade not null,
  brew_date date not null default current_date,
  grams_used integer not null default 20,
  rating integer check (rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

-- Brew schedule table (planned brews)
create table if not exists public.brew_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  coffee_id uuid references public.coffees(id) on delete cascade not null,
  scheduled_date date not null,
  brew_index integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- User settings table
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  brews_per_day integer not null default 2,
  brew_size_grams integer not null default 20,
  low_stock_threshold_brews integer not null default 3,
  notify_low_stock boolean not null default true,
  notify_ready_to_drink boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.coffees enable row level security;
alter table public.brews enable row level security;
alter table public.brew_schedule enable row level security;
alter table public.user_settings enable row level security;

-- Policies: users can only access their own data
create policy "Users can view own coffees" on public.coffees for select using (auth.uid() = user_id);
create policy "Users can insert own coffees" on public.coffees for insert with check (auth.uid() = user_id);
create policy "Users can update own coffees" on public.coffees for update using (auth.uid() = user_id);
create policy "Users can delete own coffees" on public.coffees for delete using (auth.uid() = user_id);

create policy "Users can view own brews" on public.brews for select using (auth.uid() = user_id);
create policy "Users can insert own brews" on public.brews for insert with check (auth.uid() = user_id);
create policy "Users can update own brews" on public.brews for update using (auth.uid() = user_id);
create policy "Users can delete own brews" on public.brews for delete using (auth.uid() = user_id);

create policy "Users can view own schedule" on public.brew_schedule for select using (auth.uid() = user_id);
create policy "Users can insert own schedule" on public.brew_schedule for insert with check (auth.uid() = user_id);
create policy "Users can update own schedule" on public.brew_schedule for update using (auth.uid() = user_id);
create policy "Users can delete own schedule" on public.brew_schedule for delete using (auth.uid() = user_id);

create policy "Users can view own settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = user_id);

-- Function to auto-create user settings on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated at trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_coffees_updated_at before update on public.coffees
  for each row execute procedure public.update_updated_at_column();

create trigger update_settings_updated_at before update on public.user_settings
  for each row execute procedure public.update_updated_at_column();
