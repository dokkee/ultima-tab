# Infinity New Tab 插件

一个类似 Infinity 的 Chrome 新标签页扩展。

## 功能特性

- 🕐 实时时间和日期显示
- 🔍 多搜索引擎支持（Google、百度、Bing）
- 🔗 自定义快捷方式
- 🌤️ 天气信息（基于位置）
- ✅ 待办事项管理
- 🖼️ 壁纸设置（Bing每日壁纸、Unsplash、自定义）
- ⚙️ 个性化设置

## 安装方法

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `infinity-tab` 文件夹

## 图标生成

项目包含 SVG 图标，需要生成 PNG 图标：

1. 使用在线工具如 https://svgtopng.com/ 将 `icons/icon.svg` 转换为：
   - icon16.png (16x16)
   - icon48.png (48x48)
   - icon128.png (128x128)

2. 或使用 ImageMagick：
   ```bash
   convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
   convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
   convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
   ```

## 快捷键

- `Ctrl/Cmd + K` - 聚焦搜索框
- `ESC` - 关闭面板/弹窗
- `Enter` - 执行搜索/添加待办

## 技术栈

- Manifest V3
- Vanilla JavaScript
- Chrome Storage API
- Open-Meteo Weather API（免费，无需 API Key）

## 许可证

MIT License
