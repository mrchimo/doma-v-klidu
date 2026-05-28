create table public.sitting_agreements (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.house_sitting_requests(id) on delete cascade,
  sitter_request_id uuid not null references public.sitter_requests(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  sitter_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  owner_note text,
  confirmed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sitting_agreements_owner_id_idx on public.sitting_agreements(owner_id);
create index sitting_agreements_sitter_id_idx on public.sitting_agreements(sitter_id);
create unique index sitting_agreements_one_confirmed_request_idx on public.sitting_agreements(request_id) where status = 'confirmed';
create unique index sitting_agreements_one_confirmed_sitter_request_idx on public.sitting_agreements(sitter_request_id) where status = 'confirmed';
create trigger sitting_agreements_updated_at before update on public.sitting_agreements for each row execute function public.set_updated_at();

alter table public.sitting_agreements enable row level security;

create policy "sitting agreements owner read" on public.sitting_agreements for select using (owner_id = auth.uid());
create policy "sitting agreements owner create" on public.sitting_agreements for insert with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.sitter_requests sr
    where sr.id = sitting_agreements.sitter_request_id
    and sr.request_id = sitting_agreements.request_id
    and sr.owner_id = auth.uid()
    and sr.sitter_id = sitting_agreements.sitter_id
    and sr.status = 'accepted'
  )
);
create policy "sitting agreements owner update" on public.sitting_agreements for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "sitting agreements sitter read" on public.sitting_agreements for select using (sitter_id = auth.uid());
create policy "sitting agreements admin all" on public.sitting_agreements for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());
