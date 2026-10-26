import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Botao, Legenda, Tela, Texto } from '@/components/ui';
import { cores, espaco, fontes } from '@/lib/theme';
import { ControlesGuia, useGuia } from '@/components/ControlesGuia';
import { MEDITACAO, MEDITACAO_FIM } from '@/content/guias';
import { falar, silenciar, tocar } from '@/lib/guia';

// Meditação curta, como no livro (caps. 3 e 12): começar com poucos minutos e voltar à respiração com gentileza.
const OPCOES = [3, 5, 10];

export default function Meditar() {
  const [minutos, setMinutos] = useState(5);
  const [restante, setRestante] = useState<number | null>(null);
  const { prefs, mudar } = useGuia();
  const prefsRef = useRef(prefs);
  const faladas = useRef<Set<string>>(new Set());
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);
  const total = minutos * 60;
  const roteiro = MEDITACAO[minutos];

  useEffect(() => () => silenciar(), []);

  useEffect(() => {
    if (restante === null || restante <= 0) return;
    const t = setTimeout(() => setRestante(restante - 1), 1000);
    return () => clearTimeout(t);
  }, [restante]);

  const ativo = restante !== null && restante > 0;
  const terminou = restante === 0;
  const decorrido = restante === null ? 0 : total - restante;
  const progresso = decorrido / total;
  const guia = [...roteiro].reverse().find((g) => decorrido >= g.em) ?? roteiro[0];

  // Fala cada trecho no seu tempo.
  useEffect(() => {
    if (!ativo || !prefsRef.current.voz) return;
    const g = [...roteiro].reverse().find((x) => decorrido >= x.em);
    if (g && !faladas.current.has(g.id)) {
      faladas.current.add(g.id);
      falar(g);
    }
  }, [ativo, decorrido, roteiro]);

  // Sino e fala de encerramento.
  useEffect(() => {
    if (!terminou) return;
    if (prefsRef.current.sons) tocar('sino', 0.6);
    if (prefsRef.current.voz) setTimeout(() => falar(MEDITACAO_FIM), prefsRef.current.sons ? 1800 : 0);
  }, [terminou]);

  function comecar() {
    silenciar();
    faladas.current = new Set();
    if (prefs.sons) tocar('sino', 0.6);
    setRestante(total);
  }

  function encerrar() {
    silenciar();
    setRestante(null);
  }

  return (
    <Tela>
      {!ativo && !terminou && (
        <>
          <Texto>Alguns minutos de silêncio ajudam a ouvir o que você sente com mais honestidade.</Texto>
          <Legenda>DURAÇÃO</Legenda>
          <View style={s.opcoes}>
            {OPCOES.map((m) => (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected: minutos === m }}
                onPress={() => setMinutos(m)}
                style={[s.opcao, minutos === m && s.opcaoSel]}
              >
                <Text style={[s.opcaoTexto, minutos === m && { color: cores.areia }]}>{m} min</Text>
              </Pressable>
            ))}
          </View>
          <Legenda>GUIA</Legenda>
          <ControlesGuia prefs={prefs} mudar={mudar} />
          <Botao titulo="Começar" onPress={comecar} />
        </>
      )}

      {ativo && (
        <View style={s.area}>
          <View style={[s.lago, { opacity: 0.35 + 0.65 * progresso }]} />
          <Text style={s.guia} accessibilityLiveRegion="polite">
            {guia.texto}
          </Text>
          <Legenda>
            {Math.floor(restante! / 60)}:{String(restante! % 60).padStart(2, '0')}
          </Legenda>
          <Botao variante="texto" titulo="Encerrar" onPress={encerrar} />
        </View>
      )}

      {terminou && (
        <>
          <Text style={s.guia}>{MEDITACAO_FIM.texto}</Text>
          <Texto style={{ textAlign: 'center' }}>Quer registrar o que percebeu?</Texto>
          <Botao titulo="Registrar no diário" onPress={() => router.replace('/diario-novo')} />
          <Botao variante="secundario" titulo="Meditar de novo" onPress={encerrar} />
        </>
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  opcoes: { flexDirection: 'row', gap: espaco.s },
  opcao: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.areiaClara,
  },
  opcaoSel: { backgroundColor: cores.petroleo, borderColor: cores.petroleo },
  opcaoTexto: { fontFamily: fontes.textoForte, color: cores.petroleo, fontSize: 16 },
  area: { alignItems: 'center', gap: espaco.l, paddingVertical: espaco.l },
  lago: { width: 220, height: 120, borderRadius: 110, backgroundColor: cores.salvia },
  guia: { fontFamily: fontes.tituloItalico, fontSize: 22, color: cores.petroleo, textAlign: 'center', lineHeight: 30 },
});
