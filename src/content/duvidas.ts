/**
 * Dúvidas frequentes: playlist do YouTube "Dúvidas frequentes · App GovernaMente" (não listada).
 * A playlist inteira toca no app e recebe sozinha os vídeos novos.
 * Os temas abaixo abrem direto o vídeo de cada função. `video: null` = ainda sem vídeo:
 * o tema abre a playlist inteira.
 * O link da playlist pode ser trocado no Painel do Rodrigo (chave "faq_playlist").
 */

export const PLAYLIST_FAQ_PADRAO = 'PLMZaJhMi0ovk';

export type Duvida = { n: number; titulo: string; video: string | null; busca?: string };
export type GrupoDuvidas = { nome: string; itens: Duvida[] };

export const DUVIDAS: GrupoDuvidas[] = [
  {
    nome: 'Começando',
    itens: [
      { n: 1, titulo: 'Criar sua conta e o teste grátis', video: '9_usOmxSuBI', busca: 'cadastro login senha' },
      { n: 2, titulo: 'Primeiros passos', video: '1B-hUHjNpCM', busca: 'perguntas início' },
      { n: 3, titulo: 'A tela Início', video: 'wGF2st_Md2I', busca: 'home' },
    ],
  },
  {
    nome: 'Trilhas e aulas',
    itens: [
      { n: 4, titulo: 'A trilha do método', video: 'bDn2_nloDAM', busca: 'estações caia' },
      { n: 5, titulo: 'Aulas em vídeo', video: 'n2ZKQDujAdY' },
      { n: 6, titulo: 'Detox Digital', video: 'qI26Wu6QucQ', busca: 'celular tempo de tela' },
    ],
  },
  {
    nome: 'Ferramentas do dia a dia',
    itens: [
      { n: 7, titulo: 'Diário das Emoções', video: '6YSw8LkD9FM', busca: 'registro pensamento' },
      { n: 8, titulo: 'Roda das Emoções', video: 'wSaEWjvl20Q', busca: 'nomear sentimento' },
      { n: 9, titulo: 'Três gratidões', video: '6L8kMi8Ru3U' },
      { n: 10, titulo: 'Respiro 4-4-8', video: '3F_PvaQq6zw', busca: 'respiração voz' },
      { n: 11, titulo: 'Meditação guiada', video: 'p1q7ysy28_Q' },
      { n: 12, titulo: 'Matriz de prioridades', video: 'v2Opbi-Es68', busca: 'eisenhower urgente importante' },
      { n: 13, titulo: 'Foco com pausa (Pomodoro)', video: 'sCeBWXq2q2Q' },
      { n: 14, titulo: 'Plano de constância', video: 'XpbwELKMUig', busca: 'hábito' },
      { n: 15, titulo: 'Check-in da semana', video: 'KUFsUPY2bZQ' },
    ],
  },
  {
    nome: 'Sua evolução',
    itens: [
      { n: 16, titulo: 'Minha evolução', video: '7Ye7iuN0Cp4', busca: 'gráficos' },
      { n: 17, titulo: 'Exportar o diário em PDF', video: 'GNdQedEykoI', busca: 'terapeuta' },
    ],
  },
  {
    nome: 'Testes',
    itens: [
      { n: 18, titulo: 'Como fazer um teste e ver o resultado', video: '0QZ21D9e3-k' },
      { n: 19, titulo: 'Os 12 Arquétipos', video: '4pWnro0OlVY' },
      { n: 20, titulo: 'Amabilidade', video: 'M0UKR1moT2c' },
      { n: 21, titulo: 'Estabilidade Emocional', video: 'avgMkP39rBE' },
      { n: 22, titulo: 'Conscienciosidade', video: 'J4HRMWdHU4U' },
      { n: 23, titulo: 'Abertura a Experiências', video: 'ztx679sqcNk' },
      { n: 24, titulo: 'Introversão x Extroversão', video: 'l45LaoT0rQQ' },
      { n: 25, titulo: 'Linguagens do Amor', video: 'ayZhk_EfSZo' },
      { n: 26, titulo: 'Necessidades Emocionais', video: 'eS4CPhbcnFw' },
      { n: 27, titulo: 'Estilos de Apego', video: 'TbIcVppKzGc' },
      { n: 28, titulo: 'Inteligência Emocional', video: 'WUVu3IMrFQM' },
      { n: 29, titulo: 'Habilidade de Liderança', video: '1aoQMqTha3k' },
      { n: 30, titulo: 'Estilos de Liderança', video: 'iv22SULOdkg' },
      { n: 31, titulo: 'Poder de Persuasão', video: 'oVeYTUH-Iek' },
      { n: 32, titulo: 'Procrastinação', video: '5CIkPPXtihE' },
      { n: 33, titulo: 'Criatividade', video: 'N7rAERhrJrs' },
      { n: 34, titulo: 'Bem-Estar Psicológico', video: 'Jvhz3bIg8Z8' },
      { n: 35, titulo: 'Ansiedade Normal x Patológica', video: 'LEIDlvbrvqE' },
    ],
  },
  {
    nome: 'Conta, agenda e ajuda',
    itens: [
      { n: 36, titulo: 'Agenda ao vivo', video: 'h-pcgWXv3OY', busca: 'live lembrete' },
      { n: 37, titulo: 'Área do Tripulante', video: '5TpIhsZeFWw', busca: 'mesa' },
      { n: 38, titulo: 'Lembretes', video: 'r6kYTKZVhMw', busca: 'notificação' },
      { n: 39, titulo: 'Conta e assinatura', video: 'ISeIvnRVBjY', busca: 'plano pagamento cancelar renovar' },
      { n: 40, titulo: 'Código de acesso', video: '7UbgWkczRGg' },
      { n: 41, titulo: 'Privacidade e exclusão da conta', video: 'ZDhCZN392lI', busca: 'lgpd dados apagar' },
      { n: 42, titulo: 'Precisa de ajuda agora?', video: 'S_zxJ64tPB4', busca: 'crise cvv' },
    ],
  },
];
