import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Cartao, Legenda } from '@/components/ui';
import { montarRelatorio, Relatorio } from '@/lib/relatorio';
import { cores, espaco, fontes } from '@/lib/theme';

/** "Sua travessia até aqui": conquistas e o que ainda está à espera. */
export function RelatorioTravessia({ aoCarregar }: { aoCarregar?: (r: Relatorio) => void }) {
  const [r, setR] = useState<Relatorio | null>(null);
  useEffect(() => {
    montarRelatorio()
      .then((x) => {
        setR(x);
        aoCarregar?.(x);
      })
      .catch(() => setR({ diasDeUso: 0, conquistas: [], espera: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!r) return <ActivityIndicator color={cores.petroleo} style={{ marginVertical: espaco.l }} />;

  return (
    <View style={{ gap: espaco.m }}>
      {r.conquistas.length > 0 ? (
        <Cartao escuro style={{ gap: espaco.m }}>
          <Legenda style={{ color: cores.salvia }}>SUA TRAVESSIA ATÉ AQUI</Legenda>
          <Text style={s.titulo}>
            {r.diasDeUso > 1 ? `Em ${r.diasDeUso} dias de uso, você já:` : 'Você já começou:'}
          </Text>
          {r.conquistas.map((c) => (
            <View key={c.texto} style={s.conquista}>
              <Text style={s.numero}>{c.numero}</Text>
              <Text style={s.texto}>{c.texto}</Text>
            </View>
          ))}
          <Text style={s.nota}>Tudo isso continua guardado. Assinando, você segue exatamente de onde parou.</Text>
        </Cartao>
      ) : (
        <Cartao escuro>
          <Legenda style={{ color: cores.salvia }}>SUA TRAVESSIA</Legenda>
          <Text style={s.titulo}>Sua travessia ainda nem começou de verdade.</Text>
          <Text style={s.nota}>Veja abaixo tudo o que está à sua espera no app.</Text>
        </Cartao>
      )}

      {r.espera.length > 0 && (
        <Cartao>
          <Legenda>AINDA À SUA ESPERA</Legenda>
          {r.espera.map((e) => (
            <View key={e.titulo} style={s.espera}>
              <View style={s.cadeado}>
                <View style={s.argola} />
                <View style={s.corpo} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.esperaTitulo}>{e.titulo}</Text>
                <Text style={s.esperaTexto}>{e.texto}</Text>
              </View>
            </View>
          ))}
        </Cartao>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontFamily: fontes.titulo, fontSize: 22, color: cores.areia, lineHeight: 28 },
  conquista: { flexDirection: 'row', alignItems: 'baseline', gap: espaco.m },
  numero: { fontFamily: fontes.titulo, fontSize: 24, color: cores.ambar, minWidth: 64 },
  texto: { flex: 1, fontFamily: fontes.texto, fontSize: 15, color: cores.areia, lineHeight: 21 },
  nota: { fontFamily: fontes.tituloItalico, fontSize: 15, color: cores.salvia, lineHeight: 22 },
  espera: { flexDirection: 'row', gap: espaco.m, alignItems: 'flex-start', paddingVertical: 4 },
  cadeado: { width: 22, alignItems: 'center', marginTop: 2 },
  argola: { width: 12, height: 9, borderWidth: 2, borderBottomWidth: 0, borderColor: cores.ambarTerra, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  corpo: { width: 18, height: 13, borderRadius: 3, backgroundColor: cores.ambarTerra },
  esperaTitulo: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.petroleo },
  esperaTexto: { fontFamily: fontes.texto, fontSize: 14, color: cores.grafiteSuave, lineHeight: 20 },
});
