-- GovernaMente: banco completo (0001 + 0002 + 0003 + 0004) em um único arquivo.
-- Cole tudo no Supabase → SQL Editor → New query → Run. Pode rodar de novo sem quebrar.

-- ============ supabase/migrations/0001_inicial.sql ============
-- App GovernaMente: estrutura inicial do banco (Supabase / PostgreSQL)
-- Rode no Supabase: SQL Editor → cole tudo → Run. Pode rodar de novo sem quebrar.

-- ---------- Diário das Emoções ----------
create table if not exists public.diario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  situacao text not null check (char_length(situacao) <= 4000),
  emocoes text[] not null default '{}',
  intensidade smallint not null check (intensidade between 0 and 10),
  pensamento text check (char_length(pensamento) <= 4000),
  acao text not null check (char_length(acao) <= 4000)
);
create index if not exists diario_usuario_idx on public.diario (usuario_id, criado_em desc);

-- ---------- Check-in semanal ----------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  humor smallint not null check (humor between 0 and 4),
  energia smallint not null check (energia between 0 and 4),
  sono smallint not null check (sono between 0 and 4),
  ansiedade smallint not null check (ansiedade between 0 and 4),
  conducao smallint not null check (conducao between 0 and 4),
  nota text check (char_length(nota) <= 2000)
);
create index if not exists checkins_usuario_idx on public.checkins (usuario_id, criado_em desc);

-- ---------- Progresso na trilha ----------
create table if not exists public.progresso (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  estacao_id text not null,
  concluida_em timestamptz not null default now(),
  reflexao text check (char_length(reflexao) <= 4000),
  primary key (usuario_id, estacao_id)
);

-- ---------- Acessos liberados fora da loja ----------
-- Preenchido automaticamente pela Hubla (função hubla-webhook)
-- ou à mão, para cortesias. Liga pelo e-mail da pessoa.
create table if not exists public.acessos (
  id bigint generated always as identity primary key,
  email text not null,
  origem text not null check (origem in ('hubla', 'mesa', 'plano', 'cortesia')),
  ativo boolean not null default true,
  expira_em timestamptz,
  ref_externa text,
  atualizado_em timestamptz not null default now(),
  unique (email, origem)
);
create index if not exists acessos_email_idx on public.acessos (lower(email));

-- ---------- Segurança: cada pessoa só vê o que é seu ----------
alter table public.diario enable row level security;
alter table public.checkins enable row level security;
alter table public.progresso enable row level security;
alter table public.acessos enable row level security; -- sem políticas: só o servidor lê e escreve

