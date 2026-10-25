# App GovernaMente

Aplicativo de assinatura (R$ 29,90/mês) para iPhone e Android que aplica o método do livro **GovernaMente** (C.A.I.A.: Consciência Emocional, Autorregulação Estratégica, Inteligência Relacional e Alinhamento e Constância) e reúne o ecossistema GovernaMente.

Criado para Rodrigo Martins Ferreira · Psicólogo · CRP 04/65049.

## O que tem no app

- **Trilha do método**: 15 estações, uma por tema do livro (capítulos 1 a 12), cada uma com resumo, prática e pergunta de reflexão.
- **Diário das Emoções**: situação, emoção (com intensidade), pensamento automático (TCC) e ação, com histórico e as emoções mais frequentes.
- **Roda das Emoções** (Plutchik) e **Respiro 4–6** guiado (respiração do cap. 3).
- **Check-in semanal**: 5 perguntas e histórico de evolução.
- **Conteúdos**: aulas e caminhos do ecossistema (Mesa, Plano, masterclass, livro, testes).
- **Apoio em crise** sempre acessível (CVV 188, SAMU 192).
- **Conta**: assinatura, restaurar compras, privacidade e exclusão de conta (exigência da Apple).

## Como o acesso é liberado

| Quem | Como entra |
|---|---|
| Assina no app | Apple / Google, gerenciado pelo RevenueCat (entitlement `acesso`) |
| Assina no site | Hubla → webhook → tabela `acessos` (origem `hubla`) |
| Tripulante da Mesa | Hubla → webhook (origem `mesa`), incluso |
| Paciente do Plano | Hubla → webhook (origem `plano`), incluso |
| Cortesia | Linha manual na tabela `acessos` (origem `cortesia`) |

A pessoa entra com **o mesmo e-mail** usado na Hubla. A confirmação de e-mail do Supabase precisa ficar **ligada**, para ninguém usar o e-mail de outra pessoa.

## Peças do projeto

```
src/app/            telas (Expo Router)
src/content/        textos da trilha, emoções e links do ecossistema (edite aqui)
src/lib/            login, dados, assinatura e cores da marca
supabase/           banco (SQL) e funções do servidor (Hubla e exclusão de conta)
assets/             ícone e tela de abertura
```

Sem as chaves do Supabase, o app abre em **modo demonstração** (dados só no aparelho), útil para testar.

---

## Guia de publicação, passo a passo

Faça na ordem. Nada aqui pede que você programe.

### 1. Contas (você cria, uma vez)
1. **Apple Developer**: developer.apple.com/programs/enroll → Individual → US$ 99/ano. Leva alguns dias.
2. **Google Play Console**: play.google.com/console → conta pessoal → US$ 25.
3. **GitHub**: github.com/signup. Conecte em claude.ai → Configurações → Conectores.
4. **Expo**: expo.dev/signup.
5. **Supabase**: supabase.com → New project → nome `governamente-app` → região **South America (São Paulo)**.
6. **RevenueCat**: revenuecat.com (grátis até US$ 2.500/mês de receita).

### 2. Banco de dados (Supabase)
1. SQL Editor → cole `supabase/migrations/0001_inicial.sql` → Run.
2. Authentication → Providers → Email: deixe **Confirm email** ligado.
3. Authentication → URL Configuration → Site URL: `https://governamente.com.br`.
4. Publique as funções `hubla-webhook` e `excluir-conta` (o Claude faz pelo terminal com o Supabase CLI).
5. Edge Functions → Secrets: `HUBLA_WEBHOOK_TOKEN`, `HUBLA_PRODUTOS_APP`, `HUBLA_PRODUTOS_MESA`, `HUBLA_PRODUTOS_PLANO`.

### 3. Hubla
1. Crie o produto **App GovernaMente**, assinatura mensal de R$ 29,90.
2. Integrações → Webhook → URL: `https://SEU-PROJETO.supabase.co/functions/v1/hubla-webhook`, eventos de **membro** (adicionado/removido) dos produtos App, Mesa e Plano.
3. Copie o token da aba Autenticação para o secret `HUBLA_WEBHOOK_TOKEN`.

### 4. Assinatura nas lojas (RevenueCat)
1. App Store Connect: crie o app (`br.com.governamente.app`) e uma assinatura auto-renovável mensal (`governamente_mensal`), preço R$ 29,90. Inscreva-se no **App Store Small Business Program** (comissão de 15%).
2. Google Play Console: crie o app e a assinatura `governamente_mensal` a R$ 29,90.
3. RevenueCat: conecte as duas lojas, crie o entitlement **`acesso`**, uma offering padrão com o pacote mensal, e copie as chaves públicas de iOS e Android.

### 5. Chaves do app
No Expo (expo.dev → projeto → Environment variables), cadastre as chaves do `.env.example` para `preview` e `production`.

### 6. Gerar e enviar
```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform all
```
Tudo compila na nuvem: não precisa de Mac.

### 7. Antes de enviar para revisão
- Páginas públicas no ar: `governamente.com.br/app/privacidade` e `governamente.com.br/app/termos`.
- Capturas de tela (iPhone 6,9" e Android) e descrição com palavras-chave.
- Conta de teste para o revisor da Apple, com acesso cortesia na tabela `acessos`.
- Categoria sugerida: **Saúde e fitness** ou **Estilo de vida**. Descreva o app como educacional, sem prometer tratamento ou cura.
