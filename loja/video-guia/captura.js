// Captura as telas do app (versão web em modo demonstração) para o vídeo-guia.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const TESTES = require('./testes.json');

const BASE = 'http://localhost:8099';
const OUT = '/tmp/vid/shots';
const MANIFESTO = '/tmp/vid/manifesto.json';

const LIMPA = () => {
  const fix = () => {
    document.querySelectorAll('div,span').forEach((el) => {
      if (el.childElementCount !== 0) return;
      const t = el.textContent;
      if (t === 'Modo demonstração: seus dados ficam só neste aparelho.') el.style.display = 'none';
      if (t === 'Simular assinatura (demonstração)') el.textContent = 'Assinar plano anual';
    });
  };
  new MutationObserver(fix).observe(document, { subtree: true, childList: true, characterData: true });
};

const hoje = new Date();
const diasAtras = (n, h = 20) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() - n);
  d.setHours(h, 10, 0, 0);
  return d.toISOString();
};
const diaStr = (n) => diasAtras(n).slice(0, 10);

function semente() {
  const checkins = [
    [0, 3, 3, 3, 1, 3],
    [7, 3, 2, 2, 2, 3],
    [14, 2, 2, 2, 2, 2],
    [21, 2, 2, 1, 3, 2],
    [28, 1, 1, 1, 3, 1],
    [35, 1, 2, 1, 4, 1],
  ].map(([d, humor, energia, sono, ansiedade, conducao], i) => ({
    id: 'c' + i,
    criado_em: diasAtras(d),
    humor,
    energia,
    sono,
    ansiedade,
    conducao,
  }));
  const reg = (d, situacao, emocoes, intensidade, acao, pensamento) => ({
    id: 'd' + d + emocoes[0],
    criado_em: diasAtras(0, 7 + d * 2),
    situacao,
    emocoes,
    intensidade,
    pensamento: pensamento ?? null,
    acao,
  });
  const diario = [
    reg(0, 'Reunião com cliente remarcada em cima da hora.', ['Irritação', 'Ansiedade'], 6, 'Respirei 2 minutos antes de responder.'),
    reg(1, 'Fechei a proposta que estava travada há semanas.', ['Alegria', 'Alívio'], 7, 'Comemorei com a equipe.'),
    reg(2, 'Acordei cansado depois de dormir tarde.', ['Cansaço'], 5, 'Dormi mais cedo à noite.'),
    reg(3, 'Conversa difícil com um sócio.', ['Apreensão', 'Frustração'], 7, 'Marquei uma nova conversa com calma.', 'Ele não valoriza o que eu faço.'),
    reg(5, 'Café sem pressa com minha família.', ['Gratidão', 'Serenidade'], 4, 'Fiquei sem celular na mesa.'),
    reg(6, 'Muitas mensagens ao mesmo tempo.', ['Ansiedade'], 6, 'Silenciei as notificações por uma hora.'),
  ].filter((r) => new Date(r.criado_em).getMonth() === hoje.getMonth());
  return {
    'gm:checkins': checkins,
    'gm:diario': diario,
    'gm:progresso': ['conceito', 'quem-empreende', 'ansiedade', 'consciencia'],
    'gm:tempo-tela': [
      { dia: diaStr(0), minutos: 205 },
      { dia: diaStr(1), minutos: 230 },
      { dia: diaStr(2), minutos: 262 },
      { dia: diaStr(3), minutos: 301 },
      { dia: diaStr(4), minutos: 318 },
    ],
    'gm:gratidao': [
      { id: 'g1', dia: diaStr(0), itens: ['Café sem pressa', 'Conversa boa com um cliente', 'Treino feito'] },
      { id: 'g2', dia: diaStr(2), itens: ['Dormi bem', 'Ajuda de um amigo', 'Fechei a proposta'] },
    ],
  };
}

