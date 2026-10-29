import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Botao, Campo, Cartao, Chip, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { GraficoTempo, ItemMarcavel, Marcadores, RegistroTempo } from '@/components/detox';
import { diaDetox, GATILHOS } from '@/content/detox';
import {
  aplicarRevisao,
  concluirDia,
  DadosDia,
  DiaConcluido,
  diaLiberado,
  estadoDetox,
  formatarMinutos,
  lerRevisao,
  listarDetox,
  listarTempoTela,
  pontoDePartida,
  Revisao,
  TempoTela,
} from '@/lib/detox';
import { pedirPermissao } from '@/lib/lembretes';
import { souAdmin } from '@/lib/admin';
import { diaDeHoje } from '@/lib/ferramentas';
import { cores, espaco, fontes, raio } from '@/lib/theme';

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HORAS = [8, 12, 19, 21];

export default function DiaDetoxTela() {
  const { n } = useLocalSearchParams<{ n: string }>();
  const d = diaDetox(Number(n));
  const [lista, setLista] = useState<DiaConcluido[]>([]);
  const [tempos, setTempos] = useState<TempoTela[]>([]);
  const [admin, setAdmin] = useState(false);
  const [carregou, setCarregou] = useState(false);
  const [sistema, setSistema] = useState<'iphone' | 'android'>(Platform.OS === 'android' ? 'android' : 'iphone');
  const [dados, setDados] = useState<DadosDia>({ gatilhos: [], apps: ['', '', ''], marcados: [], silenciados: 0, reflexao: '' });
  const [outroGatilho, setOutroGatilho] = useState('');
  const [revisao, setRevisao] = useState<Revisao>({ ativo: true, diaSemana: 1, hora: 19 });
  const [salvando, setSalvando] = useState(false);

  const carregarTempos = useCallback(() => {
    listarTempoTela().then(setTempos).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarTempos();
      Promise.all([listarDetox(), souAdmin().catch(() => false)])
        .then(([l, a]) => {
          setLista(l);
          setAdmin(a);
          const salvo = l.find((x) => x.dia === Number(n));
          if (salvo) setDados((atual) => ({ ...atual, ...salvo.dados, apps: [0, 1, 2].map((i) => salvo.dados.apps?.[i] ?? '') }));
        })
        .catch(() => {})
        .finally(() => setCarregou(true));
    }, [n, carregarTempos, setDados]),
  );

  useEffect(() => {
    lerRevisao().then((r) => setRevisao({ ...r, ativo: true })).catch(() => {});
  }, []);

  if (!d) {
    return (
      <Tela>
        <Texto>Dia não encontrado.</Texto>
      </Tela>
    );
  }

  const e = estadoDetox(lista);
  const feito = e.concluidos.includes(d.numero);
  const liberado = diaLiberado(d.numero, e, admin);
  const base = pontoDePartida(tempos, lista);
  const recente = tempos.find((t) => t.dia === diaDeHoje()) ?? tempos.find((t) => t.dia < diaDeHoje());
  const marcados = dados.marcados ?? [];
  const alternar = (id: string) =>
    setDados({ ...dados, marcados: marcados.includes(id) ? marcados.filter((x) => x !== id) : [...marcados, id] });
  const obrigatoriosOk = (d.acao.itens ?? []).filter((i) => !i.opcional).every((i) => marcados.includes(i.id));

  // O que falta para concluir o dia.
  let falta = '';
  if (d.acao.tipo === 'diagnostico') {
    if (tempos.length === 0) falta = 'Registre o seu tempo de tela.';
    else if ((dados.gatilhos ?? []).length === 0) falta = 'Escolha pelo menos um momento em que você pega o celular no automático.';
  } else if (d.acao.tipo === 'contador') {
    if ((dados.silenciados ?? 0) < 1) falta = 'Marque quantos apps você silenciou.';
  } else if (d.acao.tipo === 'consolidar') {
    if (!recente) falta = 'Registre o tempo de tela de hoje ou de ontem.';
    else if (!obrigatoriosOk) falta = 'Faça as três conferências da revisão.';
  } else if (!obrigatoriosOk) falta = 'Marque os itens para concluir o dia.';

  async function concluir() {
    if (falta) return;
    setSalvando(true);
    try {
      const final: DadosDia = { ...dados, apps: (dados.apps ?? []).map((a) => a.trim()).filter(Boolean), reflexao: dados.reflexao?.trim() };
      await concluirDia(d!.numero, final);
      if (d!.numero === 5) {
        if (revisao.ativo && Platform.OS !== 'web') await pedirPermissao();
        const ok = await aplicarRevisao(revisao);
        if (!ok) Alert.alert('Lembrete desligado', 'Permita notificações do GovernaMente nos ajustes do celular para receber a revisão semanal.');
        router.replace('/detox/concluido');
      } else {
        Alert.alert(`Dia ${d!.numero} concluído`, `Amanhã abre o dia ${d!.numero + 1}. Até lá, registre seu tempo de tela todo dia.`);
        if (router.canGoBack()) router.back();
        else router.replace('/detox');
      }
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  function alternarGatilho(g: string) {
    const atuais = dados.gatilhos ?? [];
    if (atuais.includes(g)) setDados({ ...dados, gatilhos: atuais.filter((x) => x !== g) });
    else if (atuais.length < 3) setDados({ ...dados, gatilhos: [...atuais, g] });
    else Alert.alert('Até 3 momentos', 'Escolha os 3 que mais acontecem. Você pode desmarcar um para trocar.');
  }

  if (carregou && !liberado) {
    return (
      <Tela>
        <Stack.Screen options={{ title: `Dia ${d.numero}` }} />
        <Titulo>Um passo por dia</Titulo>
        <Texto>O dia {d.numero} abre depois que você concluir o dia anterior, no dia seguinte. É assim que o ajuste vira hábito.</Texto>
        <Botao titulo="Voltar para a trilha" onPress={() => router.replace('/detox')} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: `Dia ${d.numero} de 5` }} />
      <Marcadores concluidos={e.concluidos} atual={feito ? null : d.numero} />
      <Legenda>
        DIA {d.numero} · {d.tema.toUpperCase()} · {d.minutos} MIN
      </Legenda>
      <Titulo>{d.titulo}</Titulo>
      {d.porque.map((p, i) => (
        <Texto key={i}>{p}</Texto>
      ))}

      {d.passos && (
        <Cartao>
          <Legenda>COMO FAZER NO SEU CELULAR</Legenda>
          <View style={s.chips}>
            <Chip rotulo="iPhone" ativo={sistema === 'iphone'} onPress={() => setSistema('iphone')} />
            <Chip rotulo="Android" ativo={sistema === 'android'} onPress={() => setSistema('android')} />
          </View>
          {d.passos[sistema].map((p, i) => (
            <View key={i} style={s.passo}>
              <View style={s.passoNum}>
                <Text style={s.passoNumTexto}>{i + 1}</Text>
              </View>
              <Text style={s.passoTexto}>{p}</Text>
            </View>
          ))}
          {d.passos.dica && <Text style={s.dica}>{d.passos.dica}</Text>}
        </Cartao>
      )}

      <Cartao escuro>
        <Legenda style={{ color: cores.salvia }}>AÇÃO DE HOJE</Legenda>
        <Text style={s.acao}>{d.acao.texto}</Text>
      </Cartao>

      {(d.acao.tipo === 'diagnostico' || d.acao.tipo === 'consolidar') && (
        <Cartao>
          <Legenda>{d.acao.tipo === 'diagnostico' ? 'SEU PONTO DE PARTIDA' : 'COMO VOCÊ ESTÁ HOJE'}</Legenda>
          <RegistroTempo tempos={tempos} onSalvo={carregarTempos} />
          {d.acao.tipo === 'consolidar' && base && recente && (
            <Text style={s.comparacao}>
              Início: {formatarMinutos(base.minutos)} · Agora: {formatarMinutos(recente.minutos)}
            </Text>
          )}
          <GraficoTempo tempos={tempos} base={d.acao.tipo === 'consolidar' ? base : undefined} />
        </Cartao>
      )}

      {d.acao.tipo === 'diagnostico' && (
        <>
          <Subtitulo>Os 3 apps que mais te prendem</Subtitulo>
          {[0, 1, 2].map((i) => (
            <Campo
              key={i}
              rotulo={`${i + 1}º app`}
              value={dados.apps?.[i] ?? ''}
              onChangeText={(t) => setDados({ ...dados, apps: (dados.apps ?? ['', '', '']).map((a, j) => (j === i ? t : a)) })}
              placeholder={['Ex.: Instagram', 'Ex.: YouTube', 'Ex.: WhatsApp'][i]}
              maxLength={40}
            />
          ))}
          <Subtitulo>Quando você pega o celular sem decidir?</Subtitulo>
          <Texto style={{ fontSize: 15, color: cores.grafiteSuave }}>
            Pense em ontem e hoje. Escolha até 3 momentos. Os próximos dias miram neles.
          </Texto>
          <View style={s.chips}>
            {[...GATILHOS, ...(dados.gatilhos ?? []).filter((g) => !GATILHOS.includes(g))].map((g) => (
              <Chip key={g} rotulo={g} ativo={(dados.gatilhos ?? []).includes(g)} onPress={() => alternarGatilho(g)} />
            ))}
          </View>
          <View style={s.outro}>
            <View style={{ flex: 1 }}>
              <Campo rotulo="Outro momento" value={outroGatilho} onChangeText={setOutroGatilho} placeholder="Escreva o seu" maxLength={50} />
            </View>
            <Botao
              variante="secundario"
              titulo="Incluir"
              desativado={!outroGatilho.trim()}
              onPress={() => {
                alternarGatilho(outroGatilho.trim());
                setOutroGatilho('');
              }}
              style={{ marginTop: 6, minHeight: 48 }}
            />
          </View>
        </>
      )}

      {d.acao.tipo === 'contador' && (
        <Cartao>
          <Legenda>APPS SILENCIADOS HOJE · META: 3</Legenda>
          <View style={s.contador}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Diminuir"
              onPress={() => setDados({ ...dados, silenciados: Math.max(0, (dados.silenciados ?? 0) - 1) })}
              style={s.contadorBotao}
            >
              <Text style={s.contadorSinal}>−</Text>
            </Pressable>
            <Text style={s.contadorValor} accessibilityLiveRegion="polite">
              {dados.silenciados ?? 0}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Aumentar"
              onPress={() => setDados({ ...dados, silenciados: Math.min(99, (dados.silenciados ?? 0) + 1) })}
              style={s.contadorBotao}
            >
              <Text style={s.contadorSinal}>+</Text>
            </Pressable>
          </View>
          <View style={s.metas}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[s.meta, (dados.silenciados ?? 0) >= i && { backgroundColor: cores.ambar }]} />
            ))}
          </View>
          <Legenda style={{ textAlign: 'center' }}>
            {(dados.silenciados ?? 0) >= 3 ? 'Meta alcançada. Cada um a mais é ganho.' : 'Toque no + a cada app que você silenciar.'}
          </Legenda>
        </Cartao>
      )}

      {d.acao.itens && (
        <View style={{ gap: espaco.s }}>
          {d.acao.tipo === 'consolidar' && <Subtitulo>Sua primeira revisão</Subtitulo>}
          {d.acao.itens.map((i) => (
            <ItemMarcavel key={i.id} texto={i.texto} opcional={i.opcional} marcado={marcados.includes(i.id)} onPress={() => alternar(i.id)} />
          ))}
        </View>
      )}

      {d.acao.tipo === 'consolidar' && (
        <Cartao>
          <Legenda>REVISÃO SEMANAL · 5 MINUTOS</Legenda>
          <ItemMarcavel
            texto="Quero ser lembrado toda semana"
            marcado={revisao.ativo}
            onPress={() => setRevisao({ ...revisao, ativo: !revisao.ativo })}
          />
          {revisao.ativo && (
            <>
              <Text style={s.rotulo}>Em qual dia?</Text>
              <View style={s.chips}>
                {SEMANA.map((nome, i) => (
                  <Chip key={nome} rotulo={nome} ativo={revisao.diaSemana === i + 1} onPress={() => setRevisao({ ...revisao, diaSemana: i + 1 })} />
                ))}
              </View>
              <Text style={s.rotulo}>Em qual horário?</Text>
              <View style={s.chips}>
                {HORAS.map((h) => (
                  <Chip key={h} rotulo={`${h}h`} ativo={revisao.hora === h} onPress={() => setRevisao({ ...revisao, hora: h })} />
                ))}
              </View>
              {Platform.OS === 'web' && <Legenda>Os lembretes chegam no app do celular.</Legenda>}
            </>
          )}
        </Cartao>
      )}

      <Campo
        rotulo={`Para pensar: ${d.reflexao}`}
        value={dados.reflexao ?? ''}
        onChangeText={(t) => setDados({ ...dados, reflexao: t })}
        placeholder="Escreva se quiser (opcional)"
        multiline
        maxLength={600}
      />

      {!!falta && !feito && <Text style={s.falta}>{falta}</Text>}
      <Botao
        titulo={feito ? 'Salvar alterações' : d.numero === 5 ? 'Concluir a trilha' : `Concluir o dia ${d.numero}`}
        onPress={concluir}
        carregando={salvando}
        desativado={!!falta}
      />
      {d.numero > 1 && !feito && (
        <Botao variante="texto" titulo="Precisa de um minuto? Pausa do impulso" onPress={() => router.push('/detox/pausa')} />
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  passo: { flexDirection: 'row', gap: espaco.s, alignItems: 'flex-start' },
  passoNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: cores.salvia, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  passoNumTexto: { fontFamily: fontes.textoForte, fontSize: 12, color: cores.petroleo },
  passoTexto: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.grafite, lineHeight: 22 },
  dica: { fontFamily: fontes.tituloItalico, fontSize: 15, color: cores.ambarTerra, lineHeight: 22 },
  acao: { fontFamily: fontes.titulo, fontSize: 19, color: cores.areia, lineHeight: 26 },
  comparacao: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.petroleo },
  outro: { flexDirection: 'row', gap: espaco.s, alignItems: 'center' },
  contador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco.l, paddingVertical: espaco.s },
  contadorBotao: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: cores.petroleo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorSinal: { fontFamily: fontes.titulo, fontSize: 28, color: cores.petroleo },
  contadorValor: { fontFamily: fontes.titulo, fontSize: 48, color: cores.petroleo, minWidth: 64, textAlign: 'center' },
  metas: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  meta: { width: 40, height: 8, borderRadius: raio.pill, backgroundColor: cores.linha },
  rotulo: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.petroleo },
  falta: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.ambarTerra, textAlign: 'center' },
});