do $$
declare t text;
begin
  foreach t in array array['diario', 'checkins', 'progresso'] loop
    execute format('drop policy if exists "dono_select" on public.%I', t);
    execute format('drop policy if exists "dono_insert" on public.%I', t);
    execute format('drop policy if exists "dono_update" on public.%I', t);
    execute format('drop policy if exists "dono_delete" on public.%I', t);
    execute format('create policy "dono_select" on public.%I for select to authenticated using (usuario_id = (select auth.uid()))', t);
    execute format('create policy "dono_insert" on public.%I for insert to authenticated with check (usuario_id = (select auth.uid()))', t);
    execute format('create policy "dono_update" on public.%I for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()))', t);
    execute format('create policy "dono_delete" on public.%I for delete to authenticated using (usuario_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ---------- O app pergunta: "eu tenho acesso?" ----------
drop function if exists public.meu_acesso();
create function public.meu_acesso()
returns table (ativo boolean, origem text)
language sql
stable
security definer
set search_path = public
as $$
  select true, a.origem
  from public.acessos a
  where lower(a.email) = lower((select auth.jwt() ->> 'email'))
    and a.ativo
    and (a.expira_em is null or a.expira_em > now())
  order by case a.origem when 'mesa' then 1 when 'plano' then 2 when 'hubla' then 3 else 4 end
  limit 1;
$$;

revoke all on function public.meu_acesso() from public, anon;
grant execute on function public.meu_acesso() to authenticated;

-- ============ supabase/migrations/0002_teste_gratis.sql ============
-- Teste grátis de 7 dias a partir do cadastro.
-- Guarda só uma "impressão digital" do e-mail (hash), para que excluir e
-- recriar a conta não reinicie o teste, sem manter o e-mail de quem saiu.
-- Rode depois do 0001. Pode rodar de novo sem quebrar.

create table if not exists public.testes_gratis (
  email_hash text primary key,
  iniciado_em timestamptz not null default now()
);
alter table public.testes_gratis enable row level security; -- sem políticas: só o servidor acessa

create or replace function public.hash_email(e text)
returns text
language sql
immutable
as $$ select encode(sha256(convert_to(lower(trim(e)), 'UTF8')), 'hex') $$;

-- Ao criar a conta, registra o início do teste (se este e-mail já testou, mantém a data antiga).
create or replace function public.registrar_teste_gratis()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null then
    insert into public.testes_gratis (email_hash) values (public.hash_email(new.email))
    on conflict (email_hash) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario_teste on auth.users;
create trigger ao_criar_usuario_teste
  after insert on auth.users
  for each row execute function public.registrar_teste_gratis();

-- Quem já tinha conta antes desta mudança também ganha os 7 dias a partir de agora.
insert into public.testes_gratis (email_hash)
select public.hash_email(email) from auth.users where email is not null
on conflict (email_hash) do nothing;

-- Nova versão: devolve também a data de fim. Origem 'teste' = período grátis.
drop function if exists public.meu_acesso();
create function public.meu_acesso()
returns table (ativo boolean, origem text, expira_em timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with eu as (select lower((select auth.jwt() ->> 'email')) as email)
  select x.ativo, x.origem, x.expira_em from (
    select true as ativo, a.origem, a.expira_em,
           case a.origem when 'mesa' then 1 when 'plano' then 2 when 'hubla' then 3 else 4 end as ordem
    from public.acessos a, eu
    where lower(a.email) = eu.email
      and a.ativo
      and (a.expira_em is null or a.expira_em > now())
    union all
    select (t.iniciado_em + interval '7 days') > now(), 'teste', t.iniciado_em + interval '7 days', 9
    from public.testes_gratis t, eu
    where t.email_hash = public.hash_email(eu.email)
  ) x
  order by x.ordem
  limit 1;
$$;

revoke all on function public.meu_acesso() from public, anon;
grant execute on function public.meu_acesso() to authenticated;

-- ============ supabase/migrations/0003_painel_ferramentas.sql ============
-- Painel do Rodrigo, aulas no banco, códigos de acesso, assinaturas da loja
-- e as ferramentas do livro (gratidão, matriz, constância).
-- Rode depois do 0001 e do 0002. Pode rodar de novo sem quebrar.

-- ---------- Novas origens de acesso: 'loja' (Apple/Google via RevenueCat) e 'codigo' ----------
alter table public.acessos drop constraint if exists acessos_origem_check;
alter table public.acessos add constraint acessos_origem_check
  check (origem in ('hubla', 'mesa', 'plano', 'cortesia', 'loja', 'codigo', 'combo'));

-- ---------- Administradores ----------
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
insert into public.admins (email) values ('psicologorodrigoferreira@gmail.com') on conflict do nothing;

create or replace function public.meu_email()
returns text language sql stable as $$ select lower((select auth.jwt() ->> 'email')) $$;

create or replace function public.sou_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins a where lower(a.email) = public.meu_email()) $$;

create or replace function public.tem_acesso_pago()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.acessos a
    where lower(a.email) = public.meu_email() and a.ativo and (a.expira_em is null or a.expira_em > now())
  )
$$;

-- meu_acesso com as novas origens na ordem de prioridade
drop function if exists public.meu_acesso();
create function public.meu_acesso()
returns table (ativo boolean, origem text, expira_em timestamptz)
language sql stable security definer set search_path = public
as $$
  with eu as (select public.meu_email() as email)
  select x.ativo, x.origem, x.expira_em from (
    select true as ativo, a.origem, a.expira_em,
           case a.origem when 'mesa' then 1 when 'plano' then 2 when 'loja' then 3 when 'hubla' then 4
                         when 'combo' then 5 when 'codigo' then 6 else 7 end as ordem
    from public.acessos a, eu
    where lower(a.email) = eu.email and a.ativo and (a.expira_em is null or a.expira_em > now())
    union all
    select (t.iniciado_em + interval '7 days') > now(), 'teste', t.iniciado_em + interval '7 days', 9
    from public.testes_gratis t, eu
    where t.email_hash = public.hash_email(eu.email)
  ) x
  order by x.ordem
  limit 1;
$$;

-- ---------- Aulas (o Rodrigo publica pelo painel) ----------
create table if not exists public.aulas (
  id text primary key,
  modulo text not null default 'Aulas',
  titulo text not null,
  descricao text not null default '',
  minutos smallint,
  youtube_id text,
  ordem int not null default 100,
  publicada boolean not null default true,
  atualizado_em timestamptz not null default now()
);
alter table public.aulas enable row level security;
drop policy if exists "admin_gerencia_aulas" on public.aulas;
create policy "admin_gerencia_aulas" on public.aulas for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

