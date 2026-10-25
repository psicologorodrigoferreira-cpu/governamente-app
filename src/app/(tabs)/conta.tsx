import { useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { Botao, Cartao, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { diasRestantes, linkGerenciarAssinatura, LOJA_DISPONIVEL, restaurarCompras } from '@/lib/assinatura';
import { cores } from '@/lib/theme';

const ORIGEM: Record<string, string> = {
  loja: Platform.OS === 'ios' ? 'Assinatura pela App Store' : 'Assinatura pelo Google Play',
  hubla: 'Assinatura pelo site',
  mesa: 'Incluso na Mesa GovernaMente',
  plano: 'Incluso no Plano Individual',
  cortesia: 'Acesso cortesia',
  'demonstração': 'Modo demonstração',
};

export default function Conta() {
  const { nome, email, acesso, sair, excluirConta, atualizarAcesso } = useAuth();
  const [restaurando, setRestaurando] = useState(false);

  async function restaurar() {
    setRestaurando(true);
    try {
      const ok = await restaurarCompras();
      await atualizarAcesso();
      Alert.alert(ok ? 'Assinatura restaurada' : 'Nenhuma assinatura encontrada neste aparelho');
    } catch {
      Alert.alert('Não foi possível restaurar agora');
    } finally {
      setRestaurando(false);
    }
  }

  function confirmarExclusao() {
    const excluir = async () => {
      try {
        await excluirConta();
        router.replace('/entrar');
      } catch (e) {
        Alert.alert((e as Error).message);
      }
    };
    if (Platform.OS === 'web') {
      excluir();
      return;
    }
    Alert.alert(
      'Excluir sua conta?',
      'Seu diário, check-ins e reflexões serão apagados para sempre. Se você assina pela loja, cancele também a assinatura lá.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: excluir },
      ],
    );
  }

  return (
    <Tela>
      <Titulo>{nome || 'Sua conta'}</Titulo>
      <Legenda>{email}</Legenda>

      <Cartao>
        <Subtitulo>Seu acesso</Subtitulo>
        <Texto>
          {acesso.origem === 'teste'
            ? acesso.ativo
              ? `Teste grátis: ${diasRestantes(acesso)} dia(s) restante(s). As aulas são liberadas com a assinatura.`
              : 'Seu teste grátis terminou.'
            : acesso.ativo
              ? ORIGEM[acesso.origem ?? ''] ?? 'Ativo'
              : 'Sem assinatura ativa'}
        </Texto>
        {acesso.origem === 'teste' && <Botao titulo="Ver planos: mensal ou anual" onPress={() => router.push('/assinar')} />}
        {acesso.origem === 'loja' && (
          <Botao variante="secundario" titulo="Gerenciar assinatura" onPress={() => Linking.openURL(linkGerenciarAssinatura())} />
        )}
        {LOJA_DISPONIVEL && <Botao variante="texto" titulo="Restaurar compras" onPress={restaurar} carregando={restaurando} />}
      </Cartao>

      <Cartao>
        <Subtitulo>Fale com a gente</Subtitulo>
        <Texto>Dúvidas sobre o app ou a assinatura.</Texto>
        <Botao
          variante="secundario"
          titulo="Enviar e-mail"
          onPress={() => Linking.openURL('mailto:psicologorodrigoferreira@gmail.com?subject=App%20GovernaMente')}
        />
      </Cartao>

      <Botao variante="secundario" titulo="Sair" onPress={() => sair().then(() => router.replace('/entrar'))} />

      <Texto style={{ color: cores.grafiteSuave, fontSize: 13, lineHeight: 19 }}>
        App educacional criado por Rodrigo Martins Ferreira, psicólogo (CRP 04/65049). Não substitui psicoterapia ou
        atendimento médico.
      </Texto>
      <Botao variante="texto" titulo="Privacidade e seus dados" onPress={() => router.push('/privacidade')} />
      <Botao variante="texto" titulo="Excluir minha conta" onPress={confirmarExclusao} />
    </Tela>
  );
}
