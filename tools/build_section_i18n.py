#!/usr/bin/env python3
"""English and Malay names for MOA's section titles.

MOA writes section titles only in Chinese. tools/content/section_titles.tsv
holds one line per distinct title: the 繁體 title as MOA writes it, English,
Malay (tab separated). This writes data/sections-i18n.json, {繁體 title: [en, ms]},
keyed by the exact titles in data/halls.json, and lists any title without a
translation (the app then shows MOA's Chinese).

    python3 tools/build_section_i18n.py
"""
import json
import os
import re
import unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def norm(s):
    # Invisible characters MOA sometimes leaves in titles (private-use symbols, odd spaces).
    s = unicodedata.normalize("NFKC", s)
    s = "".join(c for c in s if unicodedata.category(c) not in ("Co", "Cf", "Cc"))
    return re.sub(r"\s+", " ", s).strip()


def main():
    rows = {}
    for line in open(f"{ROOT}/tools/content/section_titles.tsv", encoding="utf-8"):
        parts = line.rstrip("\n").split("\t")
        if len(parts) == 3:
            rows[norm(parts[0])] = [parts[1].strip(), parts[2].strip()]
    halls = json.load(open(f"{ROOT}/data/halls.json", encoding="utf-8"))["halls"]
    out, missing = {}, set()
    for h in halls:
        for g in h["groups"]:
            for t in [g["zht"]] + [i["zht"] for i in g["items"]]:
                if norm(t) in rows:
                    out[t] = rows[norm(t)]
                else:
                    missing.add(t)
    json.dump(out, open(f"{ROOT}/data/sections-i18n.json", "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print(f"{len(out)} titles translated, {len(missing)} without: {sorted(missing)[:10]}")


if __name__ == "__main__":
    main()
