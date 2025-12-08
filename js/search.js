// 搜索模块
const SearchModule = {
  currentEngine: 'google',
  currentType: 'web',
  
  engines: {
    google: {
      icon: 'https://www.google.com/favicon.ico',
      web: 'https://www.google.com/search?q=',
      image: 'https://www.google.com/search?tbm=isch&q=',
      news: 'https://www.google.com/search?tbm=nws&q=',
      video: 'https://www.google.com/search?tbm=vid&q=',
      map: 'https://www.google.com/maps/search/'
    },
    baidu: {
      icon: 'https://www.baidu.com/favicon.ico',
      web: 'https://www.baidu.com/s?wd=',
      image: 'https://image.baidu.com/search/index?tn=baiduimage&word=',
      news: 'https://www.baidu.com/s?tn=news&word=',
      video: 'https://www.baidu.com/sf/vsearch?wd=',
      map: 'https://map.baidu.com/search/'
    },
    bing: {
      icon: 'https://www.bing.com/favicon.ico',
      web: 'https://www.bing.com/search?q=',
      image: 'https://www.bing.com/images/search?q=',
      news: 'https://www.bing.com/news/search?q=',
      video: 'https://www.bing.com/videos/search?q=',
      map: 'https://www.bing.com/maps?q='
    },
    duckduckgo: {
      icon: 'https://duckduckgo.com/favicon.ico',
      web: 'https://duckduckgo.com/?q=',
      image: 'https://duckduckgo.com/?iax=images&ia=images&q=',
      news: 'https://duckduckgo.com/?iar=news&ia=news&q=',
      video: 'https://duckduckgo.com/?iax=videos&ia=videos&q=',
      map: 'https://duckduckgo.com/?iaxm=maps&q='
    }
  },

  init() {
    this.loadEngine();
    this.bindEvents();
  },

  async loadEngine() {
    this.currentEngine = await Storage.get('searchEngine', 'google');
    this.updateEngineIcon();
  },

  updateEngineIcon() {
    const icon = document.getElementById('current-engine-icon');
    if (icon && this.engines[this.currentEngine]) {
      icon.src = this.engines[this.currentEngine].icon;
    }
  },

  bindEvents() {
    const searchInput = document.getElementById('search-input');
    const engineSelector = document.getElementById('engine-selector');
    const engineMenu = document.getElementById('engine-menu');

    // 搜索框回车
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.search();
      }
    });

    // 搜索引擎选择器
    engineSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      engineMenu.classList.toggle('show');
    });

    // 选择搜索引擎
    document.querySelectorAll('.engine-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const engine = option.dataset.engine;
        this.setEngine(engine);
        engineMenu.classList.remove('show');
      });
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
      engineMenu.classList.remove('show');
    });

    // 搜索分类标签
    document.querySelectorAll('.search-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentType = tab.dataset.type;
      });
    });

    // 自动聚焦搜索框
    searchInput.focus();
  },

  async setEngine(engine) {
    this.currentEngine = engine;
    this.updateEngineIcon();
    await Storage.set('searchEngine', engine);
  },

  search() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const engine = this.engines[this.currentEngine];
    const url = engine[this.currentType] + encodeURIComponent(query);
    window.location.href = url;
  }
};
