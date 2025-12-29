// API 模块
const API = {
  BASE_URL: '',

  // 初始化 - 从存储加载自定义 BASE_URL
  async init() {
    const customBaseUrl = await Storage.get('apiBaseUrl', '');
    this.BASE_URL = customBaseUrl || '';
  },

  // 设置自定义 BASE_URL
  async setBaseUrl(url) {
    if (url && url.trim()) {
      this.BASE_URL = url.trim().replace(/\/+$/, ''); // 移除末尾斜杠
      await Storage.set('apiBaseUrl', this.BASE_URL);
    } else {
      this.BASE_URL = '';
      await Storage.remove('apiBaseUrl');
    }
  },

  // 获取当前 BASE_URL
  getBaseUrl() {
    return this.BASE_URL;
  },

  // 检查是否已配置 BASE_URL
  isConfigured() {
    return !!this.BASE_URL;
  },

  // 发送验证码
  async sendVerifyCode(email) {
    try {
      const response = await fetch(`${this.BASE_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      // 适配返回格式 { code: 200, msg: "success", data: ... }
      if (result.code === 200) {
        return { success: true, message: result.msg || '验证码已发送' };
      }
      return { success: false, message: result.msg || '发送失败' };
    } catch (error) {
      console.error('发送验证码失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 注册
  async register(nickname, email, password, code) {
    try {
      const response = await fetch(`${this.BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, email, password, code })
      });
      const result = await response.json();
      // 适配返回格式 { code: 200, msg: "success", data: { user info } }
      if (result.code === 200) {
        return { success: true, message: result.msg || '注册成功', data: result.data };
      }
      return { success: false, message: result.msg || '注册失败' };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 登录
  async login(email, password) {
    try {
      const response = await fetch(`${this.BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      // 适配返回格式 { code: 200, msg: "success", data: { token, user } }
      if (result.code === 200 && result.data) {
        return { 
          success: true, 
          message: result.msg || '登录成功', 
          token: result.data.token,
          user: result.data.user
        };
      }
      return { success: false, message: result.msg || '登录失败' };
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 同步数据到服务器
  async syncToServer(token, data) {
    try {
      const response = await fetch(`${this.BASE_URL}/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.code === 401) {
        return { success: false, message: result.msg || 'Token无效', unauthorized: true };
      }
      if (result.code === 200) {
        return { success: true, message: result.msg || '同步成功' };
      }
      return { success: false, message: result.msg || '同步失败' };
    } catch (error) {
      console.error('同步失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 从服务器获取数据
  async syncFromServer(token) {
    try {
      const response = await fetch(`${this.BASE_URL}/sync`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.code === 401) {
        return { success: false, message: result.msg || 'Token无效', unauthorized: true };
      }
      if (result.code === 200 && result.data) {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.msg || '获取数据失败' };
    } catch (error) {
      console.error('获取数据失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 获取历史备份列表
  async getSyncHistory(token, page = 1, pageSize = 10) {
    try {
      const response = await fetch(`${this.BASE_URL}/sync/history?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.code === 401) {
        return { success: false, message: result.msg || 'Token无效', unauthorized: true };
      }
      if (result.code === 200 && result.data) {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.msg || '获取历史失败' };
    } catch (error) {
      console.error('获取历史失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 从历史节点恢复数据
  async restoreFromHistory(token, id) {
    try {
      const response = await fetch(`${this.BASE_URL}/sync/restore/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.code === 401) {
        return { success: false, message: result.msg || 'Token无效', unauthorized: true };
      }
      if (result.code === 200) {
        return { success: true, message: result.msg || '恢复成功', data: result.data };
      }
      return { success: false, message: result.msg || '恢复失败' };
    } catch (error) {
      console.error('恢复失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 发送重置密码验证码
  async sendResetCode(email) {
    try {
      const response = await fetch(`${this.BASE_URL}/send-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (result.code === 200) {
        return { success: true, message: result.msg || '验证码已发送' };
      }
      return { success: false, message: result.msg || '发送失败' };
    } catch (error) {
      console.error('发送重置验证码失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 重置密码
  async resetPassword(email, code, newPassword, confirmPassword) {
    try {
      const response = await fetch(`${this.BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password: newPassword, confirm_password: confirmPassword })
      });
      const result = await response.json();
      if (result.code === 200) {
        return { success: true, message: result.msg || '密码重置成功' };
      }
      return { success: false, message: result.msg || '重置失败' };
    } catch (error) {
      console.error('重置密码失败:', error);
      return { success: false, message: '网络错误' };
    }
  }
};
