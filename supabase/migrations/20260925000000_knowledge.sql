-- Apply in the Supabase SQL Editor or with `supabase db push`.
-- A signed-up user becomes an admin only after an operator inserts their auth user ID.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('destination', 'activity', 'stay', 'connection', 'season')),
  title text not null check (length(trim(title)) between 1 and 140),
  destination text not null check (length(trim(destination)) between 1 and 140),
  related_destination text check (related_destination is null or length(trim(related_destination)) between 1 and 140),
  interests text[] not null default '{}',
  months int[] not null default '{}',
  duration_minutes int check (duration_minutes is null or duration_minutes between 1 and 720),
  claim text not null check (length(trim(claim)) between 10 and 800),
  source_url text not null check (source_url ~ '^https://[^ ]+$' and length(source_url) <= 1000),
  provider_url text check (provider_url is null or (provider_url ~ '^https://[^ ]+$' and length(provider_url) <= 1000)),
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  retrieved_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version int not null default 1 check (version >= 1),
  constraint approved_is_reviewed check (status <> 'approved' or (reviewed_at is not null and reviewed_by is not null and expires_at > reviewed_at))
);

create index if not exists knowledge_records_status_expiry_idx on public.knowledge_records (status, expires_at);
create index if not exists knowledge_records_destination_idx on public.knowledge_records (lower(destination));

create table if not exists public.knowledge_revisions (
  id bigint generated always as identity primary key,
  record_id uuid not null,
  version int not null,
  snapshot jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null
);
create index if not exists knowledge_revisions_record_idx on public.knowledge_revisions (record_id, version desc);

create or replace function public.touch_knowledge_record() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.knowledge_revisions (record_id, version, snapshot, changed_by)
  values (old.id, old.version, to_jsonb(old), auth.uid());
  new.updated_at := now();
  new.version := old.version + 1;
  return new;
end;
$$;
revoke execute on function public.touch_knowledge_record() from public;
create trigger knowledge_record_updated before update on public.knowledge_records
for each row execute function public.touch_knowledge_record();

alter table public.admin_users enable row level security;
alter table public.knowledge_records enable row level security;
alter table public.knowledge_revisions enable row level security;
revoke all on public.admin_users from anon, authenticated;
revoke all on public.knowledge_records from anon, authenticated;
revoke all on public.knowledge_revisions from anon, authenticated;
grant select on public.admin_users to anon, authenticated;
grant select on public.knowledge_records to anon, authenticated;
grant insert, update on public.knowledge_records to authenticated;
grant select on public.knowledge_revisions to authenticated;

create policy "Members can see their own admin status" on public.admin_users
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Approved facts are public and admins can review all facts" on public.knowledge_records
  for select to anon, authenticated using (
    (status = 'approved' and expires_at > now())
    or exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
create policy "Only admins can add facts" on public.knowledge_records
  for insert to authenticated with check (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
create policy "Only admins can edit facts" on public.knowledge_records
  for update to authenticated using (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
create policy "Only admins can read fact history" on public.knowledge_revisions
  for select to authenticated using (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