class Cap {
  constructor(b, id, titulo, resumo) {
    this.b = b;
    this.id = id;
    this.titulo = titulo;
    this.resumo = resumo;
    this.passos = [];
    this.dir = path.join(OUT, id);
    fs.mkdirSync(this.dir, { recursive: true });
  }
  async abrir({ login = true, onboarding = false, dados = null, assinante = false } = {}) {
    this.ctx = await this.b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    await this.ctx.addInitScript(LIMPA);
    const pg = (this.pg = await this.ctx.newPage());
    await pg.goto(BASE + '/');
    await pg.waitForTimeout(2200);
    if (!login) return;
    if (dados) {
      await pg.evaluate((d) => Object.entries(d).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))), dados);
    }
    const ins = await pg.$$('input');
    await ins[0].fill('Ana');
    await ins[1].fill('ana@exemplo.com');
    await ins[2].fill('ana12345');
    await pg.getByText('Li e aceito').click();
    await pg.getByText('Começar meus 7 dias grátis').click();
    await pg.waitForTimeout(2200);
    if (!onboarding) {
      await pg.getByText('Pular por agora e ir para o Início').click();
      await pg.waitForTimeout(1800);
    }
    if (assinante) {
      await this.vai('/assinar');
      await pg.getByText('Assinar plano anual').click();
      await pg.waitForTimeout(2000);
    }
  }
  async vai(rota) {
    await this.pg.goto(BASE + rota);
    await this.pg.waitForTimeout(1900);
  }
  t(texto, n) {
    const l = this.pg.getByText(texto, { exact: true });
    return n === 'last' ? l.last() : l.nth(n ?? 0);
  }
  tc(texto) {
    return this.pg.getByText(texto).first();
  }
  async topo() {
    await this.pg.evaluate(() => document.querySelectorAll('*').forEach((e) => { if (e.scrollTop > 0) e.scrollTop = 0; }));
    await this.pg.waitForTimeout(300);
  }
  async rola(px) {
    await this.pg.mouse.move(215, 500);
    await this.pg.mouse.wheel(0, px);
    await this.pg.waitForTimeout(600);
  }
  async ate(loc, margem = 160) {
    // rola até o elemento ficar visível, com folga no topo
    await loc.scrollIntoViewIfNeeded();
    const bb = await loc.boundingBox();
    if (bb && bb.y > 932 - 260) await this.rola(bb.y - 400);
    else if (bb && bb.y < margem) await this.rola(bb.y - margem);
    await this.pg.waitForTimeout(300);
  }
  async foto(legenda, alvo) {
    const pg = this.pg;
    if (alvo) {
      await this.ate(alvo);
      const bb = await alvo.boundingBox();
      if (bb)
        await pg.evaluate((b) => {
          const d = document.createElement('div');
          d.id = '__marca';
          Object.assign(d.style, {
            position: 'fixed', left: b.x - 7 + 'px', top: b.y - 7 + 'px', width: b.width + 14 + 'px', height: b.height + 14 + 'px',
            border: '4px solid #E0A84A', borderRadius: '18px', boxShadow: '0 0 0 7px rgba(224,168,74,.28)', zIndex: 99999, pointerEvents: 'none',
          });
          document.body.appendChild(d);
        }, bb);
    }
    const n = String(this.passos.length + 1).padStart(2, '0');
    const arq = path.join(this.dir, `${n}.jpg`);
    await pg.screenshot({ path: arq, type: 'jpeg', quality: 92 });
    await pg.evaluate(() => document.getElementById('__marca')?.remove());
    this.passos.push({ img: arq, legenda });
  }
  async toca(loc, espera = 1200) {
    await this.ate(loc);
    await loc.click();
    await this.pg.waitForTimeout(espera);
  }
  async card(loc) {
    const h = await loc.elementHandle();
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    await h.evaluate((el, id) => {
      let e = el;
      for (let i = 0; i < 8 && e; i++) {
        const st = getComputedStyle(e);
        if (parseFloat(st.borderTopLeftRadius) >= 10 && st.backgroundColor !== 'rgba(0, 0, 0, 0)') { e.dataset.card = id; return; }
        e = e.parentElement;
      }
      el.dataset.card = id;
    }, id);
    return this.pg.locator(`[data-card="${id}"]`);
  }
  async fechar() {
    await this.ctx.close();
  }
}

// ------------------------------------------------------------ capítulos
const CAPS = [];
const cap = (id, titulo, resumo, fn) => CAPS.push({ id, titulo, resumo, fn });

cap('conta-e-teste-gratis', 'Criar sua conta e o teste grátis', 'Como criar a conta, entrar e recuperar a senha.', async (c) => {
  await c.abrir({ login: false });
  const pg = c.pg;
  await c.foto('Ao abrir o app pela primeira vez, você cria a sua conta. São 7 dias grátis, sem cartão de crédito.');
  const ins = await pg.$$('input');
  await ins[0].fill('Ana');
  await ins[1].fill('ana@exemplo.com');
  await ins[2].fill('ana12345');
  await c.foto('Preencha o seu nome, o seu e-mail e crie uma senha.', pg.locator('input').first());
  await pg.getByText('Li e aceito').click();
  await c.foto('Leia e aceite os termos de uso e a política de privacidade. Os links abrem os textos completos.', c.tc('Li e aceito'));
  await c.foto('Toque em "Começar meus 7 dias grátis". No teste, tudo fica liberado, menos as aulas em vídeo.', c.t('Começar meus 7 dias grátis'));
  await c.foto('Já tem conta? Toque em "Já tenho conta".', c.t('Já tenho conta'));
  await c.t('Já tenho conta').click();
  await pg.waitForTimeout(900);
  await c.foto('Entre com o mesmo e-mail e a mesma senha do cadastro.');
  await c.foto('Esqueceu a senha? Toque em "Esqueci minha senha" e enviamos um link para o seu e-mail criar uma nova.', c.t('Esqueci minha senha'));
  await c.foto('Tripulante da Mesa ou paciente do Plano Individual: entre com o mesmo e-mail da sua inscrição. O acesso já vem liberado.', c.tc('Tripulante da Mesa ou paciente'));
});

