// 图标库模块
const IconsModule = {
  API_BASE: 'https://ultima.uioner.com/api',
  currentPage: 1,
  pageSize: 20,
  currentCategory: '',
  currentKeyword: '',
  isLoading: false,
  hasMore: true,

  init() {
    this.bindEvents();
    this.loadIcons(true);
  },

  bindEvents() {
    // 分类切换
    document.querySelectorAll('.icon-categories-left .icon-category').forEach(cat => {
      cat.addEventListener('click', () => {
        document.querySelectorAll('.icon-categories-left .icon-category').forEach(c => c.classList.remove('active'));
        cat.classList.add('active');
        this.currentCategory = cat.dataset.category || '';
        this.currentPage = 1;
        this.hasMore = true;
        this.loadIcons(true);
      });
    });

    // 搜索
    const searchInput = document.getElementById('icon-search-input');
    let searchTimer = null;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        this.currentKeyword = e.target.value.trim();
        this.currentPage = 1;
        this.hasMore = true;
        this.loadIcons(true);
      }, 300);
    });

    // 滚动自动加载更多
    const library = document.getElementById('icon-library');
    library?.addEventListener('scroll', () => {
      if (this.isLoading || !this.hasMore) return;
      // 滚动到60%时触发加载
      const scrollPercent = (library.scrollTop + library.clientHeight) / library.scrollHeight;
      if (scrollPercent >= 0.6) {
        this.currentPage++;
        this.loadIcons(false);
      }
    });
  },

  async loadIcons(reset = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    const library = document.getElementById('icon-library');
    const loadMoreBtn = document.getElementById('icon-load-more');
    
    if (reset && library) {
      library.innerHTML = '<div class="icon-loading"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
    }

    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        page_size: this.pageSize
      });
      if (this.currentKeyword) params.append('keyword', this.currentKeyword);
      if (this.currentCategory) params.append('type', this.currentCategory);

      const response = await fetch(`${this.API_BASE}/icons?${params}`);
      const result = await response.json();

      // 适配API返回格式: { code, msg, data: { total, page, page_size, data: [...] } }
      if (result.code === 200 && result.data && result.data.data && result.data.data.length > 0) {
        this.renderIcons(result.data.data, reset);
        this.hasMore = this.currentPage * this.pageSize < result.data.total;
      } else {
        if (reset && library) {
          library.innerHTML = '<div class="icon-empty">暂无图标</div>';
        }
        this.hasMore = false;
      }
    } catch (error) {
      console.error('加载图标失败:', error);
      // 使用模拟数据
      this.renderMockIcons(reset);
    }

    this.isLoading = false;
  },

  renderIcons(icons, reset) {
    const library = document.getElementById('icon-library');
    if (!library) return;

    if (reset) library.innerHTML = '';

    if (!icons || icons.length === 0) {
      if (reset) library.innerHTML = '<div class="icon-empty">暂无图标</div>';
      return;
    }

    icons.forEach(icon => {
      const item = document.createElement('div');
      item.className = 'icon-library-item';
      // 适配API字段: src为图标地址, name为名称, url为链接, description为描述
      const iconSrc = icon.src || icon.icon || icon.logo || '';
      const desc = icon.description || '无描述';
      
      // 系统图标使用 Font Awesome
      let iconHtml;
      if (icon.systemIcon) {
        iconHtml = `<div class="system-icon"><i class="fas fa-${icon.systemIcon}"></i></div>`;
      } else {
        iconHtml = `<img src="${iconSrc}" alt="${icon.name}" onerror="this.style.display='none'">`;
      }
      
      item.innerHTML = `
        <div class="icon-header">
          <img src="${iconSrc}" alt="${icon.name}" onerror="this.style.display='none'">
          <span class="icon-name">${icon.name}</span>
        </div>
        <div class="icon-desc">${desc}</div>
        <button class="icon-add-btn">添加</button>
      `;
      // 处理图标加载失败
      const img = item.querySelector('img');
      if (img) {
        img.addEventListener('error', () => { img.style.display = 'none'; });
      }
      const addBtn = item.querySelector('.icon-add-btn');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectIcon(icon, addBtn);
      });
      library.appendChild(item);
    });
  },

  // 模拟数据（API不可用时使用）
  renderMockIcons(reset) {
    const mockData = this.getMockData();
    let filtered = mockData;
    
    if (this.currentCategory) {
      filtered = mockData.filter(i => i.type === this.currentCategory);
    }
    if (this.currentKeyword) {
      const kw = this.currentKeyword.toLowerCase();
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(kw) || 
        (i.url && i.url.toLowerCase().includes(kw))
      );
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const paged = filtered.slice(start, start + this.pageSize);
    this.hasMore = start + this.pageSize < filtered.length;
    
    this.renderIcons(paged, reset);
  },

  getMockData() {
    return [
      { name: '淘宝', url: 'https://www.taobao.com', icon: 'https://www.taobao.com/favicon.ico', type: 'shopping' },
      { name: '京东', url: 'https://www.jd.com', icon: 'https://www.jd.com/favicon.ico', type: 'shopping' },
      { name: '天猫', url: 'https://www.tmall.com', icon: 'https://www.tmall.com/favicon.ico', type: 'shopping' },
      { name: '拼多多', url: 'https://www.pinduoduo.com', icon: 'https://www.pinduoduo.com/favicon.ico', type: 'shopping' },
      { name: '微信', url: 'https://weixin.qq.com', icon: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico', type: 'social' },
      { name: '微博', url: 'https://weibo.com', icon: 'https://weibo.com/favicon.ico', type: 'social' },
      { name: 'QQ', url: 'https://im.qq.com', icon: 'https://im.qq.com/favicon.ico', type: 'social' },
      { name: '抖音', url: 'https://www.douyin.com', icon: 'https://www.douyin.com/favicon.ico', type: 'social' },
      { name: '知乎', url: 'https://www.zhihu.com', icon: 'https://www.zhihu.com/favicon.ico', type: 'social' },
      { name: '哔哩哔哩', url: 'https://www.bilibili.com', icon: 'https://www.bilibili.com/favicon.ico', type: 'social' },
      { name: '网易新闻', url: 'https://news.163.com', icon: 'https://news.163.com/favicon.ico', type: 'news' },
      { name: '腾讯新闻', url: 'https://news.qq.com', icon: 'https://news.qq.com/favicon.ico', type: 'news' },
      { name: '今日头条', url: 'https://www.toutiao.com', icon: 'https://www.toutiao.com/favicon.ico', type: 'news' },
      { name: '新浪新闻', url: 'https://news.sina.com.cn', icon: 'https://news.sina.com.cn/favicon.ico', type: 'news' },
      { name: '网易云音乐', url: 'https://music.163.com', icon: 'https://music.163.com/favicon.ico', type: 'music' },
      { name: 'QQ音乐', url: 'https://y.qq.com', icon: 'https://y.qq.com/favicon.ico', type: 'music' },
      { name: '酷狗音乐', url: 'https://www.kugou.com', icon: 'https://www.kugou.com/favicon.ico', type: 'music' },
      { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico', type: 'tech' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'https://stackoverflow.com/favicon.ico', type: 'tech' },
      { name: 'CSDN', url: 'https://www.csdn.net', icon: 'https://www.csdn.net/favicon.ico', type: 'tech' },
      { name: '掘金', url: 'https://juejin.cn', icon: 'https://juejin.cn/favicon.ico', type: 'tech' },
      { name: '百度', url: 'https://www.baidu.com', icon: 'https://www.baidu.com/favicon.ico', type: 'app' },
      { name: 'Google', url: 'https://www.google.com', icon: 'https://www.google.com/favicon.ico', type: 'app' },
      { name: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico', type: 'app' },
      { name: '豆瓣', url: 'https://www.douban.com', icon: 'https://www.douban.com/favicon.ico', type: 'life' },
      { name: '美团', url: 'https://www.meituan.com', icon: 'https://www.meituan.com/favicon.ico', type: 'life' },
      { name: '饿了么', url: 'https://www.ele.me', icon: 'https://www.ele.me/favicon.ico', type: 'life' },
      { name: '大众点评', url: 'https://www.dianping.com', icon: 'https://www.dianping.com/favicon.ico', type: 'life' },
      { name: '携程', url: 'https://www.ctrip.com', icon: 'https://www.ctrip.com/favicon.ico', type: 'life' },
      { name: '支付宝', url: 'https://www.alipay.com', icon: 'https://www.alipay.com/favicon.ico', type: 'finance' },
      { name: '招商银行', url: 'https://www.cmbchina.com', icon: 'https://www.cmbchina.com/favicon.ico', type: 'finance' },
      { name: '东方财富', url: 'https://www.eastmoney.com', icon: 'https://www.eastmoney.com/favicon.ico', type: 'finance' },
      { name: '起点中文网', url: 'https://www.qidian.com', icon: 'https://www.qidian.com/favicon.ico', type: 'read' },
      { name: '晋江文学城', url: 'https://www.jjwxc.net', icon: 'https://www.jjwxc.net/favicon.ico', type: 'read' },
      { name: '腾讯视频', url: 'https://v.qq.com', icon: 'https://v.qq.com/favicon.ico', type: 'others' },
      { name: '优酷', url: 'https://www.youku.com', icon: 'https://www.youku.com/favicon.ico', type: 'others' },
      { name: '爱奇艺', url: 'https://www.iqiyi.com', icon: 'https://www.iqiyi.com/favicon.ico', type: 'others' },
      { name: '虎牙直播', url: 'https://www.huya.com', icon: 'https://www.huya.com/favicon.ico', type: 'games' },
      { name: '斗鱼', url: 'https://www.douyu.com', icon: 'https://www.douyu.com/favicon.ico', type: 'games' },
      { name: '学堂在线', url: 'https://www.xuetangx.com', icon: 'https://www.xuetangx.com/favicon.ico', type: 'education' },
      { name: '中国大学MOOC', url: 'https://www.icourse163.org', icon: 'https://www.icourse163.org/favicon.ico', type: 'education' },
      { name: 'Unsplash', url: 'https://unsplash.com', icon: 'https://unsplash.com/favicon.ico', type: 'photos' },
      { name: '花瓣网', url: 'https://huaban.com', icon: 'https://huaban.com/favicon.ico', type: 'photos' },
      { name: '虎扑', url: 'https://www.hupu.com', icon: 'https://www.hupu.com/favicon.ico', type: 'sports' },
      { name: '懂球帝', url: 'https://www.dongqiudi.com', icon: 'https://www.dongqiudi.com/favicon.ico', type: 'sports' },
      // 系统功能 - infinity:// 协议
      { name: '书签', url: 'infinity://bookmarks', systemIcon: 'bookmark', type: 'system', description: '书签管理' },
      { name: '历史记录', url: 'infinity://history', systemIcon: 'history', type: 'system', description: '浏览历史记录' },
      { name: '待办事项', url: 'infinity://todos', systemIcon: 'check-square', type: 'system', description: '待办事项列表' },
      // Chrome 系统功能
      { name: '下载', url: 'chrome://downloads', systemIcon: 'download', type: 'system', description: '下载管理' },
      { name: '扩展程序', url: 'chrome://extensions', systemIcon: 'puzzle-piece', type: 'system', description: '扩展程序管理' },
      { name: '设置', url: 'chrome://settings', systemIcon: 'cog', type: 'system', description: '浏览器设置' },
    ];
  },

  async selectIcon(icon, btn) {
    // 直接添加到桌面快捷方式
    if (typeof ShortcutsModule === 'undefined') return;

    const iconSrc = icon.src || icon.icon || icon.logo || '';
    let url = icon.url || '';
    
    // 系统URL不需要添加协议
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('chrome://') && !url.startsWith('infinity://')) {
      url = 'https://' + url;
    }

    const newShortcut = {
      id: Date.now(),
      name: icon.name || '未命名',
      url: url,
      icon: iconSrc,
      color: ShortcutsModule.getRandomColor()
    };
    
    // 如果是系统图标，添加 systemIcon 属性
    if (icon.systemIcon) {
      newShortcut.systemIcon = icon.systemIcon;
    }

    // 添加到快捷方式列表
    ShortcutsModule.shortcuts.push(newShortcut);
    await Storage.set('shortcuts', ShortcutsModule.shortcuts);
    
    // 跳转到最后一页显示新添加的图标
    const totalPages = await ShortcutsModule.getTotalPages();
    ShortcutsModule.currentPage = totalPages - 1;
    ShortcutsModule.render();

    // 更新按钮状态显示已添加
    if (btn) {
      btn.textContent = '已添加';
      btn.disabled = true;
      btn.style.background = '#f0f0f0';
      btn.style.color = '#999';
    }
  }
};
