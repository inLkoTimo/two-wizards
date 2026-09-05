-- Tabelle und Rechte fuer Two Wizards.
-- Im Supabase-Dashboard unter "SQL Editor" einfuegen und ausfuehren.
-- Bestehende Daten bleiben unberuehrt ("if not exists").

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  player1_name text not null,
  player2_name text,
  status text not null default 'waiting'
    check (status in ('waiting', 'ready', 'playing', 'finished')),
  game_state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_code_idx on public.games (code);
create index if not exists games_updated_at_idx on public.games (updated_at desc);

-- Live-Updates: ohne diese Zeile bekommt der zweite Spieler
-- keine Aenderungen mitgeteilt.
do $$
begin
  alter publication supabase_realtime add table public.games;
exception
  when duplicate_object then null;
end $$;

-- Row Level Security ---------------------------------------------------
alter table public.games enable row level security;

-- Wichtig zu wissen: die App spricht ohne Login direkt mit der
-- Datenbank. Diese Regeln erlauben deshalb jedem mit dem
-- oeffentlichen Schluessel, Partien zu lesen und zu aendern -
-- geloescht werden kann nichts.
--
-- Fuer eine oeffentliche Version ist das der naechste sinnvolle
-- Schritt: Zuege in einer Datenbank-Funktion oder Edge Function
-- pruefen und den direkten Schreibzugriff entziehen. Dann kann
-- niemand mehr per Browser-Konsole einen Spielstand faelschen.

drop policy if exists "games_select" on public.games;
create policy "games_select"
  on public.games for select
  using (true);

drop policy if exists "games_insert" on public.games;
create policy "games_insert"
  on public.games for insert
  with check (true);

drop policy if exists "games_update" on public.games;
create policy "games_update"
  on public.games for update
  using (true)
  with check (true);

-- Aufraeumen: Partien, die seit einem Tag niemand mehr angefasst
-- hat, koennen weg. Optional als geplante Aufgabe (pg_cron).
-- delete from public.games where updated_at < now() - interval '1 day';
