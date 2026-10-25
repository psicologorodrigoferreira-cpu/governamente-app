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
