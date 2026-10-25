import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Botao, Cartao, Destaque, Legenda, Progresso, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { calcular, ESCALAS, montarResultado, nivel, Resultado, testePorId } from '@/content/testes';
import { listarResultados, salvarResultado } from '@/lib/ecossistema';
import { cores, espaco, fontes, raio } from '@/lib/theme';

function embaralhar(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let j = n - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [a[j], a[k]] = [a[k], a[j]];
  }
  return a;
}

type Fase = 'intro' | 'perguntas' | 'resultado';

export default function TesteTela() {
  const { id, ver } = useLocalSearchParams<{ id: string; ver?: string }>();
  const t = testePorId(String(id));
  const [fase, setFase] = useState<Fase>('intro');
  const [ordem, setOrdem] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [resp, setResp] = useState<Record<number, number>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [anterior, setAnterior] = useState<{ data: string; r: Resultado } | null>(null);

  useEffect(() => {
    listarResultados()
      .then((l) => {
        const r = l.find((x) => x.teste_id === String(id));
        if (r) {
          setAnterior({ data: r.criado_em, r: r.resultado });
          if (ver === '1') {
            setResultado(r.resultado);
            setFase('resultado');
          }
        }
      })
      .catch(() => {});
  }, [id, ver]);

  const escala = useMemo(() => (t ? ESCALAS[t.escala] : []), [t]);

  if (!t) {
    return (
      <Tela>
        <Texto>Teste não encontrado.</Texto>
      </Tela>
    );
  }

  function iniciar() {
    setOrdem(embaralhar(t!.itens.length));
    setPos(0);
    setResp({});
    setFase('perguntas');
  }

  async function responder(v: number) {
    const idx = ordem[pos];
    const novo = { ...resp, [idx]: v };
    setResp(novo);
    if (pos < ordem.length - 1) {
      setTimeout(() => setPos(pos + 1), 180);
      return;
    }
    const r = montarResultado(t!, calcular(t!, novo));
    setResultado(r);
    setFase('resultado');
    try {
      await salvarResultado(r);
    } catch {
      Alert.alert('Resultado não foi salvo', 'Você pode ver o resultado agora, mas ele não ficou guardado. Verifique sua conexão.');
    }
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: t.titulo }} />

      {fase === 'intro' && (
        <>
          <Titulo>{t.titulo}</Titulo>
          <Texto>{t.resumo}</Texto>
          <Cartao>
            <Passo n={1} texto={t.intro} />
            <Passo n={2} texto="Não existe resposta certa ou errada. Escolha a que mais se parece com você." />
            <Passo n={3} texto={`São ${t.itens.length} perguntas, cerca de ${t.tempo}. O resultado aparece na hora e fica guardado só para você.`} />
          </Cartao>
          <Botao titulo="Começar com calma" onPress={iniciar} />
          {anterior && (
            <Botao
              variante="secundario"
              titulo={`Ver resultado de ${new Date(anterior.data).toLocaleDateString('pt-BR')}`}
              onPress={() => {
                setResultado(anterior.r);
                setFase('resultado');
              }}
            />
          )}
          <Legenda style={{ textAlign: 'center' }}>Instrumento de autoconhecimento. Não substitui avaliação psicológica.</Legenda>
        </>
      )}

      {fase === 'perguntas' && ordem.length > 0 && (
        <>
          <View style={s.topoPergunta}>
            <Legenda>
              Pergunta {pos + 1} de {ordem.length}
            </Legenda>
            <Legenda>{Math.round((pos / ordem.length) * 100)}%</Legenda>
          </View>
          <Progresso valor={pos / ordem.length} />
          <Text style={s.pergunta} accessibilityRole="header">
            {t.itens[ordem[pos]][1]}
          </Text>
          <View style={{ gap: espaco.s }} accessibilityRole="radiogroup">
            {escala.map((o, i) => {
              const sel = resp[ordem[pos]] === i;
              return (
                <Pressable
                  key={o}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  onPress={() => responder(i)}
                  style={[s.opcao, sel && s.opcaoSel]}
                >
                  <View style={[s.bola, sel && s.bolaSel]} />
                  <Text style={[s.opcaoTexto, sel && { color: cores.areia }]}>{o}</Text>
                </Pressable>
              );
            })}
          </View>
          <Botao variante="texto" titulo="← Voltar" desativado={pos === 0} onPress={() => setPos(Math.max(0, pos - 1))} />
        </>
      )}

      {fase === 'resultado' && resultado && <VerResultado t={t} r={resultado} onRefazer={iniciar} />}
    </Tela>
  );
}

function Passo({ n, texto }: { n: number; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Text style={s.passoN}>{n}</Text>
      <Texto style={{ flex: 1 }}>{texto}</Texto>
    </View>
  );
}

