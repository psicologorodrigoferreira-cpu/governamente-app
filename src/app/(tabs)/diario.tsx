import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Botao, Cartao, Destaque, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { apagarDiario, listarDiario, RegistroDiario } from '@/lib/dados';
import { cores, espaco, fontes } from '@/lib/theme';

export default function Diario() {
  const [lista, setLista] = useState<RegistroDiario[]>([]);
  const [carregado, setCarregado] = useState(false);

  const [frequentes, setFrequentes] = useState<[string, number][]>([]);

  const carregar = useCallback(() => {
    listarDiario()
      .then((dados) => {
        setLista(dados);
        // Emoções mais frequentes nos últimos 30 dias: ajuda a enxergar padrões.
        const limite = Date.now() - 30 * 864e5;
        const conta: Record<string, number> = {};
        dados
          .filter((r) => new Date(r.criado_em).getTime() > limite)
          .forEach((r) => r.emocoes.forEach((e) => (conta[e] = (conta[e] ?? 0) + 1)));
        setFrequentes(Object.entries(conta).sort((a, b) => b[1] - a[1]).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setCarregado(true));
  }, []);
  useFocusEffect(carregar);


  function confirmarApagar(id: string) {
    const apagar = () => apagarDiario(id).then(carregar).catch(() => {});
    if (Platform.OS === 'web') {
      apagar();
      return;
    }
    Alert.alert('Apagar registro?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: apagar },
    ]);
  }

  return (
    <Tela>
      <Titulo>
        Diário das <Destaque>Emoções</Destaque>
      </Titulo>
      <Texto>Situação, emoção e ação. Registrar ajuda a enxergar padrões que se repetem sem que a gente perceba.</Texto>
      <Botao titulo="Novo registro" onPress={() => router.push('/diario-novo')} />

      {frequentes.length > 0 && (
        <Cartao>
          <Legenda>MAIS PRESENTES NOS ÚLTIMOS 30 DIAS</Legenda>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {frequentes.map(([e, n]) => (
              <View key={e} style={s.tag}>
                <Text style={s.tagTexto}>
                  {e} · {n}
                </Text>
              </View>
            ))}
          </View>
        </Cartao>
      )}

      {carregado && lista.length === 0 && (
        <Cartao style={{ alignItems: 'center', paddingVertical: espaco.xl }}>
          <Subtitulo style={{ textAlign: 'center' }}>Seu diário está em branco</Subtitulo>
          <Texto style={{ textAlign: 'center', color: cores.grafiteSuave }}>
            Comece com algo de hoje, mesmo que pareça pequeno.
          </Texto>
        </Cartao>
      )}

      {lista.map((r) => (
        <Cartao key={r.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Legenda>
              {new Date(r.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} ·{' '}
              {new Date(r.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Legenda>
            <Text style={s.intensidade}>Intensidade {r.intensidade}/10</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {r.emocoes.map((e) => (
              <View key={e} style={s.tag}>
                <Text style={s.tagTexto}>{e}</Text>
              </View>
            ))}
          </View>
          <Rotulado rotulo="Situação" texto={r.situacao} />
          {!!r.pensamento && <Rotulado rotulo="Pensamento" texto={r.pensamento} />}
          <Rotulado rotulo="Ação" texto={r.acao} />
          <Botao variante="texto" titulo="Apagar" onPress={() => confirmarApagar(r.id)} style={{ alignSelf: 'flex-end' }} />
        </Cartao>
      ))}
    </Tela>
  );
}

function Rotulado({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <View>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Texto>{texto}</Texto>
    </View>
  );
}

const s = StyleSheet.create({
  tag: { backgroundColor: cores.areia, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagTexto: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.petroleo },
  rotulo: { fontFamily: fontes.textoForte, fontSize: 12, color: cores.ambarTerra, letterSpacing: 0.5 },
  intensidade: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.grafiteSuave },
});
