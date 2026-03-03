"""
daily_arxiv/arxiv_fetch.py  —  main branch 版本
抓取两类论文：
  1. 电池仿真 / 电池建模
  2. World Model / Diffusion Model
"""

import os, sys, json, time, argparse
import urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

# ── 搜索配置 ──────────────────────────────────────────────
SEARCH_TOPICS = [
    {
        "category": "Batteries",
        "arxiv_categories": [
            "cond-mat.mtrl-sci",
            "cond-mat.mes-hall",
            "physics.chem-ph",
            "cs.CE",
        ],
        "keywords": [
            "battery", "batteries", "cathode", "anode", "electrolyte",
            "lithium", "NMC", "solid-state", "all-solid-state",
            "electrochemical", "chemo-mechanical", "finite element",
            "phase field", "simulation", "modeling", "degradation",
            "ionic conductivity", "diffusion",
        ],
    },
    {
        "category": "WorldModel-Diffusion",
        "arxiv_categories": ["cs.LG", "cs.CV", "cs.AI", "cs.RO"],
        "keywords": [
            "world model", "world models",
            "diffusion model", "diffusion models",
            "denoising diffusion", "score matching",
            "DDPM", "DDIM", "flow matching", "latent diffusion",
            "video generation", "video prediction",
            "model-based reinforcement learning",
            "planning", "RSSM", "Dreamer",
        ],
    },
]

DAYS_BACK = 1
ARXIV_API = "http://export.arxiv.org/api/query"
MAX_PER_CAT = 200

NS = {"atom": "http://www.w3.org/2005/Atom",
      "arxiv": "http://arxiv.org/schemas/atom"}
# ──────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--output", required=True)
    p.add_argument("--days", type=int, default=DAYS_BACK)
    return p.parse_args()

def fetch_arxiv(cat, start=0, max_results=100):
    params = urllib.parse.urlencode({
        "search_query": f"cat:{cat}",
        "start": start,
        "max_results": max_results,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
    })
    req = urllib.request.Request(
        f"{ARXIV_API}?{params}",
        headers={"User-Agent": "daily-paper-bot/1.0"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")

def parse_entries(xml_str):
    root = ET.fromstring(xml_str)
    entries = []
    for entry in root.findall("atom:entry", NS):
        raw_id = entry.find("atom:id", NS).text.strip()
        arxiv_id = raw_id.split("/abs/")[-1]
        title_el = entry.find("atom:title", NS)
        title = " ".join(title_el.text.strip().split()) if title_el is not None else ""
        summ_el = entry.find("atom:summary", NS)
        summary = " ".join(summ_el.text.strip().split()) if summ_el is not None else ""
        authors = [
            a.find("atom:name", NS).text.strip()
            for a in entry.findall("atom:author", NS)
            if a.find("atom:name", NS) is not None
        ]
        pub_el = entry.find("atom:published", NS)
        published = pub_el.text.strip() if pub_el is not None else ""
        entries.append({
            "arxiv_id": arxiv_id, "title": title, "summary": summary,
            "authors": authors, "published": published,
            "abs": f"https://arxiv.org/abs/{arxiv_id}",
        })
    return entries

def is_recent(published, days_back):
    if not published:
        return False
    try:
        pub_dt = datetime.fromisoformat(published.replace("Z", "+00:00"))
        return pub_dt >= datetime.now(timezone.utc) - timedelta(days=days_back + 1)
    except Exception:
        return True

def kw_match(title, summary, keywords):
    text = (title + " " + summary).lower()
    return any(kw.lower() in text for kw in keywords)

def fetch_topic(topic, days_back):
    all_papers = {}
    for cat in topic["arxiv_categories"]:
        print(f"  [{topic['category']}] 抓取: {cat}", file=sys.stderr)
        try:
            entries = parse_entries(fetch_arxiv(cat, max_results=MAX_PER_CAT))
            kept = 0
            for e in entries:
                if not is_recent(e["published"], days_back):
                    continue
                if not kw_match(e["title"], e["summary"], topic["keywords"]):
                    continue
                if e["arxiv_id"] not in all_papers:
                    all_papers[e["arxiv_id"]] = {
                        "id": e["arxiv_id"],
                        "categories": [topic["category"]],
                        "title": e["title"],
                        "authors": e["authors"],
                        "summary": e["summary"],
                        "abs": e["abs"],
                        "published": e["published"],
                    }
                    kept += 1
            print(f"    保留 {kept}/{len(entries)}", file=sys.stderr)
            time.sleep(3)
        except Exception as ex:
            print(f"    ❌ {cat} 失败: {ex}", file=sys.stderr)
    return list(all_papers.values())

def main():
    args = parse_args()
    all_records = []
    for topic in SEARCH_TOPICS:
        papers = fetch_topic(topic, args.days)
        print(f"✅ {topic['category']}: {len(papers)} 篇", file=sys.stderr)
        all_records.extend(papers)
    print(f"📊 总计: {len(all_records)} 篇", file=sys.stderr)
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        for r in all_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"✅ 写入: {args.output}", file=sys.stderr)
    if not all_records:
        sys.exit(1)

if __name__ == "__main__":
    main()
