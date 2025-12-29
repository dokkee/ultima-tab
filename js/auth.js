// 用户认证模块
const AuthModule = {
  user: null,
  token: null,
  syncInterval: null,
  // 历史备份分页
  backupPage: 1,
  backupPageSize: 10,
  backupHasMore: true,
  backupLoading: false,

  async init() {
    await this.loadSession();
    this.bindEvents();
    this.updateUI();
    if (this.user) this.startAutoSync();
  },

  async loadSession() {
    this.token = await Storage.get('authToken', null);
    this.user = await Storage.get('currentUser', null);
  },

  async saveSession() {
    await Storage.set('authToken', this.token);
    await Storage.set('currentUser', this.user);
  },

  bindEvents() {
    // 显示登录/注册表单
    document.getElementById('show-login')?.addEventListener('click', () => this.showForm('login'));
    document.getElementById('show-register')?.addEventListener('click', () => this.showForm('register'));
    document.getElementById('to-register')?.addEventListener('click', (e) => { e.preventDefault(); this.showForm('register'); });
    document.getElementById('to-login')?.addEventListener('click', (e) => { e.preventDefault(); this.showForm('login'); });

    // 登录表单
    document.getElementById('login-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });

    // 注册表单
    document.getElementById('register-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleRegister(); });

    // 发送验证码
    document.getElementById('send-code')?.addEventListener('click', () => this.sendCode());

    // 忘记密码相关
    document.getElementById('to-forgot')?.addEventListener('click', (e) => { e.preventDefault(); this.showForm('forgot'); });
    document.getElementById('forgot-to-login')?.addEventListener('click', (e) => { e.preventDefault(); this.showForm('login'); });
    document.getElementById('send-reset-code')?.addEventListener('click', () => this.sendResetCode());
    document.getElementById('forgot-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleResetPassword(); });
    document.getElementById('reset-new-password')?.addEventListener('input', (e) => this.checkResetPasswordStrength(e.target.value));

    // 密码强度
    document.getElementById('register-password')?.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));

    // 手动同步按钮
    document.getElementById('sync-btn')?.addEventListener('click', () => this.manualSync());

    // 退出登录
    document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());

    // 历史备份按钮
    document.getElementById('backup-history-btn')?.addEventListener('click', () => this.showBackupHistory());
    document.getElementById('close-backup-modal')?.addEventListener('click', () => this.closeBackupHistory());
    document.getElementById('backup-history-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'backup-history-modal') this.closeBackupHistory();
    });
  },

  showForm(type) {
    document.getElementById('guest-section').style.display = 'none';
    document.getElementById('login-form-section').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('register-form-section').style.display = type === 'register' ? 'block' : 'none';
    document.getElementById('forgot-form-section').style.display = type === 'forgot' ? 'block' : 'none';
  },

  hideAllForms() {
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('register-form-section').style.display = 'none';
    document.getElementById('forgot-form-section').style.display = 'none';
  },

  updateUI() {
    const guestSection = document.getElementById('guest-section');
    const loggedSection = document.getElementById('logged-section');

    if (this.user) {
      guestSection.style.display = 'none';
      loggedSection.style.display = 'block';
      this.hideAllForms();
      document.getElementById('sidebar-avatar').src = this.user.avatar;
      // 显示昵称或邮箱
      document.getElementById('user-email').textContent = this.user.nickname || this.user.email;
    } else {
      guestSection.style.display = 'block';
      loggedSection.style.display = 'none';
    }
  },

  async sendCode() {
    const email = document.getElementById('register-email').value.trim();
    const btn = document.getElementById('send-code');
    const errorEl = document.getElementById('register-error');

    if (!API.isConfigured()) {
      errorEl.textContent = '请先在设置中配置服务器地址';
      return;
    }

    if (!email || !this.validateEmail(email)) {
      errorEl.textContent = '请输入有效的邮箱地址';
      return;
    }

    btn.disabled = true;
    btn.textContent = '发送中...';
    errorEl.textContent = '';

    try {
      const result = await API.sendVerifyCode(email);
      if (result.success) {
        this.startCountdown(btn);
      } else {
        errorEl.textContent = result.message;
        btn.disabled = false;
        btn.textContent = '发送验证码';
      }
    } catch {
      errorEl.textContent = '发送失败，请重试';
      btn.disabled = false;
      btn.textContent = '发送验证码';
    }
  },

  startCountdown(btn) {
    let seconds = 60;
    btn.textContent = `${seconds}s`;
    const timer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = '发送验证码';
      } else {
        btn.textContent = `${seconds}s`;
      }
    }, 1000);
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePassword(password) {
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  },

  checkPasswordStrength(password) {
    const el = document.getElementById('password-strength');
    if (!password) { el.innerHTML = ''; return; }
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    const levels = ['弱', '弱', '中', '强', '很强', '很强'];
    const colors = ['#e74c3c', '#e74c3c', '#f39c12', '#27ae60', '#27ae60', '#27ae60'];
    el.innerHTML = `<span style="color:${colors[strength]}">密码强度: ${levels[strength]}</span>`;
  },

  checkResetPasswordStrength(password) {
    const el = document.getElementById('reset-password-strength');
    if (!el) return;
    if (!password) { el.innerHTML = ''; return; }
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    const levels = ['弱', '弱', '中', '强', '很强', '很强'];
    const colors = ['#e74c3c', '#e74c3c', '#f39c12', '#27ae60', '#27ae60', '#27ae60'];
    el.innerHTML = `<span style="color:${colors[strength]}">密码强度: ${levels[strength]}</span>`;
  },

  async sendResetCode() {
    const email = document.getElementById('forgot-email').value.trim();
    const btn = document.getElementById('send-reset-code');
    const errorEl = document.getElementById('forgot-error');

    if (!API.isConfigured()) {
      errorEl.textContent = '请先在设置中配置服务器地址';
      return;
    }

    if (!email || !this.validateEmail(email)) {
      errorEl.textContent = '请输入有效的邮箱地址';
      return;
    }

    btn.disabled = true;
    btn.textContent = '发送中...';
    errorEl.textContent = '';

    try {
      const result = await API.sendResetCode(email);
      if (result.success) {
        this.startCountdown(btn);
      } else {
        errorEl.textContent = result.message;
        btn.disabled = false;
        btn.textContent = '发送验证码';
      }
    } catch {
      errorEl.textContent = '发送失败，请重试';
      btn.disabled = false;
      btn.textContent = '发送验证码';
    }
  },

  async handleResetPassword() {
    const email = document.getElementById('forgot-email').value.trim();
    const code = document.getElementById('forgot-code').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;
    const errorEl = document.getElementById('forgot-error');
    errorEl.textContent = '';

    if (!API.isConfigured()) {
      errorEl.textContent = '请先在设置中配置服务器地址';
      return;
    }
    if (!email || !code || !newPassword || !confirmPassword) {
      errorEl.textContent = '请填写完整信息';
      return;
    }
    if (!this.validateEmail(email)) {
      errorEl.textContent = '请输入有效的邮箱地址';
      return;
    }
    if (!this.validatePassword(newPassword)) {
      errorEl.textContent = '密码至少6位，需包含字母和数字';
      return;
    }
    if (newPassword !== confirmPassword) {
      errorEl.textContent = '两次密码输入不一致';
      return;
    }

    try {
      const result = await API.resetPassword(email, code, newPassword, confirmPassword);
      if (result.success) {
        alert('密码重置成功，请使用新密码登录');
        this.showForm('login');
        // 清空表单
        document.getElementById('forgot-email').value = '';
        document.getElementById('forgot-code').value = '';
        document.getElementById('reset-new-password').value = '';
        document.getElementById('reset-confirm-password').value = '';
      } else {
        errorEl.textContent = result.message;
      }
    } catch {
      errorEl.textContent = '重置失败，请重试';
    }
  },

  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    if (!API.isConfigured()) { errorEl.textContent = '请先在设置中配置服务器地址'; return; }
    if (!email || !password) { errorEl.textContent = '请填写完整信息'; return; }

    try {
      const result = await API.login(email, password);
      if (result.success) {
        // 保存用户信息和token
        this.user = {
          id: result.user.id,
          nickname: result.user.nickname,
          email: result.user.email,
          avatar: result.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.email}`
        };
        this.token = result.token;
        await this.saveSession();
        this.updateUI();
        this.startAutoSync();
        await this.syncFromCloud();
      } else {
        errorEl.textContent = result.message;
      }
    } catch {
      errorEl.textContent = '登录失败，请重试';
    }
  },

  async handleRegister() {
    const nickname = document.getElementById('register-nickname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const code = document.getElementById('register-code').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = '';

    if (!API.isConfigured()) { errorEl.textContent = '请先在设置中配置服务器地址'; return; }
    if (!nickname || !email || !code || !password || !confirm) { errorEl.textContent = '请填写完整信息'; return; }
    if (!this.validateEmail(email)) { errorEl.textContent = '请输入有效的邮箱地址'; return; }
    if (!this.validatePassword(password)) { errorEl.textContent = '密码至少6位，需包含字母和数字'; return; }
    if (password !== confirm) { errorEl.textContent = '两次密码输入不一致'; return; }

    try {
      const result = await API.register(nickname, email, password, code);
      if (result.success) {
        // 注册成功后自动登录
        const loginResult = await API.login(email, password);
        if (loginResult.success) {
          this.user = loginResult.user;
          this.token = loginResult.token;
          await this.saveSession();
          this.updateUI();
          this.startAutoSync();
        }
      } else {
        errorEl.textContent = result.message;
      }
    } catch {
      errorEl.textContent = '注册失败，请重试';
    }
  },

  async logout() {
    this.stopAutoSync();
    this.user = null;
    this.token = null;
    await Storage.remove('authToken');
    await Storage.remove('currentUser');
    this.updateUI();
  },

  // 每5分钟自动同步
  startAutoSync() {
    if (this.syncInterval) return;
    this.syncToCloud();
    this.syncInterval = setInterval(() => this.syncToCloud(), 5 * 60 * 1000); // 5分钟
  },

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  },

  // 手动同步
  async manualSync() {
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
      syncBtn.classList.add('syncing');
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 同步中...';
    }
    
    await this.syncToCloud();
    
    if (syncBtn) {
      syncBtn.classList.remove('syncing');
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 同步数据';
    }
  },

  async syncToCloud() {
    if (!this.token) return;
    const statusEl = document.getElementById('sync-status');
    if (statusEl) statusEl.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> 同步中...';

    try {
      // 获取并清理数据
      const shortcuts = this.cleanShortcuts(await Storage.get('shortcuts', []));
      // 同时更新本地存储，修复错误的URL
      await Storage.set('shortcuts', shortcuts);
      
      const data = {
        shortcuts: shortcuts,
        todos: await Storage.get('todos', []),
        notes: await Storage.get('notes', []),
        settings: {
          wallpaperSource: await Storage.get('wallpaperSource', 'bing'),
          searchEngine: await Storage.get('searchEngine', 'google')
        }
      };
      const result = await API.syncToServer(this.token, data);
      
      // 处理 401 未授权错误
      if (result.unauthorized) {
        await this.handleUnauthorized();
        return;
      }
      
      if (statusEl) {
        statusEl.innerHTML = result.success 
          ? '<i class="fas fa-check-circle"></i> 已同步' 
          : '<i class="fas fa-exclamation-circle"></i> 同步失败';
      }
    } catch {
      if (statusEl) statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> 同步失败';
    }
  },

  // 处理授权过期
  async handleUnauthorized() {
    alert('登录已过期，请重新登录');
    await this.logout();
    this.showForm('login');
  },

  // 清理快捷方式数据，修复错误的URL
  cleanShortcuts(shortcuts) {
    if (!Array.isArray(shortcuts)) return shortcuts;
    return shortcuts.map(shortcut => {
      if (!shortcut.url) return shortcut;
      // 修复被错误添加 https:// 的系统URL
      let url = shortcut.url;
      // 处理各种可能的错误格式
      if (url.includes('infinity://')) {
        // 提取 infinity:// 及其后面的内容
        const match = url.match(/infinity:\/\/\w+/);
        if (match) url = match[0];
      } else if (url.includes('chrome://')) {
        // 提取 chrome:// 及其后面的内容
        const match = url.match(/chrome:\/\/[\w-]+/);
        if (match) url = match[0];
      }
      // 修复拼写错误
      if (url === 'infinity://barkmarks') {
        url = 'infinity://bookmarks';
      }
      return { ...shortcut, url };
    });
  },

  async syncFromCloud() {
    if (!this.token) return;
    try {
      const result = await API.syncFromServer(this.token);
      
      // 处理 401 未授权错误
      if (result.unauthorized) {
        await this.handleUnauthorized();
        return;
      }
      
      if (result.success && result.data) {
        // 清理并保存数据
        if (result.data.shortcuts) {
          const cleanedShortcuts = this.cleanShortcuts(result.data.shortcuts);
          await Storage.set('shortcuts', cleanedShortcuts);
        }
        if (result.data.todos) await Storage.set('todos', result.data.todos);
        if (result.data.notes) await Storage.set('notes', result.data.notes);
        location.reload();
      }
    } catch (err) {
      console.error('从云端同步失败:', err);
    }
  },

  // 显示历史备份弹窗
  async showBackupHistory() {
    if (!this.token) {
      alert('请先登录');
      return;
    }

    const modal = document.getElementById('backup-history-modal');
    const listEl = document.getElementById('backup-history-list');
    
    // 重置分页状态
    this.backupPage = 1;
    this.backupHasMore = true;
    this.backupLoading = false;
    
    modal.classList.remove('hidden');
    listEl.innerHTML = '<div class="backup-loading"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';

    // 加载第一页
    await this.loadBackupHistory(true);
    
    // 绑定滚动事件
    listEl.onscroll = () => {
      if (this.backupLoading || !this.backupHasMore) return;
      if (listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 50) {
        this.loadBackupHistory(false);
      }
    };
  },

  // 加载历史备份数据
  async loadBackupHistory(reset = false) {
    if (this.backupLoading) return;
    this.backupLoading = true;

    const listEl = document.getElementById('backup-history-list');
    
    const result = await API.getSyncHistory(this.token, this.backupPage, this.backupPageSize);
    
    // 处理 401 未授权错误
    if (result.unauthorized) {
      this.closeBackupHistory();
      await this.handleUnauthorized();
      return;
    }
    
    // 适配分页返回格式: { data: { total, page, page_size, data: [...] } }
    const historyList = result.data?.data || [];
    const total = result.data?.total || 0;
    
    if (reset) {
      listEl.innerHTML = '';
    }

    if (result.success && historyList.length > 0) {
      historyList.forEach(item => {
        const date = new Date(item.created_at).toLocaleString('zh-CN');
        const div = document.createElement('div');
        div.className = 'backup-history-item';
        div.innerHTML = `
          <div class="backup-info">
            <span class="backup-date"><i class="fas fa-clock"></i> ${date}</span>
          </div>
          <button class="backup-restore-btn" data-id="${item.id}">恢复</button>
        `;
        div.querySelector('.backup-restore-btn').addEventListener('click', () => this.restoreBackup(item.id));
        listEl.appendChild(div);
      });
      
      this.backupPage++;
      this.backupHasMore = this.backupPage * this.backupPageSize < total;
    } else if (reset) {
      listEl.innerHTML = '<div class="backup-empty">暂无历史备份</div>';
      this.backupHasMore = false;
    }
    
    this.backupLoading = false;
  },

  // 关闭历史备份弹窗
  closeBackupHistory() {
    const listEl = document.getElementById('backup-history-list');
    if (listEl) listEl.onscroll = null;
    document.getElementById('backup-history-modal')?.classList.add('hidden');
  },

  // 从历史节点恢复
  async restoreBackup(id) {
    if (!confirm('确定要从该节点恢复数据吗？当前数据将被覆盖。')) return;

    const result = await API.restoreFromHistory(this.token, id);
    
    // 处理 401 未授权错误
    if (result.unauthorized) {
      this.closeBackupHistory();
      await this.handleUnauthorized();
      return;
    }
    
    if (result.success) {
      // 恢复成功后重新加载数据，清理错误的URL
      if (result.data) {
        if (result.data.shortcuts) {
          const cleanedShortcuts = this.cleanShortcuts(result.data.shortcuts);
          await Storage.set('shortcuts', cleanedShortcuts);
        }
        if (result.data.todos) await Storage.set('todos', result.data.todos);
        if (result.data.notes) await Storage.set('notes', result.data.notes);
      }
      this.closeBackupHistory();
      location.reload();
    } else {
      alert(result.message || '恢复失败');
    }
  }
};
