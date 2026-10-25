/** Exportar o Diário das Emoções em PDF (para guardar ou levar ao psicólogo). */
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { CheckIn, RegistroDiario } from './dados';

const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const dataBr = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
  ' ' +
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const LOGO =
  '<svg viewBox="0 0 64 64" width="34" height="34" fill="none"><path d="M22 58L22 50C14 46 10 38 10 29C10 16 20 7 32 7C44 7 52 15 52 26L56 34C56.6 35.2 56 36 54.8 36L52 36L52 41C52 44 50 46 47 46L42 46L42 58" stroke="#1E3A39" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 28C21.5 23.5 25.5 23.5 29 28C32.5 32.5 36.5 32.5 40 28" stroke="#6E8A69" stroke-width="4" stroke-linecap="round"/><circle cx="41" cy="17" r="3.4" fill="#D9962F"/></svg>';

export function montarHtmlDiario(opts: {
  nome: string;
  periodo: string;
  registros: RegistroDiario[];
  checkins?: CheckIn[];
}): string {
  const { nome, periodo, registros, checkins } = opts;
  const conta: Record<string, number> = {};
  registros.forEach((r) => r.emocoes.forEach((e) => (conta[e] = (conta[e] ?? 0) + 1)));
  const top = Object.entries(conta)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const media = registros.length ? (registros.reduce((a, r) => a + r.intensidade, 0) / registros.length).toFixed(1) : '–';

  const blocoCheckins =
    checkins && checkins.length
      ? `<h2>Check-ins semanais</h2>
        <table><thead><tr><th>Data</th><th>Humor</th><th>Energia</th><th>Sono</th><th>Ansiedade</th><th>Condução</th></tr></thead><tbody>
        ${checkins
          .map(
            (c) =>
              `<tr><td>${esc(new Date(c.criado_em).toLocaleDateString('pt-BR'))}</td><td>${c.humor}</td><td>${c.energia}</td><td>${c.sono}</td><td>${c.ansiedade}</td><td>${c.conducao}</td></tr>`,
          )
          .join('')}
        </tbody></table>
        <p class="nota">Escala de 0 a 4. Em "ansiedade", quanto maior, mais ela atrapalhou.</p>`
      : '';

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Diário das Emoções</title>
<style>
  @page { margin: 18mm 16mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #23282A; font-size: 11.5pt; line-height: 1.5; }
  header { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #D9962F; padding-bottom: 10px; margin-bottom: 14px; }
  .marca { font-size: 18pt; color: #1E3A39; } .marca i { color: #9A5F14; }
  h1 { font-size: 20pt; color: #1E3A39; margin: 4px 0; }
  h2 { font-size: 14pt; color: #1E3A39; margin: 22px 0 8px; }
  .meta { color: #5B6264; font-family: Arial, sans-serif; font-size: 10pt; }
  .resumo { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
  .caixa { border: 1px solid #E2D9CB; background: #FAF6EF; border-radius: 8px; padding: 8px 12px; font-family: Arial, sans-serif; font-size: 10pt; }
  .caixa b { display: block; font-family: Georgia, serif; font-size: 15pt; color: #1E3A39; }
  .tag { display: inline-block; background: #F3EDE3; border-radius: 99px; padding: 2px 9px; margin: 2px; font-family: Arial, sans-serif; font-size: 9.5pt; color: #1E3A39; }
  .reg { border: 1px solid #E2D9CB; border-radius: 8px; padding: 10px 12px; margin: 0 0 10px; page-break-inside: avoid; }
  .reg .topo { display: flex; justify-content: space-between; font-family: Arial, sans-serif; font-size: 9.5pt; color: #5B6264; }
  .rot { font-family: Arial, sans-serif; font-weight: bold; font-size: 9pt; color: #9A5F14; letter-spacing: .4px; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt; }
  th, td { border-bottom: 1px solid #E2D9CB; padding: 5px 4px; text-align: center; } th { color: #1E3A39; }
  td:first-child, th:first-child { text-align: left; }
  .nota, footer { font-family: Arial, sans-serif; font-size: 9pt; color: #5B6264; }
  footer { margin-top: 24px; border-top: 1px solid #E2D9CB; padding-top: 8px; }
</style></head><body>
<header>${LOGO}<span class="marca">Governa<i>Mente</i></span></header>
<h1>Diário das Emoções</h1>
<div class="meta">${esc(nome || 'Registro pessoal')} · ${esc(periodo)} · gerado em ${esc(new Date().toLocaleDateString('pt-BR'))}</div>

<div class="resumo">
  <div class="caixa"><b>${registros.length}</b>registros</div>
  <div class="caixa"><b>${media}</b>intensidade média (0–10)</div>
</div>
${top.length ? `<div>${top.map(([e, n]) => `<span class="tag">${esc(e)} · ${n}</span>`).join(' ')}</div>` : ''}

<h2>Registros</h2>
${
  registros.length
    ? registros
        .map(
          (r) => `<div class="reg">
  <div class="topo"><span>${esc(dataBr(r.criado_em))}</span><span>Intensidade ${r.intensidade}/10</span></div>
  <div>${r.emocoes.map((e) => `<span class="tag">${esc(e)}</span>`).join(' ')}</div>
  <div class="rot">SITUAÇÃO</div><div>${esc(r.situacao)}</div>
  ${r.pensamento ? `<div class="rot">PENSAMENTO</div><div>${esc(r.pensamento).replace(/\n/g, '<br>')}</div>` : ''}
  <div class="rot">AÇÃO</div><div>${esc(r.acao)}</div>
</div>`,
        )
        .join('')
    : '<p>Nenhum registro neste período.</p>'
}
${blocoCheckins}
<footer>Documento pessoal gerado pelo app GovernaMente, de uso educacional. Não é prontuário nem laudo psicológico.
Se for levar a um profissional, ele pode usar estes registros como ponto de partida da conversa.</footer>
</body></html>`;
}

/** Gera e entrega o PDF: compartilhar no celular, imprimir/salvar como PDF no navegador. */
export async function exportarPdf(html: string, nomeArquivo = 'diario-das-emocoes') {
  if (Platform.OS === 'web') {
    const w = window.open('', '_blank');
    if (!w) throw new Error('janela bloqueada');
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.document.title = nomeArquivo;
    setTimeout(() => w.print(), 400);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Diário das Emoções' });
  } else {
    await Print.printAsync({ uri });
  }
}
