import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Botao, Cartao, Destaque, Legenda, Logo, Tela, Texto, Titulo } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  assinar,
  diasRestantes,
  ehAssinante,
  LINK_ASSINAR_SITE,
  LOJA_DISPONIVEL,
  Plano,
  planosDisponiveis,
  PRECO_REFERENCIA,
  restaurarCompras,
} from '@/lib/assinatura';
import { cores, espaco, fontes, raio } from '@/lib/theme';

const INCLUI = [
  'Trilha de 15 estações baseada no livro GovernaMente e no método C.A.I.A.',
  'Aulas em vídeo dentro do app',
  'Diário das Emoções com histórico e padrões',
  'Roda das Emoções e respiro guiado 4–6',
  'Check-in semanal para acompanhar sua evolução',
];

type Tipo = 'anual' | 'mensal';

export default function Assinar() {
  const { atualizarAcesso, acesso, sair, modoDemo, simularAssinatura } = useAuth();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [escolhido, setEscolhido] = useState<Tipo>('anual');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    planosDisponiveis()
      .then(setPlanos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ehAssinante(acesso)) router.replace('/(tabs)');
  }, [acesso]);

  const emTeste = acesso.origem === 'teste' && acesso.ativo;
  const testeAcabou = acesso.origem === 'teste' && !acesso.ativo;
  const dias = diasRestantes(acesso);

  const preco = (tipo: Tipo) => planos.find((p) => p.tipo === tipo)?.pacote.product.priceString ?? PRECO_REFERENCIA[tipo];
  const mensalNum = planos.find((p) => p.tipo === 'mensal')?.pacote.product.price;
  const anualNum = planos.find((p) => p.tipo === 'anual')?.pacote.product.price;
  const economia =
    mensalNum && anualNum ? Math.round((1 - anualNum / (mensalNum * 12)) * 100) : Math.round((1 - 299 / (29.9 * 12)) * 100);
  const porMesAnual =
    anualNum !== undefined
      ? planos.find((p) => p.tipo === 'anual')!.pacote.product.pricePerMonthString ?? null
      : 'R$ 24,92';

  async function comprar() {
    setErro('');
    if (modoDemo) {
      await simularAssinatura();
      return;
    }
    const plano = planos.find((p) => p.tipo === escolhido);
    if (!plano) return;
    setCarregando(true);
    try {
      const ok = await assinar(plano.pacote);
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

  const podeComprar = modoDemo || (LOJA_DISPONIVEL && planos.length > 0);

  return (
    <Tela>
      <View style={{ alignItems: 'center', gap: espaco.s }}>
        <Logo size={56} />
        <Titulo style={{ textAlign: 'center' }}>
          {testeAcabou ? (
            <>
              Seu teste grátis <Destaque>terminou</Destaque>
            </>
          ) : (
            <>
              Conduza a mente, <Destaque>um passo por dia</Destaque>
            </>
          )}
        </Titulo>
        {emTeste && (
          <Texto style={{ textAlign: 'center' }}>
            Você está no teste grátis: {dias === 1 ? 'resta 1 dia' : `restam ${dias} dias`}. Assine agora para liberar as aulas e
            continuar depois do teste.
          </Texto>
        )}
        {testeAcabou && (
          <Texto style={{ textAlign: 'center' }}>
            Seus registros, check-ins e o seu progresso na trilha continuam guardados. Escolha um plano para seguir de onde parou.
          </Texto>
        )}
      </View>

      <Cartao>
        {INCLUI.map((i) => (
          <View key={i} style={s.item}>
            <View style={s.ponto} />
            <Texto style={{ flex: 1 }}>{i}</Texto>
          </View>
        ))}
      </Cartao>

      <View style={{ gap: espaco.s }} accessibilityRole="radiogroup">
        <OpcaoPlano
          ativo={escolhido === 'anual'}
          onPress={() => setEscolhido('anual')}
          titulo="Anual"
          preco={`${preco('anual')} /ano`}
          detalhe={porMesAnual ? `Equivale a ${porMesAnual} por mês` : undefined}
          selo={economia > 0 ? `Economize ${economia}%` : undefined}
        />
        <OpcaoPlano
          ativo={escolhido === 'mensal'}
          onPress={() => setEscolhido('mensal')}
          titulo="Mensal"
          preco={`${preco('mensal')} /mês`}
          detalhe="Cancele quando quiser"
        />
      </View>

      {podeComprar ? (
        <Botao
          titulo={modoDemo ? 'Simular assinatura (demonstração)' : `Assinar plano ${escolhido}`}
          onPress={comprar}
          carregando={carregando}
        />
      ) : (
        <Texto style={{ textAlign: 'center', color: cores.grafiteSuave }}>
          {Platform.OS === 'web'
            ? 'No navegador, a assinatura é feita pelo site. No app do celular, direto pela loja.'
            : 'A assinatura pela loja ainda não está configurada.'}
        </Texto>
      )}
      {!!LINK_ASSINAR_SITE && (
        <Botao variante="secundario" titulo="Assinar pelo site" onPress={() => Linking.openURL(LINK_ASSINAR_SITE)} />
      )}
      {!!erro && <Text style={s.erro}>{erro}</Text>}

      <Botao variante="texto" titulo="Tenho um código de acesso" onPress={() => router.push('/codigo')} />
      <Botao variante="texto" titulo="Já assino ou sou da Mesa / do Plano: verificar acesso" onPress={atualizarAcesso} />
      {LOJA_DISPONIVEL && <Botao variante="texto" titulo="Restaurar compras" onPress={restaurar} />}
      {emTeste && <Botao variante="texto" titulo="Continuar no teste grátis" onPress={() => router.replace('/(tabs)')} />}

      <Legenda style={{ textAlign: 'center', lineHeight: 18 }}>
        {Platform.OS === 'ios'
          ? 'A assinatura renova automaticamente no fim de cada período (mês ou ano) e é cobrada na sua conta Apple, a menos que seja cancelada pelo menos 24 horas antes, nos Ajustes do iPhone.'
          : 'A assinatura renova automaticamente no fim de cada período (mês ou ano) e pode ser cancelada a qualquer momento no Google Play.'}
      </Legenda>
      <View style={s.links}>
        <Text style={s.link} onPress={() => Linking.openURL('https://app.governamente.com.br/termos.html')}>
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

function OpcaoPlano({
  ativo,
  onPress,
  titulo,
  preco,
  detalhe,
  selo,
}: {
  ativo: boolean;
  onPress: () => void;
  titulo: string;
  preco: string;
  detalhe?: string;
  selo?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={`Plano ${titulo}, ${preco}`}
      onPress={onPress}
      style={[s.opcao, ativo && s.opcaoAtiva]}
    >
      <View style={[s.radio, ativo && s.radioAtivo]}>{ativo && <View style={s.radioMiolo} />}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.opcaoTitulo}>{titulo}</Text>
          {selo && <Text style={s.selo}>{selo}</Text>}
        </View>
        {detalhe && <Text style={s.opcaoDetalhe}>{detalhe}</Text>}
      </View>
      <Text style={s.opcaoPreco}>{preco}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.ambar, marginTop: 8 },
  erro: { fontFamily: fontes.textoMedio, color: cores.alerta, textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: espaco.l },
  link: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.petroleo, textDecorationLine: 'underline' },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: espaco.m,
    borderRadius: raio.m,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.areiaClara,
  },
  opcaoAtiva: { borderColor: cores.petroleo, backgroundColor: cores.branco },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: cores.grafiteSuave, alignItems: 'center', justifyContent: 'center' },
  radioAtivo: { borderColor: cores.petroleo },
  radioMiolo: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.petroleo },
  opcaoTitulo: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.petroleo },
  opcaoDetalhe: { fontFamily: fontes.texto, fontSize: 13, color: cores.grafiteSuave },
  opcaoPreco: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.petroleo },
  selo: {
    fontFamily: fontes.textoForte,
    fontSize: 11,
    color: cores.petroleo,
    backgroundColor: cores.ambar,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