cap('primeiros-passos', 'Primeiros passos', 'As três perguntas iniciais que indicam por onde começar.', async (c) => {
  await c.abrir({ onboarding: true });
  const pg = c.pg;
  await c.foto('Logo depois do cadastro, três perguntas rápidas ajudam o app a indicar por onde você começa.');
  await pg.getByText('Ansiedade e pressão por resultado').click();
  await pg.waitForTimeout(400);
  await c.foto('Primeira pergunta: o que mais tem pesado para você hoje. Escolha a opção mais parecida com o seu momento.', c.tc('Ansiedade e pressão por resultado'));
  await c.t('Continuar').click();
  await pg.waitForTimeout(800);
  await pg.getByText('10 minutos').click();
  await pg.waitForTimeout(300);
  await c.foto('Segunda: quanto tempo por dia você consegue dedicar. Pouco e todo dia vale mais que muito de vez em quando.', c.tc('10 minutos'));
  await c.t('Continuar').click();
  await pg.waitForTimeout(800);
  await pg.getByText('De manhã').click();
  await pg.waitForTimeout(300);
  await c.foto('Terceira: o melhor momento para o lembrete diário. Embaixo, o app já mostra a estação da trilha indicada para você.', c.tc('Você vai começar'));
  await c.t('Começar').click();
  await pg.waitForTimeout(1800);
  await c.foto('Ao tocar em "Começar", você vai direto para a estação sugerida.');
  await c.vai('/conta');
  await c.foto('Quer responder de novo? Em Conta, toque em "Refazer os primeiros passos".', c.t('Refazer os primeiros passos'));
});

cap('tela-inicio', 'A tela Início', 'O painel do dia: cartões, ferramentas e navegação.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.foto('A tela Início é o seu painel do dia. Tudo o que importa hoje fica em um só lugar.');
  await c.foto('Em destaque, a trilha Detox Digital, sugerida para todos. Toque para começar ou continuar.', await c.card(c.tc('SUGERIDO PARA VOCÊ')));
  await c.foto('Durante o teste grátis, este cartão mostra quantos dias faltam. "Ver planos" leva à assinatura.', await c.card(c.tc('TESTE GRÁTIS')));
  await c.foto('O check-in da semana aparece aqui quando estiver pendente. Leva menos de um minuto.', await c.card(c.tc('CHECK-IN DA SEMANA')));
  await c.foto('Este cartão leva à próxima estação da trilha e mostra quantas você já concluiu.', await c.card(c.tc('COMECE A TRILHA')));
  await c.foto('Aqui aparece o próximo encontro ao vivo, com o atalho para a agenda e o lembrete.', await c.card(c.tc('PRÓXIMO AO VIVO')));
  await c.foto('Em "Ferramentas do livro" ficam todas as práticas do app. Cada uma tem o seu vídeo nesta playlist.', c.tc('Ferramentas do livro'));
  await c.rola(500);
  await c.foto('Respiro, meditação, diário, Roda das Emoções, gratidão, prioridades, foco, constância, check-in, testes, evolução e lembretes.');
  await c.foto('Todo dia, uma pergunta do livro para você refletir.', await c.card(c.tc('PERGUNTA DO LIVRO')));
  await c.foto('Na barra de baixo você navega entre Início, Trilha, Diário, Conteúdos e Conta.', c.t('Conteúdos', 'last'));
  await c.foto('Em qualquer tela, "Precisa de ajuda agora?" abre os contatos de apoio emocional e de emergência.', c.tc('Precisa de ajuda agora?'));
});

cap('trilha', 'A trilha do método', 'As 15 estações do livro: leitura, prática e reflexão.', async (c) => {
  await c.abrir({ dados: { 'gm:progresso': ['conceito', 'quem-empreende'] } });
  const pg = c.pg;
  await c.vai('/trilha');
  await c.foto('Na aba Trilha estão as 15 estações baseadas no livro GovernaMente, organizadas pelo método C.A.I.A.');
  await c.foto('A barra mostra quantas estações você já concluiu.', c.tc('de 15 concluídas'));
  await c.rola(300);
  await c.foto('Cada estação indica o capítulo do livro e o tempo. Faça uma por vez, no seu ritmo. As concluídas ganham um sinal de feito.');
  await c.vai('/estacao/ansiedade');
  await c.foto('Dentro da estação, você lê um texto curto com a ideia principal do capítulo.');
  await c.foto('Depois vem a prática do dia, passo a passo. Algumas têm um atalho para a ferramenta do app.', c.tc('PRÁTICA'));
  const campo = pg.locator('textarea').first();
  await c.ate(campo);
  await campo.fill('Que eu preciso de pausas de verdade entre uma reunião e outra.');
  await c.foto('Em "Para refletir", escreva a sua resposta. Ela fica guardada e só você vê.', c.tc('Para refletir'));
  await c.foto('Ao terminar, toque em "Concluir estação". Ela fica marcada e a trilha avança para a próxima.', c.t('Concluir estação'));
});

cap('aulas', 'Aulas em vídeo', 'Onde ficam as aulas e como assistir.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/conteudos');
  await c.foto('Na aba Conteúdos ficam as aulas em vídeo, os testes, a agenda ao vivo, a Área do Tripulante e a sua evolução.');
  await c.foto('No teste grátis, as aulas aparecem bloqueadas. Com a assinatura, elas são liberadas.', c.tc('As aulas são exclusivas para assinantes'));
  await c.fechar();
  await c.abrir({ assinante: true });
  await c.vai('/conteudos');
  await c.rola(250);
  await c.foto('Para assinantes, as aulas ficam abertas, organizadas por módulo. Aulas marcadas "Em breve" ainda serão publicadas.');
  await c.rola(700);
  await c.foto('Mais abaixo, o ecossistema GovernaMente: a Mesa, o acompanhamento individual, a masterclass e o livro.', c.tc('Ecossistema GovernaMente'));
});

