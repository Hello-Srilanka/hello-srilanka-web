-- Completed itineraries belong only to the authenticated account that saved them.
create table if not exists public.itinerary_history (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  id uuid not null,
  title text not null check (length(trim(title)) between 1 and 200),
  mode text not null check (mode in ('sample', 'live')),
  generated_at timestamptz not null,
  itinerary jsonb not null check (jsonb_typeof(itinerary) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists itinerary_history_recent_idx
  on public.itinerary_history (user_id, generated_at desc);

alter table public.itinerary_history enable row level security;
revoke all on public.itinerary_history from anon, authenticated;
grant select, insert, update on public.itinerary_history to authenticated;

create policy "Users can read their own itineraries" on public.itinerary_history
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can save their own itineraries" on public.itinerary_history
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can update their own itineraries" on public.itinerary_history
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
