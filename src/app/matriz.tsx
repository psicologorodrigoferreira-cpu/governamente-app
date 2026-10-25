import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Botao, Campo, Chip, Legenda, Tela, Texto } from '@/components/ui';
import { adicionarTarefa, atualizarTarefa, limparFeitas, listarTarefas, removerTarefa, Tarefa } from '@/lib/ferramentas';
import { cores, espaco, fontes, raio } from '@/lib/theme';

// Cap. 7 do livro: separar o urgente do importante alivia a carga emocional.
const QUADRANTES: { n: Tarefa['quadrante']; titulo: string; acao: string; cor: string }[] = [
  { n: 1, titulo: 'Urgente e importante', acao: 'Fazer agora', cor: '#B5523B' },
  { n: 2, titulo: 'Importante, não urgente', acao: 'Agendar', cor: '#1E3A39' },
  { n: 3, titulo: 'Urgente, não importante', acao: 'Delegar', cor: '#9A5F14' },
  { n: 4, titulo: 'Nem urgente, nem importante', acao: 'Descartar', cor: '#5B6264' },
];

export default function Matriz() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [texto, setTexto] = useState('');
  const [quadrante, setQuadrante] = useState<Tarefa['quadrante']>(2);
  const [aberta, setAberta] = useState<string | null>(null);

  const carregar = useCallback(() => {
    listarTarefas().then(setTarefas).catch(() => {});
  }, []);
  useFocusEffect(carregar);

  async function executar(acao: () => Promise<void>) {
    try {
      await acao();
      carregar();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    }
  }

  function adicionar() {
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    executar(() => adicionarTarefa(t, quadrante));
  }

  const temFeitas = tarefas.some((t) => t.feita);

  return (
    <Tela>
      <Texto>Liste o que está na sua cabeça e coloque cada item no quadrante certo. O que grita mais alto nem sempre é o que mais importa.</Texto>

      <Campo rotulo="Nova tarefa" value={texto} onChangeText={setTexto} placeholder="Ex.: responder proposta do cliente" maxLength={300} onSubmitEditing={adicionar} returnKeyType="done" />
      <View style={s.chips}>
        {QUADRANTES.map((q) => (
          <Chip key={q.n} rotulo={q.acao} ativo={quadrante === q.n} cor={q.cor} onPress={() => setQuadrante(q.n)} />
        ))}
      </View>
      <Botao titulo="Adicionar" onPress={adicionar} desativado={!texto.trim()} />

      {QUADRANTES.map((q) => {
        const lista = tarefas.filter((t) => t.quadrante === q.n);
        return (
          <View key={q.n} style={[s.quadrante, { borderTopColor: q.cor }]}>
            <View style={s.cabecalho}>
              <Text style={[s.acao, { color: q.cor }]}>{q.acao.toUpperCase()}</Text>
              <Legenda>{q.titulo}</Legenda>
            </View>
            {lista.length === 0 && <Text style={s.vazio}>Nada aqui.</Text>}
            {lista.map((t) => (
              <View key={t.id}>
                <View style={s.tarefa}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: t.feita }}
                    accessibilityLabel={t.texto}
                    onPress={() => executar(() => atualizarTarefa(t.id, { feita: !t.feita }))}
                    style={[s.caixa, t.feita && { backgroundColor: q.cor, borderColor: q.cor }]}
                  >
                    {t.feita && <Text style={s.check}>✓</Text>}
                  </Pressable>
                  <Text style={[s.textoTarefa, t.feita && s.feita]}>{t.texto}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Mais opções" onPress={() => setAberta(aberta === t.id ? null : t.id)} hitSlop={10}>
                    <Text style={s.mais}>⋯</Text>
                  </Pressable>
                </View>
                {aberta === t.id && (
                  <View style={s.opcoes}>
                    {QUADRANTES.filter((x) => x.n !== q.n).map((x) => (
                      <Chip key={x.n} rotulo={`→ ${x.acao}`} onPress={() => { setAberta(null); executar(() => atualizarTarefa(t.id, { quadrante: x.n })); }} />
                    ))}
                    <Chip rotulo="Apagar" onPress={() => { setAberta(null); executar(() => removerTarefa(t.id)); }} />
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      })}

      {temFeitas && <Botao variante="texto" titulo="Limpar tarefas concluídas" onPress={() => executar(limparFeitas)} />}
    </Tela>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8 },
  quadrante: {
    backgroundColor: cores.areiaClara,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cores.linha,
    borderTopWidth: 4,
    padding: espaco.m,
    gap: espaco.s,
  },
  cabecalho: { gap: 2 },
  acao: { fontFamily: fontes.textoForte, fontSize: 13, letterSpacing: 0.8 },
  vazio: { fontFamily: fontes.texto, fontSize: 14, color: cores.grafiteSuave },
  tarefa: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  caixa: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: cores.grafiteSuave, alignItems: 'center', justifyContent: 'center' },
  check: { color: cores.branco, fontFamily: fontes.textoForte, fontSize: 14 },
  textoTarefa: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.grafite },
  feita: { textDecorationLine: 'line-through', color: cores.grafiteSuave },
  mais: { fontSize: 22, color: cores.grafiteSuave, paddingHorizontal: 6 },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 34, paddingBottom: 6 },
});