cap('detox-digital', 'Detox Digital', 'A trilha de 5 dias para usar o celular com mais intenção.', async (c) => {
  await c.abrir({ dados: { 'gm:tempo-tela': semente()['gm:tempo-tela'] } });
  const pg = c.pg;
  await c.vai('/detox');
  await c.foto('O Detox Digital tem 5 dias, um ajuste por dia, de 2 a 10 minutos, feito no seu próprio celular. Sem bloqueador e sem culpa.');
  await c.foto('Os marcadores mostram os 5 temas: padrão, sem cor, avisos, distância e constância.', c.tc('Padrão'));
  await c.foto('Registre todo dia o tempo de tela que o celular mostra. O gráfico compara com o seu ponto de partida.', await c.card(c.tc('SEU TEMPO DE TELA')));
  await c.foto('Quando bater a vontade de "só dar uma olhadinha", use a Pausa do impulso: um minuto guiado para decidir com calma.', await c.card(c.tc('QUANDO A VONTADE APERTAR')));
  await c.foto('Cada dia abre depois do anterior. Embaixo, textos curtos explicam por que funciona e como manter depois.', c.tc('Os 5 dias'));
  await c.vai('/detox/dia/1');
  await c.foto('Dentro do dia: o que fazer e por quê. No dia 1, você só observa o seu padrão de uso.');
  await c.foto('O passo a passo mostra onde achar a informação no iPhone ou no Android.', await c.card(c.tc('COMO FAZER NO SEU CELULAR')));
  await c.foto('Registre o tempo de tela, os 3 apps que mais te prendem e os momentos em que você pega o celular sem decidir.', await c.card(pg.getByText(/^seu ponto de partida$/i).first()));
  await c.foto('Ao terminar, toque em "Concluir o dia 1". O dia seguinte é liberado.', c.t('Concluir o dia 1'));
  await c.vai('/detox/pausa');
  await c.foto('A Pausa do impulso também fica aqui: toque em "Começar a pausa" e siga o minuto guiado.', c.t('Começar a pausa'));
});

cap('diario-das-emocoes', 'Diário das Emoções', 'Como registrar situação, emoção e ação e rever seus registros.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/diario');
  await c.foto('O Diário das Emoções registra três coisas: a situação, a emoção e a ação. Assim você enxerga padrões.');
  await c.foto('Toque em "Novo registro".', c.t('Novo registro'));
  await c.vai('/diario-novo');
  const campos = pg.locator('textarea, input[type="text"], input:not([type])');
  await campos.nth(0).fill('Reunião com cliente remarcada em cima da hora.');
  await c.foto('Primeiro, a situação: escreva em poucas palavras o que aconteceu.', campos.nth(0));
  await pg.getByText('Irritação', { exact: true }).click();
  await pg.getByText('Ansiedade', { exact: true }).click();
  await pg.waitForTimeout(300);
  await c.foto('Depois, a emoção. Toque em uma ou mais. Não sabe nomear? Abra a Roda das Emoções pelo atalho.', c.t('Irritação'));
  await c.foto('Ajuste a intensidade de 0 a 10: o quanto aquilo mexeu com você.', c.tc('Intensidade'));
  await c.toca(c.tc('Registrar também o pensamento automático'), 600);
  const n = await campos.count();
  await campos.nth(1).fill('Ninguém respeita o meu tempo.');
  await c.foto('Se quiser, registre também o pensamento automático: a frase que passou pela cabeça na hora. O app ajuda a questionar esse pensamento e a buscar um mais equilibrado.', campos.nth(1));
  await campos.nth(n - 1).fill('Respirei dois minutos antes de responder.');
  await c.foto('Por fim, a ação: o que você fez. Isso mostra como você está conduzindo as emoções.', campos.nth(n - 1));
  await c.foto('Toque em "Salvar registro". Os registros são privados e protegidos.', c.t('Salvar registro'));
  await c.t('Salvar registro').click();
  await pg.waitForTimeout(1800);
  await c.vai('/diario');
  await c.foto('O registro aparece na lista, com data, emoções e intensidade. No topo, as emoções mais presentes nos últimos 30 dias.');
  await c.foto('Em "Minha evolução" você vê o resumo do mês. Em "Exportar PDF", gera um arquivo com seus registros.', c.t('Exportar PDF'));
});

cap('roda-das-emocoes', 'Roda das Emoções', 'Como nomear o que você sente e o que fazer com cada emoção.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/roda');
  await c.foto('A Roda das Emoções ajuda a dar nome ao que você sente. Dar o nome exato já é o primeiro passo para conduzir a emoção.');
  await c.toca(pg.getByText('Medo', { exact: true }).last(), 800);
  await c.foto('Toque em uma cor ou no nome. Cada emoção tem três intensidades: aqui, apreensão, medo e terror.', c.tc('Apreensão →'));
  await c.foto('Para cada emoção você vê para que ela serve e como conduzi-la no dia a dia.', c.tc('Para que serve'));
  await c.foto('Toque em "Registrar no diário" para levar essa emoção direto para um novo registro.', c.t('Registrar no diário'));
});

