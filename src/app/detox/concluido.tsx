import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Botao, Cartao, Legenda, Logo, Subtitulo, Tela, Texto } from '@/components/ui';
import { GraficoTempo, Marcadores, Visto } from '@/components/detox';
import { DiaConcluido, formatarMinutos, listarDetox, listarTempoTela, pontoDePartida, TempoTela, variacao } from '@/lib/detox';
import { cores, espaco, fontes } from '@/lib/theme';

export default function DetoxConcluido() {
  const [lista, setLista] = useState<DiaConcluido[]>([]);
  const [tempos, setTempos] = useState<TempoTela[]>([]);
  useFocusEffect(
    useCallback(() => {
      listarDetox().then(setLista).catch(() => {});
      listarTempoTela().then(setTempos).catch(() => {});
    }, []),
  );

  const base = pontoDePartida(tempos, lista);
  const atual = [...tempos].sort((a, b) => b.dia.localeCompare(a.dia))[0];
  const v = base && atual && base.dia !== atual.dia ? variacao(base.minutos, atual.minutos) : null;
  const ganho = base && atual ? base.minutos - atual.minutos : 0;
  const d1 = lista.find((d) => d.dia === 1)?.dados;
  const silenciados = lista.find((d) => d.dia === 3)?.dados.silenciados ?? 0;

  return (
    <Tela>
      <Cartao escuro style={{ alignItems: 'center', gap: espaco.m, paddingVertical: espaco.l }}>
        <Logo size={56} fundo="escuro" />
        <Legenda style={{ color: cores.salvia }}>DETOX DIGITAL · CONCLUÍDO</Legenda>
        <Text style={s.titulo}>
          Você conduziu <Text style={s.italico}>5 dias</Text>.
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Marcadores concluidos={lista.map((d) => d.dia)} atual={null} escuro />
        </View>
      </Cartao>

      {base && atual && (
        <Cartao>
          <Legenda>DO DIA 1 ATÉ HOJE</Legenda>
          <View style={s.numeros}>
            <Numero rotulo="Início" valor={formatarMinutos(base.minutos)} />
            <Text style={s.seta}>→</Text>
            <Numero rotulo="Agora" valor={formatarMinutos(atual.minutos)} destaque />
          </View>
          {v !== null && ganho > 0 && (
            <Texto>
              São <Text style={s.forte}>{formatarMinutos(ganho)} a menos por dia</Text> ({Math.abs(v)}%). Em uma semana, isso dá{' '}
              {formatarMinutos(ganho * 7)} de volta para você.
            </Texto>
          )}
          {v !== null && ganho <= 0 && (
            <Texto>
              O número ainda não caiu, e tudo bem: os ajustes seguem trabalhando. Mantenha a revisão semanal e observe a curva nas próximas
              semanas.
            </Texto>
          )}
          <GraficoTempo tempos={tempos} base={base} />
        </Cartao>
      )}

      <Cartao>
        <Legenda>O QUE VOCÊ CONSTRUIU</Legenda>
        {!!d1?.gatilhos?.length && <Item texto={`Mapeou seus gatilhos: ${d1.gatilhos.join(', ').toLowerCase()}.`} />}
        <Item texto="Tirou a cor da tela." />
        <Item texto={silenciados ? `Silenciou ${silenciados} ${silenciados === 1 ? 'app' : 'apps'} que chamavam sem ser gente.` : 'Silenciou os avisos de algoritmo.'} />
        <Item texto="Colocou distância entre você e o impulso." />
        <Item texto="Combinou uma revisão semanal de 5 minutos." />
      </Cartao>

      <Cartao style={{ backgroundColor: cores.areia }}>
        <Text style={s.citacao}>
          Escorregou? Não existe recomeçar do zero. Volte ao ajuste na próxima chance. Sono, foco, ansiedade e procrastinação seguem a mesma
          lógica: ambiente antes de disciplina.
        </Text>
      </Cartao>

      <Subtitulo>Próximo passo</Subtitulo>
      <Botao titulo="Seguir a trilha do método" onPress={() => router.replace('/(tabs)/trilha')} />
      <Botao variante="secundario" titulo="Voltar ao Detox Digital" onPress={() => router.replace('/detox')} />
    </Tela>
  );
}

function Numero({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Legenda>{rotulo.toUpperCase()}</Legenda>
      <Text style={[s.numero, destaque && { color: cores.ambarTerra }]}>{valor}</Text>
    </View>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <View style={s.item}>
      <View style={{ marginTop: 3 }}>
        <Visto cor={cores.ambarTerra} />
      </View>
      <Text style={s.itemTexto}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontFamily: fontes.titulo, fontSize: 28, color: cores.areia, textAlign: 'center', lineHeight: 34 },
  italico: { fontFamily: fontes.tituloItalico, color: cores.ambar },
  numeros: { flexDirection: 'row', alignItems: 'center' },
  numero: { fontFamily: fontes.titulo, fontSize: 30, color: cores.petroleo },
  seta: { fontFamily: fontes.titulo, fontSize: 24, color: cores.salviaEscura },
  forte: { fontFamily: fontes.textoForte, color: cores.petroleo },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  itemTexto: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.grafite, lineHeight: 22 },
  citacao: { fontFamily: fontes.tituloItalico, fontSize: 17, color: cores.petroleo, lineHeight: 25 },
});
