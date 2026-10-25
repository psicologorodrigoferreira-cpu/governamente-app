/**
 * Testes de autoconhecimento do GovernaMente, transcritos do portal (portal.governamente.com.br/testes).
 * Itens originais do GovernaMente. Instrumentos de reflexão e rastreio, sem validação psicométrica:
 * não são diagnóstico. Os testes clínicos e de neurodesenvolvimento ficam no portal, onde o resultado
 * vai para o psicólogo; as atividades cronometradas (atenção, memória, raciocínio, velocidade) também.
 * Item: [eixo, texto] ou [eixo, texto, 1] quando invertido (concordar = menos do traço).
 */

export type Escala = 'freq' | 'conc' | 'dias';
export type Modo = 'nivel' | 'pos' | 'neutro' | 'ranking' | 'apego';
export type Eixo = { id: string; nome: string; d: string; perfil?: string };
export type Item = [string, string] | [string, string, 1];
type Nivel = 'baixo' | 'moderado' | 'alto';
export type ResultadoEixo = { id: string; nome: string; d: string; pct: number };

export type Teste = {
  id: string;
  categoria: 'personalidade' | 'habilidades' | 'bemestar' | 'saude';
  /** Mostra o aviso de cuidado (CVV/SAMU) no resultado. */
  cuidado?: boolean;
  titulo: string;
  tempo: string;
  resumo: string;
  intro: string;
  escala: Escala;
  modo: Modo;
  tema?: string;
  eixos: Eixo[];
  itens: Item[];
  rotulos?: Record<Nivel, string>;
  leitura?: Record<Nivel, string>;
  rank?: { tit: string; n: number };
  passo?: string;
  perfil?: (a: number, e: number) => { nome: string; txt: string };
  extra?: (eixos: ResultadoEixo[]) => string;
};

export const ESCALAS: Record<Escala, string[]> = {
  freq: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
  conc: ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'],
  dias: ['Nenhum dia', 'Poucos dias', 'Cerca de metade dos dias', 'Quase todos os dias', 'Todos os dias'],
};

export const CATEGORIAS: { id: Teste['categoria']; nome: string }[] = [
  { id: 'personalidade', nome: 'Personalidade' },
  { id: 'habilidades', nome: 'Habilidades e liderança' },
  { id: 'bemestar', nome: 'Bem-estar' },
  { id: 'saude', nome: 'Saúde emocional' },
];

const SOMBRA: Record<string, string> = {
  ino: 'negação do que dói, só para manter a paz',
  com: 'apagar-se para ser aceito(a)',
  her: 'viver em batalha e esconder o cansaço',
  out: 'destruir também o que vale a pena guardar',
  exp: 'fugir em vez de buscar',
  cri: 'perfeccionismo que trava a entrega',
  gov: 'querer controlar tudo',
  mag: 'usar influência sem transparência',
  ama: 'perder-se de si para manter o laço',
  bob: 'fugir pelo humor do que precisa ser dito',
  cui: 'servir até se esgotar e cobrar por isso em silêncio',
  sab: 'analisar sem fim quando é hora de agir',
};

