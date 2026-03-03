"""
daily_arxiv/wos_fetch.py
------------------------
替换 scrapy spider，从 Web of Science Starter API 抓取电池相关论文。
输出格式与原 scrapy pipeline 完全一致，下游的 enhance.py 和 convert.py 无需任何修改。

用法:
    python daily_arxiv/wos_fetch.py --output data/2025-01-01.jsonl
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime, timedelta, timezone

# ─────────────────────────────────────────────────────────
# ✏️  只需修改这里的搜索关键词，其他不用动
# ─────────────────────────────────────────────────────────
QUERY = (
    'TS=("solid-state battery" OR "all-solid-state battery" OR '
    '"NMC cathode" OR "lithium-ion battery" OR "ASSB" OR '
    '"lithium metal battery" OR "battery electrolyte" OR '
    '"cathode material") AND '
    'TS=(mechanics OR stress OR diffusion OR microstructure OR '
    '"finite element" OR "chemo-mechanical" OR degradation OR '
    '"phase field" OR simulation OR modeling)'
)

# WoS 数据库，WOS = Core Collection
DATABASE = "WOS"

# 搜索最近几天的论文（1 = 昨天到今天）
DAYS_BACK = 1

# 用作 convert.py 里 categories 分组的标签
# convert.py 用 item["categories"][0] 作为分组 key
CATEGORY_LABEL = "Batteries"

# ─────────────────────────────────────────────────────────

WOS_API_KEY = os.environ.get("WOS_API_KEY", "")
BASE_URL = "https://api.clarivate.com/apis/wos-starter/v1"


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=str, required=True,
                        help="输出 jsonl 文件路径，例如 data/2025-01-01.jsonl")
    parser.add_argument("--days", type=int, default=DAYS_BACK,
                        help="搜索最近几天的论文")
    return parser.parse_args()


def build_date_range(days_back: int) -> str:
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days_back)
    return f"{start.isoformat()}+{today.isoformat()}"


def fetch_page(query: str, date_range: str, page: int) -> dict:
    if not WOS_API_KEY:
        sys.exit("❌ 错误：未设置环境变量 WOS_API_KEY")

    headers = {
        "X-ApiKey": WOS_API_KEY,
        "Accept": "application/json",
    }
    params = {
        "q": query,
        "db": DATABASE,
        "limit": 50,
        "page": page,
        "sort_field": "LD+D",           # 按加载日期降序（最新在前）
        "modified_time_span": date_range,
    }

    resp = requests.get(
        f"{BASE_URL}/documents",
        headers=headers,
        params=params,
        timeout=30,
    )

    if resp.status_code == 401:
        sys.exit("❌ 401 Unauthorized：API Key 无效或未订阅 WoS Starter API")
    if resp.status_code == 429:
        sys.exit("❌ 429 Rate Limit：今日 API 请求已超限，明天再试")
    resp.raise_for_status()
    return resp.json()


def parse_record(rec: dict) -> dict:
    """
    把 WoS API 的一条记录转换成与原 scrapy pipeline 完全一致的格式：
    {
        "id":         str,          # 唯一标识（DOI 或 WoS UID）
        "categories": [str, ...],   # 分类列表，第一个元素用于分组
        "title":      str,
        "authors":    [str, ...],   # 作者姓名列表
        "summary":    str,          # 摘要（enhance.py 用这个做 AI 摘要）
        "abs":        str,          # 论文链接 URL（convert.py 用这个）
    }
    """
    # Title
    title = rec.get("title", "No title")

    # Authors — 最多取 10 位，超过的用 "et al." 标注
    authors_raw = rec.get("names", {}).get("authors", [])
    authors = [a.get("displayName", "") for a in authors_raw if a.get("displayName")]
    if len(authors_raw) > 10:
        authors.append("et al.")

    # Abstract — WoS 有时返回列表
    abstract = rec.get("abstract", "No abstract available.")
    if isinstance(abstract, list):
        abstract = " ".join(abstract)
    if not abstract:
        abstract = "No abstract available."

    # DOI & URL
    doi_list = rec.get("identifiers", {}).get("doi", [])
    doi = doi_list[0] if doi_list else ""
    wos_uid = rec.get("uid", "")

    if doi:
        abs_url = f"https://doi.org/{doi}"
    elif wos_uid:
        abs_url = f"https://www.webofscience.com/wos/woscc/full-record/{wos_uid}"
    else:
        abs_url = ""

    # Unique ID — 优先用 DOI，否则用 WoS UID
    unique_id = doi if doi else wos_uid

    # WoS subject categories（可选，用于更细致的分组）
    # 默认统一用 CATEGORY_LABEL，你也可以改成用 WoS 自带的学科分类
    wos_categories = rec.get("source", {}).get("publishYear", "")  # 只是示例
    
    # 期刊名和年份（可选，方便调试）
    journal = rec.get("source", {}).get("sourceTitle", "")
    year = str(rec.get("source", {}).get("publishYear", ""))

    return {
        "id": unique_id,
        "categories": [CATEGORY_LABEL],   # convert.py 用 categories[0] 分组
        "title": title,
        "authors": authors,
        "summary": abstract,              # enhance.py 读 item['summary']
        "abs": abs_url,                   # convert.py 读 item['abs']
        # 以下是额外字段，不影响下游，但方便查看
        "journal": journal,
        "year": year,
        "doi": doi,
        "wos_uid": wos_uid,
    }


def main():
    args = parse_args()
    date_range = build_date_range(args.days)

    print(f"🔍 搜索日期范围: {date_range}", file=sys.stderr)
    print(f"🔍 查询语句: {QUERY[:80]}...", file=sys.stderr)

    all_records = []
    page = 1

    while True:
        data = fetch_page(QUERY, date_range, page)
        total = data.get("metadata", {}).get("total", 0)
        hits = data.get("hits", [])

        print(f"  第 {page} 页: {len(hits)} / {total} 条记录", file=sys.stderr)

        for rec in hits:
            parsed = parse_record(rec)
            # 跳过没有摘要或标题的记录
            if parsed["title"] == "No title" and parsed["summary"] == "No abstract available.":
                continue
            all_records.append(parsed)

        if len(all_records) >= total or not hits:
            break
        page += 1

    # 去重（按 id）
    seen = set()
    unique_records = []
    for r in all_records:
        if r["id"] not in seen:
            seen.add(r["id"])
            unique_records.append(r)

    print(f"✅ 共抓取 {len(unique_records)} 篇论文（去重后）", file=sys.stderr)

    # 写入 jsonl
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        for record in unique_records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"✅ 已写入: {args.output}", file=sys.stderr)

    # 如果没有论文，退出码 1（与原来 check_stats.py 的"无新内容"一致）
    if not unique_records:
        print("ℹ  今日无新论文", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
