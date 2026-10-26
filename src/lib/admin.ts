/** Aulas, painel do Rodrigo e códigos de acesso. */
import { supabase } from './supabase';
import { AULAS } from '@/content/aulas';

export type AulaApp = {
  id: string;
  modulo: string;
  titulo: string;
  descricao: string;
  minutos?: number | null;
  youtube_id?: string | null; // vem vazio no teste grátis
  tem_video: boolean;
};

/** Lista de aulas. No teste grátis o servidor esconde o vídeo. */
export async function listarAulas(): Promise<AulaApp[]> {
  if (!supabase) {
    return AULAS.map((a) => ({ ...a, youtube_id: a.youtubeId, tem_video: !!a.youtubeId }));
  }
  const { data, error } = await supabase.rpc('listar_aulas');
  if (error) throw error;
  return (data ?? []) as AulaApp[];
}

export async function souAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.rpc('sou_admin');
  return data === true;
}

export type Metricas = Record<
  | 'usuarios'
  | 'cadastros_7d'
  | 'cadastros_30d'
  | 'testes_ativos'
  | 'testes_encerrados'
  | 'assinantes_loja'
  | 'assinantes_site'
  | 'inclusos_mesa_plano'
  | 'codigos_combo_cortesia'
  | 'codigos_disponiveis'
  | 'registros_diario_7d'
  | 'checkins_7d',
  number
>;

export async function lerMetricas(): Promise<Metricas> {
  const { data, error } = await supabase!.rpc('painel_metricas');
  if (error) throw error;
  return data as Metricas;
}

export type Testador = { id: number; nome: string; email: string; whatsapp: string | null; criado_em: string };

/** Inscritos na página governamente.com.br/aplicativo/testadores/ (só o admin lê). */
export async function listarTestadores(): Promise<Testador[]> {
  const { data, error } = await supabase!
    .from('testadores')
    .select('id, nome, email, whatsapp, criado_em')
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Testador[];
}

export type AulaEditavel = {
  id: string;
  modulo: string;
  titulo: string;
  descricao: string;
  minutos: number | null;
  youtube_id: string | null;
  ordem: number;
  publicada: boolean;
};

export async function listarAulasAdmin(): Promise<AulaEditavel[]> {
  const { data, error } = await supabase!
    .from('aulas')
    .select('id, modulo, titulo, descricao, minutos, youtube_id, ordem, publicada')
    .order('ordem');
  if (error) throw error;
  return (data ?? []) as AulaEditavel[];
}

export async function salvarAula(a: AulaEditavel) {
  const { error } = await supabase!.from('aulas').upsert({ ...a, atualizado_em: new Date().toISOString() });
  if (error) throw error;
}

export async function removerAula(id: string) {
  const { error } = await supabase!.from('aulas').delete().eq('id', id);
  if (error) throw error;
}

/** Aceita o link inteiro do YouTube ou só o código do vídeo. */
export function extrairYoutubeId(entrada: string): string | null {
  const t = entrada.trim();
  if (!t) return null;
  const m =
    t.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{6,})/) ??
    t.match(/^([A-Za-z0-9_-]{6,})$/);
  return m ? m[1] : null;
}

export function slug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export type Codigo = { codigo: string; dias: number; usos_max: number; usos: number; descricao: string | null; criado_em: string };

export async function listarCodigos(): Promise<Codigo[]> {
  const { data, error } = await supabase!
    .from('codigos')
    .select('codigo, dias, usos_max, usos, descricao, criado_em')
    .order('criado_em', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Codigo[];
}

export async function gerarCodigos(qtd: number, dias: number, descricao: string): Promise<string[]> {
  const { data, error } = await supabase!.rpc('gerar_codigos', { p_qtd: qtd, p_dias: dias, p_descricao: descricao || null });
  if (error) throw error;
  return (data ?? []) as string[];
}

/** Para quem recebeu um código (combo, presente, parceria). */
export async function resgatarCodigo(codigo: string): Promise<{ ok: boolean; mensagem: string }> {
  if (!supabase) return { ok: false, mensagem: 'No modo demonstração os códigos não funcionam.' };
  const { data, error } = await supabase.rpc('resgatar_codigo', { p_codigo: codigo });
  if (error) return { ok: false, mensagem: 'Não foi possível validar agora. Tente de novo.' };
  const linha = Array.isArray(data) ? data[0] : data;
  return { ok: !!linha?.ok, mensagem: linha?.mensagem ?? 'Não foi possível validar o código.' };
}