export const TESTES: Teste[] = [
  {
    id: 'arquetipos',
    categoria: 'personalidade',
    escala: 'conc',
    modo: 'ranking',
    titulo: 'Os 12 Arquétipos',
    tempo: '10 min',
    resumo: 'Quais padrões internos, como o Cuidador, o Herói ou o Sábio, estão mais ativos em você neste momento da vida.',
    intro:
      'Responda pensando em como você tem sido nos últimos meses, e não em como gostaria de ser. Arquétipos mudam com a fase da vida: este é um retrato de agora.',
    rank: { tit: 'Seus 3 arquétipos mais ativos', n: 3 },
    eixos: [
      { id: 'ino', nome: 'Inocente', d: 'Busca segurança, simplicidade e esperança.', perfil: 'O Inocente em você busca segurança, simplicidade e esperança. Seu dom é a fé de que é possível recomeçar; o cuidado é não negar o que dói só para manter a paz.' },
      { id: 'com', nome: 'Cara Comum', d: 'Busca pertencer, ser verdadeiro(a) e estar junto.', perfil: 'O Cara Comum em você valoriza pertencer, ser verdadeiro(a) e estar junto. Seu dom é a empatia e a lealdade; o cuidado é não se apagar para ser aceito(a).' },
      { id: 'her', nome: 'Herói', d: 'Busca provar valor com coragem e disciplina.', perfil: 'O Herói em você quer provar valor com coragem e disciplina. Seu dom é agir diante do difícil; o cuidado é não transformar tudo em batalha nem esconder o cansaço.' },
      { id: 'out', nome: 'Fora da Lei', d: 'Questiona o que não funciona e busca liberdade para mudar.', perfil: 'O Fora da Lei em você questiona o que não funciona e quer liberdade para mudar. Seu dom é romper o que aprisiona; o cuidado é não destruir junto o que vale a pena guardar.' },
      { id: 'exp', nome: 'Explorador', d: 'Busca liberdade, descoberta e o próprio caminho.', perfil: 'O Explorador em você precisa de liberdade e descoberta. Seu dom é a autonomia de seguir o próprio caminho; o cuidado é não confundir busca com fuga.' },
      { id: 'cri', nome: 'Criador', d: 'Busca dar forma ao que imagina e deixar algo que dure.', perfil: 'O Criador em você quer dar forma ao que imagina e deixar algo que dure. Seu dom é a imaginação que vira obra; o cuidado é não deixar o perfeccionismo travar o que já está bom o bastante.' },
      { id: 'gov', nome: 'Governante', d: 'Organiza, decide e assume responsabilidade.', perfil: 'O Governante em você organiza, decide e assume a responsabilidade. Seu dom é criar ordem e segurança para os outros; o cuidado é não confundir liderar com controlar tudo.' },
      { id: 'mag', nome: 'Mago', d: 'Enxerga possibilidades e busca transformar situações.', perfil: 'O Mago em você enxerga possibilidades e quer transformar situações. Seu dom é a visão que inspira mudança; o cuidado é manter os pés no chão e agir com transparência.' },
      { id: 'ama', nome: 'Sedutor', d: 'Valoriza vínculo, intimidade e beleza.', perfil: 'O Sedutor em você valoriza vínculo, intimidade e beleza. Seu dom é a entrega e a sensibilidade; o cuidado é não se perder de si para manter o laço.' },
      { id: 'bob', nome: 'Bobo da Corte', d: 'Traz leveza, presença e humor.', perfil: 'O Bobo da Corte em você traz leveza, presença e humor. Seu dom é aliviar a tensão e viver o agora; o cuidado é não usar a piada para fugir do que precisa ser dito.' },
      { id: 'cui', nome: 'Cuidador', d: 'Protege, acolhe e se importa com o outro.', perfil: 'O Cuidador em você protege, acolhe e se importa. Seu dom é a compaixão generosa; o cuidado é incluir a si mesmo(a) na conta para não adoecer de tanto servir.' },
      { id: 'sab', nome: 'Sábio', d: 'Busca entender, estudar e chegar à verdade.', perfil: 'O Sábio em você busca entender, estudar e chegar à verdade. Seu dom é o discernimento; o cuidado é não ficar analisando para sempre quando é hora de agir.' },
    ],
    itens: [
      ['ino', 'Costumo acreditar que as coisas vão dar certo no final.'],
      ['ino', 'Procuro ambientes simples, seguros e sem conflito.'],
      ['ino', 'Tenho medo de errar e ser reprovado(a) por isso.'],
      ['ino', 'Prefiro seguir as regras para ficar em paz.'],
      ['ino', 'Mesmo depois de decepções, volto a confiar nas pessoas.'],
      ['com', 'Me sinto bem quando sou aceito(a) como todo mundo, sem precisar me destacar.'],
      ['com', 'Admiro pessoas simples e honestas, que não se acham melhores que as outras.'],
      ['com', 'Evito chamar atenção demais para não ser rejeitado(a) pelo grupo.'],
      ['com', 'Me adapto ao jeito do grupo para fazer parte.'],
      ['com', 'Gosto de ser alguém acessível, em quem os outros confiam.'],
      ['her', 'Diante de um desafio difícil, sinto vontade de enfrentá-lo de frente.'],
      ['her', 'Gosto de provar do que sou capaz por meio de resultados.'],
      ['her', 'Me incomoda ser visto(a) como fraco(a) ou vulnerável.'],
      ['her', 'Treino e me disciplino até dominar aquilo que preciso fazer.'],
      ['her', 'Sinto que preciso lutar por alguma causa ou vencer algum adversário.'],
      ['out', 'Questiono regras que me parecem injustas ou ultrapassadas.'],
      ['out', 'Sinto prazer em romper com o que é convencional.'],
      ['out', 'Me irrita sentir que não tenho poder sobre a minha própria vida.'],
      ['out', 'Já defendi uma mudança radical, mesmo correndo o risco de ser mal visto(a).'],
      ['out', 'Não tenho receio de ser diferente do que esperam de mim.'],
      ['exp', 'Preciso de liberdade para escolher o meu próprio caminho.'],
      ['exp', 'Me animo com lugares, ideias e experiências que nunca vivi.'],
      ['exp', 'Me angustia a sensação de estar preso(a) em uma rotina.'],
      ['exp', 'Prefiro seguir a minha busca pessoal a me encaixar no que esperam de mim.'],
      ['exp', 'Me sinto mais vivo(a) quando estou descobrindo algo novo.'],
      ['cri', 'Sinto necessidade de criar algo meu, que permaneça depois de mim.'],
      ['cri', 'Imagino com facilidade como transformar uma ideia em algo concreto.'],
      ['cri', 'Tenho receio de produzir algo medíocre.'],
      ['cri', 'Posso passar horas aprimorando um detalhe até ficar como imaginei.'],
      ['cri', 'Expressar o que sinto em um projeto, texto, arte ou negócio me realiza.'],
      ['gov', 'Gosto de organizar pessoas, processos e recursos para as coisas funcionarem.'],
      ['gov', 'Me sinto desconfortável quando as coisas estão fora de controle.'],
      ['gov', 'Assumo a responsabilidade quando ninguém decide.'],
      ['gov', 'Gosto de estabelecer regras claras e padrões para a equipe ou para a família.'],
      ['gov', 'Tenho dificuldade de delegar, porque temo que as coisas não saiam como eu quero.'],
      ['mag', 'Acredito que posso transformar situações difíceis em oportunidades.'],
      ['mag', 'Sou movido(a) pela visão de como as coisas poderiam ser.'],
      ['mag', 'Receio que minhas escolhas gerem efeitos que eu não previ.'],
      ['mag', 'Percebo ligações entre fatos que outras pessoas não notam.'],
      ['mag', 'Gosto de criar momentos em que as pessoas sintam que algo mudou de verdade.'],
      ['ama', 'Para mim, vínculo e intimidade importam mais do que status ou dinheiro.'],
      ['ama', 'Me emociono com beleza, música, comida boa e experiências sensoriais.'],
      ['ama', 'Tenho medo de ficar sozinho(a) ou de não ser desejado(a).'],
      ['ama', 'Me dedico por inteiro às pessoas e às causas que amo.'],
      ['ama', 'Gosto de criar um clima de proximidade e carinho.'],
      ['bob', 'Faço piada para aliviar a tensão do ambiente.'],
      ['bob', 'Prefiro viver o momento a planejar demais.'],
      ['bob', 'Tenho aversão ao tédio e a lugares sérios demais.'],
      ['bob', 'Uso o humor para falar de assuntos difíceis.'],
      ['bob', 'Gosto de quebrar a formalidade e fazer o grupo rir.'],
      ['cui', 'Quando alguém está mal, sinto necessidade de ajudar.'],
      ['cui', 'Costumo colocar as necessidades dos outros antes das minhas.'],
      ['cui', 'Sinto culpa quando penso em mim primeiro.'],
      ['cui', 'Gosto de proteger quem está mais vulnerável.'],
      ['cui', 'Fico magoado(a) quando o meu cuidado não é reconhecido.'],
      ['sab', 'Preciso entender a fundo um assunto antes de opinar ou decidir.'],
      ['sab', 'Gosto de ler, estudar e buscar a verdade dos fatos.'],
      ['sab', 'Tenho receio de ser enganado(a) ou de decidir sem informação suficiente.'],
      ['sab', 'Prefiro analisar com calma a agir por impulso.'],
      ['sab', 'Costumo ser procurado(a) para dar uma opinião ponderada.'],
    ],
    passo:
      'Escolha um dos seus três arquétipos e um que ficou mais baixo. Observe, nesta semana, uma situação em que cada um apareceu ou fez falta. Os padrões mudam com a fase da vida, e conhecer os seus ajuda a escolher quando usar cada um.',
    extra: (eixos) => {
      const l = [...eixos].sort((a, b) => b.pct - a.pct);
      const topo = l[0];
      const b1 = l[l.length - 1];
      const b2 = l[l.length - 2];
      return (
        `Sob estresse, o arquétipo mais forte tende a aparecer em excesso: no seu caso, o ${topo.nome} pode virar ${SOMBRA[topo.id] ?? 'exagero'}. ` +
        `Os menos acionados agora são o ${b1.nome} e o ${b2.nome}. Isso não é falha: costuma ser território pouco usado, e pode ser um bom lugar para desenvolver, em doses pequenas. ` +
        'É um retrato para refletir, e não um diagnóstico nem um tipo fixo.'
      );
    },
  },
  {
    id: 'amabilidade',
    categoria: 'personalidade',
    escala: 'conc',
    modo: 'neutro',
    titulo: 'Amabilidade',
    tempo: '3 min',
    resumo: 'Como você equilibra cuidado com o outro, cooperação e confiança nas relações.',
    intro: 'Responda pensando em como você costuma ser, e não em como gostaria de ser.',
    eixos: [
      { id: 'emp', nome: 'Empatia', d: 'Sensibilidade ao que o outro sente.' },
      { id: 'coo', nome: 'Cooperação', d: 'Disposição para ceder e construir junto.' },
      { id: 'con', nome: 'Confiança', d: 'Crença nas boas intenções das pessoas.' },
    ],
    itens: [
      ['emp', 'Percebo quando alguém está mal mesmo sem a pessoa dizer.'],
      ['emp', 'Me comovo com a dor dos outros.'],
      ['emp', 'Raramente me interesso pelos problemas dos outros.', 1],
      ['emp', 'Gosto de ajudar sem esperar nada em troca.'],
      ['coo', 'Prefiro ceder a entrar em conflito.'],
      ['coo', 'Gosto de trabalhar em equipe.'],
      ['coo', 'Costumo insistir no meu ponto de vista até vencer a discussão.', 1],
      ['coo', 'Busco soluções em que todos saiam bem.'],
      ['con', 'Acredito que a maioria das pessoas tem boas intenções.'],
      ['con', 'Desconfio com facilidade das intenções alheias.', 1],
      ['con', 'Dou o benefício da dúvida antes de julgar.'],
      ['con', 'Acho que quem é gentil quase sempre quer algo em troca.', 1],
    ],
    rotulos: { baixo: 'Estilo mais direto e competitivo', moderado: 'Equilíbrio entre firmeza e cuidado', alto: 'Estilo acolhedor e cooperativo' },
    leitura: {
      baixo: 'Você tende a priorizar objetivos e clareza, e a dizer o que pensa sem rodeios. É uma força em negociações e decisões duras; vale cuidar para que o jeito direto não afaste quem importa.',
      moderado: 'Você combina cuidado com firmeza conforme a situação. Esse equilíbrio ajuda a cooperar sem se anular.',
      alto: 'Você valoriza harmonia, cooperação e o bem-estar dos outros. É uma força nos vínculos; vale cuidar para não ceder além do que é saudável para você.',
    },
  },
  {
    id: 'estabilidade',
    categoria: 'personalidade',
    escala: 'conc',
    modo: 'neutro',
    titulo: 'Estabilidade Emocional',
    tempo: '3 min',
    resumo: 'Como você lida com pressão, imprevistos e oscilações de humor.',
    intro: 'Pense em como você reage, em geral, quando as coisas apertam.',
    eixos: [
      { id: 'cal', nome: 'Calma', d: 'Tranquilidade diante da pressão e da incerteza.' },
      { id: 'res', nome: 'Resiliência', d: 'Rapidez para se recuperar de golpes e críticas.' },
      { id: 'con', nome: 'Controle emocional', d: 'Capacidade de esfriar a cabeça antes de reagir.' },
    ],
    itens: [
      ['cal', 'Mantenho a calma sob pressão.'],
      ['cal', 'Me preocupo demais com coisas que podem dar errado.', 1],
      ['cal', 'Fico tenso(a) sem motivo claro.', 1],
      ['cal', 'Consigo relaxar com facilidade.'],
      ['res', 'Me recupero rápido depois de um dia ruim.'],
      ['res', 'Uma crítica me abala por muito tempo.', 1],
      ['res', 'Encaro imprevistos como desafios, e não como ameaças.'],
      ['res', 'Perco o chão quando as coisas saem do plano.', 1],
      ['con', 'Consigo esfriar a cabeça antes de reagir.'],
      ['con', 'Explodo com facilidade quando me irrito.', 1],
      ['con', 'Meu humor é bastante estável.'],
      ['con', 'Fico remoendo erros por dias.', 1],
    ],
    rotulos: { baixo: 'Emoções intensas e sensíveis', moderado: 'Estabilidade moderada', alto: 'Alta estabilidade emocional' },
    leitura: {
      baixo: 'Você sente as coisas com intensidade e percebe cedo os riscos. É uma sensibilidade que tem valor, mas que pede estratégias de regulação para não desgastar.',
      moderado: 'Você oscila entre momentos de firmeza e de maior sensibilidade, o que é bastante comum. Observe em que contextos a balança pende para o lado do desgaste.',
      alto: 'Você tende a atravessar pressões com serenidade e a se recuperar rápido. Vale cuidar para não ignorar sinais de cansaço por parecer sempre bem.',
    },
  },
  {
    id: 'conscienciosidade',
    categoria: 'personalidade',
    escala: 'conc',
    modo: 'neutro',
    titulo: 'Conscienciosidade',
    tempo: '3 min',
    resumo: 'Seu jeito de organizar, sustentar a disciplina e cumprir o que combina.',
    intro: 'Pense em como você funciona na rotina, no trabalho e nos compromissos.',
    eixos: [
      { id: 'org', nome: 'Organização', d: 'Ordem, planejamento e método.' },
      { id: 'dis', nome: 'Disciplina', d: 'Persistência e capacidade de concluir.' },
      { id: 'res', nome: 'Responsabilidade', d: 'Cumprimento de prazos e promessas.' },
    ],
    itens: [
      ['org', 'Mantenho minhas coisas em ordem.'],
      ['org', 'Faço listas e planejo antes de agir.'],
      ['org', 'Costumo deixar tudo bagunçado.', 1],
      ['org', 'Gosto de ter rotina e método.'],
      ['dis', 'Termino o que começo.'],
      ['dis', 'Me distraio e abandono tarefas pela metade.', 1],
      ['dis', 'Consigo me forçar a trabalhar mesmo sem vontade.'],
      ['dis', 'Deixo para depois o que deveria fazer agora.', 1],
      ['res', 'Cumpro prazos e compromissos.'],
      ['res', 'Chego atrasado(a) com frequência.', 1],
      ['res', 'Cuido dos detalhes para que nada falhe.'],
      ['res', 'Acho normal não cumprir o combinado quando surge algo melhor.', 1],
    ],
    rotulos: { baixo: 'Estilo espontâneo e flexível', moderado: 'Equilíbrio entre método e flexibilidade', alto: 'Estilo organizado e disciplinado' },
    leitura: {
      baixo: 'Você tende a ser espontâneo(a) e adaptável, e a se sentir sufocado(a) por excesso de regras. Algumas estruturas simples podem proteger sua energia sem tirar sua liberdade.',
      moderado: 'Você usa método quando precisa e flexibilidade quando convém. Vale observar em quais áreas a organização faz falta.',
      alto: 'Você é confiável, organizado(a) e persistente. Vale cuidar para que a exigência não vire rigidez ou perfeccionismo.',
    },
  },
  {
    id: 'abertura',
    categoria: 'personalidade',
    escala: 'conc',
    modo: 'neutro',
    titulo: 'Abertura a Experiências',
    tempo: '3 min',
    resumo: 'Sua curiosidade, imaginação e disposição para o novo.',
    intro: 'Pense no quanto você busca ideias, culturas e experiências diferentes.',
    eixos: [
      { id: 'cur', nome: 'Curiosidade intelectual', d: 'Interesse por ideias e aprendizado.' },
      { id: 'ima', nome: 'Imaginação', d: 'Vida interior e sensibilidade estética.' },
      { id: 'nov', nome: 'Abertura ao novo', d: 'Disposição para mudar e experimentar.' },
    ],
    itens: [
      ['cur', 'Gosto de aprender sobre assuntos que não tenho obrigação de estudar.'],
      ['cur', 'Debates de ideias me estimulam.'],
      ['cur', 'Acho entediante discutir ideias abstratas.', 1],
      ['cur', 'Costumo ler ou pesquisar por pura curiosidade.'],
      ['ima', 'Tenho uma imaginação vívida.'],
      ['ima', 'Gosto de arte, música ou escrita.'],
      ['ima', 'Raramente me envolvo com cultura ou arte.', 1],
      ['ima', 'Me perco em devaneios criativos.'],
      ['nov', 'Gosto de experimentar coisas novas.'],
      ['nov', 'Prefiro sempre o caminho conhecido.', 1],
      ['nov', 'Mudanças de rotina me animam.'],
      ['nov', 'Tenho dificuldade de aceitar jeitos diferentes de fazer as coisas.', 1],
    ],
    rotulos: { baixo: 'Estilo prático e tradicional', moderado: 'Equilíbrio entre o novo e o conhecido', alto: 'Estilo curioso e inovador' },
    leitura: {
      baixo: 'Você valoriza o que é testado, concreto e confiável. É uma força para consistência; vale experimentar o novo em doses pequenas para não perder oportunidades.',
      moderado: 'Você abre espaço para o novo sem abrir mão do que funciona. É um equilíbrio saudável entre explorar e consolidar.',
      alto: 'Você é curioso(a), imaginativo(a) e aberto(a) a mudanças. Vale cuidar para transformar ideias em ações concluídas.',
    },
  },
  {
    id: 'extroversao',
    categoria: 'personalidade',
    escala: 'conc',
    modo: 'neutro',
    titulo: 'Introversão x Extroversão',
    tempo: '3 min',
    resumo: 'Onde você ganha e gasta energia: no convívio com muita gente ou no recolhimento.',
    intro: 'Não há lado melhor: é só uma tendência de como você carrega a energia.',
    eixos: [
      { id: 'soc', nome: 'Energia social', d: 'Quanto o convívio recarrega ou esgota você.' },
      { id: 'ass', nome: 'Iniciativa e presença', d: 'Conforto em liderar a conversa e aparecer.' },
      { id: 'ent', nome: 'Expressividade', d: 'Entusiasmo, movimento e vida para fora.' },
    ],
    itens: [
      ['soc', 'Me sinto energizado(a) depois de estar com muita gente.'],
      ['soc', 'Prefiro ficar sozinho(a) a ir a festas.', 1],
      ['soc', 'Puxo conversa com desconhecidos facilmente.'],
      ['soc', 'Encontros sociais longos me esgotam.', 1],
      ['ass', 'Gosto de assumir a frente em grupos.'],
      ['ass', 'Prefiro ficar em segundo plano.', 1],
      ['ass', 'Falo o que penso sem dificuldade.'],
      ['ass', 'Evito chamar atenção.', 1],
      ['ent', 'Costumo ser a pessoa que anima o ambiente.'],
      ['ent', 'Vivo mais dentro da minha cabeça do que falando.', 1],
      ['ent', 'Busco emoção e movimento.'],
      ['ent', 'Prefiro silêncio e momentos calmos a ambientes agitados.', 1],
    ],
    rotulos: { baixo: 'Tendência à introversão', moderado: 'Perfil ambivertido', alto: 'Tendência à extroversão' },
    leitura: {
      baixo: 'Você recarrega a bateria no recolhimento e tende a preferir poucas conexões profundas. Planejar pausas depois de eventos sociais protege sua energia.',
      moderado: 'Você transita bem entre o convívio e a solitude, ajustando-se ao que a situação pede. É o que chamamos de ambiversão.',
      alto: 'Você ganha energia com pessoas, movimento e interação. Vale reservar momentos de silêncio para não viver só para fora.',
    },
  },
  {
    id: 'linguagens',
    categoria: 'personalidade',
    escala: 'conc',
    modo: 'ranking',
    titulo: 'Linguagens do Amor',
    tempo: '4 min',
    resumo: 'De que forma você mais se sente amado(a) e cuidado(a) nas relações.',
    intro: 'Pense nas situações em que você mais se sente valorizado(a) por quem ama.',
    rank: { tit: 'Sua principal linguagem', n: 1 },
    eixos: [
      { id: 'pal', nome: 'Palavras de afirmação', d: 'Elogios e palavras sinceras.', perfil: 'Você se sente amado(a) quando o carinho vira palavra: elogios, mensagens, reconhecimento e frases sinceras. Dizer o que sente e ouvir isso do outro nutre o seu vínculo.' },
      { id: 'tem', nome: 'Tempo de qualidade', d: 'Atenção inteira e presença.', perfil: 'Para você, amor é presença: atenção inteira, sem pressa e sem distrações. Momentos compartilhados valem mais do que qualquer coisa material.' },
      { id: 'pre', nome: 'Presentes', d: 'Gestos simbólicos e lembranças.', perfil: 'Você valoriza o gesto simbólico: um presente pensado diz “lembrei de você”. O valor está na atenção e no significado, não no preço.' },
      { id: 'ato', nome: 'Atos de serviço', d: 'Cuidado que se vê em ações.', perfil: 'Você sente cuidado nas ações: quando alguém alivia sua carga, resolve algo ou faz sem você pedir. Para você, amor se prova no que se faz.' },
      { id: 'toq', nome: 'Toque físico', d: 'Abraço, colo e proximidade.', perfil: 'Seu corpo entende amor: abraço, colo, mão dada e proximidade acalmam e conectam. O contato físico carinhoso é o seu combustível afetivo.' },
    ],
    itens: [
      ['pal', 'Me sinto amado(a) quando ouço elogios e palavras de carinho.'],
      ['pal', 'Uma mensagem afetuosa vale muito para mim.'],
      ['pal', 'Palavras duras me marcam mais do que qualquer outra coisa.'],
      ['tem', 'Atenção total, sem celular, é a maior prova de carinho para mim.'],
      ['tem', 'Prefiro um momento a dois a qualquer presente.'],
      ['tem', 'Me sinto valorizado(a) quando fazem programas comigo.'],
      ['pre', 'Lembranças e presentes pensados para mim me emocionam.'],
      ['pre', 'Gosto de guardar objetos que simbolizam momentos especiais.'],
      ['pre', 'Esquecerem uma data importante me magoa.'],
      ['ato', 'Quando alguém me ajuda numa tarefa, sinto que se importa.'],
      ['ato', 'Prefiro ações a palavras.'],
      ['ato', 'Me sinto cuidado(a) quando alguém alivia minha carga.'],
      ['toq', 'Abraços, carinho e proximidade física me acalmam.'],
      ['toq', 'Sinto falta de contato físico quando estou longe de quem amo.'],
      ['toq', 'Um abraço apertado diz mais do que palavras.'],
    ],
    passo:
      'Compartilhe o resultado com quem você ama e pergunte qual é a linguagem dessa pessoa. Muita mágoa nasce de amar em uma “língua” que o outro não escuta.',
  },
  {
    id: 'necessidades',
    categoria: 'personalidade',
    escala: 'freq',
    modo: 'ranking',
    titulo: 'Necessidades Emocionais',
    tempo: '4 min',
    resumo: 'Quais necessidades do seu mundo emocional mais estão pedindo cuidado agora.',
    intro: 'Responda com que frequência cada frase descreve você nas últimas semanas.',
    rank: { tit: 'Necessidades que mais pedem cuidado', n: 2 },
    eixos: [
      { id: 'seg', nome: 'Segurança', d: 'Estabilidade e previsibilidade.', perfil: 'Segurança: estabilidade, previsibilidade e um chão firme. Pequenos passos que tragam previsibilidade (rotinas, reservas, combinados claros) tendem a acalmar.' },
      { id: 'per', nome: 'Pertencimento e afeto', d: 'Aceitação e proximidade.', perfil: 'Pertencimento e afeto: ser aceito(a) como você é e sentir proximidade. Vale cultivar vínculos onde você possa se mostrar de verdade.' },
      { id: 'rec', nome: 'Reconhecimento', d: 'Ser visto(a) e valorizado(a).', perfil: 'Reconhecimento: ser visto(a) e valorizado(a) pelo que faz e é. Pedir feedback e celebrar conquistas ajuda a nutrir isso.' },
      { id: 'aut', nome: 'Autonomia', d: 'Espaço para escolher e agir.', perfil: 'Autonomia: espaço para escolher e agir do seu jeito. Colocar limites e negociar combinados pode devolver esse espaço.' },
      { id: 'sen', nome: 'Sentido e propósito', d: 'Viver de acordo com o que importa.', perfil: 'Sentido e propósito: viver de acordo com o que importa. Reconectar-se com seus valores e escolher o que faz sentido costuma renovar a energia.' },
    ],
    itens: [
      ['seg', 'Sinto falta de estabilidade e previsibilidade na minha vida.'],
      ['seg', 'Me preocupo em ter o suficiente para ficar tranquilo(a) amanhã.'],
      ['seg', 'Sinto que não tenho um chão firme para me apoiar.'],
      ['per', 'Sinto falta de pessoas com quem eu possa ser eu mesmo(a).'],
      ['per', 'Me sinto sozinho(a) mesmo cercado(a) de gente.'],
      ['per', 'Sinto falta de carinho e proximidade.'],
      ['rec', 'Sinto que meu esforço não é visto.'],
      ['rec', 'Sinto falta de ouvir que fiz bem.'],
      ['rec', 'Preciso provar meu valor o tempo todo.'],
      ['aut', 'Sinto que decidem demais por mim.'],
      ['aut', 'Sinto falta de espaço para fazer as coisas do meu jeito.'],
      ['aut', 'Tenho dificuldade de impor limites.'],
      ['sen', 'Sinto que minha vida está no automático.'],
      ['sen', 'Sinto falta de um propósito que me mova.'],
      ['sen', 'Faço muito pelos outros e pouco pelo que importa para mim.'],
    ],
    passo:
      'Escolha uma necessidade e um gesto pequeno para esta semana. Cuidar do que está pedindo atenção costuma aliviar mais do que tentar resolver tudo de uma vez.',
  },
  {
    id: 'apego',
    categoria: 'personalidade',
    escala: 'freq',
    modo: 'apego',
    titulo: 'Estilos de Apego',
    tempo: '3 min',
    resumo: 'Como você lida com proximidade, distância e segurança nos vínculos.',
    intro: 'Pense em como você costuma se sentir nas relações mais próximas (amorosas, familiares ou de amizade).',
    eixos: [
      { id: 'ans', nome: 'Ansiedade de abandono', d: 'Medo de perder o vínculo e necessidade de confirmação.' },
      { id: 'evi', nome: 'Evitação da intimidade', d: 'Desconforto com proximidade e dependência.' },
    ],
    itens: [
      ['ans', 'Temo que as pessoas que amo se afastem de mim.'],
      ['ans', 'Preciso de muita confirmação de que sou importante para o outro.'],
      ['ans', 'Fico inquieto(a) quando demoram a responder uma mensagem importante.'],
      ['ans', 'Me preocupo em ser demais ou de menos para quem está comigo.'],
      ['ans', 'Sinto que dou mais do que recebo nas relações.'],
      ['evi', 'Me sinto desconfortável quando alguém quer ficar muito próximo.'],
      ['evi', 'Prefiro resolver meus problemas sozinho(a) a pedir ajuda.'],
      ['evi', 'Quando uma relação fica intensa, sinto vontade de me afastar.'],
      ['evi', 'Tenho dificuldade de falar abertamente sobre o que sinto.'],
      ['evi', 'Valorizo tanto minha independência que evito depender de alguém.'],
    ],
    perfil: (a, e) => {
      const altoA = a >= 50;
      const altoE = e >= 50;
      if (!altoA && !altoE)
        return { nome: 'Tendência ao apego seguro', txt: 'Você parece transitar com relativa tranquilidade entre proximidade e autonomia, confiando no vínculo sem se perder nele.' };
      if (altoA && !altoE)
        return { nome: 'Tendência ao apego ansioso', txt: 'Você valoriza muito a conexão e tende a ficar em alerta quando sente distância. Aprender a se acalmar sozinho(a) fortalece a segurança nas relações.' };
      if (!altoA && altoE)
        return { nome: 'Tendência ao apego evitativo', txt: 'Você preza a independência e pode se proteger afastando-se quando a intimidade cresce. Abrir espaço gradual para a vulnerabilidade costuma aproximar sem sufocar.' };
      return { nome: 'Tendência ao apego ambivalente', txt: 'Você deseja proximidade, mas também a teme. É um padrão que pode gerar sensação de vai-e-vem nas relações, e que se beneficia muito de um espaço terapêutico seguro.' };
    },
  },
  {
    id: 'inteligencia-emocional',
    categoria: 'habilidades',
    escala: 'conc',
    modo: 'pos',
    titulo: 'Inteligência Emocional',
    tempo: '4 min',
    tema: 'inteligência emocional',
    resumo: 'Como você percebe, regula e usa as emoções, suas e dos outros.',
    intro: 'Responda pensando em como você costuma agir, especialmente em momentos de tensão.',
    eixos: [
      { id: 'aut', nome: 'Autoconsciência', d: 'Perceber e nomear o que sente.' },
      { id: 'reg', nome: 'Autorregulação', d: 'Acalmar-se e pensar antes de reagir.' },
      { id: 'emp', nome: 'Empatia', d: 'Entender o outro e o clima emocional.' },
      { id: 'soc', nome: 'Habilidades sociais', d: 'Conduzir conflitos e vínculos.' },
    ],
    itens: [
      ['aut', 'Percebo minhas emoções no momento em que surgem.'],
      ['aut', 'Sei dizer o que estou sentindo e por quê.'],
      ['aut', 'Muitas vezes só entendo o que senti muito tempo depois.', 1],
      ['reg', 'Consigo me acalmar quando estou muito alterado(a).'],
      ['reg', 'Penso antes de reagir quando algo me irrita.'],
      ['reg', 'Decisões tomadas no calor da emoção me trazem arrependimento.', 1],
      ['emp', 'Consigo me colocar no lugar do outro.'],
      ['emp', 'Percebo o clima emocional de um ambiente.'],
      ['emp', 'Tenho dificuldade de entender por que as pessoas reagem como reagem.', 1],
      ['soc', 'Resolvo conflitos sem romper vínculos.'],
      ['soc', 'Sei pedir ajuda e oferecer apoio.'],
      ['soc', 'Fico sem saber como agir diante das emoções dos outros.', 1],
    ],
    rotulos: {
      baixo: 'Inteligência emocional em desenvolvimento',
      moderado: 'Inteligência emocional consistente',
      alto: 'Inteligência emocional bem desenvolvida',
    },
  },
  {
    id: 'habilidade-lideranca',
    categoria: 'habilidades',
    escala: 'conc',
    modo: 'pos',
    titulo: 'Habilidade de Liderança',
    tempo: '3 min',
    tema: 'habilidades de liderança',
    resumo: 'O quanto você já domina visão, comunicação, decisão e desenvolvimento de pessoas.',
    intro: 'Responda pensando em como você age quando precisa conduzir pessoas, mesmo informalmente.',
    eixos: [
      { id: 'vis', nome: 'Visão', d: 'Direção, prioridade e longo prazo.' },
      { id: 'com', nome: 'Comunicação', d: 'Escuta, clareza e feedback.' },
      { id: 'dec', nome: 'Decisão', d: 'Segurança e responsabilidade ao decidir.' },
      { id: 'pes', nome: 'Desenvolvimento de pessoas', d: 'Reconhecer, delegar e fazer crescer.' },
    ],
    itens: [
      ['vis', 'Consigo mostrar para onde estamos indo e por quê.'],
      ['vis', 'Penso a longo prazo, e não só no urgente.'],
      ['vis', 'Tenho dificuldade de definir prioridades para o grupo.', 1],
      ['com', 'Dou feedbacks claros, mesmo os difíceis.'],
      ['com', 'Escuto antes de decidir.'],
      ['com', 'Evito conversas difíceis com a equipe.', 1],
      ['dec', 'Decido com segurança, mesmo sem todas as informações.'],
      ['dec', 'Assumo a responsabilidade quando algo dá errado.'],
      ['dec', 'Adio decisões importantes por medo de errar.', 1],
      ['pes', 'Reconheço o esforço das pessoas.'],
      ['pes', 'Invisto no crescimento de quem trabalha comigo.'],
      ['pes', 'Prefiro fazer eu mesmo(a) a delegar.', 1],
    ],
    rotulos: { baixo: 'Liderança em construção', moderado: 'Liderança consistente', alto: 'Liderança de alta performance' },
  },
  {
    id: 'estilos-lideranca',
    categoria: 'habilidades',
    escala: 'conc',
    modo: 'ranking',
    titulo: 'Estilos de Liderança',
    tempo: '3 min',
    resumo: 'Qual é o seu jeito natural de conduzir pessoas e decisões.',
    intro: 'Responda pensando em como você age naturalmente ao liderar, e não no que seria o ideal.',
    rank: { tit: 'Seu estilo predominante', n: 1 },
    eixos: [
      { id: 'dir', nome: 'Diretivo', d: 'Clareza, ritmo e firmeza.', perfil: 'Diretivo: você traz clareza, ritmo e firmeza, especialmente em crises. Cuide para não sufocar a autonomia da equipe.' },
      { id: 'dem', nome: 'Democrático', d: 'Decisões construídas junto.', perfil: 'Democrático: você constrói decisões junto com o grupo, gerando engajamento. Cuide para não demorar demais quando é hora de decidir.' },
      { id: 'coa', nome: 'Coach', d: 'Desenvolvimento por perguntas e feedback.', perfil: 'Coach: você desenvolve pessoas com perguntas, feedback e paciência. Cuide para equilibrar desenvolvimento com resultados de curto prazo.' },
      { id: 'vis', nome: 'Visionário', d: 'Inspiração pelo propósito.', perfil: 'Visionário: você mobiliza pelo propósito e pelo futuro. Cuide para traduzir a visão em passos práticos.' },
      { id: 'del', nome: 'Delegador', d: 'Confiança e liberdade.', perfil: 'Delegador: você confia e dá liberdade. Funciona muito bem com equipes maduras; com equipes novas, acompanhe mais de perto.' },
    ],
    itens: [
      ['dir', 'Em uma crise, assumo o controle e digo o que deve ser feito.'],
      ['dir', 'Prefiro regras e processos claros.'],
      ['dir', 'Cobro resultados de perto.'],
      ['dem', 'Peço a opinião do grupo antes de decidir.'],
      ['dem', 'Acredito que a melhor decisão nasce do debate.'],
      ['dem', 'Gosto de construir consenso.'],
      ['coa', 'Gosto de ensinar e acompanhar o desenvolvimento de cada pessoa.'],
      ['coa', 'Faço perguntas em vez de dar respostas prontas.'],
      ['coa', 'Vejo erros como oportunidade de aprender.'],
      ['vis', 'Inspiro pelo propósito e pela visão de futuro.'],
      ['vis', 'Gosto de mobilizar as pessoas por uma causa.'],
      ['vis', 'Falo mais do porquê do que do como.'],
      ['del', 'Dou autonomia total a quem eu confio.'],
      ['del', 'Interfiro pouco no jeito de cada um trabalhar.'],
      ['del', 'Prefiro definir o objetivo e deixar o caminho aberto.'],
    ],
    passo:
      'Nenhum estilo é o melhor: o bom líder muda de estilo conforme a pessoa e o momento. Use o ranking para ver qual estilo você usa menos e pode ampliar.',
  },
  {
    id: 'persuasao',
    categoria: 'habilidades',
    escala: 'conc',
    modo: 'pos',
    titulo: 'Poder de Persuasão',
    tempo: '3 min',
    tema: 'persuasão',
    resumo: 'Sua capacidade de comunicar, ler o outro e conduzir pessoas até um acordo.',
    intro: 'Responda pensando em como você age em conversas importantes, no trabalho e fora dele.',
    eixos: [
      { id: 'com', nome: 'Comunicação clara', d: 'Explicar ideias com simplicidade.' },
      { id: 'lei', nome: 'Leitura do outro', d: 'Perceber o que motiva cada pessoa.' },
      { id: 'cre', nome: 'Credibilidade', d: 'Transmitir confiança e segurança.' },
      { id: 'arg', nome: 'Argumentação', d: 'Sustentar ideias e conduzir à decisão.' },
    ],
    itens: [
      ['com', 'Consigo explicar ideias complexas de forma simples.'],
      ['com', 'Adapto minha linguagem a quem está me ouvindo.'],
      ['com', 'Costumo me perder ao explicar o que penso.', 1],
      ['lei', 'Percebo rápido o que motiva cada pessoa.'],
      ['lei', 'Antes de propor algo, tento entender o que o outro precisa.'],
      ['lei', 'Muitas vezes falo sem notar como o outro está reagindo.', 1],
      ['cre', 'As pessoas costumam confiar no que digo.'],
      ['cre', 'Cumpro o que prometo, e isso me dá peso.'],
      ['cre', 'Tenho dificuldade de transmitir segurança ao falar.', 1],
      ['arg', 'Apresento argumentos com exemplos e dados.'],
      ['arg', 'Consigo conduzir uma conversa difícil até um acordo.'],
      ['arg', 'Desisto de defender uma ideia quando percebo resistência.', 1],
    ],
    rotulos: { baixo: 'Persuasão em desenvolvimento', moderado: 'Persuasão sólida', alto: 'Persuasão de alto impacto' },
  },
  {
    id: 'procrastinacao',
    categoria: 'habilidades',
    escala: 'freq',
    modo: 'nivel',
    titulo: 'Procrastinação',
    tempo: '4 min',
    tema: 'procrastinação',
    resumo: 'Entenda se o que te trava é começar, é o perfeccionismo ou o desconforto emocional.',
    intro: 'Pense em tarefas importantes que você costuma adiar, no trabalho ou na vida pessoal.',
    eixos: [
      { id: 'ini', nome: 'Dificuldade de começar', d: 'Espera pelo momento ideal e fuga da tarefa principal.' },
      { id: 'per', nome: 'Perfeccionismo', d: 'Exigência que paralisa antes de agir.' },
      { id: 'emo', nome: 'Fuga do desconforto', d: 'Alívio imediato para não sentir incômodo.' },
    ],
    itens: [
      ['ini', 'Fico esperando “o momento certo” para começar tarefas importantes.'],
      ['ini', 'Demoro a dar o primeiro passo mesmo sabendo exatamente o que fazer.'],
      ['ini', 'Deixo para a última hora e só então consigo agir.'],
      ['ini', 'Perco tempo com tarefas pequenas para não encarar a principal.'],
      ['per', 'Só começo quando tenho certeza de que vai ficar excelente.'],
      ['per', 'Refaço o mesmo trabalho várias vezes sem conseguir considerá-lo pronto.'],
      ['per', 'Tenho medo de entregar algo que mostre minhas imperfeições.'],
      ['per', 'Prefiro não fazer a fazer “mais ou menos”.'],
      ['emo', 'Quando uma tarefa me incomoda, busco alívio rápido (celular, redes, comida, séries).'],
      ['emo', 'Sinto culpa ou vergonha por adiar, e isso me trava ainda mais.'],
      ['emo', 'Evito tarefas que despertam ansiedade ou insegurança.'],
      ['emo', 'Me distraio justamente quando o assunto é importante ou difícil.'],
    ],
    leitura: {
      baixo: 'Você tem boa relação com iniciar e concluir. Observe apenas situações pontuais em que o adiamento aparece.',
      moderado: 'Existe um padrão de adiamento que cobra energia. Em geral ele protege de algum desconforto, e entender qual é costuma destravar.',
      alto: 'A trava está ocupando muito espaço. Procrastinar raramente é preguiça; costuma ser uma forma de se proteger de emoções difíceis. Isso pode ser trabalhado com acompanhamento.',
    },
  },
  {
    id: 'criatividade',
    categoria: 'habilidades',
    escala: 'freq',
    modo: 'pos',
    titulo: 'Criatividade',
    tempo: '3 min',
    tema: 'criatividade',
    resumo: 'Seu jeito criativo no dia a dia: imaginar possibilidades e transformá-las em algo real.',
    intro: 'Nesta atividade não existem respostas erradas: pense em como você costuma ser.',
    eixos: [
      { id: 'ima', nome: 'Imaginação no dia a dia', d: 'Ideias, curiosidade e liberdade para brincar com possibilidades.' },
      { id: 'aco', nome: 'Ação criativa', d: 'Transformar ideias em algo concreto e persistir.' },
    ],
    itens: [
      ['ima', 'Tenho muitas ideias diferentes ao mesmo tempo.'],
      ['ima', 'Gosto de olhar um problema por ângulos pouco usuais.'],
      ['ima', 'Me divirto combinando coisas que não parecem combinar.'],
      ['ima', 'Tenho dificuldade de pensar fora do padrão.', 1],
      ['aco', 'Costumo transformar minhas ideias em projetos reais.'],
      ['aco', 'Insisto em uma ideia mesmo quando a primeira tentativa não dá certo.'],
      ['aco', 'Tenho medo de que minhas ideias pareçam bobas.', 1],
      ['aco', 'Crio soluções práticas para problemas do dia a dia.'],
    ],
    rotulos: { baixo: 'Potencial criativo a ser explorado', moderado: 'Criatividade em movimento', alto: 'Criatividade ativa e fluida' },
    leitura: {
      baixo: 'Hoje suas ideias fluem pouco, ou você sente pouco espaço para criar. A criatividade responde bem a pausas, variedade e ambientes sem julgamento.',
      moderado: 'Você tem repertório criativo e pontos em que pode soltar mais. Praticar ideias sem filtro costuma ampliar a fluência.',
      alto: 'Você gera ideias com facilidade e tem disposição para realizá-las. Vale proteger tempo e espaço para continuar criando.',
    },
  },
  {
    id: 'bem-estar',
    categoria: 'bemestar',
    escala: 'freq',
    modo: 'pos',
    titulo: 'Bem-Estar Psicológico',
    tempo: '3 min',
    tema: 'bem-estar',
    resumo: 'Um retrato de como estão sua satisfação, seus vínculos, seu propósito e seu autocuidado.',
    intro: 'Pense em como você tem se sentido nas últimas semanas.',
    eixos: [
      { id: 'sat', nome: 'Satisfação com a vida', d: 'Disposição e contentamento com o momento atual.' },
      { id: 'rel', nome: 'Relações', d: 'Sentir-se acolhido(a) e conectado(a).' },
      { id: 'pro', nome: 'Propósito', d: 'Sentido, metas e direção.' },
      { id: 'aut', nome: 'Autocuidado e autoaceitação', d: 'Descanso e gentileza consigo mesmo(a).' },
    ],
    itens: [
      ['sat', 'Me sinto satisfeito(a) com a minha vida hoje.'],
      ['sat', 'Acordo com disposição para o dia.'],
      ['sat', 'Sinto que as coisas dão errado na maior parte do tempo.', 1],
      ['rel', 'Tenho pessoas em quem posso confiar.'],
      ['rel', 'Me sinto acolhido(a) por quem está perto.'],
      ['rel', 'Me sinto isolado(a) dos outros.', 1],
      ['pro', 'Sinto que o que faço tem sentido.'],
      ['pro', 'Tenho metas que me motivam.'],
      ['pro', 'Sinto que vivo sem direção.', 1],
      ['aut', 'Reservo tempo para descansar e cuidar de mim.'],
      ['aut', 'Aceito a mim mesmo(a) com minhas imperfeições.'],
      ['aut', 'Me trato com dureza quando erro.', 1],
    ],
    rotulos: { baixo: 'Bem-estar em baixa neste momento', moderado: 'Bem-estar em equilíbrio parcial', alto: 'Bem-estar em alta' },
  },
  {
    id: 'ansiedade',
    categoria: 'saude',
    escala: 'freq',
    modo: 'nivel',
    cuidado: true,
    titulo: 'Ansiedade Normal x Patológica',
    tempo: '4 min',
    tema: 'ansiedade',
    resumo: 'Ajuda a distinguir a ansiedade esperada do dia a dia de uma ansiedade intensa que merece cuidado.',
    intro: 'Pense nas últimas semanas, em situações do seu cotidiano.',
    eixos: [
      { id: 'pre', nome: 'Preocupação', d: 'Pensamentos antecipatórios difíceis de controlar.' },
      { id: 'fis', nome: 'Sintomas físicos', d: 'Coração, respiração, tensão e sono.' },
      { id: 'pan', nome: 'Pânico e evitação', d: 'Crises de medo e fuga de situações.' },
      { id: 'imp', nome: 'Impacto e proporção', d: 'Quanto atrapalha e se é desproporcional.' },
    ],
    itens: [
      ['pre', 'Me preocupo demais com várias coisas ao mesmo tempo.'],
      ['pre', 'Tenho dificuldade de controlar a preocupação.'],
      ['pre', 'Fico antecipando o pior mesmo sem sinais concretos.'],
      ['fis', 'Sinto o coração disparado, falta de ar ou aperto no peito.'],
      ['fis', 'Tenho tensão muscular, tremores ou um nó no estômago.'],
      ['fis', 'Tenho dificuldade de relaxar ou de dormir por causa da mente acelerada.'],
      ['pan', 'Já tive crises súbitas de medo intenso.'],
      ['pan', 'Evito lugares ou situações por medo de passar mal.'],
      ['pan', 'Tenho medo de ser julgado(a) em situações sociais.'],
      ['imp', 'A ansiedade atrapalha meu trabalho ou meus estudos.'],
      ['imp', 'A ansiedade afeta meus relacionamentos.'],
      ['imp', 'Sinto que minha ansiedade é desproporcional à situação real.'],
    ],
    extra: () =>
      'Ansiedade é uma emoção normal e útil: ela prepara você para desafios. Ela passa a merecer cuidado quando fica intensa, frequente, desproporcional à situação e atrapalha a vida. Veja especialmente o eixo de impacto e proporção.',
  },
];