cap('tres-gratidoes', 'Três gratidões', 'A prática do fim do dia que vai para o diário.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/gratidao');
  await c.foto('Ao fim do dia, anote três coisas pelas quais você é grato. Pode ser algo pequeno.');
  const ins = pg.locator('textarea, input');
  await ins.nth(0).fill('Café sem pressa');
  await ins.nth(1).fill('Conversa boa com um cliente');
  await ins.nth(2).fill('Treino feito');
  await c.foto('Escreva uma em cada linha.', ins.nth(0));
  await c.foto('Toque em "Salvar e registrar no diário". Elas entram no Diário das Emoções e você pode completar o registro.', c.t('Salvar e registrar no diário'));
});

cap('respiro-4-6', 'Respiro 4–6', 'Dois minutos de respiração guiada para baixar a tensão.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/respirar');
  await c.foto('O Respiro 4–6 leva dois minutos: inspire contando até 4 e solte contando até 6.');
  await c.foto('Escolha o guia: voz guiada ou sons.', c.t('Voz guiada'));
  await c.foto('Toque em "Começar" e acompanhe o círculo: ele cresce na inspiração e diminui na expiração.', c.t('Começar'));
  await c.t('Começar').click();
  await pg.waitForTimeout(2600);
  await c.foto('No iPhone, tire do modo silencioso para ouvir a voz. Ao terminar, você pode registrar como ficou no diário.');
});

cap('meditacao', 'Meditação guiada', 'Sessões de 3, 5 ou 10 minutos.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/meditar');
  await c.foto('A meditação são alguns minutos de silêncio guiado para ouvir o que você sente com mais honestidade.');
  await pg.getByText('10 min', { exact: true }).click();
  await c.foto('Escolha a duração: 3, 5 ou 10 minutos.', c.t('10 min'));
  await c.foto('Escolha o guia: voz guiada ou apenas sons.', c.t('Sons'));
  await c.t('Começar').click();
  await pg.waitForTimeout(2500);
  await c.foto('Toque em "Começar", feche os olhos e siga a voz. O tempo aparece na tela.');
});

cap('matriz-de-prioridades', 'Matriz de prioridades', 'Separar o urgente do importante e escolher o próximo passo.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/matriz');
  await c.foto('A Matriz de prioridades separa o urgente do importante. Liste o que está na sua cabeça e coloque cada item no lugar certo.');
  const tarefas = [
    ['Responder proposta do cliente', 'Fazer agora'],
    ['Planejar a semana da equipe', 'Agendar'],
    ['Organizar e-mails antigos', 'Delegar'],
  ];
  const campo = pg.locator('input').first();
  await campo.fill(tarefas[0][0]);
  await pg.getByText('Fazer agora', { exact: true }).first().click();
  await c.foto('Escreva a tarefa e escolha o quadrante: fazer agora, agendar, delegar ou descartar.', c.t('Fazer agora'));
  await c.t('Adicionar').click();
  for (const [t, q] of tarefas.slice(1)) {
    await campo.fill(t);
    await pg.getByText(q, { exact: true }).first().click();
    await c.t('Adicionar').click();
    await pg.waitForTimeout(400);
  }
  await campo.fill('Rolar o feed sem objetivo');
  await pg.getByText('Descartar', { exact: true }).first().click();
  await c.t('Adicionar').click();
  await pg.waitForTimeout(400);
  await c.rola(300);
  await c.foto('Cada tarefa vai para o seu quadrante. Comece pelo "Fazer agora" e reserve horário para o "Agendar".');
  await c.foto('Marque a caixinha quando concluir. Nos três pontinhos você muda de quadrante ou apaga a tarefa.', pg.getByText('Responder proposta do cliente', { exact: true }));
});

cap('foco-com-pausa', 'Foco com pausa (Pomodoro)', 'Blocos de 25 minutos de foco e 5 de pausa.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/pomodoro');
  await c.foto('O Foco com pausa usa blocos de 25 minutos de foco e 5 minutos de pausa. Ajuda a render sem se esgotar.');
  await c.foto('Escolha uma tarefa só, silencie as notificações e toque em "Começar foco".', c.t('Começar foco'));
  await c.t('Começar foco').click();
  await pg.waitForTimeout(2500);
  await c.foto('O cronômetro corre na tela. Ao final, o app avisa a hora da pausa e conta os blocos concluídos no dia.');
});

cap('plano-de-constancia', 'Plano de constância', 'Um hábito pequeno preso a uma rotina que você já tem.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/constancia');
  await c.foto('O Plano de constância cria um hábito pequeno de todo dia, preso a uma rotina que você já tem.');
  await pg.getByText('Depois do café da manhã').click();
  await c.foto('Primeiro, escolha a âncora: o momento do dia em que a prática vai acontecer.', c.t('Depois do café da manhã'));
  await pg.getByText('Respiro 4–6').click();
  await c.foto('Depois, a prática: gratidão, respiro, meditação ou um registro no diário.', c.t('Respiro 4–6'));
  await c.foto('Toque em "Salvar meu plano".', c.t('Salvar meu plano'));
  await c.t('Salvar meu plano').click();
  await pg.waitForTimeout(1500);
  await c.foto('Com o plano salvo, toque em "Marquei hoje" nos dias em que cumprir. O app conta os dias seguidos e mostra as últimas duas semanas.');
});

