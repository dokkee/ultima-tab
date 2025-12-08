// 主入口
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化 API 模块（加载自定义 BASE_URL）
  await API.init();
  
  // 初始化各模块
  TimeModule.init();
  SearchModule.init();
  await ShortcutsModule.init();
  WeatherModule.init();
  await TodoModule.init();
  await NotesModule.init();
  await BookmarksModule.init();
  await HistoryModule.init();
  await WallpaperModule.init();
  IconsModule.init();
  SettingsModule.init();
  
  // 初始化用户认证模块
  await AuthModule.init();

  // 侧边栏控制
  initSidebar();

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      document.querySelectorAll('.panel').forEach(p => {
        p.classList.add('hidden');
        p.classList.remove('show');
      });
      document.getElementById('shortcut-modal').classList.add('hidden');
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    }
  });


});

// 侧边栏初始化
function initSidebar() {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const closeBtn = document.getElementById('sidebar-close');

  menuBtn?.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('show');
  });

  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // 侧边栏标签页切换
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.sidebar-content').forEach(c => c.classList.add('hidden'));
      document.getElementById('tab-' + tabId)?.classList.remove('hidden');
    });
  });

  // 侧边栏导航项点击
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const panelId = item.dataset.panel + '-panel';
      closeSidebar();
      openPanel(panelId);
    });
  });

  // 面板关闭按钮
  document.querySelectorAll('.panel .close-panel').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.panel').classList.add('hidden');
      btn.closest('.panel').classList.remove('show');
    });
  });

  // 点击面板外部关闭面板
  document.addEventListener('click', (e) => {
    const openPanel = document.querySelector('.panel.show');
    if (!openPanel) return;
    
    // 如果点击的不是面板内部，也不是打开面板的按钮，则关闭
    if (!openPanel.contains(e.target) && !e.target.closest('.shortcut-item')) {
      openPanel.classList.add('hidden');
      openPanel.classList.remove('show');
    }
  });
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
}

function openPanel(panelId) {
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('show');
  });
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.remove('hidden');
    panel.classList.add('show');
  }
}