export const testePorId = (id: string) => TESTES.find((t) => t.id === id);

// ---------------- Motor de cálculo (mesma regra do portal) ----------------
export const nivel = (p: number): Nivel => (p < 34 ? 'baixo' : p < 67 ? 'moderado' : 'alto');

export function calcular(t: Teste, resp: Record<number, number>): ResultadoEixo[] {
  const acc: Record<string, { s: number; n: number }> = {};
  t.eixos.forEach((e) => (acc[e.id] = { s: 0, n: 0 }));
  t.itens.forEach((it, i) => {
    const v = it[2] ? 4 - resp[i] : resp[i];
    acc[it[0]].s += v;
    acc[it[0]].n++;
  });
  return t.eixos.map((e) => ({ id: e.id, nome: e.nome, d: e.d, pct: Math.round((acc[e.id].s / (acc[e.id].n * 4)) * 100) }));
}

function leituraGenerica(modo: Modo, tema: string, n: Nivel) {
  if (modo === 'pos') {
    return {
      baixo: `Seu resultado sugere bastante espaço de desenvolvimento em ${tema}. É um ponto de partida, e não um rótulo.`,
      moderado: `Você tem uma base em ${tema} e pontos específicos para fortalecer. Veja os eixos abaixo para escolher por onde começar.`,
      alto: `Seu resultado indica boa força em ${tema}. Vale manter essa base e usá-la a seu favor.`,
    }[n];
  }
  return {
    baixo: `Poucos sinais de ${tema} apareceram nas suas respostas.`,
    moderado: `Alguns sinais de ${tema} estão presentes e merecem atenção. Não é um diagnóstico, mas é um bom motivo para olhar com cuidado.`,
    alto: `Muitos sinais de ${tema} apareceram nas suas respostas. Isso não é um diagnóstico, mas indica que vale buscar apoio profissional.`,
  }[n];
}

