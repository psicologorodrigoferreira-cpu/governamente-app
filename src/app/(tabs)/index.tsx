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
import { CartaoRituais } from '@/components/rituais';
import { EstadoRituais, estadoRituais, listarRituais } from '@/lib/rituais';
import { CHAVE_RESPIRO_FEITO, CHAVE_VIU_TOUR } from '@/content/comoFunciona';

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
  const [rituais, setRituais] = useState<EstadoRituais | null>(null);
  const [respiroFeito, setRespiroFeito] = useState(false);
  const [temDiario, setTemDiario] = useState(false);
  const [carregou, setCarregou] = useState(false);
  const verificouPerfil = useRef(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          if (!verificouPerfil.current) {
            verificouPerfil.current = true;
            // Primeiríssimo acesso: o guia do método antes de tudo.
            if (!(await lerLocal(CHAVE_VIU_TOUR, false))) {
              router.replace('/como-funciona');
              return;
            }
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
          listarRituais()
            .then((l) => setRituais(estadoRituais(l)))
            .catch(() => setRituais(estadoRituais([])));
          listarDetox()
            .then((l) => setDetox(estadoDetox(l)))
            .catch(() => setDetox(estadoDetox([])));
          lerLocal(CHAVE_RESPIRO_FEITO, false)
            .then(setRespiroFeito)
            .catch(() => {});
          const [c, ck, d] = await Promise.all([listarConcluidas(), listarCheckins(), listarDiario()]);
          setConcluidas(c);
          setTemDiario(d.length > 0);
          setCheckinOk(checkinFeitoNaSemana(ck));
          const seteDias = Date.now() - 7 * 864e5;
          setRegistrosSemana(d.filter((r) => new Date(r.criado_em).getTime() > seteDias).length);
        } catch {
          /* mantém a tela com o que houver */
        } finally {
          setCarregou(true);
        }
      })();
    }, []),
  );

  // Começa pela estação indicada nos primeiros passos; depois segue a ordem da trilha.
  const indicada = sugerida && !concluidas.includes(sugerida) ? estacaoPorId(sugerida) : undefined;
  const proxima = indicada ?? TRILHA.find((e) => !concluidas.includes(e.id)) ?? TRILHA[TRILHA.length - 1];
  const progresso = concluidas.length / TRILHA.length;
  const primeiroNome = nome.split(' ')[0];

  // "Comece por aqui": três passos, um de cada parte do método. Some quando os três estão feitos.
  const passos = [
    {
      id: 'trilha',
      feito: concluidas.length > 0,
      titulo: 'Faça a sua primeira estação da trilha',
      texto: `“${proxima.titulo}”, ${proxima.minutos} min. É onde você aprende o método.`,
      botao: 'Abrir a primeira estação',
      ir: () => router.push(`/estacao/${proxima.id}`),
    },
    {
      id: 'respiro',
      feito: respiroFeito,
      titulo: 'Faça um Respiro 4-4-8',
      texto: 'Um minuto e meio. É a pausa que o método usa quando a emoção sobe.',
      botao: 'Fazer o Respiro agora',
      ir: () => router.push('/respirar'),
    },
    {
      id: 'diario',
      feito: temDiario,
      titulo: 'Registre uma emoção no Diário',
      texto: 'O que aconteceu, o que sentiu e o que fez. É assim que você começa a ver seus padrões.',
      botao: 'Fazer o primeiro registro',
      ir: () => router.push('/diario-novo'),
    },
  ];
  const feitos = passos.filter((p) => p.feito).length;
  const pendente = passos.find((p) => !p.feito);

  // Depois dos três: um único próximo passo em destaque.
  const proximoPasso = !checkinOk
    ? {
        rotulo: 'CHECK-IN DA SEMANA',
        titulo: 'Como você chegou nesta semana?',
        texto: 'Cinco perguntas rápidas para acompanhar a sua evolução.',
        botao: 'Fazer o check-in',
        ir: () => router.push('/checkin'),
      }
    : {
        rotulo: `TRILHA · ${PILARES[proxima.pilar].nome.toUpperCase()}`,
        titulo: proxima.titulo,
        texto: `Capítulo ${proxima.capitulo} do livro · ${proxima.minutos} min`,
        botao: concluidas.length >= TRILHA.length ? 'Rever a última estação' : 'Fazer a estação de hoje',
        ir: () => router.push(`/estacao/${proxima.id}`),
      };

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

      {carregou && pendente ? (
        <Cartao escuro style={{ gap: espaco.m }}>
          <View style={s.detoxTopo}>
            <Legenda style={{ color: cores.ambar }}>COMECE POR AQUI</Legenda>
            <Legenda style={{ color: cores.areia }}>
              {feitos} DE {passos.length}
            </Legenda>
          </View>
          <Text style={s.tituloEscuro}>Três passos para conhecer o método</Text>
          {passos.map((p, k) => (
            <View key={p.id} style={s.passo}>
              <View style={[s.check, p.feito && s.checkFeito, p === pendente && s.checkAtual]}>
                <Text style={[s.checkTexto, p.feito && { color: cores.petroleo }]}>{p.feito ? '✓' : k + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.passoTitulo, p.feito && s.passoFeito]}>{p.titulo}</Text>
                {p === pendente && <Text style={s.textoEscuro}>{p.texto}</Text>}
              </View>
            </View>
          ))}
          <Botao titulo={pendente.botao} onPress={pendente.ir} style={s.botaoAmbar} corTexto={cores.petroleo} />
          <Text style={s.detoxLink} onPress={() => router.push('/como-funciona?rever=1')} accessibilityRole="link">
            Entender como o método funciona →
          </Text>
        </Cartao>
      ) : carregou ? (
        <Cartao escuro style={{ gap: espaco.s }}>
          <Legenda style={{ color: cores.ambar }}>SEU PRÓXIMO PASSO HOJE · {proximoPasso.rotulo}</Legenda>
          <Text style={s.tituloEscuro}>{proximoPasso.titulo}</Text>
          <Text style={s.textoEscuro}>{proximoPasso.texto}</Text>
          {checkinOk && (
            <Text style={[s.textoEscuro, { fontSize: 13 }]}>
              {concluidas.length} de {TRILHA.length} estações concluídas
            </Text>
          )}
          <Botao titulo={proximoPasso.botao} onPress={proximoPasso.ir} style={s.botaoAmbar} corTexto={cores.petroleo} />
        </Cartao>
      ) : null}

      {!pendente && rituais && <CartaoRituais e={rituais} />}

      {emTeste && dias <= 2 && (
        <Cartao onPress={() => router.push('/travessia')} rotulo="Ver o que você já construiu no app" style={s.teste}>
          <Legenda style={{ color: cores.ambarTerra }}>SUA TRAVESSIA ATÉ AQUI</Legenda>
          <Text style={s.testeTitulo}>Veja o que você já construiu nestes dias</Text>
          <Text style={s.testeLink}>Abrir o meu resumo →</Text>
        </Cartao>
      )}

      {!pendente && detox && !detox.terminou && (
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

      {!pendente && !checkinOk && (
        <Cartao onPress={() => router.push(`/estacao/${proxima.id}`)} rotulo={`Continuar a trilha: ${proxima.titulo}`}>
          <Legenda>
            {indicada ? 'INDICADA PARA VOCÊ' : concluidas.length === 0 ? 'COMECE A TRILHA' : 'CONTINUE A TRILHA'} ·{' '}
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
      )}

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
        <Atalho titulo="Respiro 4-4-8" texto="5 respirações para baixar a tensão" onPress={() => router.push('/respirar')} />
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

      <Cartao style={s.ajuda}>
        <Legenda style={{ color: cores.ambarTerra }}>COMO O APP FUNCIONA</Legenda>
        <Text style={s.testeTitulo}>Ficou em dúvida sobre por onde ir?</Text>
        <Text style={s.testeTexto}>Veja a ideia do método em 2 minutos, ou assista aos vídeos curtos de cada tela.</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Botao variante="secundario" titulo="Entender o método" onPress={() => router.push('/como-funciona?rever=1')} style={{ flexGrow: 1 }} />
          <Botao variante="secundario" titulo="Ver vídeos de ajuda" onPress={() => router.push('/duvidas')} style={{ flexGrow: 1 }} />
        </View>
      </Cartao>

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
  passo: { flexDirection: 'row', gap: espaco.s, alignItems: 'flex-start' },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: cores.areia,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  checkAtual: { borderColor: cores.ambar, opacity: 1 },
  checkFeito: { backgroundColor: cores.ambar, borderColor: cores.ambar, opacity: 1 },
  checkTexto: { fontFamily: fontes.textoForte, fontSize: 13, color: cores.areia },
  passoTitulo: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.areia, paddingTop: 3 },
  passoFeito: { opacity: 0.6, textDecorationLine: 'line-through' },
  ajuda: { borderColor: cores.ambar },
  botaoAmbar: { backgroundColor: cores.ambar },
  citacao: { fontFamily: fontes.tituloItalico, fontSize: 19, color: cores.petroleo, lineHeight: 26 },
});
