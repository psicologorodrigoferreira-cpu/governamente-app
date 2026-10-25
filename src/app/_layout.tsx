import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Figtree_400Regular, Figtree_500Medium, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { AuthProvider } from '@/lib/auth';
import { aoTocarLembrete, configurarExibicao } from '@/lib/lembretes';
import { cores, fontes } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
configurarExibicao();

export default function RootLayout() {
  const [prontas] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_700Bold,
  });

  useEffect(() => {
    if (prontas) SplashScreen.hideAsync().catch(() => {});
  }, [prontas]);

  // Tocar num lembrete abre a tela correspondente.
  useEffect(() => aoTocarLembrete((url) => router.push(url as never)), []);

  if (!prontas) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: cores.areia },
            headerTintColor: cores.petroleo,
            headerTitleStyle: { fontFamily: fontes.titulo },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: cores.areia },
            headerBackTitle: 'Voltar',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="entrar" options={{ headerShown: false }} />
          <Stack.Screen name="assinar" options={{ title: 'Assinatura', presentation: 'modal' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="estacao/[id]" options={{ title: 'Trilha' }} />
          <Stack.Screen name="aula/[id]" options={{ title: 'Aula' }} />
          <Stack.Screen name="diario-novo" options={{ title: 'Novo registro', presentation: 'modal' }} />
          <Stack.Screen name="checkin" options={{ title: 'Check-in da semana', presentation: 'modal' }} />
          <Stack.Screen name="roda" options={{ title: 'Roda das Emoções' }} />
          <Stack.Screen name="respirar" options={{ title: 'Respiro 4–6', presentation: 'modal' }} />
          <Stack.Screen name="apoio" options={{ title: 'Apoio agora', presentation: 'modal' }} />
          <Stack.Screen name="privacidade" options={{ title: 'Privacidade' }} />
          <Stack.Screen name="constancia" options={{ title: 'Plano de constância' }} />
          <Stack.Screen name="pomodoro" options={{ title: 'Foco com pausa' }} />
          <Stack.Screen name="matriz" options={{ title: 'Matriz de prioridades' }} />
          <Stack.Screen name="gratidao" options={{ title: 'Três gratidões' }} />
          <Stack.Screen name="meditar" options={{ title: 'Meditação', presentation: 'modal' }} />
          <Stack.Screen name="painel" options={{ title: 'Painel' }} />
          <Stack.Screen name="codigo" options={{ title: 'Código de acesso', presentation: 'modal' }} />
          <Stack.Screen name="lembretes" options={{ title: 'Lembretes' }} />
          <Stack.Screen name="primeiros-passos" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
