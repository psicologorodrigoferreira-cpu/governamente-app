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
