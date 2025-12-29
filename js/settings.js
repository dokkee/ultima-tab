// 设置模块
const SettingsModule = {
  init() {
    this.bindEvents();
    this.loadSettings();
  },

  bindEvents() {
    // 自定义下拉框初始化
    this.initCustomSelect();

    // 壁纸来源切换 - 自动保存（兼容原生select和自定义select）
    document.getElementById('wallpaper-source')?.addEventListener('change', async (e) => {
      const customSection = document.getElementById('custom-wallpaper-section');
      if (customSection) customSection.style.display = e.target.value === 'custom' ? 'block' : 'none';
      await Storage.set('wallpaperSource', e.target.value);
      await WallpaperModule.loadWallpaper();
    });

    // 自定义壁纸URL - 自动保存
    document.getElementById('custom-wallpaper')?.addEventListener('change', async (e) => {
      await Storage.set('customWallpaper', e.target.value);
      await WallpaperModule.loadWallpaper();
    });

    // 导出数据
    document.getElementById('export-data')?.addEventListener('click', () => this.exportData());

    // 导入数据
    document.getElementById('import-data')?.addEventListener('click', () => {
      document.getElementById('import-file')?.click();
    });
    document.getElementById('import-file')?.addEventListener('change', (e) => this.importData(e.target.files[0]));

    // 图标大小滑动条 - 实时生效并自动保存
    document.getElementById('icon-size')?.addEventListener('input', async (e) => {
      const valueEl = document.getElementById('icon-size-value');
      if (valueEl) valueEl.textContent = e.target.value + 'px';
      this.updateSliderGradient(e.target);
      this.applyIconSettings();
      await Storage.set('iconSize', parseInt(e.target.value));
    });

    // 图标间隔滑动条 - 实时生效并自动保存
    document.getElementById('icon-gap')?.addEventListener('input', async (e) => {
      const valueEl = document.getElementById('icon-gap-value');
      if (valueEl) valueEl.textContent = e.target.value + 'px';
      this.updateSliderGradient(e.target);
      this.applyIconSettings();
      await Storage.set('iconGap', parseInt(e.target.value));
    });

    // 布局选项 - 实时生效并自动保存
    document.querySelectorAll('.layout-option').forEach(option => {
      option.addEventListener('click', async () => {
        document.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        const customSection = document.getElementById('custom-layout-section');
        if (customSection) {
          customSection.style.display = option.dataset.rows === '0' ? 'flex' : 'none';
        }
        this.applyIconSettings();
        await this.saveLayoutSettings();
      });
    });

    // 自定义行列数 - 实时生效并自动保存
    document.getElementById('custom-rows')?.addEventListener('input', async () => {
      this.applyIconSettings();
      await this.saveLayoutSettings();
    });
    document.getElementById('custom-cols')?.addEventListener('input', async () => {
      this.applyIconSettings();
      await this.saveLayoutSettings();
    });

    // API BASE_URL 设置 - 失焦时自动保存
    document.getElementById('api-base-url')?.addEventListener('change', async (e) => {
      await API.setBaseUrl(e.target.value);
    });

    // 搜索框圆角滑动条 - 实时生效并自动保存
    document.getElementById('search-radius')?.addEventListener('input', async (e) => {
      const valueEl = document.getElementById('search-radius-value');
      if (valueEl) valueEl.textContent = e.target.value + 'px';
      this.updateSliderGradient(e.target);
      document.documentElement.style.setProperty('--search-radius', e.target.value + 'px');
      await Storage.set('searchRadius', parseInt(e.target.value));
    });
  },

  // 保存布局设置
  async saveLayoutSettings() {
    const activeLayout = document.querySelector('.layout-option.active');
    let rows = 2, cols = 6;
    if (activeLayout) {
      if (activeLayout.dataset.rows === '0') {
        const customRowsEl = document.getElementById('custom-rows');
        const customColsEl = document.getElementById('custom-cols');
        rows = customRowsEl ? parseInt(customRowsEl.value) || 2 : 2;
        cols = customColsEl ? parseInt(customColsEl.value) || 6 : 6;
      } else {
        rows = parseInt(activeLayout.dataset.rows) || 2;
        cols = parseInt(activeLayout.dataset.cols) || 6;
      }
    }
    await Storage.set('layoutRows', rows);
    await Storage.set('layoutCols', cols);
    
    // 重新渲染快捷方式以适应新布局
    if (typeof ShortcutsModule !== 'undefined') {
      ShortcutsModule.currentPage = 0;
      ShortcutsModule.render();
    }
  },

  async loadSettings() {
    // API BASE_URL 设置
    const apiBaseUrl = await Storage.get('apiBaseUrl', '');
    const apiBaseUrlEl = document.getElementById('api-base-url');
    if (apiBaseUrlEl) apiBaseUrlEl.value = apiBaseUrl;

    // 搜索框圆角设置
    const searchRadius = await Storage.get('searchRadius', 24);
    const searchRadiusEl = document.getElementById('search-radius');
    const searchRadiusValueEl = document.getElementById('search-radius-value');
    if (searchRadiusEl) searchRadiusEl.value = searchRadius;
    if (searchRadiusValueEl) searchRadiusValueEl.textContent = searchRadius + 'px';
    document.documentElement.style.setProperty('--search-radius', searchRadius + 'px');

    // 壁纸设置
    const wallpaperSource = await Storage.get('wallpaperSource', 'bing');
    const wallpaperEl = document.getElementById('wallpaper-source');
    if (wallpaperEl) wallpaperEl.value = wallpaperSource;
    
    // 更新自定义下拉框显示
    this.updateCustomSelect('wallpaper-source-select', wallpaperSource);

    const customWallpaper = await Storage.get('customWallpaper', '');
    const customWallpaperEl = document.getElementById('custom-wallpaper');
    if (customWallpaperEl) customWallpaperEl.value = customWallpaper;

    if (wallpaperSource === 'custom') {
      const customSection = document.getElementById('custom-wallpaper-section');
      if (customSection) customSection.style.display = 'block';
    }

    // 图标设置
    const iconSize = await Storage.get('iconSize', 60);
    const iconSizeEl = document.getElementById('icon-size');
    const iconSizeValueEl = document.getElementById('icon-size-value');
    if (iconSizeEl) iconSizeEl.value = iconSize;
    if (iconSizeValueEl) iconSizeValueEl.textContent = iconSize + 'px';

    const iconGap = await Storage.get('iconGap', 30);
    const iconGapEl = document.getElementById('icon-gap');
    const iconGapValueEl = document.getElementById('icon-gap-value');
    if (iconGapEl) iconGapEl.value = iconGap;
    if (iconGapValueEl) iconGapValueEl.textContent = iconGap + 'px';

    // 布局设置
    const layoutRows = await Storage.get('layoutRows', 2);
    const layoutCols = await Storage.get('layoutCols', 6);
    
    let found = false;
    document.querySelectorAll('.layout-option').forEach(o => {
      const isMatch = o.dataset.rows === String(layoutRows) && o.dataset.cols === String(layoutCols);
      o.classList.toggle('active', isMatch);
      if (isMatch) found = true;
    });
    
    if (!found) {
      document.querySelectorAll('.layout-option').forEach(o => {
        o.classList.toggle('active', o.dataset.rows === '0');
      });
      const customSection = document.getElementById('custom-layout-section');
      if (customSection) customSection.style.display = 'flex';
      const customRowsEl = document.getElementById('custom-rows');
      const customColsEl = document.getElementById('custom-cols');
      if (customRowsEl) customRowsEl.value = layoutRows;
      if (customColsEl) customColsEl.value = layoutCols;
    }

    // 应用图标设置
    this.applyIconSettings();
    
    // 初始化滑块渐变
    this.initSliderGradients();
  },

  // 更新滑块渐变背景
  updateSliderGradient(slider) {
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const value = parseFloat(slider.value) || 0;
    const percent = ((value - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #ffc107 0%, #ff5722 ${percent}%, #e0e0e0 ${percent}%, #e0e0e0 100%)`;
  },

  // 初始化所有滑块的渐变
  initSliderGradients() {
    document.querySelectorAll('.slider').forEach(slider => {
      this.updateSliderGradient(slider);
    });
  },

  // 更新自定义下拉框的选中值
  updateCustomSelect(selectId, value) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const options = select.querySelectorAll('.custom-select-option');
    const trigger = select.querySelector('.custom-select-trigger span');
    
    options.forEach(option => {
      if (option.dataset.value === value) {
        option.classList.add('selected');
        if (trigger) trigger.textContent = option.querySelector('span').textContent;
      } else {
        option.classList.remove('selected');
      }
    });
  },

  // 初始化自定义下拉框
  initCustomSelect() {
    document.querySelectorAll('.custom-select').forEach(select => {
      const trigger = select.querySelector('.custom-select-trigger');
      const options = select.querySelectorAll('.custom-select-option');
      const hiddenInput = select.querySelector('input[type="hidden"]');
      
      // 点击触发器切换下拉
      trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        // 关闭其他下拉框
        document.querySelectorAll('.custom-select.open').forEach(s => {
          if (s !== select) s.classList.remove('open');
        });
        select.classList.toggle('open');
      });
      
      // 点击选项
      options.forEach(option => {
        option.addEventListener('click', async () => {
          const value = option.dataset.value;
          const text = option.querySelector('span').textContent;
          
          // 更新选中状态
          options.forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          
          // 更新触发器文本
          trigger.querySelector('span').textContent = text;
          
          // 更新隐藏input值并触发change事件
          if (hiddenInput) {
            hiddenInput.value = value;
            hiddenInput.dispatchEvent(new Event('change'));
          }
          
          // 关闭下拉
          select.classList.remove('open');
        });
      });
    });
    
    // 点击外部关闭下拉框
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-select.open').forEach(s => {
        s.classList.remove('open');
      });
    });
  },

  applyIconSettings() {
    const iconSizeEl = document.getElementById('icon-size');
    const iconGapEl = document.getElementById('icon-gap');
    const activeLayout = document.querySelector('.layout-option.active');
    
    const iconSize = iconSizeEl ? parseInt(iconSizeEl.value) : 60;
    const iconGap = iconGapEl ? parseInt(iconGapEl.value) : 30;
    
    // 获取列数
    let cols = 6;
    if (activeLayout) {
      if (activeLayout.dataset.rows === '0') {
        const customColsEl = document.getElementById('custom-cols');
        cols = customColsEl ? parseInt(customColsEl.value) || 6 : 6;
      } else {
        cols = parseInt(activeLayout.dataset.cols) || 6;
      }
    }

    // 应用到 CSS 变量
    document.documentElement.style.setProperty('--icon-size', iconSize + 'px');
    document.documentElement.style.setProperty('--icon-gap', iconGap + 'px');
    document.documentElement.style.setProperty('--icon-font-size', Math.round(iconSize * 0.43) + 'px');
    document.documentElement.style.setProperty('--icon-name-size', Math.max(10, Math.round(iconSize * 0.2)) + 'px');

    // 应用列数到网格
    const grid = document.getElementById('shortcuts-grid');
    if (grid) {
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      grid.style.gap = `${iconGap}px ${iconGap + 15}px`;
    }
  },

  async exportData() {
    const data = await Storage.getAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infinity-tab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importData(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 显示导入中提示
      const importBtn = document.getElementById('import-data');
      if (importBtn) {
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 导入中...';
        importBtn.disabled = true;
      }
      
      // 保存所有数据
      for (const [key, value] of Object.entries(data)) {
        await Storage.set(key, value);
      }
      
      // 无刷新重新加载各模块数据
      await this.reloadAllModules();
      
      // 恢复按钮并显示成功
      if (importBtn) {
        importBtn.innerHTML = '<i class="fas fa-check"></i> 导入成功';
        importBtn.disabled = false;
        setTimeout(() => {
          importBtn.innerHTML = '<i class="fas fa-upload"></i> 导入数据';
        }, 2000);
      }
    } catch (e) {
      console.error('导入失败:', e);
      alert('导入失败：文件格式错误');
      const importBtn = document.getElementById('import-data');
      if (importBtn) {
        importBtn.innerHTML = '<i class="fas fa-upload"></i> 导入数据';
        importBtn.disabled = false;
      }
    }
  },

  // 无刷新重新加载所有模块
  async reloadAllModules() {
    // 重新加载快捷方式
    if (typeof ShortcutsModule !== 'undefined') {
      ShortcutsModule.shortcuts = await Storage.get('shortcuts', ShortcutsModule.defaultShortcuts);
      ShortcutsModule.render();
    }
    
    // 重新加载待办事项
    if (typeof TodoModule !== 'undefined') {
      TodoModule.todos = await Storage.get('todos', []);
      TodoModule.render();
    }
    
    // 重新加载笔记
    if (typeof NotesModule !== 'undefined') {
      NotesModule.notes = await Storage.get('notes', []);
      NotesModule.render();
    }
    
    // 重新加载壁纸
    if (typeof WallpaperModule !== 'undefined') {
      await WallpaperModule.loadWallpaper();
    }
    
    // 重新加载设置
    await this.loadSettings();
  }
};
