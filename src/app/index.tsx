import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { cores } from '@/lib/theme';

export default function Inicio() {
  const { carregando, logado, acesso } = useAuth();
  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.petroleo }}>
        <ActivityIndicator color={cores.ambar} />
      </View>
    );
  }
  if (!logado) return <Redirect href="/entrar" />;
  if (!acesso.ativo) return <Redirect href="/assinar" />;
  return <Redirect href="/(tabs)" />;
}
