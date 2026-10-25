/**
 * Trilha do método do livro GovernaMente (Rodrigo Martins Ferreira).
 * Cada estação corresponde a um capítulo do livro. Os resumos são paráfrases;
 * as práticas e perguntas vêm das técnicas descritas no capítulo indicado.
 * Citações literais estão marcadas com aspas e capítulo.
 */

export type Pilar = 'base' | 'C' | 'A' | 'I' | 'Al' | 'pratica';

export const PILARES: Record<Pilar, { nome: string; cor: string }> = {
  base: { nome: 'Fundamentos', cor: '#6E8A69' },
  C: { nome: 'Consciência Emocional', cor: '#1E3A39' },
  A: { nome: 'Autorregulação Estratégica', cor: '#9A5F14' },
  I: { nome: 'Inteligência Relacional', cor: '#4E6B66' },
  Al: { nome: 'Alinhamento e Constância', cor: '#7A5A3A' },
  pratica: { nome: 'Prática no dia a dia', cor: '#5B6264' },
};

export type Estacao = {
  id: string;
  numero: number;
  capitulo: number;
  pilar: Pilar;
  titulo: string;
  minutos: number;
  resumo: string[];
  citacao?: { texto: string; capitulo: number };
  pratica: { titulo: string; passos: string[]; ferramenta?: 'diario' | 'respiracao' | 'roda' | 'matriz' | 'pensamento' | 'pomodoro' | 'constancia' | 'gratidao' | 'meditacao' };
  reflexao: string;
};

