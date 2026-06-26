-- Run this in Supabase SQL Editor to add Roasters support

-- Roasters table
create table if not exists public.roasters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  website text,
  country text,
  notes text,
  default_rest_days integer not null default 7,
  default_peak_end_days integer not null default 30,
  created_at timestamptz not null default now()
);

-- Add roaster_id to coffees (optional FK)
alter table public.coffees
  add column if not exists roaster_id uuid references public.roasters(id) on delete set null;

-- Update roast_level check to include ultra-light
alter table public.coffees
  drop constraint if exists coffees_roast_level_check;

alter table public.coffees
  add constraint coffees_roast_level_check
  check (roast_level in ('ultra-light', 'light', 'medium-light', 'medium', 'medium-dark', 'dark'));

-- RLS for roasters
alter table public.roasters enable row level security;

create policy "Users can view own roasters" on public.roasters for select using (auth.uid() = user_id);
create policy "Users can insert own roasters" on public.roasters for insert with check (auth.uid() = user_id);
create policy "Users can update own roasters" on public.roasters for update using (auth.uid() = user_id);
create policy "Users can delete own roasters" on public.roasters for delete using (auth.uid() = user_id);
