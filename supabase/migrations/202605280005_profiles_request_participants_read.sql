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
