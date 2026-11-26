"""Gera os recortes da logo da Chama Play a partir do PNG original (já sem fundo).

Uso: python tools/build_assets.py assets/original/chama-play-logo.png
Saída: assets/chama-mark.png (só a chama), chama-logo.png (completa), chama-wordmark.png, favicon.png
"""
import sys

import numpy as np
from PIL import Image

im = Image.open(sys.argv[1]).convert("RGBA")
al = np.array(im)[:, :, 3] > 40


def crop(y0, y1, pad=8):
    s = al[y0:y1]
    cols = np.where(s.any(0))[0]
    rows = np.where(s.any(1))[0]
    return im.crop((max(0, cols.min() - pad), max(0, y0 + rows.min() - pad), cols.max() + 1 + pad, y0 + rows.max() + 1 + pad))


H = im.height
cut = int(H * 0.62)  # a chama termina em ~60% da altura; abaixo vêm CHAMA e PLAY
for name, box, size in [("chama-mark", (0, cut), (900, 900)), ("chama-logo", (0, H), (1100, 1200)),
                        ("chama-wordmark", (cut, H), (1400, 600)), ("favicon", (0, cut), (192, 192))]:
    out = crop(*box)
    out.thumbnail(size)
    out.save(f"assets/{name}.png", optimize=True)
    print(name, out.size)
