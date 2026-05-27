# API 目录说明（新版腾讯云 EdgeOne Pages - Node.js 函数）

本目录 (`cloud-functions/api/`) 是 **新版腾讯云 EdgeOne Pages** 的 Node.js 函数实现，运行在 EdgeOne Pages 的 Node.js 运行时下。

> 与 `edge-functions/`（边缘函数）二选一即可。本目录适合需要使用 npm 生态、Node.js 内置模块（`node:os`、`node:crypto` 等）的场景。

## 文件说明

### status.js

基于 Function Handlers 模式的 Node.js 函数，主要用于：

- 转发请求到 UptimeRobot API
- 处理 CORS（跨域）请求
- 内置内存缓存（60s 强缓存 + 5min stale-while-revalidate）
- 错误重试与降级响应

导出以下 Handlers：

- `onRequestOptions`：处理预检请求
- `onRequestPost`：处理实际的代理请求
- `onRequest`：兜底，处理其它 HTTP 方法

## 路由规则

EdgeOne Pages 会根据 `cloud-functions/` 目录结构自动生成路由：

| 文件路径                              | 路由             |
| ------------------------------------- | ---------------- |
| `/cloud-functions/api/status.js`      | `/api/status`    |

> 路由大小写敏感；如与静态资源路由冲突，将优先匹配静态资源。
> 仅导出了 Function Handlers（如 `onRequest`、`onRequestGet` 等）或框架实例（如 Express `app`）的文件才会注册为路由。

## 环境变量配置

在 EdgeOne Pages 控制台或项目根目录的 `.env` 文件中配置：

```bash
# UptimeRobot API Key
# 优先级：context.env.UPTIMEROBOT_API_KEY > context.env.VITE_UPTIMEROBOT_API_KEY > process.env.*
UPTIMEROBOT_API_KEY = "your-uptimerobot-api-key"

# 前端访问的代理地址
VITE_UPTIMEROBOT_API_URL = "/api/status"
```

## 部署说明

- 适配 **新版腾讯云 EdgeOne Pages** 的 Node.js 函数运行时（`cloud-functions` 目录）
- 边缘函数运行时请使用 `edge-functions/api/` 目录
- 旧版 EdgeOne Pages / Cloudflare Pages 请使用 `functions/api/` 目录
- Vercel 部署请使用项目根目录下的 `api/` 目录

## 兼容性

| 部署平台                                  | 函数目录              | 运行时        |
| ----------------------------------------- | --------------------- | ------------- |
| 新版腾讯云 EdgeOne Pages（边缘函数）      | `edge-functions/`     | V8 (Web API)  |
| 新版腾讯云 EdgeOne Pages（Node.js 函数）  | `cloud-functions/`    | Node.js       |
| 旧版 EdgeOne Pages / Cloudflare Pages     | `functions/`          | V8 (Web API)  |
| Vercel                                    | `api/`                | Node.js       |
