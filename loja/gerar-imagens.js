const { chromium } = require('playwright');
const path = require('path');
const R = '/home/claude/governamente-app';
const F = R + '/node_modules/@expo-google-fonts';
const css = `
@font-face{font-family:Fraunces;font-weight:600;src:url(file://${F}/fraunces/600SemiBold/Fraunces_600SemiBold.ttf)}
@font-face{font-family:Fraunces;font-style:italic;font-weight:500;src:url(file://${F}/fraunces/500Medium_Italic/Fraunces_500Medium_Italic.ttf)}
@font-face{font-family:Figtree;font-weight:400;src:url(file://${F}/figtree/400Regular/Figtree_400Regular.ttf)}
@font-face{font-family:Figtree;font-weight:600;src:url(file://${F}/figtree/600SemiBold/Figtree_600SemiBold.ttf)}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:#1E3A39;color:#F3EDE3;font-family:Figtree;overflow:hidden;position:relative}
.top{padding:120px 90px 0}
.kick{font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#D9962F;font-size:30px}
h1{font-family:Fraunces;font-weight:600;font-size:82px;line-height:1.08;margin-top:26px}
h1 em{font-style:italic;font-weight:500;color:#A7B8A0}
p{font-size:36px;line-height:1.4;color:#d9d2c5;margin-top:28px;max-width:860px}
.fone{position:absolute;left:50%;transform:translateX(-50%);bottom:-70px;width:700px;border-radius:64px;border:16px solid #142827;box-shadow:0 40px 90px rgba(0,0,0,.45);overflow:hidden;background:#142827}
.fone img{display:block;width:100%}
`;
const telas = [
  ['inicio','Seu dia, conduzido','O que é <em>importante</em> hoje?','Um painel simples para começar o dia com clareza.'],
  ['trilha','Aulas em áudio e texto','A trilha do <em>GovernaMente</em>','Lições curtas para aplicar no mesmo dia.'],
  ['respirar','Respiro 4–6','Dois minutos para <em>baixar o volume</em>','Voz guiada e sons para acalmar o corpo.'],
  ['matriz','Prioridades','Urgente ou <em>importante</em>?','Organize as tarefas e decida o próximo passo.'],
  ['diario','Diário','Escreva o que a <em>mente</em> está dizendo','Registre emoções e perceba seus padrões.'],
  ['roda','Autoavaliação','Como está a sua <em>vida</em> hoje?','Roda da vida e testes para se conhecer melhor.'],
  ['agenda','Ao vivo','Encontros com o <em>Rodrigo</em>','Lives e grupos para seguir acompanhado.'],
];
(async () => {
  const fs=require('fs'); const b = await chromium.launch(); const html=f=>{fs.writeFileSync(process.argv[2]+'/../p.html',f); return 'file://'+path.resolve(process.argv[2]+'/../p.html');};
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  let i = 1;
  for (const [img, k, t, d] of telas) {
    await pg.goto(html(`<meta charset=utf-8><style>${css}</style><div class=top><div class=kick>${k}</div><h1>${t}</h1><p>${d}</p></div><div class=fone><img src="file://${R}/site-venda/img/${img}.webp"></div>`));
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: `${process.argv[2]}/tela-${i++}-${img}.png` });
  }
  // feature graphic 1024x500
  await pg.setViewportSize({ width: 1024, height: 500 });
  await pg.goto(html(`<meta charset=utf-8><style>${css}
  body{width:1024px;height:500px}
  .t{position:absolute;left:70px;top:105px;width:560px}
  .t h1{font-size:60px}.t p{font-size:25px;margin-top:20px}
  .ic{position:absolute;left:70px;top:0}
  .f{position:absolute;right:70px;top:60px;width:300px;border-radius:36px;border:10px solid #142827;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.4);transform:rotate(-4deg)}
  .f img{width:100%;display:block}
  </style><div class=t><div class=kick style="font-size:20px">App GovernaMente</div><h1>Conduza a sua <em>mente</em>, um dia de cada vez</h1><p>Aulas, respiração guiada, meditação e diário.</p></div><div class=f><img src="file://${R}/site-venda/img/inicio.webp"></div>`));
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${process.argv[2]}/destaque-1024x500.png` });
  await b.close();
})();
