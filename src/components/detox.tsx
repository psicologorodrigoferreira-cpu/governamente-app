/** Peças da trilha Detox Digital: marcadores de progresso, registro e gráfico do tempo de tela. */
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Botao, Chip, Legenda } from '@/components/ui';
import { DIAS } from '@/content/detox';
import { formatarMinutos, salvarTempoTela, TempoTela, variacao } from '@/lib/detox';
import { diaDeHoje } from '@/lib/ferramentas';
import { cores, espaco, fontes, raio } from '@/lib/theme';

/** Cinco marcadores ligados por uma linha: feito (âmbar), atual (anel) e por vir. */
export function Marcadores({ concluidos, atual, escuro }: { concluidos: number[]; atual: number | null; escuro?: boolean }) {
  const corLinha = escuro ? 'rgba(243,237,227,0.25)' : cores.linha;
  const corTexto = escuro ? cores.areia : cores.petroleo;
  return (
    <View
      style={m.linha}
      accessibilityRole="progressbar"
      accessibilityLabel={`${concluidos.length} de 5 dias concluídos`}
      accessibilityValue={{ min: 0, max: 5, now: concluidos.length }}
    >
      {DIAS.map((d, i) => {
        const feito = concluidos.includes(d.numero);
        const eAtual = atual === d.numero;
        const ligadaFeita = i > 0 && concluidos.includes(DIAS[i - 1].numero) && (feito || eAtual);
        return (
          <View key={d.numero} style={m.coluna}>
            {i > 0 && <View style={[m.trilho, { backgroundColor: ligadaFeita ? cores.ambar : corLinha }]} />}
            <View
              style={[
                m.ponto,
                { borderColor: corLinha, backgroundColor: escuro ? cores.petroleo : cores.areiaClara },
                feito && { backgroundColor: cores.ambar, borderColor: cores.ambar },
                eAtual && { borderColor: cores.ambar, borderWidth: 3 },
              ]}
            >
              {feito ? <Visto cor={cores.petroleo} /> : <Text style={[m.num, { color: corTexto }]}>{d.numero}</Text>}
            </View>
            <Text style={[m.tema, { color: corTexto, opacity: feito || eAtual ? 1 : 0.6 }]} numberOfLines={2}>
              {d.tema}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Sinal de feito desenhado (não depende da fonte). */
export function Visto({ cor = cores.petroleo, tamanho = 16 }: { cor?: string; tamanho?: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 16 16">
      <Path d="M3 8.5L6.5 12L13 4.5" stroke={cor} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const ontem = () => {
  const d = new Date(Date.now() - 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Campo para registrar o tempo de tela de ontem (dia completo) ou de hoje (até agora). */
export function RegistroTempo({ onSalvo, tempos }: { onSalvo: () => void; tempos: TempoTela[] }) {
  const [qual, setQual] = useState<'ontem' | 'hoje'>('ontem');
  const [horas, setHoras] = useState('');
  const [minutos, setMinutos] = useState('');
  const [salvando, setSalvando] = useState(false);
  const dia = qual === 'ontem' ? ontem() : diaDeHoje();
  const existente = tempos.find((t) => t.dia === dia);
  const total = (parseInt(horas || '0', 10) || 0) * 60 + (parseInt(minutos || '0', 10) || 0);

  async function salvar() {
    if (total <= 0 || total > 1440) {
      Alert.alert('Confira o tempo', 'Digite as horas e os minutos que aparecem no seu celular (até 24 horas).');
      return;
    }
    setSalvando(true);
    try {
      await salvarTempoTela(dia, total);
      setHoras('');
      setMinutos('');
      onSalvo();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={{ gap: espaco.s }}>
      <View style={m.chips}>
        <Chip rotulo="Ontem (dia inteiro)" ativo={qual === 'ontem'} onPress={() => setQual('ontem')} />
        <Chip rotulo="Hoje (até agora)" ativo={qual === 'hoje'} onPress={() => setQual('hoje')} />
      </View>
      {existente && <Legenda>Já registrado para esse dia: {formatarMinutos(existente.minutos)}. Salvar de novo substitui.</Legenda>}
      <View style={m.tempo}>
        <CampoNumero valor={horas} onChange={setHoras} rotulo="horas" max={2} />
        <CampoNumero valor={minutos} onChange={setMinutos} rotulo="min" max={2} />
        <Botao titulo="Salvar" onPress={salvar} carregando={salvando} desativado={total <= 0} style={{ flex: 1, minHeight: 48 }} />
      </View>
      <Legenda>
        {Platform.OS === 'android' ? 'Configurações → Bem-estar digital' : 'Ajustes → Tempo de Uso'} mostra esse número.
      </Legenda>
    </View>
  );
}

function CampoNumero({ valor, onChange, rotulo, max }: { valor: string; onChange: (v: string) => void; rotulo: string; max: number }) {
  return (
    <View style={m.numeroCaixa}>
      <TextInput
        value={valor}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, max))}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={cores.grafiteSuave}
        accessibilityLabel={rotulo}
        style={m.numeroCampo}
        maxLength={max}
      />
      <Text style={m.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

/** Barras dos últimos registros com a linha do ponto de partida. */
export function GraficoTempo({ tempos, base }: { tempos: TempoTela[]; base?: TempoTela }) {
  const ultimos = [...tempos].sort((a, b) => a.dia.localeCompare(b.dia)).slice(-10);
  if (ultimos.length === 0) return null;
  const maximo = Math.max(...ultimos.map((t) => t.minutos), base?.minutos ?? 0, 60);
  const ALTURA = 130;
  const ultimo = ultimos[ultimos.length - 1];
  const v = base && base.dia !== ultimo.dia ? variacao(base.minutos, ultimo.minutos) : null;

  return (
    <View style={{ gap: espaco.s }}>
      {v !== null && (
        <View style={[m.selo, { backgroundColor: v <= 0 ? '#E4EBE1' : '#F6E7D2' }]}>
          <Text style={[m.seloTexto, { color: v <= 0 ? cores.salviaEscura : cores.ambarTerra }]}>
            {v < 0 ? `${Math.abs(v)}% a menos que no início` : v === 0 ? 'Igual ao início' : `${v}% a mais que no início`}
          </Text>
        </View>
      )}
      <View
        style={[m.grafico, { height: ALTURA + 22 }]}
        accessible
        accessibilityLabel={`Tempo de tela: ${ultimos.map((t) => `${dataCurta(t.dia)}, ${formatarMinutos(t.minutos)}`).join('; ')}`}
      >
        {base && (
          <View style={[m.linhaBase, { bottom: 22 + (base.minutos / maximo) * ALTURA }]} />
        )}
        {ultimos.map((t) => (
          <View key={t.dia} style={m.barraCol}>
            <Text style={m.barraValor}>{formatarMinutos(t.minutos)}</Text>
            <View
              style={[
                m.barra,
                {
                  height: Math.max(4, (t.minutos / maximo) * ALTURA),
                  backgroundColor: base && t.minutos < base.minutos ? cores.salviaEscura : cores.petroleo,
                },
              ]}
            />
            <Text style={m.barraDia}>{dataCurta(t.dia)}</Text>
          </View>
        ))}
      </View>
      {base && (
        <View style={m.legenda}>
          <View style={m.legendaTraco} />
          <Text style={m.linhaBaseTexto}>Ponto de partida: {formatarMinutos(base.minutos)} por dia</Text>
        </View>
      )}
    </View>
  );
}

const dataCurta = (dia: string) => {
  const [, mes, d] = dia.split('-');
  return `${d}/${mes}`;
};

/** Caixa de seleção grande, fácil de tocar. */
export function ItemMarcavel({ texto, marcado, opcional, onPress }: { texto: string; marcado: boolean; opcional?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: marcado }} onPress={onPress} style={[m.item, marcado && m.itemMarcado]}>
      <View style={[m.caixa, marcado && { backgroundColor: cores.ambar, borderColor: cores.ambar }]}>
        {marcado && <Visto tamanho={15} />}
      </View>
      <Text style={m.itemTexto}>
        {texto}
        {opcional ? <Text style={{ color: cores.grafiteSuave }}> (opcional)</Text> : null}
      </Text>
    </Pressable>
  );
}

const m = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-start' },
  coluna: { flex: 1, alignItems: 'center', gap: 6 },
  trilho: { position: 'absolute', top: 17, left: '-50%', right: '50%', marginLeft: 20, marginRight: 20, height: 3, borderRadius: 2 },
  ponto: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: fontes.textoForte, fontSize: 15 },
  tema: { fontFamily: fontes.textoMedio, fontSize: 11, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  tempo: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  numeroCaixa: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  numeroCampo: {
    width: 58,
    height: 48,
    borderRadius: raio.s,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
    textAlign: 'center',
    fontFamily: fontes.titulo,
    fontSize: 22,
    color: cores.petroleo,
  },
  numeroRotulo: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.grafiteSuave },
  grafico: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barraCol: { flex: 1, alignItems: 'center', gap: 4 },
  barra: { width: '100%', maxWidth: 30, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barraValor: { fontFamily: fontes.textoMedio, fontSize: 9, color: cores.grafiteSuave },
  barraDia: { fontFamily: fontes.texto, fontSize: 10, color: cores.grafiteSuave, height: 14 },
  linhaBase: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: cores.ambar, zIndex: 1 },
  linhaBaseTexto: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.ambarTerra },
  legenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaTraco: { width: 18, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: cores.ambar },
  selo: { alignSelf: 'flex-start', borderRadius: raio.pill, paddingHorizontal: 12, paddingVertical: 6 },
  seloTexto: { fontFamily: fontes.textoForte, fontSize: 13 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    padding: 14,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
  },
  itemMarcado: { borderColor: cores.ambar, backgroundColor: '#FBF1E1' },
  caixa: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: cores.salviaEscura, alignItems: 'center', justifyContent: 'center' },
  itemTexto: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.grafite, lineHeight: 21 },
});
