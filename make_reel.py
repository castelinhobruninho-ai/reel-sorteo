#!/usr/bin/env python3
"""Reel vertical 1080x1920 @30fps: sorteo en canal de WhatsApp.

Estilo minimalista/futurista: fondo negro, acento lima (#C8FF2E), blanco y gris.
Solo texto animado (decodificado, tipeo con cursor, glitch breve, fundidos).

Uso:
    python3 make_reel.py              # renderiza out/reel_sorteo.mp4
    python3 make_reel.py --preview    # guarda un PNG por escena en out/frames/
"""
import os
import random
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
DURATION = 21.0
TOTAL = int(round(DURATION * FPS))
MARGIN = 100
MAXW = W - 2 * MARGIN

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (128, 128, 128)
ACCENT = (200, 255, 46)  # #C8FF2E

FONT_DIR = "/usr/share/fonts/opentype/inter"
DISPLAY_BOLD = os.path.join(FONT_DIR, "InterDisplay-Bold.otf")
SANS_BOLD = os.path.join(FONT_DIR, "Inter-Bold.otf")
SANS_SEMI = os.path.join(FONT_DIR, "Inter-SemiBold.otf")
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*<>/\\=+"

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

_font_cache = {}


def font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]


def text_width(text, f, tracking=0):
    return f.getlength(text) + tracking * max(len(text) - 1, 0)


def fit(path, size, text, tracking=0, maxw=MAXW):
    """Fuente al tamaño pedido, reducida hasta que el texto entre en maxw."""
    while size > 10:
        f = font(path, size)
        if text_width(text, f, tracking) <= maxw:
            return f
        size -= 2
    return font(path, size)


def clamp01(x):
    return max(0.0, min(1.0, x))


