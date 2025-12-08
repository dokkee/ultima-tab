// 历史记录模块
const HistoryModule = {
  history: [],
  hasPermission: false,

  async init() {
    this.bindEvents();
    await this.checkPermission();
  },

  bindEvents() {
    document.getElementById('history-search').addEventListener('input', (e) => {
      this.filterHistory(e.target.value);
    });

    // 授权按钮点击
    document.getElementById('history-list').addEventListener('click', (e) => {
      if (e.target.closest('#grant-history-permission')) {
        this.requestPermission();
      }
    });
  },

  async checkPermission() {
    try {
      const result = await chrome.permissions.contains({ permissions: ['history'] });
      this.hasPermission = result;
      if (result) {
        await this.loadHistory();
      } else {
        this.showPermissionRequest();
      }
    } catch (error) {
      this.showPermissionRequest();
    }
  },

  showPermissionRequest() {
    const list = document.getElementById('history-list');
    list.innerHTML = `
      <div class="permission-request">
        <div class="permission-icon"><i class="fas fa-history"></i></div>
        <h4>需要授权</h4>
        <p>查看历史记录需要您的授权</p>
        <button id="grant-history-permission" class="permission-btn">
          <i class="fas fa-unlock"></i> 授权访问历史记录
        </button>
      </div>
    `;
  },

  async requestPermission() {
    try {
      const granted = await chrome.permissions.request({ permissions: ['history'] });
      if (granted) {
        this.hasPermission = true;
        await this.loadHistory();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  },

  async loadHistory() {
    if (!this.hasPermission) {
      this.showPermissionRequest();
      return;
    }

    const list = document.getElementById('history-list');
    if (list) {
      list.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
    }

    try {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      chrome.history.search(
        {
          text: '',
          startTime: oneWeekAgo,
          maxResults: 100
        },
        (results) => {
          if (chrome.runtime.lastError) {
            if (list) list.innerHTML = '<div class="empty-state">无法加载历史记录</div>';
            return;
          }
          this.history = (results || []).map((item) => ({
            id: item.id,
            title: item.title || item.url,
            url: item.url,
            visitTime: item.lastVisitTime
          }));
          this.render(this.history);
        }
      );
    } catch (error) {
      if (list) list.innerHTML = '<div class="empty-state">无法加载历史记录</div>';
    }
  },

  render(history) {
    const list = document.getElementById('history-list');

    if (!history || history.length === 0) {
      list.innerHTML = '<div class="empty-state">暂无历史记录</div>';
      return;
    }

    const grouped = this.groupByDate(history);

    list.innerHTML = Object.entries(grouped)
      .map(
        ([date, items]) => `
      <div class="history-group">
        <div class="history-date">${date}</div>
        ${items
          .map(
            (item) => `
          <a href="${item.url}" class="history-item" title="${item.url}">
            <img src="${this.getFavicon(item.url)}" class="history-icon">
            <div class="history-info">
              <span class="history-title">${this.escapeHtml(item.title)}</span>
              <span class="history-time">${this.formatTime(item.visitTime)}</span>
            </div>
          </a>
        `
          )
          .join('')}
      </div>
    `
      )
      .join('');

    // 为所有图标添加错误处理
    list.querySelectorAll('.history-icon').forEach(img => {
      img.onerror = function() {
        this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔗</text></svg>';
      };
    });
  },

  groupByDate(history) {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    history.forEach((item) => {
      const date = new Date(item.visitTime).toDateString();
      let label;
      if (date === today) {
        label = '今天';
      } else if (date === yesterday) {
        label = '昨天';
      } else {
        label = new Date(item.visitTime).toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric'
        });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
    });

    return groups;
  },

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getFavicon(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  filterHistory(query) {
    if (!query) {
      this.render(this.history);
      return;
    }
    const filtered = this.history.filter(
      (h) =>
        h.title.toLowerCase().includes(query.toLowerCase()) ||
        h.url.toLowerCase().includes(query.toLowerCase())
    );
    this.render(filtered);
  }
};