const PASSOS = {
  nivel: {
    baixo: 'Continue cuidando do que já funciona. Se quiser aprofundar, conversar com um psicólogo pode trazer ainda mais clareza.',
    moderado: 'Pequenos ajustes de rotina e um espaço para se escutar costumam fazer muita diferença. A trilha do app pode ajudar.',
    alto: 'Vale conversar com um profissional. Este resultado não é um diagnóstico, mas indica que você merece apoio neste momento.',
  },
  pos: {
    baixo: 'Há bastante espaço para crescer aqui. Escolha o eixo mais baixo e pratique um pequeno passo por semana.',
    moderado: 'Você tem uma boa base. Escolha o eixo mais baixo e treine uma pequena prática por semana.',
    alto: 'Você tem uma base sólida. Use esses pontos fortes a seu favor e continue desenvolvendo o que ainda pode crescer.',
  },
  neutro: 'Traços não são certos nem errados: são tendências. Use este retrato para se conhecer melhor e para conversar sobre como elas aparecem na sua vida.',
  apego: 'Estilos de apego não são destino: podem se transformar com experiências seguras e com terapia. Use este retrato como ponto de partida de conversa.',
  ranking: 'Use este retrato como ponto de partida para se conhecer melhor e conversar com quem convive com você.',
};

