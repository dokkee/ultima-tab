// 存储管理模块
const Storage = {
  // 获取数据
  get(key, defaultValue = null) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] !== undefined ? result[key] : defaultValue);
      });
    });
  },

  // 设置数据
  set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  // 删除数据
  remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], resolve);
    });
  },

  // 获取所有数据
  getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });
  }
};
