# 🔋 daily-paper-batteries

> [!CAUTION]
> 若您所在法域对学术数据有审查要求，谨慎运行本代码；任何二次分发版本必须履行合规审查（包括但不限于原始论文合规性、AI合规性）义务，否则一切法律后果由下游自行承担。

> [!CAUTION]
> If your jurisdiction has censorship requirements for academic data, run this code with caution; any secondary distribution version must fulfill the content review obligations, otherwise all legal consequences will be borne by the downstream.

本项目基于 [daily-arXiv-ai-enhanced](https://github.com/dw-dengwei/daily-arXiv-ai-enhanced) 改造，支持两种数据源：**arXiv**（免费，无需 API Key）和 **Web of Science**（需要 WOS API Key），专注于电池力学与全固态电池领域的每日论文追踪。

---

## ✨ 主要功能

🎯 **无需服务器**
- 基于 GitHub Actions 自动运行，完全免费

🔍 **双数据源支持**
- **arXiv**：免费抓取，覆盖预印本，无需注册
- **WOS**：正式发表论文，期刊白名单精准过滤

🤖 **AI 摘要增强**
- 集成 AI 对论文摘要进行中文增强

---

## 研究聚焦

- 全固态电池（ASSB）与 NMC 正极材料
- 力化学耦合（chemo-mechanical）行为
- 相场模拟、有限元、数据驱动方法
- 应力、断裂、扩散、各向异性等力学主题
- World Model / Diffusion Model（AI 方向）

---

## 目录结构

```
daily_arxiv/
    arxiv_fetch.py      # arXiv 论文抓取脚本（main 分支）
    wos_fetch.py        # WOS 论文抓取脚本
ai/
    enhance.py          # AI 摘要增强
to_md/
    convert.py          # 将 .jsonl 转为 Markdown
    paper_template.md   # 单篇论文 Markdown 模板
data/                   # 每日抓取结果（.jsonl 和 .md）
.github/                # GitHub Actions 自动化配置
```

---

## 数据源一：arXiv（main 分支）

### 特点
- 完全免费，无需任何 API Key
- 覆盖预印本，论文更新速度快
- 通过 arXiv 分类 + 关键词双重过滤

### 抓取主题

| 分类 | 说明 |
|------|------|
| `Battery-Simulation` | 电池仿真与建模（cond-mat、physics.chem-ph、cs.CE） |
| `AI-Battery` | AI + 电池交叉（需同时命中 AI 关键词和电池关键词） |
| `WorldModel-Diffusion` | World Model / Diffusion Model（cs.LG、cs.CV） |

### 本地运行

```bash
# 抓取最近 1 天
python daily_arxiv/arxiv_fetch.py --output data/data.jsonl

# 抓取最近 N 天
python daily_arxiv/arxiv_fetch.py --output data/data.jsonl --days 7
```

无需设置任何环境变量，直接运行即可。

### 自定义配置

在 `arxiv_fetch.py` 的 `SEARCH_TOPICS` 中修改：

```python
SEARCH_TOPICS = [
    {
        "category": "Battery-Simulation",
        "arxiv_categories": ["cond-mat.mtrl-sci", "physics.chem-ph", ...],
        "keywords": ["battery", "NMC", "phase field", ...],
    },
    ...
]
```

---

## 数据源二：WOS

### 特点
- 只收录正式发表的期刊论文
- 通过期刊白名单过滤，精准度更高
- 需要 WOS Starter API Key（免费申请）

### 本地运行

```bash
export WOS_API_KEY="your_api_key_here"

# 抓取最近 1 天
python daily_arxiv/wos_fetch.py --output data/data.jsonl

# 抓取最近 N 天
python daily_arxiv/wos_fetch.py --output data/data.jsonl --days 7
```

WOS API Key 申请地址：https://developer.clarivate.com

### 自定义配置

**搜索关键词（QUERY）：**

```python
QUERY = (
    'TS=("NMC" OR "solid-state battery" OR "ASSB" OR ...) AND '
    'TS=(stress OR fracture OR "phase field" OR ...)'
)
```

第一组为研究对象，第二组为研究方法，两组**同时命中**才会被抓取。

**期刊白名单（JOURNAL_WHITELIST）：**

```python
JOURNAL_WHITELIST = {
    "JOURNAL OF THE MECHANICS AND PHYSICS OF SOLIDS",
    "NATURE ENERGY",
    "JOURNAL OF POWER SOURCES",
    ...
}
```

白名单为空集时不过滤，保留所有期刊。

---

## GitHub Actions 配置

在仓库 Settings → Secrets and variables → Actions → Secrets 中添加：

| 名称 | 说明 | 哪个数据源需要 |
|------|------|--------------|
| `WOS_API_KEY` | WOS Starter API Key | 仅 WOS |
| `OPENAI_API_KEY` | AI 摘要增强 API Key | 两者均需 |
| `OPENAI_BASE_URL` | 对应的 API Base URL | 两者均需 |

---

## 输出格式

```json
{
  "id": "论文唯一标识（DOI 或 arXiv ID）",
  "categories": ["Battery-Simulation"],
  "title": "论文标题",
  "authors": ["Author A", "Author B"],
  "summary": "摘要内容",
  "abs": "https://doi.org/... 或 https://arxiv.org/abs/...",
  "journal": "JOURNAL OF POWER SOURCES",
  "year": "2026"
}
```

---

## Contributors

感谢原项目 [daily-arXiv-ai-enhanced](https://github.com/dw-dengwei/daily-arXiv-ai-enhanced) 的所有贡献者：

<table>
  <tbody>
    <tr>
      <td align="center" valign="top">
        <a href="https://github.com/JianGuanTHU"><img src="https://avatars.githubusercontent.com/u/44895708?v=4" width="100px;" alt="JianGuanTHU"/><br /><sub><b>JianGuanTHU</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/Chi-hong22"><img src="https://avatars.githubusercontent.com/u/75403952?v=4" width="100px;" alt="Chi-hong22"/><br /><sub><b>Chi-hong22</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/chaozg"><img src="https://avatars.githubusercontent.com/u/69794131?v=4" width="100px;" alt="chaozg"/><br /><sub><b>chaozg</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/quantum-ctrl"><img src="https://avatars.githubusercontent.com/u/16505311?v=4" width="100px;" alt="quantum-ctrl"/><br /><sub><b>quantum-ctrl</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/Zhao2z"><img src="https://avatars.githubusercontent.com/u/141019403?v=4" width="100px;" alt="Zhao2z"/><br /><sub><b>Zhao2z</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/eclipse0922"><img src="https://avatars.githubusercontent.com/u/6214316?v=4" width="100px;" alt="eclipse0922"/><br /><sub><b>eclipse0922</b></sub></a>
      </td>
    </tr>
    <tr>
      <td align="center" valign="top">
        <a href="https://github.com/xuemian168"><img src="https://avatars.githubusercontent.com/u/38741078?v=4" width="100px;" alt="xuemian168"/><br /><sub><b>xuemian168</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/Lrrrr549"><img src="https://avatars.githubusercontent.com/u/71866027?v=4" width="100px;" alt="Lrrrr549"/><br /><sub><b>Lrrrr549</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/AinzRimuru"><img src="https://avatars.githubusercontent.com/u/59441476?v=4" width="100px;" alt="AinzRimuru"/><br /><sub><b>AinzRimuru</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/fengxueguiren"><img src="https://avatars.githubusercontent.com/u/153522370?v=4" width="100px;" alt="fengxueguiren"/><br /><sub><b>fengxueguiren</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://github.com/zerocpp"><img src="https://avatars.githubusercontent.com/u/2630297?v=4" width="100px;" alt="zerocpp"/><br /><sub><b>zerocpp</b></sub></a>
      </td>
    </tr>
  </tbody>
</table>

---

## Acknowledgement

感谢原项目作者及以下推广者的支持：

<table>
  <tbody>
    <tr>
      <td align="center" valign="top">
        <a href="https://x.com/GitHub_Daily/status/1930610556731318781"><img src="https://pbs.twimg.com/profile_images/1660876795347111937/EIo6fIr4_400x400.jpg" width="100px;" alt="Github_Daily"/><br /><sub><b>Github_Daily</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://x.com/aigclink/status/1930897858963853746"><img src="https://pbs.twimg.com/profile_images/1729450995850027008/gllXr6bh_400x400.jpg" width="100px;" alt="AIGCLINK"/><br /><sub><b>AIGCLINK</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://www.ruanyifeng.com/blog/2025/06/weekly-issue-353.html"><img src="https://avatars.githubusercontent.com/u/905434" width="100px;" alt="阮一峰的网络日志"/><br /><sub><b>阮一峰的网络日志</b></sub></a>
      </td>
      <td align="center" valign="top">
        <a href="https://hellogithub.com/periodical/volume/111"><img src="https://github.com/user-attachments/assets/eff6b6dd-0323-40c4-9db6-444a51bbc80a" width="100px;" alt="HelloGitHub"/><br /><sub><b>《HelloGitHub》第 111 期</b></sub></a>
      </td>
    </tr>
  </tbody>
</table>
