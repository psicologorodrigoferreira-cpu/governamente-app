import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { MODO_DEMO, supabase } from './supabase';
import { Acesso, iniciarLoja, sairLoja, verificarAcesso } from './assinatura';
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
};

const AuthCtx = createContext<Ctx | null>(null);
const DEMO_KEY = 'gm:demo-usuario';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [demo, setDemo] = useState<{ nome: string; email: string } | null>(null);
  const [acesso, setAcesso] = useState<Acesso>({ ativo: false });

  const atualizarAcesso = useCallback(async () => {
    if (MODO_DEMO) {
      setAcesso({ ativo: true, origem: 'demonstração' });
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
    const sub = supabase?.auth.onAuthStateChange(async (_evento, s) => {
      setSessao(s);
      if (s) {
        await iniciarLoja(s.user.id);
        await atualizarAcesso();
      } else {
        setAcesso({ ativo: false });
      }
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
      return;
    }
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) throw new Error(traduzirErro(error.message));
  }, []);

  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    if (MODO_DEMO) {
      const u = { nome, email };
      await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(u));
      setDemo(u);
      return { precisaConfirmar: false };
    }
    const { data, error } = await supabase!.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { nome } },
    });
    if (error) throw new Error(traduzirErro(error.message));
    return { precisaConfirmar: !data.session };
  }, []);

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
    };
  }, [carregando, sessao, demo, acesso, entrar, cadastrar, recuperarSenha, sair, excluirConta, atualizarAcesso]);

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
