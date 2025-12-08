// 天气模块
const WeatherModule = {
  init() {
    this.loadWeather();
  },

  async loadWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => this.fetchWeather(position.coords.latitude, position.coords.longitude),
        () => this.showDefaultWeather()
      );
    } else {
      this.showDefaultWeather();
    }
  },

  async fetchWeather(lat, lon) {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      
      if (!response.ok) throw new Error('Weather fetch failed');
      
      const data = await response.json();
      this.renderWeather(data);
    } catch (error) {
      this.showDefaultWeather();
    }
  },

  renderWeather(data) {
    const content = document.getElementById('weather-content');
    const current = data.current;
    const weatherInfo = this.getWeatherInfo(current.weather_code);
    
    content.innerHTML = `
      <div class="weather-info">
        <div class="weather-icon">${weatherInfo.icon}</div>
        <div class="weather-temp">${Math.round(current.temperature_2m)}°C</div>
        <div class="weather-desc">${weatherInfo.desc}</div>
        <div class="weather-details">
          <div class="weather-detail-item">
            <i class="fas fa-tint"></i>
            <span>${current.relative_humidity_2m}%</span>
            <span>湿度</span>
          </div>
          <div class="weather-detail-item">
            <i class="fas fa-wind"></i>
            <span>${current.wind_speed_10m} km/h</span>
            <span>风速</span>
          </div>
        </div>
      </div>
    `;
  },

  getWeatherInfo(code) {
    const weatherCodes = {
      0: { icon: '☀️', desc: '晴朗' },
      1: { icon: '🌤️', desc: '大部晴朗' },
      2: { icon: '⛅', desc: '多云' },
      3: { icon: '☁️', desc: '阴天' },
      45: { icon: '🌫️', desc: '有雾' },
      48: { icon: '🌫️', desc: '雾凇' },
      51: { icon: '🌧️', desc: '小雨' },
      53: { icon: '🌧️', desc: '中雨' },
      55: { icon: '🌧️', desc: '大雨' },
      61: { icon: '🌧️', desc: '小雨' },
      63: { icon: '🌧️', desc: '中雨' },
      65: { icon: '🌧️', desc: '大雨' },
      71: { icon: '🌨️', desc: '小雪' },
      73: { icon: '🌨️', desc: '中雪' },
      75: { icon: '🌨️', desc: '大雪' },
      80: { icon: '🌦️', desc: '阵雨' },
      95: { icon: '⛈️', desc: '雷暴' }
    };
    return weatherCodes[code] || { icon: '🌡️', desc: '未知' };
  },

  showDefaultWeather() {
    const content = document.getElementById('weather-content');
    content.innerHTML = `
      <div class="weather-info">
        <div class="weather-icon">🌡️</div>
        <div class="weather-desc">无法获取天气信息</div>
        <p style="margin-top: 15px; font-size: 12px; color: #999;">
          请允许位置访问以获取天气
        </p>
      </div>
    `;
  }
};
