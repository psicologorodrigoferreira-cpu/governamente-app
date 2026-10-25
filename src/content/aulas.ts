/**
 * Aulas em vídeo dentro do app. Liberadas só para assinantes (no teste grátis aparecem com cadeado).
 * Para publicar uma aula: cole o código do vídeo do YouTube em `youtubeId`
 * (o trecho depois de "v=" ou de "youtu.be/"). Vídeos "Não listados" funcionam e não aparecem no canal.
 * Aula sem `youtubeId` aparece como "Em breve".
 */
export type Aula = {
  id: string;
  modulo: string;
  titulo: string;
  descricao: string;
  minutos?: number;
  youtubeId?: string;
};

export const AULAS: Aula[] = [
  {
    id: 'boas-vindas',
    modulo: 'Comece aqui',
    titulo: 'Boas-vindas: como usar o app',
    descricao: 'Como aproveitar a trilha, o diário e o check-in no seu dia a dia.',
  },
  {
    id: 'consciencia',
    modulo: 'Método C.A.I.A.',
    titulo: 'Consciência Emocional na prática',
    descricao: 'Perceber o que você sente antes que a emoção decida por você.',
  },
  {
    id: 'autorregulacao',
    modulo: 'Método C.A.I.A.',
    titulo: 'Autorregulação Estratégica',
    descricao: 'A pausa, a respiração e a decisão tomada com calma.',
  },
  {
    id: 'relacional',
    modulo: 'Método C.A.I.A.',
    titulo: 'Inteligência Relacional',
    descricao: 'Escuta ativa e o clima emocional da sua equipe.',
  },
  {
    id: 'alinhamento',
    modulo: 'Método C.A.I.A.',
    titulo: 'Alinhamento e Constância',
    descricao: 'Coerência entre o que você diz e o que você faz, nos dias comuns.',
  },
];

export const aulaPorId = (id: string) => AULAS.find((a) => a.id === id);
