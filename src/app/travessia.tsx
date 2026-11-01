import { router } from 'expo-router';
import { Botao, Tela, Texto } from '@/components/ui';
import { RelatorioTravessia } from '@/components/relatorio';
import { useAuth } from '@/lib/auth';
import { ehAssinante } from '@/lib/assinatura';

// Relatório "Sua travessia até aqui", aberto pelo Início nos últimos dias do teste grátis.
export default function Travessia() {
  const { acesso } = useAuth();
  return (
    <Tela>
      <Texto>Um retrato do que você já construiu no GovernaMente e do que ainda está à sua espera.</Texto>
      <RelatorioTravessia />
      {!ehAssinante(acesso) && <Botao titulo="Continuar a travessia: ver planos" onPress={() => router.push('/assinar')} />}
    </Tela>
  );
}
