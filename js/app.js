let currentDate = '';
let availableDates = [];
let currentView = 'grid'; // 'grid' 或 'list'
let currentCategory = 'all';
let paperData = {};
let flatpickrInstance = null;
let isRangeMode = false;
const defaultCategoryPreference = ['cs.CV', 'cs.CL'];
let activeKeywords = []; // 存储激活的关键词
let userKeywords = []; // 存储用户的关键词
let activeAuthors = []; // 存储激活的作者
let userAuthors = []; // 存储用户的作者

function loadCategoryPreference() {
  // 这里的值是在构建时从环境变量注入的
  const categoriesFromEnv = "cs.CV";
  if (categoriesFromEnv) {
    const preferenceFromEnv = categoriesFromEnv.split(',').map(category => category.trim());
    return preferenceFromEnv;
  }
  return defaultCategoryPreference;
}

// 加载用户的关键词设置
function loadUserKeywords() {
  const savedKeywords = localStorage.getItem('preferredKeywords');
  if (savedKeywords) {
    try {
      userKeywords = JSON.parse(savedKeywords);
    } catch (error) {
      console.error('解析关键词失败:', error);
      userKeywords = [];
    }
  } else {
    userKeywords = [];
  }
  
  renderKeywordTags();
}

// 加载用户的作者设置
function loadUserAuthors() {
  const savedAuthors = localStorage.getItem('preferredAuthors');
  if (savedAuthors) {
    try {
      userAuthors = JSON.parse(savedAuthors);
    } catch (error) {
      console.error('解析作者失败:', error);
      userAuthors = [];
    }
  } else {
    userAuthors = [];
  }
  
  renderAuthorTags();
}

// 渲染关键词标签
function renderKeywordTags() {
  const keywordTagsElement = document.getElementById('keywordTags');
  const keywordContainer = document.querySelector('.keyword-label-container');
  
  if (!userKeywords || userKeywords.length === 0) {
    keywordContainer.style.display = 'none';
    return;
  }
  
  keywordContainer.style.display = 'flex';
  keywordTagsElement.innerHTML = '';
  
  // 添加关键词标签
  userKeywords.forEach(keyword => {
    const tagElement = document.createElement('span');
    tagElement.className = `category-button ${activeKeywords.includes(keyword) ? 'active' : ''}`;
    tagElement.dataset.keyword = keyword;
    tagElement.textContent = keyword;
    
    tagElement.addEventListener('click', () => {
      toggleKeywordFilter(keyword);
    });
    
    keywordTagsElement.appendChild(tagElement);
    
    // 添加出现动画后移除动画类
    if (!activeKeywords.includes(keyword)) {
      tagElement.classList.add('tag-appear');
      setTimeout(() => {
        tagElement.classList.remove('tag-appear');
      }, 300);
    }
  });
  
  // 添加"清除全部"按钮和逻辑提示
  if (activeKeywords.length > 0) {
    const logicIndicator = document.createElement('span');
    logicIndicator.className = 'logic-indicator';
    logicIndicator.textContent = 'OR';
    keywordTagsElement.appendChild(logicIndicator);
    
    const clearButton = document.createElement('span');
    clearButton.className = 'category-button clear-button';
    clearButton.textContent = 'Clear';
    clearButton.addEventListener('click', clearAllKeywords);
    keywordTagsElement.appendChild(clearButton);
  }
}

// 切换关键词过滤
function toggleKeywordFilter(keyword) {
  const index = activeKeywords.indexOf(keyword);
  
  if (index === -1) {
    // 激活该关键词
    activeKeywords.push(keyword);
  } else {
    // 取消激活该关键词
    activeKeywords.splice(index, 1);
  }
  
  // 更新关键词标签UI
  const keywordTags = document.querySelectorAll('[data-keyword]');
  keywordTags.forEach(tag => {
    if (tag.dataset.keyword === keyword) {
      // 先移除上一次可能的高亮动画
      tag.classList.remove('tag-highlight');
      
      // 添加/移除激活状态
      tag.classList.toggle('active', activeKeywords.includes(keyword));
      
      // 添加高亮动画
      setTimeout(() => {
        tag.classList.add('tag-highlight');
      }, 10);
      
      // 移除高亮动画
      setTimeout(() => {
        tag.classList.remove('tag-highlight');
      }, 1000);
    }
  });
  
  // 重新渲染论文列表
  renderPapers();
}

