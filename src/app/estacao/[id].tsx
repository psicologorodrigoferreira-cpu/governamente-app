import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Botao, Campo, Cartao, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { estacaoPorId, PILARES, TRILHA } from '@/content/trilha';
import { lerReflexao, listarConcluidas, marcarConcluida } from '@/lib/dados';
import { cores, espaco, fontes } from '@/lib/theme';

const ROTA_FERRAMENTA = {
  diario: { rota: '/diario-novo', rotulo: 'Abrir o Diário das Emoções' },
  respiracao: { rota: '/respirar', rotulo: 'Praticar o respiro 4–6' },
  roda: { rota: '/roda', rotulo: 'Abrir a Roda das Emoções' },
  pensamento: { rota: '/diario-novo?pensamento=1', rotulo: 'Fazer o registro de pensamento' },
  matriz: { rota: '/matriz', rotulo: 'Abrir a Matriz de prioridades' },
  pomodoro: { rota: '/pomodoro', rotulo: 'Experimentar o Pomodoro' },
  constancia: { rota: '/constancia', rotulo: 'Montar meu plano de constância' },
  gratidao: { rota: '/gratidao', rotulo: 'Anotar três gratidões' },
  meditacao: { rota: '/meditar', rotulo: 'Meditar 5 minutos' },
} as const;

export default function EstacaoTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = estacaoPorId(String(id));
  const [reflexao, setReflexao] = useState('');
  const [feita, setFeita] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!e) return;
    lerReflexao(e.id).then(setReflexao).catch(() => {});
    listarConcluidas().then((c) => setFeita(c.includes(e.id))).catch(() => {});
  }, [e]);

  if (!e) {
    return (
      <Tela>
        <Texto>Estação não encontrada.</Texto>
      </Tela>
    );
  }

  const pilar = PILARES[e.pilar];
  const ferramenta = e.pratica.ferramenta ? ROTA_FERRAMENTA[e.pratica.ferramenta] : null;
  const indice = TRILHA.findIndex((x) => x.id === e.id);
  const seguinte = TRILHA[indice + 1];

  async function concluir() {
    setSalvando(true);
    try {
      await marcarConcluida(e!.id, reflexao.trim() || undefined);
      setFeita(true);
      if (seguinte) router.replace(`/estacao/${seguinte.id}`);
      else router.back();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: `Estação ${e.numero}` }} />
      <Text style={[s.pilar, { color: pilar.cor }]}>
        {pilar.nome.toUpperCase()} · CAPÍTULO {e.capitulo}
      </Text>
      <Titulo>{e.titulo}</Titulo>

      <View style={{ gap: espaco.s }}>
        {e.resumo.map((p, i) => (
          <Texto key={i}>{p}</Texto>
        ))}
      </View>

      {e.citacao && (
        <View style={s.citacao}>
          <Text style={s.citacaoTexto}>“{e.citacao.texto}”</Text>
          <Legenda>Livro GovernaMente, cap. {e.citacao.capitulo}</Legenda>
        </View>
      )}

      <Cartao>
        <Legenda>PRÁTICA</Legenda>
        <Subtitulo>{e.pratica.titulo}</Subtitulo>
        {e.pratica.passos.map((p, i) => (
          <View key={i} style={s.passo}>
            <Text style={s.passoNum}>{i + 1}</Text>
            <Texto style={{ flex: 1 }}>{p}</Texto>
          </View>
        ))}
        {ferramenta && (
          <Botao variante="secundario" titulo={ferramenta.rotulo} onPress={() => router.push(ferramenta.rota as never)} />
        )}
        {e.pratica.ferramenta === 'matriz' && (
          <View style={s.matriz}>
            {[
              ['Fazer agora', 'Urgente e importante'],
              ['Agendar', 'Importante, não urgente'],
              ['Delegar', 'Urgente, não importante'],
              ['Descartar', 'Nem urgente, nem importante'],
            ].map(([t, d]) => (
              <View key={t} style={s.quadrante}>
                <Text style={s.quadTitulo}>{t}</Text>
                <Text style={s.quadTexto}>{d}</Text>
              </View>
            ))}
          </View>
        )}
      </Cartao>

      <Subtitulo>Para refletir</Subtitulo>
      <Texto>{e.reflexao}</Texto>
      <Campo
        rotulo="Sua resposta (só você vê)"
        value={reflexao}
        onChangeText={setReflexao}
        multiline
        placeholder="Escreva com calma. Não existe resposta certa."
      />

      <Botao titulo={feita ? (seguinte ? 'Salvar e ir para a próxima' : 'Salvar') : 'Concluir estação'} onPress={concluir} carregando={salvando} />
    </Tela>
  );
}

const s = StyleSheet.create({
  pilar: { fontFamily: fontes.textoForte, fontSize: 12, letterSpacing: 0.8 },
  citacao: { borderLeftWidth: 3, borderLeftColor: cores.ambar, paddingLeft: espaco.m, gap: 6 },
  citacaoTexto: { fontFamily: fontes.tituloItalico, fontSize: 19, color: cores.petroleo, lineHeight: 26 },
  passo: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  passoNum: {
    fontFamily: fontes.textoForte,
    color: cores.ambarTerra,
    fontSize: 15,
    width: 22,
    lineHeight: 24,
  },
  matriz: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quadrante: { flexBasis: '47%', flexGrow: 1, backgroundColor: cores.areia, borderRadius: 12, padding: 12, gap: 2 },
  quadTitulo: { fontFamily: fontes.textoForte, color: cores.petroleo, fontSize: 14 },
  quadTexto: { fontFamily: fontes.texto, color: cores.grafiteSuave, fontSize: 12 },
});
