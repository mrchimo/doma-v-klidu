create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('owner', 'sitter', 'professional', 'admin')),
  phone text,
  city text,
  neighborhood text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  city text,
  neighborhood text,
  household_type text,
  has_plants boolean not null default false,
  has_mail_pickup boolean not null default false,
  has_alarm boolean not null default false,
  has_cameras boolean not null default false,
  parking_notes text,
  house_rules text,
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  species text,
  breed text,
  age text,
  size text,
  temperament text,
  feeding_instructions text,
  medication text,
  allergies text,
  fears text,
  behavior_people text,
  behavior_animals text,
  veterinarian_contact text,
  emergency_contact text,
  never_do text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sitter_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
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
  available_weekends boolean not null default false,
  available_weekday_evenings boolean not null default false,
  available_mornings boolean not null default false,
  available_short_notice boolean not null default false,
  unavailable_until date,
  reference_contact text,
  video_intro_url text,
  phone_verified boolean not null default false,
  reference_checked boolean not null default false,
  video_intro_reviewed boolean not null default false,
  admin_public_note text,
  admin_private_note text,
  approval_status text not null default 'pending_approval' check (approval_status in ('pending_approval', 'approved', 'rejected')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.house_sitting_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  sitting_type text not null,
  preferred_time_windows text,
  tasks text[],
  sitter_requirements text[],
  budget_range text,
  notes text,
  urgency text not null default 'normal' check (urgency in ('normal', 'urgent')),
  status text not null default 'open' check (status in ('open', 'matched', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.request_pets (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.house_sitting_requests(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  unique (request_id, pet_id)
);

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

create table public.sitter_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.house_sitting_requests(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  sitter_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'cancelled', 'completed')),
  sitter_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, sitter_id)
);

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

create table public.trust_badges (
  id uuid primary key default gen_random_uuid(),
  sitter_id uuid not null references public.profiles(id) on delete cascade,
  badge_type text not null,
  label text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'owner')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from anon, authenticated;

create index households_owner_id_idx on public.households(owner_id);
create index pets_owner_id_idx on public.pets(owner_id);
create index sitter_profiles_user_id_idx on public.sitter_profiles(user_id);
create index sitter_profiles_approval_status_idx on public.sitter_profiles(approval_status);
create index house_sitting_requests_owner_id_idx on public.house_sitting_requests(owner_id);
create index handover_checklist_items_request_id_idx on public.handover_checklist_items(request_id);
create index handover_checklist_items_owner_id_idx on public.handover_checklist_items(owner_id);
create index sitter_requests_owner_id_idx on public.sitter_requests(owner_id);
create index sitter_requests_sitter_id_idx on public.sitter_requests(sitter_id);
create index sitting_agreements_owner_id_idx on public.sitting_agreements(owner_id);
create index sitting_agreements_sitter_id_idx on public.sitting_agreements(sitter_id);
create unique index sitting_agreements_one_confirmed_request_idx on public.sitting_agreements(request_id) where status = 'confirmed';
create unique index sitting_agreements_one_confirmed_sitter_request_idx on public.sitting_agreements(sitter_request_id) where status = 'confirmed';

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger households_updated_at before update on public.households for each row execute function public.set_updated_at();
create trigger pets_updated_at before update on public.pets for each row execute function public.set_updated_at();
create trigger sitter_profiles_updated_at before update on public.sitter_profiles for each row execute function public.set_updated_at();
create trigger house_sitting_requests_updated_at before update on public.house_sitting_requests for each row execute function public.set_updated_at();
create trigger handover_checklist_items_updated_at before update on public.handover_checklist_items for each row execute function public.set_updated_at();
create trigger sitter_requests_updated_at before update on public.sitter_requests for each row execute function public.set_updated_at();
create trigger sitting_agreements_updated_at before update on public.sitting_agreements for each row execute function public.set_updated_at();

create view public.public_sitters
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

grant select on public.public_sitters to anon, authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

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

create trigger protect_sitter_approval_status
  before update on public.sitter_profiles
  for each row execute function public.protect_sitter_approval_status();

revoke execute on function public.protect_sitter_approval_status() from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.pets enable row level security;
alter table public.sitter_profiles enable row level security;
alter table public.house_sitting_requests enable row level security;
alter table public.request_pets enable row level security;
alter table public.handover_checklist_items enable row level security;
alter table public.sitter_requests enable row level security;
alter table public.sitting_agreements enable row level security;
alter table public.trust_badges enable row level security;

create policy "profiles own read" on public.profiles for select using (id = auth.uid());
create policy "profiles request participants read" on public.profiles for select using (
  exists (
    select 1
    from public.sitter_requests sr
    where (
      sr.owner_id = auth.uid()
      and sr.sitter_id = profiles.id
    )
    or (
      sr.sitter_id = auth.uid()
      and sr.owner_id = profiles.id
    )
  )
);
create policy "profiles admin read" on public.profiles for select using (public.current_user_is_admin());
create policy "profiles own insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin update" on public.profiles for update using (public.current_user_is_admin()) with check (public.current_user_is_admin());

create policy "households owner read" on public.households for select using (owner_id = auth.uid());
create policy "households owner insert" on public.households for insert with check (owner_id = auth.uid());
create policy "households owner update" on public.households for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "households owner delete" on public.households for delete using (owner_id = auth.uid());
create policy "households admin all" on public.households for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

create policy "pets owner read" on public.pets for select using (owner_id = auth.uid());
create policy "pets owner insert" on public.pets for insert with check (owner_id = auth.uid());
create policy "pets owner update" on public.pets for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "pets owner delete" on public.pets for delete using (owner_id = auth.uid());
create policy "pets admin all" on public.pets for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

create policy "sitter profiles owner read" on public.sitter_profiles for select using (user_id = auth.uid());
create policy "sitter profiles owner upsert" on public.sitter_profiles for insert with check (user_id = auth.uid());
create policy "sitter profiles owner update pending" on public.sitter_profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sitter profiles admin all" on public.sitter_profiles for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

create policy "requests owner read" on public.house_sitting_requests for select using (owner_id = auth.uid());
create policy "requests sitter addressed read" on public.house_sitting_requests for select using (
  exists (
    select 1 from public.sitter_requests sr
    where sr.request_id = house_sitting_requests.id
    and sr.sitter_id = auth.uid()
  )
);
create policy "requests owner insert" on public.house_sitting_requests for insert with check (owner_id = auth.uid());
create policy "requests owner update" on public.house_sitting_requests for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "requests owner delete" on public.house_sitting_requests for delete using (owner_id = auth.uid());
create policy "requests admin all" on public.house_sitting_requests for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

create policy "request pets owner read" on public.request_pets for select using (
  exists (select 1 from public.house_sitting_requests r where r.id = request_pets.request_id and r.owner_id = auth.uid())
);
create policy "request pets owner insert" on public.request_pets for insert with check (
  exists (select 1 from public.house_sitting_requests r where r.id = request_pets.request_id and r.owner_id = auth.uid())
);
create policy "request pets owner delete" on public.request_pets for delete using (
  exists (select 1 from public.house_sitting_requests r where r.id = request_pets.request_id and r.owner_id = auth.uid())
);
create policy "request pets admin all" on public.request_pets for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

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

create policy "sitter requests owner create" on public.sitter_requests for insert with check (
  owner_id = auth.uid()
  and exists (select 1 from public.house_sitting_requests r where r.id = sitter_requests.request_id and r.owner_id = auth.uid())
);
create policy "sitter requests owner read" on public.sitter_requests for select using (owner_id = auth.uid());
create policy "sitter requests owner cancel" on public.sitter_requests for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "sitter requests sitter read" on public.sitter_requests for select using (sitter_id = auth.uid());
create policy "sitter requests sitter respond" on public.sitter_requests for update using (sitter_id = auth.uid()) with check (sitter_id = auth.uid());
create policy "sitter requests admin all" on public.sitter_requests for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

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

create policy "trust badges public approved read" on public.trust_badges for select using (
  exists (select 1 from public.sitter_profiles sp where sp.user_id = trust_badges.sitter_id and sp.approval_status = 'approved')
);
create policy "trust badges admin all" on public.trust_badges for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

comment on view public.public_sitters is
  'Public read model for approved sitters. Exposes only safe profile fields and intentionally omits phone and private owner data.';
