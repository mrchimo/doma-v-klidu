create schema if not exists private;

create or replace function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.current_user_is_admin() to anon, authenticated;

alter policy "profiles admin read" on public.profiles using (private.current_user_is_admin());
alter policy "profiles admin update" on public.profiles using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "households admin all" on public.households using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "pets admin all" on public.pets using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "sitter profiles admin all" on public.sitter_profiles using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "requests admin all" on public.house_sitting_requests using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "request pets admin all" on public.request_pets using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "handover checklist admin all" on public.handover_checklist_items using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "sitter requests admin all" on public.sitter_requests using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "sitting agreements admin all" on public.sitting_agreements using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "trust badges admin all" on public.trust_badges using (private.current_user_is_admin()) with check (private.current_user_is_admin());
alter policy "public sitters admin all" on public.public_sitters using (private.current_user_is_admin()) with check (private.current_user_is_admin());

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

drop function if exists public.current_user_is_admin();
