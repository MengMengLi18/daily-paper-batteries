# daily-paper-batteries 搭建记录

## 仓库结构

```
daily-paper-batteries/
│
├── 📁 .github/workflows/
│   └── run.yml                  # GitHub Actions 自动运行（每天 UTC 01:30）
│
├── 📁 daily_arxiv/
│   ├── arxiv_fetch.py           # 抓取 arXiv 论文（main 分支）
│   ├── wos_fetch.py             # 抓取 WoS 论文（wos-version 分支）
│   └── config.yaml              # 分类配置
│
├── 📁 ai/
│   ├── enhance.py               # DeepSeek AI 生成中文摘要
│   ├── template.txt             # 摘要模板
│   └── system.txt               # 系统提示词
│
├── 📁 to_md/
│   └── convert.py               # 将 jsonl 转换为 Markdown
│
├── 📁 data/                     # 论文数据（存在 data 分支，自动提交）
│   ├── 2026-03-03.jsonl
│   └── 2026-03-03_AI_enhanced_Chinese.jsonl
│
├── 📁 assets/
│   └── file-list.txt            # 所有数据文件列表（前端用）
│
├── 📁 js/
│   ├── data-config.js           # 仓库信息配置
│   └── auth-config.js           # 密码验证配置
│
├── getLocal.sh                  # 本地测试脚本（.gitignore，不上传）
├── README.md
└── .gitignore
```

## 分支说明

| 分支 | 用途 |
|------|------|
| `main` | 代码主分支，arXiv API 抓取电池仿真 + World Model/Diffusion Model 论文 |
| `wos-version` | Web of Science Starter API 抓取论文（等待 API 审批） |
| `data` | 存放每日论文数据（自动提交，不要手动改） |

## 整体流程

```
每天 UTC 01:30 自动触发
        │
        ▼
[步骤1] arxiv_fetch.py
  arXiv API → 关键词过滤 → data/YYYY-MM-DD.jsonl
  抓取分类：
    Batteries     → cond-mat.mtrl-sci, cond-mat.mes-hall, physics.chem-ph, cs.CE
    WorldModel    → cs.LG, cs.CV, cs.AI, cs.RO
        │
        ▼
[步骤2] ai/enhance.py
  读取 jsonl → DeepSeek API → 中文摘要
  输出：data/YYYY-MM-DD_AI_enhanced_Chinese.jsonl
        │
        ▼
[步骤3] to_md/convert.py
  读取 AI 增强 jsonl → 生成 Markdown 页面
        │
        ▼
[步骤4] 提交代码到 main 分支
[步骤5] 提交数据到 data 分支
        │
        ▼
[GitHub Pages] 展示论文列表网页
```

---

## 搭建过程中遇到的问题

### 问题1：GitHub 推送认证失败
**错误：** `Invalid username or token. Password authentication is not supported`
**原因：** GitHub 不支持密码推送，需要 SSH 或 Personal Access Token
**解决：** 配置 SSH key（`ssh-keygen -t ed25519`，添加到 GitHub Settings → SSH keys）

---

### 问题2：workflow `fi` 缺失导致 syntax error
**错误：** `syntax error: unexpected end of file` / `Process completed with exit code 2`
**原因：** 多次用 `sed` 替换内容时，`if/else/fi` 结构被破坏，多个 `fi` 被误删
**解决：** 完整重写 `run.yml` 文件

---

### 问题3：`check_stats.py` 路径错误
**原因：** 原始 workflow 在 `cd daily_arxiv` 后执行，改为根目录执行后路径不对
**解决：** 删除 `check_stats.py` 步骤（`arxiv_fetch.py` 已内置去重）

---

### 问题4：本地缺少 Python 依赖
**错误：** `ModuleNotFoundError: No module named 'langchain_core'` / `No module named 'langchain'`
**解决：**
```bash
pip install langchain==0.3.0 langchain-core==0.3.63 langchain-openai==0.2.0 requests --break-system-packages
```

---

### 问题5：DeepSeek API 余额不足
**错误：** `Error code: 402 - InsufficientBalance`
**解决：** 在 https://platform.deepseek.com 充值，或更换 API Key
每天约消耗 ¥0.2（60篇论文）

---

### 问题6：WoS API 订阅未配置
**原因：** 需要在 Clarivate Developer Portal 申请 Web of Science Starter API 订阅
**解决：** 申请 Free Institutional Member 套餐（学校账号免费，5000次/天），审批需 1-3 个工作日

---

## GitHub 配置清单

### Secrets

| 名称 | 值 |
|------|----|
| `OPENAI_API_KEY` | DeepSeek API Key |
| `OPENAI_BASE_URL` | `https://api.deepseek.com/v1` |
| `WOS_API_KEY` | WoS API Key（wos-version 分支，待申请） |
| `ACCESS_PASSWORD` | 网页访问密码（可选） |

### Variables

| 名称 | 值 |
|------|----|
| `LANGUAGE` | `Chinese` |
| `MODEL_NAME` | `deepseek-chat` |
| `EMAIL` | 你的 GitHub 邮箱 |
| `NAME` | `MengMengLi18` |

---

## 本地测试

安装依赖：
```bash
pip install langchain==0.3.0 langchain-core==0.3.63 langchain-openai==0.2.0 requests --break-system-packages
```

创建 `getLocal.sh`（已在 `.gitignore`，不会上传）：
```bash
#!/bin/bash
set -e
export OPENAI_API_KEY="你的DeepSeek-Key"
export OPENAI_BASE_URL="https://api.deepseek.com/v1"
export LANGUAGE="Chinese"
export MODEL_NAME="deepseek-chat"

today=$(date -u "+%Y-%m-%d")
python daily_arxiv/arxiv_fetch.py --output data/${today}.jsonl
cd ai && python enhance.py --data ../data/${today}.jsonl && cd ..
cd to_md && python convert.py --data ../data/${today}_AI_enhanced_${LANGUAGE}.jsonl && cd ..
echo "✅ 完成！"
```
