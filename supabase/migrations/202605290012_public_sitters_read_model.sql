drop view if exists public.public_sitters;

create table if not exists public.public_sitters (
  id uuid primary key,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text,
  city text,
  neighborhood text,
  avatar_url text,
  bio text,
  motivation text,
  animal_experience text,
  accepts_dogs boolean not null default false,
  accepts_cats boolean not null default false,
  accepts_small_animals boolean not null default false,
  overnight_stays boolean not null default false,
  daily_visits boolean not null default false,
  dog_walking boolean not null default false,
  emergency_help boolean not null default false,
  medication_experience boolean not null default false,
  senior_pet_experience boolean not null default false,
  puppy_experience boolean not null default false,
  reactive_dog_experience boolean not null default false,
  multiple_pet_experience boolean not null default false,
  rate_range text,
  availability_notes text,
  video_intro_url text,
  approval_status text not null default 'approved' check (approval_status = 'approved'),
  is_featured boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  available_weekends boolean not null default false,
  available_weekday_evenings boolean not null default false,
  available_mornings boolean not null default false,
  available_short_notice boolean not null default false,
  unavailable_until date,
  phone_verified boolean not null default false,
  reference_checked boolean not null default false,
  video_intro_reviewed boolean not null default false,
  admin_public_note text
);

alter table public.public_sitters enable row level security;

create index if not exists public_sitters_user_id_idx on public.public_sitters(user_id);
create index if not exists public_sitters_city_idx on public.public_sitters(city);
create index if not exists public_sitters_is_featured_idx on public.public_sitters(is_featured);

create or replace function public.refresh_public_sitter(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.sitter_profiles sp
    where sp.user_id = p_user_id
    and sp.approval_status = 'approved'
  ) then
    insert into public.public_sitters (
      id,
      user_id,
      full_name,
      city,
      neighborhood,
      avatar_url,
      bio,
      motivation,
      animal_experience,
      accepts_dogs,
      accepts_cats,
      accepts_small_animals,
      overnight_stays,
      daily_visits,
      dog_walking,
      emergency_help,
      medication_experience,
      senior_pet_experience,
      puppy_experience,
      reactive_dog_experience,
      multiple_pet_experience,
      rate_range,
      availability_notes,
      video_intro_url,
      approval_status,
      is_featured,
      created_at,
      updated_at,
      available_weekends,
      available_weekday_evenings,
      available_mornings,
      available_short_notice,
      unavailable_until,
      phone_verified,
      reference_checked,
      video_intro_reviewed,
      admin_public_note
    )
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
    where sp.user_id = p_user_id
    and sp.approval_status = 'approved'
    on conflict (user_id) do update set
      id = excluded.id,
      full_name = excluded.full_name,
      city = excluded.city,
      neighborhood = excluded.neighborhood,
      avatar_url = excluded.avatar_url,
      bio = excluded.bio,
      motivation = excluded.motivation,
      animal_experience = excluded.animal_experience,
      accepts_dogs = excluded.accepts_dogs,
      accepts_cats = excluded.accepts_cats,
      accepts_small_animals = excluded.accepts_small_animals,
      overnight_stays = excluded.overnight_stays,
      daily_visits = excluded.daily_visits,
      dog_walking = excluded.dog_walking,
      emergency_help = excluded.emergency_help,
      medication_experience = excluded.medication_experience,
      senior_pet_experience = excluded.senior_pet_experience,
      puppy_experience = excluded.puppy_experience,
      reactive_dog_experience = excluded.reactive_dog_experience,
      multiple_pet_experience = excluded.multiple_pet_experience,
      rate_range = excluded.rate_range,
      availability_notes = excluded.availability_notes,
      video_intro_url = excluded.video_intro_url,
      approval_status = excluded.approval_status,
      is_featured = excluded.is_featured,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      available_weekends = excluded.available_weekends,
      available_weekday_evenings = excluded.available_weekday_evenings,
      available_mornings = excluded.available_mornings,
      available_short_notice = excluded.available_short_notice,
      unavailable_until = excluded.unavailable_until,
      phone_verified = excluded.phone_verified,
      reference_checked = excluded.reference_checked,
      video_intro_reviewed = excluded.video_intro_reviewed,
      admin_public_note = excluded.admin_public_note;
  else
    delete from public.public_sitters where user_id = p_user_id;
  end if;
end;
$$;

create or replace function public.sync_public_sitter_from_sitter_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.public_sitters where user_id = old.user_id;
    return old;
  end if;

  perform public.refresh_public_sitter(new.user_id);
  return new;
end;
$$;

create or replace function public.sync_public_sitter_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_public_sitter(new.id);
  return new;
end;
$$;

drop trigger if exists sync_public_sitter_from_sitter_profile on public.sitter_profiles;
create trigger sync_public_sitter_from_sitter_profile
  after insert or update or delete on public.sitter_profiles
  for each row execute function public.sync_public_sitter_from_sitter_profile();

drop trigger if exists sync_public_sitter_from_profile on public.profiles;
create trigger sync_public_sitter_from_profile
  after update of full_name, city, neighborhood, avatar_url on public.profiles
  for each row execute function public.sync_public_sitter_from_profile();

select public.refresh_public_sitter(user_id)
from public.sitter_profiles;

drop policy if exists "public sitters read approved" on public.public_sitters;
create policy "public sitters read approved" on public.public_sitters
  for select to anon, authenticated
  using (approval_status = 'approved');

drop policy if exists "public sitters admin all" on public.public_sitters;
create policy "public sitters admin all" on public.public_sitters
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

grant select on public.public_sitters to anon, authenticated;

revoke execute on function public.refresh_public_sitter(uuid) from public;
revoke execute on function public.sync_public_sitter_from_sitter_profile() from public;
revoke execute on function public.sync_public_sitter_from_profile() from public;
revoke execute on function public.refresh_public_sitter(uuid) from anon, authenticated;
revoke execute on function public.sync_public_sitter_from_sitter_profile() from anon, authenticated;
revoke execute on function public.sync_public_sitter_from_profile() from anon, authenticated;

comment on table public.public_sitters is
  'Public read model for approved sitters. Stores only safe fields and omits phone, reference contacts, private admin notes, and owner data.';
