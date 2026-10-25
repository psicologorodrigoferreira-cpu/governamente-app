import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { Botao, Cartao, Chip, Destaque, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { CheckIn, listarCheckins, listarConcluidas, listarDiario, RegistroDiario } from '@/lib/dados';
import { Gratidao, lerConstancia, listarGratidao } from '@/lib/ferramentas';
import { cores, fontes } from '@/lib/theme';

const METRICAS = [
  { id: 'conducao', nome: 'Condução', cor: cores.petroleo },
  { id: 'ansiedade', nome: 'Ansiedade', cor: cores.alerta },
  { id: 'humor', nome: 'Humor', cor: cores.ambar },
  { id: 'energia', nome: 'Energia', cor: cores.salviaEscura },
  { id: 'sono', nome: 'Sono', cor: '#5C7A9A' },
] as const;
type Metrica = (typeof METRICAS)[number]['id'];

const chaveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const nomeMes = (k: string) => {
  const [a, m] = k.split('-').map(Number);
  const txt = new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};
const mesAnterior = (k: string) => {
  const [a, m] = k.split('-').map(Number);
  return chaveMes(new Date(a, m - 2, 1));
};
const media = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : null);

export default function Evolucao() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [diario, setDiario] = useState<RegistroDiario[]>([]);
  const [gratidao, setGratidao] = useState<Gratidao[]>([]);
  const [constancia, setConstancia] = useState<string[]>([]);
  const [estacoes, setEstacoes] = useState(0);
  const [ativas, setAtivas] = useState<Metrica[]>(['conducao', 'ansiedade']);
  const [mes, setMes] = useState(chaveMes(new Date()));

  useFocusEffect(
    useCallback(() => {
      Promise.all([listarCheckins(), listarDiario(), listarGratidao(), lerConstancia(), listarConcluidas()])
        .then(([c, d, g, k, e]) => {
          setCheckins(c);
          setDiario(d);
          setGratidao(g);
          setConstancia(k.dias);
          setEstacoes(e.length);
        })
        .catch(() => {});
    }, []),
  );

  const serie = useMemo(() => [...checkins].reverse().slice(-12), [checkins]);

  const resumo = useMemo(() => {
    const doMes = (k: string) => ({
      diario: diario.filter((r) => chaveMes(new Date(r.criado_em)) === k),
      checkins: checkins.filter((c) => chaveMes(new Date(c.criado_em)) === k),
      gratidao: gratidao.filter((g) => g.dia.startsWith(k)).length,
      constancia: constancia.filter((d) => d.startsWith(k)).length,
    });
    const a = doMes(mes);
    const b = doMes(mesAnterior(mes));
    const emocoes: Record<string, number> = {};
    a.diario.forEach((r) => r.emocoes.forEach((e) => (emocoes[e] = (emocoes[e] ?? 0) + 1)));
    return {
      atual: a,
      anterior: b,
      conducao: media(a.checkins.map((c) => c.conducao)),
      conducaoAnt: media(b.checkins.map((c) => c.conducao)),
      ansiedade: media(a.checkins.map((c) => c.ansiedade)),
      ansiedadeAnt: media(b.checkins.map((c) => c.ansiedade)),
      intensidade: media(a.diario.map((r) => r.intensidade)),
      emocoes: Object.entries(emocoes).sort((x, y) => y[1] - x[1]).slice(0, 6),
    };
  }, [mes, diario, checkins, gratidao, constancia]);

  const meses = useMemo(() => {
    const l: string[] = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) l.push(chaveMes(new Date(d.getFullYear(), d.getMonth() - i, 1)));
    return l;
  }, []);

  const frase = (() => {
    const p: string[] = [];
    const { atual } = resumo;
    if (atual.diario.length === 0 && atual.checkins.length === 0) return 'Ainda não há registros neste mês. Um registro por dia já mostra muito.';
    p.push(`Você fez ${atual.diario.length} registro(s) no diário e ${atual.checkins.length} check-in(s).`);
    if (resumo.conducao !== null && resumo.conducaoAnt !== null) {
      const dif = resumo.conducao - resumo.conducaoAnt;
      if (Math.abs(dif) >= 0.3) p.push(dif > 0 ? 'Sua sensação de conduzir as emoções subiu em relação ao mês anterior.' : 'Sua sensação de conduzir as emoções caiu em relação ao mês anterior: vale olhar com gentileza o que mudou.');
    }
    if (resumo.ansiedade !== null && resumo.ansiedadeAnt !== null) {
      const dif = resumo.ansiedade - resumo.ansiedadeAnt;
      if (Math.abs(dif) >= 0.3) p.push(dif < 0 ? 'A ansiedade atrapalhou menos do que no mês anterior.' : 'A ansiedade pesou mais do que no mês anterior.');
    }
    if (resumo.emocoes[0]) p.push(`A emoção mais presente foi ${resumo.emocoes[0][0].toLowerCase()}.`);
    return p.join(' ');
  })();

  return (
    <Tela>
      <Titulo>
        Minha <Destaque>evolução</Destaque>
      </Titulo>
      <Texto>Um olhar para o caminho feito. Não é nota: é para você perceber padrões e reconhecer o que mudou.</Texto>

      <Subtitulo>Check-ins ao longo do tempo</Subtitulo>
      <View style={s.chips}>
        {METRICAS.map((m) => (
          <Chip
            key={m.id}
            rotulo={m.nome}
            cor={m.cor}
            ativo={ativas.includes(m.id)}
            onPress={() => setAtivas(ativas.includes(m.id) ? ativas.filter((x) => x !== m.id) : [...ativas, m.id])}
          />
        ))}
      </View>
      {serie.length < 2 ? (
        <Cartao>
          <Texto style={{ color: cores.grafiteSuave }}>O gráfico aparece a partir do segundo check-in semanal.</Texto>
          <Botao variante="secundario" titulo="Fazer o check-in" onPress={() => router.push('/checkin')} />
        </Cartao>
      ) : (
        <Grafico serie={serie} ativas={ativas} />
      )}

      <Subtitulo>Resumo do mês</Subtitulo>
      <View style={s.chips}>
        {meses.map((k) => (
          <Pressable key={k} onPress={() => setMes(k)} accessibilityRole="button" accessibilityState={{ selected: mes === k }}>
            <Text style={[s.mes, mes === k && s.mesAtivo]}>{nomeMes(k).split(' ')[0]}</Text>
          </Pressable>
        ))}
      </View>
      <Cartao escuro>
        <Text style={s.mesTitulo}>{nomeMes(mes)}</Text>
        <Text style={s.frase}>{frase}</Text>
      </Cartao>
      <View style={s.grade}>
        <Numero valor={resumo.atual.diario.length} rotulo="Registros no diário" ant={resumo.anterior.diario.length} />
        <Numero valor={resumo.atual.checkins.length} rotulo="Check-ins" ant={resumo.anterior.checkins.length} />
        <Numero valor={resumo.conducao !== null ? resumo.conducao.toFixed(1) : '–'} rotulo="Condução média (0–4)" />
        <Numero valor={resumo.ansiedade !== null ? resumo.ansiedade.toFixed(1) : '–'} rotulo="Ansiedade média (0–4)" />
        <Numero valor={resumo.atual.gratidao} rotulo="Dias com gratidão" ant={resumo.anterior.gratidao} />
        <Numero valor={resumo.atual.constancia} rotulo="Dias de constância" ant={resumo.anterior.constancia} />
      </View>

      <Subtitulo>Emoções do mês</Subtitulo>
      {resumo.emocoes.length === 0 ? (
        <Legenda>Sem registros no diário neste mês.</Legenda>
      ) : (
        resumo.emocoes.map(([e, n]) => (
          <View key={e} style={{ gap: 4 }}>
            <View style={s.eixoTopo}>
              <Text style={s.eixoNome}>{e}</Text>
              <Text style={s.eixoN}>{n}x</Text>
            </View>
            <View style={s.barra}>
              <View style={[s.barraCheia, { width: `${(n / resumo.emocoes[0][1]) * 100}%` }]} />
            </View>
          </View>
        ))
      )}
      {resumo.intensidade !== null && <Legenda>Intensidade média das emoções registradas: {resumo.intensidade.toFixed(1)} de 10.</Legenda>}

      <Cartao>
        <Text style={s.estacoes}>{estacoes} de 15</Text>
        <Legenda>estações da trilha concluídas</Legenda>
      </Cartao>
      <Botao variante="secundario" titulo="Exportar meu diário em PDF" onPress={() => router.push('/exportar')} />
    </Tela>
  );
}