// 渲染作者标签
function renderAuthorTags() {
  const authorTagsElement = document.getElementById('authorTags');
  const authorContainer = document.querySelector('.author-label-container');
  
  if (!userAuthors || userAuthors.length === 0) {
    authorContainer.style.display = 'none';
    return;
  }
  
  authorContainer.style.display = 'flex';
  authorTagsElement.innerHTML = '';
  
  // 添加作者标签
  userAuthors.forEach(author => {
    const tagElement = document.createElement('span');
    tagElement.className = `category-button ${activeAuthors.includes(author) ? 'active' : ''}`;
    tagElement.dataset.author = author;
    tagElement.textContent = author;
    
    tagElement.addEventListener('click', () => {
      toggleAuthorFilter(author);
    });
    
    authorTagsElement.appendChild(tagElement);
    
    // 添加出现动画后移除动画类
    if (!activeAuthors.includes(author)) {
      tagElement.classList.add('tag-appear');
      setTimeout(() => {
        tagElement.classList.remove('tag-appear');
      }, 300);
    }
  });
  
  // 添加"清除全部"按钮和逻辑提示
  if (activeAuthors.length > 0) {
    const logicIndicator = document.createElement('span');
    logicIndicator.className = 'logic-indicator';
    logicIndicator.textContent = 'OR';
    authorTagsElement.appendChild(logicIndicator);
    
    const clearButton = document.createElement('span');
    clearButton.className = 'category-button clear-button';
    clearButton.textContent = 'Clear';
    clearButton.addEventListener('click', clearAllAuthors);
    authorTagsElement.appendChild(clearButton);
  }
}

// 切换作者过滤
function toggleAuthorFilter(author) {
  const index = activeAuthors.indexOf(author);
  
  if (index === -1) {
    // 激活该作者
    activeAuthors.push(author);
  } else {
    // 取消激活该作者
    activeAuthors.splice(index, 1);
  }
  
  // 更新作者标签UI
  const authorTags = document.querySelectorAll('[data-author]');
  authorTags.forEach(tag => {
    if (tag.dataset.author === author) {
      // 先移除上一次可能的高亮动画
      tag.classList.remove('tag-highlight');
      
      // 添加/移除激活状态
      tag.classList.toggle('active', activeAuthors.includes(author));
      
      // 添加高亮动画
      setTimeout(() => {
        tag.classList.add('tag-highlight');
      }, 10);
      
      // 移除高亮动画
      setTimeout(() => {
        tag.classList.remove('tag-highlight');
      }, 1000);
    }
  });
  
  // 重新渲染论文列表
  renderPapers();
}

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  
  fetchGitHubStats();
  
  // 加载用户关键词
  loadUserKeywords();
  
  // 加载用户作者
  loadUserAuthors();
  
  fetchAvailableDates().then(() => {
    if (availableDates.length > 0) {
      loadPapersByDate(availableDates[0]);
    }
  });
});

async function fetchGitHubStats() {
  try {
    const response = await fetch('https://api.github.com/repos/dw-dengwei/daily-arXiv-ai-enhanced');
    const data = await response.json();
    const starCount = data.stargazers_count;
    const forkCount = data.forks_count;
    
    document.getElementById('starCount').textContent = starCount;
    document.getElementById('forkCount').textContent = forkCount;
  } catch (error) {
    console.error('获取GitHub统计数据失败:', error);
    document.getElementById('starCount').textContent = '?';
    document.getElementById('forkCount').textContent = '?';
  }
}

