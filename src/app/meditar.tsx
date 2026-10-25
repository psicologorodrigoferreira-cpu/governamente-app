import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Botao, Legenda, Tela, Texto } from '@/components/ui';
import { cores, espaco, fontes } from '@/lib/theme';

// Meditação curta, como no livro (caps. 3 e 12): começar com cinco minutos e voltar à respiração com gentileza.
const GUIAS: { em: number; texto: string }[] = [
  { em: 0, texto: 'Sente-se confortável. Se quiser, feche os olhos.' },
  { em: 0.1, texto: 'Leve a atenção para a respiração. Não precisa mudar nada, só observe.' },
  { em: 0.3, texto: 'Se a mente for para os desafios do dia, tudo bem. Gentilmente, volte para a respiração.' },
  { em: 0.5, texto: 'Repare no corpo: ombros, mandíbula, mãos. Solte o que der para soltar.' },
  { em: 0.7, texto: 'Pense num lago sereno: quando a água se acalma, dá para ver o fundo com clareza.' },
  { em: 0.9, texto: 'Prepare-se para voltar. O que você está sentindo agora?' },
];
const OPCOES = [3, 5, 10];

export default function Meditar() {
  const [minutos, setMinutos] = useState(5);
  const [restante, setRestante] = useState<number | null>(null);
  const total = minutos * 60;

  useEffect(() => {
    if (restante === null || restante <= 0) return;
    const t = setTimeout(() => setRestante(restante - 1), 1000);
    return () => clearTimeout(t);
  }, [restante]);

  const ativo = restante !== null && restante > 0;
  const terminou = restante === 0;
  const progresso = restante === null ? 0 : (total - restante) / total;
  const guia = [...GUIAS].reverse().find((g) => progresso >= g.em) ?? GUIAS[0];

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
          <Botao titulo="Começar" onPress={() => setRestante(total)} />
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
          <Botao variante="texto" titulo="Encerrar" onPress={() => setRestante(null)} />
        </View>
      )}

      {terminou && (
        <>
          <Text style={s.guia}>Pronto. Obrigado por esse tempo com você.</Text>
          <Texto style={{ textAlign: 'center' }}>Quer registrar o que percebeu?</Texto>
          <Botao titulo="Registrar no diário" onPress={() => router.replace('/diario-novo')} />
          <Botao variante="secundario" titulo="Meditar de novo" onPress={() => setRestante(null)} />
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
