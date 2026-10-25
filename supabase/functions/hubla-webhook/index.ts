// Recebe avisos da Hubla e libera/remove o acesso ao app pelo e-mail do comprador.
// Eventos usados: customer.member_added (libera) e customer.member_removed (remove).
// Variáveis (Supabase → Edge Functions → Secrets):
//   HUBLA_WEBHOOK_TOKEN   token da aba Autenticação do webhook na Hubla
//   HUBLA_PRODUTOS_APP    IDs dos produtos da assinatura do app (separados por vírgula)
//   HUBLA_PRODUTOS_MESA   IDs dos produtos da Mesa GovernaMente
//   HUBLA_PRODUTOS_PLANO  IDs dos produtos do Plano Individual
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const lista = (nome: string) =>
  (Deno.env.get(nome) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function origemDoProduto(ids: string[]): 'hubla' | 'mesa' | 'plano' | null {
  if (ids.some((id) => lista('HUBLA_PRODUTOS_MESA').includes(id))) return 'mesa';
  if (ids.some((id) => lista('HUBLA_PRODUTOS_PLANO').includes(id))) return 'plano';
  if (ids.some((id) => lista('HUBLA_PRODUTOS_APP').includes(id))) return 'hubla';
  return null;
}

function igual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  const esperado = Deno.env.get('HUBLA_WEBHOOK_TOKEN') ?? '';
  const recebido = req.headers.get('x-hubla-token') ?? '';
  if (!esperado || !igual(recebido, esperado)) return new Response('não autorizado', { status: 401 });

  let corpo: any;
  try {
    corpo = await req.json();
  } catch {
    return new Response('json inválido', { status: 400 });
  }

  const tipo: string = corpo?.type ?? '';
  const ev = corpo?.event ?? {};
  const email: string | undefined = ev?.user?.email?.toLowerCase()?.trim();
  const ids: string[] = [ev?.product?.id, ...(ev?.products ?? []).map((p: any) => p?.id)].filter(Boolean);
  const origem = origemDoProduto(ids);

  // Eventos de outros produtos ou sem e-mail: confirma recebimento e ignora.
  if (!email || !origem) return new Response('ignorado', { status: 200 });

  let ativo: boolean | null = null;
  if (tipo === 'customer.member_added') ativo = true;
  if (tipo === 'customer.member_removed') ativo = false;
  if (ativo === null) return new Response('ignorado', { status: 200 });

  const { error } = await supabase.from('acessos').upsert(
    {
      email,
      origem,
      ativo,
      ref_externa: ev?.subscription?.id ?? null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'email,origem' },
  );
  if (error) {
    console.error('erro ao gravar acesso', error.message);
    return new Response('erro', { status: 500 }); // a Hubla tenta de novo
  }
  return new Response('ok', { status: 200 });
});
