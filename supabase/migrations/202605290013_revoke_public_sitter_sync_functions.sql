revoke execute on function public.refresh_public_sitter(uuid) from public;
revoke execute on function public.sync_public_sitter_from_sitter_profile() from public;
revoke execute on function public.sync_public_sitter_from_profile() from public;
revoke execute on function public.refresh_public_sitter(uuid) from anon, authenticated;
revoke execute on function public.sync_public_sitter_from_sitter_profile() from anon, authenticated;
revoke execute on function public.sync_public_sitter_from_profile() from anon, authenticated;
