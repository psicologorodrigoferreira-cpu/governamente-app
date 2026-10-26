import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Botao, Legenda, Tela, Texto } from '@/components/ui';
import { cores, fontes } from '@/lib/theme';

// Respiração diafragmática descrita no cap. 3 do livro: inspirar em 4, segurar, soltar em 6.
const FASES = [
  { nome: 'Inspire', segundos: 4, escala: 1 },
  { nome: 'Segure', segundos: 1, escala: 1 },
  { nome: 'Solte devagar', segundos: 6, escala: 0.55 },
];
const DURACAO_TOTAL = 120;

export default function Respirar() {
  const [ativo, setAtivo] = useState(false);
  const [fase, setFase] = useState(0);
  const [restante, setRestante] = useState(DURACAO_TOTAL);
  const [escala] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    if (!ativo) return;
    const f = FASES[fase];
    Animated.timing(escala, {
      toValue: f.escala,
      duration: f.segundos * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => setFase((fase + 1) % FASES.length), f.segundos * 1000);
    return () => clearTimeout(t);
  }, [ativo, fase, escala]);

  useEffect(() => {
    if (!ativo) return;
    const t = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          setAtivo(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [ativo]);

  function iniciar() {
    setRestante(DURACAO_TOTAL);
    setFase(0);
    setAtivo(true);
  }

  const terminou = !ativo && restante === 0;

  return (
    <Tela>
      <Texto>Sente-se, solte os ombros e leve o ar para a barriga. Siga o círculo por dois minutos.</Texto>
      <View style={s.area}>
        <Animated.View style={[s.circulo, { transform: [{ scale: escala }] }]} />
        <View style={s.rotulo} pointerEvents="none">
          <Text style={s.fase} accessibilityLiveRegion="polite">
            {ativo ? FASES[fase].nome : terminou ? 'Pronto.' : 'Respire'}
          </Text>
          {ativo && (
            <Legenda style={{ color: cores.areia }}>
              {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}
            </Legenda>
          )}
        </View>
      </View>
      {terminou && <Texto style={{ textAlign: 'center' }}>Repare como o corpo está agora. Qual é o próximo passo possível?</Texto>}
      <Botao titulo={ativo ? 'Parar' : terminou ? 'Fazer de novo' : 'Começar'} onPress={ativo ? () => setAtivo(false) : iniciar} />
    </Tela>
  );
}

const s = StyleSheet.create({
  area: { height: 300, alignItems: 'center', justifyContent: 'center' },
  circulo: { width: 260, height: 260, borderRadius: 130, backgroundColor: cores.petroleo },
  rotulo: { position: 'absolute', alignItems: 'center', gap: 4 },
  fase: { fontFamily: fontes.tituloItalico, fontSize: 24, color: cores.areia },
});
