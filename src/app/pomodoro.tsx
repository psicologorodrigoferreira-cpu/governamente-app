import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Botao, Legenda, Tela, Texto } from '@/components/ui';
import { agendarFimPomodoro, cancelarPomodoro } from '@/lib/lembretes';
import { cores, espaco, fontes } from '@/lib/theme';

// Caps. 7 e 8 do livro: 25 minutos de concentração, 5 de pausa.
const FASES = {
  foco: { segundos: 25 * 60, nome: 'Foco', dica: 'Uma tarefa só. Silencie as notificações.', cor: cores.petroleo },
  pausa: { segundos: 5 * 60, nome: 'Pausa', dica: 'Levante, respire fundo, beba água. Longe da tela.', cor: cores.salviaEscura },
} as const;
type Fase = keyof typeof FASES;

export default function Pomodoro() {
  const [fase, setFase] = useState<Fase>('foco');
  const [fimEm, setFimEm] = useState<number | null>(null); // horário em que a fase termina
  const [pausadoCom, setPausadoCom] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  const [ciclos, setCiclos] = useState(0);
  const faseRef = useRef(fase);
  useEffect(() => {
    faseRef.current = fase;
  }, [fase]);

  const rodando = fimEm !== null;
  const restante = rodando
    ? Math.max(0, Math.round((fimEm - agora) / 1000))
    : (pausadoCom ?? FASES[fase].segundos);

  // Relógio baseado no horário de término: continua certo mesmo com o app em segundo plano.
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setAgora(Date.now()), 500);
    const sub = AppState.addEventListener('change', () => setAgora(Date.now()));
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [rodando]);

  useEffect(() => {
    if (!rodando || restante > 0) return;
    // Fase terminou: troca automaticamente.
    const proxima: Fase = faseRef.current === 'foco' ? 'pausa' : 'foco';
    if (faseRef.current === 'foco') setCiclos((c) => c + 1);
    setFase(proxima);
    const fim = Date.now() + FASES[proxima].segundos * 1000;
    setFimEm(fim);
    agendarFimPomodoro(
      FASES[proxima].segundos,
      proxima === 'foco' ? 'Pausa encerrada' : 'Hora de voltar ao foco',
      proxima === 'foco' ? 'Mais um bloco de foco?' : 'Bloco de foco concluído.',
    ).catch(() => {});
  }, [rodando, restante]);

  function iniciar() {
    const segundos = pausadoCom ?? FASES[fase].segundos;
    setPausadoCom(null);
    setAgora(Date.now());
    setFimEm(Date.now() + segundos * 1000);
    agendarFimPomodoro(
      segundos,
      fase === 'foco' ? 'Bloco de foco concluído' : 'Pausa encerrada',
      fase === 'foco' ? 'Hora de uma pausa de 5 minutos.' : 'Pronto para mais um bloco de foco?',
    ).catch(() => {});
  }

  function pausar() {
    setPausadoCom(restante);
    setFimEm(null);
    cancelarPomodoro().catch(() => {});
  }

  function reiniciar() {
    setFimEm(null);
    setPausadoCom(null);
    setFase('foco');
    cancelarPomodoro().catch(() => {});
  }

  const f = FASES[fase];
  const progresso = 1 - restante / f.segundos;
  const R = 110;
  const C = 2 * Math.PI * R;

  return (
    <Tela>
      <Texto>Trabalhe em blocos curtos e faça pausas de verdade. Aparentemente simples, ajuda a render sem se esgotar.</Texto>
      <View style={s.area}>
        <Svg width={260} height={260} viewBox="0 0 260 260">
          <Circle cx={130} cy={130} r={R} stroke={cores.linha} strokeWidth={10} fill="none" />
          <Circle
            cx={130}
            cy={130}
            r={R}
            stroke={f.cor}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            strokeDashoffset={C * (1 - progresso)}
            transform="rotate(-90 130 130)"
          />
        </Svg>
        <View style={s.centro} pointerEvents="none">
          <Text style={[s.fase, { color: f.cor }]}>{f.nome}</Text>
          <Text style={s.tempo} accessibilityLiveRegion="polite">
            {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}
          </Text>
        </View>
      </View>
      <Texto style={{ textAlign: 'center' }}>{f.dica}</Texto>
      <Botao titulo={rodando ? 'Pausar' : pausadoCom !== null ? 'Continuar' : `Começar ${f.nome.toLowerCase()}`} onPress={rodando ? pausar : iniciar} />
      <Botao variante="texto" titulo="Recomeçar" onPress={reiniciar} />
      <Legenda style={{ textAlign: 'center', marginTop: espaco.s }}>
        {ciclos === 0 ? 'Nenhum bloco concluído ainda' : `${ciclos} bloco(s) de foco concluído(s) hoje`}
      </Legenda>
    </Tela>
  );
}

const s = StyleSheet.create({
  area: { alignItems: 'center', justifyContent: 'center', marginVertical: espaco.m },
  centro: { position: 'absolute', alignItems: 'center' },
  fase: { fontFamily: fontes.textoForte, fontSize: 15, letterSpacing: 1 },
  tempo: { fontFamily: fontes.titulo, fontSize: 52, color: cores.petroleo },
});