function initEventListeners() {
  document.getElementById('calendarButton').addEventListener('click', toggleDatePicker);
  
  // document.getElementById('toggleView').addEventListener('click', toggleView);
  
  document.getElementById('closeModal').addEventListener('click', closeModal);
  
  document.querySelector('.paper-modal').addEventListener('click', (event) => {
    if (event.target === document.querySelector('.paper-modal')) {
      closeModal();
    }
  });
  
  document.querySelector('.date-picker-modal').addEventListener('click', (event) => {
    if (event.target === document.querySelector('.date-picker-modal')) {
      toggleDatePicker();
    }
  });
  
  document.getElementById('dateRangeMode').addEventListener('change', toggleRangeMode);
  
  // 添加鼠标滚轮横向滚动支持
  const categoryScroll = document.querySelector('.category-scroll');
  const keywordScroll = document.querySelector('.keyword-scroll');
  const authorScroll = document.querySelector('.author-scroll');
  
  // 为类别滚动添加鼠标滚轮事件
  if (categoryScroll) {
    categoryScroll.addEventListener('wheel', function(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    });
  }
  
  // 为关键词滚动添加鼠标滚轮事件
  if (keywordScroll) {
    keywordScroll.addEventListener('wheel', function(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    });
  }
  
  // 为作者滚动添加鼠标滚轮事件
  if (authorScroll) {
    authorScroll.addEventListener('wheel', function(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    });
  }
  
  // 字体大小滑块事件监听
  // const fontSizeSlider = document.getElementById('fontSize');
  // if (fontSizeSlider) {
  //   fontSizeSlider.addEventListener('input', updateFontSizeValue);
  // }
  
  // 保存设置按钮事件监听
  // const saveSettingsButton = document.getElementById('saveSettings');
  // if (saveSettingsButton) {
  //   saveSettingsButton.addEventListener('click', saveSettings);
  // }
  
  // 重置设置按钮事件监听
  // const resetSettingsButton = document.getElementById('resetSettings');
  // if (resetSettingsButton) {
  //   resetSettingsButton.addEventListener('click', resetSettings);
  // }
}

async function fetchAvailableDates() {
  try {
    const response = await fetch('assets/file-list.txt');
    if (!response.ok) {
      console.error('Error fetching file list:', response.status);
      return [];
    }
    const text = await response.text();
    const files = text.trim().split('\n');

    const dateRegex = /(\d{4}-\d{2}-\d{2})_AI_enhanced_Chinese\.jsonl/;
    const dates = [];
    files.forEach(file => {
      const match = file.match(dateRegex);
      if (match && match[1]) {
        dates.push(match[1]);
      }
    });
    availableDates = [...new Set(dates)];
    availableDates.sort((a, b) => new Date(b) - new Date(a));

    initDatePicker(); // Assuming this function uses availableDates

    return availableDates;
  } catch (error) {
    console.error('获取可用日期失败:', error);
  }
}

function initDatePicker() {
  const datepickerInput = document.getElementById('datepicker');
  
  if (flatpickrInstance) {
    flatpickrInstance.destroy();
  }
  
  // 创建可用日期的映射，用于禁用无效日期
  const enabledDatesMap = {};
  availableDates.forEach(date => {
    enabledDatesMap[date] = true;
  });
  
  // 配置 Flatpickr
  flatpickrInstance = flatpickr(datepickerInput, {
    inline: true,
    dateFormat: "Y-m-d",
    defaultDate: availableDates[0],
    enable: [
      function(date) {
        // 只启用有效日期
        const dateStr = date.getFullYear() + "-" + 
                        String(date.getMonth() + 1).padStart(2, '0') + "-" + 
                        String(date.getDate()).padStart(2, '0');
        return !!enabledDatesMap[dateStr];
      }
    ],
    onChange: function(selectedDates, dateStr) {
      if (isRangeMode && selectedDates.length === 2) {
        // 处理日期范围选择
        const startDate = formatDateForAPI(selectedDates[0]);
        const endDate = formatDateForAPI(selectedDates[1]);
        loadPapersByDateRange(startDate, endDate);
        toggleDatePicker();
      } else if (!isRangeMode && selectedDates.length === 1) {
        // 处理单个日期选择
        const selectedDate = formatDateForAPI(selectedDates[0]);
        if (availableDates.includes(selectedDate)) {
          loadPapersByDate(selectedDate);
          toggleDatePicker();
        }
      }
    }
  });
  
  // 隐藏日期输入框
  const inputElement = document.querySelector('.flatpickr-input');
  if (inputElement) {
    inputElement.style.display = 'none';
  }
}

