// 快捷方式模块
const ShortcutsModule = {
  shortcuts: [],
  selectedIcon: '',
  currentPage: 0,
  draggedItem: null,
  dragOverItem: null,
  
  // 预设颜色
  colors: [
    '#4285f4', '#ea4335', '#fbbc05', '#34a853', '#ff6d01',
    '#46bdc6', '#7b1fa2', '#c2185b', '#00897b', '#5c6bc0'
  ],

  defaultShortcuts: [
    { id: 1, name: 'Google', url: 'https://www.google.com', icon: '', color: '#4285f4' },
    { id: 2, name: 'YouTube', url: 'https://www.youtube.com', icon: '', color: '#ff0000' },
    { id: 3, name: 'GitHub', url: 'https://github.com', icon: '', color: '#333333' },
    { id: 4, name: 'Gmail', url: 'https://mail.google.com', icon: '', color: '#ea4335' },
    { id: 5, name: '微博', url: 'https://weibo.com', icon: '', color: '#ff8200' },
    { id: 6, name: '知乎', url: 'https://zhihu.com', icon: '', color: '#0084ff' },
    { id: 7, name: '淘宝', url: 'https://www.taobao.com', icon: '', color: '#ff5000' },
    { id: 8, name: 'Bilibili', url: 'https://www.bilibili.com', icon: '', color: '#00a1d6' },
    { id: 9, name: '豆瓣', url: 'https://www.douban.com', icon: '', color: '#007722' },
    { id: 10, name: 'Twitter', url: 'https://twitter.com', icon: '', color: '#1da1f2' },
    { id: 11, name: 'Netflix', url: 'https://www.netflix.com', icon: '', color: '#e50914' },
    { id: 12, name: 'Spotify', url: 'https://www.spotify.com', icon: '', color: '#1db954' }
  ],

  // 获取当前布局配置
  async getLayoutConfig() {
    const rows = await Storage.get('layoutRows', 2);
    const cols = await Storage.get('layoutCols', 6);
    return { rows, cols, perPage: rows * cols };
  },

  // 获取总页数
  async getTotalPages() {
    const { perPage } = await this.getLayoutConfig();
    return Math.max(1, Math.ceil(this.shortcuts.length / perPage));
  },

  async init() {
    this.shortcuts = await Storage.get('shortcuts', this.defaultShortcuts);
    this.render();
    this.bindEvents();
    this.bindPageDots();
  },

  async render() {
    const grid = document.getElementById('shortcuts-grid');
    grid.innerHTML = '';

    const { perPage } = await this.getLayoutConfig();
    const totalPages = await this.getTotalPages();
    
    // 计算当前页显示的图标
    const startIndex = this.currentPage * perPage;
    const endIndex = startIndex + perPage;
    
    // 当前页的图标
    const pageShortcuts = this.shortcuts.slice(startIndex, endIndex);

    pageShortcuts.forEach(shortcut => {
      const isFolder = shortcut.isFolder;
      const isSystemUrl = !isFolder && (shortcut.url.startsWith('chrome://') || shortcut.url.startsWith('infinity://'));
      const item = document.createElement(isFolder || isSystemUrl ? 'div' : 'a');
      item.className = 'shortcut-item';
      item.draggable = true;
      
      if (!isFolder && !isSystemUrl) {
        item.href = shortcut.url;
      }
      item.dataset.id = shortcut.id;
      if (!isFolder) item.dataset.url = shortcut.url;

      if (isFolder) {
        // 文件夹渲染 - 只有删除按钮，没有编辑按钮
        const children = shortcut.children || [];
        const previewIcons = children.slice(0, 4);
        item.innerHTML = `
          <div class="shortcut-icon folder-icon">
            <div class="folder-preview">
              ${previewIcons.map(child => {
                const childIcon = child.icon || this.getFavicon(child.url);
                return `<img src="${childIcon}" onerror="this.style.visibility='hidden'">`;
              }).join('')}
            </div>
          </div>
          <span class="shortcut-name">${shortcut.name}</span>
          <button class="shortcut-delete" data-id="${shortcut.id}">
            <i class="fas fa-times"></i>
          </button>
        `;
        item.addEventListener('click', (e) => {
          if (!e.target.closest('.shortcut-delete')) {
            this.openFolder(shortcut, e);
          }
        });
      } else {
        const iconUrl = shortcut.icon || this.getFavicon(shortcut.url);
        const fallbackUrl = this.getFallbackIcon(shortcut.url);
        const bgColor = shortcut.color || this.getRandomColor();
        const isSystemIcon = shortcut.systemIcon;
        
        if (isSystemIcon) {
          // 待办事项图标显示未完成数量徽章
          const isTodoIcon = shortcut.url === 'infinity://todos';
          const badgeHtml = isTodoIcon ? '<span class="shortcut-badge" id="todo-badge" style="display:none"></span>' : '';
          
          item.innerHTML = `
            <div class="shortcut-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <i class="fas fa-${shortcut.systemIcon}" style="color:white;font-size:24px"></i>
              ${badgeHtml}
            </div>
            <span class="shortcut-name">${shortcut.name}</span>
            <button class="shortcut-edit" data-id="${shortcut.id}">
              <i class="fas fa-pen"></i>
            </button>
            <button class="shortcut-delete" data-id="${shortcut.id}">
              <i class="fas fa-times"></i>
            </button>
          `;
          
          // 初始化待办事项徽章
          if (isTodoIcon) {
            this.updateTodoBadge();
          }
        } else {
          item.innerHTML = `
            <div class="shortcut-icon">
              <img src="${iconUrl}" data-fallback="${fallbackUrl}">
              <span class="icon-letter" style="display:none;background:${bgColor}">${shortcut.name.charAt(0).toUpperCase()}</span>
            </div>
            <span class="shortcut-name">${shortcut.name}</span>
            <button class="shortcut-edit" data-id="${shortcut.id}">
              <i class="fas fa-pen"></i>
            </button>
            <button class="shortcut-delete" data-id="${shortcut.id}">
              <i class="fas fa-times"></i>
            </button>
          `;

          const img = item.querySelector('img');
          if (img) {
            img.addEventListener('error', function() {
              const fallback = this.dataset.fallback;
              if (fallback && !this.dataset.tried) {
                this.dataset.tried = 'true';
                this.src = fallback;
              } else {
                this.style.display = 'none';
                this.nextElementSibling.style.display = 'flex';
              }
            });
          }
        }

        if (isSystemUrl) {
          item.style.cursor = 'pointer';
          item.addEventListener('click', async (e) => {
            if (!e.target.closest('.shortcut-edit') && !e.target.closest('.shortcut-delete')) {
              // infinity:// 协议处理
              if (shortcut.url === 'infinity://bookmarks' || shortcut.url === 'infinity://barkmarks') {
                openPanel('bookmarks-panel');
              } else if (shortcut.url === 'infinity://history') {
                await this.checkHistoryPermissionAndOpen();
              } else if (shortcut.url === 'infinity://todos') {
                openPanel('todo-panel');
              } 
              // chrome:// 协议处理
              else if (shortcut.url === 'chrome://history') {
                await this.checkHistoryPermissionAndOpen();
              } else if (shortcut.url === 'chrome://bookmarks') {
                openPanel('bookmarks-panel');
              } else if (shortcut.url.startsWith('chrome://')) {
                chrome.tabs.create({ url: shortcut.url });
              }
            }
          });
        }
      }

      // 右键菜单显示编辑/删除按钮
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // 先隐藏其他图标的按钮
        document.querySelectorAll('.shortcut-item.show-actions').forEach(el => {
          el.classList.remove('show-actions');
        });
        // 显示当前图标的按钮
        item.classList.add('show-actions');
      });

      // 直接为编辑和删除按钮绑定事件
      const editBtn = item.querySelector('.shortcut-edit');
      const deleteBtn = item.querySelector('.shortcut-delete');
      
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const id = parseInt(editBtn.dataset.id);
          this.openEditModal(id);
          document.querySelectorAll('.shortcut-item.show-actions').forEach(el => {
            el.classList.remove('show-actions');
          });
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const id = parseInt(deleteBtn.dataset.id);
          this.delete(id);
        });
      }

      // 拖拽事件
      this.bindDragEvents(item, shortcut);
      grid.appendChild(item);
    });

    // 更新分页指示器
    this.updatePageDots();
  },

  // 更新分页指示器
  async updatePageDots() {
    const dotsContainer = document.querySelector('.page-dots');
    if (!dotsContainer) return;

    const totalPages = await this.getTotalPages();
    dotsContainer.innerHTML = '';

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('div');
      dot.className = 'page-dot' + (i === this.currentPage ? ' active' : '');
      dot.dataset.page = i;
      dot.addEventListener('click', () => this.goToPage(i));
      dotsContainer.appendChild(dot);
    }
  },

  // 切换页面
  async goToPage(page) {
    const totalPages = await this.getTotalPages();
    if (page >= 0 && page < totalPages) {
      this.currentPage = page;
      this.render();
    }
  },

  // 绑定分页点击事件
  bindPageDots() {
    const dotsContainer = document.querySelector('.page-dots');
    if (dotsContainer) {
      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.page-dot');
        if (dot) {
          const page = parseInt(dot.dataset.page);
          this.goToPage(page);
        }
      });
    }

    // 鼠标滚轮切换页面
    const shortcutsSection = document.querySelector('.shortcuts-section');
    if (shortcutsSection) {
      shortcutsSection.addEventListener('wheel', async (e) => {
        e.preventDefault();
        const totalPages = await this.getTotalPages();
        if (totalPages <= 1) return;

        const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
        
        if (delta > 0 && this.currentPage < totalPages - 1) {
          this.currentPage++;
          this.render();
        } else if (delta < 0 && this.currentPage > 0) {
          this.currentPage--;
          this.render();
        }
      }, { passive: false });

      // 支持从文件夹拖出到桌面空白区域
      shortcutsSection.addEventListener('dragover', (e) => {
        if (this.draggedFolderChild) {
          e.preventDefault();
        }
      });

      shortcutsSection.addEventListener('drop', async (e) => {
        if (this.draggedFolderChild && !e.target.closest('.shortcut-item')) {
          e.preventDefault();
          const { child, folder } = this.draggedFolderChild;
          await this.moveFromFolderToDesktopEnd(child, folder);
          this.draggedFolderChild = null;
        }
      });
    }
  },

  // 从文件夹移动到桌面末尾
  async moveFromFolderToDesktopEnd(child, folder) {
    // 找到 shortcuts 中的文件夹引用并更新
    const folderInShortcuts = this.shortcuts.find(s => s.id === folder.id);
    if (!folderInShortcuts) return;
    
    // 从文件夹中移除
    folderInShortcuts.children = folderInShortcuts.children.filter(c => c.id !== child.id);
    
    // 添加到桌面末尾
    this.shortcuts.push(child);
    
    // 如果文件夹只剩一个或没有图标，解散文件夹
    if (folderInShortcuts.children.length <= 1) {
      const remaining = folderInShortcuts.children[0];
      this.shortcuts = this.shortcuts.filter(s => s.id !== folderInShortcuts.id);
      if (remaining) {
        this.shortcuts.push(remaining);
      }
    }
    
    await Storage.set('shortcuts', this.shortcuts);
    this.render();
  },

  getFavicon(url) {
    try {
      const domain = new URL(url).hostname;
      // 优先使用高清图标源
      return `https://logo.clearbit.com/${domain}`;
    } catch {
      return '';
    }
  },

  // 备用图标源（按优先级排序）
  getFallbackIcon(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return '';
    }
  },

  getRandomColor() {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  },

  getIconOptions(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const origin = urlObj.origin;
      
      return [
        { name: 'Clearbit HD', url: `https://logo.clearbit.com/${domain}` },
        { name: 'Google 128px', url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128` },
        { name: 'Icon Horse', url: `https://icon.horse/icon/${domain}` },
        { name: 'Apple Touch', url: `${origin}/apple-touch-icon.png` },
        { name: 'DuckDuckGo', url: `https://icons.duckduckgo.com/ip3/${domain}.ico` },
        { name: 'Favicon 128', url: `https://api.faviconkit.com/${domain}/128` },
        { name: 'Google 64px', url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64` },
        { name: '网站图标', url: `${origin}/favicon.ico` }
      ];
    } catch {
      return [];
    }
  },

  bindEvents() {
    // 点击其他地方隐藏编辑/删除按钮
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.shortcut-edit') && !e.target.closest('.shortcut-delete')) {
        document.querySelectorAll('.shortcut-item.show-actions').forEach(el => {
          el.classList.remove('show-actions');
        });
      }
    });

    // 添加快捷方式按钮（使用事件委托）
    document.getElementById('shortcuts-grid').addEventListener('click', (e) => {
      const addBtn = e.target.closest('#add-shortcut');
      if (addBtn) {
        e.preventDefault();
        this.openModal();
        return;
      }
    });

    // 弹窗事件
    document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
    document.getElementById('cancel-shortcut').addEventListener('click', () => this.closeModal());
    document.getElementById('save-shortcut').addEventListener('click', () => this.save());
    document.getElementById('fetch-icons').addEventListener('click', () => this.fetchIcons());

    document.getElementById('shortcut-url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.fetchIcons();
      }
    });

    document.getElementById('shortcut-modal').addEventListener('click', (e) => {
      if (e.target.id === 'shortcut-modal') {
        this.closeModal();
      }
    });
  },

  fetchIcons() {
    let url = document.getElementById('shortcut-url').value.trim();
    if (!url) {
      alert('请先输入网址');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      document.getElementById('shortcut-url').value = url;
    }

    const iconOptions = this.getIconOptions(url);
    const container = document.getElementById('icon-options');
    const section = document.getElementById('icon-selection');
    
    container.innerHTML = '';
    this.selectedIcon = '';

    iconOptions.forEach(option => {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'icon-option';
      iconDiv.dataset.url = option.url;
      iconDiv.innerHTML = `
        <img src="${option.url}" alt="${option.name}">
        <span>${option.name}</span>
      `;
      
      // 图片加载失败时隐藏该选项
      const img = iconDiv.querySelector('img');
      img.onerror = function() {
        iconDiv.style.display = 'none';
      };
      
      iconDiv.addEventListener('click', () => {
        container.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
        iconDiv.classList.add('selected');
        this.selectedIcon = option.url;
        document.getElementById('shortcut-icon').value = option.url;
      });

      container.appendChild(iconDiv);
    });

    section.style.display = 'block';
  },

  editingId: null,

  // 检查是否是系统图标
  isSystemShortcut(shortcut) {
    if (!shortcut || !shortcut.url) return false;
    return shortcut.url.startsWith('infinity://') || shortcut.url.startsWith('chrome://');
  },

  // 检查历史记录权限并打开面板
  async checkHistoryPermissionAndOpen() {
    try {
      const hasPermission = await chrome.permissions.contains({ permissions: ['history'] });
      if (hasPermission) {
        openPanel('history-panel');
        setTimeout(() => {
          if (typeof HistoryModule !== 'undefined') {
            HistoryModule.hasPermission = true;
            HistoryModule.loadHistory();
          }
        }, 100);
      } else {
        const granted = await chrome.permissions.request({ permissions: ['history'] });
        if (granted) {
          openPanel('history-panel');
          setTimeout(() => {
            if (typeof HistoryModule !== 'undefined') {
              HistoryModule.hasPermission = true;
              HistoryModule.loadHistory();
            }
          }, 100);
        }
      }
    } catch (error) {
      openPanel('history-panel');
    }
  },

  openModal(shortcut = null) {
    this.editingId = shortcut ? shortcut.id : null;
    document.getElementById('shortcut-modal').classList.remove('hidden');
    document.getElementById('modal-title').textContent = shortcut ? '编辑快捷方式' : '添加快捷方式';
    document.getElementById('shortcut-name').value = shortcut ? shortcut.name : '';
    document.getElementById('shortcut-url').value = shortcut ? shortcut.url : '';
    document.getElementById('shortcut-icon').value = shortcut ? (shortcut.icon || '') : '';
    document.getElementById('icon-selection').style.display = 'none';
    document.getElementById('icon-options').innerHTML = '';
    this.selectedIcon = shortcut ? (shortcut.icon || '') : '';
    
    // 系统图标禁用名称和网址编辑
    const isSystem = this.isSystemShortcut(shortcut);
    const nameInput = document.getElementById('shortcut-name');
    const urlInput = document.getElementById('shortcut-url');
    const fetchBtn = document.getElementById('fetch-icons');
    
    nameInput.disabled = isSystem;
    urlInput.disabled = isSystem;
    if (fetchBtn) fetchBtn.style.display = isSystem ? 'none' : 'block';
    
    // 添加提示样式
    nameInput.style.opacity = isSystem ? '0.6' : '1';
    urlInput.style.opacity = isSystem ? '0.6' : '1';
    nameInput.style.cursor = isSystem ? 'not-allowed' : 'text';
    urlInput.style.cursor = isSystem ? 'not-allowed' : 'text';
    
    if (!isSystem) {
      document.getElementById('shortcut-name').focus();
    }
  },

  openEditModal(id) {
    const shortcut = this.shortcuts.find(s => s.id === id);
    if (shortcut) {
      this.openModal(shortcut);
    }
  },

  closeModal() {
    document.getElementById('shortcut-modal').classList.add('hidden');
  },

  async save() {
    const name = document.getElementById('shortcut-name').value.trim();
    let url = document.getElementById('shortcut-url').value.trim();
    const icon = document.getElementById('shortcut-icon').value.trim() || this.selectedIcon;

    // 检查是否是系统图标编辑
    const existingShortcut = this.editingId ? this.shortcuts.find(s => s.id === this.editingId) : null;
    const isSystem = this.isSystemShortcut(existingShortcut);

    if (!isSystem && (!name || !url)) {
      alert('请填写名称和网址');
      return;
    }

    if (this.editingId) {
      // 编辑模式 - 更新数据并刷新对应元素
      const index = this.shortcuts.findIndex(s => s.id === this.editingId);
      if (index !== -1) {
        if (isSystem) {
          this.shortcuts[index] = { ...this.shortcuts[index], icon };
        } else {
          this.shortcuts[index] = { ...this.shortcuts[index], name, url, icon };
        }
        await Storage.set('shortcuts', this.shortcuts);
        // 只更新对应的 DOM 元素
        this.updateShortcutElement(this.shortcuts[index]);
      }
    } else {
      // 新增模式
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('infinity://') && !url.startsWith('chrome://')) {
        url = 'https://' + url;
      }
      const newShortcut = {
        id: Date.now(),
        name,
        url,
        icon,
        color: this.getRandomColor()
      };
      this.shortcuts.push(newShortcut);
      await Storage.set('shortcuts', this.shortcuts);
      
      // 检查是否需要跳转到新页面
      const { perPage } = await this.getLayoutConfig();
      const totalPages = await this.getTotalPages();
      const lastPageIndex = totalPages - 1;
      
      if (this.currentPage === lastPageIndex) {
        // 当前在最后一页，直接添加元素
        const currentPageCount = this.shortcuts.length - (this.currentPage * perPage);
        if (currentPageCount <= perPage) {
          this.appendShortcutElement(newShortcut);
        } else {
          // 需要新页面，重新渲染
          this.currentPage = lastPageIndex;
          this.render();
        }
      } else {
        // 跳转到最后一页
        this.currentPage = lastPageIndex;
        this.render();
      }
      this.updatePageDots();
    }

    this.closeModal();
  },

  // 更新单个快捷方式元素
  updateShortcutElement(shortcut) {
    const itemEl = document.querySelector(`.shortcut-item[data-id="${shortcut.id}"]`);
    if (!itemEl) return;
    
    const iconEl = itemEl.querySelector('.shortcut-icon img');
    const nameEl = itemEl.querySelector('.shortcut-name');
    
    if (iconEl && shortcut.icon) {
      iconEl.src = shortcut.icon;
    }
    if (nameEl) {
      nameEl.textContent = shortcut.name;
    }
  },

  // 追加单个快捷方式元素
  appendShortcutElement(shortcut) {
    const grid = document.getElementById('shortcuts-grid');
    if (!grid) return;
    
    const item = this.createShortcutElement(shortcut);
    item.style.opacity = '0';
    item.style.transform = 'scale(0.8)';
    grid.appendChild(item);
    
    // 触发动画
    requestAnimationFrame(() => {
      item.style.transition = 'transform 0.3s, opacity 0.3s';
      item.style.opacity = '1';
      item.style.transform = 'scale(1)';
    });
  },

  // 创建快捷方式元素（从 render 中提取）
  createShortcutElement(shortcut) {
    const isFolder = shortcut.isFolder;
    const isSystemUrl = !isFolder && (shortcut.url.startsWith('chrome://') || shortcut.url.startsWith('infinity://'));
    const item = document.createElement(isFolder || isSystemUrl ? 'div' : 'a');
    item.className = 'shortcut-item';
    item.draggable = true;
    
    if (!isFolder && !isSystemUrl) {
      item.href = shortcut.url;
    }
    item.dataset.id = shortcut.id;
    if (!isFolder) item.dataset.url = shortcut.url;

    if (isFolder) {
      const children = shortcut.children || [];
      const previewIcons = children.slice(0, 4);
      item.innerHTML = `
        <div class="shortcut-icon folder-icon">
          <div class="folder-preview">
            ${previewIcons.map(child => {
              const childIcon = child.icon || this.getFavicon(child.url);
              return `<img src="${childIcon}" onerror="this.style.visibility='hidden'">`;
            }).join('')}
          </div>
        </div>
        <span class="shortcut-name">${shortcut.name}</span>
        <button class="shortcut-delete" data-id="${shortcut.id}">
          <i class="fas fa-times"></i>
        </button>
      `;
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.shortcut-delete')) {
          this.openFolder(shortcut, e);
        }
      });
    } else {
      const iconUrl = shortcut.icon || this.getFavicon(shortcut.url);
      const fallbackUrl = this.getFallbackIcon(shortcut.url);
      const bgColor = shortcut.color || this.getRandomColor();
      const isSystemIcon = shortcut.systemIcon;
      
      if (isSystemIcon) {
        const isTodoIcon = shortcut.url === 'infinity://todos';
        const badgeHtml = isTodoIcon ? '<span class="shortcut-badge" id="todo-badge" style="display:none"></span>' : '';
        
        item.innerHTML = `
          <div class="shortcut-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <i class="fas fa-${shortcut.systemIcon}" style="color:white;font-size:24px"></i>
            ${badgeHtml}
          </div>
          <span class="shortcut-name">${shortcut.name}</span>
          <button class="shortcut-edit" data-id="${shortcut.id}">
            <i class="fas fa-pen"></i>
          </button>
          <button class="shortcut-delete" data-id="${shortcut.id}">
            <i class="fas fa-times"></i>
          </button>
        `;
        
        if (isTodoIcon) {
          this.updateTodoBadge();
        }
      } else {
        item.innerHTML = `
          <div class="shortcut-icon">
            <img src="${iconUrl}" data-fallback="${fallbackUrl}">
            <span class="icon-letter" style="display:none;background:${bgColor}">${shortcut.name.charAt(0).toUpperCase()}</span>
          </div>
          <span class="shortcut-name">${shortcut.name}</span>
          <button class="shortcut-edit" data-id="${shortcut.id}">
            <i class="fas fa-pen"></i>
          </button>
          <button class="shortcut-delete" data-id="${shortcut.id}">
            <i class="fas fa-times"></i>
          </button>
        `;

        const img = item.querySelector('img');
        if (img) {
          img.addEventListener('error', function() {
            const fallback = this.dataset.fallback;
            if (fallback && !this.dataset.tried) {
              this.dataset.tried = 'true';
              this.src = fallback;
            } else {
              this.style.display = 'none';
              this.nextElementSibling.style.display = 'flex';
            }
          });
        }
      }

      if (isSystemUrl) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', async (e) => {
          if (!e.target.closest('.shortcut-edit') && !e.target.closest('.shortcut-delete')) {
            if (shortcut.url === 'infinity://bookmarks' || shortcut.url === 'infinity://barkmarks') {
              openPanel('bookmarks-panel');
            } else if (shortcut.url === 'infinity://history') {
              await this.checkHistoryPermissionAndOpen();
            } else if (shortcut.url === 'infinity://todos') {
              openPanel('todo-panel');
            } else if (shortcut.url === 'chrome://history') {
              await this.checkHistoryPermissionAndOpen();
            } else if (shortcut.url === 'chrome://bookmarks') {
              openPanel('bookmarks-panel');
            } else if (shortcut.url.startsWith('chrome://')) {
              chrome.tabs.create({ url: shortcut.url });
            }
          }
        });
      }
    }

    // 右键菜单
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      document.querySelectorAll('.shortcut-item.show-actions').forEach(el => {
        el.classList.remove('show-actions');
      });
      item.classList.add('show-actions');
    });

    // 编辑和删除按钮事件
    const editBtn = item.querySelector('.shortcut-edit');
    const deleteBtn = item.querySelector('.shortcut-delete');
    
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openEditModal(parseInt(editBtn.dataset.id));
        document.querySelectorAll('.shortcut-item.show-actions').forEach(el => {
          el.classList.remove('show-actions');
        });
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.delete(parseInt(deleteBtn.dataset.id));
      });
    }

    // 拖拽事件
    this.bindDragEvents(item, shortcut);
    
    return item;
  },

  async delete(id) {
    // 从 DOM 中移除元素（带动画）
    const itemEl = document.querySelector(`.shortcut-item[data-id="${id}"]`);
    if (itemEl) {
      itemEl.style.transition = 'transform 0.2s, opacity 0.2s';
      itemEl.style.transform = 'scale(0.8)';
      itemEl.style.opacity = '0';
      
      await new Promise(resolve => setTimeout(resolve, 200));
      itemEl.remove();
    }
    
    // 更新数据
    this.shortcuts = this.shortcuts.filter(s => s.id !== id);
    await Storage.set('shortcuts', this.shortcuts);
    
    // 更新分页指示器
    this.updatePageDots();
  },

  // 拖拽事件绑定
  bindDragEvents(item, shortcut) {
    item.addEventListener('dragstart', (e) => {
      this.draggedItem = shortcut;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      document.querySelectorAll('.shortcut-item').forEach(el => {
        el.classList.remove('drag-over');
      });
      this.draggedItem = null;
      this.dragOverItem = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      // 支持从文件夹拖出或桌面图标拖拽
      if ((this.draggedItem && this.draggedItem.id !== shortcut.id) || this.draggedFolderChild) {
        item.classList.add('drag-over');
        this.dragOverItem = shortcut;
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', async (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      
      // 从文件夹拖出到桌面图标位置
      if (this.draggedFolderChild) {
        const { child, folder } = this.draggedFolderChild;
        await this.moveFromFolderToDesktop(child, folder, shortcut);
        this.draggedFolderChild = null;
        return;
      }
      
      if (!this.draggedItem || this.draggedItem.id === shortcut.id) return;
      
      // 如果目标是文件夹，将拖拽项添加到文件夹
      if (shortcut.isFolder) {
        await this.addToFolder(this.draggedItem, shortcut);
      } else {
        // 两个普通图标合并成文件夹
        await this.createFolder(this.draggedItem, shortcut);
      }
    });
  },

  // 从文件夹移动到桌面
  async moveFromFolderToDesktop(child, folder, targetShortcut) {
    // 找到 shortcuts 中的文件夹引用并更新
    const folderInShortcuts = this.shortcuts.find(s => s.id === folder.id);
    if (!folderInShortcuts) return;
    
    // 从文件夹中移除
    folderInShortcuts.children = folderInShortcuts.children.filter(c => c.id !== child.id);
    
    // 找到目标位置并插入
    const targetIndex = this.shortcuts.findIndex(s => s.id === targetShortcut.id);
    if (targetIndex >= 0) {
      this.shortcuts.splice(targetIndex, 0, child);
    } else {
      this.shortcuts.push(child);
    }
    
    // 如果文件夹只剩一个或没有图标，解散文件夹
    if (folderInShortcuts.children.length <= 1) {
      const remaining = folderInShortcuts.children[0];
      this.shortcuts = this.shortcuts.filter(s => s.id !== folderInShortcuts.id);
      if (remaining) {
        this.shortcuts.push(remaining);
      }
    }
    
    await Storage.set('shortcuts', this.shortcuts);
    this.render();
  },

  // 创建文件夹
  async createFolder(item1, item2) {
    // 自动生成文件夹名称
    const folderName = '文件夹';

    const folder = {
      id: Date.now(),
      name: folderName,
      isFolder: true,
      children: [
        { ...item1 },
        { ...item2 }
      ],
      color: this.getRandomColor()
    };

    // 移除原来的两个图标，添加文件夹
    this.shortcuts = this.shortcuts.filter(s => s.id !== item1.id && s.id !== item2.id);
    
    // 在原位置插入文件夹
    const index = this.shortcuts.findIndex(s => s.id === item2.id);
    if (index >= 0) {
      this.shortcuts.splice(index, 0, folder);
    } else {
      this.shortcuts.push(folder);
    }

    await Storage.set('shortcuts', this.shortcuts);
    this.render();
  },

  // 添加到文件夹
  async addToFolder(item, folder) {
    if (!folder.children) folder.children = [];
    folder.children.push({ ...item });
    
    // 移除原图标
    this.shortcuts = this.shortcuts.filter(s => s.id !== item.id);
    
    await Storage.set('shortcuts', this.shortcuts);
    this.render();
  },

  // 打开文件夹弹窗
  openFolder(folder, clickEvent) {
    this.currentFolder = folder;
    const modal = document.getElementById('folder-modal');
    const title = document.getElementById('folder-title');
    const content = document.getElementById('folder-content');
    
    if (!modal) {
      this.createFolderModal();
      return this.openFolder(folder, clickEvent);
    }
    
    const modalContent = modal.querySelector('.folder-modal-content');
    
    // 获取点击的文件夹图标位置
    const folderItem = document.querySelector(`.shortcut-item[data-id="${folder.id}"]`);
    if (folderItem && modalContent) {
      const rect = folderItem.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // 设置初始位置和缩放
      modalContent.style.transition = 'none';
      modalContent.style.transformOrigin = 'center center';
      modalContent.style.transform = `translate(${centerX - window.innerWidth / 2}px, ${centerY - window.innerHeight / 2}px) scale(0.1)`;
      modalContent.style.opacity = '0';
      
      // 强制重绘
      modalContent.offsetHeight;
      
      // 动画到中心
      modalContent.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease';
      modalContent.style.transform = 'translate(0, 0) scale(1)';
      modalContent.style.opacity = '1';
    }
    
    title.textContent = folder.name;
    content.innerHTML = '';
    
    (folder.children || []).forEach(child => {
      const item = document.createElement('a');
      item.className = 'folder-item';
      item.href = child.url;
      item.target = '_blank';
      item.draggable = true;
      item.dataset.childId = child.id;
      
      const iconUrl = child.icon || this.getFavicon(child.url);
      const bgColor = child.color || this.getRandomColor();
      
      item.innerHTML = `
        <div class="folder-item-icon">
          <img src="${iconUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="icon-letter" style="display:none;background:${bgColor}">${child.name.charAt(0).toUpperCase()}</span>
        </div>
        <span class="folder-item-name">${child.name}</span>
        <button class="folder-item-remove" data-id="${child.id}">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      // 拖拽事件 - 从文件夹拖出
      item.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        this.draggedFolderChild = { child, folder };
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', child.id);
        // 关闭文件夹弹窗以便拖到桌面
        setTimeout(() => {
          this.closeFolderModal();
        }, 100);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        // 延迟清除，确保 drop 事件先执行
        setTimeout(() => {
          this.draggedFolderChild = null;
        }, 50);
      });
      
      item.querySelector('.folder-item-remove').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeFromFolder(child.id, folder);
      });

      // 阻止点击链接（拖拽时）
      item.addEventListener('click', (e) => {
        if (item.classList.contains('dragging')) {
          e.preventDefault();
        }
      });
      
      content.appendChild(item);
    });
    
    modal.classList.remove('hidden');
  },

  // 从文件夹移除
  async removeFromFolder(childId, folder) {
    const child = folder.children.find(c => c.id === childId);
    if (!child) return;
    
    folder.children = folder.children.filter(c => c.id !== childId);
    
    // 如果文件夹只剩一个或没有图标，解散文件夹
    if (folder.children.length <= 1) {
      const remaining = folder.children[0];
      this.shortcuts = this.shortcuts.filter(s => s.id !== folder.id);
      if (remaining) {
        this.shortcuts.push(remaining);
      }
      this.shortcuts.push(child);
      this.closeFolderModal();
    } else {
      this.shortcuts.push(child);
    }
    
    await Storage.set('shortcuts', this.shortcuts);
    this.render();
    
    if (folder.children.length > 1) {
      this.openFolder(folder);
    }
  },

  // 创建文件夹弹窗
  createFolderModal() {
    const modal = document.createElement('div');
    modal.id = 'folder-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content folder-modal-content">
        <div class="modal-header">
          <h3 id="folder-title" class="folder-title-editable">文件夹</h3>
          <input type="text" id="folder-title-input" class="folder-title-input hidden" />
          <button class="close-modal" id="close-folder-modal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div id="folder-content" class="folder-content"></div>
        </div>
      </div>
    `;
    document.getElementById('app').appendChild(modal);
    
    const titleEl = document.getElementById('folder-title');
    const inputEl = document.getElementById('folder-title-input');
    
    // 点击标题进入编辑模式
    titleEl.addEventListener('click', () => {
      if (!this.currentFolder) return;
      titleEl.classList.add('hidden');
      inputEl.classList.remove('hidden');
      inputEl.value = this.currentFolder.name;
      inputEl.focus();
      inputEl.select();
    });
    
    // 保存文件夹名称
    const saveFolderName = async () => {
      const newName = inputEl.value.trim();
      if (newName && this.currentFolder) {
        this.currentFolder.name = newName;
        titleEl.textContent = newName;
        await Storage.set('shortcuts', this.shortcuts);
        this.render();
      }
      inputEl.classList.add('hidden');
      titleEl.classList.remove('hidden');
    };
    
    inputEl.addEventListener('blur', saveFolderName);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inputEl.blur();
      } else if (e.key === 'Escape') {
        inputEl.value = this.currentFolder?.name || '';
        inputEl.blur();
      }
    });
    
    document.getElementById('close-folder-modal').addEventListener('click', () => this.closeFolderModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeFolderModal();
    });
  },

  closeFolderModal() {
    const modal = document.getElementById('folder-modal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.folder-modal-content');
    const folder = this.currentFolder;
    
    if (folder && modalContent) {
      const folderItem = document.querySelector(`.shortcut-item[data-id="${folder.id}"]`);
      if (folderItem) {
        const rect = folderItem.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 动画缩回到文件夹位置
        modalContent.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease';
        modalContent.style.transform = `translate(${centerX - window.innerWidth / 2}px, ${centerY - window.innerHeight / 2}px) scale(0.1)`;
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
          modal.classList.add('hidden');
          // 重置样式
          modalContent.style.transition = '';
          modalContent.style.transform = '';
          modalContent.style.opacity = '';
          this.currentFolder = null;
        }, 250);
        return;
      }
    }
    
    modal.classList.add('hidden');
    this.currentFolder = null;
  },

  // 更新待办事项徽章
  async updateTodoBadge() {
    const badge = document.getElementById('todo-badge');
    if (!badge) return;
    
    const todos = await Storage.get('todos', []);
    const uncompletedCount = todos.filter(t => !t.completed).length;
    
    if (uncompletedCount > 0) {
      badge.textContent = uncompletedCount > 99 ? '99+' : uncompletedCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
};