def ease_out(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    x = clamp01(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def scale(color, a):
    return tuple(int(round(c * a)) for c in color)


class Frame:
    """Lienzo de una escena; registra las cajas de texto para validar márgenes."""

    def __init__(self, frame_idx):
        self.img = Image.new("RGB", (W, H), BLACK)
        self.d = ImageDraw.Draw(self.img)
        self.fi = frame_idx
        self.boxes = []  # (label, x0, y0, x1, y1)

    def text(self, final, cy, f, color, alpha=1.0, tracking=0, display=None,
             x=None, align="center", cursor=None, label=None):
        """Dibuja texto por carácter sobre las posiciones del texto final.

        display: texto a mostrar (decodificado/tipeado), mismo largo o más corto.
        cy: centro vertical de las mayúsculas. cursor: (visible, color).
        """
        if alpha <= 0:
            return
        display = final if display is None else display
        total = text_width(final, f, tracking)
        if x is None:
            x0 = (W - total) / 2
        elif align == "right":
            x0 = x - total
        else:
            x0 = x
        cap_top = f.getbbox("H", anchor="ls")[1]
        baseline = cy - cap_top / 2
        col = scale(color, alpha)
        cx = x0
        for i, ch in enumerate(display):
            # cada glifo se centra en la celda del carácter final: sin saltos
            end = x0 + f.getlength(final[:i + 1]) + tracking * i
            cell = f.getlength(final[i])
            gw = f.getlength(ch)
            self.d.text((end - cell + (cell - gw) / 2, baseline), ch, font=f,
                        fill=col, anchor="ls")
            cx = end
        if cursor and cursor[0]:
            cw = max(6, int(f.size * 0.5))
            gap = int(f.size * 0.12)
            ccol = scale(cursor[1], alpha)
            cxs = cx + (gap if display else 0)
            self.d.rectangle([cxs, baseline + cap_top, cxs + cw, baseline], fill=ccol)
            cx = cxs + cw
        # caja de tinta real del texto final (más cursor si lo hay)
        left, right = x0 + f.getbbox(final[0], anchor="ls")[0], cx
        for i, ch in enumerate(final):
            gx = x0 + f.getlength(final[:i + 1]) + tracking * i - f.getlength(ch)
            gb = f.getbbox(ch, anchor="ls")
            if ch != " ":
                left, right = min(left, gx + gb[0]), max(right, gx + gb[2])
        bb = f.getbbox(final, anchor="ls")
        self.boxes.append((label or final, left, baseline + bb[1], right, baseline + bb[3]))


# ---------------------------------------------------------------- animación

def decoded(text, t, start, dur, seed=0, fi=0):
    """Texto que se decodifica de izquierda a derecha entre start y start+dur."""
    p = (t - start) / dur
    if p <= 0:
        return None
    if p >= 1:
        return text
    n = len(text)
    tick = fi // 2  # los glifos aleatorios cambian cada 2 frames
    out = []
    for i, ch in enumerate(text):
        reveal = (i + 1) / (n + 1) * 0.85 + 0.15
        if ch == " " or p >= reveal:
            out.append(ch)
        else:
            rnd = random.Random(hash((seed, i, tick)) & 0xFFFFFFFF)
            out.append(rnd.choice(GLYPHS))
    return "".join(out)


def typed(text, t, start, cps=18):
    if t < start:
        return ""
    n = int((t - start) * cps)
    return text[:min(n, len(text))]


def fade(t, start, dur=0.2):
    return ease_out((t - start) / dur)


def blink(fi, period=16):
    return (fi // (period // 2)) % 2 == 0


# ------------------------------------------------------------------ escenas
# Cada escena recibe (Frame, t_local, frame_global).

def scene1(fr, t, fi):
    line = "> VOY A REGALAR"
    fm = fit(MONO, 60, line, tracking=6)
    shown = typed(line, t, 0.1, cps=20)
    cur = len(shown) < len(line) or blink(fi)
    fr.text(line, 600, fm, ACCENT, tracking=6, display=shown,
            cursor=(cur, ACCENT))

    big = fit(DISPLAY_BOLD, 560, "20")
    d = decoded("20", t, 0.95, 0.55, seed=1, fi=fi)
    if d:
        fr.text("20", 960, big, WHITE, alpha=fade(t, 0.95, 0.12), display=d)

    fp = fit(DISPLAY_BOLD, 130, "PRODUCTOS", tracking=4)
    d = decoded("PRODUCTOS", t, 1.6, 0.5, seed=2, fi=fi)
    if d:
        fr.text("PRODUCTOS", 1300, fp, WHITE, alpha=fade(t, 1.6, 0.15),
                tracking=4, display=d)

    sub = "EN MI CANAL DE WHATSAPP"
    fs = fit(MONO, 36, sub, tracking=5)
    a = fade(t, 2.2, 0.35)
    fr.text(sub, 1410, fs, GRAY, alpha=a, tracking=5)


def scene2(fr, t, fi):
    lab = "// CANAL ANTERIOR"
    fl = fit(MONO, 40, lab, tracking=6)
    fr.text(lab, 540, fl, GRAY, alpha=fade(t, 0.0, 0.15), tracking=6)

    # contador 450 -> 000 con dígitos en celdas fijas (sin temblor)
    p = ease_in_out((t - 0.25) / 1.35)
    val = int(round(450 * (1 - p)))
    s = f"{val:03d}"
    fbig = fit(DISPLAY_BOLD, 380, "888")
    cell = max(fbig.getlength(c) for c in "0123456789")
    total = cell * 3
    x0 = (W - total) / 2
    cap_top = fbig.getbbox("H", anchor="ls")[1]
    cy = 830
    base = cy - cap_top / 2
    col = WHITE if t < 1.75 else scale(WHITE, 0.55 + 0.45 * (1 - fade(t, 1.75, 0.3)))
    for i, c in enumerate(s):
        gw = fbig.getlength(c)
        fr.d.text((x0 + i * cell + (cell - gw) / 2, base), c, font=fbig,
                  fill=col, anchor="ls")
    bb = fbig.getbbox("888", anchor="ls")
    fr.boxes.append(("contador", x0, base + bb[1], x0 + total, base + bb[3]))

    fs = fit(SANS_SEMI, 60, "SEGUIDORES", tracking=10)
    fr.text("SEGUIDORES", 1060, fs, WHITE, alpha=fade(t, 0.1, 0.25), tracking=10)

    fe = fit(DISPLAY_BOLD, 170, "ELIMINADO", tracking=4)
    d = decoded("ELIMINADO", t, 1.8, 0.6, seed=3, fi=fi)
    if d:
        fr.text("ELIMINADO", 1260, fe, ACCENT, alpha=fade(t, 1.8, 0.12),
                tracking=4, display=d)

    sub = "9 MESES DE TRABAJO"
    fm = fit(MONO, 40, sub, tracking=6)
    fr.text(sub, 1400, fm, GRAY, alpha=fade(t, 2.45, 0.35), tracking=6)


def scene3(fr, t, fi):
    line = "> reiniciando..."
    fm = fit(MONO, 54, line, tracking=4)
    shown = typed(line, t, 0.1, cps=16)
    cur = len(shown) < len(line) or blink(fi)
    fr.text(line, 720, fm, GRAY, tracking=4, display=shown, cursor=(cur, GRAY))

    fc = fit(SANS_BOLD, 120, "CANAL", tracking=14)
    d = decoded("CANAL", t, 1.25, 0.4, seed=4, fi=fi)
    if d:
        fr.text("CANAL", 930, fc, WHITE, alpha=fade(t, 1.25, 0.12),
                tracking=14, display=d)

    fn = fit(DISPLAY_BOLD, 300, "NUEVO", tracking=2)
    d = decoded("NUEVO", t, 1.5, 0.5, seed=5, fi=fi)
    if d:
        fr.text("NUEVO", 1150, fn, ACCENT, alpha=fade(t, 1.5, 0.12),
                tracking=2, display=d)


def scene4(fr, t, fi):
    ft = fit(DISPLAY_BOLD, 190, "SORTEOS", tracking=4)
    d = decoded("SORTEOS", t, 0.0, 0.5, seed=6, fi=fi)
    if d:
        fr.text("SORTEOS", 420, ft, WHITE, tracking=4, display=d)

    sub = "5 PRODUCTOS CADA 100 SEGUIDORES"
    fs = fit(SANS_SEMI, 46, sub, tracking=3)
    fr.text(sub, 570, fs, ACCENT, alpha=fade(t, 0.45, 0.3), tracking=3)

    fidx = font(MONO, 34)
    fnum = font(DISPLAY_BOLD, 120)
    flab = font(MONO, 26)
    fpr = font(SANS_BOLD, 56)
    num_x = MARGIN + int(fidx.getlength("[00]")) + 34
    for k in range(4):
        start = 0.95 + k * 0.55
        a = fade(t, start, 0.3)
        if a <= 0:
            continue
        cy = 760 + k * 190 + int((1 - a) * 30)
        n = f"{(k + 1) * 100}"
        fr.text(f"[0{k + 1}]", cy, fidx, GRAY, alpha=a, x=MARGIN)
        d = decoded(n, t, start, 0.35, seed=10 + k, fi=fi)
        fr.text(n, cy, fnum, WHITE, alpha=a, x=num_x, display=d)
        fr.text("SEGUIDORES", cy + 92, flab, GRAY, alpha=a, tracking=4,
                x=num_x + 4)
        fr.text("5 PREMIOS", cy, fpr, ACCENT, alpha=a, x=W - MARGIN,
                align="right")


def corner_brackets(d, x0, y0, x1, y1, length, thick, color):
    for (cx, cy, sx, sy) in ((x0, y0, 1, 1), (x1, y0, -1, 1),
                             (x0, y1, 1, -1), (x1, y1, -1, -1)):
        d.rectangle(sorted_rect(cx, cy, cx + sx * length, cy + sy * thick), fill=color)
        d.rectangle(sorted_rect(cx, cy, cx + sx * thick, cy + sy * length), fill=color)


def sorted_rect(xa, ya, xb, yb):
    return [min(xa, xb), min(ya, yb), max(xa, xb) - 1, max(ya, yb) - 1]


def scene5(fr, t, fi):
    f1 = fit(SANS_BOLD, 64, "SEGUIME EN MI", tracking=8)
    fr.text("SEGUIME EN MI", 440, f1, WHITE, alpha=fade(t, 0.0, 0.2), tracking=8)
    f2 = fit(DISPLAY_BOLD, 110, "CANAL DE WHATSAPP", tracking=2)
    d = decoded("CANAL DE WHATSAPP", t, 0.15, 0.6, seed=20, fi=fi)
    if d:
        fr.text("CANAL DE WHATSAPP", 545, f2, WHITE, alpha=fade(t, 0.15, 0.12),
                tracking=2, display=d)

    # bloque con escuadras (sin borde completo)
    a = fade(t, 0.8, 0.3)
    if a > 0:
        bx0, bx1 = MARGIN + 40, W - MARGIN - 40
        by0, by1 = 680, 860
        grow = int((1 - a) * 30)
        corner_brackets(fr.d, bx0 - grow, by0 - grow, bx1 + grow, by1 + grow,
                        44, 6, scale(ACCENT, a))
        fr.boxes.append(("bloque", bx0 - grow, by0 - grow, bx1 + grow, by1 + grow))
        link = "LINK EN MI PERFIL"
        fl = fit(MONO, 50, link, tracking=4, maxw=bx1 - bx0 - 140)
        shown = typed(link, t, 1.0, cps=20)
        cur = len(shown) < len(link) or blink(fi)
        fr.text(link, (by0 + by1) / 2, fl, ACCENT, tracking=4, display=shown,
                cursor=(cur, ACCENT), label="link")
        fr.boxes.pop()  # el texto está dentro del bloque a propósito

    l1 = "PRIMER SORTEO → 100 SEGUIDORES"
    f3 = fit(SANS_SEMI, 48, l1, tracking=2)
    fr.text(l1, 990, f3, WHITE, alpha=fade(t, 2.0, 0.3), tracking=2)
    l2 = "20 PRODUCTOS EN JUEGO"
    f4 = fit(MONO, 36, l2, tracking=5)
    fr.text(l2, 1065, f4, GRAY, alpha=fade(t, 2.3, 0.3), tracking=5)

    f5 = fit(DISPLAY_BOLD, 150, "COMPARTILO", tracking=6)
    d = decoded("COMPARTILO", t, 3.2, 0.6, seed=21, fi=fi)
    if d:
        fr.text("COMPARTILO", 1290, f5, ACCENT, alpha=fade(t, 3.2, 0.12),
                tracking=6, display=d)


SCENES = [
    (0.0, 3.4, scene1),
    (3.4, 7.0, scene2),
    (7.0, 9.8, scene3),
    (9.8, 16.0, scene4),
    (16.0, 21.0, scene5),
]

FADE_OUT = 8   # frames de fundido a negro al final de cada escena
FADE_IN = 4    # frames de entrada (coinciden con el glitch)
GLITCH = 4     # frames de glitch al empezar cada escena


def glitch(arr, seed):
    rnd = random.Random(seed)
    out = arr.copy()
    for _ in range(rnd.randint(6, 10)):
        h = rnd.randint(8, 70)
        y = rnd.randint(300, H - 400)
        shift = rnd.choice([-1, 1]) * rnd.randint(15, 60)
        out[y:y + h] = np.roll(arr[y:y + h], shift, axis=1)
    return out


def overlay_camera(img, fi):
    d = ImageDraw.Draw(img)
    inset, length, thick = 60, 90, 8
    corner_brackets(d, inset, inset, W - inset, H - inset, length, thick, ACCENT)

    fm = font(MONO, 30)
    # REC arriba a la derecha, con punto acento parpadeante
    rec_w = text_width("REC", fm, 4)
    rx = W - MARGIN - rec_w
    cap_top = fm.getbbox("H", anchor="ls")[1]
    ry = 150
    base = ry - cap_top / 2
    x = rx
    for ch in "REC":
        d.text((x, base), ch, font=fm, fill=WHITE, anchor="ls")
        x += fm.getlength(ch) + 4
    if (fi // 15) % 2 == 0:
        r = 11
        cx = rx - 22 - r
        d.ellipse([cx - r, ry - r, cx + r, ry + r], fill=ACCENT)

    # contador de tiempo abajo a la izquierda
    secs = fi / FPS
    tc = f"{int(secs // 60):02d}:{int(secs % 60):02d}:{fi % FPS:02d}"
    x = MARGIN
    base = H - 150 - cap_top / 2
    for ch in tc:
        d.text((x, base), ch, font=fm, fill=GRAY, anchor="ls")
        x += fm.getlength(ch) + 4


def render(fi, check=None):
    t = fi / FPS
    for start, end, fn in SCENES:
        if start <= t < end or (fn is SCENES[-1][2] and t >= start):
            break
    s0 = int(round(start * FPS))
    s1 = int(round(end * FPS))
    local = fi - s0
    fr = Frame(fi)
    fn(fr, (fi - s0) / FPS, fi)
    arr = np.asarray(fr.img).astype(np.float32)

    if local < GLITCH:
        arr = glitch(arr, seed=fi * 7919)
    a = 1.0
    if local < FADE_IN:
        a = min(a, 0.55 + 0.45 * local / FADE_IN)
    if s1 - fi <= FADE_OUT:
        a = min(a, (s1 - fi - 1) / FADE_OUT)
    arr *= max(a, 0.0)

    img = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    overlay_camera(img, fi)
    if check is not None:
        check.extend((fi, b) for b in fr.boxes)
    return img


def validate(entries):
    """Márgenes laterales >= 100 px y sin superposición entre textos."""
    problems = []
    by_frame = {}
    for fi, (lab, x0, y0, x1, y1) in entries:
        if x0 < MARGIN - 0.5 or x1 > W - MARGIN + 0.5:
            problems.append(f"frame {fi}: '{lab}' fuera de margen x=[{x0:.0f},{x1:.0f}]")
        by_frame.setdefault(fi, []).append((lab, x0, y0, x1, y1))
    for fi, boxes in by_frame.items():
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a, b = boxes[i], boxes[j]
                if a[1] < b[3] and b[1] < a[3] and a[2] < b[4] and b[2] < a[4]:
                    if a[0] == "bloque" or b[0] == "bloque":
                        continue
                    problems.append(f"frame {fi}: '{a[0]}' se superpone con '{b[0]}'")
    return problems


def preview():
    os.makedirs(os.path.join(OUT_DIR, "frames"), exist_ok=True)
    # un frame "completo" por escena (todos los elementos ya visibles)
    picks = {1: 3.0, 2: 6.6, 3: 9.3, 4: 15.4, 5: 20.4}
    for n, ts in picks.items():
        fi = int(ts * FPS)
        img = render(fi)
        path = os.path.join(OUT_DIR, "frames", f"escena{n}.png")
        img.save(path)
        print("guardado", path)


def check_all():
    entries = []
    for fi in range(TOTAL):
        render(fi, check=entries)
    problems = validate(entries)
    for p in problems[:40]:
        print("PROBLEMA:", p)
    print(f"{len(problems)} problemas en {TOTAL} frames")
    return not problems


def encode():
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, "reel_sorteo.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-",
           "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "16",
           "-profile:v", "high", "-pix_fmt", "yuv420p",
           "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fi in range(TOTAL):
        proc.stdin.write(render(fi).tobytes())
    proc.stdin.close()
    proc.wait()
    print("listo", out)


if __name__ == "__main__":
    if "--preview" in sys.argv:
        preview()
    elif "--check" in sys.argv:
        sys.exit(0 if check_all() else 1)
    else:
        encode()
