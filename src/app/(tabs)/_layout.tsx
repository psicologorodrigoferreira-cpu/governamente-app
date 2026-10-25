import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { aplicarLembretes, lerConfig } from '@/lib/lembretes';
import { useAuth } from '@/lib/auth';
import { cores, fontes } from '@/lib/theme';
import { IconeConta, IconeConteudo, IconeDiario, IconeInicio, IconeTrilha } from '@/components/icones';

export default function AbasLayout() {
  const { carregando, logado, acesso } = useAuth();

  // Mantém os lembretes em dia com a situação do acesso (ex.: aviso de fim do teste).
  useEffect(() => {
    if (!logado) return;
    lerConfig()
      .then((c) => aplicarLembretes(c, acesso))
      .catch(() => {});
  }, [logado, acesso]);
  if (!carregando && !logado) return <Redirect href="/entrar" />;
  if (!carregando && !acesso.ativo) return <Redirect href="/assinar" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.petroleo,
        tabBarInactiveTintColor: cores.grafiteSuave,
        tabBarStyle: { backgroundColor: cores.areiaClara, borderTopColor: cores.linha },
        tabBarLabelStyle: { fontFamily: fontes.textoMedio, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <IconeInicio cor={String(color)} /> }} />
      <Tabs.Screen name="trilha" options={{ title: 'Trilha', tabBarIcon: ({ color }) => <IconeTrilha cor={String(color)} /> }} />
      <Tabs.Screen name="diario" options={{ title: 'Diário', tabBarIcon: ({ color }) => <IconeDiario cor={String(color)} /> }} />
      <Tabs.Screen name="conteudos" options={{ title: 'Conteúdos', tabBarIcon: ({ color }) => <IconeConteudo cor={String(color)} /> }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta', tabBarIcon: ({ color }) => <IconeConta cor={String(color)} /> }} />
    </Tabs>
  );
}
