import { Linking } from 'react-native';
import { Botao, Cartao, Subtitulo, Tela, Texto } from '@/components/ui';
import { cores } from '@/lib/theme';

export default function Apoio() {
  return (
    <Tela semApoio>
      <Subtitulo>Você não precisa passar por isso sozinho.</Subtitulo>
      <Texto>
        Este app é educacional e não substitui atendimento psicológico ou médico. Se você está em sofrimento intenso, pensando
        em se machucar ou em perigo, procure ajuda agora.
      </Texto>
      <Cartao>
        <Subtitulo>CVV · 188</Subtitulo>
        <Texto>Apoio emocional gratuito, 24 horas, por telefone, chat ou e-mail.</Texto>
        <Botao titulo="Ligar para o 188" onPress={() => Linking.openURL('tel:188')} />
        <Botao variante="secundario" titulo="Conversar pelo chat (cvv.org.br)" onPress={() => Linking.openURL('https://cvv.org.br')} />
      </Cartao>
      <Cartao>
        <Subtitulo>SAMU · 192</Subtitulo>
        <Texto>Emergência médica.</Texto>
        <Botao titulo="Ligar para o 192" onPress={() => Linking.openURL('tel:192')} />
      </Cartao>
      <Texto style={{ color: cores.grafiteSuave }}>
        Em risco imediato, vá ao pronto-socorro mais próximo ou ligue 190.
      </Texto>
    </Tela>
  );
}
