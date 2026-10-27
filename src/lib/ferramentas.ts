/** Dados das ferramentas do livro e dos primeiros passos (Supabase ou, no modo demonstração, o aparelho). */
import { supabase } from './supabase';
import { gravarLocal, lerLocal, novoId, usuarioId } from './dados';

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const diaDeHoje = hoje;

// ---------- Primeiros passos ----------
export type Perfil = { foco: string; minutos: number; periodo: 'manha' | 'tarde' | 'noite'; estacao_sugerida: string };

/** Marca que a pessoa pulou a triagem: o Início não a abre de novo (dá para refazer em Conta). */
export const CHAVE_PULOU_TRIAGEM = 'primeiros-passos-pulou';

export async function lerPerfil(): Promise<Perfil | null> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { data } = await supabase.from('perfil').select('foco, minutos, periodo, estacao_sugerida').maybeSingle();
    return (data as Perfil) ?? null;
  }
  return lerLocal<Perfil | null>('perfil', null);
}

export async function salvarPerfil(p: Perfil) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('perfil').upsert({ ...p, usuario_id: uid, atualizado_em: new Date().toISOString() });
    if (error) throw error;
    return;
  }
  await gravarLocal('perfil', p);
}

// ---------- Gratidão ----------
export type Gratidao = { id: string; dia: string; itens: string[] };

export async function listarGratidao(): Promise<Gratidao[]> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { data, error } = await supabase.from('gratidao').select('id, dia, itens').order('dia', { ascending: false }).limit(60);
    if (error) throw error;
    return (data ?? []) as Gratidao[];
  }
  return lerLocal<Gratidao[]>('gratidao', []);
}

export async function salvarGratidao(itens: string[]) {
  const uid = await usuarioId();
  const dia = hoje();
  if (supabase && uid) {
    const { error } = await supabase.from('gratidao').upsert({ usuario_id: uid, dia, itens }, { onConflict: 'usuario_id,dia' });
    if (error) throw error;
    return;
  }
  const atual = (await lerLocal<Gratidao[]>('gratidao', [])).filter((g) => g.dia !== dia);
  await gravarLocal('gratidao', [{ id: novoId(), dia, itens }, ...atual]);
}

// ---------- Matriz de Eisenhower ----------
export type Tarefa = { id: string; texto: string; quadrante: 1 | 2 | 3 | 4; feita: boolean };

export async function listarTarefas(): Promise<Tarefa[]> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { data, error } = await supabase.from('matriz').select('id, texto, quadrante, feita').order('criado_em');
    if (error) throw error;
    return (data ?? []) as Tarefa[];
  }
  return lerLocal<Tarefa[]>('matriz', []);
}

export async function adicionarTarefa(texto: string, quadrante: Tarefa['quadrante']) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('matriz').insert({ usuario_id: uid, texto, quadrante });
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<Tarefa[]>('matriz', []);
  await gravarLocal('matriz', [...atual, { id: novoId(), texto, quadrante, feita: false }]);
}

export async function atualizarTarefa(id: string, mudanca: Partial<Pick<Tarefa, 'quadrante' | 'feita'>>) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('matriz').update(mudanca).eq('id', id);
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<Tarefa[]>('matriz', []);
  await gravarLocal('matriz', atual.map((t) => (t.id === id ? { ...t, ...mudanca } : t)));
}

export async function removerTarefa(id: string) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('matriz').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<Tarefa[]>('matriz', []);
  await gravarLocal('matriz', atual.filter((t) => t.id !== id));
}

export async function limparFeitas() {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('matriz').delete().eq('feita', true);
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<Tarefa[]>('matriz', []);
  await gravarLocal('matriz', atual.filter((t) => !t.feita));
}

// ---------- Plano de constância ----------
export type Constancia = { ancora: string; pratica: string };

export async function lerConstancia(): Promise<{ plano: Constancia | null; dias: string[] }> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const [p, d] = await Promise.all([
      supabase.from('constancia').select('ancora, pratica').maybeSingle(),
      supabase.from('constancia_dias').select('dia').order('dia', { ascending: false }).limit(400),
    ]);
    return { plano: (p.data as Constancia) ?? null, dias: (d.data ?? []).map((x: { dia: string }) => x.dia) };
  }
  return {
    plano: await lerLocal<Constancia | null>('constancia', null),
    dias: await lerLocal<string[]>('constancia-dias', []),
  };
}

export async function salvarConstancia(c: Constancia) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('constancia').upsert({ ...c, usuario_id: uid });
    if (error) throw error;
    return;
  }
  await gravarLocal('constancia', c);
}

export async function marcarDiaConstancia(feito: boolean) {
  const uid = await usuarioId();
  const dia = hoje();
  if (supabase && uid) {
    const { error } = feito
      ? await supabase.from('constancia_dias').upsert({ usuario_id: uid, dia })
      : await supabase.from('constancia_dias').delete().eq('dia', dia);
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<string[]>('constancia-dias', []);
  await gravarLocal('constancia-dias', feito ? Array.from(new Set([dia, ...atual])) : atual.filter((d) => d !== dia));
}

/** Dias seguidos até hoje (ou até ontem, se hoje ainda não foi marcado). */
export function sequencia(dias: string[]): number {
  const marcados = new Set(dias);
  const d = new Date();
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  if (!marcados.has(fmt(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (marcados.has(fmt(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
