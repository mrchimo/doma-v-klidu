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

  return new;
end;
$$;

drop trigger if exists protect_sitter_approval_status on public.sitter_profiles;

create trigger protect_sitter_approval_status
  before update on public.sitter_profiles
  for each row execute function public.protect_sitter_approval_status();
