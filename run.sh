#!/bin/bash

# 本地测试脚本 / Local testing script
# 主要工作流已迁移到 GitHub Actions (.github/workflows/run.yml)
# Main workflow has been migrated to GitHub Actions (.github/workflows/run.yml)

# 环境变量检查和提示 / Environment variables check and prompt
today=$(date -u "+%Y-%m-%d")
echo "📅 日期: $today"

# 步骤1：抓取论文
echo "⏬ 步骤1: 抓取 arXiv 论文..."
if [ -f "data/${today}.jsonl" ]; then
    rm "data/${today}.jsonl"
fi
python daily_arxiv/arxiv_fetch.py --output data/${today}.jsonl
if [ $? -ne 0 ]; then
    echo "❌ 抓取失败"
    exit 1
fi

# 步骤2：转换为 Markdown
echo "📝 步骤2: 转换为 Markdown..."
cd to_md
python convert.py --data ../data/${today}.jsonl
cd ..

# 步骤3：更新文件列表
echo "📋 步骤3: 更新文件列表..."
ls data/*.jsonl | sed 's|data/||' > assets/file-list.txt

echo "✅ 完成！"