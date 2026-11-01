import React from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Player do YouTube (modo de privacidade aprimorada) dentro do app.
 *
 * O YouTube recusa vídeos incorporados que não dizem de qual site vêm
 * (erro 153, "erro de configuração do player"). No celular, o vídeo fica
 * dentro de uma pequena página com endereço base do app, que envia o
 * Referer e o parâmetro origin corretos.
 */
const ORIGEM = 'https://app.governamente.com.br';

function urlDoVideo(id: string) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    origin: ORIGEM,
    widget_referrer: ORIGEM,
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

function paginaDoVideo(id: string) {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head><body>
<iframe src="${urlDoVideo(id)}" title="Aula em vídeo"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
  referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</body></html>`;
}

export function VideoYouTube({ id }: { id: string }) {
  return (
    <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
      {Platform.OS === 'web' ? (
        React.createElement('iframe', {
          src: urlDoVideo(id),
          title: 'Aula em vídeo',
          style: { width: '100%', height: '100%', border: 0 },
          allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen',
          referrerPolicy: 'strict-origin-when-cross-origin',
          allowFullScreen: true,
        })
      ) : (
        <WebView
          source={{ html: paginaDoVideo(id), baseUrl: ORIGEM }}
          originWhitelist={['*']}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          style={{ flex: 1, backgroundColor: '#000' }}
        />
      )}
    </View>
  );
}
