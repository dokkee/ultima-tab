// 壁纸模块
const WallpaperModule = {
  bingApi: 'https://api.xsot.cn/bing?jump=true',

  async init() {
    await this.loadWallpaper();
    this.bindEvents();
  },

  bindEvents() {
    const refreshBtn = document.getElementById('refresh-wallpaper');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshWallpaper());
    }
  },

  async refreshWallpaper() {
    const btn = document.getElementById('refresh-wallpaper');
    btn.classList.add('spinning');

    const imageUrl = this.getBingWallpaper();
    const background = document.getElementById('background');

    const img = new Image();
    img.onload = () => {
      background.style.backgroundImage = `url(${imageUrl})`;
      btn.classList.remove('spinning');
    };
    img.onerror = () => {
      btn.classList.remove('spinning');
      this.setGradientBackground();
    };
    img.src = imageUrl;
  },

  async loadWallpaper() {
    const source = await Storage.get('wallpaperSource', 'bing');
    const customUrl = await Storage.get('customWallpaper', '');
    const background = document.getElementById('background');

    try {
      let imageUrl = '';

      switch (source) {
        case 'bing':
          imageUrl = this.getBingWallpaper();
          break;
        case 'custom':
          imageUrl = customUrl || this.getBingWallpaper();
          break;
        default:
          imageUrl = this.getBingWallpaper();
      }

      const img = new Image();
      img.onload = () => {
        background.style.backgroundImage = `url(${imageUrl})`;
        background.style.opacity = '1';
      };
      img.onerror = () => {
        this.setGradientBackground();
      };
      img.src = imageUrl;

    } catch (error) {
      this.setGradientBackground();
    }
  },

  getBingWallpaper() {
    return this.bingApi + '&t=' + Date.now();
  },

  setGradientBackground() {
    const background = document.getElementById('background');
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];

    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    background.style.background = randomGradient;
    background.style.opacity = '1';
  },

  async setSource(source, customUrl = '') {
    await Storage.set('wallpaperSource', source);
    if (customUrl) {
      await Storage.set('customWallpaper', customUrl);
    }
    await this.loadWallpaper();
  }
};
