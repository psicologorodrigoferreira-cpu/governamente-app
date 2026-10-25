/** Testes, agenda ao vivo e Área do Tripulante. */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { gravarLocal, lerLocal, novoId, usuarioId } from './dados';
import type { Resultado } from '@/content/testes';

// ---------------- Resultados dos testes ----------------
export type ResultadoSalvo = { id: string; teste_id: string; resultado: Resultado; criado_em: string };

export async function listarResultados(): Promise<ResultadoSalvo[]> {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from('resultados_testes')
      .select('id, teste_id, resultado, criado_em')
      .order('criado_em', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as ResultadoSalvo[];
  }
  return lerLocal<ResultadoSalvo[]>('resultados', []);
}

export async function salvarResultado(r: Resultado) {
  const uid = await usuarioId();
  if (supabase && uid) {
    const { error } = await supabase.from('resultados_testes').insert({ usuario_id: uid, teste_id: r.teste_id, resultado: r });
    if (error) throw error;
    return;
  }
  const atual = await lerLocal<ResultadoSalvo[]>('resultados', []);
  await gravarLocal('resultados', [{ id: novoId(), teste_id: r.teste_id, resultado: r, criado_em: new Date().toISOString() }, ...atual]);
}

// ---------------- Configurações ----------------
export async function lerConfiguracoes(): Promise<Record<string, string>> {
  const padrao = { travessia_nome: 'Travessia 01', travessia_inicio: '2026-12-01', travessia_semanas: '26' };
  if (!supabase) return padrao;
  const { data } = await supabase.from('configuracoes').select('chave, valor');
  const r: Record<string, string> = { ...padrao };
  (data ?? []).forEach((c: { chave: string; valor: string }) => (r[c.chave] = c.valor));
  return r;
}

export async function salvarConfiguracao(chave: string, valor: string) {
  const { error } = await supabase!.from('configuracoes').upsert({ chave, valor, atualizado_em: new Date().toISOString() });
  if (error) throw error;
}

// ---------------- Agenda ----------------
export type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'live' | 'generosidade' | 'mesa' | 'outro';
  dias_semana: number[]; // 1 = domingo … 7 = sábado
  hora: string; // HH:MM ou HH:MM:SS
  duracao_min: number;
  link: string | null;
  publico: 'todos' | 'mesa';
  inicio: string | null;
  fim: string | null;
  ativo: boolean;
  ordem: number;
};

const EVENTOS_DEMO: Evento[] = [
  { id: 'demo-live', titulo: 'Live GovernaMente', descricao: 'Ao vivo no Instagram e no YouTube.', tipo: 'live', dias_semana: [3, 4, 5, 6], hora: '20:00', duracao_min: 60, link: 'https://www.youtube.com/@governamenteoficial', publico: 'todos', inicio: null, fim: null, ativo: true, ordem: 10 },
  { id: 'demo-gen', titulo: 'Grupo da Generosidade', descricao: 'Aula gratuita de regulação emocional pelo Google Meet.', tipo: 'generosidade', dias_semana: [4], hora: '19:00', duracao_min: 120, link: null, publico: 'todos', inicio: null, fim: null, ativo: true, ordem: 20 },
];

export async function listarEventos(): Promise<Evento[]> {
  if (!supabase) return EVENTOS_DEMO;
  const { data, error } = await supabase.from('eventos').select('*').order('ordem');
  if (error) throw error;
  return (data ?? []) as Evento[];
}

export async function salvarEvento(e: Partial<Evento> & { titulo: string }) {
  const { error } = await supabase!.from('eventos').upsert(e);
  if (error) throw error;
}

export async function removerEvento(id: string) {
  const { error } = await supabase!.from('eventos').delete().eq('id', id);
  if (error) throw error;
}

export type Ocorrencia = { evento: Evento; quando: Date };

const hm = (h: string) => h.split(':').map(Number) as [number, number];

/** Próximas ocorrências nos próximos `dias` dias, em ordem. */
export function proximasOcorrencias(eventos: Evento[], dias = 14, agora = new Date()): Ocorrencia[] {
  const lista: Ocorrencia[] = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(agora);
    d.setDate(d.getDate() + i);
    const dataStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    for (const e of eventos) {
      if (!e.ativo) continue;
      if (e.inicio && dataStr < e.inicio) continue;
      if (e.fim && dataStr > e.fim) continue;
      if (!e.dias_semana.includes(d.getDay() + 1)) continue;
      const [h, m] = hm(e.hora);
      const quando = new Date(d);
      quando.setHours(h, m, 0, 0);
      const fim = new Date(quando.getTime() + e.duracao_min * 60000);
      if (fim < agora) continue;
      lista.push({ evento: e, quando });
    }
  }
  return lista.sort((a, b) => a.quando.getTime() - b.quando.getTime());
}

