#!/usr/bin/env python3
"""Build data/h/<hall>.json (sections + full article text) and the article
photos from the crawl cache (tools/crawl.py).

    python3 tools/build_articles.py            # text + photo list
    python3 tools/build_articles.py --photos   # also convert downloaded photos to img/p/

Articles are stored in 繁體 exactly as MOA publishes them; the app converts
to 简体 on the phone (js/t2s.js). Article HTML is reduced to a small set of
safe tags. Reader comments, votes, share buttons and the portal sidebars are
not copied. Newspaper reprints (新鮮聞 news.php / theme_data.php) are not
copied: those sections link to MOA instead.
"""
import hashlib
import html
import json
import os
import re
import sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
CACHE = os.path.join(ROOT, ".cache", "moa")
BASE = "https://kmweb.moa.gov.tw"
PHOTO_W = 640          # longest side of a stored photo
PHOTO_Q = 55           # WebP quality

ITEM = re.compile(r'<a class="title" href="subject\.php\?id=(\d+)" title="([^"]*)"')


def roc_date(s):
    """'97/03/20' (Minguo year) -> '2008-03-20'."""
    m = re.match(r"\s*(\d{2,3})/(\d{1,2})/(\d{1,2})", s or "")
    if not m:
        return ""
    return f"{int(m.group(1)) + 1911:04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"


def text(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s))).strip()


def photo_key(url):
    """Stable short file name for a MOA photo URL."""
    return hashlib.sha1(url.encode()).hexdigest()[:12]


# ---------- HTML cleaning ----------

KEEP = {"p", "br", "strong", "b", "em", "i", "u", "sup", "sub", "ul", "ol", "li", "table", "thead",
        "tbody", "tr", "td", "th", "h3", "h4", "h5", "h6", "blockquote", "a", "img", "figure", "figcaption", "hr"}
VOID = {"br", "img", "hr"}
DROP_WITH_CONTENT = {"script", "style", "iframe", "object", "noscript", "form", "button", "select", "textarea"}
HEADING_MAP = {"h1": "h3", "h2": "h3"}


class Cleaner(HTMLParser):
    def __init__(self, photos):
        super().__init__(convert_charrefs=True)
        self.out, self.stack, self.skip, self.photos = [], [], 0, photos

    def handle_starttag(self, tag, attrs):
        if tag in DROP_WITH_CONTENT:
            self.skip += 1
            return
        if self.skip:
            return
        tag = HEADING_MAP.get(tag, tag)
        a = dict(attrs)
        if tag == "img":
            src = (a.get("src") or "").strip()
            if src.startswith(BASE):
                src = src[len(BASE):]
            if src.startswith("/files/") and re.search(r"\.(jpe?g|png|gif|webp)$", src, re.I):
                self.photos.append(src)
                alt = html.escape(a.get("alt") or a.get("title") or "", quote=True)
                self.out.append(f'<img data-p="{photo_key(src)}" alt="{alt}">')
            return
        if tag == "a":
            href = (a.get("href") or "").strip()
            if href.startswith("/"):
                href = BASE + href
            elif href and not re.match(r"https?://", href) and not href.startswith(("javascript", "#", "mailto")):
                href = f"{BASE}/subject/{href}"
            if re.match(r"https?://", href):
                self.out.append(f'<a href="{html.escape(href, quote=True)}" target="_blank" rel="noopener">')
                self.stack.append("a")
            else:
                self.stack.append(None)  # glossary pop-ups etc.: keep the text only
            return
        if tag not in KEEP:
            return
        extra = ""
        if tag in ("td", "th"):
            for k in ("colspan", "rowspan"):
                if a.get(k, "").isdigit():
                    extra += f' {k}="{a[k]}"'
        self.out.append(f"<{tag}{extra}>")
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in DROP_WITH_CONTENT:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        tag = HEADING_MAP.get(tag, tag)
        if tag == "a":
            if "a" in self.stack or None in self.stack:
                while self.stack:
                    t = self.stack.pop()
                    if t in ("a", None):
                        if t == "a":
                            self.out.append("</a>")
                        break
                    self.out.append(f"</{t}>")
            return
        if tag not in KEEP or tag in VOID or tag not in self.stack:
            return
        while self.stack:
            t = self.stack.pop()
            if t:
                self.out.append(f"</{t}>")
            if t == tag:
                break

    def handle_data(self, data):
        if not self.skip:
            self.out.append(html.escape(data, quote=False))

    def result(self):
        while self.stack:
            t = self.stack.pop()
            if t:
                self.out.append(f"</{t}>")
        s = "".join(self.out)
        s = re.sub(r"\s*\n\s*", "\n", s)
        s = re.sub(r"<(p|li|td|th|strong|b|em|span)>\s*</\1>", "", s)
        s = re.sub(r"(<br>\s*){3,}", "<br><br>", s)
        return s.strip()


