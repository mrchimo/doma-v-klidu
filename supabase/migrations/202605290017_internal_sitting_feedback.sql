create table if not exists public.sitting_feedback (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null unique references public.sitting_agreements(id) on delete cascade,
  request_id uuid not null references public.house_sitting_requests(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  sitter_id uuid not null references public.profiles(id) on delete cascade,
  went_well boolean not null,
  sitter_on_time boolean not null,
  instructions_clear boolean not null,
  would_book_again boolean not null,
  owner_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sitting_feedback_owner_id_idx on public.sitting_feedback(owner_id);
create index if not exists sitting_feedback_sitter_id_idx on public.sitting_feedback(sitter_id);
create index if not exists sitting_feedback_request_id_idx on public.sitting_feedback(request_id);

drop trigger if exists sitting_feedback_updated_at on public.sitting_feedback;
create trigger sitting_feedback_updated_at
  before update on public.sitting_feedback
  for each row execute function public.set_updated_at();

alter table public.sitting_feedback enable row level security;

drop policy if exists "sitting feedback owner read" on public.sitting_feedback;
create policy "sitting feedback owner read" on public.sitting_feedback
  for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "sitting feedback owner create" on public.sitting_feedback;
create policy "sitting feedback owner create" on public.sitting_feedback
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.sitting_agreements sa
      where sa.id = sitting_feedback.agreement_id
      and sa.request_id = sitting_feedback.request_id
      and sa.owner_id = auth.uid()
      and sa.sitter_id = sitting_feedback.sitter_id
      and sa.status in ('confirmed', 'completed')
    )
  );

drop policy if exists "sitting feedback owner update" on public.sitting_feedback;
create policy "sitting feedback owner update" on public.sitting_feedback
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "sitting feedback admin all" on public.sitting_feedback;
create policy "sitting feedback admin all" on public.sitting_feedback
  for all to authenticated
  using (private.current_user_is_admin())
  with check (private.current_user_is_admin());
