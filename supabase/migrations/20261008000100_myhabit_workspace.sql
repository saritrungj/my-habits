create table if not exists public.myhabit_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{"schemaVersion":2}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

alter table public.myhabit_workspaces enable row level security;
drop policy if exists "myhabit workspace owner" on public.myhabit_workspaces;
create policy "myhabit workspace owner" on public.myhabit_workspaces
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.myhabit_mutation_receipts (
  user_id uuid not null references auth.users (id) on delete cascade,
  mutation_id uuid not null,
  revision bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mutation_id)
);
alter table public.myhabit_mutation_receipts enable row level security;
drop policy if exists "myhabit receipts owner" on public.myhabit_mutation_receipts;
create policy "myhabit receipts owner" on public.myhabit_mutation_receipts
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "myhabit receipt insert owner" on public.myhabit_mutation_receipts;
create policy "myhabit receipt insert owner" on public.myhabit_mutation_receipts
  for insert to authenticated with check ((select auth.uid()) = user_id);

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
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or p_payload->>'schemaVersion' <> '2' then
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
