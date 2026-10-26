# Roteiro de amanhã: o Claude executa, o Rodrigo faz os logins

> **Situação em 26/10/2026:** etapas 1 a 8 e 10 concluídas. App no ar em app.governamente.com.br, banco criado, webhook da Hubla testado (concedido e removido), conta de administrador ativa, produto "App GovernaMente" criado na Hubla (mensal R$ 29,90 e anual R$ 299,00, ainda em rascunho; ID `XKrpotkBdo0jo7PmmSCc`). Apple Developer pago, aguardando liberação. Faltam: publicar a oferta na Hubla, links da agenda na hora das lives, RevenueCat e lojas.

## Antes de tudo (Rodrigo, 5 minutos)

1. No computador, abra o **app Claude (desktop)** e abra **esta mesma conversa**.
2. Escolha **"Link to this computer"** (vincular a este computador).
3. No navegador do app Claude, entre nas suas contas:
   - supabase.com
   - github.com
   - app.hub.la
4. Escreva **"começar"**.

Regras do dia:
- **Senhas, tokens e chaves secretas você digita ou cola.** O Claude nunca digita senha.
- Antes de qualquer ação que não dá para desfazer, o Claude pede seu "ok".

---

## O que o Claude faz, na ordem

| # | Etapa | Quem | Situação hoje |
|---|---|---|---|
| 1 | Colocar a chave da Hostinger no GitHub (Deploy key, só leitura) | Claude, no navegador | chave pronta |
| 2 | Tirar a página padrão da Hostinger (`default.php`) e publicar o app em **app.governamente.com.br** (ramo `web`) | Claude, com seu ok | pasta só tem `default.php`; versão web já está gerada e atualizada |
| 3 | Banco: colar `supabase/banco_completo.sql` no SQL Editor e rodar | Claude | arquivo único pronto, testado 2× do zero |
| 4 | Supabase → Authentication: Site URL `https://app.governamente.com.br`, Redirect `https://app.governamente.com.br/**`, "Confirm email" ligado | Claude | — |
| 5 | Publicar a função `hubla-webhook` (Via Editor, "Verify JWT" desligado) | Claude | código pronto |
| 6 | Secrets da função: IDs dos produtos (Claude) e token da Hubla (**Rodrigo cola**) | os dois | IDs já levantados (abaixo) |
| 7 | Hubla → Webhook: URL e eventos de membro adicionado/removido | Claude, no navegador | — |
| 8 | Criar sua conta de administrador no app (**Rodrigo escolhe a senha**) e confirmar o e-mail | Rodrigo | — |
| 9 | Painel: colar os links das lives, do Grupo da Generosidade e da Mesa; conferir a Travessia 01 | Claude | horários já certos |
| 10 | Criar na Hubla o produto **App GovernaMente** (mensal e anual) | Claude, com seu ok no preço | não existe ainda |
| 11 | Teste completo: conta nova → 7 dias grátis → código de acesso → painel | Claude | — |
| 12 | Apple Developer (dados pessoais e pagamento de US$ 99) | Rodrigo, Claude orienta | — |

---

## Dados já levantados (Hubla)

| Secret | Valor | Produto |
|---|---|---|
| `HUBLA_PRODUTOS_MESA` | `47fdLh7Seo2ZmDLl2yjH,fVlZ1zw6JXI5PrWb9tUT` | Mesa GovernaMente · Travessia 01 |
| `HUBLA_PRODUTOS_PLANO` | `o3yi1BJfOtRkeEUJ9JEN,EIUHsJMuFaXQseSFOBhM` | Plano de Acompanhamento GovernaMente |
| `HUBLA_PRODUTOS_COMBO` | `CKTDwAHmxgwu8O2Ev3d5,r40Oov2Y0lYSRhGhPKcR` | Kit Fundador GovernaMente — Livro + App (rascunho) |
| `HUBLA_PRODUTOS_APP` | `XKrpotkBdo0jo7PmmSCc,vFXfGOAB9ZwPqms64i1S` | App GovernaMente |
| `HUBLA_COMBO_DIAS` | `365` | dias de app no Kit Fundador (12 meses, Black November) |
| `HUBLA_WEBHOOK_TOKEN` | **Rodrigo cola** | Hubla → Webhook → Autenticação |

Cada produto aparece com dois IDs (o novo e o antigo), para funcionar com qualquer um dos dois que a Hubla mandar.

URL do webhook: `https://xvobrpmqpnjlspluyiyw.supabase.co/functions/v1/hubla-webhook`

---

## Decisões que só você toma (pode responder amanhã)

1. **Plano anual:** R$ 299,00 (sugerido)?
2. **Kit Fundador:** quantos dias de app ele dá? (padrão: 90)
3. **Links:**
   - lives (YouTube ou Instagram);
   - Meet do Grupo da Generosidade;
   - Meet da Mesa.

## Depois (com a conta Apple aprovada)

RevenueCat, assinaturas mensal e anual nas lojas, primeira versão no TestFlight. O passo a passo completo está no README.
