import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { MODO_DEMO, supabase } from './supabase';
import { Acesso, DIAS_TESTE, iniciarLoja, sairLoja, verificarAcesso } from './assinatura';
import { limparDadosLocais } from './dados';

type Ctx = {
  carregando: boolean;
  logado: boolean;
  nome: string;
  email: string;
  acesso: Acesso;
  modoDemo: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<{ precisaConfirmar: boolean }>;
  recuperarSenha: (email: string) => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: () => Promise<void>;
  atualizarAcesso: () => Promise<void>;
  /** Só no modo demonstração: simula uma assinatura para testar o fluxo. */
  simularAssinatura: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);
const DEMO_KEY = 'gm:demo-usuario';
const DEMO_INICIO = 'gm:demo-inicio-teste';
const DEMO_ASSINANTE = 'gm:demo-assinante';

/** Modo demonstração: imita o teste grátis de 7 dias com dados guardados no aparelho. */
async function acessoDemo(): Promise<Acesso> {
  if ((await AsyncStorage.getItem(DEMO_ASSINANTE).catch(() => null)) === '1') {
    return { ativo: true, origem: 'demonstração' };
  }
  let inicio = await AsyncStorage.getItem(DEMO_INICIO).catch(() => null);
  if (!inicio) {
    inicio = new Date().toISOString();
    await AsyncStorage.setItem(DEMO_INICIO, inicio).catch(() => {});
  }
  const fim = new Date(new Date(inicio).getTime() + DIAS_TESTE * 864e5);
  return { ativo: fim.getTime() > Date.now(), origem: 'teste', expiraEm: fim.toISOString() };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [demo, setDemo] = useState<{ nome: string; email: string } | null>(null);
  const [acesso, setAcesso] = useState<Acesso>({ ativo: false });

  const atualizarAcesso = useCallback(async () => {
    if (MODO_DEMO) {
      setAcesso(await acessoDemo());
      return;
    }
    setAcesso(await verificarAcesso());
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      if (MODO_DEMO) {
        const salvo = await AsyncStorage.getItem(DEMO_KEY).catch(() => null);
        if (ativo && salvo) setDemo(JSON.parse(salvo));
        await atualizarAcesso();
        if (ativo) setCarregando(false);
        return;
      }
      const { data } = await supabase!.auth.getSession();
      if (!ativo) return;
      setSessao(data.session);
      if (data.session) {
        await iniciarLoja(data.session.user.id);
        await atualizarAcesso();
      } else {
        await iniciarLoja();
      }
      setCarregando(false);
    })();
    const sub = supabase?.auth.onAuthStateChange((_evento, s) => {
      setSessao(s);
      // Fora do callback: chamar o Supabase aqui dentro pode travar o login.
      setTimeout(async () => {
        if (s) {
          await iniciarLoja(s.user.id);
          await atualizarAcesso();
        } else {
          setAcesso({ ativo: false });
        }
      }, 0);
    });
    return () => {
      ativo = false;
      sub?.data.subscription.unsubscribe();
    };
  }, [atualizarAcesso]);

  const entrar = useCallback(async (email: string, senha: string) => {
    if (MODO_DEMO) {
      const u = { nome: email.split('@')[0], email };
      await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(u));
      setDemo(u);
      await atualizarAcesso();
      return;
    }
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) throw new Error(traduzirErro(error.message));
  }, [atualizarAcesso]);

  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    if (MODO_DEMO) {
      const u = { nome, email };
      await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(u));
      setDemo(u);
      await atualizarAcesso();
      return { precisaConfirmar: false };
    }
    const { data, error } = await supabase!.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { nome } },
    });
    if (error) throw new Error(traduzirErro(error.message));
    return { precisaConfirmar: !data.session };
  }, [atualizarAcesso]);

  const recuperarSenha = useCallback(async (email: string) => {
    if (MODO_DEMO) return;
    const { error } = await supabase!.auth.resetPasswordForEmail(email.trim());
    if (error) throw new Error(traduzirErro(error.message));
  }, []);

  const sair = useCallback(async () => {
    await sairLoja();
    if (MODO_DEMO) {
      await AsyncStorage.removeItem(DEMO_KEY);
      setDemo(null);
      return;
    }
    await supabase!.auth.signOut();
  }, []);

  /** Exigência da Apple: excluir a conta e os dados pelo próprio app. */
  const excluirConta = useCallback(async () => {
    if (MODO_DEMO) {
      await limparDadosLocais();
      await AsyncStorage.removeItem(DEMO_KEY);
      setDemo(null);
      return;
    }
    const { error } = await supabase!.functions.invoke('excluir-conta', { method: 'POST' });
    if (error) throw new Error('Não foi possível excluir agora. Tente de novo em instantes.');
    await sairLoja();
    await supabase!.auth.signOut();
  }, []);

  const simularAssinatura = useCallback(async () => {
    if (!MODO_DEMO) return;
    await AsyncStorage.setItem(DEMO_ASSINANTE, '1');
    await atualizarAcesso();
  }, [atualizarAcesso]);

  const valor = useMemo<Ctx>(() => {
    const meta = (sessao?.user.user_metadata ?? {}) as { nome?: string };
    return {
      carregando,
      logado: MODO_DEMO ? !!demo : !!sessao,
      nome: MODO_DEMO ? demo?.nome ?? '' : meta.nome ?? '',
      email: MODO_DEMO ? demo?.email ?? '' : sessao?.user.email ?? '',
      acesso,
      modoDemo: MODO_DEMO,
      entrar,
      cadastrar,
      recuperarSenha,
      sair,
      excluirConta,
      atualizarAcesso,
      simularAssinatura,
    };
  }, [carregando, sessao, demo, acesso, entrar, cadastrar, recuperarSenha, sair, excluirConta, atualizarAcesso, simularAssinatura]);

  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}

function traduzirErro(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered')) return 'Este e-mail já tem cadastro. Tente entrar.';
  if (m.includes('password')) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos.';
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  return 'Algo não deu certo. Tente de novo.';
}
