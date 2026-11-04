/**
 * "Como o método funciona": tour de boas-vindas, aberto uma vez no primeiro acesso
 * e sempre disponível em Início e em Conta. Explica a ideia por trás do app,
 * não só onde ficam os botões. Textos são paráfrases do livro GovernaMente.
 */

export type ItemTour = { marca: string; titulo: string; texto: string };
export type TelaTour = {
  rotulo: string;
  titulo: string;
  destaque: string; // parte do título em itálico âmbar
  texto: string;
  itens?: ItemTour[];
};

export const TOUR: TelaTour[] = [
  {
    rotulo: 'A IDEIA',
    titulo: 'Governar a mente é',
    destaque: 'conduzir, não ser conduzido',
    texto:
      'Emoções não são o problema. O problema é quando elas decidem por você, principalmente sob pressão. O GovernaMente é o método do livro em passos pequenos, para você aprender a perceber o que sente, pausar e escolher como agir.',
  },
  {
    rotulo: 'O MÉTODO C.A.I.A.',
    titulo: 'Quatro pilares,',
    destaque: 'um prepara o outro',
    texto:
      'O método segue uma ordem. Primeiro você percebe, depois regula, depois leva isso para as relações e, por fim, transforma em hábito.',
    itens: [
      {
        marca: 'C',
        titulo: 'Consciência Emocional',
        texto: 'Perceber e dar nome ao que você sente, antes que a emoção decida por você.',
      },
      {
        marca: 'A',
        titulo: 'Autorregulação Estratégica',
        texto: 'Fazer uma pausa entre o que acontece e a sua resposta.',
      },
      {
        marca: 'I',
        titulo: 'Inteligência Relacional',
        texto: 'Levar essa calma para a equipe, a família e os clientes.',
      },
      {
        marca: 'A',
        titulo: 'Alinhamento e Constância',
        texto: 'Agir de acordo com o que você valoriza, todos os dias.',
      },
    ],
  },
  {
    rotulo: 'COMO O APP ORGANIZA ISSO',
    titulo: 'Aprender, praticar',
    destaque: 'e acompanhar',
    texto: 'Cada parte do app tem um papel diferente no método.',
    itens: [
      {
        marca: '1',
        titulo: 'Trilha: para aprender',
        texto:
          '15 estações, uma por capítulo do livro. Em cada uma: um resumo curto, uma prática e uma pergunta. Faça no seu ritmo, uma de cada vez.',
      },
      {
        marca: '2',
        titulo: 'Ferramentas: para usar na hora',
        texto: 'Respiro, Diário das Emoções, Roda das Emoções e as outras. Elas são o método aplicado no momento em que a emoção aparece.',
      },
      {
        marca: '3',
        titulo: 'Check-in: para acompanhar',
        texto: 'Cinco perguntas uma vez por semana. É o que mostra se você está conduzindo melhor as suas emoções.',
      },
    ],
  },
  {
    rotulo: 'NO SEU DIA A DIA',
    titulo: 'Pouco e todo dia',
    destaque: 'vale mais que muito de vez em quando',
    texto: 'Você não precisa usar tudo. Um caminho simples:',
    itens: [
      {
        marca: '☀',
        titulo: 'Todo dia, 5 a 10 minutos',
        texto: 'Siga o seu próximo passo no Início: uma estação da trilha ou um ritual curto.',
      },
      {
        marca: '⚡',
        titulo: 'Quando algo tirar você do eixo',
        texto: 'Faça o Respiro 4-4-8 e depois registre no Diário: o que aconteceu, o que sentiu e o que fez.',
      },
      {
        marca: '✓',
        titulo: 'Uma vez por semana',
        texto: 'Faça o check-in. Em Minha evolução, os registros viram gráficos e mostram os seus padrões.',
      },
    ],
  },
  {
    rotulo: 'VOCÊ NÃO ESTÁ SOZINHO',
    titulo: 'Ajuda sempre',
    destaque: 'à mão',
    texto:
      'No Início, o cartão "Seu próximo passo" diz o que fazer agora. Em Conta → Dúvidas frequentes há vídeos curtos de cada tela. E este guia fica em Conta → Como o método funciona.\n\nO app é educacional e não substitui psicoterapia. Em sofrimento intenso, toque em "Apoio agora" ou ligue 188 (CVV).',
  },
];

/** Chave local: a pessoa já viu o tour (o Início não abre de novo). */
export const CHAVE_VIU_TOUR = 'como-funciona-visto';
/** Chave local: a pessoa concluiu pelo menos um Respiro 4-4-8. */
export const CHAVE_RESPIRO_FEITO = 'respiro-feito';
