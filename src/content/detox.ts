/**
 * Detox Digital — trilha de 5 dias para tirar o celular do piloto automático.
 * Texto próprio do GovernaMente. Edite aqui para mudar o que aparece no app.
 */

export const DETOX = {
  nome: 'Detox Digital',
  subtitulo: '5 dias para tirar o celular do piloto automático',
  chamada: 'Um ajuste por dia, de 2 a 10 minutos, feito no seu próprio celular. Sem bloqueador, sem culpa.',
  frase: 'Você não precisa de mais força de vontade. Precisa de um ambiente que pare de jogar contra você.',
};

/** Antes do dia 1: por que funciona. */
export const FUNDAMENTOS: { titulo: string; texto: string }[] = [
  {
    titulo: 'A recompensa que nunca se sabe quando vem',
    texto:
      'Cada vez que você abre uma rede social, o cérebro aposta: pode ter algo bom, pode não ter nada. Essa incerteza é o que mais prende, o mesmo princípio das máquinas caça-níqueis. Não é falta de caráter nem de disciplina: são produtos desenhados por equipes inteiras para você voltar "só mais uma vez".',
  },
  {
    titulo: 'O celular cobra atenção até parado',
    texto:
      'Pesquisadores da Universidade do Texas (Ward e colegas, 2017) mostraram que só ter o celular à vista, mesmo virado para baixo, já reduz a capacidade de concentração: parte da mente fica ocupada em não pegá-lo. E um levantamento da dscout (2016) contou, em média, mais de 2.600 toques na tela por dia. A maioria sem decisão consciente.',
  },
  {
    titulo: 'Conduzir o ambiente, não brigar com o impulso',
    texto:
      'Na hora do impulso, a força de vontade costuma perder. Por isso esta trilha muda o ambiente: menos cor, menos chamados, mais distância. É o que a psicologia comportamental chama de redesenho de ambiente. Governar a mente começa por diminuir as ondas que batem nela.',
  },
];

export type Gatilho = string;
export const GATILHOS: Gatilho[] = [
  'Logo ao acordar',
  'Antes de dormir',
  'Em filas e esperas',
  'No meio do trabalho',
  'Quando bate tédio',
  'Quando bate ansiedade',
  'Durante as refeições',
  'Ao ouvir uma notificação',
  'No trânsito ou parado',
  'Ao travar numa tarefa difícil',
];

export type Passos = { iphone: string[]; android: string[]; dica?: string };

export type ItemAcao = { id: string; texto: string; opcional?: boolean };

export type DiaDetox = {
  numero: 1 | 2 | 3 | 4 | 5;
  titulo: string;
  tema: string; // uma palavra para o marcador de progresso
  minutos: number;
  porque: string[];
  passos?: Passos;
  /** O que a pessoa marca para concluir o dia. */
  acao: { tipo: 'diagnostico' | 'checklist' | 'contador' | 'consolidar'; texto: string; itens?: ItemAcao[] };
  reflexao: string;
};

