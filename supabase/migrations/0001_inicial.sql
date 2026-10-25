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
create or replace function public.meu_acesso()
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
