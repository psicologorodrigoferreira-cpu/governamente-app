-- Inscrições para o teste fechado do app Android (Google Play).
-- A página governamente.com.br/aplicativo/testadores/ chama a função
-- public.inscrever_testador; ninguém de fora lê a tabela, só o administrador.

create table if not exists public.testadores (
  id bigint generated always as identity primary key,
  nome text not null,
  email text not null unique,
  whatsapp text,
  criado_em timestamptz not null default now()
);

alter table public.testadores enable row level security;

drop policy if exists "admin lê testadores" on public.testadores;
create policy "admin lê testadores" on public.testadores
  for select using (public.sou_admin());

create or replace function public.inscrever_testador(p_nome text, p_email text, p_whatsapp text default null)
returns text language plpgsql security definer set search_path = public
as $$
declare e text := lower(trim(p_email));
begin
  if coalesce(trim(p_nome), '') = '' or length(p_nome) > 120 then
    raise exception 'nome inválido';
  end if;
  if e !~ '^[a-z0-9._%+-]+@(gmail|googlemail)\.com$' then
    raise exception 'use um e-mail @gmail.com';
  end if;
  insert into public.testadores (nome, email, whatsapp)
  values (trim(p_nome), e, nullif(left(trim(coalesce(p_whatsapp, '')), 30), ''))
  on conflict (email) do update set nome = excluded.nome, whatsapp = coalesce(excluded.whatsapp, testadores.whatsapp);
  return 'ok';
end $$;

revoke all on function public.inscrever_testador(text, text, text) from public;
grant execute on function public.inscrever_testador(text, text, text) to anon, authenticated;
