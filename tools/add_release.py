#!/usr/bin/env python3
"""After a content refresh: compare the article index with the last commit and,
if articles were added or removed, add a release entry (last digit bumped) to
js/releases.js in en, zh, zht and ms, as the release rule in CLAUDE.md asks.

    python3 tools/add_release.py      # exit 0: release added; 3: nothing changed

Refuses (exit 2) when the article count falls by more than 5%: that means MOA
was unreachable or changed its pages, not that it removed a twentieth of its
articles, and such a build must not go out.
"""
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def ids(rows):
    return {(r[1], r[0]) for r in rows}


def main():
    now = {tuple(x) for x in ids(json.load(open(f"{ROOT}/data/index.json", encoding="utf-8")))}
    try:
        before = ids(json.loads(subprocess.check_output(["git", "show", "HEAD:data/index.json"], cwd=ROOT)))
    except subprocess.CalledProcessError:
        before = set()
    added, removed = len(now - before), len(before - now)
    print(f"articles: {len(before)} -> {len(now)} (+{added} -{removed})")
    if before and len(now) < 0.95 * len(before):
        print("refusing: more than 5% of articles disappeared")
        sys.exit(2)
    if not added and not removed:
        sys.exit(3)

    path = f"{ROOT}/js/releases.js"
    src = open(path, encoding="utf-8").read()
    last = re.search(r"v: '(\d+)\.(\d+)\.(\d+)'", src)
    v = f"{last.group(1)}.{last.group(2)}.{int(last.group(3)) + 1}"
    day = time.strftime("%Y-%m-%d", time.gmtime(time.time() + 8 * 3600))
    at = time.strftime("%Y-%m-%dT%H:%M:00Z", time.gmtime())
    fetched = json.load(open(f"{ROOT}/data/photos.json"))["fetched"] or day
    total = f"{len(now):,}"
    notes = {
        "en": [f"Content update from MOA: {added:,} new article{'s' if added != 1 else ''}, {total} in all (fetched {fetched})."],
        "zht": [f"農業部內容更新：新增 {added:,} 篇文章，共 {total} 篇（{fetched} 擷取）。"],
        "zh": [f"农业部内容更新：新增 {added:,} 篇文章，共 {total} 篇（{fetched} 撷取）。"],
        "ms": [f"Kemas kini kandungan daripada MOA: {added:,} artikel baharu, {total} kesemuanya (diambil {fetched})."],
    }
    if removed:
        notes["en"].append(f"{removed:,} article{'s' if removed != 1 else ''} MOA no longer lists {'were' if removed != 1 else 'was'} removed.")
        notes["zht"].append(f"移除 {removed:,} 篇農業部已不再列出的文章。")
        notes["zh"].append(f"移除 {removed:,} 篇农业部已不再列出的文章。")
        notes["ms"].append(f"{removed:,} artikel yang tidak lagi disenaraikan oleh MOA telah dibuang.")
    lines = [f"  {{\n    v: '{v}', date: '{day}', at: '{at}',\n    notes: {{\n"]
    for lang in ("en", "zht", "zh", "ms"):
        lines.append(f"      {lang}: [\n" + "".join(f"        {json.dumps(n, ensure_ascii=False)},\n" for n in notes[lang]) + "      ],\n")
    lines.append("    },\n  },\n")
    marker = "export const RELEASES = [\n"
    open(path, "w", encoding="utf-8").write(src.replace(marker, marker + "".join(lines), 1))
    print(f"release {v} added")


if __name__ == "__main__":
    main()
