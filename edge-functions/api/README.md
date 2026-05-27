# API 目录说明（新版腾讯云 EdgeOne Pages - Edge Functions）

本目录 (`edge-functions/api/`) 是 **新版腾讯云 EdgeOne Pages** 的 Edge Functions 实现，运行在 EdgeOne 全球 3200+ 边缘节点上。

## 文件说明

### status.js

基于 Web 标准 Fetch API 的边缘函数，主要用于：

- 转发请求到 UptimeRobot API
- 处理 CORS（跨域）请求
- 内置内存缓存（60s 强缓存 + 5min stale-while-revalidate）
- 错误重试与降级响应

## 路由规则

EdgeOne Pages 会根据 `edge-functions/` 目录结构自动生成路由：

| 文件路径                            | 路由             |
| ----------------------------------- | ---------------- |
| `/edge-functions/api/status.js`     | `/api/status`    |

> 路由大小写敏感；如与静态资源路由冲突，将优先匹配静态资源。

## 请求处理

1. `OPTIONS` 请求：返回 CORS 头部
2. `POST` 请求：转发到 UptimeRobot API
3. 错误处理：返回统一的错误响应

## 环境变量配置

在 EdgeOne Pages 控制台或项目根目录的 `.env` 文件中配置：

```bash
# UptimeRobot API Key（边缘函数侧读取，优先级：UPTIMEROBOT_API_KEY > VITE_UPTIMEROBOT_API_KEY）
UPTIMEROBOT_API_KEY = "your-uptimerobot-api-key"

# 前端访问的代理地址
VITE_UPTIMEROBOT_API_URL = "/api/status"
```

## 部署说明

- 适配 **新版腾讯云 EdgeOne Pages**（`edge-functions` 目录）
- 旧版 EdgeOne Pages / Cloudflare Pages 请使用 `functions/api/` 目录
- Vercel 部署请使用项目根目录下的 `api/` 目录

## 兼容性

| 部署平台                                  | 函数目录              | 运行时        |
| ----------------------------------------- | --------------------- | ------------- |
| 新版腾讯云 EdgeOne Pages（边缘函数）      | `edge-functions/`     | V8 (Web API)  |
| 新版腾讯云 EdgeOne Pages（Node.js 函数）  | `cloud-functions/`    | Node.js       |
| 旧版 EdgeOne Pages / Cloudflare Pages     | `functions/`          | V8 (Web API)  |
| Vercel                                    | `api/`                | Node.js       |
