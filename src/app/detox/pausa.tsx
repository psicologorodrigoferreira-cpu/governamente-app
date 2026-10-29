import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Botao, Legenda, Tela, Texto } from '@/components/ui';
import { PAUSA, PAUSA_DEPOIS, PAUSA_DURACAO } from '@/content/detox';
import { registrarPausa } from '@/lib/detox';
import { Visto } from '@/components/detox';
import { cores, espaco, fontes } from '@/lib/theme';

const R = 92;
const C = 2 * Math.PI * R;

// Um minuto guiado para atravessar o impulso de pegar o celular.
export default function PausaTela() {
  const [inicio, setInicio] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  const [fim, setFim] = useState<number | null>(null);
  const contou = useRef(false);

  const decorrido = inicio ? Math.min(PAUSA_DURACAO, (agora - inicio) / 1000) : 0;
  const terminou = decorrido >= PAUSA_DURACAO;
  const passo = [...PAUSA].reverse().find((p) => decorrido >= p.segundos) ?? PAUSA[0];

  useEffect(() => {
    if (!inicio || terminou) return;
    const t = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(t);
  }, [inicio, terminou]);

  useEffect(() => {
    if (terminou && !contou.current) {
      contou.current = true;
      registrarPausa().then(setFim).catch(() => {});
    }
  }, [terminou]);

  if (!inicio) {
    return (
      <Tela>
        <Legenda>PAUSA DO IMPULSO · 1 MINUTO</Legenda>
        <Texto>
          Bateu aquela vontade de “só dar uma olhadinha”? Antes de decidir, um minuto. Não é proibição: é você escolhendo, em vez do
          automático escolher por você.
        </Texto>
        <Botao titulo="Começar a pausa" onPress={() => { setInicio(Date.now()); setAgora(Date.now()); }} />
      </Tela>
    );
  }

  return (
    <Tela>
      <View style={s.centro}>
        <Svg width={220} height={220} viewBox="0 0 220 220">
          <Circle cx={110} cy={110} r={R} stroke={cores.linha} strokeWidth={8} fill="none" />
          <Circle
            cx={110}
            cy={110}
            r={R}
            stroke={cores.ambar}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            strokeDashoffset={C * (1 - decorrido / PAUSA_DURACAO)}
            transform="rotate(-90 110 110)"
          />
        </Svg>
        <View style={s.relogio}>
          {terminou ? <Visto cor={cores.ambarTerra} tamanho={48} /> : <Text style={s.segundos}>{Math.ceil(PAUSA_DURACAO - decorrido)}</Text>}
          <Legenda>{terminou ? 'pronto' : 'segundos'}</Legenda>
        </View>
      </View>

      {!terminou ? (
        <Text style={s.passo} accessibilityLiveRegion="polite">
          {passo.texto}
        </Text>
      ) : (
        <>
          <Text style={s.passo}>Agora você decide, com calma. Se ainda quiser pegar o celular, tudo bem: foi uma escolha.</Text>
          {fim !== null && (
            <Legenda style={{ textAlign: 'center' }}>
              Você conduziu o impulso {fim} {fim === 1 ? 'vez' : 'vezes'} por aqui.
            </Legenda>
          )}
          <View style={{ gap: espaco.s }}>
            <Legenda>SE A VONTADE CONTINUAR</Legenda>
            {PAUSA_DEPOIS.map((t) => (
              <View key={t} style={s.item}>
                <View style={s.ponto} />
                <Text style={s.itemTexto}>{t}</Text>
              </View>
            ))}
          </View>
          <Botao titulo="Voltar" onPress={() => router.back()} />
        </>
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', marginTop: espaco.m },
  relogio: { position: 'absolute', alignItems: 'center' },
  segundos: { fontFamily: fontes.titulo, fontSize: 52, color: cores.petroleo },
  passo: { fontFamily: fontes.tituloItalico, fontSize: 21, color: cores.petroleo, lineHeight: 30, textAlign: 'center', minHeight: 96 },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ponto: { width: 7, height: 7, borderRadius: 4, backgroundColor: cores.ambar, marginTop: 9 },
  itemTexto: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.grafite, lineHeight: 22 },
});
