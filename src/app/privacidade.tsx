import { Linking } from 'react-native';
import { Botao, Subtitulo, Tela, Texto } from '@/components/ui';

export default function Privacidade() {
  return (
    <Tela>
      <Subtitulo>Como cuidamos dos seus dados</Subtitulo>
      <Texto>
        O que você escreve no Diário das Emoções, nos check-ins e nas reflexões é privado. Esses registros ficam guardados de
        forma protegida, em servidor no Brasil, e só a sua conta tem acesso a eles.
      </Texto>
      <Texto>
        Usamos seu nome e e-mail para criar a conta e liberar o acesso. Não vendemos nem compartilhamos seus dados para
        publicidade. Pagamentos são processados pela Apple, pelo Google ou pela Hubla; nós não vemos os dados do seu cartão.
      </Texto>
      <Texto>
        Você pode excluir sua conta e todos os seus registros a qualquer momento, em Conta → Excluir minha conta. Para outros
        pedidos sobre seus dados (LGPD), escreva para psicologorodrigoferreira@gmail.com.
      </Texto>
      <Botao
        variante="secundario"
        titulo="Política de privacidade completa"
        onPress={() => Linking.openURL('https://app.governamente.com.br/privacidade.html')}
      />
    </Tela>
  );
}
