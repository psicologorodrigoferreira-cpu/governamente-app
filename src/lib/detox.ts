/**
 * Detox Digital: progresso dos 5 dias, tempo de tela registrado e revisão semanal.
 * Grava no Supabase; se as tabelas ainda não existirem (ou no modo demonstração), grava no aparelho.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { gravarLocal, lerLocal, usuarioId } from './dados';
import { diaDeHoje } from './ferramentas';

export type DadosDia = {
  gatilhos?: string[];
  apps?: string[];
  marcados?: string[]; // ids dos itens marcados do checklist
  silenciados?: number;
  reflexao?: string;
};

export type DiaConcluido = { dia: number; concluido_em: string; dados: DadosDia };
export type TempoTela = { dia: string; minutos: number };

let semTabelas = false;
const tabelaAusente = (e: { code?: string } | null) => !!e && (e.code === '42P01' || e.code === 'PGRST205');

async function nuvem(): Promise<string | null> {
  if (semTabelas || !supabase) return null;
  return usuarioId();
}

// ---------- Progresso ----------
export async function listarDetox(): Promise<DiaConcluido[]> {
  const uid = await nuvem();
  if (supabase && uid) {
    const { data, error } = await supabase.from('detox_progresso').select('dia, concluido_em, dados').order('dia');
    if (!error) return (data ?? []) as DiaConcluido[];
    if (tabelaAusente(error)) semTabelas = true;
    else throw error;
  }
  return lerLocal<DiaConcluido[]>('detox', []);
}

export async function concluirDia(dia: number, dados: DadosDia) {
  const concluido_em = new Date().toISOString();
  const uid = await nuvem();
  if (supabase && uid) {
    const { error } = await supabase
      .from('detox_progresso')
      .upsert({ usuario_id: uid, dia, dados, concluido_em }, { onConflict: 'usuario_id,dia' });
    if (!error) return;
    if (tabelaAusente(error)) semTabelas = true;
    else throw error;
  }
  const atual = (await lerLocal<DiaConcluido[]>('detox', [])).filter((d) => d.dia !== dia);
  await gravarLocal('detox', [...atual, { dia, concluido_em, dados }].sort((a, b) => a.dia - b.dia));
}

/** Recomeçar a trilha (os registros de tempo de tela continuam). */
export async function recomecarDetox() {
  const uid = await nuvem();
  if (supabase && uid) {
    const { error } = await supabase.from('detox_progresso').delete().gte('dia', 1);
    if (error && !tabelaAusente(error)) throw error;
  }
  await gravarLocal('detox', []);
}

// ---------- Tempo de tela ----------
export async function listarTempoTela(): Promise<TempoTela[]> {
  const uid = await nuvem();
  if (supabase && uid) {
    const { data, error } = await supabase.from('tempo_tela').select('dia, minutos').order('dia', { ascending: false }).limit(120);
    if (!error) return (data ?? []) as TempoTela[];
    if (tabelaAusente(error)) semTabelas = true;
    else throw error;
  }
  return lerLocal<TempoTela[]>('tempo-tela', []);
}

export async function salvarTempoTela(dia: string, minutos: number) {
  const uid = await nuvem();
  if (supabase && uid) {
    const { error } = await supabase.from('tempo_tela').upsert({ usuario_id: uid, dia, minutos }, { onConflict: 'usuario_id,dia' });
    if (!error) return;
    if (tabelaAusente(error)) semTabelas = true;
    else throw error;
  }
  const atual = (await lerLocal<TempoTela[]>('tempo-tela', [])).filter((t) => t.dia !== dia);
  await gravarLocal('tempo-tela', [{ dia, minutos }, ...atual].sort((a, b) => b.dia.localeCompare(a.dia)));
}

// ---------- Estado da trilha ----------
const diaLocal = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export type EstadoDetox = {
  concluidos: number[];
  /** Próximo dia a fazer (null quando terminou). */
  proximo: number | null;
  /** O próximo dia só abre amanhã (um ajuste por dia). */
  liberaAmanha: boolean;
  terminou: boolean;
  /** Já fez algum dia hoje. */
  fezHoje: boolean;
};

export function estadoDetox(lista: DiaConcluido[]): EstadoDetox {
  const concluidos = lista.map((d) => d.dia).sort((a, b) => a - b);
  const hoje = diaDeHoje();
  const fezHoje = lista.some((d) => diaLocal(d.concluido_em) === hoje);
  const proximo = [1, 2, 3, 4, 5].find((n) => !concluidos.includes(n)) ?? null;
  const anterior = proximo ? lista.find((d) => d.dia === proximo - 1) : undefined;
  const liberaAmanha = !!anterior && diaLocal(anterior.concluido_em) >= hoje;
  return { concluidos, proximo, liberaAmanha, terminou: proximo === null, fezHoje };
}

export function diaLiberado(n: number, e: EstadoDetox, livre = false) {
  if (livre || e.concluidos.includes(n)) return true;
  return e.proximo === n && !e.liberaAmanha;
}

// ---------- Números ----------
export const formatarMinutos = (m: number) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`;
};

/** Ponto de partida: o registro do dia 1 (ou o mais antigo). */
export function pontoDePartida(tempos: TempoTela[], lista: DiaConcluido[]): TempoTela | undefined {
  const d1 = lista.find((d) => d.dia === 1);
  if (d1) {
    const dia = diaLocal(d1.concluido_em);
    const doDia = tempos.filter((t) => t.dia <= dia).sort((a, b) => b.dia.localeCompare(a.dia))[0];
    if (doDia) return doDia;
  }
  return [...tempos].sort((a, b) => a.dia.localeCompare(b.dia))[0];
}

export function variacao(base?: number, atual?: number) {
  if (!base || atual === undefined) return null;
  return Math.round(((atual - base) / base) * 100);
}

// ---------- Pausa do impulso (só no aparelho) ----------
export const contarPausas = () => lerLocal<number>('detox-pausas', 0);
export async function registrarPausa() {
  const n = (await contarPausas()) + 1;
  await gravarLocal('detox-pausas', n);
  return n;
}

// ---------- Revisão semanal ----------
const ID_REVISAO = 'gm-detox-revisao';
export type Revisao = { ativo: boolean; diaSemana: number; hora: number }; // diaSemana: 1 = domingo
export const lerRevisao = () => lerLocal<Revisao>('detox-revisao', { ativo: false, diaSemana: 1, hora: 19 });

/** Agenda (ou cancela) o lembrete semanal. Devolve false se não houver permissão. */
export async function aplicarRevisao(r: Revisao): Promise<boolean> {
  await gravarLocal('detox-revisao', r);
  if (Platform.OS === 'web') return true;
  await Notifications.cancelScheduledNotificationAsync(ID_REVISAO).catch(() => {});
  if (!r.ativo) return true;
  if (!(await Notifications.getPermissionsAsync()).granted) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: ID_REVISAO,
    content: {
      title: 'Revisão do Detox Digital',
      body: 'Cinco minutos: registre o tempo de tela e veja se algum app voltou para a tela inicial.',
      data: { url: '/detox' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: r.diaSemana,
      hour: r.hora,
      minute: 0,
      ...(Platform.OS === 'android' ? { channelId: 'lembretes' } : {}),
    },
  });
  return true;
}
