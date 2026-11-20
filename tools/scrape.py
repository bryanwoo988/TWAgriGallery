#!/usr/bin/env python3
"""Download the MOA theme-hall pages and images into .cache/moa/.

    python3 tools/scrape.py          # fetch what is missing
    python3 tools/scrape.py --fresh  # fetch everything again

Then run tools/build_data.py. Nothing here is served by the app; the cache
is gitignored. Requests are sequential with a short pause: this is a
government site, not a load test.
"""
import os
import re
import sys
import time
import urllib.request

BASE = "https://kmweb.moa.gov.tw"
ROOT = os.path.join(os.path.dirname(__file__), "..", ".cache", "moa")
CATS = "ABCDEFGZ"
FRESH = "--fresh" in sys.argv


def get(url, path, binary=False):
    if os.path.exists(path) and not FRESH:
        return open(path, "rb").read()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "TWAgriGallery-builder"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            break
        except Exception as e:  # network hiccup: retry, then give up loudly
            if attempt == 2:
                raise RuntimeError(f"{url}: {e}")
            time.sleep(2 * (attempt + 1))
    open(path, "wb").write(data)
    time.sleep(0.3)
    return data


def main():
    lst = get(f"{BASE}/theme_list.php?theme=subject_list_view", f"{ROOT}/list.html").decode("utf-8")
    for c in CATS:
        get(f"{BASE}/theme_list.php?theme=subject_list_view&type=img&crop_type={c}", f"{ROOT}/cat_{c}.html")
    ids = sorted(set(re.findall(r"subject/index\.php\?id=(\d+)", lst)), key=int)
    print(f"{len(ids)} halls")
    for i in ids:
        get(f"{BASE}/subject/index.php?id={i}", f"{ROOT}/halls/{i}.html")
        get(f"{BASE}/subject/images/subject/{i}/icon.svg", f"{ROOT}/icons/{i}.svg", binary=True)
    covers = {}
    for c in CATS:
        s = open(f"{ROOT}/cat_{c}.html", encoding="utf-8").read()
        for i, img in re.findall(r'href="subject/index\.php\?id=(\d+)"[^>]*style="background-image:url\(\'([^\']+)\'\)', s):
            covers[i] = img
    for i, img in covers.items():
        ext = img.rsplit(".", 1)[-1].lower()
        get(BASE + img, f"{ROOT}/covers/{i}.{ext}", binary=True)
    print("done")


if __name__ == "__main__":
    main()