def clean_html(raw, photos):
    c = Cleaner(photos)
    c.feed(raw)
    c.close()
    return c.result()


# ---------- Pages ----------

def parse_article(aid):
    path = f"{CACHE}/art/{aid}.html"
    if not os.path.exists(path):
        # a section whose own page is the article (or redirects to it)
        path = f"{CACHE}/sec/{SELF_SRC.get(aid, aid)}_p1.html"
    if not os.path.exists(path):
        return None
    s = open(path, encoding="utf-8").read()
    m = re.search(r'<h2 class="articleTitle">(.*?)</h2>', s, re.S)
    if not m:
        return None
    title = text(m.group(1))
    if "專家回覆" in s or 'href="/knowledge.php" title="農業知識家"' in s:
        return parse_qa(s, title)
    pub = roc_date((re.search(r"發布日期：([\d/]+)", s) or [None, ""])[1])
    upd = roc_date((re.search(r"更新日期：([\d/]+)", s) or [None, ""])[1])
    photos = []
    m = re.search(r'<div class="articlepara">(.*?)<!-- 分享按讚 -->', s, re.S)
    body = clean_html(m.group(1), photos) if m else ""
    gallery = []
    g = re.search(r"相關照片</h3>(.*?)(?:<h3 class=\"titletxt|<!-- 個人標籤|</section>)", s, re.S)
    if g:
        for href, cap in re.findall(r'<a href="(/files/[^"]+\.(?:jpe?g|png|gif))" data-lightbox="[^"]*" title="([^"]*)"', g.group(1), re.I):
            small = re.sub(r"(\.\w+)$", r"_m\1", href)
            gallery.append({"p": photo_key(small), "c": html.unescape(cap).strip()})
            photos.append(small)
    files = []
    f = re.search(r'titletxt _x">附件</h3>(.*?)(?:<!-- 個人標籤|</section>)', s, re.S)
    if f:
        for href, name in re.findall(r'<a href="([^"]+)"[^>]*>.*?<div class="title fz-s">([^<]*)</div>', f.group(1), re.S):
            files.append({"n": html.unescape(name).strip(), "u": (BASE + href) if href.startswith("/") else href})
    return {"t": title, "pub": pub, "upd": upd, "body": body, "gallery": gallery, "files": files}, photos


def parse_qa(s, title):
    """A 農業知識家 question: the question and the expert replies. The asker's
    name and the members' discussion are personal posts and are not copied."""
    photos = []
    m = re.search(r"發問日期：(\d{4})年(\d{2})月(\d{2})日", s)
    pub = f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else ""
    q = re.search(r'<div class="articlepara">(.*?)<div class="js--e_sliderandphotoalbum">', s, re.S) \
        or re.search(r'<div class="articlepara">(.*?)<hr class="space-line">', s, re.S)
    body = clean_html(q.group(1), photos) if q else ""
    gallery = []
    alb = re.search(r'js--e_sliderandphotoalbum(.*?)<hr class="space-line">', s, re.S)
    for src, alt in re.findall(r'<img class="sliderimg" src="(/files/[^"]+)" alt="([^"]*)"', alb.group(1) if alb else ""):
        gallery.append({"p": photo_key(src), "c": html.unescape(alt).strip()})
        photos.append(src)
    answers = []
    ex = re.search(r'<div class="d-ib">專家回覆</div>(.*?)(?:<div class="d-ib">本篇討論</div>|<div id="msg_div"|$)', s, re.S)
    for item in re.split(r'<div class="knowfbitem">', ex.group(1) if ex else "")[1:]:
        d = re.search(r"發表於 (\d{4})/(\d{2})/(\d{2})", item)
        msg = re.search(r'<div class="memberfbmsg">(.*?)</div>\s*(?:<div style="padding-top:10px">相關附件：</div>\s*<div class="memberfbmsg">(.*?)</div>)?', item, re.S)
        if not msg:
            continue
        files = [{"n": html.unescape(n).strip(), "u": (BASE + u) if u.startswith("/") else u}
                 for u, n in re.findall(r'<a href="([^"]+)"[^>]*>([^<]+)</a>', msg.group(2) or "")]
        answers.append({"d": f"{d.group(1)}-{d.group(2)}-{d.group(3)}" if d else "",
                        "body": clean_html(msg.group(1), photos), "files": files})
    return {"t": title, "qa": True, "pub": pub, "upd": "", "body": body, "gallery": gallery,
            "answers": answers, "files": []}, photos


