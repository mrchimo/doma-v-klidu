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

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.protect_sitter_approval_status() from anon, authenticated;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.protect_sitter_approval_status() from public;
