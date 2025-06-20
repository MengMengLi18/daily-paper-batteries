# About
This tool will daily crawl https://arxiv.org and use LLMs to summarize them.

Try in: https://dw-dengwei.github.io/daily-arXiv-ai-enhanced/

# Features
- Using the free features of GitHub Action and GitHub Pages, **no server is required**
- Crawling data starts at dawn every day and using DeepSeek to summarize. This period is during the off-peak discount period of DeepSeek, and it only costs about 0.2 CNY per day. 
- Provides a GitHub Pages front-end interface, uses LocalStorage to store **personalized preference** information (such as keywords and authors of interest), and highlights papers that matches the preferences.
- GitHub Pages takes into account the display effects of both the computer and mobile devices, ensuring that papers can be easily reviewed on mobile devices

# Screenshots
- Main page. Highlight interested keywords and authors.

<img src="images/index.png" alt="main-page" width="800">

- Setting page. Setup keywords and authors and store them in your browser.

<img src="images/setting.png" alt="setting-page" width="600">

- Detail page. Show details of a paper you clicked.

<img src="images/details.png" alt="detail-page" width="500">

- Date select. Enable select a single date or a date range for filtering papers (**Notice: large range date will show lots of papers, which may lead your browser getting stuck.**).

<img src="images/single-date.png" alt="single-date" width="300">
<img src="images/range-date.png" alt="range-date" width="300">

- Statistics page (*in developing*). Help you to anylize papers. Extract keywords for papers in the day(s) you select. In addition, if you select a range of dates, the keyword trends will be illustrated. (Fortunately, select a large range of papers **will not** stuck your browser because this page will not show all papers. It may takes a few seconds to process the keywords.)

<img src="images/keyword.png" alt="single-date" width="600">
<img src="images/trends.png" alt="range-date" width="600">


# How to use
This repo will daily crawl arXiv papers about **cs.CV, cs.GR and cs.CL**, and use **DeepSeek** to summarize the papers in **Chinese**.
If you wish to crawl other arXiv categories, use other LLMs or other languages, please follow the bellow instructions.
Otherwise, you can directly use this repo in https://dw-dengwei.github.io/daily-arXiv-ai-enhanced/ . Please star it if you like :)

**Instructions:**
1. Fork this repo to your own account
2. Go to: your-own-repo -> Settings -> Secrets and variables -> Actions
3. Go to Secrets. Secrets are encrypted and are used for sensitive data
4. Create two repository secrets named `OPENAI_API_KEY` and `OPENAI_BASE_URL`, and input corresponding values.
5. Go to Variables. Variables are shown as plain text and are used for non-sensitive data
6. Create the following repository variables:
   1. `CATEGORIES`: separate the categories with ",", such as "cs.CL, cs.CV"
   2. `LANGUAGE`: such as "Chinese" or "English"
   3. `MODEL_NAME`: such as "deepseek-chat"
   4. `EMAIL`: your email for push to github
   5. `NAME`: your name for push to github
7. Go to your-own-repo -> Actions -> arXiv-daily-ai-enhanced
8. You can manually click **Run workflow** to test if it works well (it may takes about one hour). By default, this action will automatically run every day. You can modify it in `.github/workflows/run.yml`

# To-do list
- [x] Replace markdown with GitHub pages front-end.
- [ ] Bugfix: In the statistics page, the number of papers for a keyword is not correct.
- [ ] Update instructions for fork users about how to use github pages.

# Star history

[![Star History Chart](https://api.star-history.com/svg?repos=dw-dengwei/daily-arXiv-ai-enhanced&type=Date)](https://www.star-history.com/#dw-dengwei/daily-arXiv-ai-enhanced&Date)
