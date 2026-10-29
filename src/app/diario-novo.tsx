import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Botao, Campo, Cartao, Chip, Legenda, Tela, Texto } from '@/components/ui';
import { atualizarDiario, lerRegistro, salvarDiario } from '@/lib/dados';
import { SENTIMENTOS } from '@/content/emocoes';
import { cores, fontes } from '@/lib/theme';

export default function NovoRegistro() {
  const { pensamento: comPensamento, id, origem } = useLocalSearchParams<{ pensamento?: string; id?: string; origem?: string }>();
  const editando = !!id;
  const daGratidao = origem === 'gratidao';
  const [situacao, setSituacao] = useState('');
  const [emocoes, setEmocoes] = useState<string[]>([]);
  const [intensidade, setIntensidade] = useState(5);
  const [pensamento, setPensamento] = useState('');
  const [alternativo, setAlternativo] = useState('');
  const [acao, setAcao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const modoPensamento = comPensamento === '1';

  // Completar um registro já salvo (por exemplo, as gratidões do dia).
  useEffect(() => {
    if (!id) return;
    lerRegistro(String(id))
      .then((r) => {
        if (!r) return;
        setSituacao(r.situacao);
        setEmocoes(r.emocoes);
        setIntensidade(r.intensidade);
        const [pens, alt] = (r.pensamento ?? '').split('\nAlternativo: ');
        setPensamento(pens ?? '');
        setAlternativo(alt ?? '');
        setAcao(r.acao);
      })
      .catch(() => {});
  }, [id]);

  function alternar(e: string) {
    setEmocoes((atual) => (atual.includes(e) ? atual.filter((x) => x !== e) : [...atual, e]));
  }

  async function salvar() {
    setErro('');
    if (!situacao.trim()) return setErro('Descreva brevemente a situação.');
    if (emocoes.length === 0) return setErro('Escolha pelo menos uma emoção.');
    if (!acao.trim()) return setErro('Conte o que você fez (ou o que gostaria de ter feito).');
    setSalvando(true);
    try {
      const textoPensamento = [pensamento.trim(), alternativo.trim() && `Alternativo: ${alternativo.trim()}`]
        .filter(Boolean)
        .join('\n');
      const registro = {
        situacao: situacao.trim(),
        emocoes,
        intensidade,
        pensamento: textoPensamento || undefined,
        acao: acao.trim(),
      };
      if (editando) {
        await atualizarDiario(String(id), { ...registro, pensamento: textoPensamento || null });
        router.replace('/(tabs)/diario');
      } else {
        await salvarDiario(registro);
        router.back();
      }
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      {editando && <Stack.Screen options={{ title: 'Completar registro' }} />}
      {daGratidao && (
        <Cartao style={{ borderColor: cores.ambar, backgroundColor: '#FBF1E1' }}>
          <Legenda style={{ color: cores.ambarTerra }}>JÁ SALVO NO SEU DIÁRIO ✓</Legenda>
          <Texto style={{ fontSize: 15 }}>
            Suas gratidões de hoje entraram no Diário das Emoções. Agora complete: o que você sentiu, com que intensidade e o que fez com
            isso.
          </Texto>
        </Cartao>
      )}
      <Campo
        rotulo="1. Situação: o que aconteceu?"
        value={situacao}
        onChangeText={setSituacao}
        multiline
        placeholder="Ex.: reunião com um cliente que questionou o prazo"
      />

      <View style={{ gap: 8 }}>
        <Text style={s.rotulo}>2. Emoção: o que você sentiu?</Text>
        <Pressable onPress={() => router.push('/roda')}>
          <Text style={s.link}>Não sabe nomear? Abra a Roda das Emoções</Text>
        </Pressable>
        <View style={s.chips}>
          {SENTIMENTOS.map((e) => (
            <Chip key={e} rotulo={e} ativo={emocoes.includes(e)} onPress={() => alternar(e)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={s.rotulo}>Intensidade: {intensidade}/10</Text>
        <View style={s.escala}>
          {Array.from({ length: 11 }, (_, i) => (
            <Pressable
              key={i}
              accessibilityRole="radio"
              accessibilityState={{ selected: intensidade === i }}
              accessibilityLabel={`Intensidade ${i}`}
              onPress={() => setIntensidade(i)}
              style={[s.nivel, i <= intensidade && { backgroundColor: cores.ambar }]}
            />
          ))}
        </View>
      </View>

      {(modoPensamento || pensamento.length > 0) ? (
        <>
          <Campo
            rotulo="Pensamento automático: o que passou pela sua cabeça?"
            value={pensamento}
            onChangeText={setPensamento}
            multiline
            placeholder="Ex.: e se ele cancelar o contrato?"
          />
          <Texto style={{ color: cores.grafiteSuave }}>Esse pensamento é realmente verdadeiro? Que evidências você tem?</Texto>
          <Campo rotulo="Pensamento alternativo, mais equilibrado" value={alternativo} onChangeText={setAlternativo} multiline />
        </>
      ) : (
        <Pressable onPress={() => setPensamento(' ')}>
          <Text style={s.link}>+ Registrar também o pensamento automático</Text>
        </Pressable>
      )}

      <Campo
        rotulo="3. Ação: o que você fez?"
        value={acao}
        onChangeText={setAcao}
        multiline
        placeholder={daGratidao ? 'Ex.: agradeci a quem me ajudou, guardei esse momento' : 'Ex.: respirei, pedi um dia para responder'}
      />

      {!!erro && <Text style={s.erro}>{erro}</Text>}
      <Botao titulo={editando ? 'Completar registro' : 'Salvar registro'} onPress={salvar} carregando={salvando} />
      {daGratidao && <Botao variante="texto" titulo="Completar depois" onPress={() => router.replace('/(tabs)/diario')} />}
      <Legenda style={{ textAlign: 'center' }}>Seus registros são privados e protegidos.</Legenda>
    </Tela>
  );
}

const s = StyleSheet.create({
  rotulo: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.petroleo },
  link: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.ambarTerra, textDecorationLine: 'underline' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  escala: { flexDirection: 'row', gap: 4 },
  nivel: { flex: 1, height: 28, borderRadius: 6, backgroundColor: cores.linha },
  erro: { fontFamily: fontes.textoMedio, color: cores.alerta },
});