export const TRILHA: Estacao[] = [
  {
    id: 'conceito',
    numero: 1,
    capitulo: 1,
    pilar: 'base',
    titulo: 'O que é governar a mente',
    minutos: 6,
    resumo: [
      'Governar a mente não é gerenciar tarefas. É conduzir a própria vida emocional de forma construtiva, principalmente quando a pressão aperta.',
      'O livro mostra que a calma e a clareza no meio do turbilhão são o centro da liderança. E que admitir uma insegurança, na hora certa, aproxima a equipe em vez de enfraquecer o líder.',
      'Tudo começa dentro de você e se espalha para quem está ao seu redor.',
    ],
    pratica: {
      titulo: 'Seu ponto de partida',
      passos: [
        'Lembre de um desafio inesperado das últimas semanas.',
        'Anote: o que você sentiu, o que fez e como isso afetou as pessoas à sua volta.',
        'Marque de 0 a 10 o quanto você conduziu a situação, e não ela a você.',
      ],
      ferramenta: 'diario',
    },
    reflexao: 'Em que momento da sua semana você mais perde a clareza? E em qual você mais a tem?',
  },
  {
    id: 'quem-empreende',
    numero: 2,
    capitulo: 2,
    pilar: 'base',
    titulo: 'Quem empreende e o peso de crescer',
    minutos: 5,
    resumo: [
      'Quem empreende em fase de expansão carrega ambição e incerteza ao mesmo tempo.',
      'A resiliência aparece como marca dessas pessoas: cair, aprender e levantar. Mas resiliência não significa aguentar tudo sozinho.',
    ],
    pratica: {
      titulo: 'Mapa das suas pressões',
      passos: [
        'Liste as três maiores pressões do seu negócio hoje.',
        'Ao lado de cada uma, escreva qual emoção ela desperta em você.',
        'Circule a que mais tem roubado o seu sono ou a sua presença em casa.',
      ],
    },
    reflexao: 'Qual dessas pressões você tem carregado em silêncio?',
  },
  {
    id: 'ansiedade',
    numero: 3,
    capitulo: 3,
    pilar: 'base',
    titulo: 'Ansiedade e performance',
    minutos: 7,
    resumo: [
      'A ansiedade pode virar um ciclo: quanto mais você se preocupa com o desempenho, mais difícil fica render.',
      'O livro propõe olhar a ansiedade como um sinal de que algo pede atenção, e não como inimiga a ser expulsa.',
      'Duas ferramentas simples abrem caminho: a respiração diafragmática e alguns minutos diários de silêncio.',
    ],
    pratica: {
      titulo: 'Respiração 4–6',
      passos: [
        'Sente-se num lugar tranquilo e solte os ombros.',
        'Inspire pelo nariz contando até 4, levando o ar para a barriga.',
        'Segure por um instante.',
        'Solte devagar contando até 6. Repita por 2 minutos.',
      ],
      ferramenta: 'respiracao',
    },
    reflexao: 'Que recado a sua ansiedade pode estar tentando te dar nesta semana?',
  },
  {
    id: 'consciencia',
    numero: 4,
    capitulo: 4,
    pilar: 'C',
    titulo: 'C — Consciência Emocional',
    minutos: 8,
    resumo: [
      'O método C.A.I.A. tem quatro pilares: Consciência Emocional, Autorregulação Estratégica, Inteligência Relacional e Alinhamento e Constância.',
      'O primeiro é perceber o que você sente antes que a emoção decida por você. Uma frustração antiga pode estar influenciando uma decisão de hoje sem você notar.',
      'O diário emocional é a ferramenta central deste pilar: anotar o que sentiu em cada situação ajuda a enxergar padrões que se repetem.',
    ],
    citacao: { texto: 'O que estou sentindo agora? Como isso pode impactar a situação?', capitulo: 4 },
    pratica: {
      titulo: 'Primeiro registro no Diário das Emoções',
      passos: [
        'Escolha uma situação de hoje que mexeu com você.',
        'Registre a situação, a emoção e o que você fez.',
        'Repita por 7 dias e depois leia tudo de uma vez, procurando o que se repete.',
      ],
      ferramenta: 'diario',
    },
    reflexao: 'Antes da sua próxima decisão importante, faça a pergunta deste capítulo. O que mudou?',
  },
  {
    id: 'autorregulacao',
    numero: 5,
    capitulo: 4,
    pilar: 'A',
    titulo: 'A — Autorregulação Estratégica',
    minutos: 6,
    resumo: [
      'Autorregular-se é reconhecer a emoção sem deixar que ela dite a resposta.',
      'Uma pausa para respirar fundo e a atenção plena, que é observar o que sente sem julgar, mudam a forma como você enxerga a situação.',
      'Com calma, a pressão deixa de ser adversária e vira convite para crescer.',
    ],
    pratica: {
      titulo: 'Dez respirações antes de responder',
      passos: [
        'Na próxima situação tensa, antes de responder, conte dez respirações profundas.',
        'Observe o corpo: onde está a tensão?',
        'Só então decida o que dizer ou fazer.',
      ],
      ferramenta: 'respiracao',
    },
    reflexao: 'Qual resposta sua desta semana teria sido diferente com dez respirações antes?',
  },
  {
    id: 'relacional',
    numero: 6,
    capitulo: 4,
    pilar: 'I',
    titulo: 'I — Inteligência Relacional',
    minutos: 6,
    resumo: [
      'Este pilar amplia o olhar: além das suas emoções, perceber as emoções de quem trabalha com você.',
      'Escutar de verdade, inclusive o que fica nas entrelinhas, fortalece a confiança e evita mal-entendidos que custam caro.',
      'Às vezes, uma pergunta simples sobre como a pessoa está abre espaço para conversas que destravam a equipe.',
    ],
    pratica: {
      titulo: 'Uma conversa com escuta ativa',
      passos: [
        'Escolha uma pessoa da equipe, sócio ou cliente.',
        'Pergunte como ela está e escute sem interromper nem resolver.',
        'Depois, anote o que percebeu além das palavras.',
      ],
    },
    reflexao: 'O que você poderia mudar na próxima conversa para torná-la mais significativa?',
  },
  {
    id: 'alinhamento',
    numero: 7,
    capitulo: 4,
    pilar: 'Al',
    titulo: 'A — Alinhamento e Constância',
    minutos: 5,
    resumo: [
      'Credibilidade nasce da coerência entre o que você diz e o que você faz.',
      'Quando a promessa não vira atitude, surgem frustração e desconfiança, em você e em quem te acompanha.',
      'Constância é manter esse alinhamento nos dias comuns, não só nos dias inspirados.',
    ],
    pratica: {
      titulo: 'Auditoria de coerência',
      passos: [
        'Escreva três valores que você diz ter como líder.',
        'Para cada um, anote uma atitude desta semana que o confirma, ou que o contradiz.',
        'Escolha um pequeno ajuste para os próximos 7 dias.',
      ],
    },
    reflexao: 'Onde existe hoje a maior distância entre o que você fala e o que você faz?',
  },
  {
    id: 'decisao',
    numero: 8,
    capitulo: 5,
    pilar: 'A',
    titulo: 'Regulação emocional e decisão',
    minutos: 6,
    resumo: [
      'Quando algo dá errado, o corpo acelera e a tendência é decidir no impulso.',
      'O livro mostra o caminho de fazer uma pausa, se permitir sentir a tensão e só então decidir. Não para ignorar a emoção, mas para entendê-la.',
      'Regulação emocional é como um músculo: fortalece com prática.',
    ],
    pratica: {
      titulo: 'Pausa antes da decisão',
      passos: [
        'Diante de uma decisão sob pressão, saia por alguns minutos para um lugar silencioso.',
        'Respire fundo e nomeie as emoções presentes.',
        'Pergunte: se eu estivesse calmo, o que decidiria?',
      ],
      ferramenta: 'roda',
    },
    reflexao: 'Qual decisão recente você tomou no impulso e como seria com uma pausa?',
  },
  {
    id: 'lideranca',
    numero: 9,
    capitulo: 6,
    pilar: 'I',
    titulo: 'Inteligência emocional na liderança',
    minutos: 6,
    resumo: [
      'Liderar com inteligência emocional é sentir a temperatura da equipe: quem está sobrecarregado, frustrado ou desmotivado.',
      'Em vez de buscar culpados, reconhecer os sentimentos presentes transforma uma reunião tensa em colaboração.',
      'Respirar antes de responder é uma das práticas mais simples deste capítulo.',
    ],
    pratica: {
      titulo: 'Termômetro da equipe',
      passos: [
        'Antes da próxima reunião, observe o clima por um minuto.',
        'Se houver tensão, nomeie em voz alta e com calma o que percebe.',
        'Abra espaço para cada pessoa falar antes de propor soluções.',
      ],
    },
    reflexao: 'Como a sua equipe descreveria o clima quando você entra na sala?',
  },
  {
    id: 'tempo',
    numero: 10,
    capitulo: 7,
    pilar: 'pratica',
    titulo: 'Tempo, prioridades e rotina',
    minutos: 7,
    resumo: [
      'Estar ocupado não é o mesmo que ser produtivo.',
      'A matriz de Eisenhower separa o urgente do importante e alivia a carga emocional: você passa a saber para onde remar.',
      'Uma rotina saudável é como uma dança: leve, mas com ritmo.',
    ],
    pratica: {
      titulo: 'Matriz de Eisenhower em 5 minutos',
      passos: [
        'Liste tudo o que está na sua cabeça hoje.',
        'Separe em quatro grupos: urgente e importante, importante e não urgente, urgente e não importante, nem um nem outro.',
        'Faça o primeiro, agende o segundo, delegue o terceiro e descarte o quarto.',
      ],
      ferramenta: 'matriz',
    },
    reflexao: 'Que tarefa importante você vem adiando porque o urgente grita mais alto?',
  },
  {
    id: 'burnout',
    numero: 11,
    capitulo: 8,
    pilar: 'pratica',
    titulo: 'Prevenção do esgotamento',
    minutos: 6,
    resumo: [
      'Autocuidado não é prêmio para depois da crise. É hábito diário.',
      'Pausas regulares, como a técnica Pomodoro (25 minutos de foco e 5 de pausa), uma caminhada curta e momentos sem tela devolvem energia.',
      'Pequenos rituais acumulados fazem a diferença entre um dia vivido e um dia apenas sobrevivido.',
    ],
    pratica: {
      titulo: 'Um ritual de respiro',
      passos: [
        'Escolha um pequeno ritual: caminhada, café sem celular ou leitura antes de dormir.',
        'Coloque no seu dia, num horário fixo, por 7 dias.',
        'No check-in semanal, observe a sua energia.',
      ],
      ferramenta: 'pomodoro',
    },
    reflexao: 'Que pequena prática te devolveria a sensação de acolhimento nesta semana?',
  },
  {
    id: 'pensamentos',
    numero: 12,
    capitulo: 9,
    pilar: 'C',
    titulo: 'Pensamentos automáticos (TCC)',
    minutos: 8,
    resumo: [
      'A Terapia Cognitivo-Comportamental ensina a reconhecer pensamentos automáticos, aqueles "e se der errado?" que surgem sozinhos e parecem verdade.',
      'Perceber que pensamento não é fato é o primeiro passo para reestruturá-lo.',
      'Registrar os pensamentos todos os dias ajuda a ver padrões: muitos medos são infundados, outros são só desafios.',
    ],
    citacao: { texto: 'Esse pensamento é realmente verdadeiro?', capitulo: 9 },
    pratica: {
      titulo: 'Registro de pensamento',
      passos: [
        'Anote a situação e o pensamento automático que veio.',
        'Pergunte: que evidências tenho a favor e contra ele?',
        'Escreva um pensamento alternativo, mais equilibrado.',
      ],
      ferramenta: 'pensamento',
    },
    reflexao: 'Qual "e se" mais tem te paralisado ultimamente?',
  },
  {
    id: 'ambiente',
    numero: 13,
    capitulo: 10,
    pilar: 'Al',
    titulo: 'Construindo um ambiente saudável',
    minutos: 5,
    resumo: [
      'O clima emocional de um lugar pesa tanto quanto a estrutura física.',
      'Diálogo aberto, feedback contínuo, pausas e reconhecimento do esforço constroem confiança e pertencimento.',
    ],
    pratica: {
      titulo: 'Um gesto de reconhecimento',
      passos: [
        'Escolha alguém que fez um esforço recente.',
        'Reconheça de forma específica o que a pessoa fez.',
        'Observe como isso muda a conversa seguinte.',
      ],
    },
    reflexao: 'Que conversa difícil o seu ambiente de trabalho ainda não tem espaço para acontecer?',
  },
  {
    id: 'casos',
    numero: 14,
    capitulo: 11,
    pilar: 'base',
    titulo: 'Histórias de quem atravessou',
    minutos: 5,
    resumo: [
      'O livro traz histórias de empreendedores que, no ponto de maior insegurança, perceberam a necessidade de uma mudança interior.',
      'Com prática diária, as crises deixaram de ser monstros e viraram situações a resolver com mais calma.',
    ],
    pratica: {
      titulo: 'A sua história até aqui',
      passos: [
        'Releia os registros do seu diário desde o começo da trilha.',
        'Anote uma situação que hoje você conduziria diferente.',
        'Escreva o que mudou em você.',
      ],
      ferramenta: 'diario',
    },
    reflexao: 'Se alguém contasse a sua travessia, qual seria o momento da virada?',
  },
  {
    id: 'encerramento',
    numero: 15,
    capitulo: 12,
    pilar: 'pratica',
    titulo: 'Levando para a vida',
    minutos: 7,
    resumo: [
      'O fechamento do livro convida a transformar conhecimento em prática: cinco minutos de meditação, um diário, gratidão e pausas curtas no meio do estresse.',
      'Uma dica valiosa é associar o hábito novo a um que você já tem, como o café da manhã.',
      'E lembrar de se perdoar: falhas fazem parte do aprendizado.',
    ],
    pratica: {
      titulo: 'Seu plano de constância',
      passos: [
        'Escolha um hábito âncora que você já tem (ex.: o café da manhã).',
        'Associe a ele uma prática curta: três gratidões ou cinco minutos de respiração.',
        'Ative o check-in semanal para acompanhar sua evolução.',
      ],
      ferramenta: 'constancia',
    },
    reflexao: 'Qual pequeno passo você dá amanhã de manhã?',
  },
];

export function estacaoPorId(id: string) {
  return TRILHA.find((e) => e.id === id);
}
