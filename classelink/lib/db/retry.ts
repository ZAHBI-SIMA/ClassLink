// On retente les erreurs de connexion transitoires (connexion fermée, reset réseau…).
export function isTransientConnError(err: any): boolean {
  const msg = String(err?.message ?? '')
  return (
    err?.code === 'P2010' ||
    /closed the connection|ConnectionClosed|Connection terminated|ECONNRESET|terminating connection/i.test(msg)
  )
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: any
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isTransientConnError(err) || attempt === retries) throw err
      await new Promise(r => setTimeout(r, 150 * (attempt + 1)))
    }
  }
  throw lastErr
}
