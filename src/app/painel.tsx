import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Botao, Campo, Cartao, Legenda, Subtitulo, Tela, Texto } from '@/components/ui';
import {
  AulaEditavel,
  Codigo,
  extrairYoutubeId,
  gerarCodigos,
  lerMetricas,
  listarAulasAdmin,
  listarCodigos,
  Metricas,
  removerAula,
  salvarAula,
  slug,
  souAdmin,
} from '@/lib/admin';
import { cores, espaco, fontes, raio } from '@/lib/theme';
import { AbaAgenda, AbaMesa } from '@/components/PainelAgendaMesa';

type Aba = 'numeros' | 'aulas' | 'codigos' | 'agenda' | 'mesa';

export default function Painel() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [aba, setAba] = useState<Aba>('numeros');

  useEffect(() => {
    souAdmin().then(setAdmin).catch(() => setAdmin(false));
  }, []);

  if (admin === null) return <Tela>{<ActivityIndicator color={cores.petroleo} />}</Tela>;
  if (!admin) {
    return (
      <Tela>
        <Texto>Esta área é só para a administração do app.</Texto>
        <Botao variante="secundario" titulo="Voltar" onPress={() => router.back()} />
      </Tela>
    );
  }

  return (
    <Tela>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.abas} accessibilityRole="tablist">
        {(
          [
            ['numeros', 'Números'],
            ['aulas', 'Aulas'],
            ['codigos', 'Códigos'],
            ['agenda', 'Agenda'],
            ['mesa', 'Mesa'],
          ] as [Aba, string][]
        ).map(([id, rotulo]) => (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: aba === id }}
            onPress={() => setAba(id)}
            style={[s.aba, aba === id && s.abaSel]}
          >
            <Text style={[s.abaTexto, aba === id && { color: cores.areia }]}>{rotulo}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {aba === 'numeros' && <Numeros />}
      {aba === 'aulas' && <Aulas />}
      {aba === 'codigos' && <Codigos />}
      {aba === 'agenda' && <AbaAgenda />}
      {aba === 'mesa' && <AbaMesa />}
    </Tela>
  );
}

// ---------------- Números ----------------
function Numeros() {
  const [m, setM] = useState<Metricas | null>(null);
  const [erro, setErro] = useState(false);
  const carregar = useCallback(() => {
    lerMetricas()
      .then((r) => {
        setErro(false);
        setM(r);
      })
      .catch(() => setErro(true));
  }, []);
  useEffect(carregar, [carregar]);

  if (erro) return <Texto>Não foi possível carregar os números agora.</Texto>;
  if (!m) return <ActivityIndicator color={cores.petroleo} />;

  const pagantes = m.assinantes_loja + m.assinantes_site;
  const base = pagantes + m.testes_encerrados;
  const conversao = base > 0 ? Math.round((pagantes / base) * 100) : 0;

  return (
    <View style={{ gap: espaco.m }}>
      <View style={s.grade}>
        <Numero valor={m.usuarios} rotulo="Cadastros no total" />
        <Numero valor={m.cadastros_7d} rotulo="Novos em 7 dias" />
        <Numero valor={m.testes_ativos} rotulo="Em teste grátis agora" destaque />
        <Numero valor={pagantes} rotulo="Assinantes pagantes" destaque />
        <Numero valor={m.assinantes_loja} rotulo="Pelas lojas (Apple/Google)" />
        <Numero valor={m.assinantes_site} rotulo="Pelo site (Hubla)" />
        <Numero valor={m.inclusos_mesa_plano} rotulo="Inclusos (Mesa e Plano)" />
        <Numero valor={m.codigos_combo_cortesia} rotulo="Por código, combo ou cortesia" />
        <Numero valor={`${conversao}%`} rotulo="Conversão do teste em assinatura" />
        <Numero valor={m.codigos_disponiveis} rotulo="Usos de código disponíveis" />
        <Numero valor={m.registros_diario_7d} rotulo="Registros no diário (7 dias)" />
        <Numero valor={m.checkins_7d} rotulo="Check-ins (7 dias)" />
      </View>
      <Legenda>
        A conversão compara assinantes pagantes com quem já terminou o teste. O painel não mostra o conteúdo do diário de ninguém.
      </Legenda>
      <Botao variante="secundario" titulo="Atualizar" onPress={carregar} />
    </View>
  );
}

