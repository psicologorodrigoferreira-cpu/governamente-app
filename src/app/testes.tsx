import { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Cartao, Destaque, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { CATEGORIAS, TESTES } from '@/content/testes';
import { listarResultados, ResultadoSalvo } from '@/lib/ecossistema';
import { cores, espaco, fontes } from '@/lib/theme';

export default function Testes() {
  const [resultados, setResultados] = useState<ResultadoSalvo[]>([]);
  useFocusEffect(
    useCallback(() => {
      listarResultados().then(setResultados).catch(() => {});
    }, []),
  );
  const ultimo = (id: string) => resultados.find((r) => r.teste_id === id);

  return (
    <Tela>
      <Titulo>
        Testes de <Destaque>autoconhecimento</Destaque>
      </Titulo>
      <Texto>
        Retratos do seu momento, com o resultado na hora e guardado só para você. São instrumentos de reflexão, não diagnóstico.
      </Texto>

      {CATEGORIAS.map((c) => {
        const lista = TESTES.filter((t) => t.categoria === c.id);
        if (lista.length === 0) return null;
        return (
          <View key={c.id} style={{ gap: espaco.s }}>
            <Subtitulo>{c.nome}</Subtitulo>
            {lista.map((t) => {
              const r = ultimo(t.id);
              return (
                <Cartao key={t.id} onPress={() => router.push(`/teste/${t.id}`)} rotulo={`${t.titulo}, ${t.tempo}`}>
                  <View style={s.linha}>
                    <Text style={s.titulo}>{t.titulo}</Text>
                    <Legenda>{t.tempo}</Legenda>
                  </View>
                  <Texto style={{ color: cores.grafiteSuave, fontSize: 14, lineHeight: 20 }}>{t.resumo}</Texto>
                  {r && (
                    <Text style={s.feito}>
                      Feito em {new Date(r.criado_em).toLocaleDateString('pt-BR')} · {r.resultado.titulo}
                    </Text>
                  )}
                </Cartao>
              );
            })}
          </View>
        );
      })}

      <Cartao>
        <Subtitulo>Outros testes</Subtitulo>
        <Texto style={{ color: cores.grafiteSuave }}>
          Os demais testes de exploração clínica e as atividades cronometradas (atenção, memória, raciocínio) ficam no portal, onde o
          resultado é acompanhado pelo psicólogo.
        </Texto>
        <Text style={s.link} onPress={() => Linking.openURL('https://portal.governamente.com.br/testes')}>
          Abrir o portal de testes ↗
        </Text>
      </Cartao>
    </Tela>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  titulo: { flex: 1, fontFamily: fontes.titulo, fontSize: 18, color: cores.petroleo },
  feito: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.salviaEscura },
  link: { fontFamily: fontes.textoForte, fontSize: 14, color: cores.ambarTerra },
});