cap('check-in-da-semana', 'Check-in da semana', 'Cinco perguntas para acompanhar a sua semana.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/checkin');
  await c.foto('O check-in da semana tem cinco perguntas e leva menos de um minuto. Não é avaliação: é um retrato da sua semana.');
  const notas = [3, 2, 2, 1, 3];
  for (let i = 0; i < 5; i++) await pg.getByText(String(notas[i]), { exact: true }).nth(i).click();
  await c.foto('Para cada pergunta, toque em um número de 0 a 4: humor, energia, sono, ansiedade e o quanto você conduziu as emoções.', pg.getByText('3', { exact: true }).nth(0));
  await c.rola(400);
  await c.foto('Se quiser, escreva algo que marcou a semana. Depois toque em "Salvar check-in".', c.t('Salvar check-in'));
  await c.foto('Faça um check-in por semana. A partir do segundo, aparece o gráfico em Minha evolução.');
});

cap('minha-evolucao', 'Minha evolução', 'Gráficos dos check-ins e o resumo do mês.', async (c) => {
  await c.abrir({ dados: semente() });
  const pg = c.pg;
  await c.vai('/evolucao');
  await c.foto('Em Minha evolução você vê o caminho feito. Não é nota: é para perceber padrões e reconhecer o que mudou.');
  await c.foto('O gráfico mostra os seus check-ins semana a semana.', c.tc('Check-ins ao longo do tempo'));
  await pg.getByText('Ansiedade', { exact: true }).first().click();
  await pg.waitForTimeout(500);
  await c.foto('Toque nos botões para trocar o que o gráfico mostra: condução, ansiedade, humor, energia ou sono.', pg.getByText('Ansiedade', { exact: true }).first());
  await c.foto('No resumo do mês: registros no diário, check-ins, médias de condução e ansiedade, dias com gratidão e de constância.', c.tc('Resumo do mês'));
  await c.ate(c.tc('Emoções do mês'));
  await c.foto('"Emoções do mês" mostra as emoções que mais apareceram no seu diário.', c.tc('Emoções do mês'));
  await c.foto('Toque nos meses para comparar com os anteriores. Embaixo, quantas estações da trilha você concluiu.', c.tc('estações da trilha concluídas'));
});

cap('exportar-diario-pdf', 'Exportar o diário em PDF', 'Gerar um arquivo para guardar ou levar ao seu psicólogo.', async (c) => {
  await c.abrir({ dados: semente() });
  const pg = c.pg;
  await c.vai('/exportar');
  await c.foto('Você pode gerar um PDF com os seus registros para guardar ou levar ao seu psicólogo.');
  await pg.getByText('Últimos 3 meses').click();
  await c.foto('Escolha o período: últimos 30 dias, 3 meses ou tudo.', c.t('Últimos 3 meses'));
  await c.foto('Marque se quer incluir os check-ins semanais.', c.tc('Incluir os check-ins semanais'));
  await c.foto('Toque em "Gerar PDF" e escolha para onde enviar. O arquivo só sai do celular quando você decide.', c.t('Gerar PDF'));
});

cap('testes-como-funcionam', 'Testes: como fazer e ver o resultado', 'Como fazer um teste, ler o resultado e acompanhar ao longo do tempo.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/testes');
  await c.foto('Os testes de autoconhecimento ficam em Conteúdos ou no Início. São 17 testes, em quatro grupos.');
  await c.foto('Personalidade, habilidades e liderança, bem-estar e saúde emocional. Cada cartão mostra o tempo médio.', c.tc('Personalidade'));
  await c.rola(900);
  await c.foto('Os testes são instrumentos de reflexão, não diagnóstico. No fim da lista, há o link para outros testes no portal GovernaMente.');
  await c.vai('/teste/amabilidade');
  await c.foto('Antes de começar, o teste explica o que avalia, quantas perguntas tem e quanto tempo leva.');
  await c.foto('Toque em "Começar com calma".', c.t('Começar com calma'));
  await c.t('Começar com calma').click();
  await pg.waitForTimeout(700);
  await c.foto('Responda pensando em como você costuma ser, e não em como gostaria de ser. A barra mostra o progresso.');
  const radios = () => pg.getByRole('radio');
  const padrao = [3, 2, 4, 3, 1, 3, 2, 4, 3, 2, 3, 1];
  for (let i = 0; i < 40; i++) {
    if ((await radios().count()) === 0) break;
    await radios().nth(padrao[i % padrao.length]).click();
    await pg.waitForTimeout(260);
    if (i === 3) await c.foto('Toque na resposta e a próxima pergunta aparece sozinha. Errou? Use "← Voltar".', c.t('← Voltar'));
  }
  await pg.waitForTimeout(800);
  await c.topo();
  await c.foto('O resultado aparece na hora: uma leitura geral do seu momento.');
  await c.rola(450);
  await c.foto('Depois, o resultado por eixo, em porcentagem, com a explicação de cada um.');
  await c.ate(c.tc('Um passo possível agora'));
  await c.foto('Em "Um passo possível agora" há uma sugestão prática para aplicar o que você descobriu.', c.tc('Um passo possível agora'));
  await c.foto('Registre o que percebeu no diário, refaça o teste ou volte para a lista.', c.t('Registrar o que percebi no diário'));
  await c.vai('/testes');
  await c.foto('Na lista, o teste mostra a data do último resultado. O resultado fica guardado só para você.', c.tc('Amabilidade'));
  await c.vai('/teste/amabilidade');
  await c.foto('Para rever, abra o teste e toque em "Ver resultado de…". Refaça de tempos em tempos para comparar a sua evolução.', c.tc('Ver resultado de'));
});

