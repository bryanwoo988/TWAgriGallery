#!/usr/bin/env python3
"""Build data/halls.json, img/covers/*.webp and img/icons/*.svg from the
scraped MOA pages in .cache/moa/ (see tools/scrape.py).

    pip install opencc-python-reimplemented pillow
    python3 tools/build_data.py

Text in four languages per hall:
  zht  繁體 — exactly as published by MOA
  zhs  简体 — character conversion of zht (OpenCC t2s); Taiwan terms are kept
  en / ms — tools/content/translations.py (hall name + short summary)
Section menus keep MOA's Chinese titles (zht and zhs); they link to Chinese pages.
"""
import glob
import html
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone

import opencc
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
CACHE = os.path.join(ROOT, ".cache", "moa")
sys.path.insert(0, os.path.join(HERE, "content"))
from translations import AGENCIES, CATEGORIES, HALLS  # noqa: E402

t2s = opencc.OpenCC("t2s").convert
COVER_W = 720


def clean(t):
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t))).strip()


def zh(t):
    return {"zht": t, "zhs": t2s(t)}


def hall_name(title):
    return re.sub(r"\s*-\s*農業知識入口網$", "", title).strip()


def parse_hall(i, s):
    title = hall_name(clean(re.search(r"<title>(.*?)</title>", s, re.S).group(1)))
    m = re.search(r'class="SummaryBox".*?<p>(.*?)</p>', s, re.S)
    intro = clean(m.group(1)) if m else ""
    m = re.search(r"維護單位：(.*?)</small>", s, re.S)
    maint = clean(m.group(1)) if m else ""
    mu = re.search(r'維護單位：.*?href="([^"]+)"', s, re.S)
    groups = []
    m = re.search(r'id="collA"(.*?)<!-- InstanceEndEditable', s, re.S)
    for col in re.findall(r'<ul class="clear_ul ulstyle02">(.*?)</ul>', m.group(1), re.S) if m else []:
        head = re.search(r'<strong><a href="([^"]+)">(.*?)</a>', col, re.S)
        hid = re.search(r"id=(\d+)", head.group(1)) if head else None
        items = [{"id": int(a), **zh(clean(t))}
                 for a, t in re.findall(r'<li><a href="subject\.php\?id=(\d+)">(.*?)</a>', col, re.S)]
        groups.append({"id": int(hid.group(1)) if hid else None, **zh(clean(head.group(2)) if head else ""), "items": items})
    return title, intro, maint, (mu.group(1) if mu else ""), groups


def main():
    lst = open(f"{CACHE}/list.html", encoding="utf-8").read()
    order = []
    for i in re.findall(r"subject/index\.php\?id=(\d+)", lst):
        if i not in order:
            order.append(i)

    cats, covers = {}, {}
    for c in CATEGORIES:
        s = open(f"{CACHE}/cat_{c}.html", encoding="utf-8").read()
        for i, img in re.findall(r'href="subject/index\.php\?id=(\d+)"[^>]*style="background-image:url\(\'([^\']+)\'\)', s):
            cats.setdefault(i, [])
            if c not in cats[i]:
                cats[i].append(c)
            covers[i] = img

    os.makedirs(f"{ROOT}/img/covers", exist_ok=True)
    os.makedirs(f"{ROOT}/img/icons", exist_ok=True)
    halls, missing = [], []
    for i in order:
        s = open(f"{CACHE}/halls/{i}.html", encoding="utf-8").read()
        title, intro, maint, maint_url, groups = parse_hall(i, s)
        tr = HALLS.get(int(i))
        if not tr:
            missing.append(f"{i} {title}")
            continue
        ag = AGENCIES.get(maint)
        if not ag:
            missing.append(f"agency {maint}")
            continue
        agency_zht = maint.replace("農業部 農業部-", "農業部 ")
        halls.append({
            "id": int(i),
            "cats": cats.get(i, ["Z"]),
            "name": {**zh(title), "en": tr["en"]["name"], "ms": tr["ms"]["name"]},
            "intro": {**zh(intro), "en": tr["en"]["summary"], "ms": tr["ms"]["summary"]},
            "agency": {**zh(agency_zht), "en": ag["en"], "ms": ag["ms"]},
            "agencyUrl": maint_url,
            "groups": groups,
        })
        src = glob.glob(f"{CACHE}/covers/{i}.*")[0]
        im = Image.open(src).convert("RGB")
        if im.width > COVER_W:
            im = im.resize((COVER_W, round(im.height * COVER_W / im.width)), Image.LANCZOS)
        im.save(f"{ROOT}/img/covers/{i}.webp", "WEBP", quality=72, method=6)
        svg = open(f"{CACHE}/icons/{i}.svg", encoding="utf-8").read()
        open(f"{ROOT}/img/icons/{i}.svg", "w", encoding="utf-8").write(slim_svg(svg))

    if missing:
        sys.exit("No translation for:\n  " + "\n  ".join(missing))

    out = {
        "source": "https://kmweb.moa.gov.tw/theme_list.php?theme=subject_list_view",
        # The day the cached list page was fetched, in Malaysia time (UTC+8).
        "fetched": datetime.fromtimestamp(os.path.getmtime(f"{CACHE}/list.html"), timezone(timedelta(hours=8))).strftime("%Y-%m-%d"),
        "categories": {k: {**zh(v["zht"]), "en": v["en"], "ms": v["ms"]} for k, v in CATEGORIES.items()},
        "halls": halls,
    }
    with open(f"{ROOT}/data/halls.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(halls)} halls written")


def slim_svg(svg):
    """Drop comments, titles and metadata. Paths are copied unchanged:
    rounding coordinates altered the drawings and saved almost nothing."""
    svg = re.sub(r"<\?xml.*?\?>|<!--.*?-->|<title>.*?</title>|<metadata.*?</metadata>", "", svg, flags=re.S)
    return re.sub(r">\s+<", "><", svg).strip()


if __name__ == "__main__":
    main()
