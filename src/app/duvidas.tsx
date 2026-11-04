import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, TextInput, View } from 'react-native';
import { Botao, Legenda, LinkApoio, Texto } from '@/components/ui';
import { VideoYouTube } from '@/components/Video';
import { Duvida, DUVIDAS, PLAYLIST_FAQ_PADRAO } from '@/content/duvidas';
import { lerConfiguracoes } from '@/lib/ecossistema';
import { CODIGO_DISPONIVEL } from '@/lib/assinatura';
import { cores, espaco, fontes, raio } from '@/lib/theme';

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Aceita o id da playlist ou o link inteiro colado no painel. */
function idDaPlaylist(valor?: string) {
  const v = (valor ?? '').trim();
  if (!v) return PLAYLIST_FAQ_PADRAO;
  const doLink = v.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return doLink ? doLink[1] : v;
}

// Dúvidas frequentes: liberado para todos, inclusive no teste grátis e sem assinatura.
export default function Duvidas() {
  const [playlist, setPlaylist] = useState(PLAYLIST_FAQ_PADRAO);
  const [atual, setAtual] = useState<Duvida | null>(null);
  const [busca, setBusca] = useState('');
  const rolagem = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    lerConfiguracoes()
      .then((c) => setPlaylist(idDaPlaylist(c.faq_playlist)))
      .catch(() => {});
  }, []);

  const grupos = useMemo(() => {
    const q = semAcento(busca.trim());
    // Nas lojas não há resgate de código (App Store 3.1.1): o vídeo sobre isso só aparece na web.
    const base = CODIGO_DISPONIVEL ? DUVIDAS : DUVIDAS.map((g) => ({ ...g, itens: g.itens.filter((d) => d.n !== 40) }));
    if (!q) return base;
    return base.map((g) => ({
      ...g,
      itens: g.itens.filter((d) => semAcento(`${d.titulo} ${d.busca ?? ''} ${g.nome}`).includes(q)),
    })).filter((g) => g.itens.length > 0);
  }, [busca]);

  function abrir(d: Duvida) {
    setAtual(d);
    rolagem.current?.scrollTo({ y: 0, animated: true });
  }

  const idVideo = atual?.video ?? `playlist:${playlist}`;
  const linkYouTube = atual?.video
    ? `https://www.youtube.com/watch?v=${atual.video}&list=${playlist}`
    : `https://www.youtube.com/playlist?list=${playlist}`;

  return (
    <ScrollView ref={rolagem} style={{ flex: 1, backgroundColor: cores.areia }} keyboardShouldPersistTaps="handled">
      <View style={s.corpo}>
        <VideoYouTube id={idVideo} titulo={atual ? `Dúvida: ${atual.titulo}` : 'Dúvidas frequentes do App GovernaMente'} />
        <View style={{ gap: 2 }}>
          <Legenda>{atual ? `VÍDEO ${atual.n}` : 'PLAYLIST COMPLETA'}</Legenda>
          <Text style={s.tituloVideo}>{atual ? atual.titulo : 'Todas as dúvidas, em ordem'}</Text>
          {atual && !atual.video && <Legenda>Este vídeo ainda está chegando. Enquanto isso, a playlist completa toca acima.</Legenda>}
          {!atual && <Legenda>No vídeo, toque no ícone de lista para pular para outro tema.</Legenda>}
        </View>
        <View style={s.acoes}>
          {atual && <Botao variante="secundario" titulo="Ver a playlist completa" onPress={() => setAtual(null)} style={{ flex: 1 }} />}
          <Botao variante="texto" titulo="Abrir no YouTube" onPress={() => Linking.openURL(linkYouTube)} style={{ flex: 1 }} />
        </View>

        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar uma dúvida (ex.: diário, assinatura)"
          placeholderTextColor={cores.grafiteSuave}
          accessibilityLabel="Buscar uma dúvida"
          style={s.busca}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />

        {grupos.length === 0 && (
          <Texto style={{ color: cores.grafiteSuave }}>Nenhum vídeo com esse termo. Tente outra palavra ou fale com a gente abaixo.</Texto>
        )}

        {grupos.map((g) => (
          <View key={g.nome} style={{ gap: espaco.s }}>
            <Text style={s.grupo}>{g.nome}</Text>
            <View style={s.lista}>
              {g.itens.map((d, i) => {
                const ativo = atual?.n === d.n;
                return (
                  <Pressable
                    key={d.n}
                    accessibilityRole="button"
                    accessibilityLabel={`Assistir: ${d.titulo}`}
                    accessibilityState={{ selected: ativo }}
                    onPress={() => abrir(d)}
                    style={({ pressed }) => [s.item, i > 0 && s.itemBorda, ativo && s.itemAtivo, pressed && { opacity: 0.8 }]}
                  >
                    <View style={[s.play, ativo && { backgroundColor: cores.ambar }]}>
                      <Text style={[s.playIcone, ativo && { color: cores.petroleo }]}>▶</Text>
                    </View>
                    <Text style={s.itemTexto}>{d.titulo}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={s.fale}>
          <Text style={s.grupo}>Não encontrou o que procurava?</Text>
          <Texto style={{ fontSize: 15 }}>Mande sua dúvida. Ela pode virar o próximo vídeo da playlist.</Texto>
          <Botao
            variante="secundario"
            titulo="Enviar minha dúvida"
            onPress={() => Linking.openURL('mailto:psicologorodrigoferreira@gmail.com?subject=D%C3%BAvida%20sobre%20o%20App%20GovernaMente')}
          />
        </View>
        <LinkApoio />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  corpo: { padding: espaco.m, paddingBottom: espaco.xl, gap: espaco.m },
  tituloVideo: { fontFamily: fontes.titulo, fontSize: 20, color: cores.petroleo, lineHeight: 26 },
  acoes: { flexDirection: 'row', gap: espaco.s, alignItems: 'center' },
  busca: {
    backgroundColor: cores.branco,
    borderRadius: raio.pill,
    borderWidth: 1,
    borderColor: cores.linha,
    paddingHorizontal: espaco.m,
    paddingVertical: 12,
    fontFamily: fontes.texto,
    fontSize: 15,
    color: cores.grafite,
  },
  grupo: { fontFamily: fontes.textoForte, fontSize: 13, letterSpacing: 0.4, color: cores.salviaEscura, textTransform: 'uppercase' },
  lista: { backgroundColor: cores.areiaClara, borderRadius: raio.m, borderWidth: 1, borderColor: cores.linha, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, paddingVertical: 12, paddingHorizontal: espaco.m, minHeight: 52 },
  itemBorda: { borderTopWidth: 1, borderTopColor: cores.linha },
  itemAtivo: { backgroundColor: '#FBF1E1' },
  play: { width: 30, height: 30, borderRadius: 15, backgroundColor: cores.petroleo, alignItems: 'center', justifyContent: 'center' },
  playIcone: { color: cores.areia, fontSize: 11, marginLeft: 2 },
  itemTexto: { flex: 1, fontFamily: fontes.textoMedio, fontSize: 15, color: cores.grafite, lineHeight: 21 },
  fale: { gap: espaco.s, marginTop: espaco.s },
});
