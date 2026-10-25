import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { Cartao, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { VideoYouTube } from '@/components/Video';
import { aulaPorId } from '@/content/aulas';
import { useAuth } from '@/lib/auth';
import { podeVerAulas } from '@/lib/assinatura';

export default function AulaTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { acesso } = useAuth();
  const aula = aulaPorId(String(id));

  // Aulas são exclusivas de assinantes: no teste grátis, leva para os planos.
  if (!podeVerAulas(acesso)) return <Redirect href="/assinar" />;

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
      {aula.youtubeId ? (
        <VideoYouTube id={aula.youtubeId} />
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
