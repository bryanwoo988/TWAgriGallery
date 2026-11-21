#!/usr/bin/env python3
"""Download every section list and article page of every hall into .cache/moa/.

    python3 tools/crawl.py lists      # section list pages  -> .cache/moa/sec/
    python3 tools/crawl.py articles   # article pages       -> .cache/moa/art/
    python3 tools/crawl.py photos     # article photos      -> .cache/moa/photo/

Resumable: anything already in the cache is skipped, so a failed run is
simply run again. Failures are listed in .cache/moa/failed-<step>.txt.
Run tools/scrape.py and tools/build_data.py first (they produce data/halls.json).

A few requests at a time with a pause: this is a government site.
"""
import json
import os
import re
import sys
import time
import threading

import requests
from concurrent.futures import ThreadPoolExecutor

BASE = "https://kmweb.moa.gov.tw"
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
CACHE = os.path.join(ROOT, ".cache", "moa")
WORKERS = 1
PER_PAGE = 80


_local = threading.local()


def session():
    """One keep-alive connection per thread: a new TLS tunnel per request is three times slower."""
    if not hasattr(_local, "s"):
        _local.s = requests.Session()
        _local.s.headers["User-Agent"] = "TWAgriGallery-builder"
    return _local.s


def get_following(url):
    """GET, following redirects by hand: MOA sometimes redirects to plain
    http://, which the egress proxy does not carry, so upgrade it to https.
    A redirect off the MOA site is returned as is (the caller records it)."""
    for _ in range(6):
        r = session().get(url, timeout=(15, 60), allow_redirects=False)
        if r.status_code not in (301, 302, 303, 307, 308):
            return r
        nxt = requests.compat.urljoin(url, r.headers.get("Location", ""))
        if nxt.startswith("http://kmweb.moa.gov.tw"):
            nxt = "https://" + nxt[len("http://"):]
        if not nxt.startswith(BASE):
            r.url = nxt
            r.status_code = 200
            r._content = b""
            return r
        url = nxt
    raise RuntimeError("too many redirects")


def fetch(url, path, binary=False):
    """Fetch url into path unless cached. Returns (content, final_url) or (None, error)."""
    meta = path + ".url"
    if os.path.exists(path):
        final = open(meta).read() if os.path.exists(meta) else url
        mode = "rb" if binary else "r"
        return open(path, mode, **({} if binary else {"encoding": "utf-8"})).read(), final
    err = None
    for attempt in range(5):
        try:
            r = get_following(url)
            if r.status_code == 429 or r.status_code >= 500:
                raise RuntimeError(f"HTTP {r.status_code}")
            if r.status_code != 200:
                return None, f"HTTP {r.status_code}"
            data, final = r.content, r.url
            break
        except Exception as e:  # proxy hiccups, rate limits (429) and timeouts: back off and retry
            err = e
            print(f"  retry {attempt + 1} {url}: {str(e)[:120]}", flush=True)
            time.sleep((15 if "429" in str(e) else 4) * (attempt + 1))
    else:
        return None, str(err)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if binary:
        open(path, "wb").write(data)
    else:
        open(path, "w", encoding="utf-8").write(data.decode("utf-8", "ignore"))
    open(meta, "w").write(final)
    time.sleep(0.05)
    return (data if binary else data.decode("utf-8", "ignore")), final


def halls():
    return json.load(open(os.path.join(ROOT, "data", "halls.json"), encoding="utf-8"))["halls"]


def section_ids(h):
    ids = []
    for g in h["groups"]:
        if g["id"]:
            ids.append(g["id"])
        ids += [i["id"] for i in g["items"]]
    return ids


def list_page(sid, page):
    return fetch(f"{BASE}/subject/subject.php?id={sid}&page={page}&display_num={PER_PAGE}",
                 f"{CACHE}/sec/{sid}_p{page}.html")


def crawl_section(sid):
    s, final = list_page(sid, 1)
    if s is None:
        return [f"sec {sid}: {final}"]
    m = re.search(r"第 1/(\d+) 頁", s)
    pages = int(m.group(1)) if m else 1
    fails = []
    for p in range(2, min(pages, 60) + 1):
        r, err = list_page(sid, p)
        if r is None:
            fails.append(f"sec {sid} p{p}: {err}")
    return fails


ITEM = re.compile(r'<a class="title" href="subject\.php\?id=(\d+)" title="([^"]*)"')


def article_ids():
    """Every article listed in a section, plus sections that are themselves one article."""
    ids = set()
    for h in halls():
        for sid in section_ids(h):
            p = 1
            while os.path.exists(f"{CACHE}/sec/{sid}_p{p}.html"):
                s = open(f"{CACHE}/sec/{sid}_p{p}.html", encoding="utf-8").read()
                ids |= {int(a) for a, title in ITEM.findall(s) if title.endswith("(文章類型資料)")}
                p += 1
    return sorted(ids)


def run(step):
    os.makedirs(CACHE, exist_ok=True)
    fails = []
    if step == "lists":
        sids = sorted({s for h in halls() for s in section_ids(h)})
        print(f"{len(sids)} sections", flush=True)
        with ThreadPoolExecutor(WORKERS) as ex:
            for i, f in enumerate(ex.map(crawl_section, sids)):
                fails += f
                if i % 200 == 0:
                    print(f"  {i}/{len(sids)}", flush=True)
    elif step == "articles":
        ids = article_ids()
        print(f"{len(ids)} articles", flush=True)

        def one(a):
            s, err = fetch(f"{BASE}/subject/subject.php?id={a}", f"{CACHE}/art/{a}.html")
            return None if s is not None else f"art {a}: {err}"
        with ThreadPoolExecutor(WORKERS) as ex:
            for i, f in enumerate(ex.map(one, ids)):
                if f:
                    fails.append(f)
                if i % 500 == 0:
                    print(f"  {i}/{len(ids)}", flush=True)
    elif step == "photos":
        urls = json.load(open(f"{CACHE}/photo-urls.json"))
        print(f"{len(urls)} photos", flush=True)

        def one(u):
            path = f"{CACHE}/photo/" + re.sub(r"[^\w.]", "_", u.lstrip("/"))
            d, err = fetch(BASE + u, path, binary=True)
            return None if d is not None else f"photo {u}: {err}"
        with ThreadPoolExecutor(WORKERS) as ex:
            for i, f in enumerate(ex.map(one, urls)):
                if f:
                    fails.append(f)
                if i % 1000 == 0:
                    print(f"  {i}/{len(urls)}", flush=True)
    else:
        sys.exit(__doc__)
    open(f"{CACHE}/failed-{step}.txt", "w").write("\n".join(fails))
    print(f"done; {len(fails)} failed", flush=True)


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "")