export type Resultado = {
  teste_id: string;
  modo: Modo;
  geral: number;
  nivel: Nivel;
  titulo: string;
  leitura: string;
  passo: string;
  extra: string;
  mostrarGeral: boolean;
  cuidado?: boolean;
  eixos: ResultadoEixo[];
};

export function montarResultado(t: Teste, eixos: ResultadoEixo[]): Resultado {
  const geral = Math.round(eixos.reduce((a, e) => a + e.pct, 0) / eixos.length);
  const ng = nivel(geral);
  let titulo: string;
  let leitura: string;
  let mostrarGeral = true;
  let lista = [...eixos];
  if (t.modo === 'apego' && t.perfil) {
    const p = t.perfil(eixos[0].pct, eixos[1].pct);
    titulo = p.nome;
    leitura = p.txt;
    mostrarGeral = false;
  } else if (t.modo === 'ranking' && t.rank) {
    lista.sort((a, b) => b.pct - a.pct);
    const tops = lista.slice(0, t.rank.n);
    const nomes = tops.map((e) => e.nome);
    titulo = `${t.rank.tit}: ${nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0]}`;
    leitura = tops.map((e) => t.eixos.find((x) => x.id === e.id)?.perfil ?? '').join(' ');
    mostrarGeral = false;
  } else {
    const lb = t.modo === 'nivel' ? { baixo: 'Baixo', moderado: 'Moderado', alto: 'Elevado' } : { baixo: 'Baixo', moderado: 'Médio', alto: 'Alto' };
    titulo = t.rotulos ? t.rotulos[ng] : t.modo === 'pos' ? `Nível de ${t.tema}: ${lb[ng]}` : `Sinais de ${t.tema}: ${lb[ng]}`;
    leitura = t.leitura ? t.leitura[ng] : leituraGenerica(t.modo, t.tema ?? '', ng);
  }
  const passo =
    t.modo === 'nivel' || t.modo === 'pos' ? PASSOS[t.modo][ng] : t.passo ?? PASSOS[t.modo as 'neutro' | 'apego' | 'ranking'];
  return {
    teste_id: t.id,
    modo: t.modo,
    geral,
    nivel: ng,
    titulo,
    leitura,
    passo,
    extra: t.extra ? t.extra(eixos) : '',
    mostrarGeral,
    cuidado: !!t.cuidado,
    eixos: lista,
  };
}
