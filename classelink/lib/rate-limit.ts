/**
 * Sliding-window rate limiter.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + TOKEN are configured.
 * Falls back to an in-process Map (single-instance environments only).
 *
 * Usage:
 *   const allowed = await rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
 *   if (!allowed) return { success: false, error: 'Trop de tentatives. Réessayez dans 15 min.' }
 */

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()
let lastClean = Date.now()

function clean() {
  const now = Date.now()
  if (now - lastClean < 5 * 60 * 1000) return
  lastClean = now
  for (const [k, e] of store) {
    if (now > e.resetAt) store.delete(k)
  }
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param key      Unique identifier (e.g. `login:${ip}`, `xp:${userId}`)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  // Try Upstash if configured
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    try {
      const { Redis }      = await import('@upstash/redis')
      const { Ratelimit }  = await import('@upstash/ratelimit')
      const redis = new Redis({ url, token })
      const rl = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        prefix:  'classelink:rl',
      })
      const { success } = await rl.limit(key)
      return success
    } catch {
      // Upstash unavailable — fall through to in-process
    }
  }

  // In-process fallback
  clean()
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

/** Returns remaining allowed requests for the current window (0 = blocked). */
export function remainingAttempts(key: string, limit: number): number {
  const entry = store.get(key)
  if (!entry || Date.now() > entry.resetAt) return limit
  return Math.max(0, limit - entry.count)
}
