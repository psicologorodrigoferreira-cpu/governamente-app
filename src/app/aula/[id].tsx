import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { Cartao, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { VideoYouTube } from '@/components/Video';
import { AulaApp, listarAulas } from '@/lib/admin';
import { useAuth } from '@/lib/auth';
import { podeVerAulas } from '@/lib/assinatura';
import { cores } from '@/lib/theme';

export default function AulaTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { acesso } = useAuth();
  const [aula, setAula] = useState<AulaApp | null | undefined>(undefined);

  useEffect(() => {
    listarAulas()
      .then((l) => setAula(l.find((a) => a.id === String(id)) ?? null))
      .catch(() => setAula(null));
  }, [id]);

  // Aulas são exclusivas de assinantes: no teste grátis, leva para os planos.
  if (!podeVerAulas(acesso)) return <Redirect href="/assinar" />;

  if (aula === undefined) {
    return (
      <Tela>
        <ActivityIndicator color={cores.petroleo} />
      </Tela>
    );
  }
  if (!aula) {
    return (
      <Tela>
        <Texto>Aula não encontrada.</Texto>
      </Tela>
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: aula.modulo }} />
      {aula.youtube_id ? (
        <VideoYouTube id={aula.youtube_id} />
      ) : (
        <Cartao>
          <Subtitulo>Em breve</Subtitulo>
          <Texto>Esta aula está sendo preparada e aparece aqui assim que for publicada.</Texto>
        </Cartao>
      )}
      <Legenda>{aula.modulo.toUpperCase()}</Legenda>
      <Titulo>{aula.titulo}</Titulo>
      <Texto>{aula.descricao}</Texto>
    </Tela>
  );
}
