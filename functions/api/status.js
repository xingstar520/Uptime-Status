/**
 * API 代理实现
 * 这是一个边缘函数，运行在边缘节点上
 * 用于代理 UptimeRobot API 请求，避免跨域问题
 * 
 * 支持以下部署平台：
 * - 腾讯云 EdgeOne Pages
 * - Cloudflare Pages
 * 
 * 环境变量配置说明：
 * 在 .env 文件中设置 VITE_UPTIMEROBOT_API_URL:
 * - 使用默认配置：设置为 "/api/status"
 * - 其他部署方式：设置为你的完整代理地址
 */

const CACHE_TTL_MS = 60 * 1000
const STALE_TTL_MS = 5 * 60 * 1000
const UPSTREAM_TIMEOUT_MS = 25000
const cache = new Map()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'X-Proxy-Cache'
}

const jsonResponse = (data, status = 200, cacheStatus = 'MISS') => {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    'X-Proxy-Cache': cacheStatus
  }

  return new Response(JSON.stringify(data), { status, headers })
}

const getCacheKey = (body) => JSON.stringify(body)

const getCachedResponse = (cacheKey) => {
  const cached = cache.get(cacheKey)
  if (!cached) return null

  const now = Date.now()
  if (cached.expiresAt > now) {
    return { data: cached.data, status: 'HIT' }
  }
  if (cached.staleAt > now) {
    return { data: cached.data, status: 'STALE' }
  }
  cache.delete(cacheKey)
  return null
}

const saveCache = (cacheKey, data) => {
  const now = Date.now()
  cache.set(cacheKey, {
    data,
    expiresAt: now + CACHE_TTL_MS,
    staleAt: now + CACHE_TTL_MS + STALE_TTL_MS
  })
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (context.request.method !== 'POST') {
    return jsonResponse({ error: '只支持 POST 请求' }, 405, 'BYPASS')
  }

  let data
  let cacheKey

  try {
    data = await context.request.json()
    cacheKey = getCacheKey(data)

    const freshCache = getCachedResponse(cacheKey)
    if (freshCache?.status === 'HIT') {
      return jsonResponse(freshCache.data, 200, 'HIT')
    }
  } catch (error) {
    return jsonResponse({ error: '请求参数无效' }, 400, 'BYPASS')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    })

    const result = await response.json()

    if (response.ok && result?.stat === 'ok') {
      saveCache(cacheKey, result)
    }

    return jsonResponse(result, response.status, 'MISS')

  } catch (error) {
    const staleCache = getCachedResponse(cacheKey)
    if (staleCache?.status === 'STALE') {
      return jsonResponse(staleCache.data, 200, 'STALE')
    }

    return jsonResponse({ error: '请求失败' }, 500, 'BYPASS')
  } finally {
    clearTimeout(timeoutId)
  }
} 
