import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Botao, Cartao, Destaque, Legenda, Subtitulo, Tela, Texto } from '@/components/ui';
import { GraficoTempo, Marcadores, RegistroTempo, Visto } from '@/components/detox';
import { AMBIENTE, DETOX, DIAS, FUNDAMENTOS, MANUTENCAO } from '@/content/detox';
import {
  contarPausas,
  DiaConcluido,
  diaLiberado,
  estadoDetox,
  listarDetox,
  listarTempoTela,
  pontoDePartida,
  recomecarDetox,
  TempoTela,
} from '@/lib/detox';
import { souAdmin } from '@/lib/admin';
import { cores, espaco, fontes } from '@/lib/theme';

export default function DetoxTela() {
  const [lista, setLista] = useState<DiaConcluido[]>([]);
  const [tempos, setTempos] = useState<TempoTela[]>([]);
  const [pausas, setPausas] = useState(0);
  const [admin, setAdmin] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);

  const carregar = useCallback(() => {
    listarDetox().then(setLista).catch(() => {});
    listarTempoTela().then(setTempos).catch(() => {});
    contarPausas().then(setPausas).catch(() => {});
    souAdmin().then(setAdmin).catch(() => {});
  }, []);
  useFocusEffect(carregar);

  const e = estadoDetox(lista);
  const base = pontoDePartida(tempos, lista);
  const proximoDia = e.proximo ? DIAS[e.proximo - 1] : null;

  function recomecar() {
    const executar = () => recomecarDetox().then(carregar).catch(() => {});
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Recomeçar a trilha? Os 5 dias voltam a ficar pendentes.')) executar();
      return;
    }
    Alert.alert('Recomeçar a trilha?', 'Os 5 dias voltam a ficar pendentes. Seus registros de tempo de tela continuam.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Recomeçar', onPress: executar },
    ]);
  }

  return (
    <Tela>
      <Cartao escuro style={{ gap: espaco.m }}>
        <Legenda style={{ color: cores.salvia }}>TRILHA EM DESTAQUE · 5 DIAS</Legenda>
        <Text style={s.titulo}>
          Detox <Text style={s.tituloItalico}>Digital</Text>
        </Text>
        <Text style={s.textoEscuro}>{DETOX.subtitulo}. {DETOX.chamada}</Text>
        <Marcadores concluidos={e.concluidos} atual={e.proximo} escuro />
        <Text style={s.legendaEscura}>
          {e.terminou
            ? 'Trilha concluída. Agora é sustentar.'
            : `${e.concluidos.length} de 5 dias · ${Math.round((e.concluidos.length / 5) * 100)}%`}
        </Text>
      </Cartao>

      {proximoDia && (
        <Cartao
          onPress={() => (diaLiberado(proximoDia.numero, e, admin) ? router.push(`/detox/dia/${proximoDia.numero}`) : undefined)}
          rotulo={`Dia ${proximoDia.numero}: ${proximoDia.titulo}`}
          style={e.liberaAmanha && !admin ? undefined : s.destaque}
        >
          <Legenda>
            {e.liberaAmanha ? 'AMANHÃ' : e.concluidos.length === 0 ? 'COMECE HOJE' : 'PASSO DE HOJE'} · DIA {proximoDia.numero} ·{' '}
            {proximoDia.minutos} MIN
          </Legenda>
          <Subtitulo>{proximoDia.titulo}</Subtitulo>
          {e.liberaAmanha ? (
            <Texto style={{ color: cores.grafiteSuave }}>
              Ajuste de hoje feito. Um passo por dia: o dia {proximoDia.numero} abre amanhã. Enquanto isso, registre seu tempo de tela
              abaixo.
            </Texto>
          ) : (
            <Text style={s.link}>{e.concluidos.length === 0 ? 'Começar o dia 1 →' : `Abrir o dia ${proximoDia.numero} →`}</Text>
          )}
          {e.liberaAmanha && admin && <Text style={s.link}>Abrir mesmo assim (administrador) →</Text>}
        </Cartao>
      )}

      {e.terminou && (
        <Cartao onPress={() => router.push('/detox/concluido')} rotulo="Ver o resultado da trilha" style={s.destaque}>
          <Legenda>TRILHA CONCLUÍDA</Legenda>
          <Subtitulo>Ver o seu resultado</Subtitulo>
          <Text style={s.link}>Comparar com o dia 1 →</Text>
        </Cartao>
      )}

      <Cartao>
        <Legenda>SEU TEMPO DE TELA</Legenda>
        <Texto style={{ fontSize: 15 }}>
          Registre todo dia o número que o celular mostra. O gráfico compara com o seu ponto de partida.
        </Texto>
        <RegistroTempo tempos={tempos} onSalvo={carregar} />
        <GraficoTempo tempos={tempos} base={base} />
      </Cartao>

      <Cartao onPress={() => router.push('/detox/pausa')} rotulo="Abrir a pausa do impulso" style={{ borderColor: cores.salvia }}>
        <Legenda style={{ color: cores.salviaEscura }}>QUANDO A VONTADE APERTAR</Legenda>
        <Subtitulo>Pausa do impulso · 1 minuto</Subtitulo>
        <Texto style={{ fontSize: 15, color: cores.grafiteSuave }}>
          {pausas > 0
            ? `Você já conduziu o impulso ${pausas} ${pausas === 1 ? 'vez' : 'vezes'} por aqui.`
            : 'Antes do "só um minutinho", um minuto guiado para decidir com calma.'}
        </Texto>
      </Cartao>

      <Subtitulo>Os 5 dias</Subtitulo>
      <View style={{ gap: espaco.s }}>
        {DIAS.map((d) => {
          const feito = e.concluidos.includes(d.numero);
          const liberado = diaLiberado(d.numero, e, admin);
          return (
            <Cartao
              key={d.numero}
              onPress={liberado ? () => router.push(`/detox/dia/${d.numero}`) : undefined}
              rotulo={`Dia ${d.numero}: ${d.titulo}${liberado ? '' : ', bloqueado'}`}
              style={liberado ? s.linha : [s.linha, { opacity: 0.55 }]}
            >
              <View style={[s.numero, { backgroundColor: feito ? cores.ambar : liberado ? cores.petroleo : cores.salvia }]}>
                {feito ? <Visto /> : <Text style={s.numeroTexto}>{d.numero}</Text>}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.tema}>{d.tema.toUpperCase()}</Text>
                <Text style={s.diaTitulo}>{d.titulo}</Text>
                <Text style={s.meta}>{feito ? 'Feito' : liberado ? `${d.minutos} min` : 'Abre depois do dia anterior'}</Text>
              </View>
            </Cartao>
          );
        })}
      </View>

      <Subtitulo>
        Por que <Destaque>funciona</Destaque>
      </Subtitulo>
      {FUNDAMENTOS.map((f) => (
        <Sanfona key={f.titulo} titulo={f.titulo} aberto={aberto === f.titulo} onPress={() => setAberto(aberto === f.titulo ? null : f.titulo)}>
          <Texto style={{ fontSize: 15 }}>{f.texto}</Texto>
        </Sanfona>
      ))}

      <Subtitulo>Para depois da trilha</Subtitulo>
      <Sanfona titulo="Plano de manutenção" aberto={aberto === 'manut'} onPress={() => setAberto(aberto === 'manut' ? null : 'manut')}>
        {MANUTENCAO.map((g) => (
          <View key={g.quando} style={{ gap: 4 }}>
            <Text style={s.grupo}>{g.quando}</Text>
            {g.itens.map((t) => (
              <Item key={t} texto={t} />
            ))}
          </View>
        ))}
      </Sanfona>
      <Sanfona titulo="Ambiente sem gatilhos" aberto={aberto === 'amb'} onPress={() => setAberto(aberto === 'amb' ? null : 'amb')}>
        {AMBIENTE.map((g) => (
          <View key={g.lugar} style={{ gap: 4 }}>
            <Text style={s.grupo}>{g.lugar}</Text>
            {g.itens.map((t) => (
              <Item key={t} texto={t} />
            ))}
          </View>
        ))}
      </Sanfona>

      <Cartao style={{ backgroundColor: cores.areia }}>
        <Text style={s.citacao}>“{DETOX.frase}”</Text>
      </Cartao>

      {e.concluidos.length > 0 && <Botao variante="texto" titulo="Recomeçar a trilha" onPress={recomecar} />}
    </Tela>
  );
}