insert into public.aulas (id, modulo, titulo, descricao, ordem) values
  ('boas-vindas', 'Comece aqui', 'Boas-vindas: como usar o app', 'Como aproveitar a trilha, o diário e o check-in no seu dia a dia.', 10),
  ('consciencia', 'Método C.A.I.A.', 'Consciência Emocional na prática', 'Perceber o que você sente antes que a emoção decida por você.', 20),
  ('autorregulacao', 'Método C.A.I.A.', 'Autorregulação Estratégica', 'A pausa, a respiração e a decisão tomada com calma.', 30),
  ('relacional', 'Método C.A.I.A.', 'Inteligência Relacional', 'Escuta ativa e o clima emocional da sua equipe.', 40),
  ('alinhamento', 'Método C.A.I.A.', 'Alinhamento e Constância', 'Coerência entre o que você diz e o que você faz, nos dias comuns.', 50)
on conflict (id) do nothing;

-- Lista para o app: no teste grátis o vídeo vem oculto (cadeado).
create or replace function public.listar_aulas()
returns table (id text, modulo text, titulo text, descricao text, minutos smallint, youtube_id text, tem_video boolean)
language sql stable security definer set search_path = public
as $$
  select a.id, a.modulo, a.titulo, a.descricao, a.minutos,
         case when public.tem_acesso_pago() or public.sou_admin() then a.youtube_id end,
         a.youtube_id is not null and a.youtube_id <> ''
  from public.aulas a
  where a.publicada or public.sou_admin()
  order by a.ordem, a.titulo
$$;
revoke all on function public.listar_aulas() from public, anon;
grant execute on function public.listar_aulas() to authenticated;

-- ---------- Códigos de acesso (combo, presentes, parcerias) ----------
create table if not exists public.codigos (
  codigo text primary key,
  dias int not null check (dias between 1 and 3650),
  usos_max int not null default 1 check (usos_max >= 1),
  usos int not null default 0,
  valido_ate timestamptz,
  descricao text,
  criado_em timestamptz not null default now()
);
alter table public.codigos enable row level security;
drop policy if exists "admin_gerencia_codigos" on public.codigos;
create policy "admin_gerencia_codigos" on public.codigos for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

create table if not exists public.codigos_usados (
  codigo text not null references public.codigos (codigo) on delete cascade,
  email_hash text not null,
  usado_em timestamptz not null default now(),
  primary key (codigo, email_hash)
);
alter table public.codigos_usados enable row level security;

create or replace function public.resgatar_codigo(p_codigo text)
returns table (ok boolean, mensagem text, expira_em timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  c public.codigos%rowtype;
  v_email text := public.meu_email();
  v_fim timestamptz;
  v_atual timestamptz;
begin
  if v_email is null then
    return query select false, 'Entre na sua conta para usar o código.', null::timestamptz; return;
  end if;
  select * into c from public.codigos where codigo = upper(trim(p_codigo)) for update;
  if not found then
    return query select false, 'Código não encontrado. Confira as letras e os números.', null::timestamptz; return;
  end if;
  if c.valido_ate is not null and c.valido_ate < now() then
    return query select false, 'Este código expirou.', null::timestamptz; return;
  end if;
  if exists (select 1 from public.codigos_usados u where u.codigo = c.codigo and u.email_hash = public.hash_email(v_email)) then
    return query select false, 'Você já usou este código.', null::timestamptz; return;
  end if;
  if c.usos >= c.usos_max then
    return query select false, 'Este código já foi usado.', null::timestamptz; return;
  end if;

  select a.expira_em into v_atual from public.acessos a where lower(a.email) = v_email and a.origem = 'codigo';
  v_fim := greatest(coalesce(v_atual, now()), now()) + make_interval(days => c.dias);

  insert into public.acessos (email, origem, ativo, expira_em, ref_externa)
  values (v_email, 'codigo', true, v_fim, c.codigo)
  on conflict (email, origem) do update set ativo = true, expira_em = excluded.expira_em,
    ref_externa = excluded.ref_externa, atualizado_em = now();

  update public.codigos set usos = usos + 1 where codigo = c.codigo;
  insert into public.codigos_usados (codigo, email_hash) values (c.codigo, public.hash_email(v_email));
  return query select true, 'Código ativado! Acesso liberado.', v_fim;
end;
$$;
revoke all on function public.resgatar_codigo(text) from public, anon;
grant execute on function public.resgatar_codigo(text) to authenticated;

-- Gera códigos em lote (só admin). Ex.: select * from gerar_codigos(50, 365, 'Black November');
create or replace function public.gerar_codigos(p_qtd int, p_dias int, p_descricao text default null, p_usos int default 1)
returns setof text
language plpgsql security definer set search_path = public
as $$
declare
  i int;
  v text;
  alfabeto text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if not public.sou_admin() then raise exception 'sem permissão'; end if;
  if p_qtd < 1 or p_qtd > 1000 then raise exception 'quantidade entre 1 e 1000'; end if;
  for i in 1..p_qtd loop
    loop
      v := 'GM-' || (select string_agg(substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1), '')
                     from generate_series(1, 6));
      exit when not exists (select 1 from public.codigos where codigo = v);
    end loop;
    insert into public.codigos (codigo, dias, usos_max, descricao) values (v, p_dias, p_usos, p_descricao);
    return next v;
  end loop;
