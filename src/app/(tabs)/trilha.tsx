import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Cartao, Destaque, Legenda, Progresso, Tela, Texto, Titulo } from '@/components/ui';
import { listarConcluidas } from '@/lib/dados';
import { PILARES, TRILHA } from '@/content/trilha';
import { cores, espaco, fontes } from '@/lib/theme';

export default function Trilha() {
  const [concluidas, setConcluidas] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      listarConcluidas().then(setConcluidas).catch(() => {});
    }, []),
  );

  return (
    <Tela>
      <Titulo>
        A trilha do <Destaque>método</Destaque>
      </Titulo>
      <Cartao escuro onPress={() => router.push('/detox')} rotulo="Abrir a trilha Detox Digital">
        <Legenda style={{ color: cores.ambar }}>TRILHA EM DESTAQUE · 5 DIAS</Legenda>
        <Text style={s.detoxTitulo}>Detox Digital</Text>
        <Text style={s.detoxTexto}>Tire o celular do piloto automático: um ajuste por dia e seu tempo de tela medido.</Text>
        <Text style={s.detoxLink}>Abrir →</Text>
      </Cartao>
      <Texto>
        Quinze estações baseadas no livro GovernaMente, organizadas pelo método C.A.I.A.: Consciência Emocional,
        Autorregulação Estratégica, Inteligência Relacional e Alinhamento e Constância. Uma estação por vez, no seu ritmo.
      </Texto>
      <Progresso valor={concluidas.length / TRILHA.length} />
      <Legenda>
        {concluidas.length} de {TRILHA.length} concluídas
      </Legenda>

      <View style={{ gap: espaco.s }}>
        {TRILHA.map((e) => {
          const feita = concluidas.includes(e.id);
          const pilar = PILARES[e.pilar];
          return (
            <Cartao key={e.id} onPress={() => router.push(`/estacao/${e.id}`)} rotulo={`Estação ${e.numero}: ${e.titulo}`} style={s.linha}>
              <View style={[s.numero, { backgroundColor: feita ? cores.ambar : pilar.cor }]}>
                <Text style={s.numeroTexto}>{feita ? '✓' : e.numero}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.pilar, { color: pilar.cor }]}>{pilar.nome}</Text>
                <Text style={s.titulo}>{e.titulo}</Text>
                <Text style={s.meta}>
                  Cap. {e.capitulo} · {e.minutos} min
                </Text>
              </View>
            </Cartao>
          );
        })}
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  detoxTitulo: { fontFamily: fontes.titulo, fontSize: 22, color: cores.areia },
  detoxTexto: { fontFamily: fontes.texto, fontSize: 15, color: cores.areia, opacity: 0.9, lineHeight: 21 },
  detoxLink: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.ambar },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  numero: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  numeroTexto: { fontFamily: fontes.textoForte, color: cores.areia, fontSize: 16 },
  pilar: { fontFamily: fontes.textoMedio, fontSize: 12, letterSpacing: 0.3 },
  titulo: { fontFamily: fontes.titulo, fontSize: 18, color: cores.petroleo },
  meta: { fontFamily: fontes.texto, fontSize: 13, color: cores.grafiteSuave },
});
