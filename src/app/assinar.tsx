import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { Botao, Cartao, Destaque, Legenda, Logo, Tela, Texto, Titulo } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  assinar,
  LINK_ASSINAR_SITE,
  LOJA_DISPONIVEL,
  pacotesDisponiveis,
  PRECO_REFERENCIA,
  restaurarCompras,
} from '@/lib/assinatura';
import { cores, espaco, fontes } from '@/lib/theme';

const INCLUI = [
  'Trilha de 15 estações baseada no livro GovernaMente e no método C.A.I.A.',
  'Diário das Emoções com histórico e padrões',
  'Roda das Emoções e respiro guiado 4–6',
  'Check-in semanal para acompanhar sua evolução',
  'Aulas e conteúdos novos do ecossistema',
];

export default function Assinar() {
  const { atualizarAcesso, acesso, sair } = useAuth();
  const [pacote, setPacote] = useState<PurchasesPackage | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    pacotesDisponiveis()
      .then((p) => setPacote(p.find((x) => x.packageType === 'MONTHLY') ?? p[0] ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (acesso.ativo) router.replace('/(tabs)');
  }, [acesso.ativo]);

  async function comprar() {
    if (!pacote) return;
    setErro('');
    setCarregando(true);
    try {
      const ok = await assinar(pacote);
      if (ok) await atualizarAcesso();
    } catch (e) {
      const cancelou = (e as { userCancelled?: boolean }).userCancelled;
      if (!cancelou) setErro('A compra não foi concluída. Nada foi cobrado.');
    } finally {
      setCarregando(false);
    }
  }

  async function restaurar() {
    setCarregando(true);
    try {
      await restaurarCompras();
      await atualizarAcesso();
    } finally {
      setCarregando(false);
    }
  }

  const preco = pacote?.product.priceString ?? PRECO_REFERENCIA.replace('/mês', '');

  return (
    <Tela>
      <View style={{ alignItems: 'center', gap: espaco.s }}>
        <Logo size={56} />
        <Titulo style={{ textAlign: 'center' }}>
          Conduza a mente, <Destaque>um passo por dia</Destaque>
        </Titulo>
      </View>

      <Cartao>
        {INCLUI.map((i) => (
          <View key={i} style={s.item}>
            <View style={s.ponto} />
            <Texto style={{ flex: 1 }}>{i}</Texto>
          </View>
        ))}
      </Cartao>

      <View style={{ alignItems: 'center' }}>
        <Text style={s.preco}>
          {preco}
          <Text style={s.mes}> /mês</Text>
        </Text>
        <Legenda>Cancele quando quiser.</Legenda>
      </View>

      {LOJA_DISPONIVEL ? (
        <Botao titulo="Assinar" onPress={comprar} carregando={carregando} desativado={!pacote} />
      ) : (
        <Texto style={{ textAlign: 'center', color: cores.grafiteSuave }}>
          {Platform.OS === 'web'
            ? 'Para assinar, use o app no celular ou o site.'
            : 'A assinatura pela loja ainda não está configurada.'}
        </Texto>
      )}
      {!!LINK_ASSINAR_SITE && (
        <Botao variante="secundario" titulo="Assinar pelo site" onPress={() => Linking.openURL(LINK_ASSINAR_SITE)} />
      )}
      {!!erro && <Text style={s.erro}>{erro}</Text>}

      <Botao variante="texto" titulo="Já assino ou sou da Mesa / do Plano: verificar acesso" onPress={atualizarAcesso} />
      {LOJA_DISPONIVEL && <Botao variante="texto" titulo="Restaurar compras" onPress={restaurar} />}

      <Legenda style={{ textAlign: 'center', lineHeight: 18 }}>
        {Platform.OS === 'ios'
          ? 'A assinatura renova automaticamente todo mês e é cobrada na sua conta Apple, a menos que seja cancelada pelo menos 24 horas antes do fim do período, nos Ajustes do iPhone.'
          : 'A assinatura renova automaticamente todo mês e pode ser cancelada a qualquer momento no Google Play.'}
      </Legenda>
      <View style={s.links}>
        <Text style={s.link} onPress={() => Linking.openURL('https://governamente.com.br/app/termos')}>
          Termos de uso
        </Text>
        <Text style={s.link} onPress={() => router.push('/privacidade')}>
          Privacidade
        </Text>
        <Text style={s.link} onPress={() => sair().then(() => router.replace('/entrar'))}>
          Sair
        </Text>
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.ambar, marginTop: 8 },
  preco: { fontFamily: fontes.titulo, fontSize: 40, color: cores.petroleo },
  mes: { fontFamily: fontes.texto, fontSize: 18, color: cores.grafiteSuave },
  erro: { fontFamily: fontes.textoMedio, color: cores.alerta, textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: espaco.l },
  link: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.petroleo, textDecorationLine: 'underline' },
});
