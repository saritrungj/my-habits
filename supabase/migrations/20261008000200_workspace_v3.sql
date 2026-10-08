-- Apply before deploying clients that write schemaVersion 3. Existing v2 workspaces and receipts remain valid.
create or replace function public.myhabit_save_workspace(
  p_payload jsonb,
  p_expected_revision bigint,
  p_mutation_id uuid
)
returns table (revision bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_revision bigint;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or coalesce(p_payload->>'schemaVersion','') not in ('2','3') then
    raise exception 'Invalid workspace format' using errcode = '22023';
  end if;
  if exists (select 1 from public.myhabit_mutation_receipts where user_id = v_user_id and mutation_id = p_mutation_id) then
    return query select receipt.revision from public.myhabit_mutation_receipts as receipt where receipt.user_id = v_user_id and receipt.mutation_id = p_mutation_id;
    return;
  end if;
  if not exists (select 1 from public.myhabit_workspaces where user_id = v_user_id) and p_expected_revision <> 0 then
    raise exception 'Workspace revision conflict' using errcode = '40001';
  end if;
  insert into public.myhabit_workspaces (user_id, payload, revision)
    values (v_user_id, p_payload, 1)
    on conflict (user_id) do update
      set payload = excluded.payload, revision = public.myhabit_workspaces.revision + 1, updated_at = now()
      where public.myhabit_workspaces.revision = p_expected_revision
    returning myhabit_workspaces.revision into v_revision;
  if v_revision is null then raise exception 'Workspace revision conflict' using errcode = '40001'; end if;
  insert into public.myhabit_mutation_receipts (user_id, mutation_id, revision) values (v_user_id, p_mutation_id, v_revision);
  return query select v_revision;
end;
$$;

revoke all on function public.myhabit_save_workspace(jsonb, bigint, uuid) from public, anon;
grant execute on function public.myhabit_save_workspace(jsonb, bigint, uuid) to authenticated;