export const acontecendoAgora = (o: Ocorrencia, agora = new Date()) =>
  o.quando <= agora && agora.getTime() < o.quando.getTime() + o.evento.duracao_min * 60000;

/** Lembretes da agenda: 15 minutos antes, toda semana, nos dias do evento. */
export async function lerLembretesAgenda(): Promise<string[]> {
  return lerLocal<string[]>('agenda-lembretes', []);
}

export async function definirLembreteEvento(e: Evento, ligar: boolean): Promise<boolean> {
  const atuais = await lerLembretesAgenda();
  const ids = [1, 2, 3, 4, 5, 6, 7].map((d) => `gm-evento-${e.id}-${d}`);
  if (Platform.OS !== 'web') {
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  }
  if (!ligar) {
    await gravarLocal('agenda-lembretes', atuais.filter((x) => x !== e.id));
    return true;
  }
  if (Platform.OS === 'web') return false;
  if (!(await Notifications.getPermissionsAsync()).granted) {
    const p = await Notifications.requestPermissionsAsync();
    if (!p.granted) return false;
  }
  const [h, m] = hm(e.hora);
  let hora = h;
  let minuto = m - 15;
  let deslocaDia = 0;
  if (minuto < 0) {
    minuto += 60;
    hora -= 1;
    if (hora < 0) {
      hora = 23;
      deslocaDia = -1;
    }
  }
  for (const d of e.dias_semana) {
    const dia = ((d - 1 + deslocaDia + 7) % 7) + 1;
    await Notifications.scheduleNotificationAsync({
      identifier: `gm-evento-${e.id}-${d}`,
      content: { title: `Em 15 minutos: ${e.titulo}`, body: e.descricao || 'Toque para ver os detalhes.', data: { url: e.publico === 'mesa' ? '/tripulante' : '/agenda' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: dia,
        hour: hora,
        minute: minuto,
        ...(Platform.OS === 'android' ? { channelId: 'lembretes' } : {}),
      },
    });
  }
  await gravarLocal('agenda-lembretes', Array.from(new Set([...atuais, e.id])));
  return true;
}

// ---------------- Área do Tripulante ----------------
export async function souTripulante(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.rpc('sou_tripulante');
  return data === true;
}

export type Gravacao = { id: string; titulo: string; descricao: string; semana: number | null; data: string | null; youtube_id: string };

export async function listarGravacoes(): Promise<Gravacao[]> {
  const { data, error } = await supabase!
    .from('gravacoes')
    .select('id, titulo, descricao, semana, data, youtube_id')
    .order('semana', { ascending: false, nullsFirst: false })
    .order('data', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Gravacao[];
}

export async function salvarGravacao(g: Omit<Gravacao, 'id'> & { id?: string }) {
  const { error } = await supabase!.from('gravacoes').upsert(g);
  if (error) throw error;
}

export async function removerGravacao(id: string) {
  const { error } = await supabase!.from('gravacoes').delete().eq('id', id);
  if (error) throw error;
}

export async function listarTemasSemana(): Promise<Record<number, string>> {
  const { data } = await supabase!.from('travessia_semanas').select('semana, tema');
  const r: Record<number, string> = {};
  (data ?? []).forEach((s: { semana: number; tema: string }) => (r[s.semana] = s.tema));
  return r;
}

export async function salvarTemaSemana(semana: number, tema: string) {
  const { error } = tema.trim()
    ? await supabase!.from('travessia_semanas').upsert({ semana, tema: tema.trim() })
    : await supabase!.from('travessia_semanas').delete().eq('semana', semana);
  if (error) throw error;
}

/** Semana atual da Travessia (0 = ainda não começou; > total = terminou). */
export function semanaDaTravessia(inicio: string, total: number, agora = new Date()) {
  const ini = new Date(`${inicio}T00:00:00`);
  const dias = Math.floor((agora.getTime() - ini.getTime()) / 864e5);
  if (dias < 0) return { semana: 0, faltamDias: -dias, total };
  return { semana: Math.min(total + 1, Math.floor(dias / 7) + 1), faltamDias: 0, total };
}
