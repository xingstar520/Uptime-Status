<p align="center">
  <img src="public/logo.svg" width="100" height="100" alt="Status Monitor Logo">
</p>

<h1 align="center">站点监测</h1>

<p align="center">优雅的站点状态监控面板</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js" alt="Vue">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/JLinmr/uptime-status" title="使用 Vercel 部署">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
  <a href="https://console.cloud.tencent.com/edgeone/pages?action=create" title="使用腾讯云 EdgeOne Pages 部署">
    <img src="https://img.shields.io/badge/-Deploy-00A4FF?style=for-the-badge&labelColor=00A4FF&color=00A4FF&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNNi41IDIwcS0yLjI3NSAwLTMuODg3LTEuNTc1VDEgMTQuNTc1cTAtMS45NSAxLjE3NS0zLjQ3NVQ1LjI1IDkuMTVxLjYyNS0yLjMgMi41LTMuNzI1VDEyIDRxMi45MjUgMCA0Ljk2MyAyLjAzOFQxOSAxMXExLjcyNS4yIDIuODYzIDEuNDg4VDIzIDE1LjVxMCAxLjg3NS0xLjMxMiAzLjE4OFQxOC41IDIweiIvPjwvc3ZnPg==&borderRadius=6" alt="部署到腾讯云 EdgeOne" height="32" />
  </a>
  <a href="https://dash.cloudflare.com/" title="使用 Cloudflare Pages 部署">
    <img src="https://img.shields.io/badge/-Deploy-F38020?style=for-the-badge&labelColor=F38020&color=F38020&logo=cloudflare&logoColor=white&borderRadius=6" alt="部署到 Cloudflare Pages" height="32" />
  </a>
</p>

<p align="center">🎮 在线演示：
  <a href="https://status.tjqaq.com" target="_blank">
    https://status.tjqaq.com
  </a>
</p>

## 📖 简介

站点监测是一个基于 UptimeRobot API 开发的站点状态监控面板，支持多站点状态监控、实时通知、故障统计等功能。界面简洁美观，响应式设计，支持亮暗主题切换。

## ✨ 功能预览

![功能预览](https://i1.wp.com/dev.ruom.top/i/2025/01/25/629114.webp)

## ✨ 特性

- 📊 实时监控：支持多种监控方式
- 📱 响应式设计：适配移动端和桌面端
- 🌓 主题切换：支持亮色/暗色主题
- 📈 数据统计：可视化展示可用率和响应时间
- 🔔 故障记录：详细的宕机记录和原因分析
- 🔄 自动刷新：定时自动更新监控数据
- 💫 平滑动画：流畅的用户界面交互体验

## ⚙️ 部署配置

### 环境要求

- Node.js >= 16.16.0
- NPM >= 8.15.0 或 PNPM >= 8.0.0

### 获取 UptimeRobot API Key

1. 注册/登录 [UptimeRobot](https://uptimerobot.com/)
2. 进入 [Integrations & API](https://dashboard.uptimerobot.com/integrations)
3. 下拉到最底部在 Main API keys 部分创建 **Read-Only API Key**
4. 复制生成的 API Key

### API 代理说明

本项目支持以下部署方式,均可实现自动处理跨域请求:

1. **腾讯云 EdgeOne Pages**（新版 / 旧版均兼容）

   - 点击上方蓝色 "Deploy" 按钮
   - 连接到 GitHub，选择项目
   - 框架预设选择 Vue，点击开始部署
   - 使用默认配置 `VITE_UPTIMEROBOT_API_URL = "/api/status"`
   - 函数目录约定：
     - 新版 EdgeOne Pages（边缘函数运行时）：`edge-functions/api/status.js`
     - 新版 EdgeOne Pages（Node.js 函数运行时）：`cloud-functions/api/status.js`
     - 旧版 EdgeOne Pages：`functions/api/status.js`
   - 平台会自动识别上述目录，无需额外配置；新版 EdgeOne Pages 边缘函数与 Node.js 函数二选一即可

2. **Vercel**

   - 点击上方黑色 "Deploy" 按钮
   - 连接到 GitHub，选择项目
   - 填写项目名称，点击 Create
   - 使用默认配置 `VITE_UPTIMEROBOT_API_URL = "/api/status"`
   - 函数目录：`api/status.js`

3. **Cloudflare Pages**

   - 点击上方橙色 "Deploy" 按钮
   - 找到计算(worker) 部分
   - 点击创建，选择 Pages，连接到 GitHub，选择项目，点击开始创建
   - 框架预设选择 Vue，点击保持并部署
   - 使用默认配置 `VITE_UPTIMEROBOT_API_URL = "/api/status"`
   - 函数目录：`functions/api/status.js`

4. **其他平台**
   - 自行搭建 API 代理
   - 在 `.env` 文件中设置 `VITE_UPTIMEROBOT_API_URL` 为你的 API 代理地址

### 快速开始

1. 克隆项目

```bash
git clone https://github.com/Xingstar520/uptime-status.git
cd uptime-status
```

2. 安装依赖

```bash
pnpm install
# 或
npm install
```

3. 配置环境变量

在 `.env` 文件中修改以下配置：

```bash
# UptimeRobot API Key
VITE_UPTIMEROBOT_API_KEY = "ur2290572-af4663a4e3f83be26119abbe"

# UptimeRobot API URL
# 除腾讯云 EdgeOne Pages 、vercel 、cloudflare pages 外
## 其它部署方式需要自行搭建 API 代理
## 代理地址 https://api.uptimerobot.com/v2/getMonitors
VITE_UPTIMEROBOT_API_URL = "/api/status"

# 站点名称
VITE_APP_TITLE = "琦月图床"
```

4. 开发调试

```bash
pnpm dev
# 或
npm run dev

# 开发环境需要将 VITE_UPTIMEROBOT_API_URL 设置为 "https://api.uptimerobot.com/v2/getMonitors"
```

5. 构建部署

```bash
pnpm build
# 或
npm run build
```

构建的文件在 `dist` 目录下，将 `dist` 目录部署到服务器即可。

## 📝 开源协议

本项目基于 [MIT License](LICENSE) 开源，使用时请遵守开源协议。

## 🙏 致谢

- [UptimeRobot](https://uptimerobot.com/) - 提供监控 API 支持
- [Vue.js](https://vuejs.org/) - 前端框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Chart.js](https://www.chartjs.org/) - 图表库
