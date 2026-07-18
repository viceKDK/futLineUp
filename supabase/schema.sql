-- futbolClub cloud schema. Run in a new Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  experience text not null default 'friends' check (experience in ('friends','coach','league')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'friends' check (kind in ('friends','coach','league')),
  created_at timestamptz not null default now()
);
create table if not exists public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','coach','assistant','delegate','player','guardian','organizer','viewer')),
  primary key (workspace_id,user_id)
);
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, mode smallint not null check(mode in (5,6,7,8,11)), settings jsonb not null default '{}', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, birth_date date, preferred_foot text, photo_path text, metadata jsonb not null default '{}', archived_at timestamptz, created_at timestamptz default now()
);
create table if not exists public.team_players (
  team_id uuid references public.teams(id) on delete cascade, player_id uuid references public.players(id) on delete cascade,
  number smallint, primary_position text, secondary_position text, active boolean not null default true, primary key(team_id,player_id)
);
create table if not exists public.formations (
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade,
  name text not null, mode smallint not null, is_free boolean default false, kit jsonb not null default '{}', slots jsonb not null default '[]', substitutes jsonb not null default '[]', updated_at timestamptz default now()
);
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null, opponent text not null, starts_at timestamptz, venue text, us_score smallint, them_score smallint, status text default 'scheduled', metadata jsonb default '{}', created_at timestamptz default now()
);
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade,
  title text not null, starts_at timestamptz not null, notes text, created_at timestamptz default now()
);
create table if not exists public.attendance (
  session_id uuid references public.training_sessions(id) on delete cascade, player_id uuid references public.players(id) on delete cascade,
  status text not null default 'present' check(status in ('present','absent','excused','late')), primary key(session_id,player_id)
);
create table if not exists public.player_evaluations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade, author_id uuid not null references auth.users(id), context text not null,
  rating numeric(3,1), strengths text, improvements text, next_goal text, visibility text not null default 'staff', evaluated_on date not null default current_date, created_at timestamptz default now()
);
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null, season text, rules jsonb default '{}'
);
create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(), competition_id uuid not null references public.competitions(id) on delete cascade,
  round_label text, starts_at timestamptz, home_name text not null, away_name text not null, home_score smallint, away_score smallint, status text default 'scheduled', updated_at timestamptz default now()
);

create or replace function public.is_workspace_member(target uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.workspace_members m where m.workspace_id=target and m.user_id=auth.uid())
  or exists(select 1 from public.workspaces w where w.id=target and w.owner_id=auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.formations enable row level security;
alter table public.matches enable row level security;
alter table public.training_sessions enable row level security;
alter table public.player_evaluations enable row level security;
alter table public.competitions enable row level security;
alter table public.fixtures enable row level security;

create policy "profile own" on public.profiles for all using(id=auth.uid()) with check(id=auth.uid());
create policy "workspace members read" on public.workspaces for select using(public.is_workspace_member(id));
create policy "workspace owner write" on public.workspaces for all using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "members read" on public.workspace_members for select using(public.is_workspace_member(workspace_id));
create policy "members manage owner" on public.workspace_members for all using(exists(select 1 from public.workspaces w where w.id=workspace_id and w.owner_id=auth.uid()));
create policy "teams workspace" on public.teams for all using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy "players workspace" on public.players for all using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy "matches workspace" on public.matches for all using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy "evaluations workspace" on public.player_evaluations for all using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id) and author_id=auth.uid());
create policy "competitions workspace" on public.competitions for all using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));
create policy "formations team workspace" on public.formations for all using(exists(select 1 from public.teams t where t.id=team_id and public.is_workspace_member(t.workspace_id))) with check(exists(select 1 from public.teams t where t.id=team_id and public.is_workspace_member(t.workspace_id)));
create policy "training team workspace" on public.training_sessions for all using(exists(select 1 from public.teams t where t.id=team_id and public.is_workspace_member(t.workspace_id))) with check(exists(select 1 from public.teams t where t.id=team_id and public.is_workspace_member(t.workspace_id)));
create policy "fixtures competition workspace" on public.fixtures for all using(exists(select 1 from public.competitions c where c.id=competition_id and public.is_workspace_member(c.workspace_id))) with check(exists(select 1 from public.competitions c where c.id=competition_id and public.is_workspace_member(c.workspace_id)));
create table if not exists public.user_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_backups enable row level security;
create policy "backup own" on public.user_backups for all using(user_id=auth.uid()) with check(user_id=auth.uid());
-- Policies for join tables added after their parent policies.
alter table public.team_players enable row level security;
alter table public.attendance enable row level security;
create policy "team players workspace" on public.team_players for all
using (exists(select 1 from public.teams t where t.id=team_id and public.is_workspace_member(t.workspace_id)))
with check (exists(select 1 from public.teams t where t.id=team_id and public.is_workspace_member(t.workspace_id)));
create policy "attendance workspace" on public.attendance for all
using (exists(select 1 from public.training_sessions s join public.teams t on t.id=s.team_id where s.id=session_id and public.is_workspace_member(t.workspace_id)))
with check (exists(select 1 from public.training_sessions s join public.teams t on t.id=s.team_id where s.id=session_id and public.is_workspace_member(t.workspace_id)));