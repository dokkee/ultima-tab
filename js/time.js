// 时间模块
const TimeModule = {
  timeElement: null,
  dateElement: null,
  showSeconds: false,
  use24Hour: true,

  init() {
    this.timeElement = document.getElementById('time');
    this.dateElement = document.getElementById('date');
    
    // 如果页面没有时间元素，跳过初始化
    if (!this.timeElement && !this.dateElement) {
      return;
    }
    
    this.loadSettings();
    this.update();
    setInterval(() => this.update(), 1000);
  },

  async loadSettings() {
    this.showSeconds = await Storage.get('showSeconds', false);
    this.use24Hour = await Storage.get('use24Hour', true);
  },

  update() {
    if (!this.timeElement && !this.dateElement) return;
    
    const now = new Date();
    
    // 时间
    if (this.timeElement) {
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      let timeStr = '';
      if (this.use24Hour) {
        timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
      } else {
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        timeStr = `${hours}:${minutes} ${period}`;
      }
      
      if (this.showSeconds) {
        timeStr = this.use24Hour 
          ? `${String(now.getHours()).padStart(2, '0')}:${minutes}:${seconds}`
          : `${hours}:${minutes}:${seconds} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
      }
      
      this.timeElement.textContent = timeStr;
    }
    
    // 日期
    if (this.dateElement) {
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const weekday = weekdays[now.getDay()];
      
      this.dateElement.textContent = `${year}年${month}月${date}日 ${weekday}`;
    }
  },

  updateSettings(showSeconds, use24Hour) {
    this.showSeconds = showSeconds;
    this.use24Hour = use24Hour;
    this.update();
  }
};