# Photo budget (GitHub Pages sites stop at 1 GB): articles in MOA's main list layout and
# single-article sections keep every photo; articles in the compact list layout keep their first.
ALL_PHOTOS_FOR = set()
LINK_ITEM = re.compile(r'<a\b([^>]*\bclass="(?:title|list_link)"[^>]*)>')
SUBJECT = "https://kmweb.moa.gov.tw/subject/"


def section_items(sid):
    """A section's articles (all pages), the other items it lists as [title, MOA url]
    (news reprints, outside links, files, videos: they open online), and whether it was fetched."""
    items, links, p = [], [], 1
    while os.path.exists(f"{CACHE}/sec/{sid}_p{p}.html"):
        s = open(f"{CACHE}/sec/{sid}_p{p}.html", encoding="utf-8").read()
        main = s.split('id="AC"')[-1]
        for attrs in LINK_ITEM.findall(main):
            href = re.search(r'href="([^"]+)"', attrs)
            title = re.search(r'title="([^"]*)"', attrs)
            if not href or not title:
                continue
            href, title = html.unescape(href.group(1)), html.unescape(title.group(1)).strip()
            a = re.fullmatch(r"subject\.php\?id=(\d+)", href)
            if a and title.endswith("(文章類型資料)"):
                if int(a.group(1)) not in items:
                    items.append(int(a.group(1)))
                if 'class="title"' in attrs:
                    ALL_PHOTOS_FOR.add(int(a.group(1)))
                continue
            if not re.match(r"(?:subject|news|theme_data)\.php\?|https?://", href):
                continue
            url = href if href.startswith("http") else SUBJECT + href
            title = re.sub(r"\((?:連結|檔案|影片|照片集)類型資料\)$", "", title).strip()
            if title and [title, url] not in links:
                links.append([title, url])
        p += 1
    return items, links, p > 1


SELF_SRC = {}  # article id -> the section whose fetched page holds it


def section_self_article(sid):
    """A section whose page is itself an article (MOA redirects it to one)."""
    meta = f"{CACHE}/sec/{sid}_p1.html.url"
    if os.path.exists(meta):
        m = re.search(r"subject\.php\?id=(\d+)", open(meta).read())
        if m and int(m.group(1)) != sid:
            SELF_SRC[int(m.group(1))] = sid
            return int(m.group(1))
    s = open(f"{CACHE}/sec/{sid}_p1.html", encoding="utf-8").read() if os.path.exists(f"{CACHE}/sec/{sid}_p1.html") else ""
    # News lists share the article title style; only a page with article text counts.
    return sid if '<h2 class="articleTitle">' in s and ('class="articlepara"' in s or "專家回覆" in s) else None


