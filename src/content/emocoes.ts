/** Roda das Emoções (base: modelo de Robert Plutchik) com sugestões de condução. */
export type Emocao = {
  id: string;
  nome: string;
  cor: string;
  intensidades: [string, string, string]; // leve, básica, intensa
  funcao: string;
  conduzir: string;
};

export const EMOCOES: Emocao[] = [
  {
    id: 'alegria',
    nome: 'Alegria',
    cor: '#E2B33C',
    intensidades: ['Serenidade', 'Alegria', 'Êxtase'],
    funcao: 'Sinaliza que algo importante para você está indo bem e convida a repetir.',
    conduzir: 'Registre o que gerou essa alegria. Saber de onde ela vem ajuda a cultivá-la nos dias difíceis.',
  },
  {
    id: 'confianca',
    nome: 'Confiança',
    cor: '#A7B8A0',
    intensidades: ['Aceitação', 'Confiança', 'Admiração'],
    funcao: 'Aproxima pessoas e permite cooperar.',
    conduzir: 'Confiança cresce com coerência. Combine algo pequeno e cumpra.',
  },
  {
    id: 'medo',
    nome: 'Medo',
    cor: '#4E6B66',
    intensidades: ['Apreensão', 'Medo', 'Terror'],
    funcao: 'Protege diante de um risco, real ou imaginado.',
    conduzir: 'Pergunte: qual é o risco real? Separe o fato do "e se". Respire 4–6 antes de decidir.',
  },
  {
    id: 'surpresa',
    nome: 'Surpresa',
    cor: '#6FA3A6',
    intensidades: ['Distração', 'Surpresa', 'Espanto'],
    funcao: 'Interrompe o automático e chama a atenção para o novo.',
    conduzir: 'Dê alguns segundos antes de reagir. Nem toda novidade pede resposta imediata.',
  },
  {
    id: 'tristeza',
    nome: 'Tristeza',
    cor: '#5C7A9A',
    intensidades: ['Melancolia', 'Tristeza', 'Pesar'],
    funcao: 'Ajuda a elaborar perdas e pede recolhimento e apoio.',
    conduzir: 'Permita-se desacelerar e conte para alguém de confiança como você está.',
  },
  {
    id: 'aversao',
    nome: 'Aversão',
    cor: '#7C8A4E',
    intensidades: ['Tédio', 'Aversão', 'Repulsa'],
    funcao: 'Afasta do que parece nocivo ou contrário aos seus valores.',
    conduzir: 'Nomeie qual valor seu foi tocado. Isso orienta um limite claro e respeitoso.',
  },
  {
    id: 'raiva',
    nome: 'Raiva',
    cor: '#B5523B',
    intensidades: ['Irritação', 'Raiva', 'Fúria'],
    funcao: 'Sinaliza injustiça ou limite ultrapassado e mobiliza energia.',
    conduzir: 'Dez respirações antes de responder. Depois, fale do fato e do limite, não da pessoa.',
  },
  {
    id: 'antecipacao',
    nome: 'Antecipação',
    cor: '#D9962F',
    intensidades: ['Interesse', 'Antecipação', 'Vigilância'],
    funcao: 'Prepara para o que vem e ajuda a planejar.',
    conduzir: 'Transforme a antecipação em um próximo passo concreto, e solte o resto.',
  },
];

/** Lista plana para escolha rápida no diário. */
export const SENTIMENTOS = Array.from(new Set(EMOCOES.flatMap((e) => e.intensidades))).concat([
  'Ansiedade',
  'Culpa',
  'Vergonha',
  'Cansaço',
  'Gratidão',
  'Alívio',
  'Frustração',
  'Solidão',
]);
