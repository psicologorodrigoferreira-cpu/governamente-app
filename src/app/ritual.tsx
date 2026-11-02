import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Botao, Campo, Cartao, Legenda, Progresso, Tela, Texto, Titulo } from '@/components/ui';
import { Semana } from '@/components/rituais';
import { fraseDaNoite, HUMOR, nomeHumor, Periodo, perguntaDoDia, proximoSelo, seloDoDia } from '@/content/rituais';
import { EstadoRituais, estadoRituais, leituraDoDia, listarRituais, Ritual, salvarRitual } from '@/lib/rituais';
import { cores, espaco, fontes, raio } from '@/lib/theme';

const CICLOS = 3;

export default function RitualTela() {
  const { p } = useLocalSearchParams<{ p?: string }>();
  const periodo: Periodo = p === 'noite' ? 'noite' : p === 'manha' ? 'manha' : new Date().getHours() >= 17 ? 'noite' : 'manha';
  const manha = periodo === 'manha';

  const [lista, setLista] = useState<Ritual[]>([]);
  const [passo, setPasso] = useState(0);
  const [humor, setHumor] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [cumpriu, setCumpriu] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [fim, setFim] = useState<{ e: EstadoRituais; leitura: string | null; primeiro: boolean } | null>(null);

  useFocusEffect(
    useCallback(() => {
      listarRituais()
        .then((l) => {
          setLista(l);
          const e = estadoRituais(l);
          const feito = manha ? e.manhaHoje : e.noiteHoje;
          if (feito) {
            setHumor(feito.humor);
            setTexto(feito.texto);
            setCumpriu(feito.cumpriu ?? null);
          }
        })
        .catch(() => {});
    }, [manha]),
  );

  const e = estadoRituais(lista);
  const intencao = e.manhaHoje?.texto;
  // Manhã: humor → respiração → intenção. Noite: humor → passo possível (se houve intenção) → uma coisa boa.
  const passos = manha ? ['humor', 'respiro', 'intencao'] : intencao ? ['humor', 'passo', 'gratidao'] : ['humor', 'gratidao'];
  const atual = passos[passo];

  async function concluir() {
    if (!humor) return;
    setSalvando(true);
    try {
      await salvarRitual({ periodo, humor, texto: texto.trim(), cumpriu: manha ? null : cumpriu });
      const primeiro = !(manha ? e.noiteHoje : e.manhaHoje) && !(manha ? e.manhaHoje : e.noiteHoje);
      const nova = await listarRituais();
      setFim({ e: estadoRituais(nova), leitura: manha ? null : leituraDoDia(nova), primeiro });
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  const avancar = () => (passo < passos.length - 1 ? setPasso(passo + 1) : concluir());
  const titulo = manha ? 'Norte da manhã' : 'Fechamento do dia';

  if (fim) return <Conclusao manha={manha} e={fim.e} leitura={fim.leitura} texto={texto.trim()} primeiro={fim.primeiro} />;

  return (
    <Tela>
      <Stack.Screen options={{ title: titulo }} />
      <Progresso valor={(passo + 1) / passos.length} />
      <Legenda>
        {titulo.toUpperCase()} · PASSO {passo + 1} DE {passos.length} · MENOS DE 2 MINUTOS
      </Legenda>

      {atual === 'humor' && (
        <>
          <Titulo>{manha ? 'Como você acordou?' : 'Como você está terminando o dia?'}</Titulo>
          {manha && e.noiteOntem?.texto ? (
            <Cartao style={{ backgroundColor: cores.areia }}>
              <Legenda>ONTEM À NOITE VOCÊ ANOTOU</Legenda>
              <Text style={s.eco}>“{e.noiteOntem.texto}”</Text>
            </Cartao>
          ) : null}
          {!manha && e.manhaHoje && (
            <Legenda>De manhã você estava: {nomeHumor(e.manhaHoje.humor).toLowerCase()}.</Legenda>
          )}
          <View style={s.humores} accessibilityRole="radiogroup">
            {HUMOR.map((h) => {
              const sel = humor === h.valor;
              return (
                <Pressable
                  key={h.valor}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={h.nome}
                  onPress={() => setHumor(h.valor)}
                  style={[s.humor, sel && { borderColor: h.cor, backgroundColor: '#FBF1E1' }]}
                >
                  <View style={[s.bola, { backgroundColor: h.cor, opacity: sel ? 1 : 0.55, transform: [{ scale: 0.7 + h.valor * 0.08 }] }]} />
                  <Text style={[s.humorNome, sel && { fontFamily: fontes.textoForte, color: cores.petroleo }]}>{h.nome}</Text>
                </Pressable>
              );
            })}
          </View>
          <Botao titulo="Continuar" onPress={avancar} desativado={!humor} />
        </>
      )}

      {atual === 'respiro' && <Respiro onFim={avancar} />}

      {atual === 'intencao' && (
        <>
          <Cartao escuro>
            <Legenda style={{ color: cores.salvia }}>PERGUNTA DE HOJE</Legenda>
            <Text style={s.pergunta}>{perguntaDoDia()}</Text>
          </Cartao>
          <Campo
            rotulo="Meu passo possível hoje"
            value={texto}
            onChangeText={setTexto}
            placeholder="Ex.: responder o cliente só depois do almoço, com calma"
            multiline
            maxLength={200}
          />
          <Legenda>À noite, o app te pergunta se você conseguiu.</Legenda>
          <Botao titulo="Começar o dia" onPress={avancar} carregando={salvando} desativado={!texto.trim()} />
        </>
      )}

      {atual === 'passo' && (
        <>
          <Titulo>Seu passo possível era:</Titulo>
          <Cartao style={{ backgroundColor: cores.areia }}>
            <Text style={s.eco}>“{intencao}”</Text>
          </Cartao>
          <Texto>Você conseguiu?</Texto>
          <View style={{ gap: espaco.s }} accessibilityRole="radiogroup">
            {[
              [2, 'Sim'],
              [1, 'Em parte'],
              [0, 'Hoje não'],
            ].map(([v, nome]) => (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityState={{ selected: cumpriu === v }}
                onPress={() => setCumpriu(v as number)}
                style={[s.opcao, cumpriu === v && s.opcaoSel]}
              >
                <Text style={[s.opcaoTexto, cumpriu === v && { color: cores.areia }]}>{nome}</Text>
              </Pressable>
            ))}
          </View>
          {cumpriu === 0 && <Legenda>Tudo bem. Amanhã tem outro passo possível. Perceber já é parte do caminho.</Legenda>}
          <Botao titulo="Continuar" onPress={avancar} desativado={cumpriu === null} />
        </>
      )}

      {atual === 'gratidao' && (
        <>
          <Titulo>Uma coisa boa de hoje</Titulo>
          <Texto style={{ color: cores.grafiteSuave }}>Pode ser pequena. Amanhã cedo ela volta para você.</Texto>
          <Campo
            rotulo="Hoje foi bom porque…"
            value={texto}
            onChangeText={setTexto}
            placeholder="Ex.: almocei sem pressa com a minha família"
            multiline
            maxLength={200}
          />
          <Botao titulo="Fechar o dia" onPress={avancar} carregando={salvando} desativado={!texto.trim()} />
        </>
      )}

      {passo > 0 && <Botao variante="texto" titulo="Voltar" onPress={() => setPasso(passo - 1)} />}
    </Tela>
  );
}

/** Três respirações 4-4-8 guiadas pelo círculo (inspira 4, segura 4, solta 8: cerca de 50 segundos). */
function Respiro({ onFim }: { onFim: () => void }) {
  const [escala] = useState(() => new Animated.Value(0.55));
  const [ciclo, setCiclo] = useState(0);
  const [fase, setFase] = useState<'inspire' | 'segure' | 'solte'>('inspire');
  const [rodando, setRodando] = useState(false);

  useEffect(() => {
    if (!rodando) return;
    let vivo = true;
    const rodar = (n: number) => {
      if (!vivo) return;
      if (n >= CICLOS) {
        setRodando(false);
        setCiclo(CICLOS);
        return;
      }
      setCiclo(n + 1);
      setFase('inspire');
      Animated.timing(escala, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(() => {
        if (!vivo) return;
        setFase('segure');
        setTimeout(() => {
          if (!vivo) return;
          setFase('solte');
          Animated.timing(escala, { toValue: 0.55, duration: 8000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(() =>
            rodar(n + 1),
          );
        }, 4000);
      });
    };
    rodar(0);
    return () => {
      vivo = false;
      escala.stopAnimation();
    };
  }, [rodando, escala]);

  const terminou = ciclo >= CICLOS && !rodando;
  return (
    <>
      <Titulo>Três respirações</Titulo>
      <Texto style={{ color: cores.grafiteSuave }}>
        Uma mão no peito e a outra na barriga. Inspire pelo nariz em 4, segure 4 e solte pela boca em 8, como se soprasse uma vela.
      </Texto>
      <View style={s.respiroArea}>
        <Animated.View style={[s.circulo, { transform: [{ scale: escala }] }]} />
        <View style={s.respiroTexto}>
          <Text style={s.fase}>{!rodando && ciclo === 0 ? 'Pronto?' : terminou ? 'Muito bem' : fase === 'inspire' ? 'Inspire pelo nariz' : fase === 'segure' ? 'Segure' : 'Solte pela boca'}</Text>
          {rodando && <Legenda style={{ color: cores.areia }}>{ciclo} de {CICLOS}</Legenda>}
        </View>
      </View>
      {!rodando && !terminou && <Botao titulo="Começar" onPress={() => setRodando(true)} />}
      {terminou && <Botao titulo="Continuar" onPress={onFim} />}
      {!terminou && <Botao variante="texto" titulo="Pular respiração" onPress={onFim} />}
    </>
  );
}

function Conclusao({
  manha,
  e,
  leitura,
  texto,
  primeiro,
}: {
  manha: boolean;
  e: EstadoRituais;
  leitura: string | null;
  texto: string;
  primeiro: boolean;
}) {
  // O selo aparece uma vez: no primeiro ritual do dia em que a sequência chega ao marco.
  const selo = primeiro ? seloDoDia(e.sequencia) : undefined;
  const prox = proximoSelo(e.sequencia);
  const completo = !!e.manhaHoje && !!e.noiteHoje;
  return (
    <Tela>
      <Stack.Screen options={{ title: manha ? 'Norte da manhã' : 'Fechamento do dia' }} />
      <Cartao escuro style={{ alignItems: 'center', gap: espaco.m, paddingVertical: espaco.l }}>
        <Text style={s.seqNum}>{e.sequencia}</Text>
        <Legenda style={{ color: cores.salvia }}>{e.sequencia === 1 ? 'DIA DE BORDO' : 'DIAS DE BORDO SEGUIDOS'}</Legenda>
        <Text style={s.fimTitulo}>
          {manha ? 'Seu norte está definido.' : completo ? 'Dia completo: manhã e noite.' : 'Dia fechado.'}
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Semana semana={e.semana} escuro />
        </View>
      </Cartao>

      {selo && (
        <Cartao style={{ borderColor: cores.ambar, borderWidth: 1.5, backgroundColor: '#FBF1E1', alignItems: 'center' }}>
          <Legenda style={{ color: cores.ambarTerra }}>NOVO SELO CONQUISTADO</Legenda>
          <Text style={s.selo}>{selo.nome}</Text>
          <Texto style={{ textAlign: 'center' }}>{selo.texto}</Texto>
        </Cartao>
      )}

      {manha ? (
        <Cartao>
          <Legenda>SEU PASSO POSSÍVEL</Legenda>
          <Text style={s.eco}>“{texto}”</Text>
          <Texto style={{ fontSize: 15, color: cores.grafiteSuave }}>
            À noite, no Fechamento do dia, você vê se conseguiu e descobre o que o seu dia revelou.
          </Texto>
        </Cartao>
      ) : (
        <Cartao>
          <Legenda>LEITURA DO DIA</Legenda>
          <Text style={s.eco}>{leitura ?? fraseDaNoite()}</Text>
        </Cartao>
      )}

      {prox && (
        <Legenda style={{ textAlign: 'center' }}>
          {prox.dias - e.sequencia === 1 ? 'Falta 1 dia' : `Faltam ${prox.dias - e.sequencia} dias`} para o selo “{prox.nome}”.
        </Legenda>
      )}

      {!manha && <Botao variante="secundario" titulo="Quer registrar algo no diário?" onPress={() => router.replace('/diario-novo')} />}
      <Botao titulo="Voltar ao início" onPress={() => router.replace('/(tabs)')} />
    </Tela>
  );
}

const s = StyleSheet.create({
  eco: { fontFamily: fontes.tituloItalico, fontSize: 18, color: cores.petroleo, lineHeight: 26 },
  humores: { flexDirection: 'row', gap: 6 },
  humor: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: raio.m,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.areiaClara,
  },
  bola: { width: 36, height: 36, borderRadius: 18 },
  humorNome: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.grafiteSuave },
  pergunta: { fontFamily: fontes.tituloItalico, fontSize: 21, color: cores.areia, lineHeight: 29 },
  opcao: { borderWidth: 1.5, borderColor: cores.petroleo, borderRadius: raio.pill, paddingVertical: 14, alignItems: 'center' },
  opcaoSel: { backgroundColor: cores.petroleo },
  opcaoTexto: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.petroleo },
  respiroArea: { height: 240, alignItems: 'center', justifyContent: 'center' },
  circulo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: cores.petroleo },
  respiroTexto: { alignItems: 'center', gap: 4 },
  fase: { fontFamily: fontes.titulo, fontSize: 24, color: cores.areia },
  seqNum: { fontFamily: fontes.titulo, fontSize: 64, color: cores.ambar, lineHeight: 70 },
  fimTitulo: { fontFamily: fontes.titulo, fontSize: 22, color: cores.areia, textAlign: 'center' },
  selo: { fontFamily: fontes.titulo, fontSize: 24, color: cores.petroleo },
});