function Numero({ valor, rotulo, ant }: { valor: number | string; rotulo: string; ant?: number }) {
  const dif = typeof valor === 'number' && ant !== undefined ? valor - ant : null;
  return (
    <View style={s.numero}>
      <Text style={s.numeroValor}>{valor}</Text>
      <Text style={s.numeroRotulo}>{rotulo}</Text>
      {dif !== null && dif !== 0 && (
        <Text style={[s.dif, { color: dif > 0 ? cores.salviaEscura : cores.grafiteSuave }]}>
          {dif > 0 ? `+${dif}` : dif} vs mês anterior
        </Text>
      )}
    </View>
  );
}

function Grafico({ serie, ativas }: { serie: CheckIn[]; ativas: Metrica[] }) {
  const L = 340;
  const A = 190;
  const m = { e: 26, d: 10, t: 12, b: 26 };
  const w = L - m.e - m.d;
  const h = A - m.t - m.b;
  const x = (i: number) => m.e + (serie.length === 1 ? w / 2 : (i / (serie.length - 1)) * w);
  const y = (v: number) => m.t + h - (v / 4) * h;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="100%" height={A} viewBox={`0 0 ${L} ${A}`} accessibilityLabel="Gráfico dos check-ins semanais">
        {[0, 1, 2, 3, 4].map((v) => (
          <Line key={v} x1={m.e} x2={L - m.d} y1={y(v)} y2={y(v)} stroke={cores.linha} strokeWidth={1} />
        ))}
        {[0, 2, 4].map((v) => (
          <SvgText key={v} x={m.e - 8} y={y(v) + 4} fontSize={10} fill={cores.grafiteSuave} textAnchor="end">
            {v}
          </SvgText>
        ))}
        {serie.map((c, i) =>
          i === 0 || i === serie.length - 1 || i % 3 === 0 ? (
            <SvgText key={c.id} x={x(i)} y={A - 8} fontSize={10} fill={cores.grafiteSuave} textAnchor="middle">
              {new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </SvgText>
          ) : null,
        )}
        {METRICAS.filter((mt) => ativas.includes(mt.id)).map((mt) => (
          <Polyline
            key={mt.id}
            points={serie.map((c, i) => `${x(i)},${y(c[mt.id])}`).join(' ')}
            fill="none"
            stroke={mt.cor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {METRICAS.filter((mt) => ativas.includes(mt.id)).map((mt) =>
          serie.map((c, i) => <Circle key={`${mt.id}-${c.id}`} cx={x(i)} cy={y(c[mt.id])} r={3} fill={mt.cor} />),
        )}
      </Svg>
      <Legenda>Escala de 0 a 4. Em ansiedade, quanto mais baixo, melhor.</Legenda>
    </View>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mes: {
    fontFamily: fontes.textoMedio,
    fontSize: 14,
    color: cores.petroleo,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  mesAtivo: { backgroundColor: cores.petroleo, color: cores.areia, borderColor: cores.petroleo },
  mesTitulo: { fontFamily: fontes.titulo, fontSize: 20, color: cores.areia },
  frase: { fontFamily: fontes.texto, fontSize: 15, color: cores.areia, lineHeight: 22, opacity: 0.92 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numero: { flexBasis: '47%', flexGrow: 1, backgroundColor: cores.areiaClara, borderRadius: 14, borderWidth: 1, borderColor: cores.linha, padding: 12, gap: 2 },
  numeroValor: { fontFamily: fontes.titulo, fontSize: 26, color: cores.petroleo },
  numeroRotulo: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.grafiteSuave },
  dif: { fontFamily: fontes.textoMedio, fontSize: 11 },
  eixoTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  eixoNome: { fontFamily: fontes.textoForte, fontSize: 14, color: cores.petroleo },
  eixoN: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.grafiteSuave },
  barra: { height: 8, borderRadius: 4, backgroundColor: cores.linha, overflow: 'hidden' },
  barraCheia: { height: 8, borderRadius: 4, backgroundColor: cores.ambar },
  estacoes: { fontFamily: fontes.titulo, fontSize: 24, color: cores.petroleo },
});
