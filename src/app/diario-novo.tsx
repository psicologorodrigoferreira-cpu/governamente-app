import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Botao, Campo, Chip, Legenda, Tela, Texto } from '@/components/ui';
import { salvarDiario } from '@/lib/dados';
import { SENTIMENTOS } from '@/content/emocoes';
import { cores, fontes } from '@/lib/theme';

export default function NovoRegistro() {
  const { pensamento: comPensamento } = useLocalSearchParams<{ pensamento?: string }>();
  const [situacao, setSituacao] = useState('');
  const [emocoes, setEmocoes] = useState<string[]>([]);
  const [intensidade, setIntensidade] = useState(5);
  const [pensamento, setPensamento] = useState('');
  const [alternativo, setAlternativo] = useState('');
  const [acao, setAcao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const modoPensamento = comPensamento === '1';

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
      await salvarDiario({
        situacao: situacao.trim(),
        emocoes,
        intensidade,
        pensamento: textoPensamento || undefined,
        acao: acao.trim(),
      });
      router.back();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
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
        placeholder="Ex.: respirei, pedi um dia para responder"
      />

      {!!erro && <Text style={s.erro}>{erro}</Text>}
      <Botao titulo="Salvar registro" onPress={salvar} carregando={salvando} />
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