function formatDateForAPI(date) {
  return date.getFullYear() + "-" + 
         String(date.getMonth() + 1).padStart(2, '0') + "-" + 
         String(date.getDate()).padStart(2, '0');
}

function toggleRangeMode() {
  isRangeMode = document.getElementById('dateRangeMode').checked;
  
  if (flatpickrInstance) {
    flatpickrInstance.set('mode', isRangeMode ? 'range' : 'single');
  }
}

async function loadPapersByDate(date) {
  currentDate = date;
  document.getElementById('currentDate').textContent = formatDate(date);
  
  // 更新日期选择器中的选中日期
  if (flatpickrInstance) {
    flatpickrInstance.setDate(date, false);
  }
  
  // 重置激活的关键词
  activeKeywords = [];
  renderKeywordTags();
  
  // 重置激活的作者
  activeAuthors = [];
  renderAuthorTags();
  
  const container = document.getElementById('paperContainer');
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading paper...</p>
    </div>
  `;
  
  try {
    const updatedPreference = loadCategoryPreference();
    if (updatedPreference && updatedPreference.length > 0) {
      defaultCategoryPreference.length = 0;
      updatedPreference.forEach(category => defaultCategoryPreference.push(category));
    }
    
    const response = await fetch(`data/${date}_AI_enhanced_Chinese.jsonl`);
    const text = await response.text();
    
    paperData = parseJsonlData(text, date);
    
    const categories = getAllCategories(paperData);
    
    renderCategoryFilter(categories);
    
    renderPapers();
  } catch (error) {
    console.error('加载论文数据失败:', error);
    container.innerHTML = `
      <div class="loading-container">
        <p>Loading data fails. Please retry.</p>
        <p>Error messages: ${error.message}</p>
      </div>
    `;
  }
}

function parseJsonlData(jsonlText, date) {
  const result = {};
  
  const lines = jsonlText.trim().split('\n');
  
  lines.forEach(line => {
    try {
      const paper = JSON.parse(line);
      
      if (!paper.categories) {
        return;
      }
      
      let allCategories = Array.isArray(paper.categories) ? paper.categories : [paper.categories];
      
      const primaryCategory = allCategories[0];
      
      if (!result[primaryCategory]) {
        result[primaryCategory] = [];
      }
      
      const summary = paper.AI && paper.AI.tldr ? paper.AI.tldr : paper.summary;
      
      result[primaryCategory].push({
        title: paper.title,
        url: paper.abs || paper.pdf || `https://arxiv.org/abs/${paper.id}`,
        authors: Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors,
        category: allCategories,
        summary: summary,
        details: paper.summary || '',
        date: date,
        id: paper.id,
        motivation: paper.AI && paper.AI.motivation ? paper.AI.motivation : '',
        method: paper.AI && paper.AI.method ? paper.AI.method : '',
        result: paper.AI && paper.AI.result ? paper.AI.result : '',
        conclusion: paper.AI && paper.AI.conclusion ? paper.AI.conclusion : ''
      });
    } catch (error) {
      console.error('解析JSON行失败:', error, line);
    }
  });
  
  return result;
}

// 获取所有类别并按偏好排序
function getAllCategories(data) {
  const categories = Object.keys(data);
  const catePaperCount = {};
  
  categories.forEach(category => {
    catePaperCount[category] = data[category] ? data[category].length : 0;
  });
  
  return {
    sortedCategories: categories.sort((a, b) => {
      const indexA = defaultCategoryPreference.indexOf(a);
      const indexB = defaultCategoryPreference.indexOf(b);
      
      const valueA = indexA === -1 ? defaultCategoryPreference.length : indexA;
      const valueB = indexB === -1 ? defaultCategoryPreference.length : indexB;
      
      return valueA - valueB;
    }),
    categoryCounts: catePaperCount
  };
}

