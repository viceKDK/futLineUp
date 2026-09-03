-- Verificación de solo lectura para ejecutar después de schema.sql en staging.
do $$
declare
  missing_rls text;
  missing_policy text;
begin
  select string_agg(c.relname, ', ')
    into missing_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(array[
      'profiles','workspaces','workspace_members','teams','players',
      'team_players','formations','matches','training_sessions','attendance',
      'player_evaluations','competitions','fixtures','user_backups'
    ])
    and not c.relrowsecurity;
  if missing_rls is not null then
    raise exception 'Tablas sin RLS: %', missing_rls;
  end if;

  select string_agg(required.name, ', ')
    into missing_policy
  from (values
    ('profile own read'), ('workspace members read'), ('members read'),
    ('teams read'), ('players read'), ('matches read'),
    ('evaluations staff read'), ('competitions read'), ('fixtures read'),
    ('backup own read'), ('team players read'), ('attendance read')
  ) as required(name)
  where not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.policyname = required.name
  );
  if missing_policy is not null then
    raise exception 'Políticas ausentes: %', missing_policy;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_backups_payload_size'
  ) then
    raise exception 'Falta el límite de tamaño de user_backups';
  end if;
end $$;

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
