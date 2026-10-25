/** Abas do painel: Agenda ao vivo e Mesa (Travessia, temas e gravações). */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { Botao, Campo, Cartao, Chip, Legenda, Subtitulo, Texto } from '@/components/ui';
import { extrairYoutubeId } from '@/lib/admin';
import {
  Evento,
  Gravacao,
  lerConfiguracoes,
  listarEventos,
  listarGravacoes,
  listarTemasSemana,
  removerEvento,
  removerGravacao,
  salvarConfiguracao,
  salvarEvento,
  salvarGravacao,
  salvarTemaSemana,
} from '@/lib/ecossistema';
import { cores, espaco, fontes } from '@/lib/theme';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TIPOS: [Evento['tipo'], string][] = [
  ['live', 'Live'],
  ['generosidade', 'Generosidade'],
  ['mesa', 'Mesa'],
  ['outro', 'Outro'],
];

function confirmar(titulo: string, acao: () => void) {
  if (Platform.OS === 'web') return acao();
  Alert.alert(titulo, '', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Apagar', style: 'destructive', onPress: acao },
  ]);
}

const horaValida = (h: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h.trim());
const dataValida = (d: string) => !d.trim() || /^\d{4}-\d{2}-\d{2}$/.test(d.trim());

// ---------------- Agenda ----------------
const NOVO: Partial<Evento> & { titulo: string } = {
  titulo: '',
  descricao: '',
  tipo: 'live',
  dias_semana: [],
  hora: '20:00',
  duracao_min: 60,
  link: '',
  publico: 'todos',
  inicio: null,
  fim: null,
  ativo: true,
  ordem: 100,
};

