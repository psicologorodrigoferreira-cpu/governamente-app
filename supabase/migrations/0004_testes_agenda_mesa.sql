-- Testes no app, agenda ao vivo, Área do Tripulante (Mesa) e configurações.
-- Rode depois do 0001, 0002 e 0003. Pode rodar de novo sem quebrar.

-- ---------- Resultados dos testes (só a própria pessoa vê) ----------
create table if not exists public.resultados_testes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  teste_id text not null,
  resultado jsonb not null,
  criado_em timestamptz not null default now()
);
create index if not exists resultados_testes_usuario_idx on public.resultados_testes (usuario_id, criado_em desc);
alter table public.resultados_testes enable row level security;
drop policy if exists "dono_tudo" on public.resultados_testes;
create policy "dono_tudo" on public.resultados_testes for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

-- ---------- Quem é Tripulante da Mesa ----------
create or replace function public.sou_tripulante()
returns boolean language sql stable security definer set search_path = public
as $$
  select public.sou_admin() or exists (
    select 1 from public.acessos a
    where lower(a.email) = public.meu_email() and a.origem = 'mesa' and a.ativo
      and (a.expira_em is null or a.expira_em > now())
  )
$$;
revoke all on function public.sou_tripulante() from public, anon;
grant execute on function public.sou_tripulante() to authenticated;

-- ---------- Configurações simples (data de início da Travessia etc.) ----------
create table if not exists public.configuracoes (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz not null default now()
);
alter table public.configuracoes enable row level security;
drop policy if exists "todos_leem_config" on public.configuracoes;
create policy "todos_leem_config" on public.configuracoes for select to authenticated using (true);
drop policy if exists "admin_gerencia_config" on public.configuracoes;
create policy "admin_gerencia_config" on public.configuracoes for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());
insert into public.configuracoes (chave, valor) values
  ('travessia_nome', 'Travessia 01'),
  ('travessia_inicio', '2026-12-01'),
  ('travessia_semanas', '26')
on conflict (chave) do nothing;

-- ---------- Agenda ao vivo ----------
-- dias_semana: 1 = domingo, 2 = segunda … 7 = sábado. publico: 'todos' ou 'mesa'.
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  tipo text not null default 'outro' check (tipo in ('live', 'generosidade', 'mesa', 'outro')),
  dias_semana smallint[] not null check (cardinality(dias_semana) between 1 and 7),
  hora time not null,
  duracao_min smallint not null default 60,
  link text,
  publico text not null default 'todos' check (publico in ('todos', 'mesa')),
  inicio date,
  fim date,
  ativo boolean not null default true,
  ordem int not null default 100
);
alter table public.eventos enable row level security;
drop policy if exists "ver_eventos" on public.eventos;
create policy "ver_eventos" on public.eventos for select to authenticated
  using (public.sou_admin() or (ativo and (publico = 'todos' or public.sou_tripulante())));
drop policy if exists "admin_gerencia_eventos" on public.eventos;
create policy "admin_gerencia_eventos" on public.eventos for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

-- Eventos iniciais (o Rodrigo ajusta horários e links pelo painel).
insert into public.eventos (id, titulo, descricao, tipo, dias_semana, hora, duracao_min, publico, inicio, ativo, ordem)
values
  ('00000000-0000-4000-8000-000000000001', 'Live GovernaMente',
   'Ao vivo no Instagram e no YouTube: autorregulação emocional para quem empreende.',
   'live', '{3,4,5,6}', '20:00', 60, 'todos', null, false, 10),
  ('00000000-0000-4000-8000-000000000002', 'Grupo da Generosidade',
   'Aula gratuita de regulação emocional pelo Google Meet, sem venda.',
   'generosidade', '{4}', '19:00', 120, 'todos', null, true, 20),
  ('00000000-0000-4000-8000-000000000003', 'Encontro da Mesa GovernaMente',
   'Encontro ao vivo da Travessia, só para Tripulantes.',
   'mesa', '{4}', '19:00', 90, 'mesa', '2026-12-01', true, 30)
on conflict (id) do nothing;

-- ---------- Área do Tripulante ----------
create table if not exists public.gravacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  semana smallint,
  data date,
  youtube_id text not null,
  criado_em timestamptz not null default now()
);
alter table public.gravacoes enable row level security;
drop policy if exists "tripulante_ve_gravacoes" on public.gravacoes;
create policy "tripulante_ve_gravacoes" on public.gravacoes for select to authenticated using (public.sou_tripulante());
drop policy if exists "admin_gerencia_gravacoes" on public.gravacoes;
create policy "admin_gerencia_gravacoes" on public.gravacoes for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

create table if not exists public.travessia_semanas (
  semana smallint primary key check (semana between 1 and 52),
  tema text not null
);
alter table public.travessia_semanas enable row level security;
drop policy if exists "tripulante_ve_semanas" on public.travessia_semanas;
create policy "tripulante_ve_semanas" on public.travessia_semanas for select to authenticated using (public.sou_tripulante());
drop policy if exists "admin_gerencia_semanas" on public.travessia_semanas;
create policy "admin_gerencia_semanas" on public.travessia_semanas for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());
