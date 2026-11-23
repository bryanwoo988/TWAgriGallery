#!/usr/bin/env python3
"""English and Malay for MOA's article titles (the article text stays Chinese).

tools/content/article_titles_src.json is the fixed, numbered list of distinct
titles (hall by hall). tools/content/article_titles.tsv holds the translations
as "number<TAB>English<TAB>Malay", added batch by batch; a title without a line
shows MOA's Chinese. This writes data/titles-i18n.json, {繁體 title: [en, ms]}.
New titles from the monthly refresh are appended to the list with --add-new.

    python3 tools/build_title_i18n.py [--add-new]
"""
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = f"{ROOT}/tools/content/article_titles_src.json"


def main():
    src = json.load(open(SRC, encoding="utf-8"))
    if "--add-new" in sys.argv:
        known = set(src)
        new = [r[3] for r in json.load(open(f"{ROOT}/data/index.json", encoding="utf-8")) if r[3] not in known]
        src += list(dict.fromkeys(new))
        json.dump(src, open(SRC, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    out = {}
    path = f"{ROOT}/tools/content/article_titles.tsv"
    for line in open(path, encoding="utf-8") if os.path.exists(path) else []:
        parts = line.rstrip("\n").split("\t")
        if len(parts) == 3 and parts[0].isdigit() and int(parts[0]) < len(src):
            out[src[int(parts[0])]] = [parts[1].strip(), parts[2].strip()]
    json.dump(out, open(f"{ROOT}/data/titles-i18n.json", "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print(f"{len(out)} of {len(src)} titles translated")


if __name__ == "__main__":
    main()
