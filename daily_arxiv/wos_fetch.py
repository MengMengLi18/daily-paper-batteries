"""
daily_arxiv/wos_fetch.py  —  每日版本（GitHub Actions 用）
只抓最近 1 天新增的论文

用法:
    python daily_arxiv/wos_fetch.py --output data/2026-03-04.jsonl
"""

import os, sys, json, argparse, requests
from datetime import datetime, timedelta, timezone

QUERY = (
    'TS=("NMC" OR "all-solid-state battery" OR "ASSB" OR '
    '"solid-state battery" OR "chemo-mechanical" OR '
    '"lithium-ion battery" OR "cathode material") AND '
    'TS=(mechanics OR stress OR diffusion OR microstructure OR '
    '"finite element" OR "X-ray" OR simulation OR modeling OR '
    'degradation OR "phase field" OR "machine learning" OR '
    '"neural network" OR "PINN" OR "physics-informed" OR '
    '"data-driven" OR "deep learning")'
)

DATABASE = "WOS"
DAYS_BACK = 1
CATEGORY_LABEL = "NMC-ASSB"
WOS_API_KEY = os.environ.get("WOS_API_KEY", "")
BASE_URL = "https://api.clarivate.com/apis/wos-starter/v1"


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--output", required=True)
    p.add_argument("--days", type=int, default=DAYS_BACK)
    return p.parse_args()


def build_date_range(days_back):
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days_back)
    return f"{start.isoformat()}+{today.isoformat()}"


def fetch_page(page, date_range):
    if not WOS_API_KEY:
        sys.exit("❌ 未设置环境变量 WOS_API_KEY")
    headers = {"X-ApiKey": WOS_API_KEY, "Accept": "application/json"}
    params = {
        "q": QUERY,
        "db": DATABASE,
        "limit": 50,
        "page": page,
        "modified_time_span": date_range,
    }
    resp = requests.get(f"{BASE_URL}/documents", headers=headers,
                        params=params, timeout=30)
    if resp.status_code == 401:
        sys.exit("❌ 401 Unauthorized：API Key 无效")
    if resp.status_code == 429:
        sys.exit("❌ 429 Rate Limit：今日请求已超限")
    resp.raise_for_status()
    return resp.json()


def parse_record(rec):
    title = rec.get("title", "No title")
    authors_raw = rec.get("names", {}).get("authors", [])
    authors = [a.get("displayName", "") for a in authors_raw if a.get("displayName")]
    if len(authors_raw) > 10:
        authors.append("et al.")
    abstract = rec.get("abstract", "No abstract available.")
    if isinstance(abstract, list):
        abstract = " ".join(abstract)
    if not abstract:
        abstract = "No abstract available."
    doi_list = rec.get("identifiers", {}).get("doi", [])
    doi = doi_list[0] if doi_list else ""
    wos_uid = rec.get("uid", "")
    abs_url = f"https://doi.org/{doi}" if doi else \
              f"https://www.webofscience.com/wos/woscc/full-record/{wos_uid}"
    unique_id = doi if doi else wos_uid
    journal = rec.get("source", {}).get("sourceTitle", "")
    year = str(rec.get("source", {}).get("publishYear", ""))
    return {
        "id": unique_id,
        "categories": [CATEGORY_LABEL],
        "title": title,
        "authors": authors,
        "summary": abstract,
        "abs": abs_url,
        "journal": journal,
        "year": year,
    }


def main():
    args = parse_args()
    date_range = build_date_range(args.days)
    print(f"🔍 日期范围: {date_range}", file=sys.stderr)
    print(f"🔍 查询: {QUERY[:80]}...", file=sys.stderr)

    all_records, page = [], 1
    while True:
        data = fetch_page(page, date_range)
        total = data.get("metadata", {}).get("total", 0)
        hits = data.get("hits", [])
        print(f"  第 {page} 页: {len(hits)} / {total}", file=sys.stderr)
        for rec in hits:
            parsed = parse_record(rec)
            if parsed["title"] != "No title":
                all_records.append(parsed)
        if not hits or page * 50 >= total:
            break
        page += 1

    seen, unique = set(), []
    for r in all_records:
        if r["id"] not in seen:
            seen.add(r["id"])
            unique.append(r)

    print(f"✅ 共 {len(unique)} 篇（去重后）", file=sys.stderr)
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        for r in unique:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"✅ 写入: {args.output}", file=sys.stderr)
    if not unique:
        print("ℹ  今日无新论文", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
