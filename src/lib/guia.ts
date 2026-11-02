/** Voz guiada e sons do Respiro 4-4-8 e da meditação. */
import * as Speech from 'expo-speech';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { gravarLocal, lerLocal } from './dados';
import type { Fala } from '@/content/guias';

export type PrefsGuia = { voz: boolean; sons: boolean };
const PADRAO: PrefsGuia = { voz: true, sons: true };

export const lerPrefsGuia = () => lerLocal<PrefsGuia>('guia-prefs', PADRAO);
export const salvarPrefsGuia = (p: PrefsGuia) => gravarLocal('guia-prefs', p);

const SONS = {
  sino: require('../../assets/sons/sino.wav'),
  inspirar: require('../../assets/sons/inspirar.wav'),
  soltar: require('../../assets/sons/soltar.wav'),
};
export type Som = keyof typeof SONS;

/**
 * Gravações na voz do Rodrigo, por id da fala (ver src/content/guias.ts).
 * Exemplo: 'respiro-inspire': require('../../assets/voz/respiro-inspire.m4a'),
 */
const GRAVACOES: Record<string, number> = {
  'respiro448-abertura': require('../../assets/voz/respiro448-abertura.m4a'),
  'respiro448-inspire': require('../../assets/voz/respiro448-inspire.m4a'),
  'respiro448-segure': require('../../assets/voz/respiro448-segure.m4a'),
  'respiro448-solte': require('../../assets/voz/respiro448-solte.m4a'),
  'respiro448-lembrete-maos': require('../../assets/voz/respiro448-lembrete-maos.m4a'),
  'respiro448-lembrete-vela': require('../../assets/voz/respiro448-lembrete-vela.m4a'),
  'respiro448-lembrete-ombros': require('../../assets/voz/respiro448-lembrete-ombros.m4a'),
  'respiro448-fechamento': require('../../assets/voz/respiro448-fechamento.m4a'),
  // Meditação guiada (frases iguais nas três durações usam o mesmo áudio).
  'med3-01': require('../../assets/voz/med3-01.m4a'),
  'med3-02': require('../../assets/voz/med3-02.m4a'),
  'med3-03': require('../../assets/voz/med3-03.m4a'),
  'med3-04': require('../../assets/voz/med3-04.m4a'),
  'med3-05': require('../../assets/voz/med-lago.m4a'),
  'med3-06': require('../../assets/voz/med3-06.m4a'),
  'med5-01': require('../../assets/voz/med5-01.m4a'),
  'med5-02': require('../../assets/voz/med5-02.m4a'),
  'med5-03': require('../../assets/voz/med5-03.m4a'),
  'med5-04': require('../../assets/voz/med5-04.m4a'),
  'med5-05': require('../../assets/voz/med5-05.m4a'),
  'med5-06': require('../../assets/voz/med-lago.m4a'),
  'med5-07': require('../../assets/voz/med5-07.m4a'),
  'med5-08': require('../../assets/voz/med5-08.m4a'),
  'med10-01': require('../../assets/voz/med10-01.m4a'),
  'med10-02': require('../../assets/voz/med3-02.m4a'),
  'med10-03': require('../../assets/voz/med5-03.m4a'),
  'med10-04': require('../../assets/voz/med10-04.m4a'),
  'med10-05': require('../../assets/voz/med10-05.m4a'),
  'med10-06': require('../../assets/voz/med10-06.m4a'),
  'med10-07': require('../../assets/voz/med10-07.m4a'),
  'med10-08': require('../../assets/voz/med-lago.m4a'),
  'med10-09': require('../../assets/voz/med10-09.m4a'),
  'med10-10': require('../../assets/voz/med10-10.m4a'),
  'med10-11': require('../../assets/voz/med10-11.m4a'),
  'med-fim': require('../../assets/voz/med-fim.m4a'),
};

/** Não deixa uma chamada do sistema travar a prática: desiste depois de `ms`. */
function comLimite<T>(p: Promise<T>, ms: number, padrao: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(padrao), ms))]);
}

let modoPronto = false;
async function prepararAudio() {
  if (modoPronto) return;
  modoPronto = true;
  try {
    // Toca mesmo com o iPhone no silencioso e não interrompe a música de quem estiver ouvindo.
    await comLimite(setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }), 1500, undefined);
  } catch {
    // segue sem o modo especial
  }
}

const players: Partial<Record<string, AudioPlayer>> = {};
function player(chave: string, fonte: number) {
  if (!players[chave]) players[chave] = createAudioPlayer(fonte);
  return players[chave]!;
}

export async function tocar(som: Som, volume = 0.7) {
  await prepararAudio();
  try {
    const p = player(som, SONS[som]);
    p.volume = volume;
    await p.seekTo(0);
    p.play();
  } catch {
    // som é um extra: se falhar, a prática continua
  }
}

let vozEscolhida: string | undefined | null = null;
async function escolherVoz() {
  if (vozEscolhida !== null) return vozEscolhida;
  try {
    const vozes = await comLimite(Speech.getAvailableVoicesAsync(), 1500, [] as Speech.Voice[]);
    const pt = vozes.filter((v) => v.language?.toLowerCase().replace('_', '-').startsWith('pt'));
    const br = pt.filter((v) => v.language.toLowerCase().replace('_', '-') === 'pt-br');
    const lista = br.length ? br : pt;
    const melhor = lista.find((v) => v.quality === 'Enhanced') ?? lista[0];
    if (vozes.length) vozEscolhida = melhor?.identifier;
    return melhor?.identifier;
  } catch {
    vozEscolhida = undefined;
  }
  return vozEscolhida;
}

/** Fala um trecho: usa a gravação do Rodrigo se existir; senão, a voz do aparelho. */
export async function falar(f: Fala, aoTerminar?: () => void) {
  await prepararAudio();
  const gravacao = GRAVACOES[f.id];
  if (gravacao) {
    try {
      const p = player(`voz:${f.id}`, gravacao);
      await p.seekTo(0);
      p.play();
      if (aoTerminar) {
        const sub = p.addListener('playbackStatusUpdate', (s) => {
          if (s.didJustFinish) {
            sub.remove();
            aoTerminar();
          }
        });
      }
      return;
    } catch {
      // cai para a voz do aparelho
    }
  }
  const voice = await escolherVoz();
  Speech.speak(f.texto, {
    language: 'pt-BR',
    voice: voice ?? undefined,
    rate: 0.88,
    pitch: 0.96,
    onDone: aoTerminar,
    onStopped: undefined,
    onError: aoTerminar ? () => aoTerminar() : undefined,
  });
}

/** Para toda fala e som em andamento (ao sair da tela ou ao tocar em Parar). */
export function silenciar() {
  Speech.stop().catch(() => {});
  Object.entries(players).forEach(([chave, p]) => {
    if (chave.startsWith('voz:')) {
      try {
        p?.pause();
      } catch {
        // ignora
      }
    }
  });
}
