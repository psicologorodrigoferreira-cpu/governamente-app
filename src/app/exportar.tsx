import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Botao, Chip, Legenda, Tela, Texto } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { listarCheckins, listarDiario } from '@/lib/dados';
import { exportarPdf, montarHtmlDiario } from '@/lib/pdf';
import { cores, espaco, fontes } from '@/lib/theme';

const PERIODOS = [
  { dias: 30, rotulo: 'Últimos 30 dias' },
  { dias: 90, rotulo: 'Últimos 3 meses' },
  { dias: 0, rotulo: 'Tudo' },
];

export default function Exportar() {
  const { nome } = useAuth();
  const [dias, setDias] = useState(30);
  const [comCheckins, setComCheckins] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [msg, setMsg] = useState('');

  async function gerar() {
    setGerando(true);
    setMsg('');
    try {
      const desde = dias ? Date.now() - dias * 864e5 : 0;
      const [d, c] = await Promise.all([listarDiario(), comCheckins ? listarCheckins() : Promise.resolve([])]);
      const registros = d.filter((r) => new Date(r.criado_em).getTime() >= desde);
      const checkins = c.filter((x) => new Date(x.criado_em).getTime() >= desde);
      const periodo = PERIODOS.find((p) => p.dias === dias)?.rotulo ?? '';
      await exportarPdf(montarHtmlDiario({ nome, periodo, registros, checkins: comCheckins ? checkins : undefined }));
      setMsg(`PDF gerado com ${registros.length} registro(s).`);
    } catch {
      setMsg('Não foi possível gerar o PDF agora. Tente de novo.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <Tela>
      <Texto>
        Gere um PDF com os seus registros para guardar ou levar ao seu psicólogo. Ele sai do seu celular só quando você escolhe para
        onde enviar.
      </Texto>
      <Legenda>PERÍODO</Legenda>
      <View style={s.chips}>
        {PERIODOS.map((p) => (
          <Chip key={p.dias} rotulo={p.rotulo} ativo={dias === p.dias} onPress={() => setDias(p.dias)} />
        ))}
      </View>
      <View style={s.linha}>
        <Text style={s.rotulo}>Incluir os check-ins semanais</Text>
        <Switch value={comCheckins} onValueChange={setComCheckins} trackColor={{ true: cores.petroleo, false: cores.linha }} thumbColor={cores.branco} />
      </View>
      <Botao titulo="Gerar PDF" onPress={gerar} carregando={gerando} />
      {!!msg && <Text style={s.msg}>{msg}</Text>}
      <Legenda style={{ lineHeight: 18 }}>
        O PDF é um documento pessoal, de uso educacional. Não é prontuário nem laudo.
      </Legenda>
    </Tela>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  rotulo: { flex: 1, fontFamily: fontes.textoMedio, fontSize: 15, color: cores.petroleo },
  msg: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.salviaEscura, textAlign: 'center' },
});