function Numero({ valor, rotulo, destaque }: { valor: number | string; rotulo: string; destaque?: boolean }) {
  return (
    <View style={[s.numero, destaque && { backgroundColor: cores.petroleo }]}>
      <Text style={[s.numeroValor, destaque && { color: cores.areia }]}>{valor}</Text>
      <Text style={[s.numeroRotulo, destaque && { color: cores.salvia }]}>{rotulo}</Text>
    </View>
  );
}

// ---------------- Aulas ----------------
const VAZIA: AulaEditavel = { id: '', modulo: 'Aulas', titulo: '', descricao: '', minutos: null, youtube_id: null, ordem: 100, publicada: true };

function Aulas() {
  const [lista, setLista] = useState<AulaEditavel[]>([]);
  const [editando, setEditando] = useState<AulaEditavel | null>(null);
  const [link, setLink] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    listarAulasAdmin().then(setLista).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  function abrir(a: AulaEditavel) {
    setEditando(a);
    setLink(a.youtube_id ? `https://youtu.be/${a.youtube_id}` : '');
  }

  async function salvar() {
    if (!editando || !editando.titulo.trim()) return;
    const yt = link.trim() ? extrairYoutubeId(link) : null;
    if (link.trim() && !yt) {
      Alert.alert('Link do YouTube não reconhecido', 'Cole o link do vídeo (ex.: https://youtu.be/abc123) ou deixe vazio.');
      return;
    }
    setSalvando(true);
    try {
      await salvarAula({ ...editando, id: editando.id || slug(editando.titulo), youtube_id: yt });
      setEditando(null);
      carregar();
    } catch {
      Alert.alert('Não foi possível salvar a aula');
    } finally {
      setSalvando(false);
    }
  }

  async function apagar(a: AulaEditavel) {
    const executar = async () => {
      try {
        await removerAula(a.id);
        setEditando(null);
        carregar();
      } catch {
        Alert.alert('Não foi possível apagar a aula');
      }
    };
    if (Platform.OS === 'web') return executar();
    Alert.alert('Apagar esta aula?', a.titulo, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: executar },
    ]);
  }

  if (editando) {
    return (
      <View style={{ gap: espaco.s }}>
        <Subtitulo>{editando.id ? 'Editar aula' : 'Nova aula'}</Subtitulo>
        <Campo rotulo="Título" value={editando.titulo} onChangeText={(t) => setEditando({ ...editando, titulo: t })} maxLength={120} />
        <Campo rotulo="Módulo (agrupa as aulas)" value={editando.modulo} onChangeText={(t) => setEditando({ ...editando, modulo: t })} maxLength={60} />
        <Campo rotulo="Descrição curta" value={editando.descricao} onChangeText={(t) => setEditando({ ...editando, descricao: t })} multiline maxLength={400} />
        <Campo
          rotulo="Link do vídeo no YouTube (pode ser não listado)"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://youtu.be/..."
        />
        <View style={s.linha2}>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Duração (min)"
              value={editando.minutos ? String(editando.minutos) : ''}
              onChangeText={(t) => setEditando({ ...editando, minutos: Number(t.replace(/\D/g, '')) || null })}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Ordem na lista"
              value={String(editando.ordem)}
              onChangeText={(t) => setEditando({ ...editando, ordem: Number(t.replace(/\D/g, '')) || 0 })}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <View style={s.linha2}>
          <Text style={s.rotuloSwitch}>Publicada (visível no app)</Text>
          <Switch
            value={editando.publicada}
            onValueChange={(v) => setEditando({ ...editando, publicada: v })}
            trackColor={{ true: cores.petroleo, false: cores.linha }}
            thumbColor={cores.branco}
          />
        </View>
        <Botao titulo="Salvar aula" onPress={salvar} carregando={salvando} desativado={!editando.titulo.trim()} />
        <Botao variante="secundario" titulo="Cancelar" onPress={() => setEditando(null)} />
        {!!editando.id && <Botao variante="texto" titulo="Apagar aula" onPress={() => apagar(editando)} />}
      </View>
    );
  }

  return (
    <View style={{ gap: espaco.s }}>
      <Botao titulo="+ Nova aula" onPress={() => abrir({ ...VAZIA, ordem: (lista.at(-1)?.ordem ?? 0) + 10 })} />
      {lista.map((a) => (
        <Cartao key={a.id} onPress={() => abrir(a)} rotulo={`Editar ${a.titulo}`}>
          <Legenda>
            {a.modulo.toUpperCase()} · ORDEM {a.ordem}
          </Legenda>
          <Text style={s.tituloAula}>{a.titulo}</Text>
          <Text style={[s.status, { color: a.youtube_id ? cores.salviaEscura : cores.ambarTerra }]}>
            {!a.publicada ? 'Oculta' : a.youtube_id ? 'Com vídeo' : 'Sem vídeo (aparece "Em breve")'}
          </Text>
        </Cartao>
      ))}
    </View>
  );
}

