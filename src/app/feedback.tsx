import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Botao, Campo, Cartao, Chip, Destaque, Legenda, Logo, Tela, Texto, Titulo } from '@/components/ui';
import { CANAL_WHATSAPP, DIAS_USO, FACILIDADE, FUNCOES, PRECO } from '@/content/feedback';
import { supabase } from '@/lib/supabase';
import { cores, espaco, fontes } from '@/lib/theme';

// Formulário de feedback dos testadores. Aberto para qualquer pessoa, sem login:
// app.governamente.com.br/feedback (aceita ?nome=Fulano para já vir preenchido).
export default function Feedback() {
  const { nome: nomeLink } = useLocalSearchParams<{ nome?: string }>();
  const [nome, setNome] = useState(typeof nomeLink === 'string' ? nomeLink : '');
  const [contato, setContato] = useState('');
  const [aparelho, setAparelho] = useState('');
  const [dias, setDias] = useState('');
  const [nota, setNota] = useState<number | null>(null);
  const [facilidade, setFacilidade] = useState<number | null>(null);
  const [favoritas, setFavoritas] = useState<string[]>([]);
  const [confuso, setConfuso] = useState('');
  const [teveErro, setTeveErro] = useState<boolean | null>(null);
  const [erro, setErro] = useState('');
  const [falta, setFalta] = useState('');
  const [preco, setPreco] = useState('');
  const [podeContatar, setPodeContatar] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [enviado, setEnviado] = useState(false);

  const alternar = (f: string) => setFavoritas((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]));

  async function enviar() {
    setAviso('');
    if (nota === null) return setAviso('Responda a pergunta 1: a nota de 0 a 10.');
    setEnviando(true);
    try {
      const dados = {
        nome,
        contato,
        aparelho,
        dias_uso: dias,
        nota,
        facilidade: facilidade ?? '',
        favoritas,
        confuso,
        erro: teveErro ? erro || 'Sim (sem descrição)' : '',
        falta,
        preco,
        pode_contatar: podeContatar,
      };
      if (supabase) {
        const { error } = await supabase.rpc('enviar_feedback', { p: dados });
        if (error) throw error;
      }
      setEnviado(true);
    } catch {
      setAviso('Não foi possível enviar agora. Verifique a internet e tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Tela>
        <Stack.Screen options={{ title: 'Obrigado!', headerShown: Platform.OS !== 'web' }} />
        <View style={{ alignItems: 'center', gap: espaco.m, marginTop: espaco.l }}>
          <Logo size={64} />
          <Titulo style={{ textAlign: 'center' }}>
            Muito <Destaque>obrigado</Destaque>
            {nome.trim() ? `, ${nome.trim().split(' ')[0]}` : ''}!
          </Titulo>
          <Texto style={{ textAlign: 'center' }}>
            Cada resposta é lida com cuidado e vai ajudar a deixar o GovernaMente melhor antes do lançamento.
          </Texto>
        </View>
        <Cartao escuro>
          <Legenda style={{ color: cores.salvia }}>CANAL DO GOVERNAMENTE</Legenda>
          <Text style={s.tituloEscuro}>Acompanhe as novidades no WhatsApp</Text>
          <Text style={s.textoEscuro}>Conteúdos sobre autorregulação emocional e os próximos passos do app.</Text>
          <Botao titulo="Entrar no canal" onPress={() => Linking.openURL(CANAL_WHATSAPP)} style={{ backgroundColor: cores.ambar }} corTexto={cores.petroleoProfundo} />
        </Cartao>
        {Platform.OS !== 'web' && <Botao variante="texto" titulo="Voltar ao app" onPress={() => router.replace('/')} />}
      </Tela>
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: 'Sua opinião', headerShown: Platform.OS !== 'web' }} />
      <View style={{ alignItems: 'center', gap: espaco.s }}>
        <Logo size={52} />
        <Titulo style={{ textAlign: 'center' }}>
          Como foi testar o <Destaque>GovernaMente</Destaque>?
        </Titulo>
        <Texto style={{ textAlign: 'center', color: cores.grafiteSuave }}>
          São uns 3 minutos. Só a primeira pergunta é obrigatória. Seja sincero: crítica também ajuda muito.
        </Texto>
      </View>

      <Pergunta n={1} titulo="De 0 a 10, quanto você indicaria o app para um amigo?">
        <View style={s.notas}>
          {Array.from({ length: 11 }, (_, i) => (
            <Pressable
              key={i}
              accessibilityRole="radio"
              accessibilityState={{ selected: nota === i }}
              accessibilityLabel={`Nota ${i}`}
              onPress={() => setNota(i)}
              style={[s.nota, nota === i && s.notaSel]}
            >
              <Text style={[s.notaTexto, nota === i && { color: cores.areia }]}>{i}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.extremos}>
          <Legenda>Nada provável</Legenda>
          <Legenda>Com certeza</Legenda>
        </View>
      </Pergunta>

      <Pergunta n={2} titulo="Por quantos dias você usou o app?">
        <View style={s.chips}>
          {DIAS_USO.map((d) => (
            <Chip key={d} rotulo={d} ativo={dias === d} onPress={() => setDias(dias === d ? '' : d)} />
          ))}
        </View>
      </Pergunta>

      <Pergunta n={3} titulo="O app é fácil de usar?">
        <View style={s.chips}>
          {FACILIDADE.map((f, i) => (
            <Chip key={f} rotulo={f} ativo={facilidade === i + 1} onPress={() => setFacilidade(facilidade === i + 1 ? null : i + 1)} />
          ))}
        </View>
      </Pergunta>

      <Pergunta n={4} titulo="Do que você mais gostou? Marque quantas quiser.">
        <View style={s.chips}>
          {FUNCOES.map((f) => (
            <Chip key={f} rotulo={f} ativo={favoritas.includes(f)} onPress={() => alternar(f)} />
          ))}
        </View>
      </Pergunta>

      <Pergunta n={5} titulo="O que foi confuso ou difícil de entender?">
        <Campo rotulo="Sua resposta" value={confuso} onChangeText={setConfuso} multiline maxLength={2000} placeholder="Ex.: não achei onde ver meu histórico" />
      </Pergunta>

      <Pergunta n={6} titulo="O app travou ou deu algum erro?">
        <View style={s.chips}>
          <Chip rotulo="Não" ativo={teveErro === false} onPress={() => setTeveErro(false)} />
          <Chip rotulo="Sim" ativo={teveErro === true} onPress={() => setTeveErro(true)} />
        </View>
        {teveErro && (
          <Campo
            rotulo="Conte o que aconteceu e em qual tela"
            value={erro}
            onChangeText={setErro}
            multiline
            maxLength={2000}
            placeholder="Ex.: ao salvar o diário, a tela ficou branca"
          />
        )}
      </Pergunta>

      <Pergunta n={7} titulo="O que faria você assinar o app, ou o que está faltando?">
        <Campo rotulo="Sua resposta" value={falta} onChangeText={setFalta} multiline maxLength={2000} />
      </Pergunta>

      <Pergunta n={8} titulo="A assinatura de R$ 29,90 por mês parece:">
        <View style={s.chips}>
          {PRECO.map((p) => (
            <Chip key={p} rotulo={p} ativo={preco === p} onPress={() => setPreco(preco === p ? '' : p)} />
          ))}
        </View>
      </Pergunta>

      <Pergunta n={9} titulo="Sobre você (opcional)">
        <Campo rotulo="Seu nome" value={nome} onChangeText={setNome} maxLength={120} />
        <Campo rotulo="WhatsApp ou e-mail" value={contato} onChangeText={setContato} maxLength={120} autoCapitalize="none" />
        <Campo rotulo="Modelo do celular" value={aparelho} onChangeText={setAparelho} maxLength={60} placeholder="Ex.: Samsung A54, Moto G84" />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: podeContatar }}
          onPress={() => setPodeContatar(!podeContatar)}
          style={s.check}
        >
          <View style={[s.caixa, podeContatar && { backgroundColor: cores.petroleo, borderColor: cores.petroleo }]}>
            {podeContatar && <Text style={{ color: cores.areia, fontSize: 13 }}>✓</Text>}
          </View>
          <Text style={s.checkTexto}>Pode falar comigo para entender melhor a minha resposta.</Text>
        </Pressable>
      </Pergunta>

      {!!aviso && <Text style={s.aviso}>{aviso}</Text>}
      <Botao titulo="Enviar minha opinião" onPress={enviar} carregando={enviando} />
      <Legenda style={{ textAlign: 'center', lineHeight: 18 }}>
        Suas respostas são usadas só para melhorar o app e não são compartilhadas. GovernaMente · Rodrigo Martins Ferreira, psicólogo (CRP
        04/65049).
      </Legenda>
    </Tela>
  );
}

function Pergunta({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <Cartao>
      <Legenda>PERGUNTA {n}</Legenda>
      <Text style={s.pergunta}>{titulo}</Text>
      {children}
    </Cartao>
  );
}

const s = StyleSheet.create({
  pergunta: { fontFamily: fontes.titulo, fontSize: 18, color: cores.petroleo, lineHeight: 24 },
  notas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  nota: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: cores.linha,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.branco,
  },
  notaSel: { backgroundColor: cores.petroleo, borderColor: cores.petroleo },
  notaTexto: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.petroleo },
  extremos: { flexDirection: 'row', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  check: { flexDirection: 'row', gap: espaco.s, alignItems: 'center' },
  caixa: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: cores.salviaEscura, alignItems: 'center', justifyContent: 'center' },
  checkTexto: { flex: 1, fontFamily: fontes.texto, fontSize: 14, color: cores.grafite },
  aviso: { fontFamily: fontes.textoMedio, color: cores.alerta, textAlign: 'center' },
  tituloEscuro: { fontFamily: fontes.titulo, fontSize: 20, color: cores.areia },
  textoEscuro: { fontFamily: fontes.texto, fontSize: 15, color: cores.areia, opacity: 0.9, lineHeight: 21 },
});