function renderCategoryFilter(categories) {
  const container = document.querySelector('.category-scroll');
  const { sortedCategories, categoryCounts } = categories;
  
  let totalPapers = 0;
  Object.values(categoryCounts).forEach(count => {
    totalPapers += count;
  });
  
  container.innerHTML = `
    <button class="category-button ${currentCategory === 'all' ? 'active' : ''}" data-category="all">All<span class="category-count">${totalPapers}</span></button>
  `;
  
  sortedCategories.forEach(category => {
    const count = categoryCounts[category];
    const button = document.createElement('button');
    button.className = `category-button ${category === currentCategory ? 'active' : ''}`;
    button.innerHTML = `${category}<span class="category-count">${count}</span>`;
    button.dataset.category = category;
    button.addEventListener('click', () => {
      filterByCategory(category);
    });
    
    container.appendChild(button);
  });
  
  document.querySelector('.category-button[data-category="all"]').addEventListener('click', () => {
    filterByCategory('all');
  });
}

function filterByCategory(category) {
  currentCategory = category;
  
  document.querySelectorAll('.category-button').forEach(button => {
    button.classList.toggle('active', button.dataset.category === category);
  });
  
  // 保持当前激活的关键词
  renderKeywordTags();
  
  // 保持当前激活的作者
  renderAuthorTags();
  
  renderPapers();
}

// 帮助函数：高亮文本中的匹配内容
function highlightMatches(text, terms, className = 'highlight-match') {
  if (!terms || terms.length === 0 || !text) {
    return text;
  }
  
  let result = text;
  
  // 按照长度排序关键词，从长到短，避免短词先替换导致长词匹配失败
  const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
  
  // 为每个词创建一个正则表达式，使用 'gi' 标志进行全局、不区分大小写的匹配
  sortedTerms.forEach(term => {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(regex, `<span class="${className}">$1</span>`);
  });
  
  return result;
}

function renderPapers() {
  const container = document.getElementById('paperContainer');
  container.innerHTML = '';
  container.className = `paper-container ${currentView === 'list' ? 'list-view' : ''}`;
  
  let papers = [];
  if (currentCategory === 'all') {
    const { sortedCategories } = getAllCategories(paperData);
    sortedCategories.forEach(category => {
      if (paperData[category]) {
        papers = papers.concat(paperData[category]);
      }
    });
  } else if (paperData[currentCategory]) {
    papers = paperData[currentCategory];
  }
  
  // 创建匹配论文的集合
  let filteredPapers = [...papers];
  
  // 关键词过滤
  if (activeKeywords.length > 0) {
    filteredPapers = filteredPapers.filter(paper => {
      // 在标题、摘要和作者中搜索关键词
      const searchText = `${paper.title} ${paper.summary} ${paper.authors} ${paper.details || ''}`.toLowerCase();
      
      // 检查是否包含任一激活的关键词（或逻辑）
      return activeKeywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    });
  }
  
  // 作者过滤
  if (activeAuthors.length > 0) {
    filteredPapers = filteredPapers.filter(paper => {
      // 仅在作者中搜索作者名
      const authorsText = paper.authors.toLowerCase();
      
      // 检查是否包含任一激活的作者（或逻辑）
      return activeAuthors.some(author => 
        authorsText.includes(author.toLowerCase())
      );
    });
  }
  
  if (filteredPapers.length === 0) {
    container.innerHTML = `
      <div class="loading-container">
        <p>No paper found.</p>
      </div>
    `;
    return;
  }
  
  filteredPapers.forEach((paper, index) => {
    const paperCard = document.createElement('div');
    paperCard.className = 'paper-card';
    paperCard.dataset.id = paper.id || paper.url;
    
    const categoryTags = paper.allCategories ? 
      paper.allCategories.map(cat => `<span class="category-tag">${cat}</span>`).join('') : 
      `<span class="category-tag">${paper.category}</span>`;
    
    // 高亮标题和摘要中的关键词
    const highlightedTitle = activeKeywords.length > 0 
      ? highlightMatches(paper.title, activeKeywords, 'keyword-highlight') 
      : paper.title;
    
    const highlightedSummary = activeKeywords.length > 0 
      ? highlightMatches(paper.summary, activeKeywords, 'keyword-highlight') 
      : paper.summary;
    
    // 高亮作者中的匹配
    const highlightedAuthors = activeAuthors.length > 0 
      ? highlightMatches(paper.authors, activeAuthors, 'author-highlight') 
      : paper.authors;
    
    paperCard.innerHTML = `
      <div class="paper-card-index">${index + 1}</div>
      <div class="paper-card-header">
        <h3 class="paper-card-title">${highlightedTitle}</h3>
        <p class="paper-card-authors">${highlightedAuthors}</p>
        <div class="paper-card-categories">
          ${categoryTags}
        </div>
      </div>
      <div class="paper-card-body">
        <p class="paper-card-summary">${highlightedSummary}</p>
        <div class="paper-card-footer">
          <span class="paper-card-date">${formatDate(paper.date)}</span>
          <span class="paper-card-link">Details</span>
        </div>
      </div>
    `;
    
    paperCard.addEventListener('click', () => {
      showPaperDetails(paper);
    });
    
    container.appendChild(paperCard);
  });
}

