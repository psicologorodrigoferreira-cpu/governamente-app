/**
 * Rituais diários (Norte da manhã e Fechamento da noite): gravação, sequência e leituras.
 * Grava no Supabase; se a tabela ainda não existir (ou no modo demonstração), grava no aparelho.
 */
import { supabase } from './supabase';
import { gravarLocal, lerLocal, novoId, usuarioId } from './dados';
import { diaDeHoje, sequencia } from './ferramentas';
import type { Periodo } from '@/content/rituais';

export type Ritual = {
  id: string;
  dia: string; // AAAA-MM-DD, no fuso do aparelho
  periodo: Periodo;
  humor: number; // 1 a 5
  texto: string; // manhã: intenção do dia · noite: uma coisa boa
  cumpriu?: number | null; // noite: 0 não, 1 em parte, 2 sim
  criado_em: string;
};

let semTabela = false;
const tabelaAusente = (e: { code?: string } | null) => !!e && (e.code === '42P01' || e.code === 'PGRST205');

async function nuvem() {
  if (semTabela || !supabase) return null;
  return usuarioId();
}

export async function listarRituais(): Promise<Ritual[]> {
  const uid = await nuvem();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from('rituais')
      .select('id, dia, periodo, humor, texto, cumpriu, criado_em')
      .order('dia', { ascending: false })
      .limit(400);
    if (!error) return (data ?? []) as Ritual[];
    if (tabelaAusente(error)) semTabela = true;
    else throw error;
  }
  return lerLocal<Ritual[]>('rituais', []);
}

export async function salvarRitual(r: Omit<Ritual, 'id' | 'criado_em' | 'dia'> & { dia?: string }) {
  const dia = r.dia ?? diaDeHoje();
  const uid = await nuvem();
  if (supabase && uid) {
    const { error } = await supabase
      .from('rituais')
      .upsert(
        { usuario_id: uid, dia, periodo: r.periodo, humor: r.humor, texto: r.texto, cumpriu: r.cumpriu ?? null },
        { onConflict: 'usuario_id,dia,periodo' },
      );
    if (!error) return;
    if (tabelaAusente(error)) semTabela = true;
    else throw error;
  }
  const atual = (await lerLocal<Ritual[]>('rituais', [])).filter((x) => !(x.dia === dia && x.periodo === r.periodo));
  await gravarLocal('rituais', [{ ...r, dia, id: novoId(), criado_em: new Date().toISOString() }, ...atual]);
}

const ontemStr = () => {
  const d = new Date(Date.now() - 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export type EstadoRituais = {
  manhaHoje?: Ritual;
  noiteHoje?: Ritual;
  noiteOntem?: Ritual;
  /** Dias seguidos com pelo menos um ritual (até hoje, ou até ontem se hoje ainda não teve). */
  sequencia: number;
  /** Melhor sequência já feita. */
  recorde: number;
  /** Últimos 7 dias, do mais antigo para hoje: 0 nenhum, 1 um ritual, 2 os dois. */
  semana: { dia: string; feitos: number }[];
  diasCompletos: number;
  total: number;
};

export function estadoRituais(lista: Ritual[]): EstadoRituais {
  const hoje = diaDeHoje();
  const ontem = ontemStr();
  const porDia = new Map<string, number>();
  lista.forEach((r) => porDia.set(r.dia, (porDia.get(r.dia) ?? 0) + 1));
  const dias = [...porDia.keys()];

  const semana: { dia: string; feitos: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    semana.push({ dia: k, feitos: Math.min(2, porDia.get(k) ?? 0) });
  }

  // Recorde: maior sequência de dias consecutivos.
  const ordenados = [...dias].sort();
  let recorde = 0;
  let atual = 0;
  let anterior: number | null = null;
  for (const d of ordenados) {
    const t = new Date(`${d}T12:00:00`).getTime();
    atual = anterior !== null && Math.round((t - anterior) / 864e5) === 1 ? atual + 1 : 1;
    recorde = Math.max(recorde, atual);
    anterior = t;
  }

  return {
    manhaHoje: lista.find((r) => r.dia === hoje && r.periodo === 'manha'),
    noiteHoje: lista.find((r) => r.dia === hoje && r.periodo === 'noite'),
    noiteOntem: lista.find((r) => r.dia === ontem && r.periodo === 'noite'),
    sequencia: sequencia(dias),
    recorde,
    semana,
    diasCompletos: [...porDia.values()].filter((n) => n >= 2).length,
    total: lista.length,
  };
}

/** Qual ritual sugerir agora: manhã até as 15h (se ainda não fez), depois a noite. */
export function ritualDaVez(e: EstadoRituais, agora = new Date()): Periodo | null {
  const h = agora.getHours();
  if (!e.manhaHoje && h < 15) return 'manha';
  if (!e.noiteHoje && h >= 17) return 'noite';
  if (!e.manhaHoje && h < 17) return 'manha';
  if (!e.noiteHoje) return 'noite';
  return null;
}

/**
 * Uma leitura curta e verdadeira sobre a pessoa, a partir dos rituais.
 * É a "descoberta" que aparece ao fechar o dia (muda conforme os dados).
 */
export function leituraDoDia(lista: Ritual[]): string | null {
  const hoje = diaDeHoje();
  const m = lista.find((r) => r.dia === hoje && r.periodo === 'manha');
  const n = lista.find((r) => r.dia === hoje && r.periodo === 'noite');
  const noites = lista.filter((r) => r.periodo === 'noite');

  // Padrão: noites dos dias em que cumpriu o passo x em que não cumpriu.
  const comPasso = noites.filter((r) => r.cumpriu === 2);
  const semPasso = noites.filter((r) => r.cumpriu === 0);
  if (comPasso.length >= 3 && semPasso.length >= 2) {
    const media = (xs: Ritual[]) => xs.reduce((a, r) => a + r.humor, 0) / xs.length;
    const dif = media(comPasso) - media(semPasso);
    if (dif >= 0.5) return 'Nos dias em que você cumpre o passo possível, a sua noite termina mais leve. O passo pequeno faz diferença.';
  }

  // Padrão: dias com ritual da manhã terminam melhor?
  const diasComManha = new Set(lista.filter((r) => r.periodo === 'manha').map((r) => r.dia));
  const noitesCom = noites.filter((r) => diasComManha.has(r.dia));
  const noitesSem = noites.filter((r) => !diasComManha.has(r.dia));
  if (noitesCom.length >= 3 && noitesSem.length >= 2) {
    const media = (xs: Ritual[]) => xs.reduce((a, r) => a + r.humor, 0) / xs.length;
    if (media(noitesCom) - media(noitesSem) >= 0.5)
      return 'Os dias que começam com o seu norte terminam, em média, mais leves. Vale proteger esse minuto da manhã.';
  }

  if (m && n) {
    if (n.humor > m.humor) return 'Você termina o dia mais leve do que começou. Repare no que ajudou nessa travessia.';
    if (n.humor < m.humor) return 'O dia pesou mais do que quando começou. Tudo bem: perceber isso já é consciência. Descanse bem.';
    return 'Você atravessou o dia no mesmo tom em que começou. Estabilidade também é conquista.';
  }
  return null;
}
