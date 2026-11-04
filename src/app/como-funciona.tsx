import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Botao, Destaque, Legenda, Logo, Tela, Texto, Titulo } from '@/components/ui';
import { VideoYouTube } from '@/components/Video';
import { CHAVE_VIU_TOUR, TOUR } from '@/content/comoFunciona';
import { gravarLocal, lerLocal } from '@/lib/dados';
import { CHAVE_PULOU_TRIAGEM, lerPerfil } from '@/lib/ferramentas';
import { lerConfiguracoes } from '@/lib/ecossistema';
import { cores, espaco, fontes, raio } from '@/lib/theme';

/**
 * Tour "Como o método funciona". No primeiro acesso o Início abre esta tela;
 * ao terminar, segue para os primeiros passos (se ainda não feitos).
 * Com ?rever=1 (aberto pelo Início ou por Conta), só volta.
 */
export default function ComoFunciona() {
  const { rever } = useLocalSearchParams<{ rever?: string }>();
  const [i, setI] = useState(0);
  const [video, setVideo] = useState<string | null>(null);
  const t = TOUR[i];
  const ultima = i === TOUR.length - 1;

  // Vídeo de boas-vindas opcional, escolhido no Painel (chave "video_como_funciona").
  useEffect(() => {
    lerConfiguracoes()
      .then((c) => setVideo(c.video_como_funciona?.trim() || null))
      .catch(() => {});
  }, []);

  async function terminar() {
    await gravarLocal(CHAVE_VIU_TOUR, true).catch(() => {});
    if (rever) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
      return;
    }
    const [perfil, pulou] = await Promise.all([lerPerfil().catch(() => null), lerLocal(CHAVE_PULOU_TRIAGEM, false)]);
    router.replace(!perfil && !pulou ? '/primeiros-passos' : '/(tabs)');
  }

  return (
    <Tela semApoio={!rever}>
      {!rever && (
        <View style={{ alignItems: 'center', marginTop: espaco.l }}>
          <Logo size={44} />
        </View>
      )}
      <View style={s.pontos} accessible accessibilityLabel={`Parte ${i + 1} de ${TOUR.length}`}>
        {TOUR.map((_, k) => (
          <View key={k} style={[s.ponto, k <= i && s.pontoAtivo]} />
        ))}
      </View>
      <Legenda style={{ textAlign: 'center' }}>
        COMO O MÉTODO FUNCIONA · {i + 1} DE {TOUR.length}
      </Legenda>

      <Legenda style={{ color: cores.ambarTerra }}>{t.rotulo}</Legenda>
      <Titulo>
        {t.titulo} <Destaque>{t.destaque}</Destaque>
      </Titulo>
      {i === 0 && video && <VideoYouTube id={video} titulo="Boas-vindas ao App GovernaMente" />}
      <Texto>{t.texto}</Texto>

      {t.itens?.map((it, k) => (
        <View key={k} style={s.item}>
          <View style={s.marca}>
            <Text style={s.marcaTexto}>{it.marca}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.itemTitulo}>{it.titulo}</Text>
            <Text style={s.itemTexto}>{it.texto}</Text>
          </View>
        </View>
      ))}

      <Botao titulo={ultima ? (rever ? 'Entendi' : 'Começar') : 'Continuar'} onPress={ultima ? terminar : () => setI(i + 1)} />
      {i > 0 && <Botao variante="texto" titulo="Voltar" onPress={() => setI(i - 1)} />}
      {!ultima && <Botao variante="texto" titulo={rever ? 'Fechar' : 'Pular o guia'} onPress={terminar} />}
    </Tela>
  );
}

const s = StyleSheet.create({
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  ponto: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: cores.linha,
  },
  pontoAtivo: { backgroundColor: cores.ambar },
  item: {
    flexDirection: 'row',
    gap: espaco.m,
    alignItems: 'flex-start',
    backgroundColor: cores.areiaClara,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: espaco.m,
  },
  marca: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: cores.petroleo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaTexto: { fontFamily: fontes.titulo, fontSize: 17, color: cores.ambar },
  itemTitulo: {
    fontFamily: fontes.textoForte,
    fontSize: 15,
    color: cores.petroleo,
  },
  itemTexto: {
    fontFamily: fontes.texto,
    fontSize: 14,
    color: cores.grafite,
    lineHeight: 20,
  },
});
