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

const parseBody = (body) => {
  if (!body) return {}
  return typeof body === 'string' ? JSON.parse(body) : body
}

const setCommonHeaders = (res, cacheStatus = 'MISS') => {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  res.setHeader('X-Proxy-Cache', cacheStatus)
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

export default async function handler(req, res) {
  setCommonHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' })
  }

  let body
  let cacheKey

  try {
    body = parseBody(req.body)
    cacheKey = getCacheKey(body)

    const freshCache = getCachedResponse(cacheKey)
    if (freshCache?.status === 'HIT') {
      setCommonHeaders(res, 'HIT')
      return res.status(200).json(freshCache.data)
    }
  } catch (error) {
    setCommonHeaders(res, 'BYPASS')
    return res.status(400).json({ error: '请求参数无效' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    const data = await response.json()

    if (response.ok && data?.stat === 'ok') {
      saveCache(cacheKey, data)
    }

    setCommonHeaders(res, 'MISS')
    return res.status(response.status).json(data)

  } catch (error) {
    const staleCache = getCachedResponse(cacheKey)
    if (staleCache?.status === 'STALE') {
      setCommonHeaders(res, 'STALE')
      return res.status(200).json(staleCache.data)
    }

    setCommonHeaders(res, 'BYPASS')
    return res.status(500).json({ error: '请求失败' })
  } finally {
    clearTimeout(timeoutId)
  }
}
