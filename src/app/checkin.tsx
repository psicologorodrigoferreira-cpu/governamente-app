import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Botao, Campo, Cartao, Legenda, Subtitulo, Tela, Texto } from '@/components/ui';
import { CheckIn, listarCheckins, salvarCheckin } from '@/lib/dados';
import { cores, fontes } from '@/lib/theme';

type Chave = 'humor' | 'energia' | 'sono' | 'ansiedade' | 'conducao';

const PERGUNTAS: { chave: Chave; pergunta: string; extremos: [string, string] }[] = [
  { chave: 'humor', pergunta: 'Como esteve o seu humor nesta semana?', extremos: ['Muito baixo', 'Muito bom'] },
  { chave: 'energia', pergunta: 'E a sua energia para o trabalho?', extremos: ['Esgotada', 'Cheia'] },
  { chave: 'sono', pergunta: 'Como você tem dormido?', extremos: ['Muito mal', 'Muito bem'] },
  { chave: 'ansiedade', pergunta: 'Quanto a ansiedade te atrapalhou?', extremos: ['Nada', 'Muito'] },
  { chave: 'conducao', pergunta: 'Quanto você sentiu que conduziu suas emoções, e não o contrário?', extremos: ['Pouco', 'Muito'] },
];

export default function CheckinTela() {
  const [valores, setValores] = useState<Record<Chave, number | null>>({
    humor: null,
    energia: null,
    sono: null,
    ansiedade: null,
    conducao: null,
  });
  const [nota, setNota] = useState('');
  const [historico, setHistorico] = useState<CheckIn[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarCheckins().then(setHistorico).catch(() => {});
  }, []);

  const completo = Object.values(valores).every((v) => v !== null);

  async function salvar() {
    setSalvando(true);
    try {
      await salvarCheckin({ ...(valores as Record<Chave, number>), nota: nota.trim() || undefined });
      router.back();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Texto>Cinco perguntas, menos de um minuto. Não é avaliação: é um retrato da sua semana para você acompanhar.</Texto>
      {PERGUNTAS.map((p) => (
        <View key={p.chave} style={{ gap: 8 }}>
          <Text style={s.pergunta}>{p.pergunta}</Text>
          <View style={s.opcoes}>
            {[0, 1, 2, 3, 4].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="radio"
                accessibilityState={{ selected: valores[p.chave] === n }}
                accessibilityLabel={`${n} de 4`}
                onPress={() => setValores((v) => ({ ...v, [p.chave]: n }))}
                style={[s.opcao, valores[p.chave] === n && s.opcaoOn]}
              >
                <Text style={[s.opcaoTexto, valores[p.chave] === n && { color: cores.areia }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.extremos}>
            <Legenda>{p.extremos[0]}</Legenda>
            <Legenda>{p.extremos[1]}</Legenda>
          </View>
        </View>
      ))}
      <Campo rotulo="Algo que marcou a semana? (opcional)" value={nota} onChangeText={setNota} multiline />
      <Botao titulo="Salvar check-in" onPress={salvar} desativado={!completo} carregando={salvando} />

      {historico.length > 0 && (
        <Cartao>
          <Subtitulo>Suas últimas semanas</Subtitulo>
          {historico.slice(0, 8).map((c) => (
            <View key={c.id} style={s.linhaHist}>
              <Legenda style={{ width: 64 }}>
                {new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </Legenda>
              <Barra rotulo="Condução" valor={c.conducao} />
              <Barra rotulo="Ansiedade" valor={c.ansiedade} invertida />
            </View>
          ))}
        </Cartao>
      )}
    </Tela>
  );
}

function Barra({ rotulo, valor, invertida }: { rotulo: string; valor: number; invertida?: boolean }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={s.barraRotulo}>{rotulo}</Text>
      <View style={s.barraFundo}>
        <View style={[s.barraCheia, { width: `${(valor / 4) * 100}%`, backgroundColor: invertida ? cores.salviaEscura : cores.ambar }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pergunta: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.petroleo },
  opcoes: { flexDirection: 'row', gap: 8 },
  opcao: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoOn: { backgroundColor: cores.petroleo, borderColor: cores.petroleo },
  opcaoTexto: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.petroleo },
  extremos: { flexDirection: 'row', justifyContent: 'space-between' },
  linhaHist: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barraRotulo: { fontFamily: fontes.texto, fontSize: 11, color: cores.grafiteSuave },
  barraFundo: { height: 6, borderRadius: 3, backgroundColor: cores.linha, overflow: 'hidden' },
  barraCheia: { height: 6, borderRadius: 3 },
});
