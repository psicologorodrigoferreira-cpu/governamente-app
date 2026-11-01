import json, os, subprocess, shutil
P = json.load(open('/tmp/vid/plano.json'))
Q = '/tmp/vid/quadros'
R = '/tmp/vid/render'; os.makedirs(R, exist_ok=True)
FPS = 30
ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-g', '60', '-an']

def q(d):  # arredonda para quadros inteiros
    return round(d * FPS) / FPS

def segmento(itens, saida):
    """itens: [(img, dur)] -> um mp4"""
    lista = saida + '.txt'
    with open(lista, 'w') as f:
        for img, dur in itens:
            f.write(f"file '{img}'\nduration {q(dur):.4f}\n")
        f.write(f"file '{itens[-1][0]}'\n")
    tmp = saida.replace('.mp4', '.tmp.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista,
                    '-vf', f'fps={FPS},format=yuv420p', *ENC, tmp], check=True)
    os.replace(tmp, saida)

def juntar(arqs, saida):
    lista = saida + '.txt'
    with open(lista, 'w') as f:
        for a in arqs: f.write(f"file '{a}'\n")
    tmp = saida.replace('.mp4', '.tmp.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', tmp], check=True)
    os.replace(tmp, saida)

def ts(t, srt=True):
    ms = int(round(t * 1000)); h = ms // 3600000; m = ms // 60000 % 60; s = ms // 1000 % 60; r = ms % 1000
    return f"{h:02d}:{m:02d}:{s:02d},{r:03d}" if srt else (f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}")

ABRE, FIM, FIMC = 5.0, 5.0, 4.0
segmento([(f'{Q}/abertura.jpg', ABRE)], f'{R}/abertura.mp4')
segmento([(f'{Q}/fim.jpg', FIM)], f'{R}/fim.mp4')
segmento([(f'{Q}/fim-clipe.jpg', FIMC)], f'{R}/fim-clipe.mp4')

info = []
for c in P['capitulos']:
    itens = [(c['capa'], c['capaDur'])] + [(p['img'], p['dur']) for p in c['passos']]
    nucleo = f"{R}/nucleo-{c['num']:02d}.mp4"
    segmento(itens, nucleo)
    info.append((c, itens, nucleo))
    print('ok', c['num'], c['id'], round(sum(q(d) for _, d in itens), 1))

# vídeo completo + legendas + capítulos
t = q(ABRE); srt = []; capitulos = [('0:00', 'Abertura')]
srt.append((0, t, 'Guia completo do App GovernaMente'))
for c, itens, _ in info:
    capitulos.append((ts(t, False), f"{c['num']:02d}. {c['titulo']}"))
    srt.append((t, t + q(c['capaDur']), f"{c['num']:02d}. {c['titulo']}")); t += q(c['capaDur'])
    for p in c['passos']:
        srt.append((t, t + q(p['dur']), p['legenda'])); t += q(p['dur'])
srt.append((t, t + q(FIM), 'Ficou alguma dúvida? Fale com a gente pelo app, em Conta → Fale com a gente.')); t += q(FIM)
total = t

FINAL = '/tmp/vid/entrega'; os.makedirs(FINAL + '/clipes', exist_ok=True); os.makedirs(FINAL + '/legendas', exist_ok=True)
juntar([f'{R}/abertura.mp4'] + [n for _, _, n in info] + [f'{R}/fim.mp4'], f'{FINAL}/guia-completo-app-governamente.mp4')

def grava_srt(linhas, arq):
    with open(arq, 'w', encoding='utf-8') as f:
        for i, (a, b, txt) in enumerate(linhas, 1):
            f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n")
grava_srt(srt, f'{FINAL}/legendas/guia-completo.srt')

clipes = []
for c, itens, nucleo in info:
    nome = f"{c['num']:02d}-{c['id']}"
    juntar([nucleo, f'{R}/fim-clipe.mp4'], f'{FINAL}/clipes/{nome}.mp4')
    t = 0; l = [(0, q(c['capaDur']), f"{c['titulo']}")]; t = q(c['capaDur'])
    for p in c['passos']:
        l.append((t, t + q(p['dur']), p['legenda'])); t += q(p['dur'])
    l.append((t, t + q(FIMC), 'Veja também os outros vídeos da playlist.')); t += q(FIMC)
    grava_srt(l, f'{FINAL}/legendas/{nome}.srt')
    clipes.append({'arquivo': f'clipes/{nome}.mp4', 'legenda': f'legendas/{nome}.srt', 'num': c['num'], 'titulo': c['titulo'], 'resumo': c['resumo'],
                   'duracao': round(t, 1), 'passos': [p['legenda'] for p in c['passos']]})
json.dump({'total': round(total, 1), 'capitulos': capitulos, 'clipes': clipes, 'srt': srt}, open('/tmp/vid/resultado.json', 'w'), ensure_ascii=False, indent=1)
print('total', ts(total, False))