export const DIAS: DiaDetox[] = [
  {
    numero: 1,
    titulo: 'Ver o padrão com clareza',
    tema: 'Padrão',
    minutos: 5,
    porque: [
      'Hoje você não muda nada. Só olha. Quase todo mundo acha que usa o celular bem menos do que usa, e é difícil conduzir o que não se enxerga.',
      'O número de hoje vira o seu ponto de partida. Ao longo da trilha, você registra o tempo de tela todos os dias e acompanha a curva no gráfico.',
    ],
    passos: {
      iphone: ['Abra Ajustes.', 'Toque em Tempo de Uso.', 'Toque em "Ver Toda a Atividade" e confira o total do dia e da semana.', 'Anote os 3 apps que mais aparecem.'],
      android: [
        'Abra Configurações.',
        'Toque em Bem-estar digital e controle parental.',
        'Confira o tempo de tela do dia no painel e o gráfico da semana.',
        'Anote os 3 apps que mais aparecem.',
      ],
      dica: 'O nome do menu muda um pouco conforme o modelo. Se não achar, procure "tempo de uso" ou "bem-estar" na busca das configurações.',
    },
    acao: {
      tipo: 'diagnostico',
      texto: 'Registre o seu tempo de tela, os 3 apps que mais te prendem e os 3 momentos em que você mais pega o celular sem decidir.',
    },
    reflexao: 'O que você sentiu ao ver o seu número real?',
  },
  {
    numero: 2,
    titulo: 'Tirar a cor da tela',
    tema: 'Sem cor',
    minutos: 3,
    porque: [
      'Vermelho, laranja, gradientes vibrantes: as cores dos apps foram escolhidas para chamar o olho. Quando a tela fica em tons de cinza, o conteúdo continua igual, mas o cérebro recebe menos sinal de "isso é interessante".',
      'É o ajuste mais simples da trilha e, para muita gente, o que mais surpreende. Fotos e vídeos perdem parte da graça, e o polegar desacelera sozinho.',
    ],
    passos: {
      iphone: [
        'Ajustes → Acessibilidade → Tela e Tamanho do Texto.',
        'Toque em Filtros de Cor e ative a chave.',
        'Escolha Escala de Cinza.',
        'Atalho: Ajustes → Acessibilidade → Atalho de Acessibilidade → Filtros de Cor. Três toques no botão lateral ligam e desligam.',
      ],
      android: [
        'Configurações → Acessibilidade.',
        'Toque em Melhorias de visão (ou Visibilidade).',
        'Toque em Ajuste de cor ou Correção de cor e escolha Escala de cinza.',
        'Se tiver Bem-estar digital: Modo hora de dormir → Personalizar → Escala de cinza, com horário programado.',
      ],
      dica: 'Precisa ver uma foto colorida? Use o atalho, veja e volte para o cinza.',
    },
    acao: {
      tipo: 'checklist',
      texto: 'Ative a escala de cinza agora e deixe ligada pelo resto do dia.',
      itens: [
        { id: 'cinza', texto: 'Ativei a escala de cinza' },
        { id: 'atalho', texto: 'Configurei o atalho para ligar e desligar', opcional: true },
      ],
    },
    reflexao: 'Ao longo do dia, o que mudou na sua vontade de abrir os apps?',
  },
  {
    numero: 3,
    titulo: 'Silenciar quem te chama sem ser gente',
    tema: 'Avisos',
    minutos: 10,
    porque: [
      'Notificação é a aposta em estado puro: você não sabe o que é até abrir. Por isso ela fura qualquer concentração.',
      'A regra de hoje é simples: avisa quem é gente esperando resposta (mensagens, ligações, e-mail de trabalho crítico). Tudo o que vem de algoritmo (redes sociais, jogos, vídeos, notícias, promoções) fica em silêncio.',
    ],
    passos: {
      iphone: [
        'Ajustes → Notificações.',
        'Toque em cada app de rede social, vídeo, jogo, loja ou notícia.',
        'Desligue "Permitir Notificações".',
        'Nos que ficarem, desligue também os Indicadores (os números vermelhos no ícone).',
      ],
      android: [
        'Configurações → Apps (ou Notificações).',
        'Toque no app que quer silenciar → Notificações.',
        'Desligue a chave principal.',
        'Em Configurações → Notificações, desligue os pontos/selos nos ícones, se o modelo permitir.',
      ],
      dica: 'O número vermelho no ícone puxa tanto quanto o som. Ele também conta.',
    },
    acao: {
      tipo: 'contador',
      texto: 'Silencie pelo menos 3 apps que não sejam de conversa com pessoas.',
      itens: [{ id: 'selos', texto: 'Desliguei os números vermelhos onde deu', opcional: true }],
    },
    reflexao: 'Quais avisos você descobriu que não fazem falta nenhuma?',
  },
  {
    numero: 4,
    titulo: 'Colocar distância entre você e o impulso',
    tema: 'Distância',
    minutos: 10,
    porque: [
      'Cada toque a mais entre você e um app diminui a chance de abri-lo no automático. Não é proibição, é fricção: o caminho fica um pouco mais longo, e nesse meio-tempo você tem a chance de decidir.',
      'Ao mesmo tempo, o que você quer fazer mais fica a um toque de distância.',
    ],
    passos: {
      iphone: [
        'Toque e segure o ícone → Remover App → Remover da Tela de Início (o app continua na Biblioteca).',
        'Deixe na primeira tela só o que é ferramenta: câmera, notas, mapa, calculadora, o GovernaMente.',
        'Junte os apps que mais te prendem numa pasta na última tela.',
      ],
      android: [
        'Toque e segure o ícone → Remover da tela inicial (o app continua na gaveta).',
        'Deixe na primeira tela só o que é ferramenta: câmera, notas, mapa, calculadora, o GovernaMente.',
        'Junte os apps que mais te prendem numa pasta na última tela.',
      ],
      dica: 'Se um app funciona bem pelo navegador, considere apagar o aplicativo e entrar pelo site. Ter que fazer login já é fricção suficiente.',
    },
    acao: {
      tipo: 'checklist',
      texto: 'Reorganize a tela inicial e combine com você mesmo o próximo bloco de foco.',
      itens: [
        { id: 'remover', texto: 'Tirei pelo menos 2 apps da tela inicial' },
        { id: 'utilitarios', texto: 'Deixei na primeira tela só apps de ferramenta' },
        { id: 'pasta', texto: 'Coloquei os apps que mais me prendem numa pasta na última tela', opcional: true },
        { id: 'foco', texto: 'No próximo bloco de trabalho ou estudo, o celular fica fora do alcance do braço' },
      ],
    },
    reflexao: 'Em que momento você esticou a mão para o app e ele não estava lá?',
  },
  {
    numero: 5,
    titulo: 'Sustentar o que você construiu',
    tema: 'Constância',
    minutos: 5,
    porque: [
      'O risco agora não é falhar nos ajustes: é ver resultado, relaxar e, em duas semanas, estar no ponto de partida. Atualizações do sistema devolvem apps para a tela inicial e reativam notificações sem pedir licença.',
      'Por isso, hoje você faz a primeira revisão e combina uma revisão semanal de 5 minutos.',
      'E quando escorregar (vai acontecer: 40 minutos num feed sem perceber), não existe "estraguei tudo". Você só volta ao ajuste na próxima chance. Constância imperfeita por meses vale mais que perfeição por uma semana.',
    ],
    acao: {
      tipo: 'consolidar',
      texto: 'Registre o tempo de tela de hoje, compare com o dia 1 e faça a primeira revisão.',
      itens: [
        { id: 'tela', texto: 'Conferi se algum app voltou para a tela inicial' },
        { id: 'notif', texto: 'Conferi se alguma notificação foi reativada' },
        { id: 'cinza', texto: 'A escala de cinza continua ligada (ou no horário programado)' },
      ],
    },
    reflexao: 'Qual ajuste você quer proteger daqui para frente?',
  },
];

