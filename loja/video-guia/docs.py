import json
R = json.load(open('/tmp/vid/resultado.json'))
E = '/tmp/vid/entrega'

def mmss(s):
    s = int(round(s)); return f"{s//60}:{s%60:02d}"

# 1) capítulos para a descrição do vídeo completo no YouTube
with open(f'{E}/capitulos-youtube.txt', 'w', encoding='utf-8') as f:
    f.write('Guia completo do App GovernaMente: cada tela, cada menu e cada ferramenta, passo a passo.\n\nCapítulos:\n')
    for t, nome in R['capitulos']:
        f.write(f'{t} {nome}\n')

# 2) tempos de corte + comando para cortar do vídeo completo
caps = R['capitulos'][1:]
inicio = {}
def seg(t):
    p = [int(x) for x in t.split(':')]
    return sum(v * 60 ** i for i, v in enumerate(reversed(p)))
with open(f'{E}/cortar-do-video-completo.sh', 'w', encoding='utf-8') as f:
    f.write('#!/bin/sh\n# Corta o vídeo completo em um arquivo por capítulo, sem perder qualidade.\n# Uso: sh cortar-do-video-completo.sh guia-completo-app-governamente.mp4\n# (Os clipes prontos já estão na pasta "clipes"; este script é para quando você editar o vídeo completo.)\nV="${1:-guia-completo-app-governamente.mp4}"\nmkdir -p cortes\n')
    for i, (t, nome) in enumerate(caps):
        a = seg(t)
        fim = seg(caps[i + 1][0]) if i + 1 < len(caps) else R['total'] - 5
        arq = R['clipes'][i]['arquivo'].split('/')[-1]
        f.write(f'ffmpeg -y -ss {a} -i "$V" -t {round(fim - a, 2)} -c copy "cortes/{arq}"\n')

# 3) roteiro de narração + títulos e descrições da playlist
with open(f'{E}/playlist-e-roteiro.md', 'w', encoding='utf-8') as f:
    f.write('# Playlist "Dúvidas frequentes · App GovernaMente"\n\n')
    f.write('Cada vídeo da pasta `clipes` é um item da playlist. Abaixo, para cada um: título, descrição para o YouTube, onde ele está no vídeo completo e o roteiro de narração (o mesmo texto da legenda, na ordem).\n\n')
    f.write('Para gravar a narração: leia o texto de cada passo enquanto a tela correspondente aparece. Os tempos estão no arquivo `.srt` do clipe, na pasta `legendas`.\n\n---\n\n')
    for c, (t, _) in zip(R['clipes'], caps):
        f.write(f"## {c['num']:02d}. {c['titulo']}\n\n")
        f.write(f"**Arquivo:** `{c['arquivo']}` ({mmss(c['duracao'])})  \n**No vídeo completo:** a partir de {t}\n\n")
        f.write(f"**Título no YouTube:** {c['titulo']} | App GovernaMente (dúvidas frequentes)\n\n")
        f.write(f"**Descrição:** {c['resumo']} Passo a passo no App GovernaMente, o app do método do livro GovernaMente, do psicólogo Rodrigo Ferreira. Baixe na App Store ou no Google Play e experimente 7 dias grátis.\n\n")
        f.write('**Roteiro de narração:**\n\n')
        for i, p in enumerate(c['passos'], 1):
            f.write(f'{i}. {p}\n')
        f.write('\n---\n\n')
print('ok')
