import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Botao, Campo, Tela, Texto } from '@/components/ui';
import { resgatarCodigo } from '@/lib/admin';
import { CODIGO_DISPONIVEL } from '@/lib/assinatura';
import { useAuth } from '@/lib/auth';
import { cores, fontes } from '@/lib/theme';

export default function CodigoTela() {
  // Nas lojas o resgate não existe (App Store 3.1.1); um link antigo para esta tela volta para a Conta.
  if (!CODIGO_DISPONIVEL) return <Redirect href="/(tabs)/conta" />;
  return <Resgate />;
}

function Resgate() {
  const { atualizarAcesso } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function ativar() {
    if (!codigo.trim()) return;
    setCarregando(true);
    setMsg(null);
    const r = await resgatarCodigo(codigo);
    setMsg({ ok: r.ok, texto: r.mensagem });
    if (r.ok) await atualizarAcesso();
    setCarregando(false);
  }

  return (
    <Tela>
      <Texto>
        Recebeu um código junto com o livro, de presente ou de uma empresa parceira? Digite abaixo para liberar o seu acesso.
      </Texto>
      <Campo
        rotulo="Código"
        value={codigo}
        onChangeText={(t) => setCodigo(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="GM-XXXXXX"
        maxLength={20}
      />
      <Botao titulo="Ativar código" onPress={ativar} carregando={carregando} desativado={!codigo.trim()} />
      {msg && (
        <Text style={[s.msg, { color: msg.ok ? cores.salviaEscura : cores.alerta }]} accessibilityLiveRegion="polite">
          {msg.texto}
        </Text>
      )}
      {msg?.ok && <Botao variante="secundario" titulo="Ir para o app" onPress={() => router.replace('/(tabs)')} />}
    </Tela>
  );
}

const s = StyleSheet.create({
  msg: { fontFamily: fontes.textoMedio, fontSize: 15, textAlign: 'center' },
});
