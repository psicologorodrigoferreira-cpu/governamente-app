import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Botao, Legenda, Tela, Texto } from '@/components/ui';
import { ControlesGuia, useGuia } from '@/components/ControlesGuia';
import { RESPIRO } from '@/content/guias';
import { falar, silenciar, tocar } from '@/lib/guia';
import { cores, fontes } from '@/lib/theme';

// Respiração diafragmática descrita no cap. 3 do livro: inspirar em 4, segurar, soltar em 6.
const FASES = [
  { nome: 'Inspire', segundos: 4, escala: 1, fala: RESPIRO.inspire, som: 'inspirar' as const },
  { nome: 'Segure', segundos: 1, escala: 1, fala: RESPIRO.segure, som: null },
  { nome: 'Solte devagar', segundos: 6, escala: 0.55, fala: RESPIRO.solte, som: 'soltar' as const },
];
const DURACAO_TOTAL = 120;

type Etapa = 'parado' | 'abertura' | 'ativo' | 'fim';

export default function Respirar() {
  const { prefs, mudar } = useGuia();
  const [etapa, setEtapa] = useState<Etapa>('parado');
  const [fase, setFase] = useState(0);
  const [ciclo, setCiclo] = useState(1);
  const [restante, setRestante] = useState(DURACAO_TOTAL);
  const [escala] = useState(() => new Animated.Value(0.55));
  const prefsRef = useRef(prefs);
  const sessao = useRef(0);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Ao sair da tela, cala a voz.
  useEffect(() => () => silenciar(), []);

  // Cada fase: anima o círculo, toca o som e fala o comando.
  useEffect(() => {
    if (etapa !== 'ativo') return;
    const f = FASES[fase];
    const p = prefsRef.current;
    if (p.sons && f.som) tocar(f.som, 0.5);
    if (p.voz) {
      const lembrete = fase === 0 ? RESPIRO.lembretes[ciclo] : undefined;
      if (lembrete) falar(lembrete);
      else if (ciclo <= RESPIRO.ciclosComVoz) falar(f.fala);
    }
    Animated.timing(escala, {
      toValue: f.escala,
      duration: f.segundos * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => {
      if (fase === FASES.length - 1) setCiclo((c) => c + 1);
      setFase((fase + 1) % FASES.length);
    }, f.segundos * 1000);
    return () => clearTimeout(t);
  }, [etapa, fase, ciclo, escala]);

  // Relógio de 2 minutos.
  useEffect(() => {
    if (etapa !== 'ativo') return;
    const t = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          setEtapa('fim');
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [etapa]);

  // Fechamento.
  useEffect(() => {
    if (etapa !== 'fim') return;
    const p = prefsRef.current;
    if (p.sons) tocar('sino', 0.6);
    if (p.voz) setTimeout(() => falar(RESPIRO.fechamento), p.sons ? 1500 : 0);
  }, [etapa]);

  function comecarCiclos() {
    setRestante(DURACAO_TOTAL);
    setFase(0);
    setCiclo(1);
    setEtapa('ativo');
  }

  function iniciar() {
    silenciar();
    if (prefs.sons) tocar('sino', 0.6);
    if (!prefs.voz) {
      comecarCiclos();
      return;
    }
    setEtapa('abertura');
    const minha = ++sessao.current;
    let foi = false;
    const seguir = () => {
      if (foi || sessao.current !== minha) return;
      foi = true;
      comecarCiclos();
    };
    // Começa quando a voz terminar a abertura (ou em 10 s, se o aparelho não avisar).
    setTimeout(() => {
      if (sessao.current === minha) falar(RESPIRO.abertura, () => setTimeout(seguir, 600));
    }, prefs.sons ? 1200 : 0);
    setTimeout(seguir, 10000);
  }

  function parar() {
    sessao.current++;
    silenciar();
    setEtapa('parado');
    setRestante(DURACAO_TOTAL);
    Animated.timing(escala, { toValue: 0.55, duration: 400, useNativeDriver: true }).start();
  }

  const emAndamento = etapa === 'ativo' || etapa === 'abertura';
  const rotulo = etapa === 'ativo' ? FASES[fase].nome : etapa === 'abertura' ? 'Prepare-se' : etapa === 'fim' ? 'Pronto.' : 'Respire';

  return (
    <Tela>
      <Texto>Sente-se, solte os ombros e leve o ar para a barriga. Siga o círculo e a voz por dois minutos.</Texto>
      {!emAndamento && <ControlesGuia prefs={prefs} mudar={mudar} />}
      <View style={s.area}>
        <Animated.View style={[s.circulo, { transform: [{ scale: escala }] }]} />
        <View style={s.rotulo} pointerEvents="none">
          <Text style={s.fase} accessibilityLiveRegion="polite">
            {rotulo}
          </Text>
          {etapa === 'ativo' && (
            <Legenda style={{ color: cores.areia }}>
              {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}
            </Legenda>
          )}
        </View>
      </View>
      {etapa === 'fim' && <Texto style={{ textAlign: 'center' }}>{RESPIRO.fechamento.texto.replace('Pronto. ', '')}</Texto>}
      <Botao titulo={emAndamento ? 'Parar' : etapa === 'fim' ? 'Fazer de novo' : 'Começar'} onPress={emAndamento ? parar : iniciar} />
      {prefs.voz && !emAndamento && (
        <Legenda style={{ textAlign: 'center' }}>No iPhone, tire do modo silencioso para ouvir a voz.</Legenda>
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  area: { height: 300, alignItems: 'center', justifyContent: 'center' },
  circulo: { width: 260, height: 260, borderRadius: 130, backgroundColor: cores.petroleo },
  rotulo: { position: 'absolute', alignItems: 'center', gap: 4 },
  fase: { fontFamily: fontes.tituloItalico, fontSize: 24, color: cores.areia },
});
