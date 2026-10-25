/** Conteúdos e caminhos do ecossistema GovernaMente (editáveis aqui ou no banco). */
export type Item = { titulo: string; descricao: string; url: string; selo?: string };

export const CAMINHOS: Item[] = [
  {
    titulo: 'Mesa GovernaMente',
    descricao: 'Comunidade de 26 semanas com encontros ao vivo às quartas, 19h. Quem é Tripulante já tem o app incluso.',
    url: 'https://mesa.governamente.com.br/',
    selo: 'Comunidade',
  },
  {
    titulo: 'Plano Individual',
    descricao: 'Acompanhamento psicológico individual com o psicólogo Rodrigo Martins Ferreira (CRP 04/65049).',
    url: 'https://plano.governamente.com.br/',
    selo: 'Individual',
  },
  {
    titulo: 'Masterclass Governe suas Emoções',
    descricao: 'Aula sobre emoções com um método simples para o dia a dia.',
    url: 'https://emocoes.governamente.com.br/',
    selo: 'Aula',
  },
  {
    titulo: 'O livro GovernaMente',
    descricao: 'O livro que deu origem a esta trilha. Na Amazon e na UICLAP.',
    url: 'https://loja.uiclap.com/titulo/ua118733',
    selo: 'Livro',
  },
  {
    titulo: 'Testes de autoconhecimento',
    descricao: 'Testes gratuitos, incluindo os 12 Arquétipos.',
    url: 'https://portal.governamente.com.br/testes',
    selo: 'Grátis',
  },
  {
    titulo: 'Canal GovernaMente no WhatsApp',
    descricao: 'Conteúdo curto toda semana.',
    url: 'https://whatsapp.com/channel/0029VbDztxs4SpkMJYgy2m2q',
  },
];

/** Aulas em vídeo. Preencha com os links do YouTube (@governamenteoficial). */
export const AULAS: Item[] = [
  {
    titulo: 'Canal GovernaMente no YouTube',
    descricao: 'Lives e aulas gravadas sobre autorregulação emocional.',
    url: 'https://www.youtube.com/@governamenteoficial',
  },
];
