import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { Botao, Cartao, Legenda, Subtitulo, Tela, Texto } from '@/components/ui';
import { EMOCOES } from '@/content/emocoes';
import { cores, espaco, fontes } from '@/lib/theme';

const TAM = 300;
const C = TAM / 2;

function fatia(i: number, total: number, rInt: number, rExt: number) {
  const a0 = ((i - 0.5) / total) * 2 * Math.PI - Math.PI / 2;
  const a1 = ((i + 0.5) / total) * 2 * Math.PI - Math.PI / 2;
  const p = (r: number, a: number) => `${C + r * Math.cos(a)} ${C + r * Math.sin(a)}`;
  return `M ${p(rInt, a0)} L ${p(rExt, a0)} A ${rExt} ${rExt} 0 0 1 ${p(rExt, a1)} L ${p(rInt, a1)} A ${rInt} ${rInt} 0 0 0 ${p(rInt, a0)} Z`;
}

export default function Roda() {
  const [sel, setSel] = useState(0);
  const e = EMOCOES[sel];

  return (
    <Tela>
      <Texto>
        Toque numa cor para explorar. Cada emoção tem três intensidades: dar o nome exato já é o primeiro passo para conduzi-la.
      </Texto>
      <View style={{ alignItems: 'center' }}>
        <Svg width={TAM} height={TAM} viewBox={`0 0 ${TAM} ${TAM}`} accessibilityLabel="Roda das Emoções">
          {EMOCOES.map((em, i) => {
            const meio = (i / EMOCOES.length) * 2 * Math.PI - Math.PI / 2;
            const ativo = i === sel;
            return (
              <G key={em.id} onPress={() => setSel(i)}>
                {[0, 1, 2].map((anel) => (
                  <Path
                    key={anel}
                    d={fatia(i, EMOCOES.length, 34 + anel * 38, 34 + (anel + 1) * 38 - 2)}
                    fill={em.cor}
                    opacity={(ativo ? 1 : 0.55) * (1 - anel * 0.22)}
                    stroke={cores.areia}
                    strokeWidth={2}
                  />
                ))}
                <SvgText
                  x={C + 92 * Math.cos(meio)}
                  y={C + 92 * Math.sin(meio) + 4}
                  fontSize={10.5}
                  fontWeight="700"
                  fill={cores.petroleoProfundo}
                  textAnchor="middle"
                >
                  {em.nome}
                </SvgText>
              </G>
            );
          })}
          <Circle cx={C} cy={C} r={30} fill={cores.petroleo} />
          <Circle cx={C + 9} cy={C - 9} r={4} fill={cores.ambar} />
        </Svg>
      </View>

      <View style={s.botoes}>
        {EMOCOES.map((em, i) => (
          <Text
            key={em.id}
            accessibilityRole="button"
            onPress={() => setSel(i)}
            style={[s.nome, { borderColor: em.cor }, i === sel && { backgroundColor: em.cor, color: cores.branco }]}
          >
            {em.nome}
          </Text>
        ))}
      </View>

      <Cartao>
        <View style={[s.faixa, { backgroundColor: e.cor }]} />
        <Subtitulo>{e.nome}</Subtitulo>
        <Legenda>
          {e.intensidades[0]} → {e.intensidades[1]} → {e.intensidades[2]}
        </Legenda>
        <Texto>
          <Text style={s.forte}>Para que serve: </Text>
          {e.funcao}
        </Texto>
        <Texto>
          <Text style={s.forte}>Como conduzir: </Text>
          {e.conduzir}
        </Texto>
      </Cartao>
      <Botao titulo="Registrar no diário" onPress={() => router.push('/diario-novo')} />
      <Legenda style={{ textAlign: 'center', marginTop: espaco.s }}>Baseada no modelo de emoções de Robert Plutchik.</Legenda>
    </Tela>
  );
}

const s = StyleSheet.create({
  botoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  nome: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: cores.grafite,
    overflow: 'hidden',
  },
  faixa: { height: 6, borderRadius: 3, width: 48 },
  forte: { fontFamily: fontes.textoForte, color: cores.petroleo },
});
