import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Botao, Campo, Logo, Legenda, Tela, Texto, Titulo } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { cores, espaco } from '@/lib/theme';

/**
 * Aberta pelo link do e-mail "Redefinir sua senha":
 * app.governamente.com.br/nova-senha?token_hash=...&type=recovery
 * Valida o link, pede a senha nova e grava. No Android o link abre no navegador;
 * depois a pessoa entra no app com a senha nova.
 */
type Etapa = 'validando' | 'senha' | 'pronto' | 'invalido';

export default function NovaSenha() {
  const { token_hash } = useLocalSearchParams<{ token_hash?: string }>();
  const [etapa, setEtapa] = useState<Etapa>(() => (supabase && token_hash ? 'validando' : 'invalido'));
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!supabase || !token_hash) return;
    supabase.auth
      .verifyOtp({ token_hash: String(token_hash), type: 'recovery' })
      .then(({ error }) => setEtapa(error ? 'invalido' : 'senha'))
      .catch(() => setEtapa('invalido'));
  }, [token_hash]);

  async function salvar() {
    setErro('');
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.');
    if (senha !== repetir) return setErro('As duas senhas não são iguais.');
    setSalvando(true);
    const { error } = await supabase!.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setErro(
        error.message.toLowerCase().includes('different')
          ? 'Escolha uma senha diferente da anterior.'
          : 'Não foi possível salvar. Peça um novo link e tente de novo.',
      );
      return;
    }
    setEtapa('pronto');
  }

  return (
    <Tela semApoio>
      <View style={{ alignItems: 'center', marginTop: espaco.l }}>
        <Logo size={48} />
      </View>
      {etapa === 'validando' && <ActivityIndicator color={cores.petroleo} />}
      {etapa === 'invalido' && (
        <>
          <Titulo>Este link não vale mais</Titulo>
          <Texto>O link de redefinição expira em 1 hora e só pode ser usado uma vez. Peça um novo em “Esqueci minha senha”.</Texto>
          <Botao titulo="Ir para a entrada" onPress={() => router.replace('/entrar')} />
        </>
      )}
      {etapa === 'senha' && (
        <>
          <Titulo>Crie sua nova senha</Titulo>
          <Campo rotulo="Nova senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" />
          <Campo rotulo="Repita a nova senha" value={repetir} onChangeText={setRepetir} secureTextEntry autoComplete="new-password" />
          {!!erro && <Texto style={{ color: cores.alerta }}>{erro}</Texto>}
          <Botao titulo="Salvar nova senha" onPress={salvar} carregando={salvando} />
          <Legenda>Pelo menos 8 caracteres.</Legenda>
        </>
      )}
      {etapa === 'pronto' && (
        <>
          <Titulo>Senha alterada</Titulo>
          <Texto>Pronto! Use a nova senha para entrar no app, no celular ou no computador.</Texto>
          <Botao titulo="Continuar" onPress={() => router.replace('/')} />
        </>
      )}
    </Tela>
  );
}