end;
$$;
revoke all on function public.gerar_codigos(int, int, text, int) from public, anon;
grant execute on function public.gerar_codigos(int, int, text, int) to authenticated;

-- ---------- Números do painel (só admin) ----------
create or replace function public.painel_metricas()
returns jsonb
language plpgsql stable security definer set search_path = public, auth
as $$
declare r jsonb;
begin
  if not public.sou_admin() then raise exception 'sem permissão'; end if;
  select jsonb_build_object(
    'usuarios', (select count(*) from auth.users),
    'cadastros_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'cadastros_30d', (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'testes_ativos', (select count(*) from public.testes_gratis where iniciado_em > now() - interval '7 days'),
    'testes_encerrados', (select count(*) from public.testes_gratis where iniciado_em <= now() - interval '7 days'),
    'assinantes_loja', (select count(*) from public.acessos where origem = 'loja' and ativo and (expira_em is null or expira_em > now())),
    'assinantes_site', (select count(*) from public.acessos where origem = 'hubla' and ativo and (expira_em is null or expira_em > now())),
    'inclusos_mesa_plano', (select count(*) from public.acessos where origem in ('mesa', 'plano') and ativo),
    'codigos_combo_cortesia', (select count(*) from public.acessos where origem in ('codigo', 'combo', 'cortesia') and ativo and (expira_em is null or expira_em > now())),
    'codigos_disponiveis', (select coalesce(sum(usos_max - usos), 0) from public.codigos where valido_ate is null or valido_ate > now()),
    'registros_diario_7d', (select count(*) from public.diario where criado_em > now() - interval '7 days'),
    'checkins_7d', (select count(*) from public.checkins where criado_em > now() - interval '7 days')
  ) into r;
  return r;
end;
$$;
revoke all on function public.painel_metricas() from public, anon;
grant execute on function public.painel_metricas() to authenticated;

-- ---------- Excluir a própria conta (exigência da Apple e direito da LGPD) ----------
create or replace function public.excluir_minha_conta()
returns void
language plpgsql security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;

-- ---------- Ferramentas do livro ----------
-- Gratidão: três coisas por dia (cap. 12)
create table if not exists public.gratidao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  dia date not null default (now() at time zone 'America/Sao_Paulo')::date,
  itens text[] not null check (cardinality(itens) between 1 and 3),
  criado_em timestamptz not null default now(),
  unique (usuario_id, dia)
);

-- Matriz de Eisenhower (cap. 7)
create table if not exists public.matriz (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) <= 300),
  quadrante smallint not null check (quadrante between 1 and 4),
  feita boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Plano de constância: hábito âncora + prática, com marcação diária (cap. 12)
create table if not exists public.constancia (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  ancora text not null check (char_length(ancora) <= 200),
  pratica text not null check (char_length(pratica) <= 200),
  criado_em timestamptz not null default now()
);
create table if not exists public.constancia_dias (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  primary key (usuario_id, dia)
);

-- Respostas dos primeiros passos
create table if not exists public.perfil (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  foco text,
  minutos smallint,
  periodo text,
  estacao_sugerida text,
  atualizado_em timestamptz not null default now()
);

alter table public.gratidao enable row level security;
alter table public.matriz enable row level security;
alter table public.constancia enable row level security;
alter table public.constancia_dias enable row level security;
alter table public.perfil enable row level security;

do $$
declare t text;
begin
  foreach t in array array['gratidao', 'matriz', 'constancia', 'constancia_dias', 'perfil'] loop
    execute format('drop policy if exists "dono_tudo" on public.%I', t);
    execute format('create policy "dono_tudo" on public.%I for all to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ============ supabase/migrations/0004_testes_agenda_mesa.sql ============
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
   'live', '{3,4,5,6}', '12:30', 60, 'todos', null, true, 10),
  ('00000000-0000-4000-8000-000000000002', 'Grupo da Generosidade',
   'Aula gratuita de regulação emocional pelo Google Meet, sem venda. Até o fim de novembro.',
   'generosidade', '{4}', '19:00', 120, 'todos', null, true, 20),
  ('00000000-0000-4000-8000-000000000003', 'Encontro da Mesa GovernaMente',
   'Encontro ao vivo da Travessia, só para Tripulantes.',
   'mesa', '{4}', '19:00', 90, 'mesa', '2026-12-01', true, 30)
on conflict (id) do nothing;

-- O Grupo da Generosidade vai até o fim de novembro de 2026 (última quarta: 25/11).
update public.eventos set fim = '2026-11-25'
  where id = '00000000-0000-4000-8000-000000000002' and fim is null;

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
