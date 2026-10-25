import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Botao, Destaque, Legenda, Logo, Tela, Texto, Titulo } from '@/components/ui';
import { salvarPerfil, Perfil } from '@/lib/ferramentas';
import { aplicarLembretes, lerConfig, LEMBRETES_DISPONIVEIS, pedirPermissao, salvarConfig } from '@/lib/lembretes';
import { useAuth } from '@/lib/auth';
import { estacaoPorId } from '@/content/trilha';
import { cores, espaco, fontes, raio } from '@/lib/theme';

const FOCOS = [
  { id: 'ansiedade', rotulo: 'Ansiedade e pressão por resultado', estacao: 'ansiedade' },
  { id: 'impulso', rotulo: 'Decisões no impulso, reações que me arrependo', estacao: 'autorregulacao' },
  { id: 'equipe', rotulo: 'Relação com equipe, sócios ou clientes', estacao: 'relacional' },
  { id: 'cansaco', rotulo: 'Cansaço, sensação de esgotamento', estacao: 'burnout' },
  { id: 'tempo', rotulo: 'Falta de tempo e de prioridades', estacao: 'tempo' },
  { id: 'constancia', rotulo: 'Começo bem, mas não mantenho', estacao: 'alinhamento' },
];
const MINUTOS = [5, 10, 15];
const PERIODOS = [
  { id: 'manha', rotulo: 'De manhã', hora: 8, minuto: 0 },
  { id: 'tarde', rotulo: 'Na hora do almoço', hora: 12, minuto: 30 },
  { id: 'noite', rotulo: 'À noite', hora: 20, minuto: 30 },
] as const;

export default function PrimeirosPassos() {
  const { nome, acesso } = useAuth();
  const [passo, setPasso] = useState(0);
  const [foco, setFoco] = useState<string | null>(null);
  const [minutos, setMinutos] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<Perfil['periodo'] | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function concluir() {
    if (!foco || !minutos || !periodo) return;
    setSalvando(true);
    const estacao = FOCOS.find((f) => f.id === foco)!.estacao;
    try {
      await salvarPerfil({ foco, minutos, periodo, estacao_sugerida: estacao });
      if (LEMBRETES_DISPONIVEIS) {
        const p = PERIODOS.find((x) => x.id === periodo)!;
        const c = await lerConfig();
        const nova = { ...c, pratica: { ativo: true, hora: p.hora, minuto: p.minuto } };
        await salvarConfig(nova);
        if (await pedirPermissao()) await aplicarLembretes(nova, acesso);
      }
    } catch {
      /* segue mesmo assim: as respostas podem ser refeitas depois */
    }
    setSalvando(false);
    router.replace(`/estacao/${estacao}`);
  }

  const primeiro = nome.split(' ')[0];

  return (
    <Tela semApoio>
      <View style={{ alignItems: 'center', marginTop: espaco.l }}>
        <Logo size={48} />
      </View>
      <Legenda style={{ textAlign: 'center' }}>PRIMEIROS PASSOS · {passo + 1} DE 3</Legenda>

      {passo === 0 && (
        <>
          <Titulo>
            {primeiro ? `${primeiro}, o` : 'O'} que mais tem <Destaque>pesado</Destaque> para você hoje?
          </Titulo>
          <Texto style={{ color: cores.grafiteSuave }}>Escolha uma opção. Ela indica por onde começar a trilha.</Texto>
          {FOCOS.map((f) => (
            <Opcao key={f.id} rotulo={f.rotulo} ativo={foco === f.id} onPress={() => setFoco(f.id)} />
          ))}
          <Botao titulo="Continuar" desativado={!foco} onPress={() => setPasso(1)} />
        </>
      )}

      {passo === 1 && (
        <>
          <Titulo>
            Quanto tempo por dia você <Destaque>consegue</Destaque> dedicar?
          </Titulo>
          <Texto style={{ color: cores.grafiteSuave }}>Pouco e todo dia vale mais que muito de vez em quando.</Texto>
          {MINUTOS.map((m) => (
            <Opcao key={m} rotulo={`${m} minutos`} ativo={minutos === m} onPress={() => setMinutos(m)} />
          ))}
          <Botao titulo="Continuar" desativado={!minutos} onPress={() => setPasso(2)} />
          <Botao variante="texto" titulo="Voltar" onPress={() => setPasso(0)} />
        </>
      )}

      {passo === 2 && (
        <>
          <Titulo>
            Qual o melhor <Destaque>momento</Destaque> para o seu lembrete?
          </Titulo>
          <Texto style={{ color: cores.grafiteSuave }}>
            Uma vez por dia, com uma prática curta do livro. Você muda isso quando quiser, em Conta → Lembretes.
          </Texto>
          {PERIODOS.map((p) => (
            <Opcao key={p.id} rotulo={p.rotulo} ativo={periodo === p.id} onPress={() => setPeriodo(p.id)} />
          ))}
          {foco && (
            <Legenda style={{ textAlign: 'center' }}>
              Você vai começar pela estação “{estacaoPorId(FOCOS.find((f) => f.id === foco)!.estacao)?.titulo}”.
            </Legenda>
          )}
          <Botao titulo="Começar" desativado={!periodo} carregando={salvando} onPress={concluir} />
          <Botao variante="texto" titulo="Voltar" onPress={() => setPasso(1)} />
        </>
      )}
    </Tela>
  );
}

function Opcao({ rotulo, ativo, onPress }: { rotulo: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: ativo }}
      onPress={onPress}
      style={[s.opcao, ativo && s.opcaoAtiva]}
    >
      <Text style={[s.opcaoTexto, ativo && { color: cores.areia }]}>{rotulo}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  opcao: {
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.areiaClara,
    borderRadius: raio.m,
    paddingVertical: 14,
    paddingHorizontal: espaco.m,
  },
  opcaoAtiva: { backgroundColor: cores.petroleo, borderColor: cores.petroleo },
  opcaoTexto: { fontFamily: fontes.textoMedio, fontSize: 16, color: cores.petroleo },
});
