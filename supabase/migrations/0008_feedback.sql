-- Formulário de feedback dos testadores (app.governamente.com.br/feedback).
-- Qualquer pessoa envia pela função public.enviar_feedback; só o administrador lê.

create table if not exists public.feedbacks (
  id bigint generated always as identity primary key,
  nome text,
  contato text,
  aparelho text,
  dias_uso text,
  nota smallint check (nota between 0 and 10),
  facilidade smallint check (facilidade between 1 and 5),
  favoritas text[] not null default '{}',
  confuso text,
  erro text,
  falta text,
  preco text,
  pode_contatar boolean not null default false,
  usuario_id uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now()
);

alter table public.feedbacks enable row level security;
drop policy if exists "admin lê feedbacks" on public.feedbacks;
create policy "admin lê feedbacks" on public.feedbacks for select using (public.sou_admin());

create or replace function public.enviar_feedback(p jsonb)
returns text language plpgsql security definer set search_path = public
as $$

begin
  if p->>'nota' is null then raise exception 'nota obrigatória'; end if;
  insert into public.feedbacks (nome, contato, aparelho, dias_uso, nota, facilidade, favoritas, confuso, erro, falta, preco, pode_contatar, usuario_id)
  values (
    left(nullif(trim(p->>'nome'), ''), 120),
    left(nullif(trim(p->>'contato'), ''), 120),
    left(nullif(trim(p->>'aparelho'), ''), 60),
    left(nullif(trim(p->>'dias_uso'), ''), 30),
    (p->>'nota')::smallint,
    nullif(p->>'facilidade', '')::smallint,
    coalesce((select array_agg(left(x, 40)) from (select jsonb_array_elements_text(p->'favoritas') x limit 20) s), '{}'),
    left(nullif(trim(p->>'confuso'), ''), 2000),
    left(nullif(trim(p->>'erro'), ''), 2000),
    left(nullif(trim(p->>'falta'), ''), 2000),
    left(nullif(trim(p->>'preco'), ''), 30),
    coalesce((p->>'pode_contatar')::boolean, false),
    auth.uid()
  );
  return 'ok';
end $$;

revoke all on function public.enviar_feedback(jsonb) from public;
grant execute on function public.enviar_feedback(jsonb) to anon, authenticated;