export function AbaAgenda() {
  const [lista, setLista] = useState<Evento[]>([]);
  const [ed, setEd] = useState<(Partial<Evento> & { titulo: string }) | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    listarEventos().then(setLista).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  async function salvar() {
    if (!ed) return;
    if (!ed.titulo.trim()) return Alert.alert('Dê um título ao evento');
    if (!ed.dias_semana?.length) return Alert.alert('Escolha pelo menos um dia da semana');
    if (!horaValida(String(ed.hora ?? ''))) return Alert.alert('Hora inválida', 'Use o formato 19:00.');
    if (!dataValida(ed.inicio ?? '') || !dataValida(ed.fim ?? '')) return Alert.alert('Data inválida', 'Use o formato 2026-12-01.');
    setSalvando(true);
    try {
      await salvarEvento({
        ...ed,
        titulo: ed.titulo.trim(),
        hora: String(ed.hora).trim(),
        link: ed.link?.trim() || null,
        inicio: ed.inicio?.trim() || null,
        fim: ed.fim?.trim() || null,
      });
      setEd(null);
      carregar();
    } catch {
      Alert.alert('Não foi possível salvar o evento');
    } finally {
      setSalvando(false);
    }
  }

  if (ed) {
    const dias = ed.dias_semana ?? [];
    return (
      <View style={{ gap: espaco.s }}>
        <Subtitulo>{ed.id ? 'Editar evento' : 'Novo evento'}</Subtitulo>
        <Campo rotulo="Título" value={ed.titulo} onChangeText={(t) => setEd({ ...ed, titulo: t })} maxLength={100} />
        <Campo rotulo="Descrição" value={ed.descricao ?? ''} onChangeText={(t) => setEd({ ...ed, descricao: t })} multiline maxLength={300} />
        <Legenda>TIPO</Legenda>
        <View style={s.chips}>
          {TIPOS.map(([id, r]) => (
            <Chip key={id} rotulo={r} ativo={ed.tipo === id} onPress={() => setEd({ ...ed, tipo: id, publico: id === 'mesa' ? 'mesa' : ed.publico })} />
          ))}
        </View>
        <Legenda>DIAS DA SEMANA</Legenda>
        <View style={s.chips}>
          {DIAS.map((d, i) => (
            <Chip
              key={d}
              rotulo={d}
              ativo={dias.includes(i + 1)}
              onPress={() => setEd({ ...ed, dias_semana: dias.includes(i + 1) ? dias.filter((x) => x !== i + 1) : [...dias, i + 1].sort() })}
            />
          ))}
        </View>
        <View style={s.linha2}>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Hora (ex.: 19:00)" value={String(ed.hora ?? '').slice(0, 5)} onChangeText={(t) => setEd({ ...ed, hora: t })} maxLength={5} />
          </View>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Duração (min)"
              value={String(ed.duracao_min ?? 60)}
              onChangeText={(t) => setEd({ ...ed, duracao_min: Number(t.replace(/\D/g, '')) || 60 })}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Campo rotulo="Link (Meet, YouTube, Instagram)" value={ed.link ?? ''} onChangeText={(t) => setEd({ ...ed, link: t })} autoCapitalize="none" autoCorrect={false} />
        <Legenda>QUEM VÊ</Legenda>
        <View style={s.chips}>
          <Chip rotulo="Todos" ativo={ed.publico === 'todos'} onPress={() => setEd({ ...ed, publico: 'todos' })} />
          <Chip rotulo="Só Tripulantes da Mesa" ativo={ed.publico === 'mesa'} onPress={() => setEd({ ...ed, publico: 'mesa' })} />
        </View>
        <View style={s.linha2}>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Começa em (opcional)" value={ed.inicio ?? ''} onChangeText={(t) => setEd({ ...ed, inicio: t })} placeholder="2026-12-01" maxLength={10} />
          </View>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Termina em (opcional)" value={ed.fim ?? ''} onChangeText={(t) => setEd({ ...ed, fim: t })} placeholder="2026-11-25" maxLength={10} />
          </View>
        </View>
        <View style={s.linha2}>
          <Text style={s.rotulo}>Ativo (aparece no app)</Text>
          <Switch value={!!ed.ativo} onValueChange={(v) => setEd({ ...ed, ativo: v })} trackColor={{ true: cores.petroleo, false: cores.linha }} thumbColor={cores.branco} />
        </View>
        <Botao titulo="Salvar evento" onPress={salvar} carregando={salvando} />
        <Botao variante="secundario" titulo="Cancelar" onPress={() => setEd(null)} />
        {!!ed.id && (
          <Botao
            variante="texto"
            titulo="Apagar evento"
            onPress={() =>
              confirmar('Apagar este evento?', async () => {
                await removerEvento(ed.id!).catch(() => {});
                setEd(null);
                carregar();
              })
            }
          />
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: espaco.s }}>
      <Botao titulo="+ Novo evento" onPress={() => setEd({ ...NOVO })} />
      {lista.map((e) => (
        <Cartao key={e.id} onPress={() => setEd({ ...e })} rotulo={`Editar ${e.titulo}`}>
          <Legenda>
            {e.dias_semana.map((d) => DIAS[d - 1]).join(', ')} · {e.hora.slice(0, 5)} · {e.publico === 'mesa' ? 'Só Mesa' : 'Todos'}
          </Legenda>
          <Text style={s.titulo}>{e.titulo}</Text>
          <Text style={[s.status, { color: e.ativo ? cores.salviaEscura : cores.ambarTerra }]}>
            {e.ativo ? (e.link ? 'Ativo, com link' : 'Ativo, sem link') : 'Desativado'}
          </Text>
        </Cartao>
      ))}
    </View>
  );
}

// ---------------- Mesa ----------------
export function AbaMesa() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [temas, setTemas] = useState<Record<number, string>>({});
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [semanaTema, setSemanaTema] = useState('1');
  const [tema, setTema] = useState('');
  const [nova, setNova] = useState({ titulo: '', semana: '', data: '', link: '', descricao: '' });
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => {
    lerConfiguracoes().then(setConfig).catch(() => {});
    listarTemasSemana().then(setTemas).catch(() => {});
    listarGravacoes().then(setGravacoes).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  async function salvarTravessia() {
    if (!dataValida(config.travessia_inicio ?? '')) return Alert.alert('Data inválida', 'Use o formato 2026-12-01.');
    try {
      await salvarConfiguracao('travessia_nome', (config.travessia_nome ?? '').trim() || 'Travessia');
      await salvarConfiguracao('travessia_inicio', (config.travessia_inicio ?? '').trim());
      await salvarConfiguracao('travessia_semanas', String(Number(config.travessia_semanas) || 26));
      setMsg('Travessia salva ✓');
    } catch {
      Alert.alert('Não foi possível salvar');
    }
  }

  async function salvarTema() {
    const n = Number(semanaTema);
    if (!(n >= 1 && n <= 52)) return Alert.alert('Semana entre 1 e 52');
    try {
      await salvarTemaSemana(n, tema);
      setTema('');
      setSemanaTema(String(Math.min(52, n + 1)));
      carregar();
    } catch {
      Alert.alert('Não foi possível salvar o tema');
    }
  }

  async function adicionarGravacao() {
    const yt = extrairYoutubeId(nova.link);
    if (!nova.titulo.trim() || !yt) return Alert.alert('Preencha o título e cole um link do YouTube válido');
    if (!dataValida(nova.data)) return Alert.alert('Data inválida', 'Use o formato 2026-12-02.');
    try {
      await salvarGravacao({
        titulo: nova.titulo.trim(),
        descricao: nova.descricao.trim(),
        semana: Number(nova.semana) || null,
        data: nova.data.trim() || null,
        youtube_id: yt,
      });
      setNova({ titulo: '', semana: '', data: '', link: '', descricao: '' });
      carregar();
    } catch {
      Alert.alert('Não foi possível salvar a gravação');
    }
  }

  return (
    <View style={{ gap: espaco.s }}>
      <Subtitulo>Travessia</Subtitulo>
      <Campo rotulo="Nome" value={config.travessia_nome ?? ''} onChangeText={(t) => setConfig({ ...config, travessia_nome: t })} />
      <View style={s.linha2}>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Início" value={config.travessia_inicio ?? ''} onChangeText={(t) => setConfig({ ...config, travessia_inicio: t })} placeholder="2026-12-01" maxLength={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Semanas" value={config.travessia_semanas ?? '26'} onChangeText={(t) => setConfig({ ...config, travessia_semanas: t })} keyboardType="number-pad" />
        </View>
      </View>
      <Botao titulo="Salvar Travessia" onPress={salvarTravessia} />
      {!!msg && <Legenda>{msg}</Legenda>}

      <Subtitulo>Tema de cada semana</Subtitulo>
      <View style={s.linha2}>
        <View style={{ width: 90 }}>
          <Campo rotulo="Semana" value={semanaTema} onChangeText={(t) => { setSemanaTema(t); setTema(temas[Number(t)] ?? ''); }} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Tema (vazio apaga)" value={tema} onChangeText={setTema} maxLength={120} />
        </View>
      </View>
      <Botao variante="secundario" titulo="Salvar tema" onPress={salvarTema} />
      {Object.entries(temas)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([n, t]) => (
          <Text key={n} style={s.tema}>
            <Text style={{ fontFamily: fontes.textoForte }}>Semana {n}:</Text> {t}
          </Text>
        ))}

      <Subtitulo>Nova gravação</Subtitulo>
      <Texto style={{ color: cores.grafiteSuave }}>Suba no YouTube como “Não listado” e cole o link. Só Tripulantes veem.</Texto>
      <Campo rotulo="Título" value={nova.titulo} onChangeText={(t) => setNova({ ...nova, titulo: t })} maxLength={120} />
      <View style={s.linha2}>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Semana" value={nova.semana} onChangeText={(t) => setNova({ ...nova, semana: t })} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Data" value={nova.data} onChangeText={(t) => setNova({ ...nova, data: t })} placeholder="2026-12-02" maxLength={10} />
        </View>
      </View>
      <Campo rotulo="Link do YouTube" value={nova.link} onChangeText={(t) => setNova({ ...nova, link: t })} autoCapitalize="none" autoCorrect={false} />
      <Campo rotulo="Descrição (opcional)" value={nova.descricao} onChangeText={(t) => setNova({ ...nova, descricao: t })} multiline maxLength={300} />
      <Botao titulo="Adicionar gravação" onPress={adicionarGravacao} />

      {gravacoes.map((g) => (
        <View key={g.id} style={s.grav}>
          <View style={{ flex: 1 }}>
            <Text style={s.titulo}>{g.titulo}</Text>
            <Legenda>{[g.semana ? `Semana ${g.semana}` : null, g.data].filter(Boolean).join(' · ')}</Legenda>
          </View>
          <Text
            style={s.apagar}
            onPress={() =>
              confirmar('Apagar esta gravação?', async () => {
                await removerGravacao(g.id).catch(() => {});
                carregar();
              })
            }
          >
            Apagar
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: espaco.s },
  linha2: { flexDirection: 'row', gap: espaco.s, alignItems: 'center' },
  rotulo: { flex: 1, fontFamily: fontes.textoMedio, fontSize: 15, color: cores.petroleo },
  titulo: { fontFamily: fontes.titulo, fontSize: 17, color: cores.petroleo },
  status: { fontFamily: fontes.textoMedio, fontSize: 13 },
  tema: { fontFamily: fontes.texto, fontSize: 14, color: cores.grafite },
  grav: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: cores.linha, paddingVertical: 8 },
  apagar: { fontFamily: fontes.textoMedio, color: cores.alerta, fontSize: 14 },
});
