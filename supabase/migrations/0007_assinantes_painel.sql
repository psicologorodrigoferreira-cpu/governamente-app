-- Painel: lista de quem assinou pelas lojas (Apple/Google, via RevenueCat) e pelo site (Hubla)

-- Guarda o último aviso recebido (ex.: CANCELLATION = desligou a renovação) e a loja de origem.
alter table public.acessos add column if not exists ultimo_evento text;
alter table public.acessos add column if not exists loja text;

create or replace function public.painel_assinantes()
returns table (
  email text,
  origem text,
  loja text,
  produto text,
  ativo boolean,
  expira_em timestamptz,
  ultimo_evento text,
  atualizado_em timestamptz
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.sou_admin() then raise exception 'sem permissão'; end if;
  return query
    select a.email, a.origem, a.loja, a.ref_externa, a.ativo and (a.expira_em is null or a.expira_em > now()),
           a.expira_em, a.ultimo_evento, a.atualizado_em
    from public.acessos a
    where a.origem in ('loja', 'hubla')
    order by a.atualizado_em desc;
end;
$$;
revoke all on function public.painel_assinantes() from public, anon;
grant execute on function public.painel_assinantes() to authenticated;
