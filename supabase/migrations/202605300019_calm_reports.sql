create table if not exists public.calm_reports (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null unique references public.sitting_agreements(id) on delete cascade,
  request_id uuid not null references public.house_sitting_requests(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  sitter_id uuid not null references public.profiles(id) on delete cascade,
  pet_status text not null check (pet_status in ('okay', 'attention')),
  feeding_status text not null check (feeding_status in ('done', 'not_needed', 'attention')),
  walking_status text not null check (walking_status in ('done', 'not_needed', 'attention')),
  home_check_status text not null check (home_check_status in ('done', 'not_needed', 'attention')),
  note text,
  photo_path text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calm_reports_owner_id_idx on public.calm_reports(owner_id);
create index if not exists calm_reports_sitter_id_idx on public.calm_reports(sitter_id);
create index if not exists calm_reports_request_id_idx on public.calm_reports(request_id);

drop trigger if exists calm_reports_updated_at on public.calm_reports;
create trigger calm_reports_updated_at
  before update on public.calm_reports
  for each row execute function public.set_updated_at();

alter table public.calm_reports enable row level security;

drop policy if exists "calm reports owner read" on public.calm_reports;
create policy "calm reports owner read" on public.calm_reports
  for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "calm reports sitter read" on public.calm_reports;
create policy "calm reports sitter read" on public.calm_reports
  for select to authenticated
  using (sitter_id = auth.uid());

drop policy if exists "calm reports sitter create confirmed" on public.calm_reports;
create policy "calm reports sitter create confirmed" on public.calm_reports
  for insert to authenticated
  with check (
    sitter_id = auth.uid()
    and exists (
      select 1
      from public.sitting_agreements sa
      where sa.id = calm_reports.agreement_id
      and sa.request_id = calm_reports.request_id
      and sa.owner_id = calm_reports.owner_id
      and sa.sitter_id = auth.uid()
      and sa.status = 'confirmed'
    )
  );

drop policy if exists "calm reports sitter update confirmed" on public.calm_reports;
create policy "calm reports sitter update confirmed" on public.calm_reports
  for update to authenticated
  using (sitter_id = auth.uid())
  with check (
    sitter_id = auth.uid()
    and exists (
      select 1
      from public.sitting_agreements sa
      where sa.id = calm_reports.agreement_id
      and sa.request_id = calm_reports.request_id
      and sa.owner_id = calm_reports.owner_id
      and sa.sitter_id = auth.uid()
      and sa.status = 'confirmed'
    )
  );

drop policy if exists "calm reports admin all" on public.calm_reports;
create policy "calm reports admin all" on public.calm_reports
  for all to authenticated
  using (private.current_user_is_admin())
  with check (private.current_user_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'calm-report-photos',
  'calm-report-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.email_notifications
  drop constraint if exists email_notifications_notification_type_check;

alter table public.email_notifications
  add constraint email_notifications_notification_type_check
  check (notification_type in ('sitter_request_sent', 'sitter_request_responded', 'sitter_approved', 'sitting_reminder', 'calm_report_submitted'));
