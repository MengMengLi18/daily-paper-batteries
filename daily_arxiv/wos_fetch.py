"""
daily_arxiv/wos_fetch.py  —  每日版本(GitHub Actions)
只抓最近 1 天新增的论文

用法:
    python daily_arxiv/wos_fetch.py --output data/data.jsonl
"""

from numpy import unique
import csv
from datetime import datetime
import os, sys, json, argparse, requests
from datetime import datetime, timedelta, timezone

## you can modify the query and journal whitelist as needed
#  but be careful not to make the query too broad, 
#  otherwise you may hit API rate limits or get too many irrelevant results.
QUERY = (
    # 第一组：研究对象（你的论文必须命中这里至少一个）
    'TS=("NMC" OR "Ni-rich" OR "nickel-rich" OR '
    '"solid-state battery" OR "solid-state batteries" OR '
    '"all-solid-state" OR "ASSB" OR '
    '"cathode" OR "solid electrolyte") AND '

    # 第二组：研究方法/现象（你的论文必须命中这里至少一个）
    'TS=("phase field" OR "phase-field" OR '
    '"chemo-mechanical" OR "anisotropic" OR "anisotropy" OR '
    'simulation OR modelling OR modeling OR '
    'fracture OR fatigue OR degradation OR '
    '"phase transformation" OR defects OR '
    '"mechanical degradation" OR stress OR diffusion)'
)

JOURNAL_WHITELIST = {
    # 力学顶刊
    "JOURNAL OF THE MECHANICS AND PHYSICS OF SOLIDS",
    "INTERNATIONAL JOURNAL OF MECHANICAL SCIENCES",
    "INTERNATIONAL JOURNAL OF SOLIDS AND STRUCTURES",
    "JOURNAL OF THE MECHANICAL BEHAVIOR OF BIOMEDICAL MATERIALS",
    "EXTREME MECHANICS LETTERS",
    "ACTA MECHANICA",
    # 综合顶刊
    "NATURE",
    "SCIENCE",
    "NATURE MATERIALS",
    "NATURE COMMUNICATIONS",
    # 材料顶刊
    "ADVANCED MATERIALS",
    "ADVANCED FUNCTIONAL MATERIALS",
    "JOURNAL OF MATERIALS CHEMISTRY A",
    "NANO ENERGY",
    "ACS NANO",
    "NANO LETTERS",
    "MATERIALS TODAY",
    "ACTA MATERIALIA",
    "SCRIPTA MATERIALIA",
    "NPJ COMPUTATIONAL MATERIALS",
    "JOULE",
    "ENERGY & ENVIRONMENTAL SCIENCE",
    "ADVANCED SCIENCE",
    "MATERIALS & DESIGN",
    "JOURNAL OF ALLOYS AND COMPOUNDS",
    "JOURNAL OF PHYSICS AND CHEMISTRY OF SOLIDS",
    "SMALL",
    "SCIENTIFIC REPORTS",
    "ACS APPLIED MATERIALS & INTERFACES",
    "ACS APPLIED ENERGY MATERIALS",
    "JOURNAL OF ENERGY CHEMISTRY",
    "JOURNAL OF MATERIALS RESEARCH AND TECHNOLOGY-JMR&T",
    "PHYSICAL CHEMISTRY CHEMICAL PHYSICS",
    # 电池/能源
    "JOURNAL OF POWER SOURCES",
    "JOURNAL OF ENERGY STORAGE",
    "APPLIED ENERGY",
    "RENEWABLE ENERGY",
    "ENERGY STORAGE MATERIALS",
    "JOURNAL OF THE ELECTROCHEMICAL SOCIETY",
    "ELECTROCHIMICA ACTA",
    "ADVANCED ENERGY MATERIALS",
    "ACS ENERGY LETTERS",
    "NATURE ENERGY",
    # 计算
    "COMPUTER METHODS IN APPLIED MECHANICS AND ENGINEERING",
    "COMPUTATIONAL MATERIALS SCIENCE",
}

DATABASE = "WOS"
DAYS_BACK = 1
CATEGORY_LABEL = "NMC-ASSB"
WOS_API_KEY = os.environ.get("WOS_API_KEY", "")
BASE_URL = "https://api.clarivate.com/apis/wos-starter/v1"


def is_in_whitelist(journal: str) -> bool:
    return journal.strip().upper() in JOURNAL_WHITELIST

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
        sys.exit(" 未设置环境变量 WOS_API_KEY")
    headers = {"X-ApiKey": WOS_API_KEY, "Accept": "application/json"}
    params = {
        "q": QUERY,
        "db": DATABASE,
        "limit": 50,
        "page": page,
        "publishTimeSpan": date_range,
    }
    resp = requests.get(f"{BASE_URL}/documents", headers=headers,
                        params=params, timeout=30)
    if resp.status_code == 401:
        sys.exit(" 401 Unauthorized：API Key 无效")
    if resp.status_code == 429:
        sys.exit(" 429 Rate Limit：今日请求已超限")
    if resp.status_code == 400:
        print(f" 400 Bad Request，响应内容: {resp.text}", file=sys.stderr)
        sys.exit(1)
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

def save_csv(records, output_path):
    """把论文列表保存为 CSV"""
    csv_path = output_path.replace(".jsonl", ".csv")
    
    fieldnames = ["title", "authors", "journal", "year", "summary", "abs"]
    
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "title":   r.get("title", ""),
                "authors": "; ".join(r.get("authors", [])),
                "journal": r.get("journal", ""),
                "year":    r.get("year", ""),
                "summary": r.get("summary", ""),
                "abs":     r.get("abs", ""),
            })
    print(f"✅ CSV 写入: {csv_path}", file=sys.stderr)

def main():
    args = parse_args()
    date_range = build_date_range(args.days)
    print(f"🔍 日期范围: {date_range}", file=sys.stderr)
    print(f"🔍 查询: {QUERY[:80]}...", file=sys.stderr)

    all_records, page = [], 1
    print(f"🔄 开始抓取...", file=sys.stderr)
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

    if JOURNAL_WHITELIST:
        before = len(unique)
        unique = [r for r in unique if is_in_whitelist(r["journal"])]
        print(f" 期刊过滤: {before} → {len(unique)} 篇", file=sys.stderr)
        # 打印被过滤掉的期刊名，方便调试
        filtered_journals = {
            r["journal"] for r in all_records
            if not is_in_whitelist(r["journal"])
        }
        if filtered_journals:
            print(f"   过滤掉的期刊: {', '.join(sorted(filtered_journals))}",
                file=sys.stderr)
                
    print(f" 共 {len(unique)} 篇（去重后）", file=sys.stderr)
    # all_journals = {r["journal"] for r in unique}
    # print(f"📋 本次抓到的所有期刊:", file=sys.stderr)
    # for j in sorted(all_journals):
    #     print(f"   '{j}'", file=sys.stderr)

    # 提前检查，不写空文件
    if not unique:
        print("ℹ  今日无新论文", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        for r in unique:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f" 写入: {args.output}", file=sys.stderr)

    save_csv(unique, args.output)


if __name__ == "__main__":
    main()
