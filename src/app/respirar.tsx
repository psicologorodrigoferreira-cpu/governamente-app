import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Botao, Cartao, Legenda, Tela, Texto } from '@/components/ui';
import { ControlesGuia, useGuia } from '@/components/ControlesGuia';
import { RESPIRO } from '@/content/guias';
import { falar, silenciar, tocar } from '@/lib/guia';
import { cores, espaco, fontes } from '@/lib/theme';
import { gravarLocal } from '@/lib/dados';
import { CHAVE_RESPIRO_FEITO } from '@/content/comoFunciona';

/**
 * Respiração diafragmática 4-4-8:
 * inspira pelo nariz em 4 s (a barriga sobe), segura 4 s, solta pela boca em 8 s
 * (como quem sopra uma vela). Cinco ciclos.
 */
const CICLOS_RESPIRO = 5;
const FASES = [
  {
    nome: 'Inspire pelo nariz',
    segundos: 4,
    escala: 1,
    dica: 'A mão da barriga sobe. A do peito quase não se mexe.',
    fala: RESPIRO.inspire,
    som: 'inspirar' as const,
  },
  { nome: 'Segure', segundos: 4, escala: 1, dica: 'Segure o ar, sem forçar.', fala: RESPIRO.segure, som: null },
  {
    nome: 'Solte pela boca',
    segundos: 8,
    escala: 0.55,
    dica: 'Devagar, como se soprasse uma vela.',
    fala: RESPIRO.solte,
    som: 'soltar' as const,
  },
];

const PASSOS = [
  ['Posição', 'Sente-se ou deite-se de forma confortável, com os ombros relaxados.'],
  ['Mãos', 'Uma mão sobre o peito e a outra na barriga, perto do umbigo.'],
  ['Inspire 4 s', 'Pelo nariz, devagar. A barriga sobe; o peito quase não se mexe.'],
  ['Segure 4 s', 'Mantenha o ar, sem forçar.'],
  ['Solte 8 s', 'Pela boca, devagar, como se soprasse uma vela.'],
  ['Repita', `${CICLOS_RESPIRO} ciclos, cerca de um minuto e meio.`],
];

type Etapa = 'parado' | 'abertura' | 'ativo' | 'fim';

