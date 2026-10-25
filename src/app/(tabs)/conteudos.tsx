import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { Botao, Cartao, Destaque, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { CAMINHOS, Item } from '@/content/ecossistema';
import { AulaApp, listarAulas } from '@/lib/admin';
import { useAuth } from '@/lib/auth';
import { podeVerAulas } from '@/lib/assinatura';
import { cores, espaco, fontes } from '@/lib/theme';

export default function Conteudos() {
  const { acesso } = useAuth();
  const liberado = podeVerAulas(acesso);
  const [aulas, setAulas] = useState<AulaApp[]>([]);
  const carregarAulas = useCallback(() => {
    listarAulas().then(setAulas).catch(() => {});
  }, []);
  useFocusEffect(carregarAulas);
  // Ao assinar, o vídeo passa a vir junto: recarrega.
  useEffect(carregarAulas, [carregarAulas, acesso]);

  return (
    <Tela>
      <Titulo>
        Aulas e <Destaque>caminhos</Destaque>
      </Titulo>

      <Subtitulo>Aulas</Subtitulo>
      {!liberado && (
        <Cartao escuro>
          <Text style={s.tituloEscuro}>As aulas são exclusivas para assinantes</Text>
          <Text style={s.textoEscuro}>
            No teste grátis você usa a trilha, o diário, a roda e o check-in. Assine para assistir às aulas.
          </Text>
          <Botao titulo="Ver planos" onPress={() => router.push('/assinar')} style={{ backgroundColor: cores.ambar }} corTexto={cores.petroleoProfundo} />
        </Cartao>
      )}
      {aulas.map((a) => (
        <Cartao
          key={a.id}
          onPress={() => router.push(liberado ? `/aula/${a.id}` : '/assinar')}
          rotulo={liberado ? `Aula: ${a.titulo}` : `Aula bloqueada: ${a.titulo}. Assine para liberar.`}
          style={s.aula}
        >
          <View style={[s.miniatura, !liberado && { backgroundColor: cores.grafiteSuave }]}>
            {liberado ? <IconePlay /> : <IconeCadeado />}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Legenda>{a.modulo.toUpperCase()}</Legenda>
            <Text style={[s.tituloAula, !liberado && { color: cores.grafiteSuave }]}>{a.titulo}</Text>
            <Text style={s.meta}>{!a.tem_video ? 'Em breve' : a.minutos ? `${a.minutos} min` : 'Vídeo'}</Text>
          </View>
        </Cartao>
      ))}

      <Subtitulo style={{ marginTop: espaco.m }}>Ecossistema GovernaMente</Subtitulo>
      <Texto style={{ color: cores.grafiteSuave }}>
        Quando quiser ir além do app: comunidade, acompanhamento individual, aula e livro.
      </Texto>
      {CAMINHOS.map((c) => (
        <Link key={c.url} item={c} />
      ))}
    </Tela>
  );
}

function IconePlay() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M8 5.5v13l10-6.5z" fill={cores.areia} />
    </Svg>
  );
}
function IconeCadeado() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x={5} y={10.5} width={14} height={10} rx={2} fill={cores.areia} />
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={cores.areia} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function Link({ item }: { item: Item }) {
  return (
    <Cartao onPress={() => Linking.openURL(item.url)} rotulo={`${item.titulo}. Abre no navegador.`}>
      <View style={s.linha}>
        <Text style={s.titulo}>{item.titulo}</Text>
        {item.selo && <Text style={s.selo}>{item.selo}</Text>}
      </View>
      <Texto style={{ color: cores.grafiteSuave }}>{item.descricao}</Texto>
      <Legenda style={{ color: cores.ambarTerra }}>Abrir ↗</Legenda>
    </Cartao>
  );
}

const s = StyleSheet.create({
  tituloEscuro: { fontFamily: fontes.titulo, fontSize: 20, color: cores.areia },
  textoEscuro: { fontFamily: fontes.texto, fontSize: 15, color: cores.areia, opacity: 0.85, lineHeight: 22 },
  aula: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  miniatura: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: cores.petroleo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloAula: { fontFamily: fontes.titulo, fontSize: 17, color: cores.petroleo },
  meta: { fontFamily: fontes.texto, fontSize: 13, color: cores.grafiteSuave },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titulo: { fontFamily: fontes.titulo, fontSize: 18, color: cores.petroleo, flex: 1 },
  selo: {
    fontFamily: fontes.textoForte,
    fontSize: 11,
    color: cores.petroleo,
    backgroundColor: cores.salvia,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
});
