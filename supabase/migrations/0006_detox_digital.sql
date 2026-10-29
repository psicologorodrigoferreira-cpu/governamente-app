-- Detox Digital: trilha de 5 dias e registro do tempo de tela.

create table if not exists public.detox_progresso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  dia smallint not null check (dia between 1 and 5),
  dados jsonb not null default '{}'::jsonb,
  concluido_em timestamptz not null default now(),
  unique (usuario_id, dia)
);

create table if not exists public.tempo_tela (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  minutos integer not null check (minutos between 0 and 1440),
  criado_em timestamptz not null default now(),
  unique (usuario_id, dia)
);

alter table public.detox_progresso enable row level security;
alter table public.tempo_tela enable row level security;

do $$
declare t text;
begin
  foreach t in array array['detox_progresso', 'tempo_tela'] loop
    execute format('drop policy if exists "dono_tudo" on public.%I', t);
    execute format('create policy "dono_tudo" on public.%I for all to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()))', t);
  end loop;
end $$;
