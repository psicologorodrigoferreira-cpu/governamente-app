import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Botao, Cartao, Legenda, Tela, Texto } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  aplicarLembretes,
  ConfigLembretes,
  lerConfig,
  LEMBRETES_DISPONIVEIS,
  PADRAO,
  pedirPermissao,
  salvarConfig,
} from '@/lib/lembretes';
import { cores, espaco, fontes } from '@/lib/theme';

const HORARIOS = [
  [7, 0],
  [8, 0],
  [9, 0],
  [12, 30],
  [18, 0],
  [20, 30],
  [21, 30],
] as const;
const fmt = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

export default function Lembretes() {
  const { acesso } = useAuth();
  const [c, setC] = useState<ConfigLembretes>(PADRAO);
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    lerConfig().then(setC);
  }, []);

  async function salvar() {
    const ok = await pedirPermissao();
    setPermitido(ok);
    await salvarConfig(c);
    if (ok) await aplicarLembretes(c, acesso);
    setSalvo(true);
  }

  if (!LEMBRETES_DISPONIVEIS) {
    return (
      <Tela>
        <Texto>Os lembretes funcionam no app instalado no celular (iPhone ou Android).</Texto>
      </Tela>
    );
  }

  const mudar = (novo: ConfigLembretes) => {
    setC(novo);
    setSalvo(false);
  };

  return (
    <Tela>
      <Texto>Pequenos avisos para manter a constância. Nada de excesso: no máximo um por dia de cada tipo.</Texto>

      <Linha
        titulo="Prática do dia"
        texto="Uma prática curta do livro, diferente a cada dia da semana."
        ativo={c.pratica.ativo}
        onChange={(v) => mudar({ ...c, pratica: { ...c.pratica, ativo: v } })}
      >
        <Horarios
          hora={c.pratica.hora}
          minuto={c.pratica.minuto}
          onChange={(hora, minuto) => mudar({ ...c, pratica: { ...c.pratica, hora, minuto } })}
        />
      </Linha>

      <Linha
        titulo="Diário das Emoções"
        texto="Um convite para registrar uma situação do dia."
        ativo={c.diario.ativo}
        onChange={(v) => mudar({ ...c, diario: { ...c.diario, ativo: v } })}
      >
        <Horarios
          hora={c.diario.hora}
          minuto={c.diario.minuto}
          onChange={(hora, minuto) => mudar({ ...c, diario: { ...c.diario, hora, minuto } })}
        />
      </Linha>

      <Linha
        titulo="Check-in da semana"
        texto="Domingo, às 10h."
        ativo={c.checkin.ativo}
        onChange={(v) => mudar({ ...c, checkin: { ativo: v } })}
      />

      <Linha
        titulo="Fim do teste grátis"
        texto="Avisos 2 dias antes e no último dia."
        ativo={c.teste.ativo}
        onChange={(v) => mudar({ ...c, teste: { ativo: v } })}
      />

      <Botao titulo={salvo ? 'Lembretes salvos ✓' : 'Salvar lembretes'} onPress={salvar} />
      {permitido === false && (
        <Cartao>
          <Texto>As notificações estão desligadas para o GovernaMente. Ative nos ajustes do celular.</Texto>
          <Botao variante="secundario" titulo="Abrir ajustes" onPress={() => Linking.openSettings()} />
        </Cartao>
      )}
    </Tela>
  );
}

function Linha({
  titulo,
  texto,
  ativo,
  onChange,
  children,
}: {
  titulo: string;
  texto: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <Cartao>
      <View style={s.linha}>
        <View style={{ flex: 1 }}>
          <Text style={s.titulo}>{titulo}</Text>
          <Legenda>{texto}</Legenda>
        </View>
        <Switch
          accessibilityLabel={titulo}
          value={ativo}
          onValueChange={onChange}
          trackColor={{ true: cores.petroleo, false: cores.linha }}
          thumbColor={cores.branco}
        />
      </View>
      {ativo && children}
    </Cartao>
  );
}

function Horarios({ hora, minuto, onChange }: { hora: number; minuto: number; onChange: (h: number, m: number) => void }) {
  return (
    <View style={s.horarios}>
      {HORARIOS.map(([h, m]) => {
        const sel = h === hora && m === minuto;
        return (
          <Pressable
            key={`${h}${m}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel }}
            onPress={() => onChange(h, m)}
            style={[s.hora, sel && s.horaSel]}
          >
            <Text style={[s.horaTexto, sel && { color: cores.areia }]}>{fmt(h, m)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  titulo: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.petroleo },
  horarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  hora: { borderWidth: 1, borderColor: cores.linha, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: cores.branco },
  horaSel: { backgroundColor: cores.petroleo, borderColor: cores.petroleo },
  horaTexto: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.petroleo },
});
