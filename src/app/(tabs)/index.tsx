import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Botao, Cartao, Destaque, Legenda, Logo, Progresso, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { diasRestantes } from '@/lib/assinatura';
import { checkinFeitoNaSemana, lerLocal, listarCheckins, listarConcluidas, listarDiario } from '@/lib/dados';
import { estacaoPorId, PILARES, TRILHA } from '@/content/trilha';
import { CHAVE_PULOU_TRIAGEM, lerPerfil } from '@/lib/ferramentas';
import { listarEventos, Ocorrencia, proximasOcorrencias, souTripulante } from '@/lib/ecossistema';
import { cores, espaco, fontes } from '@/lib/theme';
import { Marcadores } from '@/components/detox';
import { DETOX } from '@/content/detox';
import { EstadoDetox, estadoDetox, listarDetox } from '@/lib/detox';

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Home() {
  const { nome, acesso } = useAuth();
  const emTeste = acesso.origem === 'teste' && acesso.ativo;
  const dias = diasRestantes(acesso);
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [checkinOk, setCheckinOk] = useState(true);
  const [registrosSemana, setRegistrosSemana] = useState(0);
  const [sugerida, setSugerida] = useState<string | null>(null);
  const [aoVivo, setAoVivo] = useState<Ocorrencia | null>(null);
  const [tripulante, setTripulante] = useState(false);
  const [detox, setDetox] = useState<EstadoDetox | null>(null);
  const verificouPerfil = useRef(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          if (!verificouPerfil.current) {
            verificouPerfil.current = true;
            const perfil = await lerPerfil();
            // Primeira vez no app: três perguntas para indicar por onde começar.
            if (!perfil) {
              if (!(await lerLocal(CHAVE_PULOU_TRIAGEM, false))) {
                router.replace('/primeiros-passos');
                return;
              }
            } else {
              setSugerida(perfil.estacao_sugerida);
            }
          }
          listarEventos()
            .then((ev) => setAoVivo(proximasOcorrencias(ev, 7)[0] ?? null))
            .catch(() => {});
          souTripulante().then(setTripulante).catch(() => {});
          listarDetox()
            .then((l) => setDetox(estadoDetox(l)))
            .catch(() => setDetox(estadoDetox([])));
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

  // Começa pela estação indicada nos primeiros passos; depois segue a ordem da trilha.
  const indicada = sugerida && !concluidas.includes(sugerida) ? estacaoPorId(sugerida) : undefined;
  const proxima = indicada ?? TRILHA.find((e) => !concluidas.includes(e.id)) ?? TRILHA[TRILHA.length - 1];
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

      {detox && !detox.terminou && (
        <Cartao escuro onPress={() => router.push('/detox')} rotulo="Abrir a trilha Detox Digital" style={{ gap: espaco.m }}>
          <View style={s.detoxTopo}>
            <Legenda style={{ color: cores.ambar }}>{detox.concluidos.length === 0 ? 'SUGERIDO PARA VOCÊ' : 'SUA TRILHA EM ANDAMENTO'}</Legenda>
            <View style={s.novo}>
              <Text style={s.novoTexto}>5 DIAS</Text>
            </View>
          </View>
          <Text style={s.detoxTitulo}>
            Detox <Text style={{ fontFamily: fontes.tituloItalico, color: cores.ambar }}>Digital</Text>
          </Text>
          <Text style={s.textoEscuro}>{DETOX.subtitulo}. Um ajuste por dia, com o seu tempo de tela medido.</Text>
          <Marcadores concluidos={detox.concluidos} atual={detox.proximo} escuro />
          <Text style={s.detoxLink}>
            {detox.concluidos.length === 0
              ? 'Começar o dia 1 →'
              : detox.liberaAmanha
                ? 'Ajuste de hoje feito ✓ · registrar tempo de tela →'
                : `Fazer o dia ${detox.proximo} →`}
          </Text>
        </Cartao>
      )}

      {emTeste && (
        <Cartao onPress={() => router.push('/assinar')} rotulo="Ver planos de assinatura" style={s.teste}>
          <Legenda style={{ color: cores.ambarTerra }}>TESTE GRÁTIS</Legenda>
          <Text style={s.testeTitulo}>
            {dias <= 1 ? 'Último dia do seu teste grátis' : `Restam ${dias} dias do seu teste grátis`}
          </Text>
          <Text style={s.testeTexto}>Tudo liberado, menos as aulas. Assine para manter o acesso e liberar as aulas.</Text>
          <Text style={s.testeLink}>Ver planos →</Text>
        </Cartao>
      )}

      {!checkinOk && (
        <Cartao escuro onPress={() => router.push('/checkin')} rotulo="Fazer o check-in da semana">
          <Legenda style={{ color: cores.salvia }}>CHECK-IN DA SEMANA</Legenda>
          <Text style={s.tituloEscuro}>Como você chegou nesta semana?</Text>
          <Text style={s.textoEscuro}>Cinco perguntas rápidas para acompanhar sua evolução.</Text>
        </Cartao>
      )}

      <Cartao onPress={() => router.push(`/estacao/${proxima.id}`)} rotulo={`Continuar a trilha: ${proxima.titulo}`}>
        <Legenda>
          {indicada ? 'COMECE POR AQUI' : concluidas.length === 0 ? 'COMECE A TRILHA' : 'CONTINUE A TRILHA'} ·{' '}
          {PILARES[proxima.pilar].nome.toUpperCase()}
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

      {tripulante && (
        <Cartao escuro onPress={() => router.push('/tripulante')} rotulo="Abrir a Área do Tripulante">
          <Legenda style={{ color: cores.salvia }}>MESA GOVERNAMENTE</Legenda>
          <Text style={s.tituloEscuro}>Área do Tripulante</Text>
          <Text style={s.textoEscuro}>Semana da Travessia, link do encontro e gravações.</Text>
        </Cartao>
      )}

      {aoVivo && (
        <Cartao onPress={() => router.push('/agenda')} rotulo={`Agenda ao vivo: ${aoVivo.evento.titulo}`}>
          <Legenda>PRÓXIMO AO VIVO</Legenda>
          <Text style={s.testeTitulo}>{aoVivo.evento.titulo}</Text>
          <Text style={s.testeTexto}>
            {aoVivo.quando.toLocaleDateString('pt-BR', { weekday: 'long' })} ·{' '}
            {aoVivo.quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={s.testeLink}>Ver agenda e ativar lembrete →</Text>
        </Cartao>
      )}

      <Subtitulo>Ferramentas do livro</Subtitulo>
      <View style={s.grade}>
        <Atalho
          titulo="Detox Digital"
          texto={detox?.terminou ? 'Tempo de tela e revisão' : `${detox?.concluidos.length ?? 0} de 5 dias`}
          onPress={() => router.push('/detox')}
        />
        <Atalho titulo="Respiro 4–6" texto="2 minutos para baixar a tensão" onPress={() => router.push('/respirar')} />
        <Atalho titulo="Meditação" texto="5 minutos de silêncio guiado" onPress={() => router.push('/meditar')} />
        <Atalho titulo="Registrar emoção" texto={`${registrosSemana} registro(s) nesta semana`} onPress={() => router.push('/diario-novo')} />
        <Atalho titulo="Roda das Emoções" texto="Dê nome ao que sente" onPress={() => router.push('/roda')} />
        <Atalho titulo="Três gratidões" texto="O que hoje teve de bom" onPress={() => router.push('/gratidao')} />
        <Atalho titulo="Matriz de prioridades" texto="Urgente ou importante?" onPress={() => router.push('/matriz')} />
        <Atalho titulo="Foco com pausa" texto="Pomodoro: 25 min + 5 min" onPress={() => router.push('/pomodoro')} />
        <Atalho titulo="Plano de constância" texto="Seu hábito de todo dia" onPress={() => router.push('/constancia')} />
        <Atalho titulo="Check-in" texto={checkinOk ? 'Feito nesta semana ✓' : 'Pendente'} onPress={() => router.push('/checkin')} />
        <Atalho titulo="Testes" texto="Inclui os 12 Arquétipos" onPress={() => router.push('/testes')} />
        <Atalho titulo="Minha evolução" texto="Gráficos e resumo do mês" onPress={() => router.push('/evolucao')} />
        <Atalho titulo="Lembretes" texto="Escolha quando ser lembrado" onPress={() => router.push('/lembretes')} />
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
  teste: { borderColor: cores.ambar, backgroundColor: '#FBF1E1' },
  testeTitulo: { fontFamily: fontes.titulo, fontSize: 19, color: cores.petroleo },
  testeTexto: { fontFamily: fontes.texto, fontSize: 14, color: cores.grafite, lineHeight: 20 },
  testeLink: { fontFamily: fontes.textoForte, fontSize: 14, color: cores.ambarTerra },
  detoxTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  novo: { backgroundColor: cores.ambar, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  novoTexto: { fontFamily: fontes.textoForte, fontSize: 11, color: cores.petroleo, letterSpacing: 0.5 },
  detoxTitulo: { fontFamily: fontes.titulo, fontSize: 28, color: cores.areia, lineHeight: 34 },
  detoxLink: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.ambar },
  citacao: { fontFamily: fontes.tituloItalico, fontSize: 19, color: cores.petroleo, lineHeight: 26 },
});
