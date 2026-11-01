// Desenha os quadros 1920x1080 (capa de cada capítulo, passos, abertura e encerramento).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const M = JSON.parse(fs.readFileSync('/tmp/vid/manifesto.json', 'utf8'));
const F = '/home/claude/governamente-app/node_modules/@expo-google-fonts';
const OUT = '/tmp/vid/quadros';
fs.mkdirSync(OUT, { recursive: true });

const LOGO = (s, cor = '#F3EDE3') => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><path d="M22 58L22 50C14 46 10 38 10 29C10 16 20 7 32 7C44 7 52 15 52 26L56 34C56.6 35.2 56 36 54.8 36L52 36L52 41C52 44 50 46 47 46L42 46L42 58" stroke="${cor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M18 28C21.5 23.5 25.5 23.5 29 28C32.5 32.5 36.5 32.5 40 28" stroke="#A7B8A0" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="41" cy="17" r="3.4" fill="#D9962F"/></svg>`;

const CSS = `
@font-face{font-family:Fraunces;font-weight:600;src:url(file://${F}/fraunces/600SemiBold/Fraunces_600SemiBold.ttf)}
@font-face{font-family:Fraunces;font-style:italic;font-weight:500;src:url(file://${F}/fraunces/500Medium_Italic/Fraunces_500Medium_Italic.ttf)}
@font-face{font-family:Figtree;font-weight:400;src:url(file://${F}/figtree/400Regular/Figtree_400Regular.ttf)}
@font-face{font-family:Figtree;font-weight:600;src:url(file://${F}/figtree/600SemiBold/Figtree_600SemiBold.ttf)}
*{margin:0;box-sizing:border-box}
body{width:1920px;height:1080px;overflow:hidden;background:#1E3A39;color:#F3EDE3;font-family:Figtree;position:relative}
.bg{position:absolute;inset:0;background:radial-gradient(1200px 800px at 25% 50%,#24474599,transparent 70%)}
.fone{position:absolute;left:250px;top:56px;width:448px;height:968px;border-radius:62px;background:#0d1b1a;padding:14px;box-shadow:0 40px 90px rgba(0,0,0,.45),0 0 0 2px #2c4f4d}
.fone img{width:420px;height:910px;border-radius:48px;display:block;object-fit:cover;object-position:top}
.dir{position:absolute;left:820px;right:130px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
.kick{font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#E0A84A;font-size:24px}
.tit{font-family:Fraunces;font-weight:600;font-size:46px;line-height:1.12;margin-top:14px;color:#F3EDE3}
.linha{width:80px;height:4px;background:#D9962F;border-radius:2px;margin:34px 0 34px}
.leg{font-size:46px;line-height:1.36;color:#F3EDE3;font-weight:400}
.leg b{color:#E0A84A;font-weight:600}
.pe{position:absolute;left:820px;right:130px;bottom:64px;display:flex;align-items:center;justify-content:space-between;color:#A7B8A0;font-size:24px}
.dots{display:flex;gap:10px;align-items:center}
.dot{width:12px;height:12px;border-radius:6px;background:#3d5f5c}
.dot.on{background:#E0A84A;width:34px}
.marca{display:flex;align-items:center;gap:12px;font-family:Fraunces;font-weight:600;font-size:28px;color:#F3EDE3}
.marca em{font-style:italic;font-weight:500;color:#E0A84A}
/* capa */
.capa{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 220px}
.num{font-family:Fraunces;font-style:italic;font-weight:500;font-size:150px;color:#E0A84A;line-height:1}
.ctit{font-family:Fraunces;font-weight:600;font-size:96px;line-height:1.08;margin-top:22px;max-width:1450px}
.cres{font-size:42px;color:#cfd8cb;margin-top:30px;max-width:1300px;line-height:1.35}
.topo{position:absolute;left:220px;top:90px;display:flex;align-items:center;gap:16px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#A7B8A0;font-size:24px}
`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"([^"]+)"/g, '<b>“$1”</b>');
const marca = `<div class="marca">${LOGO(42)}<span>Governa<em>Mente</em></span></div>`;

function htmlPasso(cap, num, i, n, p) {
  const dots = Array.from({ length: n }, (_, k) => `<div class="dot ${k === i ? 'on' : ''}"></div>`).join('');
  return `<html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="bg"></div>
  <div class="fone"><img src="file://${p.img}"></div>
  <div class="dir"><div class="kick">Guia do app · ${String(num).padStart(2, '0')}</div><div class="tit">${esc(cap.titulo)}</div><div class="linha"></div><div class="leg">${esc(p.legenda)}</div></div>
  <div class="pe"><div class="dots">${dots}<span style="margin-left:14px">Passo ${i + 1} de ${n}</span></div>${marca}</div></body></html>`;
}
function htmlCapa(num, titulo, resumo, topo = 'Guia do app GovernaMente') {
  return `<html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="bg"></div>
  <div class="topo">${LOGO(40)}<span>${topo}</span></div>
  <div class="capa">${num !== null ? `<div class="num">${String(num).padStart(2, '0')}</div>` : ''}<div class="ctit">${esc(titulo)}</div><div class="cres">${esc(resumo)}</div></div></body></html>`;
}

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const ordem = M.__ordem.filter((id) => M[id]);
  const plano = { capitulos: [] };
  const shot = async (html, arq) => {
    fs.writeFileSync('/tmp/vid/q.html', html);
    await pg.goto('file:///tmp/vid/q.html');
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(120);
    await pg.screenshot({ path: arq, type: 'jpeg', quality: 92 });
  };
  await shot(htmlCapa(null, 'Guia completo do App GovernaMente', 'Cada tela, cada menu e cada ferramenta, passo a passo. Use os capítulos para ir direto ao que você precisa.'), `${OUT}/abertura.jpg`);
  await shot(htmlCapa(null, 'Ficou alguma dúvida?', 'Assista aos outros vídeos da playlist ou fale com a gente pelo app, em Conta → Fale com a gente.'), `${OUT}/fim.jpg`);
  await shot(htmlCapa(null, 'Veja também os outros vídeos', 'A playlist de dúvidas frequentes explica cada função do App GovernaMente. Dúvidas? Conta → Fale com a gente.'), `${OUT}/fim-clipe.jpg`);
  let num = 0;
  for (const id of ordem) {
    num++;
    const cap = M[id];
    const dir = path.join(OUT, id);
    fs.mkdirSync(dir, { recursive: true });
    await shot(htmlCapa(num, cap.titulo, cap.resumo), `${dir}/00.jpg`);
    const passos = [];
    for (let i = 0; i < cap.passos.length; i++) {
      const p = cap.passos[i];
      const arq = `${dir}/${String(i + 1).padStart(2, '0')}.jpg`;
      await shot(htmlPasso(cap, num, i, cap.passos.length, p), arq);
      const palavras = p.legenda.split(/\s+/).length;
      passos.push({ img: arq, legenda: p.legenda, dur: Math.min(12, Math.max(4, +(palavras / 2.4 + 1.3).toFixed(1))) });
    }
    plano.capitulos.push({ id, num, titulo: cap.titulo, resumo: cap.resumo, capa: `${dir}/00.jpg`, capaDur: 3.5, passos });
    console.log(num, id, passos.length);
  }
  fs.writeFileSync('/tmp/vid/plano.json', JSON.stringify(plano, null, 1));
  await b.close();
})();
