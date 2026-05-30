drop policy if exists "calm reports owner read" on public.calm_reports;
create policy "calm reports owner read" on public.calm_reports
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "calm reports sitter read" on public.calm_reports;
create policy "calm reports sitter read" on public.calm_reports
  for select to authenticated
  using (sitter_id = (select auth.uid()));

drop policy if exists "calm reports sitter create confirmed" on public.calm_reports;
create policy "calm reports sitter create confirmed" on public.calm_reports
  for insert to authenticated
  with check (
    sitter_id = (select auth.uid())
    and exists (
      select 1
      from public.sitting_agreements sa
      where sa.id = calm_reports.agreement_id
      and sa.request_id = calm_reports.request_id
      and sa.owner_id = calm_reports.owner_id
      and sa.sitter_id = (select auth.uid())
      and sa.status = 'confirmed'
    )
  );

drop policy if exists "calm reports sitter update confirmed" on public.calm_reports;
create policy "calm reports sitter update confirmed" on public.calm_reports
  for update to authenticated
  using (sitter_id = (select auth.uid()))
  with check (
    sitter_id = (select auth.uid())
    and exists (
      select 1
      from public.sitting_agreements sa
      where sa.id = calm_reports.agreement_id
      and sa.request_id = calm_reports.request_id
      and sa.owner_id = calm_reports.owner_id
      and sa.sitter_id = (select auth.uid())
      and sa.status = 'confirmed'
    )
  );

drop policy if exists "calm reports admin all" on public.calm_reports;
create policy "calm reports admin all" on public.calm_reports
  for all to authenticated
  using ((select private.current_user_is_admin()))
  with check ((select private.current_user_is_admin()));
