alter table public.sitter_profiles
  add column if not exists bio_reviewed boolean not null default false,
  add column if not exists experience_reviewed boolean not null default false,
  add column if not exists risk_reviewed boolean not null default false,
  add column if not exists risk_flags text[] not null default '{}',
  add column if not exists risk_notes text;

update public.sitter_profiles
set
  bio_reviewed = true,
  experience_reviewed = true,
  risk_reviewed = true
where approval_status = 'approved'
and nullif(trim(coalesce(bio, '')), '') is not null
and nullif(trim(coalesce(animal_experience, '')), '') is not null;

update public.sitter_profiles
set risk_reviewed = true
where approval_status = 'rejected'
and risk_reviewed = false;

create index if not exists sitter_profiles_quality_queue_idx
  on public.sitter_profiles(approval_status, created_at desc);

create or replace function public.protect_sitter_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.approval_status is distinct from old.approval_status
    and not private.current_user_is_admin()
    and not (old.approval_status = 'rejected' and new.approval_status = 'pending_approval')
  then
    raise exception 'Only admins can change sitter approval status';
  end if;

  if (
    new.phone_verified is distinct from old.phone_verified
    or new.reference_checked is distinct from old.reference_checked
    or new.video_intro_reviewed is distinct from old.video_intro_reviewed
    or new.bio_reviewed is distinct from old.bio_reviewed
    or new.experience_reviewed is distinct from old.experience_reviewed
    or new.risk_reviewed is distinct from old.risk_reviewed
    or new.risk_flags is distinct from old.risk_flags
    or new.risk_notes is distinct from old.risk_notes
    or new.admin_public_note is distinct from old.admin_public_note
    or new.admin_private_note is distinct from old.admin_private_note
  )
    and not private.current_user_is_admin()
  then
    raise exception 'Only admins can change sitter trust fields';
  end if;

  return new;
end;
$$;