const EXPLICA = {
  ranking: 'O resultado mostra a predominância de cada eixo, do mais forte para o mais fraco, com a explicação de cada um.',
  neutro: 'O resultado mostra onde você está nesse traço, com a explicação dos dois lados. Nenhum lado é melhor que o outro.',
  pos: 'O resultado mostra uma porcentagem geral e a pontuação de cada eixo, para você ver o que já domina e o que pode desenvolver.',
  nivel: 'O resultado mostra o nível em cada eixo, com a leitura do que ele indica e um passo possível agora.',
  apego: 'O resultado mostra o seu estilo predominante, com a explicação de como ele aparece nos vínculos.',
};

TESTES.forEach((t, i) => {
  cap(`teste-${t.id}`, `Teste: ${t.titulo}`, t.resumo, async (c) => {
    await c.abrir();
    const pg = c.pg;
    await c.vai('/testes');
    await c.foto(`O teste ${t.titulo} fica na lista de testes. Leva cerca de ${t.tempo}.`, c.tc(t.titulo));
    await c.vai('/teste/' + t.id);
    await c.foto(`O que ele avalia: ${t.resumo.replace(/\.$/, '')}.`);
    await c.foto(`São ${t.n} perguntas. Toque em "Começar com calma".`, c.t('Começar com calma'));
    await c.t('Começar com calma').click();
    await pg.waitForTimeout(700);
    const radios = () => pg.getByRole('radio');
    const padrao = [3, 1, 4, 2, 3, 0, 2, 4, 3, 1, 2, 3, 4, 2, 1];
    for (let k = 0; k < 80; k++) {
      if ((await radios().count()) === 0) break;
      if (k === 1) await c.foto('Escolha a resposta que mais se parece com você. A próxima pergunta aparece sozinha.');
      await radios().nth(padrao[(k + i) % padrao.length] % (await radios().count())).click();
      await pg.waitForTimeout(240);
    }
    await pg.waitForTimeout(800);
    await c.topo();
    await c.foto('O resultado aparece na hora e fica guardado só para você.');
    await c.rola(450);
    await c.foto(EXPLICA[t.modo] ?? EXPLICA.nivel);
    if (t.cuidado) {
      await c.ate(c.tc('Cuidado importante'));
      await c.foto('Quando o resultado pede atenção, o app mostra o cuidado importante e os atalhos para o apoio e para o Respiro 4–6.', c.tc('Cuidado importante'));
    }
    await c.ate(c.t('Refazer o teste'));
    await c.foto('Refaça o teste de tempos em tempos para comparar. O último resultado fica salvo na lista de testes.', c.t('Refazer o teste'));
  });
});

cap('agenda-ao-vivo', 'Agenda ao vivo', 'Lives, encontros e lembretes 15 minutos antes.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/agenda');
  await c.foto('A Agenda ao vivo mostra as lives, o Grupo da Generosidade e os encontros da Mesa.');
  await c.foto('Em "Próximos dias", cada encontro tem data, horário e o link para entrar.', c.tc('Abrir link'));
  await c.ate(c.t('Lembretes', 'last'));
  await c.foto('Em "Lembretes", ative o aviso do encontro que você quer acompanhar. O celular avisa 15 minutos antes.', c.t('Lembretes', 'last'));
  await c.foto('Se você é Tripulante da Mesa, o atalho no fim leva à Área do Tripulante.', c.tc('Sou Tripulante'));
});

cap('area-do-tripulante', 'Área do Tripulante', 'O espaço de quem participa da Mesa GovernaMente.', async (c) => {
  await c.abrir();
  await c.vai('/tripulante');
  await c.foto('A Área do Tripulante é exclusiva de quem participa da Mesa GovernaMente: link dos encontros, gravações e a semana atual da Travessia.');
  await c.foto('Para liberar, entre no app com o mesmo e-mail da sua inscrição na Mesa. Ainda não participa? Toque em "Conhecer a Mesa".', c.tc('Conhecer a Mesa'));
});

cap('lembretes', 'Lembretes', 'Avisos diários para manter a constância.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/lembretes');
  await c.foto('Os lembretes são pequenos avisos para manter a constância. No máximo um por dia de cada tipo.');
  await c.foto('Ligue ou desligue cada lembrete e escolha o horário: prática do dia, diário, check-in da semana e aviso do fim do teste grátis.', c.tc('Prática do dia'));
  await c.rola(600);
  await c.foto('Toque em salvar. Na primeira vez, o celular pede permissão para enviar notificações: toque em Permitir.');
  await c.foto('Os lembretes também ficam em Conta, em Preferências.');
});

