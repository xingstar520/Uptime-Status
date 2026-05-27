import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

/**
 * 本地开发用的 /api/status 中间件
 * 复用 edge-functions/api/status.js 的 onRequest 实现，让本地 dev 行为与 EdgeOne Pages 边缘函数一致。
 * 部署到 EdgeOne 时不会走这里，平台会接管 edge-functions/ 目录的函数路由。
 */
const devApiPlugin = (env) => ({
  name: 'dev-api-status',
  configureServer(server) {
    server.middlewares.use('/api/status', async (req, res) => {
      try {
        const mod = await server.ssrLoadModule('/edge-functions/api/status.js')
        const onRequest = mod.onRequest || mod.default
        if (typeof onRequest !== 'function') {
          res.statusCode = 500
          res.end('onRequest handler not found in edge-functions/api/status.js')
          return
        }

        // Node IncomingMessage -> Web Request
        const url = `http://${req.headers.host || 'localhost'}${req.url || '/api/status'}`
        const headers = new Headers()
        for (const [k, v] of Object.entries(req.headers)) {
          if (Array.isArray(v)) headers.set(k, v.join(','))
          else if (typeof v === 'string') headers.set(k, v)
        }

        let body
        if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          body = Buffer.concat(chunks)
        }

        const request = new Request(url, {
          method: req.method,
          headers,
          body
        })

        const response = await onRequest({ request, env })

        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        const buf = Buffer.from(await response.arrayBuffer())
        res.end(buf)
      } catch (error) {
        console.error('[dev-api-status] error:', error)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: '本地 API 中间件执行失败', message: error?.message }))
      }
    })
  }
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), devApiPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 3100,
      open: true
    }
  }
})