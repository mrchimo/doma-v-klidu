alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
and p.email is null;

create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_email text,
  notification_type text not null check (notification_type in ('sitter_request_sent', 'sitter_request_responded', 'sitter_approved', 'sitting_reminder')),
  subject text not null,
  body text not null,
  action_url text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  provider text,
  provider_message_id text,
  error_message text,
  related_request_id uuid references public.house_sitting_requests(id) on delete set null,
  related_sitter_request_id uuid references public.sitter_requests(id) on delete set null,
  related_agreement_id uuid references public.sitting_agreements(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_notifications_recipient_id_idx on public.email_notifications(recipient_id);
create index if not exists email_notifications_status_scheduled_idx on public.email_notifications(status, scheduled_for);
create index if not exists email_notifications_related_request_id_idx on public.email_notifications(related_request_id);

create trigger email_notifications_updated_at
  before update on public.email_notifications
  for each row execute function public.set_updated_at();

alter table public.email_notifications enable row level security;

drop policy if exists "email notifications own read" on public.email_notifications;
create policy "email notifications own read" on public.email_notifications
  for select to authenticated
  using (recipient_id = auth.uid());

drop policy if exists "email notifications admin all" on public.email_notifications;
create policy "email notifications admin all" on public.email_notifications
  for all to authenticated
  using (private.current_user_is_admin())
  with check (private.current_user_is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'owner'),
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    email = coalesce(public.profiles.email, excluded.email),
    updated_at = now();

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