def main():
    halls = json.load(open(f"{ROOT}/data/halls.json", encoding="utf-8"))["halls"]
    os.makedirs(f"{ROOT}/data/h", exist_ok=True)
    have = {f[:-5] for f in os.listdir(f"{ROOT}/img/p")} if os.path.isdir(f"{ROOT}/img/p") else set()
    index = []
    # Settle each article's photo rule before building, whichever hall lists it first.
    for h in halls:
        for g in h["groups"]:
            for sid in ([g["id"]] if g["id"] else []) + [i["id"] for i in g["items"]]:
                if not section_items(sid)[0]:
                    own = section_self_article(sid)
                    if own:
                        ALL_PHOTOS_FOR.add(own)
    all_photos, stats = {}, {"articles": 0, "chars": 0, "photos": 0, "missing": 0, "link_sections": 0}
    for h in halls:
        sections, articles = [], {}

        def add(sid, title):
            items, links, fetched = section_items(sid)
            if not items:
                own = section_self_article(sid)
                if own:
                    items = [own]
            kind = "list" if items else ("link" if links or fetched else "empty")
            if kind == "link":
                stats["link_sections"] += 1
            for aid in items:
                if aid in articles:
                    continue
                r = parse_article(aid)
                if not r:
                    if os.path.exists(f"{CACHE}/sec/{sid}_p1.html"):
                        stats["missing"] += 1
                    continue
                art, photos = r
                articles[aid] = art
                stats["articles"] += 1
                stats["chars"] += len(text(art["body"]))
                if aid not in ALL_PHOTOS_FOR:
                    photos = photos[:1]
                    art["_only"] = {photo_key(p) for p in photos}
                for p in photos:
                    all_photos[photo_key(p)] = p
            sec = {"id": sid, "t": title, "kind": kind, "a": [a for a in items if a in articles]}
            if links:
                sec["l"] = links
            sections.append(sec)

        for g in h["groups"]:
            if g["id"]:
                add(g["id"], g["zht"])
            for i in g["items"]:
                add(i["id"], i["zht"])
        for aid, art in articles.items():
            keep_local_photos(art, have & art.pop("_only") if "_only" in art else have)
            sec = next((x["id"] for x in sections if aid in x["a"]), 0)
            index.append([aid, h["id"], sec, art["t"]])
        json.dump({"id": h["id"], "sections": sections, "articles": {str(k): v for k, v in articles.items()}},
                  open(f"{ROOT}/data/h/{h['id']}.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump(index, open(f"{ROOT}/data/index.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    stats["photos"] = len(all_photos)
    stats["photos_local"] = len(have & set(all_photos))
    json.dump(sorted(all_photos.values()), open(f"{CACHE}/photo-urls.json", "w"))
    # For "download all photos": every shipped photo, hall by hall, and their total size.
    ship = [k for k in all_photos if k in have]
    size = sum(os.path.getsize(f"{ROOT}/img/p/{k}.webp") for k in ship)
    json.dump({"bytes": size, "keys": ship}, open(f"{ROOT}/data/photos.json", "w"), separators=(",", ":"))
    print(json.dumps(stats))
    if "--photos" in sys.argv:
        convert_photos(all_photos)


def keep_local_photos(art, have):
    """Only photos stored in img/p/ ship: the app must work offline, and MOA's
    own image server cannot be cached by another site."""
    drop = lambda m: m.group(0) if m.group(1) in have else ""
    art["body"] = re.sub(r'<img data-p="(\w+)"[^>]*>', drop, art["body"])
    for a in art.get("answers", []):
        a["body"] = re.sub(r'<img data-p="(\w+)"[^>]*>', drop, a["body"])
    art["gallery"] = [g for g in art["gallery"] if g["p"] in have]


def convert_one(job):
    from PIL import Image
    src, out = job
    try:
        im = Image.open(src).convert("RGB")
        im.thumbnail((PHOTO_W, PHOTO_W), Image.LANCZOS)
        im.save(out, "WEBP", quality=PHOTO_Q, method=6)
        return None
    except Exception as e:
        return f"bad photo {src}: {e}"


def convert_photos(all_photos):
    from concurrent.futures import ProcessPoolExecutor
    os.makedirs(f"{ROOT}/img/p", exist_ok=True)
    jobs, ready, missing = [], 0, 0
    for key, url in all_photos.items():
        out = f"{ROOT}/img/p/{key}.webp"
        if os.path.exists(out):
            ready += 1
            continue
        src = f"{CACHE}/photo/" + re.sub(r"[^\w.]", "_", url.lstrip("/"))
        if os.path.exists(src):
            jobs.append((src, out))
        else:
            missing += 1
    with ProcessPoolExecutor() as ex:
        for i, err in enumerate(ex.map(convert_one, jobs, chunksize=32), 1):
            if err:
                print(err)
            else:
                ready += 1
            if i % 2000 == 0:
                print(f"  {i}/{len(jobs)}", flush=True)
    print(f"photos: {ready} ready, {missing} not downloaded")
    print("run build_articles.py again so the article files keep the photos now present")


if __name__ == "__main__":
    main()
