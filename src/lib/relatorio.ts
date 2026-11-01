/**
 * Relatório "Sua travessia até aqui": o que a pessoa já construiu no app e o que ainda está à espera.
 * Aparece no fim do teste grátis (tela de assinatura) e na tela /travessia.
 */
import { listarCheckins, listarConcluidas, listarDiario } from './dados';
import { listarDetox, listarTempoTela, pontoDePartida, variacao } from './detox';
import { lerConstancia, listarGratidao } from './ferramentas';
import { listarResultados } from './ecossistema';
import { listarAulas } from './admin';
import { estadoRituais, listarRituais } from './rituais';
import { TRILHA } from '@/content/trilha';
import { TESTES } from '@/content/testes';
import { proximoSelo, SELOS } from '@/content/rituais';

export type Conquista = { numero: string; texto: string };
export type Espera = { titulo: string; texto: string };
export type Relatorio = { diasDeUso: number; conquistas: Conquista[]; espera: Espera[] };

const seguro = <T,>(p: Promise<T>, padrao: T) => p.catch(() => padrao);
const diaDe = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

export async function montarRelatorio(): Promise<Relatorio> {
  const [diario, checkins, concluidas, detox, tempos, gratidao, constancia, resultados, aulas, rituais] = await Promise.all([
    seguro(listarDiario(), []),
    seguro(listarCheckins(), []),
    seguro(listarConcluidas(), []),
    seguro(listarDetox(), []),
    seguro(listarTempoTela(), []),
    seguro(listarGratidao(), []),
    seguro(lerConstancia(), { plano: null, dias: [] as string[] }),
    seguro(listarResultados(), []),
    seguro(listarAulas(), []),
    seguro(listarRituais(), []),
  ]);

  const dias = new Set<string>([
    ...diario.map((r) => diaDe(r.criado_em)),
    ...checkins.map((r) => diaDe(r.criado_em)),
    ...detox.map((r) => diaDe(r.concluido_em)),
    ...tempos.map((t) => t.dia),
    ...gratidao.map((g) => g.dia),
    ...constancia.dias,
    ...rituais.map((r) => r.dia),
    ...resultados.map((r) => diaDe(r.criado_em)),
  ]);

  const c: Conquista[] = [];
  const er = estadoRituais(rituais);
  if (rituais.length)
    c.push({
      numero: String(rituais.length),
      texto: `${plural(rituais.length, 'ritual', 'rituais')} de manhã e de noite${er.recorde > 1 ? `, com sequência de até ${er.recorde} dias` : ''}`,
    });
  const selos = SELOS.filter((s) => s.dias <= er.recorde);
  if (selos.length) c.push({ numero: String(selos.length), texto: `${plural(selos.length, 'selo conquistado', 'selos conquistados')}: ${selos.map((s) => s.nome).join(', ')}` });
  if (diario.length) {
    const emocoes = new Set(diario.flatMap((r) => r.emocoes));
    c.push({
      numero: String(diario.length),
      texto: `${plural(diario.length, 'registro', 'registros')} no Diário das Emoções, dando nome a ${emocoes.size} ${plural(emocoes.size, 'emoção', 'emoções diferentes')}`,
    });
  }
  if (concluidas.length) c.push({ numero: `${concluidas.length}/${TRILHA.length}`, texto: 'estações da trilha do método concluídas' });
  if (detox.length) c.push({ numero: `${detox.length}/5`, texto: 'dias do Detox Digital feitos' });
  const base = pontoDePartida(tempos, detox);
  const ultimo = [...tempos].sort((a, b) => b.dia.localeCompare(a.dia))[0];
  const v = base && ultimo && base.dia !== ultimo.dia ? variacao(base.minutos, ultimo.minutos) : null;
  if (v !== null && v < 0) c.push({ numero: `−${Math.abs(v)}%`, texto: 'de tempo de tela desde o seu ponto de partida' });
  const itensGratidao = gratidao.reduce((a, g) => a + g.itens.length, 0);
  if (itensGratidao) c.push({ numero: String(itensGratidao), texto: `${plural(itensGratidao, 'gratidão anotada', 'gratidões anotadas')}` });
  if (checkins.length) c.push({ numero: String(checkins.length), texto: `${plural(checkins.length, 'check-in da semana', 'check-ins da semana')}` });
  const testesFeitos = new Set(resultados.map((r) => r.teste_id));
  if (testesFeitos.size) c.push({ numero: String(testesFeitos.size), texto: `${plural(testesFeitos.size, 'teste de autoconhecimento feito', 'testes de autoconhecimento feitos')}` });
  if (constancia.dias.length) c.push({ numero: String(constancia.dias.length), texto: `${plural(constancia.dias.length, 'dia', 'dias')} do seu plano de constância cumpridos` });

  const e: Espera[] = [];
  const restantes = TRILHA.filter((x) => !concluidas.includes(x.id));
  if (restantes.length)
    e.push({
      titulo: `${restantes.length} ${plural(restantes.length, 'estação', 'estações')} da trilha`,
      texto: `A próxima é “${restantes[0].titulo}”. A trilha inteira percorre o método C.A.I.A. do livro.`,
    });
  const aulasComVideo = aulas.filter((a) => a.tem_video).length || aulas.length;
  e.push({
    titulo: aulasComVideo ? `${aulasComVideo} ${plural(aulasComVideo, 'aula em vídeo', 'aulas em vídeo')}` : 'Aulas em vídeo',
    texto: 'Explicação, demonstração e exemplos práticos de cada pilar, com o psicólogo Rodrigo Ferreira.',
  });
  if (detox.length < 5)
    e.push({ titulo: `${5 - detox.length} ${plural(5 - detox.length, 'dia', 'dias')} do Detox Digital`, texto: 'Para terminar de tirar o celular do piloto automático.' });
  const prox = proximoSelo(er.sequencia);
  if (prox) e.push({ titulo: `Selo “${prox.nome}”`, texto: `Com ${prox.dias} dias seguidos de rituais. ${prox.texto}` });
  if (rituais.filter((r) => r.periodo === 'noite').length < 5)
    e.push({ titulo: 'As leituras do seu padrão', texto: 'Com mais alguns fechamentos do dia, o app mostra o que deixa os seus dias mais leves.' });
  const faltamTestes = TESTES.length - testesFeitos.size;
  if (faltamTestes > 0)
    e.push({ titulo: `${faltamTestes} ${plural(faltamTestes, 'teste', 'testes')} de autoconhecimento`, texto: 'Inclui os 12 Arquétipos, estilos de liderança e inteligência emocional.' });
  if (checkins.length < 4)
    e.push({ titulo: 'Sua curva de evolução', texto: 'Com algumas semanas de check-in, os gráficos mostram como você está mudando.' });

  return { diasDeUso: dias.size, conquistas: c, espera: e };
}
