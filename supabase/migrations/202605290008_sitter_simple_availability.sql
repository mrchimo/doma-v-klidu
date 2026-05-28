alter table public.sitter_profiles
  add column if not exists available_weekends boolean not null default false,
  add column if not exists available_weekday_evenings boolean not null default false,
  add column if not exists available_mornings boolean not null default false,
  add column if not exists available_short_notice boolean not null default false,
  add column if not exists unavailable_until date;

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
  sp.unavailable_until
from public.sitter_profiles sp
join public.profiles p on p.id = sp.user_id
where sp.approval_status = 'approved';
