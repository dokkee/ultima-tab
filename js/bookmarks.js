// 书签模块
const BookmarksModule = {
  bookmarkTree: [],
  currentFolder: null,
  allBookmarks: [],

  async init() {
    this.bindEvents();
    await this.loadBookmarks();
  },

  bindEvents() {
    document.getElementById('bookmark-search').addEventListener('input', (e) => {
      this.filterBookmarks(e.target.value);
    });
  },

  async loadBookmarks() {
    try {
      chrome.bookmarks.getTree((tree) => {
        this.bookmarkTree = tree[0]?.children || [];
        this.allBookmarks = this.flattenBookmarks(this.bookmarkTree);
        this.renderCategories();
        // 默认选中第一个分类
        if (this.bookmarkTree.length > 0) {
          this.selectCategory(this.bookmarkTree[0]);
        }
      });
    } catch (error) {
      document.getElementById('bookmarks-list').innerHTML =
        '<div class="empty-state">无法加载书签</div>';
    }
  },

  // 获取所有一级文件夹（从顶级文件夹的children中提取）
  getFirstLevelFolders() {
    const folders = [];
    this.bookmarkTree.forEach(topFolder => {
      if (topFolder.children) {
        topFolder.children.forEach(child => {
          if (!child.url) {
            folders.push(child);
          }
        });
      }
    });
    return folders;
  },

  renderCategories() {
    const container = document.getElementById('bookmarks-categories');
    if (!container) return;

    const firstLevelFolders = this.getFirstLevelFolders();

    // 添加"全部"选项
    let html = `
      <div class="bookmark-category" data-id="all">
        <i class="fas fa-globe"></i>
        <span>全部</span>
        <span class="category-count">${this.allBookmarks.length}</span>
      </div>
    `;

    // 渲染一级文件夹
    firstLevelFolders.forEach(folder => {
      const count = this.countBookmarks(folder);
      html += `
        <div class="bookmark-category" data-id="${folder.id}">
          <i class="fas fa-folder"></i>
          <span>${this.escapeHtml(folder.title || '未命名')}</span>
          <span class="category-count">${count}</span>
        </div>
      `;
    });

    container.innerHTML = html;

    // 绑定点击事件
    container.querySelectorAll('.bookmark-category').forEach(cat => {
      cat.addEventListener('click', () => {
        container.querySelectorAll('.bookmark-category').forEach(c => c.classList.remove('active'));
        cat.classList.add('active');

        const id = cat.dataset.id;
        if (id === 'all') {
          this.currentFolder = null;
          this.renderBookmarks(this.allBookmarks);
        } else {
          const folder = this.findFolderById(id, this.bookmarkTree);
          if (folder) {
            this.selectCategory(folder);
          }
        }
      });
    });

    // 默认选中"全部"
    const firstCat = container.querySelector('.bookmark-category');
    if (firstCat) firstCat.classList.add('active');
  },

  selectCategory(folder) {
    this.currentFolder = folder;
    const bookmarks = this.flattenBookmarks(folder.children || []);
    this.renderBookmarks(bookmarks);
  },

  renderBookmarks(bookmarks) {
    const list = document.getElementById('bookmarks-list');

    if (!bookmarks || bookmarks.length === 0) {
      list.innerHTML = '<div class="empty-state">此分类下暂无书签</div>';
      return;
    }

    const displayBookmarks = bookmarks.slice(0, 100);

    list.innerHTML = displayBookmarks.map(bookmark => `
      <a href="${bookmark.url}" class="bookmark-item" title="${bookmark.url}">
        <img src="${this.getFavicon(bookmark.url)}" class="bookmark-icon">
        <span class="bookmark-title">${this.escapeHtml(bookmark.title)}</span>
      </a>
    `).join('');

    this.bindIconErrorEvents(list);

    if (bookmarks.length > 100) {
      list.innerHTML += `<div class="empty-state">还有 ${bookmarks.length - 100} 个书签...</div>`;
    }
  },

  bindIconErrorEvents(list) {
    list.querySelectorAll('.bookmark-icon').forEach(img => {
      img.addEventListener('error', function () {
        this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔗</text></svg>';
      });
    });
  },

  findFolderById(id, nodes) {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findFolderById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  },

  countBookmarks(folder) {
    let count = 0;
    const traverse = (nodes) => {
      for (const node of nodes || []) {
        if (node.url) count++;
        if (node.children) traverse(node.children);
      }
    };
    traverse(folder.children);
    return count;
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

  filterBookmarks(query) {
    const list = document.getElementById('bookmarks-list');
    if (!query) {
      if (this.currentFolder) {
        this.renderBookmarks(this.flattenBookmarks(this.currentFolder.children || []));
      } else {
        this.renderBookmarks(this.allBookmarks);
      }
      return;
    }

    // 在当前分类或全部中搜索
    const source = this.currentFolder
      ? this.flattenBookmarks(this.currentFolder.children || [])
      : this.allBookmarks;

    const filtered = source.filter(b =>
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.url.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state">未找到匹配的书签</div>';
      return;
    }

    this.renderBookmarks(filtered);
  },

  flattenBookmarks(nodes, result = []) {
    for (const node of nodes || []) {
      if (node.url) {
        result.push({
          id: node.id,
          title: node.title || node.url,
          url: node.url
        });
      }
      if (node.children) {
        this.flattenBookmarks(node.children, result);
      }
    }
    return result;
  }
};
