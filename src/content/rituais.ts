/**
 * Rituais diários: Norte da manhã e Fechamento da noite.
 * Dois momentos curtos (até 2 minutos), um no começo e outro no fim do dia.
 * Texto próprio do GovernaMente. Edite aqui para mudar o que aparece no app.
 */

export type Periodo = 'manha' | 'noite';

export const HUMOR: { valor: number; nome: string; cor: string }[] = [
  { valor: 1, nome: 'Pesado', cor: '#7A5A3A' },
  { valor: 2, nome: 'Cansado', cor: '#9A7B5A' },
  { valor: 3, nome: 'Neutro', cor: '#A7B8A0' },
  { valor: 4, nome: 'Disposto', cor: '#6E8A69' },
  { valor: 5, nome: 'Leve', cor: '#1E3A39' },
];
export const nomeHumor = (v?: number | null) => HUMOR.find((h) => h.valor === v)?.nome ?? '';

/** Uma pergunta por dia do ano: a manhã abre com ela. Muda todo dia. */
export const PERGUNTAS: string[] = [
  'O que é importante para mim hoje, e não só urgente?',
  'Qual conversa de hoje merece a minha melhor versão?',
  'Onde eu costumo perder a calma, e como quero atravessar isso hoje?',
  'O que eu posso deixar de carregar sozinho hoje?',
  'Qual pequena promessa a mim mesmo eu vou cumprir hoje?',
  'Que emoção tem me acompanhado nestes dias? O que ela quer me dizer?',
  'Qual decisão eu vou tomar com calma, e não no impulso?',
  'Quem da minha equipe ou da minha casa precisa ser ouvido hoje?',
  'O que seria um dia bom, mesmo que nem tudo saia como planejei?',
  'Qual tarefa importante eu venho adiando? Qual é o primeiro passo dela?',
  'Em que momento de hoje vou fazer uma pausa de verdade?',
  'Qual pensamento automático costuma me sabotar? Como vou responder a ele?',
  'O que eu valorizo, e como isso vai aparecer na minha agenda de hoje?',
  'Do que eu preciso hoje para chegar inteiro ao fim do dia?',
  'Qual é o passo possível, e não o perfeito, para hoje?',
  'Quem eu posso reconhecer hoje por um esforço que fez?',
  'O que eu vou responder só depois de respirar?',
  'Que limite eu preciso proteger hoje?',
  'O que me deixaria orgulhoso ao deitar esta noite?',
  'Onde estou exigindo de mim mais do que exigiria de alguém que amo?',
  'Qual distração eu vou deixar fora do caminho hoje?',
  'Que conversa difícil eu posso conduzir com calma?',
  'O que eu posso simplificar hoje?',
  'Que hábito pequeno vai me sustentar hoje?',
  'Se a ansiedade aparecer, qual será o meu primeiro gesto?',
  'O que eu aprendi ontem que quero levar para hoje?',
  'Como eu quero que as pessoas se sintam depois de falar comigo hoje?',
  'Qual é o meu norte hoje, em uma frase?',
  'Que parte do meu dia pode ser feita sem pressa?',
  'O que eu posso agradecer antes mesmo de o dia começar?',
];

export function perguntaDoDia(data = new Date()) {
  const inicio = new Date(data.getFullYear(), 0, 0);
  const diaDoAno = Math.floor((data.getTime() - inicio.getTime()) / 864e5);
  return PERGUNTAS[diaDoAno % PERGUNTAS.length];
}

/** Frases curtas para fechar o dia (uma diferente a cada dia). */
export const FRASES_NOITE: string[] = [
  'Constância imperfeita vale mais do que perfeição por uma semana.',
  'Você não controla o mar. Hoje você conduziu o leme do jeito que deu.',
  'Descansar também é parte do método.',
  'Dar nome ao que sente já diminui a força do que sente.',
  'Amanhã tem outro passo possível. Hoje, basta ter chegado até aqui.',
  'A emoção pode chegar. Ela só não precisa dirigir.',
  'Pequenos passos repetidos viram caminho.',
];
export const fraseDaNoite = (data = new Date()) => FRASES_NOITE[data.getDate() % FRASES_NOITE.length];

/** Marcos da sequência de dias de bordo (dias seguidos com pelo menos um ritual). */
export const SELOS: { dias: number; nome: string; texto: string }[] = [
  { dias: 3, nome: 'Primeira amarra', texto: 'Três dias seguidos. O começo de todo hábito.' },
  { dias: 7, nome: 'Uma semana no leme', texto: 'Sete dias conduzindo o começo e o fim do dia.' },
  { dias: 14, nome: 'Duas marés', texto: 'Duas semanas. O ritual já começa a fazer parte de você.' },
  { dias: 21, nome: 'Hábito ancorado', texto: 'Vinte e um dias. O hábito tem âncora.' },
  { dias: 30, nome: 'Um mês de travessia', texto: 'Um mês inteiro de rituais. Olhe para trás e veja o caminho.' },
  { dias: 60, nome: 'Mar aberto', texto: 'Dois meses. Você já navega com mais calma.' },
  { dias: 90, nome: 'Timoneiro', texto: 'Noventa dias. Governar a mente virou jeito de viver.' },
];
export const proximoSelo = (seq: number) => SELOS.find((s) => s.dias > seq);
export const seloDoDia = (seq: number) => SELOS.find((s) => s.dias === seq);

/** Textos das notificações: uma por dia da semana (1 = domingo), para não cansar. */
export const AVISOS_MANHA: { titulo: string; corpo: string }[] = [
  { titulo: 'Seu norte de domingo', corpo: 'Um minuto para começar o dia com calma. A pergunta de hoje te espera.' },
  { titulo: 'Bom dia. Qual é o passo possível?', corpo: 'Norte da manhã: humor, três respirações e a sua intenção do dia.' },
  { titulo: 'Antes do celular te puxar', corpo: 'Comece pelo seu norte. Leva menos de 2 minutos.' },
  { titulo: 'A pergunta de hoje chegou', corpo: 'Abra o Norte da manhã e escolha o seu passo possível.' },
  { titulo: 'Bom dia. Como você acordou?', corpo: 'Dar nome ao que sente logo cedo muda o resto do dia.' },
  { titulo: 'Seu norte de sexta', corpo: 'Um passo possível para fechar bem a semana.' },
  { titulo: 'Sábado também tem norte', corpo: 'Um minuto para escolher como você quer viver o dia.' },
];
export const AVISOS_NOITE: { titulo: string; corpo: string }[] = [
  { titulo: 'Feche a semana com calma', corpo: 'Como foi o seu domingo? Fechamento do dia em 1 minuto.' },
  { titulo: 'Como foi o seu dia?', corpo: 'Veja se cumpriu o passo possível e anote uma coisa boa.' },
  { titulo: 'Hora de baixar a âncora', corpo: 'Fechamento do dia: um minuto para olhar o que deu certo.' },
  { titulo: 'Uma coisa boa de hoje', corpo: 'Antes de dormir, anote uma. Ela volta para você amanhã de manhã.' },
  { titulo: 'Seu dia merece um fechamento', corpo: 'Como você começou e como está terminando?' },
  { titulo: 'Sexta-feira: feche a semana', corpo: 'Um minuto para reconhecer o que você atravessou.' },
  { titulo: 'Fechamento de sábado', corpo: 'Descansar também é parte do método. Como foi o dia?' },
];
