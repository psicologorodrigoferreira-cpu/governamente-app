# Roteiro no computador

Faça na ordem. Cada passo leva poucos minutos. Não envie senhas nem chaves secretas no chat.

## 1. Banco de dados (Supabase → SQL Editor)

Rode os quatro arquivos, **nesta ordem**. Para cada um: abra no GitHub, toque em **Raw**, copie tudo, cole em **SQL Editor → New query** e clique em **Run**. Deve aparecer "Success".

1. `supabase/migrations/0001_inicial.sql`
2. `supabase/migrations/0002_teste_gratis.sql`
3. `supabase/migrations/0003_painel_ferramentas.sql`
4. `supabase/migrations/0004_testes_agenda_mesa.sql`

## 2. Endereço do app (Supabase → Authentication → URL Configuration)

- **Site URL:** `https://app.governamente.com.br`
- **Redirect URLs:** adicione `https://app.governamente.com.br/**`

## 3. Chave da Hostinger no GitHub

github.com/psicologorodrigoferreira-cpu/governamente-app/settings/keys → **Add deploy key**
- Title: `Hostinger`
- Key: a chave que começa com `ssh-rsa AAAAB3...` (está na conversa)
- **Não** marque "Allow write access"

Depois, escreva para o Claude: **"adicionei"**. Ele publica o app em app.governamente.com.br.

## 4. Sua conta de administrador

Abra app.governamente.com.br e crie a conta com **psicologorodrigoferreira@gmail.com**. Confirme pelo link do e-mail. Em **Conta**, aparece o **Painel do Rodrigo**: números, aulas, códigos, agenda e Mesa.

No painel, já deixe pronto:
- **Agenda:** horário das lives (ficou 20h, terça a sexta, ainda **desativada** até você confirmar), link do Meet do Grupo da Generosidade e link do Meet da Mesa.
- **Mesa:** confira a data de início da Travessia 01 (01/12/2026) e, se quiser, o tema de cada semana.

## 5. Funções do servidor (Supabase → Edge Functions)

Para cada função: **Deploy a new function → Via Editor**, use o nome exato, apague o código de exemplo, cole o arquivo e publique. Depois, abra a função → **Details** e **desligue "Verify JWT"** (os avisos vêm da Hubla e do RevenueCat, não de um usuário logado).

| Nome | Arquivo |
|---|---|
| `hubla-webhook` | `supabase/functions/hubla-webhook/index.ts` |
| `revenuecat-webhook` | `supabase/functions/revenuecat-webhook/index.ts` (pode deixar para quando criar o RevenueCat) |

Em **Edge Functions → Secrets**, cadastre:

| Nome | Valor |
|---|---|
| `HUBLA_WEBHOOK_TOKEN` | token da Hubla (Integrações → Webhook → Autenticação) |
| `HUBLA_PRODUTOS_APP` | ID do produto "App GovernaMente" na Hubla |
| `HUBLA_PRODUTOS_MESA` | ID do produto da Mesa |
| `HUBLA_PRODUTOS_PLANO` | ID do produto do Plano Individual |
| `HUBLA_PRODUTOS_COMBO` | ID do combo livro + app (Black November) |
| `HUBLA_COMBO_DIAS` | dias de app que o combo libera (ex.: `90`) |
| `REVENUECAT_WEBHOOK_AUTH` | um texto longo inventado por você; o mesmo vai no RevenueCat |

Os IDs dos produtos o Claude consegue buscar pela Hubla, se você pedir.

## 6. Hubla → Integrações → Webhook

- URL: `https://xvobrpmqpnjlspluyiyw.supabase.co/functions/v1/hubla-webhook`
- Eventos: **membro adicionado** e **membro removido** dos produtos App, Mesa, Plano e Combo.

## 7. Apple Developer

developer.apple.com/programs/enroll → Individual. A aprovação leva de 1 a 3 dias. Ela é necessária para o app ir para o iPhone (TestFlight e App Store).

---

### Depois (com a conta Apple aprovada)
RevenueCat, assinaturas mensal e anual nas lojas, primeira versão no TestFlight. O passo a passo completo está no README.
