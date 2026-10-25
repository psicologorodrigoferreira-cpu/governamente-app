import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Botao, Cartao, Destaque, Legenda, Logo, Progresso, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { checkinFeitoNaSemana, listarCheckins, listarConcluidas, listarDiario } from '@/lib/dados';
import { PILARES, TRILHA } from '@/content/trilha';
import { cores, espaco, fontes } from '@/lib/theme';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Home() {
  const { nome } = useAuth();
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [checkinOk, setCheckinOk] = useState(true);
  const [registrosSemana, setRegistrosSemana] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [c, ck, d] = await Promise.all([listarConcluidas(), listarCheckins(), listarDiario()]);
          setConcluidas(c);
          setCheckinOk(checkinFeitoNaSemana(ck));
          const seteDias = Date.now() - 7 * 864e5;
          setRegistrosSemana(d.filter((r) => new Date(r.criado_em).getTime() > seteDias).length);
        } catch {
          /* mantém a tela com o que houver */
        }
      })();
    }, []),
  );

  const proxima = TRILHA.find((e) => !concluidas.includes(e.id)) ?? TRILHA[TRILHA.length - 1];
  const progresso = concluidas.length / TRILHA.length;
  const primeiroNome = nome.split(' ')[0];

  return (
    <Tela>
      <View style={s.topo}>
        <Logo size={36} />
        <Legenda>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Legenda>
      </View>

      <Titulo>
        {saudacao()}
        {primeiroNome ? `, ${primeiroNome}` : ''}.{'\n'}
        <Destaque>Qual é o passo possível hoje?</Destaque>
      </Titulo>

      {!checkinOk && (
        <Cartao escuro onPress={() => router.push('/checkin')} rotulo="Fazer o check-in da semana">
          <Legenda style={{ color: cores.salvia }}>CHECK-IN DA SEMANA</Legenda>
          <Text style={s.tituloEscuro}>Como você chegou nesta semana?</Text>
          <Text style={s.textoEscuro}>Cinco perguntas rápidas para acompanhar sua evolução.</Text>
        </Cartao>
      )}

      <Cartao onPress={() => router.push(`/estacao/${proxima.id}`)} rotulo={`Continuar a trilha: ${proxima.titulo}`}>
        <Legenda>
          {concluidas.length === 0 ? 'COMECE A TRILHA' : 'CONTINUE A TRILHA'} · {PILARES[proxima.pilar].nome.toUpperCase()}
        </Legenda>
        <Subtitulo>{proxima.titulo}</Subtitulo>
        <Texto style={{ color: cores.grafiteSuave }}>
          Capítulo {proxima.capitulo} do livro · {proxima.minutos} min
        </Texto>
        <Progresso valor={progresso} />
        <Legenda>
          {concluidas.length} de {TRILHA.length} estações concluídas
        </Legenda>
      </Cartao>

      <Subtitulo>Ferramentas de respiro</Subtitulo>
      <View style={s.grade}>
        <Atalho titulo="Respiro 4–6" texto="2 minutos para baixar a tensão" onPress={() => router.push('/respirar')} />
        <Atalho titulo="Roda das Emoções" texto="Dê nome ao que sente" onPress={() => router.push('/roda')} />
        <Atalho titulo="Registrar emoção" texto={`${registrosSemana} registro(s) nesta semana`} onPress={() => router.push('/diario-novo')} />
        <Atalho titulo="Check-in" texto={checkinOk ? 'Feito nesta semana ✓' : 'Pendente'} onPress={() => router.push('/checkin')} />
      </View>

      <Cartao style={{ backgroundColor: cores.areia }}>
        <Legenda>PERGUNTA DO LIVRO · CAP. 4</Legenda>
        <Text style={s.citacao}>“O que estou sentindo agora? Como isso pode impactar a situação?”</Text>
      </Cartao>

      <Botao variante="secundario" titulo="Ver o ecossistema GovernaMente" onPress={() => router.push('/(tabs)/conteudos')} />
    </Tela>
  );
}

function Atalho({ titulo, texto, onPress }: { titulo: string; texto: string; onPress: () => void }) {
  return (
    <View style={s.atalho}>
      <Cartao style={{ minHeight: 112 }} onPress={onPress} rotulo={titulo}>
        <View style={s.ponto} />
        <Text style={s.atalhoTitulo}>{titulo}</Text>
        <Text style={s.atalhoTexto}>{texto}</Text>
      </Cartao>
    </View>
  );
}

const s = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tituloEscuro: { fontFamily: fontes.titulo, fontSize: 22, color: cores.areia },
  textoEscuro: { fontFamily: fontes.texto, fontSize: 15, color: cores.areia, opacity: 0.85 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  atalho: { flexBasis: '47%', flexGrow: 1 },
  ponto: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.ambar },
  atalhoTitulo: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.petroleo },
  atalhoTexto: { fontFamily: fontes.texto, fontSize: 13, color: cores.grafiteSuave },
  citacao: { fontFamily: fontes.tituloItalico, fontSize: 19, color: cores.petroleo, lineHeight: 26 },
});
