create table if not exists public.owner_favorite_sitters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  sitter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, sitter_id)
);

create index if not exists owner_favorite_sitters_owner_id_idx on public.owner_favorite_sitters(owner_id);
create index if not exists owner_favorite_sitters_sitter_id_idx on public.owner_favorite_sitters(sitter_id);

alter table public.owner_favorite_sitters enable row level security;

drop policy if exists "favorite sitters owner read" on public.owner_favorite_sitters;
create policy "favorite sitters owner read" on public.owner_favorite_sitters
  for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "favorite sitters owner create approved" on public.owner_favorite_sitters;
create policy "favorite sitters owner create approved" on public.owner_favorite_sitters
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.sitter_profiles sp
      where sp.user_id = owner_favorite_sitters.sitter_id
      and sp.approval_status = 'approved'
    )
  );

drop policy if exists "favorite sitters owner delete" on public.owner_favorite_sitters;
create policy "favorite sitters owner delete" on public.owner_favorite_sitters
  for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "favorite sitters admin all" on public.owner_favorite_sitters;
create policy "favorite sitters admin all" on public.owner_favorite_sitters
  for all to authenticated
  using (private.current_user_is_admin())
  with check (private.current_user_is_admin());