export const diaDetox = (n: number) => DIAS.find((d) => d.numero === n);

/** Pausa do impulso: um minuto guiado para quando a vontade aperta. */
export const PAUSA: { segundos: number; texto: string }[] = [
  { segundos: 0, texto: 'Solte o celular. Vire a tela para baixo ou deixe fora do seu campo de visão.' },
  { segundos: 10, texto: 'Respire devagar. Solte o ar mais longo do que puxou.' },
  { segundos: 22, texto: 'Olhe para um ponto longe: uma janela, o fim do corredor. Fique ali alguns segundos.' },
  { segundos: 36, texto: 'Nomeie 3 coisas que você vê e 2 que você ouve agora.' },
  { segundos: 48, texto: 'O que você estava fazendo antes desse impulso aparecer?' },
];
export const PAUSA_DURACAO = 60;

export const PAUSA_DEPOIS: string[] = [
  'Beba um copo de água inteiro, devagar.',
  'Se a vontade é de conversar, mande mensagem para uma pessoa de verdade, em vez de abrir o feed.',
  'Volte para a tarefa que você estava fazendo.',
];

export const MANUTENCAO: { quando: string; itens: string[] }[] = [
  {
    quando: 'Toda semana',
    itens: ['Revisão de 5 minutos, sempre no mesmo dia (o app te lembra).', 'Registre o tempo de tela e olhe a curva no gráfico.'],
  },
  {
    quando: 'Todo mês',
    itens: [
      'Revise as notificações: app novo quase sempre pede permissão sem você perceber.',
      'Revise a tela inicial: atualizações costumam devolver apps para lá.',
    ],
  },
  {
    quando: 'A cada 3 meses',
    itens: ['Refaça o diagnóstico do dia 1. A rotina muda, e os gatilhos mudam junto.'],
  },
];

export const AMBIENTE: { lugar: string; itens: string[] }[] = [
  {
    lugar: 'No quarto',
    itens: [
      'Carregue o celular fora do quarto, ou ao menos longe do alcance da cama.',
      'Um despertador simples tira a maior desculpa para pegar o celular ao acordar e antes de dormir.',
    ],
  },
  {
    lugar: 'No trabalho e no estudo',
    itens: ['Celular fora da mesa nos blocos de foco, não só virado para baixo.', 'Se precisar dele por perto, modo avião durante o bloco.'],
  },
  {
    lugar: 'Nas refeições',
    itens: ['Celular longe da mesa. De quebra, fica mais fácil perceber a saciedade e a conversa.'],
  },
];