export default function Respirar() {
  const { prefs, mudar } = useGuia();
  const [etapa, setEtapa] = useState<Etapa>('parado');
  const [fase, setFase] = useState(0);
  const [ciclo, setCiclo] = useState(1);
  const [contagem, setContagem] = useState(1);
  const [escala] = useState(() => new Animated.Value(0.55));
  const prefsRef = useRef(prefs);
  const sessao = useRef(0);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Ao sair da tela, cala a voz.
  useEffect(() => () => silenciar(), []);

  // Cada fase: anima o círculo, toca o som, fala o comando e conta os segundos.
  useEffect(() => {
    if (etapa !== 'ativo') return;
    const f = FASES[fase];
    const p = prefsRef.current;
    if (p.sons && f.som) tocar(f.som, 0.5);
    let atraso: ReturnType<typeof setTimeout> | undefined;
    if (p.voz) {
      // Na pausa de alguns ciclos, um lembrete curto entra no lugar de "Segure".
      const lembrete = fase === 1 ? RESPIRO.lembretes[ciclo] : undefined;
      // Depois de um lembrete (que pode passar um pouco dos 4 s), o "Solte" espera 1 s para não falar por cima.
      if (fase === 2 && RESPIRO.lembretes[ciclo]) atraso = setTimeout(() => falar(f.fala), 1000);
      else falar(lembrete ?? f.fala);
    }
    Animated.timing(escala, {
      toValue: f.escala,
      duration: f.segundos * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
    const conta = setInterval(() => setContagem((c) => Math.min(f.segundos, c + 1)), 1000);
    const t = setTimeout(() => {
      if (fase === FASES.length - 1) {
        if (ciclo >= CICLOS_RESPIRO) {
          setEtapa('fim');
          return;
        }
        setCiclo((c) => c + 1);
      }
      setContagem(1);
      setFase((fase + 1) % FASES.length);
    }, f.segundos * 1000);
    return () => {
      clearTimeout(t);
      clearInterval(conta);
      if (atraso) clearTimeout(atraso);
    };
  }, [etapa, fase, ciclo, escala]);

  // Fechamento.
  useEffect(() => {
    if (etapa !== 'fim') return;
    gravarLocal(CHAVE_RESPIRO_FEITO, true).catch(() => {});
    const p = prefsRef.current;
    if (p.sons) tocar('sino', 0.6);
    if (p.voz) setTimeout(() => falar(RESPIRO.fechamento), p.sons ? 1500 : 0);
  }, [etapa]);

  function comecarCiclos() {
    setContagem(1);
    setFase(0);
    setCiclo(1);
    setEtapa('ativo');
  }

  function iniciar() {
    silenciar();
    if (prefs.sons) tocar('sino', 0.6);
    if (!prefs.voz) {
      // Sem voz: alguns segundos para posicionar as mãos.
      setEtapa('abertura');
      const minha = ++sessao.current;
      setTimeout(() => sessao.current === minha && comecarCiclos(), 6000);
      return;
    }
    setEtapa('abertura');
    const minha = ++sessao.current;
    let foi = false;
    const seguir = () => {
      if (foi || sessao.current !== minha) return;
      foi = true;
      comecarCiclos();
    };
    // Começa quando a voz terminar a abertura (ou em 16 s, se o aparelho não avisar).
    setTimeout(() => {
      if (sessao.current === minha) falar(RESPIRO.abertura, () => setTimeout(seguir, 800));
    }, prefs.sons ? 1200 : 0);
    setTimeout(seguir, 16000);
  }

  function parar() {
    sessao.current++;
    silenciar();
    setEtapa('parado');
    Animated.timing(escala, { toValue: 0.55, duration: 400, useNativeDriver: true }).start();
  }

  const emAndamento = etapa === 'ativo' || etapa === 'abertura';
  const f = FASES[fase];
  const rotulo = etapa === 'ativo' ? f.nome : etapa === 'abertura' ? 'Prepare-se' : etapa === 'fim' ? 'Pronto.' : 'Respire';

  return (
    <Tela>
      {etapa === 'parado' && (
        <Cartao>
          <Legenda>COMO FAZER</Legenda>
          {PASSOS.map(([titulo, texto], i) => (
            <View key={titulo} style={s.passo}>
              <View style={s.passoNum}>
                <Text style={s.passoNumTexto}>{i + 1}</Text>
              </View>
              <Text style={s.passoTexto}>
                <Text style={s.passoTitulo}>{titulo}: </Text>
                {texto}
              </Text>
            </View>
          ))}
        </Cartao>
      )}
      {etapa === 'abertura' && (
        <Texto style={{ textAlign: 'center' }}>
          Sente-se ou deite-se com os ombros relaxados. Uma mão no peito, a outra na barriga, perto do umbigo.
        </Texto>
      )}
      {!emAndamento && etapa !== 'fim' && <ControlesGuia prefs={prefs} mudar={mudar} />}

      <View style={s.area}>
        <Animated.View style={[s.circulo, { transform: [{ scale: escala }] }]} />
        <View style={s.rotulo} pointerEvents="none">
          <Text style={s.fase} accessibilityLiveRegion="polite">
            {rotulo}
          </Text>
          {etapa === 'ativo' && <Text style={s.contagem}>{contagem}</Text>}
        </View>
      </View>

      {etapa === 'ativo' && (
        <>
          <Text style={s.dica}>{f.dica}</Text>
          <View style={s.ciclos} accessible accessibilityLabel={`Ciclo ${ciclo} de ${CICLOS_RESPIRO}`}>
            {Array.from({ length: CICLOS_RESPIRO }, (_, i) => (
              <View key={i} style={[s.ponto, i < ciclo - 1 && s.pontoFeito, i === ciclo - 1 && s.pontoAtual]} />
            ))}
          </View>
          <Legenda style={{ textAlign: 'center' }}>
            Ciclo {ciclo} de {CICLOS_RESPIRO}
          </Legenda>
        </>
      )}

      {etapa === 'fim' && <Texto style={{ textAlign: 'center' }}>{RESPIRO.fechamento.texto.replace('Pronto. ', '')}</Texto>}
      <Botao titulo={emAndamento ? 'Parar' : etapa === 'fim' ? 'Fazer de novo' : 'Começar'} onPress={emAndamento ? parar : iniciar} />
      {prefs.voz && !emAndamento && (
        <Legenda style={{ textAlign: 'center' }}>No iPhone, tire do modo silencioso para ouvir a voz.</Legenda>
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  area: { height: 280, alignItems: 'center', justifyContent: 'center' },
  circulo: { width: 250, height: 250, borderRadius: 125, backgroundColor: cores.petroleo },
  rotulo: { position: 'absolute', alignItems: 'center', gap: 2 },
  fase: { fontFamily: fontes.tituloItalico, fontSize: 22, color: cores.areia, textAlign: 'center' },
  contagem: { fontFamily: fontes.titulo, fontSize: 44, color: cores.ambar },
  dica: { fontFamily: fontes.tituloItalico, fontSize: 17, color: cores.petroleo, textAlign: 'center', lineHeight: 24 },
  ciclos: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  ponto: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: cores.salviaEscura },
  pontoFeito: { backgroundColor: cores.ambar, borderColor: cores.ambar },
  pontoAtual: { borderColor: cores.ambar, borderWidth: 2.5 },
  passo: { flexDirection: 'row', gap: espaco.s, alignItems: 'flex-start' },
  passoNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: cores.salvia, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  passoNumTexto: { fontFamily: fontes.textoForte, fontSize: 12, color: cores.petroleo },
  passoTexto: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.grafite, lineHeight: 22 },
  passoTitulo: { fontFamily: fontes.textoForte, color: cores.petroleo },
});
