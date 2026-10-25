/**
 * Assinatura pelas lojas (Apple e Google) via RevenueCat,
 * mais o acesso concedido pelo servidor (Hubla, Mesa, Plano).
 */
import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { supabase } from './supabase';

export const ENTITLEMENT = 'acesso'; // nome do "Entitlement" criado no RevenueCat
export const PRECO_REFERENCIA = { mensal: 'R$ 29,90', anual: 'R$ 299,00' };

const chaveLoja =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_RC_IOS_KEY
    : Platform.OS === 'android'
      ? process.env.EXPO_PUBLIC_RC_ANDROID_KEY
      : undefined;

export const LOJA_DISPONIVEL = !!chaveLoja && Platform.OS !== 'web';
let configurado = false;

export async function iniciarLoja(usuarioId?: string) {
  if (!LOJA_DISPONIVEL) return;
  if (!configurado) {
    Purchases.configure({ apiKey: chaveLoja!, appUserID: usuarioId ?? null });
    configurado = true;
  } else if (usuarioId) {
    await Purchases.logIn(usuarioId);
  }
}

export async function sairLoja() {
  if (LOJA_DISPONIVEL && configurado) {
    try {
      await Purchases.logOut();
    } catch {
      /* usuário anônimo */
    }
  }
}

async function acessoPelaLoja(): Promise<boolean> {
  if (!LOJA_DISPONIVEL || !configurado) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT];
  } catch {
    return false;
  }
}

export const DIAS_TESTE = 7;

/**
 * Acesso:
 * - origem 'teste': período grátis de 7 dias após o cadastro (tudo liberado, menos as aulas).
 *   Se `ativo` for false com origem 'teste', o período grátis terminou.
 * - demais origens: assinatura (loja ou site) ou inclusão pela Mesa / Plano / cortesia.
 */
export type Acesso = {
  ativo: boolean;
  origem?: 'teste' | 'loja' | 'hubla' | 'mesa' | 'plano' | 'cortesia' | 'demonstração' | string;
  expiraEm?: string;
};

/** O que a pessoa pode usar: no teste grátis, as aulas ficam bloqueadas. */
export const ehAssinante = (a: Acesso) => a.ativo && a.origem !== 'teste';
export const podeVerAulas = ehAssinante;

export function diasRestantes(a: Acesso): number {
  if (!a.expiraEm) return 0;
  return Math.max(0, Math.ceil((new Date(a.expiraEm).getTime() - Date.now()) / 864e5));
}

/** Acesso no servidor: Hubla (site), Mesa, Plano, cortesia ou o teste grátis. */
async function acessoPeloServidor(): Promise<Acesso> {
  if (!supabase) return { ativo: false };
  const { data, error } = await supabase.rpc('meu_acesso');
  if (error || !data) return { ativo: false };
  const linha = Array.isArray(data) ? data[0] : data;
  if (!linha) return { ativo: false };
  return { ativo: !!linha.ativo, origem: linha.origem ?? undefined, expiraEm: linha.expira_em ?? undefined };
}

export async function verificarAcesso(): Promise<Acesso> {
  const servidor = await acessoPeloServidor();
  // Assinatura paga ou inclusão vale mais que o teste grátis.
  if (servidor.ativo && servidor.origem !== 'teste') return servidor;
  if (await acessoPelaLoja()) return { ativo: true, origem: 'loja' };
  return servidor; // teste grátis (ativo ou encerrado) ou nada
}

export type Plano = { pacote: PurchasesPackage; tipo: 'mensal' | 'anual' };

/** Planos da offering atual do RevenueCat: mensal e anual. */
export async function planosDisponiveis(): Promise<Plano[]> {
  if (!LOJA_DISPONIVEL) return [];
  const ofertas = await Purchases.getOfferings();
  const atual = ofertas.current;
  const lista: Plano[] = [];
  if (atual?.annual) lista.push({ pacote: atual.annual, tipo: 'anual' });
  if (atual?.monthly) lista.push({ pacote: atual.monthly, tipo: 'mensal' });
  return lista;
}

export async function assinar(pacote: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pacote);
  return !!customerInfo.entitlements.active[ENTITLEMENT];
}

export async function restaurarCompras(): Promise<boolean> {
  if (!LOJA_DISPONIVEL) return false;
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT];
}

export function linkGerenciarAssinatura() {
  return Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
}

/** Página de assinatura no site (checkout Hubla). Preencha com o link da oferta mensal. */
export const LINK_ASSINAR_SITE = process.env.EXPO_PUBLIC_LINK_HUBLA_APP ?? '';
