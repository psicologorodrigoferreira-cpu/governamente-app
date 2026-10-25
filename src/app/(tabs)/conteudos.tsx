import { Linking, StyleSheet, Text, View } from 'react-native';
import { Cartao, Destaque, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { AULAS, CAMINHOS, Item } from '@/content/ecossistema';
import { cores, fontes } from '@/lib/theme';

export default function Conteudos() {
  return (
    <Tela>
      <Titulo>
        Conteúdos e <Destaque>caminhos</Destaque>
      </Titulo>
      <Subtitulo>Aulas</Subtitulo>
      {AULAS.map((a) => (
        <Link key={a.url} item={a} />
      ))}
      <Subtitulo>Ecossistema GovernaMente</Subtitulo>
      <Texto style={{ color: cores.grafiteSuave }}>
        Quando quiser ir além do app: comunidade, acompanhamento individual, aula e livro.
      </Texto>
      {CAMINHOS.map((c) => (
        <Link key={c.url} item={c} />
      ))}
    </Tela>
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
