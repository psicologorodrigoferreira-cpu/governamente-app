import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Botao, Campo, Logo, Marca } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cores, espaco, fontes, raio } from '@/lib/theme';

type Modo = 'entrar' | 'cadastrar' | 'senha';

export default function Entrar() {
  const { entrar, cadastrar, recuperarSenha, modoDemo } = useAuth();
  const [modo, setModo] = useState<Modo>('cadastrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    setErro('');
    setAviso('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('Digite um e-mail válido.');
    if (modo !== 'senha' && senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.');
    if (modo === 'cadastrar' && !nome.trim()) return setErro('Como você gostaria de ser chamado?');
    if (modo === 'cadastrar' && !aceite) return setErro('Para continuar, aceite os termos e a política de privacidade.');
    setCarregando(true);
    try {
      if (modo === 'entrar') {
        await entrar(email, senha);
        router.replace('/');
      } else if (modo === 'cadastrar') {
        const { precisaConfirmar } = await cadastrar(nome.trim(), email, senha);
        if (precisaConfirmar) {
          setAviso('Enviamos um link para o seu e-mail. Confirme e depois toque em "Já tenho conta".');
          setModo('entrar');
        } else router.replace('/');
      } else {
        await recuperarSenha(email);
        setAviso('Se este e-mail tiver cadastro, você vai receber um link para criar uma nova senha.');
        setModo('entrar');
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.petroleo }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: espaco.s, marginTop: espaco.l }}>
            <Logo size={72} fundo="escuro" />
            <Marca escuro size={32} />
            <Text style={s.tagline}>Autorregulação emocional para quem empreende</Text>
            <Text style={s.frase}>Conduzir a mente, não controlá-la.</Text>
          </View>

          <View style={s.caixa}>
            <Text style={s.tituloCaixa}>
              {modo === 'cadastrar' ? 'Comece sua travessia' : modo === 'entrar' ? 'Bem-vindo de volta' : 'Criar nova senha'}
            </Text>
            {modo === 'cadastrar' && (
              <Text style={s.gratis}>7 dias grátis, sem cartão. Depois, escolha o plano mensal ou anual.</Text>
            )}
            {modoDemo && (
              <Text style={s.demo}>Modo demonstração: seus dados ficam só neste aparelho.</Text>
            )}
            {modo === 'cadastrar' && (
              <Campo rotulo="Seu nome" value={nome} onChangeText={setNome} autoComplete="name" textContentType="name" />
            )}
            <Campo
              rotulo="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {modo !== 'senha' && (
              <Campo
                rotulo="Senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'}
                textContentType={modo === 'cadastrar' ? 'newPassword' : 'password'}
              />
            )}
            {modo === 'cadastrar' && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: aceite }}
                onPress={() => setAceite(!aceite)}
                style={s.aceite}
              >
                <View style={[s.caixinha, aceite && s.caixinhaOn]}>{aceite && <Text style={s.check}>✓</Text>}</View>
                <Text style={s.aceiteTexto}>
                  Li e aceito os{' '}
                  <Text style={s.link} onPress={() => Linking.openURL('https://app.governamente.com.br/termos.html')}>
                    termos de uso
                  </Text>{' '}
                  e a{' '}
                  <Text style={s.link} onPress={() => router.push('/privacidade')}>
                    política de privacidade
                  </Text>
                  .
                </Text>
              </Pressable>
            )}
            {!!erro && <Text style={s.erro} accessibilityLiveRegion="polite">{erro}</Text>}
            {!!aviso && <Text style={s.aviso} accessibilityLiveRegion="polite">{aviso}</Text>}
            <Botao
              titulo={modo === 'cadastrar' ? 'Começar meus 7 dias grátis' : modo === 'entrar' ? 'Entrar' : 'Enviar link'}
              onPress={enviar}
              carregando={carregando}
            />
            <View style={{ alignItems: 'center', gap: 4 }}>
              {modo !== 'entrar' && <Botao variante="texto" titulo="Já tenho conta" onPress={() => setModo('entrar')} />}
              {modo !== 'cadastrar' && <Botao variante="texto" titulo="Criar conta" onPress={() => setModo('cadastrar')} />}
              {modo === 'entrar' && <Botao variante="texto" titulo="Esqueci minha senha" onPress={() => setModo('senha')} />}
            </View>
          </View>

          <Text style={s.rodape}>
            Tripulante da Mesa ou paciente do Plano? Entre com o mesmo e-mail da sua inscrição. O acesso já está liberado.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tagline: { fontFamily: fontes.textoMedio, color: cores.salvia, fontSize: 14, textAlign: 'center' },
  frase: { fontFamily: fontes.tituloItalico, color: cores.areia, fontSize: 17, textAlign: 'center' },
  caixa: { backgroundColor: cores.areia, borderRadius: raio.l, padding: espaco.l, gap: espaco.xs },
  tituloCaixa: { fontFamily: fontes.titulo, fontSize: 24, color: cores.petroleo, marginBottom: espaco.m },
  gratis: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.salviaEscura, marginTop: -8, marginBottom: espaco.m },
  demo: { fontFamily: fontes.texto, fontSize: 13, color: cores.ambarTerra, marginBottom: espaco.m },
  erro: { fontFamily: fontes.textoMedio, color: cores.alerta, marginBottom: espaco.s },
  aviso: { fontFamily: fontes.textoMedio, color: cores.salviaEscura, marginBottom: espaco.s },
  aceite: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: espaco.m },
  caixinha: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: cores.petroleo,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  caixinhaOn: { backgroundColor: cores.petroleo },
  check: { color: cores.areia, fontSize: 14, fontFamily: fontes.textoForte },
  aceiteTexto: { flex: 1, fontFamily: fontes.texto, fontSize: 14, color: cores.grafite, lineHeight: 20 },
  link: { color: cores.ambarTerra, textDecorationLine: 'underline' },
  rodape: { fontFamily: fontes.texto, color: cores.salvia, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
