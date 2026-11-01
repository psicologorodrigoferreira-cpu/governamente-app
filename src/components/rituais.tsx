/** Peças dos rituais diários: a semana em pontos e o cartão do Início. */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Legenda } from '@/components/ui';
import { perguntaDoDia, proximoSelo } from '@/content/rituais';
import { EstadoRituais, ritualDaVez } from '@/lib/rituais';
import { cores, espaco, fontes, raio } from '@/lib/theme';

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Sete dias: ponto vazio (nenhum ritual), meio cheio (um) e cheio (manhã e noite). */
export function Semana({ semana, escuro }: { semana: { dia: string; feitos: number }[]; escuro?: boolean }) {
  const corTexto = escuro ? cores.areia : cores.grafiteSuave;
  const vazio = escuro ? 'rgba(243,237,227,0.25)' : cores.linha;
  return (
    <View
      style={s.semana}
      accessible
      accessibilityLabel={`Últimos 7 dias: ${semana.filter((d) => d.feitos > 0).length} com ritual`}
    >
      {semana.map((d, i) => {
        const letra = LETRAS[new Date(`${d.dia}T12:00:00`).getDay()];
        const hoje = i === semana.length - 1;
        return (
          <View key={d.dia} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
            <View style={[s.ponto, { borderColor: d.feitos ? cores.ambar : vazio }, hoje && { borderWidth: 2.5 }]}>
              {d.feitos === 2 && <View style={[s.cheio, { backgroundColor: cores.ambar }]} />}
              {d.feitos === 1 && <View style={[s.meio, { backgroundColor: cores.ambar }]} />}
            </View>
            <Text style={[s.letra, { color: corTexto }, hoje && { fontFamily: fontes.textoForte }]}>{hoje ? 'Hoje' : letra}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Cartão do Início: os dois rituais de hoje, a sequência e a pergunta do dia. */
export function CartaoRituais({ e }: { e: EstadoRituais }) {
  const vez = ritualDaVez(e);
  const prox = proximoSelo(e.sequencia);
  return (
    <View style={s.cartao}>
      <View style={s.topo}>
        <View style={{ flex: 1 }}>
          <Legenda style={{ color: cores.salvia }}>SEUS RITUAIS DE HOJE</Legenda>
          <Text style={s.titulo}>
            {vez === 'manha' ? 'Comece pelo seu norte' : vez === 'noite' ? 'Feche o dia com calma' : 'Dia completo. Até amanhã.'}
          </Text>
        </View>
        <View style={s.seq} accessible accessibilityLabel={`${e.sequencia} dias de bordo seguidos`}>
          <Text style={s.seqNum}>{e.sequencia}</Text>
          <Text style={s.seqTexto}>{e.sequencia === 1 ? 'dia' : 'dias'}</Text>
        </View>
      </View>

      <View style={s.botoes}>
        <Botaozinho
          titulo="Manhã"
          texto={e.manhaHoje ? 'Norte definido ✓' : 'Norte da manhã'}
          feito={!!e.manhaHoje}
          destaque={vez === 'manha'}
          onPress={() => router.push('/ritual?p=manha')}
        />
        <Botaozinho
          titulo="Noite"
          texto={e.noiteHoje ? 'Dia fechado ✓' : 'Fechamento do dia'}
          feito={!!e.noiteHoje}
          destaque={vez === 'noite'}
          onPress={() => router.push('/ritual?p=noite')}
        />
      </View>

      {vez === 'manha' && <Text style={s.pergunta}>“{perguntaDoDia()}”</Text>}
      {vez === 'noite' && e.manhaHoje?.texto ? <Text style={s.pergunta}>Seu passo de hoje: “{e.manhaHoje.texto}”</Text> : null}

      <Semana semana={e.semana} escuro />
      {prox && (
        <Text style={s.prox}>
          {e.sequencia === 0
            ? `Comece hoje sua sequência. O primeiro selo vem em ${prox.dias} dias.`
            : `${prox.dias - e.sequencia === 1 ? 'Falta 1 dia' : `Faltam ${prox.dias - e.sequencia} dias`} para o selo “${prox.nome}”.`}
        </Text>
      )}
    </View>
  );
}

function Botaozinho({
  titulo,
  texto,
  feito,
  destaque,
  onPress,
}: {
  titulo: string;
  texto: string;
  feito: boolean;
  destaque: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}: ${texto}`}
      onPress={onPress}
      style={({ pressed }) => [s.bt, destaque && s.btDestaque, feito && s.btFeito, pressed && { opacity: 0.85 }]}
    >
      <Text style={[s.btTitulo, destaque && { color: cores.petroleo }]}>{titulo}</Text>
      <Text style={[s.btTexto, destaque && { color: cores.petroleo }]}>{texto}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cartao: { backgroundColor: cores.petroleo, borderRadius: raio.m, padding: espaco.m, gap: espaco.m },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  titulo: { fontFamily: fontes.titulo, fontSize: 22, color: cores.areia, lineHeight: 28, marginTop: 2 },
  seq: { alignItems: 'center', minWidth: 56 },
  seqNum: { fontFamily: fontes.titulo, fontSize: 34, color: cores.ambar, lineHeight: 38 },
  seqTexto: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.salvia },
  botoes: { flexDirection: 'row', gap: espaco.s },
  bt: { flex: 1, borderRadius: raio.m, borderWidth: 1, borderColor: 'rgba(243,237,227,0.3)', padding: 12, gap: 2, minHeight: 64 },
  btDestaque: { backgroundColor: cores.ambar, borderColor: cores.ambar },
  btFeito: { borderColor: cores.salvia },
  btTitulo: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.areia },
  btTexto: { fontFamily: fontes.texto, fontSize: 13, color: cores.areia, opacity: 0.9 },
  pergunta: { fontFamily: fontes.tituloItalico, fontSize: 17, color: cores.areia, lineHeight: 24 },
  semana: { flexDirection: 'row' },
  ponto: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, overflow: 'hidden', justifyContent: 'flex-end' },
  cheio: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  meio: { height: '50%' },
  letra: { fontFamily: fontes.textoMedio, fontSize: 11 },
  prox: { fontFamily: fontes.texto, fontSize: 13, color: cores.salvia },
});
