// Recebe avisos do RevenueCat (assinaturas da App Store e do Google Play)
// e registra no banco, para o painel contar assinantes e as aulas liberarem.
// Variável (Supabase → Edge Functions → Secrets):
//   REVENUECAT_WEBHOOK_AUTH  o mesmo texto colocado em "Authorization header" no webhook do RevenueCat
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

function igual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  const esperado = Deno.env.get('REVENUECAT_WEBHOOK_AUTH') ?? '';
  const recebido = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!esperado || !igual(recebido, esperado.replace(/^Bearer\s+/i, ''))) {
    return new Response('não autorizado', { status: 401 });
  }

  let corpo: any;
  try {
    corpo = await req.json();
  } catch {
    return new Response('json inválido', { status: 400 });
  }
  const ev = corpo?.event ?? {};
  const tipo: string = ev.type ?? '';
  if (tipo === 'TEST') return new Response('ok', { status: 200 });

  // O app identifica a pessoa no RevenueCat pelo id do usuário do Supabase.
  const ids: string[] = [ev.app_user_id, ev.original_app_user_id, ...(ev.aliases ?? [])].filter(
    (x: unknown) => typeof x === 'string' && UUID.test(x as string),
  );
  if (ids.length === 0) return new Response('ignorado', { status: 200 });

  let email: string | null = null;
  for (const id of ids) {
    const { data } = await supabase.auth.admin.getUserById(id);
    if (data?.user?.email) {
      email = data.user.email.toLowerCase();
      break;
    }
  }
  if (!email) return new Response('ignorado', { status: 200 });

  const expiraMs = typeof ev.expiration_at_ms === 'number' ? ev.expiration_at_ms : null;
  const expira_em = expiraMs ? new Date(expiraMs).toISOString() : null;
  // Cancelamento mantém o acesso até o fim do período pago; expiração encerra.
  const ativo = tipo === 'EXPIRATION' ? false : expiraMs ? expiraMs > Date.now() : true;

  const { error } = await supabase.from('acessos').upsert(
    {
      email,
      origem: 'loja',
      ativo,
      expira_em,
      ref_externa: ev.product_id ?? null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'email,origem' },
  );
  if (error) {
    console.error('erro ao gravar acesso da loja', error.message);
    return new Response('erro', { status: 500 }); // o RevenueCat tenta de novo
  }
  return new Response('ok', { status: 200 });
});
