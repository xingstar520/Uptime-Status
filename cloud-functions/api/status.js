/**
 * API 代理实现（腾讯云 EdgeOne Pages - Cloud Functions / Node.js 运行时）
 *
 * 路由：/cloud-functions/api/status.js -> /api/status
 * - 用于代理 UptimeRobot API 请求，避免跨域问题
 * - 处理 OPTIONS / POST 请求，包含本地缓存与 stale-while-revalidate 逻辑
 * - 日志输出可在 EdgeOne Pages 控制台 → 函数 → Cloud Functions 日志中查看
 *
 * 环境变量配置（在 EdgeOne Pages 控制台环境变量中设置）：
 * - UPTIMEROBOT_API_KEY 或 VITE_UPTIMEROBOT_API_KEY：UptimeRobot 只读 API Key
 *
 * 前端 .env 配置：
 * - VITE_UPTIMEROBOT_API_URL = "/api/status"
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

const getServerApiKey = (env = {}) => {
    if (env.UPTIMEROBOT_API_KEY || env.VITE_UPTIMEROBOT_API_KEY) {
        return env.UPTIMEROBOT_API_KEY || env.VITE_UPTIMEROBOT_API_KEY
    }
    // Node.js 运行时下兜底从 process.env 读取
    if (typeof process !== 'undefined' && process.env) {
        return process.env.UPTIMEROBOT_API_KEY || process.env.VITE_UPTIMEROBOT_API_KEY || ''
    }
    return ''
}

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

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders })
}

export async function onRequestPost(context) {
    let data
    let cacheKey

    try {
        const reqJson = await context.request.json()
        data = buildUpstreamPayload(reqJson, context.env)
        if (!data.api_key) {
            console.error('[status] Missing UptimeRobot API key', {
                hasEnv: !!context.env,
                envKeys: context.env ? Object.keys(context.env) : [],
                bodyHasApiKey: !!reqJson?.api_key
            })
            return jsonResponse({
                error: 'Missing UptimeRobot API key',
                hint: '请在 EdgeOne Pages 控制台 → 项目 → 设置 → 环境变量 中添加 UPTIMEROBOT_API_KEY 并重新部署'
            }, 500, 'BYPASS')
        }

        cacheKey = getCacheKey(data)

        const freshCache = getCachedResponse(cacheKey)
        if (freshCache?.status === 'HIT') {
            return jsonResponse(freshCache.data, 200, 'HIT')
        }
    } catch (error) {
        console.error('[status] parse request failed:', error?.message || error)
        return jsonResponse({ error: '请求参数无效', message: error?.message }, 400, 'BYPASS')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

    try {
        console.log('[status] fetching upstream UptimeRobot API...')
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

        console.log('[status] upstream responded:', response.status, result?.stat)
        return jsonResponse(result, invalidJson ? 502 : response.status, 'MISS')

    } catch (error) {
        console.error('[status] upstream fetch failed:', error?.name, error?.message)
        const staleCache = getCachedResponse(cacheKey)
        if (staleCache?.status === 'STALE') {
            return jsonResponse(staleCache.data, 200, 'STALE')
        }

        return jsonResponse({
            error: '请求失败',
            type: error?.name || 'UpstreamError',
            message: error?.message
        }, 500, 'BYPASS')
    } finally {
        clearTimeout(timeoutId)
    }
}

// 兜底：处理其它非 POST/OPTIONS 方法
export async function onRequest(context) {
    const method = context.request.method
    if (method === 'OPTIONS') return onRequestOptions()
    if (method === 'POST') return onRequestPost(context)
    return jsonResponse({ error: '只支持 POST 请求' }, 405, 'BYPASS')
}