function Sanfona({ titulo, aberto, onPress, children }: { titulo: string; aberto: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <View style={s.sanfona}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: aberto }} onPress={onPress} style={s.sanfonaTopo}>
        <Text style={s.sanfonaTitulo}>{titulo}</Text>
        <Text style={s.sanfonaSinal}>{aberto ? '–' : '+'}</Text>
      </Pressable>
      {aberto && <View style={{ gap: espaco.s, paddingTop: espaco.s }}>{children}</View>}
    </View>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <View style={s.item}>
      <View style={s.ponto} />
      <Text style={s.itemTexto}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontFamily: fontes.titulo, fontSize: 32, color: cores.areia, lineHeight: 38 },
  tituloItalico: { fontFamily: fontes.tituloItalico, color: cores.ambar },
  textoEscuro: { fontFamily: fontes.texto, fontSize: 15, color: cores.areia, opacity: 0.9, lineHeight: 22 },
  legendaEscura: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.salvia },
  destaque: { borderColor: cores.ambar, borderWidth: 1.5, backgroundColor: '#FBF1E1' },
  link: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.ambarTerra },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  numero: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  numeroTexto: { fontFamily: fontes.textoForte, color: cores.areia, fontSize: 16 },
  tema: { fontFamily: fontes.textoMedio, fontSize: 11, letterSpacing: 0.4, color: cores.salviaEscura },
  diaTitulo: { fontFamily: fontes.titulo, fontSize: 17, color: cores.petroleo },
  meta: { fontFamily: fontes.texto, fontSize: 13, color: cores.grafiteSuave },
  sanfona: { borderBottomWidth: 1, borderColor: cores.linha, paddingVertical: espaco.s },
  sanfonaTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40, gap: espaco.s },
  sanfonaTitulo: { flex: 1, fontFamily: fontes.textoForte, fontSize: 16, color: cores.petroleo },
  sanfonaSinal: { fontFamily: fontes.titulo, fontSize: 22, color: cores.ambarTerra },
  grupo: { fontFamily: fontes.textoForte, fontSize: 14, color: cores.salviaEscura, marginTop: 4 },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ponto: { width: 7, height: 7, borderRadius: 4, backgroundColor: cores.ambar, marginTop: 9 },
  itemTexto: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.grafite, lineHeight: 22 },
  citacao: { fontFamily: fontes.tituloItalico, fontSize: 18, color: cores.petroleo, lineHeight: 26 },
});
