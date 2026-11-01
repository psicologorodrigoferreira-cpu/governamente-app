/**
 * Lembretes no celular (notificações locais, sem servidor).
 * Diário, check-in de domingo, prática do dia e aviso de fim do teste grátis.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { lerLocal, gravarLocal } from './dados';
import type { Acesso } from './assinatura';
import { AVISOS_MANHA, AVISOS_NOITE } from '@/content/rituais';

export const LEMBRETES_DISPONIVEIS = Platform.OS !== 'web';

export type ConfigLembretes = {
  pratica: { ativo: boolean; hora: number; minuto: number };
  diario: { ativo: boolean; hora: number; minuto: number };
  checkin: { ativo: boolean };
  teste: { ativo: boolean };
};

export const PADRAO: ConfigLembretes = {
  pratica: { ativo: true, hora: 8, minuto: 0 },
  diario: { ativo: true, hora: 20, minuto: 30 },
  checkin: { ativo: true },
  teste: { ativo: true },
};


const ID = {
  diario: 'gm-diario',
  noite: (d: number) => `gm-noite-${d}`,
  checkin: 'gm-checkin',
  pratica: (d: number) => `gm-pratica-${d}`,
  teste2d: 'gm-teste-2d',
  testeFim: 'gm-teste-fim',
  pomodoro: 'gm-pomodoro',
};

export async function lerConfig(): Promise<ConfigLembretes> {
  const salvo = await lerLocal<Partial<ConfigLembretes>>('lembretes', {});
  return { ...PADRAO, ...salvo };
}

export async function salvarConfig(c: ConfigLembretes) {
  await gravarLocal('lembretes', c);
}

export function configurarExibicao() {
  if (!LEMBRETES_DISPONIVEIS) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Pede permissão uma vez. Devolve true se puder avisar. */
export async function pedirPermissao(): Promise<boolean> {
  if (!LEMBRETES_DISPONIVEIS) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lembretes', {
      name: 'Lembretes',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  if (!atual.canAskAgain) return false;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

async function cancelar(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

/** Reagenda tudo conforme a configuração e a situação do acesso. */
export async function aplicarLembretes(c: ConfigLembretes, acesso?: Acesso) {
  if (!LEMBRETES_DISPONIVEIS) return;
  const permitido = (await Notifications.getPermissionsAsync()).granted;
  const semana = [1, 2, 3, 4, 5, 6, 7];
  await cancelar([ID.diario, ID.checkin, ID.teste2d, ID.testeFim, ...semana.map(ID.pratica), ...semana.map(ID.noite)]);
  if (!permitido) return;
  const canal = Platform.OS === 'android' ? { channelId: 'lembretes' } : {};

  // Noite: convite para o Fechamento do dia (texto diferente a cada dia da semana).
  if (c.diario.ativo) {
    for (let d = 1; d <= 7; d++) {
      const a = AVISOS_NOITE[d - 1];
      await Notifications.scheduleNotificationAsync({
        identifier: ID.noite(d),
        content: { title: a.titulo, body: a.corpo, data: { url: '/ritual?p=noite' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: d, hour: c.diario.hora, minute: c.diario.minuto, ...canal },
      });
    }
  }
  if (c.checkin.ativo) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID.checkin,
      content: { title: 'Check-in da semana', body: 'Um minuto para olhar a sua semana com calma.', data: { url: '/checkin' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 10, minute: 0, ...canal },
    });
  }
  // Manhã: convite para o Norte da manhã (texto diferente a cada dia da semana).
  if (c.pratica.ativo) {
    for (let d = 1; d <= 7; d++) {
      const a = AVISOS_MANHA[d - 1];
      await Notifications.scheduleNotificationAsync({
        identifier: ID.pratica(d),
        content: { title: a.titulo, body: a.corpo, data: { url: '/ritual?p=manha' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: d,
          hour: c.pratica.hora,
          minute: c.pratica.minuto,
          ...canal,
        },
      });
    }
  }
  if (c.teste.ativo && acesso?.origem === 'teste' && acesso.ativo && acesso.expiraEm) {
    const fim = new Date(acesso.expiraEm);
    const doisDias = new Date(fim.getTime() - 2 * 864e5);
    doisDias.setHours(10, 0, 0, 0);
    const ultimoDia = new Date(fim.getTime() - 864e5 / 2);
    if (doisDias.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: ID.teste2d,
        content: {
          title: 'Faltam 2 dias do seu teste grátis',
          body: 'Escolha o plano mensal ou anual para continuar e liberar as aulas.',
          data: { url: '/assinar' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: doisDias, ...canal },
      });
    }
    if (ultimoDia.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: ID.testeFim,
        content: {
          title: 'Seu teste grátis termina hoje',
          body: 'Seus registros ficam guardados. Assine para seguir de onde parou.',
          data: { url: '/assinar' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: ultimoDia, ...canal },
      });
    }
  }
}

/** Aviso de fim de ciclo do Pomodoro, para quando o app estiver em segundo plano. */
export async function agendarFimPomodoro(segundos: number, titulo: string, corpo: string) {
  if (!LEMBRETES_DISPONIVEIS) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await cancelarPomodoro();
  await Notifications.scheduleNotificationAsync({
    identifier: ID.pomodoro,
    content: { title: titulo, body: corpo, data: { url: '/pomodoro' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(segundos)),
      ...(Platform.OS === 'android' ? { channelId: 'lembretes' } : {}),
    },
  });
}

export async function cancelarPomodoro() {
  if (!LEMBRETES_DISPONIVEIS) return;
  await Notifications.cancelScheduledNotificationAsync(ID.pomodoro).catch(() => {});
}

/** Abre a tela certa quando a pessoa toca no lembrete. */
export function aoTocarLembrete(abrir: (url: string) => void) {
  if (!LEMBRETES_DISPONIVEIS) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string') abrir(url);
  });
  return () => sub.remove();
}