function VerResultado({ t, r, onRefazer }: { t: NonNullable<ReturnType<typeof testePorId>>; r: Resultado; onRefazer: () => void }) {
  const corNivel = (pct: number) => {
    if (r.modo === 'neutro' || r.modo === 'ranking' || r.modo === 'apego') return cores.petroleo;
    const n = nivel(pct);
    const bom = r.modo === 'pos' ? n : n === 'alto' ? 'baixo' : n === 'baixo' ? 'alto' : 'moderado';
    return bom === 'alto' ? cores.salviaEscura : bom === 'moderado' ? cores.ambar : cores.ambarTerra;
  };
  return (
    <>
      <Legenda>
        {t.titulo.toUpperCase()} · {new Date().toLocaleDateString('pt-BR')}
      </Legenda>
      <Titulo>
        Este é o seu <Destaque>retrato</Destaque>
      </Titulo>
      <Cartao escuro>
        {r.mostrarGeral && <Text style={s.geral}>{r.geral}%</Text>}
        <Text style={s.resTitulo}>{r.titulo}</Text>
        <Text style={s.resTexto}>{r.leitura}</Text>
      </Cartao>

      <Subtitulo>{r.modo === 'ranking' ? 'Predominância por eixo' : 'Por eixo'}</Subtitulo>
      {r.eixos.map((e) => (
        <View key={e.id} style={{ gap: 4 }}>
          <View style={s.eixoTopo}>
            <Text style={s.eixoNome}>{e.nome}</Text>
            <Text style={[s.eixoPct, { color: corNivel(e.pct) }]}>{e.pct}%</Text>
          </View>
          <View style={s.barra}>
            <View style={[s.barraCheia, { width: `${Math.max(3, e.pct)}%`, backgroundColor: corNivel(e.pct) }]} />
          </View>
          {!!e.d && <Legenda>{e.d}</Legenda>}
        </View>
      ))}

      <Cartao>
        <Subtitulo>Um passo possível agora</Subtitulo>
        <Texto>{r.passo}</Texto>
      </Cartao>
      {!!r.extra && (
        <Cartao>
          <Subtitulo>Para entender melhor</Subtitulo>
          <Texto>{r.extra}</Texto>
        </Cartao>
      )}
      {r.cuidado && (
        <Cartao style={{ borderColor: cores.alerta }}>
          <Subtitulo>Cuidado importante</Subtitulo>
          <Texto>
            Este resultado não é um diagnóstico. Se a ansiedade está pesando, conversar com um psicólogo ajuda muito. Se você estiver em
            sofrimento intenso ou tiver pensamentos de se machucar, procure ajuda agora: CVV 188 (ligação gratuita, 24 horas) ou SAMU 192.
          </Texto>
          <Botao variante="secundario" titulo="Ver apoio agora" onPress={() => router.push('/apoio')} />
          <Botao variante="secundario" titulo="Respiro 4–6 (2 minutos)" onPress={() => router.push('/respirar')} />
        </Cartao>
      )}
      <Botao titulo="Registrar o que percebi no diário" onPress={() => router.push('/diario-novo')} />
      <Botao variante="secundario" titulo="Refazer o teste" onPress={onRefazer} />
      <Botao variante="texto" titulo="Ver todos os testes" onPress={() => router.replace('/testes')} />
      <Legenda style={{ textAlign: 'center', lineHeight: 18 }}>
        Instrumento de autoconhecimento, sem validação psicométrica. Não é diagnóstico e não substitui avaliação psicológica.
      </Legenda>
    </>
  );
}

const s = StyleSheet.create({
  topoPergunta: { flexDirection: 'row', justifyContent: 'space-between' },
  pergunta: { fontFamily: fontes.titulo, fontSize: 22, color: cores.petroleo, lineHeight: 30, marginVertical: espaco.m },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.areiaClara,
    borderRadius: raio.m,
    paddingVertical: 14,
    paddingHorizontal: espaco.m,
  },
  opcaoSel: { backgroundColor: cores.petroleo, borderColor: cores.petroleo },
  bola: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: cores.grafiteSuave },
  bolaSel: { borderColor: cores.ambar, backgroundColor: cores.ambar },
  opcaoTexto: { fontFamily: fontes.textoMedio, fontSize: 16, color: cores.petroleo },
  passoN: { fontFamily: fontes.textoForte, color: cores.ambarTerra, fontSize: 15, width: 16, lineHeight: 24 },
  geral: { fontFamily: fontes.titulo, fontSize: 40, color: cores.ambar },
  resTitulo: { fontFamily: fontes.titulo, fontSize: 21, color: cores.areia, lineHeight: 28 },
  resTexto: { fontFamily: fontes.texto, fontSize: 15, color: cores.areia, opacity: 0.9, lineHeight: 22 },
  eixoTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  eixoNome: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.petroleo },
  eixoPct: { fontFamily: fontes.textoForte, fontSize: 14 },
  barra: { height: 8, borderRadius: 4, backgroundColor: cores.linha, overflow: 'hidden' },
  barraCheia: { height: 8, borderRadius: 4 },
});
