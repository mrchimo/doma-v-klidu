alter table public.sitter_profiles
  add column if not exists phone_verified boolean not null default false,
  add column if not exists reference_checked boolean not null default false,
  add column if not exists video_intro_reviewed boolean not null default false,
  add column if not exists admin_public_note text,
  add column if not exists admin_private_note text;

create or replace view public.public_sitters
with (security_invoker = false)
as
select
  sp.id,
  sp.user_id,
  p.full_name,
  p.city,
  p.neighborhood,
  p.avatar_url,
  sp.bio,
  sp.motivation,
  sp.animal_experience,
  sp.accepts_dogs,
  sp.accepts_cats,
  sp.accepts_small_animals,
  sp.overnight_stays,
  sp.daily_visits,
  sp.dog_walking,
  sp.emergency_help,
  sp.medication_experience,
  sp.senior_pet_experience,
  sp.puppy_experience,
  sp.reactive_dog_experience,
  sp.multiple_pet_experience,
  sp.rate_range,
  sp.availability_notes,
  sp.video_intro_url,
  sp.approval_status,
  sp.is_featured,
  sp.created_at,
  sp.updated_at,
  sp.available_weekends,
  sp.available_weekday_evenings,
  sp.available_mornings,
  sp.available_short_notice,
  sp.unavailable_until,
  sp.phone_verified,
  sp.reference_checked,
  sp.video_intro_reviewed,
  sp.admin_public_note
from public.sitter_profiles sp
join public.profiles p on p.id = sp.user_id
where sp.approval_status = 'approved';

create or replace function public.protect_sitter_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.approval_status is distinct from old.approval_status
    and not public.current_user_is_admin()
    and not (old.approval_status = 'rejected' and new.approval_status = 'pending_approval')
  then
    raise exception 'Only admins can change sitter approval status';
  end if;

  if (
    new.phone_verified is distinct from old.phone_verified
    or new.reference_checked is distinct from old.reference_checked
    or new.video_intro_reviewed is distinct from old.video_intro_reviewed
    or new.admin_public_note is distinct from old.admin_public_note
    or new.admin_private_note is distinct from old.admin_private_note
  )
    and not public.current_user_is_admin()
  then
    raise exception 'Only admins can change sitter trust fields';
  end if;

  return new;
end;
$$;
