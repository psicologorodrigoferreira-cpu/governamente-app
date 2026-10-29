import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Botao, Campo, Cartao, Legenda, Subtitulo, Tela, Texto } from '@/components/ui';
import { diaDeHoje, Gratidao, gratidaoNoDiario, listarGratidao, salvarGratidao } from '@/lib/ferramentas';
import { cores, fontes } from '@/lib/theme';

// Cap. 12 do livro: ao fim do dia, anotar três coisas pelas quais você é grato.
export default function GratidaoTela() {
  const [itens, setItens] = useState(['', '', '']);
  const [historico, setHistorico] = useState<Gratidao[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const carregar = useCallback(() => {
    listarGratidao()
      .then((h) => {
        setHistorico(h);
        const hoje = h.find((g) => g.dia === diaDeHoje());
        if (hoje) setItens([0, 1, 2].map((i) => hoje.itens[i] ?? ''));
      })
      .catch(() => {});
  }, []);
  useFocusEffect(carregar);

  async function salvar() {
    const preenchidos = itens.map((i) => i.trim()).filter(Boolean);
    if (preenchidos.length === 0) return;
    setSalvando(true);
    try {
      await salvarGratidao(preenchidos);
      setSalvo(true);
      carregar();
      // Já entra no Diário das Emoções; a pessoa só completa o registro.
      const id = await gratidaoNoDiario(preenchidos);
      router.push(`/diario-novo?id=${id}&origem=gratidao`);
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  const anteriores = historico.filter((g) => g.dia !== diaDeHoje());

  return (
    <Tela>
      <Texto>
        Ao fim do dia, anote três coisas pelas quais você é grato. Pode ser algo pequeno: um café sem pressa, uma conversa boa,
        um problema que se resolveu. Ao salvar, elas entram no seu Diário das Emoções.
      </Texto>
      {itens.map((v, i) => (
        <Campo
          key={i}
          rotulo={`${i + 1}.`}
          value={v}
          onChangeText={(t) => {
            setSalvo(false);
            setItens(itens.map((x, j) => (j === i ? t : x)));
          }}
          placeholder={['Hoje eu agradeço por…', 'Também por…', 'E por…'][i]}
          maxLength={200}
        />
      ))}
      <Botao titulo={salvo ? 'Salvo no diário ✓' : 'Salvar e registrar no diário'} onPress={salvar} carregando={salvando} />

      {anteriores.length > 0 && <Subtitulo>Dias anteriores</Subtitulo>}
      {anteriores.slice(0, 30).map((g) => (
        <Cartao key={g.id}>
          <Legenda>{new Date(`${g.dia}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Legenda>
          {g.itens.map((t, i) => (
            <View key={i} style={s.item}>
              <View style={s.ponto} />
              <Text style={s.texto}>{t}</Text>
            </View>
          ))}
        </Cartao>
      ))}
    </Tela>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ponto: { width: 7, height: 7, borderRadius: 4, backgroundColor: cores.ambar, marginTop: 9 },
  texto: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.grafite, lineHeight: 22 },
});