// ---------------- Códigos ----------------
function Codigos() {
  const [lista, setLista] = useState<Codigo[]>([]);
  const [qtd, setQtd] = useState('10');
  const [dias, setDias] = useState('90');
  const [descricao, setDescricao] = useState('');
  const [gerados, setGerados] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(() => {
    listarCodigos().then(setLista).catch(() => {});
  }, []);
  useEffect(carregar, [carregar]);

  async function gerar() {
    const q = Number(qtd);
    const d = Number(dias);
    if (!(q >= 1 && q <= 1000) || !(d >= 1 && d <= 3650)) {
      Alert.alert('Confira os números', 'Quantidade de 1 a 1000 e dias de 1 a 3650.');
      return;
    }
    setGerando(true);
    try {
      setGerados(await gerarCodigos(q, d, descricao.trim()));
      carregar();
    } catch {
      Alert.alert('Não foi possível gerar os códigos');
    } finally {
      setGerando(false);
    }
  }

  async function compartilhar() {
    const texto = gerados.join('\n');
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(texto);
      Alert.alert('Códigos copiados');
      return;
    }
    await Share.share({ message: texto });
  }

  return (
    <View style={{ gap: espaco.s }}>
      <Texto>
        Cada código libera o app por um número de dias, uma vez por pessoa. Use para o combo livro + app, presentes e parcerias.
      </Texto>
      <View style={s.linha2}>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Quantidade" value={qtd} onChangeText={setQtd} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Dias de acesso" value={dias} onChangeText={setDias} keyboardType="number-pad" />
        </View>
      </View>
      <Campo rotulo="Descrição (só para você)" value={descricao} onChangeText={setDescricao} placeholder="Ex.: Black November, combo livro + app" maxLength={120} />
      <Botao titulo="Gerar códigos" onPress={gerar} carregando={gerando} />

      {gerados.length > 0 && (
        <Cartao escuro>
          <Text style={s.geradosTitulo}>{gerados.length} código(s) gerado(s)</Text>
          <Text selectable style={s.gerados}>
            {gerados.join('   ')}
          </Text>
          <Botao titulo={Platform.OS === 'web' ? 'Copiar todos' : 'Compartilhar'} onPress={compartilhar} style={{ backgroundColor: cores.ambar }} corTexto={cores.petroleoProfundo} />
        </Cartao>
      )}

      <Subtitulo>Códigos criados</Subtitulo>
      {lista.length === 0 && <Legenda>Nenhum código ainda.</Legenda>}
      {lista.slice(0, 100).map((c) => (
        <View key={c.codigo} style={s.codigoLinha}>
          <Text selectable style={s.codigo}>
            {c.codigo}
          </Text>
          <Text style={s.codigoInfo}>
            {c.dias} dias · {c.usos}/{c.usos_max} usado{c.descricao ? ` · ${c.descricao}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  abas: { flexDirection: 'row', gap: 6, padding: 4 },
  aba: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.areiaClara },
  abaSel: { backgroundColor: cores.petroleo },
  abaTexto: { fontFamily: fontes.textoForte, fontSize: 14, color: cores.petroleo },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numero: { flexBasis: '47%', flexGrow: 1, backgroundColor: cores.areiaClara, borderRadius: raio.m, borderWidth: 1, borderColor: cores.linha, padding: 14, gap: 2 },
  numeroValor: { fontFamily: fontes.titulo, fontSize: 28, color: cores.petroleo },
  numeroRotulo: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.grafiteSuave },
  linha2: { flexDirection: 'row', gap: espaco.s, alignItems: 'center' },
  rotuloSwitch: { flex: 1, fontFamily: fontes.textoMedio, fontSize: 15, color: cores.petroleo },
  tituloAula: { fontFamily: fontes.titulo, fontSize: 17, color: cores.petroleo },
  status: { fontFamily: fontes.textoMedio, fontSize: 13 },
  geradosTitulo: { fontFamily: fontes.textoForte, color: cores.areia, fontSize: 15 },
  gerados: { fontFamily: fontes.textoMedio, color: cores.areia, fontSize: 15, lineHeight: 26 },
  codigoLinha: { borderBottomWidth: 1, borderBottomColor: cores.linha, paddingVertical: 8 },
  codigo: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.petroleo, letterSpacing: 1 },
  codigoInfo: { fontFamily: fontes.texto, fontSize: 13, color: cores.grafiteSuave },
});
