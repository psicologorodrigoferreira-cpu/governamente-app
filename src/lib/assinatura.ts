/**
 * Assinatura pelas lojas (Apple e Google) via RevenueCat,
 * mais o acesso concedido pelo servidor (Hubla, Mesa, Plano).
 */
import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { supabase } from './supabase';

export const ENTITLEMENT = 'acesso'; // nome do "Entitlement" criado no RevenueCat
export const PRECO_REFERENCIA = 'R$ 29,90/mês';

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

/** Acesso liberado no servidor: Hubla (site), Tripulantes da Mesa, pacientes do Plano. */
async function acessoPeloServidor(): Promise<{ ativo: boolean; origem?: string }> {
  if (!supabase) return { ativo: false };
  const { data, error } = await supabase.rpc('meu_acesso');
  if (error || !data) return { ativo: false };
  const linha = Array.isArray(data) ? data[0] : data;
  return { ativo: !!linha?.ativo, origem: linha?.origem ?? undefined };
}

export type Acesso = { ativo: boolean; origem?: 'loja' | 'hubla' | 'mesa' | 'plano' | 'cortesia' | string };

export async function verificarAcesso(): Promise<Acesso> {
  const servidor = await acessoPeloServidor();
  if (servidor.ativo) return servidor;
  if (await acessoPelaLoja()) return { ativo: true, origem: 'loja' };
  return { ativo: false };
}

export async function pacotesDisponiveis(): Promise<PurchasesPackage[]> {
  if (!LOJA_DISPONIVEL) return [];
  const ofertas = await Purchases.getOfferings();
  return ofertas.current?.availablePackages ?? [];
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