cap('conta-e-assinatura', 'Conta e assinatura', 'Planos, assinatura, preferências e saída.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/conta');
  await c.foto('Na aba Conta ficam os seus dados, o seu acesso, as preferências e o contato com a gente.');
  await c.foto('Em "Seu acesso" você vê quantos dias de teste faltam. Toque em "Ver planos" para assinar.', c.tc('Ver planos'));
  await c.vai('/assinar');
  await c.foto('Na tela de assinatura, veja tudo o que está incluído.');
  await c.foto('Escolha o plano anual, que sai mais barato por mês, ou o mensal, que você cancela quando quiser.', c.tc('Anual'));
  await c.foto('Toque em "Assinar" e confirme com a sua conta Apple ou Google. A cobrança é feita pela loja.', c.t('Assinar plano anual'));
  await c.foto('É da Mesa ou do Plano Individual? Toque em "verificar acesso". Já assinou em outro celular? Use "Restaurar compras", nesta mesma tela.', c.tc('Já assino ou sou da Mesa'));
  await c.foto('A renovação é automática. Para cancelar, use os ajustes de assinatura do iPhone ou do Google Play.', c.tc('A assinatura renova'));
  await c.vai('/conta');
  await c.ate(c.t('Enviar e-mail'));
  await c.foto('Em "Fale com a gente", tire dúvidas sobre o app ou a assinatura por e-mail.', c.t('Enviar e-mail'));
  await c.foto('"Sair" desconecta a conta deste celular. Seus registros continuam guardados.', c.t('Sair'));
});

cap('codigo-de-acesso', 'Código de acesso', 'Como ativar um código recebido com o livro, de presente ou de uma empresa.', async (c) => {
  await c.abrir();
  const pg = c.pg;
  await c.vai('/conta');
  await c.foto('Recebeu um código junto com o livro, de presente ou de uma empresa parceira? Em Conta, toque em "Tenho um código de acesso".', c.t('Tenho um código de acesso'));
  await c.vai('/codigo');
  await pg.locator('input').first().fill('GM-LIVRO-2026');
  await c.foto('Digite o código exatamente como recebeu.', pg.locator('input').first());
  await c.foto('Toque em "Ativar código". O acesso é liberado na hora, pelo período do código.', c.t('Ativar código'));
});

cap('privacidade-e-exclusao', 'Privacidade e exclusão da conta', 'Como cuidamos dos seus dados e como apagar a conta.', async (c) => {
  await c.abrir();
  await c.vai('/privacidade');
  await c.foto('Em Conta, "Privacidade e seus dados" explica como os seus registros são guardados: de forma protegida e só a sua conta tem acesso.');
  await c.foto('A política de privacidade completa abre por este botão.', c.t('Política de privacidade completa'));
  await c.vai('/conta');
  await c.ate(c.t('Excluir minha conta'));
  await c.foto('Para apagar a conta e todos os registros, toque em "Excluir minha conta" e confirme. Essa ação não pode ser desfeita.', c.t('Excluir minha conta'));
});

cap('apoio-agora', 'Precisa de ajuda agora?', 'Os contatos de apoio emocional e de emergência.', async (c) => {
  await c.abrir();
  await c.foto('Em todas as telas há o atalho "Precisa de ajuda agora? Toque aqui."', c.tc('Precisa de ajuda agora?'));
  await c.vai('/apoio');
  await c.foto('O GovernaMente é educacional e não substitui atendimento psicológico ou médico. Em sofrimento intenso, procure ajuda.');
  await c.foto('O CVV atende pelo 188, de graça, 24 horas, por telefone, chat ou e-mail. Toque para ligar ou abrir o chat.', await c.card(c.tc('CVV · 188')));
  await c.foto('Em emergência médica, ligue 192 (SAMU). Em risco imediato, vá ao pronto-socorro ou ligue 190.', await c.card(c.tc('SAMU · 192')));
});

// ------------------------------------------------------------ execução
(async () => {
  const so = process.argv.slice(2);
  const b = await chromium.launch();
  const manifesto = fs.existsSync(MANIFESTO) ? JSON.parse(fs.readFileSync(MANIFESTO, 'utf8')) : {};
  for (const k of CAPS) {
    if (so.length && !so.some((s) => k.id.startsWith(s))) continue;
    const c = new Cap(b, k.id, k.titulo, k.resumo);
    fs.rmSync(c.dir, { recursive: true, force: true });
    fs.mkdirSync(c.dir, { recursive: true });
    try {
      await k.fn(c);
      manifesto[k.id] = { titulo: k.titulo, resumo: k.resumo, passos: c.passos };
      console.log('ok', k.id, c.passos.length);
    } catch (e) {
      console.log('ERRO', k.id, 'passo', c.passos.length + 1, String(e.message).split('\n')[0]);
    } finally {
      await c.ctx?.close().catch(() => {});
    }
  }
  manifesto.__ordem = CAPS.map((k) => k.id);
  fs.writeFileSync(MANIFESTO, JSON.stringify(manifesto, null, 1));
  await b.close();
})();
