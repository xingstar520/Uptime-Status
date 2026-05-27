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
const UPTIMEROBOT_API_URL = 'https://api.uptimerobot.com/v2/getMonitors'
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

const getServerApiKey = (env = {}) => env.UPTIMEROBOT_API_KEY || env.VITE_UPTIMEROBOT_API_KEY || ''

const buildUpstreamPayload = (body, env = {}) => {
  const apiKey = getServerApiKey(env)
  return apiKey ? { ...body, api_key: apiKey } : body
}

const toFormBody = (payload) => {
  const form = new URLSearchParams()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    form.set(key, String(value))
  })

  return form
}

const parseUpstreamJson = async (response) => {
  const text = await response.text()

  try {
    return { data: text ? JSON.parse(text) : {} }
  } catch (error) {
    return {
      data: {
        stat: 'fail',
        error: {
          type: 'upstream_invalid_json',
          message: 'UptimeRobot returned a non-JSON response',
          status: response.status
        }
      },
      invalidJson: true
    }
  }
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
    data = buildUpstreamPayload(await context.request.json(), context.env)
    if (!data.api_key) {
      return jsonResponse({ error: 'Missing UptimeRobot API key' }, 500, 'BYPASS')
    }

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
    const response = await fetch(UPTIMEROBOT_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: toFormBody(data),
      signal: controller.signal
    })

    const { data: result, invalidJson } = await parseUpstreamJson(response)

    if (response.ok && result?.stat === 'ok') {
      saveCache(cacheKey, result)
    }

    return jsonResponse(result, invalidJson ? 502 : response.status, 'MISS')

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
