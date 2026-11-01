-- Rituais diários: Norte da manhã e Fechamento da noite.
create table if not exists public.rituais (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  periodo text not null check (periodo in ('manha', 'noite')),
  humor smallint not null check (humor between 1 and 5),
  texto text not null default '' check (char_length(texto) <= 400),
  cumpriu smallint check (cumpriu between 0 and 2),
  criado_em timestamptz not null default now(),
  unique (usuario_id, dia, periodo)
);
create index if not exists rituais_usuario_idx on public.rituais (usuario_id, dia desc);

alter table public.rituais enable row level security;
drop policy if exists "dono_tudo" on public.rituais;
create policy "dono_tudo" on public.rituais for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
