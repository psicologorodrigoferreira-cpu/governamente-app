import React from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

/** Player do YouTube (modo de privacidade aprimorada) dentro do app. */
export function VideoYouTube({ id }: { id: string }) {
  const url = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1`;
  return (
    <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
      {Platform.OS === 'web' ? (
        React.createElement('iframe', {
          src: url,
          title: 'Aula em vídeo',
          style: { width: '100%', height: '100%', border: 0 },
          allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen',
          allowFullScreen: true,
        })
      ) : (
        <WebView
          source={{ uri: url }}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          style={{ flex: 1, backgroundColor: '#000' }}
        />
      )}
    </View>
  );
}
