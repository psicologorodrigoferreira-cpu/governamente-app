import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Botao, Campo, Cartao, Chip, Destaque, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { Constancia, diaDeHoje, lerConstancia, marcarDiaConstancia, salvarConstancia, sequencia } from '@/lib/ferramentas';
import { cores, espaco, fontes } from '@/lib/theme';

// Cap. 12 do livro: associar o hábito novo a uma rotina que você já tem.
const ANCORAS = ['Depois do café da manhã', 'Ao chegar no trabalho', 'Depois do almoço', 'Antes de dormir'];
const PRATICAS = ['Três gratidões', 'Respiro 4–6', 'Cinco minutos de meditação', 'Um registro no diário'];

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ConstanciaTela() {
  const [plano, setPlano] = useState<Constancia | null>(null);
  const [dias, setDias] = useState<string[]>([]);
  const [editando, setEditando] = useState(false);
  const [ancora, setAncora] = useState('');
  const [pratica, setPratica] = useState('');
  const [carregado, setCarregado] = useState(false);

  const carregar = useCallback(() => {
    lerConstancia()
      .then(({ plano: p, dias: d }) => {
        setPlano(p);
        setDias(d);
        if (p) {
          setAncora(p.ancora);
          setPratica(p.pratica);
        }
      })
      .catch(() => {})
      .finally(() => setCarregado(true));
  }, []);
  useFocusEffect(carregar);

  async function salvar() {
    if (!ancora.trim() || !pratica.trim()) return;
    try {
      await salvarConstancia({ ancora: ancora.trim(), pratica: pratica.trim() });
      setEditando(false);
      carregar();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    }
  }

  async function marcar() {
    const feito = !dias.includes(diaDeHoje());
    try {
      await marcarDiaConstancia(feito);
      carregar();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente de novo.');
    }
  }

  if (!carregado) return <Tela>{null}</Tela>;

  if (!plano || editando) {
    return (
      <Tela>
        <Titulo>
          Um hábito <Destaque>pequeno</Destaque>, todo dia
        </Titulo>
        <Texto>Escolha uma rotina que você já tem (a âncora) e prenda nela uma prática curta. Assim a mudança não pesa.</Texto>
        <Campo rotulo="Âncora: logo depois de…" value={ancora} onChangeText={setAncora} maxLength={200} placeholder="Ex.: depois do café da manhã" />
        <View style={s.chips}>
          {ANCORAS.map((a) => (
            <Chip key={a} rotulo={a} ativo={ancora === a} onPress={() => setAncora(a)} />
          ))}
        </View>
        <Campo rotulo="Prática: eu faço…" value={pratica} onChangeText={setPratica} maxLength={200} placeholder="Ex.: três gratidões" />
        <View style={s.chips}>
          {PRATICAS.map((p) => (
            <Chip key={p} rotulo={p} ativo={pratica === p} onPress={() => setPratica(p)} />
          ))}
        </View>
        <Botao titulo="Salvar meu plano" onPress={salvar} desativado={!ancora.trim() || !pratica.trim()} />
        {plano && <Botao variante="texto" titulo="Cancelar" onPress={() => setEditando(false)} />}
      </Tela>
    );
  }

  const feitoHoje = dias.includes(diaDeHoje());
  const seq = sequencia(dias);
  const ultimos = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return { dia: fmt(d), letra: d.toLocaleDateString('pt-BR', { weekday: 'narrow' }) };
  });

  return (
    <Tela>
      <Cartao escuro>
        <Legenda style={{ color: cores.salvia }}>MEU PLANO DE CONSTÂNCIA</Legenda>
        <Text style={s.plano}>
          {plano.ancora}, eu faço: <Text style={{ color: cores.ambar }}>{plano.pratica.toLowerCase()}</Text>.
        </Text>
      </Cartao>

      <Botao titulo={feitoHoje ? 'Feito hoje ✓ (toque para desfazer)' : 'Marquei hoje'} onPress={marcar} />

      <View style={{ alignItems: 'center' }}>
        <Text style={s.numero}>{seq}</Text>
        <Legenda>{seq === 1 ? 'dia seguido' : 'dias seguidos'}</Legenda>
      </View>

      <Subtitulo>Últimas duas semanas</Subtitulo>
      <View style={s.dias}>
        {ultimos.map((u) => {
          const ok = dias.includes(u.dia);
          return (
            <View key={u.dia} style={s.diaCol} accessibilityLabel={`${u.dia}: ${ok ? 'feito' : 'não feito'}`}>
              <View style={[s.bolinha, ok && s.bolinhaOk]} />
              <Text style={s.letra}>{u.letra}</Text>
            </View>
          );
        })}
      </View>
      <Texto style={{ color: cores.grafiteSuave }}>
        Falhou um dia? Faz parte. O livro lembra: se perdoe e volte no dia seguinte. Constância não é perfeição.
      </Texto>
      <Botao variante="texto" titulo="Mudar meu plano" onPress={() => setEditando(true)} />
    </Tela>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8, marginBottom: espaco.s },
  plano: { fontFamily: fontes.titulo, fontSize: 21, color: cores.areia, lineHeight: 28 },
  numero: { fontFamily: fontes.titulo, fontSize: 56, color: cores.petroleo },
  dias: { flexDirection: 'row', justifyContent: 'space-between' },
  diaCol: { alignItems: 'center', gap: 4 },
  bolinha: { width: 18, height: 18, borderRadius: 9, backgroundColor: cores.linha },
  bolinhaOk: { backgroundColor: cores.ambar },
  letra: { fontFamily: fontes.texto, fontSize: 11, color: cores.grafiteSuave },
});
