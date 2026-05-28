create table public.handover_checklist_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.house_sitting_requests(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  details text,
  category text not null default 'other' check (category in ('pet_care', 'home', 'access', 'safety', 'plants_mail', 'other')),
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index handover_checklist_items_request_id_idx on public.handover_checklist_items(request_id);
create index handover_checklist_items_owner_id_idx on public.handover_checklist_items(owner_id);
create trigger handover_checklist_items_updated_at before update on public.handover_checklist_items for each row execute function public.set_updated_at();

alter table public.handover_checklist_items enable row level security;

create policy "handover checklist owner read" on public.handover_checklist_items for select using (owner_id = auth.uid());
create policy "handover checklist owner insert" on public.handover_checklist_items for insert with check (
  owner_id = auth.uid()
  and exists (select 1 from public.house_sitting_requests r where r.id = handover_checklist_items.request_id and r.owner_id = auth.uid())
);
create policy "handover checklist owner update" on public.handover_checklist_items for update using (owner_id = auth.uid()) with check (
  owner_id = auth.uid()
  and exists (select 1 from public.house_sitting_requests r where r.id = handover_checklist_items.request_id and r.owner_id = auth.uid())
);
create policy "handover checklist owner delete" on public.handover_checklist_items for delete using (owner_id = auth.uid());
create policy "handover checklist sitter read" on public.handover_checklist_items for select using (
  exists (
    select 1
    from public.sitter_requests sr
    where sr.request_id = handover_checklist_items.request_id
    and sr.sitter_id = auth.uid()
  )
);
create policy "handover checklist admin all" on public.handover_checklist_items for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());