function showPaperDetails(paper) {
  const modal = document.getElementById('paperModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const paperLink = document.getElementById('paperLink');
  
  // 高亮标题中的关键词
  const highlightedTitle = activeKeywords.length > 0 
    ? highlightMatches(paper.title, activeKeywords, 'keyword-highlight') 
    : paper.title;
  
  modalTitle.innerHTML = highlightedTitle;
  
  const abstractText = paper.details || '';
  
  const categoryDisplay = paper.allCategories ? 
    paper.allCategories.join(', ') : 
    paper.category;
  
  // 高亮作者中的匹配
  const highlightedAuthors = activeAuthors.length > 0 
    ? highlightMatches(paper.authors, activeAuthors, 'author-highlight') 
    : paper.authors;
  
  // 高亮摘要和详情中的关键词
  const highlightedSummary = activeKeywords.length > 0 
    ? highlightMatches(paper.summary, activeKeywords, 'keyword-highlight') 
    : paper.summary;
  
  const highlightedAbstract = activeKeywords.length > 0 && abstractText 
    ? highlightMatches(abstractText, activeKeywords, 'keyword-highlight') 
    : abstractText;
  
  // 高亮其他部分（如果存在）
  const highlightedMotivation = paper.motivation && activeKeywords.length > 0 
    ? highlightMatches(paper.motivation, activeKeywords, 'keyword-highlight') 
    : paper.motivation;
  
  const highlightedMethod = paper.method && activeKeywords.length > 0 
    ? highlightMatches(paper.method, activeKeywords, 'keyword-highlight') 
    : paper.method;
  
  const highlightedResult = paper.result && activeKeywords.length > 0 
    ? highlightMatches(paper.result, activeKeywords, 'keyword-highlight') 
    : paper.result;
  
  const highlightedConclusion = paper.conclusion && activeKeywords.length > 0 
    ? highlightMatches(paper.conclusion, activeKeywords, 'keyword-highlight') 
    : paper.conclusion;
  
  // 判断是否需要显示高亮说明
  const showHighlightLegend = activeKeywords.length > 0 || activeAuthors.length > 0;
  
  // 创建高亮说明HTML
  let highlightLegendHTML = '';
  if (showHighlightLegend) {
    highlightLegendHTML = `
      <div class="highlight-info">
        ${activeKeywords.length > 0 ? `
          <span>
            <div class="sample keyword-sample"></div>
            Keywords: ${activeKeywords.join(', ')}
          </span>
        ` : ''}
        ${activeAuthors.length > 0 ? `
          <span>
            <div class="sample author-sample"></div>
            Authors: ${activeAuthors.join(', ')}
          </span>
        ` : ''}
      </div>
    `;
  }
  
  modalBody.innerHTML = `
    <div class="paper-details">
      <p><strong>Authors: </strong>${highlightedAuthors}</p>
      <p><strong>Category: </strong>${categoryDisplay}</p>
      <p><strong>Date: </strong>${formatDate(paper.date)}</p>
      
      ${showHighlightLegend ? highlightLegendHTML : ''}
      
      <h3>TL;DR</h3>
      <p>${highlightedSummary}</p>
      
      <div class="paper-sections">
        ${paper.motivation ? `<div class="paper-section"><h4>Motivation</h4><p>${highlightedMotivation}</p></div>` : ''}
        ${paper.method ? `<div class="paper-section"><h4>Method</h4><p>${highlightedMethod}</p></div>` : ''}
        ${paper.result ? `<div class="paper-section"><h4>Result</h4><p>${highlightedResult}</p></div>` : ''}
        ${paper.conclusion ? `<div class="paper-section"><h4>Conclusion</h4><p>${highlightedConclusion}</p></div>` : ''}
      </div>
      
      ${highlightedAbstract ? `<h3>Abstract</h3><p class="original-abstract">${highlightedAbstract}</p>` : ''}
    </div>
  `;
  
  paperLink.href = paper.url || `https://arxiv.org/abs/${paper.id}` || "https://arxiv.org/";
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('paperModal').classList.remove('active');
  document.body.style.overflow = '';
}

function toggleDatePicker() {
  const datePicker = document.getElementById('datePickerModal');
  datePicker.classList.toggle('active');
  
  if (datePicker.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
    
    // 重新初始化日期选择器以确保它反映最新的可用日期
    if (flatpickrInstance) {
      flatpickrInstance.setDate(currentDate, false);
    }
  } else {
    document.body.style.overflow = '';
  }
}

function toggleView() {
  currentView = currentView === 'grid' ? 'list' : 'grid';
  document.getElementById('paperContainer').classList.toggle('list-view', currentView === 'list');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}

async function loadPapersByDateRange(startDate, endDate) {
  // 获取日期范围内的所有有效日期
  const validDatesInRange = availableDates.filter(date => {
    return date >= startDate && date <= endDate;
  });
  
  if (validDatesInRange.length === 0) {
    alert('No available papers in the selected date range.');
    return;
  }
  
  currentDate = `${startDate} to ${endDate}`;
  document.getElementById('currentDate').textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  
  // 重置激活的关键词
  activeKeywords = [];
  renderKeywordTags();
  
  // 重置激活的作者
  activeAuthors = [];
  renderAuthorTags();
  
  const container = document.getElementById('paperContainer');
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading papers from ${formatDate(startDate)} to ${formatDate(endDate)}...</p>
    </div>
  `;
  
  try {
    // 加载所有日期的论文数据
    const allPaperData = {};
    
    for (const date of validDatesInRange) {
      const response = await fetch(`data/${date}_AI_enhanced_Chinese.jsonl`);
      const text = await response.text();
      const dataPapers = parseJsonlData(text, date);
      
      // 合并数据
      Object.keys(dataPapers).forEach(category => {
        if (!allPaperData[category]) {
          allPaperData[category] = [];
        }
        allPaperData[category] = allPaperData[category].concat(dataPapers[category]);
      });
    }
    
    paperData = allPaperData;
    
    const categories = getAllCategories(paperData);
    
    renderCategoryFilter(categories);
    
    renderPapers();
  } catch (error) {
    console.error('加载论文数据失败:', error);
    container.innerHTML = `
      <div class="loading-container">
        <p>Loading data fails. Please retry.</p>
        <p>Error messages: ${error.message}</p>
      </div>
    `;
  }
}

// 清除所有激活的关键词
function clearAllKeywords() {
  activeKeywords = [];
  renderKeywordTags();
  renderPapers();
}

// 清除所有作者过滤
function clearAllAuthors() {
  activeAuthors = [];
  renderAuthorTags();
  renderPapers();
}