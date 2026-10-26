/**
 * Roteiros falados do Respiro 4–6 e da meditação guiada.
 *
 * Cada fala tem um `id`. Hoje o app lê o texto com a voz do próprio aparelho.
 * Quando o Rodrigo gravar a própria voz, basta colocar o arquivo em
 * assets/voz/<id>.m4a e registrar em `GRAVACOES` (src/lib/guia.ts): o app passa
 * a tocar a gravação no lugar da voz sintética, sem mudar mais nada.
 */

export type Fala = { id: string; texto: string };
export type FalaNoTempo = Fala & { em: number }; // segundos desde o início

// ---------------- Respiro 4–6 ----------------
export const RESPIRO = {
  abertura: {
    id: 'respiro-abertura',
    texto: 'Vamos respirar juntos por dois minutos. Sente-se, solte os ombros e leve o ar para a barriga.',
  },
  inspire: { id: 'respiro-inspire', texto: 'Inspire' },
  segure: { id: 'respiro-segure', texto: 'Segure' },
  solte: { id: 'respiro-solte', texto: 'Solte devagar' },
  // Lembretes que entram no lugar do comando, em ciclos específicos (o ciclo 1 é o primeiro).
  lembretes: {
    4: { id: 'respiro-lembrete-ombros', texto: 'Continue no seu ritmo. Ombros soltos.' },
    7: { id: 'respiro-lembrete-barriga', texto: 'Perceba a barriga subindo e descendo.' },
    10: { id: 'respiro-lembrete-gentileza', texto: 'Se a mente fugir, tudo bem. Volte para o ar.' },
  } as Record<number, Fala>,
  // Depois deste ciclo a voz para de dar o comando e ficam só os sons, para não cansar.
  ciclosComVoz: 3,
  fechamento: {
    id: 'respiro-fechamento',
    texto: 'Pronto. Repare como o corpo está agora. Qual é o próximo passo possível?',
  },
};

// ---------------- Meditação guiada ----------------
const MEDITACAO_3: FalaNoTempo[] = [
  { em: 3, id: 'med3-01', texto: 'Sente-se de um jeito confortável. Se quiser, feche os olhos.' },
  { em: 14, id: 'med3-02', texto: 'Leve a atenção para a respiração. Não precisa mudar nada. Só perceba o ar entrando e saindo.' },
  { em: 50, id: 'med3-03', texto: 'Se a mente for para os desafios do dia, tudo bem. Perceba para onde ela foi e, com gentileza, volte para a respiração.' },
  { em: 95, id: 'med3-04', texto: 'Repare no corpo. Ombros, mandíbula, mãos. Solte o que der para soltar.' },
  { em: 130, id: 'med3-05', texto: 'Imagine um lago sereno. Quando a água se acalma, dá para ver o fundo com clareza.' },
  { em: 162, id: 'med3-06', texto: 'Prepare-se para voltar. Mexa devagar as mãos e os pés. O que você está sentindo agora?' },
];

const MEDITACAO_5: FalaNoTempo[] = [
  { em: 3, id: 'med5-01', texto: 'Sente-se de um jeito confortável, com as costas apoiadas. Se quiser, feche os olhos.' },
  { em: 16, id: 'med5-02', texto: 'Leve a atenção para a respiração. Perceba o ar entrando pelo nariz e saindo devagar.' },
  { em: 60, id: 'med5-03', texto: 'Se ajudar, conte as respirações de um a cinco. Quando chegar no cinco, comece de novo.' },
  { em: 105, id: 'med5-04', texto: 'A mente vai fugir. Isso faz parte. Cada vez que você percebe e volta, está treinando conduzir a mente.' },
  { em: 150, id: 'med5-05', texto: 'Agora passe a atenção pelo corpo. Testa, mandíbula, ombros, mãos, barriga. Solte o que estiver apertado.' },
  { em: 200, id: 'med5-06', texto: 'Imagine um lago sereno. Quando a água se acalma, dá para ver o fundo com clareza.' },
  { em: 245, id: 'med5-07', texto: 'Pergunte a si mesmo, sem pressa: o que é importante para mim hoje?' },
  { em: 282, id: 'med5-08', texto: 'Prepare-se para voltar. Mexa devagar as mãos e os pés e, quando quiser, abra os olhos.' },
];

const MEDITACAO_10: FalaNoTempo[] = [
  { em: 3, id: 'med10-01', texto: 'Sente-se de um jeito confortável, com as costas apoiadas e os pés no chão. Se quiser, feche os olhos.' },
  { em: 18, id: 'med10-02', texto: 'Leve a atenção para a respiração. Não precisa mudar nada. Só perceba o ar entrando e saindo.' },
  { em: 70, id: 'med10-03', texto: 'Se ajudar, conte as respirações de um a cinco. Quando chegar no cinco, comece de novo.' },
  { em: 125, id: 'med10-04', texto: 'A mente vai fugir para tarefas, conversas e preocupações. Isso faz parte. Perceba e volte, com gentileza.' },
  { em: 185, id: 'med10-05', texto: 'Agora percorra o corpo devagar, dos pés até a cabeça. Pés, pernas, quadril, barriga, peito, ombros, rosto.' },
  { em: 250, id: 'med10-06', texto: 'Onde houver tensão, respire para esse lugar e solte um pouco na saída do ar.' },
  { em: 320, id: 'med10-07', texto: 'Se surgir uma emoção, dê um nome a ela: ansiedade, irritação, cansaço, alívio. Nomear já é o primeiro passo para conduzir.' },
  { em: 390, id: 'med10-08', texto: 'Imagine um lago sereno. Quando a água se acalma, dá para ver o fundo com clareza.' },
  { em: 450, id: 'med10-09', texto: 'Agora, alguns minutos de silêncio. Eu aviso quando for a hora de voltar.' },
  { em: 560, id: 'med10-10', texto: 'Comece a voltar. Pergunte a si mesmo: o que é importante para mim hoje?' },
  { em: 585, id: 'med10-11', texto: 'Mexa devagar as mãos e os pés e, quando quiser, abra os olhos.' },
];

export const MEDITACAO: Record<number, FalaNoTempo[]> = { 3: MEDITACAO_3, 5: MEDITACAO_5, 10: MEDITACAO_10 };

export const MEDITACAO_FIM: Fala = { id: 'med-fim', texto: 'Pronto. Obrigado por esse tempo com você.' };
