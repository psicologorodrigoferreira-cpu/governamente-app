// Exclui a conta de quem está logado e, em cascata, o diário, check-ins e progresso.
// Exigência da Apple (exclusão de conta pelo próprio app) e direito previsto na LGPD.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('método não permitido', { status: 405, headers: cors });

  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!jwt) return new Response('não autorizado', { status: 401, headers: cors });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) return new Response('não autorizado', { status: 401, headers: cors });

  const { error: erroExcluir } = await admin.auth.admin.deleteUser(data.user.id);
  if (erroExcluir) {
    console.error('falha ao excluir', erroExcluir.message);
    return new Response('erro', { status: 500, headers: cors });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
});
