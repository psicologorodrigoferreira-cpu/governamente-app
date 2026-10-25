import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type RegistroDiario = {
  id: string;
  criado_em: string;
  situacao: string;
  emocoes: string[];
  intensidade: number; // 0 a 10
  pensamento?: string;
  acao: string;
};

export type CheckIn = {
  id: string;
  criado_em: string;
  humor: number; // 0 a 4 em todos
  energia: number;
  sono: number;
  ansiedade: number;
  conducao: number;
  nota?: string;
};

const chave = (k: string) => `gm:${k}`;
const novoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

async function lerLocal<T>(k: string, padrao: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(chave(k));
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
}
async function gravarLocal(k: string, v: unknown) {
  try {
    await AsyncStorage.setItem(chave(k), JSON.stringify(v));
  } catch {
    /* sem armazenamento disponível */
  }
}

async function usuarioId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ---------- Diário das Emoções ----------
export async function listarDiario(): Promise<RegistroDiario[]> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from('diario')
      .select('id, criado_em, situacao, emocoes, intensidade, pensamento, acao')
      .order('criado_em', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as RegistroDiario[];
  }
  return lerLocal<RegistroDiario[]>('diario', []);
}

export async function salvarDiario(r: Omit<RegistroDiario, 'id' | 'criado_em'>) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('diario').insert({ ...r, usuario_id: uid });
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<RegistroDiario[]>('diario', []);
  await gravarLocal('diario', [{ ...r, id: novoId(), criado_em: new Date().toISOString() }, ...atual]);
}

export async function apagarDiario(id: string) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('diario').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<RegistroDiario[]>('diario', []);
  await gravarLocal('diario', atual.filter((r) => r.id !== id));
}

// ---------- Check-in semanal ----------
export async function listarCheckins(): Promise<CheckIn[]> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from('checkins')
      .select('id, criado_em, humor, energia, sono, ansiedade, conducao, nota')
      .order('criado_em', { ascending: false })
      .limit(60);
    if (error) throw error;
    return (data ?? []) as CheckIn[];
  }
  return lerLocal<CheckIn[]>('checkins', []);
}

export async function salvarCheckin(c: Omit<CheckIn, 'id' | 'criado_em'>) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('checkins').insert({ ...c, usuario_id: uid });
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<CheckIn[]>('checkins', []);
  await gravarLocal('checkins', [{ ...c, id: novoId(), criado_em: new Date().toISOString() }, ...atual]);
}

/** Check-in desta semana já foi feito? (semana começa na segunda) */
export function checkinFeitoNaSemana(lista: CheckIn[]) {
  const agora = new Date();
  const seg = new Date(agora);
  seg.setHours(0, 0, 0, 0);
  seg.setDate(seg.getDate() - ((seg.getDay() + 6) % 7));
  return lista.some((c) => new Date(c.criado_em) >= seg);
}

// ---------- Progresso na trilha ----------
export async function listarConcluidas(): Promise<string[]> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { data, error } = await supabase.from('progresso').select('estacao_id');
    if (error) throw error;
    return (data ?? []).map((d: { estacao_id: string }) => d.estacao_id);
  }
  return lerLocal<string[]>('progresso', []);
}

export async function marcarConcluida(estacaoId: string, reflexao?: string) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase
      .from('progresso')
      .upsert({ usuario_id: uid, estacao_id: estacaoId, reflexao: reflexao ?? null }, { onConflict: 'usuario_id,estacao_id' });
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<string[]>('progresso', []);
  if (!atual.includes(estacaoId)) await gravarLocal('progresso', [...atual, estacaoId]);
  if (reflexao) {
    const refl = await lerLocal<Record<string, string>>('reflexoes', {});
    await gravarLocal('reflexoes', { ...refl, [estacaoId]: reflexao });
  }
}

export async function lerReflexao(estacaoId: string): Promise<string> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { data } = await supabase.from('progresso').select('reflexao').eq('estacao_id', estacaoId).maybeSingle();
    return (data?.reflexao as string) ?? '';
  }
  const refl = await lerLocal<Record<string, string>>('reflexoes', {});
  return refl[estacaoId] ?? '';
}

export async function limparDadosLocais() {
  const chaves = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('gm:'));
  await AsyncStorage.multiRemove(chaves);
}
